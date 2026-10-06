import test from 'node:test'
import assert from 'node:assert/strict'
import { generarPosiciones, interpretarAcorde, propuestaAEditable, dedosNecesarios, ZONAS, GRUPOS_CUERDAS, GRUPOS_CUERDAS_4 } from './generadorAcordes.js'
import { RAICES_ACORDES, SUFIJOS_ACORDES } from './catalogoAcordes.js'
import { AFINACION, NOTAS, notaEnTraste } from './escalas.js'
import { guardarNotas, leerNotas, crearAcorde, normalizarAcorde } from './notasConAcordes.js'

test('construye todas las calidades y conserva las tres voces características', () => {
  const esperadas = {
    C: ['C', 'E', 'G'], Cm: ['C', 'Eb', 'G'], C7: ['C', 'E', 'G', 'Bb'],
    Cm7: ['C', 'Eb', 'G', 'Bb'], Cmaj7: ['C', 'E', 'G', 'B'],
    Csus2: ['C', 'D', 'G'], Csus4: ['C', 'F', 'G'], C6: ['C', 'E', 'G', 'A'],
    Cm6: ['C', 'Eb', 'G', 'A'], Cdim: ['C', 'Eb', 'Gb'], Caug: ['C', 'E', 'G#'],
  }
  for (const [nombre, notas] of Object.entries(esperadas)) {
    assert.deepEqual(interpretarAcorde(nombre).notas.map((n) => n.nombre), notas)
  }
  for (const [nombre, notas] of Object.entries({ A7: ['A', 'C#', 'G'], Am7: ['A', 'C', 'G'], Cmaj7: ['C', 'E', 'B'], Cm6: ['C', 'Eb', 'A'] })) {
    assert.deepEqual(interpretarAcorde(nombre).voces.map((n) => n.nombre), notas)
  }
  assert.deepEqual(interpretarAcorde('C#').notas.map((n) => n.nombre), ['C#', 'E#', 'G#'])
  assert.deepEqual(interpretarAcorde('Ebm').notas.map((n) => n.nombre), ['Eb', 'Gb', 'Bb'])
  assert.deepEqual(interpretarAcorde('Bdim').notas.map((n) => n.nombre), ['B', 'D', 'F'])
  assert.equal(interpretarAcorde(' d/f♯ ').nombre, 'D/F#')
  assert.equal(interpretarAcorde('Bbmaj7/Db').bajo.nombre, 'Db')
  for (const invalido of ['', 'H', 'C99', 'C/foo', null, 'C##', 'Cmaj', 'Cconstructor', 'CtoString']) assert.equal(interpretarAcorde(invalido), null)
})

test('D y Dm priorizan sus tres formas clásicas, con tónica en cuerdas 1, 2 y 3', () => {
  assert.deepEqual(generarPosiciones('D', { cuerdas: '1–2–3' }).map((p) => p.principal.map((n) => n.traste)), [[10, 10, 11], [2, 3, 2], [5, 7, 7]])
  assert.deepEqual(generarPosiciones('Dm', { cuerdas: '1–2–3' }).map((p) => p.principal.map((n) => n.traste)), [[10, 10, 10], [1, 3, 2], [5, 6, 7]])
  for (const raiz of RAICES_ACORDES) for (const sufijo of ['', 'm']) {
    const propuestas = generarPosiciones(raiz + sufijo)
    assert.equal(propuestas.length, 4, raiz + sufijo)
    assert.deepEqual(propuestas.slice(0, 3).map((p) => p.cuerdaTonica), [0, 1, 2])
    assert.ok(propuestas.slice(0, 3).every((p) => p.principal[0].midi - p.principal[2].midi < 12))
    assert.deepEqual(propuestas[3].principal.map((n) => n.cuerda), [1, 2, 3])
  }
})

