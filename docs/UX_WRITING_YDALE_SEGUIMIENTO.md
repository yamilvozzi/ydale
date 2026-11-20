# YDALE — Seguimiento de UX Writing

## Etapa 1 de 3 — Finalizada

20 de noviembre de 2026. Alcance: correcciones funcionales de redacción, confirmaciones, advertencias y protección de nombres musicales. Las etapas 2 y 3 no se iniciaron.

La [auditoría original](REVISION_TEXTOS_YDALE.md) se conserva sin cambios como registro. Las decisiones de esta etapa prevalecen sobre sus alternativas.

## Identificadores implementados

| ID | Resultado |
|---|---|
| P06 | Se corrigió únicamente la concordancia: «No se pudieron guardar los cambios. Probá de nuevo.» |
| P08 | Eliminar tema tiene título fijo y explicación separada con el nombre original y la advertencia de que no se puede deshacer. |
| P13 | Se informa que la estructura no se puede abrir y que guardar otra reemplaza la anterior. |
| P19 | «Quitar de la letra» identifica la acción sobre el anclaje, sin borrar la tarjeta del acorde. |
| P26 | La advertencia dice: «Cargar este tema reemplaza lo que hay en la pizarra.» |
| P27 | Sólo la confirmación de reemplazo muestra REEMPLAZAR PIZARRA; el botón inicial sigue diciendo CARGAR EN PIZARRA. |
| P42 | Vaciar bloque de Repertorio separa título y explicación: «Los acordes no se borran: vuelven a quedar sueltos.» |
| P43 | Vaciar bloque de Pizarra informa: «Se borra el contenido del bloque. Los acordes sueltos quedan igual.» |
| P44 | Eliminar bloque de Pizarra informa: «Se borra el bloque con su contenido. Los acordes sueltos quedan igual.» |
| P54 | Eliminar Setlist tiene título fijo y explicación separada: «“{título original}” se borrará. Los temas siguen en el repertorio.» |
| P78 | El componente compartido admite `etiquetaConfirmar`, con ELIMINAR como valor por defecto. Los vaciados de bloques y de toda la Pizarra usan VACIAR. |
| P79 | Eliminar acorde o escala de Pizarra muestra la pregunta fija en el título y el nombre musical debajo, sin transformar su escritura. |
| P80 | El error compartido dice: «No se pudo completar la acción. Probá de nuevo.» |

Se reutilizaron `ConfirmarEliminacionModal`, su propiedad `titulo` y sus estilos existentes. Se conservaron las funciones de confirmación y cancelación, los callbacks de las operaciones, las estructuras de datos y la persistencia. No hubo cambios de CSS global.

## Decisiones que difieren de la auditoría

- P06 conserva «Probá de nuevo»; sólo corrige la concordancia. No se aplicó una sustitución general por «Intentá de nuevo».
- P43 y P44 usan las explicaciones exactas aprobadas para esta etapa, más breves que las alternativas de la auditoría. No se trasladó a Pizarra la garantía de recuperación de tarjetas propia del Repertorio.
- P80 usa «Probá de nuevo», como se indicó en la consigna de esta etapa.
- P78 permite una etiqueta QUITAR cuando corresponda, sin agregar operaciones ni modales. Ningún uso actual del componente compartido confirma una acción de quitar una asociación: P19 y los controles existentes de quitar conservan sus acciones directas.
- El uso de «temas» en P54 forma parte de la frase expresamente aprobada. No se unificaron «tema» y «canción» en el resto de la aplicación.

## Revisión de nombres dinámicos

- **Corregidos:** confirmaciones de acorde y escala en Pizarra; el título ya no contiene el nombre musical. Confirmaciones de tema y Setlist: el nombre se mantiene en la explicación.
- **Revisados sin necesidad de cambios:** confirmaciones de las pestañas ESCALA y ACORDES y de la biblioteca de pizarras. Sus nombres ya estaban en el párrafo secundario, fuera de `modal-titulo`.
- **Protección existente conservada:** `ModalAcordeBloque` y el diálogo Mover acorde usan `tituloMusical`/`normal-case`. Los editores de tema, Setlist, Pizarra y bloque muestran los nombres personalizados en sus campos o textos secundarios, separados del título fijo. Los inputs de Setlist mantienen `normal-case` aunque sus etiquetas estén en mayúsculas.

