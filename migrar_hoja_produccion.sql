-- INYECCIÓN DEL NODO "HOJA DE PRODUCCIÓN" Y SUS CONEXIONES DIRECTAMENTE EN EL JSONB

UPDATE mapa_state
SET state = jsonb_set(
  jsonb_set(
    state,
    '{nodes}',
    (state->'nodes') || '[{"id": "hoja_produccion", "sub": "En espera de validación", "group": "sistema", "label": "HOJA DE PRODUCCIÓN", "persona": "Sistema", "x": 180, "y": 340}]'::jsonb
  ),
  '{edges}',
  (state->'edges') || '[
    {"id": "e41", "to": "hoja_produccion", "from": "gestor", "type": "main", "label": "genera hoja"},
    {"id": "e42", "to": "hoja_produccion", "from": "almacen", "type": "validacion", "label": "visto bueno material"},
    {"id": "e43", "to": "hoja_produccion", "from": "corte", "type": "validacion", "label": "visto bueno"},
    {"id": "e44", "to": "hoja_produccion", "from": "confeccion", "type": "validacion", "label": "visto bueno"},
    {"id": "e45", "to": "hoja_produccion", "from": "tapiceria", "type": "validacion", "label": "visto bueno"},
    {"id": "e46", "to": "hoja_produccion", "from": "carpinteria", "type": "validacion", "label": "visto bueno"},
    {"id": "e47", "to": "hoja_produccion", "from": "juan", "type": "validacion", "label": "visto bueno orden"},
    {"id": "e48", "to": "juan", "from": "hoja_produccion", "type": "main", "label": "inicia producción"}
  ]'::jsonb
)
WHERE id = 'main';

-- IMPORTANTE: Dale a "Run" en el SQL Editor de Supabase cuando tengas el proyecto abierto.
