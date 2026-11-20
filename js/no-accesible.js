/* ==========================================================================
   no-accesible.js — comportamiento de la versión NO accesible.
   Requiere datos.js. Las funciones son globales porque el HTML las llama
   con onclick="..." (una de las barreras: <div> en vez de <button>).
   Barreras en este archivo:
     - el cambio de pantalla no se anuncia ni mueve el foco
     - los errores solo cambian un borde y muestran un toast de 1,5 s
     - "confirmar" no avisa que está procesando
     - los avatares son <img> sin alt
   ========================================================================== */

var saldo = SALDO_INICIAL;
var movimientos = MOVIMIENTOS_INICIALES.slice();
var contactoElegido = "";      // clave del contacto (mg, jp, ar)
var $ = function (id) { return document.getElementById(id); };
var CLAVES = ["mg", "jp", "ar"];


/* ---- Avatares: <img> con un SVG de iniciales, sin atributo alt ---- */
function srcAvatar(iniciales, color) {
  var fondo = COLORES_AVATAR[color][0].slice(1);
  var texto = COLORES_AVATAR[color][1].slice(1);
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44'><circle cx='22' cy='22' r='22' fill='#" + fondo + "'/>" +
    "<text x='22' y='27' font-family='Arial' font-weight='700' font-size='14' text-anchor='middle' fill='#" + texto + "'>" + iniciales + "</text></svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function pintarAvataresDelFormulario() {
  CLAVES.forEach(function (clave) {
    var c = CONTACTOS[clave];
    $("av-" + clave).src = srcAvatar(c.iniciales, c.color);
  });
}


/* ---- Pantalla de inicio ---- */
function pintarInicio() {
  $("saldo").textContent = formatearMonto(saldo);
  var html = "";
  movimientos.forEach(function (m) {
    var esAbono = m.monto > 0;
    html += "<div class='mov'><div class='mov-vis'>" +
      "<img class='av' src='" + srcAvatar(m.iniciales, m.color) + "'>" +
      "<div class='mov-dat'><div class='mov-n'>" + m.nombre + "</div><div class='mov-f'>" + m.fecha + "</div></div>" +
      "<div class='monto-mov " + (esAbono ? "pos" : "neg") + "'>" + (esAbono ? "+" : "−") + formatearMonto(Math.abs(m.monto)) +
      "<div class='mov-tipo'>" + (esAbono ? "Abono" : "Cargo") + "</div></div></div></div>";
  });
  $("movs").innerHTML = html;
}


/* ---- Cambiar de pantalla: solo mostrar/ocultar (sin título, sin foco, sin anuncio) ---- */
function ir(pantalla) {
  for (var i = 0; i <= 3; i++) $("s" + i).style.display = i === pantalla ? "flex" : "none";
  $("screen").scrollTop = 0;
  window.scrollTo(0, 0);
}


/* ---- Toast de 1,5 s: único aviso de error ---- */
function toast(texto) {
  var el = $("toast");
  el.textContent = texto;
  el.style.display = "block";
  setTimeout(function () { el.style.display = "none"; }, 1500);
}


/* ---- Elegir contacto (div con onclick) ---- */
function elegirContacto(clave) {
  contactoElegido = clave;
  CLAVES.forEach(function (k) {
    $("k-" + k).className = "contacto" + (k === clave ? " sel" : "");
  });
}


/* ---- Paso 1 -> 2: validar. El error es solo color + toast ---- */
function seguir() {
  var monto = $("m").value;
  var hayError = false;

  CLAVES.forEach(function (k) { $("k-" + k).classList.remove("rojo"); });
  $("m").classList.remove("rojo");

  if (!contactoElegido) {
    CLAVES.forEach(function (k) { $("k-" + k).classList.add("rojo"); });
    hayError = true;
  }
  if (!monto || isNaN(monto) || Number(monto) <= 0 || Number(monto) > saldo) {
    $("m").classList.add("rojo");
    hayError = true;
  }
  if (hayError) { toast("Error"); return; }

  var c = CONTACTOS[contactoElegido];
  var valor = Number(monto);
  $("c-av").src = srcAvatar(c.iniciales, c.color);
  $("c-nombre").textContent = c.nombre;
  $("c-cuenta").textContent = c.cuenta;
  $("c-monto-grande").textContent = formatearMonto(valor);
  $("cd").textContent = c.nombre;
  $("cm").textContent = formatearMonto(valor);
  $("cs").textContent = $("msg").value || "-";
  ir(2);
}


/* ---- Paso 2 -> 3: confirmar (sin aviso de "procesando") ---- */
function confirmar() {
  setTimeout(function () {
    var c = CONTACTOS[contactoElegido];
    var valor = Number($("m").value);
    saldo -= valor;
    movimientos.unshift({ nombre: c.nombre, fecha: "Hoy", monto: -valor, iniciales: c.iniciales, color: c.color });
    pintarInicio();

    $("txt").textContent = "Enviaste " + formatearMonto(valor) + " a " + c.nombre + ".";
    $("r-monto").textContent = formatearMonto(valor);
    $("r-dest").textContent = c.nombre;
    $("r-fecha").textContent = fechaHoy();
    $("r-comp").textContent = numeroComprobante();
    ir(3);
  }, 1200);
}


/* ---- Volver a empezar ---- */
function reiniciar(pantalla) {
  contactoElegido = "";
  $("m").value = "";
  $("msg").value = "";
  CLAVES.forEach(function (k) { $("k-" + k).className = "contacto"; });
  ir(pantalla);
}


pintarAvataresDelFormulario();
pintarInicio();
