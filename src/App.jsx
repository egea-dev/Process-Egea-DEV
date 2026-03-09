import { useState, useRef, useEffect, useCallback } from "react";
import { supabase, isConfigured } from "./supabase.js";

// ─── DATOS INICIALES ─────────────────────────────────────────────────────────

const INITIAL_NODES = [
  { id: "gestor", label: "GESTOR", sub: "Solicita pedido", group: "compras", x: 80, y: 200, persona: "" },
  { id: "compras", label: "COMPRAS", sub: "Jacqueline / José Luis*", group: "compras", x: 280, y: 200, persona: "Jacqueline / José Luis", bottleneck: false },
  { id: "proveedor", label: "PROVEEDOR", sub: "Externo", group: "externo", x: 480, y: 200, persona: "" },
  { id: "logistica_entrada", label: "LOG. ENTRADA", sub: "Juani · recepción", group: "almacen", x: 480, y: 340, persona: "Juani" },
  { id: "juan", label: "JUAN CAÑAS", sub: "Jefe de Producción", group: "produccion", x: 280, y: 380, persona: "Juan Cañas", bottleneck: true },
  { id: "corte", label: "CORTE", sub: "Constantine", group: "produccion", x: 60, y: 520, persona: "Constantine" },
  { id: "confeccion", label: "CONFECCIÓN", sub: "Mónica + Dori", group: "produccion", x: 210, y: 520, persona: "Mónica / Dori" },
  { id: "tapiceria", label: "TAPICERÍA", sub: "Julián", group: "produccion", x: 360, y: 520, persona: "Julián" },
  { id: "carpinteria", label: "CARPINTERÍA", sub: "Eduardo", group: "produccion", x: 510, y: 520, persona: "Eduardo" },
  { id: "empaquetado", label: "EMPAQUETADO", sub: "Isa · tickets", group: "produccion", x: 660, y: 520, persona: "Isa" },
  { id: "almacen", label: "ALMACÉN", sub: "Juani · valida ACABADO", group: "almacen", x: 380, y: 650, persona: "Juani", bottleneck: true },
  { id: "instalacion", label: "INSTALACIÓN", sub: "Validación Juan Cañas", group: "instalacion", x: 140, y: 790, persona: "Juan Cañas / David*" },
  { id: "envio_nacional", label: "ENVÍO NACIONAL", sub: "Carga directa", group: "salida", x: 380, y: 790, persona: "" },
  { id: "exportacion", label: "EXPORTACIÓN", sub: "Mónica coord.", group: "salida", x: 620, y: 790, persona: "Mónica (log.ext.)" },
  { id: "agente_ext", label: "AGENTE EXT.", sub: "Instalación externa", group: "externo", x: 30, y: 930, persona: "" },
  { id: "factusol", label: "FACTUSOL", sub: "Facturación", group: "admin", x: 380, y: 930, persona: "Miguel Ángel*" },
  { id: "sistema", label: "SISTEMA / ERP", sub: "Tablets pendientes", group: "sistema", x: 830, y: 340, persona: "" },
  { id: "anas", label: "ANÁS", sub: "Tarifas + códigos", group: "sistema", x: 830, y: 200, persona: "Anás" },
  { id: "flor", label: "FLOR", sub: "Duplicación BOM", group: "sistema", x: 830, y: 480, persona: "Flor" },
  { id: "hacchi", label: "HACCHI", sub: "1ª carga escandallos", group: "sistema", x: 980, y: 340, persona: "Hacchi" },
  { id: "matias", label: "MATÍAS", sub: "RRHH", group: "admin", x: 830, y: 620, persona: "Matías" },
  { id: "miguel", label: "MIGUEL ÁNGEL", sub: "Decisiones Org.", group: "admin", x: 830, y: 790, persona: "Miguel Ángel", bottleneck: true },
];

const INITIAL_EDGES = [
  { id: "e1", from: "gestor", to: "compras", label: "solicita", type: "main" },
  { id: "e2", from: "compras", to: "proveedor", label: "pedido", type: "main" },
  { id: "e3", from: "compras", to: "gestor", label: "notifica cambios", type: "feedback" },
  { id: "e4", from: "proveedor", to: "compras", label: "reclama retraso", type: "reclamacion" },
  { id: "e5", from: "juan", to: "compras", label: "reclama fechas", type: "reclamacion" },
  { id: "e6", from: "proveedor", to: "logistica_entrada", label: "entrega material", type: "main" },
  { id: "e7", from: "logistica_entrada", to: "compras", label: "reclama si error", type: "reclamacion" },
  { id: "e8", from: "logistica_entrada", to: "sistema", label: "escaneo activa trabajo", type: "sistema" },
  { id: "e9", from: "logistica_entrada", to: "juan", label: "informa llegada", type: "main" },
  { id: "e10", from: "juan", to: "corte", label: "coordina", type: "main" },
  { id: "e11", from: "juan", to: "confeccion", label: "coordina", type: "main" },
  { id: "e12", from: "juan", to: "tapiceria", label: "coordina", type: "main" },
  { id: "e13", from: "juan", to: "carpinteria", label: "coordina", type: "main" },
  { id: "e14", from: "juan", to: "empaquetado", label: "coordina", type: "main" },
  { id: "e15", from: "corte", to: "confeccion", label: "→", type: "proceso" },
  { id: "e16", from: "confeccion", to: "tapiceria", label: "→", type: "proceso" },
  { id: "e17", from: "tapiceria", to: "empaquetado", label: "→", type: "proceso" },
  { id: "e18", from: "carpinteria", to: "empaquetado", label: "→", type: "proceso" },
  { id: "e19", from: "empaquetado", to: "almacen", label: "producto terminado", type: "main" },
  { id: "e20", from: "corte", to: "juan", label: "alerta retraso", type: "reclamacion" },
  { id: "e21", from: "confeccion", to: "juan", label: "alerta retraso", type: "reclamacion" },
  { id: "e22", from: "tapiceria", to: "juan", label: "alerta retraso", type: "reclamacion" },
  { id: "e23", from: "almacen", to: "instalacion", label: "carril instalación", type: "main" },
  { id: "e24", from: "almacen", to: "envio_nacional", label: "carril envío", type: "main" },
  { id: "e25", from: "almacen", to: "exportacion", label: "carril exportación", type: "main" },
  { id: "e26", from: "instalacion", to: "juan", label: "Juan valida corrección", type: "validacion" },
  { id: "e27", from: "instalacion", to: "agente_ext", label: "instalación externa", type: "main" },
  { id: "e28", from: "instalacion", to: "factusol", label: "factura tras validación", type: "main" },
  { id: "e29", from: "envio_nacional", to: "factusol", label: "factura", type: "main" },
  { id: "e30", from: "exportacion", to: "factusol", label: "factura", type: "main" },
  { id: "e31", from: "anas", to: "sistema", label: "carga tarifas", type: "sistema" },
  { id: "e32", from: "hacchi", to: "sistema", label: "carga escandallos", type: "sistema" },
  { id: "e33", from: "flor", to: "sistema", label: "duplicación/cálculos", type: "sistema" },
  { id: "e34", from: "sistema", to: "juan", label: "hojas trabajo (tablets)", type: "sistema" },
  { id: "e35", from: "sistema", to: "corte", label: "parte trabajo", type: "sistema" },
  { id: "e36", from: "sistema", to: "confeccion", label: "parte trabajo", type: "sistema" },
  { id: "e37", from: "sistema", to: "tapiceria", label: "parte trabajo", type: "sistema" },
  { id: "e38", from: "miguel", to: "compras", label: "define responsable", type: "admin" },
  { id: "e39", from: "miguel", to: "factusol", label: "define contabilidad", type: "admin" },
  { id: "e40", from: "matias", to: "sistema", label: "RRHH en sistema", type: "admin" },
];

