"use client";
// Chat por pedido del lado tienda. Usa el cliente de navegador (sesión del
// staff) → RLS deja ver/escribir solo en los pedidos de su tienda. Realtime.
import { createClient } from "@/lib/supabase/client";

export type ChatMessage = {
  id: string;
  store_id: string;
  order_id: string;
  sender: "customer" | "store";
  sender_user_id: string | null;
  sender_name: string | null;
  body: string | null;
  image_url: string | null;
  read_by_store: boolean;
  read_by_customer: boolean;
  created_at: string;
};

const BUCKET = "order-chat";
const MAX_BYTES = 5 * 1024 * 1024;

// Singleton del cliente de navegador (un solo socket de realtime)
let _client: ReturnType<typeof createClient> | null = null;
const sb = () => (_client ??= createClient());

export const fetchMessages = async (orderId: string): Promise<ChatMessage[]> => {
  const { data, error } = await sb()
    .from("order_messages").select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) { console.warn("[orderChat] fetch:", error.message); return []; }
  return (data ?? []) as ChatMessage[];
};

export const sendMessage = async (
  { storeId, orderId, body, file }: { storeId: string; orderId: string; body?: string; file?: File | null },
): Promise<ChatMessage> => {
  const client = sb();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Sesión expirada");

  let image_url: string | null = null;
  if (file) {
    if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes");
    if (file.size > MAX_BYTES) throw new Error("La imagen supera 5 MB");
    const ext  = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${storeId}/${orderId}/${Date.now()}.${ext}`;
    const { error: upErr } = await client.storage
      .from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw new Error(upErr.message);
    image_url = path;
  }

  const { data, error } = await client
    .from("order_messages")
    .insert({
      store_id:       storeId,
      order_id:       orderId,
      sender:         "store",
      sender_user_id: user.id,
      sender_name:    "Tienda",
      body:           (body || "").trim() || null,
      image_url,
    })
    .select().single();
  if (error) throw new Error(error.message);
  return data as ChatMessage;
};

export const markRead = async (orderId: string) => {
  await sb().rpc("mark_chat_read", { p_order_id: orderId, p_side: "store" });
};

export const subscribe = (orderId: string, onInsert: (m: ChatMessage) => void) => {
  const channel = sb()
    .channel(`order-chat-admin:${orderId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "order_messages", filter: `order_id=eq.${orderId}` },
      (payload) => onInsert(payload.new as ChatMessage),
    )
    .subscribe();
  return () => { sb().removeChannel(channel); };
};

export const signedUrl = async (path: string): Promise<string | null> => {
  if (!path) return null;
  const { data } = await sb().storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
};

// { orderId: nº mensajes del cliente sin leer } para badges del staff
export const fetchUnreadCounts = async (storeId: string): Promise<Record<string, number>> => {
  const { data, error } = await sb()
    .from("order_messages").select("order_id")
    .eq("store_id", storeId)
    .eq("sender", "customer")
    .eq("read_by_store", false);
  if (error || !data) return {};
  return data.reduce((acc: Record<string, number>, m: { order_id: string }) => {
    acc[m.order_id] = (acc[m.order_id] || 0) + 1; return acc;
  }, {});
};
