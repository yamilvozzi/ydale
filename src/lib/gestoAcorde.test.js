import test from 'node:test'
import assert from 'node:assert/strict'
import { crearGestoAcorde } from './gestoAcorde.js'

function escenario(tipo = 'touch') {
  let tiempo = 0, contador = 0, scroll = 0, habilitado = true
  const tareas = new Map(), capturas = new Set(), vistas = [], confirmaciones = []
  const reloj = {
    esperar(fn, ms) { const id = ++contador; tareas.set(id, { fn, tiempo: tiempo + ms }); return id },
    quitarEspera(id) { tareas.delete(id) },
    fotograma(fn) { return this.esperar(fn, 16) },
    quitarFotograma(id) { tareas.delete(id) },
  }
  const contenedor = {
    get scrollLeft() { return scroll }, set scrollLeft(valor) { scroll = Math.min(80, Math.max(0, valor)) },
    getBoundingClientRect: () => ({ left: 50, right: 180 }),
  }
  const caracteres = [0, 1, 2, 3, 4, 5].map(posicion => ({
    dataset: { posicion: String(posicion) }, getBoundingClientRect: () => ({ left: 100 + posicion * 10 - scroll }),
  }))
  const linea = { querySelectorAll: () => caracteres }
  const boton = {
    parentElement: caracteres[1], closest: () => linea,
    setPointerCapture(id) { capturas.add(id) }, hasPointerCapture: id => capturas.has(id), releasePointerCapture(id) { capturas.delete(id) },
  }
  const control = crearGestoAcorde({ contenedor: () => contenedor, habilitado: () => habilitado, previsualizar: vista => vistas.push(vista), confirmar: (id, posicion) => confirmaciones.push({ id, posicion }), reloj })
  const eventos = control.eventos({ id: 'ancla', posicion: 1 })
  const evento = cambios => ({ pointerId: 1, pointerType: tipo, isPrimary: true, button: 0, clientX: 115, clientY: 80, currentTarget: boton, detail: 1, preventDefault() {}, stopPropagation() {}, ...cambios })
  function avanzar(ms) {
    const final = tiempo + ms
    let siguiente
    while ((siguiente = [...tareas].filter(([, t]) => t.tiempo <= final).sort((a, b) => a[1].tiempo - b[1].tiempo)[0])) {
      tareas.delete(siguiente[0]); tiempo = siguiente[1].tiempo; siguiente[1].fn()
    }
    tiempo = final
  }
  return { eventos, evento, avanzar, control, vistas, confirmaciones, tareas, capturas, contenedor, deshabilitar: () => { habilitado = false; control.cancelar() } }
}

test('tap corto y clic breve abren el selector sin mover ni confirmar un anclaje', () => {
  for (const tipo of ['touch', 'mouse', 'pen']) {
    const s = escenario(tipo)
    s.eventos.onPointerDown(s.evento())
    s.avanzar(100)
    s.eventos.onPointerUp(s.evento())
    assert.equal(s.eventos.onClick(s.evento()), true)
    assert.deepEqual(s.confirmaciones, [])
    assert.equal(s.tareas.size, 0)
    assert.equal(s.capturas.size, 0)
    s.avanzar(500)
    assert.ok(s.vistas.every(v => v === null))
  }
})

test('touch y pen esperan la pulsación sostenida y confirman una sola vez al soltar, ignorando el eje vertical', () => {
  for (const tipo of ['touch', 'pen']) {
    const s = escenario(tipo)
    s.eventos.onPointerDown(s.evento())
    s.avanzar(349)
    assert.equal(s.vistas.length, 0)
    s.avanzar(1)
    s.eventos.onPointerMove(s.evento({ clientX: 143, clientY: 400 }))
    assert.deepEqual(s.vistas.at(-1), { id: 'ancla', posicion: 4, desplazamiento: 30 })
    assert.deepEqual(s.confirmaciones, [])
    s.eventos.onPointerUp(s.evento({ clientX: 143, clientY: 400 }))
    s.eventos.onLostPointerCapture(s.evento())
    s.eventos.onPointerUp(s.evento({ clientX: 160 }))
    assert.deepEqual(s.confirmaciones, [{ id: 'ancla', posicion: 4 }])
    assert.equal(s.eventos.onClick(s.evento()), false)
    assert.equal(s.capturas.size, 0)
    assert.equal(s.tareas.size, 0)
  }
})

test('mouse admite arrastre directo y ajusta al carácter más cercano sin necesitar esperar', () => {
  const s = escenario('mouse')
  s.eventos.onPointerDown(s.evento())
  s.eventos.onPointerMove(s.evento({ clientX: 134 }))
  assert.equal(s.vistas.at(-1).posicion, 3)
  s.eventos.onPointerUp(s.evento({ clientX: 134 }))
  assert.deepEqual(s.confirmaciones, [{ id: 'ancla', posicion: 3 }])
  assert.equal(s.eventos.onClick(s.evento()), false)
  assert.equal(s.eventos.onClick(s.evento({ detail: 0 })), true)
})

test('movimiento antes de la espera táctil, cancelación y pérdida de captura no guardan posiciones', () => {
  for (const accion of ['prematuro', 'cancelar', 'perder', 'deshabilitar', 'desmontar']) {
    const s = escenario()
    s.eventos.onPointerDown(s.evento())
    if (accion === 'prematuro') s.eventos.onPointerMove(s.evento({ clientX: 125 }))
    else {
      s.avanzar(350)
      if (accion === 'cancelar') s.eventos.onPointerCancel(s.evento())
      if (accion === 'perder') s.eventos.onLostPointerCapture(s.evento())
      if (accion === 'deshabilitar') s.deshabilitar()
      if (accion === 'desmontar') s.control.cancelar()
    }
    s.avanzar(500)
    s.eventos.onPointerUp(s.evento())
    assert.deepEqual(s.confirmaciones, [], accion)
    assert.equal(s.tareas.size, 0, accion)
    assert.equal(s.capturas.size, 0, accion)
    assert.equal(s.vistas.at(-1), null, accion)
  }
})

test('ignora botones secundarios y otros punteros sin alterar el gesto principal', () => {
  const s = escenario()
  s.eventos.onPointerDown(s.evento({ button: 2 }))
  s.eventos.onPointerDown(s.evento({ pointerId: 2, isPrimary: false }))
  assert.equal(s.tareas.size, 0)
  s.eventos.onPointerDown(s.evento())
  s.avanzar(350)
  s.eventos.onPointerMove(s.evento({ pointerId: 2, clientX: 160 }))
  s.eventos.onPointerCancel(s.evento({ pointerId: 2 }))
  s.eventos.onPointerUp(s.evento())
  assert.deepEqual(s.confirmaciones, [{ id: 'ancla', posicion: 1 }])
})

test('el borde desplaza horizontalmente el gráfico y detiene los fotogramas al soltar', () => {
  const s = escenario('mouse')
  s.eventos.onPointerDown(s.evento())
  s.eventos.onPointerMove(s.evento({ clientX: 175 }))
  s.avanzar(32)
  assert.equal(s.contenedor.scrollLeft, 24)
  assert.equal(s.vistas.at(-1).posicion, 5)
  s.eventos.onPointerUp(s.evento({ clientX: 175 }))
  assert.deepEqual(s.confirmaciones, [{ id: 'ancla', posicion: 5 }])
  assert.equal(s.tareas.size, 0)
  s.avanzar(200)
  assert.equal(s.contenedor.scrollLeft, 24)
})
