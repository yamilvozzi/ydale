import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { copiarMusicaAPizarra, leerMusicaTema, prepararMusicaTema } from './musicaRepertorio.js'
import { generarPosiciones, interpretarAcorde, propuestaAEditable } from './generadorAcordes.js'
import { guardarNotas } from './notasConAcordes.js'
import { guardarPizarra, leerPizarra, pizarraVacia, ponerElemento, transponerPizarra } from './pizarra.js'

function datosPrueba() {
  const interpretado = interpretarAcorde('E9/F#')
  const acorde = propuestaAEditable(interpretado, generarPosiciones(interpretado, { completo: true })[0])
  acorde.id = 'acorde-origen'
  const escalas = [{ id: 'escala-origen', tonica: 'E', tipo: 'menor', orden: 2 }, { id: 'escala-2', tonica: 'Db', tipo: 'lidio', orden: 5 }]
  const tema = { id: 'tema-1', nombre: 'Los libros de la buena memoria', tonalidad: 'Em', escala_nombre: 'Eólico', notas: guardarNotas({ texto: 'Texto que no debe copiarse', acordes: [acorde] }), letra: 'No copiar letra', estructura: 'No copiar estructura', percusion: 'No copiar percusión' }
  return { tema, escalas, acorde }
}

function clientePrueba(fetch) {
  return createClient('https://example.invalid', 'clave-de-prueba', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch },
  })
}

test('lee únicamente campos musicales con GET y conserva las escalas y acordes guardados', async () => {
  const { tema, escalas } = datosPrueba()
  const peticiones = []
  const cliente = clientePrueba(async (url, opciones) => {
    const direccion = new URL(url)
    peticiones.push({ direccion, opciones })
    return new Response(JSON.stringify(direccion.pathname.endsWith('/temas') ? tema : escalas), { headers: { 'Content-Type': 'application/json' } })
  })
  const musica = await leerMusicaTema(cliente, tema.id)
  assert.equal(peticiones.length, 2)
  assert.ok(peticiones.every(peticion => peticion.opciones.method === 'GET' && !peticion.opciones.body))
  const consultaTema = peticiones.find(p => p.direccion.pathname.endsWith('/temas')).direccion
  assert.equal(consultaTema.searchParams.get('id'), 'eq.tema-1')
  assert.equal(consultaTema.searchParams.get('select'), 'id,nombre,tonalidad,escala_nombre,notas')
  const consultaEscalas = peticiones.find(p => p.direccion.pathname.endsWith('/escalas')).direccion
  assert.equal(consultaEscalas.searchParams.get('tema_id'), 'eq.tema-1')
  assert.equal(consultaEscalas.searchParams.get('order'), 'orden.asc,created_at.asc')
  assert.deepEqual(musica, prepararMusicaTema(tema, escalas))
})

test('la copia crea IDs independientes, preserva digitaciones y excluye otros datos del tema', () => {
  const { tema, escalas, acorde } = datosPrueba()
  const musica = prepararMusicaTema(tema, escalas)
  const copia = copiarMusicaAPizarra(musica)
  assert.deepEqual(Object.keys(copia), ['version', 'elementos'])
  assert.deepEqual(copia.elementos.map(e => e.tipo), ['escala', 'escala', 'acorde'])
  const idsOrigen = new Set([...escalas.map(e => e.id), acorde.id, tema.id])
  assert.ok(copia.elementos.every(e => !idsOrigen.has(e.datos.id)))
  assert.equal(new Set(copia.elementos.map(e => e.datos.id)).size, 3)
  const { id: _id, ...datosCopiados } = copia.elementos[2].datos
  const { id: _origen, ...datosOriginales } = acorde
  assert.deepEqual(datosCopiados, datosOriginales)
  assert.notStrictEqual(copia.elementos[2].datos.posiciones, musica.acordes[0].posiciones)
  assert.notStrictEqual(copia.elementos[2].datos.posiciones[0], musica.acordes[0].posiciones[0])
  assert.notStrictEqual(copia.elementos[2].datos.trastes, musica.acordes[0].trastes)
  for (const texto of [tema.nombre, tema.letra, tema.estructura, tema.percusion, 'Texto que no debe copiarse']) assert.equal(JSON.stringify(copia).includes(texto), false)
  const nuevaCopia = copiarMusicaAPizarra(musica)
  assert.ok(nuevaCopia.elementos.every(e => !copia.elementos.some(c => c.datos.id === e.datos.id)))
})

