import test from 'node:test'
import assert from 'node:assert/strict'
import { asignarAcorde } from './anclasEstructura.js'
import { crearBloque, guardarEstructura, leerEstructura } from './estructura.js'
import { copiarAcordesDesde, duplicarBloque, moverAcordeEnLinea, posicionHorizontal } from './herramientasEstructura.js'

const fuentes = ['Em', 'C', 'G', 'D', 'B7'].map(nombre => ({ id: nombre, nombre }))
const ancla = (posicion, acordeId = 'Em') => ({ id: globalThis.crypto.randomUUID(), acordeId, posicion })
const secuencia = bloque => bloque.anclas.map(a => a.acordeId)

test('duplicar conserva todos los campos y posiciones con IDs propios y objetos independientes', () => {
  const origen = { ...crearBloque('Un verso\nOtro verso'), tipo: 'estribillo', nombre: 'ESTRIBILLO 1', repeticiones: 4, nota: 'Entra batería', anclas: [ancla(2), ancla(10, 'B7')] }
  const original = structuredClone(origen)
  const copia = duplicarBloque(origen)
  const otra = duplicarBloque(origen)
  assert.notEqual(copia.id, origen.id)
  assert.notEqual(copia.id, otra.id)
  assert.deepEqual({ ...copia, id: origen.id, anclas: copia.anclas.map((a, i) => ({ ...a, id: origen.anclas[i].id })) }, origen)
  assert.equal(new Set([...origen.anclas, ...copia.anclas, ...otra.anclas].map(a => a.id)).size, 6)
  copia.anclas[0].posicion = 0
  copia.letra = 'Cambió sólo la copia'
  assert.deepEqual(origen, original)
  assert.ok(!Object.hasOwn(duplicarBloque(crearBloque()), 'anclas'))
})

test('copiar reemplaza sólo acordes y conserva posiciones exactas si la letra coincide', () => {
  const origen = { ...crearBloque('Primera línea\nSegunda línea'), anclas: [ancla(0), ancla(8, 'C'), ancla(18, 'B7')] }
  const destino = { ...crearBloque(origen.letra), tipo: 'puente', nombre: 'Otro nombre', repeticiones: 3, nota: 'Nota propia', anclas: [ancla(2, 'D')] }
  const original = structuredClone({ origen, destino })
  const copia = copiarAcordesDesde(destino, origen)
  assert.deepEqual({ ...copia, anclas: destino.anclas }, destino)
  assert.deepEqual(copia.anclas.map(a => a.posicion), origen.anclas.map(a => a.posicion))
  assert.deepEqual(secuencia(copia), secuencia(origen))
  assert.ok(copia.anclas.every((a, i) => a.id !== origen.anclas[i].id))
  assert.deepEqual({ origen, destino }, original)
})

test('letras distintas usan el número de línea y la proporción de grafemas sin buscar palabras', () => {
  const origen = { ...crearBloque('abcdefghij\nabcdefghij'), anclas: [ancla(0), ancla(5, 'C'), ancla(10, 'G'), ancla(16, 'B7')] }
  const copia = copiarAcordesDesde(crearBloque('xxxx\nYYYYYYYY'), origen)
  assert.deepEqual(copia.anclas.map(a => a.posicion), [0, 2, 4, 9])
  assert.deepEqual(secuencia(copia), ['Em', 'C', 'G', 'B7'])
  assert.equal(copia.letra, 'xxxx\nYYYYYYYY')
})

