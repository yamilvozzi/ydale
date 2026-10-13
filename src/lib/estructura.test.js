import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { bloquesDesdeLetra, crearBloque, estructuraVacia, guardarEstructura, guardarEstructuraTema, leerEstructura, nombreBloque, normalizarEstructura, referenciaEstructura, separarParrafos, TIPOS_BLOQUE } from './estructura.js'

test('separa por párrafos y conserva los saltos de verso, incluso con CRLF y líneas en blanco con espacios', () => {
  const letra = '  Primera línea\r\nSegunda línea\r\n \t\r\n\r\nEstribillo\r\nOtra línea\r\n\r\nFinal  '
  assert.deepEqual(separarParrafos(letra), ['Primera línea\nSegunda línea', 'Estribillo\nOtra línea', 'Final'])
  const bloques = bloquesDesdeLetra(letra)
  assert.equal(bloques.length, 3)
  assert.equal(new Set(bloques.map(bloque => bloque.id)).size, 3)
  assert.deepEqual(bloques.map(bloque => bloque.letra), separarParrafos(letra))
  assert.ok(bloques.every(bloque => bloque.tipo === 'otro' && bloque.repeticiones === 1))
  assert.deepEqual(separarParrafos(' \n \n'), [])
  assert.deepEqual(bloquesDesdeLetra(null), [])
  assert.deepEqual(separarParrafos('Un solo verso\nOtro verso'), ['Un solo verso\nOtro verso'])
})

test('las nueve categorías, nombres libres, repeticiones y notas persisten con IDs y orden estables', () => {
  assert.deepEqual(TIPOS_BLOQUE.map(tipo => tipo.etiqueta), ['INTRO', 'VERSO', 'PRE-ESTRIBILLO', 'ESTRIBILLO', 'RIFF', 'PUENTE', 'SOLO', 'OUTRO', 'OTRO'])
  const estructura = { version: 1, bloques: TIPOS_BLOQUE.map((tipo, indice) => ({ ...crearBloque(`Línea ${indice + 1}\nOtra línea`), tipo: tipo.valor, nombre: indice === 1 ? 'VERSO 1' : '', repeticiones: indice + 1, nota: indice === 4 ? 'Entra batería en la segunda vuelta' : '' })) }
  const guardada = leerEstructura(guardarEstructura(estructura))
  assert.deepEqual(guardada, estructura)
  assert.equal(nombreBloque(guardada.bloques[1]), 'VERSO 1')
  assert.equal(nombreBloque(guardada.bloques[4]), 'RIFF')
  const invertida = { ...guardada, bloques: [...guardada.bloques].reverse() }
  assert.deepEqual(leerEstructura(guardarEstructura(invertida)), invertida)
  assert.deepEqual(estructura.bloques.map(bloque => bloque.tipo), TIPOS_BLOQUE.map(tipo => tipo.valor))
})

test('bloques instrumentales y estructura vacía se guardan sin necesitar letra', () => {
  const instrumental = { version: 1, bloques: [{ ...crearBloque(), tipo: 'intro', repeticiones: 4, nota: 'Sólo guitarra' }] }
  assert.deepEqual(leerEstructura(guardarEstructura(instrumental)), instrumental)
  assert.deepEqual(leerEstructura(null), estructuraVacia())
  assert.deepEqual(leerEstructura(''), estructuraVacia())
  assert.deepEqual(leerEstructura(guardarEstructura(estructuraVacia())), estructuraVacia())
})

test('el texto antiguo puede editarse como bloques sin escribir ni migrar automáticamente', () => {
  const anterior = 'INTRO\nEm C\n\nVERSO\nPrimera línea'
  const leida = leerEstructura(anterior)
  assert.deepEqual(leida.bloques.map(bloque => bloque.letra), ['INTRO\nEm C', 'VERSO\nPrimera línea'])
  assert.ok(leida.bloques.every(bloque => bloque.tipo === 'otro'))
  assert.equal(anterior, 'INTRO\nEm C\n\nVERSO\nPrimera línea')
})

