import { useState } from 'react'
import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useCombinedRefs } from '@dnd-kit/utilities'
import ConfirmarEliminacionModal from './ConfirmarEliminacionModal'
import ModalAcordeBloque, { SelectorAcordeBloque } from './ModalAcordeBloque'
import ModalBloqueMusical from './ModalBloqueMusical'
import { CabeceraBloque, CompasBloque } from './VistaBloqueMusical'
import {
  columnaBloque, conSeccionesBloque, insertarAcordeBloque, MAX_COMPASES, seccionesBloque,
} from '../lib/bloquesPizarra'

export default function BloqueMusical({ bloque, acordes, subir, bajar, cambiarColumna, otraColumna, onGuardar, onEliminar, error }) {
  const [modal, setModal] = useState(null)
  const compases = seccionesBloque(bloque)
  const libre = bloque.tipo === 'libre'
  const nombre = bloque.titulo || 'bloque musical'
  const id = `bloque:${bloque.id}`
  const data = { tipo: 'bloque', nombre, bloqueId: bloque.id, columna: columnaBloque(bloque) }
  const { collisions } = useDndContext()
  const arrastre = useDraggable({ id, data })
  const { setNodeRef, isDragging } = arrastre
  const destino = useDroppable({ id, data })
  const ref = useCombinedRefs(setNodeRef, destino.setNodeRef)
  const insercion = destino.isOver && !isDragging ? (collisions?.[0]?.data?.despues ? 'despues' : 'antes') : undefined
  const compas = modal?.compas
  const indiceAcorde = compases[compas]?.findIndex(({ id }) => id === modal.entrada)
  const entrada = compases[compas]?.[indiceAcorde]

  const cerrar = () => setModal(null)
  const guardarSecciones = secciones => onGuardar(conSeccionesBloque(bloque, secciones))
  const agregar = (indice, acorde) => onGuardar(insertarAcordeBloque(bloque, indice, acorde))
  const editarCompas = editar => guardarSecciones(compases.map((acordesCompas, indice) =>
    indice === compas ? editar(acordesCompas) : acordesCompas,
  ))
  const quitarEntrada = acordesCompas => acordesCompas.filter(acorde => acorde.id !== entrada.id)
  const moverEnCompas = paso => editarCompas(acordesCompas => arrayMove(acordesCompas, indiceAcorde, indiceAcorde + paso))

  const acciones = [
    { texto: 'Editar bloque', ejecutar: () => setModal({ tipo: 'editar' }) },
    { texto: 'Duplicar bloque', ejecutar: () => onGuardar(conSeccionesBloque({ ...bloque, id: undefined },
      compases.map(lista => lista.map(entrada => ({ ...entrada, id: globalThis.crypto.randomUUID() }))),
    )) },
    ...(!libre ? [{
      texto: 'Agregar compás', disabled: compases.length >= MAX_COMPASES,
      ejecutar: () => guardarSecciones([...compases, []]),
    }] : []),
    { texto: 'Mover arriba', disabled: !subir, ejecutar: subir },
    { texto: 'Mover abajo', disabled: !bajar, ejecutar: bajar },
    { texto: `Mover a la ${otraColumna}`, ejecutar: cambiarColumna },
    { texto: 'Vaciar bloque', disabled: compases.every(compas => !compas.length), ejecutar: () => setModal({ tipo: 'vaciar' }) },
    { texto: 'Eliminar bloque', ejecutar: () => setModal({ tipo: 'eliminar' }) },
  ]

  return <article ref={ref} className="tarjeta-musical tarjeta-bloque" data-insercion={insercion} data-arrastrando={isDragging || undefined}>
    <CabeceraBloque bloque={bloque} cantidad={compases.length} nombre={nombre} arrastre={arrastre} acciones={acciones} />
    <div className={libre ? undefined : 'bloque-compases'}>
      {compases.map((acordesCompas, indice) => <CompasBloque key={indice}
        bloqueId={bloque.id} compas={indice}
        numero={libre ? undefined : indice + 1}
        acordes={acordesCompas}
        onAgregar={() => setModal({ tipo: 'agregar', compas: indice })}
        onConsultar={id => setModal({ tipo: 'consultar', compas: indice, entrada: id })}
      />)}
    </div>
    {modal?.tipo === 'editar' && <ModalBloqueMusical bloque={bloque} onGuardar={onGuardar} onCerrar={cerrar} error={error} />}
    {modal?.tipo === 'agregar' && <SelectorAcordeBloque acordes={acordes} onElegir={acorde => agregar(compas, acorde)} onCerrar={cerrar} error={error} />}
    {modal?.tipo === 'consultar' && entrada && <ModalAcordeBloque
      entrada={entrada} acordes={acordes} error={error} onCerrar={cerrar}
      onElegir={digitacion => editarCompas(acordesCompas => acordesCompas.map(acorde => acorde.id === entrada.id ? { ...acorde, digitacion } : acorde))}
      onAdelantar={indiceAcorde > 0 ? () => moverEnCompas(-1) : undefined}
      onAtrasar={indiceAcorde < compases[compas].length - 1 ? () => moverEnCompas(1) : undefined}
      onQuitar={() => editarCompas(quitarEntrada)}
    />}
    {(modal?.tipo === 'vaciar' || modal?.tipo === 'eliminar') && <ConfirmarEliminacionModal
      titulo={modal.tipo === 'vaciar' ? '¿Vaciar bloque?' : '¿Eliminar bloque?'}
      mensaje={modal.tipo === 'vaciar' ? 'Se borra el contenido del bloque. Los acordes sueltos quedan igual.' : 'Se borra el bloque con su contenido. Los acordes sueltos quedan igual.'}
      etiquetaConfirmar={modal.tipo === 'vaciar' ? 'VACIAR' : 'ELIMINAR'}
      onCancelar={cerrar}
      onConfirmar={modal.tipo === 'vaciar' ? () => guardarSecciones(compases.map(() => [])) : onEliminar}
    />}
  </article>
}
