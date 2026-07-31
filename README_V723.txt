PADEL ARENA MANAGER 7.2.3 - CAMPI SIMULTANEI

Correzione prioritaria del generatore Rodeo:
- evita che lo stesso giocatore sia assegnato a due partite dello stesso turno;
- cerca prima calendari che riempiono contemporaneamente tutti i campi disponibili;
- penalizza fortemente combinazioni che creano colli di bottiglia negli ultimi turni;
- mantiene come priorità assoluta il divieto di ripetere la stessa coppia di compagni;
- varia gli avversari il più possibile.

Per applicare: sostituire tutti i file su GitHub, incluso service-worker.js.
Non serve eseguire SQL su Supabase.

IMPORTANTE: la correzione si applica ai nuovi tornei o alle partite rigenerate dall'amministratore.
I tornei già in corso non vengono modificati automaticamente per non perdere risultati.
