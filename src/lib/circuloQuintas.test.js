import test from 'node:test'
import assert from 'node:assert/strict'
import { TONALIDADES_CIRCULO, calcularTonalidad, claseDeNota, mostrarNota, sectoresCirculo } from './circuloQuintas.js'

const MAYORES = [
  ['C Dm Em F G Am B°', 0], ['G Am Bm C D Em F#°', 1],
  ['D Em F#m G A Bm C#°', 2], ['A Bm C#m D E F#m G#°', 3],
  ['E F#m G#m A B C#m D#°', 4], ['B C#m D#m E F# G#m A#°', 5],
  ['F# G#m A#m B C# D#m E#°', 6], ['Db Ebm Fm Gb Ab Bbm C°', -5],
  ['Ab Bbm Cm Db Eb Fm G°', -4], ['Eb Fm Gm Ab Bb Cm D°', -3],
  ['Bb Cm Dm Eb F Gm A°', -2], ['F Gm Am Bb C Dm E°', -1],
]

test('las doce mayores: siete acordes, grafías, grados y armadura', () => {
  TONALIDADES_CIRCULO.forEach(({ mayor, menor }, i) => {
    const resultado = calcularTonalidad(mayor, 'mayor')
    assert.deepEqual(resultado.acordes.map((a) => a.nombre), MAYORES[i][0].split(' ').map(mostrarNota), mayor)
    assert.deepEqual(resultado.acordes.map((a) => a.grado), ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
    assert.equal(resultado.armadura, MAYORES[i][1])
    assert.equal(resultado.relativa, mostrarNota(menor) + 'm')
  })
})

test('las doce menores naturales conservan la armadura y dan protagonismo a su tónica', () => {
  TONALIDADES_CIRCULO.forEach(({ mayor, menor }, i) => {
    const resultado = calcularTonalidad(menor, 'menor')
    const mayorEsperada = MAYORES[i][0].split(' ').map(mostrarNota)
    assert.deepEqual(resultado.acordes.map((a) => a.nombre), [5, 6, 0, 1, 2, 3, 4].map((j) => mayorEsperada[j]), menor)
    assert.deepEqual(resultado.acordes.map((a) => a.grado), ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'])
    assert.equal(resultado.armadura, MAYORES[i][1])
    assert.equal(resultado.relativa, mostrarNota(mayor))
    assert.equal(resultado.acordes[0].nivel, 'tonica')
    assert.equal(resultado.acordes[1].nivel, 'disminuido')
    assert.equal(resultado.acordes[4].modo, 'menor')
  })
})

test('F♯ / G♭ y D♯m / E♭m tienen la misma altura y grafías propias', () => {
  for (const [sostenida, bemol, modo, esperados] of [
    ['F#', 'Gb', 'mayor', 'Gb Abm Bbm Cb Db Ebm F°'],
    ['D#', 'Eb', 'menor', 'Ebm F° Gb Abm Bbm Cb Db'],
  ]) {
    const a = calcularTonalidad(sostenida, modo)
    const b = calcularTonalidad(bemol, modo)
    assert.equal(a.armadura, 6)
    assert.equal(b.armadura, -6)
    assert.deepEqual(a.acordes.map((c) => c.clase), b.acordes.map((c) => c.clase))
    assert.deepEqual(b.acordes.map((c) => c.nombre), esperados.split(' ').map(mostrarNota))
  }
})

test('los anillos conservan 24 sectores y sólo destacan las tríadas con la calidad correcta', () => {
  for (const par of TONALIDADES_CIRCULO) for (const modo of ['mayor', 'menor']) {
    const tonalidad = calcularTonalidad(par[modo], modo)
    const sectores = sectoresCirculo(tonalidad)
    assert.equal(sectores.length, 24)
    assert.equal(sectores.filter((s) => s.nivel === 'tonica').length, 1)
    assert.equal(sectores.filter((s) => s.nivel === 'principal').length, 2)
    assert.equal(sectores.filter((s) => s.nivel === 'diatonico').length, 3)
    assert.equal(sectores.filter((s) => s.nivel === 'fuera').length, 18)
    for (const s of sectores.filter((s) => s.grado)) {
      const acorde = tonalidad.acordes.find((a) => a.grado === s.grado)
      assert.equal(s.nombre, acorde.nombre)
      assert.equal(s.modo, acorde.modo)
      const elegida = calcularTonalidad(s.tonica, s.modo)
      assert.equal(elegida.acordes[0].nombre, s.nombre)
    }
  }
  const sectores = sectoresCirculo(calcularTonalidad('C', 'mayor'))
  assert.equal(sectores.find((s) => s.nombre === 'B').nivel, 'fuera')
  assert.equal(sectores.find((s) => s.nombre === 'Bm').nivel, 'fuera')
})

test('las notas forman terceras y quintas correctas, también al elegir grafías contextuales', () => {
  for (const [tonica, modo] of [['Cb', 'mayor'], ['C#', 'mayor'], ['A#', 'menor'], ['Ab', 'menor'], ['Fb', 'mayor']]) {
    const { acordes } = calcularTonalidad(tonica, modo)
    acordes.forEach((acorde, i) => {
      const tercera = (claseDeNota(acordes[(i + 2) % 7].tonica) - acorde.clase + 12) % 12
      const quinta = (claseDeNota(acordes[(i + 4) % 7].tonica) - acorde.clase + 12) % 12
      assert.equal(tercera, acorde.modo === 'mayor' ? 4 : 3)
      assert.equal(quinta, acorde.modo === 'disminuido' ? 6 : 7)
    })
  }
})
