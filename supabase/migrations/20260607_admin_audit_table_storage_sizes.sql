create or replace function public.get_admin_table_storage_sizes(table_names text[])
returns table (
  table_name text,
  total_bytes bigint,
  table_bytes bigint,
  index_bytes bigint,
  row_estimate bigint
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    c.relname::text as table_name,
    pg_total_relation_size(c.oid)::bigint as total_bytes,
    pg_relation_size(c.oid)::bigint as table_bytes,
    pg_indexes_size(c.oid)::bigint as index_bytes,
    greatest(c.reltuples, 0)::bigint as row_estimate
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and c.relname = any(table_names)
  order by c.relname;
$$;

revoke all on function public.get_admin_table_storage_sizes(text[]) from public;
revoke all on function public.get_admin_table_storage_sizes(text[]) from anon;
revoke all on function public.get_admin_table_storage_sizes(text[]) from authenticated;
grant execute on function public.get_admin_table_storage_sizes(text[]) to service_role;
