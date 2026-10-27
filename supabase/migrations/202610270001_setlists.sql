-- Instalación única, aditiva y transaccional. No escribe ni altera temas.
-- Ejecutar completa en el SQL Editor de Supabase con el rol postgres.
begin;

create table public.setlists (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 200),
  date date not null,
  place text check (place is null or length(place) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0)
);

-- No se asume UUID/bigint/text para temas.id. Se conserva su tipo real,
-- sin conversiones ni modificaciones de los IDs del repertorio.
do $migration$
declare tipo_id text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_id
  from pg_attribute a
  where a.attrelid = 'public.temas'::regclass
    and a.attname = 'id' and not a.attisdropped;
  if tipo_id is null then raise exception 'No existe public.temas.id'; end if;
  execute format($ddl$
    create table public.setlist_songs (
      id uuid primary key default gen_random_uuid(),
      setlist_id uuid not null references public.setlists(id) on delete cascade,
      song_id %s not null references public.temas(id) on delete cascade,
      position integer not null check (position >= 0),
      constraint setlist_songs_position_unique unique (setlist_id, position)
        deferrable initially deferred
    )
  $ddl$, tipo_id);
end;
$migration$;

create index setlists_event_date_idx on public.setlists (date desc, created_at desc);
create index setlist_songs_song_idx on public.setlist_songs (song_id);

-- La app actual usa acceso compartido anon + PIN local, no Supabase Auth.
-- Se limita la escritura de estas tablas a las funciones transaccionales.
alter table public.setlists enable row level security;
alter table public.setlist_songs enable row level security;
create policy setlists_read on public.setlists for select to anon, authenticated using (true);
create policy setlist_songs_read on public.setlist_songs for select to anon, authenticated using (true);
revoke all on public.setlists, public.setlist_songs from public, anon, authenticated;
grant select on public.setlists, public.setlist_songs to anon, authenticated;

-- Una sola sentencia obtiene metadatos, revisión y orden coherentes. Los
-- nombres/artistas son lecturas actuales; no se persisten copias de canciones.
create function public.ydale_get_setlist(p_id uuid) returns jsonb
language sql stable security invoker set search_path = ''
as $function$
  select to_jsonb(s) || jsonb_build_object('items', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', ss.id, 'song_id', ss.song_id, 'position', ss.position,
      'nombre', t.nombre, 'artista', t.artista
    ) order by ss.position)
    from public.setlist_songs ss left join public.temas t on t.id = ss.song_id
    where ss.setlist_id = s.id
  ), '[]'::jsonb))
  from public.setlists s where s.id = p_id;
$function$;

create function public.ydale_save_setlist(
  p_id uuid, p_revision integer, p_title text, p_date date,
  p_place text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare actual public.setlists; entrada public.setlist_songs; elemento jsonb; indice integer := 0;
begin
  if p_id is null or p_title is null or length(btrim(p_title)) not between 1 and 200
    or p_date is null or length(p_place) > 300
    or p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Datos de setlist inválidos' using errcode = '22023';
  end if;
  select * into actual from public.setlists where id = p_id for update;
  if found then
    if p_revision is null or actual.revision <> p_revision then
      raise exception 'El setlist cambió; recargar antes de guardar' using errcode = '40001';
    end if;
    update public.setlists set title = btrim(p_title), date = p_date,
      place = nullif(btrim(p_place), ''), updated_at = now(), revision = revision + 1
    where id = p_id returning * into actual;
  else
    if p_revision is not null then
      raise exception 'El setlist fue eliminado; no se recreará' using errcode = '40001';
    end if;
    insert into public.setlists (id, title, date, place)
      values (p_id, btrim(p_title), p_date, nullif(btrim(p_place), '')) returning * into actual;
  end if;

  -- IDs estables para permitir futuras notas por aparición en el show.
  -- No se puede reutilizar una relación de otro setlist ni cambiar su canción.
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    join public.setlist_songs ss on ss.id = (e->>'id')::uuid
    where ss.setlist_id <> p_id or to_jsonb(ss.song_id) is distinct from e->'song_id'
  ) or (select count(*) <> count(distinct e->>'id') from jsonb_array_elements(p_items) e) then
    raise exception 'Referencias de setlist inválidas' using errcode = '22023';
  end if;

  delete from public.setlist_songs ss where ss.setlist_id = p_id
    and not exists (select 1 from jsonb_array_elements(p_items) e where (e->>'id')::uuid = ss.id);
  for elemento in select value from jsonb_array_elements(p_items) loop
    entrada := jsonb_populate_record(null::public.setlist_songs, elemento);
    insert into public.setlist_songs (id, setlist_id, song_id, position)
      values (entrada.id, p_id, entrada.song_id, indice)
      on conflict (id) do update set position = excluded.position
      where public.setlist_songs.setlist_id = p_id
        and public.setlist_songs.song_id = excluded.song_id;
    if not found then
      raise exception 'Referencia modificada por otra sesión' using errcode = '40001';
    end if;
    indice := indice + 1;
  end loop;
  -- FK, restricciones y toda la edición se confirman o revierten juntas.
  return to_jsonb(actual);
end;
$function$;

create function public.ydale_delete_setlist(p_id uuid, p_revision integer) returns uuid
language plpgsql security definer set search_path = ''
as $function$
declare eliminado uuid;
begin
  delete from public.setlists where id = p_id and revision = p_revision returning id into eliminado;
  if eliminado is null then
    raise exception 'El setlist cambió o fue eliminado; recargar' using errcode = '40001';
  end if;
  return eliminado;
end;
$function$;

revoke all on function public.ydale_get_setlist(uuid) from public;
revoke all on function public.ydale_save_setlist(uuid, integer, text, date, text, jsonb) from public;
revoke all on function public.ydale_delete_setlist(uuid, integer) from public;
grant execute on function public.ydale_get_setlist(uuid) to anon, authenticated;
grant execute on function public.ydale_save_setlist(uuid, integer, text, date, text, jsonb) to anon, authenticated;
grant execute on function public.ydale_delete_setlist(uuid, integer) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
