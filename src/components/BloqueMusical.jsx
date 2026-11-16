import { useState } from 'react'
import { Plus } from 'lucide-react'
import { arrayMove } from '@dnd-kit/sortable'
import ConfirmarEliminacionModal from './ConfirmarEliminacionModal'
import MenuSetlist from './MenuSetlist'
import ModalAcordeBloque, { SelectorAcordeBloque } from './ModalAcordeBloque'
import ModalBloqueMusical from './ModalBloqueMusical'
import {
  conSeccionesBloque, insertarAcordeBloque, MAX_COMPASES, nombreAcordeBloque, seccionesBloque, TIPO_ARRASTRE_ACORDE,
} from '../lib/bloquesPizarra'

function CompasBloque({ numero, acordes, onAgregar, onConsultar, onSoltar }) {
  const [resaltado, setResaltado] = useState(false)
  const nombre = numero ? `Compás ${numero}` : 'Secuencia libre'

  function resaltarDestino(evento) {
    if (!evento.dataTransfer.types.includes(TIPO_ARRASTRE_ACORDE)) return
    evento.preventDefault()
    evento.dataTransfer.dropEffect = 'copy'
    setResaltado(true)
  }

  return <div role="group" aria-label={nombre} data-destino={resaltado || undefined} className="bloque-compas"
    onDragEnter={resaltarDestino}
    onDragOver={resaltarDestino}
    onDragLeave={evento => {
      if (!evento.currentTarget.contains(evento.relatedTarget)) setResaltado(false)
    }}
    onDrop={evento => {
      if (!evento.dataTransfer.types.includes(TIPO_ARRASTRE_ACORDE)) return
      evento.preventDefault()
      setResaltado(false)
      onSoltar(evento.dataTransfer.getData(TIPO_ARRASTRE_ACORDE))
    }}
  >
    <div className="min-w-0">
      {numero && <div aria-hidden="true" className="px-1 text-xs tabular-nums text-butter-muted">{numero}</div>}
      {acordes.length > 0 && <ul className="flex flex-wrap items-center gap-1">
        {acordes.map(({ id, digitacion }) => <li key={id} className="min-w-0 max-w-full">
          <button type="button" aria-haspopup="dialog" onClick={() => onConsultar(id)}
            className="bloque-cifrado">{nombreAcordeBloque(digitacion)}</button>
        </li>)}
      </ul>}
    </div>
    <button type="button" aria-haspopup="dialog" aria-label={numero ? `Agregar acorde al compás ${numero}` : 'Agregar acorde al bloque libre'}
      title="Agregar acorde" onClick={onAgregar} className="tarjeta-control bloque-agregar-acorde"><Plus aria-hidden="true" /></button>
  </div>
}

export default function BloqueMusical({ bloque, acordes, mover, subir, bajar, onGuardar, onEliminar, error }) {
  const [modal, setModal] = useState(null)
  const compases = seccionesBloque(bloque)
  const libre = bloque.tipo === 'libre'
  const nombre = bloque.titulo || 'bloque musical'
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
    { texto: 'Duplicar bloque', ejecutar: () => onGuardar({ ...bloque, id: undefined }) },
    ...(!libre ? [{
      texto: 'Agregar compás', disabled: compases.length >= MAX_COMPASES,
      ejecutar: () => guardarSecciones([...compases, []]),
    }] : []),
    { texto: 'Mover arriba', disabled: !subir, ejecutar: subir },
    { texto: 'Mover abajo', disabled: !bajar, ejecutar: bajar },
    { texto: 'Vaciar bloque', disabled: compases.every(compas => !compas.length), ejecutar: () => setModal({ tipo: 'vaciar' }) },
    { texto: 'Eliminar bloque', ejecutar: () => setModal({ tipo: 'eliminar' }) },
  ]

  return <>
    <header className="bloque-cabecera">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
        {bloque.titulo && <h3 className="min-w-0 text-base font-semibold [overflow-wrap:anywhere]">{bloque.titulo}</h3>}
        <div className="flex flex-wrap items-baseline gap-2 text-xs tabular-nums text-butter-muted">
          <span>{libre ? 'Libre' : `${compases.length} ${compases.length === 1 ? 'compás' : 'compases'}`}</span>
          <span aria-label={`${bloque.repeticiones} repeticiones`}>×{bloque.repeticiones}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        {mover}
        <MenuSetlist nombre={nombre} acciones={acciones} flotante />
      </div>
    </header>
    <div className={libre ? undefined : 'bloque-compases'}>
      {compases.map((acordesCompas, indice) => <CompasBloque key={indice}
        numero={libre ? undefined : indice + 1}
        acordes={acordesCompas}
        onAgregar={() => setModal({ tipo: 'agregar', compas: indice })}
        onConsultar={id => setModal({ tipo: 'consultar', compas: indice, entrada: id })}
        onSoltar={id => {
          const acorde = acordes.find(acorde => acorde.id === id)
          if (acorde) agregar(indice, acorde)
        }}
      />)}
    </div>
    {modal?.tipo === 'editar' && <ModalBloqueMusical bloque={bloque} onGuardar={onGuardar} onCerrar={cerrar} error={error} />}
    {modal?.tipo === 'agregar' && <SelectorAcordeBloque acordes={acordes} onElegir={acorde => agregar(compas, acorde)} onCerrar={cerrar} error={error} />}
    {modal?.tipo === 'consultar' && entrada && <ModalAcordeBloque
      digitacion={entrada.digitacion} acordes={acordes} compas={compas} cantidad={compases.length} error={error} onCerrar={cerrar}
      onElegir={digitacion => editarCompas(acordesCompas => acordesCompas.map(acorde => acorde.id === entrada.id ? { ...acorde, digitacion } : acorde))}
      onAdelantar={indiceAcorde > 0 ? () => moverEnCompas(-1) : undefined}
      onAtrasar={indiceAcorde < compases[compas].length - 1 ? () => moverEnCompas(1) : undefined}
      onMover={destino => guardarSecciones(compases.map((acordesCompas, indice) => {
        if (indice === compas) return quitarEntrada(acordesCompas)
        if (indice === destino) return [...acordesCompas, entrada]
        return acordesCompas
      }))}
      onQuitar={() => editarCompas(quitarEntrada)}
    />}
    {(modal?.tipo === 'vaciar' || modal?.tipo === 'eliminar') && <ConfirmarEliminacionModal
      preguntaComoTitulo mensaje={modal.tipo === 'vaciar' ? '¿Quitar todos los acordes de este bloque?' : '¿Eliminar este bloque de la Pizarra?'}
      onCancelar={cerrar}
      onConfirmar={modal.tipo === 'vaciar' ? () => guardarSecciones(compases.map(() => [])) : onEliminar}
    />}
  </>
}
