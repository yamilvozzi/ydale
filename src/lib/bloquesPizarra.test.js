import assert from 'node:assert/strict'
import test from 'node:test'
import { configurarBloque, insertarAcordeBloque, variantesDigitacion } from './bloquesPizarra.js'
import { imprimirPizarra } from './impresionPDF.js'
import { crearAcorde } from './notasConAcordes.js'
import { pizarraVacia, ponerElemento, transponerPizarra } from './pizarra.js'
import { cambiosPizarra, guardarTrabajoPizarra, leerTrabajoPizarra } from './proyectosPizarra.js'
import { transponerDiagrama } from './transposicion.js'

function digitacion(id, traste) {
  const acorde = { ...crearAcorde(), id, nombre: 'Em', trastes: [String(traste), '', '', ''] }
  acorde.posiciones[0][0] = 'aire'
  acorde.posiciones[1][0] = 'presionada'
  acorde.posiciones[2][0] = 'muteada'
  acorde.tonica = { cuerda: 0, traste: 0 }
  acorde.bajo = { cuerda: 1, traste: 0 }
  acorde.opcional = { cuerda: 0, traste: 0 }
  return acorde
}

const ajustar = (bloque, cantidad) => configurarBloque(bloque, { titulo: ' Intro ', repeticiones: 3, cantidad })

test('las conversiones y reducciones conservan todas las apariciones y su orden', () => {
  const abierta = digitacion('abierta', 2)
  const aguda = digitacion('aguda', 7)
  let libre = ajustar(null, 0)
  for (const acorde of [abierta, aguda, abierta, aguda]) libre = insertarAcordeBloque(libre, 0, acorde)
  assert.equal(new Set(libre.acordes.map(a => a.id)).size, 4)
  const estructurado = ajustar(libre, 3)
  assert.equal(estructurado.titulo, 'Intro')
  assert.equal(estructurado.repeticiones, 3)
  assert.deepEqual(estructurado.compases.map(c => c.length), [1, 1, 2])
  assert.deepEqual(ajustar(estructurado, 2).compases, [libre.acordes.slice(0, 1), libre.acordes.slice(1)])
  assert.deepEqual(ajustar(estructurado, 8).compases.slice(3), [[], [], [], [], []])
  assert.deepEqual(ajustar(estructurado, 0).acordes, libre.acordes)
})

test('el borrador y sus copias recuperan posiciones exactas incluso sin el acorde fuente', () => {
  const fuente = digitacion('abierta', 2)
  const variante = digitacion('aguda', 7)
  let pizarra = ponerElemento(pizarraVacia(), 'acorde', fuente)
  pizarra = ponerElemento(pizarra, 'bloque', insertarAcordeBloque(ajustar(null, 4), 2, fuente))
  const original = pizarra.elementos[1].datos
  pizarra = ponerElemento(pizarra, 'bloque', { ...original, id: undefined })
  const duplicado = pizarra.elementos[2].datos
  assert.notEqual(duplicado.id, original.id)
  assert.deepEqual(duplicado.compases, original.compases)
  assert.notStrictEqual(duplicado.compases[2][0].digitacion.posiciones[0], original.compases[2][0].digitacion.posiciones[0])
  pizarra = ponerElemento(pizarra, 'bloque', { ...duplicado, compases: [[], [{ ...duplicado.compases[2][0], digitacion: variante }], [], []] })
  pizarra = { ...pizarra, elementos: pizarra.elementos.filter(e => e.tipo !== 'acorde') }

  let registro
  const storage = { getItem: () => registro, setItem: (_, texto) => { registro = texto } }
  const proyecto = { id: 'proyecto', titulo: 'Ensayo', revision: 1, base: pizarra }
  guardarTrabajoPizarra(storage, pizarra, proyecto)
  const recuperada = leerTrabajoPizarra(storage)
  assert.deepEqual(recuperada.datos, pizarra)
  assert.equal(cambiosPizarra(recuperada.datos, recuperada.proyecto), false)
  assert.deepEqual(recuperada.datos.elementos[0].datos.compases[2][0].digitacion, fuente)
  assert.deepEqual(recuperada.datos.elementos[1].datos.compases[1][0].digitacion, variante)
  const transpuesta = transponerPizarra(recuperada.datos, 1)
  assert.deepEqual(transpuesta.elementos[0].datos.compases[2][0].digitacion, transponerDiagrama(fuente, 1))
  assert.equal(transpuesta.elementos[0].datos.compases[2][0].id, original.compases[2][0].id)
  assert.ok(cambiosPizarra(transpuesta, recuperada.proyecto))
})

test('las variantes muestran primero la digitación guardada y distinguen posiciones de igual nombre', () => {
  const guardada = digitacion('abierta', 2)
  const editada = digitacion('abierta', 5)
  const aguda = digitacion('aguda', 7)
  assert.deepEqual(variantesDigitacion(guardada, [editada, aguda, { ...guardada, id: 'copia' }, { ...aguda, nombre: 'EM' }]),
    [guardada, editada, aguda])
  assert.deepEqual(variantesDigitacion(guardada, []), [guardada])
})

test('la impresión de una pizarra con sólo bloques conserva compases y repeticiones', () => {
  const bloque = insertarAcordeBloque(ajustar(null, 2), 1, { ...digitacion('uno', 2), nombre: 'A&B' })
  const html = imprimirPizarra(ponerElemento(pizarraVacia(), 'bloque', bloque), null)
  assert.match(html, /Intro<\/span><span class="repite">×3/)
  assert.match(html, /1<\/span><p><\/p><\/li><li class="compas"><span class="dato">2<\/span><p>A&amp;B<\/p>/)
})