test('todo resultado cumple notas, cuerdas, zonas, altura y máximo cuatro trastes, incluido el bajo', () => {
  for (const raiz of RAICES_ACORDES) for (const sufijo of SUFIJOS_ACORDES) {
    const acorde = interpretarAcorde(raiz + sufijo)
    for (const [zona, [desde, hasta]] of Object.entries(ZONAS)) {
      for (const cuerdas of ['AUTO', ...Object.keys(GRUPOS_CUERDAS)]) for (const bajo of [false, true]) {
        const propuestas = generarPosiciones(acorde, { zona, cuerdas, bajo })
        assert.ok(propuestas.length <= (cuerdas === 'AUTO' ? 5 : 4))
        assert.equal(new Set(propuestas.map((p) => p.id)).size, propuestas.length)
        for (const p of propuestas) {
          assert.equal(p.principal.length, 3)
          const clases = new Set(p.principal.map((n) => n.clase))
          assert.equal(clases.size, 3)
          assert.ok(p.principal.every((n) => acorde.notas.some((nota) => nota.clase === n.clase)))
          const requeridas = acorde.notas.filter(nota => nota.esencial)
          assert.ok(requeridas.every((n) => clases.has(n.clase)))
          if (cuerdas !== 'AUTO') assert.deepEqual(p.principal.map((n) => n.cuerda), GRUPOS_CUERDAS[cuerdas])
          const notas = p.bajo ? [...p.principal, p.bajo] : p.principal
          assert.equal(new Set(notas.map((n) => n.cuerda)).size, notas.length)
          const trastes = notas.map((n) => n.traste)
          assert.ok(Math.max(...trastes) - Math.min(...trastes) <= 4)
          for (const n of notas) {
            assert.ok(n.traste >= Math.max(0, desde - 2) && n.traste <= Math.min(15, hasta + 2))
            assert.equal(n.clase, NOTAS.indexOf(notaEnTraste(AFINACION[n.cuerda], n.traste)))
          }
          assert.equal(Boolean(p.bajo), bajo)
          if (bajo) {
            assert.equal(p.bajo.clase, acorde.raiz.clase)
            assert.ok(p.bajo.cuerda >= 3)
            assert.ok(p.principal.every((n) => n.midi > p.bajo.midi))
          }
        }
      }
    }
  }
})

test('las zonas conservan primero las posiciones originales y completan con tolerancia de dos trastes', () => {
  const trastes = (zona) => generarPosiciones('C', { cuerdas: '1–2–3', zona }).map((p) => p.principal.map((n) => n.traste))
  assert.deepEqual(trastes('ABIERTA'), [[0, 1, 0], [3, 5, 5]])
  assert.deepEqual(trastes('MEDIA'), [[8, 8, 9], [3, 5, 5]])
  assert.deepEqual(trastes('AGUDA'), [[12, 13, 12], [8, 8, 9]])
  assert.deepEqual(trastes('TODAS'), [[8, 8, 9], [0, 1, 0], [3, 5, 5]])
  for (const zona of ['ABIERTA', 'MEDIA', 'AGUDA']) {
    const [desde, hasta] = ZONAS[zona]
    for (const nombre of ['C', 'Cm', 'A7', 'D/F#', 'Bb/Db']) {
      for (const cuerdas of ['AUTO', ...Object.keys(GRUPOS_CUERDAS)]) {
        const resultados = generarPosiciones(nombre, { cuerdas, zona, bajo: true })
        const distancias = resultados.map((p) => Math.max(...[...p.principal, ...(p.bajo ? [p.bajo] : [])].map(({ traste }) => Math.max(0, desde - traste, traste - hasta))))
        assert.deepEqual(distancias, [...distancias].sort((a, b) => a - b))
        assert.ok(distancias.every((distancia) => distancia <= 2))
      }
    }
  }
})

test('el slash activa automáticamente su bajo independiente, aun si es ajeno a la tríada', () => {
  for (const nombre of ['D/F#', 'C/F#', 'Bb/Db', 'Am7/G']) {
    const acorde = interpretarAcorde(nombre)
    const propuestas = generarPosiciones(nombre)
    assert.ok(propuestas.length > 0)
    for (const p of propuestas) {
      assert.equal(p.bajo.clase, acorde.bajo.clase)
      assert.equal(p.bajo.nota, acorde.bajo.nombre)
      assert.equal(p.principal.length, 3)
      assert.ok(p.principal.every((n) => n.cuerda !== p.bajo.cuerda && n.midi > p.bajo.midi))
    }
  }
  assert.deepEqual(generarPosiciones('D/F#', { cuerdas: '4–5–6' }), [])
  assert.deepEqual(generarPosiciones('C', { cuerdas: '4–5–6', bajo: true }), [])
  assert.equal(generarPosiciones('D', { cuerdas: '1–2–3', zona: 'ABIERTA' }).length, 1)
  assert.deepEqual(generarPosiciones('H'), [])
})

