const ESTADOS = ['vacio', 'presionada', 'aire', 'muteada']

function estadoDelMarcador(posiciones) {
  const indice = posiciones.findIndex((estado) => estado === 'aire' || estado === 'muteada')
  return indice === -1 ? null : { indice, estado: posiciones[indice] }
}

function clasesEstado(estado, esTonica) {
  if (estado !== 'presionada') return ''

  return esTonica
    ? 'after:absolute after:bottom-0 after:size-5 after:translate-y-1/2 after:rounded-full after:bg-butter after:ring-4 after:ring-green'
    : 'after:absolute after:bottom-0 after:size-4 after:translate-y-1/2 after:rounded-full after:bg-teal after:ring-2 after:ring-butter/80'
}

/** Diapasón horizontal reutilizable para el editor y las fichas guardadas. */
export default function AcordeDiagrama({
  acorde,
  editable = false,
  onChange,
  modoTonica = false,
  onTonicaSeleccionada,
}) {
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
      posiciones[cuerda] = Array(4).fill('vacio')
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

    const siguiente = marcador.estado === 'aire' ? 'muteada' : 'vacio'
    posiciones[cuerda][marcador.indice] = siguiente
    onChange({ ...acorde, posiciones })
  }

  return (
    <div className="w-full min-w-0" aria-label={`Diagrama de ${acorde.nombre || 'acorde'}`}>
      <div className="grid grid-cols-[2.35rem_repeat(4,minmax(3rem,1fr))] sm:grid-cols-[2.7rem_repeat(4,minmax(4.25rem,1fr))] items-end">
        <div />
        {acorde.trastes.map((traste, indice) =>
          editable ? (
            <label key={indice} className="flex justify-center pb-3">
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
            <div key={indice} className="pb-3 text-center text-base font-semibold text-butter-muted">
              {traste}
            </div>
          )
        )}

        {acorde.posiciones.map((fila, cuerda) => {
          const marcador = estadoDelMarcador(fila)
          return (
            <div key={cuerda} className="contents">
              <div className="flex items-center justify-center border-b border-butter-muted/70">
                {marcador && (
                  editable ? (
                    <button
                      type="button"
                      onClick={() => ciclarMarcador(cuerda)}
                      aria-label={`Cambiar estado de la cuerda ${6 - cuerda}: ${marcador.estado}`}
                      className="grid size-7 place-items-center rounded-full text-lg font-semibold text-butter hover:bg-superficie focus:outline-none focus:ring-2 focus:ring-teal"
                    >
                      {marcador.estado === 'aire' ? '○' : '×'}
                    </button>
                  ) : (
                    <span className="text-lg font-semibold text-butter">
                      {marcador.estado === 'aire' ? '○' : '×'}
                    </span>
                  )
                )}
              </div>

              {fila.map((estado, traste) => {
                const esTonica = acorde.tonica?.cuerda === cuerda && acorde.tonica?.traste === traste
                const comun = `relative flex h-10 sm:h-12 items-center justify-center border-b border-r border-butter-muted/70 ${traste === 0 ? 'border-l-[3px] border-l-butter' : ''} ${clasesEstado(estado, esTonica)}`
                return editable ? (
                  <button
                    key={traste}
                    type="button"
                    onClick={() => ciclarCelda(cuerda, traste)}
                    aria-label={`Cuerda ${6 - cuerda}, traste ${traste + 1}: ${estado}${esTonica ? ', tónica' : ''}`}
                    className={`${comun} ${modoTonica && estado !== 'presionada' ? 'cursor-not-allowed opacity-60' : 'hover:bg-superficie'} focus:z-10 focus:outline-none focus:ring-2 focus:ring-teal`}
                  />
                ) : (
                  <div key={traste} className={comun} />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
