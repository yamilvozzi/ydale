import { CLAVE_PIZARRA, guardarPizarra, normalizarPizarra, pizarraVacia } from './pizarra.js'

const CAMPOS = 'id,titulo,fecha,created_at,updated_at,revision'

export function leerTrabajoPizarra(storage) {
  const texto = storage.getItem(CLAVE_PIZARRA)
  if (texto === null) return { datos: pizarraVacia(), proyecto: null }
  const registro = JSON.parse(texto)
  const datos = normalizarPizarra(registro)
  const proyecto = registro.proyecto
  // Un vínculo ilegible no impide rescatar el contenido del borrador.
  if (!proyecto || typeof proyecto.id !== 'string' || typeof proyecto.titulo !== 'string' || !Number.isInteger(proyecto.revision) || proyecto.revision < 1) {
    return { datos, proyecto: null }
  }
  try {
    return { datos, proyecto: { ...proyecto, base: normalizarPizarra(proyecto.base) } }
  } catch {
    return { datos, proyecto: null }
  }
}

export function guardarTrabajoPizarra(storage, datos, proyecto) {
  guardarPizarra(storage, proyecto ? { ...datos, proyecto } : datos)
}

export function cambiosPizarra(datos, proyecto) {
  if (!proyecto) return datos.elementos.length > 0 || Boolean(datos.desplazamiento)
  return JSON.stringify(normalizarPizarra(datos)) !== JSON.stringify(normalizarPizarra(proyecto.base))
}

export function fechaLocal(hoy = new Date()) {
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

export function mensajeProyectoPizarra(error) {
  if (error?.code === '40001') return 'El proyecto cambió o fue eliminado en otra sesión. Abrí la versión actual o guardá tu trabajo como nueva pizarra.'
  if (['PGRST202', 'PGRST205', '42P01'].includes(error?.code)) return 'Falta instalar la biblioteca de pizarras en Supabase.'
  if (error?.code === '23514') return 'La pizarra supera el tamaño admitido o sus datos son inválidos.'
  if (error instanceof Error) return error.message
  return 'No se pudo completar la operación. Revisá la conexión e intentá de nuevo.'
}

function comprobar({ data, error }) {
  if (error) throw error
  return data
}

function confirmarFila(resultado, id) {
  const fila = comprobar(resultado)
  if (fila?.id !== id || !Number.isInteger(fila.revision)) throw new Error('No se pudo confirmar el proyecto en Supabase.')
  return fila
}

export function repositorioPizarras(cliente) {
  async function leer(id) {
    const resultado = await cliente.from('pizarras').select(`${CAMPOS},contenido`).eq('id', id).maybeSingle()
    if (!resultado.error && !resultado.data) throw new Error('La pizarra ya no está en la biblioteca. Actualizá la lista.')
    const { contenido, ...proyecto } = confirmarFila(resultado, id)
    return { ...proyecto, contenido: normalizarPizarra(contenido) }
  }

  async function crear({ id, titulo, fecha }, contenido) {
    return confirmarFila(await cliente.rpc('ydale_crear_pizarra', {
      p_id: id, p_titulo: titulo.trim(), p_fecha: fecha || null, p_contenido: normalizarPizarra(contenido),
    }), id)
  }

  async function actualizar(proyecto, cambios) {
    return confirmarFila(await cliente.rpc('ydale_actualizar_pizarra', {
      p_id: proyecto.id, p_revision: proyecto.revision, ...cambios,
    }), proyecto.id)
  }

  return {
    async listar() {
      const filas = []
      const pagina = 100
      for (let desde = 0; ; desde += pagina) {
        const lote = comprobar(await cliente.from('pizarras').select(CAMPOS)
          .order('updated_at', { ascending: false }).order('id', { ascending: true }).range(desde, desde + pagina - 1))
        if (!Array.isArray(lote)) throw new Error('No se pudo leer la biblioteca de pizarras.')
        filas.push(...lote)
        if (lote.length < pagina) return filas
      }
    },
    leer,
    crear,
    guardar: (proyecto, contenido) => actualizar(proyecto, { p_contenido: normalizarPizarra(contenido) }),
    renombrar: (proyecto, { titulo, fecha }) => actualizar(proyecto, { p_titulo: titulo.trim(), p_fecha: fecha || null }),
    async duplicar(proyecto, ficha) {
      const origen = await leer(proyecto.id)
      if (origen.revision !== proyecto.revision) throw { code: '40001' }
      return crear(ficha, origen.contenido)
    },
    async eliminar(proyecto) {
      const id = comprobar(await cliente.rpc('ydale_eliminar_pizarra', { p_id: proyecto.id, p_revision: proyecto.revision }))
      if (id !== proyecto.id) throw new Error('No se pudo confirmar la eliminación.')
    },
  }
}
