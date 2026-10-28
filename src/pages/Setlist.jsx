import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { setlistsDB, useSetlists } from '../hooks/useSetlists'
import { fechaSetlist, mensajeErrorSetlists } from '../lib/setlists'
import CancionesSetlist from '../components/CancionesSetlist'
import AgregarCancionesSetlist from '../components/AgregarCancionesSetlist'

export default function Setlist() {
  const { id } = useParams()
  const location = useLocation()
  const navegar = useNavigate()
  const { datos: setlist, setDatos, cargando, error, recargar } = useSetlists(id)
  // Incluso después de crear se abre en lectura. El selector inicial sólo agrega.
  const [edicion, setEdicion] = useState(false)
  const [selector, setSelector] = useState(Boolean(location.state?.agregarCanciones))
  const [pendientes, setPendientes] = useState(null)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [conflicto, setConflicto] = useState(false)
  const bloqueo = useRef(false)
  const scrollRestaurado = useRef(false)

  useEffect(() => {
    if (location.state?.agregarCanciones) {
      const { agregarCanciones: _inicial, ...estado } = location.state
      navegar(location.pathname, { replace: true, state: estado })
    }
  }, [location.pathname, location.state, navegar])

  useLayoutEffect(() => {
    if (!cargando && setlist && !scrollRestaurado.current) {
      const scroll = location.state?.setlistId === id ? location.state.setlistScroll : 0
      window.scrollTo(0, Number.isFinite(scroll) ? scroll : 0)
      scrollRestaurado.current = true
    }
  }, [cargando, setlist, id, location.state])

  // Mientras se guarda no se debe cerrar la página creyendo que ya terminó.
  useEffect(() => {
    if (!pendientes) return
    const salir = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', salir)
    return () => window.removeEventListener('beforeunload', salir)
  }, [pendientes])

  async function guardar(items) {
    if (bloqueo.current || conflicto) return false
    bloqueo.current = true
    setPendientes(items)
    setErrorGuardado('')
    try {
      const guardado = await setlistsDB.guardar(setlist, items)
      setDatos(guardado)
      return true
    } catch (error) {
      setErrorGuardado(mensajeErrorSetlists(error))
      // Una respuesta perdida puede haber confirmado el guardado: no reescribir
      // con una revisión vieja. Se exige releer tras cualquier fallo.
      setConflicto(true)
      return false
    } finally {
      bloqueo.current = false
      setPendientes(null)
    }
  }

  const ocupado = pendientes !== null
  const items = pendientes ?? setlist?.items ?? []
  const atras = <Link to="/setlists" onClick={e => { if (bloqueo.current) e.preventDefault() }} aria-disabled={ocupado} className="accion-plana inline-flex min-h-11 w-fit items-center gap-1 rounded-lg px-2 text-sm"><ChevronLeft size={20} /> ATRÁS</Link>
  return <main className="min-h-dvh flex flex-col px-4 sm:px-6 lg:px-8 pt-6 pb-8">
    {atras}
    {cargando ? <p className="mt-8 text-center text-butter-muted">Cargando…</p>
      : error ? <div role="alert" className="mt-6 text-butter-muted"><p>{error}</p><button onClick={recargar} className="mt-3 min-h-11 rounded-lg border border-borde px-4">REINTENTAR</button></div>
        : !setlist ? <p className="mt-8 text-center text-butter-muted">No se encontró el setlist.</p>
          : <div className="mx-auto w-full max-w-3xl">
            <header className="my-5 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0"><h1 className="break-words text-xl text-butter">{setlist.title}</h1><p className="mt-1 text-sm text-butter-muted">{fechaSetlist(setlist.date)}</p>{setlist.place && <p className="break-words text-sm text-butter-muted">{setlist.place}</p>}</div>
              <button type="button" disabled={ocupado} onClick={() => setEdicion(!edicion)} className="boton-funcion rounded-lg px-4 py-2 text-sm">{edicion ? 'LISTO' : 'EDITAR'}</button>
            </header>
            {errorGuardado && <div role="alert" className="mb-4 text-sm text-butter-muted"><p>{errorGuardado}</p>
              <button onClick={async () => { setSelector(false); setEdicion(false); setErrorGuardado(''); await recargar(); setConflicto(false) }} className="mt-2 min-h-11 rounded-lg border border-borde px-3 hover:bg-superficie">RECARGAR SETLIST</button>
            </div>}
            {edicion && <button type="button" disabled={ocupado || conflicto} onClick={() => setSelector(true)} className="boton-funcion mb-4 inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm"><Plus size={18} /> AGREGAR CANCIONES</button>}
            <p role="status" className="mb-3 text-xs text-butter-muted">{ocupado ? 'Guardando…' : edicion ? 'Los cambios se guardan automáticamente.' : `${items.length} ${items.length === 1 ? 'tema' : 'temas'}`}</p>
            {items.length ? <CancionesSetlist items={items} setlistId={id} edicion={edicion} ocupado={ocupado || conflicto} onGuardar={guardar}
              onAbrir={e => {
                if (bloqueo.current) { e.preventDefault(); return }
                // El Link se renderizó antes del último scroll: actualizar el
                // estado del destino sin escribir contenido en almacenamiento.
                const destino = new URL(e.currentTarget.href)
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault()
                  navegar(destino.pathname + destino.search, { state: { setlistScroll: window.scrollY, setlistId: id } })
                }
              }} /> : <p className="mt-4 text-center text-butter-muted">Este setlist todavía no tiene canciones.</p>}
            {selector && <AgregarCancionesSetlist items={items} ocupado={ocupado} bloqueado={conflicto} error={errorGuardado} onCerrar={() => setSelector(false)}
              onAgregar={tema => guardar([...setlist.items, { id: crypto.randomUUID(), song_id: tema.id, nombre: tema.nombre, artista: tema.artista }])} />}
          </div>}
  </main>
}
