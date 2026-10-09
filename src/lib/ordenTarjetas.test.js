import test from 'node:test'
import assert from 'node:assert/strict'
import { guardarOrdenEscalas, reordenarGrupo } from './ordenTarjetas.js'
import { guardarPizarra, leerPizarra, pizarraVacia, ponerElemento } from './pizarra.js'
import { crearAcorde, guardarNotas, leerNotas } from './notasConAcordes.js'

test('reordenar cada grupo persiste al reabrir sin cambiar diagramas ni el otro grupo', () => {
  let pizarra = pizarraVacia()
  for (let i = 0; i < 3; i++) {
    pizarra = ponerElemento(pizarra, 'acorde', { ...crearAcorde(), nombre: `Acorde ${i}` })
    pizarra = ponerElemento(pizarra, 'escala', { id: `escala-${i}`, tonica: 'D', tipo: 'dorico' })
  }
  const original = structuredClone(pizarra)
  for (const tipo of ['acorde', 'escala']) {
    const datos = pizarra.elementos.filter((e) => e.tipo === tipo).map((e) => e.datos).reverse()
    const elementos = reordenarGrupo(pizarra.elementos, tipo, datos)
    let guardado
    const storage = { setItem: (_, valor) => { guardado = valor }, getItem: () => guardado }
    guardarPizarra(storage, { ...pizarra, elementos })
    const recargada = leerPizarra(storage)
    assert.deepEqual(recargada.elementos.filter((e) => e.tipo === tipo).map((e) => e.datos), datos)
    assert.deepEqual(recargada.elementos.filter((e) => e.tipo !== tipo), pizarra.elementos.filter((e) => e.tipo !== tipo))
  }
  assert.deepEqual(pizarra, original)
})

test('un orden incompleto, repetido o ajeno no descarta elementos de la pizarra', () => {
  const elementos = [{ tipo: 'acorde', datos: { id: 'a' } }, { tipo: 'acorde', datos: { id: 'b' } }]
  for (const ids of [['a'], ['a', 'a'], ['a', 'c']]) {
    assert.throws(() => reordenarGrupo(elementos, 'acorde', ids.map((id) => ({ id }))))
  }
})

test('el orden de acordes de repertorio sobrevive al JSON junto con notas y voces', () => {
  const acordes = [crearAcorde(), crearAcorde(), crearAcorde()]
  acordes[0].posiciones[2][1] = 'presionada'
  acordes[0].tonica = { cuerda: 2, traste: 1 }
  const reordenados = [acordes[2], acordes[0], acordes[1]]
  const recargadas = leerNotas(guardarNotas({ texto: 'Conservar notas', acordes: reordenados }))
  assert.equal(recargadas.texto, 'Conservar notas')
  assert.deepEqual(recargadas.acordes, reordenados)
})

test('escalas guarda todos los índices existentes en una sola operación y confirma IDs', async () => {
  const escalas = [{ id: 'b', tonica: 'D', tipo: 'dorico', orden: 9 }, { id: 'a', tonica: 'C', tipo: 'mayor', orden: 3 }]
  let llamadas = 0
  const cliente = { from: (tabla) => {
    assert.equal(tabla, 'escalas')
    return { upsert: (filas, opciones) => {
      llamadas++
      assert.deepEqual(opciones, { onConflict: 'id' })
      assert.deepEqual(filas, escalas.map((escala, orden) => ({ ...escala, tema_id: 'tema-1', orden })))
      return { select: async () => ({ data: [{ id: 'b' }, { id: 'a' }], error: null }) }
    } }
  } }
  assert.deepEqual(await guardarOrdenEscalas(cliente, 'tema-1', escalas), escalas.map((escala, orden) => ({ ...escala, orden })))
  assert.equal(llamadas, 1)
  assert.equal(escalas[0].orden, 9)
})

test('escalas no informa éxito ante fallo o respuesta incompleta del servidor', async () => {
  const escalas = [{ id: 'a', tonica: 'C', tipo: 'mayor', orden: 0 }]
  for (const respuesta of [{ error: new Error('Sin conexión') }, { data: [] }, { data: [{ id: 'otro' }] }]) {
    const cliente = { from: () => ({ upsert: () => ({ select: async () => respuesta }) }) }
    await assert.rejects(guardarOrdenEscalas(cliente, 'tema-1', escalas))
  }
})
