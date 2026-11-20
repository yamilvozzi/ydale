# Revisión de textos de YDALE

Fecha: 20 de noviembre de 2026.

**Estado: propuestas para revisar. No están implementadas.** La única corrección aplicada es el modal de eliminación de bloques de ACORDES del Repertorio, descrito abajo.

## Alcance y recuento

- Se rastrearon **87 archivos fuente** JavaScript/JSX de `src`, sin contar pruebas. Se revisaron pantallas, componentes compartidos, etiquetas accesibles, tooltips y mensajes de hooks y bibliotecas que llegan a la interfaz.
- El inventario depurado registra **404 textos o plantillas distintos**, después de la corrección puntual. Un mismo texto repetido en varios componentes cuenta una sola vez. Incluye etiquetas cortas y fragmentos que se combinan con datos dinámicos; no es un conteo de pantallas ni de mensajes mostrados en una sesión.
- Se proponen **80 modificaciones pendientes**: 15 de prioridad alta, 36 media y 29 baja. Cada fila P01–P80 cuenta como una propuesta, aunque tenga más de una ubicación. La corrección ya aplicada no forma parte de esas 80 propuestas.
- Se excluyeron letras, nombres de canciones y artistas, títulos y notas del usuario, valores musicales, notación de acordes, nombres de escalas y datos almacenados. No se consultó ni modificó Supabase. Tampoco se incluyeron identificadores técnicos, clases CSS, rutas ni errores internos que se reemplazan por otro mensaje antes de mostrarse.
- El hook de imágenes `useImagenesEscala.js` no tiene consumidores actuales: sus textos no se presentan como mensajes de una función activa. No se propone recuperar esa función ni modificarla.

**Cómo leer las citas.** El texto actual reproduce el literal definido en el código; sólo se unifican saltos e indentación de JSX. Las expresiones dinámicas se dejan como plantillas, sin cargar nombres ni contenido real. Las mayúsculas que agrega CSS se señalan por separado. Las referencias enlazan el archivo y, cuando corresponde, la línea de definición; los archivos señalados como uso invocan el componente compartido.

## Criterios prácticos

1. **Voseo y frases directas.** Mantener Tocá, Elegí, Revisá e Intentá. Usar acá cuando resulte natural; no sumar lunfardo o chistes por obligación.
2. **Una palabra para cada acción.** Eliminar borra; Quitar separa una referencia; Vaciar retira el contenido de un contenedor. Explicar las consecuencias cuando haya pérdida o reemplazo.
3. **Una unidad musical consistente.** Se propone tema, ya predominante en Repertorio y los contadores. Los cambios de canción a tema dependen de aprobar esta decisión; Setlists, Pizarra y Repertorio conservan sus nombres.
4. **Guardar según lo que hace cada sección.** Guardar cambios actualiza; Guardar como nueva conserva otra pizarra; Descartar cambios y continuar advierte qué se pierde. No presentar el borrador local como guardado en la biblioteca, ni sugerir autoguardado en las pestañas que requieren confirmar.
5. **Título corto y explicación debajo.** Títulos y encabezados en mayúsculas; aclaraciones en escritura normal. Conservar el estilo de cada familia de botones. No aplicar uppercase al diálogo completo, a campos de entrada ni a nombres musicales.
6. **Errores con una salida concreta.** Usar una frase breve y una acción útil. Reservar SQL, migraciones, proveedores y diagnósticos para la documentación técnica. Conservar las advertencias de conflictos, reemplazo y guardado parcial.
7. **Quitar repetición, no información importante.** Un gráfico no necesita anunciar que es una vista previa. En cambio, no quitar la instrucción para ubicar acordes ni la advertencia sobre compases que desaparecen.

Prioridad alta: puede confundir la acción, sus consecuencias o la notación; media: mejora claridad y consistencia; baja: ajuste menor u omisión de una redundancia. Las propuestas de eliminación de texto secundario se indican expresamente.

## Corrección aplicada: eliminar bloque en Repertorio

Antes, el mensaje completo «¿Eliminar el bloque? Sus acordes volverán al sector suelto y se conservarán en la canción.» se enviaba como título. La clase `.modal-titulo` convertía toda la explicación a mayúsculas.

Ahora se muestra:

> **¿ELIMINAR BLOQUE?**
>
> Los acordes no se borran: vuelven a quedar sueltos.

