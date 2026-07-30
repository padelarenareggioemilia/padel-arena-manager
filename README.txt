PADEL ARENA MANAGER 3.1 - ONLINE CON SUPABASE

ACCOUNT CONFIGURATI SU SUPABASE

ADMIN
Email: padelarenareggioemilia@gmail.com
Ruolo: admin

COLLABORATORI
Email: collaboratori@padelarena.it
Ruolo: collaborator

NOVITÀ VERSIONE 3.1
- Sincronizzazione differenziata per ruolo.
- L'Admin sincronizza tornei e archivio giocatori.
- Il Collaboratore sincronizza soltanto il torneo aperto.
- Pulsante Aggiorna dati dentro ogni torneo.
- Indicatore CONNESSO/OFFLINE.
- Blocco delle sezioni amministrative per il Collaboratore.
- Tornei condivisi tra PC, iPhone e altri dispositivi.
- Link diretto del singolo torneo.
- Duplica torneo, logo torneo e foto giocatori.
- Regola Rodeo senza coppie di compagni ripetute.

PUBBLICAZIONE SU GITHUB
1. Estrarre lo ZIP.
2. Nel repository GitHub eliminare o sostituire i vecchi file.
3. Caricare:
   - index.html
   - manifest.webmanifest
   - service-worker.js
   - README.txt
   - intera cartella assets
4. Eseguire Commit changes.
5. Attendere alcuni minuti.
6. Aprire il sito in Safari e verificare:
   Versione attiva: 3.1 · sincronizzazione collaboratori

IMPORTANTE SU IPHONE
Se l'app installata continua a mostrare la vecchia versione:
1. Eliminare soltanto l'icona dell'app dalla schermata Home.
2. Aprire il link con Safari.
3. Verificare la versione 3.1.
4. Condividi → Aggiungi alla schermata Home.


VERSIONE 3.2 - ARCHIVIO UNICO ONLINE
- Pannello Archivio condiviso nella Home.
- Conteggio giocatori e tornei locali e online.
- Pulsante Carica questo dispositivo online, disponibile solo all'Admin.
- Pulsante Scarica archivio online.
- Migrazione manuale sicura dei dati presenti sull'iPhone.
- Migliore contrasto grafico.
- Eliminazione dei tornei sincronizzata anche su Supabase.

PROCEDURA CONSIGLIATA
1. Pubblicare la versione 3.2 su GitHub.
2. Aprire l'app installata sull'iPhone, dove sono presenti i dati storici.
3. Accedere come Admin.
4. Nella Home premere Carica questo dispositivo online.
5. Dal PC premere Scarica archivio online.
6. Verificare che i conteggi locali e online coincidano.


VERSIONE 3.3
- Durata effettiva partita/timer separata dall'intervallo tra gli inizi.
- Esempio supportato: timer 15 minuti, nuova partita ogni 20 minuti.
- Modifica dei dati di un torneo già creato.
- Gestione partecipanti: aggiungi, togli, rinomina e rigenera le partite.
- La rigenerazione cancella partite, risultati, timer e fasi finali del torneo, dopo conferma.
- Algoritmo Rodeo: divieto assoluto di ripetere la stessa coppia di compagni.
- Massima priorità alla variazione degli avversari.
- Controllo qualità abbinamenti visibile nella sezione Partite.
- Nomi bianchi ad alto contrasto nell'app.
- Nomi neri ad alto contrasto nel PDF.


VERSIONE 3.3.1
- Corretto errore eTimerDuration durante la generazione dei tornei.
- Visualizzati correttamente i due campi:
  1. durata effettiva partita / timer;
  2. intervallo tra gli inizi delle partite.
- Corretti anche i cambi di formato e categoria.
- Aggiunta compatibilità di sicurezza con eventuali dati in cache.


VERSIONE 3.3.2
- Corretto errore Supabase: share_token nullo durante la sincronizzazione.
- Ogni torneo riceve subito un codice di condivisione UUID valido.
- Corretta la migrazione dei tornei creati nelle versioni precedenti.
- Corretta la duplicazione: ogni copia riceve un link diverso.
- Upsert Supabase configurato per non trasformare campi mancanti in NULL.
- La dicitura OFFLINE diventa NON SINCRONIZZATO quando il database non risponde.


VERSIONE 3.4
- Nuova anagrafica rapida direttamente nella creazione del torneo.
- Nuova anagrafica rapida nella gestione partecipanti di un torneo esistente.
- Il nuovo giocatore viene salvato anche nell'anagrafica generale.
- Pulsante Sostituisci per ogni partecipante già selezionato.
- Sostituzione con un giocatore già esistente.
- Sostituzione creando contestualmente una nuova anagrafica.
- Controllo duplicati per nome e cognome.
- Nei tornei esistenti, dopo la sostituzione occorre confermare la rigenerazione
  delle partite per applicare il nuovo elenco partecipanti.


