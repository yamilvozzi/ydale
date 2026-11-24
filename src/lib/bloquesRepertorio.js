import { columnaBloque, COLUMNAS_BLOQUES, conSeccionesBloque, ordenarBloques, seccionesBloque } from './bloquesPizarra.js'

export function acordesSueltos(notas) {
  const agrupados = new Set((notas.bloquesAcordes ?? []).flatMap(b => seccionesBloque(b).flat().map(a => a.id)))
  return notas.acordes.filter(a => !agrupados.has(a.id))
}

export function ubicacionAcorde(notas, id) {
  for (const bloque of notas.bloquesAcordes ?? []) {
    const compas = seccionesBloque(bloque).findIndex(lista => lista.some(a => a.id === id))
    if (compas >= 0) return { bloqueId: bloque.id, compas }
  }
  return { compas: 0 }
}

function insertar(lista, elemento, referencia, despues) {
  const indice = lista.findIndex(a => a.id === referencia)
  const posicion = indice < 0 ? lista.length : indice + Number(Boolean(despues))
  return [...lista.slice(0, posicion), elemento, ...lista.slice(posicion)]
}

function copiarAcorde(acorde) {
  return { ...structuredClone(acorde), id: globalThis.crypto.randomUUID() }
}

export function colocarAcordeRepertorio(notas, id, destino) {
  if (!destino.bloqueId || ubicacionAcorde(notas, id).bloqueId) return moverAcordeRepertorio(notas, id, destino)

  const acorde = notas.acordes.find(a => a.id === id)
  if (!acorde) return notas
  // Una copia de la digitación permite reutilizar el original en otros compases.
  const copia = copiarAcorde(acorde)
  const conCopia = { ...notas, acordes: [...notas.acordes, copia] }
  const resultado = moverAcordeRepertorio(conCopia, copia.id, destino)
  return resultado === conCopia ? notas : resultado
}

export function moverAcordeRepertorio(notas, id, destino) {
  const acorde = notas.acordes.find(a => a.id === id)
  const bloques = notas.bloquesAcordes ?? []
  const bloque = bloques.find(b => b.id === destino.bloqueId)
  if (!acorde || destino.referencia === id || (destino.bloqueId && !seccionesBloque(bloque ?? { tipo: 'compases', compases: [] })[destino.compas])) return notas
  const sinEntrada = bloques.map(b => conSeccionesBloque(b, seccionesBloque(b).map(lista => lista.filter(a => a.id !== id))))
  if (bloque) return {
    ...notas,
    bloquesAcordes: sinEntrada.map(b => b.id !== bloque.id ? b : conSeccionesBloque(b, seccionesBloque(b).map((lista, i) =>
      i === destino.compas ? insertar(lista, { id }, destino.referencia, destino.despues) : lista))),
  }
  // Reordenar sólo el sector suelto conserva el orden histórico del resto.
  const libres = acordesSueltos({ ...notas, bloquesAcordes: sinEntrada }).filter(a => a.id !== id)
  const orden = insertar(libres, acorde, destino.referencia, destino.despues)
  const idsLibres = new Set(orden.map(a => a.id))
  let indice = 0
  return { ...notas, bloquesAcordes: sinEntrada, acordes: notas.acordes.map(a => idsLibres.has(a.id) ? orden[indice++] : a) }
}

export function guardarBloqueRepertorio(notas, bloque) {
  const nuevo = { ...bloque, id: bloque.id ?? globalThis.crypto.randomUUID() }
  const bloques = notas.bloquesAcordes ?? []
  return { ...notas, bloquesAcordes: bloques.some(b => b.id === nuevo.id) ? bloques.map(b => b.id === nuevo.id ? nuevo : b) : [...bloques, nuevo] }
}

export function moverBloqueRepertorio(notas, id, destino) {
  const bloques = notas.bloquesAcordes ?? []
  const bloque = bloques.find(b => b.id === id)
  if (!bloque || destino.referencia === id || !COLUMNAS_BLOQUES.includes(destino.columna)) return notas
  const columna = bloques.filter(b => b.id !== id && columnaBloque(b) === destino.columna)
  const otros = bloques.filter(b => b.id !== id && columnaBloque(b) !== destino.columna)
  return { ...notas, bloquesAcordes: ordenarBloques([...otros, ...insertar(columna, { ...bloque, columna: destino.columna }, destino.referencia, destino.despues)]) }
}

export function vaciarBloqueRepertorio(notas, id, eliminar = false) {
  // Sin referencias, las tarjetas vuelven al sector libre en su orden guardado.
  return { ...notas, bloquesAcordes: (notas.bloquesAcordes ?? []).flatMap(b => b.id !== id ? [b] : eliminar ? [] : [conSeccionesBloque(b, seccionesBloque(b).map(() => []))]) }
}

export function duplicarBloqueRepertorio(notas, id) {
  const bloque = notas.bloquesAcordes?.find(b => b.id === id)
  if (!bloque) return notas
  const porId = new Map(notas.acordes.map(a => [a.id, a]))
  const copias = []
  const copia = conSeccionesBloque({ ...bloque, id: globalThis.crypto.randomUUID() }, seccionesBloque(bloque).map(lista => lista.map(entrada => {
    const acorde = copiarAcorde(porId.get(entrada.id))
    copias.push(acorde)
    return { id: acorde.id }
  })))
  return { ...notas, acordes: [...notas.acordes, ...copias], bloquesAcordes: notas.bloquesAcordes.flatMap(b => b.id === id ? [b, copia] : [b]) }
}
