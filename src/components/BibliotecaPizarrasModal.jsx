import { Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import ConfirmarEliminacionModal from './ConfirmarEliminacionModal'
import DialogoPizarra, { botonPizarra } from './DialogoPizarra'
import MenuSetlist from './MenuSetlist'
import ModalProyectoPizarra from './ModalProyectoPizarra'
import { pizarrasDB } from '../hooks/usePizarra'
import { mensajeProyectoPizarra } from '../lib/proyectosPizarra'
import { fechaSetlist } from '../lib/setlists'

const fechaModificacion = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })
const paraBuscar = texto => texto.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function BibliotecaPizarrasModal({ onCerrar, onAbrir, onRenombrar, onEliminar }) {
  const [pizarras, setPizarras] = useState([])
  const [consulta, setConsulta] = useState('')
  const [cargando, setCargando] = useState(true)
  const [abriendo, setAbriendo] = useState(false)
  const [error, setError] = useState('')
  const [accion, setAccion] = useState(null)
  const solicitud = useRef(0)
  const bloqueo = useRef(false)

  const recargar = useCallback(async () => {
    const numero = ++solicitud.current
    setCargando(true)
    setError('')
    try {
      const datos = await pizarrasDB.listar()
      if (numero === solicitud.current) setPizarras(datos)
    } catch (error) {
      if (numero === solicitud.current) setError(mensajeProyectoPizarra(error))
    } finally {
      if (numero === solicitud.current) setCargando(false)
    }
  }, [])

  useEffect(() => {
    recargar()
    // El contador invalida cualquier lectura pendiente al cerrar la biblioteca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { solicitud.current++ }
  }, [recargar])

  async function abrir(proyecto) {
    if (bloqueo.current) return
    bloqueo.current = true
    setAbriendo(true)
    setError('')
    try {
      await onAbrir(proyecto)
    } catch (error) {
      setError(mensajeProyectoPizarra(error))
    } finally {
      bloqueo.current = false
      setAbriendo(false)
    }
  }

  async function guardarFicha(ficha) {
    const { modo, proyecto } = accion
    if (modo === 'renombrar') {
      const nuevo = await pizarrasDB.renombrar(proyecto, ficha)
      onRenombrar(proyecto, nuevo)
    } else {
      await pizarrasDB.duplicar(proyecto, ficha)
    }
    await recargar()
  }

  const filtradas = pizarras.filter(proyecto => paraBuscar(proyecto.titulo).includes(paraBuscar(consulta)))
  return <>
    <DialogoPizarra titulo="Pizarras guardadas" onCerrar={onCerrar} ocupado={abriendo} amplio>
      <div className="relative mb-4">
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-butter-muted" />
        <input type="search" value={consulta} onChange={e => setConsulta(e.target.value)} aria-label="Buscar pizarra por título" placeholder="Buscar pizarra…"
          className="min-h-11 w-full min-w-0 rounded-lg border border-borde bg-fondo py-2 pl-10 pr-3 text-base text-butter placeholder:text-butter-muted focus:border-teal focus:outline-none" />
      </div>
      {error && <div role="alert" className="mb-3 space-y-2 text-sm text-butter-muted">
        <p>{error}</p><button type="button" disabled={abriendo || cargando} onClick={recargar} className={botonPizarra}>Actualizar lista</button>
      </div>}
      {(cargando || abriendo) && <p role="status" className="py-2 text-sm text-butter-muted">{abriendo ? 'Abriendo pizarra…' : 'Cargando pizarras…'}</p>}
      {!cargando && !error && !filtradas.length && <p role="status" className="py-2 text-sm text-butter-muted">{pizarras.length ? 'No hay resultados.' : 'Todavía no hay pizarras guardadas.'}</p>}
      <ul className="grid min-w-0 gap-2 sm:grid-cols-2" aria-label="Biblioteca de pizarras">
        {filtradas.map(proyecto => <li key={proyecto.id} className="tarjeta-enlace flex min-w-0 items-start rounded-lg">
          <button type="button" disabled={abriendo || cargando} onClick={() => abrir(proyecto)}
            className="min-w-0 flex-1 rounded-lg p-3 text-left focus-visible:outline-2 focus-visible:outline-butter disabled:opacity-50">
            <span className="block break-words text-butter">{proyecto.titulo}</span>
            {proyecto.fecha && <span className="mt-1 block text-xs text-butter-muted">{fechaSetlist(proyecto.fecha)}</span>}
            <span className="mt-1 block text-xs text-butter-muted">Modificada el {fechaModificacion.format(new Date(proyecto.updated_at))}</span>
          </button>
          <MenuSetlist nombre={proyecto.titulo} disabled={abriendo || cargando} acciones={[
            { texto: 'Renombrar', ejecutar: () => setAccion({ modo: 'renombrar', proyecto }) },
            { texto: 'Duplicar', ejecutar: () => setAccion({ modo: 'duplicar', proyecto }) },
            { texto: 'Eliminar', ejecutar: () => setAccion({ modo: 'eliminar', proyecto }) },
          ]} />
        </li>)}
      </ul>
    </DialogoPizarra>
    {accion?.modo === 'eliminar' && <ConfirmarEliminacionModal
      mensaje={`¿Eliminar «${accion.proyecto.titulo}» de la biblioteca?`} destructiva
      onCancelar={() => setAccion(null)} onConfirmar={async () => {
        try {
          await pizarrasDB.eliminar(accion.proyecto)
          onEliminar(accion.proyecto.id)
          await recargar()
          return true
        } catch (error) {
          setError(mensajeProyectoPizarra(error))
          return false
        }
      }} />}
    {accion && accion.modo !== 'eliminar' && <ModalProyectoPizarra {...accion} onCerrar={() => setAccion(null)} onGuardarFicha={guardarFicha} />}
  </>
}
