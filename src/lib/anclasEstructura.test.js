import test from 'node:test'
import assert from 'node:assert/strict'
import { actualizarLetraConAnclas, asignarAcorde, caracteresConPosicion, distribuirCarriles, normalizarLetraConAnclas, versosConPosicion } from './anclasEstructura.js'
import { crearBloque, guardarEstructura, leerEstructura } from './estructura.js'

const acordes = [{ id: 'em', nombre: 'Em' }, { id: 'c', nombre: 'C' }, { id: 'b7', nombre: 'B7' }]
const ancla = (posicion, acordeId = 'em', id = `ancla-${posicion}`) => ({ id, acordeId, posicion })

test('asigna dentro de una palabra sin tocar la letra y sólo permite IDs de ACORDES del mismo tema', () => {
  const bloque = crearBloque('Hoy puede ser un gran día')
  const original = structuredClone(bloque)
  const primero = asignarAcorde(bloque, 6, 'em', acordes)
  const segundo = asignarAcorde(primero, 18, 'c', acordes)
  assert.equal(segundo.letra, bloque.letra)
  assert.deepEqual(bloque, original)
  assert.deepEqual(segundo.anclas.map(({ acordeId, posicion }) => ({ acordeId, posicion })), [{ acordeId: 'em', posicion: 6 }, { acordeId: 'c', posicion: 18 }])
  assert.throws(() => asignarAcorde(bloque, 0, 'otro-tema', acordes), /no pertenece/)
  for (const posicion of [-1, 1.5, 100]) assert.throws(() => asignarAcorde(bloque, posicion, 'em', acordes), /Posición/)
  assert.throws(() => asignarAcorde(bloque, 0, 'em', []), /no pertenece/)
})

test('cambiar el acorde conserva el anclaje y nunca duplica posiciones ni definiciones musicales', () => {
  const primero = asignarAcorde(crearBloque('Letra'), 2, 'em', acordes)
  const cambiado = asignarAcorde(primero, 2, 'b7', acordes)
  assert.deepEqual(cambiado.anclas, [{ id: primero.anclas[0].id, acordeId: 'b7', posicion: 2 }])
  assert.deepEqual(Object.keys(cambiado.anclas[0]), ['id', 'acordeId', 'posicion'])
  assert.equal(primero.anclas[0].acordeId, 'em')
})

test('insertar o borrar antes de un anclaje lo mueve junto con su carácter, incluso entre versos', () => {
  const bloque = { ...crearBloque('Hoy puede\nser un día'), anclas: [ancla(0), ancla(6, 'c'), ancla(10, 'b7')] }
  const insertado = actualizarLetraConAnclas(bloque, 'Antes Hoy puede\nser un día')
  assert.deepEqual(insertado.anclas.map(a => a.posicion), [6, 12, 16])
  assert.deepEqual(actualizarLetraConAnclas(insertado, bloque.letra).anclas, bloque.anclas)
  const salto = actualizarLetraConAnclas(bloque, 'Hoy\n puede\nser un día')
  assert.deepEqual(salto.anclas.map(a => a.posicion), [0, 7, 11])
  assert.equal(bloque.letra, 'Hoy puede\nser un día')
})

test('reemplazar o eliminar un carácter retira sólo su acorde; el resto permanece anclado', () => {
  const bloque = { ...crearBloque('abcd'), anclas: [ancla(0), ancla(1, 'c'), ancla(3, 'b7'), ancla(4)] }
  const editado = actualizarLetraConAnclas(bloque, 'aXd')
  assert.deepEqual(editado.anclas, [ancla(0), ancla(2, 'b7', 'ancla-3'), ancla(3, 'em', 'ancla-4')])
  const vacio = actualizarLetraConAnclas(bloque, '')
  assert.deepEqual(vacio.anclas, [ancla(0, 'em', 'ancla-4')]) // El anclaje explícito al final no pertenece a un carácter borrado.
})

test('la selección real desambigua ediciones de letras repetidas con teclado y beforeinput táctil', () => {
  const bloque = { ...crearBloque('aaaa'), anclas: [ancla(0), ancla(1), ancla(2), ancla(3)] }
  const seleccion = { texto: bloque.letra, inicio: 1, fin: 1 }
  assert.deepEqual(actualizarLetraConAnclas(bloque, 'aaaaa', seleccion, 'insertText').anclas.map(a => a.posicion), [0, 2, 3, 4])
  assert.deepEqual(actualizarLetraConAnclas(bloque, 'aaa', seleccion, 'deleteContentForward').anclas.map(a => a.id), ['ancla-0', 'ancla-2', 'ancla-3'])
  assert.deepEqual(actualizarLetraConAnclas(bloque, 'aaa', seleccion, 'deleteContentBackward').anclas.map(a => a.id), ['ancla-1', 'ancla-2', 'ancla-3'])
  assert.deepEqual(actualizarLetraConAnclas(bloque, 'aXa', { texto: bloque.letra, inicio: 1, fin: 3 }, 'insertFromPaste').anclas.map(a => a.posicion), [0, 2])
})