test('ELEGIR y EDITAR conservan cuerdas, trastes, tónica, bajo y sugerencia al serializar', () => {
  for (const nombre of ['C', 'D/F#', 'Am7', 'Caug', 'E', 'G', 'Bb/Db']) {
    const acorde = interpretarAcorde(nombre)
    for (const zona of Object.keys(ZONAS)) for (const p of generarPosiciones(acorde, { zona })) {
      const editable = propuestaAEditable(acorde, p)
      const guardado = leerNotas(guardarNotas({ texto: 'ensayo', acordes: [editable] })).acordes[0]
      assert.equal(guardado.nombre, nombre)
      assert.equal(guardado.posiciones.flat().filter((estado) => estado === 'aire' || estado === 'presionada').length, p.principal.length + Number(Boolean(p.bajo)) + Number(Boolean(p.opcional)))
      assert.ok(guardado.trastes.every((traste, i) => Number(traste) === Number(guardado.trastes[0]) + i))
      for (const nota of [...p.principal, ...(p.bajo ? [p.bajo] : []), ...(p.opcional ? [p.opcional] : [])]) {
        const columna = nota.traste === 0 ? 0 : guardado.trastes.indexOf(String(nota.traste))
        assert.equal(guardado.posiciones[nota.cuerda][columna], nota.traste === 0 ? 'aire' : 'presionada')
        if (nota.esTonica && !nota.esBajo) assert.deepEqual(guardado.tonica, { cuerda: nota.cuerda, traste: columna })
        if (nota.esBajo) assert.deepEqual(guardado.bajo, { cuerda: nota.cuerda, traste: columna })
        if (nota.esOpcional) assert.deepEqual(guardado.opcional, { cuerda: nota.cuerda, traste: columna })
      }
    }
  }
})

test('la extensión máxima conserva los cinco trastes consecutivos y permite editar sin restricciones musicales', () => {
  const acorde = interpretarAcorde('D/F#')
  const propuesta = generarPosiciones(acorde, { zona: 'AGUDA', cuerdas: '1–2–3' })[0]
  const editable = propuestaAEditable(acorde, propuesta)
  assert.deepEqual(editable.trastes, ['10', '11', '12', '13', '14'])
  editable.nombre = 'Mi digitación'
  editable.posiciones[0][0] = 'vacio'
  editable.posiciones[0][3] = 'presionada'
  editable.posiciones[4][2] = 'presionada'
  editable.trastes[3] = '20'
  const guardado = leerNotas(guardarNotas({ texto: 'Notas originales', acordes: [editable] }))
  assert.equal(guardado.texto, 'Notas originales')
  assert.equal(guardado.acordes[0].nombre, 'Mi digitación')
  assert.equal(guardado.acordes[0].trastes[3], '20')
  assert.equal(guardado.acordes[0].posiciones[0][3], 'presionada')
  assert.equal(guardado.acordes[0].posiciones[4][2], 'presionada')
  assert.equal(guardado.acordes[0].tonica, null)
  assert.deepEqual(guardado.acordes[0].bajo, { cuerda: 5, traste: 4 })
  editable.posiciones[5][4] = 'muteada'
  assert.equal(normalizarAcorde(editable).bajo, null)
})

test('el formato manual histórico sigue conservando sus cuatro columnas y notas libres', () => {
  const manual = crearAcorde()
  manual.trastes = ['2', '', '9', '12']
  manual.posiciones[0][0] = 'presionada'
  manual.posiciones[0][2] = 'presionada'
  const guardado = leerNotas(guardarNotas({ texto: 'Texto', acordes: [manual] })).acordes[0]
  assert.deepEqual(guardado.trastes, manual.trastes)
  assert.deepEqual(guardado.posiciones, manual.posiciones)
  assert.equal(guardado.trastes.length, 4)
  assert.equal(leerNotas('Texto histórico').texto, 'Texto histórico')
})

