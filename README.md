# Prueba de accesibilidad: flujo de transferencia

Dos versiones del mismo flujo bancario simulado (Inicio → Datos → Confirmar → Listo) para probar con lector de pantalla (VoiceOver, TalkBack, NVDA).

- `/accesible/` — versión accesible
- `/no-accesible/` — versión con barreras intencionales

HTML estático, sin build. Para verlo en local:

```bash
npx serve .
```

## Diseño

App bancaria móvil: header azul eléctrico con tarjeta de saldo, hoja blanca redondeada, contactos con avatar de iniciales, monto grande centrado y comprobante final. Paleta única (azul eléctrico `#3a2fe0`) y tipografía Inter, idénticas en ambas versiones. Mobile first; en pantallas anchas se muestra dentro de un marco de teléfono. Las dos versiones comparten las mismas clases de estilo, así que **se ven casi iguales: la diferencia está en el código**.

Flujo: **Inicio** (saldo y últimos movimientos) → botón *Transferir* → **Datos** → **Confirmar** → **Listo** (comprobante). El saldo y los movimientos se actualizan en memoria tras transferir.

## Qué tiene la versión accesible (WCAG 2.1/2.2 AA)
- `lang="es"`, título de página que cambia en cada pantalla
- Enlace "Saltar al contenido", landmarks (`header`, `main`, `nav`, `footer`)
- Un `h1` por pantalla; el foco se mueve a él al cambiar de paso
- Indicador de pasos con `aria-current="step"`
- Etiquetas `<label>` visibles, ayudas con `aria-describedby`, campos obligatorios anunciados
- Contactos elegidos con `<fieldset>`/`<legend>` y radios nativos; avatares decorativos con `aria-hidden`
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
