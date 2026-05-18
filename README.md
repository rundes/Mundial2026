# Mi Álbum Mundial 2026

App web gratuita para llevar el control del álbum de figuritas del Mundial 2026.
Marcá las que tenés, anotá las repetidas y coordiná intercambios con tu familia y tus amigos por WhatsApp.

**Abrir la app:** [rundes.github.io/Mundial2026](https://rundes.github.io/Mundial2026/)

---

## Características

- **Álbum completo:** 12 grupos · 48 equipos · 20 figuritas por equipo · 19 especiales FWC · 14 especiales Coca-Cola (993 figuritas en total).
- **Tres pestañas:** *Tengo* (marcar lo que ya pegaste), *Repes* (contar repetidas) y *Compartir* (familia, amigos, backup).
- **Compartir por WhatsApp:**
  - Lista de faltantes lista para mandarle a mamá/papá/familia con los nombres completos de los equipos.
  - Lista de repetidas para intercambiar.
  - Código compacto de tu álbum para pasarle a tus amigos.
- **Coincidencias automáticas:** pegás el código de un amigo y la app te muestra qué le podés dar y qué te puede dar él.
- **Backup en WhatsApp:** mandate tu álbum a vos mismo y queda guardado para siempre. Si cambiás de celular, lo recuperás desde el chat.
- **Compartí la app:** un solo botón genera el archivo HTML para mandárselo a un amigo. El archivo no incluye tus datos.

## Cómo funciona la privacidad

- **Todo se guarda en tu dispositivo** (`localStorage` del navegador). No hay servidor, no hay cuenta, no se envía nada a internet.
- **Sin registro, sin contraseña.**
- **Sin publicidad ni trackers.**
- Cuando compartís tu código o tu backup, vos elegís a quién se lo mandás. La app no sabe con quién hablás.
- El archivo HTML que se comparte con la opción "Compartir la app" se genera a partir de un snapshot limpio capturado *antes* del primer render, así nunca se filtran tu nombre, tu código, tus marcas ni tus amigos guardados.

## Cómo funciona la app

### Para vos
1. Abrís la URL o el archivo HTML.
2. En la pestaña **Tengo** vas tocando cada casilla a medida que pegás una figurita.
3. En la pestaña **Repes** sumás (+) cada vez que te sale una repetida.
4. Las estadísticas (figuritas pegadas, faltantes, repetidas, % completo) se actualizan en vivo arriba.

### Para coordinar con la familia
En **Compartir → Pedir ayuda a la familia** elegís un destinatario (mamá, papá, grupo familiar) y la app arma un mensaje de WhatsApp con la lista de faltantes redactada de forma clara (con los nombres completos de los equipos, no solo los códigos).

### Para intercambiar con amigos
1. **Vos** copiás tu código (un texto que empieza con `AM26|...`) desde *Compartir → Tu código* y se lo mandás a tu amigo.
2. **Tu amigo** pega tu código en su app, también desde *Compartir*. La app le muestra qué le podés dar (las que vos tenés repetidas y él no tiene) y qué te puede dar (las que él tiene repetidas y a vos te faltan).
3. Con un toque manda la propuesta de intercambio por WhatsApp.

Cada uno tiene su propia copia del álbum en su dispositivo. Los códigos se intercambian manualmente: no hay sincronización en la nube.

### Para no perder los datos
- *Compartir → Copia de seguridad → Mandármelo por WhatsApp*: te mandás un mensaje a vos mismo con todo el álbum codificado. Queda guardado en tu chat para siempre.
- Para restaurar (cambio de celular, navegador borrado, etc.): copiás todo el mensaje y lo pegás en *Compartir → Restaurar → Pegar el backup*.
- La app te avisa con un banner cuando hace muchos cambios sin backup o pasó más de una semana.

## Características técnicas

- **Una sola página HTML** (~100 KB) sin dependencias en runtime.
- **CSS Tailwind** precompilado e inlineado (no consulta CDN al abrir).
- **Funciona 100% offline** una vez descargada o abierta la primera vez.
- **Mobile-first** y responsive: pensada para iPhone y Android, también se ve bien en tablet/desktop.
- **Detección de WebView embebido:** si la abrís desde el navegador interno de WhatsApp/Instagram, te avisa de abrirla en Safari para que los botones de compartir funcionen bien.
- **Detección de modo privado / cuota llena** con avisos y fallback a `sessionStorage`.
- **Sincronización entre pestañas** del mismo navegador.
- **Endurecimiento de imports:** validación de tamaño máximo en código de amigo (100 KB), archivo de backup (5 MB) y cantidad de amigos guardados (50). Las IDs de figurita se validan contra una lista canónica para evitar inyección.
- **Iconos PWA inline (SVG):** se puede agregar a pantalla de inicio en iOS y Android.

## Desarrollo

El proyecto es **un único archivo `index.html`**. No hay build step ni framework.

### Servirlo localmente
```bash
# Cualquier servidor estático sirve
python3 -m http.server 8000
# o
npx serve
```

### Recompilar el CSS de Tailwind
Si tocás clases nuevas de Tailwind hay que regenerar el bloque CSS embebido:

```bash
mkdir -p /tmp/twbuild && cd /tmp/twbuild
npm init -y && npm install -D tailwindcss@3.4.16
cat > tailwind.config.js <<'EOF'
module.exports = {
  content: ['/ruta/a/index.html'],
  theme: { extend: {} },
  plugins: [],
};
EOF
cat > input.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
./node_modules/.bin/tailwindcss -c tailwind.config.js -i input.css -o output.css --minify
# Reemplazar el contenido del primer <style>...</style> en index.html
# con el contenido de output.css.
```

Tailwind escanea el HTML y los template literals del JS, así que detecta todas las clases que se usan en runtime.

## Hosting

El sitio se sirve directamente desde GitHub Pages, rama `main`, raíz del repo.

Como la app es self-contained, también se puede:
- Bajar el archivo `index.html` y abrirlo desde el sistema de archivos (`file://`).
- Servirlo desde cualquier hosting estático (Netlify, Cloudflare Pages, Vercel, S3, etc.).
- Reenviarlo por WhatsApp/Telegram/email y abrirlo sin instalar nada.

## Licencia

MIT — ver [LICENSE](./LICENSE). Hacé fork, modificá, compartí. Si te sirvió, decímelo.

## Changelog

Ver [CHANGELOG.md](./CHANGELOG.md).
