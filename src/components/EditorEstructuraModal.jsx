import { ArrowDown, ArrowUp, Check, Copy, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { bloquesDesdeLetra, crearBloque, nombreBloque, normalizarEstructura, separarParrafos, TIPOS_BLOQUE } from '../lib/estructura'
import { actualizarLetraConAnclas, asignarAcorde } from '../lib/anclasEstructura'
import { copiarAcordesDesde, duplicarBloque, moverAcordeEnLinea } from '../lib/herramientasEstructura'
import LetraConAcordes from './LetraConAcordes'

const campo = 'min-h-11 w-full rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-butter placeholder:text-butter-muted focus:border-teal focus:outline-none disabled:opacity-50'
const etiqueta = 'flex min-w-0 flex-col gap-1 text-xs text-butter-muted'

export default function EditorEstructuraModal({ estructura, letraTema = '', referencia = '', acordes = [], onCerrar, onGuardar, guardando = false, error = '' }) {
  const [borrador, setBorrador] = useState(() => normalizarEstructura(estructura))
  const [letraCompleta, setLetraCompleta] = useState(letraTema)
  const [importadorAbierto, setImportadorAbierto] = useState(!estructura.bloques.length)
  const [copiarEn, setCopiarEn] = useState(null)
  const dialogo = useRef(null)
  const entrada = useRef(null)
  const cerrar = useRef(null)
  const enviando = useRef(false)
  const bloqueParaEnfocar = useRef(null)
  const empezarPorLetra = useRef(!estructura.bloques.length)
  const seleccionesTexto = useRef(new Map())
  const id = useId()
  const parrafos = separarParrafos(letraCompleta).length

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    const modal = dialogo.current
    // beforeinput nativo también captura borrados desde teclados táctiles.
    function antesDeEditar(evento) {
      const campo = evento.target
      if (campo.dataset.letraBloque) seleccionesTexto.current.set(campo.dataset.letraBloque, { texto: campo.value, inicio: campo.selectionStart, fin: campo.selectionEnd })
    }
    modal.addEventListener('beforeinput', antesDeEditar)
    document.body.style.overflow = 'hidden'
    modal.showModal()
    if (empezarPorLetra.current) entrada.current?.focus()
    else cerrar.current.focus()
    return () => {
      modal.close()
      modal.removeEventListener('beforeinput', antesDeEditar)
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  function editarBloque(id, cambios) {
    setBorrador(actual => ({ ...actual, bloques: actual.bloques.map(bloque => bloque.id === id ? { ...bloque, ...cambios } : bloque) }))
  }

  function capturarSeleccion(id, evento) {
    const entrada = evento.currentTarget
    seleccionesTexto.current.set(id, { texto: entrada.value, inicio: entrada.selectionStart, fin: entrada.selectionEnd })
  }

  function editarLetra(id, evento) {
    const entrada = evento.currentTarget
    const letra = entrada.value
    const seleccion = seleccionesTexto.current.get(id)
    const inputType = evento.nativeEvent.inputType
    setBorrador(actual => ({ ...actual, bloques: actual.bloques.map(bloque => bloque.id === id ? actualizarLetraConAnclas(bloque, letra, seleccion, inputType) : bloque) }))
    capturarSeleccion(id, evento)
  }

  function separarLetra() {
    const bloques = bloquesDesdeLetra(letraCompleta)
    bloqueParaEnfocar.current = bloques[0]?.id
    setBorrador({ version: 1, bloques })
    setImportadorAbierto(false)
  }

  function alPegar(evento) {
    if (borrador.bloques.length) return
    const pegada = evento.clipboardData.getData('text/plain')
    if (!pegada.trim()) return
    evento.preventDefault()
    setLetraCompleta(pegada)
    const bloques = bloquesDesdeLetra(pegada)
    bloqueParaEnfocar.current = bloques[0]?.id
    setBorrador({ version: 1, bloques })
    setImportadorAbierto(false)
  }

  function agregarBloque() {
    const nuevo = crearBloque()
    setBorrador(actual => ({ ...actual, bloques: [...actual.bloques, nuevo] }))
    bloqueParaEnfocar.current = nuevo.id
  }

  function duplicar(id) {
    const copia = duplicarBloque(borrador.bloques.find(bloque => bloque.id === id))
    bloqueParaEnfocar.current = copia.id
    setBorrador(actual => {
      const bloques = [...actual.bloques]
      bloques.splice(bloques.findIndex(bloque => bloque.id === id) + 1, 0, copia)
      return { ...actual, bloques }
    })
    setCopiarEn(null)
  }

  function copiar(destinoId, origenId) {
    if (!origenId) return
    setBorrador(actual => {
      const origen = actual.bloques.find(bloque => bloque.id === origenId)
      if (!origen || origenId === destinoId) return actual
      return { ...actual, bloques: actual.bloques.map(bloque => bloque.id === destinoId ? copiarAcordesDesde(bloque, origen) : bloque) }
    })
    setCopiarEn(null)
  }

  useEffect(() => {
    if (!bloqueParaEnfocar.current) return
    dialogo.current.querySelector(`[data-bloque="${bloqueParaEnfocar.current}"] select`)?.focus()
    bloqueParaEnfocar.current = null
  }, [borrador.bloques])

  function moverBloque(indice, paso) {
    setBorrador(actual => {
      const bloques = [...actual.bloques]
      const [bloque] = bloques.splice(indice, 1)
      bloques.splice(indice + paso, 0, bloque)
      return { ...actual, bloques }
    })
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (guardando || enviando.current) return
    enviando.current = true
    try { await onGuardar(borrador) } finally { enviando.current = false }
  }

  return (
    <dialog ref={dialogo} aria-labelledby={`${id}-titulo`} aria-busy={guardando}
      onCancel={evento => {
        evento.preventDefault()
        if (guardando || enviando.current) return
        const selector = dialogo.current.querySelector('[data-cerrar-selector-acordes]')
        if (selector) selector.click()
        else if (copiarEn) setCopiarEn(null)
        else onCerrar()
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-6xl overflow-hidden rounded-xl border border-borde bg-superficie p-0 text-butter shadow-2xl backdrop:bg-black/70 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)]"
    >
      <form onSubmit={enviar} className="flex max-h-[calc(100dvh-1.5rem-2px)] flex-col sm:max-h-[calc(100dvh-3rem-2px)]">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-borde px-4 py-3 sm:px-6">
          <div><h2 id={`${id}-titulo`} className="text-lg modal-titulo">Editar estructura</h2>{referencia && <p className="mt-1 text-sm text-butter-muted">{referencia}</p>}</div>
          <button ref={cerrar} type="button" disabled={guardando} onClick={onCerrar} aria-label="Cerrar editor de estructura" className="accion-icono rounded-lg text-butter-muted hover:bg-fondo hover:text-butter disabled:opacity-40"><X size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <fieldset disabled={guardando} className="min-w-0">
            <button type="button" aria-expanded={importadorAbierto} aria-controls={`${id}-importar`} onClick={() => setImportadorAbierto(abierto => !abierto)} className="mb-3 min-h-11 rounded-lg border border-borde px-3 text-xs text-butter-muted hover:bg-fondo hover:text-butter">PEGAR LETRA COMPLETA</button>
            {importadorAbierto && <section id={`${id}-importar`} className="mb-5 rounded-lg border border-borde bg-fondo/40 p-3 sm:p-4">
              <label className={etiqueta}>Letra completa
                <textarea ref={entrada} value={letraCompleta} onPaste={alPegar} onChange={evento => setLetraCompleta(evento.target.value)} rows={6} placeholder="Pegá la letra completa. Los párrafos separados por una línea vacía se convertirán en bloques." className={`${campo} mt-1 min-h-36 resize-y leading-relaxed`} />
              </label>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-butter-muted">{parrafos} {parrafos === 1 ? 'bloque' : 'bloques'}{borrador.bloques.length > 0 ? ' · Reemplaza los bloques del borrador.' : ''}</p>
                <button type="button" disabled={!parrafos} onClick={separarLetra} className="min-h-11 rounded-lg bg-teal px-3 text-xs text-butter hover:bg-green disabled:opacity-40">SEPARAR EN BLOQUES</button>
              </div>
            </section>}
            {!borrador.bloques.length && <p className="mb-4 text-sm text-butter-muted">Pegá la letra o agregá un bloque instrumental.</p>}
            <ol className="space-y-3" aria-label="Bloques de la estructura">
              {borrador.bloques.map((bloque, indice) => <li key={bloque.id} data-bloque={bloque.id} className="rounded-lg border border-borde bg-fondo/30 p-3 sm:p-4">
                <header className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="min-w-0 break-words text-sm text-butter">{indice + 1}. {nombreBloque(bloque)}</h3>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" disabled={indice === 0} onClick={() => moverBloque(indice, -1)} aria-label={`Subir bloque ${indice + 1}`} className="accion-icono rounded-lg text-butter-muted hover:bg-superficie disabled:opacity-30"><ArrowUp /></button>
                    <button type="button" disabled={indice === borrador.bloques.length - 1} onClick={() => moverBloque(indice, 1)} aria-label={`Bajar bloque ${indice + 1}`} className="accion-icono rounded-lg text-butter-muted hover:bg-superficie disabled:opacity-30"><ArrowDown /></button>
                    <button type="button" onClick={() => setBorrador(actual => ({ ...actual, bloques: actual.bloques.filter(actual => actual.id !== bloque.id) }))} aria-label={`Quitar bloque ${indice + 1}`} className="accion-icono rounded-lg text-butter-muted hover:bg-superficie hover:text-butter"><Trash2 /></button>
                  </div>
                </header>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => duplicar(bloque.id)} className="flex min-h-11 items-center gap-2 rounded-lg border border-borde px-3 text-xs text-butter-muted hover:bg-superficie hover:text-butter"><Copy size={14} /> Duplicar bloque</button>
                  <button type="button" aria-expanded={copiarEn === bloque.id} aria-controls={`${id}-copiar-${bloque.id}`}
                    disabled={!borrador.bloques.some(otro => otro.id !== bloque.id && otro.anclas?.length)}
                    onClick={() => setCopiarEn(actual => actual === bloque.id ? null : bloque.id)}
                    className="min-h-11 rounded-lg border border-borde px-3 text-xs text-butter-muted hover:bg-superficie hover:text-butter disabled:opacity-40"
                  >Copiar acordes desde...</button>
                </div>
                {copiarEn === bloque.id && <div id={`${id}-copiar-${bloque.id}`} className="mb-3 rounded-lg border border-borde bg-superficie p-3">
                  <label className={etiqueta}>Bloque de origen
                    <select value="" onChange={evento => copiar(bloque.id, evento.target.value)} className={campo}>
                      <option value="">Elegir bloque</option>
                      {borrador.bloques.map((otro, indice) => otro.id !== bloque.id && otro.anclas?.length ? <option key={otro.id} value={otro.id}>{indice + 1}. {nombreBloque(otro)}</option> : null)}
                    </select>
                  </label>
                  <p className="mt-2 text-xs text-butter-muted">Reemplaza los acordes de este bloque. Después podés ajustar sus posiciones.</p>
                </div>}
                <div className="mb-3 grid grid-cols-[minmax(0,1fr)_5rem] gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_6rem]">
                  <label className={etiqueta}>Tipo
                    <select value={bloque.tipo} onChange={evento => editarBloque(bloque.id, { tipo: evento.target.value })} className={campo}>{TIPOS_BLOQUE.map(tipo => <option key={tipo.valor} value={tipo.valor}>{tipo.etiqueta}</option>)}</select>
                  </label>
                  <label className={`${etiqueta} order-3 col-span-2 sm:order-none sm:col-span-1`}>Nombre libre
                    <input value={bloque.nombre} onChange={evento => editarBloque(bloque.id, { nombre: evento.target.value })} maxLength={80} placeholder="Ej.: VERSO 1" className={campo} />
                  </label>
                  <label className={etiqueta}>Repeticiones
                    <div className="relative"><span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">×</span><input type="number" min={1} step={1} required value={bloque.repeticiones} onChange={evento => editarBloque(bloque.id, { repeticiones: evento.target.value })} className={`${campo} pl-7 pr-1`} /></div>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <label className={etiqueta}>Letra del bloque
                    <textarea data-letra-bloque={bloque.id} value={bloque.letra} onSelect={evento => capturarSeleccion(bloque.id, evento)} onBeforeInput={evento => capturarSeleccion(bloque.id, evento)} onKeyDown={evento => capturarSeleccion(bloque.id, evento)} onChange={evento => editarLetra(bloque.id, evento)} rows={Math.min(8, Math.max(3, bloque.letra.split('\n').length))} placeholder="Letra o indicación instrumental" className={`${campo} resize-y leading-relaxed`} />
                  </label>
                  <label className={etiqueta}>Nota del bloque
                    <textarea value={bloque.nota} onChange={evento => editarBloque(bloque.id, { nota: evento.target.value })} maxLength={180} rows={3} placeholder="Ej.: Entra batería en la segunda vuelta" className={`${campo} resize-y leading-relaxed`} />
                  </label>
                </div>
                <div className="mt-3 border-t border-borde pt-3">
                  <p className="mb-2 text-xs text-butter-muted">Tocá la letra para ubicar un acorde. Mantené pulsado un acorde y movelo dentro de su línea.</p>
                  <LetraConAcordes letra={bloque.letra} anclas={bloque.anclas} acordes={acordes} editable disabled={guardando}
                    onAsignar={(posicion, acordeId, anclaId) => setBorrador(actual => ({ ...actual, bloques: actual.bloques.map(actual => actual.id === bloque.id ? asignarAcorde(actual, posicion, acordeId, acordes, anclaId) : actual) }))}
                    onEliminar={id => editarBloque(bloque.id, { anclas: (bloque.anclas ?? []).filter(ancla => ancla.id !== id) })}
                    onMover={(anclaId, posicion) => setBorrador(actual => ({ ...actual, bloques: actual.bloques.map(actual => actual.id === bloque.id ? moverAcordeEnLinea(actual, anclaId, posicion) : actual) }))}
                  />
                </div>
              </li>)}
            </ol>
            <button type="button" onClick={agregarBloque} className="mt-4 flex min-h-11 items-center gap-2 rounded-lg border border-borde px-3 text-sm text-butter-muted hover:bg-fondo hover:text-butter"><Plus size={16} /> Agregar bloque</button>
          </fieldset>
        </div>
        <footer className="shrink-0 border-t border-borde px-4 py-3 sm:px-6">
          {error && <p role="alert" className="mb-3 text-sm text-butter-muted">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" disabled={guardando} onClick={onCerrar} className="min-h-11 rounded-lg border border-borde px-4 text-sm text-butter-muted hover:bg-fondo disabled:opacity-40">Cancelar</button>
            <button type="submit" disabled={guardando} className="flex min-h-11 items-center gap-2 rounded-lg bg-teal px-4 text-sm text-butter hover:bg-green disabled:opacity-40"><Check size={17} />{guardando ? 'Guardando…' : 'Guardar estructura'}</button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
