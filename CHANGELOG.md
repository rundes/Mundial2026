# Changelog

## v1.3.0 — 2026-05-18

### Funcionalidades nuevas
- **Sincronización por código QR**. En la pestaña Compartir, debajo del
  campo "Tu nombre", aparece un botón grande "Mostrar mi QR". Al tocarlo
  se abre un modal con un QR que contiene un deep link a la app más el
  código de amigo del usuario.
  - El receptor (mamá/papá) abre la cámara común de su celular, apunta
    al QR y toca la notificación que aparece. El navegador abre la URL
    `https://rundes.github.io/Mundial2026/?import=AM26|...` y la app
    detecta el parámetro `?import=`, decodifica el código y le ofrece
    agregar al emisor como amigo de una.
  - No hace falta que el receptor tenga la app instalada todavía: la
    URL la abre primero y la app se carga ahí.
  - El modal también incluye un botón "Mandar link" que comparte la
    URL por WhatsApp como fallback para gente que no puede escanear el
    QR (ej. están lejos).
  - Cap de 50 amigos y validación de tamaño aplicada igual que en el
    flujo de copy-paste.
  - Caso especial: si el amigo ya existe, ofrece actualizar sus datos.
- **Ícono con leyenda "MUNDIAL 2026" prominente** debajo del trofeo.
  "MUNDIAL" en blanco arriba + "2026" en oro grande abajo, leíble a
  72 px del launcher.

### Infraestructura
- Inlining de `qrcode-generator` 1.4.4 (≈20 KB minificado, MIT, ©
  Kazuhiko Arase) como `<script>` separado antes del script principal.
  Atribución preservada en comentario HTML.
- Manejo de `?import=...` al cargar la app (se limpia la URL con
  `history.replaceState` antes de mostrar el confirm para que un
  refresh no re-dispare el flujo).
- `tomarSnapshotLimpio` sigue funcionando: el snapshot incluye ambos
  scripts y los amigos receptores reciben una app idéntica.
- Cache busting bumpeado a `?v=1.3.0` y `CACHE_VERSION='album-2026-v1.3.0'`.

## v1.2.4 — 2026-05-18

- Ícono con leyenda: "MUNDIAL" en blanco arriba + "2026" en oro grande
  abajo, debajo del trofeo. Compone como un cartel de evento deportivo.
- Trofeo movido hacia arriba para dejar espacio al texto sin perder
  legibilidad de la silueta.
- Cache busting bumpeado a `?v=1.2.4` + `CACHE_VERSION='album-2026-v1.2.4'`.

## v1.2.3 — 2026-05-18

- Trofeo más chico y centrado en el ícono (ocupa ~55% del canvas en vez
  del 75% anterior). Más aire alrededor → la silueta del objeto se lee
  más clara a tamaños chicos (72-128 px del launcher Android).
- Forma simplificada: sin asas (a tamaño chico se confundían con el
  bowl), bowl más definido (rim ancho + cintura angosta + panza),
  stem más corto y base de dos niveles compacta.
- Highlight vertical más sutil + sombra del lado derecho para dar
  volumen sin sobrecargar.
- Cache busting `?v=1.2.3` y `CACHE_VERSION = album-2026-v1.2.3`.

## v1.2.2 — 2026-05-18

- Trofeo más grande (ocupa ~75% del canvas), sin texto "2026" para que
  no compita con el ícono a tamaño de home screen Android (96-144 px).
  El nombre "Álbum 2026" ya aparece debajo del ícono en el launcher.
- Más contraste: oro más brillante, fondo más oscuro, asas más prominentes.
- Cache busting `?v=1.2.2` en todas las refs de íconos y manifest para
  forzar refresh en navegadores que tengan los íconos viejos cacheados.
- sw.js v1.2.2 con network-first para íconos y manifest (antes era
  cache-first y se quedaban pegados los íconos viejos al actualizar).
- theme-color del navegador alineado con el fondo del ícono.