test('A7 admite E–G–C# sin raíz y su complemento cercano es opcional', () => {
  const propuestas = generarPosiciones('A7', { cuerdas: '2–3–4', zona: 'ABIERTA' })
  const forma = propuestas.find((p) => p.principal.map((n) => n.traste).join(',') === '2,0,2')
  assert.ok(forma)
  assert.deepEqual(forma.principal.map((n) => n.nota), ['C#', 'G', 'E'])
  assert.equal(forma.cuerdaTonica, null)
  assert.equal(forma.opcional.nota, 'A')
  assert.equal(forma.opcional.esOpcional, true)
  assert.equal(forma.opcional.cuerda, 4)
  assert.equal(forma.opcional.traste, 0)
  assert.ok(generarPosiciones('A7', { zona: 'ABIERTA' }).some((p) => p.id === forma.id))
  // El mismo criterio vale para las otras séptimas y sextas del catálogo.
  for (const nombre of ['C7', 'Cm7', 'Cmaj7', 'C6', 'Cm6']) {
    const acorde = interpretarAcorde(nombre)
    const formas = generarPosiciones(nombre, { cuerdas: '2–3–4' })
    assert.ok(formas.some((p) => p.cuerdaTonica === null), nombre)
    for (const p of formas) {
      assert.ok([acorde.notas[1], acorde.notas[3]].every((n) => p.principal.some((voz) => voz.clase === n.clase)))
    }
  }
})

test('la sugerencia no duplica voces ni bajo, respeta zona y extensión y no aparece en tríadas o cuatro cuerdas', () => {
  let conSugerencia = 0
  let sinSugerencia = 0
  for (const nombre of ['C', 'Cm', 'C7', 'A7', 'Am7', 'Cmaj7', 'Cm6']) {
    for (const zona of Object.keys(ZONAS)) for (const bajo of [false, true]) {
      for (const cuerdas of ['AUTO', ...Object.keys(GRUPOS_CUERDAS)]) {
        for (const p of generarPosiciones(nombre, { zona, bajo, cuerdas })) {
          if (!p.opcional) { sinSugerencia++; continue }
          conSugerencia++
          assert.equal(p.cuerdaTonica, null)
          const notas = [...p.principal, ...(p.bajo ? [p.bajo] : []), p.opcional].sort((a, b) => a.cuerda - b.cuerda)
          assert.equal(new Set(notas.map((n) => n.cuerda)).size, notas.length)
          assert.ok(notas.every((n, i) => i === 0 || notas[i - 1].midi > n.midi))
          const trastes = notas.map((n) => n.traste)
          assert.ok(Math.max(...trastes) - Math.min(...trastes) <= 4)
          const [desde, hasta] = ZONAS[zona]
          assert.ok(p.opcional.traste >= Math.max(0, desde - 2) && p.opcional.traste <= Math.min(15, hasta + 2))
          assert.equal(p.opcional.esTonica, true)
          assert.ok(!p.bajo?.esTonica)
        }
      }
    }
    if (interpretarAcorde(nombre).notas.length === 3) assert.ok(generarPosiciones(nombre).every((p) => !p.opcional))
    assert.ok(generarPosiciones(nombre, { cantidadCuerdas: 4 }).every((p) => !p.opcional))
  }
  assert.ok(conSugerencia > 0 && sinSugerencia > conSugerencia)
})

