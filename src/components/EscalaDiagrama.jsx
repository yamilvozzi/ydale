import {
  AFINACION,
  CANTIDAD_TRASTES,
  TRASTES_DE_REFERENCIA,
  notaEnTraste,
  obtenerNotasEscala,
} from '../lib/escalas'

function MarcadorNota({ esTonica }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0 z-10 size-4 -translate-y-1/2 rounded-full sm:size-5 ${
        esTonica
          ? 'bg-butter ring-4 ring-green'
          : 'bg-teal ring-2 ring-butter/80'
      }`}
    />
  )
}

/** Diapasón de 15 trastes generado a partir de una tónica y un tipo de escala. */
export default function EscalaDiagrama({ escala }) {
  const notasEscala = new Set(obtenerNotasEscala(escala.tonica, escala.tipo))
  const trastes = Array.from({ length: CANTIDAD_TRASTES }, (_, indice) => indice + 1)

  return (
    <div
      className="w-full min-w-[760px] pb-3"
      aria-label={`Diapasón de la escala ${escala.tonica} ${escala.tipo}`}
    >
      <div className="mb-4 grid grid-cols-[2.75rem_repeat(15,minmax(2.25rem,1fr))]">
        <div />
        {trastes.map((traste) => (
          <div
            key={traste}
            className="text-center text-xs font-semibold text-butter-muted"
          >
            {TRASTES_DE_REFERENCIA.includes(traste) ? traste : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[2.75rem_repeat(15,minmax(2.25rem,1fr))]">
        {AFINACION.map((notaAlAire, cuerda) => {
          const notaAbiertaPertenece = notasEscala.has(notaAlAire)
          const esTonicaAbierta = notaAlAire === escala.tonica
          const altoFila = cuerda === AFINACION.length - 1 ? 'h-px' : 'h-9 sm:h-11'

          return (
            <div key={`${notaAlAire}-${cuerda}`} className="contents">
              <div
                className={`relative flex ${altoFila} items-start justify-center border-t border-butter-muted/70`}
                aria-label={`Cuerda ${cuerda + 1}, ${notaAlAire} al aire${
                  notaAbiertaPertenece ? (esTonicaAbierta ? ', tónica' : ', en la escala') : ''
                }`}
              >
                {notaAbiertaPertenece && <MarcadorNota esTonica={esTonicaAbierta} />}
              </div>

              {trastes.map((traste) => {
                const nota = notaEnTraste(notaAlAire, traste)
                const pertenece = notasEscala.has(nota)
                const esTonica = nota === escala.tonica

                return (
                  <div
                    key={traste}
                    aria-label={`Cuerda ${cuerda + 1}, traste ${traste}, ${nota}${
                      pertenece ? (esTonica ? ', tónica' : ', en la escala') : ''
                    }`}
                    className={`relative flex ${altoFila} items-start justify-center border-r border-t border-butter-muted/70 ${
                      traste === 1 ? 'border-l-[3px] border-l-butter' : ''
                    }`}
                  >
                    {pertenece && <MarcadorNota esTonica={esTonica} />}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
