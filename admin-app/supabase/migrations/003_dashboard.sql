create view public.quotation_overview with (security_invoker=true) as
 select q.*,coalesce(v.status,'No version') as status,v.id as latest_version_id
 from public.quotations q left join lateral(select id,status from public.quotation_versions where quotation_id=q.id order by version desc limit 1)v on true;
grant select on public.quotation_overview to authenticated;
create function public.dashboard_overview() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare result jsonb;begin
 perform private.require_employee();
 select jsonb_build_object('metrics',jsonb_build_object(
 'total_enquiries',(select count(*) from enquiries),'new_enquiries',(select count(*) from enquiries where status='New'),
 'pending_quotes',(select count(*) from quotation_versions where status='Draft'),'sent_quotes',(select count(*) from quotation_versions where status='Sent'),
 'confirmed_bookings',(select count(*) from bookings where status in ('Confirmed','Completed')),
 'confirmed_value',(select coalesce(sum(value),0)::text from bookings where status in ('Confirmed','Completed')),
 'expected_profit',(select coalesce(sum((v.totals->>'profit')::numeric),0)::text from bookings b join quotation_versions v on v.id=b.version_id where b.status in ('Confirmed','Completed')),
 'upcoming_departures',(select count(*) from bookings where status='Confirmed' and start_date>=(now() at time zone 'Asia/Kolkata')::date),
 'balance_due',(select coalesce(sum(greatest(b.value-coalesce(p.paid,0),0)),0)::text from bookings b left join (select booking_id,sum(amount) paid from payments group by booking_id)p on p.booking_id=b.id where b.status<>'Cancelled')),
 'recent',(select coalesce(jsonb_agg(r),'[]') from (select id,title,status from enquiries order by created_at desc limit 8)r),
 'upcoming',(select coalesce(jsonb_agg(r),'[]') from (select id,title,status from bookings where status='Confirmed' and start_date>=(now() at time zone 'Asia/Kolkata')::date order by start_date limit 8)r),
 'followups',(select coalesce(jsonb_agg(r),'[]') from (select id,title,status from enquiries where follow_up<=(now() at time zone 'Asia/Kolkata')::date and status not in ('Confirmed','Lost') order by follow_up limit 8)r)) into result;
 return result;end$$;
revoke all on function public.dashboard_overview() from public,anon;
grant execute on function public.dashboard_overview() to authenticated;