Se agregó una propiedad opcional `titulo` a [src/components/ConfirmarEliminacionModal.jsx](../src/components/ConfirmarEliminacionModal.jsx#L3). Su valor por defecto y el funcionamiento anterior de los demás usos se conservan. [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L237) envía el título separado sólo para eliminar el bloque; Vaciar bloque conserva su texto anterior y tiene una propuesta pendiente en la sección 6.

El título conserva `modal-titulo` y `text-lg`. La explicación reutiliza `text-sm text-butter-muted mt-3`: escritura normal, tamaño menor, color secundario y separación existente. Se conserva `aria-describedby` para asociarla al diálogo. No se cambiaron botones, estilos CSS, callbacks, persistencia ni lógica de eliminación.

## Propuestas pendientes

No ejecutar sustituciones globales a partir de estas tablas: algunas frases se comparten entre contextos con consecuencias distintas.

### 1. General y navegación

| ID | Ubicación | Texto actual | Propuesta | Motivo | Prioridad | Archivo o componente |
|---|---|---|---|---|---|---|
| P01 | Volver desde una sección principal | <code>ATRÁS</code> | INICIO | El destino es Inicio; evita confundirlo con volver a la pantalla anterior. | Baja | [src/components/VolverInicio.jsx](../src/components/VolverInicio.jsx#L7) |
| P02 | Búsquedas sin resultados | <code>Sin coincidencias</code> | No hay resultados. | Unifica el estado de búsqueda con Repertorio y la biblioteca. | Baja | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L199)<br>[src/components/SelectorAcordeEscala.jsx](../src/components/SelectorAcordeEscala.jsx#L75) |
| P03 | Buscadores de Repertorio y Setlists | <code>Buscar...</code> | Buscar tema o artista… | Ambos buscadores aceptan nombre y artista; explicita esa posibilidad y unifica los puntos suspensivos. | Media | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L64)<br>[src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L36) |

### 2. Repertorio

| ID | Ubicación | Texto actual | Propuesta | Motivo | Prioridad | Archivo o componente |
|---|---|---|---|---|---|---|
| P04 | Crear un tema | <code>Agregar tema</code> | Nuevo tema | Distingue crear un tema de agregar uno existente a un setlist. | Baja | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L55) |
| P05 | Crear/editar tema · artista | <code>Y daaaale! (si es propio)</code> | Artista o banda (opcional) | Aclara que el campo es opcional sin sugerir que haya que cargar el nombre de la banda. | Media | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L72) |
| P06 | Editar tema · error de guardado | <code>No se pudo guardar los cambios. Probá de nuevo.</code> | No se pudieron guardar los cambios. Intentá de nuevo. | Corrige la concordancia y unifica la invitación a reintentar. | Alta | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L26) |
| P07 | Crear tema · error | <code>No se pudo crear el tema. Probá de nuevo.</code> | No se pudo crear el tema. Intentá de nuevo. | Mantiene un mismo cierre para los errores equivalentes. | Baja | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L42) |
| P08 | Eliminar tema | <code>¿Seguro que querés eliminar “${temaAEliminar.nombre}” del repertorio?</code> | Título: ¿ELIMINAR TEMA? Texto secundario: “${temaAEliminar.nombre}” se borrará del repertorio. No se puede deshacer. | Separa pregunta y consecuencia, conserva la identificación del tema y advierte la pérdida definitiva. | Alta | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L115) |
| P09 | Abrir un tema no disponible | <code>No se encontró el tema.</code> | Este tema no está disponible. | Evita sonar como un resultado de búsqueda y no atribuye una causa que la pantalla no conoce. | Baja | [src/pages/Tema.jsx](../src/pages/Tema.jsx#L31) |

### 3. Canciones y sus pestañas

| ID | Ubicación | Texto actual | Propuesta | Motivo | Prioridad | Archivo o componente |
|---|---|---|---|---|---|---|
| P10 | Letra · estado vacío | <code>Todavía no hay letra cargada. Tocá el lápiz para escribirla.</code> | Todavía no hay letra. Tocá el lápiz para agregarla. | Acorta la frase y conserva la instrucción útil para comenzar. | Baja | [src/components/tabs/Letra.jsx](../src/components/tabs/Letra.jsx#L16) |
| P11 | Acordes · notas del ensayo | <code>Entradas, finales, cambios, lo que vaya surgiendo en el ensayo.</code> | Entradas, finales y notas del ensayo. | Reduce la enumeración; sigue siendo una invitación abierta a anotar. | Baja | [src/components/tabs/Notas.jsx](../src/components/tabs/Notas.jsx#L106) |
| P12 | Escala · error de carga | <code>No se pudieron cargar las escalas. Verificá la conexión y que la migración esté aplicada.</code> | No se pudieron cargar las escalas. Revisá la conexión; si sigue pasando, avisá para revisar la configuración. | Quita una instrucción de base de datos de la pantalla de uso, conservando la necesidad de revisar la configuración. | Alta | [src/components/tabs/Escala.jsx](../src/components/tabs/Escala.jsx#L32) |
| P13 | Estructura · formato anterior no legible | <code>La estructura guardada no tiene un formato compatible. Podés reemplazarla desde el editor.</code> | No se puede abrir esta estructura. Si guardás otra desde el editor, reemplazás la anterior. | Explica la consecuencia del reemplazo con lenguaje directo. | Alta | [src/components/tabs/Estructura.jsx](../src/components/tabs/Estructura.jsx#L20) |
| P14 | Estructura · pegar letra | <code>Pegá la letra completa. Los párrafos separados por una línea vacía se convertirán en bloques.</code> | Pegá la letra con una línea en blanco entre secciones. Cada sección será un bloque. | Evita la formulación pasiva y mantiene la regla de separación. | Media | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L156) |
| P15 | Estructura · primer bloque | <code>Pegá la letra o agregá un bloque instrumental.</code> | Pegá la letra o agregá un bloque. | El bloque nuevo también permite escribir letra; no obliga a que sea instrumental. | Media | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L163) |
| P16 | Estructura · copiar acordes | <code>Copiar acordes desde...</code> | Copiar acordes de otro bloque… | Hace explícito el origen y unifica los puntos suspensivos. | Media | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L180) |
| P17 | Estructura · nombre del bloque | <code>Nombre libre</code> | Nombre (opcional) | Aclara que se puede dejar vacío y evita usar libre con otro sentido además del bloque libre. | Media | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L195) |
| P18 | Estructura · anotación | <code>Nota del bloque</code> | Indicaciones (opcional) | Distingue la anotación de una nota musical y explicita que no es obligatoria. | Media | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L206) |
| P19 | Estructura · quitar acorde de la letra | <code>Eliminar acorde</code> | Quitar de la letra | Esta acción quita el anclaje; no elimina la tarjeta del tema. | Alta | [src/components/LetraConAcordes.jsx](../src/components/LetraConAcordes.jsx#L130) |
| P20 | Estructura · ayuda para mover acordes | <code>Tocá la letra para ubicar un acorde. Mantené pulsado un acorde y movelo dentro de su línea.</code> | Tocá la letra para agregar un acorde. Para moverlo, mantenelo pulsado y arrastralo en esa línea. | Diferencia las dos acciones y conserva el límite de movimiento por línea. | Media | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L211) |
| P21 | Estructura · nombre accesible de la lista | <code>Estructura de la canción</code> | Estructura del tema | Completa la decisión de usar tema también en las etiquetas accesibles. | Baja | [src/components/tabs/Estructura.jsx](../src/components/tabs/Estructura.jsx#L48) |

### 4. Pizarra

| ID | Ubicación | Texto actual | Propuesta | Motivo | Prioridad | Archivo o componente |
|---|---|---|---|---|---|---|
| P22 | Barra de Pizarra · abrir | <code>Abrir pizarras</code> | Abrir pizarra | El control abre una pizarra por vez; coincide con Guardar pizarra. | Baja | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L74) |
| P23 | Barra de Pizarra · importar desde Repertorio | <code>REPERTORIO</code> | CARGAR TEMA | Evita que parezca una navegación al Repertorio: el botón abre un selector para cargar música. | Media | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L79) |
| P24 | Herramienta del círculo | <code>Círculo de 5tas</code> | Círculo de quintas | Unifica el nombre visible con la etiqueta accesible existente, sin alterar la notación musical. | Baja | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L84)<br>[src/components/CirculoQuintasModal.jsx](../src/components/CirculoQuintasModal.jsx#L37) |
| P25 | Cargar desde Repertorio · espera | <code>Cargando información musical…</code> | Cargando acordes y escalas… | Nombra concretamente lo que se está cargando. | Media | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L93) |
| P26 | Cargar desde Repertorio · reemplazo | <code>La Pizarra contiene elementos. Cargar este tema reemplazará el contenido actual.</code> | Cargar este tema reemplaza lo que hay en la pizarra. | Elimina la primera frase redundante y conserva la advertencia de reemplazo. | Alta | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L101) |
| P27 | Confirmar reemplazo de la pizarra | <code>Cargar</code> | REEMPLAZAR PIZARRA | En el paso de confirmación, nombra la consecuencia. El botón inicial CARGAR EN PIZARRA se conserva. | Alta | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L105) |
| P28 | Cargar desde Repertorio · referencia incompatible | <code>La referencia de tonalidad o escala no es compatible con el diapasón. Cargá un diagrama de escala en el tema para importarlo.</code> | No se puede cargar esa referencia de escala. Agregá un diagrama en la pestaña ESCALA del tema y volvé a intentar. | Indica dónde resolverlo y evita la explicación interna del diapasón; no cambia datos musicales. | Media | [src/lib/musicaRepertorio.js](../src/lib/musicaRepertorio.js#L15) |

### 5. Generador de acordes y escalas

| ID | Ubicación | Texto actual | Propuesta | Motivo | Prioridad | Archivo o componente |
|---|---|---|---|---|---|---|
| P29 | Editor de acordes · campo de nombre | <code>Nombre o nota</code> | Nombre del acorde | Evita confundir el nombre del acorde con una anotación o una nota individual. | Media | [src/components/EditorAcordeModal.jsx](../src/components/EditorAcordeModal.jsx#L56) |
| P30 | Editor de escalas · selector | <code>Escala / Modo</code> | Escala o modo | Usa una relación explícita entre las dos opciones; no cambia nombres de escalas. | Baja | [src/components/EditorEscalaModal.jsx](../src/components/EditorEscalaModal.jsx#L65) |
| P31 | Editor de escalas · rótulo del gráfico | <code>Vista previa</code> | Eliminar este rótulo secundario. | El nombre de la escala y el gráfico ya identifican la vista; no aporta otra instrucción. | Baja | [src/components/EditorEscalaModal.jsx](../src/components/EditorEscalaModal.jsx#L93) |
| P32 | Generador · búsqueda no reconocida | <code>Acorde no reconocido</code> | No se reconoce ese acorde. Revisá el nombre. | Agrega una orientación breve para corregir la entrada. | Media | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L226) |
| P33 | Generador · sin resultados en la zona | <code>Sin formas tocables en esta zona</code> | No hay digitaciones para esta zona. | Usa la misma palabra que el selector de variantes y evita la expresión poco natural formas tocables. | Media | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L227) |
| P34 | Generador · sin resultados con filtros | <code>Sin posiciones para estos filtros</code> | No hay digitaciones con estos filtros. | Unifica el estado vacío con el de zona. | Media | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L227) |
| P35 | Generador · leyenda de tónica opcional | <code>Círculo sin relleno: tónica opcional para completar el acorde.</code> | Círculo sin relleno: tónica opcional. | Conserva el significado del símbolo y elimina el cierre redundante. | Baja | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L228) |
| P36 | Generador · grados omitidos | <code>Grados omitidos para esta digitación:</code> | Grados omitidos: | La digitación ya está visible; se conserva íntegra la lista musical que viene después. | Baja | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L229) |
| P37 | Generador · incorporar la propuesta | <code>ELEGIR</code> | AGREGAR | El botón agrega y guarda una tarjeta; no sólo selecciona una variante. | Media | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L240) |
| P38 | Escala · control de acordes destacados | <code>Agregar acorde a la escala</code> | Agregar acorde para destacar | No sugiere que el control modifica la escala o sus notas; agrega una opción de resaltado. | Media | [src/components/SelectorAcordeEscala.jsx](../src/components/SelectorAcordeEscala.jsx#L65) |

### 6. Bloques musicales

| ID | Ubicación | Texto actual | Propuesta | Motivo | Prioridad | Archivo o componente |
|---|---|---|---|---|---|---|
| P39 | Repertorio · devolver tarjeta al sector libre | <code>Soltá aquí para devolver un acorde al sector suelto.</code> | Soltá el acorde acá para dejarlo suelto. | Acorta y usa acá, como otros mensajes de la aplicación. | Baja | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L87) |
| P40 | Repertorio · bloque vacío | <code>Arrastrá acordes aquí o usá su control de movimiento.</code> | Arrastrá un acorde acá o tocá su ícono de movimiento. | Hace más concreta la alternativa táctil sin agregar controles. | Media | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L87) |
| P41 | Repertorio · diálogo Mover acorde | <code>También podés arrastrar desde el control de movimiento.</code> | Eliminar esta aclaración secundaria. | Dentro del diálogo ya se eligen destino y posición; repetir otra forma de mover distrae. | Baja | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L156) |
| P42 | Repertorio · vaciar bloque | <code>¿Vaciar el bloque? Sus acordes volverán al sector suelto y se conservarán en la canción.</code> | Título: ¿VACIAR BLOQUE? Texto secundario: Los acordes no se borran: vuelven a quedar sueltos. | Tiene el mismo problema de explicación dentro del título que el modal corregido. Queda pendiente de aprobación. | Alta | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L239) |
| P43 | Pizarra · vaciar bloque | <code>¿Quitar todos los acordes de este bloque?</code> | Título: ¿VACIAR BLOQUE? Texto secundario: Se borran los cifrados y digitaciones guardados dentro del bloque. | Explica el alcance propio de Pizarra; no promete recuperar entradas que sólo existen dentro del bloque. | Alta | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L123) |
| P44 | Pizarra · eliminar bloque | <code>¿Eliminar este bloque de la Pizarra?</code> | Título: ¿ELIMINAR BLOQUE? Texto secundario: Se borra el bloque con su contenido. Las tarjetas sueltas se conservan. | Distingue este comportamiento del bloque de Repertorio, que devuelve sus tarjetas al sector suelto. | Alta | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L123) |
| P45 | Configurar bloque · cantidad personalizada | <code>Cantidad personalizada (0 = libre)</code> | Compases (0 = libre) | Reemplaza una referencia genérica a la cantidad por el dato que se edita. | Baja | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L37) |
| P46 | Configurar bloque · reducir compases | <code>Los acordes de los compases que se quiten pasarán al último compás, en el mismo orden.</code> | Los acordes de los compases que quites pasan al último, en el mismo orden. | Usa voseo y una frase más directa sin perder la advertencia de reubicación. | Media | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L42) |
| P47 | Pizarra · digitación conservada en bloque | <code>La digitación está guardada en el bloque. Su acorde original ya no está en la Pizarra.</code> | Esta digitación sigue en el bloque, aunque el acorde original ya no esté en la pizarra. | Conecta las dos ideas y aclara por qué todavía se puede ver el diagrama. | Media | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L68) |
| P48 | Pizarra · acorde escrito sin diagrama | <code>Sin digitación asociada.</code> | Este acorde no tiene diagrama. | Evita la palabra asociada, que describe la relación técnica. | Media | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L72) |

