-- PADEL ARENA MANAGER 5.1
-- Portale capitani AICS Padel Championship 2027
-- Eseguire nel SQL Editor di Supabase come amministratore.

create extension if not exists pgcrypto;

create table if not exists public.championship_teams (
  id text primary key,
  championship_code text not null default 'AICS-2027',
  team_name text not null,
  club_legal_name text,
  club_tax_id text,
  series text,
  captain_name text,
  captain_email text,
  captain_phone text,
  captain_birth_date date,
  captain_birth_place text,
  captain_residence text,
  club_address text,
  club_postal_code text,
  club_town text,
  club_province text,
  club_phone text,
  club_email text,
  home_court_address text,
  home_day text,
  home_time text,
  invite_token text unique not null,
  access_enabled boolean not null default false,
  roster_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.championship_team_members (
  team_id text not null references public.championship_teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'captain' check (role in ('captain','manager')),
  created_at timestamptz not null default now(),
  primary key(team_id,user_id)
);

create table if not exists public.championship_roster_players (
  id uuid primary key default gen_random_uuid(),
  team_id text not null references public.championship_teams(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_date date,
  birth_place text,
  postal_code text,
  residence_town text,
  residence_province text,
  phone text,
  email text,
  photo_url text,
  payment_status text not null default 'missing',
  membership_status text not null default 'missing',
  medical_status text not null default 'missing',
  approval_status text not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.championship_teams enable row level security;
alter table public.championship_team_members enable row level security;
alter table public.championship_roster_players enable row level security;

create or replace function public.is_pam_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid() and role='admin'
  );
$$;

drop policy if exists "admins manage championship teams" on public.championship_teams;
create policy "admins manage championship teams" on public.championship_teams
for all using (public.is_pam_admin()) with check (public.is_pam_admin());

drop policy if exists "captains read own team" on public.championship_teams;
create policy "captains read own team" on public.championship_teams
for select using (
  exists(select 1 from public.championship_team_members m where m.team_id=id and m.user_id=auth.uid())
);

drop policy if exists "admins manage memberships" on public.championship_team_members;
create policy "admins manage memberships" on public.championship_team_members
for all using (public.is_pam_admin()) with check (public.is_pam_admin());

drop policy if exists "users read own membership" on public.championship_team_members;
create policy "users read own membership" on public.championship_team_members
for select using (user_id=auth.uid());

drop policy if exists "admins manage rosters" on public.championship_roster_players;
create policy "admins manage rosters" on public.championship_roster_players
for all using (public.is_pam_admin()) with check (public.is_pam_admin());

drop policy if exists "captains manage own roster" on public.championship_roster_players;
create policy "captains manage own roster" on public.championship_roster_players
for all using (
  exists(select 1 from public.championship_team_members m where m.team_id=championship_roster_players.team_id and m.user_id=auth.uid())
  and exists(select 1 from public.championship_teams t where t.id=championship_roster_players.team_id and t.access_enabled and t.roster_open)
)
with check (
  exists(select 1 from public.championship_team_members m where m.team_id=championship_roster_players.team_id and m.user_id=auth.uid())
  and exists(select 1 from public.championship_teams t where t.id=championship_roster_players.team_id and t.access_enabled and t.roster_open)
);

create or replace function public.claim_championship_team_invite(p_token text)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare
  t public.championship_teams;
begin
  if auth.uid() is null then raise exception 'Accesso richiesto'; end if;
  select * into t from public.championship_teams where invite_token=p_token;
  if t.id is null then raise exception 'Invito non valido'; end if;
  if lower(coalesce(auth.jwt()->>'email','')) <> lower(t.captain_email) then
    raise exception 'Usa l email del referente registrato';
  end if;
  if not t.access_enabled then
    return jsonb_build_object('access_enabled',false);
  end if;
  insert into public.championship_team_members(team_id,user_id,role)
  values(t.id,auth.uid(),'captain') on conflict do nothing;
  return jsonb_build_object(
    'access_enabled',true,
    'roster_open',t.roster_open,
    'team',to_jsonb(t)-'invite_token'
  );
end;
$$;

grant execute on function public.claim_championship_team_invite(text) to authenticated;

insert into public.championship_teams(
 id,team_name,club_legal_name,club_tax_id,series,captain_name,captain_email,captain_phone,
 captain_birth_date,captain_birth_place,captain_residence,club_address,club_postal_code,
 club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,invite_token
) values
('aics2027_01','FIFTEEN RACQUET CLUB','FIFTEEN RACQUET CLUB','03127460347','Serie B','GOFFREDO GATTI','goffredo.gatti@gmail.com','334/6260938','1969-07-02','PARMA','SAN POLO D''ENZA','VIA RENZO PEZZANI 47A','43029','TRAVERSETOLO','PARMA','3488204373','nicola77.fagetti@gmail.com','VIA RENZO PEZZANI 47 43029 TRAVERSETOLO (PR)','Domenica','14:00 SOLO SABATO E DOMENICA','eb641f337adbd7e419b29c653e1d3b2b'),
('aics2027_02','CA''MARTA squadra A','Ca''Marta sport&fun ssd a rl','03384630368','Serie B','Dignatici Luca','lucadignatici@hotmail.com','3357536953','1973-11-18','Sassuolo','Sassuolo','via Regina Pacis 118','41049','Ssasuolo','modena','0536812923','tommyvale99@gmail.com','Sassuolo Via Regina Pacis 118 (mo)','Sabato','14:00 SOLO SABATO E DOMENICA','1e5c655dd0b65dae1543cb557e1c1f5d'),
('aics2027_03','CA''MARTA squadra B','CA''MARTA SPORT&FUN SSD A RL UNI','03384630368','Serie C','VALENTI TOMMASO','tommyvale99@gmail.com','3426480454','1989-09-21','CARPI','CARPI','VIA REGINA PACIS 118','41049','SASSUOLO','MODENA','0536 812923','tommyvale99@gmail.com','SASSUOLO VIA REGINA PACIS 118 (mo)','Sabato','14:00 SOLO SABATO E DOMENICA','f82739604639840f3993414517315476'),
('aics2027_04','CA''MARTA squadra C','Ca''Marta sport&fun ssd a rl uni','03384630368','Serie C','CANALI MATTEO','mcanali83@gmail.com','3282280304','1983-11-17','Sassuolo','Prignano s/s (MO)','Regina Pacis 118','41049','Sassuolo','MODENA','0536812923','tommyvale99@gmail.com','SASSUOLO VIA REGINA PACIS 118 (MO)','Sabato','16:00 SOLO SABATO E DOMENICA','27a2f7521b705337255ac794e591d916'),
('aics2027_05','Pol Nonantola Padel','Polisportiva Nonantola A.D.','80015050364','Serie C','Marco Meschiari','marco.meschiari81@gmail.com','3479565881','1981-09-15','Modena','Modena','Via Mazzini 34','41015','Nonantola','Modena','3479565881','polnonantola.padel@gmail.com','Via Risorgimento 50, 41015 Nonantola','Venerdi','20:00 SOLO VENERDÌ','9548bac08b29fc4b5b25f2cdced44122'),
('aics2027_06','Padel Prime La Patria Carpi','S.G.La Patria 1879 ASD','90003660363','Serie C','Marco Gradellini','marco.grade@gmail.com','3467192364','1993-01-05','Carpi','Carpi','Via Nuova Ponente 24/H','41012','Carpi','Modena','059644070','amministrazione.lapatria@gmail.com','Via Nuova Ponente 24/H, 41012, Carpi (MO)','Sabato','14:00 SOLO SABATO E DOMENICA','8968637df0729fb0ca7daa67ed41cf26'),
('aics2027_07','CT CORREGGIO 2','Circolo Tennis Correggio ASD','91010210358','Serie B','Maurizio Musso','elemaeri@alice.it','3470887572','1972-07-11','Asti','Correggio','via Bruto Terrachini 2','42015','Correggio','Reggio Emilia','0522637164','direzione@ctcorreggio.it','via Bruto Terrachini 2 - 42015 Correggio (RE)','Sabato','14:00 SOLO SABATO E DOMENICA','be07b2c3818295a3b08cdbf40536a6da'),
('aics2027_08','Phoenix Cavriago','ASD Phoenix Cavriago','02500230350','Serie B','Zecchetti Patrick','patrickz@libero.it','3498945499','1990-09-07','Montecchio Emilia','Cavriago (RE) - 42025','Via Torre n.3','42025','Cavriago','REGGIO NELL''EMILIA','3478979048','rocchi.marco@ognibene.com','Via Cantonazzo n.1, Cavriago 42025','Sabato','16:00 SOLO SABATO E DOMENICA','ef291d90603a3e6407cd3b444ee7f38d'),
('aics2027_09','MIRAPADEL CENTER','MIRAPADEL CENTER','04023790365','Serie C','LAGONEGRO ROSARIO','info@mirapadelcenter.it','3406686972','1976-11-15','MILANO','MIRANDOLA','VIA 2 GIUGNO 26','41037','MIRANDOLA','MODENA','3428340667','info@mirapadelcenter.it','VIA 2 GIUGNO 26, 41037 MIRANDOLA (MO)','Domenica','15:00 SOLO SABATO E DOMENICA','be928a8283eba98180f5c62164f1e838'),
('aics2027_10','CT CORREGGIO Serie A','CIRCOLO TENNIS CORREGGIO ASD','91010210358','Serie A','VEZZADINI DAVIDE','vezzadini77@gmail.com','334 6886932','1977-02-23','CORREGGIO','CORREGGIO','B.TERRACHINI 2','42015','CORREGGIO','REGGIO EMILIA','0522 637164','ctcorreggio@wansport.com','Via B. Terrachini 2, 42015 Correggio RE','Sabato','17:00 SOLO SABATO E DOMENICA','7d425b9a7e5fb27b622f0d6d734622bc'),
('aics2027_11','VILLAGE PADDLE MODENA','MODENA PADDLE CLUB SSDRL','03834490363','Serie B','ENZO ZARA','enzo.zara83@gmail.com','3397039671','1983-03-21','FORMIGINE (MO)','FORMIGINE (MO)','STRADA BELLARIA 127/1','41126','MODENA','MODENA','3512209713','tornei.villagepaddle@gmail.com','STRADA CAVEZZO 27,  41126 BAGGIOVARA (MO)','Domenica','15:00 SOLO SABATO E DOMENICA','197e17dbebc13cffca9f3e02098ba27b'),
('aics2027_12','B&B TEAM - Bope & Bullet','PADEL ARENA SRL','02906640343','Serie A + Serie B','NICOLA GROSSI','nicolagrossi659@gmail.com','3357443152','1965-07-24','PARMA','PARMA','Via Ernesto Ghirarduzzi 2','43122','PARMA','PARMA','+393534253475','proparmapadelarena@gmail.com','PRO GREEN STR. MARTINELLA 328 VIGATTO 43124 PR','Sabato','14:00 SOLO SABATO E DOMENICA','7ef1717ead2c959510ca1ad361968d7f'),
('aics2027_13','PRO PARMA LOBOS','PADEL ACCADEMY SSDRL','02913830341','Serie B','Davide Chierici','crociato68@gmail.com','3313534301','1968-02-18','Parma','Montechiarugolo','Via Ernesto Ghirarduzzi 2','43122','Parma','Parma','3534253475','proparmapadelarena@gmail.com','Via Ernesto Ghirarduzzi 2 (Parma) cap 43122','Venerdi','20:00 SOLO VENERDÌ','b7181140951230695d6ea142595d9c7b'),
('aics2027_14','PRO PARMA TIGERS','PADEL ACADEMY SSDRL','02913830341','Serie B','FABRIZIO VENTURINI','disossoventurini@gmail.com','3382666694','1972-09-29','PARMA','PARMA','ERNESTO GHIRARDUZZI, 2','43122','PARMA','PARMA','0521772686','proparmapadelarena@gmail.com','PARMA, VIA ERNESTO GHIRARDUZZI, 2 43122','Sabato','14:00 SOLO SABATO E DOMENICA','22220d9daa1a9bf4d66f92cb0038487a'),
('aics2027_15','Punto G Nera','ASD Punto G Padel','00702500349','Serie B','Massimo Bosi','mbosilavoro@gmail.com','3356690914','1969-10-31','Parma','Parma','Via Sonnino 21','43126','Parma','Parma','342 166 7082','segreteria@puntopadel.it','Via Sonnino 21 - 43126 Parma','Venerdi','20:00 SOLO VENERDÌ','482fc05e38f16e30b19346ad48f00e21'),
('aics2027_16','Punto G White','ASD Punto G Padel','00702500349','Serie B','Francesco Pizzi','francescopizzi80@gmail.com','3483616933','1980-02-18','San Secondo Parmense','Roccabianca','Via Sonnino 21','43126','Parma','Parma','342 166 7082','segreteria@puntopadel.it','Via Sonnino 21 - 43126 Parma','Venerdi','20:00 SOLO VENERDÌ','8e6e3ccf4f94c517c0ac869c1fbfe4c7'),
('aics2027_17','CANI SCIOLTI','PADEL CLUB REGGIOLO SRLSD','02949130351','Serie C','Gabriele Palmieri','gpalmieri@ag-informatica.com','3481520720','1968-05-24','Campagnola Emilia','Campagnola Emilia','Strada Gavello n.3','42046','Reggiolo','Reggio Emilia','3287469448','info@padelclubreggiolo.com','Strada Gavello n.3, Reggiolo (RE) 42046','Domenica','11:00 SOLO DOMENICA','9860922d476ad5fcefd8f2ba49ceb75d'),
('aics2027_18','PALA RBG CREW','RACQUET BALL GAMES SSDaRL','03121830354','Serie C','RINALDI MARCO','ing.rinaldi.marco@gmail.com','3337188334','1980-11-20','FORMIGINE (MO)','REGGIO EMILIA','VIA DEI PRATONIERI 7','42124','REGGIO EMILIA','REGGIO EMILIA','3275612828','racquetball@tim.it','VIA ERNESTO SPALLANZANI 8/A - 42124','Domenica','17:00 SOLO SABATO E DOMENICA','a4fe0e70c3a61f4ccdef016ea48943f1'),
('aics2027_19','PLAYA PADEL','PLAYA ASD','90054040366','Serie B + Serie C','FAGLIONI ENRICO','enricofaglioni70@gmail.com','3382130665','1970-09-14','MIRANDOLA (MO)','CAVEZZO (MO)','VIA IMPERIALE 22/A','41037','MIRANDOLA','MODENA','3382130665','measportsrl@gmail.com','Via imperiale 22/a 41037 Mirandola (MO)','Domenica','10:00 SOLO DOMENICA','7357a7a2dcc1b11c0ea6f3b6a4d7a8cc'),
('aics2027_20','ALL STAR PADEL -SERIE C','ALL STAR PADEL SSDRL','04028950360','Serie C','ENRICO LEONELLI','enrico.allstarpadel@gmail.com','3403669735','1979-01-21','BONDENO','BONDENO','VIA LAVACCHI 1635','41038','SAN FELICE SUL PANARO','MODENA','3395796474','amministrazione.allstarpadel@gmail.com','VIA LAVACCHI 1635, 41038 SAN FELICE SUL PANARO','Sabato','17:00 SOLO SABATO E DOMENICA','bd25d724f413b7895c5b251ad38d20a6'),
('aics2027_21','La quercia B','Ssd','02671840201','Serie B','Stefano Storchi','stefano_storchi@virgilio.it','3358433367','2026-07-30','Suzzara','Suzzara','Stradello Opi 7','46026','Suzzara','Mantova','3498698003','laquerciapadel@gmail.it','Stradello Opi 7 46029 suzzara','Sabato','15:00 SOLO SABATO E DOMENICA','321e31ec5dcc9ef11bd229e1effc4822'),
('aics2027_22','HORMIGA PADEL CLUB','ASD HORMIGA','CF 94212630365','Serie B','MAURO FIORANI','fioranimauro64@gmal.com','3358238780','1964-11-08','MODENA','MODENA','VIA PANARO 193','41056','SAVIGNANO SUL PANARO','MODENA','3240413208','hormigapadel@gmail.com','via panaro 193, Formica di Savignano sul Panaro','Domenica','11:00 SOLO DOMENICA','1d3ce08606b3a37d3a880a33af177711'),
('aics2027_23','Quercia C','Ssd','02671840201','Serie C','Stefano Storchi','stefano_storchi@virgilio.it','3358433367','2026-07-14','Suzzara','Mantova','Stradello Opi 7','46029','Suzzara','Mantova','3498698003','laquerciapadel@gmail.it','Stradello Opi 7 46029 suzzara','Sabato','14:00 SOLO SABATO E DOMENICA','9b652470e6cae54b99aba9e12013cba2'),
('aics2027_24','Padel San Donnino A','Padel San Donnino S.S.D a R.L.','04053390367','Serie C','Francesco Teoli','francesco.teoli09@gmail.com','3472612643','2002-10-01','Modena','Modena','Via della Genziana, 18','41126','Modena','Modena','3666358467','padelsandonnino@gmail.com','Via della Genziana, 18, 41126','Sabato','17:00 SOLO SABATO E DOMENICA','452df60bf8a25ddd65124021e140d479'),
('aics2027_25','Padel San Donnino B','Padel San Donnino S.S.D. a R.L.','04053390367','Serie C','Francesco Teoli','francesco.teoli09@gmail.com','3472612643','2002-10-01','Modena','Modena','Via della Genziana 18','41126','Modena','Modena','3666358467','padelsandonnino@gmail.com','Via della Genziana 18, 41126','Domenica','15:00 SOLO SABATO E DOMENICA','68c779bcfdb353fe25005b757bc49f13'),
('aics2027_26','Qui Pádel C','Qui Padel & Fun SSD','02674970203','Serie C','Emiliano Verolla','emilioverolla11@gmail.com','3458345177','1978-10-11','Formia LT','Carpi','G. Di Vittorio 49','46026','Quistello','MN','3458345177','quipadel@gmail.com','via Allende 7, 46026 Quistello MN','Domenica','15:00 SOLO SABATO E DOMENICA','26715c3fd053394ceb51c3c5579be8d8'),
('aics2027_27','EDEN ACADEMY SERIE C','EDEN SPORT & SALUTE','02310620352','Serie C','AUGUSTO AUBRY','augustoaubry@gmail.com','3405918068','1974-09-27','NAPOLI','SCANDIANO','VIA G.BALLA 6','42124','REGGIO EMILIA','RE','0522944244','info@edenbenessere.it','VIA G.BALLA 6 42124 REGGIO EMILIA','Domenica','17:00 SOLO SABATO E DOMENICA','cb5ff81c53eb60444a471cb80d6f2a27'),
('aics2027_28','BLUE PADEL CARPI C','BLUE PADEL CARPI','03955960368','Serie C','Maria Pia Calabrese','pia@maglificiolsm.com','3333208040','1991-09-30','carpi','carpi','PIAZZALE DELLE PISCINE 4','41012','CARPI','modena','MO','amministrazione.bluepadelcarpi@gmail.com','Piazzale delle piscine 4 carpi 41012','Sabato','15:00 SOLO SABATO E DOMENICA','fc74338b71f7af2969764bcb46af624c'),
('aics2027_29','BLUE PADEL CARPI B','BLUE PADEL CARPI','03955960368','Serie B','MARIA PIA CALABRESE','pia@maglificiolsm.com','3333208040','1991-09-30','CARPI','CARPI','PIAZZALE DELLE PISCINE 4','41012','CARPI','MODENA','3333208040','pia@maglificiolsm.com','PIAZZALE DELLE PISCINE 4 CARPI 41012','Venerdi','20:00 SOLO VENERDÌ','7d069a1fbf11a1d1a8a6d086ab0037fe')
on conflict (id) do update set
 team_name=excluded.team_name,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 series=excluded.series,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 updated_at=now();

-- L'amministratore può aprire un accesso con:
-- update public.championship_teams set access_enabled=true where id='aics2027_01';
-- e aprire la rosa con:
-- update public.championship_teams set roster_open=true where id='aics2027_01';

-- VERSIONE 5.2 - LINK GIOCATORI DISTINTO PER OGNI SQUADRA
alter table public.championship_teams add column if not exists player_invite_token text unique;
alter table public.championship_teams add column if not exists player_self_registration_enabled boolean not null default true;
alter table public.championship_roster_players add column if not exists registration_source text not null default 'captain';
alter table public.championship_roster_players add column if not exists privacy_accepted boolean not null default false;
alter table public.championship_roster_players add column if not exists regulation_accepted boolean not null default false;

update public.championship_teams
set player_invite_token=coalesce(player_invite_token, invite_token || 'player');

create unique index if not exists championship_teams_player_invite_token_idx
on public.championship_teams(player_invite_token);

create or replace function public.public_championship_team_for_roster(p_token text)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare t public.championship_teams;
begin
 select * into t from public.championship_teams where player_invite_token=p_token;
 if t.id is null then raise exception 'Link squadra non valido'; end if;
 if not t.roster_open or not t.player_self_registration_enabled then
   raise exception 'La raccolta della rosa non è ancora stata abilitata dall organizzazione';
 end if;
 return jsonb_build_object('id',t.id,'team_name',t.team_name,'club_legal_name',t.club_legal_name,'series',t.series);
end;
$$;

grant execute on function public.public_championship_team_for_roster(text) to anon, authenticated;

create or replace function public.submit_public_championship_roster_player(p_token text,p_player jsonb)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare t public.championship_teams; new_id uuid;
begin
 select * into t from public.championship_teams where player_invite_token=p_token;
 if t.id is null then raise exception 'Link squadra non valido'; end if;
 if not t.roster_open or not t.player_self_registration_enabled then
   raise exception 'La raccolta della rosa non è ancora aperta';
 end if;
 if (select count(*) from public.championship_roster_players where team_id=t.id) >= 20 then
   raise exception 'La rosa ha già raggiunto il limite di 20 giocatori';
 end if;
 if coalesce(trim(p_player->>'first_name'),'')='' or coalesce(trim(p_player->>'last_name'),'')='' or
    coalesce(trim(p_player->>'email'),'')='' or coalesce(trim(p_player->>'phone'),'')='' then
   raise exception 'Compila tutti i campi obbligatori';
 end if;
 if exists(select 1 from public.championship_roster_players where team_id=t.id and lower(email)=lower(p_player->>'email')) then
   raise exception 'Esiste già una richiesta con questa email per la squadra';
 end if;
 insert into public.championship_roster_players(
   team_id,first_name,last_name,birth_date,birth_place,postal_code,residence_town,residence_province,
   phone,email,photo_url,approval_status,registration_source,privacy_accepted,regulation_accepted
 ) values(
   t.id,trim(p_player->>'first_name'),trim(p_player->>'last_name'),nullif(p_player->>'birth_date','')::date,
   trim(p_player->>'birth_place'),trim(p_player->>'postal_code'),trim(p_player->>'residence_town'),
   upper(trim(p_player->>'residence_province')),trim(p_player->>'phone'),lower(trim(p_player->>'email')),
   nullif(p_player->>'photo_data',''),'pending','player_link',true,true
 ) returning id into new_id;
 return jsonb_build_object('ok',true,'id',new_id,'team_id',t.id,'status','pending');
end;
$$;

grant execute on function public.submit_public_championship_roster_player(text,jsonb) to anon, authenticated;

-- Per aprire una squadra dall'app, impostare entrambi i campi a true.
-- Esempio:
-- update public.championship_teams set roster_open=true, player_self_registration_enabled=true where id='aics2027_01';

-- VERSIONE 5.3 - LOGO SQUADRA
alter table public.championship_teams add column if not exists team_logo_url text;


-- VERSIONE 5.4 - RACCOLTA ROSE APERTA PER TUTTE LE SQUADRE
update public.championship_teams
set roster_open = true,
    player_self_registration_enabled = true,
    updated_at = now();
