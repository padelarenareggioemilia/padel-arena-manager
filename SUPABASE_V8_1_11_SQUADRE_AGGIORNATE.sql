-- PADEL ARENA MANAGER V8.1.11 - AGGIORNAMENTO SQUADRE AICS AL 1 AGOSTO 2026
-- Aggiorna i dati delle squadre senza cancellare loghi, accessi, rose o link già attivi.

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_01','FIFTEEN RACQUET CLUB','Serie B','FIFTEEN RACQUET CLUB','03127460347','VIA RENZO PEZZANI 47A','43029','TRAVERSETOLO','PARMA','3488204373','nicola77.fagetti@gmail.com','VIA RENZO PEZZANI 47 43029 TRAVERSETOLO (PR)','Domenica','14:00 SOLO SABATO E DOMENICA','GOFFREDO GATTI','goffredo.gatti@gmail.com','334/6260938','1969-07-02'::date,'PARMA','SAN POLO D''ENZA','eb641f337adbd7e419b29c653e1d3b2b','eb641f337adbd7e419b29c653e1d3b2bplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_02','CA''MARTA squadra A','Serie B','Ca''Marta sport&fun ssd a rl','03384630368','via Regina Pacis 118','41049','Ssasuolo','modena','0536812923','tommyvale99@gmail.com','Sassuolo Via Regina Pacis 118 (mo)','Sabato','14:00 SOLO SABATO E DOMENICA','Dignatici Luca','lucadignatici@hotmail.com','3357536953','1973-11-18'::date,'Sassuolo','Sassuolo','1e5c655dd0b65dae1543cb557e1c1f5d','1e5c655dd0b65dae1543cb557e1c1f5dplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_03','CA''MARTA squadra B','Serie C','CA''MARTA SPORT&FUN SSD A RL UNI','03384630368','VIA REGINA PACIS 118','41049','SASSUOLO','MODENA','0536 812923','tommyvale99@gmail.com','SASSUOLO VIA REGINA PACIS 118 (mo)','Sabato','14:00 SOLO SABATO E DOMENICA','VALENTI TOMMASO','tommyvale99@gmail.com','3426480454','1989-09-21'::date,'CARPI','CARPI','f82739604639840f3993414517315476','f82739604639840f3993414517315476player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_04','CA''MARTA squadra C','Serie C','Ca''Marta sport&fun ssd a rl uni','03384630368','Regina Pacis 118','41049','Sassuolo','MODENA','0536812923','tommyvale99@gmail.com','SASSUOLO VIA REGINA PACIS 118 (MO)','Sabato','16:00 SOLO SABATO E DOMENICA','CANALI MATTEO','mcanali83@gmail.com','3282280304','1983-11-17'::date,'Sassuolo','Prignano s/s (MO)','27a2f7521b705337255ac794e591d916','27a2f7521b705337255ac794e591d916player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_05','Pol Nonantola Padel','Serie C','Polisportiva Nonantola A.D.','80015050364','Via Mazzini 34','41015','Nonantola','Modena','3479565881','polnonantola.padel@gmail.com','Via Risorgimento 50, 41015 Nonantola','Venerdi','20:00 SOLO VENERDÌ','Marco Meschiari','marco.meschiari81@gmail.com','3479565881','1981-09-15'::date,'Modena','Modena','9548bac08b29fc4b5b25f2cdced44122','9548bac08b29fc4b5b25f2cdced44122player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_06','Padel Prime La Patria Carpi','Serie C','S.G.La Patria 1879 ASD','90003660363','Via Nuova Ponente 24/H','41012','Carpi','Modena','059644070','amministrazione.lapatria@gmail.com','Via Nuova Ponente 24/H, 41012, Carpi (MO)','Sabato','14:00 SOLO SABATO E DOMENICA','Marco Gradellini','marco.grade@gmail.com','3467192364','1993-01-05'::date,'Carpi','Carpi','8968637df0729fb0ca7daa67ed41cf26','8968637df0729fb0ca7daa67ed41cf26player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_07','CT CORREGGIO 2','Serie B','Circolo Tennis Correggio ASD','91010210358','via Bruto Terrachini 2','42015','Correggio','Reggio Emilia','0522637164','direzione@ctcorreggio.it','via Bruto Terrachini 2 - 42015 Correggio (RE)','Sabato','14:00 SOLO SABATO E DOMENICA','Maurizio Musso','elemaeri@alice.it','3470887572','1972-07-11'::date,'Asti','Correggio','be07b2c3818295a3b08cdbf40536a6da','be07b2c3818295a3b08cdbf40536a6daplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_08','Phoenix Cavriago','Serie B','ASD Phoenix Cavriago','02500230350','Via Torre n.3','42025','Cavriago','REGGIO NELL''EMILIA','3478979048','rocchi.marco@ognibene.com','Via Cantonazzo n.1, Cavriago 42025','Sabato','16:00 SOLO SABATO E DOMENICA','Zecchetti Patrick','patrickz@libero.it','3498945499','1990-09-07'::date,'Montecchio Emilia','Cavriago (RE) - 42025','ef291d90603a3e6407cd3b444ee7f38d','ef291d90603a3e6407cd3b444ee7f38dplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_09','MIRAPADEL CENTER','Serie C','MIRAPADEL CENTER','04023790365','VIA 2 GIUGNO 26','41037','MIRANDOLA','MODENA','3428340667','info@mirapadelcenter.it','VIA 2 GIUGNO 26, 41037 MIRANDOLA (MO)','Domenica','15:00 SOLO SABATO E DOMENICA','LAGONEGRO ROSARIO','info@mirapadelcenter.it','3406686972','1976-11-15'::date,'MILANO','MIRANDOLA','be928a8283eba98180f5c62164f1e838','be928a8283eba98180f5c62164f1e838player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_10','CT CORREGGIO Serie A','Serie A','CIRCOLO TENNIS CORREGGIO ASD','91010210358','B.TERRACHINI 2','42015','CORREGGIO','REGGIO EMILIA','0522 637164','ctcorreggio@wansport.com','Via B. Terrachini 2, 42015 Correggio RE','Sabato','17:00 SOLO SABATO E DOMENICA','VEZZADINI DAVIDE','vezzadini77@gmail.com','334 6886932','1977-02-23'::date,'CORREGGIO','CORREGGIO','7d425b9a7e5fb27b622f0d6d734622bc','7d425b9a7e5fb27b622f0d6d734622bcplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_11','VILLAGE PADDLE MODENA','Serie B','MODENA PADDLE CLUB SSDRL','03834490363','STRADA BELLARIA 127/1','41126','MODENA','MODENA','3512209713','tornei.villagepaddle@gmail.com','STRADA CAVEZZO 27,  41126 BAGGIOVARA (MO)','Domenica','15:00 SOLO SABATO E DOMENICA','ENZO ZARA','enzo.zara83@gmail.com','3397039671','1983-03-21'::date,'FORMIGINE (MO)','FORMIGINE (MO)','197e17dbebc13cffca9f3e02098ba27b','197e17dbebc13cffca9f3e02098ba27bplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_12','B&B TEAM - Bope & Bullet','Serie A + Serie B','PADEL ARENA SRL','02906640343','Via Ernesto Ghirarduzzi 2','43122','PARMA','PARMA','+393534253475','proparmapadelarena@gmail.com','PRO GREEN STR. MARTINELLA 328 VIGATTO 43124 PR','Sabato','14:00 SOLO SABATO E DOMENICA','NICOLA GROSSI','nicolagrossi659@gmail.com','3357443152','1965-07-24'::date,'PARMA','PARMA','7ef1717ead2c959510ca1ad361968d7f','7ef1717ead2c959510ca1ad361968d7fplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_13','PRO PARMA LOBOS','Serie B','PADEL ACCADEMY SSDRL','02913830341','Via Ernesto Ghirarduzzi 2','43122','Parma','Parma','3534253475','proparmapadelarena@gmail.com','Via Ernesto Ghirarduzzi 2 (Parma) cap 43122','Venerdi','20:00 SOLO VENERDÌ','Davide Chierici','crociato68@gmail.com','3313534301','1968-02-18'::date,'Parma','Montechiarugolo','b7181140951230695d6ea142595d9c7b','b7181140951230695d6ea142595d9c7bplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_14','PRO PARMA TIGERS','Serie B','PADEL ACADEMY SSDRL','02913830341','ERNESTO GHIRARDUZZI, 2','43122','PARMA','PARMA','0521772686','proparmapadelarena@gmail.com','PARMA, VIA ERNESTO GHIRARDUZZI, 2 43122','Sabato','14:00 SOLO SABATO E DOMENICA','FABRIZIO VENTURINI','disossoventurini@gmail.com','3382666694','1972-09-29'::date,'PARMA','PARMA','22220d9daa1a9bf4d66f92cb0038487a','22220d9daa1a9bf4d66f92cb0038487aplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_15','Punto G Nera','Serie B','ASD Punto G Padel','00702500349','Via Sonnino 21','43126','Parma','Parma','342 166 7082','segreteria@puntopadel.it','Via Sonnino 21 - 43126 Parma','Venerdi','20:00 SOLO VENERDÌ','Massimo Bosi','mbosilavoro@gmail.com','3356690914','1969-10-31'::date,'Parma','Parma','482fc05e38f16e30b19346ad48f00e21','482fc05e38f16e30b19346ad48f00e21player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_16','Punto G White','Serie B','ASD Punto G Padel','00702500349','Via Sonnino 21','43126','Parma','Parma','342 166 7082','segreteria@puntopadel.it','Via Sonnino 21 - 43126 Parma','Venerdi','20:00 SOLO VENERDÌ','Francesco Pizzi','francescopizzi80@gmail.com','3483616933','1980-02-18'::date,'San Secondo Parmense','Roccabianca','8e6e3ccf4f94c517c0ac869c1fbfe4c7','8e6e3ccf4f94c517c0ac869c1fbfe4c7player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_17','CANI SCIOLTI','Serie C','PADEL CLUB REGGIOLO SRLSD','02949130351','Strada Gavello n.3','42046','Reggiolo','Reggio Emilia','3287469448','info@padelclubreggiolo.com','Strada Gavello n.3, Reggiolo (RE) 42046','Domenica','11:00 SOLO DOMENICA','Gabriele Palmieri','gpalmieri@ag-informatica.com','3481520720','1968-05-24'::date,'Campagnola Emilia','Campagnola Emilia','9860922d476ad5fcefd8f2ba49ceb75d','9860922d476ad5fcefd8f2ba49ceb75dplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_18','PALA RBG CREW','Serie C','RACQUET BALL GAMES SSDaRL','03121830354','VIA DEI PRATONIERI 7','42124','REGGIO EMILIA','REGGIO EMILIA','3275612828','racquetball@tim.it','VIA ERNESTO SPALLANZANI 8/A - 42124','Domenica','17:00 SOLO SABATO E DOMENICA','RINALDI MARCO','ing.rinaldi.marco@gmail.com','3337188334','1980-11-20'::date,'FORMIGINE (MO)','REGGIO EMILIA','a4fe0e70c3a61f4ccdef016ea48943f1','a4fe0e70c3a61f4ccdef016ea48943f1player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_19','PLAYA PADEL','Serie B + Serie C','PLAYA ASD','90054040366','VIA IMPERIALE 22/A','41037','MIRANDOLA','MODENA','3382130665','measportsrl@gmail.com','Via imperiale 22/a 41037 Mirandola (MO)','Domenica','10:00 SOLO DOMENICA','FAGLIONI ENRICO','enricofaglioni70@gmail.com','3382130665','1970-09-14'::date,'MIRANDOLA (MO)','CAVEZZO (MO)','7357a7a2dcc1b11c0ea6f3b6a4d7a8cc','7357a7a2dcc1b11c0ea6f3b6a4d7a8ccplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_20','ALL STAR PADEL -SERIE C','Serie C','ALL STAR PADEL SSDRL','04028950360','VIA LAVACCHI 1635','41038','SAN FELICE SUL PANARO','MODENA','3395796474','amministrazione.allstarpadel@gmail.com','VIA LAVACCHI 1635, 41038 SAN FELICE SUL PANARO','Sabato','17:00 SOLO SABATO E DOMENICA','ENRICO LEONELLI','enrico.allstarpadel@gmail.com','3403669735','1979-01-21'::date,'BONDENO','BONDENO','bd25d724f413b7895c5b251ad38d20a6','bd25d724f413b7895c5b251ad38d20a6player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_21','La quercia B','Serie B','Ssd','02671840201','Stradello Opi 7','46026','Suzzara','Mantova','3498698003','laquerciapadel@gmail.it','Stradello Opi 7 46029 suzzara','Sabato','15:00 SOLO SABATO E DOMENICA','Stefano Storchi','stefano_storchi@virgilio.it','3358433367','2026-07-30'::date,'Suzzara','Suzzara','321e31ec5dcc9ef11bd229e1effc4822','321e31ec5dcc9ef11bd229e1effc4822player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_22','HORMIGA PADEL CLUB','Serie B','ASD HORMIGA','CF 94212630365','VIA PANARO 193','41056','SAVIGNANO SUL PANARO','MODENA','3240413208','hormigapadel@gmail.com','via panaro 193, Formica di Savignano sul Panaro','Domenica','11:00 SOLO DOMENICA','MAURO FIORANI','fioranimauro64@gmal.com','3358238780','1964-11-08'::date,'MODENA','MODENA','1d3ce08606b3a37d3a880a33af177711','1d3ce08606b3a37d3a880a33af177711player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_23','Quercia C','Serie C','Ssd','02671840201','Stradello Opi 7','46029','Suzzara','Mantova','3498698003','laquerciapadel@gmail.it','Stradello Opi 7 46029 suzzara','Sabato','14:00 SOLO SABATO E DOMENICA','Stefano Storchi','stefano_storchi@virgilio.it','3358433367','2026-07-14'::date,'Suzzara','Mantova','9b652470e6cae54b99aba9e12013cba2','9b652470e6cae54b99aba9e12013cba2player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_24','Padel San Donnino A','Serie C','Padel San Donnino S.S.D a R.L.','04053390367','Via della Genziana, 18','41126','Modena','Modena','3666358467','padelsandonnino@gmail.com','Via della Genziana, 18, 41126','Sabato','17:00 SOLO SABATO E DOMENICA','Francesco Teoli','francesco.teoli09@gmail.com','3472612643','2002-10-01'::date,'Modena','Modena','452df60bf8a25ddd65124021e140d479','452df60bf8a25ddd65124021e140d479player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_25','Padel San Donnino B','Serie C','Padel San Donnino S.S.D. a R.L.','04053390367','Via della Genziana 18','41126','Modena','Modena','3666358467','padelsandonnino@gmail.com','Via della Genziana 18, 41126','Domenica','15:00 SOLO SABATO E DOMENICA','Francesco Teoli','francesco.teoli09@gmail.com','3472612643','2002-10-01'::date,'Modena','Modena','68c779bcfdb353fe25005b757bc49f13','68c779bcfdb353fe25005b757bc49f13player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_26','Qui Pádel C','Serie C','Qui Padel & Fun SSD','02674970203','G. Di Vittorio 49','46026','Quistello','MN','3458345177','quipadel@gmail.com','via Allende 7, 46026 Quistello MN','Domenica','15:00 SOLO SABATO E DOMENICA','Emiliano Verolla','emilioverolla11@gmail.com','3458345177','1978-10-11'::date,'Formia LT','Carpi','26715c3fd053394ceb51c3c5579be8d8','26715c3fd053394ceb51c3c5579be8d8player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_27','EDEN ACADEMY SERIE C','Serie C','EDEN SPORT & SALUTE','02310620352','VIA G.BALLA 6','42124','REGGIO EMILIA','RE','0522944244','info@edenbenessere.it','VIA G.BALLA 6 42124 REGGIO EMILIA','Domenica','17:00 SOLO SABATO E DOMENICA','AUGUSTO AUBRY','augustoaubry@gmail.com','3405918068','1974-09-27'::date,'NAPOLI','SCANDIANO','cb5ff81c53eb60444a471cb80d6f2a27','cb5ff81c53eb60444a471cb80d6f2a27player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_28','BLUE PADEL CARPI C','Serie C','BLUE PADEL CARPI','03955960368','PIAZZALE DELLE PISCINE 4','41012','CARPI','modena','MO','amministrazione.bluepadelcarpi@gmail.com','Piazzale delle piscine 4 carpi 41012','Sabato','15:00 SOLO SABATO E DOMENICA','Maria Pia Calabrese','pia@maglificiolsm.com','3333208040','1991-09-30'::date,'carpi','carpi','fc74338b71f7af2969764bcb46af624c','fc74338b71f7af2969764bcb46af624cplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_29','BLUE PADEL CARPI B','Serie B','BLUE PADEL CARPI','03955960368','PIAZZALE DELLE PISCINE 4','41012','CARPI','MODENA','3333208040','pia@maglificiolsm.com','PIAZZALE DELLE PISCINE 4 CARPI 41012','Venerdi','20:00 SOLO VENERDÌ','MARIA PIA CALABRESE','pia@maglificiolsm.com','3333208040','1991-09-30'::date,'CARPI','CARPI','7d069a1fbf11a1d1a8a6d086ab0037fe','7d069a1fbf11a1d1a8a6d086ab0037feplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_30','EDEN PDEL 1','Serie B','EDEN SPORT SCSD','02310620352','via G.Balla, 6','42124','Reggio nell''Emilia','REGGIO EMILIA','0522944244','corrado.verzini@gmail.com','via G.Balla 6 - Reggio nell''Emilia','Domenica','15:00 SOLO SABATO E DOMENICA','CORRADO VERZINI','corrado.verzini@gmail.com','3463904590','1973-07-07'::date,'TERNI','REGGIO NELL''EMILIA','9bfab7901c2ae5ed99959b4027397abd','9bfab7901c2ae5ed99959b4027397abdplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_31','ALL STAR PADEL - SERIE B','Serie B','ALL STAR PADEL SSDRL','04028950360','VIA LAVACCHI 1635','41038','SAN FELICE SUL PANARO','MODENA','3894563547','amministrazione.allstarpadel@gmail.com','VIA LAVACCHI 1635, 41038 SAN FELICE S/P (MO)','Sabato','14:00 SOLO SABATO E DOMENICA','ENRICO LEONELLI','enrico.allstarpadel@gmail.com','3403669735','1979-01-21'::date,'BONDENO (FE)','BONDENO (FE)','10f904a4cbe0b34d735e653c1ed50686','10f904a4cbe0b34d735e653c1ed50686player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_32','NEWPADEL SOLIERA B','Serie B','ASD NEWPADEL SOLIERA','90055660360','Via Scarlatti n° 58/a','41019','SOLIERA','MODENA','344 1350801','padel@newpadelsoliera.it','Via Scarlatti n° 58/a 41019 SOLIERA','Domenica','10:00 SOLO DOMENICA','CASTELLUCCI ANDREA','padel@newpadelsoliera.it','371 3165453','1970-05-10'::date,'COLLEFERRO ROMA','CORREGGIO','71c462f8131f867e1e272f622550c5f0','71c462f8131f867e1e272f622550c5f0player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_33','NEWPADEL SOLIERA C','Serie C','ASD NEWPADEL SOLIERA','90055660360','Via Scarlatti 58/a','41019','SOLIERA','MODENA','344 1350801','padel@padelsoliera.it','Via Scarlatti n° 58/a','Domenica','10:00 SOLO DOMENICA','CASTELLUCCI ANDREA','padel@newpadelsoliera.it','371 31654543','1970-05-10'::date,'COLLEFERRO ROMA','CORREGGIO','e9c93d9a8147d7e49deeaef0a912a8d7','e9c93d9a8147d7e49deeaef0a912a8d7player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_34','PUNTO G GREY','Serie C','ASD PUNTO G PADEL','00702500349','Via Sonnino 21','43126','PARMA','PARMA','342 166 7082','segreteria@puntopadel.it','Via Sonnino 21 43126 Parma','Sabato','17:00 SOLO SABATO E DOMENICA','Cagnin Andrea','ilcagno@gmail.com','3351831590','1968-01-25'::date,'Parma','Montechiarugolo','a7481e02c0e6beec0db2ae1b7533c2e2','a7481e02c0e6beec0db2ae1b7533c2e2player',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();

