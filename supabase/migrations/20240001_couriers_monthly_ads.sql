-- ─── Couriers ─────────────────────────────────────────────

create table if not exists couriers (
  id     uuid primary key default gen_random_uuid(),
  name   text not null,
  type   text not null check (type in ('mensajero_sd', 'transportadora')),
  active boolean not null default true
);

-- ─── Publicidad mensual ───────────────────────────────────
-- budget_dop es columna generada: budget_usd × exchange_rate
-- No incluir budget_dop en INSERT/UPDATE desde la aplicación.

create table if not exists monthly_ads (
  month         text primary key,          -- formato 'YYYY-MM'
  budget_usd    numeric(10, 2) not null,
  exchange_rate numeric(10, 4) not null,
  budget_dop    numeric(12, 2) generated always as (budget_usd * exchange_rate) stored,
  notes         text
);
