# YDALE — Identidad de textos · Etapa 3 de 3

20 de noviembre de 2026.

**Estado: propuesta pendiente de aprobación editorial. Ningún texto de este documento está implementado.**

Se consultaron la [revisión original](REVISION_TEXTOS_YDALE.md), el [seguimiento de las etapas anteriores](UX_WRITING_YDALE_SEGUIMIENTO.md) y los mensajes vigentes en el código. Las citas de «Texto actual» corresponden a esta versión de la aplicación, no a la redacción anterior de la auditoría.

## Criterio editorial

La voz puede acercarse a una conversación de ensayo mediante verbos como sumar, arrancar y probar, y referencias a lo que vamos a tocar. No hace falta agregar lunfardo ni un chiste para que suene propia.

Se seleccionaron **cuatro oportunidades**, todas en estados vacíos. El cambio buscado es pasar de describir una ausencia a invitar a empezar o explicar para qué sirve ese espacio. Son propuestas puntuales: no establecen una fórmula para todos los mensajes ni sustituciones globales.

No se proponen nuevos chistes. El humor que ya tiene contexto en la banda funciona mejor que una frase ingeniosa agregada por obligación. Se mantienen el voseo y la terminología de las etapas anteriores.

## I01 — El primer tema del Repertorio

- **Ubicación:** pantalla principal de Repertorio, cuando todavía no hay ningún tema; no corresponde a una búsqueda sin resultados.
- **Texto actual:** «Todavía no hay temas cargados.»
- **Texto propuesto:** «Sumá el primer tema.»
- **Motivo:** reemplaza la descripción de un catálogo vacío por una invitación breve y natural. Habla de sumar un tema al repertorio, una acción reconocible para la banda, y acompaña el control existente Nuevo tema.
- **Tipo de cambio:** naturalidad y brevedad.
- **Archivo y componente:** [src/pages/Repertorio.jsx, línea 73](../src/pages/Repertorio.jsx#L73), componente `Repertorio`.
- **Límite:** sólo esta aparición. El mismo texto existe en `RepertorioPizarraModal`, donde se seleccionan temas existentes y no se crean; allí se conserva la descripción actual. «No hay resultados.» también se mantiene.

## I02 — Empezar los acordes de un tema

- **Ubicación:** pestaña ACORDES de un tema, cuando no hay bloques ni diagramas de acordes.
- **Texto actual:** «Todavía no hay diagramas cargados.»
- **Texto propuesto:** «Arrancá con un acorde.»
- **Motivo:** pone el foco en la idea musical y en un primer paso sencillo, en lugar de hablar de cargar diagramas. Arrancar es natural en una conversación argentina. Los controles existentes permiten agregar un acorde con el editor o el generador; la frase no promete reproducir sonido ni completar una progresión automáticamente.
- **Tipo de cambio:** naturalidad, brevedad e identidad musical.
- **Archivo y componente:** [src/components/AcordesRepertorio.jsx, línea 224](../src/components/AcordesRepertorio.jsx#L224), componente `AcordesRepertorio`, utilizado en la pestaña por `Notas`.
- **Límite:** sólo el estado vacío general. Se conservan las indicaciones de movimiento, los destinos de arrastre y toda la información de los acordes.

## I03 — Un setlist todavía sin temas

- **Ubicación:** detalle de un setlist vacío, tanto en consulta como en edición.
- **Texto actual:** «Este setlist todavía no tiene temas.»
- **Texto propuesto:** «Acá van los temas que vamos a tocar.»
- **Motivo:** conecta el espacio vacío con su propósito y habla desde el grupo. Funciona para un ensayo o un show sin asumir cuál de los dos se está preparando. No exige una acción inmediata, ya que AGREGAR TEMAS aparece únicamente en edición.
- **Tipo de cambio:** naturalidad e identidad musical.
- **Archivo y componente:** [src/pages/Setlist.jsx, línea 105](../src/pages/Setlist.jsx#L105), componente `Setlist`.
- **Límite:** no cambia el mensaje del listado general de Setlists, los contadores, el autoguardado ni los anuncios accesibles al agregar o mover temas.

## I04 — Volver a las ideas de la Pizarra

- **Ubicación:** biblioteca Pizarras guardadas, cuando todavía no contiene ninguna pizarra.
- **Texto actual:** «Todavía no hay pizarras guardadas.»
- **Texto propuesto:** «Las pizarras que guardes quedan acá para seguir probando.»
- **Motivo:** explica el valor de la biblioteca con el lenguaje de una sesión de prueba: guardar para retomar. Conserva el nombre pizarra y deja explícito que primero hay que guardarla. La cercanía está en ese uso compartido de la herramienta, sin recurrir a un chiste.
- **Tipo de cambio:** naturalidad e identidad musical.
- **Archivo y componente:** [src/components/BibliotecaPizarrasModal.jsx, línea 83](../src/components/BibliotecaPizarrasModal.jsx#L83), componente `BibliotecaPizarrasModal`.
- **Límite:** sólo la biblioteca vacía; «No hay resultados.» se mantiene para las búsquedas. No se modifica la distinción entre borrador local y pizarra guardada ni se sugiere guardado automático.

## Textos que conviene conservar

| Texto o contexto | Decisión |
|---|---|
| «Todavía no hay nada acá. Reservado para Diego.» · Percusión | Conservar exactamente. La complicidad tiene un destinatario y un contexto reales. No se replica la fórmula en otras pantallas. |
| «Entradas, finales, cambios, lo que vaya surgiendo en el ensayo.» · Notas de ACORDES | Conservar exactamente, como se decidió en la etapa 2. Ya tiene naturalidad y contexto musical. |
| «Pizarra vacía.» | Conservar. La auditoría ya lo valoró como claro; no necesita una frase nueva sólo para darle personalidad. |
| «Todavía no hay setlists. Creá uno para organizar el próximo show.» | Conservar. Ya propone un comienzo y lo vincula con la actividad de la banda. |
| «Todavía no hay letra. Tocá el lápiz para agregarla.» | Conservar la solución de etapa 2: la indicación ayuda a encontrar una acción representada por un ícono. |
| «Todavía no hay estructura cargada.» | Conservar. Puede convivir con una advertencia de estructura ilegible; una invitación a empezar de nuevo sería inadecuada en ese caso. |
| Confirmaciones de éxito y anuncios accesibles de agregado o movimiento | Conservar la información concreta sobre lo que ocurrió. No se encontró una mejora de identidad que justificara sustituirla por una frase de festejo. |

## Alcance de la aprobación

Los identificadores I01–I04 son independientes de los P01–P80 de la auditoría y pueden aprobarse por separado. Ninguna propuesta revoca las decisiones de las etapas 1 y 2.

Quedan fuera de esta selección los errores, advertencias, confirmaciones de eliminación, operaciones irreversibles, problemas de guardado, instrucciones técnicas, información musical y notación de acordes. Tampoco se proponen cambios en botones, componentes visuales o funcionalidades.

**Cierre: selección editorial preparada. I01–I04 pendientes de aprobación; sin implementación.**