test('cuatro cuerdas conservan calidad, grupos, zona, bajo y tocabilidad en todo el catálogo', () => {
  for (const raiz of RAICES_ACORDES) for (const sufijo of SUFIJOS_ACORDES) {
    const acorde = interpretarAcorde(raiz + sufijo)
    for (const [zona, [desde, hasta]] of Object.entries(ZONAS)) {
      for (const cuerdas of ['AUTO', ...Object.keys(GRUPOS_CUERDAS_4)]) for (const bajo of [false, true]) {
        const propuestas = generarPosiciones(acorde, { cantidadCuerdas: 4, zona, cuerdas, bajo })
        assert.equal(new Set(propuestas.map((p) => p.id)).size, propuestas.length)
        for (const p of propuestas) {
          assert.equal(p.principal.length, 4)
          if (cuerdas !== 'AUTO') assert.deepEqual(p.principal.map((n) => n.cuerda), GRUPOS_CUERDAS_4[cuerdas])
          const clases = new Set(p.principal.map((n) => n.clase))
          assert.ok(clases.size >= 3)
          assert.ok(p.principal.every((n) => acorde.notas.some((nota) => nota.clase === n.clase)))
          const requeridas = acorde.notas.filter(nota => nota.esencial)
          assert.ok(requeridas.every((n) => clases.has(n.clase)))
          assert.equal(Boolean(p.bajo), bajo)
          const notas = [...p.principal, ...(p.bajo ? [p.bajo] : [])]
          assert.equal(new Set(notas.map((n) => n.cuerda)).size, notas.length)
          assert.ok(notas.every((n, i) => i === 0 || notas[i - 1].midi > n.midi))
          const trastes = notas.map((n) => n.traste)
          assert.ok(Math.max(...trastes) - Math.min(...trastes) <= 4)
          for (const n of notas) {
            assert.ok(n.traste >= Math.max(0, desde - 2) && n.traste <= Math.min(15, hasta + 2))
            assert.equal(n.clase, NOTAS.indexOf(notaEnTraste(AFINACION[n.cuerda], n.traste)))
          }
          assert.equal(p.opcional, null)
        }
      }
    }
    assert.ok(generarPosiciones(acorde, { cantidadCuerdas: 4 }).length > 0, acorde.nombre)
  }
  for (const nombre of ['C', 'Cm', 'A7', 'Am7', 'Amaj7']) {
    const p = generarPosiciones(nombre, { cantidadCuerdas: 4, zona: 'ABIERTA' })[0]
    assert.equal(new Set(p.principal.map((n) => n.clase)).size, interpretarAcorde(nombre).notas.length)
  }
  for (const nombre of ['D/F#', 'C/F#', 'Bb/Db', 'Am7/G']) {
    const propuestas = generarPosiciones(nombre, { cantidadCuerdas: 4 })
    assert.ok(propuestas.length > 0)
    assert.ok(propuestas.every((p) => p.bajo.clase === interpretarAcorde(nombre).bajo.clase))
  }
  assert.deepEqual(generarPosiciones('C', { cantidadCuerdas: 4, cuerdas: '3–4–5–6', bajo: true }), [])
  assert.deepEqual(generarPosiciones('C', { cantidadCuerdas: 5 }), [])
  assert.deepEqual(generarPosiciones('C', { cantidadCuerdas: 4, cuerdas: '1–2–3' }), [])
})

test('el guardado de cuatro voces y la nota opcional conservan formato y referencias válidas', () => {
  for (const cantidadCuerdas of [3, 4]) {
    for (const p of generarPosiciones('A7', { cantidadCuerdas, zona: 'ABIERTA' })) {
      const editable = propuestaAEditable(interpretarAcorde('A7'), p)
      const guardado = leerNotas(guardarNotas({ texto: 'Notas intactas', acordes: [editable] }))
      assert.equal(guardado.texto, 'Notas intactas')
      assert.deepEqual(guardado.acordes[0], editable)
      if (editable.opcional) {
        editable.posiciones[editable.opcional.cuerda][editable.opcional.traste] = 'vacio'
        assert.equal(normalizarAcorde(editable).opcional, null)
      }
    }
  }
})

test('las nuevas fórmulas se transponen a las doce tónicas conservando intervalos y grafía', () => {
  const intervalos = {
    mMaj7: [0, 3, 7, 11], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10],
    add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14], add11: [0, 4, 7, 17],
    '9': [0, 4, 7, 10, 14], maj9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14],
    '7sus4': [0, 5, 7, 10], '7b5': [0, 4, 6, 10], '7#5': [0, 4, 8, 10],
    '7b9': [0, 4, 7, 10, 13], '7#9': [0, 4, 7, 10, 15], '7b13': [0, 4, 7, 10, 20],
    '11': [0, 4, 7, 10, 14, 17], m11: [0, 3, 7, 10, 14, 17],
    '13': [0, 4, 7, 10, 14, 17, 21], m13: [0, 3, 7, 10, 14, 17, 21], maj13: [0, 4, 7, 11, 14, 17, 21],
  }
  for (const [sufijo, esperados] of Object.entries(intervalos)) {
    for (const raiz of NOTAS) {
      const acorde = interpretarAcorde(raiz + sufijo)
      assert.deepEqual(acorde.notas.map(n => n.intervalo), esperados)
      assert.deepEqual(acorde.notas.map(n => n.clase), esperados.map(i => (NOTAS.indexOf(raiz) + i) % 12))
    }
  }
  assert.deepEqual(interpretarAcorde('E9').notas.map(n => n.nombre), ['E', 'G#', 'B', 'D', 'F#'])
  assert.deepEqual(interpretarAcorde('Cdim7').notas.map(n => n.nombre), ['C', 'Eb', 'Gb', 'Bbb'])
  assert.deepEqual(interpretarAcorde('E7#9').notas.map(n => n.nombre), ['E', 'G#', 'B', 'D', 'F##'])
  assert.equal(interpretarAcorde(' e9/f♯ ').nombre, 'E9/F#')
})

