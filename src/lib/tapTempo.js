export const PAUSA_TAP_MS = 4000
const INTERVALO_MINIMO_MS = 80

const mediana = valores => {
  const ordenados = [...valores].sort((a, b) => a - b)
  const medio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 ? ordenados[medio] : (ordenados[medio - 1] + ordenados[medio]) / 2
}

/** Usa toda la sesión. La mediana y su desviación absoluta permiten excluir
 * golpes dobles o perdidos sin que un único error sesgue el promedio. */
export function estimarBpm(intervalos) {
  if (intervalos.length < 2) return null
  const centro = mediana(intervalos)
  const desviacion = mediana(intervalos.map(intervalo => Math.abs(intervalo - centro)))
  const tolerancia = Math.max(centro * 0.2, desviacion * 3)
  const validos = intervalos.filter(intervalo => Math.abs(intervalo - centro) <= tolerancia)
  return Math.round(60000 / (validos.reduce((suma, intervalo) => suma + intervalo, 0) / validos.length))
}

export const medicionVacia = () => ({ ultima: null, intervalos: [], golpes: 0, finalizada: false })

export function registrarTap(medicion, ahora) {
  if (medicion.ultima === null || medicion.finalizada || ahora - medicion.ultima >= PAUSA_TAP_MS) {
    return { ...medicionVacia(), ultima: ahora, golpes: 1 }
  }
  const intervalo = ahora - medicion.ultima
  if (intervalo < INTERVALO_MINIMO_MS) return medicion
  return { ultima: ahora, intervalos: [...medicion.intervalos, intervalo], golpes: medicion.golpes + 1, finalizada: false }
}
