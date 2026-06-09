-- ═══════════════════════════════════════════════
--  iTeknologyPro Admin — Supabase Schema
--  Ejecuta esto en Supabase → SQL Editor
-- ═══════════════════════════════════════════════

-- ── Stores (tenants) ─────────────────────────────────────────────
create table if not exists stores (
  id          text primary key,           -- "donparra", "iteknology"
  name        text not null,
  config      jsonb default '{}',         -- config completo del store
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Store users (staff del restaurante) ──────────────────────────
create table if not exists store_users (
  id          uuid primary key default gen_random_uuid(),
  store_id    text not null references stores(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'staff',  -- "owner" | "admin" | "staff"
  created_at  timestamptz default now(),
  unique (store_id, user_id)
);

-- ── Orders ───────────────────────────────────────────────────────
create table if not exists orders (
  id            text primary key,           -- "ORD-20260607-123"
  store_id      text not null references stores(id),
  status        text not null default 'pendiente',
  items         jsonb not null default '[]',
  total         numeric(12,2) not null,
  subtotal      numeric(12,2) not null default 0,
  delivery_fee  numeric(12,2) not null default 0,
  delivery      text not null default 'domicilio',
  payment       text not null default 'efectivo',
  branch        jsonb,
  customer      jsonb not null default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Products ─────────────────────────────────────────────────────
create table if not exists products (
  id          serial primary key,
  store_id    text not null references stores(id) on delete cascade,
  title       text not null,
  description text,
  price       numeric(12,2) not null,
  cat         text not null,
  img         text,
  active      boolean default true,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Categories ───────────────────────────────────────────────────
create table if not exists categories (
  id          serial primary key,
  store_id    text not null references stores(id) on delete cascade,
  title       text not null,
  cat         text not null,              -- slug: "parrilladas"
  img         text,
  sort_order  int default 0
);

-- ═══════════════════════════════════════════════
--  Índices
-- ═══════════════════════════════════════════════
create index if not exists idx_orders_store    on orders(store_id);
create index if not exists idx_orders_status   on orders(status);
create index if not exists idx_orders_created  on orders(created_at desc);
create index if not exists idx_products_store  on products(store_id);
create index if not exists idx_store_users_uid on store_users(user_id);

-- ═══════════════════════════════════════════════
--  updated_at automático
-- ═══════════════════════════════════════════════
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

create or replace trigger stores_updated_at
  before update on stores
  for each row execute function set_updated_at();

create or replace trigger products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════
--  Row Level Security (RLS)
-- ═══════════════════════════════════════════════
alter table stores      enable row level security;
alter table store_users enable row level security;
alter table orders      enable row level security;
alter table products    enable row level security;
alter table categories  enable row level security;

-- Staff solo ve datos de su store
create policy "staff_see_own_store_orders" on orders
  for select using (
    store_id in (
      select store_id from store_users where user_id = auth.uid()
    )
  );

create policy "staff_update_own_store_orders" on orders
  for update using (
    store_id in (
      select store_id from store_users where user_id = auth.uid()
    )
  );

-- API (service role) puede insertar órdenes sin restricción
-- (La API usa SUPABASE_SERVICE_ROLE_KEY que bypasea RLS)

create policy "staff_see_own_products" on products
  for all using (
    store_id in (
      select store_id from store_users where user_id = auth.uid()
    )
  );

create policy "staff_see_own_store" on stores
  for select using (
    id in (
      select store_id from store_users where user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════
--  Realtime (pedidos en vivo)
-- ═══════════════════════════════════════════════
alter publication supabase_realtime add table orders;

-- ═══════════════════════════════════════════════
--  Seed inicial — Don Parra
-- ═══════════════════════════════════════════════
insert into stores (id, name) values
  ('donparra',   'Don Parra Grill House'),
  ('iteknology', 'iTeknology'),
  ('laboutique', 'La Boutique')
on conflict (id) do nothing;
