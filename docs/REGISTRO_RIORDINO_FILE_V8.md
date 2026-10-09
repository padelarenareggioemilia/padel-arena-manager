# Riordino file V8 — registro operativo

## Punto di ingresso attivo
- `index.html` reindirizza a `index-v8-lab-v8.2.38.63.html`.
- `index-v8-lab-v8.2.38.63.html` è un wrapper iframe.
- Il codice applicativo completo è in `index-v8-lab-v8.2.38.62.html`.
- La versione .62 è una fotografia storica del codice, non un file da eliminare mentre è il motore del wrapper .63.

## Doppioni confermati
- `index-v8-lab-v8.2.38.6.html` e `index-v8-lab-v8.2.38.33.html` erano wrapper identici (stesso blob SHA). Nel branch di riordino è stato rimosso solo `.6`; `.33` è conservato.
- Analisi statica del file applicativo .62: 503 funzioni rilevate dal parser leggero, nessun nome funzione duplicato e nessun corpo di funzione esattamente identico rilevato. Questo non esclude logiche simili ma scritte diversamente.

## File storici da conservare per ora
Le versioni numerate `.58`, `.59`, `.60`, `.61` e `.62` hanno dimensioni e hash differenti: sono revisioni evolutive, non duplicati byte-per-byte. Non cancellarle automaticamente. Sono utili per confronto e recupero.
Il file `.63` è un wrapper, non una copia del codice applicativo.

## Regole di consolidamento
1. Rimuovere solo file identici dopo aver controllato i riferimenti.
2. Non eliminare versioni storiche che differiscono nel contenuto.
3. Non unire funzioni solo perché hanno nomi simili: prima confrontare input, output, effetti collaterali e punti di chiamata.
4. Per ogni cambiamento al codice applicativo: branch separato, un obiettivo per commit, verifica e possibilità di ripristino.
5. Non modificare `main` durante il riordino.

## Stato
- Branch: `v8-stability-hardening`.
- Correzione protettiva partecipanti già presente nel branch.
- Pull request #1 ancora da verificare nel contesto reale.
- `main` non modificato dal lavoro di riordino.
