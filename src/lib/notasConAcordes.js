const VERSION = 1

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
      return {
        version: VERSION,
        texto: datos.texto,
        acordes: datos.acordes.filter((acorde) => acorde && typeof acorde === 'object' && !Array.isArray(acorde)).map(normalizarAcorde),
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
  // Los diagramas históricos tienen cuatro columnas. Una extensión de cuatro
  // trastes puede necesitar cinco columnas consecutivas, incluidos sus extremos.
  const columnas = acorde.trastes?.length === 5 ? 5 : 4
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
