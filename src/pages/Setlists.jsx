import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import EncabezadoSeccion from '../components/EncabezadoSeccion'
import ModalSetlist from '../components/ModalSetlist'
import MenuSetlist from '../components/MenuSetlist'
import ConfirmarEliminacionModal from '../components/ConfirmarEliminacionModal'
import { setlistsDB, useSetlists } from '../hooks/useSetlists'
import { fechaSetlist, mensajeErrorSetlists } from '../lib/setlists'

export default function Setlists() {
  const { datos: setlists, cargando, error, recargar } = useSetlists()
  const [modal, setModal] = useState(null)
  const [eliminar, setEliminar] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')
  const navegar = useNavigate()

  async function guardar(evento) {
    if (modal.editando) {
      await setlistsDB.editarDatos(modal.original, evento)
      setModal(null)
      await recargar()
      return
    }
    const nuevo = modal.original
      ? await setlistsDB.duplicar(modal.original.id, evento)
      : await setlistsDB.guardar({ ...evento, id: crypto.randomUUID(), revision: null }, [])
    setModal(null)
    navegar(`/setlists/${nuevo.id}`, { state: { agregarCanciones: true } })
  }

  return <main className="min-h-dvh flex flex-col px-4 sm:px-6 lg:px-8 pt-6 pb-8">
    <EncabezadoSeccion titulo="SETLISTS" />
    <div className="mx-auto mb-4 w-full max-w-6xl">
      <div className="flex justify-end">
        <button onClick={() => setModal({})} className="boton-funcion inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm"><Plus size={18} /> SETLIST</button>
      </div>
    </div>
    {(error || errorAccion) && <div role="alert" className="mb-4 text-sm text-butter-muted">
      <p>{error || errorAccion}</p>
      <button onClick={() => { setErrorAccion(''); recargar() }} className="mt-2 min-h-11 rounded-lg border border-borde px-3 hover:bg-superficie">REINTENTAR</button>
    </div>}
    {cargando ? <p className="mt-8 text-center text-butter-muted">Cargando…</p>
      : !error && (setlists.length ? <ul className="mx-auto flex w-full max-w-6xl flex-wrap justify-center gap-3">
        {setlists.map(setlist => {
          const cantidad = setlist.setlist_songs?.[0]?.count ?? 0
          return <li key={setlist.id} className="tarjeta-enlace flex w-full min-w-0 max-w-[22rem] items-stretch rounded-lg">
            <Link to={`/setlists/${setlist.id}`} className="min-w-0 flex-1 rounded-lg px-4 py-4 focus-visible:outline-2 focus-visible:outline-butter">
              <h3 className="break-words text-butter">{setlist.title}</h3>
              <p className="mt-1 text-sm text-butter-muted">{fechaSetlist(setlist.date)}</p>
              <p className="text-sm text-butter-muted">{cantidad} {cantidad === 1 ? 'tema' : 'temas'}</p>
            </Link>
            <MenuSetlist nombre={setlist.title} acciones={[
              { texto: 'Editar', ejecutar: () => setModal({ original: setlist, editando: true }) },
              { texto: 'Duplicar', ejecutar: () => setModal({ original: setlist }) },
              { texto: 'Eliminar', ejecutar: () => setEliminar(setlist) },
            ]} />
          </li>
        })}
      </ul> : <p className="mt-8 text-center text-butter-muted">Todavía no hay setlists. Creá uno para organizar el próximo show.</p>)}
    {modal && <ModalSetlist original={modal.original} editando={modal.editando} onCerrar={() => setModal(null)} onGuardar={guardar} />}
    {eliminar && <ConfirmarEliminacionModal mensaje={`¿Eliminar “${eliminar.title}”? Las canciones seguirán en Repertorio.`}
      onCancelar={() => setEliminar(null)} onConfirmar={async () => {
        try { await setlistsDB.eliminar(eliminar); await recargar(); return true }
        catch (error) { setErrorAccion(mensajeErrorSetlists(error)); return false }
      }} />}
  </main>
}
