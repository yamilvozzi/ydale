# Setlists

## Instalación en Supabase (paso manual necesario)

La implementación no ejecuta migraciones automáticamente. En este entorno no
hay una conexión administrativa a la base real. Antes de usar Setlists:

1. Abrir el **SQL Editor** del proyecto Supabase que usa YDALE.
2. Copiar y ejecutar **completo, una sola vez**, el SQL exacto de
   [`supabase/migrations/202610270001_setlists.sql`](../supabase/migrations/202610270001_setlists.sql).
3. Comprobar que finalice correctamente y recargar la aplicación.

El archivo incluye `BEGIN` y `COMMIT`: si falla cualquier parte, no se instala
parcialmente. Si la sesión queda en una transacción abortada, ejecutar
`ROLLBACK;` antes de corregir el problema y volver a intentar. Ejecutarlo de
nuevo después de una instalación exitosa falla por tablas ya existentes y no
las reemplaza. No borrar tablas para repetirlo.

No hay que cambiar `temas`, sus IDs, letras, estructuras, acordes, escalas,
Storage ni la Pizarra. No hay variables de entorno nuevas. Siguen siendo
necesarios los valores reales de `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY` y `VITE_APP_PIN` de la aplicación existente.

## Estructuras nuevas

`public.setlists`:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | Clave primaria; UUID nuevo por evento |
| `title` | `text` | Obligatorio, 1–200 caracteres tras quitar espacios exteriores |
| `date` | `date` | Obligatorio; fecha del evento sin zona horaria |
| `place` | `text` | Opcional, máximo 300 caracteres |
| `created_at` | `timestamptz` | Obligatorio; `now()` al crear |
| `updated_at` | `timestamptz` | Obligatorio; actualizado por el guardado |
| `revision` | `integer` | Obligatorio; empieza en 1, sube en cada guardado |

`public.setlist_songs`:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | Clave primaria estable para cada aparición de una canción |
| `setlist_id` | `uuid` | FK a `setlists.id`, obligatoria, `ON DELETE CASCADE` |
| `song_id` | El tipo real de `public.temas.id` | FK a `temas.id`, obligatoria, `ON DELETE CASCADE` |
| `position` | `integer` | Obligatorio, desde 0; único por setlist, restricción diferible |

La instalación obtiene el tipo de `temas.id` del catálogo PostgreSQL: admite
UUID, bigint o texto sin convertir ni modificar los identificadores existentes.
La pantalla numera desde 1 según el orden, incluso si una canción eliminada
desde Repertorio dejó un hueco en las posiciones. Se admite repetir una canción
en un show; cada aparición tiene una relación independiente.

Eliminar un setlist borra sólo ese evento y sus relaciones. La FK hacia canciones
actúa en el sentido inverso: eliminar una canción desde Repertorio retira sus
referencias; eliminar una relación **jamás** elimina una canción.

Se crean dos índices (fecha/creación del evento y canción referenciada), RLS y
políticas de lectura para `anon`/`authenticated`. Las escrituras en las tablas
nuevas se restringen a estas funciones:

- `ydale_get_setlist(uuid)`: lectura coherente de metadatos y relaciones, con
  nombre/artista actuales de Repertorio; respeta sus permisos de lectura.
- `ydale_save_setlist(uuid, integer, text, date, text, jsonb)`: creación o edición
  atómica, validación de referencias y control de revisión.
- `ydale_delete_setlist(uuid, integer)`: eliminación con control de revisión.

Las funciones de escritura usan `SECURITY DEFINER`, `search_path` vacío y
referencias de esquema explícitas. No contienen escrituras a tablas existentes.
Se revoca la ejecución a `PUBLIC` y se concede a los dos roles de la app.
El acceso sigue el modelo compartido actual: clave pública de Supabase y PIN
local; no se agrega un sistema de usuarios ni propiedad individual de setlists.

## Funcionamiento

- Inicio agrega SETLISTS con la misma jerarquía que REPERTORIO y PIZARRA.
- `/setlists` lista por fecha del evento descendente; desempata por creación e ID.
  Las tarjetas muestran título, fecha y cantidad, con Duplicar/Eliminar.
- Crear y duplicar piden título, fecha y lugar. Duplicar consulta las referencias
  actuales y crea otro evento con nuevas relaciones, en el mismo orden.
- `/setlists/:id` abre en lectura. Al crear/duplicar se ofrece el selector inicial
  de canciones, sin habilitar el arrastre del listado de lectura.
- EDITAR permite agregar, quitar y reordenar. LISTO vuelve a lectura. Cada acción
  se guarda automáticamente y se bloquea otra escritura mientras está pendiente.
