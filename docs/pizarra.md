# Inicio y Pizarra

## Navegación

- `/`: Inicio con REPERTORIO y PIZARRA, detrás del acceso por PIN existente.
- `/repertorio`: listado y operaciones existentes; ATRÁS vuelve a Inicio.
- `/pizarra`: espacio independiente; ATRÁS vuelve a Inicio.
- `/tema/:id/...`: conserva las direcciones existentes; su flecha vuelve a `/repertorio`.

## Pizarra

`+ Escala` usa el editor y diapasón actuales. `+ Acorde` permite dibujar directamente en el editor manual. `Generador` abre el generador y ELEGIR transfiere la posición al editor manual. Los tres botones comparten el color principal. Las escalas aparecen siempre arriba, en orden de incorporación; los acordes debajo, en filas que se ajustan al ancho disponible. Los diagramas conservan sus componentes y proporciones. Se pueden editar y eliminar individualmente. Las confirmaciones de eliminación y VACIAR PIZARRA muestran la pregunta como título y los botones de cancelar/eliminar.

El contenido se guarda en `localStorage` bajo `ydaaaale_pizarra_v1`. Permanece tras recargar y reabrir la aplicación en el mismo navegador y origen. No se sincroniza entre dispositivos; borrar los datos del navegador también borra la pizarra. Los errores de almacenamiento se muestran sin cerrar el editor ni descartar su borrador. Si no se puede leer el contenido guardado, no se sobrescribe automáticamente.

## Círculo de 5tas

El botón **Círculo de 5tas** abre una herramienta de consulta exclusiva de
Pizarra. El anillo exterior selecciona mayores y el interior sus relativas
menores naturales. La tónica, los grados IV/V (iv/v en menor), los demás acordes
diatónicos y el disminuido tienen distintas jerarquías visuales. El centro
muestra los siete grados y acordes, la relativa y, si hay espacio, la armadura.
F♯/G♭ y D♯m/E♭m permiten alternar su escritura enarmónica desde el pie del modal.

La selección sólo vive en el estado del modal: comienza en C mayor al abrir,
no agrega elementos a la pizarra y no escribe en localStorage ni Supabase.
Se puede cerrar con el botón o Escape; el foco vuelve al botón de apertura.
Los sectores admiten toque, clic, Tab, Enter y espacio. En pantallas bajas y
anchas el encabezado queda al costado para conservar visible el círculo.

La lógica musical está en `src/lib/circuloQuintas.js`, el gráfico en
`src/components/CirculoQuintas.jsx` y el diálogo en
`src/components/CirculoQuintasModal.jsx`. Las pruebas en
`src/lib/circuloQuintas.test.js` cubren las 12 mayores y menores, grados,
relativas, armaduras, grafías enarmónicas y correspondencia de los sectores.

## Transposición global

Los botones **-1** y **+1**, a la derecha de la barra y antes de **VACIAR PIZARRA**, bajan o suben
un semitono todas las escalas y acordes guardados. Actualizan los mismos IDs,
conservan el orden, el tipo de escala/modo y la calidad y bajo del cifrado.
Se guarda toda la operación en localStorage antes de mostrar el cambio.

Entre ambos botones se muestra el desplazamiento acumulado: `-1  0  +1`,
`-1  +3  +1`, etc. Pulsar el valor aplica la transposición inversa necesaria
sobre el contenido actual y vuelve a cero; no restaura una copia ni deshace
ediciones, agregados, eliminaciones u ordenamientos. El contador no se reduce
módulo doce y acompaña a los datos guardados. Las pizarras anteriores empiezan
en cero; vaciar o cargar otro tema establece un nuevo origen. Una edición o
un error de almacenamiento que impida transportar conserva también el contador.

Los diagramas se trasladan en sus cuerdas originales, conservando las voces,
la tónica, el bajo, las notas opcionales y las cuerdas muteadas. Las notas al
aire pasan a pisadas cuando corresponde. Al cruzar la cejuela se usa la octava
equivalente; la posición vuelve al registro inferior al completar la octava.
Los nombres usan grafías habituales (C → Db, D → Eb) y conservan sostenidos
cuando la raíz original los usa. Las escalas admiten también raíces con bemol,
sin perder su grafía al editar o recargar.

