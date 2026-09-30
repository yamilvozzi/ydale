import Diapason from './Diapason'
import { obtenerNotaBlues, obtenerNotasEscala } from '../lib/escalas'

export default function EscalaDiagrama({ escala }) {
  const notas = new Set(obtenerNotasEscala(escala.tonica, escala.tipo))
  const notaBlues = escala.tipo === 'blues' ? obtenerNotaBlues(escala.tonica) : null

  return (
    <Diapason
      etiqueta={`Diapasón de la escala ${escala.tonica} ${escala.tipo}`}
      obtenerMarcador={(_cuerda, _traste, nota) => notas.has(nota) ? {
        nota,
        esTonica: nota === escala.tonica,
        esNotaBlues: nota === notaBlues,
      } : null}
    />
  )
}
