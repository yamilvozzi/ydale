# Identidad visual y PWA

`public/logo.png` y `public/icon.png` son los originales. El logo se muestra
completo, sin transformaciones, a 144 / 176 / 192 px según el ancho de pantalla.
Los atributos de tamaño reservan su relación de aspecto antes de descargarlo.

Para regenerar los iconos después de actualizar la imagen maestra:

```sh
npm ci
npm run generate:icons
npm run build
```

El generador usa Sharp/Lanczos3 y conserva las proporciones de la fuente:

| Uso | Archivos en public | Tamaños |
| --- | --- | --- |
| PWA estándar | icons/ydale-192.png, icons/ydale-512.png | 192, 512 |
| Android maskable | icons/ydale-maskable-192.png, icons/ydale-maskable-512.png | 192, 512 |
| iPhone | apple-touch-icon.png | 180 |
| iPad | icons/ydale-apple-152.png, icons/ydale-apple-167.png | 152, 167 |
| Favicon PNG | icons/ydale-favicon-16.png, icons/ydale-favicon-32.png | 16, 32 |
| Favicon ICO | favicon.ico | 16, 32, 48 |

Cada tamaño se rasteriza desde el original. Los maskable agregan un fondo opaco
tomado del borde de la fuente y contienen toda la imagen en un cuadrado de lado
56%: sus esquinas quedan dentro del círculo seguro de radio 40% definido por la
[especificación de iconos maskable](https://web.dev/articles/maskable-icon).
El head declara los iconos y metadatos de instalación de
[Safari/iOS](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).
Vite PWA genera el manifest y su enlace; no editar el manifest de dist a mano.

Las cinco pestañas comparten `.pestana-tema`: `aria-current="page"` activa texto
blanco, un degradado teal vertical en el 68% inferior y una línea de 2 px.
Una máscara horizontal desvanece los laterales. Los pseudo-elementos no capturan
eventos ni cubren el texto. `.accion-icono` mantiene un área mínima de 44 × 44 px
con dibujos de 14 × 14 px en repertorio, texto editable, escalas y acordes.

Publicar el directorio dist completo sobre HTTPS, con las variables de Supabase
y PIN habituales configuradas para el build. No requiere migraciones de datos.
El service worker actualiza su caché, incluido el logo original (su tamaño exige
un límite de precaché de 3 MiB por archivo). Si un acceso ya instalado conserva
el icono anterior, quitarlo y volver a agregarlo desde el navegador; algunos
sistemas conservan el icono del lanzador independientemente de la caché web.
Comprobar la instalación final en un Android y un iPhone físicos.
