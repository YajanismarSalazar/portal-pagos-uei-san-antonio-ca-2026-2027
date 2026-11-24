(function () {
  "use strict";

  const SUPABASE_CONFIG = {
    url: "https://lnluwygaehlqsdpwouvv.supabase.co",
    anonKey: "sb_publishable_i7qcIcbkjSjZkqjVSt-jUA_ZR7RQlTA",
    tableName: "pagos"
  };

  const CLAVE_PAGOS_REP = "pagos_representantes_v1";
  const CLAVES_PAGOS_POSIBLES = [
    "pagos_representantes_v1",
    "pagos_registrados_v1",
    "pagos_registrados",
    "historial_pagos_v1",
    "historial_pagos",
    "pagos_portal_v1",
    "pagos_uei_san_antonio"
  ];
  const CLAVE_ESTADOS_MESES_ALU = "estados_meses_alumnos_v1";
  const CLAVE_REGISTROS_ALU = "registros_alumnos_v1";
  const CLAVE_CACHE_PAGOS_SB = "cache_pagos_admin_supabase";

  const MESES_ESCOLARES = [
    { key: "SEPTIEMBRE", label: "Septiembre 2026", year: 2026, month: 9 },
    { key: "OCTUBRE",    label: "Octubre 2026",    year: 2026, month: 10 },
    { key: "NOVIEMBRE",  label: "Noviembre 2026",  year: 2026, month: 11 },
    { key: "DICIEMBRE",  label: "Diciembre 2026",  year: 2026, month: 12 },
    { key: "ENERO",      label: "Enero 2027",      year: 2027, month: 1 },
    { key: "FEBRERO",    label: "Febrero 2027",    year: 2027, month: 2 },
    { key: "MARZO",      label: "Marzo 2027",      year: 2027, month: 3 },
    { key: "ABRIL",      label: "Abril 2027",      year: 2027, month: 4 },
    { key: "MAYO",       label: "Mayo 2027",       year: 2027, month: 5 },
    { key: "JUNIO",      label: "Junio 2027",      year: 2027, month: 6 },
    { key: "JULIO",      label: "Julio 2027",      year: 2027, month: 7 },
    { key: "AGOSTO",     label: "Agosto 2027",     year: 2027, month: 8 }
  ];

  const INITIAL_REGISTROS = [
    {"seccion": "1A", "ced": "R-2024595", "alumno": "RIVAS CORREA, ALBERTH JESUS", "sexo": "M", "f_nac": "27/8/2014", "ced_rep": "V-15477349", "representante": "RIVAS VASQUEZ, AMABLE DE JESUS", "telefonos": "04264607958", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36152572", "alumno": "PALACIO PEREZ, KAMILA ALEJANDRA", "sexo": "F", "f_nac": "2/7/2014", "ced_rep": "V-26330201", "representante": "PEREZ BELTRAN, CARMEN TERESA", "telefonos": "04164038412 - 04249042951", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36310061", "alumno": "VILLANUEVA HARO, CARLOS MANUEL", "sexo": "M", "f_nac": "14/10/2014", "ced_rep": "V-15688614", "representante": "HARO DE VILLANUEVA, KARLA ROSMAT DEL VALLE", "telefonos": "04124992061", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36406560", "alumno": "BERENGUEL FLORES, MARCEL ALEXANDER", "sexo": "M", "f_nac": "4/4/2014", "ced_rep": "V-17069755", "representante": "FLORES PIZARRO, YENNIELYS CAROLINA", "telefonos": "04249664024", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36513473", "alumno": "LIMAYMANTA GONZALEZ, JOSUE NAHIL", "sexo": "M", "f_nac": "29/3/2015", "ced_rep": "V-27182387", "representante": "GONZALEZ ORTIZ, ESTHEFANIA MAYDARLYN", "telefonos": "04242610327", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36717037", "alumno": "MACUARISMA ARO, SANTIAGO JOSE", "sexo": "M", "f_nac": "2/12/2014", "ced_rep": "V-15476248", "representante": "ARO GUEVARA, YURILMA DEL VALLE", "telefonos": "04143020879", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36722202", "alumno": "GUEVARA LANDA, ARIANA PAOLA", "sexo": "F", "f_nac": "31/3/2015", "ced_rep": "V-20884291", "representante": "GUEVARA VERA, REINALDO RAMCES", "telefonos": "04249433772", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36830471", "alumno": "DIAZ ZAMORA, JOSUANGEL GABRIELA", "sexo": "F", "f_nac": "1/11/2014", "ced_rep": "V-25777024", "representante": "ZAMORA MATA, DANIELA DE LOS ANGELES", "telefonos": "04121941513", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36837264", "alumno": "CARDENAS RENDON, DEIBIS ANDRES", "sexo": "M", "f_nac": "15/5/2013", "ced_rep": "V-25777881", "representante": "RENDON MAYORGA, MARIANNY JOSEFINA", "telefonos": "04123953231", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36840816", "alumno": "REQUENA SUAREZ, KIARA VALENTINA", "sexo": "F", "f_nac": "15/11/2014", "ced_rep": "V-25003050", "representante": "SUAREZ GUZMAN, JANNIRE FRANCESCA", "telefonos": "04149885657", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36869655", "alumno": "SÁNCHEZ RIVAS, ALI JOSUÉ", "sexo": "M", "f_nac": "23/2/2015", "ced_rep": "V-26330017", "representante": "RIVAS PADILLA, NORELYS CAROLINA", "telefonos": "04124635743", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-36904023", "alumno": "GRUMEITE JAMESSON, GEORGINA NAZARET", "sexo": "F", "f_nac": "21/1/2015", "ced_rep": "V-19905345", "representante": "JAMESSON MONTILLA, MISLEIDI NAZARETH", "telefonos": "04165867891", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-37037851", "alumno": "SAVINO FLORES, SABRINA DE LOS ANGELES", "sexo": "F", "f_nac": "27/10/2014", "ced_rep": "V-25003766", "representante": "FLORES FERNANDEZ, MAYRIMAR DE LOS ANGELES", "telefonos": "04122923422", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-37059654", "alumno": "MARTINEZ JARAMILLO, ISABELLA VALENTINA", "sexo": "F", "f_nac": "9/7/2014", "ced_rep": "V-9949618", "representante": "CARRASCO, MIGUELINA DEL CARMEN", "telefonos": "04129263856", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-37131708", "alumno": "MORILLO FRESCA, LUIS ALEJANDRO", "sexo": "M", "f_nac": "18/3/2015", "ced_rep": "V-26829630", "representante": "FRESCA GARCIA, ANA GABRIELA", "telefonos": "04242184350", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-37133410", "alumno": "SILVEIRA GUZMAN, ENMANUEL JOSE", "sexo": "M", "f_nac": "19/9/2014", "ced_rep": "V-26098914", "representante": "GUZMAN SOLANO, YURIANNYS ELENA", "telefonos": "04121666142", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-37178113", "alumno": "CORDERO MARCO, MARICERT JEHUDY", "sexo": "F", "f_nac": "6/2/2015", "ced_rep": "V-17878445", "representante": "MARCO CALZADILLA, MARIS ELIENNY", "telefonos": "04148814371", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-37284413", "alumno": "GARCIA BOCOURT, ENMANUEL JOSE", "sexo": "M", "f_nac": "21/5/2014", "ced_rep": "V-20928854", "representante": "BOCOURT MEDINA, DARYURIS NAYIBE", "telefonos": "04124035825", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-37609755", "alumno": "RIVERO MACHADO, YEIZIMAR SUJEY", "sexo": "F", "f_nac": "6/2/2015", "ced_rep": "V-26098712", "representante": "MACHADO RONDON, KAIRU MAR", "telefonos": "04121116997", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-37669015", "alumno": "MARCO RODRIGUEZ, YUBIANA VICTORIA", "sexo": "F", "f_nac": "13/6/2014", "ced_rep": "V-18960682", "representante": "RODRIGUEZ RONDON, YUBIRI JOSEFINA", "telefonos": "04249520235", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-37821938", "alumno": "CORDERO BERMUDEZ, VALERIA MILANYELA", "sexo": "F", "f_nac": "7/7/2014", "ced_rep": "V-25085294", "representante": "BERMUDEZ LOPEZ, ANYELINA CAROLINA", "telefonos": "04264892849", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PAGO", "NOVIEMBRE": "PAGO", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"},
    {"seccion": "1A", "ced": "V-37823894", "alumno": "ZAPATA MUÑOZ, YEFERZON DANIEL", "sexo": "M", "f_nac": "19/12/2014", "ced_rep": "V-24701635", "representante": "MUÑOZ ASCANIO, YESSI CAROLINA", "telefonos": "04123879962", "INSC": "PAGO", "SEPTIEMBRE": "PAGO", "OCTUBRE": "PENDIENTE", "NOVIEMBRE": "PENDIENTE", "DICIEMBRE": "PENDIENTE", "ENERO": "PENDIENTE", "FEBRERO": "PENDIENTE", "MARZO": "PENDIENTE", "ABRIL": "PENDIENTE", "MAYO": "PENDIENTE", "JUNIO": "PENDIENTE", "JULIO": "PENDIENTE", "AGOSTO": "PENDIENTE"}
  ];

  function normalizarTexto(val) {
    return String(val || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();
  }

  function formatearCedula(valor) {
    const limpio = String(valor || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
    if (!limpio) return "";
    const match = limpio.match(/^([VEJRP])[-.\s]*([0-9A-Z]+)$/);
    if (match) return `${match[1]}-${match[2]}`;
    return limpio;
  }

  function soloDigitosCedula(val) {
    return String(val || "")
      .trim()
      .toUpperCase()
      .replace(/^[VEJRP][-\s.]*/i, "")
      .replace(/[^0-9]/g, "");
  }

  function normalizarCedula(val) {
    return soloDigitosCedula(val);
  }

  function completarTelefonosIncompletos(valorTelefonos) {
    const texto = String(valorTelefonos || "");
    if (!texto.trim()) return "";
    return texto.replace(/\b0\d{5,9}\b/g, (bloque) =>
      bloque.length < 11 ? bloque.padEnd(11, "0") : bloque
    );
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizarRegistroAlumno(raw) {
    const copia = Object.assign({}, raw);
    copia.seccion = String(copia.seccion || "").trim().toUpperCase();
    copia.ced = formatearCedula(copia.ced);
    copia.ced_rep = formatearCedula(copia.ced_rep);
    copia.alumno = String(copia.alumno || "").trim();
    copia.representante = String(copia.representante || "").trim();
    copia.telefonos = completarTelefonosIncompletos(copia.telefonos);
    copia.INSC = copia.INSC ? String(copia.INSC).trim().toUpperCase() : "PENDIENTE";
    MESES_ESCOLARES.forEach((m) => {
      copia[m.key] = copia[m.key] ? String(copia[m.key]).trim().toUpperCase() : "PENDIENTE";
    });
    return copia;
  }

  function guardarRegistrosStorage(lista) {
    try {
      const saneados = Array.isArray(lista) ? lista.map(sanitizarRegistroAlumno) : [];
      localStorage.setItem(CLAVE_REGISTROS_ALU, JSON.stringify(saneados));
    } catch {
      // Ignorar error de cuota
    }
  }

  function cargarRegistrosIniciales() {
    try {
      const raw = JSON.parse(localStorage.getItem(CLAVE_REGISTROS_ALU) || "null");
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map(sanitizarRegistroAlumno);
      }
    } catch {
      // Usar padrón base
    }
    const base = INITIAL_REGISTROS.map(sanitizarRegistroAlumno);
    guardarRegistrosStorage(base);
    return base;
  }

  let registros = cargarRegistrosIniciales();
  let historialPagos = [];
  let ultimaFirmaStorage = "";

  function obtenerHeadersSupabase() {
    return {
      "apikey": SUPABASE_CONFIG.anonKey,
      "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  }

  function guardarCacheSupabase(lista) {
    try {
      localStorage.setItem(CLAVE_CACHE_PAGOS_SB, JSON.stringify(lista));
    } catch {
      // Ignorar error de cuota
    }
  }

  function leerCacheSupabase() {
    try {
      const raw = localStorage.getItem(CLAVE_CACHE_PAGOS_SB);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function mapearEstadoDesdePortal(estadoTexto) {
    const e = normalizarTexto(estadoTexto);
    if (e.includes("APROB") || e === "PAGO" || e === "PAGADO") return "aprobado";
    if (e.includes("RECHAZ")) return "rechazado";
    return "revision";
  }

  function mapearEstadoHaciaPortal(estadoAdmin) {
    if (estadoAdmin === "aprobado") return "Aprobado";
    if (estadoAdmin === "rechazado") return "Rechazado";
    return "En revisión";
  }

  function extraerMesesDeConcepto(concepto) {
    const texto = normalizarTexto(concepto);
    return MESES_ESCOLARES
      .filter((m) => texto.includes(m.key))
      .map((m) => m.label);
  }

  function encontrarAlumnoPorPago(pago) {
    const digAlu = soloDigitosCedula(pago?.alumnoCedula || pago?.ced || pago?.cedula_alumno);
    const digRep = soloDigitosCedula(pago?.representanteCedula || pago?.ced_rep || pago?.cedula_representante);
    const nomPago = normalizarTexto(pago?.alumno);
    const repPago = normalizarTexto(pago?.representante);
    const secPago = normalizarTexto(pago?.seccion);

    if (digAlu) {
      const porCedAlu = registros.find((r) => soloDigitosCedula(r.ced) === digAlu);
      if (porCedAlu) return porCedAlu;
    }

    if (nomPago) {
      if (secPago) {
        const porNomSec = registros.find(
          (r) => normalizarTexto(r.alumno) === nomPago && normalizarTexto(r.seccion) === secPago
        );
        if (porNomSec) return porNomSec;
      }
      const porNom = registros.find((r) => normalizarTexto(r.alumno) === nomPago);
      if (porNom) return porNom;
    }

    if (digRep) {
      const porCedRep = registros.find((r) => soloDigitosCedula(r.ced_rep) === digRep);
      if (porCedRep) return porCedRep;
    }

    if (repPago) {
      const porRep = registros.find((r) => normalizarTexto(r.representante) === repPago);
      if (porRep) return porRep;
    }

    return null;
  }

  function normalizarPagoCrudo(item, index = 0) {
    const fechaBase = item.fechaLegible
      ? String(item.fechaLegible).split(",")[0]
      : (item.fechaRegistro
        ? String(item.fechaRegistro).slice(0, 10)
        : (item.fecha
          ? String(item.fecha).slice(0, 10)
          : (item.created_at ? String(item.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10))));

    const montoCandidato =
      item.pago?.montoUsd ??
      item.pago?.monto ??
      item.monto_usd ??
      item.montoUsd ??
      item.monto ??
      item.monto_bs ??
      0;

    const montoNum = Number(String(montoCandidato ?? "").replace(/[^0-9.,-]/g, "").replace(",", "."));
    const montoTexto = Number.isFinite(montoNum) && montoNum > 0
      ? `$${montoNum.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : (typeof montoCandidato === "string" && montoCandidato.trim() ? montoCandidato.trim() : "$0,00");

    const estadoAdmin = mapearEstadoDesdePortal(item.estado || item.pago?.estado);
    const conceptoTexto = item.pago?.concepto || item.concepto || item.meses || item.mes || item.descripcion || "Mensualidad";
    const mesesPagados = Array.isArray(item.mesesPagados) && item.mesesPagados.length > 0
      ? item.mesesPagados
      : extraerMesesDeConcepto(conceptoTexto);

    const alumnoNombreRaw = typeof item.alumno === "string"
      ? item.alumno
      : (item.alumno?.nombreApellido || item.nombre_alumno || item.nombreAlumno || item.estudiante || "");
    const alumnoCedulaRaw = typeof item.alumno === "object"
      ? (item.alumno?.cedula || item.alumno?.ced || "")
      : (item.cedula_alumno || item.alumnoCedula || item.cedulaAlumno || item.ced || "");
    const seccionRaw = typeof item.alumno === "object"
      ? (item.alumno?.gradoSeccion || item.alumno?.seccion || "")
      : (item.seccion || item.gradoSeccion || item.grado || "");
    const repNombreRaw = typeof item.representante === "string"
      ? item.representante
      : (item.representante?.nombreApellido || item.nombre_representante || item.nombreRepresentante || "");
    const repCedulaRaw = typeof item.representante === "object"
      ? (item.representante?.cedula || item.representante?.ced_rep || "")
      : (item.cedula_representante || item.representanteCedula || item.cedulaRepresentante || item.ced_rep || "");

    const pagoNormalizado = {
      id: item.id ?? item.uuid ?? `PAG-${index + 1}`,
      fecha: fechaBase,
      referencia: item.referencia || item.pago?.nroReferencia || item.pago?.referencia || item.nroReferencia || item.comprobante || "",
      seccion: seccionRaw,
      alumno: alumnoNombreRaw,
      alumnoCedula: formatearCedula(alumnoCedulaRaw),
      representante: repNombreRaw,
      representanteCedula: formatearCedula(repCedulaRaw),
      concepto: conceptoTexto,
      mesesPagados,
      metodo: item.metodo || item.pago?.metodo || item.metodo_pago || item.metodoPago || "Transferencia / Pago Móvil",
      motivo: item.motivo || item.observacion || "",
      monto: montoTexto,
      estado: estadoAdmin
    };

    const aluMatch = encontrarAlumnoPorPago(pagoNormalizado);
    if (aluMatch) {
      if (!pagoNormalizado.alumno) pagoNormalizado.alumno = aluMatch.alumno;
      if (!pagoNormalizado.alumnoCedula) pagoNormalizado.alumnoCedula = aluMatch.ced;
      if (!pagoNormalizado.seccion) pagoNormalizado.seccion = aluMatch.seccion;
      if (!pagoNormalizado.representante) pagoNormalizado.representante = aluMatch.representante;
      if (!pagoNormalizado.representanteCedula) pagoNormalizado.representanteCedula = aluMatch.ced_rep;
    }

    return pagoNormalizado;
  }

  async function cargarPagosAdminSupabase(filtros = {}) {
    try {
      if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        throw new Error("Falta configurar SUPABASE_CONFIG.url o SUPABASE_CONFIG.anonKey");
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
        const detalle = await respuesta.text();
        throw new Error(`HTTP ${respuesta.status}: ${detalle}`);
      }

      const datos = await respuesta.json();
      const lista = Array.isArray(datos) ? datos : [];
      guardarCacheSupabase(lista);
      return lista;
    } catch (error) {
      console.warn("[cargarPagosAdminSupabase] Usando caché local si existe:", error.message);
      return leerCacheSupabase();
    }
  }

  async function actualizarEstadoPagoSupabase(pagoId, nuevoEstado, observacion = "") {
    if (!pagoId) return null;
    const estadoPortal = mapearEstadoHaciaPortal(nuevoEstado);
    const params = new URLSearchParams();
    params.set("id", `eq.${encodeURIComponent(String(pagoId))}`);

    const endpoint = `${SUPABASE_CONFIG.url.replace(/\/+$/, "")}/rest/v1/${SUPABASE_CONFIG.tableName}?${params.toString()}`;
    const cuerpo = {
      estado: estadoPortal,
      updated_at: new Date().toISOString()
    };
    if (observacion) {
      cuerpo.motivo = observacion;
      cuerpo.observacion = observacion;
    }

    const respuesta = await fetch(endpoint, {
      method: "PATCH",
      headers: obtenerHeadersSupabase(),
      body: JSON.stringify(cuerpo)
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      throw new Error(`Error PATCH Supabase (${respuesta.status}): ${detalle}`);
    }

    return respuesta.json();
  }

  function coincideBusquedaConCedula(consultaRaw, candidatosTexto, candidatosCedula) {
    const consulta = String(consultaRaw || "").trim();
    if (!consulta) return true;

    const consultaNorm = normalizarTexto(consulta);
    const digitosConsulta = soloDigitosCedula(consulta);

    const textos = Array.isArray(candidatosTexto) ? candidatosTexto : [];
    const cedulas = Array.isArray(candidatosCedula) ? candidatosCedula : [];

    if (textos.some((t) => normalizarTexto(t).includes(consultaNorm))) {
      return true;
    }

    if (digitosConsulta.length > 0) {
      return cedulas.some((c) => {
        const digCand = soloDigitosCedula(c);
        return digCand.includes(digitosConsulta) || normalizarTexto(c).includes(consultaNorm);
      });
    }

    return false;
  }

  function coincideRegistroEnPadron(consultaRaw, registro) {
    const consulta = String(consultaRaw || "").trim();
    if (!consulta) return true;
    const digitosConsulta = soloDigitosCedula(consulta);
    if (digitosConsulta.length > 0) {
      if (
        soloDigitosCedula(registro?.ced).includes(digitosConsulta) ||
        soloDigitosCedula(registro?.ced_rep).includes(digitosConsulta)
      ) {
        return true;
      }
    }
    const textoRegistro = normalizarTexto(Object.values(registro || {}).join(" "));
    return textoRegistro.includes(normalizarTexto(consulta));
  }

  function leerArrayStorage(clave) {
    try {
      const raw = JSON.parse(localStorage.getItem(clave) || "null");
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === "object") {
        if (Array.isArray(raw.pagos)) return raw.pagos;
        if (Array.isArray(raw.items)) return raw.items;
        return Object.values(raw).filter((v) => v && typeof v === "object");
      }
      return [];
    } catch {
      return [];
    }
  }

  function leerPagosRepresentanteStorage() {
    const combinados = [];
    const vistos = new Set();

    CLAVES_PAGOS_POSIBLES.forEach((clave) => {
      const arr = leerArrayStorage(clave);
      arr.forEach((item, idx) => {
        if (!item || typeof item !== "object") return;
        const ref = item.referencia || item.pago?.nroReferencia || item.pago?.referencia || item.nroReferencia || "";
        const alu = item.alumno?.nombreApellido || item.alumno || item.nombreAlumno || "";
        const concepto = item.pago?.concepto || item.concepto || item.meses || "";
        const claveUnica = item.id
          ? `ID:${item.id}`
          : `F:${ref}|A:${normalizarTexto(alu)}|C:${normalizarTexto(concepto)}|I:${idx}`;
        if (!vistos.has(claveUnica)) {
          vistos.add(claveUnica);
          combinados.push(item);
        }
      });
    });

    return combinados;
  }

  function actualizarEstadoMesesEnPortalStorage(pago, nuevoEstadoMes) {
    const meses = Array.isArray(pago.mesesPagados) && pago.mesesPagados.length > 0
      ? pago.mesesPagados
      : extraerMesesDeConcepto(pago.concepto);
    if (!meses.length) return;

    let mapa = {};
    try {
      mapa = JSON.parse(localStorage.getItem(CLAVE_ESTADOS_MESES_ALU) || "{}");
    } catch {
      mapa = {};
    }

    const alumnoObj = encontrarAlumnoPorPago(pago);
    const cedAluNorm = normalizarCedula(pago.alumnoCedula || (alumnoObj && alumnoObj.ced));
    const nomAluNorm = normalizarTexto(pago.alumno || (alumnoObj && alumnoObj.alumno));
    const secAluNorm = normalizarTexto(pago.seccion || (alumnoObj && alumnoObj.seccion));
    const claveAlu = cedAluNorm ? `ALU_${cedAluNorm}` : `ALU_${nomAluNorm}_${secAluNorm}`;

    if (!mapa[claveAlu]) mapa[claveAlu] = {};
    let modificoRegistros = false;

    meses.forEach((mesLabel) => {
      const mesMatch = MESES_ESCOLARES.find(
        (m) => normalizarTexto(m.label) === normalizarTexto(mesLabel) || normalizarTexto(mesLabel).includes(m.key)
      );
      const etiqueta = mesMatch ? mesMatch.label : mesLabel;
      mapa[claveAlu][etiqueta] = nuevoEstadoMes;

      if (nuevoEstadoMes === "aprobado" && mesMatch && alumnoObj) {
        alumnoObj[mesMatch.key] = "PAGO";
        modificoRegistros = true;
      }
    });

    localStorage.setItem(CLAVE_ESTADOS_MESES_ALU, JSON.stringify(mapa));
    if (modificoRegistros) guardarRegistrosStorage(registros);
  }

  function aplicarAprobacionesAlPadron() {
    let modificoRegistros = false;
    historialPagos.forEach((pago) => {
      if (pago.estado === "aprobado") {
        const aluMatch = encontrarAlumnoPorPago(pago);
        if (!aluMatch) return;
        const meses = Array.isArray(pago.mesesPagados) && pago.mesesPagados.length > 0
          ? pago.mesesPagados
          : extraerMesesDeConcepto(pago.concepto);
        meses.forEach((mesLabel) => {
          const mesMatch = MESES_ESCOLARES.find(
            (m) => normalizarTexto(m.label) === normalizarTexto(mesLabel) || normalizarTexto(mesLabel).includes(m.key)
          );
          if (mesMatch && aluMatch[mesMatch.key] !== "PAGO") {
            aluMatch[mesMatch.key] = "PAGO";
            modificoRegistros = true;
          }
        });
      }
    });
    if (modificoRegistros) guardarRegistrosStorage(registros);
  }

  function construirHistorialPagos(datosSupabase) {
    const rawSupabase = Array.isArray(datosSupabase) ? datosSupabase : leerCacheSupabase();
    const rawLocal = leerPagosRepresentanteStorage();
    const combinados = [...rawSupabase, ...rawLocal];
    const vistos = new Set();
    const filtrados = [];

    combinados.forEach((item, idx) => {
      if (!item || typeof item !== "object") return;
      const ref = item.referencia || item.pago?.nroReferencia || item.pago?.referencia || item.nroReferencia || "";
      const alu = item.alumno?.nombreApellido || item.alumno || item.nombre_alumno || item.nombreAlumno || "";
      const concepto = item.pago?.concepto || item.concepto || item.meses || "";
      const clave = item.id !== undefined && item.id !== null && item.id !== ""
        ? `ID:${item.id}`
        : `F:${ref}|A:${normalizarTexto(alu)}|C:${normalizarTexto(concepto)}|I:${idx}`;
      if (!vistos.has(clave)) {
        vistos.add(clave);
        filtrados.push(item);
      }
    });

    historialPagos = filtrados.map((item, index) => normalizarPagoCrudo(item, index));
    aplicarAprobacionesAlPadron();
  }

  async function cambiarEstadoPago(pagoId, nuevoEstado) {
    const pago = historialPagos.find((p) => String(p.id) === String(pagoId));
    if (!pago) return;

    let motivoTexto = "";
    if (nuevoEstado === "rechazado") {
      motivoTexto = prompt("Indique el motivo del rechazo:", "Referencia no encontrada / monto incompleto") || "Rechazado por administración";
      pago.motivo = motivoTexto;
    }

    pago.estado = nuevoEstado;
    const estadoPortal = mapearEstadoHaciaPortal(nuevoEstado);

    try {
      CLAVES_PAGOS_POSIBLES.forEach((clave) => {
        const arr = leerArrayStorage(clave);
        let cambio = false;
        const actualizado = arr.map((item) => {
          if (String(item.id) === String(pagoId)) {
            cambio = true;
            const copia = Object.assign({}, item, { estado: estadoPortal });
            if (motivoTexto) copia.motivo = motivoTexto;
            if (copia.pago && typeof copia.pago === "object") {
              copia.pago = Object.assign({}, copia.pago, { estado: estadoPortal });
            }
            return copia;
          }
          return item;
        });
        if (cambio) {
          localStorage.setItem(clave, JSON.stringify(actualizado));
        }
      });
    } catch {
      // Ignorar error local
    }

    if (nuevoEstado === "aprobado") {
      actualizarEstadoMesesEnPortalStorage(pago, "aprobado");
    } else if (nuevoEstado === "rechazado") {
      actualizarEstadoMesesEnPortalStorage(pago, "rechazado");
    }

    try {
      await actualizarEstadoPagoSupabase(pagoId, nuevoEstado, motivoTexto);
    } catch (err) {
      console.warn("[cambiarEstadoPago] No se pudo sincronizar PATCH en Supabase:", err.message);
    }

    renderTodo();
  }

  function abrirVista(vista) {
    document.querySelectorAll(".kpi-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.vista === vista);
    });
    document.querySelectorAll(".panel").forEach((p) => {
      p.classList.toggle("active", p.id === "vista-" + vista);
    });
  }

  function getFechaCorte() {
    const input = document.getElementById("fechaCorte");
    const val = input && input.value ? input.value : "2026-11-24";
    const partes = val.split("-").map(Number);
    return new Date(partes[0] || 2026, (partes[1] || 11) - 1, partes[2] || 24);
  }

  function esMesVencido(mesObj, fechaCorte) {
    const y = fechaCorte.getFullYear();
    const m = fechaCorte.getMonth() + 1;
    const d = fechaCorte.getDate();
    if (y > mesObj.year) return true;
    if (y < mesObj.year) return false;
    if (m > mesObj.month) return true;
    if (m < mesObj.month) return false;
    return d >= 6;
  }

  function calcularMorosidad(registro, fechaCorte) {
    const vencidos = MESES_ESCOLARES.filter((mes) => {
      const estado = String(registro[mes.key] || "").trim().toUpperCase();
      return estado !== "PAGO" && esMesVencido(mes, fechaCorte);
    });
    const mesesLabels = vencidos.map((m) => m.label);
    return Object.assign({}, registro, {
      cantidadVencida: vencidos.length,
      mesesVencidosLabels: mesesLabels,
      condicion: vencidos.length > 0 ? "MOROSO" : "SOLVENTE",
      mesesQueDebeTexto: vencidos.length > 0
        ? `${vencidos.length} (${mesesLabels.join(", ")})`
        : "Ninguno"
    });
  }

  function obtenerCarteraFiltrada() {
    const fechaCorte = getFechaCorte();
    const buscarEl = document.getElementById("buscarMoroso");
    const filtroEl = document.getElementById("filtroMesesVencidos");
    const texto = buscarEl ? buscarEl.value.trim() : "";
    const filtroCant = filtroEl ? filtroEl.value : "todos";

    return registros
      .map((r) => calcularMorosidad(r, fechaCorte))
      .filter((item) => {
        if (item.cantidadVencida <= 0) return false;
        if (filtroCant !== "todos" && item.cantidadVencida !== Number(filtroCant)) return false;
        if (!texto) return true;
        return coincideBusquedaConCedula(
          texto,
          [item.seccion, item.alumno, item.representante, item.telefonos, item.condicion, item.mesesQueDebeTexto],
          [item.ced, item.ced_rep]
        );
      });
  }

  function actualizarContadores() {
    const fechaCorte = getFechaCorte();
    const enRevision = historialPagos.filter((p) => p.estado === "revision").length;
    const aprobados = historialPagos.filter((p) => p.estado === "aprobado").length;
    const rechazados = historialPagos.filter((p) => p.estado === "rechazado").length;
    const morosos = registros.filter((r) => calcularMorosidad(r, fechaCorte).cantidadVencida > 0).length;

    const elRev = document.getElementById("countRevision");
    const elApr = document.getElementById("countAprobados");
    const elRec = document.getElementById("countRechazados");
    const elMor = document.getElementById("countMorosos");
    const elAlu = document.getElementById("countAlumnos");

    if (elRev) elRev.textContent = String(enRevision);
    if (elApr) elApr.textContent = String(aprobados);
    if (elRec) elRec.textContent = String(rechazados);
    if (elMor) elMor.textContent = String(morosos);
    if (elAlu) elAlu.textContent = String(registros.length);
  }

  function renderTablaPagos(tipo, tbodyId, inputBuscarId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const input = document.getElementById(inputBuscarId);
    const texto = input ? input.value.trim() : "";

    const lista = historialPagos.filter((p) => {
      if (p.estado !== tipo) return false;
      if (!texto) return true;

      const aluVinculado = encontrarAlumnoPorPago(p);
      return coincideBusquedaConCedula(
        texto,
        [
          p.fecha,
          p.referencia,
          p.seccion,
          p.alumno,
          p.representante,
          p.concepto,
          p.metodo,
          p.motivo,
          p.monto,
          aluVinculado ? aluVinculado.alumno : "",
          aluVinculado ? aluVinculado.representante : ""
        ],
        [
          p.alumnoCedula,
          p.representanteCedula,
          aluVinculado ? aluVinculado.ced : "",
          aluVinculado ? aluVinculado.ced_rep : ""
        ]
      );
    });

    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="10">No hay registros en esta sección.</td></tr>`;
      return;
    }

    if (tipo === "rechazado") {
      tbody.innerHTML = lista.map((p) => `
        <tr>
          <td>${escaparHtml(p.fecha)}</td>
          <td>${escaparHtml(p.referencia)}</td>
          <td>${escaparHtml(p.seccion)}</td>
          <td>${escaparHtml(p.alumno)}</td>
          <td>${escaparHtml(p.representante)}</td>
          <td>${escaparHtml(p.concepto)}</td>
          <td>${escaparHtml(p.motivo)}</td>
          <td>${escaparHtml(p.monto)}</td>
          <td><span class="tag tag-rechazado">Rechazado</span></td>
        </tr>`).join("");
    } else if (tipo === "revision") {
      tbody.innerHTML = lista.map((p) => `
        <tr>
          <td>${escaparHtml(p.fecha)}</td>
          <td>${escaparHtml(p.referencia)}</td>
          <td>${escaparHtml(p.seccion)}</td>
          <td>${escaparHtml(p.alumno)}</td>
          <td>${escaparHtml(p.representante)}</td>
          <td>${escaparHtml(p.concepto)}</td>
          <td>${escaparHtml(p.metodo)}</td>
          <td>${escaparHtml(p.monto)}</td>
          <td><span class="tag tag-revision">En Revisión</span></td>
          <td class="no-print">
            <button type="button" class="btn-aprobar" onclick="cambiarEstadoPago('${escaparHtml(String(p.id).replace(/'/g, "\\'"))}', 'aprobado')">Aprobar</button>
            <button type="button" class="btn-rechazar" onclick="cambiarEstadoPago('${escaparHtml(String(p.id).replace(/'/g, "\\'"))}', 'rechazado')">Rechazar</button>
          </td>
        </tr>`).join("");
    } else {
      tbody.innerHTML = lista.map((p) => `
        <tr>
          <td>${escaparHtml(p.fecha)}</td>
          <td>${escaparHtml(p.referencia)}</td>
          <td>${escaparHtml(p.seccion)}</td>
          <td>${escaparHtml(p.alumno)}</td>
          <td>${escaparHtml(p.representante)}</td>
          <td>${escaparHtml(p.concepto)}</td>
          <td>${escaparHtml(p.metodo)}</td>
          <td>${escaparHtml(p.monto)}</td>
          <td><span class="tag tag-aprobado">Aprobado</span></td>
        </tr>`).join("");
    }
  }

  function renderMorosos() {
    const fechaCorte = getFechaCorte();
    const dia = fechaCorte.getDate();
    const reglaInfo = document.getElementById("reglaInfo");
    if (reglaInfo) {
      reglaInfo.textContent = dia >= 6
        ? `Mes vencido desde el día 6 (corte día ${dia})`
        : "Plazo vigente (días 1–5)";
    }

    const totalInsolventes = registros.filter((r) => calcularMorosidad(r, fechaCorte).cantidadVencida > 0).length;
    const countMorosos = document.getElementById("countMorosos");
    if (countMorosos) countMorosos.textContent = String(totalInsolventes);

    const lista = obtenerCarteraFiltrada();
    const resumen = document.getElementById("resumenMorosos");
    if (resumen) {
      resumen.textContent = `Mostrando ${lista.length} alumno(s) insolvente(s) según filtro seleccionado.`;
    }

    const tbody = document.getElementById("tbodyMorosos");
    if (!tbody) return;

    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="7">No hay alumnos insolventes para la fecha de corte o filtro actual.</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map((m) => `
      <tr>
        <td>${escaparHtml(m.seccion)}</td>
        <td>${escaparHtml(m.ced)}</td>
        <td>${escaparHtml(m.alumno)}</td>
        <td>${escaparHtml(m.representante)}</td>
        <td>${escaparHtml(m.telefonos)}</td>
        <td><span class="tag tag-moroso">${escaparHtml(m.condicion)}</span></td>
        <td>${escaparHtml(m.mesesQueDebeTexto)}</td>
      </tr>`).join("");
  }

  function renderAlumnos() {
    const thead = document.getElementById("theadAlumnos");
    const tbody = document.getElementById("tbodyAlumnos");
    if (!tbody) return;

    const input = document.getElementById("buscarAlumno");
    const consulta = input ? input.value.trim() : "";
    const filtrados = registros.filter((r) => coincideRegistroEnPadron(consulta, r));

    const colsBase = ["seccion", "ced", "alumno", "representante", "ced_rep", "telefonos"];
    const colsMeses = ["INSC", ...MESES_ESCOLARES.map((m) => m.key)];
    const todasCols = [...colsBase, ...colsMeses];

    if (thead) {
      thead.innerHTML = todasCols.map((c) => `<th>${escaparHtml(c)}</th>`).join("");
    }

    if (!filtrados.length) {
      tbody.innerHTML = `<tr><td colspan="${todasCols.length}">No se encontraron alumnos con ese criterio.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtrados.map((r) => {
      const celdas = todasCols.map((col) => {
        const val = r[col] ?? "";
        if (colsMeses.includes(col)) {
          const esPago = String(val).trim().toUpperCase() === "PAGO";
          return `<td><span class="tag ${esPago ? "tag-aprobado" : "tag-revision"}">${escaparHtml(val || "PENDIENTE")}</span></td>`;
        }
        return `<td>${escaparHtml(val)}</td>`;
      }).join("");
      return `<tr>${celdas}</tr>`;
    }).join("");
  }

  function renderTodo() {
    actualizarContadores();
    renderTablaPagos("revision", "tbodyRevision", "buscarRevision");
    renderTablaPagos("aprobado", "tbodyAprobados", "buscarAprobados");
    renderTablaPagos("rechazado", "tbodyRechazados", "buscarRechazados");
    renderMorosos();
    renderAlumnos();
  }

  function descargarCSV(nombreArchivo, filas) {
    const csv = filas
      .map((fila) => fila.map((celda) => `"${String(celda ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function descargarCarteraCSV() {
    const lista = obtenerCarteraFiltrada();
    const fechaCorteEl = document.getElementById("fechaCorte");
    const corteStr = fechaCorteEl && fechaCorteEl.value ? fechaCorteEl.value : "2026-11-24";
    const filas = [
      ["Fecha Corte", "Sección", "Cédula", "Alumno", "Representante", "Teléfonos", "Meses Vencidos", "Condición", "Detalle Vencido"]
    ];
    lista.forEach((m) => {
      filas.push([
        corteStr,
        m.seccion,
        m.ced,
        m.alumno,
        m.representante,
        m.telefonos,
        m.cantidadVencida,
        m.condicion,
        m.mesesQueDebeTexto
      ]);
    });
    descargarCSV(`cartera_morosidad_${corteStr}.csv`, filas);
  }

  function exportarPagos(tipo) {
    const lista = historialPagos.filter((p) => p.estado === tipo);
    const filas = [["Fecha", "Referencia", "Sección", "Alumno", "Representante", "Concepto", "Método", "Monto", "Estado", "Motivo"]];
    lista.forEach((p) => {
      filas.push([p.fecha, p.referencia, p.seccion, p.alumno, p.representante, p.concepto, p.metodo, p.monto, p.estado, p.motivo || ""]);
    });
    descargarCSV(`pagos_${tipo}.csv`, filas);
  }

  function imprimirVista(tituloReporte) {
    const tituloPrevio = document.title;
    document.title = `${tituloReporte} - UEI San Antonio C.A.`;
    window.print();
    setTimeout(() => {
      document.title = tituloPrevio;
    }, 300);
  }

  function abrirSelectorCsv() {
    const input = document.getElementById("inputCsv");
    if (input) input.click();
  }

  function toggleCajaPegar() {
    const caja = document.getElementById("cajaPegarCsv");
    if (!caja) return;
    caja.style.display = (caja.style.display === "none" || !caja.style.display) ? "block" : "none";
  }

  function detectarSeparador(linea) {
    const tabCount = (linea.match(/\t/g) || []).length;
    const semiCount = (linea.match(/;/g) || []).length;
    const commaCount = (linea.match(/,/g) || []).length;
    if (tabCount >= semiCount && tabCount >= commaCount && tabCount > 0) return "\t";
    if (semiCount >= commaCount && semiCount > 0) return ";";
    return ",";
  }

  function parsearLineaSeparada(linea, sep) {
    const resultado = [];
    let actual = "";
    let entreComillas = false;
    for (let i = 0; i < linea.length; i++) {
      const ch = linea[i];
      if (ch === '"') {
        if (entreComillas && linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          entreComillas = !entreComillas;
        }
      } else if (ch === sep && !entreComillas) {
        resultado.push(actual.trim());
        actual = "";
      } else {
        actual += ch;
      }
    }
    resultado.push(actual.trim());
    return resultado;
  }

  function procesarTextoCsv(texto) {
    const lineas = String(texto || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (!lineas.length) {
      alert("No se encontraron filas válidas para importar.");
      return;
    }

    const sep = detectarSeparador(lineas[0]);
    const primeraFila = parsearLineaSeparada(lineas[0], sep).map((c) => c.toLowerCase());
    const tieneEncabezado = primeraFila.includes("alumno") || primeraFila.includes("ced") || primeraFila.includes("seccion");

    const colsMeses = ["INSC", ...MESES_ESCOLARES.map((m) => m.key)];
    const colsOrden = ["seccion", "ced", "alumno", "sexo", "f_nac", "ced_rep", "representante", "telefonos", ...colsMeses];

    const indicesMapa = {};
    if (tieneEncabezado) {
      primeraFila.forEach((colNombre, idx) => {
        const keyNorm = colNombre.trim();
        indicesMapa[keyNorm] = idx;
        const upperKey = keyNorm.toUpperCase();
        if (colsMeses.includes(upperKey)) indicesMapa[upperKey] = idx;
      });
    }

    const inicioIdx = tieneEncabezado ? 1 : 0;
    const nuevosRegistros = [];

    for (let i = inicioIdx; i < lineas.length; i++) {
      const partes = parsearLineaSeparada(lineas[i], sep);
      if (partes.every((p) => !p)) continue;

      const obj = {};
      if (tieneEncabezado) {
        colsOrden.forEach((col, posFallback) => {
          const idx = indicesMapa[col] !== undefined
            ? indicesMapa[col]
            : (indicesMapa[col.toUpperCase()] !== undefined ? indicesMapa[col.toUpperCase()] : posFallback);
          obj[col] = partes[idx] ?? "";
        });
      } else {
        colsOrden.forEach((col, idx) => {
          obj[col] = partes[idx] ?? "";
        });
      }

      if (!obj.alumno && !obj.ced) continue;
      nuevosRegistros.push(sanitizarRegistroAlumno(obj));
    }

    if (!nuevosRegistros.length) {
      alert("No se pudieron leer registros de alumnos en el contenido proporcionado.");
      return;
    }

    registros = nuevosRegistros;
    guardarRegistrosStorage(registros);
    renderTodo();
    abrirVista("alumnos");
    alert(`Se importaron ${nuevosRegistros.length} alumno(s) correctamente.`);
  }

  function importarTextoPegado() {
    const textarea = document.getElementById("textoPegarCsv");
    if (!textarea) return;
    procesarTextoCsv(textarea.value);
  }

  function obtenerFirmaStorage() {
    try {
      return CLAVES_PAGOS_POSIBLES
        .map((k) => `${k}:${localStorage.getItem(k) || ""}`)
        .join("||") + "##" + (localStorage.getItem(CLAVE_REGISTROS_ALU) || "") + "##" + (localStorage.getItem(CLAVE_CACHE_PAGOS_SB) || "");
    } catch {
      return "";
    }
  }

  function enlazarEventosUI() {
    document.querySelectorAll(".kpi-card[data-vista], .kpi-trigger[data-vista]").forEach((card) => {
      card.addEventListener("click", () => abrirVista(card.dataset.vista));
    });

    const idsCambio = ["fechaCorte", "buscarMoroso", "filtroMesesVencidos", "buscarRevision", "buscarAprobados", "buscarRechazados", "buscarAlumno"];
    idsCambio.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", renderTodo);
        el.addEventListener("change", renderTodo);
      }
    });

    const inputCsv = document.getElementById("inputCsv");
    if (inputCsv) {
      inputCsv.addEventListener("change", function (e) {
        const archivo = e.target.files && e.target.files[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = function (ev) {
          procesarTextoCsv(ev.target.result || "");
          inputCsv.value = "";
        };
        lector.readAsText(archivo, "UTF-8");
      });
    }

    function comprobarCambiosTiempoReal() {
      const firmaActual = obtenerFirmaStorage();
      if (firmaActual !== ultimaFirmaStorage) {
        ultimaFirmaStorage = firmaActual;
        registros = cargarRegistrosIniciales();
        construirHistorialPagos(leerCacheSupabase());
        renderTodo();
      }
    }

    window.addEventListener("storage", comprobarCambiosTiempoReal);
    window.addEventListener("focus", comprobarCambiosTiempoReal);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) comprobarCambiosTiempoReal();
    });
    setInterval(comprobarCambiosTiempoReal, 2000);
  }

  async function iniciarPanelAdministrativo() {
    enlazarEventosUI();
    construirHistorialPagos(leerCacheSupabase());
    renderTodo();

    const datosSb = await cargarPagosAdminSupabase({ estado: "todos" });
    construirHistorialPagos(datosSb);
    ultimaFirmaStorage = obtenerFirmaStorage();
    renderTodo();
  }

  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.cargarPagosAdminSupabase = cargarPagosAdminSupabase;
  window.actualizarEstadoPagoSupabase = actualizarEstadoPagoSupabase;
  window.cambiarEstadoPago = cambiarEstadoPago;
  window.abrirVista = abrirVista;
  window.renderMorosos = renderMorosos;
  window.renderAlumnos = renderAlumnos;
  window.renderTodo = renderTodo;
  window.descargarCarteraCSV = descargarCarteraCSV;
  window.exportarPagos = exportarPagos;
  window.imprimirVista = imprimirVista;
  window.abrirSelectorCsv = abrirSelectorCsv;
  window.toggleCajaPegar = toggleCajaPegar;
  window.importarTextoPegado = importarTextoPegado;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarPanelAdministrativo);
  } else {
    iniciarPanelAdministrativo();
  }
})();