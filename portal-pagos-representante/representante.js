(function () {
  "use strict";

  const SUPABASE_URL = "https://lnluwygaehlqsdpwouvv.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_i7qcIcbkjSjZkqjVSt-jUA_ZR7RQlTA";
  const SUPABASE_PAGOS_ENDPOINT = `${SUPABASE_URL}/rest/v1/pagos`;
  const WHATSAPP_INSTITUCION = "584248912975";
  const CLAVE_PAGOS_REP = "pagos_representantes_v1";
  const CLAVE_ESTADOS_MESES_ALU = "estados_meses_alumnos_v1";
  const CLAVE_LIMPIEZA_INICIAL = "limpieza_inicial_pagos_v1";
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

  const PADRON_REPRESENTANTES = [];

  function obtenerPadronActivo() {
    if (typeof PADRON_INICIAL !== "undefined" && Array.isArray(PADRON_INICIAL) && PADRON_INICIAL.length > 0) {
      return PADRON_INICIAL;
    }
    return PADRON_REPRESENTANTES;
  }

  let tasaActivaRepresentante = typeof CONFIG_TASA_BCV !== "undefined" ? CONFIG_TASA_BCV.tasaInicial : 1;
  let origenTasaInterno = typeof CONFIG_TASA_BCV !== "undefined"
    ? `Tasa Inicial Fijada (${CONFIG_TASA_BCV.fechaFijada || "24-11-2026"})`
    : "Base";
  let registroActual = null;
  let alumnoSeleccionadoActual = null;

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
    localStorage.setItem(CLAVE_PAGOS_REP, JSON.stringify(lista));
  }

  function cabecerasSupabase() {
    return {
      "Content-Type": "application/json",
      "apikey": SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Prefer": "return=representation"
    };
  }

  async function enviarPagoASupabase(registroPago) {
    const metodoEl = document.getElementById("metodoPago") || document.getElementById("metodo");
    const metodoValor = metodoEl && metodoEl.value ? metodoEl.value.trim() : "Transferencia / Pago Móvil";

    const payload = {
      referencia: String(registroPago.pago?.nroReferencia || "").trim(),
      alumno: String(registroPago.alumno?.nombreApellido || "").trim(),
      cedula_alumno: String(registroPago.alumno?.cedula || "").trim(),
      cedula_representante: String(registroPago.representante?.cedula || "").trim(),
      seccion: String(registroPago.alumno?.gradoSeccion || "").trim(),
      meses: Array.isArray(registroPago.mesesPagados)
        ? registroPago.mesesPagados.join(", ")
        : String(registroPago.pago?.concepto || ""),
      metodo: metodoValor,
      monto: Number(registroPago.pago?.montoBs || registroPago.pago?.montoUsd || 0) || 0,
      tasa_bcv: Number(registroPago.tasaAplicada || 0) || 0,
      estado: "Pendiente",
      motivo: ""
    };

    const resp = await fetch(SUPABASE_PAGOS_ENDPOINT, {
      method: "POST",
      headers: cabecerasSupabase(),
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Error al guardar en Supabase (${resp.status}): ${errText}`);
    }

    const data = await resp.json();
    return Array.isArray(data) ? data[0] : data;
  }

  function leerEstadosMesesGlobal() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_ESTADOS_MESES_ALU) || "{}");
    } catch {
      return {};
    }
  }

  function guardarEstadosMesesGlobal(mapa) {
    localStorage.setItem(CLAVE_ESTADOS_MESES_ALU, JSON.stringify(mapa));
  }

  function obtenerMapaMesesAlumno(alumno) {
    const todos = leerEstadosMesesGlobal();
    const clave = obtenerClaveAlumno(alumno);
    return todos[clave] || {};
  }

  function aplicarLimpiezaInicialUnaVez() {
    if (!localStorage.getItem(CLAVE_LIMPIEZA_INICIAL)) {
      localStorage.removeItem(CLAVE_PAGOS_REP);
      localStorage.removeItem(CLAVE_ESTADOS_MESES_ALU);
      localStorage.setItem(CLAVE_LIMPIEZA_INICIAL, "hecho");
    }
  }

  function normalizarMesConAno(mesTexto) {
    const limpio = String(mesTexto || "").trim();
    const upper = limpio.toUpperCase();
    const meses2026 = ["SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const meses2027 = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO"];

    const encontrado2026 = meses2026.find((m) => upper.startsWith(m));
    if (encontrado2026) {
      return `${encontrado2026.charAt(0) + encontrado2026.slice(1).toLowerCase()} 2026`;
    }

    const encontrado2027 = meses2027.find((m) => upper.startsWith(m));
    if (encontrado2027) {
      return `${encontrado2027.charAt(0) + encontrado2027.slice(1).toLowerCase()} 2027`;
    }

    return limpio;
  }

  window.reiniciarHistorialPruebas = function (recargar = false) {
    localStorage.removeItem(CLAVE_PAGOS_REP);
    localStorage.removeItem(CLAVE_ESTADOS_MESES_ALU);
    localStorage.setItem(CLAVE_LIMPIEZA_INICIAL, "hecho");
    if (alumnoSeleccionadoActual) {
      renderizarAlumno(alumnoSeleccionadoActual);
    }
    if (recargar) {
      window.location.reload();
    }
  };

  window.actualizarEstadoMesAlumno = function (alumno, meses, nuevoEstado) {
    const todos = leerEstadosMesesGlobal();
    const clave = obtenerClaveAlumno(alumno);
    if (!todos[clave]) todos[clave] = {};

    (meses || []).forEach((mes) => {
      const mesNorm = normalizarMesConAno(mes);
      todos[clave][mesNorm] = nuevoEstado;
    });

    guardarEstadosMesesGlobal(todos);
    if (alumnoSeleccionadoActual && obtenerClaveAlumno(alumnoSeleccionadoActual) === clave) {
      renderizarAlumno(alumnoSeleccionadoActual);
    }
  };

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
      origenTasaInterno = estadoTasa.origen;
    }

    const infoTasaEl = document.getElementById("infoTasa");
    if (!infoTasaEl) return;

    infoTasaEl.innerHTML = `
      <div>
        <strong>Tasa USD Activa:</strong> ${tasaActivaRepresentante.toLocaleString("es-VE", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} Bs.
        &nbsp;|&nbsp; <strong>Fecha:</strong> ${estadoTasa?.fechaValor || new Date().toISOString().slice(0, 10)}
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

  function sincronizarSeleccionMeses() {
    actualizarEstiloChips();

    const checks = Array.from(document.querySelectorAll("#listaMesesPendientes input[type='checkbox']:checked:not(:disabled)"));
    const conceptoInput = document.getElementById("concepto");
    const inputUsd = document.getElementById("montoUsd");

    if (checks.length > 0) {
      const mesesElegidos = checks.map((c) => c.value);
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

    const pagos = leerHistorialPagosRep().filter((p) => {
      const cedMatch = normalizarCedula(p.alumno?.cedula) && normalizarCedula(p.alumno?.cedula) === normalizarCedula(alumno.cedula);
      const nomMatch = String(p.alumno?.nombreApellido || "").trim().toUpperCase() === String(alumno.nombreApellido || "").trim().toUpperCase();
      return cedMatch || nomMatch;
    });

    if (!pagos.length) {
      box.innerHTML = "<strong>Estatus de reportes:</strong> Sin pagos registrados aún.";
      return;
    }

    const itemsHtml = pagos.slice(0, 5).map((p) => {
      const est = p.estado || "En revisión";
      const color = est.toLowerCase().includes("aprob") ? "#15803d" : (est.toLowerCase().includes("rechaz") ? "#c2410c" : "#b91c1c");
      const motivoTxt = p.motivo ? ` — <em>Motivo: ${p.motivo}</em>` : "";
      return `<div style="margin-top:4px;">• Ref <strong>${p.pago?.nroReferencia || p.id}</strong> (${p.pago?.concepto || ""}): <span style="color:${color};font-weight:bold;">${est}</span>${motivoTxt}</div>`;
    }).join("");

    box.innerHTML = `<strong>Estatus de pagos reportados:</strong>${itemsHtml}`;
  }

  function renderizarAlumno(alumno) {
    alumnoSeleccionadoActual = alumno;
    const nombreEl = document.getElementById("aluNombre");
    const secEl = document.getElementById("aluGradoSeccion");
    if (nombreEl) nombreEl.value = alumno?.nombreApellido || "";
    if (secEl) secEl.value = alumno?.gradoSeccion || "";

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

      const tagEstado = document.createElement("span");
      tagEstado.className = "chip-estado-tag";
      if (estadoMes === "revision") {
        tagEstado.textContent = "En revisión";
      } else if (estadoMes === "aprobado") {
        tagEstado.textContent = "Pagado";
      } else if (estadoMes === "rechazado") {
        tagEstado.textContent = "Rechazado (reintentar)";
      } else {
        tagEstado.textContent = "$50";
      }

      label.appendChild(tagEstado);
      listaMeses.appendChild(label);
    });

    renderizarEstadoReportesAlumno(alumno);
    sincronizarSeleccionMeses();
  }

  function cargarRegistroEnFormulario(registro) {
    registroActual = registro;
    const rep = registro.representante || {};
    const alumnos = registro.alumnos || [];

    document.getElementById("repNombre").value = rep.nombreApellido || "";
    document.getElementById("repCedula").value = rep.cedula || "";
    document.getElementById("repDireccion").value = rep.direccion || "";
    document.getElementById("repTelefono").value = rep.telefono || "";

    const contSelector = document.getElementById("contenedorSelectorAlumno");
    const selectAlumno = document.getElementById("selectorAlumno");
    selectAlumno.innerHTML = "";

    if (alumnos.length > 1) {
      contSelector.classList.remove("oculto");
      alumnos.forEach((alu, idx) => {
        const opt = document.createElement("option");
        opt.value = String(idx);
        opt.textContent = `${alu.nombreApellido} (${alu.gradoSeccion})`;
        selectAlumno.appendChild(opt);
      });
      selectAlumno.onchange = () => {
        renderizarAlumno(alumnos[Number(selectAlumno.value)] || alumnos[0]);
      };
    } else {
      contSelector.classList.add("oculto");
    }

    renderizarAlumno(alumnos[0] || {});
    document.getElementById("formPagoRepresentante").classList.remove("oculto");
    document.getElementById("mensajeEstado").textContent = "";
  }

  function manejarBusquedaCedula() {
    const inputCed = document.getElementById("inputBuscarCedula");
    const msgBusq = document.getElementById("mensajeBusqueda");
    const form = document.getElementById("formPagoRepresentante");

    const encontrado = buscarPorCedula(inputCed.value);
    if (!encontrado) {
      form.classList.add("oculto");
      registroActual = null;
      alumnoSeleccionadoActual = null;
      msgBusq.style.color = "#b91c1c";
      msgBusq.textContent = "No se encontró ningún registro con esa cédula. Verifica e intenta de nuevo.";
      return;
    }

    msgBusq.style.color = "#0369a1";
    msgBusq.textContent = `Datos encontrados para ${encontrado.representante.nombreApellido}. Selecciona los meses y completa los datos del pago.`;
    cargarRegistroEnFormulario(encontrado);
  }

  function construirUrlWhatsapp(datosPago, fechaLegible) {
    const mensaje =
      `Reporte de Pago - *UEI SAN ANTONIO CA*\n` +
      `- Representante: ${datosPago.representante.nombreApellido}\n` +
      `- Cédula Representante: ${datosPago.representante.cedula}\n` +
      `- Alumno: ${datosPago.alumno.nombreApellido} (${datosPago.alumno.gradoSeccion})\n` +
      `- Concepto: ${datosPago.pago.concepto}\n` +
      `- Monto USD: $${datosPago.pago.montoUsd} (Equivalente: ${formatearBs(datosPago.pago.montoBs)} | Tasa: ${datosPago.tasaAplicada} Bs.)\n` +
      `- Nro. Referencia: ${datosPago.pago.nroReferencia}\n` +
      `- Fecha: ${fechaLegible}`;

    return `https://wa.me/${WHATSAPP_INSTITUCION}?text=${encodeURIComponent(mensaje)}`;
  }

  async function iniciarPortalRepresentante() {
    aplicarLimpiezaInicialUnaVez();

    if (typeof obtenerTasaInmediata === "function") {
      pintarTasaRepresentante(obtenerTasaInmediata());
    } else {
      pintarTasaRepresentante({
        tasa: tasaActivaRepresentante,
        fechaValor: new Date().toISOString().slice(0, 10),
        origen: origenTasaInterno
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && alumnoSeleccionadoActual) {
        renderizarAlumno(alumnoSeleccionadoActual);
      }
    });

    window.addEventListener("storage", (e) => {
      if ((e.key === CLAVE_ESTADOS_MESES_ALU || e.key === CLAVE_PAGOS_REP) && alumnoSeleccionadoActual) {
        renderizarAlumno(alumnoSeleccionadoActual);
      }
    });

    document.getElementById("btnBuscarCedula")?.addEventListener("click", manejarBusquedaCedula);
    document.getElementById("inputBuscarCedula")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        manejarBusquedaCedula();
      }
    });

    const montoUsdEl = document.getElementById("montoUsd");
    if (montoUsdEl) {
      montoUsdEl.addEventListener("input", calcularEquivalenteBs);
    }

    const form = document.getElementById("formPagoRepresentante");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!registroActual || !alumnoSeleccionadoActual) return;

        const usd = parseFloat(document.getElementById("montoUsd").value);
        const nroRef = document.getElementById("nroReferencia").value.trim();
        if (!Number.isFinite(usd) || usd <= 0 || !nroRef) return;

        const ahora = new Date();
        const fechaLegible = formatearFechaHoraMensaje(ahora);
        const montoBsCalc = Number((usd * tasaActivaRepresentante).toFixed(2));
        const mesesSeleccionados = Array.from(
          document.querySelectorAll("#listaMesesPendientes input[type='checkbox']:checked:not(:disabled)")
        ).map((cb) => normalizarMesConAno(cb.value));

        const conceptoFinal = document.getElementById("concepto")?.value.trim() ||
          (mesesSeleccionados.length > 0 ? `Mensualidad: ${mesesSeleccionados.join(", ")}` : "General");

        const registro = {
          id: "REP-" + ahora.getTime(),
          fechaRegistro: ahora.toISOString(),
          fechaLegible,
          tasaAplicada: tasaActivaRepresentante,
          origenTasa: origenTasaInterno,
          representante: {
            nombreApellido: document.getElementById("repNombre").value.trim(),
            cedula: document.getElementById("repCedula").value.trim(),
            direccion: document.getElementById("repDireccion").value.trim(),
            telefono: document.getElementById("repTelefono").value.trim()
          },
          alumno: {
            cedula: alumnoSeleccionadoActual.cedula || "",
            nombreApellido: document.getElementById("aluNombre").value.trim(),
            gradoSeccion: document.getElementById("aluGradoSeccion").value
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
        document.getElementById("nroReferencia").value = "";
        const conceptoEl = document.getElementById("concepto");
        const montoBsEl = document.getElementById("montoBs");
        if (conceptoEl) conceptoEl.value = "";
        if (montoUsdEl) montoUsdEl.value = "";
        if (montoBsEl) montoBsEl.value = "";
        actualizarResumenLateral(0, 0, 0);

        if (msgEl) {
          msgEl.style.color = guardadoEnNube ? "#15803d" : "#b45309";
          msgEl.textContent = guardadoEnNube
            ? `Pago registrado en Supabase (Ref: ${registro.pago.nroReferencia}). Los meses seleccionados pasaron a "En revisión" y se abrió WhatsApp.`
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