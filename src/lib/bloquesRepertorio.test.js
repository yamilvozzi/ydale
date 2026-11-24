import test from 'node:test'
import assert from 'node:assert/strict'
import { configurarBloque, seccionesBloque } from './bloquesPizarra.js'
import { acordesSueltos, colocarAcordeRepertorio, duplicarBloqueRepertorio, guardarBloqueRepertorio, moverAcordeRepertorio, moverBloqueRepertorio, ubicacionAcorde, vaciarBloqueRepertorio } from './bloquesRepertorio.js'
import { crearAcorde, guardarNotas, leerNotas } from './notasConAcordes.js'
import { contenidoTemaPDF, imprimirTema } from './impresionPDF.js'

function cancion() {
  const acordes = ['Em', 'C', 'G', 'D', 'Em/G'].map((nombre, i) => ({ ...crearAcorde(), id: `acorde-${i}`, nombre }))
  acordes[0].trastes = ['2', '3', '4', '5']
  acordes[0].posiciones[0][1] = 'presionada'
  acordes[0].posiciones[1][0] = 'aire'
  acordes[0].posiciones[2][0] = 'muteada'
  acordes[0].tonica = { cuerda: 0, traste: 1 }
  acordes[0].opcional = { cuerda: 1, traste: 0 }
  acordes[0].bajo = { cuerda: 0, traste: 1 }
  let notas = { texto: 'Entrada libre', acordes }
  for (const [id, cantidad] of [['verso', 0], ['estribillo', 4]]) notas = guardarBloqueRepertorio(notas, {
    ...configurarBloque(null, { titulo: id, cantidad, repeticiones: 2 }), id,
  })
  return notas
}
const ids = lista => lista.map(a => a.id)
const poner = (notas, id, bloqueId, compas = 0, referencia, despues) => moverAcordeRepertorio(notas, id, { bloqueId, compas, referencia, despues })

test('canciones históricas conservan texto, acordes y orden, sin crear bloques', () => {
  assert.deepEqual(leerNotas('Nota histórica'), { version: 1, texto: 'Nota histórica', acordes: [] })
  const { acordes, texto } = cancion()
  const guardada = guardarNotas({ acordes, texto })
  const notas = leerNotas(guardada)
  assert.equal(Object.hasOwn(notas, 'bloquesAcordes'), false)
  assert.deepEqual(acordesSueltos(notas), acordes)
  assert.equal(guardarNotas(notas), guardada)
})

test('mover entre libre, compases y sector suelto mantiene una sola entidad intacta', () => {
  const original = cancion(), copia = structuredClone(original)
  let notas = poner(original, 'acorde-0', 'verso')
  assert.deepEqual(ids(acordesSueltos(notas)), ['acorde-1', 'acorde-2', 'acorde-3', 'acorde-4'])
  notas = poner(notas, 'acorde-0', 'estribillo', 2)
  notas = poner(notas, 'acorde-1', 'estribillo', 2)
  notas = poner(notas, 'acorde-0', 'estribillo', 3)
  assert.deepEqual(ids(notas.bloquesAcordes[0].acordes), [])
  assert.deepEqual(ids(notas.bloquesAcordes[1].compases[2]), ['acorde-1'])
  assert.deepEqual(ubicacionAcorde(notas, 'acorde-0'), { bloqueId: 'estribillo', compas: 3 })
  notas = poner(notas, 'acorde-0', undefined)
  assert.equal(acordesSueltos(notas).at(-1).id, 'acorde-0')
  for (const acorde of notas.acordes) assert.deepEqual(acorde, original.acordes.find(a => a.id === acorde.id))
  assert.equal(notas.acordes.length, original.acordes.length)
  assert.deepEqual(original, copia)
})

