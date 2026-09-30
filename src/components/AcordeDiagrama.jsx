import MarcadorNota from './MarcadorNota'
import LineasDiapason from './LineasDiapason'
import { AFINACION, notaEnTraste } from '../lib/escalas'

const ESTADOS = ['vacio', 'presionada', 'aire', 'muteada']

function estadoDelMarcador(posiciones) {
  const indice = posiciones.findIndex((estado) => estado === 'aire' || estado === 'muteada')
  return indice === -1 ? null : { indice, estado: posiciones[indice] }
}

/** Diapasón horizontal reutilizable para el editor y las fichas guardadas. */
export default function AcordeDiagrama({
  acorde,
  editable = false,
  onChange,
  modoTonica = false,
  onTonicaSeleccionada,
  compacto = !editable,
}) {
  const columnas = acorde.trastes.length
  function ciclarCelda(cuerda, traste) {
    const posiciones = acorde.posiciones.map((fila) => [...fila])
    const actual = posiciones[cuerda][traste]

    if (modoTonica) {
      if (actual !== 'presionada') return
      const esTonica = acorde.tonica?.cuerda === cuerda && acorde.tonica?.traste === traste
      onChange({ ...acorde, tonica: esTonica ? null : { cuerda, traste } })
      onTonicaSeleccionada?.()
      return
    }

    const siguiente = ESTADOS[(ESTADOS.indexOf(actual) + 1) % ESTADOS.length]

    if (siguiente === 'aire' || siguiente === 'muteada') {
      posiciones[cuerda] = Array(columnas).fill('vacio')
    } else if (siguiente === 'presionada') {
      // Una cuerda al aire o muteada no puede tener a la vez un traste pisado.
      posiciones[cuerda] = posiciones[cuerda].map((estado) =>
        estado === 'aire' || estado === 'muteada' ? 'vacio' : estado
      )
    }

    posiciones[cuerda][traste] = siguiente
    const eraTonica = acorde.tonica?.cuerda === cuerda && acorde.tonica?.traste === traste
    const cuerdaPasaAEstadoAbierto = siguiente === 'aire' || siguiente === 'muteada'
    const debeLimpiarTonica =
      (eraTonica && siguiente !== 'presionada') ||
      (cuerdaPasaAEstadoAbierto && acorde.tonica?.cuerda === cuerda)
    onChange({
      ...acorde,
      posiciones,
      tonica: debeLimpiarTonica ? null : acorde.tonica,
    })
  }

  function ciclarMarcador(cuerda) {
    const posiciones = acorde.posiciones.map((fila) => [...fila])
    const marcador = estadoDelMarcador(posiciones[cuerda])
    if (!marcador) return

    if (modoTonica) {
      if (marcador.estado !== 'aire') return
      const esTonica = acorde.tonica?.cuerda === cuerda && acorde.tonica?.traste === marcador.indice
      onChange({ ...acorde, tonica: esTonica ? null : { cuerda, traste: marcador.indice } })
      onTonicaSeleccionada?.()
      return
    }

    const siguiente = marcador.estado === 'aire' ? 'muteada' : 'vacio'
    posiciones[cuerda][marcador.indice] = siguiente
    onChange({ ...acorde, posiciones })
  }

  const medidas = compacto
    ? {
        grilla: `1.85rem repeat(${columnas}, 2.6rem)`,
        altoCuerda: 'h-7',
        numero: 'text-xs',
        marcador: 'size-5 text-sm',
        nota: '[--diametro-nota:16px]',
      }
    : {
        grilla: `2.35rem repeat(${columnas}, minmax(2.75rem, 1fr))`,
        altoCuerda: 'h-10 sm:h-12',
        numero: 'text-base',
        marcador: 'size-7 text-lg',
        nota: '[--diametro-nota:20px]',
      }

  return (
    <div className={`${compacto ? 'w-fit max-w-full' : 'w-full'} ${medidas.nota} min-w-0 pb-3`} aria-label={`Diagrama de ${acorde.nombre || 'acorde'}`}>
      <div className="grid items-end" style={{ gridTemplateColumns: medidas.grilla }}>
        <div />
        {acorde.trastes.map((traste, indice) =>
          editable ? (
            <label key={indice} className="flex justify-center pb-4">
              <span className="sr-only">Número del traste {indice + 1}</span>
              <input
                value={traste}
                onChange={(e) => {
                  const trastes = [...acorde.trastes]
                  trastes[indice] = e.target.value
                  onChange({ ...acorde, trastes })
                }}
                inputMode="numeric"
                aria-label={`Número del traste ${indice + 1}`}
                className="w-12 rounded border border-borde bg-fondo px-1 py-1.5 text-center text-base font-semibold text-butter focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
              />
            </label>
          ) : (
            <div key={indice} className={`pb-4 text-center font-semibold text-butter ${medidas.numero}`}>
              {traste}
            </div>
          )
        )}

        {acorde.posiciones.map((fila, cuerda) => {
          const marcador = estadoDelMarcador(fila)
          const tonicaAbierta = marcador?.estado === 'aire' && acorde.tonica?.cuerda === cuerda && acorde.tonica?.traste === marcador.indice
          const contenidoAbierto = marcador?.estado === 'aire'
            ? <MarcadorNota nota={AFINACION[cuerda]} esTonica={tonicaAbierta} /> : '×'
          // Hay seis cuerdas y sólo cinco espacios entre ellas: la última fila
          // dibuja la sexta cuerda, pero no agrega altura debajo del diapasón.
          const altoFila = cuerda === acorde.posiciones.length - 1 ? 'h-px' : medidas.altoCuerda
          return (
            <div key={cuerda} className="contents">
              <div className={`relative ${altoFila}`}>
                <LineasDiapason />
                {marcador && (
                  editable ? (
                    <button
                      type="button"
                      onClick={() => ciclarMarcador(cuerda)}
                      aria-label={`Cuerda ${cuerda + 1}, al aire: ${marcador.estado}${tonicaAbierta ? ', tónica' : ''}`}
                      className={`diagrama-marcador ${medidas.marcador} rounded-full font-semibold text-butter hover:bg-superficie focus:outline-none focus:ring-2 focus:ring-teal`}
                    >
                      {contenidoAbierto}
                    </button>
                  ) : (
                    <span className={`diagrama-marcador font-semibold text-butter ${medidas.marcador}`}>
                      {contenidoAbierto}
                    </span>
                  )
                )}
              </div>

              {fila.map((estado, traste) => {
                const esTonica = acorde.tonica?.cuerda === cuerda && acorde.tonica?.traste === traste
                const esBajo = acorde.bajo?.cuerda === cuerda && acorde.bajo?.traste === traste
                const numero = acorde.trastes[traste].trim()
                const nota = /^\d+$/.test(numero) ? notaEnTraste(AFINACION[cuerda], Number(numero)) : null
                const comun = `relative ${altoFila}`
                const contenido = (
                  <>
                    <LineasDiapason traste cejuela={traste === 0} />
                    {estado === 'presionada' && <MarcadorNota nota={nota} esTonica={esTonica} />}
                  </>
                )
                return editable ? (
                  <button
                    key={traste}
                    type="button"
                    onClick={() => ciclarCelda(cuerda, traste)}
                    aria-label={`Cuerda ${cuerda + 1}, traste ${numero || `sin definir (${traste + 1})`}: ${estado}${esTonica ? ', tónica' : ''}${esBajo ? ', bajo' : ''}`}
                    className={`${comun} before:absolute before:inset-x-0 before:-top-5 before:-bottom-5 ${modoTonica && estado !== 'presionada' ? 'cursor-not-allowed opacity-60' : 'hover:bg-superficie'} focus:z-10 focus:outline-none focus:ring-2 focus:ring-teal`}
                  >
                    {contenido}
                  </button>
                ) : (
                  <div key={traste} className={comun}>{contenido}</div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
