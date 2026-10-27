import { useEffect, useId, useRef, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { useTemas } from '../hooks/useTemas'

const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function AgregarCancionesSetlist({ onCerrar, onAgregar, ocupado, bloqueado, error, items }) {
  const dialogo = useRef(null)
  const ocupadoRef = useRef(ocupado)
  ocupadoRef.current = ocupado
  const id = useId()
  const { temas, cargando, error: errorTemas, recargar } = useTemas()
  const [busqueda, setBusqueda] = useState('')
  const [anuncio, setAnuncio] = useState('')
  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogo.current.showModal()
    return () => {
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])
  const q = normalizar(busqueda.trim())
  const filtrados = temas.filter(t => normalizar(`${t.nombre} ${t.artista ?? ''}`).includes(q))
  return <dialog ref={dialogo} aria-labelledby={`${id}-titulo`}
    onCancel={e => { e.preventDefault(); if (!ocupadoRef.current) onCerrar() }}
    className="fixed inset-0 m-auto flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-lg flex-col rounded-xl border border-borde bg-superficie p-5 text-butter shadow-2xl backdrop:bg-black/70">
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 id={`${id}-titulo`} className="text-lg modal-titulo">Agregar canciones</h2>
      <button type="button" disabled={ocupado} aria-label="Cerrar selector de canciones" onClick={onCerrar} className="accion-icono rounded-lg hover:bg-borde disabled:opacity-50"><X /></button>
    </div>
    <label className="relative mb-3 block">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-butter-muted" />
      <input autoFocus aria-label="Buscar canciones" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full rounded-lg border border-borde bg-fondo py-3 pl-10 pr-3 text-butter placeholder-butter-muted focus:outline-none focus:border-teal" />
    </label>
    <p className="mb-3 text-sm text-butter-muted">{items.length} {items.length === 1 ? 'tema en el setlist' : 'temas en el setlist'}</p>
    {error && <p role="alert" className="mb-3 text-sm text-butter-muted">{error}</p>}
    <p role="status" className="sr-only">{anuncio}</p>
    <div className="min-h-0 overflow-y-auto">
      {cargando ? <p className="py-4 text-center text-butter-muted">Cargando…</p>
        : errorTemas ? <div role="alert" className="text-sm text-butter-muted">No se pudo cargar Repertorio. <button onClick={recargar} className="min-h-11 px-3 text-butter">REINTENTAR</button></div>
          : filtrados.length === 0 ? <p className="py-4 text-center text-butter-muted">{temas.length ? 'No hay resultados.' : 'Todavía no hay temas en Repertorio.'}</p>
            : <ul className="flex flex-col gap-2">
              {filtrados.map(t => <li key={t.id} className="flex items-center gap-2 rounded-lg bg-fondo px-3 py-2">
                <div className="min-w-0 flex-1"><p className="break-words">{t.nombre}</p>{t.artista && <p className="break-words text-xs text-butter-muted">{t.artista}</p>}</div>
                <button type="button" disabled={ocupado || bloqueado} aria-label={`Agregar ${t.nombre}`} onClick={async () => {
                  if (await onAgregar(t)) setAnuncio(`${t.nombre} agregada al final del setlist.`)
                }} className="accion-icono rounded-lg bg-teal hover:bg-green disabled:opacity-50"><Plus /></button>
              </li>)}
            </ul>}
    </div>
    <button type="button" disabled={ocupado} onClick={onCerrar} className="mt-4 min-h-11 self-end rounded-lg bg-teal px-4 py-2 text-sm hover:bg-green disabled:opacity-50">{ocupado ? 'Guardando…' : 'LISTO'}</button>
  </dialog>
}
