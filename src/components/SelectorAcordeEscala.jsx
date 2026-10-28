import { Plus, Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { filtrarAcordes } from '../lib/catalogoAcordes'
import { interpretarAcorde } from '../lib/generadorAcordes'

export default function SelectorAcordeEscala({ onAgregar }) {
  const [consulta, setConsulta] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [indice, setIndice] = useState(0)
  const entrada = useRef(null)
  const lista = useRef(null)
  const id = useId()
  const interpretado = interpretarAcorde(consulta)
  const catalogo = consulta.trim() ? filtrarAcordes(consulta) : []
  const opciones = interpretado && !catalogo.some(opcion => opcion.nombre === interpretado.nombre)
    ? [interpretado, ...catalogo] : catalogo
  const mostrar = abierto && Boolean(consulta.trim())

  useEffect(() => {
    if (mostrar) lista.current?.children[indice]?.scrollIntoView({ block: 'nearest' })
  }, [indice, mostrar])

  function agregar(opcion) {
    if (!opcion) return
    onAgregar(opcion.nombre)
    setConsulta('')
    setIndice(0)
    entrada.current.focus()
    setAbierto(false)
  }

  function manejarTecla(evento) {
    if (['ArrowDown', 'ArrowUp'].includes(evento.key)) {
      evento.preventDefault()
      setAbierto(true)
      const paso = evento.key === 'ArrowDown' ? 1 : -1
      setIndice(actual => mostrar ? Math.max(0, Math.min(opciones.length - 1, actual + paso)) : 0)
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      agregar(mostrar ? opciones[indice] : interpretado)
    } else if (evento.key === 'Escape') {
      evento.preventDefault()
      evento.stopPropagation()
      setAbierto(false)
    } else if (evento.key === 'Tab') {
      setAbierto(false)
    }
  }

  return (
    <div className="relative flex shrink-0 items-center gap-1" onKeyDown={manejarTecla}
      onBlur={evento => { if (!evento.currentTarget.contains(evento.relatedTarget)) setAbierto(false) }}
    >
      <div className="relative w-28">
        <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-butter-muted" />
        <input ref={entrada} role="combobox" aria-label="Buscar acorde para destacar"
          aria-autocomplete="list" aria-expanded={mostrar} aria-controls={`${id}-lista`}
          aria-activedescendant={mostrar && opciones[indice] ? `${id}-opcion-${indice}` : undefined}
          autoComplete="off" spellCheck={false} value={consulta} placeholder="Acorde"
          onFocus={() => setAbierto(true)}
          onChange={evento => { setConsulta(evento.target.value); setIndice(0); setAbierto(true) }}
          className="min-h-11 w-full rounded-lg border border-borde bg-fondo py-2 pl-8 pr-2 text-sm text-butter placeholder:text-butter-muted focus:border-teal focus:outline-none"
        />
      </div>
      <button type="button" onClick={() => agregar(interpretado)} disabled={!interpretado} aria-label="Agregar acorde a la escala" className="boton-funcion boton-funcion-compacto accion-icono rounded-lg"><Plus size={16} /></button>
      {mostrar && <div className="absolute inset-x-0 bottom-full z-20 mb-2 rounded-lg border border-borde bg-superficie p-1 shadow-xl">
        <ul ref={lista} id={`${id}-lista`} role="listbox" aria-label="Opciones de acordes" className="max-h-48 overflow-y-auto overscroll-contain">
          {opciones.map((opcion, i) => <li key={opcion.nombre} role="presentation">
            <button id={`${id}-opcion-${i}`} type="button" role="option" aria-selected={i === indice}
              tabIndex={-1} onClick={() => agregar(opcion)}
              className={`min-h-11 w-full rounded-md px-3 py-2 text-left text-sm hover:bg-teal hover:text-butter ${i === indice ? 'bg-teal text-butter' : 'text-butter-muted'}`}
            >{opcion.nombre}</button>
          </li>)}
        </ul>
        {!opciones.length && <p role="status" className="px-3 py-2 text-sm text-butter-muted">Sin coincidencias</p>}
      </div>}
    </div>
  )
}
