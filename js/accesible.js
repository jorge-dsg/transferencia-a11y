/* ==========================================================================
   accesible.js — comportamiento de la versión accesible.
   Requiere datos.js (se carga antes). Índice:
     1. Atajos y estado
     2. Montos en palabras (para lectores de pantalla)
     3. Pintar la pantalla de inicio
     4. Cambiar de pantalla (título, foco, pasos)
     5. Validación del formulario
     6. Confirmar y procesar
     7. Teclado en pantalla (VoiceOver: mantener el foco en el campo)
     8. Eventos e inicio
   ========================================================================== */

/* 1. ATAJOS Y ESTADO ------------------------------------------------------ */
const $ = (id) => document.getElementById(id);

const TITULOS = [
  "Inicio",
  "Transferir dinero – Paso 1 de 3",
  "Confirmar transferencia – Paso 2 de 3",
  "Transferencia realizada – Paso 3 de 3"
];

let saldo = SALDO_INICIAL;
const movimientos = [...MOVIMIENTOS_INICIALES];
let transferencia = {};   // datos del paso 1, para mostrarlos en el paso 2 y 3


/* 2. MONTOS EN PALABRAS --------------------------------------------------- *
 * Un lector leería "1.250.000" como "uno punto doscientos cincuenta…".
 * Por eso cada monto se muestra con aria-hidden y se acompaña de un texto
 * oculto en palabras: "un millón doscientos cincuenta mil pesos".          */
const UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DECENAS  = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

/* "uno" -> "un", "veintiuno" -> "veintiún" (cuando va antes de "mil", "millones" o "pesos") */
const apocope = (texto) => texto.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");

/* 0–999 en palabras */
function menorAMil(n) {
  if (n === 100) return "cien";
  const partes = [];
  const centenas = Math.floor(n / 100);
  const resto = n % 100;
  if (centenas) partes.push(CENTENAS[centenas]);
  if (resto < 30) {
    if (resto) partes.push(UNIDADES[resto]);
  } else {
    const unidad = resto % 10;
    partes.push(DECENAS[Math.floor(resto / 10)] + (unidad ? " y " + UNIDADES[unidad] : ""));
  }
  return partes.join(" ");
}

/* 1800 -> "mil ochocientos" */
function enPalabras(n) {
  if (n === 0) return "cero";
  const millones = Math.floor(n / 1e6);
  const miles = Math.floor((n % 1e6) / 1000);
  const resto = n % 1000;
  const partes = [];
  if (millones) partes.push(millones === 1 ? "un millón" : apocope(menorAMil(millones)) + " millones");
  if (miles)    partes.push(miles === 1 ? "mil" : apocope(menorAMil(miles)) + " mil");
  if (resto)    partes.push(apocope(menorAMil(resto)));
  return partes.join(" ") + (millones && !miles && !resto ? " de" : "");   // "un millón de pesos"
}

/* 1800 -> "mil ochocientos pesos" */
function montoHablado(n) {
  return enPalabras(n) + (n === 1 ? " peso" : " pesos");
}

/* HTML de un monto: "$1.800" a la vista, "mil ochocientos pesos" al lector */
function montoHTML(n) {
  return `<span aria-hidden="true">${formatearMonto(n)}</span><span class="sr-only">${montoHablado(n)}</span>`;
}


/* 3. PINTAR LA PANTALLA DE INICIO ----------------------------------------- */
function estiloAvatar(color) {
  return `--bg:${COLORES_AVATAR[color][0]};--fg:${COLORES_AVATAR[color][1]}`;
}

/* Visualmente el signo (+ / −) indica abono o cargo; el lector lo dice con palabras.
   Cada movimiento se lee como UNA frase y la parte visual se oculta al lector:
   "Sueldo Empresa Andes, hoy a las 09:12. Abono de ochocientos cincuenta mil pesos." */
function htmlMovimiento(m) {
  const esAbono = m.monto > 0;
  const valor = Math.abs(m.monto);
  const tipo = esAbono ? "Abono" : "Cargo";
  return `
    <li class="mov">
      <span class="sr-only">${m.nombre}, ${fechaHablada(m.fecha)}. ${tipo} de ${montoHablado(valor)}.</span>
      <span class="mov-vis" aria-hidden="true">
        <span class="av" style="${estiloAvatar(m.color)}">${m.iniciales}</span>
        <span class="mov-dat"><span class="mov-n">${m.nombre}</span><span class="mov-f">${m.fecha}</span></span>
        <span class="monto-mov ${esAbono ? "pos" : "neg"}">${esAbono ? "+" : "−"}${formatearMonto(valor)}</span>
      </span>
    </li>`;
}

