import { X } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { caracteresConPosicion, distribuirCarriles, versosConPosicion } from '../lib/anclasEstructura'
import { useMoverAcorde } from '../hooks/useMoverAcorde'

export default function LetraConAcordes({ letra, anclas = [], acordes, editable = false, disabled = false, onAsignar, onEliminar, onMover }) {
  const contenedor = useRef(null)
  const [seleccion, setSeleccion] = useState(null)
  const [distribucion, setDistribucion] = useState({})
  const porId = useMemo(() => new Map(acordes.map(acorde => [acorde.id, acorde])), [acordes])
  const porPosicion = new Map()
  for (const ancla of anclas) porPosicion.set(ancla.posicion, [...(porPosicion.get(ancla.posicion) ?? []), ancla])
  const versos = versosConPosicion(letra)
  const limites = [...caracteresConPosicion(letra).map(c => c.posicion), letra.length]
  const { arrastre, eventos } = useMoverAcorde({ contenedor, letra, habilitado: editable && !disabled, onMover })

  useLayoutEffect(() => {
    const elemento = contenedor.current
    function medir() {
      const nueva = {}
      for (const verso of elemento.querySelectorAll('[data-verso]')) {
        const intervalos = [...verso.querySelectorAll('[data-ancla]')].map(rotulo => {
          const izquierda = rotulo.parentElement.getBoundingClientRect().left
          return { id: rotulo.dataset.ancla, izquierda, derecha: izquierda + rotulo.getBoundingClientRect().width }
        })
        nueva[verso.dataset.verso] = distribuirCarriles(intervalos)
      }
      setDistribucion(actual => JSON.stringify(actual) === JSON.stringify(nueva) ? actual : nueva)
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(elemento)
    let vigente = true
    document.fonts?.ready.then(() => { if (vigente) medir() })
    return () => { vigente = false; observador.disconnect() }
  }, [letra, anclas, acordes, editable])

  function seleccionar(posicion, anclaId = null) {
    if (disabled || !editable) return
    setSeleccion({ posicion, letra, anclaId })
  }

  function alPulsar(evento) {
    if (!editable || disabled) return
    const caracter = evento.target.closest('[data-posicion]')
    if (!caracter || !contenedor.current.contains(caracter)) return
    const posicion = Number(caracter.dataset.posicion)
    const rect = caracter.getBoundingClientRect()
    const longitud = caracter.dataset.longitud ? Number(caracter.dataset.longitud) : 0
    seleccionar(evento.clientX > rect.left + rect.width / 2 ? posicion + longitud : posicion)
  }

  function manejarTecla(evento) {
    if (evento.target !== evento.currentTarget || !editable || disabled) return
    const posicion = seleccion?.letra === letra ? seleccion.posicion : 0
    const indice = Math.max(0, limites.indexOf(posicion))
    if (['ArrowLeft', 'ArrowRight'].includes(evento.key)) {
      evento.preventDefault()
      seleccionar(limites[Math.max(0, Math.min(limites.length - 1, indice + (evento.key === 'ArrowLeft' ? -1 : 1)))])
    } else if (['Enter', ' '].includes(evento.key)) {
      evento.preventDefault()
      seleccionar(posicion)
    }
  }

  const elegida = seleccion?.letra === letra ? seleccion.posicion : null
  const existente = elegida === null ? null : seleccion.anclaId ? anclas.find(ancla => ancla.id === seleccion.anclaId) : porPosicion.get(elegida)?.[0]

  function dibujarCaracter(caracter, posicion, longitud) {
    const verso = versos.find(v => posicion >= v.inicio && posicion <= v.fin)
    return <span key={posicion} data-posicion={posicion} data-longitud={longitud}
      className={`letra-caracter${editable ? ' letra-caracter-editable' : ''}${(arrastre?.posicion ?? elegida) === posicion ? ' letra-caracter-elegida' : ''}`}
    >
      {(porPosicion.get(posicion) ?? []).map(ancla => {
        const acorde = porId.get(ancla.acordeId)
        const nombre = acorde?.nombre?.trim() || (editable ? '—' : '')
        if (!nombre) return null
        const carril = distribucion[verso?.inicio]?.carriles[ancla.id] ?? 0
        const gesto = eventos(ancla)
        const moviendo = arrastre?.id === ancla.id
        return editable ? <button key={ancla.id} type="button" disabled={disabled} data-ancla={ancla.id}
          data-moviendo={moviendo || undefined} style={{ '--carril-acorde': carril, transform: moviendo ? `translateX(${arrastre.desplazamiento}px)` : undefined }}
          aria-label={`Cambiar acorde ${acorde?.nombre || 'no disponible'} en la letra`} aria-keyshortcuts="ArrowLeft ArrowRight"
          title="Mantené pulsado y mové dentro de esta línea"
          {...gesto} onPointerDown={evento => { setSeleccion(null); gesto.onPointerDown(evento) }}
          onClick={evento => { if (gesto.onClick(evento)) seleccionar(posicion, ancla.id) }}
          onKeyDown={evento => {
            if (!['ArrowLeft', 'ArrowRight'].includes(evento.key) || disabled) return
            evento.preventDefault(); evento.stopPropagation(); setSeleccion(null)
            const posiciones = [...caracteresConPosicion(verso.texto).map(c => verso.inicio + c.posicion), verso.fin]
            const indice = posiciones.indexOf(posicion)
            onMover(ancla.id, posiciones[Math.max(0, Math.min(posiciones.length - 1, indice + (evento.key === 'ArrowLeft' ? -1 : 1)))])
            requestAnimationFrame(() => [...(contenedor.current?.querySelectorAll('[data-ancla]') ?? [])].find(rotulo => rotulo.dataset.ancla === ancla.id)?.focus())
          }}
          className={`letra-acorde${acorde ? '' : ' letra-acorde-ausente'}`}
        >{nombre}</button> : <span key={ancla.id} data-ancla={ancla.id} style={{ '--carril-acorde': carril }} className="letra-acorde">{nombre}</span>
      })}
      {caracter}
    </span>
  }

  return (
    <div className="min-w-0">
      <div ref={contenedor} role={editable ? 'group' : undefined} aria-label={editable ? 'Ubicar acordes en la letra' : undefined}
        tabIndex={editable && !disabled ? 0 : undefined} onClick={alPulsar} onKeyDown={manejarTecla}
        className={`letra-con-acordes text-xs text-butter sm:text-sm${editable ? ' letra-con-acordes-editable' : ''}`}
      >
        {versos.map(verso => {
          const presentes = anclas.some(ancla => ancla.posicion >= verso.inicio && ancla.posicion <= verso.fin && (editable || porId.has(ancla.acordeId)))
          return <div key={verso.inicio} data-verso={verso.inicio} className={`letra-verso${presentes ? ' letra-verso-con-acordes' : ''}`}
            style={{ '--filas-acordes': distribucion[verso.inicio]?.cantidad ?? 1 }}
          >
            {caracteresConPosicion(verso.texto).map(c => dibujarCaracter(c.caracter, verso.inicio + c.posicion, c.caracter.length))}
            {dibujarCaracter('\u200B', verso.fin, 0)}
          </div>
        })}
      </div>
      {editable && elegida !== null && !disabled && <div role="group" aria-label="Acordes del tema para la letra" className="mt-2 w-fit max-w-full rounded-lg border border-borde bg-superficie p-2 shadow-lg">
        <header className="mb-1 flex items-center justify-between gap-3">
          <p className="text-xs text-butter-muted">Elegir acorde</p>
          <button type="button" data-cerrar-selector-acordes onClick={() => setSeleccion(null)} aria-label="Cerrar selector de acordes" className="accion-icono rounded-lg text-butter-muted hover:bg-fondo"><X /></button>
        </header>
        <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
          {acordes.map(acorde => <button key={acorde.id} type="button" aria-pressed={existente?.acordeId === acorde.id}
            onClick={() => { onAsignar(elegida, acorde.id, existente?.id); setSeleccion(null) }}
            className={`min-h-11 rounded-lg border px-3 text-sm text-nota-tonica hover:bg-fondo ${existente?.acordeId === acorde.id ? 'border-nota-tonica bg-fondo' : 'border-borde'}`}
          >{acorde.nombre || 'Sin nombre'}</button>)}
        </div>
        {!acordes.length && <p className="max-w-xs text-xs text-butter-muted">Cargá acordes en la pestaña ACORDES de este tema.</p>}
        {existente && <button type="button" onClick={() => { onEliminar(existente.id); setSeleccion(null) }} className="mt-2 min-h-11 rounded-lg border border-borde px-3 text-xs text-butter-muted hover:bg-fondo hover:text-butter">Eliminar acorde</button>}
      </div>}
    </div>
  )
}
