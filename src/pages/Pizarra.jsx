import { BookOpen, CircleDot, Plus, Timer, Trash2, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import VolverInicio from '../components/VolverInicio'
import EditorEscalaModal from '../components/EditorEscalaModal'
import TarjetasOrdenables from '../components/TarjetasOrdenables'
import GeneradorAcordesModal from '../components/GeneradorAcordesModal'
import EditorAcordeModal from '../components/EditorAcordeModal'
import ConfirmarEliminacionModal from '../components/ConfirmarEliminacionModal'
import CirculoQuintasModal from '../components/CirculoQuintasModal'
import TapTempoModal from '../components/TapTempoModal'
import RepertorioPizarraModal from '../components/RepertorioPizarraModal'
import { tituloEscala } from '../lib/escalas'
import { usePizarra } from '../hooks/usePizarra'

const nombreElemento = ({ tipo, datos }) => tipo === 'escala'
  ? tituloEscala(datos) : datos.nombre || 'Sin nombre'
const botonAgregar = 'flex items-center gap-2 rounded-lg bg-teal px-3 py-2.5 text-sm text-butter hover:bg-green disabled:opacity-50'

export default function Pizarra() {
  const { elementos, error, lecturaFallida, guardar, eliminar, vaciar, reordenar, transponer, cargarTema, desplazamiento, reiniciarTransposicion } = usePizarra()
  const [editor, setEditor] = useState(null)
  const [confirmacion, setConfirmacion] = useState(null)
  const [circuloAbierto, setCirculoAbierto] = useState(false)
  const [tapAbierto, setTapAbierto] = useState(false)
  const [repertorioAbierto, setRepertorioAbierto] = useState(false)

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
        <button type="button" disabled={lecturaFallida} onClick={() => setRepertorioAbierto(true)} className="flex min-h-11 items-center gap-2 rounded-lg border border-butter-muted bg-superficie px-3 py-2 text-xs tracking-wide text-butter hover:border-butter hover:bg-borde disabled:opacity-40"><BookOpen size={17} /> REPERTORIO</button>
        <button type="button" disabled={lecturaFallida} onClick={() => setEditor({ tipo: 'escala' })} aria-label="+ Escala" className={botonAgregar}><Plus size={17} /> Escala</button>
        <button type="button" disabled={lecturaFallida} onClick={() => setEditor({ tipo: 'acorde' })} aria-label="+ Acorde" className={botonAgregar}><Plus size={17} /> Acorde</button>
        <button type="button" disabled={lecturaFallida} onClick={() => setEditor({ tipo: 'generador' })} className={botonAgregar}><WandSparkles size={17} /> Generador</button>
        <button type="button" onClick={() => setCirculoAbierto(true)} className={botonAgregar}><CircleDot size={17} /> Círculo de 5tas</button>
        <button type="button" onClick={() => setTapAbierto(true)} className={botonAgregar}><Timer size={17} /> Tap Tempo</button>
        <div className="ml-auto flex items-center gap-2">
          <div role="group" aria-label="Transposición global" className="flex items-center gap-1">
            <button type="button" disabled={lecturaFallida || !elementos.length} onClick={() => transponer(-1)}
              aria-label="Bajar toda la pizarra un semitono" title="Bajar todo un semitono"
              className="min-h-11 min-w-11 rounded-lg border border-borde px-3 text-base text-butter hover:bg-teal focus-visible:outline-2 focus-visible:outline-butter disabled:opacity-40"
            >-1</button>
            <button type="button" disabled={lecturaFallida} onClick={reiniciarTransposicion}
              aria-label={`Restablecer transposición a cero: desplazamiento actual ${desplazamiento > 0 ? '+' : ''}${desplazamiento} semitonos`}
              title="Restablecer transposición a 0" className="min-h-11 min-w-9 rounded-lg px-1 text-sm tabular-nums text-butter hover:bg-superficie focus-visible:outline-2 focus-visible:outline-butter disabled:opacity-40"
            ><span aria-live="polite" aria-atomic="true">{desplazamiento > 0 ? '+' : ''}{desplazamiento}</span></button>
            <button type="button" disabled={lecturaFallida || !elementos.length} onClick={() => transponer(1)}
              aria-label="Subir toda la pizarra un semitono" title="Subir todo un semitono"
              className="min-h-11 min-w-11 rounded-lg border border-borde px-3 text-base text-butter hover:bg-teal focus-visible:outline-2 focus-visible:outline-butter disabled:opacity-40"
            >+1</button>
          </div>
          <div className="border-l border-borde pl-2">
            <button type="button" disabled={!elementos.length && !lecturaFallida} onClick={() => setConfirmacion({ todo: true })} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-butter-muted hover:bg-superficie hover:text-butter disabled:opacity-40"><Trash2 size={16} /> VACIAR PIZARRA</button>
          </div>
        </div>
      </div>
      {error && !editor && !repertorioAbierto && <p role="alert" className="text-sm text-butter-muted">{error}</p>}
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
      {circuloAbierto && <CirculoQuintasModal onCerrar={() => setCirculoAbierto(false)} />}
      {tapAbierto && <TapTempoModal onCerrar={() => setTapAbierto(false)} />}
      {repertorioAbierto && <RepertorioPizarraModal onCerrar={() => setRepertorioAbierto(false)} onCargar={cargarTema} contieneElementos={elementos.length > 0} errorGuardado={error} />}
      {confirmacion && <ConfirmarEliminacionModal
        preguntaComoTitulo
        mensaje={confirmacion.todo ? '¿Vaciar toda la pizarra?' : `¿Eliminar ${nombreElemento(confirmacion.elemento)} de la pizarra?`}
        onCancelar={() => setConfirmacion(null)}
        onConfirmar={() => confirmacion.todo ? vaciar() : eliminar(confirmacion.elemento.datos.id)}
      />}
    </main>
  )
}