test('un acorde suelto se reutiliza en varios compases y cada copia se puede mover', () => {
  const original = cancion()
  const acorde = original.acordes[0]
  const destino = { bloqueId: 'estribillo', compas: 0 }
  const primera = colocarAcordeRepertorio(original, acorde.id, destino)
  const copia = primera.acordes.at(-1)
  const segunda = colocarAcordeRepertorio(primera, acorde.id, { ...destino, compas: 1 })
  const movida = colocarAcordeRepertorio(segunda, copia.id, { ...destino, compas: 1, referencia: segunda.acordes.at(-1).id })
  const guardada = leerNotas(guardarNotas(movida))

  assert.notEqual(copia.id, acorde.id)
  assert.deepEqual({ ...copia, id: acorde.id }, acorde)
  assert.deepEqual(acordesSueltos(guardada), original.acordes)
  assert.deepEqual(ids(guardada.bloquesAcordes[1].compases[1]), [copia.id, segunda.acordes.at(-1).id])
  assert.deepEqual(guardada.bloquesAcordes[1].compases[0], [])
  assert.equal(guardada.acordes.length, original.acordes.length + 2)
  assert.equal(colocarAcordeRepertorio(original, acorde.id, { ...destino, compas: 99 }), original)
})

test('reordenar dentro de bloque o compás usa referencias y no duplica tarjetas', () => {
  let notas = cancion()
  for (const id of ['acorde-0', 'acorde-1', 'acorde-2']) notas = poner(notas, id, 'verso')
  notas = poner(notas, 'acorde-2', 'verso', 0, 'acorde-0')
  assert.deepEqual(ids(notas.bloquesAcordes[0].acordes), ['acorde-2', 'acorde-0', 'acorde-1'])
  notas = poner(notas, 'acorde-2', 'verso', 0, 'acorde-1', true)
  assert.deepEqual(ids(notas.bloquesAcordes[0].acordes), ['acorde-0', 'acorde-1', 'acorde-2'])
  assert.equal(poner(notas, 'acorde-0', 'inexistente'), notas)
  assert.equal(poner(notas, 'acorde-0', 'estribillo', 12), notas)
  assert.equal(poner(notas, 'acorde-0', 'verso', 0, 'acorde-0'), notas)
})

test('reordenar acordes sueltos conserva la organización y los datos de los agrupados', () => {
  let notas = poner(cancion(), 'acorde-1', 'verso')
  notas = poner(notas, 'acorde-3', undefined, 0, 'acorde-0')
  assert.deepEqual(ids(acordesSueltos(notas)), ['acorde-3', 'acorde-0', 'acorde-2', 'acorde-4'])
  assert.deepEqual(ids(notas.bloquesAcordes[0].acordes), ['acorde-1'])
})

test('cambiar cantidad, libre y repeticiones conserva todos los IDs en orden', () => {
  let notas = cancion()
  for (let i = 0; i < 5; i++) notas = poner(notas, `acorde-${i}`, 'estribillo', Math.min(i, 3))
  let bloque = configurarBloque(notas.bloquesAcordes[1], { titulo: ' Versión 2 ', cantidad: 2, repeticiones: 3 })
  assert.deepEqual(bloque.compases.map(ids), [['acorde-0'], ['acorde-1', 'acorde-2', 'acorde-3', 'acorde-4']])
  bloque = configurarBloque(bloque, { titulo: 'Versión 2', cantidad: 0, repeticiones: 4 })
  notas = guardarBloqueRepertorio(notas, bloque)
  assert.equal(bloque.titulo, 'Versión 2')
  assert.equal(bloque.repeticiones, 4)
  assert.deepEqual(ids(bloque.acordes), ids(notas.acordes))
  assert.equal(acordesSueltos(notas).length, 0)
})

test('columnas manuales, orden, agrupación y todas las digitaciones sobreviven al guardado', () => {
  let notas = poner(cancion(), 'acorde-0', 'estribillo', 2)
  notas = moverBloqueRepertorio(notas, 'verso', { columna: 'derecha' })
  notas = moverBloqueRepertorio(notas, 'estribillo', { columna: 'derecha', referencia: 'verso', despues: true })
  assert.deepEqual(notas.bloquesAcordes.map(b => [b.id, b.columna]), [['verso', 'derecha'], ['estribillo', 'derecha']])
  const recargada = leerNotas(guardarNotas(notas))
  assert.deepEqual(recargada, { version: 1, ...notas })
  // Guardar las notas de texto no borra la organización.
  assert.deepEqual(leerNotas(guardarNotas({ ...recargada, texto: 'Otra nota' })).bloquesAcordes, notas.bloquesAcordes)
})

