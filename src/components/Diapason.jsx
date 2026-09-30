import MarcadorNota from './MarcadorNota'
import LineasDiapason from './LineasDiapason'
import {
  AFINACION,
  CANTIDAD_TRASTES,
  TRASTES_DE_REFERENCIA,
  notaEnTraste,
} from '../lib/escalas'

/** Geometría compartida por escalas y propuestas de acordes. */
export default function Diapason({ etiqueta, obtenerMarcador = () => null }) {
  const trastes = Array.from({ length: CANTIDAD_TRASTES }, (_, indice) => indice + 1)

  return (
    <div
      className="w-full min-w-[760px] pb-3"
      aria-label={etiqueta}
    >
      <div className="mb-6 grid grid-cols-[2.75rem_repeat(15,minmax(2.25rem,1fr))]">
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
          const marcadorAbierto = obtenerMarcador(cuerda, 0, notaAlAire)
          const notaAbiertaPertenece = Boolean(marcadorAbierto)
          const esTonicaAbierta = marcadorAbierto?.esTonica
          const esNotaBluesAbierta = marcadorAbierto?.esNotaBlues
          const altoFila = cuerda === AFINACION.length - 1 ? 'h-0' : 'h-9 sm:h-11'

          return (
            <div key={`${notaAlAire}-${cuerda}`} className="contents">
              <div
                className={`relative ${altoFila}`}
                aria-label={`Cuerda ${cuerda + 1}, ${marcadorAbierto?.nota ?? notaAlAire} al aire${marcadorAbierto?.esBajo ? ', bajo' : ''}${
                  notaAbiertaPertenece
                    ? esTonicaAbierta
                      ? ', tónica'
                      : esNotaBluesAbierta
                        ? ', blue note'
                        : ', seleccionada'
                    : ''
                }`}
              >
                <LineasDiapason />
                {notaAbiertaPertenece && (
                  <MarcadorNota
                    nota={marcadorAbierto.nota ?? notaAlAire}
                    esTonica={esTonicaAbierta}
                    esNotaBlues={esNotaBluesAbierta}
                  />
                )}
              </div>

              {trastes.map((traste) => {
                const nota = notaEnTraste(notaAlAire, traste)
                const marcador = obtenerMarcador(cuerda, traste, nota)
                const pertenece = Boolean(marcador)
                const esTonica = marcador?.esTonica
                const esNotaBlues = marcador?.esNotaBlues

                return (
                  <div
                    key={traste}
                    aria-label={`Cuerda ${cuerda + 1}, traste ${traste}, ${marcador?.nota ?? nota}${marcador?.esBajo ? ', bajo' : ''}${
                      pertenece
                        ? esTonica
                          ? ', tónica'
                          : esNotaBlues
                            ? ', blue note'
                            : ', seleccionada'
                        : ''
                    }`}
                    className={`relative ${altoFila}`}
                  >
                    <LineasDiapason traste cejuela={traste === 1} />
                    {pertenece && (
                      <MarcadorNota
                        nota={marcador.nota ?? nota}
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
