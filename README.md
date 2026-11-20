# Prueba de accesibilidad: flujo de transferencia

Dos versiones del mismo flujo bancario simulado (Datos → Confirmar → Listo) para probar con lector de pantalla (VoiceOver, TalkBack, NVDA).

- `/accesible/` — versión accesible
- `/no-accesible/` — versión con barreras intencionales

HTML estático, sin dependencias ni build.

## Qué tiene la versión accesible
- `lang="es"`, título de página que cambia en cada paso
- Enlace "Saltar al contenido", landmarks (`header`, `main`, `nav`)
- Indicador de pasos con `aria-current="step"`
- Etiquetas `<label>` visibles, textos de ayuda con `aria-describedby`, campos obligatorios anunciados
- Errores en texto (no solo color), `aria-invalid`, resumen de errores con foco y enlaces a cada campo
- Foco movido al título de cada paso nuevo
- Estado "Procesando…" anunciado con `aria-live`
- Montos leídos como "50.000 pesos"
- Contraste AA, foco visible, objetivos táctiles de 48 px, zoom permitido

## Barreras intencionales de la versión no accesible
- Sin `lang`, título genérico "app"
- Zoom bloqueado (`user-scalable=no`)
- Sin landmarks ni encabezados reales (todo `div`)
- Botones y selector hechos con `div` + `onclick`: no se alcanzan con teclado ni se anuncian como botón
- Campos sin etiqueta, solo `placeholder`
- Errores marcados solo con un borde rojo tenue + toast "Error" que desaparece en 1,5 s
- Imagen sin `alt`
- Bajo contraste en textos y botones, foco eliminado (`outline: none`)
- Indicador de pasos solo visual
- Sin aviso de cambio de paso ni de "procesando"
