export type OrderStatus = "pendiente" | "en preparación" | "listo" | "entregado";
export type DeliveryType = "domicilio" | "recoger";
export type UserRole = "owner" | "admin" | "staff";

export interface OrderItem {
  id: number;
  title: string;
  qty: number;
  price: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  address?: string;
  notes?: string;
}

export interface OrderBranch {
  id: string;
  name: string;
  address: string;
  reference?: string;
}

export interface PaymentProof {
  url: string;            // path en el bucket payment-proofs
  reference?: string;
  uploaded_at?: string;
  verified?: boolean;     // true = verificado, false = falso, undefined = sin revisar
  checked_at?: string;
}

export interface Order {
  id: string;
  store_id: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  subtotal: number;
  delivery_fee: number;
  delivery: DeliveryType;
  payment: string;
  branch?: OrderBranch;
  customer: OrderCustomer;
  payment_proof?: PaymentProof | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  store_id: string;
  title: string;
  description: string;
  price: number;
  cat: string;
  img: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Category {
  id: number;
  store_id: string;
  title: string;
  cat: string;
  img: string;
  sort_order: number;
}

export interface Store {
  id: string;
  name: string;
  config: Record<string, unknown>;
  active: boolean;
  created_at: string;
}

export interface StoreUser {
  id: string;
  store_id: string;
  user_id: string;
  role: UserRole;
}
