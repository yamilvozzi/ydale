import { normalizarAcorde } from './notasConAcordes.js'

export const MAX_COMPASES = 256
export const TIPO_ARRASTRE_ACORDE = 'application/x-ydale-acorde'
export const nombreAcordeBloque = acorde => acorde.nombre.trim() || 'Sin nombre'
export const seccionesBloque = bloque => bloque.tipo === 'libre' ? [bloque.acordes] : bloque.compases

export function conSeccionesBloque(bloque, secciones) {
  return bloque.tipo === 'libre' ? { ...bloque, acordes: secciones[0] } : { ...bloque, compases: secciones }
}

export function normalizarBloque(datos) {
  const { id, titulo, repeticiones, tipo } = datos
  if (typeof titulo !== 'string' || !Number.isSafeInteger(repeticiones) || repeticiones < 1) {
    throw new Error('Título o repeticiones de bloque inválidos')
  }
  const ids = new Set()
  function leerAcordes(acordes) {
    if (!Array.isArray(acordes)) throw new Error('Compás de bloque inválido')
    return acordes.map(entrada => {
      if (typeof entrada?.id !== 'string' || !entrada.id || ids.has(entrada.id) ||
          typeof entrada.digitacion?.id !== 'string' || !entrada.digitacion.id) {
        throw new Error('Acorde de bloque inválido')
      }
      ids.add(entrada.id)
      return { id: entrada.id, digitacion: normalizarAcorde(entrada.digitacion) }
    })
  }
  const base = { id, titulo, repeticiones, tipo }
  if (tipo === 'libre') return { ...base, acordes: leerAcordes(datos.acordes) }
  if (tipo !== 'compases' || !Array.isArray(datos.compases) || !datos.compases.length ||
      datos.compases.length > MAX_COMPASES) throw new Error('Compases de bloque inválidos')
  return { ...base, compases: datos.compases.map(leerAcordes) }
}

export function configurarBloque(bloque, { titulo, cantidad, repeticiones }) {
  const base = { id: bloque?.id, titulo: titulo.trim(), repeticiones }
  const secciones = bloque ? seccionesBloque(bloque) : []
  if (!cantidad) return { ...base, tipo: 'libre', acordes: secciones.flat() }

  // Al reducir, los acordes de los compases sobrantes se agregan al último.
  // Desde libre, distribuimos de a uno hasta llenar los compases disponibles.
  const partes = bloque?.tipo === 'libre' ? bloque.acordes.map(acorde => [acorde]) : secciones
  return { ...base, tipo: 'compases', compases: Array.from({ length: cantidad }, (_, indice) =>
    indice === cantidad - 1 ? partes.slice(indice).flat() : partes[indice] ?? [],
  ) }
}

export function insertarAcordeBloque(bloque, compas, digitacion) {
  const entrada = { id: globalThis.crypto.randomUUID(), digitacion }
  return conSeccionesBloque(bloque, seccionesBloque(bloque).map((acordes, indice) =>
    indice === compas ? [...acordes, entrada] : acordes,
  ))
}

export function describirDigitacion(acorde) {
  return acorde.posiciones.map(fila => {
    if (fila.includes('muteada')) return '×'
    if (fila.includes('aire')) return '0'
    return fila.flatMap((estado, i) => estado === 'presionada' ? [acorde.trastes[i].trim() || '?'] : []).join('/') || '–'
  }).join(' · ')
}

export function variantesDigitacion(guardada, acordes) {
  const variantes = [guardada]
  const huella = ({ trastes, posiciones, tonica, bajo, opcional }) =>
    JSON.stringify([trastes, posiciones, tonica, bajo, opcional])
  const vistas = new Set([huella(guardada)])
  const nombre = guardada.nombre.trim()
  if (!nombre) return variantes

  for (const acorde of acordes) {
    if (acorde.nombre.trim() !== nombre) continue
    const clave = huella(acorde)
    if (vistas.has(clave)) continue
    vistas.add(clave)
    variantes.push(acorde)
  }
  return variantes
}
