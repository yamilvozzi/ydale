import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Link } from 'react-router-dom'
import MenuSetlist from './MenuSetlist'

function Cancion({ item, numero, total, edicion, ocupado, setlistId, onCambiar, onAbrir }) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !edicion || ocupado })
  const nombre = item.nombre || 'Canción no disponible'
  return <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}
    className={`tarjeta-enlace relative grid w-full min-w-0 items-center gap-1 rounded-lg ${edicion ? 'grid-cols-[5rem_minmax(0,1fr)_5rem]' : 'grid-cols-[3rem_minmax(0,1fr)_3rem]'} ${isDragging ? 'z-10 opacity-70' : ''}`}>
    <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-1">
      {edicion && <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} disabled={ocupado}
        aria-label={`Mover ${nombre}`} className="accion-plana accion-icono touch-none select-none rounded-lg disabled:opacity-50"><GripVertical /></button>}
      <span aria-hidden="true" className={`shrink-0 text-sm tabular-nums text-butter ${edicion ? 'pl-1' : 'pl-4'}`}>{numero}.</span>
    </div>
    <Link to={`/tema/${encodeURIComponent(item.song_id)}/letra?setlist=${setlistId}`}
      state={{ setlistScroll: window.scrollY, setlistId }} onClick={onAbrir}
      className="col-start-2 row-start-1 min-w-0 rounded-lg px-3 py-4 text-center focus-visible:outline-2 focus-visible:outline-butter">
      <p className="break-words">{nombre}</p>
      {item.artista && <p className="break-words text-xs text-butter-muted">{item.artista}</p>}
    </Link>
    {edicion && <div className="col-start-3 row-start-1 flex min-w-0 self-start justify-end"><MenuSetlist nombre={`${numero}. ${nombre}`} disabled={ocupado} acciones={[
      { texto: 'Quitar del setlist', ejecutar: () => onCambiar('quitar', item.id) },
      ...(numero > 1 ? [{ texto: 'Mover al principio', ejecutar: () => onCambiar('principio', item.id) }] : []),
      ...(numero < total ? [{ texto: 'Mover al final', ejecutar: () => onCambiar('final', item.id) }] : []),
    ]} /></div>}
  </li>
}

export default function CancionesSetlist({ items, edicion, ocupado, setlistId, onGuardar, onAbrir }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  function cambiar(accion, id) {
    const desde = items.findIndex(item => item.id === id)
    if (desde < 0) return
    const nuevos = accion === 'quitar' ? items.filter(item => item.id !== id)
      : arrayMove(items, desde, accion === 'principio' ? 0 : items.length - 1)
    onGuardar(nuevos)
  }
  return <DndContext sensors={sensors} collisionDetection={closestCenter}
    onDragEnd={({ active, over }) => {
      if (!edicion || ocupado || !over || active.id === over.id) return
      const desde = items.findIndex(item => item.id === active.id)
      const hasta = items.findIndex(item => item.id === over.id)
      if (desde >= 0 && hasta >= 0) onGuardar(arrayMove(items, desde, hasta))
    }}
    accessibility={{
      screenReaderInstructions: { draggable: 'Para mover, presioná espacio. Usá las flechas para elegir la posición, espacio para soltar y Escape para cancelar.' },
      announcements: {
        onDragStart: ({ active }) => `Moviendo canción ${items.findIndex(item => item.id === active.id) + 1}.`,
        onDragOver: ({ over }) => over ? `Posición ${items.findIndex(item => item.id === over.id) + 1}.` : 'Fuera de la lista.',
        onDragEnd: ({ over }) => over ? `Nueva posición ${items.findIndex(item => item.id === over.id) + 1}.` : 'Movimiento cancelado.',
        onDragCancel: () => 'Movimiento cancelado.',
      },
    }}>
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <ol aria-label="Canciones del setlist" aria-busy={ocupado} className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {items.map((item, indice) => <Cancion key={item.id} item={item} numero={indice + 1} total={items.length}
          edicion={edicion} ocupado={ocupado} setlistId={setlistId} onCambiar={cambiar} onAbrir={onAbrir} />)}
      </ol>
    </SortableContext>
  </DndContext>
}
