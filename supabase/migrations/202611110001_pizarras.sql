-- Ejecutar el archivo completo una vez en el SQL Editor de Supabase.
begin;

create table public.pizarras (
  id uuid primary key,
  titulo text not null check (length(btrim(titulo)) between 1 and 200),
  fecha date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0),
  contenido jsonb not null check ((
    jsonb_typeof(contenido) = 'object'
    and contenido->'version' = '1'::jsonb
    and jsonb_typeof(contenido->'elementos') = 'array'
    and octet_length(contenido::text) <= 1048576
  ) is true)
);

create index pizarras_modificacion_idx on public.pizarras (updated_at desc, id);
alter table public.pizarras enable row level security;
create policy pizarras_lectura_compartida on public.pizarras
  for select to anon, authenticated using (true);
revoke all on public.pizarras from public, anon, authenticated;
grant select on public.pizarras to anon, authenticated;

create function public.ydale_crear_pizarra(p_id uuid, p_titulo text, p_fecha date, p_contenido jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare fila public.pizarras;
begin
  -- El mismo intento puede reintentarse si se pierde la respuesta de red.
  insert into public.pizarras (id, titulo, fecha, contenido)
  values (p_id, btrim(p_titulo), p_fecha, p_contenido)
  on conflict (id) do nothing returning * into fila;
  if not found then
    select * into fila from public.pizarras where id = p_id;
    if not found or fila.revision <> 1 or fila.titulo is distinct from btrim(p_titulo)
      or fila.fecha is distinct from p_fecha or fila.contenido is distinct from p_contenido then
      raise exception 'La pizarra cambió' using errcode = '40001';
    end if;
  end if;
  return to_jsonb(fila) - 'contenido';
end;
$function$;

create function public.ydale_actualizar_pizarra(
  p_id uuid, p_revision integer, p_contenido jsonb default null,
  p_titulo text default null, p_fecha date default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare fila public.pizarras;
begin
  -- Un guardado cambia sólo contenido. Un renombrado cambia sólo título y fecha.
  if (p_contenido is null) = (p_titulo is null) or (p_titulo is null and p_fecha is not null) then
    raise exception 'Cambios de pizarra inválidos' using errcode = '22023';
  end if;
  update public.pizarras
  set contenido = coalesce(p_contenido, contenido),
      titulo = coalesce(btrim(p_titulo), titulo),
      fecha = case when p_titulo is null then fecha else p_fecha end,
      updated_at = clock_timestamp(), revision = revision + 1
  where id = p_id and revision = p_revision returning * into fila;
  if not found then raise exception 'La pizarra cambió o fue eliminada' using errcode = '40001'; end if;
  return to_jsonb(fila) - 'contenido';
end;
$function$;

create function public.ydale_eliminar_pizarra(p_id uuid, p_revision integer)
returns uuid language plpgsql security definer set search_path = ''
as $function$
begin
  delete from public.pizarras where id = p_id and revision = p_revision;
  if not found then raise exception 'La pizarra cambió o fue eliminada' using errcode = '40001'; end if;
  return p_id;
end;
$function$;

revoke all on function public.ydale_crear_pizarra(uuid, text, date, jsonb) from public, anon, authenticated;
revoke all on function public.ydale_actualizar_pizarra(uuid, integer, jsonb, text, date) from public, anon, authenticated;
revoke all on function public.ydale_eliminar_pizarra(uuid, integer) from public, anon, authenticated;
grant execute on function public.ydale_crear_pizarra(uuid, text, date, jsonb) to anon, authenticated;
grant execute on function public.ydale_actualizar_pizarra(uuid, integer, jsonb, text, date) to anon, authenticated;
grant execute on function public.ydale_eliminar_pizarra(uuid, integer) to anon, authenticated;

commit;
