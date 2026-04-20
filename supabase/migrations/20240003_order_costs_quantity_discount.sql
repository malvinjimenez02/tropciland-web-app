-- Añadir cantidad de unidades y descuento al cliente en order_costs

alter table order_costs
  add column if not exists quantity integer not null default 1,
  add column if not exists discount numeric(10, 2) not null default 0;
