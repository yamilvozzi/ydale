import { Pencil, Check, X } from 'lucide-react'
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
  columnas = false,
  serializarAlGuardar,
}) {
  const {
    editando,
    borrador,
    setBorrador,
    guardando,
    empezarEdicion,
    cancelar,
    guardar,
  } = useCampoEditable({ temaId, campo, valor, onGuardado, serializarAlGuardar })

  const claseTexto = [
    fuenteMono ? 'font-mono' : 'font-sans',
    textoGrande ? 'text-2xl lg:text-xl leading-relaxed' : 'text-base leading-relaxed',
    'whitespace-pre-wrap',
    // Dos columnas en pantallas grandes: reduce el scroll vertical
    // en textos largos (p. ej. la letra completa de una canción).
    columnas && !editando ? 'lg:columns-2 lg:gap-10' : '',
  ].join(' ')

  // Altura mínima del textarea al editar: sin esto, en algunos layouts
  // (flex anidado sin altura fija en toda la cadena de ancestros) el
  // campo colapsaba a una sola línea visible. Con textoGrande (Letra)
  // necesita más alto porque el texto es más grande.
  const minAltura = textoGrande ? 'min-h-[58dvh]' : 'min-h-20'

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className={`flex items-center mb-3 ${titulo ? 'justify-between' : 'justify-end'}`}>
        {titulo && (
          <h2 className="text-sm tracking-widest text-butter-muted uppercase">
            {titulo}
          </h2>
        )}

        {!editando ? (
          // El lápiz es una acción secundaria: chico, discreto,
          // no debe competir con el contenido de la sección.
          <button
            onClick={empezarEdicion}
            aria-label={`Editar ${titulo || 'sección'}`}
            className="group p-1.5 -mr-1 rounded-lg hover:bg-superficie transition-colors"
          >
            <Pencil
              size={14}
              className="text-butter-muted/60 group-hover:text-teal transition-colors"
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
            className={`${claseTexto} flex-1 ${minAltura} bg-superficie border border-borde rounded-lg p-4 text-butter placeholder-butter-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30`}
          />
        )
      ) : valor ? (
        <p className={`${claseTexto} text-butter`}>{valor}</p>
      ) : (
        <p className="text-butter-muted italic">{placeholder}</p>
      )}
    </div>
  )
}
