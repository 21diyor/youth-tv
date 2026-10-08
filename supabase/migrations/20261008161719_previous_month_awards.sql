-- Awards recognize the completed month and air the following month.
create or replace function public.current_hr_slides() returns jsonb
language sql stable security definer set search_path='' as $$
 with today as (select (now() at time zone 'Asia/Tashkent')::date as d),
 eligible as (
 select p.id,p.kind,(p.published-'dateKey'-'staffId') ||
 case when p.kind='employee' then jsonb_build_object('awardMonth',p.published->>'dateKey') else '{}'::jsonb end ||
 case when s.id is not null then jsonb_build_object('name',s.draft->>'name',
 'position',s.draft->>'position','department',s.draft->>'department','photoPath',s.draft->'photoPath') else '{}'::jsonb end as content
 from public.hr_plans p cross join today
 left join public.hr_plans s on s.kind='birthday' and
 s.id::text=case when p.kind='birthday' then p.id::text else p.published->>'staffId' end
 where p.published is not null and (p.published->>'enabled')::boolean
 and p.published->>'dateKey'=case when p.kind='birthday' then to_char(d,'MM-DD') else to_char(d-interval '1 month','YYYY-MM') end
 )
 select jsonb_build_object('date',to_char(d,'YYYY-MM-DD'),
 'birthdays',coalesce((select jsonb_agg(content||jsonb_build_object('id',id) order by id) from eligible where kind='birthday'),'[]'::jsonb),
 'employees',coalesce((select jsonb_agg(content||jsonb_build_object('id',id) order by id) from eligible where kind='employee'),'[]'::jsonb),
 'employee',(select content||jsonb_build_object('id',id) from eligible where kind='employee' limit 1)) from today;
$$;
revoke all on function public.current_hr_slides() from public;
grant execute on function public.current_hr_slides() to anon,authenticated;