### 7. Setlists

| ID | Ubicación | Texto actual | Propuesta | Motivo | Prioridad | Archivo o componente |
|---|---|---|---|---|---|---|
| P49 | Setlist · acción de incorporar temas | <code>AGREGAR CANCIONES</code> | AGREGAR TEMAS | Unifica la unidad musical con Repertorio y el contador del propio setlist. | Media | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L93) |
| P50 | Selector de Setlists · título | <code>Agregar canciones</code> | Agregar temas | Acompaña la misma decisión terminológica. | Media | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L31) |
| P51 | Selector de Setlists · búsqueda accesible | <code>Buscar canciones</code> | Buscar temas | Mantiene el mismo nombre en la interfaz visible y la accesible. | Baja | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L36) |
| P52 | Setlist · estado vacío | <code>Este setlist todavía no tiene canciones.</code> | Este setlist todavía no tiene temas. | Evita alternar canciones y temas en una misma pantalla. | Baja | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L105) |
| P53 | Selector de Setlists · confirmación accesible | <code>${t.nombre} agregada al final del setlist.</code> | Se agregó “${t.nombre}” al final del setlist. | La construcción no depende del género del nombre del tema. | Media | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L49) |
| P54 | Eliminar setlist | <code>¿Eliminar “${eliminar.title}”? Las canciones seguirán en Repertorio.</code> | Título: ¿ELIMINAR SETLIST? Texto secundario: “${eliminar.title}” se borrará. Los temas siguen en el repertorio. | Separa la pregunta de la aclaración y conserva la garantía sobre los temas. | Alta | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L64) |
| P55 | Selector de Setlists · cerrar | <code>Cerrar selector de canciones</code> | Cerrar selector de temas | Mantiene el mismo vocabulario que el título propuesto del selector. | Baja | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L32) |
| P56 | Setlist · nombre accesible de la lista | <code>Canciones del setlist</code> | Temas del setlist | Unifica el nombre accesible con los contadores y las acciones. | Baja | [src/components/CancionesSetlist.jsx](../src/components/CancionesSetlist.jsx#L61) |
| P57 | Setlist · anuncio accesible de arrastre | <code>Moviendo canción ${items.findIndex(item =&gt; item.id === active.id) + 1}.</code> | Moviendo tema ${items.findIndex(item => item.id === active.id) + 1}. | Aplica la misma terminología al anuncio de movimiento. | Baja | [src/components/CancionesSetlist.jsx](../src/components/CancionesSetlist.jsx#L54) |
| P58 | Selector de Setlists · error de Repertorio | <code>No se pudo cargar Repertorio.</code> | No se pudo cargar el repertorio. | Coincide con el mensaje equivalente del selector de Pizarra. | Baja | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L43) |

### 8. Guardado y recuperación

| ID | Ubicación | Texto actual | Propuesta | Motivo | Prioridad | Archivo o componente |
|---|---|---|---|---|---|---|
| P59 | Pizarra · decidir sobre cambios pendientes | <code>Hay modificaciones en la pizarra actual. Elegí qué hacer antes de continuar.</code> | Elegí si querés guardar los cambios o descartarlos. | El título Cambios sin guardar ya explica la situación; el cuerpo orienta la decisión. | Media | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L71) |
| P60 | Pizarra · guardar antes de continuar | <code>Guardar los cambios</code> | Guardar cambios | Unifica la acción con la opción equivalente del mismo modal. | Baja | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L77) |
| P61 | Pizarra · retomar después de guardar | <code>Reintentar continuar</code> | Continuar | Evita una combinación de verbos poco natural; el error previo ya explica el reintento. | Media | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L84) |
| P62 | Biblioteca de pizarras · conflicto | <code>El proyecto cambió o fue eliminado en otra sesión. Abrí la versión actual o guardá tu trabajo como nueva pizarra.</code> | Esta pizarra cambió o se eliminó en otra sesión. Abrí la versión actual o guardá tu trabajo como una pizarra nueva. | Usa pizarra, como el resto de la interfaz, y mantiene ambas salidas seguras. | Alta | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L38) |
| P63 | Biblioteca de pizarras · instalación pendiente | <code>Falta instalar la biblioteca de pizarras en Supabase.</code> | La biblioteca de pizarras no está disponible. Falta completar su configuración. | Evita el nombre del proveedor en la pantalla de uso. La instrucción técnica sigue en docs/pizarra.md. | Media | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L39) |
| P64 | Biblioteca de pizarras · operación sin confirmar | <code>No se pudo confirmar el proyecto en Supabase.</code> | No se pudo confirmar la operación con la pizarra. Intentá de nuevo. | Sirve para lectura y escritura, sin atribuir falsamente el error al guardado; evita proveedor y proyecto. | Media | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L52) |
| P65 | Pizarra · no se puede recuperar el borrador | <code>No se pudo leer la pizarra guardada en este dispositivo.</code> | No se pudo abrir el borrador guardado en este dispositivo. | Distingue la recuperación local de abrir una pizarra de la biblioteca. | Media | [src/hooks/usePizarra.js](../src/hooks/usePizarra.js#L16) |
| P66 | Pizarra · no se puede guardar localmente | <code>No se pudo guardar la pizarra en este dispositivo. Revisá el almacenamiento e intentá de nuevo.</code> | No se pudo guardar el borrador en este dispositivo. Revisá el espacio disponible y los permisos del navegador. | Identifica qué guardado falló y vuelve concreta la revisión del almacenamiento. | Media | [src/hooks/usePizarra.js](../src/hooks/usePizarra.js#L36) |
| P67 | Setlists · edición en otra sesión | <code>Este setlist cambió en otra sesión. Recargá para ver la versión actual antes de volver a editar.</code> | Este setlist cambió en otra sesión. Recargalo antes de seguir editando. | Acorta sin quitar la condición que evita sobrescribir cambios. | Alta | [src/lib/setlists.js](../src/lib/setlists.js#L7) |
| P68 | Setlists · tema eliminado del Repertorio | <code>Una canción ya no está en Repertorio. Recargá el setlist para actualizar sus referencias.</code> | Un tema ya no está en el repertorio. Recargá el setlist para actualizarlo. | Quita referencias como término técnico y unifica tema. | Media | [src/lib/setlists.js](../src/lib/setlists.js#L11) |
| P69 | Setlists · instalación pendiente | <code>Falta instalar Setlists en la base de datos. Ejecutá el SQL indicado en docs/setlists.md.</code> | Setlists no está disponible. Falta completar su configuración. | Separa el uso de la aplicación de las instrucciones de instalación, que deben seguir disponibles en docs/setlists.md. | Media | [src/lib/setlists.js](../src/lib/setlists.js#L9) |
| P70 | Setlists · error general | <code>No se pudo completar la operación. Revisá la conexión y volvé a intentar.</code> | No se pudo completar la operación. Revisá la conexión e intentá de nuevo. | Unifica el mismo mensaje con Pizarra sin alterar su significado. | Baja | [src/lib/setlists.js](../src/lib/setlists.js#L12) |

### 9. Exportación a PDF

| ID | Ubicación | Texto actual | Propuesta | Motivo | Prioridad | Archivo o componente |
|---|---|---|---|---|---|---|
| P71 | PDF · paso de impresión | <code>En la vista de impresión podés imprimir o guardar como PDF.</code> | Después elegí Imprimir o Guardar como PDF. | Evita repetir impresión/imprimir y conserva la explicación de que hay un paso adicional. | Media | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L83) |
| P72 | PDF · falla parcial al cargar escalas | <code>No se pudo preparar la escala. Las demás secciones siguen disponibles.</code> | No se pudo cargar la escala. Podés exportar las demás secciones. | Aclara que todavía se puede continuar con otros contenidos. | Media | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L34) |
| P73 | PDF de Setlist · falla de carga | <code>No se pudo cargar el listado completo de canciones.</code> | No se pudieron cargar todos los temas del setlist. | Conserva la idea de lista incompleta y explicita el contexto. | Media | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L34) |
| P74 | PDF de Setlist · lista vacía | <code>Sin canciones.</code> | Sin temas. | Mantiene la terminología de la pantalla de Setlists. | Baja | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L88) |
| P75 | PDF de Setlist · carga | <code>Cargando canciones…</code> | Cargando temas… | Mantiene el vocabulario del setlist durante la preparación del PDF. | Baja | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L78) |
| P76 | PDF de Setlist · cantidad de temas | <code>${items.length} ${items.length === 1 ? 'canción' : 'canciones'}</code> | ${items.length} ${items.length === 1 ? 'tema' : 'temas'} | Alinea el contador impreso con el de la pantalla, manteniendo número y concordancia. | Baja | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L87) |

### 10. Confirmaciones, advertencias y mensajes generales

