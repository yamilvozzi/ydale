import MarcadorNota from './MarcadorNota'
import LineasDiapason from './LineasDiapason'
import {
  AFINACION,
  CANTIDAD_TRASTES,
  TRASTES_DE_REFERENCIA,
  notaEnTraste,
  obtenerNotaBlues,
  obtenerNotasEscala,
} from '../lib/escalas'

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
            className="-translate-y-1 text-center text-sm font-bold text-butter sm:text-base"
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
          const altoFila = cuerda === AFINACION.length - 1 ? 'h-0' : 'h-9 sm:h-11'

          return (
            <div key={`${notaAlAire}-${cuerda}`} className="contents">
              <div
                className={`relative ${altoFila}`}
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
                <LineasDiapason />
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
                    className={`relative ${altoFila}`}
                  >
                    <LineasDiapason traste cejuela={traste === 1} />
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
