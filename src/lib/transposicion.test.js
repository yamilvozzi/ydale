import test from 'node:test'
import assert from 'node:assert/strict'
import { transponerDiagrama, transponerNombreAcorde, transponerNota } from './transposicion.js'
import { transponerPizarra, pizarraVacia, ponerElemento, guardarPizarra, leerPizarra } from './pizarra.js'
import { generarPosiciones, interpretarAcorde, propuestaAEditable } from './generadorAcordes.js'
import { AFINACION, NOTAS, TIPOS_ESCALA, obtenerNotasEscala, normalizarEscala } from './escalas.js'
import { claseDeNota } from './circuloQuintas.js'
import { FORMULAS_ACORDES } from './formulasAcordes.js'
import { normalizarAcorde } from './notasConAcordes.js'

function notasDiagrama(acorde) {
  return acorde.posiciones.flatMap((fila, cuerda) => fila.flatMap((estado, columna) =>
    ['presionada', 'aire'].includes(estado) ? [{ cuerda, clase: (claseDeNota(AFINACION[cuerda]) + (estado === 'aire' ? 0 : Number(acorde.trastes[columna]))) % 12 }] : []))
}

test('el ejemplo Em, C, D se transporta en conjunto y conserva IDs, orden y persistencia', () => {
  let pizarra = ponerElemento(pizarraVacia(), 'escala', { id: 'escala', tonica: 'E', tipo: 'menor', orden: 3 })
  for (const nombre of ['Em', 'C', 'D']) {
    const acorde = interpretarAcorde(nombre)
    pizarra = ponerElemento(pizarra, 'acorde', propuestaAEditable(acorde, generarPosiciones(acorde, { completo: true })[0]))
  }
  const original = structuredClone(pizarra)
  const subida = transponerPizarra(pizarra, 1)
  assert.deepEqual(pizarra, original)
  assert.equal(subida.elementos[0].datos.tonica, 'F')
  assert.equal(subida.elementos[0].datos.tipo, 'menor')
  assert.equal(subida.elementos[0].datos.orden, 3)
  assert.deepEqual(subida.elementos.slice(1).map(e => e.datos.nombre), ['Fm', 'Db', 'Eb'])
  assert.deepEqual(subida.elementos.map(e => e.datos.id), pizarra.elementos.map(e => e.datos.id))
  const otra = transponerPizarra(subida, 1)
  assert.deepEqual(otra.elementos.slice(1).map(e => e.datos.nombre), ['F#m', 'D', 'E'])
  let guardado
  const storage = { setItem: (_clave, valor) => { guardado = valor }, getItem: () => guardado }
  guardarPizarra(storage, subida)
  assert.deepEqual(leerPizarra(storage), subida)
})

test('conserva las calidades del motor en todas las raíces y transporta bajos de inversión', () => {
  for (const raiz of NOTAS) for (const calidad of Object.keys(FORMULAS_ACORDES)) for (const delta of [-1, 1]) {
    const nombre = transponerNombreAcorde(`${raiz}${calidad}/Bb`, delta)
    const acorde = interpretarAcorde(nombre)
    assert.equal(acorde.calidad, calidad)
    assert.equal(acorde.raiz.clase, (claseDeNota(raiz) + delta + 12) % 12)
    assert.equal(acorde.bajo.clase, (10 + delta + 12) % 12)
  }
  assert.equal(transponerNombreAcorde('Csus', 1), 'Dbsus')
  assert.equal(transponerNombreAcorde('C°', 1), 'Db°')
  assert.equal(transponerNombreAcorde('C♯maj7/G♯', 1), 'Dmaj7/A')
  assert.equal(transponerNombreAcorde('Dibujo propio', 1), 'Dibujo propio')
  assert.equal(transponerNota('B', 1), 'C')
  assert.equal(transponerNota('C', -1), 'B')
})

