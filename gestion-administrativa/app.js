// ============================================================================
// INTEGRACIÓN SUPABASE - PANEL ADMINISTRATIVO DE PAGOS (UEI SAN ANTONIO)
// Archivo: app.js (Bloque completo listo para copiar y pegar)
// ============================================================================

const SUPABASE_CONFIG = {
  url: "https://lnluwygaehlqsdpwouvv.supabase.co",
  anonKey: "sb_publishable_i7qcIcbkjSjZkqjVSt-jUA_ZR7RQlTA",
  tableName: "pagos",
};

/**
 * Construye los encabezados estándar para peticiones REST hacia Supabase.
 * @returns {Object} Headers HTTP
 */
function obtenerHeadersSupabase() {
  return {
    "apikey": SUPABASE_CONFIG.anonKey,
   "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };
}

/**
 * Normaliza un registro crudo proveniente de Supabase para que coincida
 * con los campos esperados por la interfaz del panel administrativo.
 * @param {Object} registro
 * @returns {Object} Registro normalizado
 */
function normalizarRegistroPago(registro = {}) {
  const montoUsd = Number(registro.monto_usd ?? registro.montoUsd ?? registro.monto ?? 0);
  const tasaBcv = Number(registro.tasa_bcv ?? registro.tasaBcv ?? 1);
  const montoBs = Number(
    registro.monto_bs ??
    registro.montoBs ??
    (Number.isFinite(montoUsd) && Number.isFinite(tasaBcv) ? montoUsd * tasaBcv : 0)
  );

  return {
    id: registro.id ?? registro.uuid ?? registro.codigo ?? "",
    alumno: registro.alumno ?? registro.nombre_alumno ?? registro.estudiante ?? "Sin nombre",
    cedula: registro.cedula ?? registro.documento ?? "",
    grado: registro.grado ?? registro.curso ?? registro.ano ?? "",
    seccion: registro.seccion ?? "",
    representante: registro.representante ?? registro.responsable ?? "",
    telefono: registro.telefono ?? registro.whatsapp ?? "",
    concepto: registro.concepto ?? registro.mes ?? registro.descripcion ?? "Mensualidad",
    metodoPago: registro.metodo_pago ?? registro.metodoPago ?? registro.metodo ?? "",
    referencia: registro.referencia ?? registro.comprobante ?? "",
    montoUsd: Number.isFinite(montoUsd) ? montoUsd : 0,
    montoBs: Number.isFinite(montoBs) ? montoBs : 0,
    tasaBcv: Number.isFinite(tasaBcv) ? tasaBcv : 1,
    estado: (registro.estado ?? "pendiente").toString().toLowerCase().trim(),
    fecha: registro.fecha ?? registro.created_at ?? new Date().toISOString(),
    raw: registro
  };
}

/**
 * Consulta y normaliza todos los pagos almacenados en Supabase.
 * @param {Object} [filtros={}]
 * @returns {Promise<Array<Object>>} Lista de pagos normalizados
 */
async function cargarPagosAdminSupabase(filtros = {}) {
  try {
    if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === "TU_SUPABASE_URL") {
      throw new Error("Configura SUPABASE_CONFIG.url antes de cargar los pagos.");
    }
    if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey === "TU_SUPABASE_ANON_KEY") {
      throw new Error("Configura SUPABASE_CONFIG.anonKey antes de cargar los pagos.");
    }

    const params = new URLSearchParams();
    params.set("select", "*");
    params.set("order", "created_at.desc");

    if (filtros.estado && filtros.estado.toLowerCase() !== "todos") {
      params.set("estado", `eq.${filtros.estado.toLowerCase().trim()}`);
    }

    const endpoint = `${SUPABASE_CONFIG.url.replace(/\/+$/, "")}/rest/v1/${SUPABASE_CONFIG.tableName}?${params.toString()}`;
    const respuesta = await fetch(endpoint, {
      method: "GET",
      headers: obtenerHeadersSupabase()
    });

    if (!respuesta.ok) {
      const detalleError = await respuesta.text();
      throw new Error(`Error al consultar Supabase (${respuesta.status}): ${detalleError}`);
    }

    const datos = await respuesta.json();
    const listaNormalizada = Array.isArray(datos)
      ? datos.map((item) => normalizarRegistroPago(item))
      : [];

    guardarCacheLocalPagos(listaNormalizada);
    return listaNormalizada;
  } catch (error) {
    console.error("[cargarPagosAdminSupabase]", error);
    return obtenerCacheLocalPagos();
  }
}

