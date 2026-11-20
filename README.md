# Prueba de accesibilidad: flujo de transferencia

Dos versiones del mismo flujo bancario simulado (Inicio → Datos → Confirmar → Listo) para probar con lector de pantalla (VoiceOver, TalkBack, NVDA).

- `/accesible/` — versión accesible
- `/no-accesible/` — versión con barreras intencionales

HTML estático, sin build. Para verlo en local:

```bash
npx serve .
```

## Estructura

```
index.html              portada
accesible/index.html    versión accesible (solo HTML)
no-accesible/index.html versión con barreras (solo HTML)
css/
  base.css              estilos compartidos (paleta, marco de teléfono, tarjetas…)
  accesible.css         foco visible, sr-only, radios nativos, errores, movimiento reducido
  no-accesible.css      barreras: sin foco, bajo contraste, errores solo por color, toast
  portada.css           estilos de la portada
js/
  datos.js              datos de ejemplo y formato de montos/fechas (compartido)
  accesible.js          lógica accesible (foco, aria-live, validación, montos en palabras)
  no-accesible.js       lógica no accesible (onclick, toast, sin anuncios)
```

Cada archivo empieza con un índice comentado. Para cambiar el look de **ambas** versiones, edita `css/base.css`.

## Diseño

App bancaria móvil: header azul eléctrico con tarjeta de saldo, hoja blanca redondeada, contactos con avatar de iniciales, monto grande centrado y comprobante final. Paleta única (azul eléctrico `#2c3396`) y tipografía Inter, idénticas en ambas versiones. Mobile first; en pantallas anchas se muestra dentro de un marco de teléfono. Las dos versiones comparten las mismas clases de estilo, así que **se ven casi iguales: la diferencia está en el código**.

Flujo: **Inicio** (saldo y últimos movimientos) → botón *Transferir* → **Datos** → **Confirmar** → **Listo** (comprobante). El saldo y los movimientos se actualizan en memoria tras transferir.

## Qué tiene la versión accesible (WCAG 2.1/2.2 AA)
- `lang="es"`, título de página que cambia en cada pantalla
- Enlace "Saltar al contenido", landmarks (`header`, `main`, `nav`, `footer`)
- Un `h1` por pantalla; el foco se mueve a él al cambiar de paso
- Indicador de pasos solo visual (`aria-hidden`): el paso se dice una vez, al inicio del `h1` ("Paso 2 de 3. Confirma tu transferencia")
- Etiquetas `<label>` visibles, ayudas con `aria-describedby`, campos obligatorios anunciados
- Contactos elegidos con `<fieldset>`/`<legend>` y radios nativos; el nombre y la cuenta se asignan con `aria-labelledby`/`aria-describedby` y lo visual va `aria-hidden`, para que no se lea dos veces; "••4821" se lee "terminada en 4821" (no "viñeta")
- Errores en texto (no solo color), `aria-invalid`, resumen de errores con foco y enlaces a cada campo
- Estado "Procesando…" anunciado con `aria-live` (el botón usa `aria-disabled` para no perder el foco)
- Montos leídos como "50.000 pesos"; signo +/− y texto "más/menos" en los movimientos
- Botones reales con nombre accesible (también los de solo icono)
- Contraste AA, foco visible, objetivos táctiles ≥ 44 px, zoom permitido, `prefers-reduced-motion`

## Barreras intencionales de la versión no accesible
- Sin `lang`, título genérico "app"
- Zoom bloqueado (`user-scalable=no`)
- Sin landmarks ni encabezados reales (todo `div`)
- Botones, contactos y navegación hechos con `div` + `onclick`: no se alcanzan con teclado ni se anuncian como botón
- Campos sin etiqueta, solo `placeholder`
- Errores marcados solo con un borde rojo tenue + toast "Error" que desaparece en 1,5 s
- Imágenes (logo, avatares, check de éxito) sin `alt`
- Iconos (volver, transferir) sin texto
- Bajo contraste sutil en textos, botones y placeholders; foco eliminado (`outline: none`)
- Indicador de pasos solo visual
- Sin aviso de cambio de paso ni de "procesando"
