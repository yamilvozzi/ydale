// Las grafías enarmónicas se conservan para buscar con sostenidos o bemoles.
export const RAICES_ACORDES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Cb', 'B#', 'E#', 'Fb']
export const SUFIJOS_ACORDES = ['', 'm', '7', 'm7', 'maj7', 'sus2', 'sus4', '6', 'm6', 'dim', 'aug']

export const CATALOGO_ACORDES = RAICES_ACORDES.flatMap((raiz) => [
  ...SUFIJOS_ACORDES.map((sufijo) => ({ nombre: `${raiz}${sufijo}`, raiz })),
  ...RAICES_ACORDES.map((bajo) => ({ nombre: `${raiz}/${bajo}`, raiz })),
])

export function filtrarAcordes(consulta) {
  const texto = consulta.trim().replaceAll('♯', '#').replaceAll('♭', 'b').toLowerCase()
  if (!texto) return CATALOGO_ACORDES
  const raiz = texto.match(/^[a-g][#b]?/)?.[0]
  if (!raiz) return []
  return CATALOGO_ACORDES.filter((acorde) =>
    acorde.raiz.toLowerCase() === raiz && acorde.nombre.toLowerCase().startsWith(texto)
  )
}