| ID | Ubicación | Texto actual | Propuesta | Motivo | Prioridad | Archivo o componente |
|---|---|---|---|---|---|---|
| P77 | Confirmación compartida · título por defecto | <code>Confirmar eliminación</code> | ¿ELIMINAR? | Una pregunta corta es más directa; cuando se conoce el objeto, priorizar los títulos específicos propuestos. | Baja | [src/components/ConfirmarEliminacionModal.jsx](../src/components/ConfirmarEliminacionModal.jsx#L52) |
| P78 | Confirmaciones de vaciado | <code>ELIMINAR</code> | VACIAR, sólo cuando se confirma Vaciar bloque o Vaciar pizarra. Conservar ELIMINAR en las eliminaciones. | El botón actual no distingue quitar un contenedor de vaciarlo. Requiere una etiqueta contextual, sin cambiar el callback. | Alta | [src/components/ConfirmarEliminacionModal.jsx](../src/components/ConfirmarEliminacionModal.jsx#L57)<br>[src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx) (uso)<br>[src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx) (uso)<br>[src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx) (uso) |
| P79 | Pizarra · eliminar acorde o escala | <code>¿Eliminar ${nombreElemento(confirmacion.elemento)} de la pizarra?</code> | Título fijo: ¿ELIMINAR ACORDE? o ¿ELIMINAR ESCALA? Nombre musical debajo, sin transformar sus mayúsculas/minúsculas. | El nombre se inserta dentro de .modal-titulo y puede mostrar Gm como GM. Separarlo evita alterar visualmente la notación. | Alta | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L139) |
| P80 | Confirmación compartida · error | <code>No se pudo eliminar. Intentá de nuevo.</code> | No se pudo completar la acción. Intentá de nuevo. | También se usa al vaciar; el error no debe decir que se estaba eliminando un contenedor. | Media | [src/components/ConfirmarEliminacionModal.jsx](../src/components/ConfirmarEliminacionModal.jsx#L54) |

## Hallazgos de mayúsculas y diferencias entre componentes

- La regla [src/index.css](../src/index.css#L530) limita `text-transform: uppercase` a `.modal-titulo`; no transforma por sí sola todo el cuerpo de los modales. El problema corregido era colocar la explicación dentro del título. El mismo patrón sigue en Vaciar bloque del Repertorio: está propuesto, no aplicado.
- La confirmación de Pizarra interpola el nombre de una tarjeta dentro de ese mismo título. Por eso puede representar Gm como GM. La propuesta es separar la pregunta fija del nombre musical, sin cambiar el acorde guardado ni su notación.
- `DialogoPizarra` ya ofrece `tituloMusical` y aplica `normal-case`: protege el nombre en `ModalAcordeBloque` y en el diálogo Mover acorde. Conviene conservar esa excepción, no imponer mayúsculas a todos los títulos sin revisar su contenido.
- En `ModalSetlist`, las etiquetas de los campos tienen `uppercase`, pero sus inputs usan `normal-case`. En `NuevoTemaModal`, las etiquetas y los inputs son elementos separados. No se detectó allí el mismo problema de transformar el contenido ingresado.
- Conviven Guardar los cambios y Guardar cambios; proyecto, pizarra y borrador; tema y canción; Sin coincidencias y No hay resultados. Las tablas proponen unificar sólo cuando significan lo mismo.
- Pizarra y Repertorio **no conservan el contenido de sus bloques de la misma manera**. Repertorio guarda referencias a tarjetas del tema; vaciar o eliminar el contenedor las deja sueltas. Pizarra guarda entradas y digitaciones propias dentro del bloque. No trasladar a Pizarra la promesa «Los acordes no se borran» sin distinguir ambos modelos.
- No conviene unificar a ciegas Guardando… con GUARDANDO… ni Cancelar con CANCELAR: las familias de botones ya tienen estilos diferentes que esta tarea debe respetar.

## Textos que conviene conservar

No se propone cambiar por cambiar. Son claros y adecuados: `PIN incorrecto`, `Cargando…`, `Guardando…`, `Pizarra vacía.`, `Guardar como nueva`, `Descartar cambios y continuar`, `Los cambios se guardan automáticamente.` en Setlists y `Entrar` en el acceso.

También se conserva «Todavía no hay nada acá. Reservado para Diego.»: es un texto fijo de la interfaz, no una nota recuperada de una canción. Su tono tiene sentido en una aplicación personal para este grupo. No hace falta reemplazarlo por un mensaje genérico.

Tap Tempo es una denominación habitual de la herramienta musical; no se recomienda traducirla por obligación. Se preservan los nombres y valores de acordes, modos, escalas, digitaciones y símbolos musicales. La advertencia de ventanas emergentes de PDF es útil para resolver un bloqueo real; no se propone quitarla.

## Validación y límites

- Verificación del modal con el componente real y datos sintéticos locales: título en mayúsculas; explicación en escritura normal, 14 px frente a 18 px del título; color `#a39c8a` y margen superior de 12 px. La descripción queda asociada mediante `aria-describedby`.
- Cancelar conservó 1 bloque y 1 acorde. Confirmar dejó 0 bloques y 1 acorde suelto, conservando Gm. Los botones CANCELAR y ELIMINAR mantienen sus textos y comportamiento.
- `npm run lint` y `npm run build` completados correctamente. Las 11 pruebas existentes de `src/lib/bloquesRepertorio.test.js` pasaron, incluidas las de vaciado y eliminación sin pérdida de acordes.
- Se verificaron las diez secciones, las 80 filas de propuestas, las 404 entradas del inventario y sus referencias a archivos y líneas. Las tablas mantienen una cantidad uniforme de columnas y el inventario queda en un apartado desplegable.
- Todas las citas de las 80 propuestas se contrastaron con el código fuente. No se usaron textos inventados ni ejemplos tomados como si ya existieran en la aplicación.
- La auditoría es estática: cubre los textos que define YDALE, incluidos errores y alternativas de estado. No certifica mensajes arbitrarios que pudiera devolver un servicio externo ni contenido ingresado por usuarios.
- La única modificación de producto está en los dos componentes del modal indicados arriba. Las tablas y el inventario son documentación para aprobación posterior.

## Inventario de textos revisados

Se incluye para que el recuento sea verificable. Es un inventario de frases, fragmentos y plantillas únicos, no una lista adicional de cambios. La referencia muestra una ubicación comprobada por texto; otras apariciones pueden estar enumeradas en las propuestas. Los valores dinámicos permanecen como expresiones, sin datos del usuario.

<details>
<summary>Ver los 404 textos o plantillas inventariados</summary>

| N.º | Texto actual en el código | Referencia |
|---|---|---|
| 1 | <code>Diagrama de ${acorde.nombre &#124;&#124; 'acorde'}</code> | [src/components/AcordeDiagrama.jsx](../src/components/AcordeDiagrama.jsx#L99) |
| 2 | <code>Número del traste</code> | [src/components/AcordeDiagrama.jsx](../src/components/AcordeDiagrama.jsx#L105) |
| 3 | <code>Número del traste ${indice + 1}</code> | [src/components/AcordeDiagrama.jsx](../src/components/AcordeDiagrama.jsx#L114) |
| 4 | <code>Cuerda ${cuerda + 1}, al aire: ${marcador.estado}${tonicaAbierta ? ', tónica' : ''}${opcionalAbierta ? ', opcional' : ''}</code> | [src/components/AcordeDiagrama.jsx](../src/components/AcordeDiagrama.jsx#L143) |
| 5 | <code>Nota al aire opcional</code> | [src/components/AcordeDiagrama.jsx](../src/components/AcordeDiagrama.jsx#L149) |
| 6 | <code>Cuerda ${cuerda + 1}, traste ${numero &#124;&#124; `sin definir (${traste + 1})`}: ${estado}${esTonica ? ', tónica' : ''}${esBajo ? ', bajo' : ''}${esOpcional ? ', opcional' : ''}</code> | [src/components/AcordeDiagrama.jsx](../src/components/AcordeDiagrama.jsx#L175) |
| 7 | <code>Nota ${nota &#124;&#124; ''} opcional</code> | [src/components/AcordeDiagrama.jsx](../src/components/AcordeDiagrama.jsx#L181) |
| 8 | <code>Soltá aquí para devolver un acorde al sector suelto.</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L87) |
| 9 | <code>Arrastrá acordes aquí o usá su control de movimiento.</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L87) |
| 10 | <code>${partes.length} ${partes.length === 1 ? 'compás' : 'compases'} ·</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L115) |
| 11 | <code>Mover bloque ${nombre}</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L119) |
| 12 | <code>Arrastrar bloque</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L119) |
| 13 | <code>Mover ${acorde.nombre &#124;&#124; 'acorde'}</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L151) |
| 14 | <code>También podés arrastrar desde el control de movimiento.</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L156) |
| 15 | <code>Destino</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L157) |
| 16 | <code>Acordes sueltos</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L159) |
| 17 | <code>Bloque ${i + 1}</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L160) |
| 18 | <code>Compás</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L165) |
| 19 | <code>Posición</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L168) |
| 20 | <code>Al final</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L170) |
| 21 | <code>Antes de</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L171) |
| 22 | <code>Mover acorde</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L177) |
| 23 | <code>Presioná espacio para arrastrar, flechas para elegir destino, espacio para soltar y Escape para cancelar. También podés activar Mover para elegir destino en un diálogo.</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L206) |
| 24 | <code>Movimiento terminado.</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L210) |
| 25 | <code>Bloques de acordes</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L213) |
| 26 | <code>ACORDES SUELTOS</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L221) |
| 27 | <code>Todavía no hay diagramas cargados.</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L225) |
| 28 | <code>¿Eliminar bloque?</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L238) |
| 29 | <code>Los acordes no se borran: vuelven a quedar sueltos.</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L239) |
| 30 | <code>¿Vaciar el bloque? Sus acordes volverán al sector suelto y se conservarán en la canción.</code> | [src/components/AcordesRepertorio.jsx](../src/components/AcordesRepertorio.jsx#L239) |
| 31 | <code>Agregar canciones</code> | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L31) |
| 32 | <code>Cerrar selector de canciones</code> | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L32) |
| 33 | <code>Buscar canciones</code> | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L36) |
| 34 | <code>tema en el setlist</code> | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L38) |
| 35 | <code>temas en el setlist</code> | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L38) |
| 36 | <code>No se pudo cargar Repertorio.</code> | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L43) |
| 37 | <code>Todavía no hay temas en Repertorio.</code> | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L44) |
| 38 | <code>Agregar ${t.nombre}</code> | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L48) |
| 39 | <code>${t.nombre} agregada al final del setlist.</code> | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L49) |
| 40 | <code>LISTO</code> | [src/components/AgregarCancionesSetlist.jsx](../src/components/AgregarCancionesSetlist.jsx#L54) |
| 41 | <code>Pizarras guardadas</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L73) |
| 42 | <code>Buscar pizarra por título</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L76) |
| 43 | <code>Buscar pizarra…</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L76) |
| 44 | <code>Actualizar lista</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L80) |
| 45 | <code>Abriendo pizarra…</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L82) |
| 46 | <code>Cargando pizarras…</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L82) |
| 47 | <code>Todavía no hay pizarras guardadas.</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L83) |
| 48 | <code>Biblioteca de pizarras</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L84) |
| 49 | <code>Modificada el</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L90) |
| 50 | <code>Renombrar</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L93) |
| 51 | <code>¿Eliminar «${accion.proyecto.titulo}» de la biblioteca?</code> | [src/components/BibliotecaPizarrasModal.jsx](../src/components/BibliotecaPizarrasModal.jsx#L101) |
| 52 | <code>Agregar acorde al compás ${numero}</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L43) |
| 53 | <code>Agregar acorde al bloque libre</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L43) |
| 54 | <code>Agregar compás</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L79) |
| 55 | <code>Mover arriba</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L82) |
| 56 | <code>Mover abajo</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L83) |
| 57 | <code>Mover a la ${otraColumna}</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L84) |
| 58 | <code>Vaciar bloque</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L85) |
| 59 | <code>Eliminar bloque</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L86) |
| 60 | <code>${compases.length} ${compases.length === 1 ? 'compás' : 'compases'}</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L94) |
| 61 | <code>${bloque.repeticiones} repeticiones</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L95) |
| 62 | <code>¿Quitar todos los acordes de este bloque?</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L123) |
| 63 | <code>¿Eliminar este bloque de la Pizarra?</code> | [src/components/BloqueMusical.jsx](../src/components/BloqueMusical.jsx#L123) |
| 64 | <code>Quitar del setlist</code> | [src/components/CancionesSetlist.jsx](../src/components/CancionesSetlist.jsx#L25) |
| 65 | <code>Mover al principio</code> | [src/components/CancionesSetlist.jsx](../src/components/CancionesSetlist.jsx#L26) |
| 66 | <code>Mover al final</code> | [src/components/CancionesSetlist.jsx](../src/components/CancionesSetlist.jsx#L27) |
| 67 | <code>Moviendo canción ${items.findIndex(item =&gt; item.id === active.id) + 1}.</code> | [src/components/CancionesSetlist.jsx](../src/components/CancionesSetlist.jsx#L54) |
| 68 | <code>Posición ${items.findIndex(item =&gt; item.id === over.id) + 1}.</code> | [src/components/CancionesSetlist.jsx](../src/components/CancionesSetlist.jsx#L55) |
| 69 | <code>Nueva posición ${items.findIndex(item =&gt; item.id === over.id) + 1}.</code> | [src/components/CancionesSetlist.jsx](../src/components/CancionesSetlist.jsx#L56) |
| 70 | <code>Canciones del setlist</code> | [src/components/CancionesSetlist.jsx](../src/components/CancionesSetlist.jsx#L61) |
| 71 | <code>Tonalidades mayores en el anillo exterior y menores en el interior</code> | [src/components/CirculoQuintas.jsx](../src/components/CirculoQuintas.jsx#L17) |
| 72 | <code>Relativa:</code> | [src/components/CirculoQuintas.jsx](../src/components/CirculoQuintas.jsx#L42) |
| 73 | <code>Acordes diatónicos</code> | [src/components/CirculoQuintas.jsx](../src/components/CirculoQuintas.jsx#L43) |
| 74 | <code>Cerrar círculo de quintas</code> | [src/components/CirculoQuintasModal.jsx](../src/components/CirculoQuintasModal.jsx#L38) |
| 75 | <code>Misma tonalidad · Ver como</code> | [src/components/CirculoQuintasModal.jsx](../src/components/CirculoQuintasModal.jsx#L42) |
| 76 | <code>Confirmar eliminación</code> | [src/components/ConfirmarEliminacionModal.jsx](../src/components/ConfirmarEliminacionModal.jsx#L52) |
| 77 | <code>No se pudo eliminar. Intentá de nuevo.</code> | [src/components/ConfirmarEliminacionModal.jsx](../src/components/ConfirmarEliminacionModal.jsx#L54) |
| 78 | <code>ELIMINAR</code> | [src/components/ConfirmarEliminacionModal.jsx](../src/components/ConfirmarEliminacionModal.jsx#L57) |
| 79 | <code>Columna ${columna}</code> | [src/components/ContenidoPizarra.jsx](../src/components/ContenidoPizarra.jsx#L74) |
| 80 | <code>Presioná espacio para arrastrar. Usá las flechas para elegir el destino, espacio para soltar o Escape para cancelar.</code> | [src/components/ContenidoPizarra.jsx](../src/components/ContenidoPizarra.jsx#L121) |
| 81 | <code>Moviendo ${active.data.current.nombre}.</code> | [src/components/ContenidoPizarra.jsx](../src/components/ContenidoPizarra.jsx#L123) |
| 82 | <code>Destino: ${over.data.current.nombre ?? over.data.current.columna}.</code> | [src/components/ContenidoPizarra.jsx](../src/components/ContenidoPizarra.jsx#L124) |
| 83 | <code>Fuera de un destino válido.</code> | [src/components/ContenidoPizarra.jsx](../src/components/ContenidoPizarra.jsx#L124) |
| 84 | <code>Arrastre terminado.</code> | [src/components/ContenidoPizarra.jsx](../src/components/ContenidoPizarra.jsx#L125) |
| 85 | <code>Cerrar diálogo</code> | [src/components/DialogoPizarra.jsx](../src/components/DialogoPizarra.jsx#L26) |
| 86 | <code>Cuerda ${cuerda + 1}, ${marcadorAbierto?.nota ?? notaAlAire} al aire${marcadorAbierto?.esBajo ? ', bajo' : ''}${marcadorAbierto?.esOpcional ? ', opcional' : ''}${ notaAbiertaPertenece ? esTonicaAbierta ? ', tónica' : esNotaBluesAbierta ? ', blue note' : ', seleccionada' : '' }</code> | [src/components/Diapason.jsx](../src/components/Diapason.jsx#L43) |
| 87 | <code>Cuerda ${cuerda + 1}, traste ${traste}, ${marcador?.nota ?? nota}${marcador?.esBajo ? ', bajo' : ''}${marcador?.esOpcional ? ', opcional' : ''}${ pertenece ? esTonica ? ', tónica' : esNotaBlues ? ', blue note' : ', seleccionada' : '' }</code> | [src/components/Diapason.jsx](../src/components/Diapason.jsx#L75) |
| 88 | <code>Editar acorde</code> | [src/components/EditorAcordeModal.jsx](../src/components/EditorAcordeModal.jsx#L42) |
| 89 | <code>Nuevo acorde</code> | [src/components/EditorAcordeModal.jsx](../src/components/EditorAcordeModal.jsx#L42) |
| 90 | <code>Cerrar editor de acorde</code> | [src/components/EditorAcordeModal.jsx](../src/components/EditorAcordeModal.jsx#L47) |
| 91 | <code>Nombre o nota</code> | [src/components/EditorAcordeModal.jsx](../src/components/EditorAcordeModal.jsx#L56) |
| 92 | <code>Diapasón</code> | [src/components/EditorAcordeModal.jsx](../src/components/EditorAcordeModal.jsx#L68) |
| 93 | <code>Marcar tónica</code> | [src/components/EditorAcordeModal.jsx](../src/components/EditorAcordeModal.jsx#L75) |
| 94 | <code>Editar escala</code> | [src/components/EditorEscalaModal.jsx](../src/components/EditorEscalaModal.jsx#L24) |
| 95 | <code>Nueva escala</code> | [src/components/EditorEscalaModal.jsx](../src/components/EditorEscalaModal.jsx#L24) |
| 96 | <code>Cerrar editor de escala</code> | [src/components/EditorEscalaModal.jsx](../src/components/EditorEscalaModal.jsx#L28) |
| 97 | <code>Tónica</code> | [src/components/EditorEscalaModal.jsx](../src/components/EditorEscalaModal.jsx#L37) |
| 98 | <code>Escala / Modo</code> | [src/components/EditorEscalaModal.jsx](../src/components/EditorEscalaModal.jsx#L65) |
| 99 | <code>Vista previa</code> | [src/components/EditorEscalaModal.jsx](../src/components/EditorEscalaModal.jsx#L93) |
| 100 | <code>Cerrar editor de estructura</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L149) |
| 101 | <code>PEGAR LETRA COMPLETA</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L153) |
| 102 | <code>Letra completa</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L155) |
| 103 | <code>Pegá la letra completa. Los párrafos separados por una línea vacía se convertirán en bloques.</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L156) |
| 104 | <code>bloque</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L159) |
| 105 | <code>bloques</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L159) |
| 106 | <code>· Reemplaza los bloques del borrador.</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L159) |
| 107 | <code>SEPARAR EN BLOQUES</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L160) |
| 108 | <code>Pegá la letra o agregá un bloque instrumental.</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L163) |
| 109 | <code>Bloques de la estructura</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L164) |
| 110 | <code>Subir bloque ${indice + 1}</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L169) |
| 111 | <code>Bajar bloque ${indice + 1}</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L170) |
| 112 | <code>Quitar bloque ${indice + 1}</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L171) |
| 113 | <code>Duplicar bloque</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L175) |
| 114 | <code>Copiar acordes desde...</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L180) |
| 115 | <code>Bloque de origen</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L183) |
| 116 | <code>Elegir bloque</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L185) |
| 117 | <code>Reemplaza los acordes de este bloque. Después podés ajustar sus posiciones.</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L189) |
| 118 | <code>Tipo</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L192) |
| 119 | <code>Nombre libre</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L195) |
| 120 | <code>Ej.: VERSO 1</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L196) |
| 121 | <code>Letra del bloque</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L203) |
| 122 | <code>Letra o indicación instrumental</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L204) |
| 123 | <code>Nota del bloque</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L206) |
| 124 | <code>Ej.: Entra batería en la segunda vuelta</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L207) |
| 125 | <code>Tocá la letra para ubicar un acorde. Mantené pulsado un acorde y movelo dentro de su línea.</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L211) |
| 126 | <code>Agregar bloque</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L220) |
| 127 | <code>Guardar estructura</code> | [src/components/EditorEstructuraModal.jsx](../src/components/EditorEstructuraModal.jsx#L227) |
| 128 | <code>Mostrar todas las notas de la escala</code> | [src/components/EscalaDiagrama.jsx](../src/components/EscalaDiagrama.jsx#L33) |
| 129 | <code>Diapasón de la escala ${escala.tonica} ${escala.tipo}</code> | [src/components/EscalaDiagrama.jsx](../src/components/EscalaDiagrama.jsx#L40) |
| 130 | <code>Acordes de la escala</code> | [src/components/EscalaDiagrama.jsx](../src/components/EscalaDiagrama.jsx#L44) |
| 131 | <code>Quitar ${acorde.nombre} de la escala</code> | [src/components/EscalaDiagrama.jsx](../src/components/EscalaDiagrama.jsx#L49) |
| 132 | <code>Generador de acordes</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L145) |
| 133 | <code>Cerrar generador de acordes</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L146) |
| 134 | <code>ACORDE</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L151) |
| 135 | <code>Buscar acorde</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L158) |
| 136 | <code>ACORDE COMPLETO</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L205) |
| 137 | <code>BAJO</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L206) |
| 138 | <code>CUERDAS</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L208) |
| 139 | <code>ZONA</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L211) |
| 140 | <code>Diapasón de la propuesta</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L215) |
| 141 | <code>Diapasón de ${interpretado.nombre}</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L217) |
| 142 | <code>Diapasón para acordes completos</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L217) |
| 143 | <code>Diapasón para posiciones de tres y cuatro cuerdas</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L217) |
| 144 | <code>Acorde no reconocido</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L226) |
| 145 | <code>Sin formas tocables en esta zona</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L227) |
| 146 | <code>Sin posiciones para estos filtros</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L227) |
| 147 | <code>Círculo sin relleno: tónica opcional para completar el acorde.</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L228) |
| 148 | <code>Grados omitidos para esta digitación:</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L229) |
| 149 | <code>Posición anterior</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L234) |
| 150 | <code>Posición ${propuesta ? posicion + 1 : 0} de ${propuestas.length}</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L235) |
| 151 | <code>Posición siguiente</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L236) |
| 152 | <code>EDITAR</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L239) |
| 153 | <code>GUARDANDO…</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L240) |
| 154 | <code>ELEGIR</code> | [src/components/GeneradorAcordesModal.jsx](../src/components/GeneradorAcordesModal.jsx#L240) |
| 155 | <code>Cambiar acorde ${acorde?.nombre &#124;&#124; 'no disponible'} en la letra</code> | [src/components/LetraConAcordes.jsx](../src/components/LetraConAcordes.jsx#L83) |
| 156 | <code>Mantené pulsado y mové dentro de esta línea</code> | [src/components/LetraConAcordes.jsx](../src/components/LetraConAcordes.jsx#L84) |
| 157 | <code>Ubicar acordes en la letra</code> | [src/components/LetraConAcordes.jsx](../src/components/LetraConAcordes.jsx#L104) |
| 158 | <code>Acordes del tema para la letra</code> | [src/components/LetraConAcordes.jsx](../src/components/LetraConAcordes.jsx#L118) |
| 159 | <code>Elegir acorde</code> | [src/components/LetraConAcordes.jsx](../src/components/LetraConAcordes.jsx#L120) |
| 160 | <code>Cerrar selector de acordes</code> | [src/components/LetraConAcordes.jsx](../src/components/LetraConAcordes.jsx#L121) |
| 161 | <code>Cargá acordes en la pestaña ACORDES de este tema.</code> | [src/components/LetraConAcordes.jsx](../src/components/LetraConAcordes.jsx#L129) |
| 162 | <code>Eliminar acorde</code> | [src/components/LetraConAcordes.jsx](../src/components/LetraConAcordes.jsx#L130) |
| 163 | <code>YDALE / Y daaaale!</code> | [src/components/Logo.jsx](../src/components/Logo.jsx#L6) |
| 164 | <code>Opciones de ${nombre}</code> | [src/components/MenuSetlist.jsx](../src/components/MenuSetlist.jsx#L94) |
| 165 | <code>Agregar acorde</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L18) |
| 166 | <code>Nombre del acorde</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L20) |
| 167 | <code>Agregar</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L26) |
| 168 | <code>Ingresá un cifrado que empiece con una nota de A a G.</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L27) |
| 169 | <code>Acordes de la Pizarra</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L30) |
| 170 | <code>Digitaciones · trastes de 1.ª a 6.ª cuerda</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L60) |
| 171 | <code>Guardada</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L64) |
| 172 | <code>Variante ${digitacion ? indice : indice + 1}</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L64) |
| 173 | <code>La digitación está guardada en el bloque. Su acorde original ya no está en la Pizarra.</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L68) |
| 174 | <code>Bajo en cuerda</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L71) |
| 175 | <code>Sin digitación asociada.</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L72) |
| 176 | <code>Usar esta digitación</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L74) |
| 177 | <code>Mover antes</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L77) |
| 178 | <code>Mover después</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L78) |
| 179 | <code>Quitar del bloque</code> | [src/components/ModalAcordeBloque.jsx](../src/components/ModalAcordeBloque.jsx#L80) |
| 180 | <code>Editar bloque</code> | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L23) |
| 181 | <code>Nuevo bloque</code> | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L23) |
| 182 | <code>Título (opcional)</code> | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L25) |
| 183 | <code>Intro, verso, idea…</code> | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L27) |
| 184 | <code>Cantidad de compases</code> | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L30) |
| 185 | <code>${valor} compases</code> | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L33) |
| 186 | <code>Cantidad personalizada (0 = libre)</code> | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L37) |
| 187 | <code>Los acordes de los compases que se quiten pasarán al último compás, en el mismo orden.</code> | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L42) |
| 188 | <code>Repeticiones</code> | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L44) |
| 189 | <code>Crear bloque</code> | [src/components/ModalBloqueMusical.jsx](../src/components/ModalBloqueMusical.jsx#L52) |
| 190 | <code>No se pudo preparar la escala. Las demás secciones siguen disponibles.</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L34) |
| 191 | <code>No se pudo cargar el listado completo de canciones.</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L34) |
| 192 | <code>No se pudo abrir la vista de impresión.</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L57) |
| 193 | <code>Contenido</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L64) |
| 194 | <code>Formato incompatible</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L68) |
| 195 | <code>No disponible</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L68) |
| 196 | <code>Sin contenido</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L68) |
| 197 | <code>Orientación</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L72) |
| 198 | <code>vertical</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L73) |
| 199 | <code>apaisado</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L73) |
| 200 | <code>A4</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L74) |
| 201 | <code>Cargando canciones…</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L78) |
| 202 | <code>En la vista de impresión podés imprimir o guardar como PDF.</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L83) |
| 203 | <code>Abrir vista de impresión</code> | [src/components/ModalExportarPDF.jsx](../src/components/ModalExportarPDF.jsx#L86) |
| 204 | <code>Cambios sin guardar</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L48) |
| 205 | <code>Pizarra guardada</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L49) |
| 206 | <code>Renombrar pizarra</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L50) |
| 207 | <code>Duplicar pizarra</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L51) |
| 208 | <code>Fecha (opcional)</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L62) |
| 209 | <code>Hay modificaciones en la pizarra actual. Elegí qué hacer antes de continuar.</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L71) |
| 210 | <code>Estás trabajando en «</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L72) |
| 211 | <code>Procesando…</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L74) |
| 212 | <code>Guardar los cambios</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L77) |
| 213 | <code>Descartar cambios y continuar</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L78) |
| 214 | <code>Guardar cambios</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L81) |
| 215 | <code>Guardar como nueva</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L82) |
| 216 | <code>Reintentar continuar</code> | [src/components/ModalProyectoPizarra.jsx](../src/components/ModalProyectoPizarra.jsx#L84) |
| 217 | <code>Duplicar setlist</code> | [src/components/ModalSetlist.jsx](../src/components/ModalSetlist.jsx#L46) |
| 218 | <code>Título</code> | [src/components/ModalSetlist.jsx](../src/components/ModalSetlist.jsx#L47) |
| 219 | <code>Fecha</code> | [src/components/ModalSetlist.jsx](../src/components/ModalSetlist.jsx#L50) |
| 220 | <code>Lugar (opcional)</code> | [src/components/ModalSetlist.jsx](../src/components/ModalSetlist.jsx#L53) |
| 221 | <code>CANCELAR</code> | [src/components/ModalSetlist.jsx](../src/components/ModalSetlist.jsx#L58) |
| 222 | <code>GUARDAR</code> | [src/components/ModalSetlist.jsx](../src/components/ModalSetlist.jsx#L59) |
| 223 | <code>DUPLICAR</code> | [src/components/ModalSetlist.jsx](../src/components/ModalSetlist.jsx#L59) |
| 224 | <code>CREAR</code> | [src/components/ModalSetlist.jsx](../src/components/ModalSetlist.jsx#L59) |
| 225 | <code>No se pudo guardar los cambios. Probá de nuevo.</code> | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L26) |
| 226 | <code>No se pudo crear el tema. Probá de nuevo.</code> | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L42) |
| 227 | <code>Editar tema</code> | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L55) |
| 228 | <code>Nuevo tema</code> | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L55) |
| 229 | <code>Tema</code> | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L58) |
| 230 | <code>Artista</code> | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L68) |
| 231 | <code>Y daaaale! (si es propio)</code> | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L72) |
| 232 | <code>Crear</code> | [src/components/NuevoTemaModal.jsx](../src/components/NuevoTemaModal.jsx#L90) |
| 233 | <code>YDALE</code> | [src/components/PinGate.jsx](../src/components/PinGate.jsx#L23) |
| 234 | <code>PIN</code> | [src/components/PinGate.jsx](../src/components/PinGate.jsx#L33) |
| 235 | <code>PIN incorrecto</code> | [src/components/PinGate.jsx](../src/components/PinGate.jsx#L37) |
| 236 | <code>Entrar</code> | [src/components/PinGate.jsx](../src/components/PinGate.jsx#L42) |
| 237 | <code>Repertorio</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L76) |
| 238 | <code>Cerrar repertorio</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L77) |
| 239 | <code>Buscar tema por nombre</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L82) |
| 240 | <code>Buscar tema…</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L82) |
| 241 | <code>Cargando temas…</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L84) |
| 242 | <code>No se pudo cargar el repertorio.</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L85) |
| 243 | <code>Temas de repertorio</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L87) |
| 244 | <code>Vista previa del tema</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L91) |
| 245 | <code>Cargando información musical…</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L93) |
| 246 | <code>Reintentar</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L94) |
| 247 | <code>Escala:</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L96) |
| 248 | <code>Sin escala cargada</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L96) |
| 249 | <code>Sin nombre</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L97) |
| 250 | <code>Acordes:</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L97) |
| 251 | <code>Sin acordes guardados</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L97) |
| 252 | <code>La Pizarra contiene elementos. Cargar este tema reemplazará el contenido actual.</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L101) |
| 253 | <code>Cargar</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L105) |
| 254 | <code>CARGAR EN PIZARRA</code> | [src/components/RepertorioPizarraModal.jsx](../src/components/RepertorioPizarraModal.jsx#L105) |
| 255 | <code>Todavía no hay nada acá. Tocá el lápiz para cargarlo.</code> | [src/components/SeccionTextoEditable.jsx](../src/components/SeccionTextoEditable.jsx#L11) |
| 256 | <code>Editar ${titulo &#124;&#124; 'sección'}</code> | [src/components/SeccionTextoEditable.jsx](../src/components/SeccionTextoEditable.jsx#L60) |
| 257 | <code>Cancelar</code> | [src/components/SeccionTextoEditable.jsx](../src/components/SeccionTextoEditable.jsx#L69) |
| 258 | <code>Guardar</code> | [src/components/SeccionTextoEditable.jsx](../src/components/SeccionTextoEditable.jsx#L77) |
| 259 | <code>Buscar acorde para destacar</code> | [src/components/SelectorAcordeEscala.jsx](../src/components/SelectorAcordeEscala.jsx#L56) |
| 260 | <code>Agregar acorde a la escala</code> | [src/components/SelectorAcordeEscala.jsx](../src/components/SelectorAcordeEscala.jsx#L65) |
| 261 | <code>Opciones de acordes</code> | [src/components/SelectorAcordeEscala.jsx](../src/components/SelectorAcordeEscala.jsx#L67) |
| 262 | <code>Sin coincidencias</code> | [src/components/SelectorAcordeEscala.jsx](../src/components/SelectorAcordeEscala.jsx#L75) |
| 263 | <code>Agregar escala</code> | [src/components/tabs/Escala.jsx](../src/components/tabs/Escala.jsx#L26) |
| 264 | <code>No se pudieron cargar las escalas. Verificá la conexión y que la migración esté aplicada.</code> | [src/components/tabs/Escala.jsx](../src/components/tabs/Escala.jsx#L32) |
| 265 | <code>Todavía no hay escalas cargadas.</code> | [src/components/tabs/Escala.jsx](../src/components/tabs/Escala.jsx#L45) |
| 266 | <code>¿Eliminar la escala ${escalaAEliminar.tonica} ${etiquetaTipo(escalaAEliminar.tipo)}?</code> | [src/components/tabs/Escala.jsx](../src/components/tabs/Escala.jsx#L50) |
| 267 | <code>La estructura guardada no tiene un formato compatible. Podés reemplazarla desde el editor.</code> | [src/components/tabs/Estructura.jsx](../src/components/tabs/Estructura.jsx#L20) |
| 268 | <code>No se pudo guardar la estructura. Revisá la conexión e intentá de nuevo.</code> | [src/components/tabs/Estructura.jsx](../src/components/tabs/Estructura.jsx#L33) |
| 269 | <code>Referencia musical del tema</code> | [src/components/tabs/Estructura.jsx](../src/components/tabs/Estructura.jsx#L42) |
| 270 | <code>Editar estructura</code> | [src/components/tabs/Estructura.jsx](../src/components/tabs/Estructura.jsx#L43) |
| 271 | <code>Todavía no hay estructura cargada.</code> | [src/components/tabs/Estructura.jsx](../src/components/tabs/Estructura.jsx#L47) |
| 272 | <code>Estructura de la canción</code> | [src/components/tabs/Estructura.jsx](../src/components/tabs/Estructura.jsx#L48) |
| 273 | <code>${bloque.repeticiones} ${bloque.repeticiones === 1 ? 'repetición' : 'repeticiones'}</code> | [src/components/tabs/Estructura.jsx](../src/components/tabs/Estructura.jsx#L53) |
| 274 | <code>Todavía no hay letra cargada. Tocá el lápiz para escribirla.</code> | [src/components/tabs/Letra.jsx](../src/components/tabs/Letra.jsx#L16) |
| 275 | <code>No se pudo guardar la organización de acordes. Revisá la conexión e intentá de nuevo.</code> | [src/components/tabs/Notas.jsx](../src/components/tabs/Notas.jsx#L37) |
| 276 | <code>No se pudo guardar el acorde. Revisá la conexión e intentá de nuevo.</code> | [src/components/tabs/Notas.jsx](../src/components/tabs/Notas.jsx#L38) |
| 277 | <code>Notas</code> | [src/components/tabs/Notas.jsx](../src/components/tabs/Notas.jsx#L103) |
| 278 | <code>Entradas, finales, cambios, lo que vaya surgiendo en el ensayo.</code> | [src/components/tabs/Notas.jsx](../src/components/tabs/Notas.jsx#L106) |
| 279 | <code>¿Eliminar el acorde ${acordeAEliminar.nombre &#124;&#124; 'sin nombre'}?</code> | [src/components/tabs/Notas.jsx](../src/components/tabs/Notas.jsx#L111) |
| 280 | <code>Todavía no hay nada acá. Reservado para Diego.</code> | [src/components/tabs/Percusion.jsx](../src/components/tabs/Percusion.jsx#L23) |
| 281 | <code>Cerrar Tap Tempo</code> | [src/components/TapTempoModal.jsx](../src/components/TapTempoModal.jsx#L55) |
| 282 | <code>BPM:</code> | [src/components/TapTempoModal.jsx](../src/components/TapTempoModal.jsx#L57) |
| 283 | <code>Marcar pulso</code> | [src/components/TapTempoModal.jsx](../src/components/TapTempoModal.jsx#L58) |
| 284 | <code>TAP</code> | [src/components/TapTempoModal.jsx](../src/components/TapTempoModal.jsx#L68) |
| 285 | <code>Reiniciar medición</code> | [src/components/TapTempoModal.jsx](../src/components/TapTempoModal.jsx#L69) |
| 286 | <code>Mover ${nombre}</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L23) |
| 287 | <code>Editar ${nombre}</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L27) |
| 288 | <code>Eliminar ${nombre}</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L28) |
| 289 | <code>No se pudo guardar el orden. Revisá la conexión o el almacenamiento e intentá de nuevo.</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L85) |
| 290 | <code>Para mover, presioná espacio. Usá las flechas para elegir la posición, espacio para soltar y Escape para cancelar.</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L102) |
| 291 | <code>Moviendo ${nombre(active.id)}, posición ${posicion(active.id)} de ${visibles.length}.</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L104) |
| 292 | <code>Fuera de la lista.</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L105) |
| 293 | <code>Posición ${posicion(over.id)} de ${visibles.length}.</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L105) |
| 294 | <code>Movimiento cancelado.</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L106) |
| 295 | <code>Soltado en la posición ${posicion(over.id)}.</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L106) |
| 296 | <code>Movimiento cancelado. Se conserva el orden anterior.</code> | [src/components/TarjetasOrdenables.jsx](../src/components/TarjetasOrdenables.jsx#L107) |
| 297 | <code>Volver al inicio</code> | [src/components/VolverInicio.jsx](../src/components/VolverInicio.jsx#L6) |
| 298 | <code>No se pudo guardar. Revisá la conexión e intentá de nuevo.</code> | [src/hooks/useCampoEditable.js](../src/hooks/useCampoEditable.js#L33) |
| 299 | <code>No se pudo guardar la escala. Revisá la conexión e intentá de nuevo.</code> | [src/hooks/useEscalas.js](../src/hooks/useEscalas.js#L62) |
| 300 | <code>No se pudo leer la pizarra guardada en este dispositivo.</code> | [src/hooks/usePizarra.js](../src/hooks/usePizarra.js#L16) |
| 301 | <code>Se actualizó la biblioteca, pero no se pudo actualizar el borrador local de este dispositivo.</code> | [src/hooks/usePizarra.js](../src/hooks/usePizarra.js#L33) |
| 302 | <code>No se pudo guardar la pizarra en este dispositivo. Revisá el almacenamiento e intentá de nuevo.</code> | [src/hooks/usePizarra.js](../src/hooks/usePizarra.js#L36) |
| 303 | <code>Imprimir / Guardar como PDF</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L70) |
| 304 | <code>El navegador bloqueó la vista de impresión. Permití las ventanas emergentes para YDALE e intentá de nuevo.</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L76) |
| 305 | <code>${items.length} ${items.length === 1 ? 'canción' : 'canciones'}</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L87) |
| 306 | <code>Sin canciones.</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L88) |
| 307 | <code>Acorde destacado:</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L117) |
| 308 | <code>Acorde sin nombre</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L121) |
| 309 | <code>Doble círculo: tónica</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L141) |
| 310 | <code>Círculo discontinuo: nota opcional</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L142) |
| 311 | <code>B: bajo</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L143) |
| 312 | <code>×: cuerda muteada</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L144) |
| 313 | <code>Bloques musicales</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L159) |
| 314 | <code>Acordes</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L160) |
| 315 | <code>Escalas</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L161) |
| 316 | <code>Libre</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L174) |
| 317 | <code>Bloque musical</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L174) |
| 318 | <code>Bloque de acordes</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L195) |
| 319 | <code>Escala</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L202) |
| 320 | <code>Estructura</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L202) |
| 321 | <code>Letra con acordes</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L202) |
| 322 | <code>Percusión</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L203) |
| 323 | <code>Diagramas de acordes</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L203) |
| 324 | <code>Seleccioná al menos una sección con contenido.</code> | [src/lib/impresionPDF.js](../src/lib/impresionPDF.js#L290) |
| 325 | <code>La referencia de tonalidad o escala no es compatible con el diapasón. Cargá un diagrama de escala en el tema para importarlo.</code> | [src/lib/musicaRepertorio.js](../src/lib/musicaRepertorio.js#L15) |
| 326 | <code>No se pudo cargar la información musical del tema. Revisá la conexión e intentá de nuevo.</code> | [src/lib/musicaRepertorio.js](../src/lib/musicaRepertorio.js#L39) |
| 327 | <code>Este tema no tiene escalas ni acordes para cargar.</code> | [src/lib/musicaRepertorio.js](../src/lib/musicaRepertorio.js#L50) |
| 328 | <code>Volver al repertorio</code> | [src/lib/navegacionTema.js](../src/lib/navegacionTema.js#L5) |
| 329 | <code>Volver al setlist</code> | [src/lib/navegacionTema.js](../src/lib/navegacionTema.js#L7) |
| 330 | <code>El proyecto cambió o fue eliminado en otra sesión. Abrí la versión actual o guardá tu trabajo como nueva pizarra.</code> | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L38) |
| 331 | <code>Falta instalar la biblioteca de pizarras en Supabase.</code> | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L39) |
| 332 | <code>La pizarra supera el tamaño admitido o sus datos son inválidos.</code> | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L40) |
| 333 | <code>No se pudo completar la operación. Revisá la conexión e intentá de nuevo.</code> | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L42) |
| 334 | <code>No se pudo confirmar el proyecto en Supabase.</code> | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L52) |
| 335 | <code>La pizarra ya no está en la biblioteca. Actualizá la lista.</code> | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L59) |
| 336 | <code>No se pudo leer la biblioteca de pizarras.</code> | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L83) |
| 337 | <code>No se pudo confirmar la eliminación.</code> | [src/lib/proyectosPizarra.js](../src/lib/proyectosPizarra.js#L99) |
| 338 | <code>Este setlist cambió en otra sesión. Recargá para ver la versión actual antes de volver a editar.</code> | [src/lib/setlists.js](../src/lib/setlists.js#L7) |
| 339 | <code>Falta instalar Setlists en la base de datos. Ejecutá el SQL indicado en docs/setlists.md.</code> | [src/lib/setlists.js](../src/lib/setlists.js#L9) |
| 340 | <code>Una canción ya no está en Repertorio. Recargá el setlist para actualizar sus referencias.</code> | [src/lib/setlists.js](../src/lib/setlists.js#L11) |
| 341 | <code>No se pudo completar la operación. Revisá la conexión y volvé a intentar.</code> | [src/lib/setlists.js](../src/lib/setlists.js#L12) |
| 342 | <code>Definí los números de los trastes de ${acorde.nombre &#124;&#124; 'el acorde sin nombre'} antes de transponer.</code> | [src/lib/transposicion.js](../src/lib/transposicion.js#L35) |
| 343 | <code>Navegación principal</code> | [src/pages/Inicio.jsx](../src/pages/Inicio.jsx#L9) |
| 344 | <code>No se pudo cambiar la pizarra en este dispositivo. Revisá el almacenamiento local.</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L26) |
| 345 | <code>PIZARRA</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L73) |
| 346 | <code>Abrir pizarras</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L74) |
| 347 | <code>Guardar pizarra</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L75) |
| 348 | <code>Funciones de pizarra</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L78) |
| 349 | <code>+ Escala</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L80) |
| 350 | <code>Acorde</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L81) |
| 351 | <code>+ Acorde</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L81) |
| 352 | <code>Bloque</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L82) |
| 353 | <code>+ Bloque</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L82) |
| 354 | <code>Generador</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L83) |
| 355 | <code>Círculo de 5tas</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L84) |
| 356 | <code>Tap Tempo</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L85) |
| 357 | <code>Transposición global</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L88) |
| 358 | <code>Bajar toda la pizarra un semitono</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L90) |
| 359 | <code>Bajar todo un semitono</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L90) |
| 360 | <code>Restablecer transposición a cero: desplazamiento actual ${desplazamiento &gt; 0 ? '+' : ''}${desplazamiento} semitonos</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L94) |
| 361 | <code>Restablecer transposición a 0</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L95) |
| 362 | <code>Subir toda la pizarra un semitono</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L98) |
| 363 | <code>Subir todo un semitono</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L98) |
| 364 | <code>VACIAR PIZARRA</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L103) |
| 365 | <code>· Cambios sin guardar</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L110) |
| 366 | <code>· Guardada</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L110) |
| 367 | <code>Borrador local · Cambios sin guardar</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L110) |
| 368 | <code>Pizarra vacía.</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L115) |
| 369 | <code>¿Vaciar toda la pizarra?</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L139) |
| 370 | <code>¿Eliminar ${nombreElemento(confirmacion.elemento)} de la pizarra?</code> | [src/pages/Pizarra.jsx](../src/pages/Pizarra.jsx#L139) |
| 371 | <code>REPERTORIO</code> | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L54) |
| 372 | <code>Agregar tema</code> | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L55) |
| 373 | <code>Buscar temas</code> | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L61) |
| 374 | <code>Buscar...</code> | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L64) |
| 375 | <code>No hay resultados.</code> | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L73) |
| 376 | <code>Todavía no hay temas cargados.</code> | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L73) |
| 377 | <code>Editar ${t.nombre}</code> | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L93) |
| 378 | <code>Eliminar ${t.nombre}</code> | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L101) |
| 379 | <code>¿Seguro que querés eliminar “${temaAEliminar.nombre}” del repertorio?</code> | [src/pages/Repertorio.jsx](../src/pages/Repertorio.jsx#L115) |
| 380 | <code>No se encontró el setlist.</code> | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L77) |
| 381 | <code>Editar setlist</code> | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L82) |
| 382 | <code>Terminar edición</code> | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L82) |
| 383 | <code>RECARGAR SETLIST</code> | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L91) |
| 384 | <code>AGREGAR CANCIONES</code> | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L93) |
| 385 | <code>Guardando…</code> | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L94) |
| 386 | <code>Los cambios se guardan automáticamente.</code> | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L94) |
| 387 | <code>${items.length} ${items.length === 1 ? 'tema' : 'temas'}</code> | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L94) |
| 388 | <code>Este setlist todavía no tiene canciones.</code> | [src/pages/Setlist.jsx](../src/pages/Setlist.jsx#L105) |
| 389 | <code>SETLISTS</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L36) |
| 390 | <code>Nuevo setlist</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L37) |
| 391 | <code>REINTENTAR</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L41) |
| 392 | <code>tema</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L51) |
| 393 | <code>temas</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L51) |
| 394 | <code>Exportar PDF</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L54) |
| 395 | <code>Editar</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L55) |
| 396 | <code>Duplicar</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L56) |
| 397 | <code>Eliminar</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L57) |
| 398 | <code>Todavía no hay setlists. Creá uno para organizar el próximo show.</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L61) |
| 399 | <code>¿Eliminar “${eliminar.title}”? Las canciones seguirán en Repertorio.</code> | [src/pages/Setlists.jsx](../src/pages/Setlists.jsx#L64) |
| 400 | <code>Letra</code> | [src/pages/Tema.jsx](../src/pages/Tema.jsx#L10) |
| 401 | <code>Cargando…</code> | [src/pages/Tema.jsx](../src/pages/Tema.jsx#L25) |
| 402 | <code>No se encontró el tema.</code> | [src/pages/Tema.jsx](../src/pages/Tema.jsx#L31) |
| 403 | <code>ATRÁS</code> | [src/pages/Tema.jsx](../src/pages/Tema.jsx#L50) |
| 404 | <code>Secciones del tema</code> | [src/pages/Tema.jsx](../src/pages/Tema.jsx#L61) |

</details>
