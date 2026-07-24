import { useOutletContext } from 'react-router-dom'
import SeccionTextoEditable from '../SeccionTextoEditable'

export default function Letra() {
  const { tema, actualizarCampoLocal } = useOutletContext()

  return (
    <SeccionTextoEditable
      temaId={tema.id}
      campo="letra"
      valor={tema.letra}
      onGuardado={(v) => actualizarCampoLocal('letra', v)}
      textoGrande
      columnas
      placeholder="Todavía no hay letra cargada. Tocá el lápiz para escribirla."
    />
  )
}