test('duplicar genera IDs independientes y copia profunda de digitaciones', () => {
  const original = poner(cancion(), 'acorde-0', 'verso')
  const notas = duplicarBloqueRepertorio(original, 'verso')
  const copia = notas.bloquesAcordes[1], acorde = notas.acordes.at(-1)
  assert.notEqual(copia.id, 'verso')
  assert.equal(copia.acordes[0].id, acorde.id)
  assert.notEqual(acorde.id, 'acorde-0')
  assert.deepEqual({ ...acorde, id: 'acorde-0' }, original.acordes[0])
  acorde.posiciones[0][1] = 'vacio'
  acorde.trastes[0] = '9'
  acorde.tonica.cuerda = 5
  assert.equal(original.acordes[0].posiciones[0][1], 'presionada')
  assert.equal(original.acordes[0].trastes[0], '2')
  assert.equal(original.acordes[0].tonica.cuerda, 0)
})

test('vaciar y eliminar bloques no elimina ningún acorde de la canción', () => {
  let notas = poner(cancion(), 'acorde-0', 'estribillo', 3)
  const original = structuredClone(notas)
  notas = vaciarBloqueRepertorio(notas, 'estribillo')
  assert.deepEqual(notas.acordes, original.acordes)
  assert.equal(notas.bloquesAcordes[1].compases.length, 4)
  assert.ok(notas.bloquesAcordes[1].compases.every(lista => !lista.length))
  const sinBloque = vaciarBloqueRepertorio(original, 'estribillo', true)
  assert.deepEqual(sinBloque.acordes, original.acordes)
  assert.equal(sinBloque.bloquesAcordes.length, 1)
  assert.deepEqual(acordesSueltos(sinBloque), original.acordes)
})

test('editar y eliminar una tarjeta agrupada actualiza una sola entidad y limpia referencias', () => {
  let notas = poner(cancion(), 'acorde-0', 'verso')
  notas.acordes = notas.acordes.map(a => a.id === 'acorde-0' ? { ...a, nombre: 'Em7/G' } : a)
  notas = leerNotas(guardarNotas(notas))
  assert.equal(notas.acordes[0].nombre, 'Em7/G')
  assert.deepEqual(notas.bloquesAcordes[0].acordes, [{ id: 'acorde-0' }])
  notas.acordes = notas.acordes.filter(a => a.id !== 'acorde-0')
  assert.deepEqual(leerNotas(guardarNotas(notas)).bloquesAcordes[0].acordes, [])
})

test('referencias inválidas o repetidas nunca ocultan ni duplican acordes', () => {
  const notas = cancion()
  notas.bloquesAcordes[0].acordes = [{ id: 'acorde-0' }, { id: 'acorde-0' }, { id: 'no-existe' }]
  notas.bloquesAcordes[1].compases[1] = [{ id: 'acorde-0' }, { id: 'acorde-1' }]
  const normal = leerNotas(guardarNotas(notas))
  assert.deepEqual(normal.bloquesAcordes.map(b => seccionesBloque(b).flat().map(a => a.id)), [['acorde-0'], ['acorde-1']])
  assert.equal(acordesSueltos(normal).length, 3)
})

test('PDF mantiene bloques por columna, compases, SVG originales y sector suelto sin duplicar', () => {
  let notas = poner(cancion(), 'acorde-0', 'verso')
  notas = poner(notas, 'acorde-1', 'estribillo', 2)
  notas = moverBloqueRepertorio(notas, 'verso', { columna: 'derecha' })
  for (const orientacion of ['vertical', 'apaisado']) {
    const html = imprimirTema(contenidoTemaPDF({ nombre: 'Canción', notas: guardarNotas(notas) }), ['acordes'], orientacion)
    assert.ok(html.indexOf('>estribillo<') < html.indexOf('>verso<'))
    assert.ok(html.indexOf('>verso<') < html.indexOf('>Acordes sueltos<'))
    assert.match(html, /Compás 3/)
    assert.match(html, /×2/)
    assert.equal([...html.matchAll(/<svg viewBox=/g)].length, 5)
    for (const acorde of notas.acordes) assert.equal(html.split(`aria-label="${acorde.nombre}"`).length - 1, 1)
    assert.match(html, /class="bajo">B</)
    assert.match(html, /stroke-dasharray="4 2"/)
  }
})