test('las voces reducidas mantienen tercera, séptima y extensión o alteración característica', () => {
  for (const [nombre, esenciales] of Object.entries({
    E9: [8, 2, 6], Em9: [7, 2, 6], E7b9: [8, 2, 5], 'E7#9': [8, 2, 7],
    E11: [8, 2, 9], E13: [8, 2, 1], Am7b5: [0, 3, 7], Cdim7: [3, 6, 9],
  })) {
    for (const cantidadCuerdas of [3, 4]) {
      const propuestas = generarPosiciones(nombre, { cantidadCuerdas })
      assert.ok(propuestas.length > 0, `${nombre}/${cantidadCuerdas}`)
      for (const p of propuestas) assert.ok(esenciales.every(clase => p.principal.some(n => n.clase === clase)))
    }
  }
  for (const nombre of ['E', 'Em', 'E7', 'A7', 'Asus2', 'Asus4']) {
    for (const cantidadCuerdas of [3, 4]) assert.deepEqual(generarPosiciones(nombre, { cantidadCuerdas }), generarPosiciones(nombre, { cantidadCuerdas, completo: false }))
  }
})

test('la estimación de dedos reconoce cejillas reales y rechaza tapar cuerdas al aire o muteadas', () => {
  const notas = trastes => trastes.flatMap((traste, cuerda) => traste === null ? [] : [{ cuerda, traste }])
  assert.equal(dedosNecesarios(notas([0, 0, 1, 2, 2, 0])), 2) // E abierto: cejilla corta en 4/5.
  assert.equal(dedosNecesarios(notas([1, 1, 2, 3, 3, 1])), 3) // F con cejilla.
  assert.equal(dedosNecesarios(notas([2, 0, 1, 0, 2, 0])), 3) // E9: los dos trastes 2 no comparten dedo.
  assert.equal(dedosNecesarios(notas([1, 2, 3, 4, 2, 3])), 5)
  assert.equal(dedosNecesarios(notas([2, null, 2])), 2)
  assert.equal(dedosNecesarios(notas([0, 0, 0])), 0)
})

test('los casos pedidos funcionan en tres, cuatro y acorde completo en cada zona', () => {
  const nombres = ['E', 'Em', 'E7', 'Emaj7', 'Em7', 'E9', 'Em9', 'E7b9', 'E7#9', 'E11', 'E13', 'Asus2', 'Asus4', 'Am7b5', 'Cdim7']
  for (const nombre of nombres) for (const zona of Object.keys(ZONAS)) {
    for (const modo of [{ cantidadCuerdas: 3 }, { cantidadCuerdas: 4 }, { completo: true }]) {
      const acorde = interpretarAcorde(nombre)
      const propuestas = generarPosiciones(acorde, { ...modo, zona })
      assert.ok(propuestas.length > 0, `${nombre}/${zona}/${JSON.stringify(modo)}`)
      assert.equal(new Set(propuestas.map(p => p.id)).size, propuestas.length)
      for (const p of propuestas) {
        assert.ok(p.principal.length >= 3 && p.principal.length <= 6)
        if (!modo.completo) assert.equal(p.principal.length, modo.cantidadCuerdas)
        assert.equal(new Set(p.principal.map(n => n.cuerda)).size, p.principal.length)
        assert.ok(p.principal.every((n, i) => i === 0 || p.principal[i - 1].midi > n.midi))
        const trastes = p.principal.map(n => n.traste)
        assert.ok(Math.max(...trastes) - Math.min(...trastes) <= 4)
        const [desde, hasta] = ZONAS[zona]
        for (const n of p.principal) {
          assert.ok(n.traste >= Math.max(0, desde - 2) && n.traste <= Math.min(15, hasta + 2))
          assert.equal(n.clase, NOTAS.indexOf(notaEnTraste(AFINACION[n.cuerda], n.traste)))
          assert.ok(acorde.notas.some(nota => nota.clase === n.clase))
        }
        assert.ok(acorde.notas.filter(n => n.esencial).every(n => p.principal.some(voz => voz.clase === n.clase)))
        if (modo.completo) {
          assert.equal(p.opcional, null)
          assert.equal(p.bajo, null)
          assert.ok(dedosNecesarios(p.principal) <= 4)
          assert.ok(p.principal.some(n => n.esTonica))
          assert.deepEqual(p.omitidas, acorde.notas.filter(n => !p.principal.some(voz => voz.clase === n.clase)))
          if (acorde.notas.length <= 6) assert.equal(p.omitidas.length, 0, `${nombre}/${zona}`)
          else {
            assert.equal(new Set(p.principal.map(n => n.clase)).size, 6)
            assert.equal(p.omitidas.length, 1)
            assert.ok(p.omitidas.every(n => !n.esencial && n.intervalo !== 0))
          }
        }
      }
    }
  }
  assert.deepEqual(generarPosiciones('E', { completo: true, zona: 'inexistente' }), [])
})