En dibujos manuales, las notas pisadas requieren un número de traste válido.
Si falta, aparece un mensaje para corregirlo y no se cambia ningún elemento.
Los títulos libres que no son cifrados se conservan, mientras su dibujo se
transporta. La lógica reutiliza el parser de acordes y las clases de nota
existentes; no genera nuevas posiciones ni agrega copias.

## Tap Tempo

**Tap Tempo** se abre desde Pizarra y desde la pestaña Percusión de un tema.
Ambos accesos usan `src/components/TapTempoModal.jsx`. El botón grande registra
el pulso con pointer events (mouse, dedo o lápiz) y admite Enter/espacio.
Los clics de compatibilidad posteriores al toque no agregan otro golpe.

El estimador en `src/lib/tapTempo.js` conserva todos los intervalos de la sesión,
sin límite de cuatro golpes. Calcula el promedio de intervalos próximos a la
mediana, con tolerancia según su desviación absoluta y un mínimo del 20 %, para
descartar golpes perdidos o dobles claramente anómalos. Muestra BPM a partir de
tres golpes, permite continuar 20–30 golpes o más y termina después de cuatro
segundos sin pulsaciones. El último BPM permanece visible hasta reiniciar o
empezar otra sesión. Reiniciar vacía intervalos y cancela el temporizador.
Cerrar limpia el temporizador y devuelve el foco al acceso correspondiente.

El resultado es de consulta: no modifica la percusión del tema ni sus datos.
Las pruebas de transposición cubren cifrados, modos, diagramas abiertos,
inversiones, notas opcionales, dibujos libres y persistencia; las de Tap Tempo
cubren 30 golpes, fluctuaciones, intervalos anómalos, pausas y reinicio.
El modal muestra únicamente título, BPM, TAP y Reiniciar medición, además del
icono de cierre. El cálculo y la finalización automática mantienen su funcionamiento.

## Acordes dentro del diapasón de escala

Cada `EscalaDiagrama` tiene un buscador propio bajo el gráfico, con el catálogo
y parser existentes del Generador. El campo compacto muestra la lupa y
"Acorde"; el botón + y los chips comparten la misma fila. Cuando falta ancho,
los chips se pueden desplazar horizontalmente sin crear otra fila.
Seleccionar una opción, pulsar Enter o usar
el botón + agrega un chip; se pueden incorporar varios y quitar individualmente.
No se generan digitaciones ni acordes independientes de Pizarra.

Pulsar un chip conserva todas las notas de la escala y reduce al 12 % la opacidad
de las que no pertenecen al acorde. Sólo destaca la intersección entre ambas
colecciones: por ejemplo B7 sobre Em no agrega D#. La tónica, la blue note y las
grafías originales se conservan. Un clic en el gráfico, o Enter/espacio/Escape
con el gráfico enfocado, restaura todas las notas. El chip seleccionado tiene
un borde y fondo diferenciados y expone `aria-pressed`.

La lista y selección son locales a cada instancia del gráfico durante la sesión
visible; no se escriben en localStorage ni Supabase. Los chips acompañan una
transposición de la escala sin afectar otras escalas. Se aplica igualmente en
Pizarra, Escala de Repertorio y la vista previa del editor.

El gráfico se centra con un máximo inicial de **70rem**, ajustable en la variable
`--escala-ancho-maximo` de `.escala-diagrama` en `src/index.css`. En pantallas
pequeñas mantiene el desplazamiento horizontal para no comprimir los trastes.
El contenedor reserva la altura real de las notas y del encabezado, sin scroll
vertical interno; el buscador y los chips quedan fuera del área desplazable.

## Cargar un tema desde Repertorio

El botón diferenciado **REPERTORIO** de la barra abre un modal con los temas
existentes y búsqueda por nombre, sin distinguir mayúsculas o acentos. Elegir
un tema consulta sólo sus campos musicales y diagramas; la vista previa muestra
nombre, escalas y nombres de los acordes. **CARGAR EN PIZARRA** copia todas las
escalas diagramadas y todos los acordes guardados, conservando orden, voces,
trastes, tónica, bajo y notas opcionales.

Si no hay diagramas de escala, se admite la referencia escrita de tonalidad y
modo cuando coincide con las notas y tipos ya soportados por la app. Una
referencia incompatible muestra un error antes de permitir la carga. Un tema
sin escala puede cargar sus acordes, y uno sin acordes puede cargar su escala.
Un tema sin ninguno de esos datos no permite cargar; el texto libre de ACORDES
no se convierte en digitaciones.

