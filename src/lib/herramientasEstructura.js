import { caracteresConPosicion, versosConPosicion } from './anclasEstructura.js'

export function duplicarBloque(bloque) {
  const copia = structuredClone(bloque)
  return { ...copia, id: globalThis.crypto.randomUUID(), ...(copia.anclas ? {
    anclas: copia.anclas.map(ancla => ({ ...ancla, id: globalThis.crypto.randomUUID() })),
  } : {}) }
}

const posicionesVerso = verso => [...caracteresConPosicion(verso.texto).map(c => verso.inicio + c.posicion), verso.fin]

/** Traslado por número de línea y proporción de caracteres, sin analizar la letra. */
export function copiarAcordesDesde(destino, origen) {
  const versosOrigen = versosConPosicion(origen.letra)
  const versosDestino = versosConPosicion(destino.letra)
  const anclas = [...(origen.anclas ?? [])].sort((a, b) => a.posicion - b.posicion).map(ancla => {
    const indice = versosOrigen.findIndex(verso => ancla.posicion >= verso.inicio && ancla.posicion <= verso.fin)
    if (indice < 0) return null
    const lineaDestino = Math.min(indice, versosDestino.length - 1)
    const inicio = versosOrigen[lineaDestino].inicio
    const fin = lineaDestino === versosDestino.length - 1 ? origen.letra.length : versosOrigen[indice].fin
    // Si faltan líneas, distribuye juntas las restantes sobre la última y conserva el orden.
    const desde = posicionesVerso({ texto: origen.letra.slice(inicio, fin), inicio, fin })
    const hasta = posicionesVerso(versosDestino[lineaDestino])
    const caracter = desde.indexOf(ancla.posicion)
    if (caracter < 0) return null
    const trasladada = desde.length > 1 ? Math.round(caracter / (desde.length - 1) * (hasta.length - 1)) : 0
    return { id: globalThis.crypto.randomUUID(), acordeId: ancla.acordeId, posicion: hasta[trasladada] }
  }).filter(Boolean)
  // Se conservan todos los acordes aunque compartan posición en una línea corta.
  return { ...destino, anclas: anclas.sort((a, b) => a.posicion - b.posicion) }
}

export function moverAcordeEnLinea(bloque, anclaId, posicion) {
  const ancla = (bloque.anclas ?? []).find(ancla => ancla.id === anclaId)
  if (!ancla) return bloque
  const verso = versosConPosicion(bloque.letra).find(verso => ancla.posicion >= verso.inicio && ancla.posicion <= verso.fin)
  if (!verso || !posicionesVerso(verso).includes(posicion) || ancla.posicion === posicion) return bloque
  return { ...bloque, anclas: bloque.anclas.map(ancla => ancla.id === anclaId ? { ...ancla, posicion } : ancla).sort((a, b) => a.posicion - b.posicion) }
}

/** Los candidatos pertenecen exclusivamente al verso del acorde en movimiento. */
export function posicionHorizontal(candidatos, x) {
  return candidatos.reduce((cercana, candidata) => !cercana || Math.abs(candidata.x - x) < Math.abs(cercana.x - x) ? candidata : cercana, null)
}