test('acorde completo ignora los filtros de cuerdas y bajo, pero conserva el bajo de un slash', () => {
  const completo = generarPosiciones('E9', { completo: true })
  assert.deepEqual(completo, generarPosiciones('E9', { completo: true, cantidadCuerdas: 99, cuerdas: 'inactivo', bajo: true }))
  for (const nombre of ['E9/F#', 'C9/F#', 'E13/D']) {
    const acorde = interpretarAcorde(nombre)
    const propuestas = generarPosiciones(acorde, { completo: true })
    assert.ok(propuestas.length > 0)
    for (const p of propuestas) {
      assert.equal(p.principal.at(-1).clase, acorde.bajo.clase)
      assert.equal(p.principal.at(-1).esBajo, true)
      assert.ok(p.principal.length <= 6)
      assert.ok(dedosNecesarios(p.principal) <= 4)
    }
  }
})

test('las formas completas mantienen todas sus voces, cejillas y cuerdas muteadas al guardar y editar', () => {
  for (const nombre of ['E', 'E9', 'E11', 'E13', 'Cdim7', 'E9/F#']) {
    for (const p of generarPosiciones(nombre, { completo: true })) {
      const datos = propuestaAEditable(interpretarAcorde(nombre), p)
      const guardado = leerNotas(guardarNotas({ texto: 'Conservar', acordes: [datos] }))
      assert.deepEqual(guardado.acordes[0], datos)
      assert.equal(guardado.texto, 'Conservar')
      assert.equal(datos.posiciones.flat().filter(e => ['aire', 'presionada'].includes(e)).length, p.principal.length)
      assert.equal(datos.posiciones.flat().filter(e => e === 'muteada').length, 6 - p.principal.length)
      for (const n of p.principal) {
        const columna = n.traste === 0 ? 0 : datos.trastes.indexOf(String(n.traste))
        assert.equal(datos.posiciones[n.cuerda][columna], n.traste === 0 ? 'aire' : 'presionada')
        if (n.esBajo) assert.deepEqual(datos.bajo, { cuerda: n.cuerda, traste: columna })
      }
    }
  }
})

test('las 31 calidades tienen formas completas en las doce tónicas, con la excepción explícita de siete grados', () => {
  for (const raiz of NOTAS) for (const sufijo of SUFIJOS_ACORDES) {
    const acorde = interpretarAcorde(raiz + sufijo)
    const propuestas = generarPosiciones(acorde, { completo: true })
    assert.ok(propuestas.length > 0, acorde.nombre)
    for (const p of propuestas) {
      assert.ok(dedosNecesarios(p.principal) <= 4)
      assert.equal(new Set(p.principal.map(n => n.clase)).size, Math.min(6, acorde.notas.length), acorde.nombre)
      assert.equal(p.omitidas.length, Math.max(0, acorde.notas.length - 6))
      assert.ok(p.omitidas.every(n => !n.esencial && n.intervalo !== 0))
    }
  }
})
