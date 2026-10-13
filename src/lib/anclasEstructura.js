/** Los índices son offsets UTF-16 del texto real, nunca espacios de relleno. */
export function caracteresConPosicion(texto) {
  if (typeof Intl.Segmenter === 'function') {
    return [...new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(texto)]
      .map(({ segment, index }) => ({ caracter: segment, posicion: index }))
  }
  let posicion = 0
  return Array.from(texto, caracter => {
    const actual = { caracter, posicion }
    posicion += caracter.length
    return actual
  })
}

export function normalizarLetraConAnclas(texto, anclas = []) {
  const lineas = texto.replace(/\r\n?/g, '\n')
  const inicio = lineas.length - lineas.trimStart().length
  const final = lineas.trimEnd().length
  const letra = lineas.trim()
  const limites = new Set([...caracteresConPosicion(letra).map(c => c.posicion), letra.length])
  const posiciones = []
  const ids = new Set()
  for (const ancla of Array.isArray(anclas) ? anclas : []) {
    if (!ancla || typeof ancla.acordeId !== 'string' || !ancla.acordeId ||
        !Number.isInteger(ancla.posicion) || ancla.posicion < 0 || ancla.posicion > texto.length) continue
    const normalizada = texto.slice(0, ancla.posicion).replace(/\r\n?/g, '\n').length
    const posicion = ancla.posicion === texto.length ? letra.length : normalizada - inicio
    if (normalizada < inicio || (normalizada > final && ancla.posicion !== texto.length) || !limites.has(posicion)) continue
    const id = typeof ancla.id === 'string' && ancla.id && !ids.has(ancla.id) ? ancla.id : globalThis.crypto.randomUUID()
    ids.add(id)
    posiciones.push({ id, acordeId: ancla.acordeId, posicion })
  }
  return { letra, anclas: posiciones.sort((a, b) => a.posicion - b.posicion) }
}

function rangoDeEdicion(anterior, nueva, seleccion, inputType = '') {
  if (seleccion?.texto === anterior) {
    let { inicio, fin } = seleccion
    const eliminados = anterior.length - nueva.length
    if (inicio === fin && eliminados > 0) {
      if (inputType.includes('Backward')) inicio -= eliminados
      else if (inputType.includes('Forward')) fin += eliminados
    }
    const prefijo = anterior.slice(0, inicio), sufijo = anterior.slice(fin)
    if (inicio >= 0 && fin >= inicio && fin <= anterior.length && nueva.length >= prefijo.length + sufijo.length &&
        nueva.startsWith(prefijo) && nueva.endsWith(sufijo)) return { inicio, fin }
  }
  let inicio = 0, fin = anterior.length, finNuevo = nueva.length
  while (inicio < fin && inicio < finNuevo && anterior[inicio] === nueva[inicio]) inicio++
  while (fin > inicio && finNuevo > inicio && anterior[fin - 1] === nueva[finNuevo - 1]) { fin--; finNuevo-- }
  return { inicio, fin }
}

export function actualizarLetraConAnclas(bloque, letra, seleccion, inputType) {
  const anterior = bloque.letra
  if (letra === anterior) return { ...bloque, letra }
  const { inicio, fin } = rangoDeEdicion(anterior, letra, seleccion, inputType)
  const diferencia = letra.length - anterior.length
  const anclas = (bloque.anclas ?? []).flatMap(ancla => {
    if (ancla.posicion < inicio) return [{ ...ancla }]
    if (ancla.posicion >= fin) return [{ ...ancla, posicion: ancla.posicion + diferencia }]
    return [] // El carácter asociado fue eliminado o reemplazado.
  })
  return { ...bloque, letra, ...(bloque.anclas || anclas.length ? { anclas } : {}) }
}

export function asignarAcorde(bloque, posicion, acordeId, acordesDelTema, anclaId) {
  if (!acordesDelTema.some(acorde => acorde.id === acordeId)) throw new Error('El acorde no pertenece a ACORDES de este tema.')
  if (![...caracteresConPosicion(bloque.letra).map(c => c.posicion), bloque.letra.length].includes(posicion)) throw new Error('Posición de letra inválida.')
  const existente = (bloque.anclas ?? []).find(ancla => anclaId ? ancla.id === anclaId : ancla.posicion === posicion)
  const ancla = { id: existente?.id ?? globalThis.crypto.randomUUID(), acordeId, posicion }
  return { ...bloque, anclas: [...(bloque.anclas ?? []).filter(actual => actual.id !== existente?.id), ancla].sort((a, b) => a.posicion - b.posicion) }
}

/** Carriles verticales para rótulos cercanos, sin desplazar la letra. */
export function distribuirCarriles(intervalos) {
  const finales = [], carriles = {}
  for (const intervalo of [...intervalos].sort((a, b) => a.izquierda - b.izquierda)) {
    let carril = finales.findIndex(final => final + 4 <= intervalo.izquierda)
    if (carril < 0) carril = finales.length
    finales[carril] = intervalo.derecha
    carriles[intervalo.id] = carril
  }
  return { carriles, cantidad: Math.max(1, finales.length) }
}

export function versosConPosicion(letra) {
  let inicio = 0
  return letra.split('\n').map(texto => {
    const verso = { texto, inicio, fin: inicio + texto.length }
    inicio += texto.length + 1
    return verso
  })
}
