import test from 'node:test'
import assert from 'node:assert/strict'
import { CLAVE_PIZARRA, guardarPizarra, leerPizarra, pizarraVacia, ponerElemento } from './pizarra.js'
import { generarPosiciones, interpretarAcorde, propuestaAEditable } from './generadorAcordes.js'
import { guardarNotas, leerNotas } from './notasConAcordes.js'

function almacenamiento() {
  const valores = new Map([['ydaaaale_desbloqueado', 'true'], ['otro-dato', 'conservar']])
  return { valores, getItem: (clave) => valores.get(clave) ?? null, setItem: (clave, valor) => valores.set(clave, valor) }
}

test('la pizarra persiste varias escalas y un voicing completo sin tocar otras claves', () => {
  const storage = almacenamiento()
  let pizarra = leerPizarra(storage)
  assert.deepEqual(pizarra, pizarraVacia())
  pizarra = ponerElemento(pizarra, 'escala', { tonica: 'C', tipo: 'mayor' })
  pizarra = ponerElemento(pizarra, 'escala', { tonica: 'D', tipo: 'dorico' })
  const acorde = interpretarAcorde('D/F#')
  const voicing = generarPosiciones(acorde, { zona: 'AGUDA', cuerdas: '1–2–3' })[0]
  pizarra = ponerElemento(pizarra, 'acorde', propuestaAEditable(acorde, voicing))
  guardarPizarra(storage, pizarra)
  const recargada = leerPizarra(storage)
  assert.deepEqual(recargada, pizarra)
  assert.deepEqual(recargada.elementos.map((e) => e.tipo), ['escala', 'escala', 'acorde'])
  assert.equal(recargada.elementos[2].datos.trastes.length, 5)
  assert.ok(recargada.elementos[2].datos.bajo)
  assert.equal(storage.getItem('ydaaaale_desbloqueado'), 'true')
  assert.equal(storage.getItem('otro-dato'), 'conservar')
  assert.equal(storage.valores.size, 3)
})

test('editar conserva el ID y el orden, y vaciar no afecta claves externas', () => {
  const storage = almacenamiento()
  let pizarra = ponerElemento(pizarraVacia(), 'escala', { tonica: 'C', tipo: 'mayor' })
  pizarra = ponerElemento(pizarra, 'escala', { tonica: 'G', tipo: 'menor' })
  const original = structuredClone(pizarra)
  const primera = pizarra.elementos[0].datos
  const editada = ponerElemento(pizarra, 'escala', { ...primera, tonica: 'F#' })
  assert.deepEqual(pizarra, original)
  assert.equal(editada.elementos.length, 2)
  assert.equal(editada.elementos[0].datos.id, primera.id)
  assert.equal(editada.elementos[0].datos.tonica, 'F#')
  assert.deepEqual(editada.elementos[1], original.elementos[1])
  guardarPizarra(storage, editada)
  guardarPizarra(storage, pizarraVacia())
  assert.deepEqual(leerPizarra(storage), pizarraVacia())
  assert.equal(storage.getItem('otro-dato'), 'conservar')
})

test('leer contenido corrupto no lo sobrescribe y los errores de almacenamiento son detectables', () => {
  const storage = almacenamiento()
  storage.setItem(CLAVE_PIZARRA, 'contenido inválido')
  assert.throws(() => leerPizarra(storage))
  assert.equal(storage.getItem(CLAVE_PIZARRA), 'contenido inválido')
  assert.throws(() => guardarPizarra({ setItem: () => { throw new Error('Cuota agotada') } }, pizarraVacia()))
})

test('Pizarra y Repertorio conservan el mismo voicing de tres/cuatro cuerdas, nota opcional, zona y bajo', () => {
  const storage = almacenamiento()
  const casos = [
    { cantidadCuerdas: 3, cuerdas: '2–3–4', zona: 'ABIERTA' },
    { cantidadCuerdas: 3, zona: 'MEDIA', bajo: true },
    { cantidadCuerdas: 4, zona: 'AGUDA' },
    { cantidadCuerdas: 4, cuerdas: '1–2–3–4', zona: 'ABIERTA', bajo: true },
  ]
  let pizarra = pizarraVacia()
  for (const opciones of casos) {
    const acorde = interpretarAcorde('A7')
    const propuestas = generarPosiciones(acorde, opciones)
    assert.ok(propuestas.length > 0)
    for (const propuesta of propuestas) {
      const datos = propuestaAEditable(acorde, propuesta)
      pizarra = ponerElemento(pizarra, 'acorde', datos)
      guardarPizarra(storage, pizarra)
      const guardado = leerPizarra(storage).elementos.at(-1).datos
      const repertorio = leerNotas(guardarNotas({ texto: 'Conservar', acordes: [datos] })).acordes[0]
      assert.deepEqual(guardado, repertorio)
      assert.equal(guardado.posiciones.flat().filter((estado) => ['presionada', 'aire'].includes(estado)).length,
        opciones.cantidadCuerdas + Number(Boolean(propuesta.bajo)) + Number(Boolean(propuesta.opcional)))
      const editada = { ...guardado, nombre: 'A7 editado' }
      const cantidadAntes = pizarra.elementos.length
      pizarra = ponerElemento(pizarra, 'acorde', editada)
      assert.equal(pizarra.elementos.length, cantidadAntes)
      assert.deepEqual(pizarra.elementos.at(-1).datos, { ...repertorio, nombre: 'A7 editado' })
    }
  }
  assert.ok(pizarra.elementos.some(({ datos }) => datos.opcional))
  assert.ok(pizarra.elementos.some(({ datos }) => datos.bajo))
  assert.equal(storage.getItem('otro-dato'), 'conservar')
})

test('los acordes completos conservan las mismas voces y cuerdas muteadas en ambas pantallas', () => {
  const storage = almacenamiento()
  let pizarra = pizarraVacia()
  for (const nombre of ['E9', 'E13', 'Am7b5', 'Cdim7', 'E9/F#']) {
    const acorde = interpretarAcorde(nombre)
    for (const propuesta of generarPosiciones(acorde, { completo: true })) {
      const datos = propuestaAEditable(acorde, propuesta)
      pizarra = ponerElemento(pizarra, 'acorde', datos)
      guardarPizarra(storage, pizarra)
      const guardado = leerPizarra(storage).elementos.at(-1).datos
      const repertorio = leerNotas(guardarNotas({ texto: 'Conservar', acordes: [datos] })).acordes[0]
      assert.deepEqual(guardado, repertorio)
      assert.equal(guardado.posiciones.flat().filter(e => ['presionada', 'aire'].includes(e)).length, propuesta.principal.length)
      assert.equal(guardado.posiciones.flat().filter(e => e === 'muteada').length, 6 - propuesta.principal.length)
      const editada = ponerElemento(pizarra, 'acorde', { ...guardado, nombre: `${nombre} editado` })
      assert.equal(editada.elementos.length, pizarra.elementos.length)
      assert.deepEqual(editada.elementos.at(-1).datos.posiciones, repertorio.posiciones)
    }
  }
  assert.equal(storage.getItem('otro-dato'), 'conservar')
})
