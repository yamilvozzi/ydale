import { useState } from 'react'
import { DndContext, DragOverlay, KeyboardSensor, MouseSensor, pointerWithin, TouchSensor, useDndContext, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCombinedRefs } from '@dnd-kit/utilities'
import { columnaBloque, COLUMNAS_BLOQUES, seccionesBloque } from '../lib/bloquesPizarra'
import { acordesSueltos, colocarAcordeRepertorio, duplicarBloqueRepertorio, guardarBloqueRepertorio, moverBloqueRepertorio, ubicacionAcorde, vaciarBloqueRepertorio } from '../lib/bloquesRepertorio'
import ConfirmarEliminacionModal from './ConfirmarEliminacionModal'
import DialogoPizarra, { botonPizarra, botonPrincipalPizarra } from './DialogoPizarra'
import ModalAcordeBloque from './ModalAcordeBloque'
import ModalBloqueMusical from './ModalBloqueMusical'
import TarjetasOrdenables, { ListaTarjetasOrdenables } from './TarjetasOrdenables'
import { CabeceraBloque, CompasBloque } from './VistaBloqueMusical'

function admite(origen, destino, teclado = false) {
  if (!destino) return false
  if (origen.tipo === 'bloque') return destino.tipo === 'bloque' || (destino.tipo === 'columna' && (!teclado || destino.vacio))
  return destino.tipo === 'acorde' || destino.tipo === 'cifrado' ||
    ((destino.tipo === 'compas' || destino.tipo === 'zona-acordes') && (!teclado || destino.vacio))
}

function coordenadasTeclado(evento, args) {
  const contenedores = args.context.droppableContainers
  return sortableKeyboardCoordinates(evento, { ...args, context: { ...args.context, droppableContainers: {
    get: id => contenedores.get(id),
    getEnabled: () => contenedores.getEnabled().filter(({ data }) => admite(args.context.active.data.current, data.current, true)),
  } } })
}

function detectarDestino(args) {
  const teclado = !args.pointerCoordinates
  const origen = args.active.data.current
  const droppableContainers = args.droppableContainers.filter(({ data }) => admite(origen, data.current, teclado))
  const parametros = { ...args, droppableContainers }
  // El teclado alinea esquinas; comparar centros falla entre zonas vacías y
  // tarjetas completas, que tienen alturas diferentes.
  const coincidencias = teclado ? droppableContainers.map(contenedor => {
    const rect = args.droppableRects.get(contenedor.id)
    return { id: contenedor.id, data: { droppableContainer: contenedor,
      value: rect ? Math.hypot(rect.left - args.collisionRect.left, rect.top - args.collisionRect.top) : Infinity } }
  }).sort((a, b) => a.data.value - b.data.value).slice(0, 1) : pointerWithin(parametros)
  // En un contenedor anidado, una tarjeta tiene prioridad sobre su zona.
  const prioridad = { acorde: 0, cifrado: 0, bloque: 0, compas: 1, 'zona-acordes': 1, columna: 1 }
  const destino = coincidencias.sort((a, b) => prioridad[a.data.droppableContainer.data.current.tipo] - prioridad[b.data.droppableContainer.data.current.tipo])[0]
  if (!destino) return []
  const rect = args.droppableRects.get(destino.id)
  const inicial = args.active.rect.current.initial
  if (rect) {
    const tipo = destino.data.droppableContainer.data.current.tipo
    const punto = args.pointerCoordinates
    destino.data.despues = punto ? tipo === 'bloque' ? punto.y > rect.top + rect.height / 2 : punto.x > rect.left + rect.width / 2 :
      inicial?.top < rect.top || (inicial?.top === rect.top && inicial.left < rect.left)
  }
  return [destino]
}

function AcordesSueltos({ items, disabled, onEditar, onEliminar, onMover }) {
  const nombre = 'Acordes sueltos'
  const data = { tipo: 'zona-acordes', nombre, compas: 0, vacio: !items.length }
  const { setNodeRef, isOver } = useDroppable({ id: 'zona:sueltos:0', data, disabled })
  return <div ref={setNodeRef} role="group" aria-label={nombre} data-destino={isOver || undefined} className="repertorio-sueltos">
    {items.length > 0 ? <ListaTarjetasOrdenables tipo="acorde" items={items} disabled={disabled} arrastreDesdeDiagrama
      contextoArrastre={{ compas: 0 }} onEditar={onEditar} onEliminar={onEliminar} onMover={onMover} /> :
      <p className="text-sm text-butter-muted">Soltá el acorde acá para dejarlo suelto.</p>}
  </div>
}

