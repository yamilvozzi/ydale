import { useEffect, useRef, useState } from 'react'
import DialogoPizarra, { botonPizarra, botonPrincipalPizarra } from './DialogoPizarra'
import { fechaLocal, mensajeProyectoPizarra } from '../lib/proyectosPizarra'

const campo = 'min-h-11 w-full min-w-0 rounded-lg border border-borde bg-fondo p-2.5 text-base text-butter focus:border-teal focus:outline-none'

export default function ModalProyectoPizarra({ modo, proyecto, onGuardar, onGuardarFicha, onContinuar, onCerrar }) {
  const [paso, setPaso] = useState(modo === 'pendientes' ? 'pendientes' : modo === 'guardar' && proyecto ? 'opciones' : 'ficha')
  const [id] = useState(() => crypto.randomUUID())
  const [titulo, setTitulo] = useState(() => {
    if (modo === 'renombrar') return proyecto.titulo
    if (modo === 'duplicar') return `${proyecto.titulo.slice(0, 193)} (copia)`
    return ''
  })
  const [fecha, setFecha] = useState(() => ['renombrar', 'duplicar'].includes(modo) ? proyecto.fecha ?? '' : fechaLocal())
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const bloqueo = useRef(false)
  const foco = useRef(null)

  useEffect(() => { foco.current?.focus() }, [paso])

  function elegir(nuevoPaso) {
    setError('')
    setPaso(nuevoPaso)
  }

  async function completar(operacion, guardarAntesDeContinuar = false) {
    if (bloqueo.current) return
    bloqueo.current = true
    setOcupado(true)
    setError('')
    try {
      await operacion()
      if (guardarAntesDeContinuar && onContinuar) {
        setPaso('continuar')
        await onContinuar()
      }
      onCerrar()
    } catch (error) {
      setError(mensajeProyectoPizarra(error))
    } finally {
      bloqueo.current = false
      setOcupado(false)
    }
  }

  const tituloDialogo = paso === 'pendientes' ? 'Cambios sin guardar'
    : paso === 'continuar' ? 'Pizarra guardada'
      : modo === 'renombrar' ? 'Renombrar pizarra'
        : modo === 'duplicar' ? 'Duplicar pizarra'
          : paso === 'ficha' && proyecto ? 'Guardar como nueva' : 'Guardar pizarra'

  return <DialogoPizarra titulo={tituloDialogo} ocupado={ocupado} onCerrar={onCerrar}>
    {paso === 'ficha' ? <form className="flex flex-col gap-3" onSubmit={e => {
      e.preventDefault()
      if (titulo.trim()) completar(() => onGuardarFicha({ id, titulo, fecha }), true)
    }}>
      <label className="flex min-w-0 flex-col gap-1 text-sm text-butter-muted">Título
        <input ref={foco} required maxLength={200} value={titulo} onChange={e => setTitulo(e.target.value)} disabled={ocupado} className={campo} />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm text-butter-muted">Fecha (opcional)
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} disabled={ocupado} className={campo} />
      </label>
      {error && <p role="alert" className="text-sm text-butter-muted">{error}</p>}
      <div className="mt-1 flex flex-wrap justify-end gap-2">
        <button type="button" disabled={ocupado} onClick={onCerrar} className={botonPizarra}>Cancelar</button>
        <button type="submit" disabled={ocupado || !titulo.trim()} className={botonPrincipalPizarra}>{ocupado ? 'Guardando…' : modo === 'duplicar' ? 'Duplicar' : 'Guardar'}</button>
      </div>
    </form> : <div className="space-y-3">
      {paso === 'pendientes' && <p className="text-sm text-butter-muted">Hay modificaciones en la pizarra actual. Elegí qué hacer antes de continuar.</p>}
      {paso === 'opciones' && <p className="break-words text-sm text-butter-muted">Estás trabajando en «{proyecto.titulo}».</p>}
      {error && <p role="alert" className="text-sm text-butter-muted">{error}</p>}
      {ocupado && <p role="status" className="text-sm text-butter-muted">Procesando…</p>}
      <div className="grid gap-2">
        {paso === 'pendientes' && <>
          <button type="button" disabled={ocupado} onClick={() => elegir(proyecto ? 'opciones' : 'ficha')} className={botonPrincipalPizarra}>Guardar los cambios</button>
          <button type="button" disabled={ocupado} onClick={() => completar(onContinuar)} className={botonPizarra}>Descartar cambios y continuar</button>
        </>}
        {paso === 'opciones' && <>
          <button type="button" disabled={ocupado} onClick={() => completar(onGuardar, true)} className={botonPrincipalPizarra}>Guardar cambios</button>
          <button type="button" disabled={ocupado} onClick={() => elegir('ficha')} className={botonPizarra}>Guardar como nueva</button>
        </>}
        {paso === 'continuar' && <button type="button" disabled={ocupado} onClick={() => completar(onContinuar)} className={botonPrincipalPizarra}>Reintentar continuar</button>}
        <button type="button" ref={foco} disabled={ocupado} onClick={onCerrar} className={botonPizarra}>Cancelar</button>
      </div>
    </div>}
  </DialogoPizarra>
}
