import { useOutletContext } from 'react-router-dom'
import { useState } from 'react'
import { Timer } from 'lucide-react'
import SeccionTextoEditable from '../SeccionTextoEditable'
import TapTempoModal from '../TapTempoModal'

export default function Percusion() {
  const { tema, actualizarCampoLocal } = useOutletContext()
  const [tapAbierto, setTapAbierto] = useState(false)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex justify-start">
        <button type="button" onClick={() => setTapAbierto(true)} className="boton-funcion flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"><Timer size={17} /> Tap Tempo</button>
      </div>
      <SeccionTextoEditable
        temaId={tema.id}
        campo="percusion"
        valor={tema.percusion}
        onGuardado={(v) => actualizarCampoLocal('percusion', v)}
        titulo="Percusión"
        placeholder="Todavía no hay nada acá. Reservado para Diego."
      />
      {tapAbierto && <TapTempoModal onCerrar={() => setTapAbierto(false)} />}
    </div>
  )
}