No se transformaron ni reescribieron nombres, digitaciones, tonalidades, letras ni otros contenidos guardados.

## Comprobaciones realizadas

- `npm test`: **164 pruebas aprobadas**. Incluyen conservación de acordes de Repertorio al vaciar/eliminar bloques, comportamiento propio de Pizarra, anclajes, guardado y recuperación, y operaciones de Setlists y pizarras con base de datos de prueba.
- `npm run lint` y `npm run build`: completados correctamente. Build conserva el aviso de tamaño del bundle; no se modificó la arquitectura para esta etapa.
- Interfaz con los componentes reales y datos sintéticos, mediante una API local simulada: se verificaron títulos, explicaciones y etiquetas de confirmación; cancelación y confirmación; error de una operación fallida y reintento; nombres como Gm, Gm · Eólico, Tema Gm / Bb y Ensayo Gm / Bb sin cambios de capitalización.
- En Repertorio se vació un bloque, se recuperó el acorde suelto al reabrir y se eliminó el contenedor conservando la tarjeta. En Pizarra se borró el contenido del bloque, se reabrió ese estado y se eliminó el bloque conservando la tarjeta suelta.
- Se verificó la advertencia de estructura incompatible y se agregó y quitó un acorde de una letra de prueba; la tarjeta original siguió disponible. Se guardó y reabrió la estructura.
- La protección de cambios sin guardar siguió apareciendo al cargar un tema en Pizarra. La confirmación de reemplazo mantiene el botón inicial y cambia sólo el botón del paso final.
- Desktop y viewport de **320 px**: explicaciones en escritura normal, color secundario `#a39c8a` y tamaño de 14 px; títulos de 18 px en mayúsculas. Los modales y el botón REEMPLAZAR PIZARRA entraron sin desbordamiento horizontal en la revisión móvil.
- Se contrastó el diff con el alcance aprobado: sólo presentación y textos de los 13 puntos. No se modificaron módulos musicales, hooks, persistencia ni la auditoría original. No se usaron datos reales ni se hicieron cambios en Supabase.

## Modificaciones pendientes

Quedan **67 propuestas de la auditoría sin implementar**:

P01–P05, P07, P09–P12, P14–P18, P20–P25, P28–P41, P45–P53 y P55–P77.

Siguen pendientes la unificación general de terminología, las preferencias de estilo, los placeholders y buscadores, las etiquetas de herramientas y los demás mensajes de error. No se presupone su aprobación ni se asignan automáticamente a la siguiente etapa.

**Cierre: etapa 1 terminada. No continuar con las etapas 2 o 3 sin una nueva consigna.**

---

## Etapa 2 de 3 — Finalizada

20 de noviembre de 2026. Ejecutada a partir de la nueva consigna de etapa 2. Se conserva íntegro el registro de etapa 1 que antecede y la auditoría original permanece sin modificaciones. **La etapa 3 no se inició.**

### Identificadores implementados

**57 propuestas aplicadas**, algunas adaptadas a las decisiones de esta etapa:

P02–P05, P10, P12, P14–P18, P20, P22–P25, P28–P41, P45–P46, P48–P53, P55–P62, P64–P68 y P71–P76.

| Grupo | Cambios realizados |
|---|---|
| Repertorio y Setlists | Nuevo tema; Artista (opcional) con el ejemplo Ej.: Y daaaale!; búsquedas por tema o artista donde ambas están disponibles. Tema es la unidad principal en acciones, estados vacíos, etiquetas accesibles, anuncios de movimiento y PDF de Setlists. |
| Estructura | Ayuda para separar la letra por líneas en blanco; posibilidad de agregar un bloque sin llamarlo necesariamente instrumental; Copiar acordes de otro bloque…; Nombre (opcional); Indicaciones (opcional). La ayuda de arrastre conserva la pulsación sostenida y el límite de la misma línea. |
| Pizarra y herramientas | Abrir pizarra; CARGAR TEMA para el selector de incorporación; Círculo de quintas en el control y el modal; carga de acordes y escalas descrita con esos nombres. |
| Acordes y escalas | Nombre del acorde; Escala o modo; AGREGAR en el generador, que efectivamente incorpora y guarda una tarjeta; Agregar acorde para destacar en el selector de resaltado. Se simplificaron las leyendas de tónica opcional y grados omitidos, conservando los valores musicales. |
| Estados e instrucciones | No hay resultados.; ayuda al ingresar un acorde no reconocido; mensajes de posiciones sin resultados; devolución de tarjetas al sector suelto; alternativa mediante el ícono de movimiento; Este acorde no tiene diagrama. |
| Bloques | Compases (0 = libre) y advertencia más directa sobre los acordes que pasan al último compás al reducir la cantidad. |
| Guardado y recuperación | Explicación breve de cambios pendientes; Guardar cambios; Continuar; conflicto de otra sesión con sus dos alternativas; distinción de borrador local; advertencias de Setlists que mantienen la necesidad de recargar. |
| PDF | En la próxima pantalla podés imprimir o guardar como PDF.; mensajes de fallas parciales y carga de temas; Sin temas.; contador singular/plural tema/temas. Se conservaron contenido, orden, diagramas y diseño de impresión. |