const INITIAL_PROBLEMS = [
  { id: "cuello_juan", type: "bottleneck", title: "Cuello de botella: Juan Cañas", nodes: ["juan", "instalacion"], desc: "Juan Cañas concentra jefatura de producción, reclamaciones a compras, validación de instalaciones y autorización de facturación. Una sola persona en múltiples flujos críticos." },
  { id: "cuello_juani", type: "bottleneck", title: "Cuello de botella: Juani", nodes: ["almacen", "logistica_entrada", "exportacion"], desc: "Juani gestiona recepción de material, validación de producto acabado Y preparación de documentación para exportación. Riesgo de saturación." },
  { id: "cuello_miguel", type: "bottleneck", title: "Cuello de botella: Miguel Ángel", nodes: ["miguel", "compras", "factusol"], desc: "Miguel Ángel es el único que puede decidir responsables de compras, contabilidad y facturación. Decisiones bloqueadas hasta que actúe." },
  { id: "rol_jose_luis", type: "warning", title: "Rol indefinido: José Luis", nodes: ["compras"], desc: "José Luis aparece como posible responsable de Compras Y como apoyo de producción. La transcripción revela conflicto de carisma con el equipo." },
  { id: "tablets_sin_definir", type: "warning", title: "Mecanismo tablets sin definir", nodes: ["sistema", "corte", "confeccion", "tapiceria"], desc: "El flujo de distribución de hojas de trabajo diarias a responsables vía tablet no está definido. Constantine, Mónica y Julián necesitarán soporte." },
  { id: "instalacion_ambigua", type: "warning", title: "Configuración instalación pendiente", nodes: ["instalacion", "agente_ext"], desc: "La instalación está definida conceptualmente pero la configuración técnica en el sistema para instalación externa (agente autónomo) no se ha implementado." },
  { id: "carpinteria_desfase", type: "warning", title: "Carpintería B: implementación diferida", nodes: ["carpinteria"], desc: "Mario confirmó que la carpintería B funcionará como tapicería en aproximadamente un mes. Esta dependencia temporal no está documentada." },
  { id: "redundancia_logistica", type: "redundancy", title: "Redundancia: Juani vs Mónica", nodes: ["almacen", "exportacion"], desc: "Solapamiento potencial entre Juani (documentación, packing list) y Mónica (transportistas). Límites de responsabilidad no delimitados para exportación compleja." },
  { id: "nueva_encargada", type: "warning", title: "Riesgo: Mónica recién incorporada", nodes: ["confeccion"], desc: "Mónica acaba de ser designada encargada. La transcripción señala que le costará más adaptarse al sistema en fase crítica de implementación." },
];

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const GROUPS = ["compras","produccion","almacen","instalacion","salida","admin","sistema","externo"];
const EDGE_TYPES = ["main","feedback","reclamacion","proceso","sistema","validacion","admin"];
const PROB_TYPES = ["bottleneck","warning","redundancy"];
const NODE_W = 132, NODE_H = 54;

const GC = {
  compras:    { bg:"#1e40af", accent:"#3b82f6" },
  produccion: { bg:"#15803d", accent:"#22c55e" },
  almacen:    { bg:"#7c3aed", accent:"#a78bfa" },
  instalacion:{ bg:"#c2410c", accent:"#fb923c" },
  salida:     { bg:"#0e7490", accent:"#22d3ee" },
  admin:      { bg:"#92400e", accent:"#f59e0b" },
  sistema:    { bg:"#374151", accent:"#9ca3af" },
  externo:    { bg:"#4b5563", accent:"#d1d5db" },
};

const ES = {
  main:       { color:"#475569", width:2,   dash:"none" },
  feedback:   { color:"#3b82f6", width:1.5, dash:"5,4" },
  reclamacion:{ color:"#ef4444", width:2,   dash:"6,3" },
  proceso:    { color:"#22c55e", width:2.5, dash:"none" },
  sistema:    { color:"#8b5cf6", width:1.5, dash:"4,3" },
  validacion: { color:"#f59e0b", width:2,   dash:"none" },
  admin:      { color:"#a16207", width:1.5, dash:"8,4" },
};

const PS = {
  bottleneck: { color:"#ef4444", icon:"⚡" },
  warning:    { color:"#f59e0b", icon:"⚠"  },
  redundancy: { color:"#8b5cf6", icon:"↔"  },
};

let _uid = 200;
const uid = () => `x${++_uid}`;

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────

const TABLE = "mapa_state";
const ROW_ID = "main";

async function loadFromDB() {
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", ROW_ID).single();
  if (error || !data) return null;
  return data.state;
}

