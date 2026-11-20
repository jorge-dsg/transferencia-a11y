/* ==========================================================================
   accesible.js — comportamiento de la versión accesible.
   Requiere datos.js (se carga antes). Índice:
     1. Atajos y estado
     2. Montos en palabras (para lectores de pantalla)
     3. Pintar la pantalla de inicio
     4. Cambiar de pantalla (título, foco, pasos)
     5. Validación del formulario
     6. Confirmar y procesar
     7. Eventos e inicio
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
  $("saldo-voz").textContent = montoHablado(saldo);
  $("ayuda-monto").innerHTML = "Escribe solo números. Máximo " + montoHTML(saldo) + ".";
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


/* FORMATO DEL CAMPO MONTO ------------------------------------------------- *
 * Mientras se escribe, el campo muestra pesos: 1800 -> "$1.800".
 * Debajo se muestra el monto en palabras (también lo lee el lector).        */
const soloDigitos = (texto) => texto.replace(/\D/g, "").replace(/^0+(?=\d)/, "");

function actualizarMonto() {
  const campo = $("monto");
  const digitosAntesDelCursor = soloDigitos(campo.value.slice(0, campo.selectionStart)).length;
  const digitos = soloDigitos(campo.value);
  campo.value = digitos ? formatearMonto(Number(digitos)) : "";
  $("monto-letras").textContent = digitos && Number(digitos) > 0
    ? montoHablado(Number(digitos)).replace(/^./, (c) => c.toUpperCase())
    : "";

  // Deja el cursor después del mismo dígito en que estaba
  let cuenta = 0, posicion = campo.value.length;
  if (digitosAntesDelCursor === 0) posicion = campo.value ? 1 : 0;   // después del "$"
  else for (let i = 0; i < campo.value.length; i++) {
    if (/\d/.test(campo.value[i]) && ++cuenta === digitosAntesDelCursor) { posicion = i + 1; break; }
  }
  campo.setSelectionRange(posicion, posicion);
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
function pintarConfirmacion() {
  const { contacto, monto, mensaje } = transferencia;
  // "••" se leería "viñeta": a la vista va el símbolo, al lector "terminada en"
  $("c-dest").innerHTML = `<span aria-hidden="true">${contacto.nombre}, ${contacto.cuenta}</span>` +
    `<span class="sr-only">${contacto.nombre}, ${contacto.cuentaHablada}</span>`;
  $("c-monto").innerHTML = montoHTML(monto);
  $("c-msg").textContent = mensaje || "Sin mensaje";
}

function pintarComprobante() {
  const { contacto, monto } = transferencia;
  $("texto-exito").innerHTML = `Transferiste ${montoHTML(monto)} a ${contacto.nombre}.`;
  $("r-monto").innerHTML = montoHTML(monto);
  $("r-dest").textContent = contacto.nombre;
  $("r-fecha").textContent = fechaHoy();
  $("comprobante").textContent = numeroComprobante();
}

function alConfirmar() {
  const boton = $("btn-confirmar");
  if (boton.getAttribute("aria-disabled") === "true") return;   // evita doble envío sin perder el foco

  boton.setAttribute("aria-disabled", "true");
  boton.textContent = "Procesando…";
  $("anuncio").textContent = "Procesando la transferencia, espera un momento.";   // región aria-live

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


/* 7. EVENTOS E INICIO ----------------------------------------------------- */
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
