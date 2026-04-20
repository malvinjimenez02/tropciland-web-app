-- ─── Productos / Inventario ──────────────────────────────────
-- initial_stock: cantidad con la que el usuario "cargó" el inventario
-- unit_price:    precio unitario de costo del producto (DOP)

create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  unit_price    numeric(10, 2) not null default 0,
  initial_stock integer not null default 0,
  created_at    timestamptz not null default now()
);
