import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { actualizarTema } from './actualizarTema.js'
import { guardarNotas, leerNotas, crearAcorde } from './notasConAcordes.js'

function clientePrueba(fetch) {
  return createClient('https://example.invalid', 'clave-de-prueba', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch },
  })
}

test('envía únicamente el JSON de notas a la fila existente y confirma el ID guardado', async () => {
  const acorde = crearAcorde()
  acorde.nombre = 'Personal'
  const notas = guardarNotas({ texto: 'Texto conservado', acordes: [acorde] })
  let peticion
  const cliente = clientePrueba(async (url, opciones) => {
    peticion = { url: new URL(url), opciones }
    return new Response(JSON.stringify({ id: 'tema-1' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  await actualizarTema(cliente, 'tema-1', { notas })
  assert.equal(peticion.url.pathname, '/rest/v1/temas')
  assert.equal(peticion.url.searchParams.get('id'), 'eq.tema-1')
  assert.equal(peticion.url.searchParams.get('select'), 'id')
  assert.equal(peticion.opciones.method, 'PATCH')
  assert.deepEqual(JSON.parse(peticion.opciones.body), { notas })
  assert.equal(leerNotas(notas).texto, 'Texto conservado')
})

test('no confirma un guardado sin filas, rechazado por permisos o con fallo de red', async () => {
  for (const [status, cuerpo] of [
    [406, { code: 'PGRST116', message: '0 rows' }],
    [403, { code: '42501', message: 'permission denied' }],
    [200, null],
    [200, { id: 'otra-fila' }],
  ]) {
    const cliente = clientePrueba(async () => new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } }))
    await assert.rejects(actualizarTema(cliente, 'tema-1', { notas: 'Texto' }))
  }
  const cliente = clientePrueba(async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(actualizarTema(cliente, 'tema-1', { notas: 'Texto' }))
})

test('un documento parcialmente inválido conserva su texto y sus acordes válidos', () => {
  const acorde = crearAcorde()
  const notas = leerNotas(JSON.stringify({ texto: 'Ensayo', acordes: [null, acorde, 'inválido'] }))
  assert.equal(notas.texto, 'Ensayo')
  assert.deepEqual(notas.acordes, [acorde])
})