También se ajustó el respaldo visible «Canción no disponible» a «Tema no disponible» en la lista del setlist, por el mismo criterio de denominación. No se renombraron componentes, funciones, rutas, campos de datos ni identificadores técnicos que contienen la palabra canción.

Se retiraron únicamente dos aclaraciones redundantes: Vista previa del editor de escala (P31) y la referencia al arrastre dentro del diálogo Mover acorde (P41). Las instrucciones útiles de teclado y la elección de destino y posición se conservan.

### Decisiones particulares y diferencias respecto de la auditoría

- **P03/P51:** los buscadores de Repertorio y Setlists filtran por nombre y artista; usan Buscar tema o artista… y la etiqueta accesible Buscar tema o artista. El selector de Pizarra sólo filtra por nombre y conserva Buscar tema… / Buscar tema por nombre. No se amplió su búsqueda.
- **P05:** se eligió Artista (opcional) como etiqueta y Ej.: Y daaaale! como ejemplo breve, en lugar del placeholder propuesto originalmente.
- **P12:** se aplicó exactamente «No se pudieron cargar las escalas. Revisá la conexión e intentá de nuevo.» No se agregó la indicación imprecisa de avisarle a alguien.
- **P28:** se conservó el diagnóstico de referencia de tonalidad o escala incompatible y se indicó cómo resolverlo: agregar un diagrama en la pestaña ESCALA del tema. Se mantiene «volvé a intentar».
- **P33:** se aplicó exactamente «No hay posiciones para esta zona.» P34 acompaña ese vocabulario: «No hay posiciones con estos filtros.» No se sustituyeron los términos digitación y posición en todos los contextos musicales.
- **P61:** el botón dice exactamente Continuar. Se conservó la operación que retoma, incluido el comportamiento de reintento.
- **P64:** el mensaje pasa a «No se pudo confirmar la pizarra en Supabase. Probá de nuevo.» Se elimina la denominación proyecto, pero se mantiene Supabase como dato útil para diagnosticar.
- **P65/P66:** se distingue el borrador local de la biblioteca. El fallo de guardado dice «No se pudo guardar el borrador en este dispositivo. Probá de nuevo.» No se atribuye el fallo al espacio, los permisos ni otra causa no comprobada. Se mantiene la advertencia distinta cuando la biblioteca se actualizó pero el borrador local no.
- **P67/P68:** se mantienen el conflicto entre sesiones, la necesidad de recargar antes de editar y la advertencia sobre un tema que ya no está en el repertorio. Sólo cambia la redacción; no cambian códigos de error ni controles de concurrencia.
- **P71:** se aplicó exactamente «En la próxima pantalla podés imprimir o guardar como PDF.»

### Propuestas conservadas o no intervenidas en esta etapa

| ID | Decisión |
|---|---|
| P01 | Se mantiene ATRÁS. |
| P07 | Se conserva «No se pudo crear el tema. Probá de nuevo.»; no hace falta uniformar el cierre. |
| P09 | No se modifica «No se encontró el tema.»: ya es claro y no forma parte de la selección expresa de esta etapa. |
| P11 | Se conserva exactamente «Entradas, finales, cambios, lo que vaya surgiendo en el ensayo.» |
| P21 | Se mantiene Estructura de la canción: es una expresión natural en ese contexto. No se hizo una sustitución global de canción por tema. |
| P47 | Se conserva la explicación original sobre la digitación guardada en el bloque y el acorde original que ya no está en la Pizarra. |
| P63 | Se mantiene el diagnóstico concreto «Falta instalar la biblioteca de pizarras en Supabase.» |
| P69 | Se conserva la referencia a la base de datos y al SQL de docs/setlists.md. No se reemplaza por un aviso genérico de configuración. |
| P70 | Se mantiene «No se pudo completar la operación. Revisá la conexión y volvé a intentar.» |
| P77 | Se conserva Confirmar eliminación como título genérico de respaldo. Las confirmaciones específicas de etapa 1 permanecen intactas. |