test('las escalas con bemoles mantienen tipo, modo, grafía y notas al recargar', () => {
  for (const { valor: tipo } of TIPOS_ESCALA) {
    const escala = normalizarEscala({ id: 'e', tonica: 'Db', tipo })
    assert.equal(escala.tonica, 'Db')
    const originales = obtenerNotasEscala('C', tipo).map(claseDeNota)
    const nuevas = obtenerNotasEscala('Db', tipo).map(claseDeNota)
    assert.deepEqual(nuevas, originales.map(clase => (clase + 1) % 12))
  }
  assert.deepEqual(obtenerNotasEscala('Db', 'mayor'), ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'])
})

test('diagramas abiertos y generados conservan voces, cuerdas, bajo y nota opcional en transposiciones repetidas', () => {
  for (const nombre of ['Em', 'C', 'D', 'E9/F#', 'Am7b5', 'Cdim7', 'Fmaj7']) {
    for (const opciones of [{ completo: true }, { bajo: true, zona: 'MEDIA' }, { cantidadCuerdas: 4, zona: 'AGUDA' }]) {
      const acorde = interpretarAcorde(nombre)
      for (const propuesta of generarPosiciones(acorde, opciones)) {
        let datos = propuestaAEditable(acorde, propuesta)
        for (let i = 0; i < 25; i++) {
          const delta = i < 13 ? -1 : 1
          const nuevas = transponerDiagrama(datos, delta)
          assert.equal(nuevas.id, datos.id)
          assert.deepEqual(notasDiagrama(nuevas), notasDiagrama(datos).map(nota => ({ ...nota, clase: (nota.clase + delta + 12) % 12 })))
          for (const campo of ['tonica', 'bajo', 'opcional']) {
            assert.equal(Boolean(nuevas[campo]), Boolean(datos[campo]))
            if (datos[campo]) assert.equal(nuevas[campo].cuerda, datos[campo].cuerda)
          }
          assert.deepEqual(nuevas.posiciones.map(f => f.includes('muteada')), datos.posiciones.map(f => f.includes('muteada')))
          assert.deepEqual(normalizarAcorde(nuevas), nuevas)
          datos = nuevas
        }
      }
    }
  }
})

test('los dibujos dispersos no pierden una cuerda al aire al necesitar seis columnas', () => {
  const acorde = normalizarAcorde({ id: 'libre', nombre: 'C', trastes: ['2', '4', '6', '8', '10'],
    posiciones: Array.from({ length: 6 }, (_, cuerda) => Array.from({ length: 5 }, (_, columna) => cuerda === 5 && columna === 0 ? 'aire' : cuerda === columna ? 'presionada' : 'vacio')),
    tonica: { cuerda: 5, traste: 0 } })
  const nuevo = transponerDiagrama(acorde, 1)
  assert.equal(nuevo.trastes.length, 6)
  assert.deepEqual(notasDiagrama(nuevo), notasDiagrama(acorde).map(nota => ({ ...nota, clase: (nota.clase + 1) % 12 })))
  assert.deepEqual(normalizarAcorde(nuevo), nuevo)
})

test('un traste sin definir impide modificar parcialmente la pizarra', () => {
  let pizarra = ponerElemento(pizarraVacia(), 'escala', { tonica: 'C', tipo: 'mayor' })
  pizarra = ponerElemento(pizarra, 'acorde', { nombre: 'Am', posiciones: [['presionada']] })
  const original = structuredClone(pizarra)
  assert.throws(() => transponerPizarra(pizarra, 1), /Definí los números/)
  assert.deepEqual(pizarra, original)
  assert.throws(() => transponerPizarra(pizarra, 1.5))
  assert.deepEqual(transponerPizarra(pizarraVacia(), -1), pizarraVacia())
})

test('las columnas adicionales de dibujos libres se mantienen al editar y volver a transponer', () => {
  const ordenar = notas => notas.sort((a, b) => a.cuerda - b.cuerda || a.clase - b.clase)
  const acorde = normalizarAcorde({ id: 'extendido', nombre: 'Dibujo propio', trastes: ['2', '4', '6', '8', '10', '12'],
    posiciones: Array.from({ length: 6 }, (_, cuerda) => Array.from({ length: 6 }, (_, columna) => cuerda === columna ? 'presionada' : cuerda === 0 && columna === 1 ? 'aire' : 'vacio')) })
  const nuevo = transponerDiagrama(acorde, 1)
  assert.equal(nuevo.trastes.length, 7)
  assert.deepEqual(normalizarAcorde(nuevo), nuevo)
  assert.deepEqual(ordenar(notasDiagrama(nuevo)), ordenar(notasDiagrama(acorde).map(nota => ({ ...nota, clase: (nota.clase + 1) % 12 }))))
  const siguiente = transponerDiagrama(nuevo, 1)
  assert.deepEqual(ordenar(notasDiagrama(siguiente)), ordenar(notasDiagrama(nuevo).map(nota => ({ ...nota, clase: (nota.clase + 1) % 12 }))))
})
