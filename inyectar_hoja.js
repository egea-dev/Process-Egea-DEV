import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE = "mapa_estado";
const ROW_ID = "main";

async function inyectar_hoja() {
    console.log("Conectando a Supabase para inyectar Hoja de Producción...");
    const { data, error } = await supabase.from(TABLE).select("state").eq("id", ROW_ID).single();
    if (error) { console.error("Error al leer:", error); return; }

    let state = data.state;
    if (!state || !state.nodes) { console.error("No hay estado válido guardado."); return; }

    // Evitar duplicados
    if (state.nodes.some(n => n.id === "hoja_produccion")) {
        console.log("El nodo hoja_produccion ya existe en la DB. Abortando inyección para no duplicar.");
        return;
    }

    // Nodo a inyectar
    const newNodes = [
        { id: "hoja_produccion", label: "HOJA DE PRODUCCIÓN", sub: "En espera de validación", group: "sistema", x: 180, y: 340, persona: "Sistema" }
    ];

    // Aristas a inyectar
    const newEdges = [
        { id: "e41", from: "gestor", to: "hoja_produccion", label: "genera hoja", type: "main" },
        { id: "e42", from: "almacen", to: "hoja_produccion", label: "visto bueno material", type: "validacion" },
        { id: "e43", from: "corte", to: "hoja_produccion", label: "visto bueno", type: "validacion" },
        { id: "e44", from: "confeccion", to: "hoja_produccion", label: "visto bueno", type: "validacion" },
        { id: "e45", from: "tapiceria", to: "hoja_produccion", label: "visto bueno", type: "validacion" },
        { id: "e46", from: "carpinteria", to: "hoja_produccion", label: "visto bueno", type: "validacion" },
        { id: "e47", from: "juan", to: "hoja_produccion", label: "visto bueno orden", type: "validacion" },
        { id: "e48", from: "hoja_produccion", to: "juan", label: "inicia producción", type: "main" },
    ];

    state.nodes = [...state.nodes, ...newNodes];
    state.edges = [...state.edges, ...newEdges];

    const { error: errUpdate } = await supabase.from(TABLE).update({ state }).eq("id", ROW_ID);

    if (errUpdate) console.error("Error inyectando:", errUpdate);
    else console.log("¡Inyección completada exitosamente! 🚀");
}

inyectar_hoja();
