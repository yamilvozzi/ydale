import test from 'node:test'
import assert from 'node:assert/strict'
import { generarPosiciones, interpretarAcorde, propuestaAEditable, ZONAS, GRUPOS_CUERDAS } from './generadorAcordes.js'
import { RAICES_ACORDES, SUFIJOS_ACORDES } from './catalogoAcordes.js'
import { AFINACION, NOTAS, notaEnTraste } from './escalas.js'
import { guardarNotas, leerNotas, crearAcorde, normalizarAcorde } from './notasConAcordes.js'

test('construye todas las calidades y conserva las tres voces características', () => {
  const esperadas = {
    C: ['C', 'E', 'G'], Cm: ['C', 'Eb', 'G'], C7: ['C', 'E', 'G', 'Bb'],
    Cm7: ['C', 'Eb', 'G', 'Bb'], Cmaj7: ['C', 'E', 'G', 'B'],
    Csus2: ['C', 'D', 'G'], Csus4: ['C', 'F', 'G'], C6: ['C', 'E', 'G', 'A'],
    Cm6: ['C', 'Eb', 'G', 'A'], Cdim: ['C', 'Eb', 'Gb'], Caug: ['C', 'E', 'G#'],
  }
  for (const [nombre, notas] of Object.entries(esperadas)) {
    assert.deepEqual(interpretarAcorde(nombre).notas.map((n) => n.nombre), notas)
  }
  for (const [nombre, notas] of Object.entries({ A7: ['A', 'C#', 'G'], Am7: ['A', 'C', 'G'], Cmaj7: ['C', 'E', 'B'], Cm6: ['C', 'Eb', 'A'] })) {
    assert.deepEqual(interpretarAcorde(nombre).voces.map((n) => n.nombre), notas)
  }
  assert.deepEqual(interpretarAcorde('C#').notas.map((n) => n.nombre), ['C#', 'E#', 'G#'])
  assert.deepEqual(interpretarAcorde('Ebm').notas.map((n) => n.nombre), ['Eb', 'Gb', 'Bb'])
  assert.deepEqual(interpretarAcorde('Bdim').notas.map((n) => n.nombre), ['B', 'D', 'F'])
  assert.equal(interpretarAcorde(' d/f♯ ').nombre, 'D/F#')
  assert.equal(interpretarAcorde('Bbmaj7/Db').bajo.nombre, 'Db')
  for (const invalido of ['', 'H', 'C9', 'C/foo', null, 'C##', 'Cmaj']) assert.equal(interpretarAcorde(invalido), null)
})

test('D y Dm priorizan sus tres formas clásicas, con tónica en cuerdas 1, 2 y 3', () => {
  assert.deepEqual(generarPosiciones('D', { cuerdas: '1–2–3' }).map((p) => p.principal.map((n) => n.traste)), [[10, 10, 11], [2, 3, 2], [5, 7, 7]])
  assert.deepEqual(generarPosiciones('Dm', { cuerdas: '1–2–3' }).map((p) => p.principal.map((n) => n.traste)), [[10, 10, 10], [1, 3, 2], [5, 6, 7]])
  for (const raiz of RAICES_ACORDES) for (const sufijo of ['', 'm']) {
    const propuestas = generarPosiciones(raiz + sufijo)
    assert.equal(propuestas.length, 4, raiz + sufijo)
    assert.deepEqual(propuestas.slice(0, 3).map((p) => p.cuerdaTonica), [0, 1, 2])
    assert.ok(propuestas.slice(0, 3).every((p) => p.principal[0].midi - p.principal[2].midi < 12))
    assert.deepEqual(propuestas[3].principal.map((n) => n.cuerda), [1, 2, 3])
  }
})

test('todo resultado cumple notas, cuerdas, zonas, altura y máximo cuatro trastes, incluido el bajo', () => {
  for (const raiz of RAICES_ACORDES) for (const sufijo of SUFIJOS_ACORDES) {
    const acorde = interpretarAcorde(raiz + sufijo)
    for (const [zona, [desde, hasta]] of Object.entries(ZONAS)) {
      for (const cuerdas of ['AUTO', ...Object.keys(GRUPOS_CUERDAS)]) for (const bajo of [false, true]) {
        const propuestas = generarPosiciones(acorde, { zona, cuerdas, bajo })
        assert.ok(propuestas.length <= (cuerdas === 'AUTO' ? 4 : 3))
        assert.equal(new Set(propuestas.map((p) => p.id)).size, propuestas.length)
        for (const p of propuestas) {
          assert.equal(p.principal.length, 3)
          assert.deepEqual(p.principal.map((n) => n.clase).sort((a, b) => a - b), acorde.voces.map((n) => n.clase).sort((a, b) => a - b))
          if (cuerdas !== 'AUTO') assert.deepEqual(p.principal.map((n) => n.cuerda), GRUPOS_CUERDAS[cuerdas])
          const notas = p.bajo ? [...p.principal, p.bajo] : p.principal
          assert.equal(new Set(notas.map((n) => n.cuerda)).size, notas.length)
          const trastes = notas.map((n) => n.traste)
          assert.ok(Math.max(...trastes) - Math.min(...trastes) <= 4)
          for (const n of notas) {
            assert.ok(n.traste >= desde && n.traste <= hasta)
            assert.equal(n.clase, NOTAS.indexOf(notaEnTraste(AFINACION[n.cuerda], n.traste)))
          }
          assert.equal(Boolean(p.bajo), bajo)
          if (bajo) {
            assert.equal(p.bajo.clase, acorde.raiz.clase)
            assert.ok(p.bajo.cuerda >= 3)
            assert.ok(p.principal.every((n) => n.midi > p.bajo.midi))
          }
        }
      }
    }
  }
})