/**
 * Actualiza el estado de un pago (por ejemplo: 'aprobado', 'rechazado', 'pendiente')
 * directamente en Supabase.
 * @param {string|number} pagoId
 * @param {string} nuevoEstado
 * @param {string} [observacion=""]
 * @returns {Promise<Object>} Registro actualizado normalizado
 */
async function actualizarEstadoPagoSupabase(pagoId, nuevoEstado, observacion = "") {
  if (!pagoId) {
    throw new Error("Se requiere el ID del pago para actualizar su estado.");
  }

  const estadoLimpio = String(nuevoEstado || "").toLowerCase().trim();
  if (!estadoLimpio) {
    throw new Error("El nuevo estado del pago no es válido.");
  }

  const params = new URLSearchParams();
  params.set("id", `eq.${encodeURIComponent(pagoId)}`);

  const endpoint = `${SUPABASE_CONFIG.url.replace(/\/+$/, "")}/rest/v1/${SUPABASE_CONFIG.tableName}?${params.toString()}`;
  const cuerpo = {
    estado: estadoLimpio,
    updated_at: new Date().toISOString()
  };

  if (observacion) {
    cuerpo.observacion = observacion;
  }

  const respuesta = await fetch(endpoint, {
    method: "PATCH",
    headers: obtenerHeadersSupabase(),
    body: JSON.stringify(cuerpo)
  });

  if (!respuesta.ok) {
    const detalleError = await respuesta.text();
    throw new Error(`Error al actualizar estado en Supabase (${respuesta.status}): ${detalleError}`);
  }

  const actualizado = await respuesta.json();
  const registroActualizado = Array.isArray(actualizado) && actualizado.length > 0
    ? normalizarRegistroPago(actualizado[0])
    : normalizarRegistroPago({ id: pagoId, estado: estadoLimpio, observacion });

  actualizarCacheLocalEstado(pagoId, estadoLimpio, observacion);
  return registroActualizado;
}

/**
 * Registra un nuevo pago en Supabase (útil si el panel también crea registros).
 * @param {Object} datosPago
 * @returns {Promise<Object>} Registro creado normalizado
 */
async function crearPagoSupabase(datosPago = {}) {
  const endpoint = `${SUPABASE_CONFIG.url.replace(/\/+$/, "")}/rest/v1/${SUPABASE_CONFIG.tableName}`;
  const payload = {
    alumno: datosPago.alumno ?? "",
    cedula: datosPago.cedula ?? "",
    grado: datosPago.grado ?? "",
    seccion: datosPago.seccion ?? "",
    representante: datosPago.representante ?? "",
    telefono: datosPago.telefono ?? "",
    concepto: datosPago.concepto ?? "Mensualidad",
    metodo_pago: datosPago.metodoPago ?? datosPago.metodo_pago ?? "",
    referencia: datosPago.referencia ?? "",
    monto_usd: Number(datosPago.montoUsd ?? datosPago.monto_usd ?? 0),
    monto_bs: Number(datosPago.montoBs ?? datosPago.monto_bs ?? 0),
    tasa_bcv: Number(datosPago.tasaBcv ?? datosPago.tasa_bcv ?? 1),
    estado: (datosPago.estado ?? "pendiente").toLowerCase().trim()
  };

  const respuesta = await fetch(endpoint, {
    method: "POST",
    headers: obtenerHeadersSupabase(),
    body: JSON.stringify(payload)
  });

  if (!respuesta.ok) {
    const detalleError = await respuesta.text();
    throw new Error(`Error al crear pago en Supabase (${respuesta.status}): ${detalleError}`);
  }

  const creado = await respuesta.json();
  return Array.isArray(creado) && creado.length > 0
    ? normalizarRegistroPago(creado[0])
    : normalizarRegistroPago(payload);
}

