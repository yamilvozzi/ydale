import test from 'node:test'
import assert from 'node:assert/strict'
import { ventanaAcorde } from './ventanaAcorde.js'
import { generarPosiciones, interpretarAcorde, propuestaAEditable } from './generadorAcordes.js'

function acordeConNotas(trastes, pisadas) {
  const acorde = { trastes: trastes.map(String), posiciones: Array.from({ length: 6 }, () => trastes.map(() => 'vacio')) }
  pisadas.forEach(([cuerda, traste]) => { acorde.posiciones[cuerda][trastes.indexOf(traste)] = 'presionada' })
  return acorde
}

test('centra spans de uno, dos y tres trastes en cuatro columnas', () => {
  for (const [pisadas, esperadas] of [
    [[[0, 8]], ['7', '8', '9', '10']],
    [[[0, 8], [1, 9]], ['7', '8', '9', '10']],
    [[[0, 8], [1, 10]], ['7', '8', '9', '10']],
  ]) {
    const acorde = acordeConNotas([8, 9, 10, 11], pisadas)
    const vista = ventanaAcorde(acorde)
    assert.deepEqual(vista.trastes, esperadas)
    for (const [cuerda, traste] of pisadas) {
      const columna = vista.trastes.indexOf(String(traste))
      assert.equal(vista.indicesPorCuerda[cuerda][columna], acorde.trastes.indexOf(String(traste)))
    }
  }
  const conHueco = ventanaAcorde(acordeConNotas([8, 9, 10, 11], [[0, 8], [1, 10]]))
  assert.equal(conHueco.indicesPorCuerda[0][2], null)
  assert.equal(conHueco.indicesPorCuerda[1][3], 2)
})

test('un span de cuatro ocupa las cuatro columnas; traste 1 fija el inicio', () => {
  assert.deepEqual(ventanaAcorde(acordeConNotas([8, 9, 10, 11], [[0, 8], [1, 11]])).trastes, ['8', '9', '10', '11'])
  assert.deepEqual(ventanaAcorde(acordeConNotas([1, 2, 3, 4], [[0, 1], [1, 2]])).trastes, ['1', '2', '3', '4'])
  // Tener una columna numerada 1 sin notas no fija la ventana: cuenta el rango ocupado.
  assert.deepEqual(ventanaAcorde(acordeConNotas([1, 2, 3, 4], [[0, 3], [1, 4]])).trastes, ['2', '3', '4', '5'])
})

test('las cinco columnas se conservan sólo cuando el span real las necesita', () => {
  assert.deepEqual(ventanaAcorde(acordeConNotas([8, 9, 10, 11, 12], [[0, 8], [1, 12]])).trastes, ['8', '9', '10', '11', '12'])
  assert.deepEqual(ventanaAcorde(acordeConNotas([8, 9, 10, 11, 12], [[0, 9], [1, 10]])).trastes, ['8', '9', '10', '11'])
})

test('la vista de acordes generados conserva todas las notas, índices y distancias sin mutar los datos', () => {
  for (const nombre of ['E', 'F', 'Bm', 'Cm', 'D/F#', 'A7', 'Cmaj7']) {
    for (const zona of ['ABIERTA', 'MEDIA', 'AGUDA', 'TODAS']) {
      for (const propuesta of generarPosiciones(nombre, { zona, cuerdas: '1–2–3' })) {
        const acorde = propuestaAEditable(interpretarAcorde(nombre), propuesta)
        const copia = JSON.stringify(acorde)
        const vista = ventanaAcorde(acorde)
        const notas = []
        acorde.posiciones.forEach((fila, cuerda) => fila.forEach((estado, i) => {
          if (estado !== 'presionada') return
          notas.push(Number(acorde.trastes[i]))
          const columna = vista.indicesPorCuerda[cuerda].indexOf(i)
          assert.notEqual(columna, -1, `${nombre} ${zona}`)
          assert.equal(vista.trastes[columna], acorde.trastes[i])
        }))
        const span = notas.length ? Math.max(...notas) - Math.min(...notas) + 1 : 0
        assert.equal(vista.trastes.length, Math.max(4, span))
        assert.equal(JSON.stringify(acorde), copia)
        if (notas.includes(1)) assert.equal(vista.trastes[0], '1')
      }
    }
  }
})

test('cuerdas al aire, muteadas y referencias siguen perteneciendo al acorde original', () => {
  const acorde = acordeConNotas([8, 9, 10, 11], [[0, 8], [1, 10]])
  acorde.posiciones[2][2] = 'aire'
  acorde.posiciones[3][3] = 'muteada'
  acorde.tonica = { cuerda: 0, traste: 0 }
  acorde.opcional = { cuerda: 1, traste: 2 }
  const copia = JSON.stringify(acorde)
  const vista = ventanaAcorde(acorde)
  assert.deepEqual(vista.indicesPorCuerda[0], [null, 0, null, null])
  assert.deepEqual(vista.indicesPorCuerda[1], [null, null, null, 2])
  assert.equal(JSON.stringify(acorde), copia)
})

test('los dibujos manuales sin numeración o con números libres no pierden notas', () => {
  for (const trastes of [['', '', '', ''], ['2', '', '9', '12']]) {
    const acorde = { trastes, posiciones: Array.from({ length: 6 }, () => ['presionada', 'vacio', 'presionada', 'vacio']) }
    const vista = ventanaAcorde(acorde)
    assert.deepEqual(vista.trastes, trastes)
    assert.deepEqual(vista.indicesPorCuerda[0], [0, 1, 2, 3])
  }
})
