-- Ejecuta esto en Supabase → SQL Editor

-- 1. Crear la tabla
create table if not exists mapa_state (
  id          text primary key,
  state       jsonb not null,
  updated_at  timestamptz default now()
);

-- 2. Insertar fila inicial vacía (el app la rellena al primer guardado)
insert into mapa_state (id, state)
values ('main', '{}')
on conflict (id) do nothing;

-- 3. Habilitar Realtime para que los cambios se propaguen a todos los usuarios
alter publication supabase_realtime add table mapa_state;

-- 4. Política de acceso abierto (para equipo interno sin login)
--    Si necesitas autenticación, modifica esto más adelante.
alter table mapa_state enable row level security;

create policy "acceso_total" on mapa_state
  for all using (true) with check (true);
