PADEL ARENA MANAGER 8.0 - VERSIONE COMPLETA STABILE

Questa versione conserva il lavoro sviluppato fino alla 7.2.x:
- Admin e collaboratore con Supabase.
- Anagrafica giocatori, foto, gettoni e ricerca automatica.
- Torneo Builder salvabile anche senza iscritti.
- Link pubblico, iscrizioni, lista attesa, locandina e QR Code.
- Rodeo a gettoni, Rodeo semplice e coppie fisse.
- Timer, risultati, classifiche, pagamenti e PDF.
- Da 1 a 4 aste con saldo aggiornato.
- Eliminatoria 10 giocatori: 7°+10° contro 8°+9°.
- Protezione della compilazione: niente refresh durante Builder e aste.
- Campionato AICS 2027: Serie A/B/C, Coppa Italia e Supercoppa.
- Squadre ufficiali importate, portale capitani, loghi, rose, link giocatori e approvazioni.

PUBBLICAZIONE
1. Nel repository GitHub sostituire tutti i file con il contenuto di questa cartella.
2. Caricare anche l'intera cartella assets.
3. Eseguire un solo file in Supabase: PADEL_ARENA_MANAGER_SUPABASE_V8_COMPLETO.sql
4. Attendere GitHub Pages e riaprire Safari.
5. Se l'icona installata mantiene la vecchia cache, eliminarla dalla Home e reinstallarla da Safari.


CORREZIONE V8.0.1 SUPABASE
- Migrazione share_token compatibile con database precedenti in cui la colonna era UUID.
- Eliminazione delle vecchie funzioni RPC duplicate UUID/TEXT prima della ricreazione.
- Il file SQL resta unico, completo e non distruttivo.
