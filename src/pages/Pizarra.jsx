import { BookOpen, CircleDot, FolderOpen, Plus, Save, Timer, Trash2, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import EncabezadoSeccion from '../components/EncabezadoSeccion'
import EditorEscalaModal from '../components/EditorEscalaModal'
import TarjetasOrdenables from '../components/TarjetasOrdenables'
import GeneradorAcordesModal from '../components/GeneradorAcordesModal'
import EditorAcordeModal from '../components/EditorAcordeModal'
import ConfirmarEliminacionModal from '../components/ConfirmarEliminacionModal'
import CirculoQuintasModal from '../components/CirculoQuintasModal'
import TapTempoModal from '../components/TapTempoModal'
import RepertorioPizarraModal from '../components/RepertorioPizarraModal'
import BibliotecaPizarrasModal from '../components/BibliotecaPizarrasModal'
import ModalProyectoPizarra from '../components/ModalProyectoPizarra'
import MenuSetlist from '../components/MenuSetlist'
import ModalExportarPDF from '../components/ModalExportarPDF'
import { tituloEscala } from '../lib/escalas'
import { pizarrasDB, usePizarra } from '../hooks/usePizarra'

const nombreElemento = ({ tipo, datos }) => tipo === 'escala'
  ? tituloEscala(datos) : datos.nombre || 'Sin nombre'
const botonAgregar = 'boton-funcion flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm'
const botonEncabezado = 'accion-plana accion-icono rounded-lg disabled:opacity-40'

function comprobarCambioLocal(resultado) {
  if (!resultado) throw new Error('No se pudo cambiar la pizarra en este dispositivo. Revisá el almacenamiento local.')
}

export default function Pizarra() {
  const pizarra = usePizarra()
  const { elementos, proyecto, pendiente, error, lecturaFallida, guardar, eliminar, vaciar, reordenar, transponer, cargarTema, desplazamiento, reiniciarTransposicion } = pizarra
  const [editor, setEditor] = useState(null)
  const [confirmacion, setConfirmacion] = useState(null)
  const [circuloAbierto, setCirculoAbierto] = useState(false)
  const [tapAbierto, setTapAbierto] = useState(false)
  const [repertorioAbierto, setRepertorioAbierto] = useState(false)
  const [bibliotecaAbierta, setBibliotecaAbierta] = useState(false)
  const [modalProyecto, setModalProyecto] = useState(null)
  const [exportar, setExportar] = useState(false)

  function alGuardar(tipo, datos) {
    if (guardar(tipo, datos)) setEditor(null)
  }

  function pedirVaciado() {
    if (pendiente) setModalProyecto({ modo: 'pendientes', onContinuar: () => comprobarCambioLocal(vaciar()) })
    else setConfirmacion({ todo: true })
  }

  async function pedirApertura(destino) {
    async function abrir() {
      comprobarCambioLocal(pizarra.abrirProyecto(await pizarrasDB.leer(destino.id)))
      setBibliotecaAbierta(false)
    }
    if (pendiente) setModalProyecto({ modo: 'pendientes', onContinuar: abrir })
    else await abrir()
  }

  function cargarDesdeRepertorio(musica) {
    if (!pendiente) return cargarTema(musica)
    setModalProyecto({ modo: 'pendientes', onContinuar: () => {
      comprobarCambioLocal(cargarTema(musica))
      setRepertorioAbierto(false)
    } })
    return false
  }

  return (
    <main className="flex min-h-dvh w-full flex-col px-4 py-6 sm:px-6">
      <EncabezadoSeccion titulo="PIZARRA" compacto acciones={<>
        <button type="button" onClick={() => setBibliotecaAbierta(true)} aria-label="Abrir pizarras" title="Abrir pizarras" className={botonEncabezado}><FolderOpen size={20} aria-hidden="true" /></button>
        <button type="button" disabled={lecturaFallida || (!proyecto && !pendiente)} onClick={() => setModalProyecto({ modo: 'guardar' })} aria-label="Guardar pizarra" title="Guardar pizarra" className={botonEncabezado}><Save size={20} aria-hidden="true" /></button>
      </>} />
      <div className="pizarra-herramientas border-b border-borde pb-3">
        <div role="group" aria-label="Funciones de pizarra" className="pizarra-funciones">
          <button type="button" disabled={lecturaFallida} onClick={() => setRepertorioAbierto(true)} className="boton-funcion flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs tracking-wide"><BookOpen size={17} /> REPERTORIO</button>
          <button type="button" disabled={lecturaFallida} onClick={() => setEditor({ tipo: 'escala' })} aria-label="+ Escala" className={botonAgregar}><Plus size={17} /> Escala</button>
          <button type="button" disabled={lecturaFallida} onClick={() => setEditor({ tipo: 'acorde' })} aria-label="+ Acorde" className={botonAgregar}><Plus size={17} /> Acorde</button>
          <button type="button" disabled={lecturaFallida} onClick={() => setEditor({ tipo: 'generador' })} className={botonAgregar}><WandSparkles size={17} /> Generador</button>
          <button type="button" onClick={() => setCirculoAbierto(true)} className={botonAgregar}><CircleDot size={17} /> Círculo de 5tas</button>
          <button type="button" onClick={() => setTapAbierto(true)} className={botonAgregar}><Timer size={17} /> Tap Tempo</button>
        </div>
        <div className="pizarra-utilidades">
          <div role="group" aria-label="Transposición global" className="pizarra-transposicion">
            <button type="button" disabled={lecturaFallida || !elementos.length} onClick={() => transponer(-1)}
              aria-label="Bajar toda la pizarra un semitono" title="Bajar todo un semitono"
              className="boton-funcion min-w-11 rounded-lg px-2.5 text-base"
            >-1</button>
            <button type="button" disabled={lecturaFallida} onClick={reiniciarTransposicion}
              aria-label={`Restablecer transposición a cero: desplazamiento actual ${desplazamiento > 0 ? '+' : ''}${desplazamiento} semitonos`}
              title="Restablecer transposición a 0" className="boton-funcion min-w-11 rounded-lg px-2.5 text-sm tabular-nums"
            ><span aria-live="polite" aria-atomic="true">{desplazamiento > 0 ? '+' : ''}{desplazamiento}</span></button>
            <button type="button" disabled={lecturaFallida || !elementos.length} onClick={() => transponer(1)}
              aria-label="Subir toda la pizarra un semitono" title="Subir todo un semitono"
              className="boton-funcion min-w-11 rounded-lg px-2.5 text-base"
            >+1</button>
          </div>
          <div className="pizarra-vaciado">
            <button type="button" disabled={!elementos.length && !proyecto && !lecturaFallida && !desplazamiento} onClick={pedirVaciado} className="boton-funcion boton-funcion-destructiva flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-xs"><Trash2 size={16} /> VACIAR PIZARRA</button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex min-w-0 flex-col gap-5">
      {(proyecto || pendiente) && <div className="flex min-w-0 items-center justify-between gap-2">
        <p role="status" className="min-w-0 break-words text-sm text-butter-muted">
          {proyecto ? <>{proyecto.titulo}{pendiente ? ' · Cambios sin guardar' : ' · Guardada'}</> : 'Borrador local · Cambios sin guardar'}
        </p>
        {elementos.length > 0 && <MenuSetlist nombre="la pizarra" acciones={[{ texto: 'Exportar PDF', ejecutar: () => setExportar(true) }]} />}
      </div>}
      {error && !editor && !repertorioAbierto && <p role="alert" className="text-sm text-butter-muted">{error}</p>}
      {!elementos.length && !lecturaFallida && <p className="text-sm italic text-butter-muted">Pizarra vacía.</p>}
      {['escala', 'acorde'].map((grupo) => {
        const items = elementos.filter(({ tipo }) => tipo === grupo)
        if (!items.length) return null
        return <TarjetasOrdenables
          key={grupo}
          tipo={grupo}
          items={items.map(({ datos }) => datos)}
          disabled={lecturaFallida}
          onReordenar={(ordenados) => reordenar(grupo, ordenados)}
          onEditar={(datos) => setEditor({ tipo: grupo, datos })}
          onEliminar={(datos) => setConfirmacion({ elemento: { tipo: grupo, datos } })}
          onResaltado={grupo === 'escala' ? datos => guardar('escala', datos) : undefined}
        />
      })}
      {editor?.tipo === 'escala' && <EditorEscalaModal key={editor.datos?.id ?? 'nueva'} escala={editor.datos} onCerrar={() => setEditor(null)} onGuardar={(datos) => alGuardar('escala', datos)} errorGuardado={error} />}
      {editor?.tipo === 'generador' && <GeneradorAcordesModal
        onCerrar={() => setEditor(null)}
        onElegir={(datos) => alGuardar('acorde', datos)}
        onEditar={(datos) => setEditor({ tipo: 'acorde', datos: { ...datos, esNuevo: true } })}
        errorGuardado={error}
      />}
      {editor?.tipo === 'acorde' && <EditorAcordeModal key={editor.datos?.id ?? 'nuevo'} acorde={editor.datos} onCerrar={() => setEditor(null)} onGuardar={(datos) => alGuardar('acorde', datos)} errorGuardado={error} />}
      {circuloAbierto && <CirculoQuintasModal onCerrar={() => setCirculoAbierto(false)} />}
      {tapAbierto && <TapTempoModal onCerrar={() => setTapAbierto(false)} />}
      {repertorioAbierto && <RepertorioPizarraModal onCerrar={() => setRepertorioAbierto(false)} onCargar={cargarDesdeRepertorio} contieneElementos={elementos.length > 0 && !pendiente} errorGuardado={error} />}
      {bibliotecaAbierta && <BibliotecaPizarrasModal onCerrar={() => setBibliotecaAbierta(false)} onAbrir={pedirApertura}
        onRenombrar={pizarra.renombrarProyecto} onEliminar={pizarra.desvincularProyecto} />}
      {modalProyecto && <ModalProyectoPizarra {...modalProyecto} proyecto={proyecto} onCerrar={() => setModalProyecto(null)}
        onGuardar={async () => pizarra.confirmarGuardado(await pizarrasDB.guardar(proyecto, pizarra.datos))}
        onGuardarFicha={async ficha => pizarra.confirmarGuardado(await pizarrasDB.crear(ficha, pizarra.datos))} />}
      {exportar && <ModalExportarPDF tipo="pizarra" datos={{ pizarra: pizarra.datos, proyecto }} onCerrar={() => setExportar(false)} />}
      {confirmacion && <ConfirmarEliminacionModal
        preguntaComoTitulo
        mensaje={confirmacion.todo ? '¿Vaciar toda la pizarra?' : `¿Eliminar ${nombreElemento(confirmacion.elemento)} de la pizarra?`}
        onCancelar={() => setConfirmacion(null)}
        onConfirmar={() => confirmacion.todo ? vaciar() : eliminar(confirmacion.elemento.datos.id)}
      />}
      </div>
    </main>
  )
}