function BloqueRepertorio({ bloque, porId, disabled, onConsultar, onAccion, subir, bajar, cambiarColumna, otraColumna }) {
  const nombre = bloque.titulo || 'bloque de acordes'
  const data = { tipo: 'bloque', nombre, bloqueId: bloque.id, columna: columnaBloque(bloque) }
  const id = `bloque:${bloque.id}`
  const arrastre = useDraggable({ id, data, disabled })
  const { setNodeRef, isDragging } = arrastre
  const destino = useDroppable({ id, data, disabled })
  const ref = useCombinedRefs(setNodeRef, destino.setNodeRef)
  const { collisions } = useDndContext()
  const libre = bloque.tipo === 'libre'
  const partes = seccionesBloque(bloque)
  const acciones = [
    { texto: 'Editar bloque', ejecutar: () => onAccion('editar', bloque) },
    { texto: 'Duplicar bloque', ejecutar: () => onAccion('duplicar', bloque) },
    { texto: 'Mover arriba', disabled: !subir, ejecutar: subir },
    { texto: 'Mover abajo', disabled: !bajar, ejecutar: bajar },
    { texto: `Mover a la ${otraColumna}`, ejecutar: cambiarColumna },
    { texto: 'Vaciar bloque', disabled: partes.every(lista => !lista.length), ejecutar: () => onAccion('vaciar', bloque) },
    { texto: 'Eliminar bloque', ejecutar: () => onAccion('eliminar', bloque) },
  ]
  return <article ref={ref} className="tarjeta-musical tarjeta-bloque" data-arrastrando={isDragging || undefined}
    data-insercion={destino.isOver && !isDragging ? collisions?.[0]?.data?.despues ? 'despues' : 'antes' : undefined}>
    <CabeceraBloque bloque={bloque} cantidad={partes.length} nombre={nombre} arrastre={arrastre} acciones={acciones} disabled={disabled} />
    <div className={libre ? undefined : 'repertorio-compases'}>
      {partes.map((lista, indice) => <CompasBloque key={indice} bloqueId={bloque.id} compas={indice} numero={libre ? undefined : indice + 1}
        acordes={lista.map(a => porId.get(a.id)).filter(Boolean)}
        disabled={disabled} onConsultar={onConsultar} />)}
    </div>
  </article>
}

function ColumnaRepertorio({ columna, bloques, disabled, onMover, ...props }) {
  const { setNodeRef, isOver, active } = useDroppable({ id: `columna:${columna}`, data: { tipo: 'columna', columna, vacio: !bloques.length }, disabled })
  const otra = columna === 'izquierda' ? 'derecha' : 'izquierda'
  return <div ref={setNodeRef} role="group" aria-label={`Columna ${columna}`} className="pizarra-columna"
    data-vacia={!bloques.length || undefined} data-arrastrando={active?.data.current.tipo === 'bloque' || undefined} data-destino={isOver || undefined}>
    {bloques.map((bloque, i) => <BloqueRepertorio key={bloque.id} {...props} bloque={bloque} disabled={disabled} otraColumna={otra}
      subir={i ? () => onMover(bloque.id, { columna, referencia: bloques[i - 1].id }) : undefined}
      bajar={i < bloques.length - 1 ? () => onMover(bloque.id, { columna, referencia: bloques[i + 1].id, despues: true }) : undefined}
      cambiarColumna={() => onMover(bloque.id, { columna: otra })} />)}
  </div>
}

