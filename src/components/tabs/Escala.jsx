import { useOutletContext } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useImagenesEscala } from '../../hooks/useImagenesEscala'

export default function Escala() {
  const { tema } = useOutletContext()
  const { imagenes, cargando, subiendo, subirImagen, eliminarImagen } = useImagenesEscala(tema.id)

  function alSeleccionarArchivo(e) {
    const archivo = e.target.files?.[0]
    if (archivo) subirImagen(archivo)
    e.target.value = '' // permite volver a elegir el mismo archivo después
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm tracking-widest text-butter-muted uppercase mb-1">
          Referencia
        </h2>
        <p className="text-butter">
          {tema.tonalidad || 'Sin definir'} · {tema.escala_nombre || 'Sin definir'}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {cargando ? (
          <p className="text-butter-muted">Cargando…</p>
        ) : (
          imagenes.map((img) => (
            <div
              key={img.id}
              className="relative bg-superficie border border-borde rounded-lg overflow-hidden"
            >
              <img src={img.url} alt="Patrón de escala" className="w-full object-contain" />
              <button
                onClick={() => eliminarImagen(img)}
                aria-label="Eliminar imagen"
                className="absolute top-2 right-2 p-2 rounded-lg bg-fondo/80 hover:bg-fondo transition-colors"
              >
                <Trash2 size={16} className="text-butter-muted" />
              </button>
            </div>
          ))
        )}

        <label className="flex items-center justify-center gap-2 border border-dashed border-borde rounded-lg py-6 text-butter-muted hover:text-butter hover:border-teal transition-colors cursor-pointer">
          <Plus size={18} />
          {subiendo ? 'Subiendo…' : 'Agregar imagen'}
          <input
            type="file"
            accept="image/*"
            onChange={alSeleccionarArchivo}
            disabled={subiendo}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}
