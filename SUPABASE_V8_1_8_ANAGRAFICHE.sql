-- PADEL ARENA MANAGER V8.1.8 - ANAGRAFICHE COMPLETE
create or replace function public.admin_process_public_registration(p_registration_id text,p_action text,p_capacity integer default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.public_registrations; pp jsonb; pid1 text; pid2 text; ids jsonb;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Operazione riservata all’amministratore'; end if;
 select * into r from public.public_registrations where id=p_registration_id for update;
 if not found then raise exception 'Richiesta non trovata'; end if;
 if p_action='accepted' then
  pp=r.primary_payload;
  if pp->>'kind'='existing' then
   pid1=pp->>'player_id';
   if pp ? 'data' then update public.players set data=coalesce(data,'{}'::jsonb)||(pp->'data'),updated_at=now() where id=pid1; end if;
  else
   pid1='p_'||gen_random_uuid()::text;
   insert into public.players(id,data) values(pid1,pp->'data') on conflict(id) do update set data=coalesce(public.players.data,'{}'::jsonb)||excluded.data,updated_at=now();
  end if;
  if r.partner_payload is not null then
   pp=r.partner_payload;
   if pp->>'kind'='existing' then
    pid2=pp->>'player_id';
    if pp ? 'data' then update public.players set data=coalesce(data,'{}'::jsonb)||(pp->'data'),updated_at=now() where id=pid2; end if;
   else
    pid2='p_'||gen_random_uuid()::text;
    insert into public.players(id,data) values(pid2,pp->'data') on conflict(id) do update set data=coalesce(public.players.data,'{}'::jsonb)||excluded.data,updated_at=now();
   end if;
  end if;
  update public.public_registrations set status='accepted',primary_player_id=pid1,partner_player_id=pid2,updated_at=now() where id=r.id;
 elsif p_action='waitlist' then update public.public_registrations set status='waitlist',updated_at=now() where id=r.id;
 elsif p_action='rejected' then update public.public_registrations set status='rejected',updated_at=now() where id=r.id;
 else raise exception 'Azione non valida'; end if;
 ids=jsonb_build_array(pid1,pid2);
 return jsonb_build_object('status',p_action,'player_ids',ids);
end$$;
grant execute on function public.admin_process_public_registration(text,text,integer) to authenticated;
notify pgrst,'reload schema';