function pintarInicio() {
  $("saldo-vis").textContent = formatearMonto(saldo);
  $("saldo-voz").textContent = "Saldo total: " + montoHablado(saldo) + ". Cuenta corriente terminada en 4 8 2 1.";
  $("ayuda-monto").textContent = "Escribe solo números. Máximo " + formatearMonto(saldo) + ".";
  $("ayuda-monto-voz").textContent = "Escribe solo números. Máximo " + montoHablado(saldo) + ".";
  $("movs").innerHTML = movimientos.map(htmlMovimiento).join("");
}


/* 4. CAMBIAR DE PANTALLA ---------------------------------------------------
 * 0 = inicio, 1 = datos, 2 = confirmar, 3 = listo.
 * Al cambiar: se actualiza el título de la pestaña, el indicador de pasos
 * y el foco pasa al <h1>. Después del título el lector encuentra el indicador
 * de pasos ("Paso 1 de 3: Datos, paso actual…"), que se lee una sola vez.  */
function irA(pantalla, moverFoco = true) {
  for (let i = 0; i <= 3; i++) $("v" + i).hidden = i !== pantalla;

  document.querySelectorAll(".paso").forEach((paso) => {
    const numero = Number(paso.dataset.p);
    paso.classList.toggle("on", numero === pantalla);
    paso.classList.toggle("hecho", numero < pantalla);
    if (numero === pantalla) paso.setAttribute("aria-current", "step");
    else paso.removeAttribute("aria-current");
    paso.querySelector(".est").textContent = numero === pantalla ? ", paso actual" : numero < pantalla ? ", completado" : "";
  });

  document.title = TITULOS[pantalla] + " – Banco Demo (versión accesible)";
  $("screen").scrollTop = 0;
  window.scrollTo(0, 0);
  if (moverFoco) $("t" + pantalla).focus({ preventScroll: true });
}


/* CAMPO MONTO --------------------------------------------------------------
 * El valor del campo lleva SOLO dígitos ("200000"). Si llevara puntos
 * ("200.000"), el lector lo leería como decimal ("doscientos punto cero…").
 * El monto con formato y en palabras se muestra debajo:
 *   a la vista:  "$200.000 · Doscientos mil pesos"
 *   al lector:   "Doscientos mil pesos"  (como descripción del campo)       */
const soloDigitos = (texto) => texto.replace(/\D/g, "").replace(/^0+(?=\d)/, "");

function actualizarMonto() {
  const campo = $("monto");
  const digitosAntesDelCursor = soloDigitos(campo.value.slice(0, campo.selectionStart)).length;
  const digitos = soloDigitos(campo.value);

  // Solo se reescribe el valor si cambió (p. ej. se escribió una letra):
  // reasignarlo igual hace que el lector vuelva a leer el campo.
  if (campo.value !== digitos) {
    campo.value = digitos;
    campo.setSelectionRange(digitosAntesDelCursor, digitosAntesDelCursor);
  }

  const n = Number(digitos);
  const hablado = n > 0 ? montoHablado(n).replace(/^./, (c) => c.toUpperCase()) : "";
  $("monto-voz").textContent = hablado;
  $("monto-letras").textContent = n > 0 ? formatearMonto(n) + " · " + hablado : "";
}


/* 5. VALIDACIÓN DEL FORMULARIO -------------------------------------------- */
const radios = () => document.querySelectorAll('input[name="dest"]');

function mostrarErrorDestinatario(mensaje) {
  $("err-destinatario").textContent = mensaje;
  radios().forEach((r) => (mensaje ? r.setAttribute("aria-invalid", "true") : r.removeAttribute("aria-invalid")));
}

function mostrarErrorMonto(mensajeHTML) {
  $("err-monto").innerHTML = mensajeHTML;
  if (mensajeHTML) $("monto").setAttribute("aria-invalid", "true");
  else $("monto").removeAttribute("aria-invalid");
}