function MoverAcordeModal({ acorde, notas, disabled, error, onGuardar, onCerrar }) {
  const origen = ubicacionAcorde(notas, acorde.id)
  const [bloqueId, setBloqueId] = useState(origen.bloqueId ?? '')
  const [compas, setCompas] = useState(origen.compas)
  const [posicion, setPosicion] = useState('final')
  const bloque = notas.bloquesAcordes.find(b => b.id === bloqueId)
  const lista = (bloque ? seccionesBloque(bloque)[compas] ?? [] : acordesSueltos(notas)).filter(a => a.id !== acorde.id)
  const porId = new Map(notas.acordes.map(a => [a.id, a]))
  const campo = 'min-h-11 w-full rounded-lg border border-borde bg-fondo px-3 text-base text-butter'
  return <DialogoPizarra titulo={`Mover ${acorde.nombre || 'acorde'}`} tituloMusical onCerrar={onCerrar} ocupado={disabled}>
    <form className="grid gap-4" onSubmit={async e => {
      e.preventDefault()
      if (await onGuardar(colocarAcordeRepertorio(notas, acorde.id, { bloqueId: bloqueId || undefined, compas, referencia: posicion === 'final' ? undefined : posicion }))) onCerrar()
    }}>
      <label className="grid gap-1 text-sm">Destino
        <select className={campo} disabled={disabled} value={bloqueId} onChange={e => { setBloqueId(e.target.value); setCompas(0); setPosicion('final') }}>
          <option value="">Acordes sueltos</option>
          {notas.bloquesAcordes.map((b, i) => <option key={b.id} value={b.id}>{b.titulo || `Bloque ${i + 1}`} ({columnaBloque(b)})</option>)}
        </select>
      </label>
      {bloque?.tipo === 'compases' && <label className="grid gap-1 text-sm">Compás
        <select className={campo} disabled={disabled} value={compas} onChange={e => { setCompas(Number(e.target.value)); setPosicion('final') }}>
          {bloque.compases.map((_, i) => <option key={i} value={i}>Compás {i + 1}</option>)}
        </select>
      </label>}
      <label className="grid gap-1 text-sm">Posición
        <select className={campo} disabled={disabled} value={posicion} onChange={e => setPosicion(e.target.value)}>
          <option value="final">Al final</option>
          {lista.map((a, i) => <option key={a.id} value={a.id}>Antes de {i + 1}. {porId.get(a.id)?.nombre || 'Sin nombre'}</option>)}
        </select>
      </label>
      {error && <p role="alert" className="text-sm text-butter-muted">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" disabled={disabled} onClick={onCerrar} className={botonPizarra}>Cancelar</button>
        <button type="submit" disabled={disabled} className={botonPrincipalPizarra}>Mover acorde</button>
      </div>
    </form>
  </DialogoPizarra>
}

export default function AcordesRepertorio({ notas, disabled, error, onGuardar, onEditar, onEliminar, modal, setModal }) {
  const [arrastre, setArrastre] = useState(null)
  const sensores = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: coordenadasTeclado, keyboardCodes: { start: ['Space'], end: ['Space'], cancel: ['Escape'] } }))
  const bloques = notas.bloquesAcordes ?? []
  const porId = new Map(notas.acordes.map(a => [a.id, a]))
  const sueltos = acordesSueltos(notas)
  const consultado = modal?.tipo === 'consultar' ? porId.get(modal.id) : undefined
  const moverBloque = (id, destino) => onGuardar(moverBloqueRepertorio(notas, id, destino))
  const cerrar = () => { if (!disabled) setModal(null) }
  const abrirMover = acorde => setModal({ tipo: 'mover-acorde', acorde })
  const accion = (tipo, bloque) => tipo === 'duplicar' ? onGuardar(duplicarBloqueRepertorio(notas, bloque.id)) : setModal({ tipo, bloque })
  function soltar({ active, over, collisions }) {
    setArrastre(null)
    if (disabled || !over || active.id === over.id) return
    const origen = active.data.current, destino = over.data.current
    const despues = collisions?.[0]?.data?.despues
    if (origen.tipo === 'bloque') moverBloque(origen.bloqueId, { columna: destino.columna, referencia: destino.bloqueId, despues })
    else onGuardar(colocarAcordeRepertorio(notas, origen.entradaId ?? active.id, {
      ...destino, referencia: destino.entradaId ?? (destino.tipo === 'acorde' ? over.id : undefined), despues,
    }))
  }
  return <>
    <DndContext sensors={sensores} collisionDetection={detectarDestino} onDragEnd={soltar}
      onDragStart={({ active }) => setArrastre(active.data.current)} onDragCancel={() => setArrastre(null)}
      accessibility={{ screenReaderInstructions: { draggable: 'Presioná espacio para arrastrar, flechas para elegir destino, espacio para soltar y Escape para cancelar. También podés activar Mover para elegir destino en un diálogo.' },
        announcements: {
          onDragStart: ({ active }) => `Moviendo ${active.data.current.nombre}.`,
          onDragOver: ({ over }) => over ? `Destino: ${over.data.current.nombre ?? over.data.current.columna}.` : 'Fuera de un destino válido.',
          onDragEnd: ({ over }) => over ? 'Movimiento terminado.' : 'Movimiento cancelado.',
          onDragCancel: () => 'Movimiento cancelado.',
        } }}>
      {bloques.length > 0 && <div role="group" aria-label="Bloques de acordes" className="pizarra-bloques">
        {COLUMNAS_BLOQUES.map(columna => <ColumnaRepertorio key={columna} columna={columna} bloques={bloques.filter(b => columnaBloque(b) === columna)}
          porId={porId} disabled={disabled} onMover={moverBloque} onAccion={accion}
          onConsultar={id => setModal({ tipo: 'consultar', id })} />)}
      </div>}
      {bloques.length > 0 ? <div className="mt-6">
        <h3 className="mb-3 text-sm text-butter-muted">ACORDES SUELTOS</h3>
        <AcordesSueltos items={sueltos} disabled={disabled} onEditar={onEditar} onEliminar={onEliminar} onMover={abrirMover} />
      </div> : notas.acordes.length > 0 ? <TarjetasOrdenables tipo="acorde" items={notas.acordes} disabled={disabled}
        onReordenar={acordes => onGuardar({ ...notas, acordes })} onEditar={onEditar} onEliminar={onEliminar} /> :
        <p className="text-sm italic text-butter-muted">Todavía no hay diagramas cargados.</p>}
      <DragOverlay dropAnimation={null} className="pointer-events-none">
        {arrastre && <div className="pizarra-arrastre" aria-hidden="true">{arrastre.nombre}</div>}
      </DragOverlay>
    </DndContext>
    {(modal?.tipo === 'crear' || modal?.tipo === 'editar') && <ModalBloqueMusical bloque={modal.bloque} error={error} onCerrar={cerrar}
      onGuardar={bloque => {
        // El modal compartido usa un callback síncrono. Cerramos sólo tras confirmar Supabase.
        if (!disabled) void onGuardar(guardarBloqueRepertorio(notas, bloque)).then(ok => { if (ok) setModal(null) })
        return false
      }} />}
    {modal?.tipo === 'mover-acorde' && <MoverAcordeModal acorde={modal.acorde} notas={notas} disabled={disabled} error={error} onGuardar={onGuardar} onCerrar={() => setModal(null)} />}
    {consultado && <ModalAcordeBloque entrada={{ digitacion: consultado }} acordes={[consultado]} onCerrar={cerrar}>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => abrirMover(consultado)} className={botonPizarra}>Mover acorde</button>
        <button type="button" onClick={() => { cerrar(); onEditar(consultado) }} className={botonPizarra}>Editar acorde</button>
        <button type="button" onClick={() => { cerrar(); onEliminar(consultado) }} className={botonPizarra}>Eliminar acorde</button>
      </div>
    </ModalAcordeBloque>}
    {(modal?.tipo === 'vaciar' || modal?.tipo === 'eliminar') && <ConfirmarEliminacionModal
      titulo={modal.tipo === 'vaciar' ? '¿Vaciar bloque?' : '¿Eliminar bloque?'}
      mensaje="Los acordes no se borran: vuelven a quedar sueltos."
      etiquetaConfirmar={modal.tipo === 'vaciar' ? 'VACIAR' : 'ELIMINAR'}
      onCancelar={() => setModal(null)} onConfirmar={() => onGuardar(vaciarBloqueRepertorio(notas, modal.bloque.id, modal.tipo === 'eliminar'))} />}
  </>
}
