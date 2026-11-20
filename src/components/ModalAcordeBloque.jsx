import { useState } from 'react'
import AcordeDiagrama from './AcordeDiagrama'
import DialogoPizarra, { botonPizarra, botonPrincipalPizarra } from './DialogoPizarra'
import { describirDigitacion, nombreAcordeBloque, validarNombreAcordeBloque, variantesDigitacion } from '../lib/bloquesPizarra'

export function SelectorAcordeBloque({ acordes, onElegir, onCerrar, error }) {
  const [nombre, setNombre] = useState('')
  const [invalido, setInvalido] = useState(false)
  function agregarManual(evento) {
    evento.preventDefault()
    const acorde = nombre.trim()
    if (!validarNombreAcordeBloque(acorde)) {
      setInvalido(true)
      return
    }
    if (onElegir(acorde)) onCerrar()
  }
  return <DialogoPizarra titulo="Agregar acorde" onCerrar={onCerrar}>
    <form onSubmit={agregarManual} className="mb-3 grid gap-1.5">
      <label className="grid gap-1 text-sm text-butter-muted">
        Nombre del acorde
        <input value={nombre} onChange={evento => { setNombre(evento.target.value); setInvalido(false) }}
          aria-invalid={invalido || undefined} autoCapitalize="off" autoComplete="off" spellCheck={false} maxLength={64}
          placeholder="Am, Emadd9, D/F#" className="min-h-11 min-w-0 rounded-lg border border-borde bg-fondo px-3 py-2 text-base text-butter" />
      </label>
      <button type="submit" disabled={!nombre.trim()} className={`${botonPrincipalPizarra} justify-self-start`}>Agregar</button>
      {invalido && <p role="alert" className="text-sm text-butter-muted">Ingresá un cifrado que empiece con una nota de A a G.</p>}
    </form>
    {acordes.length > 0 && <>
      <h3 className="mb-1.5 border-t border-borde pt-3 text-sm text-butter-muted">Acordes de la Pizarra</h3>
      <ul className="grid gap-1.5">
        {acordes.map(acorde => <li key={acorde.id}>
          <button type="button" onClick={() => { if (onElegir(acorde)) onCerrar() }}
            className={`${botonPizarra} grid w-full gap-0.5 text-left [overflow-wrap:anywhere]`}>
            <strong>{nombreAcordeBloque(acorde)}</strong>
            <span className="text-xs tabular-nums text-butter-muted">{describirDigitacion(acorde)}</span>
          </button>
        </li>)}
      </ul>
    </>}
    {error && <p role="alert" className="mt-3 text-sm text-butter-muted">{error}</p>}
  </DialogoPizarra>
}

export default function ModalAcordeBloque({
  entrada, acordes, onElegir, onAdelantar, onAtrasar, onQuitar, onCerrar, error,
}) {
  const [variante, setVariante] = useState(0)
  const { digitacion } = entrada
  const variantes = variantesDigitacion(entrada, acordes)
  const vista = variantes[variante] ?? digitacion
  const fuenteEliminada = digitacion && !acordes.some(acorde => acorde.id === digitacion.id)

  function aplicar(accion) {
    if (accion()) onCerrar()
  }

  return <DialogoPizarra titulo={nombreAcordeBloque(entrada)} tituloMusical onCerrar={onCerrar}>
    {variantes.length > 1 && <fieldset className="mb-3 grid gap-1.5">
      <legend className="mb-1 text-xs text-butter-muted">Digitaciones · trastes de 1.ª a 6.ª cuerda</legend>
      {variantes.map((acorde, indice) => <button key={indice} type="button" aria-pressed={variante === indice}
        onClick={() => setVariante(indice)}
        className={`${botonPizarra} flex flex-wrap items-center justify-between gap-x-2 text-left aria-pressed:border-butter-muted aria-pressed:bg-teal`}>
        <span>{acorde === digitacion ? 'Guardada' : `Variante ${digitacion ? indice : indice + 1}`}</span>
        <span className="text-xs tabular-nums">{describirDigitacion(acorde)}</span>
      </button>)}
    </fieldset>}
    {vista === digitacion && fuenteEliminada && <p className="text-xs text-butter-muted">La digitación está guardada en el bloque. Su acorde original ya no está en la Pizarra.</p>}
    {vista ? <div className="mb-3 overflow-x-auto rounded-lg border border-borde bg-fondo p-3 pb-1">
      <div className="mx-auto w-max"><AcordeDiagrama acorde={vista} /></div>
      {vista.bajo && <p className="pb-1 text-center text-xs text-butter-muted">Bajo en cuerda {vista.bajo.cuerda + 1}</p>}
    </div> : <p className="mb-3 text-sm text-butter-muted">Este acorde no tiene diagrama.</p>}
    {vista && vista !== digitacion && <button type="button" onClick={() => aplicar(() => onElegir(vista))}
      className={`${botonPrincipalPizarra} mb-3 w-full`}>Usar esta digitación</button>}
    <div className="grid gap-2 border-t border-borde pt-3">
      {(onAdelantar || onAtrasar) && <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!onAdelantar} onClick={() => aplicar(onAdelantar)} className={botonPizarra}>Mover antes</button>
        <button type="button" disabled={!onAtrasar} onClick={() => aplicar(onAtrasar)} className={botonPizarra}>Mover después</button>
      </div>}
      <button type="button" onClick={() => aplicar(onQuitar)} className={`${botonPizarra} justify-self-start`}>Quitar del bloque</button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-butter-muted">{error}</p>}
  </DialogoPizarra>
}