/* Devuelve el mensaje de error del monto, o "" si es válido */
function validarMonto(texto) {
  const monto = Number(texto);
  if (!texto) return "Ingresa el monto a transferir.";
  if (monto <= 0) return "El monto debe ser mayor a cero.";
  if (monto > saldo) return "El monto supera tu saldo disponible de " + montoHTML(saldo) + ".";
  return "";
}

/* Resumen de errores arriba del formulario: recibe el foco y enlaza a cada campo */
function mostrarResumenErrores(errores) {
  $("lista-errores").innerHTML = errores.map(([idCampo, mensaje]) => `<li><a href="#${idCampo}">${mensaje}</a></li>`).join("");
  $("titulo-errores").textContent = errores.length === 1 ? "Hay 1 error en el formulario:" : `Hay ${errores.length} errores en el formulario:`;
  $("resumen").hidden = false;
  $("resumen").focus();
}

function alEnviarFormulario(evento) {
  evento.preventDefault();
  const errores = [];

  const radioElegido = document.querySelector('input[name="dest"]:checked');
  if (radioElegido) {
    mostrarErrorDestinatario("");
  } else {
    const mensaje = "Selecciona a quién quieres transferir.";
    mostrarErrorDestinatario(mensaje);
    errores.push(["dest-mg", mensaje]);
  }

  const textoMonto = soloDigitos($("monto").value);
  const errorMonto = validarMonto(textoMonto);
  mostrarErrorMonto(errorMonto);
  if (errorMonto) errores.push(["monto", errorMonto]);

  if (errores.length) return mostrarResumenErrores(errores);

  $("resumen").hidden = true;
  transferencia = { contacto: CONTACTOS[radioElegido.value], monto: Number(textoMonto), mensaje: $("mensaje").value.trim() };
  pintarConfirmacion();
  irA(2);
}


/* 6. CONFIRMAR Y PROCESAR ------------------------------------------------- */
/* Cada fila se lee como UNA frase ("Monto, nueve mil pesos"); lo visual va aria-hidden.
   La fila es: <p class="fila"> <span class="sr-only">frase</span> <span class="fila-k">…</span> <span class="fila-v">…</span> </p> */
function llenarFila(idFila, etiqueta, valorVisible, valorHablado = valorVisible) {
  const fila = $(idFila);
  fila.querySelector(".sr-only").textContent = `${etiqueta}, ${valorHablado}`;
  fila.querySelector(".fila-v").textContent = valorVisible;
}

function pintarConfirmacion() {
  const { contacto, monto, mensaje } = transferencia;
  // "••" se leería "viñeta": a la vista va el símbolo, al lector "terminada en"
  llenarFila("fila-dest", "Destinatario", `${contacto.nombre}, ${contacto.cuenta}`, `${contacto.nombre}, ${contacto.cuentaHablada}`);
  llenarFila("fila-monto", "Monto", formatearMonto(monto), montoHablado(monto));
  llenarFila("fila-msg", "Mensaje", mensaje || "Sin mensaje");
}

function pintarComprobante() {
  const { contacto, monto } = transferencia;
  const numero = numeroComprobante();
  // Una sola frase para el lector (si se mezclan trozos, lo lee por partes): "Transferiste nueve mil pesos a Ana Rojas."
  $("texto-exito").innerHTML = `<span aria-hidden="true">Transferiste ${formatearMonto(monto)} a ${contacto.nombre}.</span>` +
    `<span class="sr-only">Transferiste ${montoHablado(monto)} a ${contacto.nombre}.</span>`;
  llenarFila("r-fila-monto", "Monto", formatearMonto(monto), montoHablado(monto));
  llenarFila("r-fila-dest", "Destinatario", contacto.nombre);
  llenarFila("r-fila-fecha", "Fecha", fechaHoy());
  llenarFila("r-fila-comp", "Número de comprobante", numero, numero.split("").join(" "));   // dígito a dígito
}

