import { useOutletContext } from 'react-router-dom'

export default function Escala() {
  const { tema } = useOutletContext()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm tracking-widest text-butter-muted uppercase mb-1">
          Referencia
        </h2>
        <p className="text-butter">
          {tema.tonalidad || 'Sin definir'} · {tema.escala_nombre || 'Sin definir'}
        </p>
        <p className="text-xs text-butter-muted mt-1">
          Se edita desde la pestaña Estructura.
        </p>
      </div>

      <div className="border border-dashed border-borde rounded-lg p-8 text-center text-butter-muted">
        La carga de imágenes de patrones todavía no está construida.
        <br />
        Es el próximo paso.
      </div>
    </div>
  )
}
