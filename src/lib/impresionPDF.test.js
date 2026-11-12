import assert from 'node:assert/strict'
import test from 'node:test'
import { contenidoTemaPDF, imprimirPizarra, imprimirSetlist, imprimirTema, seccionesDisponiblesPDF } from './impresionPDF.js'
import { crearAcorde, guardarNotas } from './notasConAcordes.js'

test('setlist imprime fecha, lugar y apariciones repetidas en su orden exacto', () => {
  const html = imprimirSetlist({ title: 'Repertorio <prueba>', date: '2026-11-11', place: 'Sala',
    items: [{ nombre: 'Segundo' }, { nombre: 'Primero', artista: 'Banda' }, { nombre: 'Segundo' }] })
  assert.match(html, /size: A4 portrait/)
  assert.match(html, /miércoles, 11 de noviembre de 2026/)
  assert.match(html, /Repertorio &lt;prueba&gt;/)
  assert.match(html, />Sala</)
  assert.deepEqual([...html.matchAll(/class="numero">(\d+)\.<\/span><div><p><strong>(.*?)</g)].map(m => m.slice(1)),
    [['1', 'Segundo'], ['2', 'Primero'], ['3', 'Segundo']])
})

test('la letra y la estructura conservan el ancla dentro de la palabra, la repetición y las notas', () => {
  const letra = 'Sigo cantando'
  const tema = { nombre: 'Tema', letra, percusion: '4/4\nAcento', notas: guardarNotas({ acordes: [{ id: 'am', nombre: 'Am' }] }),
    estructura: JSON.stringify({ version: 1, bloques: [{ id: 'verso', tipo: 'verso', letra, repeticiones: 3, nota: 'Solo',
      anclas: [{ id: 'ancla', acordeId: 'am', posicion: 8 }] }] }) }
  const contenido = contenidoTemaPDF(tema)
  const html = imprimirTema(contenido, ['letra', 'estructura', 'percusion'], 'apaisado')
  assert.match(html, /size: A4 landscape/)
  assert.equal([...html.matchAll(/can<span class="silaba">t<span class="cifrado"[^>]*>Am<\/span><\/span>ando/g)].length, 2)
  assert.match(html, /1\. VERSO<\/span><span class="repite">×3/)
  assert.match(html, /Solo/)
  assert.match(html, /4\/4\nAcento/)
  assert.equal(seccionesDisponiblesPDF(contenido).escala, false)
  assert.throws(() => imprimirTema(contenido, ['escala']), /al menos una sección/)
})

test('la pizarra sin guardar imprime la digitación manual y las marcas almacenadas', () => {
  const acorde = { ...crearAcorde(), nombre: 'Posición propia', trastes: ['3', '', '8', '12'] }
  acorde.posiciones[0][2] = 'presionada'
  acorde.posiciones[1][0] = 'aire'
  acorde.posiciones[2][0] = 'muteada'
  acorde.posiciones[5][3] = 'presionada'
  acorde.tonica = { cuerda: 0, traste: 2 }
  acorde.opcional = { cuerda: 1, traste: 0 }
  acorde.bajo = { cuerda: 5, traste: 3 }
  const escala = { tonica: 'Eb', tipo: 'dorico', resaltado: { acordes: [{ id: 'b', nombre: 'Bb7', tonica: 'Eb' }], seleccionado: 'b' } }
  const html = imprimirPizarra({ elementos: [{ tipo: 'escala', datos: escala }, { tipo: 'acorde', datos: acorde }] })
  assert.match(html, /size: A4 landscape/)
  assert.match(html, /Eb · Dórico/)
  assert.match(html, /Acorde destacado: Bb7/)
  assert.match(html, /class="traste">12</)
  assert.match(html, /class="muteada">×</)
  assert.match(html, /class="bajo">B</)
  assert.match(html, /stroke-dasharray="4 2"/)
  assert.match(html, /aria-label="Posición propia"/)
})
