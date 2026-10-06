import Diapason from './Diapason'
import { obtenerMarcadoresEscala } from '../lib/escalas'

export default function EscalaDiagrama({ escala }) {
  const notas = obtenerMarcadoresEscala(escala.tonica, escala.tipo)

  return (
    <Diapason
      etiqueta={`Diapasón de la escala ${escala.tonica} ${escala.tipo}`}
      obtenerMarcador={(_cuerda, _traste, nota) => notas.get(nota) ?? null}
    />
  )
}
