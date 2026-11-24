create or replace function public.get_older_unassigned_ride_requests()
returns table (
  id uuid,
  pickup_address text,
  destination_address text,
  status text,
  estimated_fare numeric,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.riders r
    join public.rider_ride_hailing_applications a on a.rider_id = r.id
    where r.user_id = auth.uid()
      and r.is_online = true
      and r.active_service_mode = 'ride_hailing'
      and a.approval_status = 'approved'
  ) then
    raise exception 'Only approved, online ride-hailing drivers can view older ride requests.';
  end if;

  return query
  select rr.id, rr.pickup_address, rr.destination_address,
         rr.status::text, rr.estimated_fare, rr.created_at
  from public.ride_requests rr
  where rr.status::text = 'ACCEPTED'
    and rr.driver_user_id is null
  order by rr.created_at desc
  limit 20;
end;
$$;

revoke all on function public.get_older_unassigned_ride_requests() from public, anon;
grant execute on function public.get_older_unassigned_ride_requests() to authenticated;