import { useState } from 'react'
import AcordeDiagrama from './AcordeDiagrama'
import DialogoPizarra, { botonPizarra, botonPrincipalPizarra } from './DialogoPizarra'
import { describirDigitacion, nombreAcordeBloque, variantesDigitacion } from '../lib/bloquesPizarra'

export function SelectorAcordeBloque({ acordes, onElegir, onCerrar, error }) {
  return <DialogoPizarra titulo="Agregar acorde" onCerrar={onCerrar}>
    {acordes.length ? <>
      <p className="mb-2 text-xs text-butter-muted">Trastes de 1.ª a 6.ª cuerda · 0 al aire · × muteada</p>
      <ul className="grid gap-1.5">
        {acordes.map(acorde => <li key={acorde.id}>
          <button type="button" onClick={() => { if (onElegir(acorde)) onCerrar() }}
            className={`${botonPizarra} grid w-full gap-0.5 text-left [overflow-wrap:anywhere]`}>
            <strong>{nombreAcordeBloque(acorde)}</strong>
            <span className="text-xs tabular-nums text-butter-muted">{describirDigitacion(acorde)}</span>
          </button>
        </li>)}
      </ul>
    </> : <p className="text-sm text-butter-muted">Agregá un acorde a la Pizarra para usarlo en el bloque.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-butter-muted">{error}</p>}
  </DialogoPizarra>
}

export default function ModalAcordeBloque({
  digitacion, acordes, compas, cantidad, onElegir, onAdelantar, onAtrasar, onMover, onQuitar, onCerrar, error,
}) {
  const [variante, setVariante] = useState(0)
  const [destino, setDestino] = useState('')
  const variantes = variantesDigitacion(digitacion, acordes)
  const vista = variantes[variante] ?? digitacion
  const fuenteEliminada = !acordes.some(acorde => acorde.id === digitacion.id)

  function aplicar(accion) {
    if (accion()) onCerrar()
  }

  return <DialogoPizarra titulo={nombreAcordeBloque(digitacion)} onCerrar={onCerrar}>
    {variantes.length > 1 && <fieldset className="mb-3 grid gap-1.5">
      <legend className="mb-1 text-xs text-butter-muted">Digitaciones · trastes de 1.ª a 6.ª cuerda</legend>
      {variantes.map((acorde, indice) => <button key={indice} type="button" aria-pressed={variante === indice}
        onClick={() => setVariante(indice)}
        className={`${botonPizarra} flex flex-wrap items-center justify-between gap-x-2 text-left aria-pressed:border-butter-muted aria-pressed:bg-teal`}>
        <span>{indice === 0 ? 'Guardada' : `Variante ${indice + 1}`}</span>
        <span className="text-xs tabular-nums">{describirDigitacion(acorde)}</span>
      </button>)}
    </fieldset>}
    {vista === digitacion && fuenteEliminada && <p className="text-xs text-butter-muted">La digitación está guardada en el bloque. Su acorde original ya no está en la Pizarra.</p>}
    <div className="mb-3 overflow-x-auto rounded-lg border border-borde bg-fondo p-3 pb-1">
      <div className="mx-auto w-max"><AcordeDiagrama acorde={vista} /></div>
      {vista.bajo && <p className="pb-1 text-center text-xs text-butter-muted">Bajo en cuerda {vista.bajo.cuerda + 1}</p>}
    </div>
    {vista !== digitacion && <button type="button" onClick={() => aplicar(() => onElegir(vista))}
      className={`${botonPrincipalPizarra} mb-3 w-full`}>Usar esta digitación</button>}
    <div className="grid gap-2 border-t border-borde pt-3">
      {(onAdelantar || onAtrasar) && <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!onAdelantar} onClick={() => aplicar(onAdelantar)} className={botonPizarra}>Mover antes</button>
        <button type="button" disabled={!onAtrasar} onClick={() => aplicar(onAtrasar)} className={botonPizarra}>Mover después</button>
      </div>}
      {cantidad > 1 && <form className="flex flex-wrap gap-2" onSubmit={evento => {
        evento.preventDefault()
        if (destino !== '') aplicar(() => onMover(Number(destino)))
      }}>
        <select aria-label="Compás de destino" value={destino} onChange={evento => setDestino(evento.target.value)} className={`${botonPizarra} min-w-0 flex-1`}>
          <option value="" disabled>Mover a otro compás</option>
          {Array.from({ length: cantidad }, (_, i) => i === compas ? null : <option key={i} value={i}>Compás {i + 1}</option>)}
        </select>
        <button type="submit" disabled={destino === ''} className={botonPizarra}>Mover</button>
      </form>}
      <button type="button" onClick={() => aplicar(onQuitar)} className={`${botonPizarra} justify-self-start`}>Quitar del bloque</button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-butter-muted">{error}</p>}
  </DialogoPizarra>
}
