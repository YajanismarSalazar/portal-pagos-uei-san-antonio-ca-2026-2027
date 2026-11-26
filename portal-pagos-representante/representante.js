(function () {
  "use strict";

  const SUPABASE_URL = "https://lnluwygaehlqsdpwouvv.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_i7qcIcbkjSjZkqjVSt-jUA_ZR7RQlTA";
  const SUPABASE_PAGOS_ENDPOINT = `${SUPABASE_URL}/rest/v1/pagos`;
  const WHATSAPP_INSTITUCION = "584248912975";
  const CLAVE_PAGOS_REP = "pagos_representantes_v1";
  const CLAVE_ESTADOS_MESES_ALU = "estados_meses_alumnos_v1";
  const PRECIO_MENSUALIDAD_USD = 50;

  const MESES_ANO_ESCOLAR = [
    "Septiembre 2026",
    "Octubre 2026",
    "Noviembre 2026",
    "Diciembre 2026",
    "Enero 2027",
    "Febrero 2027",
    "Marzo 2027",
    "Abril 2027",
    "Mayo 2027",
    "Junio 2027",
    "Julio 2027",
    "Agosto 2027"
  ];

  const MESES_2027_SET = new Set([
    "ENERO 2027",
    "FEBRERO 2027",
    "MARZO 2027",
    "ABRIL 2027",
    "MAYO 2027",
    "JUNIO 2027",
    "JULIO 2027",
    "AGOSTO 2027"
  ]);

  let tasaActivaRepresentante = typeof CONFIG_TASA_BCV !== "undefined" ? Number(CONFIG_TASA_BCV.tasaInicial) || 1 : 1;
  let origenTasaInterno = typeof CONFIG_TASA_BCV !== "undefined"
    ? `Tasa Inicial Fijada (${CONFIG_TASA_BCV.fechaInicial || "24-11-2026"})`
    : "Base";
  let registroActual = null;
  let alumnoSeleccionadoActual = null;
  let pagosRemotosCache = [];

  function obtenerPadronActivo() {
    if (typeof PADRON_INICIAL !== "undefined" && Array.isArray(PADRON_INICIAL) && PADRON_INICIAL.length > 0) {
      return PADRON_INICIAL;
    }
    return [];
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizarTextoPlano(valor, maxLen = 200) {
    return String(valor ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/[<>`]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLen);
  }

  function limpiarEntradaCedula(valor) {
    return String(valor ?? "")
      .toUpperCase()
      .replace(/[^0-9VEJR-]/g, "")
      .slice(0, 12);
  }

  function esCedulaValida(valor) {
    const limp = String(valor ?? "").trim().toUpperCase();
    return /^(?:[VEJR]-?)?\d{4,9}$/.test(limp);
  }

  function limpiarReferenciaNumerica(valor) {
    return String(valor ?? "")
      .replace(/\D+/g, "")
      .slice(0, 20);
  }

  function limpiarMontoUsd(valor) {
    let limpio = String(valor ?? "")
      .replace(/[^0-9.]/g, "");

    const primerPunto = limpio.indexOf(".");
    if (primerPunto !== -1) {
      const antes = limpio.slice(0, primerPunto);
      const despues = limpio.slice(primerPunto + 1).replace(/\./g, "").slice(0, 2);
      limpio = `${antes || "0"}.${despues}`;
    }

    return limpio.slice(0, 10);
  }

  function esDireccionNoRegistrada(valor) {
    const norm = normalizarTexto(valor);
    return !norm || norm === "NO REGISTRADA EN LISTADO" || norm === "INGRESE UNA DIRECCION VALIDA";
  }

  function normalizarTexto(val) {
    return sanitizarTextoPlano(val, 200)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  }

  function normalizarCedula(valor) {
    return String(valor || "")
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .replace(/^[VEJR]/, "");
  }

  function obtenerClaveAlumno(alumno) {
    const ced = normalizarCedula(alumno?.cedula);
    const nom = String(alumno?.nombreApellido || "").trim().toUpperCase();
    const sec = String(alumno?.gradoSeccion || "").trim().toUpperCase();
    return ced ? `ALU_${ced}` : `ALU_${nom}_${sec}`;
  }

  function leerHistorialPagosRep() {
    try {
      const raw = JSON.parse(localStorage.getItem(CLAVE_PAGOS_REP) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function guardarHistorialPagosRep(lista) {
    try {
      localStorage.setItem(CLAVE_PAGOS_REP, JSON.stringify(lista));
    } catch {
      // Ignorar error de cuota
    }
  }

  function cabecerasSupabase() {
    return {
      "Content-Type": "application/json",
      "apikey": SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Prefer": "return=representation"
    };
  }

  function normalizarMesConAno(mesTexto) {
    const limpio = sanitizarTextoPlano(mesTexto, 40);
    const upper = normalizarTexto(limpio);
    const meses2026 = ["SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const meses2027 = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO"];

    const encontrado2026 = meses2026.find((m) => upper.includes(m));
    if (encontrado2026) {
      return `${encontrado2026.charAt(0) + encontrado2026.slice(1).toLowerCase()} 2026`;
    }
    const encontrado2027 = meses2027.find((m) => upper.includes(m));
    if (encontrado2027) {
      return `${encontrado2027.charAt(0) + encontrado2027.slice(1).toLowerCase()} 2027`;
    }
    return limpio;
  }

  function esMes2027Label(mesLabel) {
    return MESES_2027_SET.has(normalizarTexto(mesLabel));
  }

  function extraerMesesDeTexto(texto) {
    const upper = normalizarTexto(texto);
    return MESES_ANO_ESCOLAR.filter((m) => upper.includes(normalizarTexto(m)));
  }

  async function obtenerPagosDesdeSupabase() {
    try {
      const url = `${SUPABASE_PAGOS_ENDPOINT}?select=*&order=id.desc`;
      const resp = await fetch(url, { method: "GET", headers: cabecerasSupabase() });
      if (!resp.ok) return pagosRemotosCache;
      const datos = await resp.json();
      if (Array.isArray(datos)) {
        pagosRemotosCache = datos;
      }
      return pagosRemotosCache;
    } catch {
      return pagosRemotosCache;
    }
  }

  async function enviarPagoASupabase(registroPago) {
    const metodoEl = document.getElementById("metodoPago") || document.getElementById("metodo");
    const metodoValor = metodoEl && metodoEl.value
      ? sanitizarTextoPlano(metodoEl.value, 80)
      : "Transferencia / Pago Móvil";
    const mesesStr = Array.isArray(registroPago.mesesPagados) && registroPago.mesesPagados.length > 0
      ? registroPago.mesesPagados.map((m) => sanitizarTextoPlano(m, 40)).join(", ")
      : sanitizarTextoPlano(registroPago.pago?.concepto || "", 200);

    const montoBsNum = Number(registroPago.pago?.montoBs || 0) || 0;
    const tasaNum = Number(registroPago.tasaAplicada || 0) || 0;

    let payload = {
      referencia: limpiarReferenciaNumerica(registroPago.pago?.nroReferencia || ""),
      alumno: sanitizarTextoPlano(registroPago.alumno?.nombreApellido || "", 140),
      cedula_alumno: sanitizarTextoPlano(registroPago.alumno?.cedula || "", 25),
      cedula_representante: sanitizarTextoPlano(registroPago.representante?.cedula || "", 25),
      seccion: sanitizarTextoPlano(registroPago.alumno?.gradoSeccion || "", 20),
      meses: mesesStr,
      metodo: metodoValor,
      monto: montoBsNum,
      tasa_bcv: tasaNum,
      estado: "En revisión",
      motivo: ""
    };

    for (let intento = 0; intento < 8; intento++) {
      const resp = await fetch(SUPABASE_PAGOS_ENDPOINT, {
        method: "POST",
        headers: cabecerasSupabase(),
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        const data = await resp.json();
        const guardado = Array.isArray(data) ? data[0] : data;
        if (guardado) {
          pagosRemotosCache = [guardado, ...pagosRemotosCache];
        }
        return guardado;
      }

      const errText = await resp.text();
      let errJson = null;
      try {
        errJson = JSON.parse(errText);
      } catch {
        errJson = null;
      }

      const mensajeErr = String(errJson?.message || errText || "");
      const matchColumna = mensajeErr.match(/Could not find the '([^']+)' column/i);

      if (resp.status === 400 && matchColumna && matchColumna[1] in payload) {
        delete payload[matchColumna[1]];
        continue;
      }

      throw new Error(`Error al guardar en Supabase (${resp.status}): ${errText}`);
    }

    throw new Error("No se pudo guardar en Supabase tras ajustar columnas.");
  }

  function leerEstadosMesesGlobal() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_ESTADOS_MESES_ALU) || "{}");
    } catch {
      return {};
    }
  }

  function guardarEstadosMesesGlobal(mapa) {
    try {
      localStorage.setItem(CLAVE_ESTADOS_MESES_ALU, JSON.stringify(mapa));
    } catch {
      // Ignorar error de cuota
    }
  }

  function obtenerMapaMesesAlumno(alumno) {
    const todos = leerEstadosMesesGlobal();
    const clave = obtenerClaveAlumno(alumno);
    const mapa = Object.assign({}, todos[clave] || {});

    if (Array.isArray(alumno?.mesesPendientes)) {
      const pendientesNorm = alumno.mesesPendientes.map((m) => normalizarTexto(m));
      const mesesEvaluables2026 = ["Septiembre 2026", "Octubre 2026", "Noviembre 2026", "Diciembre 2026"];

      mesesEvaluables2026.forEach((mesLabel) => {
        const mesUpper = normalizarTexto(mesLabel);
        const estaPendiente = pendientesNorm.some(
          (p) => p === mesUpper || mesUpper.startsWith(p) || p.startsWith(mesUpper.split(" ")[0])
        );
        if (!estaPendiente && !mapa[mesLabel]) {
          mapa[mesLabel] = "aprobado";
        }
      });
    }

    // Limpiar cualquier estado "aprobado" heredado en meses de 2027 si no proviene de un pago aprobado real
    MESES_ANO_ESCOLAR.forEach((mes) => {
      if (esMes2027Label(mes) && mapa[mes] === "aprobado") {
        delete mapa[mes];
      }
    });

    const cedAlu = normalizarCedula(alumno?.cedula);
    const nomAlu = normalizarTexto(alumno?.nombreApellido);

    const pagosAlumno = [
      ...pagosRemotosCache,
      ...leerHistorialPagosRep()
    ].filter((p) => {
      const pCed = normalizarCedula(p.cedula_alumno || p.alumno?.cedula || "");
      const pNom = normalizarTexto(p.alumno?.nombreApellido || p.alumno || "");
      return (cedAlu && pCed === cedAlu) || (nomAlu && pNom === nomAlu);
    });

    pagosAlumno.slice().reverse().forEach((p) => {
      const estUpper = normalizarTexto(p.estado || p.pago?.estado || "");
      let estadoClave = "revision";
      if (estUpper.includes("APROB") || estUpper === "PAGO" || estUpper === "PAGADO") {
        estadoClave = "aprobado";
      } else if (estUpper.includes("RECHAZ")) {
        estadoClave = "rechazado";
      }

      const mesesRaw = Array.isArray(p.mesesPagados) && p.mesesPagados.length > 0
        ? p.mesesPagados
        : extraerMesesDeTexto(p.meses || p.pago?.concepto || p.concepto || "");

      mesesRaw.forEach((m) => {
        const mNorm = normalizarMesConAno(m);
        if (mNorm) {
          mapa[mNorm] = estadoClave;
        }
      });
    });

    return mapa;
  }

  function buscarPorCedula(cedulaIngresada) {
    const cedNorm = normalizarCedula(cedulaIngresada);
    if (!cedNorm) return null;

    const padron = obtenerPadronActivo();
    return padron.find((item) => {
      const repCed = normalizarCedula(item.representante?.cedula);
      const coincideAlumno = (item.alumnos || []).some(
        (alu) => normalizarCedula(alu.cedula) === cedNorm
      );
      return repCed === cedNorm || coincideAlumno;
    }) || null;
  }

  function formatearBs(montoBs) {
    return montoBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Bs.";
  }

  function formatearUsd(montoUsd) {
    return "$" + montoUsd.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatearFechaHoraMensaje(fechaObj = new Date()) {
    const dia = String(fechaObj.getDate()).padStart(2, "0");
    const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");
    const anio = fechaObj.getFullYear();

    let horas = fechaObj.getHours();
    const minutos = String(fechaObj.getMinutes()).padStart(2, "0");
    const segundos = String(fechaObj.getSeconds()).padStart(2, "0");
    const periodo = horas >= 12 ? "p. m." : "a. m.";
    horas = horas % 12;
    if (horas === 0) horas = 12;
    const horasStr = String(horas).padStart(2, "0");

    return `${dia}/${mes}/${anio}, ${horasStr}:${minutos}:${segundos} ${periodo}`;
  }

  function actualizarResumenLateral(cantidadMeses, totalUsd, totalBs) {
    const countEl = document.getElementById("resumenMesesCount");
    const usdEl = document.getElementById("resumenTotalUsd");
    const bsEl = document.getElementById("resumenTotalBs");

    if (countEl) countEl.textContent = String(cantidadMeses);
    if (usdEl) usdEl.textContent = Number.isFinite(totalUsd) && totalUsd > 0 ? formatearUsd(totalUsd) : "$0,00";
    if (bsEl) bsEl.textContent = Number.isFinite(totalBs) && totalBs > 0 ? formatearBs(totalBs) : "0,00 Bs.";
  }

  function pintarTasaRepresentante(estadoTasa) {
    tasaActivaRepresentante = Number(estadoTasa?.tasa) || tasaActivaRepresentante;
    if (estadoTasa?.origen) {
      origenTasaInterno = sanitizarTextoPlano(estadoTasa.origen, 100);
    }

    const infoTasaEl = document.getElementById("infoTasa");
    if (!infoTasaEl) return;

    const fechaSegura = escaparHtml(estadoTasa?.fechaValor || new Date().toISOString().slice(0, 10));
    const tasaSegura = tasaActivaRepresentante.toLocaleString("es-VE", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    infoTasaEl.innerHTML = `
      <div>
        <strong>Tasa BCV:</strong> ${escaparHtml(tasaSegura)} Bs.<br />
        <br />
        <strong>Fecha:</strong> ${fechaSegura}
      </div>
    `;
    calcularEquivalenteBs();
  }

  function calcularEquivalenteBs() {
    const inputUsd = document.getElementById("montoUsd");
    const bsInput = document.getElementById("montoBs");
    const checks = Array.from(document.querySelectorAll("#listaMesesPendientes input[type='checkbox']:checked:not(:disabled)"));

    if (!inputUsd || !bsInput) return;

    const usd = parseFloat(inputUsd.value);
    if (!Number.isFinite(usd) || usd <= 0) {
      bsInput.value = "";
      actualizarResumenLateral(checks.length, 0, 0);
      return;
    }

    const totalBs = Number((usd * tasaActivaRepresentante).toFixed(2));
    bsInput.value = formatearBs(totalBs);
    actualizarResumenLateral(checks.length, usd, totalBs);
  }

  function actualizarEstiloChips() {
    const labels = Array.from(document.querySelectorAll("#listaMesesPendientes .chip-mes"));
    labels.forEach((lbl) => {
      const cb = lbl.querySelector("input[type='checkbox']");
      lbl.classList.toggle("seleccionado", Boolean(cb && cb.checked && !cb.disabled));
    });
  }

  function actualizarConceptoYCalculoSinSobrescribirMonto() {
    actualizarEstiloChips();

    const checks = Array.from(document.querySelectorAll("#listaMesesPendientes input[type='checkbox']:checked:not(:disabled)"));
    const conceptoInput = document.getElementById("concepto");

    if (checks.length > 0) {
      const mesesElegidos = checks.map((c) => sanitizarTextoPlano(c.value, 40));
      if (conceptoInput) {
        conceptoInput.value = `Mensualidad: ${mesesElegidos.join(", ")}`;
      }
    } else if (conceptoInput) {
      conceptoInput.value = "";
    }

    calcularEquivalenteBs();
  }

  function sincronizarMesesDesdeMontoUsd() {
    const inputUsd = document.getElementById("montoUsd");
    const usd = parseFloat(inputUsd ? inputUsd.value : "");
    const checkboxesDisponibles = Array.from(
      document.querySelectorAll("#listaMesesPendientes input[type='checkbox']:not(:disabled)")
    );

    const cantidadMeses = Number.isFinite(usd) && usd > 0
      ? Math.min(checkboxesDisponibles.length, Math.floor(usd / PRECIO_MENSUALIDAD_USD))
      : 0;

    checkboxesDisponibles.forEach((cb, index) => {
      cb.checked = index < cantidadMeses;
    });

    actualizarConceptoYCalculoSinSobrescribirMonto();
  }

  function sincronizarSeleccionMeses() {
    actualizarEstiloChips();

    const checks = Array.from(document.querySelectorAll("#listaMesesPendientes input[type='checkbox']:checked:not(:disabled)"));
    const conceptoInput = document.getElementById("concepto");
    const inputUsd = document.getElementById("montoUsd");

    if (checks.length > 0) {
      const mesesElegidos = checks.map((c) => sanitizarTextoPlano(c.value, 40));
      if (conceptoInput) {
        conceptoInput.value = `Mensualidad: ${mesesElegidos.join(", ")}`;
      }
      if (inputUsd) {
        inputUsd.value = String(mesesElegidos.length * PRECIO_MENSUALIDAD_USD);
      }
    } else {
      if (conceptoInput) {
        conceptoInput.value = "";
      }
      if (inputUsd) {
        inputUsd.value = "";
      }
    }

    calcularEquivalenteBs();
  }

  function renderizarEstadoReportesAlumno(alumno) {
    const box = document.getElementById("estadoReportesAlumno");
    if (!box || !alumno) return;

    const cedAlu = normalizarCedula(alumno.cedula);
    const nomAlu = normalizarTexto(alumno.nombreApellido);

    const pagosRemotosAlumno = pagosRemotosCache
      .filter((p) => {
        const pCed = normalizarCedula(p.cedula_alumno || "");
        const pNom = normalizarTexto(p.alumno || "");
        return (cedAlu && pCed === cedAlu) || (nomAlu && pNom === nomAlu);
      })
      .map((p) => ({
        ref: sanitizarTextoPlano(p.referencia || p.id || "", 30),
        concepto: sanitizarTextoPlano(p.meses || "Mensualidad", 120),
        estado: sanitizarTextoPlano(p.estado || "En revisión", 40),
        motivo: sanitizarTextoPlano(p.motivo || p.observacion || "", 150)
      }));

    const pagosLocalesAlumno = leerHistorialPagosRep()
      .filter((p) => {
        const pCed = normalizarCedula(p.alumno?.cedula || "");
        const pNom = normalizarTexto(p.alumno?.nombreApellido || "");
        return (cedAlu && pCed === cedAlu) || (nomAlu && pNom === nomAlu);
      })
      .map((p) => ({
        ref: sanitizarTextoPlano(p.pago?.nroReferencia || p.id || "", 30),
        concepto: sanitizarTextoPlano(p.pago?.concepto || "Mensualidad", 120),
        estado: sanitizarTextoPlano(p.estado || "En revisión", 40),
        motivo: sanitizarTextoPlano(p.motivo || "", 150)
      }));

    const combinados = pagosRemotosAlumno.length > 0 ? pagosRemotosAlumno : pagosLocalesAlumno;

    if (!combinados.length) {
      box.innerHTML = "<strong>Estatus de reportes:</strong> Sin pagos registrados aún.";
      return;
    }

    const itemsHtml = combinados.slice(0, 6).map((p) => {
      const est = p.estado || "En revisión";
      const color = est.toLowerCase().includes("aprob") ? "#15803d" : (est.toLowerCase().includes("rechaz") ? "#c2410c" : "#b91c1c");
      const motivoTxt = p.motivo ? ` — <em>Motivo: ${escaparHtml(p.motivo)}</em>` : "";
      return `<div style="margin-top:4px;">• Ref <strong>${escaparHtml(p.ref)}</strong> (${escaparHtml(p.concepto)}): <span style="color:${color};font-weight:bold;">${escaparHtml(est)}</span>${motivoTxt}</div>`;
    }).join("");

    box.innerHTML = `<strong>Estatus de pagos reportados:</strong>${itemsHtml}`;
  }

  function renderizarAlumno(alumno) {
    alumnoSeleccionadoActual = alumno;
    const nombreEl = document.getElementById("aluNombre");
    const secEl = document.getElementById("aluGradoSeccion");
    if (nombreEl) nombreEl.value = sanitizarTextoPlano(alumno?.nombreApellido || "", 140);
    if (secEl) secEl.value = sanitizarTextoPlano(alumno?.gradoSeccion || "", 20);

    const cajaDeuda = document.getElementById("cajaMesesPendientes");
    const listaMeses = document.getElementById("listaMesesPendientes");
    if (!listaMeses) return;

    const mapaEstados = obtenerMapaMesesAlumno(alumno);
    listaMeses.innerHTML = "";
    if (cajaDeuda) {
      cajaDeuda.classList.remove("oculto");
    }

    MESES_ANO_ESCOLAR.forEach((mes) => {
      const estadoMes = mapaEstados[mes] || "disponible";

      const label = document.createElement("label");
      label.className = "chip-mes";
      if (estadoMes === "revision") label.classList.add("estado-revision");
      if (estadoMes === "aprobado") label.classList.add("estado-aprobado");
      if (estadoMes === "rechazado") label.classList.add("estado-rechazado");

      const filaTop = document.createElement("span");
      filaTop.className = "chip-mes-fila";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = mes;
      cb.disabled = estadoMes === "revision" || estadoMes === "aprobado";
      cb.addEventListener("change", sincronizarSeleccionMeses);

      filaTop.appendChild(cb);
      filaTop.appendChild(document.createTextNode(mes));
      label.appendChild(filaTop);

      let textoEstado = "";
      if (estadoMes === "revision") {
        textoEstado = "En revisión";
      } else if (estadoMes === "aprobado") {
        textoEstado = "Pagado";
      } else if (estadoMes === "rechazado") {
        textoEstado = "Rechazado (reintentar)";
      }

      if (textoEstado) {
        const tagEstado = document.createElement("span");
        tagEstado.className = "chip-estado-tag";
        tagEstado.textContent = textoEstado;
        label.appendChild(tagEstado);
      }

      listaMeses.appendChild(label);
    });

    renderizarEstadoReportesAlumno(alumno);
    sincronizarSeleccionMeses();
  }

  function cargarRegistroEnFormulario(registro) {
    registroActual = registro;
    const rep = registro.representante || {};
    const alumnos = registro.alumnos || [];

    const repNombreEl = document.getElementById("repNombre");
    const repCedulaEl = document.getElementById("repCedula");
    const repDireccionEl = document.getElementById("repDireccion");
    const repTelefonoEl = document.getElementById("repTelefono");

    const dirRaw = sanitizarTextoPlano(rep.direccion || "", 200);
    const sinDireccion = esDireccionNoRegistrada(dirRaw);

    if (repNombreEl) repNombreEl.value = sanitizarTextoPlano(rep.nombreApellido || "", 140);
    if (repCedulaEl) repCedulaEl.value = sanitizarTextoPlano(rep.cedula || "", 25);
    if (repDireccionEl) {
      repDireccionEl.value = sinDireccion ? "" : dirRaw;
      repDireccionEl.placeholder = "Ingrese una dirección válida";
      repDireccionEl.readOnly = !sinDireccion;
    }
    if (repTelefonoEl) repTelefonoEl.value = sanitizarTextoPlano(rep.telefono || "", 80);

    const contSelector = document.getElementById("contenedorSelectorAlumno");
    const selectAlumno = document.getElementById("selectorAlumno");
    if (selectAlumno) {
      selectAlumno.innerHTML = "";
      if (alumnos.length > 1) {
        if (contSelector) contSelector.classList.remove("oculto");
        alumnos.forEach((alu, idx) => {
          const opt = document.createElement("option");
          opt.value = String(idx);
          opt.textContent = `${sanitizarTextoPlano(alu.nombreApellido, 140)} (${sanitizarTextoPlano(alu.gradoSeccion, 20)})`;
          selectAlumno.appendChild(opt);
        });
        selectAlumno.onchange = () => {
          renderizarAlumno(alumnos[Number(selectAlumno.value)] || alumnos[0]);
        };
      } else if (contSelector) {
        contSelector.classList.add("oculto");
      }
    }

    renderizarAlumno(alumnos[0] || {});
    const formEl = document.getElementById("formPagoRepresentante");
    const msgEstadoEl = document.getElementById("mensajeEstado");
    if (formEl) formEl.classList.remove("oculto");
    if (msgEstadoEl) msgEstadoEl.textContent = "";
  }

  function mostrarAvisoFormulario(mensaje, esError = true) {
    const msgEstadoEl = document.getElementById("mensajeEstado");
    if (!msgEstadoEl) return;
    msgEstadoEl.style.color = esError ? "#b91c1c" : "#15803d";
    msgEstadoEl.textContent = sanitizarTextoPlano(mensaje, 220);
  }

  async function manejarBusquedaCedula() {
    const inputCed = document.getElementById("inputBuscarCedula");
    const msgBusq = document.getElementById("mensajeBusqueda");
    const form = document.getElementById("formPagoRepresentante");

    const valorLimpio = limpiarEntradaCedula(inputCed ? inputCed.value : "");
    if (inputCed) inputCed.value = valorLimpio;

    if (!valorLimpio || !esCedulaValida(valorLimpio)) {
      if (form) form.classList.add("oculto");
      registroActual = null;
      alumnoSeleccionadoActual = null;
      if (msgBusq) {
        msgBusq.style.color = "#b91c1c";
        msgBusq.textContent = "Ingresa un número de cédula válido.";
      }
      if (inputCed) inputCed.focus();
      return;
    }

    await obtenerPagosDesdeSupabase();
    const encontrado = buscarPorCedula(valorLimpio);
    if (!encontrado) {
      if (form) form.classList.add("oculto");
      registroActual = null;
      alumnoSeleccionadoActual = null;
      if (msgBusq) {
        msgBusq.style.color = "#b91c1c";
        msgBusq.textContent = "No se encontró ningún registro con esa cédula. Verifica e intenta de nuevo.";
      }
      return;
    }

    if (msgBusq) {
      msgBusq.style.color = "#0369a1";
      msgBusq.textContent = "Selecciona el o los meses a cancelar y completa los datos del pago.";
    }
    cargarRegistroEnFormulario(encontrado);
  }

  function construirUrlWhatsapp(datosPago, fechaLegible) {
    const mensaje =
      `Reporte de Pago - *UEI SAN ANTONIO CA*\n` +
      `- Representante: ${sanitizarTextoPlano(datosPago.representante.nombreApellido, 140)}\n` +
      `- Cédula Representante: ${sanitizarTextoPlano(datosPago.representante.cedula, 25)}\n` +
      `- Dirección Representante: ${sanitizarTextoPlano(datosPago.representante.direccion, 200)}\n` +
      `- Alumno: ${sanitizarTextoPlano(datosPago.alumno.nombreApellido, 140)} (${sanitizarTextoPlano(datosPago.alumno.gradoSeccion, 20)})\n` +
      `- Concepto: ${sanitizarTextoPlano(datosPago.pago.concepto, 200)}\n` +
      `- Monto USD: $${datosPago.pago.montoUsd} (Equivalente: ${formatearBs(datosPago.pago.montoBs)} | Tasa: ${datosPago.tasaAplicada} Bs.)\n` +
      `- Nro. Referencia: ${limpiarReferenciaNumerica(datosPago.pago.nroReferencia)}\n` +
      `- Fecha: ${sanitizarTextoPlano(fechaLegible, 50)}`;

    return `https://wa.me/${WHATSAPP_INSTITUCION}?text=${encodeURIComponent(mensaje)}`;
  }

  async function iniciarPortalRepresentante() {
    await obtenerPagosDesdeSupabase();

    if (typeof obtenerTasaInmediata === "function") {
      pintarTasaRepresentante(obtenerTasaInmediata());
    } else {
      pintarTasaRepresentante({
        tasa: tasaActivaRepresentante,
        fechaValor: new Date().toISOString().slice(0, 10),
        origen: origenTasaInterno
      });
    }

    document.addEventListener("visibilitychange", async () => {
      if (!document.hidden && alumnoSeleccionadoActual) {
        await obtenerPagosDesdeSupabase();
        renderizarAlumno(alumnoSeleccionadoActual);
      }
    });

    const inputBuscarCedulaEl = document.getElementById("inputBuscarCedula");
    if (inputBuscarCedulaEl) {
      inputBuscarCedulaEl.addEventListener("input", () => {
        const filtrada = limpiarEntradaCedula(inputBuscarCedulaEl.value);
        if (inputBuscarCedulaEl.value !== filtrada) {
          inputBuscarCedulaEl.value = filtrada;
        }
      });
      inputBuscarCedulaEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          manejarBusquedaCedula();
        }
      });
    }

    document.getElementById("btnBuscarCedula")?.addEventListener("click", manejarBusquedaCedula);

    const repDirEl = document.getElementById("repDireccion");
    if (repDirEl) {
      repDirEl.addEventListener("input", () => {
        const limpia = String(repDirEl.value ?? "").replace(/[<>`]/g, "").slice(0, 200);
        if (repDirEl.value !== limpia) {
          repDirEl.value = limpia;
        }
      });
    }

    const refEl = document.getElementById("nroReferencia");
    if (refEl) {
      refEl.addEventListener("input", () => {
        const soloNumeros = limpiarReferenciaNumerica(refEl.value);
        if (refEl.value !== soloNumeros) {
          refEl.value = soloNumeros;
        }
      });
    }

    const conceptoEl = document.getElementById("concepto");
    if (conceptoEl) {
      conceptoEl.addEventListener("keydown", (e) => e.preventDefault());
      conceptoEl.addEventListener("paste", (e) => e.preventDefault());
    }

    const montoUsdEl = document.getElementById("montoUsd");
    if (montoUsdEl) {
      montoUsdEl.addEventListener("keydown", (e) => {
        const teclasPermitidas = [
          "Backspace", "Delete", "Tab", "Escape", "Enter",
          "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"
        ];
        if (teclasPermitidas.includes(e.key) || e.ctrlKey || e.metaKey) return;
        if (e.key === ".") {
          if (montoUsdEl.value.includes(".")) e.preventDefault();
          return;
        }
        if (!/^[0-9]$/.test(e.key)) {
          e.preventDefault();
        }
      });

      montoUsdEl.addEventListener("input", () => {
        const filtrado = limpiarMontoUsd(montoUsdEl.value);
        if (montoUsdEl.value !== filtrado) {
          montoUsdEl.value = filtrado;
        }
        sincronizarMesesDesdeMontoUsd();
      });
    }

    const form = document.getElementById("formPagoRepresentante");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!registroActual || !alumnoSeleccionadoActual) {
          mostrarAvisoFormulario("Primero busca y selecciona un alumno válido.");
          return;
        }

        const dirIngresada = sanitizarTextoPlano(repDirEl ? repDirEl.value : "", 200);
        if (esDireccionNoRegistrada(dirIngresada)) {
          mostrarAvisoFormulario("Ingrese una dirección válida.");
          if (repDirEl) {
            repDirEl.value = "";
            repDirEl.placeholder = "Ingrese una dirección válida";
            repDirEl.focus();
          }
          return;
        }

        const montoLimpio = limpiarMontoUsd(document.getElementById("montoUsd").value);
        if (montoUsdEl) montoUsdEl.value = montoLimpio;
        const usd = parseFloat(montoLimpio);

        const nroRef = limpiarReferenciaNumerica(document.getElementById("nroReferencia").value);
        if (refEl) refEl.value = nroRef;

        if (!Number.isFinite(usd) || usd <= 0) {
          mostrarAvisoFormulario("Ingresa o selecciona un monto válido en USD.");
          if (montoUsdEl) montoUsdEl.focus();
          return;
        }

        if (!nroRef || !/^\d{4,20}$/.test(nroRef)) {
          mostrarAvisoFormulario("Ingrese el numero de referencia.");
          if (refEl) refEl.focus();
          return;
        }

        const ahora = new Date();
        const fechaLegible = formatearFechaHoraMensaje(ahora);
        const montoBsCalc = Number((usd * tasaActivaRepresentante).toFixed(2));
        const mesesSeleccionados = Array.from(
          document.querySelectorAll("#listaMesesPendientes input[type='checkbox']:checked:not(:disabled)")
        ).map((cb) => normalizarMesConAno(cb.value));

        const conceptoFinal = mesesSeleccionados.length > 0
          ? `Mensualidad: ${mesesSeleccionados.join(", ")}`
          : sanitizarTextoPlano(document.getElementById("concepto")?.value || "General", 200);

        if (conceptoEl) {
          conceptoEl.value = conceptoFinal;
        }

        const registro = {
          id: "REP-" + ahora.getTime(),
          fechaRegistro: ahora.toISOString(),
          fechaLegible,
          tasaAplicada: tasaActivaRepresentante,
          origenTasa: origenTasaInterno,
          representante: {
            nombreApellido: sanitizarTextoPlano(document.getElementById("repNombre").value, 140),
            cedula: sanitizarTextoPlano(document.getElementById("repCedula").value, 25),
            direccion: dirIngresada,
            telefono: sanitizarTextoPlano(document.getElementById("repTelefono").value, 80)
          },
          alumno: {
            cedula: sanitizarTextoPlano(alumnoSeleccionadoActual.cedula || "", 25),
            nombreApellido: sanitizarTextoPlano(document.getElementById("aluNombre").value, 140),
            gradoSeccion: sanitizarTextoPlano(document.getElementById("aluGradoSeccion").value, 20)
          },
          mesesPagados: mesesSeleccionados,
          pago: {
            montoUsd: usd,
            montoBs: montoBsCalc,
            nroReferencia: nroRef,
            concepto: conceptoFinal
          },
          estado: "En revisión"
        };

        const lista = leerHistorialPagosRep();
        lista.unshift(registro);
        guardarHistorialPagosRep(lista);

        if (mesesSeleccionados.length > 0) {
          const todosEstados = leerEstadosMesesGlobal();
          const claveAlu = obtenerClaveAlumno(alumnoSeleccionadoActual);
          if (!todosEstados[claveAlu]) todosEstados[claveAlu] = {};
          mesesSeleccionados.forEach((mes) => {
            todosEstados[claveAlu][mes] = "revision";
          });
          guardarEstadosMesesGlobal(todosEstados);
        }

        const msgEl = document.getElementById("mensajeEstado");
        let guardadoEnNube = false;

        try {
          await enviarPagoASupabase(registro);
          guardadoEnNube = true;
        } catch (err) {
          console.error(err);
        }

        const urlWa = construirUrlWhatsapp(registro, fechaLegible);
        window.open(urlWa, "_blank", "noopener");

        renderizarAlumno(alumnoSeleccionadoActual);
        const montoBsEl = document.getElementById("montoBs");
        if (refEl) refEl.value = "";
        if (conceptoEl) conceptoEl.value = "";
        if (montoUsdEl) montoUsdEl.value = "";
        if (montoBsEl) montoBsEl.value = "";
        actualizarResumenLateral(0, 0, 0);

        if (msgEl) {
          msgEl.style.color = guardadoEnNube ? "#15803d" : "#b45309";
          msgEl.textContent = guardadoEnNube
            ? `Pago (Ref: ${registro.pago.nroReferencia}).En revisión`
            : `Pago guardado localmente (Ref: ${registro.pago.nroReferencia}), pero hubo un problema al sincronizar con Supabase. Revisa la consola.`;
        }
      });
    }

    if (typeof obtenerTasaUSDActual === "function") {
      const actualizada = await obtenerTasaUSDActual();
      pintarTasaRepresentante(actualizada);
    }
  }

  document.addEventListener("DOMContentLoaded", iniciarPortalRepresentante);
})();