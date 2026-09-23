import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'

const publicDir = new URL('../public/', import.meta.url)
const source = fileURLToPath(new URL('icon.png', publicDir))
await mkdir(new URL('icons/', publicDir), { recursive: true })

// El borde de la imagen maestra proporciona el color del margen añadido.
const { data } = await sharp(source).extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const background = { r: data[0], g: data[1], b: data[2], alpha: 1 }

async function raster(size, maskable = false) {
  // Un cuadrado de lado 56% cabe COMPLETO dentro del círculo seguro de radio
  // 40%, incluidas sus esquinas. No se recorta ni se estira el arte original.
  const innerSize = maskable ? Math.floor(size * 0.56) : size
  const artwork = await sharp(source)
    .resize(innerSize, innerSize, { fit: 'contain', background, kernel: 'lanczos3' })
    .flatten({ background })
    .png()
    .toBuffer()
  if (!maskable) return artwork
  return sharp({ create: { width: size, height: size, channels: 3, background } })
    .composite([{ input: artwork, gravity: 'centre' }])
    .png()
    .toBuffer()
}

for (const size of [192, 512]) {
  await writeFile(new URL(`icons/ydale-${size}.png`, publicDir), await raster(size))
  await writeFile(new URL(`icons/ydale-maskable-${size}.png`, publicDir), await raster(size, true))
}
for (const size of [152, 167, 180]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icons/ydale-apple-${size}.png`
  await writeFile(new URL(name, publicDir), await raster(size))
}
for (const size of [16, 32]) {
  await writeFile(new URL(`icons/ydale-favicon-${size}.png`, publicDir), await raster(size))
}

// ICO con tres imágenes PNG reales, cada una rasterizada desde la fuente.
const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map((size) => raster(size)))
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
images.forEach((bytes, index) => {
  const entry = 6 + index * 16
  header[entry] = sizes[index]
  header[entry + 1] = sizes[index]
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(bytes.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += bytes.length
})
await writeFile(new URL('favicon.ico', publicDir), Buffer.concat([header, ...images]))
console.log('Iconos PWA, maskable, Apple y favicon generados desde public/icon.png.')