/**
 * Guarda una copia de respaldo en localStorage por si falla la red o el suministro eléctrico.
 * @param {Array<Object>} listaPagos
 */
function guardarCacheLocalPagos(listaPagos) {
  try {
    localStorage.setItem("cache_pagos_admin_supabase", JSON.stringify(listaPagos));
  } catch (err) {
    console.warn("[guardarCacheLocalPagos] No se pudo guardar en localStorage:", err);
  }
}

/**
 * Recupera la copia de respaldo guardada en localStorage.
 * @returns {Array<Object>}
 */
function obtenerCacheLocalPagos() {
  try {
    const raw = localStorage.getItem("cache_pagos_admin_supabase");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((item) => normalizarRegistroPago(item)) : [];
  } catch (err) {
    console.warn("[obtenerCacheLocalPagos] No se pudo leer localStorage:", err);
    return [];
  }
}

/**
 * Actualiza el estado en el caché local tras aprobar o rechazar un pago.
 * @param {string|number} pagoId
 * @param {string} nuevoEstado
 * @param {string} observacion
 */
function actualizarCacheLocalEstado(pagoId, nuevoEstado, observacion = "") {
  const actual = obtenerCacheLocalPagos();
  const modificada = actual.map((item) => {
    if (String(item.id) === String(pagoId)) {
      return {
        ...item,
        estado: nuevoEstado,
        observacion: observacion || item.observacion
      };
    }
    return item;
  });
  guardarCacheLocalPagos(modificada);
}

/**
 * Calcula totales resumidos (aprobados, pendientes, rechazados y montos).
 * @param {Array<Object>} pagos
 * @returns {Object} Resumen de métricas
 */
function calcularResumenPagos(pagos = []) {
  return pagos.reduce(
    (acc, pago) => {
      const estado = (pago.estado || "pendiente").toLowerCase();
      const usd = Number(pago.montoUsd) || 0;
      const bs = Number(pago.montoBs) || 0;

      acc.totalRegistros += 1;
      acc.totalUsd += usd;
      acc.totalBs += bs;

      if (estado === "aprobado") {
        acc.aprobadosCount += 1;
        acc.aprobadosUsd += usd;
        acc.aprobadosBs += bs;
      } else if (estado === "rechazado") {
        acc.rechazadosCount += 1;
        acc.rechazadosUsd += usd;
        acc.rechazadosBs += bs;
      } else {
        acc.pendientesCount += 1;
        acc.pendientesUsd += usd;
        acc.pendientesBs += bs;
      }

      return acc;
    },
    {
      totalRegistros: 0,
      aprobadosCount: 0,
      pendientesCount: 0,
      rechazadosCount: 0,
      totalUsd: 0,
      aprobadosUsd: 0,
      pendientesUsd: 0,
      rechazadosUsd: 0,
      totalBs: 0,
      aprobadosBs: 0,
      pendientesBs: 0,
      rechazadosBs: 0
    }
  );
}

/**
 * Inicializa el panel administrativo y conecta los eventos principales.
 * @param {Object} [opciones={}]
 */
async function inicializarPanelPagosSupabase(opciones = {}) {
  const {
    onRender,
    onResumen,
    onError,
    estadoInicial = "todos"
  } = opciones;

  try {
    const pagos = await cargarPagosAdminSupabase({ estado: estadoInicial });
    if (typeof onRender === "function") {
      onRender(pagos);
    }
    if (typeof onResumen === "function") {
      onResumen(calcularResumenPagos(pagos));
    }
    return pagos;
  } catch (error) {
    console.error("[inicializarPanelPagosSupabase]", error);
    if (typeof onError === "function") {
      onError(error);
    }
    return [];
  }
}

// Exposición global por si el HTML invoca funciones directamente desde atributos onclick
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.cargarPagosAdminSupabase = cargarPagosAdminSupabase;
window.actualizarEstadoPagoSupabase = actualizarEstadoPagoSupabase;
window.crearPagoSupabase = crearPagoSupabase;
window.normalizarRegistroPago = normalizarRegistroPago;
window.calcularResumenPagos = calcularResumenPagos;
window.inicializarPanelPagosSupabase = inicializarPanelPagosSupabase;
