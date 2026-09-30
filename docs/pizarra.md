# Inicio y Pizarra

## Navegación

- `/`: Inicio con REPERTORIO y PIZARRA, detrás del acceso por PIN existente.
- `/repertorio`: listado y operaciones existentes; ATRÁS vuelve a Inicio.
- `/pizarra`: espacio independiente; ATRÁS vuelve a Inicio.
- `/tema/:id/...`: conserva las direcciones existentes; su flecha vuelve a `/repertorio`.

## Pizarra

`+ Escala` usa el editor y diapasón actuales. `+ Acorde` permite dibujar directamente en el editor manual. `Generador` abre el generador y ELEGIR transfiere la posición al editor manual. Los tres botones comparten el color principal. Las escalas aparecen siempre arriba, en orden de incorporación; los acordes debajo, en filas que se ajustan al ancho disponible. Los diagramas conservan sus componentes y proporciones. Se pueden editar y eliminar individualmente. Las confirmaciones de eliminación y VACIAR PIZARRA muestran la pregunta como título y los botones de cancelar/eliminar.

El contenido se guarda en `localStorage` bajo `ydaaaale_pizarra_v1`. Permanece tras recargar y reabrir la aplicación en el mismo navegador y origen. No se sincroniza entre dispositivos; borrar los datos del navegador también borra la pizarra. Los errores de almacenamiento se muestran sin cerrar el editor ni descartar su borrador. Si no se puede leer el contenido guardado, no se sobrescribe automáticamente.

## Supabase

No requiere cambios en Supabase: ni tablas, columnas, RLS, índices, funciones, triggers, permisos ni Storage. No hay SQL que ejecutar. La pizarra no consulta ni modifica temas; sus elementos contienen los mismos datos de escalas y acordes usados por los componentes existentes, pero se persisten exclusivamente en el navegador. Las variables y permisos que ya utiliza el repertorio siguen siendo los mismos.

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
