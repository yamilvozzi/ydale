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
        acordes: datos.acordes.map(normalizarAcorde),
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
  }
}

export function normalizarAcorde(acorde = {}) {
  const posiciones = Array.from({ length: 6 }, (_, cuerda) =>
    Array.from({ length: 4 }, (_, traste) => {
      const estado = acorde.posiciones?.[cuerda]?.[traste]
      return ['presionada', 'aire', 'muteada'].includes(estado) ? estado : 'vacio'
    })
  )
  const cuerdaTonica = Number(acorde.tonica?.cuerda)
  const trasteTonica = Number(acorde.tonica?.traste)
  const tonicaValida =
    Number.isInteger(cuerdaTonica) &&
    cuerdaTonica >= 0 &&
    cuerdaTonica < 6 &&
    Number.isInteger(trasteTonica) &&
    trasteTonica >= 0 &&
    trasteTonica < 4 &&
    posiciones[cuerdaTonica][trasteTonica] === 'presionada'

  return {
    id: acorde.id ?? globalThis.crypto?.randomUUID?.() ?? `acorde-${Date.now()}`,
    nombre: typeof acorde.nombre === 'string' ? acorde.nombre : '',
    trastes: Array.from({ length: 4 }, (_, indice) => String(acorde.trastes?.[indice] ?? '')),
    posiciones,
    tonica: tonicaValida ? { cuerda: cuerdaTonica, traste: trasteTonica } : null,
  }
}
