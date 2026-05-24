# Changelog

## v2.0.0 — 2026-05-23 — 🎉 Release milestone: revisión integral + endurecimiento

Hito mayor consolidando todo el trabajo entre v1.0 y v1.9.30. Sin
features nuevas vs v1.9.30 (salvo un fix de seguridad chico), pero
formaliza el estado actual como versión 2.0 estable.

### Resumen de lo que trae 2.0 respecto a 1.0
- **Vínculos persistentes entre usuarios** vía link AM26 + WhatsApp
  como transporte (v1.9.0 → v1.9.16). Push manual con indicador
  "cambios sin avisar" por amigo (v1.9.22). Sin servidor propio.
- **Acortador de URLs en cascada** (TinyURL → is.gd → da.gd) con
  fallback nunca al link largo — evita el truncamiento "Leer más"
  de WhatsApp que rompía el import (v1.9.14 → v1.9.16).
- **Importación de mensajes/QR de otras apps**: Figuri (figuri.app)
  y Figuritas App (figuritas.app), tanto formato texto como QR
  binario (con reverse-engineering del formato gzip+base64 + LSB-
  first bitmap de 980 bits, v1.9.17 → v1.9.28).
- **Escáner de QR nativo** con `BarcodeDetector` + opción de subir
  imagen de QR (v1.9.26, v1.9.29).
- **UI rediseñada en 4 pestañas** (Tengo · Repes · Amigos · Más,
  v1.9.23) con cards de amigos colapsables (v1.9.18), buscadores
  con dropdown de sugerencias (v1.9.20), íconos custom (v1.9.2),
  y disclaimers completos en README (v1.9.2).
- **Mensajes de WhatsApp compactos**: bandera + sigla en vez de
  bandera + nombre, sin separadores box-drawing, sin headers de
  grupo (v1.9.24). Reduce ~50% el tamaño del mensaje.
- **Confirmaciones en acciones destructivas**: desmarcar figurita,
  desmarcar equipo completo, borrar amigo, restaurar backup,
  reset total (v1.9.19).
- **Multi-import** de amigos (v1.9.18) y backup que **lista
  amigos** en la parte legible (v1.9.18) + permite importar tu
  álbum desde un mensaje de otra app (v1.9.25).
- **Endurecimiento de seguridad/validación** integral: límites
  consistentes (MAX_LEN_CODIGO 100KB, MAX_BYTES_ARCHIVO_BACKUP
  5MB, **MAX_BYTES_QR_IMAGE 10MB nuevo en v2.0.0**, MAX_AMIGOS
  50), validación de IDs contra ORDEN_FIGURITAS al restaurar e
  importar, escape consistente con `escapeHtml`/`escapeAttr`,
  protocolo `whatsapp://` en mobile para evitar la corrupción de
  emojis de `wa.me`.

### Fix de seguridad en v2.0.0
- Agregado **límite de 10 MB para imagenes de QR** subidas. Evita
  que el usuario cargue una imagen gigante (intencional o no) que
  pueda colgar el navegador al procesarla con BarcodeDetector.

### Revisión integral
- Verifiqué que NO hay `eval`, `Function`, `document.write` en el
  código activo. Todos los `innerHTML` write reciben contenido
  generado por template literals con escape de cualquier dato del
  usuario (nombre, código de amigo) vía `escapeHtml`/`escapeAttr`.
- Verifiqué que los uploads (backup, imagen QR) tienen tope de
  bytes y validación de tipo.
