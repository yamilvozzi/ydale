import { useRef, useState } from 'react'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import AcordeDiagrama from './AcordeDiagrama'
import EscalaDiagrama from './EscalaDiagrama'
import { tituloEscala } from '../lib/escalas'
import { TIPO_ARRASTRE_ACORDE } from '../lib/bloquesPizarra'

const grupos = { escala: 'Escalas', acorde: 'Acordes', bloque: 'Bloques musicales' }

function nombreTarjeta(tipo, datos) {
  if (tipo === 'escala') return tituloEscala(datos)
  if (tipo === 'bloque') return datos.titulo || 'Bloque musical'
  return datos.nombre || 'Sin nombre'
}

function Tarjeta({ tipo, datos, disabled, onEditar, onEliminar, onResaltado, permiteCopiar, renderContenido }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: datos.id, disabled })
  const [copiando, setCopiando] = useState(false)
  const nombre = nombreTarjeta(tipo, datos)
  const puedeCopiar = permiteCopiar && !disabled
  const mover = <button
    type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
    disabled={disabled} aria-label={`Mover ${nombre}`} title={`Mover ${nombre}`}
    className="tarjeta-control tarjeta-mover"
  ><GripVertical aria-hidden="true" /></button>
  const editar = <button type="button" disabled={disabled} onClick={() => onEditar(datos)} aria-label={`Editar ${nombre}`} title="Editar" className="tarjeta-control"><Pencil aria-hidden="true" /></button>
  const eliminar = <button type="button" disabled={disabled} onClick={() => onEliminar(datos)} aria-label={`Eliminar ${nombre}`} title="Eliminar" className="tarjeta-control tarjeta-eliminar"><Trash2 aria-hidden="true" /></button>

  return <article
    ref={setNodeRef}
    // Sólo traslación: nunca escalar el diapasón al pasar sobre una tarjeta de otro ancho.
    style={{ transform: CSS.Translate.toString(transform), transition }}
    className={`tarjeta-musical tarjeta-${tipo}${isDragging || copiando ? ' tarjeta-arrastrando' : ''}`}
  >
    {renderContenido ? renderContenido(mover) : <>
      <header className="tarjeta-cabecera">
        {tipo === 'escala' && <div className="tarjeta-mover-sector">{mover}</div>}
        <h3 className="tarjeta-nombre" title={nombre}>{nombre}</h3>
        {tipo === 'escala' && <div className="tarjeta-editar-sector">{editar}{eliminar}</div>}
      </header>
      <div
        className={tipo === 'escala' ? 'min-w-0' : 'min-w-0 overflow-x-auto'}
        draggable={puedeCopiar || undefined}
        title={puedeCopiar ? 'Arrastrá el diagrama a un bloque para copiar el acorde' : undefined}
        onDragStart={puedeCopiar ? evento => {
          evento.dataTransfer.effectAllowed = 'copy'
          evento.dataTransfer.setData(TIPO_ARRASTRE_ACORDE, datos.id)
          setCopiando(true)
        } : undefined}
        onDragEnd={permiteCopiar ? () => setCopiando(false) : undefined}
      >
        {tipo === 'escala' ? <EscalaDiagrama escala={datos} onResaltado={onResaltado && (resaltado => onResaltado({ ...datos, resaltado }))} /> : <AcordeDiagrama acorde={datos} />}
      </div>
      {tipo === 'acorde' && <footer className="tarjeta-controles">{mover}{editar}{eliminar}</footer>}
    </>}
  </article>
}

/** Ordenamiento de las tarjetas dentro de su grupo. */
export default function TarjetasOrdenables({ tipo, items, onReordenar, onEditar, onEliminar, onResaltado, permiteCopiar = false, renderContenido, disabled = false }) {
  const [pendientes, setPendientes] = useState(null)
  const [error, setError] = useState('')
  const guardando = useRef(false)
  const visibles = pendientes ?? items
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function moverEntre(desde, hasta) {
    if (disabled || guardando.current || desde < 0 || hasta < 0 || hasta >= items.length || desde === hasta) return
    const nuevos = arrayMove(items, desde, hasta)
    guardando.current = true
    setPendientes(nuevos)
    setError('')
    try {
      if (await onReordenar(nuevos) === false) throw new Error('Guardado rechazado')
    } catch {
      setError('No se pudo guardar el orden. Revisá la conexión o el almacenamiento e intentá de nuevo.')
    } finally {
      guardando.current = false
      setPendientes(null)
    }
  }

  function alSoltar({ active, over }) {
    if (over) moverEntre(items.findIndex(({ id }) => id === active.id), items.findIndex(({ id }) => id === over.id))
  }

  const posicion = (id) => visibles.findIndex((item) => item.id === id) + 1
  const nombre = (id) => nombreTarjeta(tipo, visibles.find((item) => item.id === id) ?? {})
  return <div className="min-w-0">
    {error && <p role="alert" className="mb-3 text-sm text-butter-muted">{error}</p>}
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={alSoltar}
      accessibility={{
        screenReaderInstructions: { draggable: 'Para mover, presioná espacio. Usá las flechas para elegir la posición, espacio para soltar y Escape para cancelar.' },
        announcements: {
          onDragStart: ({ active }) => `Moviendo ${nombre(active.id)}, posición ${posicion(active.id)} de ${visibles.length}.`,
          onDragOver: ({ over }) => over ? `Posición ${posicion(over.id)} de ${visibles.length}.` : 'Fuera de la lista.',
          onDragEnd: ({ over }) => over ? `Soltado en la posición ${posicion(over.id)}.` : 'Movimiento cancelado.',
          onDragCancel: () => 'Movimiento cancelado. Se conserva el orden anterior.',
        },
      }}
    >
      <SortableContext items={visibles} strategy={tipo === 'acorde' ? rectSortingStrategy : verticalListSortingStrategy}>
        <div role="group" aria-label={grupos[tipo]} aria-busy={Boolean(pendientes)} className={tipo === 'acorde' ? 'flex min-w-0 flex-wrap items-start gap-3' : 'flex min-w-0 flex-col gap-4'}>
          {visibles.map((datos, indice) => <Tarjeta key={datos.id} tipo={tipo} datos={datos} disabled={disabled || Boolean(pendientes)}
            onEditar={onEditar} onEliminar={onEliminar} onResaltado={onResaltado} permiteCopiar={permiteCopiar}
            renderContenido={renderContenido && (mover => renderContenido(datos, {
              mover,
              subir: indice > 0 ? () => moverEntre(indice, indice - 1) : undefined,
              bajar: indice < visibles.length - 1 ? () => moverEntre(indice, indice + 1) : undefined,
            }))}
          />)}
        </div>
      </SortableContext>
    </DndContext>
  </div>
}
