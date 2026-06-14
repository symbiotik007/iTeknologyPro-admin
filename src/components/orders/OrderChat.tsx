"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import {
  fetchMessages, sendMessage, markRead, subscribe, signedUrl, type ChatMessage,
} from "@/lib/orderChat";

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

// Foto con URL firmada (bucket privado)
function ChatImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let on = true;
    signedUrl(path).then(u => { if (on) setUrl(u); });
    return () => { on = false; };
  }, [path]);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url} alt="foto"
      onClick={() => window.open(url, "_blank", "noopener")}
      className="mt-1.5 max-w-[200px] w-full rounded-lg cursor-pointer"
    />
  );
}

export default function OrderChat({
  storeId, orderId, onRead,
}: { storeId: string; orderId: string; onRead?: (id: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText]     = useState("");
  const [file, setFile]     = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const scrollDown = useCallback(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    let on = true;
    setLoading(true);
    fetchMessages(orderId).then(msgs => {
      if (!on) return;
      setMessages(msgs);
      setLoading(false);
      setTimeout(scrollDown, 30);
      markRead(orderId).then(() => onRead?.(orderId));
    });
    const unsub = subscribe(orderId, (msg) => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      setTimeout(scrollDown, 30);
      if (msg.sender === "customer") markRead(orderId).then(() => onRead?.(orderId));
    });
    return () => { on = false; unsub(); };
  }, [orderId, scrollDown, onRead]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || (!text.trim() && !file)) return;
    setSending(true); setError(null);
    try {
      const msg = await sendMessage({ storeId, orderId, body: text, file });
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      setText(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(scrollDown, 30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar");
    }
    setSending(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div ref={threadRef} className="flex flex-col gap-2 p-3 max-h-80 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">
            Aún no hay mensajes. Escríbele al cliente sobre este pedido.
          </p>
        ) : messages.map(m => {
          const mine = m.sender === "store";
          return (
            <div key={m.id} className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug break-words ${
              mine
                ? "self-end bg-brand-500 text-white rounded-br-sm"
                : "self-start bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
            }`}>
              {!mine && <span className="block text-[10.5px] font-bold opacity-70 mb-0.5">{m.sender_name || "Cliente"}</span>}
              {m.body && <span>{m.body}</span>}
              {m.image_url && <ChatImage path={m.image_url} />}
              <span className={`block text-[10px] mt-1 text-right ${mine ? "text-white/70" : "text-gray-400"}`}>{fmtTime(m.created_at)}</span>
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-600 px-3 py-1">{error}</p>}

      {file && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-brand-50 border-t border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={URL.createObjectURL(file)} alt="adjunto" className="w-8 h-8 object-cover rounded" />
          <span className="truncate">{file.name}</span>
          <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
            className="ml-auto text-red-500"><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2 p-2.5 border-t border-gray-200 bg-white">
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => setFile(e.target.files?.[0] || null)} />
        <button type="button" title="Adjuntar foto" onClick={() => fileRef.current?.click()}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 flex-shrink-0">
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button type="submit" disabled={sending || (!text.trim() && !file)} title="Enviar"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-brand-500 text-white disabled:opacity-45 flex-shrink-0">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
