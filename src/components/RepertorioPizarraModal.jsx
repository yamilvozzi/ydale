import { Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTemas } from '../hooks/useTemas'
import { supabase } from '../lib/supabaseClient'
import { leerMusicaTema } from '../lib/musicaRepertorio'
import { etiquetaTipo } from '../lib/escalas'

export default function RepertorioPizarraModal({ onCerrar, onCargar, contieneElementos, errorGuardado = '' }) {
  const { temas, cargando, error, recargar } = useTemas()
  const [consulta, setConsulta] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [vista, setVista] = useState({ musica: null, cargando: false, error: '' })
  const [intento, setIntento] = useState(0)
  const [confirmar, setConfirmar] = useState(false)
  const dialogo = useRef(null)
  const buscador = useRef(null)
  const cancelar = useRef(null)
  const cargar = useRef(null)
  const id = useId()
  const q = consulta.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const filtrados = temas.filter(tema => tema.nombre.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q))
  const musica = vista.musica
  const hayMusica = Boolean(musica && (musica.escalas.length || musica.acordes.length))

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    const modal = dialogo.current
    document.body.style.overflow = 'hidden'
    modal.showModal()
    buscador.current.focus()
    return () => {
      modal.close()
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  useEffect(() => {
    if (!seleccionado) return
    let vigente = true
    leerMusicaTema(supabase, seleccionado.id).then(
      musica => { if (vigente) setVista({ musica, cargando: false, error: '' }) },
      error => { if (vigente) setVista({ musica: null, cargando: false, error: error.message }) },
    )
    return () => { vigente = false }
  }, [seleccionado, intento])

  useEffect(() => {
    if (confirmar) cancelar.current?.focus()
    else cargar.current?.focus()
  }, [confirmar])

  function elegir(tema) {
    setVista({ musica: null, cargando: true, error: '' })
    setConfirmar(false)
    setSeleccionado(tema)
    setIntento(actual => actual + 1)
  }

  function reintentar() {
    setVista({ musica: null, cargando: true, error: '' })
    setIntento(actual => actual + 1)
  }

  function confirmarCarga() {
    if (hayMusica && onCargar(musica)) onCerrar()
  }

  return (
    <dialog ref={dialogo} aria-labelledby={`${id}-titulo`}
      onCancel={evento => { evento.preventDefault(); if (confirmar) setConfirmar(false); else onCerrar() }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-xl border border-borde bg-superficie p-5 text-butter shadow-2xl backdrop:bg-black/70 sm:p-6"
    >
      <header className="mb-5 flex items-center justify-between gap-4">
        <h2 id={`${id}-titulo`} className="text-lg modal-titulo">Repertorio</h2>
        <button type="button" onClick={onCerrar} aria-label="Cerrar repertorio" className="accion-icono rounded-lg text-butter-muted hover:bg-fondo hover:text-butter"><X size={20} /></button>
      </header>
      {!confirmar && <>
        <div className="relative mb-3">
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-butter-muted" />
          <input ref={buscador} value={consulta} onChange={evento => setConsulta(evento.target.value)} aria-label="Buscar tema por nombre" placeholder="Buscar tema…" className="min-h-11 w-full rounded-lg border border-borde bg-fondo py-2 pl-10 pr-3 text-sm text-butter placeholder:text-butter-muted focus:border-teal focus:outline-none" />
        </div>
        {cargando ? <p role="status" className="py-4 text-sm text-butter-muted">Cargando temas…</p>
          : error ? <div role="alert" className="py-3 text-sm text-butter-muted"><p>No se pudo cargar el repertorio.</p><button type="button" onClick={recargar} className="mt-2 min-h-11 rounded-lg border border-borde px-3 hover:text-butter">Reintentar</button></div>
          : !filtrados.length ? <p role="status" className="py-4 text-sm text-butter-muted">{temas.length ? 'No hay resultados.' : 'Todavía no hay temas cargados.'}</p>
          : <ul aria-label="Temas de repertorio" className="mb-4 max-h-52 space-y-1 overflow-y-auto overscroll-contain">
            {filtrados.map(tema => <li key={tema.id}><button type="button" aria-pressed={seleccionado?.id === tema.id} onClick={() => elegir(tema)} className={`min-h-11 w-full rounded-lg border px-3 py-2 text-left text-sm ${seleccionado?.id === tema.id ? 'border-teal bg-teal text-butter' : 'border-transparent text-butter-muted hover:bg-fondo hover:text-butter'}`}>{tema.nombre}</button></li>)}
          </ul>}
      </>}
      {seleccionado && <section aria-label="Vista previa del tema" aria-busy={vista.cargando} className="rounded-lg border border-borde bg-fondo/40 p-4">
        <h3 className="mb-2 break-words text-base text-butter">{musica?.nombre ?? seleccionado.nombre}</h3>
        {vista.cargando ? <p role="status" className="text-sm text-butter-muted">Cargando información musical…</p>
          : vista.error ? <div role="alert" className="text-sm text-butter-muted"><p>{vista.error}</p><button type="button" onClick={reintentar} className="mt-2 min-h-11 rounded-lg border border-borde px-3 hover:text-butter">Reintentar</button></div>
          : musica && <div className="space-y-2 break-words text-sm text-butter-muted">
            <p><span className="text-butter">Escala: </span>{musica.escalas.length ? musica.escalas.map(escala => `${escala.tonica}${escala.tipo === 'menor' ? 'm' : ''} / ${etiquetaTipo(escala.tipo)}`).join(' · ') : 'Sin escala cargada'}</p>
            <p><span className="text-butter">Acordes: </span>{musica.acordes.length ? musica.acordes.map(acorde => acorde.nombre || 'Sin nombre').join(' · ') : 'Sin acordes guardados'}</p>
            {!hayMusica && <p>Este tema no tiene escalas ni acordes para cargar.</p>}
          </div>}
      </section>}
      {confirmar && <p role="alert" className="mt-4 rounded-lg border border-borde bg-fondo p-4 text-sm text-butter">La Pizarra contiene elementos. Cargar este tema reemplazará el contenido actual.</p>}
      {errorGuardado && <p role="alert" className="mt-4 text-sm text-butter-muted">{errorGuardado}</p>}
      <footer className="mt-5 flex justify-end gap-2">
        <button ref={cancelar} type="button" onClick={() => confirmar ? setConfirmar(false) : onCerrar()} className="min-h-11 rounded-lg border border-borde px-4 text-sm text-butter-muted hover:bg-fondo hover:text-butter">Cancelar</button>
        <button ref={cargar} type="button" disabled={!hayMusica || vista.cargando} onClick={() => contieneElementos && !confirmar ? setConfirmar(true) : confirmarCarga()} className="min-h-11 rounded-lg bg-teal px-4 text-sm text-butter hover:bg-green disabled:opacity-40">{confirmar ? 'Cargar' : 'CARGAR EN PIZARRA'}</button>
      </footer>
    </dialog>
  )
}