test('transponer, editar, borrar, agregar y vaciar la copia nunca muta el tema ni la vista previa', () => {
  const fuente = datosPrueba()
  const fuenteOriginal = structuredClone(fuente)
  const musica = prepararMusicaTema(fuente.tema, fuente.escalas)
  const musicaOriginal = structuredClone(musica)
  let copia = copiarMusicaAPizarra(musica)
  copia = transponerPizarra(copia, 1)
  copia = ponerElemento(copia, 'escala', { ...copia.elementos[0].datos, tonica: 'G', tipo: 'dorico' })
  copia = ponerElemento(copia, 'acorde', { ...copia.elementos[2].datos, nombre: 'Cmaj7' })
  copia.elementos[2].datos.posiciones[0][0] = 'muteada'
  copia = { ...copia, elementos: copia.elementos.filter(e => e.tipo !== 'acorde') }
  copia = ponerElemento(copia, 'acorde', { nombre: 'Dm' })
  copia = pizarraVacia()
  assert.deepEqual(copia.elementos, [])
  assert.deepEqual(fuente, fuenteOriginal)
  assert.deepEqual(musica, musicaOriginal)
})

test('reemplaza todo el contenido en una sola escritura y la copia sobrevive a recargar', () => {
  const fuente = datosPrueba()
  const anterior = ponerElemento(pizarraVacia(), 'escala', { id: 'anterior', tonica: 'C', tipo: 'mayor' })
  let texto = JSON.stringify(anterior)
  let escrituras = 0
  const storage = { getItem: () => texto, setItem: (_clave, valor) => { escrituras++; texto = valor } }
  const copia = copiarMusicaAPizarra(prepararMusicaTema(fuente.tema, fuente.escalas))
  guardarPizarra(storage, copia)
  assert.equal(escrituras, 1)
  assert.deepEqual(leerPizarra(storage), copia)
  assert.ok(copia.elementos.every(e => e.datos.id !== 'anterior'))
  assert.throws(() => guardarPizarra({ setItem: () => { throw new Error('Sin espacio') } }, copia))
  assert.deepEqual(anterior.elementos[0].datos, { id: 'anterior', tonica: 'C', tipo: 'mayor', orden: 0 })
})

test('usa diagramas como fuente principal y admite referencias de tonalidad y modo compatibles', () => {
  const { tema, escalas } = datosPrueba()
  assert.deepEqual(prepararMusicaTema({ ...tema, tonalidad: 'Texto libre', escala_nombre: 'Sin definir' }, escalas).escalas, escalas)
  for (const [tonalidad, nombre, tonica, tipo] of [
    ['Em', 'Eólico', 'E', 'menor'], ['D', 'Dórico', 'D', 'dorico'], ['Db', 'Lidio', 'Db', 'lidio'],
    ['C#', 'Pentatónica menor', 'C#', 'pentatonica_menor'], ['Em', '', 'E', 'menor'], ['G', 'Menor natural', 'G', 'menor'],
  ]) {
    assert.deepEqual(prepararMusicaTema({ ...tema, tonalidad, escala_nombre: nombre }, []).escalas, [{ tonica, tipo, orden: 0 }])
  }
  assert.throws(() => prepararMusicaTema({ ...tema, escala_nombre: 'Modo desconocido' }, []), /no es compatible/)
  assert.throws(() => prepararMusicaTema({ ...tema, tonalidad: 'Sin definir' }, []), /no es compatible/)
})

test('permite escalas o acordes por separado y no transforma el texto histórico en diagramas', () => {
  const { tema, escalas } = datosPrueba()
  assert.equal(copiarMusicaAPizarra(prepararMusicaTema({ ...tema, notas: 'Em C D' }, escalas)).elementos.length, 2)
  assert.equal(copiarMusicaAPizarra(prepararMusicaTema({ ...tema, tonalidad: '', escala_nombre: '' }, [])).elementos[0].tipo, 'acorde')
  const vacia = prepararMusicaTema({ nombre: 'Vacío', notas: 'Texto libre' }, [])
  assert.deepEqual(vacia, { nombre: 'Vacío', escalas: [], acordes: [] })
  assert.throws(() => copiarMusicaAPizarra(vacia), /no tiene escalas ni acordes/)
})

test('un error, fila ausente o respuesta incompleta no produce una carga parcial', async () => {
  const { tema, escalas } = datosPrueba()
  for (const caso of ['tema-error', 'escala-error', 'sin-tema', 'otro-id', 'sin-escalas']) {
    const cliente = clientePrueba(async url => {
      const esTema = new URL(url).pathname.endsWith('/temas')
      const error = caso === (esTema ? 'tema-error' : 'escala-error')
      const respuesta = esTema ? caso === 'sin-tema' ? null : caso === 'otro-id' ? { ...tema, id: 'otro' } : tema
        : caso === 'sin-escalas' ? null : escalas
      return new Response(JSON.stringify(error ? { message: 'Fallo de permisos' } : respuesta), { status: error ? 403 : 200, headers: { 'Content-Type': 'application/json' } })
    })
    await assert.rejects(leerMusicaTema(cliente, tema.id), /No se pudo cargar/)
  }
})