test('el slash activa automáticamente su bajo independiente, aun si es ajeno a la tríada', () => {
  for (const nombre of ['D/F#', 'C/F#', 'Bb/Db', 'Am7/G']) {
    const acorde = interpretarAcorde(nombre)
    const propuestas = generarPosiciones(nombre)
    assert.ok(propuestas.length > 0)
    for (const p of propuestas) {
      assert.equal(p.bajo.clase, acorde.bajo.clase)
      assert.equal(p.bajo.nota, acorde.bajo.nombre)
      assert.equal(p.principal.length, 3)
      assert.ok(p.principal.every((n) => n.cuerda !== p.bajo.cuerda && n.midi > p.bajo.midi))
    }
  }
  assert.deepEqual(generarPosiciones('D/F#', { cuerdas: '4–5–6' }), [])
  assert.deepEqual(generarPosiciones('C', { cuerdas: '4–5–6', bajo: true }), [])
  assert.equal(generarPosiciones('D', { cuerdas: '1–2–3', zona: 'ABIERTA' }).length, 1)
  assert.deepEqual(generarPosiciones('H'), [])
})

test('ELEGIR conserva todas las cuerdas, trastes, tónica y bajo al pasar al editor y serializar', () => {
  for (const nombre of ['C', 'D/F#', 'Am7', 'Caug', 'E', 'G', 'Bb/Db']) {
    const acorde = interpretarAcorde(nombre)
    for (const zona of Object.keys(ZONAS)) for (const p of generarPosiciones(acorde, { zona })) {
      const editable = propuestaAEditable(acorde, p)
      const guardado = leerNotas(guardarNotas({ texto: 'ensayo', acordes: [editable] })).acordes[0]
      assert.equal(guardado.nombre, nombre)
      assert.equal(guardado.posiciones.flat().filter((estado) => estado === 'aire' || estado === 'presionada').length, p.bajo ? 4 : 3)
      assert.ok(guardado.trastes.every((traste, i) => Number(traste) === Number(guardado.trastes[0]) + i))
      for (const nota of [...p.principal, ...(p.bajo ? [p.bajo] : [])]) {
        const columna = nota.traste === 0 ? 0 : guardado.trastes.indexOf(String(nota.traste))
        assert.equal(guardado.posiciones[nota.cuerda][columna], nota.traste === 0 ? 'aire' : 'presionada')
        if (nota.esTonica && !nota.esBajo) assert.deepEqual(guardado.tonica, { cuerda: nota.cuerda, traste: columna })
        if (nota.esBajo) assert.deepEqual(guardado.bajo, { cuerda: nota.cuerda, traste: columna })
      }
    }
  }
})

test('la extensión máxima conserva los cinco trastes consecutivos y permite editar sin restricciones musicales', () => {
  const acorde = interpretarAcorde('D/F#')
  const propuesta = generarPosiciones(acorde, { zona: 'AGUDA', cuerdas: '1–2–3' })[0]
  const editable = propuestaAEditable(acorde, propuesta)
  assert.deepEqual(editable.trastes, ['10', '11', '12', '13', '14'])
  editable.nombre = 'Mi digitación'
  editable.posiciones[0][0] = 'vacio'
  editable.posiciones[0][3] = 'presionada'
  editable.posiciones[4][2] = 'presionada'
  editable.trastes[3] = '20'
  const guardado = leerNotas(guardarNotas({ texto: 'Notas originales', acordes: [editable] }))
  assert.equal(guardado.texto, 'Notas originales')
  assert.equal(guardado.acordes[0].nombre, 'Mi digitación')
  assert.equal(guardado.acordes[0].trastes[3], '20')
  assert.equal(guardado.acordes[0].posiciones[0][3], 'presionada')
  assert.equal(guardado.acordes[0].posiciones[4][2], 'presionada')
  assert.equal(guardado.acordes[0].tonica, null)
  assert.deepEqual(guardado.acordes[0].bajo, { cuerda: 5, traste: 4 })
  editable.posiciones[5][4] = 'muteada'
  assert.equal(normalizarAcorde(editable).bajo, null)
})

test('el formato manual histórico sigue conservando sus cuatro columnas y notas libres', () => {
  const manual = crearAcorde()
  manual.trastes = ['2', '', '9', '12']
  manual.posiciones[0][0] = 'presionada'
  manual.posiciones[0][2] = 'presionada'
  const guardado = leerNotas(guardarNotas({ texto: 'Texto', acordes: [manual] })).acordes[0]
  assert.deepEqual(guardado.trastes, manual.trastes)
  assert.deepEqual(guardado.posiciones, manual.posiciones)
  assert.equal(guardado.trastes.length, 4)
  assert.equal(leerNotas('Texto histórico').texto, 'Texto histórico')
})