async function saveToDB(state) {
  if (!supabase) return;
  await supabase.from(TABLE).upsert({ id: ROW_ID, state, updated_at: new Date().toISOString() });
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"#0f172a", border:"1px solid #334155", borderRadius:"10px", padding:"24px", minWidth:"360px", maxWidth:"520px", width:"90%", maxHeight:"82vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"18px" }}>
          <span style={{ color:"#f1f5f9", fontSize:"13px", fontWeight:"700", letterSpacing:"1px" }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:"20px", lineHeight:1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = { background:"#1e293b", border:"1px solid #334155", borderRadius:"5px", padding:"7px 10px", color:"#f1f5f9", fontSize:"12px", width:"100%", fontFamily:"inherit", boxSizing:"border-box", outline:"none" };

function Field({ label, value, onChange, type="text", options }) {
  return (
    <div style={{ marginBottom:"12px" }}>
      <div style={{ color:"#64748b", fontSize:"10px", letterSpacing:"1px", marginBottom:"4px" }}>{label}</div>
      {type==="select" ? (
        <select value={value} onChange={e=>onChange(e.target.value)} style={inputStyle}>
          {options.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      ) : type==="textarea" ? (
        <textarea value={value} onChange={e=>onChange(e.target.value)} style={{ ...inputStyle, minHeight:"70px", resize:"vertical" }}/>
      ) : (
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={inputStyle}/>
      )}
    </div>
  );
}

function Btn({ children, onClick, color="#3b82f6", sm }) {
  return <button onClick={onClick} style={{ background:color, border:"none", borderRadius:"5px", padding:sm?"4px 9px":"8px 16px", color:"#fff", fontSize:sm?"9px":"12px", fontWeight:"600", cursor:"pointer", fontFamily:"inherit" }}>{children}</button>;
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [nodes,    setNodes]    = useState(INITIAL_NODES);
  const [edges,    setEdges]    = useState(INITIAL_EDGES);
  const [problems, setProblems] = useState(INITIAL_PROBLEMS);
  const [dbReady,  setDbReady]  = useState(false);
  const [syncMsg,  setSyncMsg]  = useState("");
  const [onlineUsers, setOnlineUsers] = useState(1);

  // selection / UI state
  const [selected,       setSelected]       = useState(null);
  const [activeProblems, setActiveProblems] = useState([]);
  const [filterType,     setFilterType]     = useState("all");

  // modals
  const [editNode,    setEditNode]    = useState(null);
  const [editEdge,    setEditEdge]    = useState(null);
  const [editProblem, setEditProblem] = useState(null);
  const [addNodeM,    setAddNodeM]    = useState(false);
  const [addProblemM, setAddProblemM] = useState(false);
  const [newNode,    setNewNode]    = useState({ label:"", sub:"", group:"produccion", persona:"" });
  const [newProblem, setNewProblem] = useState({ title:"", type:"warning", desc:"", nodes:[] });

  // add-edge mode
  const [addEdgeMode, setAddEdgeMode] = useState(false);
  const [addEdgeFrom, setAddEdgeFrom] = useState(null);
  const [editEdgeDraft, setEditEdgeDraft] = useState(null);

  // pan/zoom/drag
  const [pan,  setPan]  = useState({ x:20, y:20 });
  const [zoom, setZoom] = useState(0.82);
  const [panning,      setPanning]      = useState(false);
  const [panStart,     setPanStart]     = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset,   setDragOffset]   = useState({ x:0, y:0 });

  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const saveTimer = useRef(null);
  const ignoreRemote = useRef(false);

  // ── Load from DB on mount ──
  useEffect(() => {
    if (!isConfigured) { setDbReady(false); return; }
    loadFromDB().then(state => {
      if (state) {
        if (state.nodes)    setNodes(state.nodes);
        if (state.edges)    setEdges(state.edges);
        if (state.problems) setProblems(state.problems);
        setSyncMsg("✓ Cargado desde la nube");
      }
      setDbReady(true);
    });
  }, []);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("mapa-realtime")
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:TABLE, filter:`id=eq.${ROW_ID}` }, payload => {
        if (ignoreRemote.current) return;
        const s = payload.new.state;
        if (s) {
          if (s.nodes)    setNodes(s.nodes);
          if (s.edges)    setEdges(s.edges);
          if (s.problems) setProblems(s.problems);
          setSyncMsg("↓ Actualizado por otro usuario");
          setTimeout(() => setSyncMsg(""), 3000);
        }
      })
      .on("presence", { event:"sync" }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state).length || 1);
      })
      .subscribe(async status => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Debounced save to DB ──
  const scheduleSave = useCallback((ns, es, ps) => {
    if (!supabase) return;
    clearTimeout(saveTimer.current);
    ignoreRemote.current = true;
    setSyncMsg("Guardando…");
    saveTimer.current = setTimeout(async () => {
      await saveToDB({ nodes: ns, edges: es, problems: ps });
      setSyncMsg("✓ Guardado en la nube");
      setTimeout(() => { setSyncMsg(""); ignoreRemote.current = false; }, 2500);
    }, 800);
  }, []);

  // ── State mutators that also save ──
  const updateNodes = useCallback((fn) => {
    setNodes(prev => { const next = typeof fn === "function" ? fn(prev) : fn; scheduleSave(next, edges, problems); return next; });
  }, [edges, problems, scheduleSave]);

  const updateEdges = useCallback((fn) => {
    setEdges(prev => { const next = typeof fn === "function" ? fn(prev) : fn; scheduleSave(nodes, next, problems); return next; });
  }, [nodes, problems, scheduleSave]);

  const updateProblems = useCallback((fn) => {
    setProblems(prev => { const next = typeof fn === "function" ? fn(prev) : fn; scheduleSave(nodes, edges, next); return next; });
  }, [nodes, edges, scheduleSave]);

  // ── Helpers ──
  const getCenter = n => ({ x: n.x + NODE_W/2, y: n.y + NODE_H/2 });

  const svgCoords = useCallback((cx, cy) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x:0, y:0 };
    return { x:(cx - rect.left - pan.x)/zoom, y:(cy - rect.top - pan.y)/zoom };
  }, [pan, zoom]);

  const isNodeLit = useCallback(id => {
    if (!selected && activeProblems.length === 0) return true;
    if (activeProblems.some(pid => problems.find(p=>p.id===pid)?.nodes.includes(id))) return true;
    if (!selected) return false;
    return selected===id || edges.some(e=>(e.from===selected&&e.to===id)||(e.to===selected&&e.from===id));
  }, [selected, activeProblems, problems, edges]);

  const isEdgeLit = useCallback(edge => {
    if (!selected && activeProblems.length === 0) return true;
    if (activeProblems.length > 0) {
      const ns = activeProblems.flatMap(pid => problems.find(p=>p.id===pid)?.nodes || []);
      return ns.includes(edge.from) || ns.includes(edge.to);
    }
    return edge.from===selected || edge.to===selected;
  }, [selected, activeProblems, problems, edges]);

  // ── Wheel zoom ──
  useEffect(() => {
    const el = containerRef.current;
    const h = e => { e.preventDefault(); setZoom(z=>Math.min(2.5,Math.max(0.25,z*(e.deltaY>0?0.9:1.11)))); };
    el?.addEventListener("wheel", h, { passive:false });
    return () => el?.removeEventListener("wheel", h);
  }, []);

  // ── Mouse handlers ──
  const onSvgDown = e => {
    if (e.target===svgRef.current || e.target.getAttribute("data-bg")) {
      setPanning(true);
      setPanStart({ x:e.clientX-pan.x, y:e.clientY-pan.y });
      setSelected(null);
    }
  };

  const onMouseMove = e => {
    if (draggingNode) {
      const {x,y} = svgCoords(e.clientX,e.clientY);
      updateNodes(ns => ns.map(n => n.id===draggingNode ? {...n,x:x-dragOffset.x,y:y-dragOffset.y} : n));
    } else if (panning && panStart) {
      setPan({ x:e.clientX-panStart.x, y:e.clientY-panStart.y });
    }
  };

  const onMouseUp = () => { setPanning(false); setPanStart(null); setDraggingNode(null); };

  const onNodeDown = (e,node) => {
    e.stopPropagation();
    if (addEdgeMode) return;
    const {x,y} = svgCoords(e.clientX,e.clientY);
    setDraggingNode(node.id);
    setDragOffset({ x:x-node.x, y:y-node.y });
  };

  const onNodeClick = (e,node) => {
    e.stopPropagation();
    if (addEdgeMode) {
      if (!addEdgeFrom) { setAddEdgeFrom(node.id); return; }
      if (addEdgeFrom !== node.id) {
        setEditEdgeDraft({ _new:true, id:uid(), from:addEdgeFrom, to:node.id, label:"", type:"main" });
        setAddEdgeFrom(null); setAddEdgeMode(false);
      }
      return;
    }
    setActiveProblems([]);
    setSelected(s => s===node.id ? null : node.id);
  };

  const onNodeDbl = (e,node) => { e.stopPropagation(); setEditNode({...node}); };

  // ── Node CRUD ──
  const saveNode = () => {
    updateNodes(ns => ns.map(n => n.id===editNode.id ? {...editNode} : n));
    setEditNode(null);
  };

  const deleteNode = id => {
    updateNodes(ns => ns.filter(n=>n.id!==id));
    updateEdges(es => es.filter(e=>e.from!==id&&e.to!==id));
    updateProblems(ps => ps.map(p=>({...p,nodes:p.nodes.filter(n=>n!==id)})));
    setEditNode(null);
    if (selected===id) setSelected(null);
  };

  const addNode = () => {
    const id = uid();
    updateNodes(ns => [...ns, { id, x:300, y:300, label:newNode.label||"NUEVO", sub:newNode.sub||"", group:newNode.group, persona:newNode.persona||"", bottleneck:false }]);
    setNewNode({ label:"", sub:"", group:"produccion", persona:"" });
    setAddNodeM(false);
  };

  // ── Edge CRUD ──
  const saveEdge = (draft) => {
    if (draft._new) {
      updateEdges(es => [...es, { id:draft.id, from:draft.from, to:draft.to, label:draft.label, type:draft.type }]);
    } else {
      updateEdges(es => es.map(e => e.id===draft.id ? {...draft} : e));
    }
    setEditEdge(null); setEditEdgeDraft(null);
  };

  const deleteEdge = id => {
    updateEdges(es => es.filter(e=>e.id!==id));
    setEditEdge(null);
  };

  // ── Problem CRUD ──
  const saveProblem = (prob) => {
    if (prob._new) {
      updateProblems(ps => [...ps, { ...prob, id:uid() }]);
    } else {
      updateProblems(ps => ps.map(p => p.id===prob.id ? {...prob} : p));
    }
    setEditProblem(null);
  };

  const deleteProblem = id => {
    updateProblems(ps => ps.filter(p=>p.id!==id));
    setActiveProblems(ap => ap.filter(p=>p!==id));
    setEditProblem(null);
  };

  const addProblem = () => {
    updateProblems(ps => [...ps, { ...newProblem, id:uid() }]);
    setNewProblem({ title:"", type:"warning", desc:"", nodes:[] });
    setAddProblemM(false);
  };

  const selectedNode = nodes.find(n=>n.id===selected);
  const connEdges = selected ? edges.filter(e=>e.from===selected||e.to===selected) : [];
  const filteredProbs = filterType==="all" ? problems : problems.filter(p=>p.type===filterType);
  const activeDraft = editEdgeDraft || editEdge;

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", background:"#0f1117", minHeight:"100vh", display:"flex", flexDirection:"column", userSelect:"none" }}>

      {/* ══ HEADER ══ */}
      <div style={{ background:"linear-gradient(90deg,#1e3a5f,#0f1117)", borderBottom:"1px solid #1e293b", padding:"9px 16px", display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
        <div>
          <div style={{ color:"#60a5fa", fontSize:"9px", letterSpacing:"3px" }}>SISTEMA DE GESTIÓN DE PRODUCCIÓN</div>
          <div style={{ color:"#f1f5f9", fontSize:"14px", fontWeight:"700" }}>MAPA INTERACTIVO EDITABLE</div>
        </div>

        {/* Sync status */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {isConfigured ? (
            <div style={{ display:"flex", alignItems:"center", gap:"6px", background:"#0f2027", border:"1px solid #1e3a5f", borderRadius:"4px", padding:"3px 9px" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background: dbReady?"#22c55e":"#f59e0b", boxShadow:`0 0 6px ${dbReady?"#22c55e":"#f59e0b"}` }}/>
              <span style={{ color:"#64748b", fontSize:"9px" }}>{dbReady?"Supabase conectado":"Conectando…"}</span>
              <span style={{ color:"#334155", fontSize:"9px" }}>·</span>
              <span style={{ color:"#60a5fa", fontSize:"9px" }}>👥 {onlineUsers} en línea</span>
            </div>
          ) : (
            <div style={{ background:"#431407", border:"1px solid #7c2d12", borderRadius:"4px", padding:"3px 9px" }}>
              <span style={{ color:"#fb923c", fontSize:"9px" }}>⚠ Sin Supabase — modo local</span>
            </div>
          )}
          {syncMsg && <span style={{ color:"#22c55e", fontSize:"9px", animation:"fadeIn 0.3s" }}>{syncMsg}</span>}
        </div>

        <div style={{ flex:1 }}/>

        {/* Toolbar */}
        <div style={{ display:"flex", gap:"5px", alignItems:"center", flexWrap:"wrap" }}>
          <button onClick={()=>{ setAddEdgeMode(m=>!m); setAddEdgeFrom(null); }}
            style={{ background:addEdgeMode?"#3b82f6":"#1e293b", border:`1px solid ${addEdgeMode?"#3b82f6":"#334155"}`, color:addEdgeMode?"#fff":"#94a3b8", padding:"5px 10px", borderRadius:"4px", cursor:"pointer", fontSize:"10px", fontFamily:"inherit" }}>
            {addEdgeMode ? (addEdgeFrom ? "▶ Clic destino…" : "▶ Clic origen…") : "＋ Conexión"}
          </button>
          {addEdgeMode && <button onClick={()=>{ setAddEdgeMode(false); setAddEdgeFrom(null); }} style={{ background:"#ef4444", border:"none", color:"#fff", padding:"5px 9px", borderRadius:"4px", cursor:"pointer", fontSize:"10px", fontFamily:"inherit" }}>✕</button>}
          <button onClick={()=>setAddNodeM(true)} style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8", padding:"5px 10px", borderRadius:"4px", cursor:"pointer", fontSize:"10px", fontFamily:"inherit" }}>＋ Nodo</button>
          <button onClick={()=>setAddProblemM(true)} style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8", padding:"5px 10px", borderRadius:"4px", cursor:"pointer", fontSize:"10px", fontFamily:"inherit" }}>＋ Problema</button>
          <div style={{ width:"1px", height:"18px", background:"#334155" }}/>
          <button onClick={()=>setZoom(z=>Math.min(2.5,z*1.15))} style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8", padding:"5px 10px", borderRadius:"4px", cursor:"pointer", fontSize:"13px" }}>＋</button>
          <button onClick={()=>setZoom(z=>Math.max(0.25,z*0.87))} style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8", padding:"5px 10px", borderRadius:"4px", cursor:"pointer", fontSize:"13px" }}>−</button>
          <button onClick={()=>{ setZoom(0.82); setPan({x:20,y:20}); }} style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8", padding:"5px 10px", borderRadius:"4px", cursor:"pointer", fontSize:"10px", fontFamily:"inherit" }}>↺</button>
          <button onClick={()=>{ setSelected(null); setActiveProblems([]); }} style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8", padding:"5px 10px", borderRadius:"4px", cursor:"pointer", fontSize:"10px", fontFamily:"inherit" }}>✕ Limpiar</button>
        </div>

        {addEdgeMode && (
          <div style={{ width:"100%", background:"#1e3a5f", borderRadius:"4px", padding:"4px 12px", color:"#60a5fa", fontSize:"9.5px" }}>
            MODO CONEXIÓN: {addEdgeFrom ? `Origen: ${nodes.find(n=>n.id===addEdgeFrom)?.label} → ahora clic en el nodo DESTINO` : "Haz clic en el nodo ORIGEN"}
          </div>
        )}
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ══ LEFT: PROBLEMS ══ */}
        <div style={{ width:"268px", minWidth:"268px", background:"#0a0d14", borderRight:"1px solid #1e293b", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"9px 13px", borderBottom:"1px solid #1e293b", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ color:"#f8fafc", fontSize:"10px", fontWeight:"700", letterSpacing:"2px" }}>PROBLEMAS DETECTADOS</span>
            <span style={{ background:"#ef4444", color:"#fff", borderRadius:"10px", padding:"1px 7px", fontSize:"10px", fontWeight:"700" }}>{problems.length}</span>
          </div>
          <div style={{ display:"flex", gap:"3px", padding:"6px 8px", borderBottom:"1px solid #1e293b" }}>
            {[["all","Todos","#475569"],["bottleneck","⚡ Cuello","#ef4444"],["warning","⚠ Aviso","#f59e0b"],["redundancy","↔ Redund.","#8b5cf6"]].map(([k,l,c])=>(
              <button key={k} onClick={()=>setFilterType(k)} style={{ flex:1, padding:"4px 2px", fontSize:"9px", borderRadius:"3px", border:"none", cursor:"pointer", background:filterType===k?c:"#1e293b", color:filterType===k?"#fff":"#94a3b8", fontFamily:"inherit", fontWeight:"600" }}>{l}</button>
            ))}
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"7px" }}>
            {filteredProbs.map(prob=>{
              const ps=PS[prob.type]; const isA=activeProblems.includes(prob.id);
              return (
                <div key={prob.id} style={{ background:isA?"#1e293b":"#0f1117", border:`1px solid ${isA?ps.color:"#1e293b"}`, borderLeft:`3px solid ${ps.color}`, borderRadius:"6px", padding:"8px 9px", marginBottom:"5px", cursor:"pointer" }}
                  onClick={()=>{ setSelected(null); setActiveProblems(ap=>ap.includes(prob.id)?ap.filter(x=>x!==prob.id):[...ap,prob.id]); }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"3px" }}>
                    <span style={{ background:ps.color, borderRadius:"3px", padding:"1px 5px", fontSize:"10px", color:"#fff", fontWeight:"700" }}>{ps.icon}</span>
                    <span style={{ color:"#f1f5f9", fontSize:"10px", fontWeight:"600", flex:1, lineHeight:1.3 }}>{prob.title}</span>
                    <button onClick={e=>{e.stopPropagation();setEditProblem({...prob});}} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:"11px" }}>✏</button>
                  </div>
                  {isA && <div style={{ color:"#94a3b8", fontSize:"9px", lineHeight:1.5, marginTop:"4px" }}>{prob.desc}</div>}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"3px", marginTop:"4px" }}>
                    {prob.nodes.map(nid=>{const n=nodes.find(x=>x.id===nid);return <span key={nid} style={{ background:"#1e293b", color:"#60a5fa", fontSize:"8px", padding:"1px 5px", borderRadius:"2px" }}>{n?.label||nid}</span>;})}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop:"1px solid #1e293b", padding:"8px 11px" }}>
            <div style={{ color:"#334155", fontSize:"8.5px", letterSpacing:"1.5px", marginBottom:"5px" }}>TIPO DE CONEXIÓN</div>
            {Object.entries(ES).map(([type,s])=>(
              <div key={type} style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"3px" }}>
                <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash==="none"?"":s.dash}/></svg>
                <span style={{ color:"#4b5563", fontSize:"9px" }}>{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ CANVAS ══ */}
        <div ref={containerRef} style={{ flex:1, position:"relative", overflow:"hidden", background:"#0f1117", cursor:addEdgeMode?"crosshair":draggingNode?"grabbing":panning?"grabbing":"grab" }}
          onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
            <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`translate(${pan.x%40},${pan.y%40}) scale(${zoom})`}><path d="M40 0L0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>

          <svg ref={svgRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} onMouseDown={onSvgDown}>
            <defs>
              {Object.entries(ES).map(([type,s])=>(
                <marker key={type} id={`arr-${type}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={s.color}/>
                </marker>
              ))}
              <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="sh"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.6"/></filter>
            </defs>

            <rect data-bg="1" width="10000" height="10000" fill="transparent" onMouseDown={onSvgDown}/>

            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {edges.map(edge=>{
                const fn=nodes.find(n=>n.id===edge.from),tn=nodes.find(n=>n.id===edge.to);
                if(!fn||!tn) return null;
                const fc=getCenter(fn),tc=getCenter(tn);
                const s=ES[edge.type]||ES.main;
                const lit=isEdgeLit(edge);
                const mx=(fc.x+tc.x)/2,my=(fc.y+tc.y)/2-22;
                return (
                  <g key={edge.id} opacity={lit?1:0.07} style={{cursor:"pointer"}} onDoubleClick={e=>{e.stopPropagation();setEditEdge({...edge});}}>
                    <path d={`M${fc.x},${fc.y} Q${mx},${my} ${tc.x},${tc.y}`} fill="none" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash==="none"?"":s.dash} markerEnd={`url(#arr-${edge.type})`}/>
                    {lit&&edge.label&&<text x={mx} y={my-4} textAnchor="middle" fontSize="7.5" fill={s.color} fontFamily="monospace" opacity="0.9">{edge.label}</text>}
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map(node=>{
                const col=GC[node.group]||GC.sistema;
                const lit=isNodeLit(node.id);
                const isSel=selected===node.id;
                const probActive=activeProblems.some(pid=>problems.find(p=>p.id===pid)?.nodes.includes(node.id));
                const isAddSrc=addEdgeFrom===node.id;
                return (
                  <g key={node.id} transform={`translate(${node.x},${node.y})`} opacity={lit?1:0.12}
                    onMouseDown={e=>onNodeDown(e,node)} onClick={e=>onNodeClick(e,node)} onDoubleClick={e=>onNodeDbl(e,node)}
                    style={{cursor:addEdgeMode?"pointer":draggingNode===node.id?"grabbing":"pointer"}}>
                    {(isSel||probActive||isAddSrc)&&<rect x="-5" y="-5" width={NODE_W+10} height={NODE_H+10} rx="11" fill={isAddSrc?"#3b82f6":col.accent} opacity="0.2" filter="url(#glow)"/>}
                    <rect width={NODE_W} height={NODE_H} rx="7" fill={isSel?"#1e3a5f":"#131b2e"} stroke={isAddSrc?"#3b82f6":isSel?col.accent:probActive?"#ef4444":col.accent+"55"} strokeWidth={isSel||isAddSrc?2.5:probActive?2:1} filter={isSel?"url(#sh)":"none"}/>
                    <rect width={NODE_W} height="4" rx="3" fill={col.accent} opacity="0.85"/>
                    <text x={NODE_W/2} y="22" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={isSel?"#fff":col.accent} fontFamily="monospace" letterSpacing="0.5">{node.label}</text>
                    <text x={NODE_W/2} y="36" textAnchor="middle" fontSize="7.8" fill="#94a3b8" fontFamily="monospace">{node.sub}</text>
                    {node.bottleneck&&<g transform={`translate(${NODE_W-13},-8)`}><circle r="7" fill="#ef4444"/><text textAnchor="middle" y="4" fontSize="8" fill="#fff" fontWeight="700">⚡</text></g>}
                    {isSel&&<text x={NODE_W/2} y={NODE_H+11} textAnchor="middle" fontSize="7" fill="#334155" fontFamily="monospace">2× clic para editar</text>}
                  </g>
                );
              })}
            </g>
          </svg>

          <div style={{ position:"absolute", bottom:"10px", right:"12px", background:"#0a0d14", border:"1px solid #1e293b", borderRadius:"4px", padding:"4px 10px", color:"#334155", fontSize:"9px" }}>
            {Math.round(zoom*100)}% · Arrastra · 2× clic en nodo/conexión para editar
          </div>
        </div>

        {/* ══ RIGHT: DETAIL ══ */}
        <div style={{ width:"248px", minWidth:"248px", background:"#0a0d14", borderLeft:"1px solid #1e293b", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"9px 13px", borderBottom:"1px solid #1e293b" }}>
            <span style={{ color:"#f8fafc", fontSize:"10px", fontWeight:"700", letterSpacing:"2px" }}>DETALLE</span>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"11px" }}>
            {!selectedNode && activeProblems.length===0 && (
              <div style={{ color:"#334155", fontSize:"9.5px", lineHeight:1.8 }}>
                <div style={{ marginBottom:"8px" }}>Clic en nodo → ver conexiones.</div>
                <div style={{ marginBottom:"8px" }}>2× clic → editar nodo o conexión.</div>
                <div style={{ color:"#1e293b", fontSize:"8px", letterSpacing:"1px", marginBottom:"6px", marginTop:"16px" }}>ESTADÍSTICAS</div>
                {[["Nodos",nodes.length,"#60a5fa"],["Conexiones",edges.length,"#60a5fa"],["⚡ Cuellos",problems.filter(p=>p.type==="bottleneck").length,"#ef4444"],["⚠ Avisos",problems.filter(p=>p.type==="warning").length,"#f59e0b"],["↔ Redundancias",problems.filter(p=>p.type==="redundancy").length,"#8b5cf6"]].map(([k,v,c])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                    <span>{k}</span><span style={{ color:c, fontWeight:"700" }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {activeProblems.length>0&&!selectedNode&&activeProblems.map(pid=>{
              const prob=problems.find(p=>p.id===pid); if(!prob) return null;
              const ps=PS[prob.type];
              return (
                <div key={pid} style={{ marginBottom:"12px", borderLeft:`2px solid ${ps.color}`, paddingLeft:"9px" }}>
                  <div style={{ color:"#f1f5f9", fontSize:"11px", fontWeight:"700", marginBottom:"4px" }}>{ps.icon} {prob.title}</div>
                  <div style={{ color:"#94a3b8", fontSize:"9.5px", lineHeight:1.55 }}>{prob.desc}</div>
                  <div style={{ marginTop:"7px", display:"flex", flexWrap:"wrap", gap:"3px" }}>
                    {prob.nodes.map(nid=>{const n=nodes.find(x=>x.id===nid);const col=GC[n?.group]||GC.sistema;return(
                      <div key={nid} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                        <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:col.accent }}/>
                        <span style={{ color:"#cbd5e1", fontSize:"9px" }}>{n?.label||nid}</span>
                      </div>
                    );})}
                  </div>
                  <div style={{ marginTop:"8px" }}><Btn sm color="#374151" onClick={()=>setEditProblem({...prob})}>✏ Editar</Btn></div>
                </div>
              );
            })}

            {selectedNode&&(()=>{
              const col=GC[selectedNode.group]||GC.sistema;
              return (
                <div>
                  <div style={{ background:col.bg, borderRadius:"6px", padding:"9px", marginBottom:"10px" }}>
                    <div style={{ color:col.accent, fontSize:"8px", letterSpacing:"2px" }}>{selectedNode.group.toUpperCase()}</div>
                    <div style={{ color:"#fff", fontSize:"13px", fontWeight:"700" }}>{selectedNode.label}</div>
                    <div style={{ color:"#cbd5e1", fontSize:"9px", marginTop:"2px" }}>{selectedNode.sub}</div>
                    {selectedNode.persona&&<div style={{ marginTop:"5px", background:"rgba(0,0,0,0.3)", borderRadius:"3px", padding:"3px 7px", color:col.accent, fontSize:"9px" }}>👤 {selectedNode.persona}</div>}
                    <div style={{ marginTop:"8px" }}><Btn sm onClick={()=>setEditNode({...selectedNode})}>✏ Editar nodo</Btn></div>
                  </div>
                  {problems.filter(p=>p.nodes.includes(selectedNode.id)).map(prob=>{
                    const ps=PS[prob.type];
                    return <div key={prob.id} style={{ background:"#0f1117", border:`1px solid ${ps.color}44`, borderLeft:`2px solid ${ps.color}`, borderRadius:"4px", padding:"5px 7px", marginBottom:"4px", cursor:"pointer" }} onClick={()=>setActiveProblems(ap=>ap.includes(prob.id)?ap:[...ap,prob.id])}>
                      <div style={{ color:ps.color, fontSize:"9px", fontWeight:"700" }}>{ps.icon} {prob.title}</div>
                    </div>;
                  })}
                  <div style={{ color:"#334155", fontSize:"8.5px", letterSpacing:"1px", margin:"8px 0 5px" }}>CONEXIONES ({connEdges.length})</div>
                  {connEdges.map(edge=>{
                    const other=nodes.find(n=>n.id===(edge.from===selected?edge.to:edge.from));
                    const dir=edge.from===selected?"→":"←"; const s=ES[edge.type];
                    return <div key={edge.id} style={{ display:"flex", gap:"5px", marginBottom:"4px", padding:"5px 6px", background:"#0f1117", borderRadius:"4px", borderLeft:`2px solid ${s.color}`, cursor:"pointer" }} onDoubleClick={()=>setEditEdge({...edge})}>
                      <span style={{ color:s.color, fontSize:"11px", fontWeight:"700" }}>{dir}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ color:"#cbd5e1", fontSize:"9px", fontWeight:"600" }}>{other?.label}</div>
                        <div style={{ color:"#475569", fontSize:"8px" }}>{edge.label}</div>
                        <div style={{ color:s.color, fontSize:"7.5px", opacity:0.8 }}>[{edge.type}]</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();setEditEdge({...edge});}} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:"10px" }}>✏</button>
                    </div>;
                  })}
                </div>
              );
            })()}
          </div>
          <div style={{ borderTop:"1px solid #1e293b", padding:"8px 11px" }}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
              {Object.entries(GC).map(([g,c])=>(
                <div key={g} style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                  <div style={{ width:"7px", height:"7px", borderRadius:"2px", background:c.accent }}/>
                  <span style={{ color:"#334155", fontSize:"8px" }}>{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ MODALS ══ */}

      {editNode&&(
        <Modal title={`Editar: ${editNode.label}`} onClose={()=>setEditNode(null)}>
          <Field label="NOMBRE" value={editNode.label} onChange={v=>setEditNode(n=>({...n,label:v.toUpperCase()}))}/>
          <Field label="DESCRIPCIÓN" value={editNode.sub} onChange={v=>setEditNode(n=>({...n,sub:v}))}/>
          <Field label="RESPONSABLE / PERSONA" value={editNode.persona||""} onChange={v=>setEditNode(n=>({...n,persona:v}))}/>
          <Field label="ÁREA" value={editNode.group} onChange={v=>setEditNode(n=>({...n,group:v}))} type="select" options={GROUPS}/>
          <label style={{ color:"#64748b", fontSize:"10px", display:"flex", alignItems:"center", gap:"7px", marginBottom:"14px", cursor:"pointer" }}>
            <input type="checkbox" checked={!!editNode.bottleneck} onChange={e=>setEditNode(n=>({...n,bottleneck:e.target.checked}))} style={{ accentColor:"#ef4444" }}/>
            ⚡ Marcar como cuello de botella
          </label>
          <div style={{ display:"flex", gap:"8px", justifyContent:"space-between" }}>
            <Btn color="#ef4444" onClick={()=>deleteNode(editNode.id)}>🗑 Eliminar nodo</Btn>
            <div style={{ display:"flex", gap:"6px" }}>
              <Btn color="#374151" onClick={()=>setEditNode(null)}>Cancelar</Btn>
              <Btn onClick={saveNode}>Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {addNodeM&&(
        <Modal title="Añadir nodo" onClose={()=>setAddNodeM(false)}>
          <Field label="NOMBRE" value={newNode.label} onChange={v=>setNewNode(n=>({...n,label:v.toUpperCase()}))}/>
          <Field label="DESCRIPCIÓN" value={newNode.sub} onChange={v=>setNewNode(n=>({...n,sub:v}))}/>
          <Field label="RESPONSABLE" value={newNode.persona} onChange={v=>setNewNode(n=>({...n,persona:v}))}/>
          <Field label="ÁREA" value={newNode.group} onChange={v=>setNewNode(n=>({...n,group:v}))} type="select" options={GROUPS}/>
          <div style={{ display:"flex", gap:"6px", justifyContent:"flex-end" }}>
            <Btn color="#374151" onClick={()=>setAddNodeM(false)}>Cancelar</Btn>
            <Btn onClick={addNode}>Añadir</Btn>
          </div>
        </Modal>
      )}

      {activeDraft&&(
        <Modal title={activeDraft._new?"Nueva conexión":"Editar conexión"} onClose={()=>{ setEditEdge(null); setEditEdgeDraft(null); }}>
          <div style={{ background:"#1e293b", borderRadius:"5px", padding:"8px 11px", marginBottom:"12px", fontSize:"10px", color:"#94a3b8" }}>
            <span style={{ color:"#60a5fa" }}>{nodes.find(n=>n.id===activeDraft.from)?.label}</span>
            <span style={{ margin:"0 8px" }}>→</span>
            <span style={{ color:"#60a5fa" }}>{nodes.find(n=>n.id===activeDraft.to)?.label}</span>
          </div>
          <Field label="ETIQUETA" value={activeDraft.label} onChange={v=>activeDraft._new?setEditEdgeDraft(e=>({...e,label:v})):setEditEdge(e=>({...e,label:v}))}/>
          <Field label="TIPO" value={activeDraft.type} onChange={v=>activeDraft._new?setEditEdgeDraft(e=>({...e,type:v})):setEditEdge(e=>({...e,type:v}))} type="select" options={EDGE_TYPES}/>
          <div style={{ background:"#1e293b", borderRadius:"4px", padding:"7px 10px", marginBottom:"12px", display:"flex", gap:"8px", alignItems:"center" }}>
            <svg width="30" height="10"><line x1="0" y1="5" x2="30" y2="5" stroke={(ES[activeDraft.type]||ES.main).color} strokeWidth={(ES[activeDraft.type]||ES.main).width} strokeDasharray={(ES[activeDraft.type]||ES.main).dash==="none"?"":(ES[activeDraft.type]||ES.main).dash}/></svg>
            <span style={{ color:"#64748b", fontSize:"9px" }}>Vista previa</span>
          </div>
          <div style={{ display:"flex", gap:"8px", justifyContent:"space-between" }}>
            {!activeDraft._new&&<Btn color="#ef4444" onClick={()=>deleteEdge(activeDraft.id)}>🗑 Eliminar</Btn>}
            <div style={{ display:"flex", gap:"6px", marginLeft:"auto" }}>
              <Btn color="#374151" onClick={()=>{ setEditEdge(null); setEditEdgeDraft(null); }}>Cancelar</Btn>
              <Btn onClick={()=>saveEdge(activeDraft)}>Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {editProblem&&(
        <Modal title={editProblem._new?"Nuevo problema":"Editar problema"} onClose={()=>setEditProblem(null)}>
          <Field label="TÍTULO" value={editProblem.title} onChange={v=>setEditProblem(p=>({...p,title:v}))}/>
          <Field label="TIPO" value={editProblem.type} onChange={v=>setEditProblem(p=>({...p,type:v}))} type="select" options={PROB_TYPES}/>
          <Field label="DESCRIPCIÓN" value={editProblem.desc} onChange={v=>setEditProblem(p=>({...p,desc:v}))} type="textarea"/>
          <div style={{ marginBottom:"12px" }}>
            <div style={{ color:"#64748b", fontSize:"10px", letterSpacing:"1px", marginBottom:"6px" }}>NODOS AFECTADOS</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
              {nodes.map(n=>{
                const sel=editProblem.nodes.includes(n.id); const col=GC[n.group]||GC.sistema;
                return <button key={n.id} onClick={()=>setEditProblem(p=>({...p,nodes:sel?p.nodes.filter(x=>x!==n.id):[...p.nodes,n.id]}))} style={{ background:sel?col.bg:"#1e293b", border:`1px solid ${sel?col.accent:"#334155"}`, color:sel?"#fff":"#64748b", padding:"3px 8px", borderRadius:"3px", fontSize:"9px", cursor:"pointer", fontFamily:"inherit" }}>{n.label}</button>;
              })}
            </div>
          </div>
          <div style={{ display:"flex", gap:"8px", justifyContent:"space-between" }}>
            {!editProblem._new&&<Btn color="#ef4444" onClick={()=>deleteProblem(editProblem.id)}>🗑 Eliminar</Btn>}
            <div style={{ display:"flex", gap:"6px", marginLeft:"auto" }}>
              <Btn color="#374151" onClick={()=>setEditProblem(null)}>Cancelar</Btn>
              <Btn onClick={()=>saveProblem(editProblem)}>Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {addProblemM&&(
        <Modal title="Añadir problema" onClose={()=>setAddProblemM(false)}>
          <Field label="TÍTULO" value={newProblem.title} onChange={v=>setNewProblem(p=>({...p,title:v}))}/>
          <Field label="TIPO" value={newProblem.type} onChange={v=>setNewProblem(p=>({...p,type:v}))} type="select" options={PROB_TYPES}/>
          <Field label="DESCRIPCIÓN" value={newProblem.desc} onChange={v=>setNewProblem(p=>({...p,desc:v}))} type="textarea"/>
          <div style={{ marginBottom:"12px" }}>
            <div style={{ color:"#64748b", fontSize:"10px", letterSpacing:"1px", marginBottom:"6px" }}>NODOS AFECTADOS</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
              {nodes.map(n=>{
                const sel=newProblem.nodes.includes(n.id); const col=GC[n.group]||GC.sistema;
                return <button key={n.id} onClick={()=>setNewProblem(p=>({...p,nodes:sel?p.nodes.filter(x=>x!==n.id):[...p.nodes,n.id]}))} style={{ background:sel?col.bg:"#1e293b", border:`1px solid ${sel?col.accent:"#334155"}`, color:sel?"#fff":"#64748b", padding:"3px 8px", borderRadius:"3px", fontSize:"9px", cursor:"pointer", fontFamily:"inherit" }}>{n.label}</button>;
              })}
            </div>
          </div>
          <div style={{ display:"flex", gap:"6px", justifyContent:"flex-end" }}>
            <Btn color="#374151" onClick={()=>setAddProblemM(false)}>Cancelar</Btn>
            <Btn onClick={addProblem}>Añadir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