insert into public.championship_teams
(id,team_name,series,club_legal_name,club_tax_id,club_address,club_postal_code,club_town,club_province,club_phone,club_email,home_court_address,home_day,home_time,captain_name,captain_email,captain_phone,captain_birth_date,captain_birth_place,captain_residence,invite_token,player_invite_token,access_enabled,roster_open,player_self_registration_enabled)
values ('aics2027_35','DOPPIO PADEL MOTTEGGIANA SERIE A','Serie A','Asd Doppio Padel Motteggina','02737930202','Ai Enrico Fermi 2','46020','MOTTEGGIANA','MN','3356053551','alessio@comesasnc.com','VIA ENRICO FERMI 2, 46020 MOTTEGGIANA (MN)','Sabato','16:00 SOLO SABATO E DOMENICA','Lipreri Alessio','alessio@comesasnc.com','3356053551','1972-07-26'::date,'Mantova','Luzzara','355a7e4be7767860b16e3a22e23cebde','355a7e4be7767860b16e3a22e23cebdeplayer',false,true,true)
on conflict (id) do update set
 team_name=excluded.team_name,
 series=excluded.series,
 club_legal_name=excluded.club_legal_name,
 club_tax_id=excluded.club_tax_id,
 club_address=excluded.club_address,
 club_postal_code=excluded.club_postal_code,
 club_town=excluded.club_town,
 club_province=excluded.club_province,
 club_phone=excluded.club_phone,
 club_email=excluded.club_email,
 home_court_address=excluded.home_court_address,
 home_day=excluded.home_day,
 home_time=excluded.home_time,
 captain_name=excluded.captain_name,
 captain_email=excluded.captain_email,
 captain_phone=excluded.captain_phone,
 captain_birth_date=excluded.captain_birth_date,
 captain_birth_place=excluded.captain_birth_place,
 captain_residence=excluded.captain_residence,
 updated_at=now();


drop function if exists public.public_championship_team_directory();

create or replace function public.public_championship_team_directory()
returns table(
 team_name text,
 club_legal_name text,
 home_court_address text,
 series text,
 captain_name text,
 captain_phone text,
 captain_email text,
 team_logo_url text
)
language sql
security definer
set search_path=public
as $$
 select
  t.team_name,
  t.club_legal_name,
  t.home_court_address,
  t.series,
  t.captain_name,
  t.captain_phone,
  t.captain_email,
  t.team_logo_url
 from public.championship_teams t
 order by
  case
   when t.series ilike '%Serie A%' then 1
   when t.series ilike '%Serie B%' then 2
   when t.series ilike '%Serie C%' then 3
   else 4
  end,
  t.team_name;
$$;

grant execute on function public.public_championship_team_directory() to authenticated;

notify pgrst, 'reload schema';
