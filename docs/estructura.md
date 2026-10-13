# Estructura de Repertorio

La pestaña muestra una secuencia compacta de bloques, con nombres en butter,
letra de 12–14 px (menor que LETRA), cantidad de repeticiones y notas discretas.
La referencia musical aparece al comienzo, por ejemplo `Em · Eólico`.
Reutiliza los diagramas de escala existentes y, si no hay diagramas, los campos
`tonalidad` y `escala_nombre` del tema. No guarda una segunda referencia musical.

`EDITAR ESTRUCTURA` abre un modal grande con cabecera y acciones siempre visibles.
Permite pegar la letra completa, separar automáticamente los párrafos en bloques,
editar la letra de cada uno y agregar bloques instrumentales sin letra. Cuando la
estructura está vacía, pegar crea los bloques directamente; también se puede
usar `SEPARAR EN BLOQUES` con el texto precargado desde LETRA. Si ya hay bloques,
ese botón reemplaza sólo el borrador y muestra la advertencia junto al contador.

Los tipos son INTRO, VERSO, PRE-ESTRIBILLO, ESTRIBILLO, RIFF, PUENTE, SOLO, OUTRO
y OTRO. Cada bloque admite un nombre libre, repeticiones enteras positivas de
cualquier cantidad y una nota opcional de hasta 180 caracteres. Se puede subir,
bajar o quitar un bloque mediante botones, sin drag & drop. El importador
respeta los saltos de verso y separa por líneas vacías,
incluso con CRLF, espacios y varios saltos seguidos.

El campo `temas.estructura` existente guarda JSON con `version: 1` y un array
ordenado `bloques`. Cada bloque tiene ID estable, tipo, nombre, letra, repeticiones
y nota. Los bloques con acordes incorporan `anclas: [{id, acordeId, posicion}]`.
El orden explícito, los IDs y la versión permiten ampliar el formato con
nuevos campos o interacciones. No requiere tablas, columnas ni SQL nuevos.
Guardar usa `actualizarTema` y confirma el ID devuelto; sólo envía el campo
`estructura`. No cambia LETRA, notas/acordes, percusión ni datos musicales.

El texto libre histórico se interpreta por párrafos como bloques OTRO y puede
reemplazarse desde el editor. No hay migración ni escrituras al abrir la pestaña.
Un documento incompatible muestra un aviso y admite un borrador nuevo, que sólo
se escribe al pulsar Guardar. Cancelar/Escape descartan el borrador y devuelven
el foco al botón de apertura. Un error de guardado conserva todos los cambios
en el modal para reintentar; durante el envío se bloquean los controles.

## Acordes sobre la letra

Debajo del campo de letra de cada bloque hay una vista interactiva. Un clic o tap
elige una posición de carácter, incluso dentro de una palabra, y abre un selector
pequeño. Sus únicas opciones son los diagramas guardados en ACORDES del mismo tema
(`leerNotas(tema.notas).acordes`). Se guarda exclusivamente su ID y un offset UTF-16
en la letra real. Los nombres se resuelven desde ACORDES cada vez que se renderiza;
no se crean acordes, listas musicales independientes ni espacios de relleno.

Al pulsar un rótulo existente se puede cambiar su acorde o eliminar el anclaje.
La vista interactiva también admite foco y flechas izquierda/derecha para elegir
un carácter, Enter/Espacio para abrir y Escape para cerrar el selector.
Los grafemas (incluidos emoji y tildes combinadas) son unidades de selección.
El clic nativo permite mouse y tap sin registrar dos veces eventos táctiles.

Insertar o borrar antes del anclaje ajusta el índice. Eliminar o reemplazar su
carácter elimina ese anclaje; el resto se mantiene. `beforeinput` y la selección
del textarea desambiguan ediciones en caracteres repetidos; un diff contiguo
resuelve actualizaciones sin selección. La normalización al guardar también
ajusta los índices al retirar espacios exteriores y convertir CRLF.

El render compartido muestra rótulos naranjas encima de la letra pequeña tanto
en el editor como en la vista normal. No altera el ancho de los caracteres. Si
dos rótulos cercanos se solapan, ocupa un segundo carril vertical; las líneas
largas permiten desplazamiento horizontal, conservando los anclajes. Un acorde
eliminado de ACORDES se oculta en la vista normal y aparece como `—` en el editor,
para poder reasignarlo o quitarlo.

## Edición práctica de bloques y acordes

Sólo en el modal, `Duplicar bloque` inserta una copia inmediatamente después del
original. Conserva nombre/tipo, letra, repeticiones, nota y referencias/posiciones
de acordes, pero asigna IDs propios al bloque y a cada anclaje. No comparte objetos
mutables con el original.

`Copiar acordes desde...` permite elegir otro bloque del borrador que tenga acordes.
Reemplaza sólo los anclajes del destino; no cambia su letra ni sus otros campos.
El traslado usa el número de línea y una posición proporcional por grafemas, sin
analizar palabras o sílabas. Con letra idéntica conserva los offsets exactamente.
Si faltan líneas, distribuye las líneas restantes juntas sobre la última línea.
Si el destino es corto o vacío conserva toda la secuencia con anclajes compartidos,
que se muestran en carriles separados y pueden editarse individualmente.

Mantener pulsado un acorde activa su movimiento horizontal. Mouse también admite
arrastre directo; touch/pen espera 350 ms y cancela si el contacto se desplaza antes.
Pointer capture mantiene el gesto aunque el puntero salga del rótulo. El destino
siempre se ajusta al grafema más cercano del verso original; el movimiento vertical
no cambia de línea. En líneas largas el borde del gráfico desplaza horizontalmente
la vista. Al soltar se conserva el ID y se cambia su offset, sin sobrescribir otros
acordes. Pointer cancel, pérdida de captura y cambios de letra/guardado cancelan el
gesto. Un clic/tap corto abre el selector y el click posterior al arrastre se omite.
Las flechas izquierda/derecha sobre un rótulo permiten ajustarlo con teclado.

La vista normal no incorpora botones, selectores ni movimiento. Todo sigue siendo
un borrador hasta guardar; cancelar descarta también las copias y los movimientos.

Archivos: `src/lib/estructura.js`, `src/components/tabs/Estructura.jsx` y
`src/components/EditorEstructuraModal.jsx`. Las pruebas de `estructura.test.js`
cubren párrafos, categorías, nombres, repeticiones, notas, orden, IDs, lectura
histórica, referencias compartidas y el alcance y errores del guardado.
`anclasEstructura.test.js` cubre referencias al origen, cambios de letra,
selecciones repetidas, Unicode, serialización y distribución de rótulos.
`herramientasEstructura.test.js` cubre copias independientes, traslado entre letras
distintas, conservación de secuencias, límites de línea y posiciones compartidas.
`gestoAcorde.test.js` verifica mouse/touch/pen, pulsación sostenida, cancelaciones,
punteros secundarios, ausencia de doble registro y desplazamiento horizontal.
