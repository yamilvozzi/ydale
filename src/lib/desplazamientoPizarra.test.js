import test from 'node:test'
import assert from 'node:assert/strict'
import { desplazamientoPizarra, guardarPizarra, leerPizarra, pizarraVacia, ponerElemento, reiniciarTransposicionPizarra, transponerPizarra } from './pizarra.js'
import { generarPosiciones, interpretarAcorde, propuestaAEditable } from './generadorAcordes.js'
import { reordenarGrupo } from './ordenTarjetas.js'
import { AFINACION } from './escalas.js'
import { claseDeNota } from './circuloQuintas.js'
import { copiarMusicaAPizarra } from './musicaRepertorio.js'

function diagrama(nombre) {
  const acorde = interpretarAcorde(nombre)
  return propuestaAEditable(acorde, generarPosiciones(acorde, { completo: true })[0])
}
const voces = acorde => acorde.posiciones.flatMap((fila, cuerda) => fila.flatMap((estado, columna) => ['aire', 'presionada'].includes(estado)
  ? [{ cuerda, clase: (claseDeNota(AFINACION[cuerda]) + (estado === 'aire' ? 0 : Number(acorde.trastes[columna]))) % 12 }] : []))
function pizarra() {
  return ponerElemento(ponerElemento(pizarraVacia(), 'escala', { id: 'escala', tonica: 'E', tipo: 'menor' }), 'acorde', diagrama('Em'))
}
function almacenamiento() {
  let texto
  return { setItem: (_, valor) => { texto = valor }, getItem: () => texto ?? null }
}

test('comienza en cero y acumula subidas y bajadas, sin reducir el contador módulo doce', () => {
  let datos = pizarra()
  assert.equal(desplazamientoPizarra(datos), 0)
  for (let i = 1; i <= 3; i++) { datos = transponerPizarra(datos, 1); assert.equal(desplazamientoPizarra(datos), i) }
  assert.equal(datos.elementos[0].datos.tonica, 'G')
  const reiniciada = reiniciarTransposicionPizarra(datos)
  assert.equal(desplazamientoPizarra(reiniciada), 0)
  assert.equal(reiniciada.elementos[0].datos.tonica, 'E')
  datos = transponerPizarra(transponerPizarra(reiniciada, -1), -1)
  assert.equal(desplazamientoPizarra(datos), -2)
  assert.equal(datos.elementos[0].datos.tonica, 'D')
  assert.equal(reiniciarTransposicionPizarra(datos).elementos[0].datos.tonica, 'E')
  assert.equal(desplazamientoPizarra(transponerPizarra(datos, 15)), 13)
})

test('el contador se conserva al guardar y reabrir, y las pizarras anteriores comienzan en cero', () => {
  const storage = almacenamiento()
  const original = pizarra()
  guardarPizarra(storage, original)
  assert.deepEqual(leerPizarra(storage), original)
  const desplazada = transponerPizarra(original, 3)
  guardarPizarra(storage, desplazada)
  assert.deepEqual(leerPizarra(storage), desplazada)
  assert.equal(desplazamientoPizarra(leerPizarra(storage)), 3)
  for (const valor of [1.5, '3', null]) assert.throws(() => leerPizarra({ getItem: () => JSON.stringify({ ...original, desplazamiento: valor }) }), /Desplazamiento/)
})

test('reset aplica la inversa sobre las ediciones, elementos nuevos, borrados y orden actuales, sin recuperar una copia', () => {
  const origen = pizarra()
  let datos = transponerPizarra(origen, 3)
  datos = ponerElemento(datos, 'escala', { ...datos.elementos[0].datos, tonica: 'A', tipo: 'dorico' })
  datos = ponerElemento(datos, 'acorde', { ...datos.elementos[1].datos, nombre: 'Gm7' })
  const nuevo = diagrama('D7/F#')
  datos = ponerElemento(datos, 'acorde', nuevo)
  assert.equal(desplazamientoPizarra(datos), 3)
  datos = { ...datos, elementos: reordenarGrupo(datos.elementos, 'acorde', datos.elementos.filter(e => e.tipo === 'acorde').map(e => e.datos).reverse()) }
  datos = { ...datos, elementos: datos.elementos.filter(e => e.datos.id !== origen.elementos[1].datos.id) }
  const actual = structuredClone(datos)
  const reset = reiniciarTransposicionPizarra(datos)
  assert.deepEqual(datos, actual)
  assert.equal(desplazamientoPizarra(reset), 0)
  assert.deepEqual(reset.elementos.map(e => e.datos.id), datos.elementos.map(e => e.datos.id))
  assert.equal(reset.elementos[0].datos.tonica, 'F#') // A editado - 3, no E de la pizarra original.
  assert.equal(reset.elementos[0].datos.tipo, 'dorico')
  const acorde = reset.elementos.find(e => e.datos.id === nuevo.id).datos
  assert.equal(acorde.nombre, 'B7/D#') // Conserva la grafía con sostenidos del bajo F#.
  assert.deepEqual(voces(acorde), voces(nuevo).map(v => ({ ...v, clase: (v.clase + 9) % 12 })))
  assert.equal(reset.elementos.length, 2)
})

test('reset de cero no recalcula los diagramas; vaciar y cargar otro tema fijan un origen nuevo', () => {
  const datos = pizarra()
  assert.equal(reiniciarTransposicionPizarra(datos), datos)
  assert.equal(desplazamientoPizarra(pizarraVacia()), 0)
  const copia = copiarMusicaAPizarra({ nombre: 'Tema', escalas: [{ tonica: 'D', tipo: 'mayor' }], acordes: [] })
  assert.equal(desplazamientoPizarra(copia), 0)
  assert.deepEqual(reiniciarTransposicionPizarra({ ...pizarraVacia(), desplazamiento: 3 }), pizarraVacia())
  assert.equal(transponerPizarra(pizarraVacia(), 1).elementos.length, 0)
})

test('si una edición impide transportar, reset falla sin cambiar elementos ni contador', () => {
  let datos = transponerPizarra(pizarra(), 3)
  const acorde = datos.elementos[1].datos
  datos = ponerElemento(datos, 'acorde', { ...acorde, trastes: acorde.trastes.map(() => '') })
  const actual = structuredClone(datos)
  assert.throws(() => reiniciarTransposicionPizarra(datos), /Definí los números/)
  assert.deepEqual(datos, actual)
  for (const delta of [NaN, Infinity, '1', 0.5]) assert.throws(() => transponerPizarra(datos, delta), /entero/)
})
