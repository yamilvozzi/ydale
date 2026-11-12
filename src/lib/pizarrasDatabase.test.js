import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { cambiosPizarra, guardarTrabajoPizarra, leerTrabajoPizarra, repositorioPizarras } from './proyectosPizarra.js'
import { guardarPizarra, pizarraVacia, ponerElemento, transponerPizarra } from './pizarra.js'
import { crearAcorde } from './notasConAcordes.js'

const migracion = await readFile(new URL('../../supabase/migrations/202611110001_pizarras.sql', import.meta.url), 'utf8')

function contenidoMusical() {
  const escala = { id: 'escala', tonica: 'Eb', tipo: 'dorico', resaltado: {
    acordes: [{ id: 'chip', nombre: 'Bb7', tonica: 'Eb' }], seleccionado: 'chip',
  } }
  const acorde = { ...crearAcorde(), id: 'acorde-manual', nombre: 'Voicing propio', trastes: ['2', '', '7', '9', '12'] }
  acorde.posiciones[0][3] = 'presionada'
  acorde.posiciones[1][0] = 'aire'
  acorde.posiciones[2][0] = 'muteada'
  acorde.posiciones[3][2] = 'presionada'
  acorde.tonica = { cuerda: 0, traste: 3 }
  acorde.bajo = { cuerda: 3, traste: 2 }
  acorde.opcional = { cuerda: 1, traste: 0 }
  const pizarra = ponerElemento(ponerElemento(pizarraVacia(), 'escala', escala), 'acorde', acorde)
  return { ...pizarra, desplazamiento: -2 }
}

test('recupera borradores históricos y vinculados y distingue cambios de un guardado permanente', () => {
  let registro = null
  const storage = { getItem: () => registro, setItem: (_, texto) => { registro = texto } }
  const base = contenidoMusical()
  guardarPizarra(storage, base)
  const anterior = leerTrabajoPizarra(storage)
  assert.deepEqual(anterior.datos, base)
  assert.equal(anterior.proyecto, null)
  assert.ok(cambiosPizarra(anterior.datos, anterior.proyecto))

  const proyecto = { id: randomUUID(), titulo: 'Estudio', revision: 1, base }
  guardarTrabajoPizarra(storage, base, proyecto)
  const recuperado = leerTrabajoPizarra(storage)
  assert.equal(cambiosPizarra(recuperado.datos, recuperado.proyecto), false)
  const transpuesta = transponerPizarra(recuperado.datos, 1)
  guardarTrabajoPizarra(storage, transpuesta, proyecto)
  const borrador = leerTrabajoPizarra(storage)
  assert.deepEqual(borrador.datos, transpuesta)
  assert.deepEqual(borrador.proyecto.base, base)
  assert.ok(cambiosPizarra(borrador.datos, borrador.proyecto))
  assert.deepEqual(ponerElemento(base, 'escala', { id: 'escala', tonica: 'F', tipo: 'menor' }).elementos[0].datos.resaltado, base.elementos[0].datos.resaltado)

  guardarTrabajoPizarra(storage, pizarraVacia(), null)
  assert.deepEqual(leerTrabajoPizarra(storage), { datos: pizarraVacia(), proyecto: null })
  assert.deepEqual(proyecto.base, base)
})

// Ejecuta las mismas operaciones del adaptador de Supabase sobre Postgres local.
function clienteLocal(db) {
  async function consultar(sql, parametros = []) {
    try { return { data: (await db.query(sql, parametros)).rows } }
    catch (error) { return { error } }
  }
  return {
    async rpc(nombre, parametros) {
      const nombres = Object.keys(parametros)
      const argumentos = nombres.map((campo, i) => `${campo} => $${i + 1}`).join(', ')
      const resultado = await consultar(`select public.${nombre}(${argumentos}) as valor`, Object.values(parametros))
      return resultado.error ? resultado : { data: resultado.data[0].valor }
    },
    from: tabla => ({ select: campos => ({
      eq: (_campo, id) => ({ async maybeSingle() {
        const resultado = await consultar(`select ${campos} from public.${tabla} where id = $1`, [id])
        return resultado.error ? resultado : { data: resultado.data[0] ?? null }
      } }),
      order: () => ({ order: () => ({ range: (desde, hasta) => consultar(
        `select ${campos} from public.${tabla} order by updated_at desc, id limit $1 offset $2`, [hasta - desde + 1, desde],
      ) }) }),
    }) }),
  }
}

test('SQL y repositorio de pizarras: CRUD, copias fieles, orden, conflictos y permisos', async () => {
  const db = new PGlite()
  try {
    await db.exec("create role anon; create role authenticated; create table temas (nombre text); insert into temas values ('Original');")
    await db.exec(migracion)
    await db.exec('set role anon')
    const biblioteca = repositorioPizarras(clienteLocal(db))
    const base = contenidoMusical()
    const ficha = { id: randomUUID(), titulo: ' Estudio ', fecha: '' }
    const creada = await biblioteca.crear(ficha, base)
    assert.equal(creada.titulo, 'Estudio')
    assert.equal(creada.fecha, null)
    assert.deepEqual(await biblioteca.crear(ficha, base), creada, 'reintentar no crea una segunda pizarra')
    assert.deepEqual((await biblioteca.leer(creada.id)).contenido, base)
    await assert.rejects(db.exec("update pizarras set titulo = 'Acceso directo'"), { code: '42501' })

    const fichaVariante = { id: randomUUID(), titulo: 'Variante', fecha: '2026-11-11' }
    const editada = ponerElemento(base, 'escala', { id: 'escala', tonica: 'Gb', tipo: 'lidio' })
    const variante = await biblioteca.crear(fichaVariante, editada)
    assert.deepEqual((await biblioteca.leer(creada.id)).contenido, base)
    assert.deepEqual((await biblioteca.leer(variante.id)).contenido, editada)
    const guardada = await biblioteca.guardar(creada, editada)
    assert.equal(guardada.revision, 2)
    assert.equal(guardada.titulo, creada.titulo)
    assert.equal(guardada.created_at, creada.created_at)
    assert.equal(guardada.fecha, creada.fecha)
    await assert.rejects(biblioteca.guardar(creada, base), { code: '40001' })
    await assert.rejects(biblioteca.eliminar(creada), { code: '40001' })
    const renombrada = await biblioteca.renombrar(guardada, { titulo: 'Estudio de modos', fecha: '2026-10-03' })
    assert.equal(renombrada.titulo, 'Estudio de modos')
    assert.deepEqual((await biblioteca.leer(renombrada.id)).contenido, editada)
    const copia = await biblioteca.duplicar(renombrada, { id: randomUUID(), titulo: 'Copia', fecha: renombrada.fecha })
    assert.notEqual(copia.id, renombrada.id)
    assert.deepEqual((await biblioteca.leer(copia.id)).contenido, editada)
    assert.deepEqual((await biblioteca.listar()).map(p => p.id), [copia.id, renombrada.id, variante.id])
    await biblioteca.eliminar(renombrada)
    await assert.rejects(biblioteca.leer(renombrada.id), /ya no está/)
    await assert.rejects(biblioteca.guardar(renombrada, base), { code: '40001' })
    assert.deepEqual((await biblioteca.leer(copia.id)).contenido, editada)
    assert.deepEqual((await biblioteca.leer(variante.id)).contenido, editada)

    await db.exec('reset role')
    assert.deepEqual((await db.query('select * from temas')).rows, [{ nombre: 'Original' }])
  } finally {
    await db.close()
  }
})