- Verifiqué que el snapshot HTML que se comparte ("Compartir la
  app") se toma ANTES del primer render para no filtrar datos del
  usuario (esto se introdujo en v1.0 y sigue funcionando).
- Verifiqué que el bitmap de Figuritas App no incluye Coca-Cola y
  documenté la asunción en el código (`FA_TOTAL_BITS`).
- Cache busting `?v=2.0.0` y `CACHE_VERSION = 'album-2026-v2.0.0'`.

## v1.9.30 — 2026-05-23 — Botón de borrar amigo visible en vista compacta

### Cambio
- Hasta ahora el botón **"Borrar amigo"** estaba escondido en la
  vista expandida del card. Si nunca expandías el amigo, no había
  forma de borrarlo. Ahora aparece un **ícono de tacho** a la
  derecha del card en la vista compacta — un toque y se borra (con
  confirm).
- El layout del card compacto pasó de "un solo botón que cubre
  todo" a "botón de toggle (parte izquierda) + botón de tacho
  (parte derecha)", separados por un borde sutil.
- En la vista expandida el botón "Borrar amigo" se promovió de un
  link gris pequeño a un botón con ícono de tacho + texto rojo,
  más visible.
- En ambos casos sigue pidiendo confirmación antes de borrar.

### Infra
- Cache busting `?v=1.9.30` y `CACHE_VERSION = 'album-2026-v1.9.30'`.

## v1.9.29 — 2026-05-23 — Subir imagen del QR para decodificarla

### Nuevo
- Junto al botón "Escanear con cámara" ahora hay un segundo botón:
  **"Subir imagen del QR"**. Abre el selector de archivos del SO y
  permite elegir una imagen (JPG, PNG, WebP) que contenga un QR
  (típicamente screenshots de WhatsApp, recibidos de un amigo).
- Soporta los mismos formatos que el escáner en vivo:
  - QR de esta app (link `?import=AM26|...`)
  - QR con código AM26 pelado
  - QR binario de Figuritas App (con la decodificación experimental
    de v1.9.28)
  - QR con texto de Figuri/Figuritas App (raro, pero por las dudas)
- Usa la misma API `BarcodeDetector` que el escáner en vivo (zero
  dependencias, Chrome 83+/Edge 88+).
- Si la imagen no se decodifica al primer intento, prueba un upscale
  2× con canvas — ayuda con screenshots de baja resolución.

### UX
- Los dos botones (Escanear con cámara / Subir imagen del QR) van
  side-by-side en un `grid-cols-2` para que sean igualmente
  visibles. Texto en 2 líneas para que entren bien en mobile.
- Mensajes de error claros si la imagen no contiene QR, si el
  archivo no es imagen, o si el navegador no soporta la API.

### Infra
- Nueva función `escanearQRDesdeImagen(file)` async.
- Reusa el listener `change` delegado (mismo patrón que el
  file-input de restore).
- Cache busting `?v=1.9.29` y `CACHE_VERSION = 'album-2026-v1.9.29'`.

## v1.9.28 — 2026-05-23 — Decodificación experimental del QR binario de Figuritas App

### Reverse-engineering
- El usuario me pasó un QR de **álbum vacío** de Figuritas App. Eso
  me dio el baseline para deducir el formato:
  - Section 0 = **FALTANTES** (1 = no la tengo). Empty álbum → todos los
    bits útiles seteados.
  - Section 1 = **REPES** (1 = tengo al menos una repe, sin contador
    exacto).
  - Bit order: **LSB-first within byte** (980 bits set en empty es
    exacto).
  - 980 bits = 48 equipos × 20 figuritas (960) + 19 FWC + 1 Doble Cero.
  - **Figuritas App NO incluye la sección Coca-Cola** (14 figuritas).

### Nuevo
- `parseFiguritasAppQR(raw)` async: detecta el pattern del QR (header
  variable + `H4sI...;H4sI...`), descomprime con `DecompressionStream`
  ('gzip', soportado en Chrome 80+, Safari 16.4+), mapea los bits a
  IDs de figuritas según nuestro `ORDEN_FIGURITAS`, y devuelve
  `{ marcadas, repetidas }`.
- `importarAmigo` ya no solo detecta el QR para tirar error — ahora
  intenta decodificarlo. Si tiene éxito, muestra confirm con stats:
  > 📷 Detectamos un QR de Figuritas App.
  > 📊 Tu amigo tiene 679 de 980 figuritas (esa app no usa Coca-Cola).
  > 🔄 Repetidas: 97 distintas
  >
  > ⚠️ El mapeo bit↔figurita es por reverse-engineering. Si ves nombres
  > raros después, contame y lo afinamos.
- Si el navegador no soporta `DecompressionStream`, fallback al
  mensaje de antes pidiendo el formato de texto.

### Advertencia
- El mapeo es **experimental**. Asume:
  - Orden de equipos por grupo: A→B→C→…→L (igual que nosotros).
  - Dentro de cada equipo: figuritas 1→20.
  - Después de 960 bits de equipos vienen los 19 FWC.
  - Bit 979 es la Doble Cero.
- Si Figuritas App usa un orden distinto (ej. grupos en otro orden,
  o algunos teams swapeados), el match va a aparecer corrido.
- Las repes vienen como "1 cada una" porque el QR no codifica
  cantidad exacta, solo "tiene/no tiene repe".

### Infra
- Cache busting `?v=1.9.28` y `CACHE_VERSION = 'album-2026-v1.9.28'`.

## v1.9.27 — 2026-05-23 — Mensaje específico al escanear QR binario de Figuritas App

### Por qué
- Investigué qué encode el QR de **Figuritas App** (figuritas.app):
  un header de 6 bytes magic (`E7 AB 99 E6 95 91` = `站救` en UTF-8)
  + dos secciones gzip+base64 separadas por `;`. Cada sección es un
  bitmap binario de ~125 bytes (1000 bits para las 994 figuritas del
  álbum).
- El **orden de los bits** (qué bit = qué figurita) no es público:
  decodificar requeriría reverse-engineering del mapeo (varios QRs de
  álbumes conocidos para deducirlo).

### Solución
- En vez de tirar el error genérico "no pudimos leer", `importarAmigo`
  ahora **detecta el magic header de Figuritas App** y muestra un
  mensaje específico:
  > 🔍 Detectamos un QR de Figuritas App.
  >
  > Su formato binario es propietario y no podemos leerlo. Pero la
  > app entiende el formato de TEXTO de Figuritas App (el mensaje
  > "Me faltan… MEX 🇲🇽: 5, 10, …").
  >
  > Pedile a tu amigo que comparta su lista como texto desde
  > Figuritas App (en vez de mostrarte el QR) y te lo mande por
  > WhatsApp. Pegá ese mensaje acá en "Agregar manualmente" y se va
  > a importar bien.
- Esto cubre tanto el flow del escáner (v1.9.26) como pegar el
  contenido del QR manualmente.

### Lo que sigue funcionando
- QRs de esta app (link con `?import=AM26|...`) → import directo ✓
- QRs con códigos AM26 pelados → import directo ✓
- QRs de Figuri (figuri.app) → si encode el formato de texto, se
  parsea con `parseFiguriMessage` ✓
- Texto de Figuritas App → ya se parseaba bien desde v1.9.17 ✓

### Infra
- Cache busting `?v=1.9.27` y `CACHE_VERSION = 'album-2026-v1.9.27'`.

## v1.9.26 — 2026-05-19 — Escáner de QR nativo (esta app, Figuri, Figuritas App)

### Nuevo
- Botón **"Escanear QR"** en la pestaña Amigos → Agregar manualmente.
- Abre la cámara trasera del celular, detecta el QR en vivo y, una
  vez decodificado, pasa el contenido al pipeline existente
  (`importarAmigo`) que ya maneja:
  - Links de esta app (`?import=AM26|...`)
  - Códigos AM26 pelados
  - Mensajes de Figuri (figuri.app)
  - Mensajes de Figuritas App (figuritas.app)
- O sea: cualquier QR que encode UNO de esos formatos se importa
  con un toque. Si encode otra cosa, salta el mensaje de "no
  pudimos leer".

### Compatibilidad
- Usa la API nativa **`BarcodeDetector`** (sin librería extra, 0 KB).
  Soportado en Android Chrome 83+, Edge 88+, Opera mobile, Samsung
  Internet. Cobertura ~90% en Android.
- En iOS Safari (sin BarcodeDetector) y en navegadores que no lo
  soporten, el botón muestra un alert con instrucciones de fallback:
  usar la cámara común del teléfono → si decodifica un link tocarlo,
  o si decodifica texto copiarlo y pegarlo en el textarea de arriba.

### UX del escáner
- Modal full-screen con vista en vivo de la cámara.
- Marco blanco redondeado en el centro como guía visual.
- Botón **Cancelar** arriba a la derecha (para de la cámara,
  cierra el modal).
- Footer explicando los formatos aceptados.
- En cuanto detecta un QR válido, cierra automáticamente y dispara
  el flujo de import.

### Permisos
- Pide permiso de cámara al tocar el botón (gesto del usuario).
- Si el usuario rechaza, alerta con instrucciones para habilitarlo.
- Cuando cierra el modal, libera la cámara (stops all tracks).

### Infra
- Estado nuevo `escanQR = { activo, stream, raf, detector, videoEl }`.
- Funciones nuevas `iniciarScanQR`, `bucleScanQR`, `cerrarScanQR`.
- Modal renderizado al final de `render()` con z-50.
- Acciones nuevas `escanear-qr` y `cerrar-scan-qr`.
- Cache busting `?v=1.9.26` y `CACHE_VERSION = 'album-2026-v1.9.26'`.

## v1.9.25 — 2026-05-19 — Importar TU álbum desde mensajes de otras apps

### Nuevo
- El botón "Pegar backup o mensaje de otra app" (Más → Copia de
  seguridad → Restaurar) ahora también acepta **mensajes de Figuri
  (figuri.app) y Figuritas App (figuritas.app)** además del backup
  nativo `.txt`.
- Reusa el mismo parser (`parseFiguriMessage`) que ya estaba
  funcionando para importar amigos, pero esta vez **el contenido se
  importa como TU álbum** — reemplaza tus marcadas y repes actuales,
  no agrega un amigo nuevo.
- Pide confirmación explícita antes de sobrescribir, mostrando
  cuántas figuritas y repes va a importar.
- Los amigos guardados NO se borran (solo cambia marcadas + repes).

### UX
- El botón se renombra de "Pegar el backup (texto)" a "Pegar backup
  o mensaje de otra app" para reflejar las dos fuentes.
- El cuadro de paste lista los formatos aceptados:
  - ✅ Backup de esta app (con `BACKUP-INICIO` / `BACKUP-FIN`)
  - ✅ Mensaje de Figuri o Figuritas App → se importa como tu álbum
- La copy explica que también podés importar tu álbum desde otra
  app si venís migrando.

### Flow técnico
- `restaurarBackupDesdeTexto` ahora tiene 3 fallbacks en cadena:
  1. `parsearTextoBackup` → backup nativo AM26
  2. `JSON.parse` → backup en JSON crudo
  3. `parseFiguriMessage` → mensaje de Figuri/Figuritas App
- Nueva función `aplicarMisDatosDeOtraApp(figData)` que sobrescribe
  marcadas+repes con confirm, filtra IDs no válidos y reporta el
  conteo final.

### Infra
- Cache busting `?v=1.9.25` y `CACHE_VERSION = 'album-2026-v1.9.25'`.

## v1.9.24 — 2026-05-19 — Mensajes WhatsApp más compactos (bandera + sigla)

### Cambio
- Los mensajes que la app arma para WhatsApp ahora usan **bandera +
  sigla** (`🇦🇷 ARG: 5, 10`) en vez de **bandera + nombre completo**
  (`🇦🇷 Argentina: 5, 10`). Pedido del usuario para evitar que
  WhatsApp trunque el mensaje con "Leer más".
- Ahorro de caracteres por línea de equipo: nombres como
  `República Checa`, `Estados Unidos`, `Corea del Sur` pasan a 3
  letras → ahorro de ~10-13 chars por línea. Con 30+ equipos
  listados, ~400 chars menos en total.

### Más compactación
- **Sin separadores** `━━━━━━━━━━━━━━━━━━━━`: cada uno costaba
  20 chars + saltos de línea. Eran 5-7 por mensaje. Total ~150 chars
  ahorrados. El emoji + texto del título ya hace de separador visual.
- **Sin encabezados** `▸ Grupo A`, `▸ Grupo B`...: los códigos
  estándar (MEX, USA, ARG) son universales, agrupar por grupo no
  agrega información práctica. ~12 líneas menos por mensaje.
- **FWC y CC** sin descripciones largas: `FWC (estadios, mascota,
  trofeo, pelota): 1, 2, 3` → `FWC: 1, 2, 3`. `CC (canje Coca-Cola
  con tapitas)` → `CC`.
- **Doble cero**: `✨ Doble cero (00 · la brillosita de la tapa)` →
  `✨ 00`.
- **Encabezado del mensaje** unificado: `📊 Cómo voy: 750 de 994
  (75%)` + `🔍 Me faltan 244 · 🔄 Tengo 30 repes` → línea única
  `📊 750/994 (75%) · faltan 244 · 30 repes`.

### Impacto estimado
- Antes: ~2500-3000 chars para un álbum a medio completar →
  truncado por WhatsApp.
- Después: ~1200-1500 chars para el mismo álbum → debería entrar
  sin truncar.

### Alcance
- Aplicado a TODOS los message-builders de WhatsApp:
  - `construirMensajeAlbum` (el "¡Cambiemos figuritas!")
  - `compartirSoloFaltantes` (FAB · solo faltantes)
  - `compartirSoloRepes` (FAB · solo repes)
  - `compartirListaCompleta` (FAB · lista completa)
  - `compartirEquipoEspecifico` (botón "Pedir las que faltan" por
    equipo)
- El backup .txt mantiene su formato original (no es WhatsApp,
  funciona como archivo).

### Infra
- Cache busting `?v=1.9.24` y `CACHE_VERSION = 'album-2026-v1.9.24'`.

## v1.9.23 — 2026-05-19 — Separar pestaña "Compartir" en "Amigos" y "Más"

### Cambio
- La pestaña **Compartir** crecía cada vez más (matches, push, agregar
  amigos, QR, backup, instalar, compartir la app, privacy disclosure)
  y se hacía difícil entender qué hacía cada bloque. La separé en dos
  pestañas con propósitos claros:
- **Amigos** (renombrada de Compartir): todo lo relacionado al
  vínculo entre usuarios.
  - Tu nombre (Paso 1)
  - Tus amigos · Coincidencias (cards con push manual)
  - ¡Cambiemos figuritas! (mandar tu link)
  - Agregar manualmente (pegar links/códigos)
  - Sincronizar por QR
- **Más** (nueva): herramientas generales de la app.
  - Copia de seguridad (backup + restore)
  - Instalar app en pantalla de inicio
  - Compartir la app (a alguien que no la usa)
  - Sobre la app / privacidad

### Detalles
- 4 pestañas ahora (Tengo · Repes · Amigos · Más). Cada botón sigue
  siendo `flex-1` así se ajustan al ancho disponible.
- El banner de "Hacé backup" ahora redirige a la pestaña Más.
- El FAB de compartir se oculta cuando estás en Amigos o Más
  (los botones ya son protagonistas en ambas).
- Mensajes de invitación y prompts actualizados: "pestaña Compartir"
  → "pestaña Amigos" / "pestaña Más" según corresponda. Ej. el
  mensaje WhatsApp dice "pegalo en la pestaña Amigos de tu app".

### Infra
- Nueva función `renderTabMas()` con las 4 secciones.
- Cache busting `?v=1.9.23` y `CACHE_VERSION = 'album-2026-v1.9.23'`.

## v1.9.22 — 2026-05-19 — Push manual a cada amigo + indicador "sin avisar"

### Modelo nuevo de vínculos persistentes
- Sin servidor ni servicios extra: el "transporte" sigue siendo el chat
  de WhatsApp con cada amigo. Ahora la app **te ayuda explícitamente**
  a saber cuándo tu link viejo quedó desactualizado y a mandarlo de
  nuevo en un toque.

### Indicador por amigo
- Cada card muestra una segunda línea, debajo de la freshness, con el
  estado de **TU link en su app** desde tu última actualización:
  - **Nunca le mandaste tu link** (gris)
  - **✓ Tu álbum está al día con él/ella** (verde, 0 cambios)
  - **📤 N cambios sin avisarle** (amarillo, 1-10 cambios)
  - **📤 N cambios — reenviá tu link** (rojo, >10 cambios)
- El contador se incrementa con cada cambio del usuario (marcar,
  desmarcar, sumar/restar repe, marcar todas), por la cantidad real
  de figuritas que cambiaron.

### Botón "Mandarle mi álbum actualizado"
- En la vista expandida del amigo, prominente arriba de las acciones
  secundarias. Color según urgencia (verde / ámbar / rojo).
- Tap → arma un mensaje **corto y personalizado** con el link
  acortado: `⚽ ¡Hola Lucas! Te paso mi álbum del Mundial 2026
  actualizado (soy Diego). Tocá el link para que tu app vea qué
  podemos intercambiar: <short URL>`
- Resetea el contador de "cambios sin avisar" para ese amigo
  específicamente — los otros amigos siguen viendo su propio contador.
- Si nunca le mandaste tu link, el botón dice "Mandarle mi álbum por
  primera vez" (verde).

### Otros cambios menores
- El botón "Pedir update" pasó a llamarse "Pedirle su update" para
  diferenciarlo del nuevo "Mandarle mi álbum".
- La "Propuesta" se mantiene pero pasa a verde-outline (acción
  secundaria) para que el botón push quede como acción principal.
- La línea de freshness en vista expandida ahora dice "Tu data de
  él/ella: hace N días" para que sea claro qué representa.

### Infra
- Nuevo campo por amigo: `cambiosDesdeUltimoShare` (number) y
  `ultimoShareAEsteTs` (timestamp).
- `marcarCambio(cantidad)` ahora bumpea el contador en cada amigo
  por la cantidad indicada (default 1).
- Nueva función `compartirLinkAEsteAmigo(nombre)` con flow async
  (overlay "Preparando link…" si el short URL no está cacheado) +
  alerta si el shortener falla por completo.
- Nueva acción `compartir-a-amigo`.
- Cache busting `?v=1.9.22` y `CACHE_VERSION = 'album-2026-v1.9.22'`.

## v1.9.21 — 2026-05-18 — Fix del dropdown de sugerencias (ancho + click)

### Fix
- **Ancho del dropdown**: las clases `absolute left-0 right-0` de
  Tailwind no estaban dando `width: 100%` en todos los navegadores
  (Android Chrome). Ahora forzamos width/posicionamiento con
  inline-style (`position:absolute; left:0; right:0; top:100%;
  width:100%; z-index:30`) para que ocupe siempre todo el ancho del
  input.
- **Tap no filtraba**: al tocar una fila del dropdown en mobile, el
  input perdía foco antes del click → el teclado se cerraba → la
  página hacía layout shift → la fila se movía y el tap nunca llegaba
  al botón. Solución: `mousedown` y `touchstart` en el contenedor del
  dropdown con `preventDefault()`, que mantiene el foco del input
  durante el touch y permite que el click se complete sobre el botón
  correcto.

### Infra
- Cache busting `?v=1.9.21` y `CACHE_VERSION = 'album-2026-v1.9.21'`.

## v1.9.20 — 2026-05-18 — Dropdown de sugerencias en los buscadores

### Nuevo
- En los buscadores de **Tengo** y **Repes**, al tipear **3+ letras**
  aparece un dropdown debajo del input con los equipos que matchean
  por nombre o por sigla. Cada fila:
  > 🇦🇷  **ARG**  Argentina
- Tap a una fila → fija el filtro al code exacto del equipo (queda
  `ARG` en el input) y cierra el dropdown + teclado. Útil cuando no
  estás seguro de cómo se escribe el país (ej. "rep checa" vs
  "republica checa" vs "czechia") o cuando hay varios países que
  empiezan igual ("Arge..." → Argentina y Argelia).
- Match: nombre o sigla con normalización (case-insensitive, sin
  acentos). Máximo 8 sugerencias por lista para no saturar.

### Infra
- Helper nuevo `actualizarSugerencias(modo)` que se llama después de
  `aplicarBusqueda` en cada keystroke + al render para preservar el
  estado del dropdown si volvés de otra pestaña con búsqueda activa.
- Acción nueva `seleccionar-equipo`.
- El dropdown va con `position: absolute` + `z-30` sobre el input,
  no empuja contenido. Scroll interno si hay más de ~5 sugerencias.
- Cache busting `?v=1.9.20` y `CACHE_VERSION = 'album-2026-v1.9.20'`.

## v1.9.19 — 2026-05-18 — Confirmación antes de desmarcar figuritas

### Cambio
- Al **tocar una figurita que ya está marcada** ahora la app pide
  confirmación antes de desmarcarla:
  > ¿Desmarcar Argentina nº 5? Va a volver a aparecer como "no la
  > tengo".
- Mismo flow para FWC (`FWC nº 8`), Coca-Cola (`Coca-Cola nº 2`),
  Doble cero (`la tapa holográfica (00)`).
- Marcar una figurita nueva (que no estaba marcada) sigue siendo
  un toque directo sin confirmación.
- El botón **"Desmarcar todas"** en un equipo completo también pide
  confirmación: desmarcar 20 figuritas de golpe sin querer es feo.

### Por qué
- Reportado: el caso común es un toque accidental al hacer scroll o
  navegar — desmarcar una figurita pegada sin darse cuenta es muy
  fácil y muy difícil de notar después.
- El confirm explícito agrega una fricción mínima (1 tap más) solo
  en la dirección "destructiva" del toggle.

### Infra
- Helper nuevo `nombreLegibleFigurita(id)` que mapea `ARG5` →
  `Argentina nº 5` para los mensajes de confirmación.
- Cache busting `?v=1.9.19` y `CACHE_VERSION = 'album-2026-v1.9.19'`.

## v1.9.18 — 2026-05-18 — Amigos colapsables + multi-import + backup transparente

### Cards de amigos colapsables
- Cada amigo arranca **colapsado** mostrando solo: nombre + freshness
  + chips `↑ N` (Le doy) y `↓ N` (Me da) + flecha ▾. Pasa de ~350 px
  a ~70 px de alto por card, así con varios amigos no se satura la
  pantalla Compartir.
- Tap al card → se expande y se ven las listas completas de
  intercambios + botón "Propuesta" + "Pedir update". El botón
  "Borrar amigo" queda dentro del card expandido.
- Estado nuevo `amigosExpandidos: Set<string>`, acción
  `toggle-amigo`.

### Import de varios amigos a la vez
- El cuadro "Pegá el código de un amigo" ahora **detecta automáticamente
  si hay 2+ códigos AM26 o 2+ links `?import=` en el texto pegado**
  y los procesa todos juntos. Permite pegar varios mensajes/links
  de WhatsApp uno tras otro y actualizar varios amigos de un saque.
- Dedupe por nombre del amigo (si pegás dos snapshots distintos del
  mismo amigo, queda el último).
- Después de un import simple, el alert dice "✅ X agregado/actualizado.
  Podés pegar otro código o link para agregar más amigos" para que
  quede claro que se puede repetir.
- Lista de formatos aceptados agregó un ítem: "Varios a la vez".

### Backup .txt — listado humano de amigos
- La sección legible del backup ahora lista cada amigo con sus
  números:
  ```
  Amigos:
  • Lucas S — 728 pegadas, 68 repes (importado 18/5/2026)
  • Mariano — 612 pegadas, 95 repes (importado 17/5/2026)
  ```
- Aclara que el restore incluye marcadas, repes, nombre y todos los
  amigos (data ya estaba en el payload base64; ahora también es
  visible en el preview humano).

### Infra
- Cache busting `?v=1.9.18` y `CACHE_VERSION = 'album-2026-v1.9.18'`.

## v1.9.17 — 2026-05-18 — Soporte para mensajes de "Figuritas App" (figuritas.app)

### Nuevo
- Ahora el importador detecta y parsea mensajes de **Figuritas App**
  (figuritas.app), una segunda app de figuritas además de Figuri.
- Los dos formatos conviven en el mismo parser sin que el usuario tenga
  que indicar de dónde viene:
  - **Figuri** (original): `🇲🇽 MEX: 1, 2, 3` (bandera *antes* del
    code) + FWC y CC con paréntesis (`Tournament (FWC): 1, 2, 3`,
    `(CC): 1, 2`).
  - **Figuritas App** (nuevo): `MEX 🇲🇽: 6, 10` (code *antes* de la
    bandera) + FWC y CC sin paréntesis y con emojis intercalados
    (`FWC 🌎: 7`, `FWC 📜: 9, 11`, `CC 🥤: 1, 2`).
- El parser se generalizó: busca el código (`FWC`, `CC` o equipo de
  3 letras) en el lado izquierdo del primer `:` de cada línea, sin
  importar si hay banderas o emojis decorativos rodeándolo. Soporta
  además líneas duplicadas de FWC (cuando una app divide los
  especiales en sub-listas) — el `Set` deduplica.

### UI
- Lista de formatos aceptados actualizada: incluye Figuritas App
  junto a Figuri en el cuadro "Agregar manualmente".
- Mensajes de error y prompt ya no mencionan "Figuri" específicamente
  (decían "No pude leer ese mensaje de Figuri" → ahora "No pude leer
  ese mensaje"). El prompt de nombre tampoco asume la app de origen.

### Infra
- Cache busting `?v=1.9.17` y `CACHE_VERSION = 'album-2026-v1.9.17'`.

## v1.9.16 — 2026-05-18 — Forzar siempre el short URL al compartir

### Fix
- **Causa real del bug de "figuritas perdidas al importar":** WhatsApp,
  al pegar el link sin acortar, pone un botón **"Leer más"** para
  colapsar el mensaje porque el AM26 codificado en la URL larga lleva
  varios miles de caracteres. El receptor ve solo el comienzo del
  mensaje, y cuando hace click en el link visible (truncado),
  importa solo la parte que entró en la versión cortada → su app
  decodifica un álbum incompleto y aparecen "figuritas que se
  pierden".

### Cambio
- **`compartirAlbumPorLink` y `copiarLinkAlbum` ahora bloquean si no
  se pudo acortar.** Ya no caen al URL largo. Si el cache del
  shortener no está listo, mostramos un overlay "Preparando tu
  link…" y esperamos. Si los 3 servicios (TinyURL → is.gd → da.gd)
  fallan, alertamos:
  > "No pudimos generar el link corto. Probá de nuevo en unos
  > segundos. Sin acortador, el link queda tan largo que WhatsApp
  > lo trunca con 'Leer más' y al receptor le importa un álbum
  > incompleto."
- **Timeout por servicio (AbortController, 5 s)**: si TinyURL
  cuelga, no se queda esperando 30 s antes de probar el siguiente —
  aborta a los 5 s y pasa al fallback. Cobertura total ≤ 15 s.

### Limpieza
- Eliminado el hack de **ventana placeholder en desktop** que
  abría `about:blank` durante el gesto del usuario y la
  redirigía a `wa.me` con el long URL si el shortener fallaba.
  Como ahora no usamos el long URL nunca, ese hack quedó sin
  función.

### Infra
- Estado nuevo `compartirEnProgreso` + overlay modal con z-50.
- Cache busting `?v=1.9.16` y `CACHE_VERSION = 'album-2026-v1.9.16'`.

## v1.9.15 — 2026-05-18 — Pegar el link de compartir en "Agregar manualmente"

### Cambio
- El cuadro **"Pegá el código de un amigo"** (Paso 3 de la pestaña
  Compartir) ahora acepta también el **link completo** de compartir,
  no sólo el código `AM26|...` pelado o los mensajes de Figuri.
- Soporta los tres formatos en el mismo input:
  - Link de la app: `https://rundes.github.io/Mundial2026/?import=…`
  - Código AM26 pelado (texto que arranca con `AM26|`)
  - Mensaje completo de WhatsApp (extrae el link o el código de
    adentro automáticamente)
  - Mensajes de Figuri (figuri.app)
- Implementación: `decodificarEstado` ahora detecta URLs con
  `?import=…`, extrae el valor del parámetro, lo URL-decodifica y
  sigue el flujo normal. Si la URL no contiene un código AM26 válido,
  cae al regex tradicional o al detector de Figuri.

### UI
- Placeholder del textarea actualizado: "Pegá acá el link, el código
  AM26… o el mensaje completo".
- Lista de formatos aceptados actualizada con el ítem del link
  arriba (es lo más común que la gente comparte).
- Mensaje de error "No pudimos leer ese mensaje" también lista las
  tres opciones.

### Infra
- Cache busting `?v=1.9.15` y `CACHE_VERSION = 'album-2026-v1.9.15'`.

## v1.9.14 — 2026-05-18 — Nuevo shortener con cascada de servicios + QR usa link corto

### Fix
- `cleanuri.com` (que se introdujo en v1.9.1 reemplazando a `is.gd`)
  dejó de funcionar de forma confiable. Cuando fallaba, el "Mandar
  por WhatsApp" y "Copiar link" caían al link largo (con el código
  AM26 base64 y el nombre del usuario embebidos), lo cual es feo y
  además a veces excede los límites de longitud de URL que aceptan
  algunos clientes.

### Cambio
- Nuevo `acortarUrl` con **cascada de servicios**: prueba uno a uno
  hasta que alguno responde bien. Todos son free, sin API key, con
  CORS habilitado:
  1. **TinyURL** (`tinyurl.com/api-create.php`) — el más estable y
     conocido, existe desde 2002. Primer intento.
  2. **is.gd** (`is.gd/create.php?format=json`) — fallback si TinyURL
     no responde.
  3. **da.gd** (`da.gd/s`) — terciario, mínimo y simple.
  Si los tres fallan, devolvemos la URL larga (sigue siendo
  funcional, sólo más fea).
- El **QR ahora también se beneficia del link corto** cuando está
  cacheado. Al abrir la pestaña Compartir se pre-acorta en background;
  cuando tocás "Mostrar QR" ya está listo. QR más chico = más fácil
  de escanear desde otro celular. Si todavía no se acortó, se genera
  con el largo (funciona igual) y se dispara el acortado en
  background para la próxima.

### Documentación
- El bloque "Sobre la app" actualizado para listar los tres servicios
  con sus links a la página principal de cada uno (transparencia
  sobre dónde va la data).
- El "footer" del unfurl preview ahora dice `tinyurl · rundes.github.io`
  en vez de `cleanuri · rundes.github.io`.

### Infra
- Cache de short URL sigue funcionando igual. Si la URL larga no
  cambió (mismo álbum), se reusa el short URL ya generado.
- Cache busting `?v=1.9.14` y `CACHE_VERSION = 'album-2026-v1.9.14'`.

## v1.9.13 — 2026-05-18 — Nuevo copy de la caja de compartir

### Cambio
- La caja **"Compartir mi álbum"** (pestaña Compartir → Paso 2 ·
  Mandar mi lista) pasa a tener un copy más directo y de invitación
  al intercambio:
  - Antes: `Pasale mi álbum a un amigo` + un párrafo largo explicando
    qué genera el botón.
  - Ahora: `¡Cambiemos figuritas!` + descripción `Abre este link y
    mirá que figuritas podemos intercambiar!`
- Lo mismo se aplica al **preview mock** que muestra cómo se ve el
  link cuando se comparte, y a los **meta tags Open Graph y Twitter
  Cards** — así cuando alguien recibe el link en WhatsApp,
  Telegram, Twitter, etc. ve exactamente:
  - Título: `⚽ ¡Cambiemos figuritas!`
  - Descripción: `Abre este link y mirá que figuritas podemos intercambiar!`
- El copy del UI box y del unfurl en redes quedan consistentes para
  que el usuario sepa exactamente qué va a ver el receptor.

### Infra
- Cache busting `?v=1.9.13` y `CACHE_VERSION = 'album-2026-v1.9.13'`.

## v1.9.12 — 2026-05-18 — Match sin "(xN)" — solo el número

### Cambio
- En el card del amigo, las filas de coincidencia ya no muestran
  `(xN)` al lado de cada figurita cuando hay 2 o más copias spare
  (en mi lado o en el de él). Solo el número.
- Igual en el mensaje de WhatsApp del match (acción "Cambio con X"):
  desapareció el `(tengo 2)` / `(tenés 2)` después del id de cada
  figurita.
- Antes: `🇦🇷  5, 10, 15(x2), 18`
- Ahora: `🇦🇷  5, 10, 15, 18`
- Justificación: como el intercambio es 1-a-1 por figurita (el otro
  solo necesita 1 copia para pegar), el conteo de spares no aportaba
  al intercambio y generaba ruido visual. Si el usuario quiere ver
  cuántas repes tiene de cada figurita, ya está la pestaña Repes.

### Infra
- Los campos `tengo` / `tiene` del objeto que retorna `calcularMatch`
  quedan presentes (calculados pero no visualizados) por si una
  futura iteración los necesita.
- Cache busting `?v=1.9.12` y `CACHE_VERSION = 'album-2026-v1.9.12'`.

## v1.9.11 — 2026-05-18 — Match más compacto: bandera + figuritas, sin nombre

### Cambio de UX
- En las listas de coincidencias del card de un amigo ("Le doy" / "Me da"),
  cada fila pasa de mostrar **círculo de color + nombre del país +
  números** a mostrar **solo bandera + números**.
- Antes: `● Argentina        5, 10, 15`
- Ahora: `🇦🇷  5, 10, 15`
- El nombre del país era redundante (la bandera ya identifica al país)
  y comía espacio horizontal en mobile, forzando truncate sobre nombres
  largos como "Estados Unidos" o "República Checa". Ahora cada fila
  respira más y los números están más a la vista.
- La tipografía de los números también sube de `text-xs` (12 px) a
  `text-sm` (14 px) para mejor lectura.
- Para FWC y CC (que no tienen país) se usan emojis temáticos:
  🏆 para FWC, 🥤 para CC.

### Infra
- Helper `iconoCodigo(code)` interno a la sección de amigos.
- Removida la función `eqInfo` que ya no se usa.
- Cache busting `?v=1.9.11` y `CACHE_VERSION = 'album-2026-v1.9.11'`.

## v1.9.10 — 2026-05-18 — Fix: no contar dos veces los intercambios con repes ≥ 2

### Bug
- En el match de coincidencias con un amigo, si yo (o el amigo) tenía
  2 o más repetidas de la misma figurita, el intercambio se contaba
  duplicado. `calcularMatch` ponía `cant: repetidas[id]` (la cantidad
  total que tengo) en cada entrada, y el código de totales hacía
  `match.leDoy.reduce((s, x) => s + x.cant, 0)`, sumando 2 (o más) por
  cada figurita con repes duplicadas. También el display mostraba
  "te puedo dar ARG5 (x2)", sugiriendo intercambiar 2 cuando el
  amigo solo necesita 1 para pegar.

### Fix
- `calcularMatch` ahora pone **`cant: 1` siempre** — cada intercambio
  es 1-a-1 por figurita, porque al amigo solo le sirve una copia para
  pegar en el álbum, no importa cuántas yo tenga repetidas.
- Para no perder la info "tengo 2 spares" (que sirve para distribuir
  con varios amigos), se agregaron dos campos nuevos:
  - `tengo` en `leDoy`: cuántas repes tengo yo de esa figurita.
  - `tiene` en `meDa`: cuántas repes tiene el amigo de esa figurita.
- Los displays (mensaje de WhatsApp del match, card del amigo) ahora
  usan `tengo`/`tiene` para el "(xN)" / "(tengo N)" — es info, no
  cuenta. El badge de "Le doy / Me da" sigue mostrando la cantidad de
  figuritas únicas a intercambiar (que es lo correcto).
- Eliminada la variable `totalLeDoy` que ya no se usaba en ningún
  lado y que tenía el bug de duplicación.

### Infra
- Cache busting `?v=1.9.10` y `CACHE_VERSION = 'album-2026-v1.9.10'`.

## v1.9.9 — 2026-05-18 — Buscador robusto + +/- grandes + auto-colapsar completos

### Buscador rediseñado de cero
Reporte: en Android Chrome la lupa SVG se veía mal, hacer click cerraba
el teclado a veces y la usabilidad era pobre. Causa probable:
combinación de `type="search"` (que agrega una X de browser por default
que choca con la nuestra) + SVG absolute-positioned dentro del input
(en algunos browsers intercepta taps a pesar de `pointer-events:none`).

Nuevo diseño deliberadamente plano y universal:
- **`type="text"` + `inputmode="search"`** — el teclado de búsqueda
  sale igual pero sin la X que mete el browser.
- **Sin íconos absolute-positioned dentro del input**. La lupa 🔎 y la
  palabra "Buscar" van arriba como header del bloque, no overlay.
- **Botón "Limpiar ×" como texto separado** arriba a la derecha (sólo
  visible cuando hay valor), no flotando sobre el input.
- **`style="font-size: 16px"` inline** para que iOS no haga zoom al
  tocar el input (regla universal, independiente de Tailwind).
- Cero dependencias de quirks de browser específico.

### Repetidas: botones más grandes y mejor ubicados
- Las casillas de Repes dejan de ser `aspect-square` y pasan a
  `min-height: 92px` (rectangulares). Los botones **−** y **+** ya
  no flotan en `-bottom-1` (saltaban a la fila siguiente y eran
  difíciles de tocar). Ahora viven **dentro del card**, abajo.
- Tamaño de los botones: `w-5 h-5` (20 px) → **`w-9 h-9` (36 px)**.
  Más cerca del mínimo recomendado de 44 px para tap targets.
- Tipografía del +/− pasa de `text-[11px]` a `text-xl` (~20 px),
  más visible.
- El gap vertical del grid se reduce (ya no hace falta espacio para
  los botones flotantes).

### Equipos completos colapsan automáticamente
- Cuando un equipo queda al 100% (las 20 figuritas marcadas), el card
  se **colapsa automáticamente** a una vista compacta: bandera +
  nombre + badge `✓ 20/20`. El listado de figuritas desaparece para
  no saturar visualmente la pestaña Tengo.
- El card completado se **destaca con el color del equipo** en el
  borde (2 px) y en el badge. Cada selección queda visualmente
  identificada.
- Tocando el card compacto se expande a la vista completa por si
  hay que desmarcar alguna figurita (en cuyo caso vuelve al modo
  normal con todas las casillas). Hay un botón ▴ para volver a
  colapsar manualmente.
- Al re-completar el equipo (todas marcadas de nuevo), el card
  vuelve a colapsarse automáticamente.
- El filtro de búsqueda sigue funcionando sobre los cards compactos
  (los `data-team-card` se mantienen).

### Infra
- Nuevo estado `equiposExpandidos: Set<string>` para tracking de
  equipos completos manualmente expandidos. Se limpia al completar.
- Acción nueva `toggle-expandir-equipo`.
- Cache busting `?v=1.9.9` y `CACHE_VERSION = 'album-2026-v1.9.9'`.

## v1.9.8 — 2026-05-18 — Polish del buscador + números de figus más grandes

### Diseño del buscador
- Input más prominente: pill blanca con borde de 2 px, sombra suave,
  esquinas más redondeadas (`rounded-2xl`) y mayor altura (`py-3`).
- Texto interior `text-base` (16 px) en vez de `text-sm`, mejor
  legibilidad y previene el zoom automático al hacer foco en iOS.
- Ícono de lupa ahora es un **SVG limpio** (line-icon, 20 px) en lugar
  del emoji 🔎 — se ve más nítido en todos los sistemas.
- Botón de limpiar también con ícono SVG (×), tamaño 32 px, área de
  tap más cómoda.
- Estado de foco: el borde se vuelve azul (`focus:border-blue-500`)
  con transición de color suave.

### Tipografía de los números de figuritas
- Casillas de la pestaña **Tengo**: el número de la figurita pasa de
  `text-[10px]` a **`text-lg`** (10 px → 18 px). Mucho más legible
  para escanear el listado de un equipo y encontrar la que querés
  marcar.
- Casillas de la pestaña **Repes**: mismo cambio (10 px → 18 px) y
  el contador `+N` de repetidas pasa de `text-[8px]` a `text-[10px]`.
- Labels secundarios (`ESC`, `FG`) levemente más grandes
  (`text-[8px]` → `text-[9px]`) para que sigan siendo claramente
  secundarios pero más legibles.
- Botones de **FWC** y **CC** (las secciones especiales): número
  también pasa a `text-lg`, con `tabular-nums` para que se alineen
  bien en columnas.

### Infra
- Cache busting `?v=1.9.8` y `CACHE_VERSION = 'album-2026-v1.9.8'`.

## v1.9.7 — 2026-05-18 — Buscador de equipos en Tengo y Repes

### Nuevo
- **Barra de búsqueda en las pestañas Tengo y Repes** para encontrar
  rápido el equipo que querés marcar. Aparece arriba del listado de
  grupos. Mientras tipeás, los equipos que no matchean desaparecen al
  toque (sin re-renderizar el árbol completo, así no se pierde el
  foco mientras escribís).
- Matchea contra:
  - Nombre del equipo (case-insensitive, sin acentos): "argentina",
    "Argentina", "arg…"
  - Código del equipo (3 letras): "ARG", "BRA", "USA"
  - Letra del grupo: "A", "grupo A", "g a", "grupoA"
  - Sección especial: "FWC", "trofeo", "mascota", "estadio" → muestra
    el bloque FWC. "CC", "coca" → CC. "00", "doble cero", "tapa",
    "holo", "brillo" → el bloque 00.
  - Cualquier sub-string aplica: "uru" encuentra Uruguay, "epu" matchea
    República Checa, etc.
- Botón "×" para limpiar la búsqueda con un toque.
- Si nada coincide, aparece un mensaje "🔎 No encontré nada con eso"
  con sugerencias.
- La búsqueda **persiste al marcar figuritas**: marcás una figurita de
  Argentina, el listado se re-renderiza, y el filtro se vuelve a
  aplicar automáticamente — seguís viendo solo Argentina.
- El estado de búsqueda es **independiente por pestaña**: lo que
  busques en Tengo no afecta a Repes y viceversa.

### Infra
- Filtrado por DOM (`display:none` sobre `[data-team-card]` /
  `[data-group-section]` / `[data-special-section]`) en lugar de
  re-renderizar el HTML completo. Mantiene el foco del teclado entre
  pulsaciones y evita el flicker visual.
- Cache busting `?v=1.9.7` y `CACHE_VERSION = 'album-2026-v1.9.7'`.

## v1.9.6 — 2026-05-18 — Fix WhatsApp (parte 4): bypass del placeholder window

### Fix
- **El path real del bug estaba en `compartirAlbumPorLink`, no en
  `compartirWhatsApp`.** Las correcciones de v1.9.3/4/5 no se
  aplicaban porque cuando el shortener no estaba pre-cacheado, la
  función abría una ventana placeholder (hack para mantener el gesto
  del usuario en iOS Safari mientras esperaba el `cleanuri`) y la
  navegaba a `wa.me/?text=...` *directamente*, salteándose todos los
  caminos arreglados antes. Reportado: footer en v1.9.4, Android
  Chrome → emojis como `�` + pantalla "Descargar WhatsApp".
- Cambio: en **mobile (Android/iOS) o WebView embebido**, eliminamos
  el hack de ventana placeholder por completo. Esperamos al shortener
  *inline* (con timeout de 2 s para no colgar la UI si `cleanuri` no
  responde) y mandamos por `compartirWhatsApp`, que en mobile usa
  `whatsapp://send?text=...` directo al sistema operativo. Sin
  redirect de wa.me que rompa el encoding ni placeholder que se
  quede mostrando "Preparando link…".
- En **desktop**, el hack de placeholder + wa.me se mantiene
  (funciona bien ahí porque tiene tabs reales del navegador).

### Por qué se rompió
- El flujo "Mandar por WhatsApp" pasaba por `compartirAlbumPorLink`
  → ventana placeholder → `win.location.href = waUrl`. Funcionó
  hasta v1.8.x cuando el mensaje era corto y `wa.me` no se atragantaba.
  Con el refactor de v1.9.0 (mensaje único con lista completa de
  faltantes + link AM26 con el estado serializado), la URL pasó a ser
  varios miles de caracteres y `wa.me` empezó a corromper emojis y
  mostrar la pantalla de descarga aunque WhatsApp estuviera instalado.

### Infra
- Cache busting `?v=1.9.6` y `CACHE_VERSION = 'album-2026-v1.9.6'`.

## v1.9.5 — 2026-05-18 — Fix WhatsApp (parte 3): saltar wa.me en mobile

### Fix
- **Los emojis del mensaje aparecían como `�` (REPLACEMENT CHARACTER)
  en la pantalla de wa.me**, además de seguir cayendo en "Descargar
  WhatsApp" en navegador común (no solo en PWA standalone).
- Causa: para mensajes largos (lista completa de faltantes + link
  AM26 con el estado serializado), `wa.me` corrompe el encoding al
  hacer el redirect a `api.whatsapp.com/send` — los emojis terminan
  como `%EF%BF%BD` en la URL final. Verificado: el archivo local y
  el desplegado en GitHub Pages tienen los emojis correctos
  (`%E2%9A%BD` para ⚽), la corrupción ocurre en el middleman.
- Fix: en **mobile (sea PWA standalone o navegador común)** ahora
  salteamos `wa.me` por completo y usamos directamente el protocolo
  `whatsapp://send?text=...`. El OS intercepta el esquema custom y
  abre la app nativa de WhatsApp con el mensaje **intacto** (sin
  redirect que rompa el encoding). Se asume que el usuario tiene
  WhatsApp instalado (premisa de la app).
- En **desktop** se mantiene `wa.me` con `target="_blank"`, que
  abre WhatsApp Web correctamente.
- `navigator.share()` sigue siendo el path primario cuando está
  disponible (mejor UX, sheet nativo del OS).

### Infra
- Cache busting `?v=1.9.5` y `CACHE_VERSION = 'album-2026-v1.9.5'`.

## v1.9.4 — 2026-05-18 — Fix WhatsApp en PWA (parte 2): protocolo directo

### Fix
- **El botón de WhatsApp seguía mostrando "Descargar WhatsApp" en PWA
  instalada** aunque el usuario tuviera la app. El fix de v1.9.3 con
  `navigator.share` cubre el caso ideal, pero si el navegador lo
  rechazaba o no estaba disponible, caía a `wa.me` — y ese es
  exactamente el flujo roto en PWA standalone: el WebView de la app
  encapsulada abre la página de wa.me y el redirect JS a
  `whatsapp://` no le llega al sistema, así que wa.me termina
  mostrando la pantalla de descarga.
- Cambio de fallback: ahora cuando detectamos **mobile + standalone
  (PWA instalada)**, usamos directamente el protocolo
  `whatsapp://send?text=...` sin pasar por wa.me. El sistema
  operativo intercepta el esquema custom y abre la app nativa de
  WhatsApp con el mensaje prellenado, listo para elegir contacto. En
  navegador común (mobile o desktop) el comportamiento sigue siendo
  `wa.me` con `target="_blank"`, que funciona bien ahí.

### Infra
- Cache busting `?v=1.9.4` y `CACHE_VERSION = 'album-2026-v1.9.4'`.

## v1.9.3 — 2026-05-18 — Fix WhatsApp en PWA + copiar solo el link

### Fixes
- **Compartir por WhatsApp desde la PWA instalada.** En modo standalone
  (PWA agregada a pantalla de inicio en Android/iOS) el botón "Mandar
  por WhatsApp" abría `wa.me` *dentro de la propia PWA* y no podía
  pasarle el control a la app nativa de WhatsApp, dejando al usuario
  sin poder elegir contacto. Ahora la función usa primero la **Web
  Share API** (`navigator.share`) cuando está disponible: se abre el
  sheet nativo del sistema, el usuario elige WhatsApp (o cualquier
  otra app de mensajería instalada) y el mensaje sale con la
  selección de contacto del propio WhatsApp. El método anterior con
  `<a target="_blank">` queda como fallback para navegadores sin
  Web Share API.
- **Copiar solo el link corto** ahora copia únicamente la URL, sin el
  encabezado `⚽ Haz click acá…` que se anteponía antes. El botón
  decía "🔗 Solo copiar el link corto" pero estaba pegando un mensaje
  multilínea. Si el usuario quiere mandar el mensaje completo, el
  botón "Mandar por WhatsApp" arriba sigue armándolo.
- Texto del aviso post-copia ajustado: "Link copiado" en vez de
  "Copiado", para que sea claro qué quedó en el portapapeles.

### Infra
- Cache busting bumpeado a `?v=1.9.3` y
  `CACHE_VERSION = 'album-2026-v1.9.3'`.

## v1.9.2 — 2026-05-18 — Nuevo set de íconos + disclaimers

### Ícono
- Nuevo arte: trofeo genérico estilizado sobre dos cartas, sobre fondo
  azul sólido. **Diseño original**, intencionalmente no figurativo, no
  reproduce marcas registradas.
- Regenerados los 6 PNGs del set (`icon-100`, `icon-180`, `icon-192`,
  `icon-512` + `icon-192-maskable`, `icon-512-maskable`) desde el nuevo
  arte. Maskables con *safe area* al 80% sobre fondo azul sólido para
  que los launchers de Android (círculo, squircle, rounded square) no
  recorten partes importantes.
- Cache busting bumpeado a `?v=1.9.2` y
  `CACHE_VERSION = 'album-2026-v1.9.2'` en `index.html`,
  `manifest.webmanifest` y `sw.js` para forzar refresh en clientes
  con la versión anterior cacheada.

### Documentación
- **README** con bloque nuevo de *Aviso legal / Disclaimers* dejando
  explícito que el proyecto es sin fines de lucro de ningún tipo, no
  está afiliado con FIFA, Panini, Coca-Cola ni ninguna otra entidad,
  no monetiza por ningún medio, no incluye contenido protegido por
  derechos de autor, y usa los nombres de marcas registradas
  únicamente en sentido nominativo/descriptivo.
- **CHANGELOG** completado con las versiones intermedias (v1.5.0 a
  v1.9.1) que se habían acumulado sin entrada formal.

## v1.9.1 — 2026-05-18 — Fix shortener

- Servicio de URL corta cambiado de `is.gd` a `cleanuri` por CORS.
- Mensaje *friendly* al copiar el link compartido.

## v1.9.0 — 2026-05-18 — Refactor compartir

- Refactor del flujo de compartir: **un único mensaje** con la lista,
  el link de auto-add del álbum y la URL acortada. Reemplaza los tres
  flujos separados anteriores.

## v1.8.5 — 2026-05-18 — Compartir álbum por link

- Compartir álbum vía link con *preview* enriquecido tipo "perfil"
  (banner social + datos del usuario).

## v1.8.4 — 2026-05-18

- Social preview image actualizada (provista por el usuario).

## v1.8.3 — 2026-05-18

- 6 variantes de silueta busto con distintos peinados para el fondo
  decorativo de las casillas de equipo.

## v1.8.2 — 2026-05-18

- Silueta **genérica y no figurativa** de jugador como fondo decorativo
  en cada casilla de equipo. Diseño propio, no reproduce imágenes de
  jugadores reales.

## v1.8.1 — 2026-05-18

- Fix: los logros se reconcilian correctamente al restaurar backup y
  al cargar la app.

## v1.8.0 — 2026-05-18 — Importador Figuri

- Importador compatible con mensajes generados por Figuri (figuri.app)
  además del formato propio `AM26|...`.

## v1.7.5 — 2026-05-18

- Mensaje de *compartir el link* acortado, sin link duplicado.

## v1.7.4 — 2026-05-18

- Placeholder del nombre cambiado a "Diego Armando".

## v1.7.3 — 2026-05-18 — Analytics no invasivo

- Integración con **GoatCounter**: sin cookies, sin tracking individual,
  sólo cuenta visitas agregadas anónimas. Ver detalles de privacidad
  en `https://www.goatcounter.com/help/privacy`.

## v1.7.2 — 2026-05-18

- Fix de botones del FAB sheet.
- Banderas SVG *cross-platform* como fallback cuando el emoji no
  renderiza correctamente (ej. Windows).

## v1.7.1 — 2026-05-18

- Ícono maskable rediseñado con safe area más generoso para no
  recortarse en los launchers redondos de Android.

## v1.7.0 — 2026-05-18 — FAB compartir + Open Graph

- Open Graph / Twitter Cards en el link de la app para *preview*
  enriquecido al compartir por WhatsApp/Telegram/Twitter.
- FAB (botón flotante) de compartir presente en todas las pestañas.
- Carrusel automático de imágenes en el preview social.

## v1.6.0 — 2026-05-18 — Gamificación pack 2

- **Logros / achievements** desbloqueables según hitos del álbum.
- **Tips** rotativos con sugerencias de uso.
- Sección **"necesitan amor"** que destaca los equipos más rezagados
  del álbum para motivar al usuario a completarlos.

## v1.5.1 — 2026-05-18

- Copy de la figurita 00 actualizado: se aclara que corresponde a la
  tapa holográfica del álbum.

## v1.5.0 — 2026-05-18 — Figurita 00

- Se agrega la figurita 00 (doble cero / portada del álbum) al conteo
  y a la UI. Total: 994 figuritas.

## v1.4.0 — 2026-05-18 — Gamificación pack 1

Primera tanda de mejoras de gamificación. Sin referencias al costo de los
paquetes (varía mucho por zona).

### Tarjetas de equipo con badges
Cada equipo de la pestaña *Tengo* lleva ahora un chip de estado según
cuántas figuritas le faltan:

- 🏆 **Completo** (0 faltantes)
- 🔥 **A 1 paso / A 2 pasos** (1-2 faltantes)
- ⚡ **Casi** (3-5 faltantes)
- 🌱 **A medias** (6-12 faltantes)
- ❄️ **Recién** (13-19 faltantes)
- 🆕 **Sin abrir** (20 faltantes)

Cada tarjeta también muestra la bandera del país delante del nombre.

### Botón "📲 Pedir las que faltan" por equipo
Cuando a un equipo le faltan entre 1 y 5 figuritas, aparece un botón
extra en su tarjeta que genera un mensaje WhatsApp hipersegmentado.

### Widget de Countdown del Mundial
Al inicio de la pestaña *Tengo*, card oscura con tres contadores:
- 🏟️ Días para la Inauguración (11 jun 2026)
- 🇦🇷 Días para el debut de Argentina (estimado 13 jun, fixture
  sujeto a confirmación oficial)
- 🏆 Días para la Final (19 jul 2026)

### Widget "Casi están"
Lista los 3 equipos a los que les faltan entre 1 y 5 figuritas con
botón "📲 Pedir" para mensaje segmentado al toque.

### Infra
- Constantes `FECHAS_MUNDIAL`.
- Funciones nuevas: `getBadgeEquipo`, `getEquiposMasCerca`,
  `compartirEquipoEspecifico`, `diasHasta`, `renderCountdownWidget`,
  `renderMasCercaWidget`.
- Cache busting v=1.4.0 + CACHE_VERSION='album-2026-v1.4.0'.

## v1.3.1 — 2026-05-18

### Compartir lista — rediseño
- **Botón "Compartir mi lista" único y genérico** reemplaza los tres
  botones específicos para mamá / papá / grupo familiar. Ahora se
  puede mandar a cualquier contacto (familia, amigos, primos,
  compañeros del cole, etc.) con el mismo formato.
- **Banderas de cada país** delante del nombre del equipo (emojis
  Unicode 🇲🇽 🇧🇷 🇦🇷 🇫🇷 🏴󠁧󠁢󠁥󠁮󠁧󠁿 etc., con manejo especial
  para Inglaterra y Escocia que usan banderas regionales).
- **Mensaje unificado**: una sola lista que incluye:
  - Encabezado con avance (X de 993, %, repes).
  - Sección "🔍 FIGURITAS QUE ME FALTAN" para completar el álbum,
    agrupada por Grupo A-L y separada por equipo con su bandera.
  - Sección "🔄 REPETIDAS QUE TENGO" para intercambiar, mismo formato.
  - Especiales (🏆 FWC, 🥤 CC) al final de cada sección.
- Caso "álbum completo": mensaje celebratorio + listado de repes si
  todavía hay para cambiar.
- UI con paleta verde (en vez de rosa familiar) para alinear con el
  ícono de WhatsApp y refuerza que es para cualquier contacto.

### Limpieza
- Removidas las funciones obsoletas `compartirFaltantes` y
  `compartirRepetidas` que ya no se usaban desde la UI.
- `compartirParaPadres` queda como alias de `compartirListaCompleta`
  por compatibilidad.

Cache busting v=1.3.1 + CACHE_VERSION='album-2026-v1.3.1'.

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
