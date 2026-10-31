-- Single-agency employee-only operations. No customer records or supplier rates are seeded.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table public.admin_profiles(id uuid primary key references auth.users(id),display_name text not null,role text not null check(role in ('admin','staff')),active boolean not null default true,created_at timestamptz not null default now());
create function public.is_employee() returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from admin_profiles where id=auth.uid() and active)$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from admin_profiles where id=auth.uid() and active and role='admin')$$;
create table public.customers(id uuid primary key default gen_random_uuid(),name text not null check(length(name)>0),mobile text not null check(length(mobile)>=7),whatsapp text not null default '',email text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.enquiries(id uuid primary key default gen_random_uuid(),reference text unique not null default ('MH-E-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),customer_id uuid not null references customers(id),title text not null,status text not null default 'New' check(status in ('New','Contacted','Planning','Quoted','Follow-up','Confirmed','Lost')),assigned_to uuid references admin_profiles(id),follow_up date,details jsonb not null default '{}',created_by uuid default auth.uid() references admin_profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(status<>'Lost' or length(details->>'lost_reason')>0));
create table public.enquiry_activities(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references enquiries(id),kind text not null,body text not null,created_by uuid default auth.uid() references admin_profiles(id),created_at timestamptz not null default now());
create table public.destinations(id uuid primary key default gen_random_uuid(),name text unique not null,created_at timestamptz not null default now());
create table public.itinerary_templates(id uuid primary key default gen_random_uuid(),title text not null,destination_id uuid references destinations(id),details jsonb not null,created_by uuid default auth.uid() references admin_profiles(id),created_at timestamptz not null default now());
create table public.itineraries(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references enquiries(id),title text not null,revision integer not null default 0,details jsonb not null default '{}',created_by uuid default auth.uid() references admin_profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.itinerary_days(id uuid primary key default gen_random_uuid(),itinerary_id uuid not null references itineraries(id) on delete cascade,position integer not null check(position>0),details jsonb not null,unique(itinerary_id,position));
create table public.itinerary_revisions(id uuid primary key default gen_random_uuid(),itinerary_id uuid not null references itineraries(id),revision integer not null,snapshot jsonb not null,created_by uuid default auth.uid() references admin_profiles(id),created_at timestamptz not null default now(),unique(itinerary_id,revision));
create table public.suppliers(id uuid primary key default gen_random_uuid(),name text not null,category text not null,destination text not null,details jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.supplier_rates(id uuid primary key default gen_random_uuid(),supplier_id uuid not null references suppliers(id),description text not null,amount numeric(16,2) not null check(amount>=0),currency text not null default 'INR',valid_until date not null,source text not null,last_verified date,created_at timestamptz not null default now());
create table public.quotations(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references enquiries(id),itinerary_id uuid not null references itineraries(id),title text not null,created_by uuid default auth.uid() references admin_profiles(id),created_at timestamptz not null default now());
create table public.quotation_versions(id uuid primary key default gen_random_uuid(),quotation_id uuid not null references quotations(id),version integer not null check(version>0),revision integer not null default 0,status text not null default 'Draft' check(status in ('Draft','Approved','Ready to send','Sent')),details jsonb not null,totals jsonb,snapshot jsonb,approved_by uuid references admin_profiles(id),approved_at timestamptz,sent_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(quotation_id,version),check((status='Draft' and approved_at is null) or (status<>'Draft' and approved_at is not null and approved_by is not null and snapshot is not null)));
create table public.quotation_cost_items(id uuid primary key default gen_random_uuid(),version_id uuid not null references quotation_versions(id),supplier_id uuid references suppliers(id),category text not null,description text not null,quantity numeric(12,3) not null check(quantity>0),nights integer not null check(nights between 1 and 365),unit text not null,unit_cost numeric(16,2) not null check(unit_cost>=0),currency text not null check(currency~'^[A-Z]{3}$'),fx_rate numeric(18,8) not null check(fx_rate>0),rate_valid_until date,tax_treatment text not null default '',confirmation text not null check(confirmation in ('Estimated','Requested','Confirmed')),notes text not null default '');
create table public.bookings(id uuid primary key default gen_random_uuid(),reference text unique not null default ('MH-B-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),quotation_id uuid not null unique references quotations(id),version_id uuid not null unique references quotation_versions(id),customer_id uuid not null references customers(id),title text not null,value numeric(16,2) not null check(value>=0),start_date date,end_date date,payment_due date,supplier_confirmation text not null default 'Pending' check(supplier_confirmation in ('Pending','Partial','Confirmed')),status text not null default 'Pending' check(status in ('Pending','Advance Received','Supplier Confirmation','Confirmed','Completed','Cancelled')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(end_date>=start_date),check(status not in ('Confirmed','Completed') or supplier_confirmation='Confirmed'));
create table public.payments(id uuid primary key default gen_random_uuid(),booking_id uuid not null references bookings(id),amount numeric(16,2) not null check(amount>0),paid_on date not null,method text not null,reference text not null,created_by uuid default auth.uid() references admin_profiles(id),created_at timestamptz not null default now());
create table public.pdf_exports(id uuid primary key default gen_random_uuid(),version_id uuid not null references quotation_versions(id),path text unique not null,sha256 text not null,created_by uuid default auth.uid() references admin_profiles(id),created_at timestamptz not null default now());
create table public.audit_logs(id uuid primary key default gen_random_uuid(),entity text not null,record_id uuid,action text not null,actor uuid,previous jsonb,current jsonb,created_at timestamptz not null default now());
create table public.operations_settings(id boolean primary key default true check(id),minimum_margin numeric(8,4) not null default 10 check(minimum_margin between 0 and 99.99),company_email text not null default '',updated_at timestamptz not null default now());
insert into operations_settings(id) values(true);
create table private.ingress_settings(id boolean primary key default true check(id),secret_hash text);
insert into private.ingress_settings(id) values(true);
create table private.ingress_keys(key uuid primary key,enquiry_id uuid not null references enquiries(id),created_at timestamptz not null default now());
create table private.ingress_limits(key text primary key,bucket timestamptz not null,hits integer not null);

create function private.audit_change() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 insert into audit_logs(entity,record_id,action,actor,previous,current) values(tg_table_name,case when tg_table_name='operations_settings' then null else coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id')::uuid end,tg_op,auth.uid(),case when tg_op<>'INSERT' then to_jsonb(old) end,case when tg_op<>'DELETE' then to_jsonb(new) end);
 if tg_op='DELETE' then return old;end if;return new;end$$;
create function private.touch() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end$$;
do $$declare t text;begin
 foreach t in array array['customers','enquiries','enquiry_activities','destinations','itinerary_templates','itineraries','itinerary_days','itinerary_revisions','suppliers','supplier_rates','quotations','quotation_versions','quotation_cost_items','bookings','payments','pdf_exports','operations_settings'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy employee_read on public.%I for select to authenticated using ((select public.is_employee()))',t);
 execute format('create trigger audit after insert or update or delete on public.%I for each row execute function private.audit_change()',t);
 end loop;
 foreach t in array array['customers','enquiries','enquiry_activities','destinations','itinerary_templates','suppliers','supplier_rates'] loop
 execute format('create policy employee_write on public.%I for all to authenticated using ((select public.is_employee())) with check ((select public.is_employee()))',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
 foreach t in array array['customers','enquiries','itineraries','suppliers','quotation_versions','bookings','operations_settings'] loop execute format('create trigger touch before update on public.%I for each row execute function private.touch()',t);end loop;
end$$;
-- Sensitive workflow tables can only be mutated through the authorized atomic RPCs below.
revoke all on public.itineraries,public.itinerary_days,public.itinerary_revisions,public.quotations,public.quotation_versions,public.quotation_cost_items,public.bookings,public.payments,public.pdf_exports,public.operations_settings,public.admin_profiles,public.audit_logs from authenticated;
grant select on public.itineraries,public.itinerary_days,public.itinerary_revisions,public.quotations,public.quotation_versions,public.quotation_cost_items,public.bookings,public.payments,public.pdf_exports,public.operations_settings to authenticated;
alter table admin_profiles enable row level security;
create policy profiles_read on admin_profiles for select to authenticated using(id=auth.uid() or (select public.is_employee()));
grant select on admin_profiles to authenticated;
alter table audit_logs enable row level security;
create policy admin_read on audit_logs for select to authenticated using((select public.is_admin()));
grant select on audit_logs to authenticated;
revoke all on all tables in schema public from anon;

create function private.require_employee() returns void language plpgsql security definer set search_path=public,pg_temp as $$begin if not public.is_employee() then raise exception 'Employee access required' using errcode='42501';end if;end$$;
create function public.save_enquiry(p_id uuid,p_data jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare c uuid;e uuid;begin perform private.require_employee();
 if coalesce(length(p_data->>'name'),0)=0 or coalesce(length(p_data->>'mobile'),0)<7 or coalesce((p_data->>'adults')::int,0)<1 or coalesce((p_data->>'rooms')::int,0)<1 then raise exception 'Customer contact, adults and rooms required';end if;
 if nullif(p_data->>'end_date','')::date<nullif(p_data->>'start_date','')::date then raise exception 'Invalid travel dates';end if;
 if p_id is null then insert into customers(name,mobile,whatsapp,email) values(p_data->>'name',p_data->>'mobile',p_data->>'whatsapp',p_data->>'email') returning id into c;
 insert into enquiries(customer_id,title,status,assigned_to,follow_up,details) values(c,(p_data->>'name')||' — '||(p_data->>'destinations'),p_data->>'status',nullif(p_data->>'assigned_to','')::uuid,nullif(p_data->>'follow_up','')::date,p_data) returning id into e;
 else select customer_id into strict c from enquiries where id=p_id for update;update customers set name=p_data->>'name',mobile=p_data->>'mobile',whatsapp=p_data->>'whatsapp',email=p_data->>'email' where id=c;update enquiries set title=(p_data->>'name')||' — '||(p_data->>'destinations'),status=p_data->>'status',assigned_to=nullif(p_data->>'assigned_to','')::uuid,follow_up=nullif(p_data->>'follow_up','')::date,details=p_data where id=p_id;e=p_id;end if;return e;end$$;
create function public.save_itinerary(p_id uuid,p_data jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare v_id uuid;v_old itineraries;day jsonb;n integer:=0;begin
 perform private.require_employee();
 if coalesce((p_data->>'adults')::int,0)<1 or jsonb_array_length(p_data->'days')<1 then raise exception 'Invalid travellers or empty itinerary';end if;
 if nullif(p_data->>'end_date','')::date<nullif(p_data->>'start_date','')::date then raise exception 'Invalid travel dates';end if;
 if p_id is null then insert into itineraries(enquiry_id,title,details) values((p_data->>'enquiry_id')::uuid,p_data->>'title',p_data-'days'-'revision'-'enquiry_id') returning id into v_id;
 else
 select * into strict v_old from itineraries where id=p_id for update;
 if v_old.enquiry_id is distinct from (p_data->>'enquiry_id')::uuid then raise exception 'Duplicate the itinerary to change its linked enquiry';end if;
 if v_old.revision is distinct from (p_data->>'revision')::int then raise exception 'Another employee saved this itinerary. Reload before saving.' using errcode='40001';end if;
 insert into itinerary_revisions(itinerary_id,revision,snapshot) values(p_id,v_old.revision,jsonb_build_object('details',v_old.details,'title',v_old.title,'days',(select coalesce(jsonb_agg(details order by position),'[]') from itinerary_days where itinerary_id=p_id)));
 update itineraries set title=p_data->>'title',details=p_data-'days'-'revision'-'enquiry_id',revision=revision+1 where id=p_id;v_id=p_id;
 delete from itinerary_days where itinerary_id=p_id;
 end if;
 for day in select value from jsonb_array_elements(p_data->'days') loop n=n+1;if length(coalesce(day->>'description',''))=0 then raise exception 'Day descriptions required';end if;insert into itinerary_days(itinerary_id,position,details) values(v_id,n,day);end loop;
 return v_id;
end$$;
create function public.create_quotation(p_itinerary uuid,p_title text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare v_id uuid;v_e uuid;begin perform private.require_employee();select enquiry_id into strict v_e from itineraries where id=p_itinerary;insert into quotations(enquiry_id,itinerary_id,title) values(v_e,p_itinerary,p_title) returning id into v_id;return v_id;end$$;
create function public.save_quote_version(p_quotation uuid,p_id uuid,p_revision integer,p_data jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare v_id uuid;v_old quotation_versions;item jsonb;begin
 perform private.require_employee();perform 1 from quotations where id=p_quotation for update;if not found then raise exception 'Quotation not found';end if;
 if p_id is null then insert into quotation_versions(quotation_id,version,details) select p_quotation,coalesce(max(version),0)+1,p_data-'costs' from quotation_versions where quotation_id=p_quotation returning id into v_id;
 else select * into strict v_old from quotation_versions where id=p_id and quotation_id=p_quotation for update;
 if v_old.status<>'Draft' then raise exception 'Approved quotations are immutable; create a new version';end if;
 if v_old.enquiry_id is distinct from (p_data->>'enquiry_id')::uuid then raise exception 'Duplicate the itinerary to change its linked enquiry';end if;
 if v_old.revision is distinct from p_revision then raise exception 'Quotation changed; reload before saving' using errcode='40001';end if;
 update quotation_versions set details=p_data-'costs',revision=revision+1 where id=p_id;v_id=p_id;delete from quotation_cost_items where version_id=p_id;
 end if;
 for item in select value from jsonb_array_elements(p_data->'costs') loop
 insert into quotation_cost_items(version_id,supplier_id,category,description,quantity,nights,unit,unit_cost,currency,fx_rate,rate_valid_until,tax_treatment,confirmation,notes)
 values(v_id,nullif(item->>'supplier_id','')::uuid,item->>'category',item->>'description',(item->>'quantity')::numeric,(item->>'nights')::int,item->>'unit',(item->>'unit_cost')::numeric,item->>'currency',(item->>'fx_rate')::numeric,nullif(item->>'rate_valid_until','')::date,coalesce(item->>'tax_treatment',''),item->>'confirmation',coalesce(item->>'notes',''));
 end loop;return v_id;
end$$;

create function public.approve_quote(p_id uuid,p_revision integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare v quotation_versions;q quotations;i itineraries;e enquiries;c customers;cost numeric;total numeric;selling numeric;tax numeric;tcs numeric;final numeric;profit numeric;margin numeric;allocated numeric;settings operations_settings;days jsonb;begin
 if not public.is_admin() then raise exception 'Only an admin can approve' using errcode='42501';end if;
 select * into strict v from quotation_versions where id=p_id for update;if v.status<>'Draft' or v.revision is distinct from p_revision then raise exception 'Reload quotation before approval';end if;
 select * into strict q from quotations where id=v.quotation_id;select * into strict i from itineraries where id=q.itinerary_id for share;select * into strict e from enquiries where id=q.enquiry_id;select * into strict c from customers where id=e.customer_id;select * into strict settings from operations_settings where id;
 if (i.details->>'adults')::int<1 or length(c.mobile)<7 then raise exception 'Valid travellers and customer contact required';end if;
 if nullif(v.details->>'valid_until','')::date is null or (v.details->>'valid_until')::date<current_date then raise exception 'Quotation validity expired or missing';end if;
 if not exists(select 1 from quotation_cost_items where version_id=p_id) then raise exception 'Enter supplier costs before approval';end if;
 if not exists(select 1 from quotation_cost_items where version_id=p_id and category='Hotels') and length(coalesce(v.details->>'hotel_cost_explanation',''))=0 then raise exception 'Hotel costs or exclusion reason required';end if;
 if exists(select 1 from quotation_cost_items where version_id=p_id and rate_valid_until<current_date) then raise exception 'Supplier rate expired';end if;
 if not (v.details ?& array['target_percent','tax_percent','tcs_percent','contingency','pricing_mode','tcs_base']) or coalesce((v.details->>'target_percent')::numeric,-1)<0 or coalesce((v.details->>'contingency')::numeric,-1)<0 or coalesce((v.details->>'tax_percent')::numeric,-1) not between 0 and 100 or coalesce((v.details->>'tcs_percent')::numeric,-1) not between 0 and 100 or v.details->>'tcs_base' not in ('pre-tax','with-tax') then raise exception 'Invalid pricing configuration';end if;
 if length(coalesce(v.details->>'tax_notes',''))=0 then raise exception 'Record transaction-specific tax treatment';end if;
 select sum(round(quantity*nights*unit_cost*fx_rate,2)) into cost from quotation_cost_items where version_id=p_id;
 total=cost+(v.details->>'contingency')::numeric;if total<0 then raise exception 'Invalid costs';end if;
 if v.details->>'pricing_mode'='margin' then if (v.details->>'target_percent')::numeric>=100 then raise exception 'Margin must be below 100';end if;selling=total/(1-(v.details->>'target_percent')::numeric/100);
 elsif v.details->>'pricing_mode'='markup' then selling=total*(1+(v.details->>'target_percent')::numeric/100);else raise exception 'Invalid pricing mode';end if;
 if nullif(v.details->>'manual_price','') is not null then if length(coalesce(v.details->>'override_reason',''))=0 then raise exception 'Override reason required';end if;selling=(v.details->>'manual_price')::numeric;end if;
 if selling<=0 then raise exception 'Selling price must be positive';end if;selling=round(selling,2);tax=round(selling*(v.details->>'tax_percent')::numeric/100,2);tcs=round((selling+case when v.details->>'tcs_base'='with-tax' then tax else 0 end)*(v.details->>'tcs_percent')::numeric/100,2);final=selling+tax+tcs;profit=selling-total;margin=profit/selling*100;
 if margin<settings.minimum_margin then raise exception 'Below minimum gross margin; revise price or ask an admin to change the configured minimum';end if;
 if nullif(v.details->>'adult_price','') is not null or nullif(v.details->>'child_price','') is not null or nullif(v.details->>'infant_price','') is not null then
 allocated=coalesce(nullif(v.details->>'adult_price','')::numeric,0)*(i.details->>'adults')::int+coalesce(nullif(v.details->>'child_price','')::numeric,0)*coalesce((i.details->>'children')::int,0)+coalesce(nullif(v.details->>'infant_price','')::numeric,0)*coalesce((i.details->>'infants')::int,0);if allocated<>final then raise exception 'Passenger price allocation does not equal the final price';end if;end if;
 select jsonb_agg(jsonb_build_object('position',position,'city',details->>'city','title',details->>'title','date',details->>'date','description',details->>'description','hotel',details->>'hotel','meals',details->>'meals','sightseeing',details->>'sightseeing','transport',details->>'transport','pickup_drop',details->>'pickup_drop','optional_activities',details->>'optional_activities','image',details->>'image') order by position) into days from itinerary_days where itinerary_id=i.id;
 if days is null then raise exception 'Itinerary days required';end if;
 update quotation_versions set status='Approved',approved_by=auth.uid(),approved_at=now(),revision=revision+1,
 totals=jsonb_build_object('supplierCost',cost::text,'estimatedCost',total::text,'sellingBeforeTax',selling::text,'tax',tax::text,'tcs',tcs::text,'finalPrice',final::text,'profit',profit::text,'marginPercent',margin::text),
 snapshot=jsonb_build_object('reference','MH-Q-'||upper(substr(replace(v.quotation_id::text,'-',''),1,12))||'-V'||v.version,'title',v.details->>'title','customer',jsonb_build_object('name',c.name,'mobile',c.mobile,'email',c.email),'tour',jsonb_build_object('title',i.title,'destinations',i.details->>'destinations','start_date',i.details->>'start_date','end_date',i.details->>'end_date','adults',i.details->>'adults','children',i.details->>'children','infants',i.details->>'infants','hotel_category',i.details->>'hotel_category','departure_city',i.details->>'departure_city'),'days',days,'price',final::text,'tax',tax::text,'tcs',tcs::text,'adult_price',v.details->>'adult_price','child_price',v.details->>'child_price','infant_price',v.details->>'infant_price','valid_until',v.details->>'valid_until','inclusions',v.details->>'inclusions','exclusions',v.details->>'exclusions','hotel_details',v.details->>'hotel_details','transport_details',v.details->>'transport_details','payment_schedule',v.details->>'payment_schedule','cancellation_policy',v.details->>'cancellation_policy','travel_notes',v.details->>'travel_notes') where id=p_id;
end$$;
create function public.mark_quote(p_id uuid,p_status text) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin perform private.require_employee();if p_status not in ('Ready to send','Sent') then raise exception 'Invalid send status';end if;update quotation_versions set status=p_status,sent_at=case when p_status='Sent' then now() else sent_at end where id=p_id and approved_at is not null and (details->>'valid_until')::date>=current_date;if not found then raise exception 'Only valid approved quotations can be sent';end if;end$$;
create function public.convert_booking(p_version uuid,p_due date) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare v quotation_versions;q quotations;e enquiries;b uuid;begin perform private.require_employee();select * into strict v from quotation_versions where id=p_version and approved_at is not null for share;if (v.details->>'valid_until')::date<current_date then raise exception 'Quotation expired';end if;select * into strict q from quotations where id=v.quotation_id;select * into strict e from enquiries where id=q.enquiry_id;insert into bookings(quotation_id,version_id,customer_id,title,value,start_date,end_date,payment_due) values(q.id,v.id,e.customer_id,v.snapshot->>'title',(v.totals->>'finalPrice')::numeric,nullif(v.snapshot#>>'{tour,start_date}','')::date,nullif(v.snapshot#>>'{tour,end_date}','')::date,p_due) returning id into b;return b;end$$;
create function public.record_payment(p_booking uuid,p_amount numeric,p_date date,p_method text,p_reference text) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare b bookings;paid numeric;begin perform private.require_employee();select * into strict b from bookings where id=p_booking for update;if b.status in ('Cancelled','Completed') then raise exception 'Booking is closed';end if;select coalesce(sum(amount),0) into paid from payments where booking_id=p_booking;if p_amount<=0 or paid+p_amount>b.value then raise exception 'Payment must be positive and not exceed balance';end if;insert into payments(booking_id,amount,paid_on,method,reference) values(p_booking,p_amount,p_date,p_method,p_reference);if b.status='Pending' then update bookings set status='Advance Received' where id=p_booking;end if;end$$;
create function public.set_booking_state(p_id uuid,p_status text,p_confirmation text) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare b bookings;begin perform private.require_employee();select * into strict b from bookings where id=p_id for update;
 if not ((p_status=b.status) or (p_status='Cancelled' and b.status not in ('Completed','Cancelled')) or (b.status='Pending' and p_status='Supplier Confirmation') or (b.status='Advance Received' and p_status='Supplier Confirmation') or (b.status='Supplier Confirmation' and p_status='Confirmed') or (b.status='Confirmed' and p_status='Completed')) then raise exception 'Invalid booking transition';end if;
 if p_status in ('Confirmed','Completed') and p_confirmation<>'Confirmed' then raise exception 'Supplier confirmation is required; an advance is not confirmation';end if;
 update bookings set status=p_status,supplier_confirmation=p_confirmation where id=p_id;
 if p_status='Confirmed' then update enquiries set status='Confirmed' where id=(select enquiry_id from quotations where id=b.quotation_id);end if;end$$;
create function public.set_operations_settings(p_margin numeric,p_email text) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin if not public.is_admin() then raise exception 'Admin required' using errcode='42501';end if;update operations_settings set minimum_margin=p_margin,company_email=p_email where id;end$$;
create function public.register_pdf(p_version uuid,p_path text,p_hash text) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin perform private.require_employee();if not exists(select 1 from quotation_versions where id=p_version and approved_at is not null) then raise exception 'Approved quotation required';end if;if p_path not like p_version::text||'/%' then raise exception 'Invalid PDF path';end if;insert into pdf_exports(version_id,path,sha256) values(p_version,p_path,p_hash) on conflict(path) do nothing;end$$;

-- Atomic website intake. No general anonymous table grants; requires a separate server secret.
create function public.receive_public_enquiry(p_secret text,p_key uuid,p_rate_key text,p_data jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare stored text;v_id uuid;c uuid;n integer;begin
 select secret_hash into stored from private.ingress_settings where id;
 if stored is null or p_secret is null or encode(sha256(convert_to(p_secret,'UTF8')),'hex') is distinct from stored then raise exception 'Ingress disabled' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtext(p_rate_key));
 select enquiry_id into v_id from private.ingress_keys where key=p_key;if found then return v_id;end if;
 insert into private.ingress_limits(key,bucket,hits) values(p_rate_key,date_trunc('hour',now()),1) on conflict(key) do update set hits=case when ingress_limits.bucket=date_trunc('hour',now()) then ingress_limits.hits+1 else 1 end,bucket=date_trunc('hour',now()) returning hits into n;if n>8 then raise exception 'Too many enquiries, please try later';end if;
 if length(coalesce(p_data->>'name','')) not between 1 and 240 or length(coalesce(p_data->>'phone','')) not between 7 and 30 or (p_data->>'adults')::int<1 then raise exception 'Invalid enquiry';end if;
 insert into customers(name,mobile,email) values(p_data->>'name',p_data->>'phone',coalesce(p_data->>'email','')) returning id into c;
 insert into enquiries(customer_id,title,details) values(c,p_data->>'destination',p_data||jsonb_build_object('source','Website','mobile',p_data->>'phone','whatsapp',p_data->>'phone','destinations',p_data->>'destination','departure_city',p_data->>'departureCity','special_requirements',p_data->>'preferences')) returning id into v_id;
 insert into private.ingress_keys(key,enquiry_id) values(p_key,v_id);return v_id;end$$;

create index enquiries_status_follow_up on enquiries(status,follow_up);
create index enquiries_customer on enquiries(customer_id);
create index enquiry_activities_enquiry on enquiry_activities(enquiry_id,created_at desc);
create index itineraries_enquiry on itineraries(enquiry_id);
create index quotations_enquiry on quotations(enquiry_id);
create index quotation_versions_parent on quotation_versions(quotation_id,version desc);
create index quotation_cost_items_version on quotation_cost_items(version_id);
create index bookings_departure on bookings(start_date,status);
create index payments_booking on payments(booking_id);
create index supplier_rates_validity on supplier_rates(supplier_id,valid_until);
create index audit_logs_record on audit_logs(entity,record_id,created_at desc);

-- Deny implicit PUBLIC execution. Helpers and all RPCs authorize explicitly.
do $$declare f record;begin for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace and proname in ('is_employee','is_admin','save_enquiry','save_itinerary','create_quotation','save_quote_version','approve_quote','mark_quote','convert_booking','record_payment','set_booking_state','set_operations_settings','register_pdf','receive_public_enquiry') loop execute format('revoke all on function %s from public,anon,authenticated',f.signature);if f.signature::text not like 'receive_public_enquiry%' then execute format('grant execute on function %s to authenticated',f.signature);end if;end loop;end$$;
grant execute on function public.receive_public_enquiry(text,uuid,text,jsonb) to anon;
