import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'

const migracion = await readFile(new URL('../../supabase/migrations/202610270001_setlists.sql', import.meta.url), 'utf8')

for (const [tipo, ids] of [
  ['uuid', [randomUUID(), randomUUID()]],
  ['bigint', [1, 2]],
  ['text', ['cancion-original', 'otra-cancion']],
]) {
  test(`SQL real: instalación y CRUD seguro con temas.id ${tipo}`, async () => {
    const db = new PGlite()
    try {
      await db.exec(`
        create role anon; create role authenticated;
        create table public.temas (id ${tipo} primary key, nombre text, artista text, letra text, estructura jsonb, acordes jsonb);
        grant usage on schema public to anon, authenticated;
        grant select on public.temas to anon, authenticated;
      `)
      for (const [i, id] of ids.entries()) await db.query('insert into temas values ($1, $2, $3, $4, $5, $6)', [
        id, `Tema ${i}`, 'Banda', 'Letra original íntegra', { secciones: ['Verso', 'Estribillo'] }, { acordes: ['C', 'Em'] },
      ])
      const canciones = async () => (await db.query('select * from temas order by nombre')).rows
      const antes = await canciones()
      await db.exec(migracion)
      assert.deepEqual(await canciones(), antes, 'la migración no modifica canciones')
      const schema = await db.query("select column_name, data_type from information_schema.columns where table_name='setlist_songs' and column_name='song_id'")
      assert.equal(schema.rows[0].data_type, tipo === 'text' ? 'text' : tipo)

      const setlist = randomUUID()
      const entradas = [{ id: randomUUID(), song_id: ids[0] }, { id: randomUUID(), song_id: ids[1] }, { id: randomUUID(), song_id: ids[0] }]
      const guardar = async (id, revision, items, title = 'Biblioteca') => (await db.query(
        'select ydale_save_setlist($1, $2, $3, $4, $5, $6) as datos',
        [id, revision, title, '2026-10-31', 'Paternal', JSON.stringify(items)],
      )).rows[0].datos
      const leer = async id => (await db.query('select ydale_get_setlist($1) as datos', [id])).rows[0].datos
      await db.exec('set role anon')
      await assert.rejects(db.query('insert into setlists (title, date) values ($1,$2)', ['No autorizado', '2026-10-31']))
      const creado = await guardar(setlist, null, entradas)
      assert.equal(creado.revision, 1)
      assert.deepEqual((await leer(setlist)).items.map(i => String(i.song_id)), ids.concat(ids[0]).map(String))
      const orden = [entradas[2], entradas[0], entradas[1]]
      await guardar(setlist, 1, orden)
      const ordenado = await leer(setlist)
      assert.deepEqual(ordenado.items.map(i => i.id), orden.map(i => i.id))
      assert.deepEqual(ordenado.items.map(i => i.position), [0, 1, 2])
      assert.equal(ordenado.revision, 2)

      await assert.rejects(guardar(setlist, 1, entradas), e => e.code === '40001')
      assert.deepEqual(await leer(setlist), ordenado, 'conflicto no sobrescribe el orden')
      await assert.rejects(guardar(setlist, 2, [orden[0], orden[0]]))
      assert.deepEqual(await leer(setlist), ordenado, 'referencias inválidas revierten metadatos y orden')
      const inexistente = tipo === 'uuid' ? randomUUID() : tipo === 'bigint' ? 999 : 'inexistente'
      await assert.rejects(guardar(setlist, 2, [{ id: randomUUID(), song_id: inexistente }]), e => e.code === '23503')
      assert.deepEqual(await leer(setlist), ordenado, 'una FK fallida no deja un setlist vacío')
      const creacionFallida = randomUUID()
      await assert.rejects(guardar(creacionFallida, null, [{ id: randomUUID(), song_id: inexistente }]), e => e.code === '23503')
      assert.equal(await leer(creacionFallida), null, 'una creación fallida tampoco deja un evento parcial')

      const copia = randomUUID()
      await guardar(copia, null, orden.map(i => ({ ...i, id: randomUUID() })), 'Otro show')
      await assert.rejects(guardar(copia, 1, orden), e => e.code === '22023')
      assert.deepEqual((await leer(copia)).items.map(i => String(i.song_id)), orden.map(i => String(i.song_id)))
      await db.exec('reset role')
      assert.deepEqual(await canciones(), antes, 'duplicar no duplica ni modifica canciones')
      await db.query('update temas set nombre=$1, letra=$2 where id=$3', ['Tema actualizado', 'Letra actualizada', ids[0]])
      await db.exec('set role anon')
      assert.equal((await leer(setlist)).items[0].nombre, 'Tema actualizado')
      assert.equal((await leer(copia)).items[0].nombre, 'Tema actualizado')
      await assert.rejects(db.query('select ydale_delete_setlist($1, $2)', [setlist, 1]), e => e.code === '40001')
      await db.query('select ydale_delete_setlist($1, $2)', [setlist, 2])
      assert.equal(await leer(setlist), null)
      assert.equal((await db.query('select * from setlist_songs where setlist_id=$1', [setlist])).rows.length, 0)
      await assert.rejects(guardar(setlist, 2, orden), e => e.code === '40001')
      await db.exec('reset role')
      assert.equal((await canciones()).length, 2, 'eliminar setlist conserva todas las canciones')
      assert.equal((await canciones()).find(t => String(t.id) === String(ids[0])).letra, 'Letra actualizada')

      // Si se elimina una canción mediante Repertorio, sólo desaparecen sus
      // referencias. No se cambian las demás canciones ni el otro setlist.
      await db.query('delete from temas where id=$1', [ids[0]])
      assert.equal((await leer(copia)).items.length, 1)
      assert.equal((await leer(copia)).items[0].song_id.toString(), ids[1].toString())
      await assert.rejects(db.exec(migracion), e => e.code === '42P07')
      await db.exec('rollback')
      assert.equal((await leer(copia)).items.length, 1, 'repetir instalación falla sin sobrescribir tablas')
    } finally {
      await db.close()
    }
  })
}
