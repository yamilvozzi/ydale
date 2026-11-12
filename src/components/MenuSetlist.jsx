import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'

const limitar = (valor, min, max) => Math.max(min, Math.min(valor, max))

function ubicarMenu(boton, menu, vista) {
  const margen = 8
  const separacion = 4
  const izquierda = (vista?.offsetLeft ?? 0) + margen
  const arriba = (vista?.offsetTop ?? 0) + margen
  const derecha = izquierda + (vista?.width ?? document.documentElement.clientWidth) - 2 * margen
  const abajo = arriba + (vista?.height ?? document.documentElement.clientHeight) - 2 * margen
  menu.style.maxWidth = `${derecha - izquierda}px`
  menu.style.maxHeight = `${abajo - arriba}px`

  const ancla = boton.getBoundingClientRect()
  const { width, height } = menu.getBoundingClientRect()
  const debajo = ancla.bottom + separacion
  const encima = ancla.top - height - separacion
  let x = ancla.right - width
  let y = debajo

  if (debajo + height > abajo) {
    if (encima >= arriba) y = encima
    else if (ancla.left - width - separacion >= izquierda) {
      x = ancla.left - width - separacion
      y = ancla.top
    } else if (ancla.right + width + separacion <= derecha) {
      x = ancla.right + separacion
      y = ancla.top
    } else if (ancla.top - arriba > abajo - ancla.bottom) y = encima
  }

  menu.style.left = `${limitar(x, izquierda, derecha - width)}px`
  menu.style.top = `${limitar(y, arriba, abajo - height)}px`
}

export default function MenuSetlist({ nombre, acciones, disabled = false, flotante = false }) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef(null)
  const boton = useRef(null)
  const menu = useRef(null)
  const id = useId()
  const visible = abierto && !disabled

  useLayoutEffect(() => {
    if (!visible || !flotante) return
    const ancla = boton.current
    const panel = menu.current
    const dialogo = ancla.closest('dialog')
    const vista = window.visualViewport

    function actualizar() {
      const rect = ancla.getBoundingClientRect()
      const limite = dialogo?.getBoundingClientRect()
      if (limite && (rect.bottom <= limite.top || rect.top >= limite.bottom)) {
        setAbierto(false)
        return
      }
      ubicarMenu(ancla, panel, vista)
    }

    // El panel fijo queda en la capa del diálogo, fuera de su área de scroll.
    actualizar()
    window.addEventListener('scroll', actualizar, true)
    window.addEventListener('resize', actualizar)
    vista?.addEventListener('resize', actualizar)
    vista?.addEventListener('scroll', actualizar)
    return () => {
      window.removeEventListener('scroll', actualizar, true)
      window.removeEventListener('resize', actualizar)
      vista?.removeEventListener('resize', actualizar)
      vista?.removeEventListener('scroll', actualizar)
    }
  }, [visible, flotante])

  useEffect(() => {
    if (!visible) return
    function afuera(e) { if (!contenedor.current?.contains(e.target)) setAbierto(false) }
    function teclado(e) {
      if (e.key !== 'Escape') return
      if (flotante) e.preventDefault()
      setAbierto(false)
      boton.current?.focus({ preventScroll: flotante })
    }
    document.addEventListener('pointerdown', afuera)
    document.addEventListener('keydown', teclado)
    return () => {
      document.removeEventListener('pointerdown', afuera)
      document.removeEventListener('keydown', teclado)
    }
  }, [visible, flotante])
  return <div ref={contenedor} className="relative shrink-0 self-start" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(false) }}>
    <button ref={boton} type="button" disabled={disabled} aria-label={`Opciones de ${nombre}`} aria-expanded={visible} aria-controls={id}
      onClick={() => setAbierto(!abierto)} className="accion-plana accion-icono rounded-lg disabled:opacity-50"><MoreVertical /></button>
    {visible && <div ref={menu} id={id} className={`${flotante ? 'fixed overflow-y-auto overscroll-contain scheme-dark' : 'absolute right-0 top-full'} z-20 w-52 rounded-lg border border-borde bg-superficie p-1 shadow-xl`}>
      {acciones.map(({ texto, ejecutar }) => <button key={texto} type="button" className="w-full min-h-11 rounded-lg px-3 py-2 text-left text-sm text-butter hover:bg-borde focus-visible:outline-2 focus-visible:outline-butter"
        onClick={() => { setAbierto(false); boton.current?.focus({ preventScroll: flotante }); ejecutar() }}>{texto}</button>)}
    </div>}
  </div>
}
