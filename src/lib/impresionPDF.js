import { caracteresConPosicion, distribuirCarriles, versosConPosicion } from './anclasEstructura.js'
import { claseDeNota } from './circuloQuintas.js'
import { AFINACION, CANTIDAD_TRASTES, TRASTES_DE_REFERENCIA, notaEnTraste, tituloEscala } from './escalas.js'
import { leerEstructura, nombreBloque, separarParrafos } from './estructura.js'
import { leerNotas } from './notasConAcordes.js'
import { obtenerMarcadoresEscalaConAcorde } from './resaltadoEscala.js'
import { transponerNombreAcorde } from './transposicion.js'

const entidades = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const texto = valor => String(valor ?? '').replace(/[&<>"']/g, caracter => entidades[caracter])
const fechaEvento = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const estilos = `
  * { box-sizing: border-box }
  html { color-scheme: light; background: #fff; color: #171717 }
  body { margin: 0; font: 11pt/1.4 Arial, sans-serif }
  h1, h2, h3, p { margin: 0; overflow-wrap: anywhere }
  h1 { font-size: 23pt; line-height: 1.15; margin-bottom: 2mm }
  h2 { font-size: 13pt; margin: 5mm 0 2mm; break-after: avoid }
  h3 { font-size: 11pt; margin-bottom: 1.5mm; break-after: avoid }
  .cabecera { border-bottom: .6pt solid #777; padding-bottom: 3mm; margin-bottom: 4mm; break-inside: avoid }
  .marca { font-size: 9pt; font-weight: bold; letter-spacing: .14em; margin-bottom: 2mm }
  .dato { color: #444; font-size: 9.5pt }
  .columnas { columns: 2; column-gap: 6mm }
  .ficha, .bloque, .estrofa, .diagrama { break-inside: avoid; margin: 0 0 2.5mm }
  .ficha, .bloque, .diagrama { border: .55pt solid #aaa; border-radius: 2mm; padding: 2mm 2.7mm }
  .ficha { list-style: none; display: flex; align-items: baseline; gap: 2.5mm }
  .numero { flex: none; min-width: 3ch; font-weight: bold; font-variant-numeric: tabular-nums }
  ol { margin: 0; padding: 0 }
  .bloque h3 { display: flex; justify-content: space-between; gap: 3mm }
  .repite { flex: none; font-weight: normal; color: #444 }
  .indicacion { margin-top: 1.5mm }
  .pre { white-space: pre-wrap; overflow-wrap: anywhere }
  .letra { font: 10.5pt/1.45 "Courier New", monospace }
  .verso { white-space: pre; min-height: 1.45em; break-inside: avoid }
  .silaba { position: relative }
  .cifrado { position: absolute; left: 0; width: max-content; max-width: 24ch; line-height: 1.05; font-weight: bold; white-space: normal; overflow-wrap: anywhere }
  .fila-acordes { display: flex; gap: 3mm; break-inside: avoid; page-break-inside: avoid }
  .fila-acordes > .diagrama { min-width: 0; flex: 0 0 calc((100% - 3mm) / 2) }
  .apaisado .fila-acordes > .diagrama { flex-basis: calc((100% - 6mm) / 3) }
  .diagrama svg { display: block; width: 100%; height: auto; overflow: visible }
  .apaisado .diagrama-escala { max-width: 198mm }
  .fila-acordes .diagrama svg { max-height: 44mm }
  .diagrama svg text { fill: #171717; font: 10px Arial, sans-serif }
  .diagrama svg .traste { fill: #444; font-size: 11px }
  .diagrama svg .bajo { font-size: 9px; font-weight: bold }
  .diagrama svg .muteada { font-size: 16px; font-weight: bold }
  .diagrama svg .tenue { opacity: .35 }
  .diagrama .referencia { margin-top: 1mm; font-size: 9pt; color: #444 }
  @media screen {
    body { background: #ececec }
    .barra { position: sticky; top: 0; left: 0; z-index: 1; display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: white; border-bottom: 1px solid #bbb }
    .barra button { min-height: 44px; border: 1px solid #333; border-radius: 6px; padding: 5px 12px; background: #222; color: white; font: inherit; cursor: pointer }
    .hoja { width: 210mm; margin: 16px auto; padding: 12mm; background: white; min-height: 60vh }
    .apaisado .hoja { width: 297mm }
  }
  @media print { .barra { display: none !important } }
`

function documento(titulo, subtitulos, cuerpo, orientacion) {
  const apaisado = orientacion === 'apaisado'
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${texto(titulo)}</title>
    <style>@page { size: A4 ${apaisado ? 'landscape' : 'portrait'}; margin: 12mm }${estilos}</style></head>
    <body class="${apaisado ? 'apaisado' : 'vertical'}"><div class="barra"><button type="button" onclick="window.print()">Imprimir / Guardar como PDF</button></div>
    <main class="hoja"><header class="cabecera"><p class="marca">YDALE</p><h1>${texto(titulo)}</h1>${subtitulos.filter(Boolean).map(dato => `<p class="dato">${texto(dato)}</p>`).join('')}</header>${cuerpo}</main></body></html>`
}

export function abrirImpresionPDF(html) {
  const vista = window.open('about:blank', '_blank')
  if (!vista) throw new Error('El navegador bloqueó la vista de impresión. Permití las ventanas emergentes para YDALE e intentá de nuevo.')
  vista.opener = null
  vista.document.open()
  vista.document.write(html)
  vista.document.close()
}

export function imprimirSetlist(setlist) {
  const fecha = setlist.date && new Date(`${setlist.date}T12:00:00Z`)
  const items = setlist.items ?? []
  const fichas = items.map((tema, i) => `<li class="ficha"><span class="numero">${i + 1}.</span><div><p><strong>${texto(tema.nombre)}</strong></p>${tema.artista ? `<p class="dato">${texto(tema.artista)}</p>` : ''}</div></li>`).join('')
  return documento(setlist.title, [fecha && Number.isFinite(+fecha) ? fechaEvento.format(fecha) : '', setlist.place, `${items.length} ${items.length === 1 ? 'canción' : 'canciones'}`],
    items.length ? `<ol class="${items.length > 12 ? 'columnas' : ''}">${fichas}</ol>` : '<p>Sin canciones.</p>', 'vertical')
}

const linea = (x1, y1, x2, y2, grosor = 1) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#555" stroke-width="${grosor}"/>`
const rotulo = (x, y, valor, clase = '') => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" class="${clase}">${texto(valor)}</text>`

function marcador(x, y, { nota, esTonica, esOpcional, esNotaBlues, esAtenuada, esBajo }) {
  const radio = nota ? 9 : 4
  const exterior = esTonica ? `<circle cx="${x}" cy="${y}" r="${radio + 2.5}" fill="#fff" stroke="#222"/>` : ''
  const borde = esOpcional ? 'stroke-dasharray="4 2"' : esNotaBlues ? 'stroke-dasharray="2 1"' : ''
  const punto = `<circle cx="${x}" cy="${y}" r="${radio}" fill="${nota || esOpcional ? '#fff' : '#222'}" stroke="#222" stroke-width="${esNotaBlues ? 1.7 : 1}" ${borde}/>`
  return `<g${esAtenuada ? ' class="tenue"' : ''}>${exterior}${punto}${nota ? rotulo(x, y, nota) : ''}${esBajo ? rotulo(x + 13, y - 7, 'B', 'bajo') : ''}</g>`
}

function diagramaEscala(escala) {
  const chip = escala.resaltado?.acordes.find(a => a.id === escala.resaltado.seleccionado)
  const distancia = chip ? claseDeNota(escala.tonica) - claseDeNota(chip.tonica) : 0
  const acorde = chip && (distancia ? transponerNombreAcorde(chip.nombre, distancia) : chip.nombre)
  const notas = obtenerMarcadoresEscalaConAcorde(escala.tonica, escala.tipo, acorde)
  const x = traste => 27 + traste * 43
  const y = cuerda => 29 + cuerda * 20
  const fin = x(CANTIDAD_TRASTES) + 21.5
  const cuerdas = AFINACION.map((nota, cuerda) => linea(x(0), y(cuerda), fin, y(cuerda)) +
    Array.from({ length: CANTIDAD_TRASTES + 1 }, (_, traste) => {
      const punto = notas.get(notaEnTraste(nota, traste))
      return punto ? marcador(x(traste), y(cuerda), punto) : ''
    }).join(''))
  const trastes = Array.from({ length: CANTIDAD_TRASTES + 1 }, (_, i) => linea(x(i) + 21.5, y(0), x(i) + 21.5, y(5), i === 0 ? 2 : 1))
  const numeros = [0, ...TRASTES_DE_REFERENCIA].map(n => rotulo(x(n), 9, n, 'traste'))
  return `<figure class="diagrama diagrama-escala"><h3>${texto(tituloEscala(escala))}</h3><svg viewBox="0 0 ${fin + 8} 143" role="img" aria-label="${texto(tituloEscala(escala))}">${trastes.join('')}${numeros.join('')}${cuerdas.join('')}</svg>${acorde ? `<p class="referencia">Acorde destacado: ${texto(acorde)}</p>` : ''}</figure>`
}

function diagramaAcorde(acorde) {
  const titulo = acorde.nombre || 'Acorde sin nombre'
  const x = indice => 49 + indice * 43
  const y = cuerda => 29 + cuerda * 21
  const fin = x(acorde.trastes.length - 1) + 21.5
  const cuerdas = acorde.posiciones.map((fila, cuerda) => linea(27.5, y(cuerda), fin, y(cuerda)) +
    fila.map((estado, i) => {
      if (estado === 'muteada') return rotulo(14, y(cuerda), '×', 'muteada')
      if (estado !== 'aire' && estado !== 'presionada') return ''
      const referencia = dato => dato?.cuerda === cuerda && dato.traste === i
      const numero = acorde.trastes[i].trim()
      const nota = estado === 'aire' ? AFINACION[cuerda] : /^\d+$/.test(numero) ? notaEnTraste(AFINACION[cuerda], Number(numero)) : ''
      return marcador(estado === 'aire' ? 14 : x(i), y(cuerda), { nota, esTonica: referencia(acorde.tonica), esOpcional: referencia(acorde.opcional), esBajo: referencia(acorde.bajo) })
    }).join(''))
  const trastes = linea(27.5, y(0), 27.5, y(5), 2) + acorde.trastes.map((n, i) =>
    linea(x(i) + 21.5, y(0), x(i) + 21.5, y(5)) + rotulo(x(i), 9, n, 'traste')).join('')
  return `<figure class="diagrama"><h3>${texto(titulo)}</h3><svg viewBox="0 0 ${fin + 8} 148" role="img" aria-label="${texto(titulo)}">${trastes}${cuerdas.join('')}</svg></figure>`
}

function grupoAcordes(acordes, orientacion) {
  const referencias = [
    acordes.some(a => a.tonica) && 'Doble círculo: tónica',
    acordes.some(a => a.opcional) && 'Círculo discontinuo: nota opcional',
    acordes.some(a => a.bajo) && 'B: bajo',
    acordes.some(a => a.posiciones.some(fila => fila.includes('muteada'))) && '×: cuerda muteada',
  ].filter(Boolean)
  const columnas = orientacion === 'apaisado' ? 3 : 2
  const filas = []
  for (let i = 0; i < acordes.length; i += columnas) {
    filas.push(`<div class="fila-acordes">${acordes.slice(i, i + columnas).map(diagramaAcorde).join('')}</div>`)
  }
  return `${referencias.length ? `<p class="dato" style="margin-bottom:2mm;break-after:avoid">${referencias.join(' · ')}</p>` : ''}${filas.join('')}`
}

export function imprimirPizarra(pizarra, proyecto, orientacion = 'apaisado') {
  // La vista de Pizarra muestra primero las escalas y luego los acordes.
  const escalas = pizarra.elementos.filter(e => e.tipo === 'escala').map(e => e.datos)
  const acordes = pizarra.elementos.filter(e => e.tipo === 'acorde').map(e => e.datos)
  return documento(proyecto?.titulo ?? 'Pizarra musical', [proyecto?.fecha ? fechaEvento.format(new Date(`${proyecto.fecha}T12:00:00Z`)) : ''],
    `${escalas.length ? `<section><h2>Escalas</h2>${escalas.map(diagramaEscala).join('')}</section>` : ''}${acordes.length ? `<section><h2>Acordes</h2>${grupoAcordes(acordes, orientacion)}</section>` : ''}`, orientacion)
}

export function contenidoTemaPDF(tema, escalas = []) {
  const acordes = leerNotas(tema.notas).acordes
  let bloques = [], estructuraIncompatible = false
  try { bloques = leerEstructura(tema.estructura).bloques }
  catch { estructuraIncompatible = true }
  return { tema, escalas, acordes, bloques, estructuraIncompatible }
}

export const SECCIONES_PDF = [
  ['letra', 'Letra con acordes'], ['estructura', 'Estructura'], ['escala', 'Escala'],
  ['percusion', 'Percusión'], ['acordes', 'Diagramas de acordes'],
]

export function seccionesDisponiblesPDF({ tema, escalas, acordes, bloques }) {
  return {
    letra: Boolean(tema.letra?.trim() || bloques.some(bloque => bloque.letra || bloque.anclas?.length)),
    estructura: bloques.length > 0,
    escala: escalas.length > 0,
    percusion: Boolean(tema.percusion?.trim()),
    acordes: acordes.length > 0,
  }
}

function versoAnclado(verso, anclas, ancho) {
  const caracteres = caracteresConPosicion(verso.texto).map(c => ({ ...c, posicion: c.posicion + verso.inicio }))
  caracteres.push({ caracter: '\u200b', posicion: verso.fin })
  const enVerso = anclas.filter(a => a.posicion >= verso.inicio && a.posicion <= verso.fin)
  const margen = enVerso.reduce((max, a) => Math.max(max, Math.min(a.nombre.length, 24)), 0)
  const maximo = ancho - margen
  const lineas = []
  for (let inicio = 0; inicio < caracteres.length;) {
    let fin = Math.min(inicio + maximo, caracteres.length)
    if (fin < caracteres.length) {
      const espacio = caracteres.slice(inicio, fin).findLastIndex(c => /\s/.test(c.caracter))
      if (espacio > maximo / 2) fin = inicio + espacio + 1
    }
    const tramo = caracteres.slice(inicio, fin)
    const rotulos = enVerso.flatMap(a => {
      const izquierda = tramo.findIndex(c => c.posicion === a.posicion)
      return izquierda < 0 ? [] : [{ ...a, izquierda, derecha: izquierda + Math.min(a.nombre.length, 24) }]
    })
    const { carriles, cantidad } = distribuirCarriles(rotulos)
    const altos = Array(cantidad).fill(0)
    for (const a of rotulos) altos[carriles[a.id]] = Math.max(altos[carriles[a.id]], Math.ceil(a.nombre.length / 24))
    const desplazamientos = altos.map((_, i) => altos.slice(0, i).reduce((a, b) => a + b, 0))
    const alto = altos.reduce((a, b) => a + b, 0)
    const escrito = tramo.map(c => {
      const cifrados = rotulos.filter(a => a.posicion === c.posicion)
      if (!cifrados.length) return texto(c.caracter)
      return `<span class="silaba">${texto(c.caracter)}${cifrados.map(a => `<span class="cifrado" style="bottom:calc(100% + ${desplazamientos[carriles[a.id]] * 1.15}em)">${texto(a.nombre)}</span>`).join('')}</span>`
    }).join('')
    lineas.push(`<div class="verso"${alto ? ` style="padding-top:${alto * 1.15}em"` : ''}>${escrito}</div>`)
    inicio = fin
  }
  return lineas.join('')
}

function letraAnclada(letra, anclas, porId, ancho) {
  const rotulos = (anclas ?? []).flatMap(ancla => {
    const nombre = porId.get(ancla.acordeId)?.nombre.trim()
    return nombre ? [{ ...ancla, nombre }] : []
  })
  return rotulos.length ? `<div class="letra">${versosConPosicion(letra).map(verso => versoAnclado(verso, rotulos, ancho)).join('')}</div>` : `<p class="letra pre">${texto(letra)}</p>`
}

function cabeEnColumna(bloque, porId) {
  const margen = (bloque.anclas ?? []).reduce((max, a) => Math.max(max, Math.min(porId.get(a.acordeId)?.nombre.length ?? 0, 24)), 0)
  return bloque.letra.split('\n').every(linea => linea.length + margen <= 54)
}

function letraTema({ tema, bloques }, porId, orientacion) {
  const letra = (tema.letra ?? '').replace(/\r\n?/g, '\n').trim()
  const estrofas = separarParrafos(letra)
  const bloquesConLetra = bloques.filter(b => b.letra || b.anclas?.length)
  const coincide = bloquesConLetra.length === estrofas.length && bloquesConLetra.every((b, i) => b.letra === estrofas[i])
  // Sólo trasladar las anclas cuando se trata del mismo texto, en el mismo orden.
  const partes = !letra || coincide ? bloquesConLetra : estrofas.map(letra => ({ letra }))
  const dosColumnas = orientacion === 'apaisado' && partes.length > 1 && partes.every(b => cabeEnColumna(b, porId))
  const ancho = dosColumnas ? 56 : orientacion === 'apaisado' ? 116 : 80
  return `<div class="${dosColumnas ? 'columnas' : ''}">${partes.map(b => `<div class="estrofa">${letraAnclada(b.letra, b.anclas, porId, ancho)}</div>`).join('')}</div>`
}

export function imprimirTema(contenido, seleccion, orientacion = 'vertical') {
  const { tema, bloques, escalas, acordes } = contenido
  const disponibles = seccionesDisponiblesPDF(contenido)
  const porId = new Map(acordes.map(acorde => [acorde.id, acorde]))
  const dosColumnas = orientacion === 'apaisado' && bloques.length > 1 && bloques.every(b => cabeEnColumna(b, porId))
  const ancho = dosColumnas ? 56 : orientacion === 'apaisado' ? 116 : 80
  const secciones = {
    letra: () => letraTema(contenido, porId, orientacion),
    estructura: () => `<div class="${dosColumnas ? 'columnas' : ''}">${bloques.map((bloque, i) => `<article class="bloque"><h3><span>${i + 1}. ${texto(nombreBloque(bloque))}</span><span class="repite">×${bloque.repeticiones}</span></h3>${bloque.letra || bloque.anclas?.length ? letraAnclada(bloque.letra, bloque.anclas, porId, ancho - 3) : ''}${bloque.nota ? `<p class="dato pre indicacion">${texto(bloque.nota)}</p>` : ''}</article>`).join('')}</div>`,
    escala: () => escalas.map(diagramaEscala).join(''),
    percusion: () => `<p class="pre">${texto(tema.percusion)}</p>`,
    acordes: () => grupoAcordes(acordes, orientacion),
  }
  const cuerpo = SECCIONES_PDF.filter(([clave]) => disponibles[clave] && seleccion.includes(clave))
    .map(([clave, nombre]) => `<section><h2>${nombre}</h2>${secciones[clave]()}</section>`).join('')
  if (!cuerpo) throw new Error('Seleccioná al menos una sección con contenido.')
  return documento(tema.nombre, [tema.artista], cuerpo, orientacion)
}
