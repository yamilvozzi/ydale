import {
  AFINACION,
  CANTIDAD_TRASTES,
  TRASTES_DE_REFERENCIA,
  notaEnTraste,
  obtenerNotaBlues,
  obtenerNotasEscala,
} from '../lib/escalas'

function MarcadorNota({ nota, esTonica, esNotaBlues }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0 z-10 grid size-4 -translate-y-1/2 place-items-center rounded-full text-[7px] font-bold leading-none tracking-[-0.08em] sm:size-5 sm:text-[9px] ${
        esTonica
          ? 'bg-butter text-fondo ring-4 ring-green'
          : esNotaBlues
            ? 'bg-petroleo text-fondo ring-2 ring-butter/80'
            : 'bg-teal text-butter ring-2 ring-butter/80'
      }`}
    >
      {nota}
    </span>
  )
}

/** Diapasón de 15 trastes generado a partir de una tónica y un tipo de escala. */
export default function EscalaDiagrama({ escala }) {
  const notasEscala = new Set(obtenerNotasEscala(escala.tonica, escala.tipo))
  const notaBlues = escala.tipo === 'blues' ? obtenerNotaBlues(escala.tonica) : null
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
            className="-translate-y-1 text-center text-sm font-bold text-butter-muted sm:text-base"
          >
            {TRASTES_DE_REFERENCIA.includes(traste) ? traste : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[2.75rem_repeat(15,minmax(2.25rem,1fr))]">
        {AFINACION.map((notaAlAire, cuerda) => {
          const notaAbiertaPertenece = notasEscala.has(notaAlAire)
          const esTonicaAbierta = notaAlAire === escala.tonica
          const esNotaBluesAbierta = notaAlAire === notaBlues
          const altoFila = cuerda === AFINACION.length - 1 ? 'h-px' : 'h-9 sm:h-11'

          return (
            <div key={`${notaAlAire}-${cuerda}`} className="contents">
              <div
                className={`relative flex ${altoFila} items-start justify-center border-t border-butter-muted/70`}
                aria-label={`Cuerda ${cuerda + 1}, ${notaAlAire} al aire${
                  notaAbiertaPertenece
                    ? esTonicaAbierta
                      ? ', tónica'
                      : esNotaBluesAbierta
                        ? ', blue note'
                        : ', en la escala'
                    : ''
                }`}
              >
                {notaAbiertaPertenece && (
                  <MarcadorNota
                    nota={notaAlAire}
                    esTonica={esTonicaAbierta}
                    esNotaBlues={esNotaBluesAbierta}
                  />
                )}
              </div>

              {trastes.map((traste) => {
                const nota = notaEnTraste(notaAlAire, traste)
                const pertenece = notasEscala.has(nota)
                const esTonica = nota === escala.tonica
                const esNotaBlues = nota === notaBlues

                return (
                  <div
                    key={traste}
                    aria-label={`Cuerda ${cuerda + 1}, traste ${traste}, ${nota}${
                      pertenece
                        ? esTonica
                          ? ', tónica'
                          : esNotaBlues
                            ? ', blue note'
                            : ', en la escala'
                        : ''
                    }`}
                    className={`relative flex ${altoFila} items-start justify-center border-r border-t border-butter-muted/70 ${
                      traste === 1 ? 'border-l-[3px] border-l-butter' : ''
                    }`}
                  >
                    {pertenece && (
                      <MarcadorNota
                        nota={nota}
                        esTonica={esTonica}
                        esNotaBlues={esNotaBlues}
                      />
                    )}
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
