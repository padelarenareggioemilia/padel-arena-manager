# V8 — Colonna vertebrale, stabilità e recupero

## Obiettivo
Alleggerire e rendere più affidabile la V8 senza perdere funzioni, dati, permessi o grafica. Ogni modifica deve poter essere annullata in modo semplice e verificabile.

## Regole non negoziabili
1. Non modificare direttamente `main` durante sviluppo e verifica.
2. Una modifica funzionale per commit, con messaggio che descrive il comportamento cambiato.
3. Prima di ogni intervento sul file applicativo, salvare la versione precedente tramite Git (commit/branch) e annotare SHA e percorso.
4. Non eliminare funzioni solo perché hanno una sola occorrenza testuale: possono essere richiamate da HTML inline, eventi, nomi costruiti dinamicamente o integrazioni.
5. Nessuna migrazione di dati o schema Supabase senza procedura di compatibilità e ripristino.
6. Se un controllo fallisce, fermarsi e ripristinare l'ultimo commit verificato; non accumulare correzioni sopra un errore.
7. Le modifiche devono essere piccole, isolate e verificabili. Niente riscrittura totale in un unico passaggio.

## Colonna vertebrale proposta
- **Avvio e configurazione:** controlla ambiente, configurazione e dipendenze prima di inizializzare l'interfaccia.
- **Stato applicativo:** un solo punto riconosciuto per leggere e aggiornare lo stato; evitare copie divergenti.
- **Persistenza:** separare lettura, validazione, salvataggio locale e sincronizzazione cloud; un errore cloud non deve cancellare dati locali validi.
- **Registro funzioni:** elenco delle aree e dei punti d'ingresso usati da pulsanti, callback, import/export e integrazioni, per evitare rimozioni accidentali.
- **Funzioni di dominio:** partecipanti, eventi/tornei, calendari, risultati/classifiche, pagamenti/ricevute, collaboratori/permessi.
- **Interfaccia:** mantenere DOM, nomi dei controlli e comportamento visibile compatibili.
- **Diagnostica e recupero:** errori chiari, controlli d'integrità e procedura per tornare al commit precedente.

Questa è una direzione architetturale: non estrarre ancora i moduli in file separati finché i punti d'ingresso e le dipendenze non sono mappati.

## Prima anomalia da correggere
La funzione `pamRepairEventPlayerIdsFromMatches(e)` ricostruiva `e.playerIds` usando gli ID presenti nelle partite quando ne trovava almeno quattro. Un calendario parziale o vecchio poteva quindi sostituire l'elenco ufficiale degli iscritti. La correzione proposta conserva `e.playerIds` e deduplica solo gli ID identici.

## Piano di lavoro
1. **Inventario senza modifiche:** mappare avvio, stato, salvataggi, sincronizzazione, permessi e punti d'ingresso di ogni area.
2. **Test di riferimento:** annotare e verificare scenari esistenti prima di cambiare il codice.
3. **Correzioni ad alto rischio dati:** una alla volta, con test mirati.
4. **Riduzione sicura:** eliminare duplicazioni solo dopo ricerca di tutti gli usi statici e dinamici.
5. **Modularizzazione graduale:** solo dopo inventario e test; mantenere una versione funzionante dopo ogni passaggio.
6. **Convalida finale:** nessuna regressione nota, confronto con la versione base e prova di ripristino.

## Come recuperare una versione
- Ogni sviluppo avviene su un branch dedicato.
- Per annullare una modifica, usare `git revert <commit>` oppure ripristinare il file dal commit/branch noto, mai cancellare la cronologia.
- Per ripristinare una singola funzione, recuperare la versione precedente del file dal commit Git, confrontare la funzione e reinserirla con le sue dipendenze; non copiare alla cieca una funzione isolata.
- Non pubblicare in `main` fino alla revisione e ai test.
- Conservare la versione base e il branch di lavoro come riferimenti di ripristino.

## Stato corrente
- File applicativo principale: `index-v8-lab-v8.2.38.62.html`.
- La correzione della lista partecipanti è su `v8-stability-hardening`, non su `main`.
- Pull request di revisione: #1.
- Nessuna eliminazione di funzioni eseguita.