test('los offsets reales respetan tildes combinadas y emoji sin anclar en medio de un grafema', () => {
  const letra = 'a\u0301🎸día'
  assert.deepEqual(caracteresConPosicion(letra), [{ caracter: 'a\u0301', posicion: 0 }, { caracter: '🎸', posicion: 2 }, { caracter: 'd', posicion: 4 }, { caracter: 'í', posicion: 5 }, { caracter: 'a', posicion: 6 }])
  assert.throws(() => asignarAcorde(crearBloque(letra), 1, 'em', acordes), /Posición/)
  assert.throws(() => asignarAcorde(crearBloque(letra), 3, 'em', acordes), /Posición/)
  const bloque = asignarAcorde(crearBloque(letra), 4, 'em', acordes)
  const editado = actualizarLetraConAnclas(bloque, `🎶${letra}`)
  assert.equal(editado.anclas[0].posicion, 6)
  assert.equal(editado.letra.slice(editado.anclas[0].posicion, editado.anclas[0].posicion + 1), 'd')
})

test('la normalización de espacios exteriores y CRLF ajusta offsets y descarta anclas corruptas', () => {
  const normal = normalizarLetraConAnclas('  Uno\r\nDos  ', [ancla(0), ancla(2), ancla(7, 'c'), ancla(11), ancla(12, 'b7'), { posicion: 3, acordeId: null }, { posicion: -1, acordeId: 'em' }])
  assert.equal(normal.letra, 'Uno\nDos')
  assert.deepEqual(normal.anclas.map(a => [a.acordeId, a.posicion]), [['em', 0], ['c', 4], ['b7', 7]])
  assert.deepEqual(normalizarLetraConAnclas('Letra', null), { letra: 'Letra', anclas: [] })
  const duplicadas = normalizarLetraConAnclas('Letra', [ancla(0, 'em', 'igual'), ancla(1, 'c', 'igual'), ancla(0, 'b7', 'ultimo')])
  assert.equal(new Set(duplicadas.anclas.map(a => a.id)).size, 3)
  assert.deepEqual(duplicadas.anclas.filter(a => a.posicion === 0).map(a => a.acordeId), ['em', 'b7'])
})

test('guardar y recargar conserva IDs y posiciones sin copiar nombres ni datos de ACORDES', () => {
  let bloque = asignarAcorde(crearBloque('Hoy puede ser un gran día\nSegunda línea'), 6, 'em', acordes)
  bloque = asignarAcorde(bloque, bloque.letra.indexOf('línea'), 'b7', acordes)
  const estructura = { version: 1, bloques: [bloque] }
  assert.deepEqual(leerEstructura(guardarEstructura(estructura)), estructura)
  const guardado = guardarEstructura(estructura)
  assert.ok(!guardado.includes('nombre":"Em'))
  assert.ok(!guardado.includes('nombre":"B7'))
  // Las referencias faltantes se conservan para poder cambiarlas o quitarlas desde el editor.
  const sinFuente = { ...estructura, bloques: [{ ...bloque, anclas: [ancla(0, 'acorde-eliminado')] }] }
  assert.deepEqual(leerEstructura(guardarEstructura(sinFuente)), sinFuente)
})

test('versos y finales mantienen los índices del texto, sin rellenos para alinear acordes', () => {
  assert.deepEqual(versosConPosicion('Hoy\n\nDía'), [{ texto: 'Hoy', inicio: 0, fin: 3 }, { texto: '', inicio: 4, fin: 4 }, { texto: 'Día', inicio: 5, fin: 8 }])
  const bloque = asignarAcorde(crearBloque('Día'), 3, 'c', acordes)
  assert.equal(bloque.letra, 'Día')
  assert.equal(bloque.anclas[0].posicion, 3)
})

test('los rótulos que se superponen ocupan carriles verticales sin desplazar sus anclas', () => {
  const intervalos = [{ id: 'tercero', izquierda: 35, derecha: 55 }, { id: 'primero', izquierda: 0, derecha: 20 }, { id: 'segundo', izquierda: 8, derecha: 28 }]
  const original = structuredClone(intervalos)
  assert.deepEqual(distribuirCarriles(intervalos), { carriles: { primero: 0, segundo: 1, tercero: 0 }, cantidad: 2 })
  assert.deepEqual(intervalos, original)
  assert.deepEqual(distribuirCarriles([]), { carriles: {}, cantidad: 1 })
})
