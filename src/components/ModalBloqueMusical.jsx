import { useState } from 'react'
import DialogoPizarra, { botonPizarra, botonPrincipalPizarra } from './DialogoPizarra'
import { configurarBloque, MAX_COMPASES } from '../lib/bloquesPizarra'

const entrada = 'min-h-11 rounded-lg border border-borde bg-fondo px-3 py-2 text-base text-butter'
const opciones = [[0, 'Libre'], [2, '2'], [4, '4'], [8, '8']]

export default function ModalBloqueMusical({ bloque, onCerrar, onGuardar, error }) {
  const [titulo, setTitulo] = useState(bloque?.titulo ?? '')
  const [cantidad, setCantidad] = useState(String(bloque?.compases?.length ?? 0))
  const [repeticiones, setRepeticiones] = useState(String(bloque?.repeticiones ?? 1))
  const compases = Number(cantidad)
  const veces = Number(repeticiones)
  const valido = cantidad !== '' && Number.isInteger(compases) && compases >= 0 && compases <= MAX_COMPASES &&
    Number.isSafeInteger(veces) && veces >= 1
  const reubicaAcordes = compases > 0 && bloque?.compases?.slice(compases).some(acordes => acordes.length > 0)

  function guardar(evento) {
    evento.preventDefault()
    if (valido && onGuardar(configurarBloque(bloque, { titulo, cantidad: compases, repeticiones: veces }))) onCerrar()
  }

  return <DialogoPizarra titulo={bloque ? 'Editar bloque' : 'Nuevo bloque'} onCerrar={onCerrar}>
    <form onSubmit={guardar} className="grid gap-4">
      <label className="grid gap-1 text-sm text-butter-muted">
        Título (opcional)
        <input value={titulo} onChange={evento => setTitulo(evento.target.value)} placeholder="Intro, verso, idea…" className={entrada} />
      </label>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm text-butter-muted">Cantidad de compases</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {opciones.map(([valor, etiqueta]) => <button key={valor} type="button" aria-pressed={cantidad !== '' && compases === valor}
            aria-label={valor ? `${valor} compases` : undefined}
            onClick={() => setCantidad(String(valor))}
            className={`${botonPizarra} aria-pressed:border-butter-muted aria-pressed:bg-teal`}>{etiqueta}</button>)}
        </div>
        {bloque && <label className="flex items-center justify-between gap-2 text-sm text-butter-muted">
          Cantidad personalizada (0 = libre)
          <input type="number" inputMode="numeric" required min={0} max={MAX_COMPASES} value={cantidad}
            onChange={evento => setCantidad(evento.target.value)} className={`${entrada} w-20`} />
        </label>}
        {reubicaAcordes && <p role="status" className="text-sm text-butter-muted">Los acordes de los compases que se quiten pasarán al último compás, en el mismo orden.</p>}
      </fieldset>
      <label className="flex items-center justify-between gap-2 text-sm text-butter-muted">
        Repeticiones
        <input type="number" inputMode="numeric" required min={1} max={Number.MAX_SAFE_INTEGER} value={repeticiones}
          onChange={evento => setRepeticiones(evento.target.value)} className={`${entrada} w-20`} />
      </label>
      {error && <p role="alert" className="text-sm text-butter-muted">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCerrar} className={botonPizarra}>Cancelar</button>
        <button type="submit" disabled={!valido} className={botonPrincipalPizarra}>{bloque ? 'Guardar cambios' : 'Crear bloque'}</button>
      </div>
    </form>
  </DialogoPizarra>
}
