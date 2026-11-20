const VERSION = 1

// Esquema propio del documento de Repertorio; no carga ni altera el modelo
// de Pizarra. Sólo referencias: la digitación sigue viviendo en acordes.
function normalizarBloquesRepertorio(bloques, acordes) {
  const disponibles = new Set(acordes.map(a => a.id))
  const usados = new Set(), ids = new Set()
  if (!Array.isArray(bloques)) return []
  return bloques.flatMap(bloque => {
    const columna = bloque?.columna ?? 'izquierda'
    if (!bloque || typeof bloque.id !== 'string' || !bloque.id || ids.has(bloque.id) ||
        typeof bloque.titulo !== 'string' || !Number.isSafeInteger(bloque.repeticiones) || bloque.repeticiones < 1 ||
        !['izquierda', 'derecha'].includes(columna)) return []
    const partes = bloque.tipo === 'libre' ? [bloque.acordes] : bloque.tipo === 'compases' ? bloque.compases : null
    if (!Array.isArray(partes) || !partes.length || partes.length > 256 || !partes.every(Array.isArray)) return []
    ids.add(bloque.id)
    const secciones = partes.map(lista => lista.flatMap(entrada => {
      if (!entrada || !disponibles.has(entrada.id) || usados.has(entrada.id)) return []
      usados.add(entrada.id)
      return [{ id: entrada.id }]
    }))
    return [{ id: bloque.id, titulo: bloque.titulo, tipo: bloque.tipo, repeticiones: bloque.repeticiones, columna,
      ...(bloque.tipo === 'libre' ? { acordes: secciones[0] } : { compases: secciones }) }]
  })
}

/**
 * `notas` era un campo de texto antes de que existieran los diagramas. Para no
 * requerir una migración de la base ni perder notas ya cargadas, el campo acepta
 * el texto histórico y, cuando hace falta, un pequeño documento JSON.
 */
export function leerNotas(valor) {
  if (!valor) return { version: VERSION, texto: '', acordes: [] }

  try {
    const datos = JSON.parse(valor)
    if (
      datos &&
      typeof datos === 'object' &&
      Array.isArray(datos.acordes) &&
      typeof datos.texto === 'string'
    ) {
      const acordes = datos.acordes.filter((acorde) => acorde && typeof acorde === 'object' && !Array.isArray(acorde)).map(normalizarAcorde)
      return {
        version: VERSION,
        texto: datos.texto,
        acordes,
        ...(datos.bloquesAcordes ? { bloquesAcordes: normalizarBloquesRepertorio(datos.bloquesAcordes, acordes) } : {}),
      }
    }
  } catch {
    // Las notas creadas antes de esta mejora son texto plano.
  }

  return { version: VERSION, texto: valor, acordes: [] }
}

export function guardarNotas(datos) {
  return JSON.stringify({
    version: VERSION,
    texto: datos.texto ?? '',
    acordes: (datos.acordes ?? []).map(normalizarAcorde),
    ...(datos.bloquesAcordes ? { bloquesAcordes: normalizarBloquesRepertorio(datos.bloquesAcordes, datos.acordes ?? []) } : {}),
  })
}

export function crearAcorde() {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `acorde-${Date.now()}`,
    nombre: '',
    trastes: ['', '', '', ''],
    posiciones: Array.from({ length: 6 }, () => Array(4).fill('vacio')),
    tonica: null,
    bajo: null,
  }
}

export function normalizarAcorde(acorde = {}) {
  if (!acorde || typeof acorde !== 'object') acorde = {}
  // Cuatro columnas históricas y las adicionales necesarias para conservar
  // dibujos libres al convertir una cuerda al aire en nota pisada.
  const columnas = Array.isArray(acorde.trastes) ? Math.max(4, acorde.trastes.length) : 4
  const posiciones = Array.from({ length: 6 }, (_, cuerda) =>
    Array.from({ length: columnas }, (_, traste) => {
      const estado = acorde.posiciones?.[cuerda]?.[traste]
      return ['presionada', 'aire', 'muteada'].includes(estado) ? estado : 'vacio'
    })
  )
  function referenciaValida(referencia) {
    if (!referencia) return null
    const { cuerda, traste } = referencia
    return Number.isInteger(cuerda) && Number.isInteger(traste) &&
      ['presionada', 'aire'].includes(posiciones[cuerda]?.[traste])
      ? { cuerda, traste } : null
  }

  return {
    id: acorde.id ?? globalThis.crypto?.randomUUID?.() ?? `acorde-${Date.now()}`,
    nombre: typeof acorde.nombre === 'string' ? acorde.nombre : '',
    trastes: Array.from({ length: columnas }, (_, indice) => String(acorde.trastes?.[indice] ?? '')),
    posiciones,
    tonica: referenciaValida(acorde.tonica),
    bajo: referenciaValida(acorde.bajo),
    // Metadato opcional del mismo JSON; los acordes históricos no cambian.
    ...(acorde.opcional ? { opcional: referenciaValida(acorde.opcional) } : {}),
  }
}
