/* ==========================================================================
   datos.js — datos de ejemplo y utilidades de formato, compartidos por
   las dos versiones. Ningún dato es real.
   ========================================================================== */

const SALDO_INICIAL = 1250000;

/* Colores de avatar [fondo, texto]; cada contacto/movimiento elige uno por índice */
const COLORES_AVATAR = [
  ["#e4e7fa", "#1e2370"],
  ["#d3f6e8", "#0a5c35"],
  ["#ffe4d3", "#8f3500"],
  ["#ffe9b8", "#6b4a00"],
  ["#e8e9f5", "#3a3c5e"]
];

/* cuentaHablada separa los dígitos ("4 8 2 1") para que el lector no diga "cuatro mil ochocientos veintiuno" */
/* Contactos a los que se puede transferir (clave = valor del radio / data) */
const CONTACTOS = {
  mg: { nombre: "María González", cuenta: "Cuenta corriente ••4821", cuentaHablada: "Cuenta corriente terminada en 4 8 2 1", iniciales: "MG", color: 0 },
  jp: { nombre: "Juan Pérez",     cuenta: "Cuenta vista ••1934",     cuentaHablada: "Cuenta vista terminada en 1 9 3 4", iniciales: "JP", color: 1 },
  ar: { nombre: "Ana Rojas",      cuenta: "Cuenta RUT ••7710",       cuentaHablada: "Cuenta RUT terminada en 7 7 1 0", iniciales: "AR", color: 2 }
};

/* Últimos movimientos. monto > 0 = abono (entra), monto < 0 = cargo (sale) */
const MOVIMIENTOS_INICIALES = [
  { nombre: "Sueldo Empresa Andes", fecha: "Hoy, 09:12",  monto: 850000, iniciales: "EA", color: 0 },
  { nombre: "Supermercado Central", fecha: "Ayer, 19:40", monto: -38450, iniciales: "SC", color: 3 },
  { nombre: "Juan Pérez",           fecha: "17 nov",      monto: -25000, iniciales: "JP", color: 1 },
  { nombre: "Streaming Plus",       fecha: "15 nov",      monto: -9990,  iniciales: "SP", color: 4 }
];

/* ---- Formato ---- */

/* 1250000 -> "1.250.000" */
function formatearNumero(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/* 1250000 -> "$1.250.000" */
function formatearMonto(n) {
  return "$" + formatearNumero(n);
}

/* "17 nov" -> "17 de noviembre", "Hoy, 09:12" -> "hoy a las 09:12" (para leer en voz alta) */
function fechaHablada(fecha) {
  return fecha
    .replace(/^Hoy, /, "hoy a las ")
    .replace(/^Ayer, /, "ayer a las ")
    .replace(/ nov$/, " de noviembre")
    .replace(/^Hoy$/, "hoy");
}

function fechaHoy() {
  return new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

function numeroComprobante() {
  return String(Math.floor(10000000 + Math.random() * 89999999));
}
