const CONFIG_TASA_BCV = {
  moneda: "USD",
  tasaInicial: 919.8227,
  fechaInicial: "2026-11-24",
  storageKey: "uei_tasa_bcv_usd_v1",
  timeoutMs: 2500,
  endpoints: [
    "https://ve.dolarapi.com/v1/dolares/oficial",
    "https://pydolarve.org/api/v1/dollar?page=bcv"
  ]
};

function obtenerFechaHoyISO() {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, "0");
  const d = String(ahora.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function leerTasaGuardadaSegura() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_TASA_BCV.storageKey) || "null");
  } catch (_) {
    return null;
  }
}

function guardarTasaSegura(objetoTasa) {
  try {
    localStorage.setItem(CONFIG_TASA_BCV.storageKey, JSON.stringify(objetoTasa));
  } catch (_) {}
}

function extraerTasaDesdeRespuesta(data) {
  if (!data || typeof data !== "object") return null;
  const candidatos = [
    data.promedio,
    data.price,
    data.valor,
    data.monitors?.bcv?.price,
    data.data?.price
  ];
  for (const val of candidatos) {
    const num = Number(val);
    if (Number.isFinite(num) && num > 0) {
      return Number(num.toFixed(4));
    }
  }
  return null;
}

async function fetchConTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function obtenerTasaInmediata() {
  const hoy = obtenerFechaHoyISO();
  const guardada = leerTasaGuardadaSegura();

  if (hoy <= CONFIG_TASA_BCV.fechaInicial) {
    return {
      tasa: CONFIG_TASA_BCV.tasaInicial,
      fechaValor: CONFIG_TASA_BCV.fechaInicial,
      fechaConsulta: hoy,
      origen: "Tasa Inicial Fijada (24-11-2026)"
    };
  }

  if (guardada && Number(guardada.tasa) > 0) {
    return {
      tasa: Number(guardada.tasa),
      fechaValor: guardada.fechaValor || CONFIG_TASA_BCV.fechaInicial,
      fechaConsulta: guardada.fechaConsulta || hoy,
      origen: guardada.fechaConsulta === hoy
        ? (guardada.origen || "Actualizada Hoy")
        : "Última Tasa Guardada (Verificando hoy...)"
    };
  }

  return {
    tasa: CONFIG_TASA_BCV.tasaInicial,
    fechaValor: CONFIG_TASA_BCV.fechaInicial,
    fechaConsulta: hoy,
    origen: "Base Inicial 24-11-2026 (Verificando hoy...)"
  };
}

async function obtenerTasaUSDActual() {
  const hoy = obtenerFechaHoyISO();
  const guardada = leerTasaGuardadaSegura();

  if (hoy <= CONFIG_TASA_BCV.fechaInicial) {
    const baseInicial = {
      tasa: CONFIG_TASA_BCV.tasaInicial,
      fechaValor: CONFIG_TASA_BCV.fechaInicial,
      fechaConsulta: hoy,
      origen: "Tasa Inicial Fijada (24-11-2026)"
    };
    guardarTasaSegura(baseInicial);
    return baseInicial;
  }

  if (guardada && guardada.fechaConsulta === hoy && Number(guardada.tasa) > 0) {
    return guardada;
  }

  for (const url of CONFIG_TASA_BCV.endpoints) {
    const json = await fetchConTimeout(url, CONFIG_TASA_BCV.timeoutMs);
    const tasaApi = extraerTasaDesdeRespuesta(json);
    if (tasaApi) {
      const actualizada = {
        tasa: tasaApi,
        fechaValor: hoy,
        fechaConsulta: hoy,
        origen: "Actualización Automática BCV"
      };
      guardarTasaSegura(actualizada);
      return actualizada;
    }
  }

  return {
    tasa: guardada && Number(guardada.tasa) > 0 ? Number(guardada.tasa) : CONFIG_TASA_BCV.tasaInicial,
    fechaValor: guardada?.fechaValor || CONFIG_TASA_BCV.fechaInicial,
    fechaConsulta: hoy,
    origen: guardada ? "Respaldo Local Guardado" : "Respaldo Tasa Inicial (24-11-2026)"
  };
}