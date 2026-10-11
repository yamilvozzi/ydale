const numeroTraste = (valor) => {
  const texto = String(valor ?? '').trim()
  return /^\d+$/.test(texto) && Number(texto) > 0 ? Number(texto) : null
}

/** Sólo una vista: los índices devueltos apuntan siempre a las celdas originales.
 * Las cuerdas al aire y muteadas se dibujan aparte, a la izquierda de la cejuela.
 */
export function ventanaAcorde(acorde) {
  const numeros = acorde.trastes.map(numeroTraste)
  const ocupados = acorde.posiciones.flatMap((fila) => fila.flatMap((estado, indice) =>
    estado === 'presionada' ? [numeros[indice]] : []
  ))
  const minFret = ocupados.length ? Math.min(...ocupados) : null
  const maxFret = ocupados.length ? Math.max(...ocupados) : null
  const span = ocupados.length ? maxFret - minFret + 1 : 0

  // Los dibujos manuales históricos pueden tener números libres o sin definir.
  // Sin un rango representable, conservarlos evita inventar o perder notas.
  if (ocupados.includes(null) || span > 5) {
    return {
      trastes: [...acorde.trastes],
      indicesPorCuerda: acorde.posiciones.map((fila) => fila.map((_, indice) => indice)),
    }
  }

  const cantidad = Math.max(4, span)
  const inicio = minFret === null || minFret === 1 ? 1
    : span <= 3 ? Math.max(1, minFret - 1) : minFret
  const trastes = Array.from({ length: cantidad }, (_, indice) => String(inicio + indice))
  return {
    trastes,
    indicesPorCuerda: acorde.posiciones.map((fila) => trastes.map((traste) => {
      const indice = fila.findIndex((estado, i) => estado === 'presionada' && numeros[i] === Number(traste))
      return indice < 0 ? null : indice
    })),
  }
}