Si Pizarra tiene elementos, se muestra exactamente: "La Pizarra contiene
elementos. Cargar este tema reemplazará el contenido actual." Las opciones
**Cancelar** y **Cargar** permiten volver a la vista previa o confirmar.
El reemplazo completo se guarda con una sola escritura en localStorage; nunca
se mezcla con el contenido anterior. Un error de red impide una carga parcial,
y un error de almacenamiento conserva la Pizarra y deja el modal abierto.

Las copias reciben IDs nuevos y sus arrays y referencias no se comparten con
los datos del tema. Sólo se guardan escalas y acordes: no se copia el nombre del
tema como metadato, texto de notas, letra, estructura, percusión ni IDs de origen.
Todas las acciones posteriores afectan exclusivamente a la Pizarra local.
La lectura descarta respuestas de una selección anterior si se elige otro tema.

La interfaz está en `src/components/RepertorioPizarraModal.jsx`, la consulta y
copia en `src/lib/musicaRepertorio.js`, y la persistencia usa `usePizarra`.
`src/lib/musicaRepertorio.test.js` comprueba lecturas GET, copias independientes,
exclusión de datos ajenos, reemplazo, persistencia, referencias y errores.

## Supabase

No requiere cambios en Supabase: ni tablas, columnas, RLS, índices, funciones, triggers, permisos ni Storage. No hay SQL que ejecutar. El selector REPERTORIO consulta los temas y escalas con operaciones de sólo lectura; Pizarra nunca escribe en Repertorio. Sus elementos contienen los mismos datos de escalas y acordes usados por los componentes existentes, pero se persisten exclusivamente en el navegador. Las variables y permisos que ya utiliza el repertorio siguen siendo los mismos.

## Archivos de esta integración

- `src/pages/Inicio.jsx`: pantalla principal con los dos accesos.
- `src/pages/Pizarra.jsx`: composición de los componentes existentes y acciones de pizarra.
- `src/components/VolverInicio.jsx`: enlace ATRÁS compartido.
- `src/App.jsx`: rutas de Inicio, Repertorio y Pizarra.
- `src/pages/Repertorio.jsx`: acceso de regreso a Inicio, conservando su funcionamiento.
- `src/pages/Tema.jsx`: regreso al nuevo URL del repertorio.
- `src/lib/pizarra.js`: formato local, lectura, escritura y actualización de elementos.
- `src/hooks/usePizarra.js`: estado local, persistencia y errores.
- `src/lib/pizarra.test.js`: persistencia, aislamiento, edición y errores.
- `src/components/EditorEscalaModal.jsx` y `src/components/EditorAcordeModal.jsx`: mensaje opcional de error de almacenamiento; los demás usos conservan su comportamiento.

## Prueba local antes del push

1. Si faltan dependencias, ejecutar `npm ci`.
2. Configurar `.env` a partir de `.env.example` con las variables existentes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_APP_PIN`. No se requieren variables nuevas.
3. Ejecutar `npm run dev` y abrir el URL indicado por Vite, normalmente `http://localhost:5173`. Ingresar el PIN configurado.
4. Abrir REPERTORIO, buscar y abrir un tema existente, comprobar sus pestañas y volver al listado y luego a Inicio. No hace falta modificar ni eliminar temas para comprobar la navegación.
5. Abrir PIZARRA y agregar un acorde desde Generador, dos escalas diferentes y otro acorde con + Acorde. Comprobar su edición, que las escalas estén arriba y los acordes se distribuyan en filas debajo.
6. Recargar la página; cerrar y volver a abrir el mismo URL. Confirmar que el contenido se conserva.
7. Eliminar un elemento y verificar que los demás siguen presentes. Probar CANCELAR en VACIAR PIZARRA y luego confirmar el vaciado; recargar para verificarlo.
8. Revisar a ancho móvil y desktop. Los gráficos mantienen sus proporciones y permiten desplazarse horizontalmente.
9. Ejecutar `npm test`, `npm run lint` y `npm run build`.

La validación de desarrollo utilizó la app real, localStorage real en un origen de prueba y una API local de solo lectura para la navegación del repertorio. No se escribieron datos en un proyecto real de Supabase.
