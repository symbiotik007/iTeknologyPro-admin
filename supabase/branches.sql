-- ═══════════════════════════════════════════════
--  Branches (sucursales por tienda)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS branches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    text NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name        text NOT NULL,
  address     text NOT NULL,
  phone       text,
  reference   text,
  active      boolean DEFAULT true,
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branches_store ON branches(store_id);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_see_own_branches" ON branches
  FOR ALL USING (
    store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
  );

GRANT ALL ON public.branches TO service_role;
