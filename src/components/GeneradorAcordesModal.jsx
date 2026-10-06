import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Diapason from './Diapason'
import { filtrarAcordes } from '../lib/catalogoAcordes'
import { generarPosiciones, interpretarAcorde, propuestaAEditable } from '../lib/generadorAcordes'

const estiloSelector = (activo) => `rounded-lg border px-1.5 py-1.5 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-butter sm:px-2 sm:text-xs ${activo
  ? 'border-teal bg-teal text-butter'
  : 'border-borde bg-fondo text-butter-muted hover:border-teal hover:text-butter'}`

function Selector({ titulo, opciones, valor, onChange, className = '', compacto = false, filaMovil = false }) {
  return (
    <fieldset className={`min-w-0 ${className}`}>
      <legend className="mb-1 text-xs uppercase tracking-wide text-butter-muted">{titulo}</legend>
      <div className={filaMovil ? 'grid grid-cols-4 gap-1 sm:grid-cols-2' : compacto ? `grid ${opciones.length === 5 ? 'grid-cols-3' : 'grid-cols-2'} gap-1` : 'flex flex-wrap gap-1'}>
        {opciones.map((opcion) => (
          <button key={opcion} type="button" aria-pressed={valor === opcion} onClick={() => onChange(opcion)} className={estiloSelector(valor === opcion)}>
            {opcion.replaceAll('–', '')}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function GeneradorAcordesModal({ onCerrar, onElegir, onEditar, guardando = false, errorGuardado = '' }) {
  const dialogo = useRef(null)
  const lista = useRef(null)
  const diapasón = useRef(null)
  const id = useId()
  const [consulta, setConsulta] = useState('')
  const [acorde, setAcorde] = useState(null)
  const [abierto, setAbierto] = useState(false)
  const [indice, setIndice] = useState(0)
  const [cuerdas, setCuerdas] = useState('AUTO')
  const [cantidadCuerdas, setCantidadCuerdas] = useState(3)
  const [bajo, setBajo] = useState(false)
  const [zona, setZona] = useState('TODAS')
  const [posicion, setPosicion] = useState(0)
  const interpretado = useMemo(() => interpretarAcorde(consulta), [consulta])
  const catalogo = filtrarAcordes(consulta)
  const opciones = interpretado && !catalogo.some(({ nombre }) => nombre === interpretado.nombre)
    ? [interpretado, ...catalogo] : catalogo
  const bajoActivo = bajo || Boolean(interpretado?.bajo)
  const propuestas = useMemo(() => generarPosiciones(interpretado, { cuerdas, cantidadCuerdas, zona, bajo }), [interpretado, cuerdas, cantidadCuerdas, zona, bajo])
  const propuesta = propuestas[posicion]

  function cambiarFiltro(setter, valor) {
    setter(valor)
    setPosicion(0)
  }

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogo.current.showModal()
    // El diálogo recibe el foco sin activar el autocomplete al abrir.
    return () => {
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  useEffect(() => {
    if (abierto) lista.current?.children[indice]?.scrollIntoView({ block: 'nearest' })
  }, [indice, abierto])

  useEffect(() => {
    const contenedor = diapasón.current
    if (!propuesta || !contenedor) return
    const marcadores = [...contenedor.querySelectorAll('.diagrama-nota')]
    if (!marcadores.length) return
    const izquierda = contenedor.getBoundingClientRect().left
    const extremos = marcadores.map((marcador) => marcador.getBoundingClientRect())
    const centro = (Math.min(...extremos.map((r) => r.left)) + Math.max(...extremos.map((r) => r.right))) / 2
    contenedor.scrollTo({ left: contenedor.scrollLeft + centro - izquierda - contenedor.clientWidth / 2 })
  }, [propuesta])

  function seleccionar(opcion) {
    setAcorde(opcion)
    setConsulta(opcion.nombre)
    setAbierto(false)
    setIndice(0)
    setPosicion(0)
  }

  function manejarTecla(evento) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      setAbierto(true)
      const paso = evento.key === 'ArrowDown' ? 1 : -1
      setIndice((actual) => abierto ? Math.max(0, Math.min(opciones.length - 1, actual + paso)) : 0)
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      if (abierto && opciones[indice]) seleccionar(opciones[indice])
      else if (interpretado) seleccionar(interpretado)
    } else if (evento.key === 'Escape' && abierto) {
      evento.preventDefault()
      evento.stopPropagation()
      setAbierto(false)
    }
  }

  return (
    <dialog
      ref={dialogo}
      tabIndex={-1}
      autoFocus
      aria-labelledby={`${id}-titulo`}
      onCancel={(evento) => { evento.preventDefault(); if (!guardando) onCerrar() }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-6xl overflow-y-auto rounded-xl border border-borde bg-superficie p-4 text-butter shadow-2xl backdrop:bg-black/70 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={`${id}-titulo`} className="text-lg">Generador de acordes</h2>
        <button type="button" onClick={onCerrar} disabled={guardando} aria-label="Cerrar generador de acordes" className="rounded-lg p-2 text-butter-muted hover:bg-fondo hover:text-butter"><X size={20} /></button>
      </div>

      <fieldset disabled={guardando} className="mb-3 flex min-w-0 flex-wrap items-end gap-x-4 gap-y-3">
        <div className="relative order-1 w-36 shrink-0 sm:w-44" onBlur={(evento) => {
          if (!evento.currentTarget.contains(evento.relatedTarget)) setAbierto(false)
        }}>
          <div className="relative">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-butter-muted" />
            <input
              role="combobox"
              aria-label="Buscar acorde"
              aria-autocomplete="list"
              aria-expanded={abierto}
              aria-controls={`${id}-lista`}
              aria-activedescendant={abierto && opciones[indice] ? `${id}-opcion-${indice}` : undefined}
              autoComplete="off"
              spellCheck={false}
              value={consulta}
              placeholder="Acorde"
              onFocus={() => setAbierto(true)}
              onClick={() => setAbierto(true)}
              onChange={(evento) => { setConsulta(evento.target.value); setAcorde(null); setIndice(0); setPosicion(0); setAbierto(true) }}
              onKeyDown={manejarTecla}
              className="w-full rounded-lg border border-borde bg-fondo py-2 pl-9 pr-3 text-sm text-butter placeholder:text-butter-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
            />
          </div>
          {abierto && (
            <div className="absolute left-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-borde bg-superficie shadow-xl">
              <ul ref={lista} id={`${id}-lista`} role="listbox" aria-label="Acordes" className="max-h-52 overflow-y-auto overscroll-contain p-1">
                {opciones.map((opcion, i) => (
                  <li
                    key={opcion.nombre}
                    id={`${id}-opcion-${i}`}
                    role="option"
                    aria-selected={acorde?.nombre === opcion.nombre}
                    onPointerDown={(evento) => evento.preventDefault()}
                    onClick={() => seleccionar(opcion)}
                    className={`cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-teal ${i === indice ? 'bg-teal text-butter' : 'text-butter-muted'}`}
                  >{opcion.nombre}</li>
                ))}
              </ul>
              {opciones.length === 0 && <p role="status" className="px-3 py-2 text-sm text-butter-muted">Sin coincidencias</p>}
            </div>
          )}
        </div>
        <div className="order-3 grid w-full grid-cols-2 gap-3 sm:w-auto lg:order-2">
          {[3, 4].map((cantidad) => (
            <Selector
              key={cantidad}
              compacto
              titulo={`${cantidad} CUERDAS`}
              opciones={cantidad === 3 ? ['AUTO', '1–2–3', '2–3–4', '3–4–5', '4–5–6'] : ['AUTO', '1–2–3–4', '2–3–4–5', '3–4–5–6']}
              valor={cantidadCuerdas === cantidad ? cuerdas : null}
              onChange={(valor) => { setCantidadCuerdas(cantidad); cambiarFiltro(setCuerdas, valor) }}
            />
          ))}
        </div>
        <button type="button" role="switch" aria-checked={bajoActivo} disabled={Boolean(interpretado?.bajo)} onClick={() => cambiarFiltro(setBajo, !bajo)} className={`${estiloSelector(bajoActivo)} order-2 flex items-center gap-2 lg:order-3`}>
          <span aria-hidden="true" className={`flex h-3.5 w-6 items-center rounded-full px-0.5 ${bajoActivo ? 'bg-butter' : 'bg-borde'}`}>
            <span className={`h-2.5 w-2.5 rounded-full transition-transform ${bajoActivo ? 'translate-x-2.5 bg-teal' : 'bg-butter-muted'}`} />
          </span>
          BAJO
        </button>
        <Selector className="order-4" filaMovil titulo="ZONA" opciones={['ABIERTA', 'MEDIA', 'AGUDA', 'TODAS']} valor={zona} onChange={(valor) => cambiarFiltro(setZona, valor)} />
      </fieldset>

      <div className="rounded-lg border border-borde bg-fondo/40 p-3 sm:p-5">
        <div ref={diapasón} className="overflow-x-auto pb-2 pt-3" tabIndex={0} role="region" aria-label="Diapasón de la propuesta">
          <Diapason
            etiqueta={interpretado ? `Diapasón de ${interpretado.nombre}` : `Diapasón para posiciones de ${cantidadCuerdas} cuerdas`}
            obtenerMarcador={(cuerda, traste) => {
              if (!propuesta) return null
              if (propuesta.bajo?.cuerda === cuerda && propuesta.bajo.traste === traste) return propuesta.bajo
              if (propuesta.opcional?.cuerda === cuerda && propuesta.opcional.traste === traste) return propuesta.opcional
              return propuesta.principal.find((nota) => nota.cuerda === cuerda && nota.traste === traste)
            }}
          />
        </div>
        {consulta.trim() && !interpretado && <p role="status" className="mt-2 text-center text-sm text-butter-muted">Acorde no reconocido</p>}
        {interpretado && !propuesta && <p role="status" className="mt-2 text-center text-sm text-butter-muted">Sin posiciones para estos filtros</p>}
        {propuesta?.opcional && <p className="mt-2 text-center text-xs text-butter-muted">Círculo sin relleno: tónica opcional para completar el acorde.</p>}
      </div>
      {errorGuardado && <p role="alert" className="mt-4 text-sm text-butter-muted">{errorGuardado}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" disabled={guardando || !propuesta || posicion === 0} onClick={() => setPosicion((actual) => actual - 1)} aria-label="Posición anterior" className="rounded-lg border border-borde p-1.5 text-butter-muted hover:bg-fondo disabled:opacity-40 sm:p-2"><ChevronLeft size={20} /></button>
          <span aria-live="polite" aria-atomic="true" aria-label={`Posición ${propuesta ? posicion + 1 : 0} de ${propuestas.length}`} className="min-w-10 text-center text-sm tabular-nums text-butter-muted sm:min-w-12">{propuesta ? posicion + 1 : 0} / {propuestas.length}</span>
          <button type="button" disabled={guardando || !propuesta || posicion === propuestas.length - 1} onClick={() => setPosicion((actual) => actual + 1)} aria-label="Posición siguiente" className="rounded-lg border border-borde p-1.5 text-butter-muted hover:bg-fondo disabled:opacity-40 sm:p-2"><ChevronRight size={20} /></button>
        </div>
        <div className="ml-auto flex gap-1 sm:gap-2">
          <button type="button" disabled={guardando || !propuesta || !onEditar} onClick={() => onEditar(propuestaAEditable(interpretado, propuesta))} className="rounded-lg border border-borde px-2 py-2.5 text-xs text-butter-muted hover:bg-fondo disabled:opacity-40 sm:px-3">EDITAR</button>
          <button type="button" disabled={guardando || !propuesta || !onElegir} onClick={() => onElegir(propuestaAEditable(interpretado, propuesta))} className="rounded-lg bg-teal px-2 py-2.5 text-xs text-butter hover:bg-green disabled:opacity-40 sm:px-4">{guardando ? 'GUARDANDO…' : 'ELEGIR'}</button>
        </div>
      </div>
    </dialog>
  )
}