function alConfirmar() {
  const boton = $("btn-confirmar");
  if (boton.getAttribute("aria-disabled") === "true") return;   // evita doble envío sin perder el foco

  boton.setAttribute("aria-disabled", "true");
  boton.textContent = "Transfiriendo…";
  $("anuncio").textContent = "Transfiriendo tu dinero, espera un momento.";   // región aria-live

  setTimeout(() => {
    const { contacto, monto } = transferencia;
    saldo -= monto;
    movimientos.unshift({ nombre: contacto.nombre, fecha: "Hoy", monto: -monto, iniciales: contacto.iniciales, color: contacto.color });
    pintarInicio();
    pintarComprobante();

    boton.removeAttribute("aria-disabled");
    boton.textContent = "Confirmar y transferir";
    $("anuncio").textContent = "";
    irA(3);
  }, 1200);
}

function reiniciarFormulario() {
  $("form").reset();
  actualizarMonto();
  mostrarErrorDestinatario("");
  mostrarErrorMonto("");
  $("resumen").hidden = true;
}


/* 7. TECLADO EN PANTALLA (VoiceOver en iPhone) ------------------------------
 * Al cerrar el teclado el campo pierde el foco y VoiceOver salta al primer
 * elemento de la página (el botón de arriba). Para que se quede en el campo:
 *  1. Cuando un campo pierde el foco sin que pase a otro control (blur con
 *     relatedTarget nulo, típico de cerrar el teclado), se lo devolvemos.
 *  2. Antes de devolverlo ponemos inputmode="none": así el foco vuelve al
 *     campo SIN reabrir el teclado (y sin cambiar su semántica para el lector).
 *  3. Con un toque (doble toque de VoiceOver) se restaura el teclado normal y
 *     el campo se vuelve a enfocar: el teclado se abre.
 * Solo en pantallas táctiles; en escritorio no hace nada.                   */
const CAMPOS_CON_TECLADO = [$("monto"), $("mensaje")];
const ES_TACTIL = window.matchMedia("(pointer: coarse)").matches;
let reabriendo = false;   // true mientras nosotros mismos reabrimos el teclado

CAMPOS_CON_TECLADO.forEach((campo) => {
  const modoOriginal = campo.getAttribute("inputmode");   // "numeric" o nada
  const restaurarTeclado = () => (modoOriginal ? campo.setAttribute("inputmode", modoOriginal) : campo.removeAttribute("inputmode"));
  const devolverFoco = () => {
    if (document.activeElement !== document.body) return;   // el usuario ya está en otro control
    campo.setAttribute("inputmode", "none");                 // enfocar sin abrir el teclado
    campo.focus({ preventScroll: true });
  };

  campo.addEventListener("blur", (evento) => {
    restaurarTeclado();
    if (!ES_TACTIL || reabriendo || evento.relatedTarget) return;
    setTimeout(devolverFoco, 0);     // el cierre del teclado aún se está animando:
    setTimeout(devolverFoco, 400);   // reintentamos por si iOS lo deshizo
  });

  campo.addEventListener("click", () => {
    if (campo.getAttribute("inputmode") !== "none") return;   // ya tiene teclado: se abre solo
    reabriendo = true;
    restaurarTeclado();
    campo.blur();
    campo.focus();                    // dentro del gesto del usuario: abre el teclado
    reabriendo = false;
  });
});


/* 8. EVENTOS E INICIO ----------------------------------------------------- */
$("form").addEventListener("submit", alEnviarFormulario);

/* Los enlaces del resumen de errores llevan el foco al campo */
$("lista-errores").addEventListener("click", (evento) => {
  const enlace = evento.target.closest("a");
  if (!enlace) return;
  evento.preventDefault();
  $(enlace.getAttribute("href").slice(1)).focus();
});

/* El error desaparece cuando el usuario corrige */
radios().forEach((r) => r.addEventListener("change", () => mostrarErrorDestinatario("")));
$("monto").addEventListener("input", () => { actualizarMonto(); if ($("err-monto").innerHTML) mostrarErrorMonto(""); });

$("btn-ir").addEventListener("click", () => irA(1));
document.querySelectorAll("[data-volver]").forEach((b) => b.addEventListener("click", () => irA(Number(b.dataset.volver))));
$("btn-volver").addEventListener("click", () => irA(1));
$("btn-confirmar").addEventListener("click", alConfirmar);
$("btn-nueva").addEventListener("click", () => { reiniciarFormulario(); irA(1); });
$("btn-inicio").addEventListener("click", () => { reiniciarFormulario(); irA(0); });

pintarInicio();
irA(0, false);   // sin mover el foco: así el skip link sigue siendo lo primero con Tab
