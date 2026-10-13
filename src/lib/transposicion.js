import { NOTAS } from './escalas.js'
import { claseDeNota } from './circuloQuintas.js'
import { interpretarAcorde } from './generadorAcordes.js'
import { normalizarAcorde } from './notasConAcordes.js'

const ENARMONICAS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const modulo = (valor) => ((valor % 12) + 12) % 12

export function transponerNota(nota, semitonos) {
  const normalizada = nota.replaceAll('♯', '#').replaceAll('♭', 'b')
  const nombres = normalizada.includes('#') ? NOTAS : ENARMONICAS
  return nombres[modulo(claseDeNota(normalizada) + semitonos)]
}

export function transponerNombreAcorde(nombre, semitonos) {
  const acorde = interpretarAcorde(nombre)
  if (acorde) return transponerNota(acorde.raiz.nombre, semitonos) + acorde.calidad +
    (acorde.bajo ? `/${transponerNota(acorde.bajo.nombre, semitonos)}` : '')
  // El editor admite sufijos libres (sus, M7, °, anotaciones). Se conservan
  // literalmente; los títulos que no empiezan con un cifrado quedan intactos.
  return nombre.replace(/^(\s*)([A-G][#b♯♭]?)(?=$|[\s\d(°+−-]|maj|min|m|M|sus|add|dim|aug|ø|Δ)([^/]*)(?:\/([A-G][#b♯♭]?))?$/,
    (_texto, espacio, raiz, calidad, bajo) => espacio + transponerNota(raiz, semitonos) + calidad +
      (bajo ? `/${transponerNota(bajo, semitonos)}` : ''))
}

/** Traslada las voces existentes en las mismas cuerdas, también las al aire.
 * Si bajar cruzaría la cejuela, mueve el conjunto a la octava equivalente.
 * No regenera el acorde: conserva inversiones, voces opcionales y dibujos.
 */
export function transponerDiagrama(acorde, semitonos) {
  const notas = acorde.posiciones.flatMap((fila, cuerda) => fila.flatMap((estado, columna) => {
    if (!['presionada', 'aire'].includes(estado)) return []
    const numero = String(acorde.trastes[columna]).trim()
    if (estado === 'presionada' && (!/^\d+$/.test(numero) || !Number.isSafeInteger(Number(numero)) || Number(numero) < 1)) {
      throw new Error(`Definí los números de los trastes de ${acorde.nombre || 'el acorde sin nombre'} antes de transponer.`)
    }
    return [{ cuerda, columna, traste: estado === 'aire' ? 0 : Number(numero) }]
  }))
  const nombre = transponerNombreAcorde(acorde.nombre, semitonos)
  if (!notas.length) return { ...acorde, nombre }
  const minimo = Math.min(...notas.map(nota => nota.traste))
  const traslado = semitonos - Math.floor((minimo + semitonos) / 12) * 12
  const trasladadas = notas.map(nota => ({ ...nota, traste: nota.traste + traslado }))
  const pisadas = [...new Set(trasladadas.filter(nota => nota.traste > 0).map(nota => nota.traste))].sort((a, b) => a - b)
  const inicio = pisadas[0] ?? 1
  const span = (pisadas.at(-1) ?? inicio) - inicio + 1
  // Los dibujos libres pueden usar trastes no consecutivos. No inventar ni
  // descartar notas para forzarlos dentro de una ventana de cinco columnas.
  const trastes = span <= 5
    ? Array.from({ length: Math.max(4, span) }, (_, i) => inicio + i)
    : [...pisadas]
  while (trastes.length < 4) trastes.push(trastes.at(-1) + 1)
  const posiciones = Array.from({ length: 6 }, () => Array(trastes.length).fill('vacio'))
  for (const [cuerda, fila] of acorde.posiciones.entries()) {
    if (fila.includes('muteada')) posiciones[cuerda][0] = 'muteada'
  }
  const referencias = { tonica: null, bajo: null, ...(acorde.opcional ? { opcional: null } : {}) }
  for (const nota of trasladadas) {
    const columna = nota.traste === 0 ? 0 : trastes.indexOf(nota.traste)
    posiciones[nota.cuerda][columna] = nota.traste === 0 ? 'aire' : 'presionada'
    for (const campo of Object.keys(referencias)) {
      if (acorde[campo]?.cuerda === nota.cuerda && acorde[campo]?.traste === nota.columna) {
        referencias[campo] = { cuerda: nota.cuerda, traste: columna }
      }
    }
  }
  return normalizarAcorde({ ...acorde, nombre, trastes: trastes.map(String), posiciones, ...referencias })
}
