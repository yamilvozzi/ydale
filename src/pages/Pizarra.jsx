import { Plus, Trash2, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import VolverInicio from '../components/VolverInicio'
import EditorEscalaModal from '../components/EditorEscalaModal'
import TarjetasOrdenables from '../components/TarjetasOrdenables'
import GeneradorAcordesModal from '../components/GeneradorAcordesModal'
import EditorAcordeModal from '../components/EditorAcordeModal'
import ConfirmarEliminacionModal from '../components/ConfirmarEliminacionModal'
import { etiquetaTipo } from '../lib/escalas'
import { usePizarra } from '../hooks/usePizarra'

const nombreElemento = ({ tipo, datos }) => tipo === 'escala'
  ? `${datos.tonica} · ${etiquetaTipo(datos.tipo)}` : datos.nombre || 'Sin nombre'
const botonAgregar = 'flex items-center gap-2 rounded-lg bg-teal px-3 py-2.5 text-sm text-butter hover:bg-green disabled:opacity-50'

export default function Pizarra() {
  const { elementos, error, lecturaFallida, guardar, eliminar, vaciar, reordenar } = usePizarra()
  const [editor, setEditor] = useState(null)
  const [confirmacion, setConfirmacion] = useState(null)

  function alGuardar(tipo, datos) {
    if (guardar(tipo, datos)) setEditor(null)
  }

  return (
    <main className="flex min-h-dvh w-full flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="flex items-center gap-4">
        <VolverInicio />
        <h1 className="text-lg tracking-widest text-butter">PIZARRA</h1>
      </header>
      <div className="flex flex-wrap items-center gap-2 border-b border-borde pb-5">
        <button type="button" disabled={lecturaFallida} onClick={() => setEditor({ tipo: 'escala' })} aria-label="+ Escala" className={botonAgregar}><Plus size={17} /> Escala</button>
        <button type="button" disabled={lecturaFallida} onClick={() => setEditor({ tipo: 'acorde' })} aria-label="+ Acorde" className={botonAgregar}><Plus size={17} /> Acorde</button>
        <button type="button" disabled={lecturaFallida} onClick={() => setEditor({ tipo: 'generador' })} className={botonAgregar}><WandSparkles size={17} /> Generador</button>
        <button type="button" disabled={!elementos.length && !lecturaFallida} onClick={() => setConfirmacion({ todo: true })} className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-butter-muted hover:bg-superficie hover:text-butter disabled:opacity-40"><Trash2 size={16} /> VACIAR PIZARRA</button>
      </div>
      {error && !editor && <p role="alert" className="text-sm text-butter-muted">{error}</p>}
      {!elementos.length && !lecturaFallida && <p className="text-sm italic text-butter-muted">Pizarra vacía.</p>}
      {['escala', 'acorde'].map((grupo) => {
        const items = elementos.filter(({ tipo }) => tipo === grupo)
        if (!items.length) return null
        return <TarjetasOrdenables
          key={grupo}
          tipo={grupo}
          items={items.map(({ datos }) => datos)}
          disabled={lecturaFallida}
          onReordenar={(ordenados) => reordenar(grupo, ordenados)}
          onEditar={(datos) => setEditor({ tipo: grupo, datos })}
          onEliminar={(datos) => setConfirmacion({ elemento: { tipo: grupo, datos } })}
        />
      })}
      {editor?.tipo === 'escala' && <EditorEscalaModal key={editor.datos?.id ?? 'nueva'} escala={editor.datos} onCerrar={() => setEditor(null)} onGuardar={(datos) => alGuardar('escala', datos)} errorGuardado={error} />}
      {editor?.tipo === 'generador' && <GeneradorAcordesModal
        onCerrar={() => setEditor(null)}
        onElegir={(datos) => alGuardar('acorde', datos)}
        onEditar={(datos) => setEditor({ tipo: 'acorde', datos: { ...datos, esNuevo: true } })}
        errorGuardado={error}
      />}
      {editor?.tipo === 'acorde' && <EditorAcordeModal key={editor.datos?.id ?? 'nuevo'} acorde={editor.datos} onCerrar={() => setEditor(null)} onGuardar={(datos) => alGuardar('acorde', datos)} errorGuardado={error} />}
      {confirmacion && <ConfirmarEliminacionModal
        preguntaComoTitulo
        mensaje={confirmacion.todo ? '¿Vaciar toda la pizarra?' : `¿Eliminar ${nombreElemento(confirmacion.elemento)} de la pizarra?`}
        onCancelar={() => setConfirmacion(null)}
        onConfirmar={() => confirmacion.todo ? vaciar() : eliminar(confirmacion.elemento.datos.id)}
      />}
    </main>
  )
}
