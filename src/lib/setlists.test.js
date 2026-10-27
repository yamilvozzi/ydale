import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { fechaSetlist, mensajeErrorSetlists, repositorioSetlists } from './setlists.js'
import { origenTema } from './navegacionTema.js'

const id = '67c48591-4fa6-4990-8b57-b455355626ce'
const evento = { id, title: ' Biblioteca ', date: '2026-10-31', place: ' Paternal ', revision: 3 }
function cliente(fetch) {
  return createClient('https://example.invalid', 'prueba', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch },
  })
}
const respuesta = datos => new Response(JSON.stringify(datos), { headers: { 'Content-Type': 'application/json' } })

test('guardar envía sólo referencias, orden y revisión en una única transacción', async () => {
  const llamadas = []
  const db = repositorioSetlists(cliente(async (url, opciones) => {
    llamadas.push({ url: new URL(url), opciones })
    return respuesta({ ...evento, revision: 4 })
  }))
  const items = [{ id: 'entrada-2', song_id: 7, nombre: 'Seminare', letra: 'No copiar' }, { id: 'entrada-1', song_id: 3, acordes: ['C'] }]
  const guardado = await db.guardar(evento, items)
  assert.equal(guardado.revision, 4)
  assert.equal(llamadas.length, 1)
  assert.equal(llamadas[0].url.pathname, '/rest/v1/rpc/ydale_save_setlist')
  assert.deepEqual(JSON.parse(llamadas[0].opciones.body), {
    p_id: id, p_revision: 3, p_title: 'Biblioteca', p_date: '2026-10-31', p_place: 'Paternal',
    p_items: [{ id: 'entrada-2', song_id: 7 }, { id: 'entrada-1', song_id: 3 }],
  })
})

test('duplicar conserva orden y canciones pero crea IDs nuevos de evento y relaciones', async () => {
  const llamadas = []
  const original = { ...evento, items: [{ id: 'entrada-1', song_id: 9, nombre: 'Actual' }, { id: 'entrada-2', song_id: 7 }, { id: 'entrada-3', song_id: 9 }] }
  const db = repositorioSetlists(cliente(async (url, opciones) => {
    const body = JSON.parse(opciones.body)
    llamadas.push({ path: new URL(url).pathname, body })
    return respuesta(llamadas.length === 1 ? original : { ...evento, id: body.p_id, revision: 1 })
  }))
  const copia = await db.duplicar(id, { title: 'Otro show', date: '2026-11-01', place: '' })
  assert.notEqual(copia.id, id)
  assert.deepEqual(copia.items.map(i => i.song_id), [9, 7, 9])
  assert.equal(new Set(copia.items.map(i => i.id)).size, 3)
  assert.ok(copia.items.every(i => !original.items.some(o => o.id === i.id)))
  assert.deepEqual(llamadas.map(l => l.path), ['/rest/v1/rpc/ydale_get_setlist', '/rest/v1/rpc/ydale_save_setlist'])
  assert.equal(llamadas[1].body.p_revision, null)
  assert.equal(llamadas[1].body.p_place, null)
})

test('lectura actual y eliminación usan exclusivamente consultas y RPC de setlists', async () => {
  const llamadas = []
  const db = repositorioSetlists(cliente(async (url, opciones) => {
    const u = new URL(url)
    llamadas.push({ u, opciones })
    if (u.pathname.endsWith('/setlists')) return respuesta([])
    if (u.pathname.endsWith('ydale_get_setlist')) return respuesta({ ...evento, items: [{ song_id: 7, nombre: 'Nombre actualizado' }] })
    return respuesta(id)
  }))
  await db.listar()
  assert.equal((await db.leer(id)).items[0].nombre, 'Nombre actualizado')
  await db.eliminar(evento)
  assert.equal(llamadas[0].opciones.method, 'GET')
  assert.match(llamadas[0].u.searchParams.get('order'), /^date.desc,created_at.desc/)
  assert.deepEqual(JSON.parse(llamadas[2].opciones.body), { p_id: id, p_revision: 3 })
  assert.ok(llamadas.every(l => !l.u.pathname.endsWith('/temas')))
})

test('errores, conflictos y respuestas sin confirmación nunca cuentan como guardados', async () => {
  for (const datos of [null, { id: 'otro', revision: 4 }, { id, revision: null }]) {
    const db = repositorioSetlists(cliente(async () => respuesta(datos)))
    await assert.rejects(db.guardar(evento, []))
  }
  const db = repositorioSetlists(cliente(async () => new Response(JSON.stringify({ code: '40001', message: 'conflicto' }), { status: 409 })))
  await assert.rejects(db.guardar(evento, []), error => error.code === '40001')
  assert.match(mensajeErrorSetlists({ code: '40001' }), /otra sesión/)
  assert.match(mensajeErrorSetlists({ code: 'PGRST202' }), /SQL/)
})

test('origen contextual conserva setlist en todas las pestañas y descarta destinos externos', () => {
  assert.equal(fechaSetlist('2026-10-31'), '31/10/2026')
  assert.equal(origenTema(`?setlist=${id}`).ruta, `/setlists/${id}`)
  assert.equal(origenTema(`?setlist=${id}`).search, `?setlist=${id}`)
  for (const query of ['', '?setlist=https://externo.com', '?setlist=../../pizarra']) {
    assert.equal(origenTema(query).ruta, '/repertorio')
    assert.equal(origenTema(query).search, '')
  }
})