- El handle de arrastre usa la biblioteca `@dnd-kit` ya instalada, pointer events
  para mouse/touch y teclado (espacio/flechas). Sólo el handle desactiva el gesto
  de scroll. El menú también permite mover al principio o al final.
- Si falla un guardado se vuelve al último estado confirmado, se muestra el error
  y se exige recargar antes de seguir escribiendo. Esto cubre respuestas de red
  perdidas que podrían haberse confirmado en el servidor. Una revisión vieja
  nunca sobrescribe una edición posterior. No hay cola de cambios offline.
- La ficha es la misma `/tema/:id/letra`, consultada mediante `useTema`.
  `?setlist=<uuid>` conserva el origen en todas las pestañas y en la redirección
  inicial. La flecha regresa a ese evento; sin origen válido vuelve a Repertorio.
  El estado de navegación conserva el scroll al volver en la misma pestaña.

No se guardan nombres, letras, estructuras, acordes ni diagramas en Setlists.
Los nombres devueltos por la lectura sólo viven en memoria para mostrar la lista.
Las relaciones tienen IDs estables para futuras notas por aparición; modo show,
duraciones, bloques y siguiente/anterior quedan fuera de esta implementación.

## Archivos

- `src/App.jsx`, `src/pages/Inicio.jsx`, `src/pages/Tema.jsx`: acceso, rutas y regreso contextual.
- `src/pages/Setlists.jsx`, `src/pages/Setlist.jsx`: biblioteca y evento.
- `src/components/ModalSetlist.jsx`, `MenuSetlist.jsx`,
  `AgregarCancionesSetlist.jsx`, `CancionesSetlist.jsx`: controles que reutilizan
  clases, colores, iconos, confirmación y arrastre existentes.
- `src/hooks/useSetlists.js`, `src/lib/setlists.js`,
  `src/lib/navegacionTema.js`: consultas, guardados y origen de navegación.
- `src/lib/setlists.test.js`, `src/lib/setlistsDatabase.test.js`: pruebas de API,
  navegación y SQL real con PostgreSQL aislado mediante PGlite (dependencia sólo
  de desarrollo). No conectan ni escriben en Supabase real.

## Verificación

Ejecutar `npm test`, `npm run lint` y `npm run build`. Las pruebas de SQL instalan
la migración con IDs UUID/bigint/texto y comprueban: integridad de canciones
preexistentes, orden persistente, repeticiones, referencias actualizadas,
duplicación sin copiar canciones, borrado limitado al evento, rollback ante
errores de FK y revisiones obsoletas, permisos y repetición segura de instalación.

Validación de esta implementación: 130 pruebas automáticas aprobadas, lint sin
observaciones y build de producción correcto. Se verificó el flujo completo en
Edge con una API de prueba respaldada por el mismo SQL en PostgreSQL aislado:
desktop de 1440 px, móvil emulado de 390 px, arrastre con mouse, teclado y eventos
táctiles, recuperación de errores, duplicación, confirmación/cancelación de
borrado, actualización de letra desde la ficha existente, regreso entre todas
las pestañas, recarga y restauración de scroll. Se inspeccionaron capturas de
Inicio, biblioteca, evento, selector y formulario. No se escribieron datos en
Supabase real; la instalación y la prueba de conexión real quedan como paso
manual. El build muestra el aviso de tamaño del bundle superior a 500 kB.

Después de instalar en Supabase, comprobar en desktop y móvil:

1. Abrir Repertorio, consultar las pestañas de un tema y volver al listado.
2. Crear dos eventos con fechas distintas y verificar orden y lugar almacenado.
3. Agregar varias canciones, repetir una, cerrar y recargar.
4. Entrar en EDITAR, arrastrar con mouse/dedo, probar el teclado y las opciones
   del menú. Pulsar LISTO y recargar para confirmar el orden.
5. Abrir una canción desde el setlist, cambiar entre sus pestañas, recargar la
   ficha y volver con la flecha. Comprobar también el regreso desde Repertorio.
6. Editar una canción de prueba en Repertorio y abrirla desde dos setlists.
7. Duplicar definiendo otro evento. Verificar mismo orden y cantidad de canciones
   en Repertorio. Cancelar la eliminación y luego confirmar sólo en un evento
   de prueba; comprobar que las canciones siguen presentes.
8. Editar el mismo setlist desde dos sesiones y comprobar que la segunda muestra
   un conflicto en lugar de sobrescribir. Cortar la conexión durante un guardado
   y verificar el error y la recuperación mediante RECARGAR SETLIST.
