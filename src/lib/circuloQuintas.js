// La armadura permite escribir cada grado con su letra correcta, incluso
// E♯ en F♯ mayor o C♭ en G♭ mayor, sin cambiar la lógica del editor de escalas.
export const TONALIDADES_CIRCULO = [
  ['C', 'A'], ['G', 'E'], ['D', 'B'], ['A', 'F#'],
  ['E', 'C#'], ['B', 'G#'], ['F#', 'D#'], ['Db', 'Bb'],
  ['Ab', 'F'], ['Eb', 'C'], ['Bb', 'G'], ['F', 'D'],
].map(([mayor, menor]) => ({ mayor, menor }))

const LETRAS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const NATURALES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const ARMADURAS_MAYORES = { C: 0, D: 2, E: 4, F: -1, G: 1, A: 3, B: 5 }
const SOSTENIDOS = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const BEMOLES = [...SOSTENIDOS].reverse()
const GRADOS = {
  mayor: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  menor: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
}
const CALIDADES = {
  mayor: ['mayor', 'menor', 'menor', 'mayor', 'mayor', 'menor', 'disminuido'],
  menor: ['menor', 'disminuido', 'mayor', 'menor', 'menor', 'mayor', 'mayor'],
}

const alteracion = (nota) => [...nota.slice(1)].reduce((suma, signo) => suma + (signo === '#' ? 1 : -1), 0)
export const claseDeNota = (nota) => ((NATURALES[nota[0]] + alteracion(nota)) % 12 + 12) % 12
export const mostrarNota = (nota) => nota.replaceAll('#', '♯').replaceAll('b', '♭')
export const nombreAcorde = (tonica, modo) => mostrarNota(tonica) + (modo === 'menor' ? 'm' : modo === 'disminuido' ? '°' : '')

export function calcularTonalidad(tonica, modo) {
  const armadura = ARMADURAS_MAYORES[tonica[0]] + 7 * alteracion(tonica) - (modo === 'menor' ? 3 : 0)
  const orden = armadura < 0 ? BEMOLES : SOSTENIDOS
  const alteraciones = Object.fromEntries(LETRAS.map((letra) => [letra, '']))
  for (let i = 0; i < Math.abs(armadura); i++) alteraciones[orden[i % 7]] += armadura < 0 ? 'b' : '#'
  const inicio = LETRAS.indexOf(tonica[0])
  const notas = LETRAS.map((_, i) => {
    const letra = LETRAS[(inicio + i) % 7]
    return letra + alteraciones[letra]
  })
  const acordes = notas.map((nota, i) => ({
    tonica: nota,
    modo: CALIDADES[modo][i],
    nombre: nombreAcorde(nota, CALIDADES[modo][i]),
    grado: GRADOS[modo][i],
    clase: claseDeNota(nota),
    nivel: i === 0 ? 'tonica' : CALIDADES[modo][i] === 'disminuido' ? 'disminuido' : [3, 4].includes(i) ? 'principal' : 'diatonico',
  }))
  return {
    tonica, modo, armadura, acordes,
    relativa: nombreAcorde(notas[modo === 'mayor' ? 5 : 2], modo === 'mayor' ? 'menor' : 'mayor'),
    descripcionArmadura: armadura === 0 ? 'Sin alteraciones' : `${Math.abs(armadura)}${armadura < 0 ? '♭' : '♯'}`,
  }
}

export function sectoresCirculo(tonalidad) {
  return TONALIDADES_CIRCULO.flatMap((par, indice) => ['mayor', 'menor'].map((modo) => {
    const acorde = tonalidad.acordes.find((item) => item.modo === modo && item.clase === claseDeNota(par[modo]))
    const tonica = acorde?.tonica ?? par[modo]
    return {
      indice, modo, tonica,
      nombre: nombreAcorde(tonica, modo),
      grado: acorde?.grado ?? '',
      nivel: acorde?.nivel ?? 'fuera',
      // El tritono tiene dos grafías habituales; la selección conserva una
      // escritura coherente y permite consultar la equivalente desde el modal.
      equivalente: indice === 6 ? nombreAcorde(tonica.includes('b') ? par[modo] : modo === 'mayor' ? 'Gb' : 'Eb', modo) : '',
    }
  }))
}
