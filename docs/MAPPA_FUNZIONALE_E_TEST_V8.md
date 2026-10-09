# Mappa funzionale V8 — base di lavoro

File di riferimento: `index-v8-lab-v8.2.38.62.html`  
Branch di lavoro: `v8-stability-hardening`  
Principio: nessuna funzione viene rimossa senza una verifica delle dipendenze e una prova di regressione.

## Aree individuate nel codice

### Avvio e stato
- `pamBootAuth`
- `freshState`
- `pamBootMinimalLocalCacheV82385`
- `pamPersistStateLocalV82381`
- `save`
- `pamCurrentNavState`
- `savePlayer`
- `saveResult`
- `initSimplePairs`
- `saveSimpleResult`
- `initEliminationFromRanking`
- `initElimination12`
- `initQuarterfinals16`
- `saveStageResult`
- `saveAuction`
- `pamRestoreUiV8212`
- `render`

### Cloud e persistenza
- `pamLoadTournamentAccess`
- `pamPersistStateLocalV82381`
- `pamScheduleCloudSync`
- `pamCloudSyncAll`
- `pamCloudSyncEvent`
- `pamSetConnectionState`
- `pamGetCloudCounts`
- `pamForceUploadLocal`
- `pamForceDownloadCloud`
- `pamCloudLoad`
- `pamCloudSyncManualMatchV823849`

### Giocatori e anagrafica
- `playerName`
- `pamImportEdenClients`
- `pamMergeDuplicateRegistryV8233`
- `pamRegistryEventPlayerIdsV823822`
- `pamRegistryFilteredV823822`
- `pamRegistryRenderV823822`
- `pamRegistrySelectFilteredV823822`
- `pamRegistryClearSelectionV823822`
- `pamRegistryRowsForExportV823822`
- `pamRegistryExportObjectsV823822`
- `pamRegistryPairObjectsV823822`
- `pamRegistryExportCsvV823822`
- `pamRegistryExportExcelV823822`
- `pamRegistryExportPdfV823822`
- `pamRegistryToolsHtmlV823822`
- `playersView`
- `savePlayer`
- `pamSaveQuickPlayer`
- `playerById`

### Tornei e calendario
- `buildMatches`
- `makeMatch`
- `pamRoundRobinPairMatchesV823862`
- `pamBuildNationalFixedPairsV823825`
- `pamNationalScheduleTasks`
- `pamNationalScheduleFingerprint`
- `pamBuildNationalSchedule`
- `pamBuildNationalFinalScheduleV823846`
- `pamEnsureNationalSchedule`
- `pamNationalScheduleNeedsReview`
- `pamRebuildNationalSchedule`
- `pamNationalScheduleAssignment`
- `eventView`
- `matchesView`
- `pamBuildNationalFinalBrackets`

### Risultati e classifiche
- `saveResult`
- `editResult`
- `standings`
- `standingsView`
- `saveSimpleResult`
- `pairStandings`
- `pairStandingsView`
- `pamFixedRanking`
- `pamSaveFixedFinalResult`

### Quote, gettoni e pagamenti
- `pamReconcileTokensV8232`
- `pamCertifiedTokenBalancesV8234`
- `pamLatestTokenBalanceV8234`
- `defaultPayments`
- `tokensView`
- `paymentsView`
- `pamFinalTokenBalanceFromEventV8216`

### Permessi e collaboratori
- `pamIsAdmin`
- `pamIsCollaborator`
- `pamApplyRole`
- `pamRestrictCollaboratorUI`
- `pamBootAuth`
- `pamCreateCollaboratorInvite`
- `pamLoadAdminRoster`


## Priorità pratiche

### P0 — Proteggere i dati
- [x] Correzione isolata in branch: il calendario non ricostruisce più l'elenco ufficiale dei partecipanti.
- [ ] Verificare i percorsi di salvataggio locale e cloud: cosa accade se la rete cade durante un salvataggio.
- [ ] Verificare import/export e deduplicazione anagrafica senza perdita di persone.
- [ ] Verificare risultati e classifiche prima e dopo sincronizzazione/ricaricamento.
- [ ] Verificare pagamenti, ricevute e gettoni prima e dopo sincronizzazione/ricaricamento.

### P1 — Rendere semplice il recupero
- [ ] Definire una procedura unica di snapshot e ripristino per ogni rilascio.
- [ ] Tenere ogni modifica in un commit piccolo e autonomo.
- [ ] Mantenere una lista dei test manuali essenziali per ogni area.

### P2 — Alleggerire senza perdere funzioni
- [ ] Cercare codice duplicato e funzioni obsolete con analisi statica e verifica degli usi dinamici.
- [ ] Separare gradualmente logica di dominio e interfaccia solo dopo aver mappato i punti d'ingresso.
- [ ] Evitare di eliminare funzioni basandosi soltanto sul conteggio testuale delle occorrenze.

## Checklist di verifica prima di accettare una modifica
1. La pagina si carica senza errori.
2. Si può aprire, modificare e salvare un evento.
3. L'elenco iscritti non cambia dopo la rigenerazione/visualizzazione del calendario.
4. Risultati e classifiche restano coerenti dopo ricaricamento.
5. Pagamenti/gettoni restano coerenti dopo ricaricamento.
6. Accessi admin e collaboratore mantengono i rispettivi limiti.
7. Import/export conserva i dati.
8. La versione precedente è ripristinabile dal commit Git.

## Limiti attuali dell'analisi
Questa è una mappa iniziale derivata dai nomi delle funzioni presenti nel file; non è ancora la prova che ogni percorso funzioni correttamente. I test richiedono esecuzione nel contesto reale dell'app e dati di prova controllati.