test('menos líneas, líneas vacías y texto corto conservan toda la secuencia, incluso con posiciones compartidas', () => {
  const origen = { ...crearBloque('abcdefghijkl\nabcdefghijkl\nabcdefghijkl'), anclas: [ancla(0), ancla(8, 'C'), ancla(13, 'G'), ancla(21, 'D'), ancla(26, 'B7')] }
  for (const letra of ['', 'x', 'Uno\n', 'Dos\nx']) {
    const copia = copiarAcordesDesde(crearBloque(letra), origen)
    assert.deepEqual(secuencia(copia), secuencia(origen))
    assert.equal(copia.anclas.length, origen.anclas.length)
    assert.ok(copia.anclas.every(a => a.posicion >= 0 && a.posicion <= letra.length))
    const recargada = leerEstructura(guardarEstructura({ version: 1, bloques: [copia] }))
    assert.deepEqual(secuencia(recargada.bloques[0]), secuencia(origen))
  }
  const masLineas = copiarAcordesDesde(crearBloque('aa\nbb\ncc\ndd'), { ...crearBloque('aa'), anclas: [ancla(1)] })
  assert.equal(masLineas.anclas[0].posicion, 1)
})

test('copiar y mover respetan los límites Unicode y nunca modifican ACORDES', () => {
  const origen = { ...crearBloque('abcdef'), anclas: [ancla(2), ancla(4, 'C')] }
  const copia = copiarAcordesDesde(crearBloque('a\u0301🎸día'), origen)
  assert.deepEqual(copia.anclas.map(a => a.posicion), [4, 5])
  assert.equal(moverAcordeEnLinea(copia, copia.anclas[0].id, 3), copia)
  assert.equal(moverAcordeEnLinea(copia, copia.anclas[0].id, 1), copia)
  const movida = moverAcordeEnLinea(copia, copia.anclas[0].id, 2)
  assert.equal(movida.anclas[0].acordeId, 'Em')
  assert.deepEqual(fuentes.map(f => f.nombre), ['Em', 'C', 'G', 'D', 'B7'])
})

test('mover se restringe al mismo verso y conserva ID, texto, orden y acordes en posiciones ocupadas', () => {
  const bloque = { ...crearBloque('Primera\nSegunda'), anclas: [ancla(1), ancla(5, 'C'), ancla(10, 'B7')] }
  const original = structuredClone(bloque)
  const movida = moverAcordeEnLinea(bloque, bloque.anclas[0].id, 5)
  assert.equal(movida.anclas.length, 3)
  assert.equal(movida.anclas[0].id, bloque.anclas[0].id)
  assert.deepEqual(movida.anclas.map(a => a.posicion), [5, 5, 10])
  assert.equal(movida.letra, bloque.letra)
  assert.equal(moverAcordeEnLinea(bloque, bloque.anclas[0].id, 8), bloque)
  for (const posicion of [-1, 1.5, 100]) assert.equal(moverAcordeEnLinea(bloque, bloque.anclas[0].id, posicion), bloque)
  assert.equal(moverAcordeEnLinea(bloque, 'no-existe', 2), bloque)
  assert.deepEqual(bloque, original)
  assert.deepEqual(leerEstructura(guardarEstructura({ version: 1, bloques: [movida] })).bloques[0], movida)
})

test('cambiar o eliminar un acorde compartiendo posición no modifica el otro', () => {
  const bloque = { ...crearBloque('Una línea'), anclas: [ancla(2), ancla(2, 'B7')] }
  const cambiada = asignarAcorde(bloque, 2, 'G', fuentes, bloque.anclas[1].id)
  assert.deepEqual(secuencia(cambiada), ['Em', 'G'])
  assert.deepEqual(cambiada.anclas.map(a => a.id), bloque.anclas.map(a => a.id))
  const eliminada = { ...cambiada, anclas: cambiada.anclas.filter(a => a.id !== cambiada.anclas[0].id) }
  assert.deepEqual(secuencia(eliminada), ['G'])
})

test('el destino horizontal se ajusta al carácter más cercano y se limita a los extremos de la línea', () => {
  const candidatos = [{ posicion: 10, x: 100 }, { posicion: 11, x: 108 }, { posicion: 13, x: 128 }]
  assert.deepEqual(posicionHorizontal(candidatos, -1000), candidatos[0])
  assert.deepEqual(posicionHorizontal(candidatos, 1000), candidatos[2])
  assert.deepEqual(posicionHorizontal(candidatos, 110), candidatos[1])
  assert.equal(posicionHorizontal([], 20), null)
})