test('normaliza datos sin mutar el borrador y evita IDs duplicados o repeticiones inválidas', () => {
  const borrador = { version: 1, tonalidad: 'Duplicado', bloques: [
    { id: 'estable', tipo: 'verso', nombre: ' VERSO 1 ', letra: ' Línea\r\nVerso ', repeticiones: '20', nota: ' Nota ' },
    { id: 'estable', tipo: 'desconocido', letra: null, repeticiones: -2 },
    { repeticiones: 1.5 }, { repeticiones: '' }, { repeticiones: 'muchas' },
  ] }
  const original = structuredClone(borrador)
  const normal = normalizarEstructura(borrador)
  assert.deepEqual(borrador, original)
  assert.equal(new Set(normal.bloques.map(bloque => bloque.id)).size, 5)
  assert.equal(normal.bloques[0].id, 'estable')
  assert.equal(normal.bloques[0].repeticiones, 20)
  assert.equal(normal.bloques[0].nombre, 'VERSO 1')
  assert.equal(normal.bloques[0].letra, 'Línea\nVerso')
  assert.equal(normal.bloques[0].nota, 'Nota')
  assert.ok(normal.bloques.slice(1).every(bloque => bloque.repeticiones === 1 && bloque.tipo === 'otro'))
  assert.deepEqual(Object.keys(normal), ['version', 'bloques'])
})

test('un documento incompatible o bloque corrupto produce un error detectable', () => {
  assert.throws(() => leerEstructura(JSON.stringify({ version: 2, bloques: [] })), /Versión/)
  assert.throws(() => leerEstructura(JSON.stringify({ version: 1, bloques: null })), /Formato/)
  assert.throws(() => leerEstructura(JSON.stringify({ version: 1, bloques: [null] })), /Bloque/)
})

test('la referencia compacta proviene exclusivamente de las escalas graficadas y sin escala muestra guion', () => {
  assert.equal(referenciaEstructura([{ tonica: 'E', tipo: 'menor' }]), 'Em · Eólico')
  assert.equal(referenciaEstructura([{ tonica: 'C', tipo: 'mayor' }, { tonica: 'Db', tipo: 'lidio' }]), 'C · Jónico / Db · Lidio')
  assert.equal(referenciaEstructura([{ tonica: 'F#', tipo: 'dorico' }]), 'F# · Dórico')
  assert.equal(referenciaEstructura([]), '-')
  assert.equal(referenciaEstructura(), '-')
})

function clientePrueba(fetch) {
  return createClient('https://example.invalid', 'clave-de-prueba', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch },
  })
}

test('el guardado sólo actualiza estructura en la fila correcta, sin duplicar tonalidad, escala ni letra', async () => {
  let peticion
  const cliente = clientePrueba(async (url, opciones) => {
    peticion = { url: new URL(url), opciones }
    return new Response(JSON.stringify({ id: 'tema-1' }), { headers: { 'Content-Type': 'application/json' } })
  })
  const documento = { version: 1, bloques: [{ ...crearBloque('Una línea'), tipo: 'verso', repeticiones: 2 }] }
  const guardada = await guardarEstructuraTema(cliente, 'tema-1', documento)
  assert.equal(peticion.opciones.method, 'PATCH')
  assert.equal(peticion.url.searchParams.get('id'), 'eq.tema-1')
  assert.equal(peticion.url.searchParams.get('select'), 'id')
  assert.deepEqual(JSON.parse(peticion.opciones.body), { estructura: guardada })
  assert.deepEqual(leerEstructura(guardada), documento)
})

test('errores de permisos, red o fila no confirmada no informan guardado exitoso', async () => {
  for (const [status, respuesta] of [[403, { message: 'Sin permisos' }], [200, null], [200, { id: 'otro' }]]) {
    const cliente = clientePrueba(async () => new Response(JSON.stringify(respuesta), { status, headers: { 'Content-Type': 'application/json' } }))
    await assert.rejects(guardarEstructuraTema(cliente, 'tema-1', estructuraVacia()))
  }
  const cliente = clientePrueba(async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(guardarEstructuraTema(cliente, 'tema-1', estructuraVacia()))
})