También se conservaron Reservado para Diego, Probá de nuevo donde ya era natural, los nombres y símbolos musicales y los contenidos ingresados por el usuario. Un título de prueba llamado Canción Gm se mantuvo con esa escritura en la interfaz y la impresión.

### Comprobaciones de etapa 2

- Comparación estructural del código con una instantánea tomada al comenzar esta etapa: sólo se modificaron textos en 25 archivos y se retiraron los dos párrafos indicados. No cambiaron las clases, estilos, handlers, filtros, cálculos musicales, estructuras de datos, persistencia ni controles de concurrencia. Las confirmaciones y mensajes aprobados en etapa 1 se conservaron.
- Interfaz real con una API local simulada y datos sintéticos: búsqueda por artista en Repertorio y Setlists; selector de Pizarra por nombre; creación de tema con Artista (opcional); agregado de un tema al setlist; AGREGAR del generador incorporando una tarjeta Gm; protección de cambios sin guardar con las nuevas etiquetas.
- Se probó Continuar después de simular un fallo de continuación: el primer paso guardó una vez; Continuar retomó la operación sin guardar otra vez.
- Vista de impresión de Setlist con 2 temas: se conservaron títulos y artistas, incluido Canción Gm. Se revisó también la aclaración de impresión del modal de exportación.
- Viewport de 320 px: controles de Pizarra, Círculo de quintas, AGREGAR del generador, campos de creación y etiquetas del editor de estructura legibles y sin desbordamientos horizontales nuevos. No fue necesario cambiar tamaños ni distribución de botones.
- Validación final sobre los archivos definitivos: `npm test` completó **164 pruebas aprobadas**, sin fallos; `npm run lint` y `npm run build` completaron correctamente. Build mantiene el aviso de tamaño del bundle. No se usaron datos reales ni se modificó Supabase.

### Estado al cierre de etapa 2

La auditoría sigue siendo el registro original de 80 propuestas. Se aplicaron **70 entre las dos etapas**: 13 en etapa 1 y 57 en etapa 2. Los otros diez identificadores quedan documentados arriba como conservados o no intervenidos; no se deben aplicar automáticamente en la etapa siguiente.

No quedan cambios autorizados de esta etapa por implementar. **Detener el trabajo aquí. La etapa 3 requiere una nueva consigna.**

---

## Etapa 3 de 3 — Pendiente de aprobación editorial

20 de noviembre de 2026. Revisión iniciada a partir de la nueva consigna de etapa 3, con alcance exclusivo de propuesta y documentación. Los estados de cierre anteriores se conservan como registro histórico.

Se preparó [IDENTIDAD_TEXTOS_YDALE.md](IDENTIDAD_TEXTOS_YDALE.md) con **cuatro propuestas, I01–I04**, verificadas contra textos existentes en el código actual. La selección abarca los estados vacíos de Repertorio, ACORDES, un setlist y la biblioteca de pizarras. Cada caso incluye ubicación, texto actual, propuesta, motivo, tipo de cambio y archivo/componente.

Se conservaron las decisiones de las etapas 1 y 2, la frase Reservado para Diego y los mensajes que ya funcionan bien. No se propusieron cambios humorísticos en mensajes sensibles ni modificaciones de información musical o instrucciones técnicas. La auditoría original permanece sin cambios.

**No se implementó ninguna propuesta de identidad.** Esta etapa sólo agregó el documento editorial y este registro; no modificó código, componentes visuales, funcionalidades ni datos. Se contrastaron las citas y los contextos con sus archivos fuente.

**Estado al cierre: propuesta de etapa 3 preparada; I01–I04 pendientes de aprobación editorial. La implementación requiere una decisión posterior sobre cuáles textos aprobar.**
