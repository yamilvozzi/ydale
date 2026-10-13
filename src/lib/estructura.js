import { actualizarTema } from './actualizarTema.js'
import { etiquetaTipo } from './escalas.js'
import { normalizarLetraConAnclas } from './anclasEstructura.js'

export const TIPOS_BLOQUE = [
  { valor: 'intro', etiqueta: 'INTRO' },
  { valor: 'verso', etiqueta: 'VERSO' },
  { valor: 'pre_estribillo', etiqueta: 'PRE-ESTRIBILLO' },
  { valor: 'estribillo', etiqueta: 'ESTRIBILLO' },
  { valor: 'riff', etiqueta: 'RIFF' },
  { valor: 'puente', etiqueta: 'PUENTE' },
  { valor: 'solo', etiqueta: 'SOLO' },
  { valor: 'outro', etiqueta: 'OUTRO' },
  { valor: 'otro', etiqueta: 'OTRO' },
]

export const estructuraVacia = () => ({ version: 1, bloques: [] })
const texto = valor => typeof valor === 'string' ? valor : ''

export function crearBloque(letra = '') {
  return { id: globalThis.crypto.randomUUID(), tipo: 'otro', nombre: '', letra, repeticiones: 1, nota: '' }
}

/** Respeta versos dentro de un párrafo; las líneas vacías separan bloques. */
export function separarParrafos(letra) {
  const limpia = texto(letra).replace(/\r\n?/g, '\n').trim()
  return limpia ? limpia.split(/\n(?:[^\S\n]*\n)+/).map(parrafo => parrafo.trim()) : []
}

export const bloquesDesdeLetra = letra => separarParrafos(letra).map(crearBloque)

export function normalizarEstructura(estructura) {
  if (!Array.isArray(estructura?.bloques)) throw new Error('Formato de estructura inválido.')
  const ids = new Set()
  return { version: 1, bloques: estructura.bloques.map(bloque => {
    if (!bloque || typeof bloque !== 'object' || Array.isArray(bloque)) throw new Error('Bloque de estructura inválido.')
    const id = typeof bloque.id === 'string' && bloque.id && !ids.has(bloque.id) ? bloque.id : globalThis.crypto.randomUUID()
    ids.add(id)
    const repeticiones = Number(bloque.repeticiones)
    const { letra, anclas } = normalizarLetraConAnclas(texto(bloque.letra), bloque.anclas)
    return {
      id,
      tipo: TIPOS_BLOQUE.some(tipo => tipo.valor === bloque.tipo) ? bloque.tipo : 'otro',
      nombre: texto(bloque.nombre).trim(),
      letra,
      repeticiones: Number.isSafeInteger(repeticiones) && repeticiones > 0 ? repeticiones : 1,
      nota: texto(bloque.nota).trim(),
      ...(anclas.length ? { anclas } : {}),
    }
  }) }
}

export function leerEstructura(valor) {
  if (!valor) return estructuraVacia()
  let documento
  try { documento = JSON.parse(valor) } catch { /* El formato anterior era texto libre. */ }
  if (documento && typeof documento === 'object') {
    if (documento.version !== 1) throw new Error('Versión de estructura no compatible.')
    return normalizarEstructura(documento)
  }
  return { version: 1, bloques: bloquesDesdeLetra(valor) }
}

export const guardarEstructura = estructura => JSON.stringify(normalizarEstructura(estructura))
export const nombreBloque = bloque => bloque.nombre || TIPOS_BLOQUE.find(tipo => tipo.valor === bloque.tipo)?.etiqueta || 'OTRO'

/** Sólo presentación de datos musicales existentes; nada se duplica en JSON. */
export function referenciaEstructura(tema, escalas = []) {
  if (escalas.length) return escalas.map(escala =>
    `${escala.tonica}${escala.tipo === 'menor' ? 'm' : ''} · ${etiquetaTipo(escala.tipo).split('(')[0].trim()}`
  ).join(' / ')
  return [tema.tonalidad, tema.escala_nombre].map(valor => texto(valor).trim()).filter(Boolean).join(' · ')
}

export async function guardarEstructuraTema(cliente, temaId, estructura) {
  const valor = guardarEstructura(estructura)
  await actualizarTema(cliente, temaId, { estructura: valor })
  return valor
}
