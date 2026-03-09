-- ═══════════════════════════════════════════════════════════
-- MAPA DE PRODUCCIÓN — Setup completo de Supabase
-- Ejecuta esto en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Crear la tabla (si no existe)
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

-- ═══════════════════════════════════════════════════════════
-- 4. RLS — Row Level Security con autenticación obligatoria
--    Solo usuarios autenticados en Supabase Auth pueden acceder.
--    Usuarios admin: ia.hacchi@gmail.com, mario.egea@decoracionesegea.com
-- ═══════════════════════════════════════════════════════════

-- Primero eliminar la política abierta anterior (si existe)
drop policy if exists "acceso_total" on mapa_state;

-- Habilitar RLS
alter table mapa_state enable row level security;

-- Política SELECT: solo usuarios autenticados pueden leer
create policy "solo_autenticados_leer"
  on mapa_state for select
  using (auth.uid() is not null);

-- Política INSERT: solo usuarios autenticados pueden insertar
create policy "solo_autenticados_insertar"
  on mapa_state for insert
  with check (auth.uid() is not null);

-- Política UPDATE: solo usuarios autenticados pueden actualizar
create policy "solo_autenticados_actualizar"
  on mapa_state for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Política DELETE: solo usuarios autenticados pueden borrar
create policy "solo_autenticados_borrar"
  on mapa_state for delete
  using (auth.uid() is not null);

-- ═══════════════════════════════════════════════════════════
-- INSTRUCCIONES FINALES:
-- 1. Ejecutar este script en Supabase → SQL Editor
-- 2. Ir a Authentication → Users → "Invite user" y añadir:
--      ia.hacchi@gmail.com
--      mario.egea@decoracionesegea.com
-- 3. Cada usuario recibirá un email de invitación para crear contraseña
-- ═══════════════════════════════════════════════════════════
