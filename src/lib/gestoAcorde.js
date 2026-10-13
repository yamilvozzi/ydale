import { posicionHorizontal } from './herramientasEstructura.js'

const ESPERA = 350
const TOLERANCIA = 8
const relojNativo = {
  esperar: (fn, ms) => setTimeout(fn, ms),
  quitarEspera: id => clearTimeout(id),
  fotograma: fn => requestAnimationFrame(fn),
  quitarFotograma: id => cancelAnimationFrame(id),
}

/** Un solo gesto de pointer, con vista horizontal provisional y confirmación al soltar. */
export function crearGestoAcorde({ contenedor, habilitado, previsualizar, confirmar, reloj = relojNativo }) {
  let gesto = null
  let omitirClick = null

  function limpiar(actual) {
    reloj.quitarEspera(actual.temporizador)
    reloj.quitarFotograma(actual.fotograma)
    gesto = null
    if (actual.boton.hasPointerCapture(actual.pointerId)) actual.boton.releasePointerCapture(actual.pointerId)
  }

  function cancelar() {
    if (gesto) { omitirClick = gesto.id; limpiar(gesto) }
    previsualizar(null)
  }

  function medir(actual) {
    const candidatos = [...actual.linea.querySelectorAll(':scope > [data-posicion]')].map(caracter => ({
      posicion: Number(caracter.dataset.posicion), x: caracter.getBoundingClientRect().left,
    }))
    const destino = posicionHorizontal(candidatos, actual.x - actual.agarre)
    if (!destino) return
    actual.destino = destino.posicion
    previsualizar({ id: actual.id, posicion: destino.posicion, desplazamiento: destino.x - actual.boton.parentElement.getBoundingClientRect().left })
  }

  function desplazar(actual) {
    if (gesto !== actual || !actual.activo) return
    const elemento = contenedor()
    const limites = elemento.getBoundingClientRect()
    const paso = actual.x < limites.left + 24 ? -8 : actual.x > limites.right - 24 ? 8 : 0
    const anterior = elemento.scrollLeft
    if (paso) elemento.scrollLeft += paso
    medir(actual)
    if (paso && elemento.scrollLeft !== anterior) actual.fotograma = reloj.fotograma(() => desplazar(actual))
  }

  function activar(actual) {
    if (gesto !== actual) return
    actual.activo = true
    omitirClick = actual.id
    medir(actual)
  }

  function cancelarPointer(evento) {
    if (gesto && gesto.pointerId === evento.pointerId) cancelar()
  }

  function eventos(ancla) {
    return {
      onPointerDown(evento) {
        if (!habilitado() || evento.button !== 0 || !evento.isPrimary) return
        evento.stopPropagation()
        if (gesto) limpiar(gesto)
        omitirClick = null
        const boton = evento.currentTarget
        const actual = {
          id: ancla.id, pointerId: evento.pointerId, tipo: evento.pointerType, boton,
          linea: boton.closest('[data-verso]'), x: evento.clientX, inicioX: evento.clientX, inicioY: evento.clientY,
          agarre: evento.clientX - boton.parentElement.getBoundingClientRect().left,
          destino: ancla.posicion, activo: false,
        }
        gesto = actual
        boton.setPointerCapture(evento.pointerId)
        actual.temporizador = reloj.esperar(() => activar(actual), ESPERA)
      },
      onPointerMove(evento) {
        const actual = gesto
        if (!actual || actual.pointerId !== evento.pointerId) return
        actual.x = evento.clientX
        if (!actual.activo) {
          const horizontal = Math.abs(evento.clientX - actual.inicioX)
          const vertical = Math.abs(evento.clientY - actual.inicioY)
          // Mouse admite arrastre directo; touch/pen requiere mantener pulsado.
          if (actual.tipo === 'mouse' && horizontal >= 4 && horizontal >= vertical) activar(actual)
          else if (horizontal > TOLERANCIA || vertical > TOLERANCIA) { cancelarPointer(evento); return }
        }
        if (!actual.activo) return
        evento.preventDefault(); evento.stopPropagation()
        reloj.quitarFotograma(actual.fotograma)
        desplazar(actual)
      },
      onPointerUp(evento) {
        const actual = gesto
        if (!actual || actual.pointerId !== evento.pointerId) return
        if (actual.activo) {
          actual.x = evento.clientX
          medir(actual)
          evento.preventDefault(); evento.stopPropagation()
        }
        limpiar(actual)
        previsualizar(null)
        if (actual.activo) confirmar(actual.id, actual.destino)
      },
      onPointerCancel: cancelarPointer,
      onLostPointerCapture: cancelarPointer,
      onContextMenu(evento) { evento.preventDefault() },
      onClick(evento) {
        evento.stopPropagation()
        if (omitirClick === ancla.id && evento.detail !== 0) { omitirClick = null; evento.preventDefault(); return false }
        return true
      },
    }
  }

  return { eventos, cancelar }
}
