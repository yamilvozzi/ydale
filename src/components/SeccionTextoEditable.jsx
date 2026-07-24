import { Pencil, Check, X, Undo2 } from 'lucide-react'
import { useCampoEditable } from '../hooks/useCampoEditable'

export default function SeccionTextoEditable({
  temaId,
  campo,
  valor,
  onGuardado,
  titulo,
  placeholder = 'Todavía no hay nada acá. Tocá el lápiz para cargarlo.',
  fuenteMono = false,
  textoGrande = false,
  lineaUnica = false,
}) {
  const {
    editando,
    borrador,
    setBorrador,
    guardando,
    puedeDeshacer,
    empezarEdicion,
    cancelar,
    guardar,
    deshacer,
  } = useCampoEditable({ temaId, campo, valor, onGuardado })

  const claseTexto = [
    fuenteMono ? 'font-mono' : 'font-sans',
    textoGrande ? 'text-2xl leading-relaxed' : 'text-base leading-relaxed',
    'whitespace-pre-wrap',
  ].join(' ')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm tracking-widest text-butter-muted uppercase">
          {titulo}
        </h2>

        {!editando ? (
          <button
            onClick={empezarEdicion}
            aria-label={`Editar ${titulo}`}
            className="group p-2 rounded-lg hover:bg-superficie transition-colors"
          >
            <Pencil
              size={18}
              className="text-butter-muted group-hover:text-teal transition-colors"
            />
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={cancelar}
              aria-label="Cancelar"
              className="group p-2 rounded-lg hover:bg-superficie transition-colors"
            >
              <X size={18} className="text-butter-muted" />
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              aria-label="Guardar"
              className="p-2 rounded-lg bg-teal hover:bg-green transition-colors disabled:opacity-50"
            >
              <Check size={18} className="text-butter" />
            </button>
          </div>
        )}
      </div>

      {editando ? (
        lineaUnica ? (
          <input
            autoFocus
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && guardar()}
            className={`${claseTexto} bg-superficie border border-borde rounded-lg p-3 text-butter placeholder-butter-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30`}
          />
        ) : (
          <textarea
            autoFocus
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            className={`${claseTexto} flex-1 bg-superficie border border-borde rounded-lg p-4 text-butter placeholder-butter-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30`}
          />
        )
      ) : valor ? (
        <p className={`${claseTexto} text-butter`}>{valor}</p>
      ) : (
        <p className="text-butter-muted italic">{placeholder}</p>
      )}

      {puedeDeshacer && (
        <button
          onClick={deshacer}
          className="mt-3 self-start flex items-center gap-2 text-sm text-butter-muted :text-butter transition-colors"
        >
          <Undo2 size={14} />
          Deshacer último cambio
        </button>
      )}
    </div>
  )
}
