-- Idempotent: safe to re-run. Replace with your two real login emails.
insert into public.couples (name)
select 'Us' where not exists (select 1 from public.couples);

insert into public.couple_members (couple_id, user_id)
select (select id from public.couples limit 1), u.id
from auth.users u
where u.email in ('you@example.com', 'partner@example.com')
on conflict do nothing;

insert into public.couple_settings (couple_id)
select id from public.couples
on conflict do nothing;