VERSIONE 3.4.1
- Corretto il caso: togli un giocatore, poi crei una nuova anagrafica.
- La selezione corrente viene ora salvata prima di aprire la nuova anagrafica.
- Il giocatore deselezionato non ricompare più automaticamente.
- Corretta la sostituzione con giocatore esistente o nuovo.
- Aggiunto conteggio live dei partecipanti selezionati nel modal.
- Messaggio di errore più chiaro quando il numero di partecipanti non è valido.


VERSIONE 4.0 - IDENTITÀ DINAMICA
- Unico marchio principale: Padel Arena Manager.
- Nuovo logo come icona iPhone, icona PWA, intestazione e PDF.
- Tema base blu notte, blu elettrico, verde fluo e bianco.
- Club ed enti mostrati soltanto in forma secondaria.
- Colori dinamici per Padel Arena, Eden, Happy Time, AICS e CUPRA.
- Quando si apre o si crea un torneo, l'interfaccia riprende il colore del club/ente.
- PDF con logo Padel Arena Manager dominante e logo del club ospitante secondario.
- Home riprogettata con identità software professionale.


VERSIONE 4.1
- Indirizzo libero per AICS, Padel Arena e CUPRA.
- Format visualizzati in maiuscolo e senza parentesi.
- Nei tornei a coppie ogni giocatore viene iscritto singolarmente o in coppia.
- Il partner può essere scelto dall'anagrafica o creato al momento.
- Le coppie dichiarate vengono mantenute nella generazione.


VERSIONE 4.1.1
- Aggiunto pulsante DESELEZIONA TUTTI nella scelta dei partecipanti.
- Aggiunto pulsante MOSTRA SOLO SELEZIONATI.
- Quando il filtro è attivo, il pulsante diventa MOSTRA TUTTI I GIOCATORI.
- Aggiunto conteggio sempre visibile dei giocatori selezionati.
- Deseleziona tutti azzera anche le registrazioni singole/coppia dei tornei a coppie.


VERSIONE 4.2 - FASI FINALI AVANZATE COPPIE FISSE
- Scelta tra classifica generale e classifica divisa per gironi.
- Qualificazione di 2, 4, 8, 16 oppure tutte le coppie.
- Preliminari automatici quando il numero delle qualificate non è una potenza di due.
- Modalità CLASSICHE.
- Modalità GOLD E SILVER.
- Modalità GOLD, SILVER E BRONZE.
- Incroci automatici per teste di serie: prima contro ultima, seconda contro penultima.
- Generazione automatica di ottavi, quarti, semifinali e finale.
- Inserimento, modifica e propagazione automatica dei risultati.
- Visualizzazione dei vincitori di ciascun tabellone.
- Possibilità di azzerare e rigenerare le fasi finali.


VERSIONE 4.3 - ISCRIZIONI PUBBLICHE SENZA PASSWORD
- Nuovo link pubblico per iscriversi senza account.
- Ricerca giocatore digitando anche solo una parte di nome o cognome.
- Il visitatore vede esclusivamente nome e cognome dei risultati trovati.
- Nuova registrazione autonoma con campi obbligatori:
  nome, cognome, data e luogo di nascita, CAP, comune e provincia di residenza,
  telefono ed email.
- Sesso, livello e note restano facoltativi.
- Iscrizione individuale oppure con partner.
- Anche il partner può essere cercato in anagrafica oppure registrato da zero.
- Il cliente non può modificare torneo, giocatori, risultati o altre iscrizioni.
- Nuova sezione amministrativa “Iscrizioni ricevute”.
- Possibilità di importare gli iscritti nel torneo.
- Per attivare il sistema eseguire SUPABASE_ISCRIZIONI_PUBBLICHE.sql nel SQL Editor di Supabase.


VERSIONE 4.3.1 - RICHIESTE DI ISCRIZIONE
- Script Supabase corretto per ID TEXT.
- Richieste da valutare prima dell’inserimento nel torneo.
- Azioni amministratore: ACCETTA, RIFIUTA, LISTA D’ATTESA.
- Creazione dei nuovi giocatori soltanto quando la richiesta viene accettata.
- Inserimento automatico dei giocatori accettati tra i partecipanti.
- Memorizzazione automatica della coppia nei tornei a coppie fisse.
- Capienza configurabile per ogni torneo.
- Nuove richieste in lista d’attesa quando la capienza è raggiunta.
- Il visitatore non può modificare alcun dato del gestionale.
- Eseguire esclusivamente SUPABASE_ISCRIZIONI_PUBBLICHE_431.sql.
