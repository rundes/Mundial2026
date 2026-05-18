# Changelog

## v1.0 — 2026-05-18

Primera versión estable. La app es self-contained, funciona 100% offline,
y está lista para uso público gratuito.

### Funcionalidades
- Álbum completo del Mundial 2026: 12 grupos, 48 equipos, 20 figuritas
  por equipo, 19 especiales FWC, 14 especiales Coca-Cola (993 figuritas).
- Tres pestañas: *Tengo*, *Repes*, *Compartir*.
- Estadísticas en vivo (figuritas pegadas, faltantes, repetidas, % completo)
  con barra de progreso.
- Botones para compartir lista de faltantes a mamá, papá y grupo familiar
  por WhatsApp, con nombres completos de los equipos.
- Código compacto del álbum para compartir con amigos (formato `AM26|...`).
- Cálculo automático de coincidencias con amigos guardados (qué le doy /
  qué me da) y propuesta de intercambio por WhatsApp con un toque.
- Backup en formato `.txt` legible para WhatsApp (encabezado humano +
  payload base64 entre marcadores). Restauración desde archivo o
  pegando el texto.
- Compartir la app: genera un archivo HTML self-contained para mandarle
  a amigos. El archivo no incluye datos del usuario.

### Persistencia y robustez
- Persistencia en `localStorage` con fallback a `sessionStorage` si el
  navegador está en modo privado.
- Manejo de `QuotaExceededError` con aviso único.
- Sincronización entre pestañas del mismo navegador vía evento `storage`.
- Recordatorio de backup automático según cambios acumulados y antigüedad
  (banner emerald con opción "más tarde").
- Detección de WebView embebido (WhatsApp/Instagram en iOS) con banner
  para abrir en Safari.

### Seguridad y privacidad
- **Fix de fuga de datos al compartir la app:** snapshot HTML limpio
  capturado antes del primer render, en vez de serializar el DOM ya
  renderizado con los datos del usuario.
- Validación de tamaño máximo en código de amigo (100 KB), texto de
  backup y archivos (5 MB).
- Filtrado de IDs de figurita inválidos al restaurar backup.
- Cap de 50 amigos guardados.
- `escape`/`unescape` deprecados reemplazados por `TextEncoder`/
  `TextDecoder` para codificación UTF-8 correcta.
- `meta name="referrer" content="no-referrer"`.

### Performance y distribución
- CSS Tailwind precompilado e inlineado (~19 KB minificado). Antes la
  app dependía de `cdn.tailwindcss.com` y no se veía sin internet.
- HTML final ~100 KB sin dependencias externas.
- Funciona 100% offline desde la primera apertura.
- Iconos PWA (favicon + apple-touch-icon SVG inline), theme-color,
  apple-mobile-web-app-title. Se puede agregar a pantalla de inicio.

### Accesibilidad
- Tabs con `role=tablist` y `aria-selected`.
- Focus visible.
- Live region en boot screen.
- Inputs con `font-size: 16px` para evitar zoom en iOS al hacer focus.
- Safe-area para iPhones con notch.

## v0.1 — 2026-05-18

- Commit inicial: `index.html` con álbum, repetidas, amigos, backup y
  compartir vía CDN de Tailwind.