Importante: si ya instalaste la app en Android con la versión vieja
(la pelota azul), Android cachea ese ícono en el launcher y no lo
refresca solo. Para ver el trofeo nuevo: desinstalá la PWA de la
pantalla de inicio (mantené apretado el ícono → Quitar/Desinstalar)
y volvé a instalarla desde la URL.

## v1.2.1 — 2026-05-18

- Rediseño del set de íconos: silueta de chalice (copa clásica con asas,
  pie y pedestal de dos niveles) en oro sobre fondo azul oscuro
  cinematográfico, con luz, sombra, glow y viñeta. Diseño propio
  genérico, no reproduce marcas registradas.
- Tipografía "2026" en oro claro en la parte inferior, con sombra.
- Maskable rediseñado con el contenido dentro del safe-zone (80%
  central) para que Android no recorte partes importantes.
- social-preview.png 1280×640 actualizado al nuevo estilo.

## v1.2 — 2026-05-18

### Funcionalidades nuevas
- **Versión visible en el footer.** Cada vista incluye un footer con
  la versión actual (`APP_VERSION`), la fecha de build, el link al
  repositorio en GitHub y un botón "Buscar actualización".
- **Banner de "Nueva versión disponible".** Cuando el service worker
  detecta un build más nuevo en el servidor, aparece un banner indigo
  arriba con los botones **Actualizar** / **Después**:
  - "Actualizar" le envía `SKIP_WAITING` al SW nuevo, que toma el control,
    dispara `controllerchange` y la página se recarga automáticamente.
  - "Después" oculta el banner por la sesión actual (no hasta el próximo
    cambio remoto).
  - El chequeo se hace al cargar, cada 30 minutos mientras la pestaña
    está abierta, y cuando vuelve al foreground (`visibilitychange`).
- **Botón "Buscar actualización"** en el footer para forzar el chequeo
  cuando el usuario lo decide.
- **Ícono del repositorio como ícono de la app.** El avatar de
  `github.com/rundes` se procesa a 100/180/192/512 px y se referencia
  desde la `link rel="apple-touch-icon"`, los `link rel="icon"` y el
  `manifest.webmanifest`. En la pantalla de inicio de Android e iPhone
  se ve el avatar real cuando se instala desde la URL pública.

### Cambios internos
- `manifest.webmanifest` se separa del HTML (antes era data URL).
  Habilita refs `./icons/...` y permite que Chrome/Edge muestren los
  íconos del manifest en el banner de instalación.
- `sw.js` v1.2: precachea índice + manifest + íconos, soporta
  `SKIP_WAITING` por mensaje, network-first para HTML, cache-first
  para assets. `addAll` reemplazado por `add` individual con catch
  para que un solo recurso roto no impida el install del SW.

## v1.1 — 2026-05-18

### Funcionalidades nuevas
- **Botón "Instalar en pantalla de inicio"** en la pestaña Compartir.
  - Android Chrome / Edge / Brave: usa el evento `beforeinstallprompt`
    para mostrar el prompt nativo del navegador con un solo toque.
  - iOS Safari: instrucciones visuales paso a paso (Compartir →
    Agregar a Inicio).
  - iOS no-Safari (Chrome iOS, etc.): aviso de abrir en Safari.
  - Android sin prompt todavía: instrucciones manuales por menú.
  - Detección automática del modo standalone para mostrar "ya está
    instalada" en vez del botón cuando corresponde.
- **Web App Manifest inline** (`application/manifest+json` data URL) con
  name, short_name, icons (any + maskable, 512×512 SVG), display
  standalone, theme_color, etc.
- **Service worker** (`sw.js`): cache-first para assets, network-first
  con fallback para la navegación. Permite que la instalación PWA en
  Android funcione y refuerza el modo offline.

### Cambios menores
- Texto en *Pedir ayuda a la familia* aligerado (se eliminó la nota
  sobre "comprando sobres").

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
