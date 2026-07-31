


const SUPABASE_URL="https://zxubwvtngyfebtfnvnwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_-KVcVuns55FvFMcjRdefxA_KJXUgYBO";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});
let PAM_SESSION=null;
let PAM_PROFILE=null;
let pamCloudReady=false;
let pamSyncTimer=null;
let pamRealtimeChannel=null;
let pamRemoteRefreshTimer=null;
let pamUploading=false;

function pamIsAdmin(){
 return PAM_PROFILE&&PAM_PROFILE.role==="admin";
}
function pamRoleLabel(){
 return pamIsAdmin()?"ADMIN · Francesco":"COLLABORATORE · Solo risultati";
}
function pamRenderLogin(message=""){
 document.getElementById("pamLoginOverlay")?.remove();
 const overlay=document.createElement("div");
 overlay.id="pamLoginOverlay";
 overlay.innerHTML=`<div class="pam-login-card">
  <h1>Padel Arena Manager</h1>
  <p>Accedi all'archivio online condiviso.</p>
  <form id="pamLoginForm">
   <label>Email</label>
   <input id="pamUsername" type="email" autocomplete="username" autocapitalize="none" placeholder="nome@dominio.it">
   <label>Password</label>
   <input id="pamPassword" type="password" autocomplete="current-password">
   <button type="submit">ACCEDI</button>
   <div id="pamLoginError">${message}</div>
  </form>
 </div>`;
 document.body.appendChild(overlay);
 document.getElementById("pamLoginForm").addEventListener("submit",pamLogin);
}
async function pamLogin(e){
 e.preventDefault();
 const email=document.getElementById("pamUsername").value.trim().toLowerCase();
 const password=document.getElementById("pamPassword").value;
 const err=document.getElementById("pamLoginError");
 err.textContent="Accesso in corso...";
 const {data,error}=await sb.auth.signInWithPassword({email,password});
 if(error||!data.session){
  err.textContent="Accesso non riuscito: "+(error?.message||"controlla email e password.");
  return;
 }
 await pamStartSession(data.session);
}
async function pamLogout(){
 await sb.auth.signOut();
 PAM_SESSION=null;PAM_PROFILE=null;pamCloudReady=false;
 if(pamRealtimeChannel){await sb.removeChannel(pamRealtimeChannel);pamRealtimeChannel=null}
 document.getElementById("pamRoleBadge")?.remove();
 document.getElementById("pamLogoutBtn")?.remove();
 pamRenderLogin();
}
async function pamGetProfile(user){
 const {data,error}=await sb.from("profiles").select("id,email,role,display_name").eq("id",user.id).maybeSingle();
 if(error)throw error;
 return data||{id:user.id,email:user.email,role:user.email.toLowerCase()==="padelarenareggioemilia@gmail.com"?"admin":"collaborator",display_name:user.email};
}
function pamApplyRole(){
 document.getElementById("pamRoleBadge")?.remove();
 document.getElementById("pamLogoutBtn")?.remove();
 const badge=document.createElement("div");
 badge.id="pamRoleBadge";
 badge.textContent=pamRoleLabel()+" · CONNESSO";
 document.body.appendChild(badge);
 const out=document.createElement("button");
 out.id="pamLogoutBtn";out.textContent="Esci";out.onclick=pamLogout;
 document.body.appendChild(out);
 pamRestrictCollaboratorUI();
}
function pamRestrictCollaboratorUI(){
 if(pamIsAdmin()||!PAM_SESSION)return;
 const forbidden=["anagrafica","gettoni","pagamenti","impostazioni","nuova competizione","crea torneo","genera competizione","elimina","configurazione","importa","esporta","asta","duplica","modifica torneo","carica logo"];
 document.querySelectorAll("button,a,[role='button']").forEach(el=>{
  const t=(el.textContent||"").trim().toLowerCase();
  if(forbidden.some(w=>t.includes(w)))el.style.display="none";
 });
}
async function pamStartSession(session){
 PAM_SESSION=session;
 try{
  PAM_PROFILE=await pamGetProfile(session.user);
  document.getElementById("pamLoginOverlay")?.remove();
  pamApplyRole();
  await pamCloudLoad(true);
  pamSubscribeRealtime();
  pamOpenSharedTournamentFromUrl();
  setTimeout(pamRefreshSyncPanel,100);
 }catch(err){
  console.error(err);
  await sb.auth.signOut();
  pamRenderLogin("Configurazione account incompleta: "+err.message);
 }
}
async function pamBootAuth(){
 const {data}=await sb.auth.getSession();
 if(data.session)await pamStartSession(data.session);
 else pamRenderLogin();
 sb.auth.onAuthStateChange(function(event,session){
  if(event==="SIGNED_OUT"&&!session)pamRenderLogin();
 });
}


const KEY="pam_v040";
const SEEDED_PLAYERS=[
 {firstName:"Andrea",lastName:"Spina",gender:"Maschile",tokenBalance:3},
 {firstName:"Antonio",lastName:"Stirparo",gender:"Maschile",tokenBalance:6},
 {firstName:"Augusto",lastName:"Aubry",gender:"Maschile",tokenBalance:15},
 {firstName:"Fabio",lastName:"De Chiara",gender:"Maschile",tokenBalance:13},
 {firstName:"Davide",lastName:"Lucantoni",gender:"Maschile",tokenBalance:3},
 {firstName:"Simone",lastName:"Daviddi",gender:"Maschile",tokenBalance:5},
 {firstName:"Claudio",lastName:"Negretti",gender:"Maschile",tokenBalance:11},
 {firstName:"Sergio",lastName:"Balia",gender:"Maschile",tokenBalance:35},
 {firstName:"Ivan",lastName:"Gianferrari",gender:"Maschile",tokenBalance:36},
 {firstName:"Ionel",lastName:"Marcel",gender:"Maschile",tokenBalance:18},
 {firstName:"Stefano",lastName:"Fontanesi",gender:"Maschile",tokenBalance:16},
 {firstName:"Corrado",lastName:"Verzini",gender:"Maschile",tokenBalance:13},
 {firstName:"Francesco",lastName:"Lignola",gender:"Maschile",tokenBalance:9},
 {firstName:"Riccardo",lastName:"Vecchi",gender:"Maschile",tokenBalance:3},
 {firstName:"Stefano",lastName:"Neri",gender:"Maschile",tokenBalance:9},

 {firstName:"Maurizia",lastName:"Casini",gender:"Femminile",tokenBalance:34},
 {firstName:"Liliana",lastName:"Aquaro",gender:"Femminile",tokenBalance:18},
 {firstName:"Eleonora",lastName:"Gorni",gender:"Femminile",tokenBalance:6},
 {firstName:"Monica",lastName:"Esposito",gender:"Femminile",tokenBalance:14},
 {firstName:"Antonella",lastName:"Oliva",gender:"Femminile",tokenBalance:6},
 {firstName:"Monia",lastName:"Mazzi",gender:"Femminile",tokenBalance:51},
 {firstName:"Daniela",lastName:"Mantovani",gender:"Femminile",tokenBalance:6},
 {firstName:"Manuela",lastName:"Mariotti",gender:"Femminile",tokenBalance:9},
 {firstName:"Arianna",lastName:"Lignola",gender:"Femminile",tokenBalance:9},
 {firstName:"Manuela",lastName:"Fabbi",gender:"Femminile",tokenBalance:3},
 {firstName:"Sabrina",lastName:"Lardieri",gender:"Femminile",tokenBalance:3},
 {firstName:"Manuela",lastName:"Farò",gender:"Femminile",tokenBalance:19},

 {firstName:"Fabienne",lastName:"De Cup De Saint Paul",gender:"Femminile",tokenBalance:9},
 {firstName:"Carlotta",lastName:"Rivi",gender:"Femminile",tokenBalance:5},
 {firstName:"Viviana",lastName:"De Magistris",gender:"Femminile",tokenBalance:10},
 {firstName:"Stefania",lastName:"Bella",gender:"Femminile",tokenBalance:9},
 {firstName:"Valentina",lastName:"Labattaglia",gender:"Femminile",tokenBalance:16},
 {firstName:"Viktoriia",lastName:"Dutka",gender:"Femminile",tokenBalance:3},
 {firstName:"Sara",lastName:"Sacco'",gender:"Femminile",tokenBalance:9},
 {firstName:"Elisa",lastName:"Savini",gender:"Femminile",tokenBalance:11}
];


const CLUBS={
 "Padel Arena Manager":{
  name:"Padel Arena Manager",
  address:"",
  logo:"assets/padel-arena-manager-logo.jpg",
  accent:"#9DFF25",
  accent2:"#16A8FF",
  background:"#07111F",
  courts:["Campo 1","Campo 2"]
 },
 "Padel Arena":{
  name:"Padel Arena",
  address:"Reggio Emilia",
  logo:"assets/padel-arena-reggio-emilia.jpeg",
  accent:"#16A8FF",
  accent2:"#9DFF25",
  background:"#07111F",
  courts:["Campo 1","Campo 2"]
 },
 "Eden Padel Club":{
  name:"Eden Padel Club",
  address:"Via Giacomo Balla 6, Reggio Emilia",
  logo:"assets/eden-padel-club.jpeg",
  accent:"#D91F2A",
  accent2:"#FF6973",
  background:"#1A0B10",
  courts:["Campo Blu","Campo Verde"]
 },
 "Happy Time Padel":{
  name:"Happy Time Padel",
  address:"Via Coppi 1/B, Castellarano (RE)",
  logo:"assets/happy-time-padel.jpeg",
  accent:"#F04B86",
  accent2:"#FF9D24",
  background:"#20101D",
  courts:["Campo 1","Campo 2"]
 },
 "AICS":{
  name:"AICS",
  address:"",
  logo:"assets/aics.jpeg",
  accent:"#174EA6",
  accent2:"#00A94F",
  background:"#07152A",
  courts:["Campo 1","Campo 2"]
 },
 "CUPRA":{
  name:"CUPRA",
  address:"",
  logo:"assets/cupra-symbol.jpeg",
  accent:"#8E5CFF",
  accent2:"#C6FF2D",
  background:"#130D29",
  courts:["Campo 1","Campo 2"]
 }
};
const ORGANIZERS=[
 {name:"Padel Arena Reggio Emilia",logo:"assets/padel-arena-reggio-emilia.jpeg"},
 {name:"AICS",logo:"assets/aics.jpeg"}
];

function pamClubAllowsCustomAddress(name){
 return ["AICS","Padel Arena","CUPRA"].includes(name);
}
function pamEventAddress(e){
 if(!e)return "";
 const c=clubInfo(e.club);
 return pamClubAllowsCustomAddress(e.club)&&e.customAddress?e.customAddress:c.address;
}
function clubInfo(name){
 return CLUBS[name]||{name:name||"Club o ente da definire",address:"",logo:"assets/padel-arena-manager-logo.jpg",accent:"#9DFF25",accent2:"#16A8FF",background:"#07111F",courts:[]};
}
function prettyDate(value){
 if(!value)return "";
 const d=new Date(value+"T12:00:00");
 if(Number.isNaN(d.getTime()))return value;
 return d.toLocaleDateString("it-IT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
}
function eventPrintBranding(e){
 if(!e)return "";
 const c=clubInfo(e.club);
 const courts=Number(e.courts||1);
 return '<section class="print-event-hero" style="--event-accent:'+esc(c.accent)+';--event-accent2:'+esc(c.accent2||c.accent)+'">'+
  '<div class="print-master-brand"><img src="assets/padel-arena-manager-logo.jpg" alt="Padel Arena Manager"><div><b>PADEL ARENA MANAGER</b><span>TOURNAMENT MANAGEMENT SYSTEM</span></div></div>'+
  '<div class="print-event-main">'+
   '<div class="print-host-brand"><span>CLUB / ENTE OSPITANTE</span><img class="print-club-logo" src="'+esc(e.logoUrl||c.logo)+'" alt="'+esc(c.name)+'"><b>'+esc(c.name)+'</b></div>'+
   '<div class="print-event-copy"><div class="print-kicker">PROGRAMMA UFFICIALE</div>'+
    '<div class="print-event-title">'+esc(e.name)+'</div>'+
    '<div class="print-event-meta">'+
     '<span><b>Giorno</b>'+esc(prettyDate(e.date))+'</span>'+
     '<span><b>Ora</b>'+esc(e.startTime||"20:00")+'</span>'+
     '<span><b>Centro</b>'+esc(c.name)+'</span>'+
     '<span><b>Campi</b>'+courts+' '+(courts===1?"campo":"campi")+'</span>'+
    '</div>'+
    '<div class="print-address">'+esc(pamEventAddress(e))+'</div>'+
   '</div>'+
  '</div>'+
 '</section>';
}
function printFooter(e){
 if(!e)return "";
 const c=clubInfo(e.club);
 return '<footer class="print-event-footer" style="border-top-color:'+esc(c.accent)+'">'+
  '<div class="footer-master"><img src="assets/padel-arena-manager-logo.jpg"><span><b>PADEL ARENA MANAGER</b><br>Programma ufficiale</span></div>'+
  '<div><b>'+esc(c.name)+'</b><br>'+esc(pamEventAddress(e))+'</div>'+
  '<div class="footer-right">Info eventi<br><b>327 691 0287</b></div>'+
 '</footer>';
}
function iphoneVersionBanner(){
 return '<div class="notice success" style="font-weight:900">Versione attiva: 4.3.1 · richieste iscrizione</div>';
}

function iphoneInstallCard(){
 return '<div class="card iphone-install-card">'+
  '<div class="iphone-install-icon">📱</div>'+
  '<div><h2>Installa su iPhone</h2>'+
  '<div class="muted">Dopo la pubblicazione online, apri l’app con Safari, premi <b>Condividi</b> e scegli <b>Aggiungi alla schermata Home</b>. Si aprirà a schermo intero e funzionerà anche offline.</div></div>'+
 '</div>';
}

function uid(prefix){return prefix+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)}
function pamUuid(){
 if(window.crypto&&typeof window.crypto.randomUUID==="function")return window.crypto.randomUUID();
 return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(c){
  const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);
  return v.toString(16);
 });
}
function freshState(){return{view:"home",tab:"matches",players:[],events:[],currentEventId:null,draft:{
 name:"Rodeo a Gettoni",
 date:new Date().toISOString().slice(0,10),
 club:"Eden Padel Club",
 category:"Maschile",
 competitionType:"rodeo_tokens",
 courts:2,
 fee:25,
 pairsPerGroup:4,
 finalsOption:"top2",
 selected:[],
 description:"",endDate:new Date().toISOString().slice(0,10),endTime:"23:00",registrationMin:4,registrationCapacity:16,registrationOpen:true,waitlistEnabled:true,registrationApproval:"manual",posterTheme:"eden_summer",sponsorLogos:[]
}}}
let state;
try{state=JSON.parse(localStorage.getItem(KEY))||freshState()}catch(e){state=freshState()}
if(!state.draft)state.draft=freshState().draft;
if(!state.draft.competitionType)state.draft.competitionType="rodeo_tokens";
if(state.draft.fee===undefined)state.draft.fee=25;
if(!state.draft.pairsPerGroup)state.draft.pairsPerGroup=4;
if(!state.draft.finalsOption)state.draft.finalsOption="top2";
if(state.draft.returnLeg===undefined)state.draft.returnLeg=false;
if(state.draft.eliminationReturnLeg===undefined)state.draft.eliminationReturnLeg=false;
if(state.draft.semifinalReturnLeg===undefined)state.draft.semifinalReturnLeg=false;
if(state.draft.finalReturnLeg===undefined)state.draft.finalReturnLeg=false;
if(!state.draft.startTime)state.draft.startTime="20:00";
if(!state.draft.matchMode)state.draft.matchMode="score";
if(!state.draft.matchDuration)state.draft.matchDuration=20;
if(!state.draft.timerDuration)state.draft.timerDuration=Number(state.draft.matchDuration)||15;
if(!state.draft.slotDuration)state.draft.slotDuration=Number(state.draft.matchDuration)||20;
if(state.draft.customAddress===undefined)state.draft.customAddress="";
if(!state.draft.fixedPairRegistrations)state.draft.fixedPairRegistrations={};
if(state.draft.showSelectedOnly===undefined)state.draft.showSelectedOnly=false;
if(state.draft.initialTimerEnabled===undefined)state.draft.initialTimerEnabled=true;
if(state.draft.eliminationTimerEnabled===undefined)state.draft.eliminationTimerEnabled=false;
if(state.draft.semifinalTimerEnabled===undefined)state.draft.semifinalTimerEnabled=false;
if(state.draft.finalTimerEnabled===undefined)state.draft.finalTimerEnabled=false;
if(!state.draft.endDate)state.draft.endDate=state.draft.date||new Date().toISOString().slice(0,10);
if(!state.draft.endTime)state.draft.endTime="23:00";
if(state.draft.registrationMin===undefined)state.draft.registrationMin=4;
if(state.draft.registrationCapacity===undefined)state.draft.registrationCapacity=16;
if(state.draft.registrationOpen===undefined)state.draft.registrationOpen=true;
if(state.draft.waitlistEnabled===undefined)state.draft.waitlistEnabled=true;
if(!state.draft.registrationApproval)state.draft.registrationApproval="manual";
if(!state.draft.posterTheme)state.draft.posterTheme="eden_summer";
if(state.draft.description===undefined)state.draft.description="";
if(!state.draft.sponsorLogos)state.draft.sponsorLogos=[];
(state.events||[]).forEach(function(e){
 if(!e.shareToken)e.shareToken=pamUuid();
 if(!e.competitionType)e.competitionType="rodeo_tokens";
 if(!e.payments)e.payments={};
 if(e.entryFee===undefined)e.entryFee=25;
 if(e.initialTimerEnabled===undefined)e.initialTimerEnabled=true;
 if(e.eliminationTimerEnabled===undefined)e.eliminationTimerEnabled=false;
 if(e.semifinalTimerEnabled===undefined)e.semifinalTimerEnabled=false;
 if(e.finalTimerEnabled===undefined)e.finalTimerEnabled=false;
 if(!e.timerDuration)e.timerDuration=Number(e.matchDuration)||15;
 if(!e.slotDuration)e.slotDuration=Number(e.matchDuration)||20;
 if(e.customAddress===undefined)e.customAddress="";
 if(!e.fixedPairRegistrations)e.fixedPairRegistrations={};
 if(e.registrationOpen===undefined)e.registrationOpen=true;
 if(e.waitlistEnabled===undefined)e.waitlistEnabled=true;
 if(e.registrationCapacity===undefined)e.registrationCapacity=Math.max(16,(e.playerIds||[]).length);
 if(e.registrationMin===undefined)e.registrationMin=4;
 if(!e.endDate)e.endDate=e.date||"";
 if(!e.endTime)e.endTime="23:00";
 if(!e.posterTheme)e.posterTheme="eden_summer";
 if(e.description===undefined)e.description="";
 if(!e.sponsorLogos)e.sponsorLogos=[];
});

(state.players||[]).forEach(function(p){
 if(p.birthPlace===undefined)p.birthPlace="";
 if(p.postalCode===undefined)p.postalCode="";
 if(p.residenceTown===undefined)p.residenceTown="";
 if(p.residenceProvince===undefined)p.residenceProvince="";
});
const importedRegistryNames=["Adamelli Marco", "Agosti Cinzia", "aguilar hugo", "Aguzzoli Marco", "Alice Faraboni", "Amari Valeria", "ANDREA GIROTTI", "andrea minerva", "Anigoni Andrea", "Antoine Sebastien", "Anzivino Massimiliano", "Aquaro Liliana", "Aubry Augusto", "bagni riccardo", "Battistini Gloria", "Beltrami Fulvio", "Benedetti Adorno", "Benigno Fabio", "Bertozzi Francesco", "Bia Gianpaolo", "Bianco Antonella", "Bigi Tamara", "Bonacini Daniele", "borelli maicol", "Borsari Gigi", "Savini Elisa", "Busiello Salvatore", "Calzolari Sarah", "Camellini Paolo", "Camposano Cristian", "Carbini Carlo", "Carnevali Maurizio", "Carpi Renzo", "Casini Maurizia", "Casoli Morgan", "Cattaneo Arnaldo", "Cavalchi Stefano", "Cocconcelli Daniele", "Corradini Paola", "Corrieri Massiliano", "Corsi Roberto", "Costa Alex", "D'Avico Luca", "dallasta dario", "Davi' Laura", "Davoli Alberto", "De Chiara Fabio", "De Marchi Egle", "De Pillo Alfredo", "Debbi Barbara", "Di Nobile Pasqualino", "Di salvatore Pier", "Diletto Daniele", "Duca Maurizio", "ENRICO FANTINI", "Esposito Monica", "Fabbi Manuela", "Fantesini Barbara", "Farò Manuela", "Federico Benassi", "Federico Foroni", "Ferretti Matteo", "Ferri Stefania", "Filippini Gianluca", "Fina Saverio", "Fontana Luciano", "Fontanesi Stefano", "Foroni Matteo", "Foroni Massimo", "Franceschi Glenda", "Francesco Albertini", "Franzoni Giovanni", "Frate Ciro", "Galloni Stefano", "Ghelfi Jacopo", "Gianferrari Ivan", "Gianluca Tortora", "Giovanniello Corinne", "Gorni Eleonora", "Graziano Fabrizio", "Greta Andreoli", "Grisendi Marco", "Guerriero Federico", "Guglielmi Valerio", "Iellamo Francesco", "Iori Marco", "Iori Luca", "Iori Emanuele", "Iori Alessandro", "Kosir Matteo", "Lardieri Sabrina", "Larocca Michele", "Lignola Francesco", "Lignola Giuseppe", "Lignola Loris", "Lombardi Natascia", "Lucantoni Davide", "Macrí Federico", "Magnano Federico", "Mainini Matteo", "Spadaro Veronica", "Margini Sebastian", "Margini Pietro", "Masetti Massimiliano", "Matichecchia Damiano", "Matteo Virga", "matteo melato", "Mazzi Monia", "Melioli Francesco", "Melioli Marco", "Mendola Rocco", "Menozzi Marco", "Menozzi Sara", "Menozzi Maurizio", "Mercati Domenica", "Merlo Andrea", "Milano David", "Milo Mina", "Mingardi Monia", "mirco boni", "Montagna Antonio", "Nappo Michele", "Negretti Claudio", "Neri Stefano", "Ofkuir Rafy", "Oliva Antonella", "Orlandini Davide", "Paini Sonia", "Panizza Stefano", "Pappalardo Salvatore", "Parmigiani Marco", "Patrick Zecchetti", "Pittau Fabio", "Pizzarelli Luana", "Presi Marcello", "Scarano Giancarlo", "Profetto Giorgio", "Renzo Pedrazzini", "Righi Francesca", "Rinaldi Marco", "Rivi Carlotta", "Rocca Francesco", "Sacchetti Andrea", "Salsi Fabio", "Savastano Anna", "Scarano Matteo", "Sergio Balia", "Simone Daviddi", "Spacca Tommaso", "Spina Andrea", "stefano barbieri", "stefano piccinini", "Tachino Chiara", "Tamelli Sandro", "Telani Manuel", "Tinarelli Filippo", "turri piergiulio", "Vecchi Lorenzo", "Veronesi Elena", "Verzini Corrado", "Zoboli Ilenia", "Istruttore Corrado Padel Verzini", "Pietro Carbone", "Francesco Istruttore Lignola Padel", "Filippini Maria Grazia", "Istruttore Andrea Algeri Padel", "Addari Giammarco", "Anghinetti Padel Istruttore Michele", "OPPIDO PALMO", "Giorgia Gardini", "Sara Severi", "Villa Paolo", "Boretti Nicolò", "Boretti Federico", "Ramolini Giorgia", "Righi Simone", "Giancarlo Scarano", "Caneo Nicolò", "viani marco", "Lignola Arianna", "Acerbi Erika", "Nosari Asia", "Columbu Giomaria", "Anigoni Amanda", "Roncaglia Silvia", "Tamagnini Andrea", "Cristofori Lucrezia", "Emily D' Avico", "Marco Vecchi Marco", "Rosati Donald", "Crasti Anna", "Giacalone Dario", "Vignoli Elisa", "Tonelli Lia", "Camellini Alessandro", "Gabbi Claudio", "Veronese Elisa", "Stefania Malenchini", "Demiri Astrit", "Albertini Pietro", "D'Apice Giuseppe", "Petronella Angelo", "Gibertini Andrea", "Mossina Simone", "Mattia Schirone", "Franceschini cristian", "Labbate Antonino", "Vecchi Claudio", "Roberto Valgimigli", "Lucrezia Merlo", "Andrea Rabacchi", "Tedeschi Marcello", "Sardo Claudio", "Alice Iori", "Tascedda Stefano", "Battistoni Tommaso", "Gabriella Motta", "Leoni Federica", "Giulio Soliani", "TODARO ALBERTO", "POLI MAURO", "Lorenzo Maccari", "Baroni Andrea", "Piccinini Stefano", "Saccani Vittoria", "Tommaso Portioli", "Sepe Matteo", "LAPOMARDA NICOLA", "Augusto Iorio", "Mario Conte", "Violi Simone", "Fiumano' Francesco", "Emanuele Capizzi", "Scarano Pasquale", "Alessia Gilioli", "GATTI GIULIANO", "Caprino Giuseppe", "Campana Nicholas", "Nesci Emilio", "Devis Catellani", "Guardalupi Filippo", "Nunziato Marco", "Celentano Raffaele", "Eric Twum", "Luisa Pia Scialoia", "caselli luca", "Capretta Nicolò", "Vanessa Lolli", "Margot Lolli", "Viola Scano", "Julia Bonacini", "Elena Mori", "Morini Sara", "Greta Rampini", "Soprani Alberto", "Allegra Bergonzi", "Andrea Battaglini", "D' Apice Leonardo", "Spaggiari Lara", "Milena Mahadeo", "Antonio Mereu", "liccese grazia", "Mereu Michelle", "Mereu Luigia", "Tommaso Ferrarini", "Iacovelli Alberto", "Delmonte Federico", "Montruccoli Luca", "Jonathan Parisi", "Gianluca Di Guida", "Tania Leoni", "Rogato Manuel", "Cattani Arianna", "Baldoni Leonardo", "Torraco Daniele", "Niklas Frewel", "Rosa Emanuele", "Ascolese Emilio", "Luca Donini", "Bicchieri Luca", "Alex Maffeo", "di franco andrea", "Giosuè Ilardo", "Chiara Genna", "sorce rosario", "Rossella Barilli", "Fontana Lorenzo", "Milena Delpogetto", "Luigi Iori", "benigno nicolò", "bologna alessandro", "Carpi Giovanni", "Michele Lari", "Ionel Diana", "Ionel Marcel", "Davide Capriello", "Ionel Alexandro", "Clara Fontanili", "Sara Sacco’", "Ionel Anastasia", "Geti DAVIDE", "Morini Mauro", "Rosario Sarcone", "Alessandro Augelli", "Borghi Nadia", "Cottafavi Omar", "Viktoriia Dutka", "Alessia Quaranta", "Carmen Rossella", "Maria Diletto", "Zingaro Valentina", "Manduano Carlotta", "Filippo D’ Apice", "Alberto Munao'", "Diego Munao'", "Giovanni Borza", "Stirparo Antonio", "Daniela Murciano", "Carubbi Alberto", "Daniele Carubbi", "Giovanardi Mirco", "Monticelli Arianna", "Mouad Tawgui", "Amine Lafif", "Turrà piergiulio", "Elia Giovannini", "Ruggieri Marco", "vaccari tommaso", "Virgilli Francesco", "iori cristiano", "Filippo Burani", "Aidoo Evans", "Rovighi Giulia", "Valentina Dichirico", "Silvia Tomei", "Biliardi Beatrice", "avanzi sara", "francesca baldelli", "hajmi youssef", "Meligeni Mario", "Roberto Doro", "Pedrini Christian", "Bersanetti Emanuele", "Beneventi Luca", "Barbara Bedocchi", "Arianna Cubeddu", "Giuseppe Todisco", "Federico Romani", "Cirlini Andrea", "Brunello Filippo", "Faccia Martina", "Montanari Aurora", "Baccarini Gabriele", "Pattacini Fabio", "cosmi davide", "Cattabiani Massimo", "Shahinaj Klajdi", "Cocca Giulia", "Olmi Alessandro", "Rotteglia Pietro", "Ferri Simone", "Crotti Valentina", "Masucci Alessandro", "Salvatore Soro", "Vecchi Riccardo", "Mariotti Manuela", "Daniela Mantovani", "Rinaldini Matteo", "Iodice Gabriele", "Iodice Alessandro", "Pioppi giorgia", "Branchi Giulia", "Bianchi Alessio", "Alberto Benassi", "Cimino Alessandro", "Valentina Labattaglia", "Stefania Bella", "Viviana De Magistris", "calzolari massimo", "Fabienne De Cup De Saint Paul", "corradini alberto", "zattera gabriele", "simonazzi dario", "Baita Andrea", "Mariano Peralta", "vega maurizio"];
function registryTokenKey(value){
 return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").trim().split(/\s+/).filter(Boolean).sort().join("|");
}
const existingRegistryKeys=new Set((state.players||[]).map(function(p){return registryTokenKey(playerName(p))}));
importedRegistryNames.forEach(function(fullName){
 const key=registryTokenKey(fullName);
 if(!key||existingRegistryKeys.has(key))return;
 state.players.push({
  id:uid("p"),
  firstName:fullName,
  lastName:"",
  phone:"",
  email:"",
  birth:"",
  birthPlace:"",
  postalCode:"",
  residenceTown:"",
  residenceProvince:"",
  level:"",
  notes:"Importato da Gestione Clienti - Anagrafica",
  gender:"",
  tokenBalance:0
 });
 existingRegistryKeys.add(key);
});
save();

function normalizeName(s){return String(s||"").trim().toLocaleLowerCase("it-IT").replace(/\s+/g," ")}
function seedParticipants(){
 if(!Array.isArray(state.players))state.players=[];
 SEEDED_PLAYERS.forEach(function(seed){
  const full=normalizeName(seed.firstName+" "+seed.lastName);
  let p=state.players.find(function(x){return normalizeName((x.firstName||"")+" "+(x.lastName||""))===full});
  if(!p){
   p={id:uid("p"),firstName:seed.firstName,lastName:seed.lastName,phone:"",email:"",birth:"",birthPlace:"",postalCode:"",residenceTown:"",residenceProvince:"",level:"",notes:"Partecipante CUPRA Rodeo Circuit 2026",gender:seed.gender,tokenBalance:seed.tokenBalance};
   state.players.push(p);
  }else{
   if(!p.gender)p.gender=seed.gender;
   if(p.tokenBalance===undefined||p.tokenBalance===null)p.tokenBalance=seed.tokenBalance;
  }
 });
 save();
}
seedParticipants();

function applyMaleTokenBalancesTappa2(){
 const balances={
  "Corrado Verzini":13,
  "Ivan Gianferrari":36,
  "Claudio Negretti":11,
  "Augusto Aubry":15,
  "Sergio Balia":35,
  "Francesco Lignola":9,
  "Ionel Marcel":18,
  "Stefano Neri":9,
  "Stefano Fontanesi":16,
  "Riccardo Vecchi":3
 };
 Object.keys(balances).forEach(function(fullName){
  const key=registryTokenKey(fullName);
  const matches=(state.players||[]).filter(function(p){
   return registryTokenKey(playerName(p))===key;
  });
  if(matches.length){
   matches.forEach(function(p){p.tokenBalance=balances[fullName]});
  }else{
   const parts=fullName.split(" ");
   state.players.push({
    id:uid("p"),
    firstName:parts.shift(),
    lastName:parts.join(" "),
    phone:"",
    email:"",
    birth:"",
    birthPlace:"",
    postalCode:"",
    residenceTown:"",
    residenceProvince:"",
    level:"",
    notes:"Saldo gettoni maschile aggiornato dopo Tappa 2",
    gender:"Maschile",
    tokenBalance:balances[fullName]
   });
  }
 });
 state.migrations=state.migrations||{};
 state.migrations.maleTokensTappa2="2026-07-29-v2";
 save();
}
applyMaleTokenBalancesTappa2();

function save(){
 localStorage.setItem(KEY,JSON.stringify(state));
 if(pamCloudReady&&PAM_SESSION)pamScheduleCloudSync();
}
function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]})}
function playerName(p){return (p.firstName+" "+p.lastName).trim()}
function currentEvent(){return state.events.find(function(e){return e.id===state.currentEventId})||null}

function pamEventRow(e){
 if(!e.shareToken)e.shareToken=pamUuid();
 return{
  id:e.id,
  name:e.name||"Torneo",
  event_date:e.date||null,
  club:e.club||null,
  category:e.category||null,
  competition_type:e.competitionType||null,
  logo_url:e.logoUrl||null,
  share_token:e.shareToken,
  status:e.status||"active",
  data:e
 };
}
function pamPlayerRow(p){
 return{id:p.id,data:p,photo_url:p.photoUrl||null};
}
function pamScheduleCloudSync(){
 clearTimeout(pamSyncTimer);
 pamSyncTimer=setTimeout(pamCloudSyncAll,650);
}
async function pamCloudSyncAll(){
 if(!pamCloudReady||!PAM_SESSION||pamUploading)return;
 pamUploading=true;
 try{
  if(pamIsAdmin()){
   if(state.players.length){
    const pr=await sb.from("players").upsert(state.players.map(pamPlayerRow),{onConflict:"id"}).select("id");
    if(pr.error)throw pr.error;
   }
   if(state.events.length){
    const er=await sb.from("tournaments").upsert(state.events.map(pamEventRow),{onConflict:"id",defaultToNull:false}).select("id,share_token");
    if(er.error)throw er.error;
    (er.data||[]).forEach(function(row){
     const e=state.events.find(function(x){return x.id===row.id});
     if(e)e.shareToken=row.share_token;
    });
   }
  }else{
   // Il collaboratore sincronizza soltanto il torneo aperto.
   const e=currentEvent();
   if(e){
    const er=await sb.from("tournaments")
      .update({data:e,status:e.status||"active"})
      .eq("id",e.id)
      .select("id,share_token")
      .maybeSingle();
    if(er.error)throw er.error;
    if(er.data&&er.data.share_token)e.shareToken=er.data.share_token;
   }
  }
  localStorage.setItem(KEY,JSON.stringify(state));
  pamSetConnectionState(true);
 }catch(err){
  console.error("Sincronizzazione Supabase:",err);
  pamSetConnectionState(false);
  pamToast("Sincronizzazione non riuscita: "+err.message,"error");
 }finally{
  pamUploading=false;
 }
}

function pamSetConnectionState(ok){
 const badge=document.getElementById("pamRoleBadge");
 if(!badge)return;
 badge.textContent=pamRoleLabel()+(ok?" · CONNESSO":" · NON SINCRONIZZATO");
 badge.style.background=ok?"#071a2b":"#7f1d1d";
}
window.addEventListener("online",function(){pamSetConnectionState(true);if(PAM_SESSION)pamCloudLoad(false)});
window.addEventListener("offline",function(){pamSetConnectionState(false)});


async function pamGetCloudCounts(){
 const [p,e]=await Promise.all([
  sb.from("players").select("id",{count:"exact",head:true}),
  sb.from("tournaments").select("id",{count:"exact",head:true})
 ]);
 if(p.error)throw p.error;
 if(e.error)throw e.error;
 return{players:p.count||0,events:e.count||0};
}
async function pamForceUploadLocal(){
 if(!pamIsAdmin()){pamToast("Solo l'amministratore può trasferire l'archivio locale.","error");return}
 if(!confirm("Trasferire su Supabase tutti i giocatori e i tornei presenti su questo dispositivo? I record con lo stesso ID verranno aggiornati."))return;
 pamToast("Trasferimento archivio locale in corso...");
 const oldReady=pamCloudReady;
 pamCloudReady=true;
 await pamCloudSyncAll();
 pamCloudReady=oldReady||true;
 await pamRefreshSyncPanel();
 pamToast("Archivio locale trasferito online.","success");
}
async function pamForceDownloadCloud(){
 if(!confirm("Scaricare l'archivio online su questo dispositivo? I dati locali verranno sostituiti dalla versione presente su Supabase."))return;
 pamToast("Scaricamento archivio online...");
 await pamCloudLoad(false,true);
 await pamRefreshSyncPanel();
 pamToast("Archivio online scaricato.","success");
}
async function pamRefreshSyncPanel(){
 const el=document.getElementById("pamSyncPanel");
 if(!el||!PAM_SESSION)return;
 try{
  const c=await pamGetCloudCounts();
  const lp=document.getElementById("pamLocalPlayers");
  const le=document.getElementById("pamLocalEvents");
  const cp=document.getElementById("pamCloudPlayers");
  const ce=document.getElementById("pamCloudEvents");
  if(lp)lp.textContent=state.players.length;
  if(le)le.textContent=state.events.length;
  if(cp)cp.textContent=c.players;
  if(ce)ce.textContent=c.events;
  const log=document.getElementById("pamSyncLog");
  if(log)log.textContent="Ultimo controllo: "+new Date().toLocaleTimeString("it-IT");
  pamSetConnectionState(true);
 }catch(err){
  const log=document.getElementById("pamSyncLog");
  if(log)log.textContent="Errore collegamento: "+err.message;
  pamSetConnectionState(false);
 }
}
function pamSyncPanelHtml(){
 if(!PAM_SESSION)return"";
 return '<section id="pamSyncPanel" class="card pam-sync-panel">'+
  '<h2>☁️ Archivio condiviso</h2>'+
  '<div class="muted">Confronta i dati salvati sul dispositivo con quelli presenti su Supabase.</div>'+
  '<div class="pam-sync-grid">'+
   '<div class="pam-sync-stat"><span>Giocatori sul dispositivo</span><b id="pamLocalPlayers">'+state.players.length+'</b></div>'+
   '<div class="pam-sync-stat"><span>Tornei sul dispositivo</span><b id="pamLocalEvents">'+state.events.length+'</b></div>'+
   '<div class="pam-sync-stat"><span>Stato</span><b style="font-size:17px">'+(navigator.onLine?"CONNESSO":"OFFLINE")+'</b></div>'+
  '</div>'+
  '<div class="pam-sync-grid">'+
   '<div class="pam-sync-stat"><span>Giocatori online</span><b id="pamCloudPlayers">…</b></div>'+
   '<div class="pam-sync-stat"><span>Tornei online</span><b id="pamCloudEvents">…</b></div>'+
   '<div class="pam-sync-stat"><span>Account</span><b style="font-size:15px">'+esc(PAM_PROFILE?.role||"")+'</b></div>'+
  '</div>'+
  '<div class="pam-sync-actions">'+
   '<button class="secondary" data-action="cloud-check">Aggiorna conteggi</button>'+
   (pamIsAdmin()?'<button class="primary" data-action="cloud-upload-local">Carica questo dispositivo online</button>':'')+
   '<button class="secondary" data-action="cloud-download">Scarica archivio online</button>'+
  '</div>'+
  '<div id="pamSyncLog" class="pam-sync-log">Controllo in corso…</div>'+
 '</section>';
}

async function pamCloudLoad(initial,forceReplace){
 const [playersRes,eventsRes]=await Promise.all([
  sb.from("players").select("id,data,photo_url").order("updated_at",{ascending:true}),
  sb.from("tournaments").select("id,name,event_date,club,category,competition_type,logo_url,share_token,status,data,updated_at").order("event_date",{ascending:false})
 ]);
 if(playersRes.error)throw playersRes.error;
 if(eventsRes.error)throw eventsRes.error;
 const remotePlayers=(playersRes.data||[]).map(function(r){return Object.assign({},r.data||{},{id:r.id,photoUrl:r.photo_url||((r.data||{}).photoUrl)||""})});
 const remoteEvents=(eventsRes.data||[]).map(function(r){
  return Object.assign({},r.data||{},{
   id:r.id,name:r.name,event_date:r.event_date,date:r.event_date||((r.data||{}).date)||"",
   club:r.club||((r.data||{}).club)||"",category:r.category||((r.data||{}).category)||"",
   competitionType:r.competition_type||((r.data||{}).competitionType)||"",
   logoUrl:r.logo_url||((r.data||{}).logoUrl)||"",shareToken:r.share_token,status:r.status
  });
 });
 if(forceReplace||remotePlayers.length)state.players=remotePlayers;
 if(forceReplace||remoteEvents.length)state.events=remoteEvents;
 if(initial&&pamIsAdmin()&&!remoteEvents.length&&state.events.length){
  pamCloudReady=true;
  await pamCloudSyncAll();
 }else{
  pamCloudReady=true;
 }
 if(state.currentEventId&&!state.events.some(function(e){return e.id===state.currentEventId}))state.currentEventId=null;
 localStorage.setItem(KEY,JSON.stringify(state));
 render();
 pamApplyRole();
 setTimeout(pamRefreshSyncPanel,50);
}
function pamSubscribeRealtime(){
 if(pamRealtimeChannel)sb.removeChannel(pamRealtimeChannel);
 pamRealtimeChannel=sb.channel("padel-arena-tournaments")
  .on("postgres_changes",{event:"*",schema:"public",table:"tournaments"},function(){
   clearTimeout(pamRemoteRefreshTimer);
   pamRemoteRefreshTimer=setTimeout(function(){if(!pamUploading)pamCloudLoad(false)},450);
  }).subscribe();
}
function pamToast(message,type){
 const n=document.createElement("div");
 n.className="pam-toast "+(type||"");
 n.textContent=message;
 document.body.appendChild(n);
 setTimeout(function(){n.remove()},3500);
}
function pamShareUrl(e){
 if(!e.shareToken)return location.href.split("?")[0].split("#")[0];
 return location.href.split("?")[0].split("#")[0]+"?tournament="+encodeURIComponent(e.shareToken);
}
function pamRegistrationUrl(e){
 const base=location.href.split("?")[0].split("#")[0].replace(/index\.html$/i,"");
 return base+"public-registration.html?tournament="+encodeURIComponent(e.shareToken||"");
}
async function pamShareRegistration(id){
 const e=state.events.find(function(x){return x.id===id});if(!e)return;
 if(!e.shareToken){await pamCloudSyncAll()}
 const url=pamRegistrationUrl(e);
 try{
  if(navigator.share)await navigator.share({
   title:"Iscrizione · "+e.name,
   text:"Apri il link e iscriviti al torneo senza password.",
   url:url
  });
  else{
   await navigator.clipboard.writeText(url);
   pamToast("Link iscrizioni copiato","success");
  }
 }catch(err){
  if(err.name!=="AbortError")prompt("Copia il link per le iscrizioni",url);
 }
}

async function pamShareEvent(id){
 const e=state.events.find(function(x){return x.id===id});if(!e)return;
 if(!e.shareToken){await pamCloudSyncAll()}
 const url=pamShareUrl(e);
 try{
  if(navigator.share)await navigator.share({title:e.name,text:"Apri il torneo e inserisci i risultati",url:url});
  else{await navigator.clipboard.writeText(url);pamToast("Link del torneo copiato","success")}
 }catch(err){
  if(err.name!=="AbortError")prompt("Copia il link del torneo",url);
 }
}
function pamResetCopiedResults(obj){
 if(!obj||typeof obj!=="object")return;
 if(Array.isArray(obj)){obj.forEach(pamResetCopiedResults);return}
 Object.keys(obj).forEach(function(k){
  if(["score1","score2"].includes(k))obj[k]=null;
  else if(k==="paid")obj[k]=false;
  else if(k==="method"||k==="note"||k==="notes")obj[k]="";
  else if(k==="spent"||k==="podium")obj[k]=0;
  else if(k==="endAt"||k==="expiredNotified")delete obj[k];
  else pamResetCopiedResults(obj[k]);
 });
}
function pamDuplicateEvent(id){
 if(!pamIsAdmin())return;
 const original=state.events.find(function(x){return x.id===id});if(!original)return;
 const copy=JSON.parse(JSON.stringify(original));
 copy.id=uid("e");
 copy.name=original.name+" - Copia";
 copy.shareToken=pamUuid();
 copy.status="draft";
 copy.createdAt=new Date().toISOString();
 copy.timers={};
 pamResetCopiedResults(copy);
 state.events.unshift(copy);
 state.currentEventId=copy.id;
 state.view="event";state.tab="matches";
 save();render();
 pamToast("Torneo duplicato: la copia è indipendente e modificabile","success");
}
function pamEditEvent(id){
 if(!pamIsAdmin())return;
 const e=state.events.find(function(x){return x.id===id});if(!e)return;
 const name=prompt("Nome torneo",e.name);if(name===null)return;
 const date=prompt("Data (AAAA-MM-GG)",e.date||"");if(date===null)return;
 const club=prompt("Circolo",e.club||"");if(club===null)return;
 const category=prompt("Categoria",e.category||"");if(category===null)return;
 const startTime=prompt("Orario di inizio (HH:MM)",e.startTime||"20:00");if(startTime===null)return;
 const timerDuration=prompt("Durata effettiva della partita / timer in minuti",String(e.timerDuration||e.matchDuration||15));if(timerDuration===null)return;
 const slotDuration=prompt("Intervallo tra gli inizi delle partite in minuti",String(e.slotDuration||e.matchDuration||20));if(slotDuration===null)return;
 e.name=name.trim()||e.name;
 e.date=date.trim();
 e.club=club.trim();
 e.customAddress=customAddress;
 e.category=category.trim();
 e.startTime=startTime.trim()||"20:00";
 e.timerDuration=Math.max(1,Number(timerDuration)||15);
 e.slotDuration=Math.max(e.timerDuration,Number(slotDuration)||20);
 e.matchDuration=e.slotDuration;
 save();render();
 pamToast("Dati del torneo aggiornati.","success");
}
function pamTournamentPlayersModal(id){
 if(!pamIsAdmin())return;
 const e=state.events.find(function(x){return x.id===id});if(!e)return;
 document.getElementById("pamTournamentPlayersOverlay")?.remove();
 const overlay=document.createElement("div");
 overlay.id="pamTournamentPlayersOverlay";
 overlay.className="pam-modal-overlay";
 const selected=new Set(e.playerIds||[]);
 const rows=state.players.slice().sort(function(a,b){return playerName(a).localeCompare(playerName(b),"it")}).map(function(p){
  return '<div class="pam-player-choice">'+
   '<input type="checkbox" data-tournament-player="'+p.id+'" '+(selected.has(p.id)?"checked":"")+'>'+
   '<img src="'+esc(pamPlayerPhoto(p))+'" alt="">'+
   '<span><b>'+esc(playerName(p))+'</b><small>'+(p.gender?esc(p.gender):"")+'</small></span>'+
   '<div class="pam-player-choice-actions"><button type="button" class="small" data-rename-tournament-player="'+p.id+'">Rinomina</button>'+
   (selected.has(p.id)?'<button type="button" class="small" data-replace-existing-event-player="'+p.id+'" data-event-id="'+e.id+'">Sostituisci</button>':'')+
   '</div></div>';
 }).join("");
 overlay.innerHTML='<div class="pam-modal-card">'+
  '<div class="pam-modal-head"><div><h2>Partecipanti del torneo</h2><div class="muted">Aggiungi, togli o sostituisci i giocatori. Poi rigenera le partite.</div><div class="pill" id="pamTournamentSelectedCount">'+selected.size+' selezionati</div></div><button class="secondary" data-close-tournament-players>Chiudi</button></div>'+
  '<div class="notice error"><b>Attenzione:</b> rigenerando le partite verranno cancellati risultati, timer e fasi finali già compilate. I saldi generali dei giocatori non vengono cancellati.</div>'+
  '<div class="pam-inline-create"><div class="field"><label>Cerca giocatore</label><input id="pamTournamentPlayerSearch" type="search" placeholder="Nome o cognome"></div>'+
  '<button class="primary" data-quick-player-existing-event="'+id+'">➕ Nuova anagrafica e inserisci</button></div>'+
  '<div class="pam-player-choice-list">'+rows+'</div>'+
  '<div class="pam-modal-actions"><button class="primary" data-regenerate-tournament="'+id+'">Salva partecipanti e rigenera partite</button></div>'+
 '</div>';
 document.body.appendChild(overlay);
 const search=overlay.querySelector("#pamTournamentPlayerSearch");
 search.addEventListener("input",function(){
  const q=normalizeName(search.value);
  overlay.querySelectorAll(".pam-player-choice").forEach(function(row){
   row.style.display=!q||normalizeName(row.textContent).includes(q)?"grid":"none";
  });
 });
 overlay.querySelectorAll("[data-tournament-player]").forEach(function(cb){
  cb.addEventListener("change",function(){
   const count=overlay.querySelectorAll("[data-tournament-player]:checked").length;
   const badge=overlay.querySelector("#pamTournamentSelectedCount");
   if(badge)badge.textContent=count+" selezionati";
  });
 });
}
function pamRenameTournamentPlayer(playerId){
 if(!pamIsAdmin())return;
 const p=playerById(playerId);if(!p)return;
 const full=prompt("Nome e cognome del giocatore",playerName(p));if(full===null)return;
 const clean=full.trim();if(!clean)return;
 const parts=clean.split(/\s+/);
 p.firstName=parts.shift()||clean;
 p.lastName=parts.join(" ");
 save();
 const e=currentEvent();
 if(e)pamTournamentPlayersModal(e.id);
}
function pamResetEventGeneratedData(e){
 e.matches=[];
 e.timers={};
 e.finalStages={
  elimination:{teamA:[],teamB:[],score1:null,score2:null},
  auction1:{spending:{}},
  semifinals:[
   {id:"semi1",teamA:[],teamB:[],score1:null,score2:null},
   {id:"semi2",teamA:[],teamB:[],score1:null,score2:null}
  ],
  auction2:{spending:{}},
  final:{teamA:[],teamB:[],score1:null,score2:null}
 };
 e.simpleFinals=null;
 e.fixedFinals={semifinals:[],final:{pair1:null,pair2:null,score1:null,score2:null}};
}
function pamRegenerateTournament(id){
 if(!pamIsAdmin())return;
 const e=state.events.find(function(x){return x.id===id});if(!e)return;
 const overlay=document.getElementById("pamTournamentPlayersOverlay");
 const ids=Array.from(overlay.querySelectorAll("[data-tournament-player]:checked")).map(function(x){return x.getAttribute("data-tournament-player")});
 if(e.competitionType==="rodeo_tokens"&&![6,8,10,12,16].includes(ids.length)){
  pamToast("Hai selezionato "+ids.length+" giocatori. Per il Rodeo a gettoni sono ammessi 6, 8, 10, 12 oppure 16 giocatori.","error");return;
 }
 if(e.competitionType!=="rodeo_tokens"&&ids.length<4){
  pamToast("Seleziona almeno 4 giocatori.","error");return;
 }
 if(e.competitionType==="fixed_pairs"&&ids.length%2!==0){
  pamToast("Per le coppie fisse serve un numero pari di giocatori.","error");return;
 }
 if(!confirm("Confermi? Tutte le partite, i risultati, i timer e le fasi finali di questo torneo verranno cancellati e rigenerati."))return;
 e.playerIds=ids;
 e.payments=defaultPayments(ids,e.entryFee||0);
 e.ledger={};
 ids.forEach(function(pid){
  const p=playerById(pid);
  e.ledger[pid]={carried:Number((p&&p.tokenBalance)||0),spent:0,podium:0};
 });
 pamResetEventGeneratedData(e);
 if(e.competitionType==="fixed_pairs"){
  const built=buildFixedPairs(ids,e.pairsPerGroup||4,e.courts,e.returnLeg);
  e.pairs=built.pairs;e.matches=built.matches;
 }else{
  e.matches=buildMatches(ids,e.courts,e.returnLeg);
 }
 save();render();
 overlay.remove();
 pamToast("Partecipanti aggiornati e partite rigenerate.","success");
}



function pamRegistrationPersonName(person){
 if(!person)return "Giocatore";
 if(person.kind==="existing")return person.name||"Giocatore già presente";
 const d=person.data||{};
 return ((d.firstName||"")+" "+(d.lastName||"")).trim()||"Nuovo giocatore";
}
function pamRegistrationStatusLabel(status){
 return {
  new:"DA VALUTARE",
  accepted:"ACCETTATA",
  rejected:"RIFIUTATA",
  waitlist:"LISTA D'ATTESA",
  imported:"IMPORTATA"
 }[status]||String(status||"").toUpperCase();
}
async function pamOpenRegistrations(id){
 const e=state.events.find(function(x){return x.id===id});if(!e)return;
 document.getElementById("pamRegistrationsOverlay")?.remove();
 const overlay=document.createElement("div");
 overlay.id="pamRegistrationsOverlay";
 overlay.className="pam-modal-overlay";
 overlay.innerHTML='<div class="pam-modal-card pam-registrations-card">'+
  '<div class="pam-modal-head"><div><h2>Richieste di iscrizione</h2><div class="muted">'+esc(e.name)+'</div></div>'+
  '<button class="secondary" data-close-registrations>Chiudi</button></div>'+
  '<div class="pam-capacity-row"><b>Capienza iscrizioni:</b> '+(e.registrationCapacity?esc(e.registrationCapacity):"NESSUN LIMITE")+
  ' <button class="secondary" data-set-registration-capacity="'+e.id+'">IMPOSTA</button></div>'+
  '<div id="pamRegistrationsBody"><div class="notice">Caricamento richieste...</div></div>'+
 '</div>';
 document.body.appendChild(overlay);

 const res=await sb.from("public_registrations")
  .select("id,mode,status,primary_payload,partner_payload,created_at")
  .eq("tournament_id",String(e.id))
  .order("created_at",{ascending:true});

 const body=document.getElementById("pamRegistrationsBody");
 if(!body)return;
 if(res.error){
  body.innerHTML='<div class="notice error">Esegui il file <b>SUPABASE_ISCRIZIONI_PUBBLICHE_431.sql</b> nel SQL Editor di Supabase.<br>'+esc(res.error.message)+'</div>';
  return;
 }
 const rows=res.data||[];
 if(!rows.length){
  body.innerHTML='<div class="notice">Non è ancora arrivata nessuna richiesta.</div>';
  return;
 }
 const counts=rows.reduce(function(a,r){a[r.status]=(a[r.status]||0)+1;return a},{});
 body.innerHTML=
  '<div class="pam-registration-summary">'+rows.length+' richieste · '+
  (counts.new||0)+' da valutare · '+(counts.accepted||0)+' accettate · '+(counts.waitlist||0)+' in attesa</div>'+
  rows.map(function(r){
   const first=pamRegistrationPersonName(r.primary_payload);
   const partner=r.mode==="pair"?pamRegistrationPersonName(r.partner_payload):"";
   const pending=r.status==="new"||r.status==="waitlist";
   return '<div class="item pam-registration-row">'+
    '<div class="grow"><b>'+esc(first)+(partner?' / '+esc(partner):'')+'</b>'+
    '<div class="muted">'+(r.mode==="pair"?"ISCRIZIONE IN COPPIA":"ISCRIZIONE INDIVIDUALE")+
    ' · '+new Date(r.created_at).toLocaleString("it-IT")+'</div>'+
    '<span class="pill pam-status-'+esc(r.status)+'">'+esc(pamRegistrationStatusLabel(r.status))+'</span></div>'+
    (pending?'<div class="pam-request-actions">'+
      '<button class="primary" data-process-registration="'+r.id+'" data-action="accepted" data-event-id="'+e.id+'">ACCETTA</button>'+
      '<button class="secondary" data-process-registration="'+r.id+'" data-action="waitlist" data-event-id="'+e.id+'">LISTA D’ATTESA</button>'+
      '<button class="danger" data-process-registration="'+r.id+'" data-action="rejected" data-event-id="'+e.id+'">RIFIUTA</button>'+
     '</div>':'')+
   '</div>';
  }).join("");
}
async function pamSetRegistrationCapacity(eventId){
 const e=state.events.find(function(x){return x.id===eventId});if(!e)return;
 const current=e.registrationCapacity||"";
 const value=prompt("Numero massimo di giocatori/coppie ammessi. Lascia vuoto per nessun limite.",current);
 if(value===null)return;
 if(value.trim()==="")delete e.registrationCapacity;
 else{
  const n=Number(value);
  if(!Number.isInteger(n)||n<1){pamToast("Inserisci un numero intero maggiore di zero.","error");return}
  e.registrationCapacity=n;
 }
 save();
 await pamCloudSyncAll();
 pamOpenRegistrations(eventId);
}
async function pamProcessRegistration(registrationId,action,eventId){
 const e=state.events.find(function(x){return x.id===eventId});if(!e)return;
 if(action==="rejected"&&!confirm("Rifiutare questa richiesta?"))return;
 const res=await sb.rpc("admin_process_public_registration",{
  p_registration_id:String(registrationId),
  p_action:String(action)
 });
 if(res.error){pamToast(res.error.message,"error");return}
 if(action==="accepted"){
  await pamCloudLoad(false);
  const result=res.data||{};
  const ids=[result.primary_player_id,result.partner_player_id].filter(Boolean).map(String);
  ids.forEach(function(id){if(!e.playerIds.includes(id))e.playerIds.push(id)});
  if(e.competitionType==="fixed_pairs"&&ids.length===2){
   e.fixedPairRegistrations=e.fixedPairRegistrations||{};
   e.fixedPairRegistrations[ids[0]]={mode:"pair",partnerId:ids[1]};
   e.fixedPairRegistrations[ids[1]]={mode:"pair",partnerId:ids[0]};
  }
  save();
  pamToast("Richiesta accettata. Rigenera gironi e partite quando sei pronto.","success");
 }else if(action==="waitlist"){
  pamToast("Richiesta inserita in lista d’attesa.","success");
 }else{
  pamToast("Richiesta rifiutata.","success");
 }
 pamOpenRegistrations(eventId);
}

async function pamUploadTournamentLogo(id,file){
 if(!pamIsAdmin()||!file)return;
 const e=state.events.find(function(x){return x.id===id});if(!e)return;
 const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
 const path="tournaments/"+id+"-"+Date.now()+"."+ext;
 pamToast("Caricamento logo in corso...");
 const up=await sb.storage.from("padel-arena-images").upload(path,file,{upsert:true,contentType:file.type||undefined});
 if(up.error){pamToast("Errore caricamento: "+up.error.message,"error");return}
 e.logoUrl=sb.storage.from("padel-arena-images").getPublicUrl(path).data.publicUrl;
 save();render();
 pamToast("Logo del torneo aggiornato","success");
}
async function pamUploadPlayerPhoto(id,file){
 if(!pamIsAdmin()||!file)return;
 const p=state.players.find(function(x){return x.id===id});if(!p)return;
 const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
 const path="players/"+id+"-"+Date.now()+"."+ext;
 const up=await sb.storage.from("padel-arena-images").upload(path,file,{upsert:true,contentType:file.type||undefined});
 if(up.error){pamToast("Errore caricamento: "+up.error.message,"error");return}
 p.photoUrl=sb.storage.from("padel-arena-images").getPublicUrl(path).data.publicUrl;
 save();render();pamToast("Foto giocatore aggiornata","success");
}
function pamPlayerPhoto(p){
 return p&&p.photoUrl?p.photoUrl:"assets/padel-arena-reggio-emilia.jpeg";
}
function pamOpenSharedTournamentFromUrl(){
 const token=new URLSearchParams(location.search).get("tournament");
 if(!token)return;
 const e=state.events.find(function(x){return x.shareToken===token});
 if(e){state.currentEventId=e.id;state.view="event";state.tab="matches";localStorage.setItem(KEY,JSON.stringify(state));render();pamApplyRole()}
}

function setView(v){state.view=v;save();render()}
function setTab(v){state.tab=v;save();render()}
function header(title,sub){
 const e=state.view==="event"?currentEvent():null;
 const c=e?clubInfo(e.club):null;
 return eventPrintBranding(e)+
 '<div class="top pam-main-header">'+
  '<div class="brand">'+
   '<img class="app-brand-logo pam-master-logo" src="assets/padel-arena-manager-logo.jpg" alt="Padel Arena Manager">'+
   '<div><h1>'+esc(title||"Padel Arena Manager")+'</h1><small>'+esc(sub||"Tournament Management System")+'</small></div>'+
  '</div>'+
  (c?'<div class="pam-host-mini"><span>Club / ente</span><img src="'+esc(e.logoUrl||c.logo)+'" alt=""><b>'+esc(c.name)+'</b></div>':'')+
  '<div class="print-hide pam-header-actions"><button class="secondary" data-action="print-pdf">PDF / Condividi</button><span class="badge">v5.0 · Preview grafica</span></div>'+
 '</div>';
}
function nav(){
 return '<nav><div><button data-view="home">⌂<br>Home</button><button data-view="championship">🏆<br>Campionato</button><button data-view="players">👥<br>Giocatori</button><button data-view="events">🎾<br>Tornei</button></div></nav>';
}
function home(){
 const playerCount=state.players.length;
 const eventCount=state.events.length;
 return header("Padel Arena Manager","Sport Management Platform")+iphoneVersionBanner()+iphoneInstallCard()+
 '<div class="pam-v5-shell">'+
  '<section class="pam-v5-welcome">'+
   '<img class="pam-v5-welcome-logo" src="assets/padel-arena-manager-logo.jpg" alt="Padel Arena Manager">'+
   '<div><span class="pam-v5-kicker">PADEL · TECNOLOGIA · ORGANIZZAZIONE</span><h2>Buonasera Francesco.</h2><p>Gestisci tornei, campionati, club e giocatori da un’unica applicazione, con l’identità blu notte, blu elettrico e verde fluo del logo.</p></div>'+
  '</section>'+
  '<section><div class="pam-v5-section-title"><h2>Situazione generale</h2><small>Dati disponibili sul dispositivo</small></div><div class="pam-v5-status-grid">'+
   '<div class="pam-v5-stat"><i>🎾</i><b>'+eventCount+'</b><span>TORNEI SALVATI</span></div>'+
   '<div class="pam-v5-stat"><i>🏆</i><b>29</b><span>SQUADRE ISCRITTE</span></div>'+
   '<div class="pam-v5-stat"><i>🏟️</i><b>18</b><span>CLUB COINVOLTI</span></div>'+
   '<div class="pam-v5-stat"><i>👥</i><b>'+playerCount+'</b><span>GIOCATORI IN ARCHIVIO</span></div>'+
  '</div></section>'+
  '<section><div class="pam-v5-section-title"><h2>Accesso rapido</h2><small>Le funzioni che utilizzi di più</small></div><div class="pam-v5-actions">'+
   '<button class="pam-v5-action primary-tile" data-view="championship"><span class="tile-icon">🏆</span><strong>AICS Championship 2027</strong><small>Squadre, club, rose e documenti</small></button>'+
   '<button class="pam-v5-action" data-view="events"><span class="tile-icon">🎾</span><strong>Tornei</strong><small>Partite, risultati e classifiche</small></button>'+
   '<button class="pam-v5-action" data-view="players"><span class="tile-icon">👥</span><strong>Giocatori</strong><small>Anagrafica unica online</small></button>'+
   '<button class="pam-v5-action" data-view="new"><span class="tile-icon">＋</span><strong>Nuovo evento</strong><small>Crea una competizione</small></button>'+
  '</div></section>'+
  '<section class="pam-v5-campaign">'+
   '<div class="pam-v5-campaign-head"><img src="assets/aics.jpeg" alt="AICS"><div><span class="pam-v5-kicker">CAMPIONATO IN PREPARAZIONE</span><h2>AICS PADEL CHAMPIONSHIP 2027</h2><div class="muted">Iscrizioni squadre e organizzazione della nuova stagione</div></div><span class="pam-v5-badge">65% COMPLETATO</span></div>'+
   '<div class="pam-v5-progress"><span></span></div><div class="muted">Prossima fase: raccolta delle rose dei giocatori nell’ultima settimana di agosto.</div>'+
  '</section>'+
  '<section><div class="pam-v5-section-title"><h2>Club ed enti</h2><small>Identità secondarie, marchio software sempre dominante</small></div><div class="pam-v5-club-grid">'+
   '<div class="pam-v5-club"><img src="assets/eden-padel-club.jpeg"><div><b>Eden Padel Club</b><small>Accento rosso</small></div></div>'+
   '<div class="pam-v5-club"><img src="assets/happy-time-padel.jpeg"><div><b>Happy Time</b><small>Accento multicolore</small></div></div>'+
   '<div class="pam-v5-club"><img src="assets/cupra-symbol.jpeg"><div><b>CUPRA</b><small>Accento viola</small></div></div>'+
  '</div></section>'+
 '</div>';
}

const PAM_CHAMPIONSHIP_TEAMS = [{"id":"aics2027_01","submissionDate":"7/20/2026 13:05:09","teamName":"FIFTEEN RACQUET CLUB","clubLegalName":"FIFTEEN RACQUET CLUB","clubTaxId":"03127460347","clubAddress":"VIA RENZO PEZZANI 47A","clubPostalCode":"43029","clubTown":"TRAVERSETOLO","clubProvince":"PARMA","clubPhone":"3488204373","clubEmail":"nicola77.fagetti@gmail.com","homeCourtAddress":"VIA RENZO PEZZANI 47 43029 TRAVERSETOLO (PR)","homeDay":"Domenica","homeTime":"14:00 SOLO SABATO E DOMENICA","captainName":"GOFFREDO GATTI","captainBirthDate":"1969-07-02","captainBirthPlace":"PARMA","captainResidence":"SAN POLO D'ENZA","captainPhone":"334/6260938","captainEmail":"goffredo.gatti@gmail.com","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"eb641f337adbd7e419b29c653e1d3b2b"},{"id":"aics2027_02","submissionDate":"7/21/2026 9:46:10","teamName":"CA'MARTA squadra A","clubLegalName":"Ca'Marta sport&fun ssd a rl","clubTaxId":"03384630368","clubAddress":"via Regina Pacis 118","clubPostalCode":"41049","clubTown":"Ssasuolo","clubProvince":"modena","clubPhone":"0536812923","clubEmail":"tommyvale99@gmail.com","homeCourtAddress":"Sassuolo Via Regina Pacis 118 (mo)","homeDay":"Sabato","homeTime":"14:00 SOLO SABATO E DOMENICA","captainName":"Dignatici Luca","captainBirthDate":"1973-11-18","captainBirthPlace":"Sassuolo","captainResidence":"Sassuolo","captainPhone":"3357536953","captainEmail":"lucadignatici@hotmail.com","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"1e5c655dd0b65dae1543cb557e1c1f5d"},{"id":"aics2027_03","submissionDate":"7/21/2026 9:51:45","teamName":"CA'MARTA squadra B","clubLegalName":"CA'MARTA SPORT&FUN SSD A RL UNI","clubTaxId":"03384630368","clubAddress":"VIA REGINA PACIS 118","clubPostalCode":"41049","clubTown":"SASSUOLO","clubProvince":"MODENA","clubPhone":"0536 812923","clubEmail":"tommyvale99@gmail.com","homeCourtAddress":"SASSUOLO VIA REGINA PACIS 118 (mo)","homeDay":"Sabato","homeTime":"14:00 SOLO SABATO E DOMENICA","captainName":"VALENTI TOMMASO","captainBirthDate":"1989-09-21","captainBirthPlace":"CARPI","captainResidence":"CARPI","captainPhone":"3426480454","captainEmail":"tommyvale99@gmail.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"f82739604639840f3993414517315476"},{"id":"aics2027_04","submissionDate":"7/21/2026 9:56:08","teamName":"CA'MARTA squadra C","clubLegalName":"Ca'Marta sport&fun ssd a rl uni","clubTaxId":"03384630368","clubAddress":"Regina Pacis 118","clubPostalCode":"41049","clubTown":"Sassuolo","clubProvince":"MODENA","clubPhone":"0536812923","clubEmail":"tommyvale99@gmail.com","homeCourtAddress":"SASSUOLO VIA REGINA PACIS 118 (MO)","homeDay":"Sabato","homeTime":"16:00 SOLO SABATO E DOMENICA","captainName":"CANALI MATTEO","captainBirthDate":"1983-11-17","captainBirthPlace":"Sassuolo","captainResidence":"Prignano s/s (MO)","captainPhone":"3282280304","captainEmail":"mcanali83@gmail.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"27a2f7521b705337255ac794e591d916"},{"id":"aics2027_05","submissionDate":"7/21/2026 11:54:09","teamName":"Pol Nonantola Padel","clubLegalName":"Polisportiva Nonantola A.D.","clubTaxId":"80015050364","clubAddress":"Via Mazzini 34","clubPostalCode":"41015","clubTown":"Nonantola","clubProvince":"Modena","clubPhone":"3479565881","clubEmail":"polnonantola.padel@gmail.com","homeCourtAddress":"Via Risorgimento 50, 41015 Nonantola","homeDay":"Venerdi","homeTime":"20:00 SOLO VENERDÌ","captainName":"Marco Meschiari","captainBirthDate":"1981-09-15","captainBirthPlace":"Modena","captainResidence":"Modena","captainPhone":"3479565881","captainEmail":"marco.meschiari81@gmail.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"9548bac08b29fc4b5b25f2cdced44122"},{"id":"aics2027_06","submissionDate":"7/21/2026 17:07:14","teamName":"Padel Prime La Patria Carpi","clubLegalName":"S.G.La Patria 1879 ASD","clubTaxId":"90003660363","clubAddress":"Via Nuova Ponente 24/H","clubPostalCode":"41012","clubTown":"Carpi","clubProvince":"Modena","clubPhone":"059644070","clubEmail":"amministrazione.lapatria@gmail.com","homeCourtAddress":"Via Nuova Ponente 24/H, 41012, Carpi (MO)","homeDay":"Sabato","homeTime":"14:00 SOLO SABATO E DOMENICA","captainName":"Marco Gradellini","captainBirthDate":"1993-01-05","captainBirthPlace":"Carpi","captainResidence":"Carpi","captainPhone":"3467192364","captainEmail":"marco.grade@gmail.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"8968637df0729fb0ca7daa67ed41cf26"},{"id":"aics2027_07","submissionDate":"7/22/2026 17:39:24","teamName":"CT CORREGGIO 2","clubLegalName":"Circolo Tennis Correggio ASD","clubTaxId":"91010210358","clubAddress":"via Bruto Terrachini 2","clubPostalCode":"42015","clubTown":"Correggio","clubProvince":"Reggio Emilia","clubPhone":"0522637164","clubEmail":"direzione@ctcorreggio.it","homeCourtAddress":"via Bruto Terrachini 2 - 42015 Correggio (RE)","homeDay":"Sabato","homeTime":"14:00 SOLO SABATO E DOMENICA","captainName":"Maurizio Musso","captainBirthDate":"1972-07-11","captainBirthPlace":"Asti","captainResidence":"Correggio","captainPhone":"3470887572","captainEmail":"elemaeri@alice.it","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"be07b2c3818295a3b08cdbf40536a6da"},{"id":"aics2027_08","submissionDate":"7/27/2026 14:42:10","teamName":"Phoenix Cavriago","clubLegalName":"ASD Phoenix Cavriago","clubTaxId":"02500230350","clubAddress":"Via Torre n.3","clubPostalCode":"42025","clubTown":"Cavriago","clubProvince":"REGGIO NELL'EMILIA","clubPhone":"3478979048","clubEmail":"rocchi.marco@ognibene.com","homeCourtAddress":"Via Cantonazzo n.1, Cavriago 42025","homeDay":"Sabato","homeTime":"16:00 SOLO SABATO E DOMENICA","captainName":"Zecchetti Patrick","captainBirthDate":"1990-09-07","captainBirthPlace":"Montecchio Emilia","captainResidence":"Cavriago (RE) - 42025","captainPhone":"3498945499","captainEmail":"patrickz@libero.it","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"ef291d90603a3e6407cd3b444ee7f38d"},{"id":"aics2027_09","submissionDate":"7/27/2026 15:15:29","teamName":"MIRAPADEL CENTER","clubLegalName":"MIRAPADEL CENTER","clubTaxId":"04023790365","clubAddress":"VIA 2 GIUGNO 26","clubPostalCode":"41037","clubTown":"MIRANDOLA","clubProvince":"MODENA","clubPhone":"3428340667","clubEmail":"info@mirapadelcenter.it","homeCourtAddress":"VIA 2 GIUGNO 26, 41037 MIRANDOLA (MO)","homeDay":"Domenica","homeTime":"15:00 SOLO SABATO E DOMENICA","captainName":"LAGONEGRO ROSARIO","captainBirthDate":"1976-11-15","captainBirthPlace":"MILANO","captainResidence":"MIRANDOLA","captainPhone":"3406686972","captainEmail":"info@mirapadelcenter.it","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"be928a8283eba98180f5c62164f1e838"},{"id":"aics2027_10","submissionDate":"7/28/2026 8:19:14","teamName":"CT CORREGGIO Serie A","clubLegalName":"CIRCOLO TENNIS CORREGGIO ASD","clubTaxId":"91010210358","clubAddress":"B.TERRACHINI 2","clubPostalCode":"42015","clubTown":"CORREGGIO","clubProvince":"REGGIO EMILIA","clubPhone":"0522 637164","clubEmail":"ctcorreggio@wansport.com","homeCourtAddress":"Via B. Terrachini 2, 42015 Correggio RE","homeDay":"Sabato","homeTime":"17:00 SOLO SABATO E DOMENICA","captainName":"VEZZADINI DAVIDE","captainBirthDate":"1977-02-23","captainBirthPlace":"CORREGGIO","captainResidence":"CORREGGIO","captainPhone":"334 6886932","captainEmail":"vezzadini77@gmail.com","series":"Serie A","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"7d425b9a7e5fb27b622f0d6d734622bc"},{"id":"aics2027_11","submissionDate":"7/28/2026 11:28:10","teamName":"VILLAGE PADDLE MODENA","clubLegalName":"MODENA PADDLE CLUB SSDRL","clubTaxId":"03834490363","clubAddress":"STRADA BELLARIA 127/1","clubPostalCode":"41126","clubTown":"MODENA","clubProvince":"MODENA","clubPhone":"3512209713","clubEmail":"tornei.villagepaddle@gmail.com","homeCourtAddress":"STRADA CAVEZZO 27,  41126 BAGGIOVARA (MO)","homeDay":"Domenica","homeTime":"15:00 SOLO SABATO E DOMENICA","captainName":"ENZO ZARA","captainBirthDate":"1983-03-21","captainBirthPlace":"FORMIGINE (MO)","captainResidence":"FORMIGINE (MO)","captainPhone":"3397039671","captainEmail":"enzo.zara83@gmail.com","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"197e17dbebc13cffca9f3e02098ba27b"},{"id":"aics2027_12","submissionDate":"7/28/2026 15:10:56","teamName":"B&B TEAM - Bope & Bullet","clubLegalName":"PADEL ARENA SRL","clubTaxId":"02906640343","clubAddress":"Via Ernesto Ghirarduzzi 2","clubPostalCode":"43122","clubTown":"PARMA","clubProvince":"PARMA","clubPhone":"+393534253475","clubEmail":"proparmapadelarena@gmail.com","homeCourtAddress":"PRO GREEN STR. MARTINELLA 328 VIGATTO 43124 PR","homeDay":"Sabato","homeTime":"14:00 SOLO SABATO E DOMENICA","captainName":"NICOLA GROSSI","captainBirthDate":"1965-07-24","captainBirthPlace":"PARMA","captainResidence":"PARMA","captainPhone":"3357443152","captainEmail":"nicolagrossi659@gmail.com","series":"Serie A + Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"7ef1717ead2c959510ca1ad361968d7f"},{"id":"aics2027_13","submissionDate":"7/28/2026 23:21:37","teamName":"PRO PARMA LOBOS","clubLegalName":"PADEL ACCADEMY SSDRL","clubTaxId":"02913830341","clubAddress":"Via Ernesto Ghirarduzzi 2","clubPostalCode":"43122","clubTown":"Parma","clubProvince":"Parma","clubPhone":"3534253475","clubEmail":"proparmapadelarena@gmail.com","homeCourtAddress":"Via Ernesto Ghirarduzzi 2 (Parma) cap 43122","homeDay":"Venerdi","homeTime":"20:00 SOLO VENERDÌ","captainName":"Davide Chierici","captainBirthDate":"1968-02-18","captainBirthPlace":"Parma","captainResidence":"Montechiarugolo","captainPhone":"3313534301","captainEmail":"crociato68@gmail.com","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"b7181140951230695d6ea142595d9c7b"},{"id":"aics2027_14","submissionDate":"7/29/2026 7:42:33","teamName":"PRO PARMA TIGERS","clubLegalName":"PADEL ACADEMY SSDRL","clubTaxId":"02913830341","clubAddress":"ERNESTO GHIRARDUZZI, 2","clubPostalCode":"43122","clubTown":"PARMA","clubProvince":"PARMA","clubPhone":"0521772686","clubEmail":"proparmapadelarena@gmail.com","homeCourtAddress":"PARMA, VIA ERNESTO GHIRARDUZZI, 2 43122","homeDay":"Sabato","homeTime":"14:00 SOLO SABATO E DOMENICA","captainName":"FABRIZIO VENTURINI","captainBirthDate":"1972-09-29","captainBirthPlace":"PARMA","captainResidence":"PARMA","captainPhone":"3382666694","captainEmail":"disossoventurini@gmail.com","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"22220d9daa1a9bf4d66f92cb0038487a"},{"id":"aics2027_15","submissionDate":"7/29/2026 8:39:17","teamName":"Punto G Nera","clubLegalName":"ASD Punto G Padel","clubTaxId":"00702500349","clubAddress":"Via Sonnino 21","clubPostalCode":"43126","clubTown":"Parma","clubProvince":"Parma","clubPhone":"342 166 7082","clubEmail":"segreteria@puntopadel.it","homeCourtAddress":"Via Sonnino 21 - 43126 Parma","homeDay":"Venerdi","homeTime":"20:00 SOLO VENERDÌ","captainName":"Massimo Bosi","captainBirthDate":"1969-10-31","captainBirthPlace":"Parma","captainResidence":"Parma","captainPhone":"3356690914","captainEmail":"mbosilavoro@gmail.com","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"482fc05e38f16e30b19346ad48f00e21"},{"id":"aics2027_16","submissionDate":"7/29/2026 8:59:46","teamName":"Punto G White","clubLegalName":"ASD Punto G Padel","clubTaxId":"00702500349","clubAddress":"Via Sonnino 21","clubPostalCode":"43126","clubTown":"Parma","clubProvince":"Parma","clubPhone":"342 166 7082","clubEmail":"segreteria@puntopadel.it","homeCourtAddress":"Via Sonnino 21 - 43126 Parma","homeDay":"Venerdi","homeTime":"20:00 SOLO VENERDÌ","captainName":"Francesco Pizzi","captainBirthDate":"1980-02-18","captainBirthPlace":"San Secondo Parmense","captainResidence":"Roccabianca","captainPhone":"3483616933","captainEmail":"francescopizzi80@gmail.com","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"8e6e3ccf4f94c517c0ac869c1fbfe4c7"},{"id":"aics2027_17","submissionDate":"7/29/2026 9:22:59","teamName":"CANI SCIOLTI","clubLegalName":"PADEL CLUB REGGIOLO SRLSD","clubTaxId":"02949130351","clubAddress":"Strada Gavello n.3","clubPostalCode":"42046","clubTown":"Reggiolo","clubProvince":"Reggio Emilia","clubPhone":"3287469448","clubEmail":"info@padelclubreggiolo.com","homeCourtAddress":"Strada Gavello n.3, Reggiolo (RE) 42046","homeDay":"Domenica","homeTime":"11:00 SOLO DOMENICA","captainName":"Gabriele Palmieri","captainBirthDate":"1968-05-24","captainBirthPlace":"Campagnola Emilia","captainResidence":"Campagnola Emilia","captainPhone":"3481520720","captainEmail":"gpalmieri@ag-informatica.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"9860922d476ad5fcefd8f2ba49ceb75d"},{"id":"aics2027_18","submissionDate":"7/29/2026 12:18:22","teamName":"PALA RBG CREW","clubLegalName":"RACQUET BALL GAMES SSDaRL","clubTaxId":"03121830354","clubAddress":"VIA DEI PRATONIERI 7","clubPostalCode":"42124","clubTown":"REGGIO EMILIA","clubProvince":"REGGIO EMILIA","clubPhone":"3275612828","clubEmail":"racquetball@tim.it","homeCourtAddress":"VIA ERNESTO SPALLANZANI 8/A - 42124","homeDay":"Domenica","homeTime":"17:00 SOLO SABATO E DOMENICA","captainName":"RINALDI MARCO","captainBirthDate":"1980-11-20","captainBirthPlace":"FORMIGINE (MO)","captainResidence":"REGGIO EMILIA","captainPhone":"3337188334","captainEmail":"ing.rinaldi.marco@gmail.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"a4fe0e70c3a61f4ccdef016ea48943f1"},{"id":"aics2027_19","submissionDate":"7/29/2026 12:49:13","teamName":"PLAYA PADEL","clubLegalName":"PLAYA ASD","clubTaxId":"90054040366","clubAddress":"VIA IMPERIALE 22/A","clubPostalCode":"41037","clubTown":"MIRANDOLA","clubProvince":"MODENA","clubPhone":"3382130665","clubEmail":"measportsrl@gmail.com","homeCourtAddress":"Via imperiale 22/a 41037 Mirandola (MO)","homeDay":"Domenica","homeTime":"10:00 SOLO DOMENICA","captainName":"FAGLIONI ENRICO","captainBirthDate":"1970-09-14","captainBirthPlace":"MIRANDOLA (MO)","captainResidence":"CAVEZZO (MO)","captainPhone":"3382130665","captainEmail":"enricofaglioni70@gmail.com","series":"Serie B + Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"7357a7a2dcc1b11c0ea6f3b6a4d7a8cc"},{"id":"aics2027_20","submissionDate":"7/29/2026 21:50:04","teamName":"ALL STAR PADEL -SERIE C","clubLegalName":"ALL STAR PADEL SSDRL","clubTaxId":"04028950360","clubAddress":"VIA LAVACCHI 1635","clubPostalCode":"41038","clubTown":"SAN FELICE SUL PANARO","clubProvince":"MODENA","clubPhone":"3395796474","clubEmail":"amministrazione.allstarpadel@gmail.com","homeCourtAddress":"VIA LAVACCHI 1635, 41038 SAN FELICE SUL PANARO","homeDay":"Sabato","homeTime":"17:00 SOLO SABATO E DOMENICA","captainName":"ENRICO LEONELLI","captainBirthDate":"1979-01-21","captainBirthPlace":"BONDENO","captainResidence":"BONDENO","captainPhone":"3403669735","captainEmail":"enrico.allstarpadel@gmail.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"bd25d724f413b7895c5b251ad38d20a6"},{"id":"aics2027_21","submissionDate":"7/30/2026 13:00:16","teamName":"La quercia B","clubLegalName":"Ssd","clubTaxId":"02671840201","clubAddress":"Stradello Opi 7","clubPostalCode":"46026","clubTown":"Suzzara","clubProvince":"Mantova","clubPhone":"3498698003","clubEmail":"laquerciapadel@gmail.it","homeCourtAddress":"Stradello Opi 7 46029 suzzara","homeDay":"Sabato","homeTime":"15:00 SOLO SABATO E DOMENICA","captainName":"Stefano Storchi","captainBirthDate":"2026-07-30","captainBirthPlace":"Suzzara","captainResidence":"Suzzara","captainPhone":"3358433367","captainEmail":"stefano_storchi@virgilio.it","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"321e31ec5dcc9ef11bd229e1effc4822"},{"id":"aics2027_22","submissionDate":"7/30/2026 13:02:23","teamName":"HORMIGA PADEL CLUB","clubLegalName":"ASD HORMIGA","clubTaxId":"CF 94212630365","clubAddress":"VIA PANARO 193","clubPostalCode":"41056","clubTown":"SAVIGNANO SUL PANARO","clubProvince":"MODENA","clubPhone":"3240413208","clubEmail":"hormigapadel@gmail.com","homeCourtAddress":"via panaro 193, Formica di Savignano sul Panaro","homeDay":"Domenica","homeTime":"11:00 SOLO DOMENICA","captainName":"MAURO FIORANI","captainBirthDate":"1964-11-08","captainBirthPlace":"MODENA","captainResidence":"MODENA","captainPhone":"3358238780","captainEmail":"fioranimauro64@gmal.com","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"1d3ce08606b3a37d3a880a33af177711"},{"id":"aics2027_23","submissionDate":"7/30/2026 13:04:43","teamName":"Quercia C","clubLegalName":"Ssd","clubTaxId":"02671840201","clubAddress":"Stradello Opi 7","clubPostalCode":"46029","clubTown":"Suzzara","clubProvince":"Mantova","clubPhone":"3498698003","clubEmail":"laquerciapadel@gmail.it","homeCourtAddress":"Stradello Opi 7 46029 suzzara","homeDay":"Sabato","homeTime":"14:00 SOLO SABATO E DOMENICA","captainName":"Stefano Storchi","captainBirthDate":"2026-07-14","captainBirthPlace":"Suzzara","captainResidence":"Mantova","captainPhone":"3358433367","captainEmail":"stefano_storchi@virgilio.it","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"9b652470e6cae54b99aba9e12013cba2"},{"id":"aics2027_24","submissionDate":"7/30/2026 14:24:29","teamName":"Padel San Donnino A","clubLegalName":"Padel San Donnino S.S.D a R.L.","clubTaxId":"04053390367","clubAddress":"Via della Genziana, 18","clubPostalCode":"41126","clubTown":"Modena","clubProvince":"Modena","clubPhone":"3666358467","clubEmail":"padelsandonnino@gmail.com","homeCourtAddress":"Via della Genziana, 18, 41126","homeDay":"Sabato","homeTime":"17:00 SOLO SABATO E DOMENICA","captainName":"Francesco Teoli","captainBirthDate":"2002-10-01","captainBirthPlace":"Modena","captainResidence":"Modena","captainPhone":"3472612643","captainEmail":"francesco.teoli09@gmail.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"452df60bf8a25ddd65124021e140d479"},{"id":"aics2027_25","submissionDate":"7/30/2026 14:38:02","teamName":"Padel San Donnino B","clubLegalName":"Padel San Donnino S.S.D. a R.L.","clubTaxId":"04053390367","clubAddress":"Via della Genziana 18","clubPostalCode":"41126","clubTown":"Modena","clubProvince":"Modena","clubPhone":"3666358467","clubEmail":"padelsandonnino@gmail.com","homeCourtAddress":"Via della Genziana 18, 41126","homeDay":"Domenica","homeTime":"15:00 SOLO SABATO E DOMENICA","captainName":"Francesco Teoli","captainBirthDate":"2002-10-01","captainBirthPlace":"Modena","captainResidence":"Modena","captainPhone":"3472612643","captainEmail":"francesco.teoli09@gmail.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"68c779bcfdb353fe25005b757bc49f13"},{"id":"aics2027_26","submissionDate":"7/30/2026 21:28:13","teamName":"Qui Pádel C","clubLegalName":"Qui Padel & Fun SSD","clubTaxId":"02674970203","clubAddress":"G. Di Vittorio 49","clubPostalCode":"46026","clubTown":"Quistello","clubProvince":"MN","clubPhone":"3458345177","clubEmail":"quipadel@gmail.com","homeCourtAddress":"via Allende 7, 46026 Quistello MN","homeDay":"Domenica","homeTime":"15:00 SOLO SABATO E DOMENICA","captainName":"Emiliano Verolla","captainBirthDate":"1978-10-11","captainBirthPlace":"Formia LT","captainResidence":"Carpi","captainPhone":"3458345177","captainEmail":"emilioverolla11@gmail.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"26715c3fd053394ceb51c3c5579be8d8"},{"id":"aics2027_27","submissionDate":"7/30/2026 22:23:29","teamName":"EDEN ACADEMY SERIE C","clubLegalName":"EDEN SPORT & SALUTE","clubTaxId":"02310620352","clubAddress":"VIA G.BALLA 6","clubPostalCode":"42124","clubTown":"REGGIO EMILIA","clubProvince":"RE","clubPhone":"0522944244","clubEmail":"info@edenbenessere.it","homeCourtAddress":"VIA G.BALLA 6 42124 REGGIO EMILIA","homeDay":"Domenica","homeTime":"17:00 SOLO SABATO E DOMENICA","captainName":"AUGUSTO AUBRY","captainBirthDate":"1974-09-27","captainBirthPlace":"NAPOLI","captainResidence":"SCANDIANO","captainPhone":"3405918068","captainEmail":"augustoaubry@gmail.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"cb5ff81c53eb60444a471cb80d6f2a27"},{"id":"aics2027_28","submissionDate":"7/31/2026 0:05:43","teamName":"BLUE PADEL CARPI C","clubLegalName":"BLUE PADEL CARPI","clubTaxId":"03955960368","clubAddress":"PIAZZALE DELLE PISCINE 4","clubPostalCode":"41012","clubTown":"CARPI","clubProvince":"modena","clubPhone":"MO","clubEmail":"amministrazione.bluepadelcarpi@gmail.com","homeCourtAddress":"Piazzale delle piscine 4 carpi 41012","homeDay":"Sabato","homeTime":"15:00 SOLO SABATO E DOMENICA","captainName":"Maria Pia Calabrese","captainBirthDate":"1991-09-30","captainBirthPlace":"carpi","captainResidence":"carpi","captainPhone":"3333208040","captainEmail":"pia@maglificiolsm.com","series":"Serie C","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"fc74338b71f7af2969764bcb46af624c"},{"id":"aics2027_29","submissionDate":"7/31/2026 0:10:17","teamName":"BLUE PADEL CARPI B","clubLegalName":"BLUE PADEL CARPI","clubTaxId":"03955960368","clubAddress":"PIAZZALE DELLE PISCINE 4","clubPostalCode":"41012","clubTown":"CARPI","clubProvince":"MODENA","clubPhone":"3333208040","clubEmail":"pia@maglificiolsm.com","homeCourtAddress":"PIAZZALE DELLE PISCINE 4 CARPI 41012","homeDay":"Venerdi","homeTime":"20:00 SOLO VENERDÌ","captainName":"MARIA PIA CALABRESE","captainBirthDate":"1991-09-30","captainBirthPlace":"CARPI","captainResidence":"CARPI","captainPhone":"3333208040","captainEmail":"pia@maglificiolsm.com","series":"Serie B","regulationAccepted":true,"privacyAccepted":true,"status":"Iscritta","rosterStatus":"Da compilare","captainAccessEnabled":false,"inviteToken":"7d069a1fbf11a1d1a8a6d086ab0037fe"}];
const PAM_CHAMP_TEAMS_KEY="pam_championship_2027_team_overrides";
function pamChampOverrides(){
 try{return JSON.parse(localStorage.getItem(PAM_CHAMP_TEAMS_KEY)||"{}")}catch(_){return {}}
}
function pamChampTeams(){
 const overrides=pamChampOverrides();
 return PAM_CHAMPIONSHIP_TEAMS.map(function(t){return Object.assign({},t,overrides[t.id]||{})});
}
function pamChampTeam(id){return pamChampTeams().find(function(t){return t.id===id})||null}
function pamSaveChampTeam(id,patch){
 const all=pamChampOverrides();
 all[id]=Object.assign({},all[id]||{},patch||{});
 localStorage.setItem(PAM_CHAMP_TEAMS_KEY,JSON.stringify(all));
}
function pamCaptainPortalUrl(team){
 const base=location.href.split("?")[0].replace(/index\.html?$/i,"").replace(/\/$/,"");
 return base+"/captain-portal.html?invite="+encodeURIComponent(team.inviteToken);
}
function pamSeriesCount(label){
 return pamChampTeams().filter(function(t){return String(t.series).includes(label)}).length;
}
function pamOfficialTeamsList(){
 const teams=pamChampTeams();
 return '<section class="card"><div class="pam-v5-section-title"><div><h2>Squadre regolarmente iscritte</h2><small>Dati già precompilati dal modulo ufficiale: il capitano non dovrà reinserirli.</small></div><span class="pam-v5-badge">'+teams.length+' ISCRIZIONI</span></div>'+
 '<div class="pam-team-search"><input id="champTeamSearch" type="search" placeholder="Cerca squadra, club, capitano, serie..."><select id="champSeriesFilter"><option value="">Tutte le serie</option><option>Serie A</option><option>Serie B</option><option>Serie C</option></select></div>'+
 '<div id="champTeamRows">'+teams.map(function(t){
  const search=[t.teamName,t.clubLegalName,t.captainName,t.captainEmail,t.series,t.clubTown].join(" ").toLowerCase();
  return '<div class="pam-official-team" data-champ-team-row="'+esc(search)+'" data-champ-series="'+esc(t.series)+'">'+
   '<div class="pam-official-team-main"><b><span class="status-dot status-ok"></span>'+esc(t.teamName)+'</b><small>'+esc(t.clubLegalName)+' · '+esc(t.clubTown)+' ('+esc(t.clubProvince)+')</small></div>'+
   '<span class="pill">'+esc(t.series)+'</span>'+
   '<div><b>'+esc(t.captainName)+'</b><small>'+esc(t.captainEmail)+'</small></div>'+
   '<div class="'+(t.captainAccessEnabled?"pam-access-on":"pam-access-off")+'"><b>'+(t.captainAccessEnabled?"ACCESSO ATTIVO":"ACCESSO CHIUSO")+'</b><small>'+esc(t.rosterStatus)+'</small></div>'+
   '<div class="pam-team-buttons"><button class="small" data-open-champ-team="'+t.id+'">Apri</button>'+
   '<button class="secondary" data-toggle-team-access="'+t.id+'">'+(t.captainAccessEnabled?"Disabilita":"Abilita")+'</button>'+
   '<button class="primary" style="width:auto" data-share-team-invite="'+t.id+'" '+(t.captainAccessEnabled?"":"disabled")+'>Invia link</button></div>'+
  '</div>';
 }).join("")+'</div></section>';
}

function pamCompetitionLogos(){
 return '<section class="card pam-competition-showcase">'+
  '<div class="pam-v5-section-title"><div><span class="pam-v5-kicker">IDENTITÀ UFFICIALI</span><h2>Competizioni AICS Padel 2027</h2></div><small>Visibili ad amministratori, capitani e giocatori</small></div>'+
  '<div class="pam-competition-logo-grid">'+
   '<article><img src="assets/aics-serie-a-2027.png" alt="AICS Padel Championship 2027 Serie A"><b>Serie A</b></article>'+
   '<article><img src="assets/aics-serie-b-2027.png" alt="AICS Padel Championship 2027 Serie B"><b>Serie B</b></article>'+
   '<article><img src="assets/aics-serie-c-2027.png" alt="AICS Padel Championship 2027 Serie C"><b>Serie C</b></article>'+
   '<article><img src="assets/aics-coppa-italia-2027.png" alt="Coppa Italia AICS Padel 2027"><b>Coppa Italia</b></article>'+
   '<article><img src="assets/aics-supercoppa-2027.png" alt="Supercoppa AICS Padel 2027"><b>Supercoppa</b></article>'+
  '</div></section>';
}
function pamSeriesLogo(series){
 const key=String(series||"").toLowerCase();
 if(key.includes("serie a"))return "assets/aics-serie-a-2027.png";
 if(key.includes("serie b"))return "assets/aics-serie-b-2027.png";
 return "assets/aics-serie-c-2027.png";
}

function championshipView(){
 const teams=pamChampTeams();
 return header("AICS Padel Championship 2027","Gestione campionato")+
 '<div class="pam-v5-shell">'+
  '<section class="card pam-champ-toolbar"><div class="pam-champ-title"><img src="assets/aics.jpeg"><div><span class="pam-v5-kicker">STAGIONE 2027</span><h2>AICS PADEL CHAMPIONSHIP</h2><div class="muted">Pannello organizzativo centrale</div></div></div><button class="primary" style="width:auto" data-view="home">Torna alla Home</button></section>'+
  '<section class="pam-v5-campaign"><div class="pam-v5-section-title"><div><span class="pam-v5-kicker">ISCRIZIONI UFFICIALI IMPORTATE</span><h2>Dati pronti per i capitani</h2></div><span class="pam-v5-badge">'+teams.length+' SQUADRE</span></div><div class="pam-v5-progress"><span style="width:72%"></span></div><div class="muted">Anagrafiche di club, squadra e capitano già compilate. Tu decidi singolarmente quando aprire l’accesso alla rosa.</div></section>'+
  pamCompetitionLogos()+
  '<section class="pam-champ-metrics">'+
   '<div class="pam-champ-metric"><b>'+new Set(teams.map(function(t){return t.clubTaxId||t.clubLegalName})).size+'</b><span>CLUB</span></div>'+
   '<div class="pam-champ-metric"><b>'+teams.length+'</b><span>ISCRIZIONI</span></div>'+
   '<div class="pam-champ-metric"><b>'+pamSeriesCount("Serie A")+'</b><span>SERIE A</span></div>'+
   '<div class="pam-champ-metric"><b>'+pamSeriesCount("Serie B")+'</b><span>SERIE B</span></div>'+
   '<div class="pam-champ-metric"><b>'+pamSeriesCount("Serie C")+'</b><span>SERIE C</span></div>'+
   '<div class="pam-champ-metric"><b>'+teams.filter(function(t){return t.captainAccessEnabled}).length+'</b><span>ACCESSI APERTI</span></div>'+
  '</section>'+pamOfficialTeamsList()+
 '</div>';
}
function championshipTeamView(){
 const t=pamChampTeam(state.champTeamId);
 if(!t){state.view="championship";return championshipView()}
 const link=pamCaptainPortalUrl(t);
 const f=function(label,key,type,wide){
  return '<div class="field '+(wide?"wide":"")+'"><label>'+label+'</label><input data-champ-field="'+key+'" type="'+(type||"text")+'" value="'+esc(t[key]||"")+'"></div>';
 };
 return header(t.teamName,"Scheda ufficiale squadra")+'<div class="pam-v5-shell">'+
 '<section class="card pam-champ-toolbar pam-team-series-hero"><img class="pam-team-series-logo" src="'+pamSeriesLogo(t.series)+'" alt="'+esc(t.series)+'"><div><span class="pam-v5-kicker">'+esc(t.series)+' · ISCRIZIONE REGOLARE</span><h2>'+esc(t.teamName)+'</h2><div class="muted">Dati importati dal modulo ufficiale del campionato.</div></div><button class="secondary" data-view="championship">← Tutte le squadre</button></section>'+
 '<section class="pam-team-access-box"><div class="pam-team-access-head"><div><span class="pam-v5-kicker">PORTALE CAPITANO</span><h2>'+esc(t.captainName)+'</h2><div class="muted">Il capitano potrà lavorare esclusivamente su questa squadra e soltanto mentre l’accesso è autorizzato.</div></div>'+
 '<label class="pam-switch"><input type="checkbox" data-team-access-checkbox="'+t.id+'" '+(t.captainAccessEnabled?"checked":"")+'> '+(t.captainAccessEnabled?"ACCESSO ATTIVO":"ACCESSO DISABILITATO")+'</label></div>'+
 '<div class="pam-link-preview">'+esc(link)+'</div><div class="row"><button class="primary" data-share-team-invite="'+t.id+'" '+(t.captainAccessEnabled?"":"disabled")+'>Copia / condividi link personale</button><button class="secondary" data-preview-team-portal="'+t.id+'">Anteprima portale capitano</button></div>'+
 '<div class="notice '+(t.captainAccessEnabled?"success":"error")+'">'+(t.captainAccessEnabled?"Il link è utilizzabile. Al primo accesso il capitano dovrà creare il proprio account con la sua email.":"Il link non consente modifiche finché non abiliti l’accesso.")+'</div></section>'+
 '<section class="card"><div class="pam-v5-section-title"><h2>Dati della squadra</h2><small>Già precompilati: puoi correggerli prima di aprire il portale.</small></div><div class="pam-team-form-grid">'+
 f("Nome squadra","teamName")+f("Serie","series")+f("Ragione sociale club","clubLegalName")+f("Codice fiscale / P. IVA","clubTaxId")+
 f("Indirizzo club","clubAddress")+f("CAP","clubPostalCode")+f("Comune","clubTown")+f("Provincia","clubProvince")+
 f("Telefono club","clubPhone")+f("Email club","clubEmail","email")+f("Campo di casa","homeCourtAddress","text",true)+
 f("Giorno gare interne","homeDay")+f("Orario gare interne","homeTime")+
 '</div></section>'+
 '<section class="card"><div class="pam-v5-section-title"><h2>Dati del capitano / referente</h2><small>Serviranno per associare l’account alla squadra corretta.</small></div><div class="pam-team-form-grid">'+
 f("Nome e cognome","captainName")+f("Email di accesso","captainEmail","email")+f("Telefono","captainPhone")+f("Data di nascita","captainBirthDate","date")+
 f("Luogo di nascita","captainBirthPlace")+f("Comune di residenza","captainResidence")+
 '</div><button class="primary" data-save-champ-team="'+t.id+'">Salva eventuali correzioni</button></section>'+
 '<section class="card"><div class="pam-v5-section-title"><h2>Rosa giocatori</h2><small>Puoi inserire direttamente i giocatori oppure inviare il link personale della squadra.</small></div><div class="pam-roster-placeholder"><div><b>0 / 20</b><small>Giocatori inseriti</small></div><div><b>0</b><small>In attesa di approvazione</small></div><div><b>0</b><small>Schierabili</small></div></div><div class="pam-final-actions"><button class="primary" style="width:auto" data-add-team-player="'+t.id+'">Inserisci giocatore</button><button class="secondary" data-toggle-roster="'+t.id+'">Chiudi raccolta rosa</button><button class="secondary" data-share-player-link="'+t.id+'">Invia link ai giocatori</button><button class="secondary" data-copy-player-link="'+t.id+'">Copia link squadra</button></div><div class="notice success"><b>Raccolta rose attiva.</b> Capitano e giocatori possono già inserire i dati.<br><br><b>Istruzioni incluse nel messaggio:</b> il giocatore apre il link, compila i propri dati, carica la foto e invia la richiesta. La registrazione resta in attesa finché capitano o organizzazione non la approvano.</div></section>'+
 '</div>';
}
async function pamToggleTeamAccess(id,forced){
 const t=pamChampTeam(id);if(!t)return;
 const next=typeof forced==="boolean"?forced:!t.captainAccessEnabled;
 pamSaveChampTeam(id,{captainAccessEnabled:next});
 if(pamIsAdmin()&&PAM_SESSION){
  const result=await sb.from("championship_teams").update({access_enabled:next,updated_at:new Date().toISOString()}).eq("id",id);
  if(result.error&&!String(result.error.message||"").includes("championship_teams")){
   pamToast("Accesso salvato sul dispositivo, ma Supabase ha risposto: "+result.error.message,"error");
  }
 }
 render();
 pamToast(next?"Accesso capitano abilitato. Ora puoi inviare il link.":"Accesso capitano disabilitato.","success");
}
async function pamShareTeamInvite(id){
 const t=pamChampTeam(id);if(!t)return;
 if(!t.captainAccessEnabled){pamToast("Prima devi abilitare l’accesso per questa squadra.","error");return}
 const url=pamCaptainPortalUrl(t);
 const text="Ciao "+t.captainName+", ecco il link personale per accedere alla gestione della squadra "+t.teamName+" nell’AICS Padel Championship 2027. Al primo accesso crea il tuo account usando l’indirizzo "+t.captainEmail+". "+url;
 try{
  if(navigator.share){await navigator.share({title:"Accesso squadra "+t.teamName,text:text,url:url})}
  else{await navigator.clipboard.writeText(text);pamToast("Messaggio e link copiati negli appunti.","success")}
 }catch(err){if(err&&err.name!=="AbortError")pamToast("Non riesco a condividere il link: "+err.message,"error")}
}
async function pamSaveChampTeamForm(id){
 const patch={};
 document.querySelectorAll("[data-champ-field]").forEach(function(el){patch[el.getAttribute("data-champ-field")]=el.value.trim()});
 pamSaveChampTeam(id,patch);
 if(pamIsAdmin()&&PAM_SESSION){
  const remote={
   team_name:patch.teamName,series:patch.series,club_legal_name:patch.clubLegalName,club_tax_id:patch.clubTaxId,
   club_address:patch.clubAddress,club_postal_code:patch.clubPostalCode,club_town:patch.clubTown,club_province:patch.clubProvince,
   club_phone:patch.clubPhone,club_email:patch.clubEmail,home_court_address:patch.homeCourtAddress,home_day:patch.homeDay,home_time:patch.homeTime,
   captain_name:patch.captainName,captain_email:patch.captainEmail,captain_phone:patch.captainPhone,captain_birth_date:patch.captainBirthDate||null,
   captain_birth_place:patch.captainBirthPlace,captain_residence:patch.captainResidence,updated_at:new Date().toISOString()
  };
  const result=await sb.from("championship_teams").update(remote).eq("id",id);
  if(result.error)pamToast("Dati salvati localmente; sincronizzazione Supabase non disponibile: "+result.error.message,"error");
 }
 render();pamToast("Dati della squadra aggiornati.","success");
}

function playersView(){
 const orderedPlayers=state.players.slice().sort(function(a,b){return playerName(a).localeCompare(playerName(b),"it")});
 const rows=orderedPlayers.length?orderedPlayers.map(function(p,i){
  const searchText=[playerName(p),p.phone,p.email,p.birthPlace,p.postalCode,p.residenceTown,p.residenceProvince].join(" ").toLowerCase();
  return '<div class="item player-search-row" data-player-search="'+esc(searchText)+'"><img class="player-avatar" src="'+esc(pamPlayerPhoto(p))+'" alt="'+esc(playerName(p))+'"><div class="grow"><b>'+esc(playerName(p))+'</b><div class="muted">'+esc(p.gender||"Categoria non indicata")+' · Saldo gettoni: <b>'+Number(p.tokenBalance||0)+'</b>'+(p.phone?" · "+esc(p.phone):"")+'</div>'+
  '<div class="muted">'+
  (p.birthPlace?'Nato/a a '+esc(p.birthPlace):'Luogo di nascita non compilato')+
  ' · '+(p.postalCode?'CAP '+esc(p.postalCode):'CAP non compilato')+
  ' · '+(p.residenceTown?esc(p.residenceTown):'Comune non compilato')+
  (p.residenceProvince?' ('+esc(p.residenceProvince)+')':' · Provincia non compilata')+
  '</div></div><label class="upload-button player-photo-control">Foto<input type="file" accept="image/*" data-player-photo="'+p.id+'"></label><button class="small" data-edit-player="'+p.id+'">Modifica</button></div>'
 }).join(""):'<div class="muted">Nessun cliente presente.</div>';
 return header("Anagrafica clienti","Crea una volta, riutilizza sempre")+
 '<div class="card"><h2>Nuovo cliente / giocatore</h2><div id="playerMessage"></div>'+
 '<div class="row"><div class="field"><label>Nome</label><input id="pFirst"></div><div class="field"><label>Cognome</label><input id="pLast"></div></div>'+
 '<div class="row"><div class="field"><label>Telefono</label><input id="pPhone"></div><div class="field"><label>Email</label><input id="pEmail" type="email"></div></div>'+
 '<div class="row"><div class="field"><label>Data di nascita</label><input id="pBirth" type="date"></div><div class="field"><label>Luogo di nascita</label><input id="pBirthPlace"></div></div>'+
 '<div class="row"><div class="field"><label>CAP</label><input id="pPostalCode" inputmode="numeric" maxlength="5"></div><div class="field"><label>Comune di residenza</label><input id="pResidenceTown"></div><div class="field"><label>Provincia</label><input id="pResidenceProvince" maxlength="2" placeholder="Es. RE"></div></div>'+
 '<div class="row"><div class="field"><label>Livello / categoria</label><input id="pLevel" placeholder="Es. NC, 4ª, principiante"></div><div class="field"><label>Categoria circuito</label><select id="pGender"><option>Maschile</option><option>Femminile</option></select></div><div class="field"><label>Saldo gettoni attuale</label><input id="pTokens" type="number" min="0" value="0"></div></div>'+
 '<div class="field"><label>Note</label><textarea id="pNotes"></textarea></div>'+
 '<button class="primary" data-action="save-player">Salva anagrafica</button></div>'+
 '<div class="card"><h2>Clienti esistenti ('+state.players.length+')</h2>'+
 '<div class="field print-hide"><label>Cerca giocatore o giocatrice</label><input id="playerSearchInput" type="search" placeholder="Scrivi nome, cognome, telefono, comune..." autocomplete="off"></div>'+
 '<div id="playerSearchCount" class="muted print-hide">'+state.players.length+' nominativi visualizzati</div>'+
 '<div id="playerSearchRows">'+rows+'</div></div>';
}
function savePlayer(){
 const msg=document.getElementById("playerMessage");
 try{
  const first=document.getElementById("pFirst").value.trim();
  const last=document.getElementById("pLast").value.trim();
  if(!first||!last)throw new Error("nome e cognome sono obbligatori");
  const p={id:uid("p"),firstName:first,lastName:last,phone:document.getElementById("pPhone").value.trim(),email:document.getElementById("pEmail").value.trim(),birth:document.getElementById("pBirth").value,birthPlace:document.getElementById("pBirthPlace").value.trim(),postalCode:document.getElementById("pPostalCode").value.trim(),residenceTown:document.getElementById("pResidenceTown").value.trim(),residenceProvince:document.getElementById("pResidenceProvince").value.trim().toUpperCase(),level:document.getElementById("pLevel").value.trim(),notes:document.getElementById("pNotes").value.trim(),gender:document.getElementById("pGender").value,tokenBalance:Math.max(0,Number(document.getElementById("pTokens").value)||0)};
  state.players.push(p);save();render();
 }catch(e){
  console.error("Errore generazione competizione:",e);
  if(msg){msg.className="notice error";msg.textContent="Errore: "+e.message}
  alert("Impossibile generare le partite: "+e.message);
 }
}

let pamQuickPlayerContext=null;


function pamCurrentModalSelectedIds(){
 const overlay=document.getElementById("pamTournamentPlayersOverlay");
 if(!overlay)return null;
 return Array.from(overlay.querySelectorAll("[data-tournament-player]:checked"))
  .map(function(x){return x.getAttribute("data-tournament-player")});
}

function pamOpenQuickPlayer(context){
 if(!pamIsAdmin())return;
 pamQuickPlayerContext=context||{};
 document.getElementById("pamQuickPlayerOverlay")?.remove();
 const category=(context&&context.category)||state.draft.category||"Maschile";
 const overlay=document.createElement("div");
 overlay.id="pamQuickPlayerOverlay";
 overlay.className="pam-modal-overlay";
 overlay.innerHTML='<div class="pam-modal-card pam-quick-player-card">'+
  '<div class="pam-modal-head"><div><h2>Nuova anagrafica rapida</h2><div class="muted">Il giocatore sarà salvato nell’anagrafica generale e inserito direttamente nel torneo.</div></div><button class="secondary" data-close-quick-player>Chiudi</button></div>'+
  '<div id="pamQuickPlayerMessage"></div>'+
  '<div class="row"><div class="field"><label>Nome *</label><input id="pamQuickFirst" autocomplete="off"></div><div class="field"><label>Cognome *</label><input id="pamQuickLast" autocomplete="off"></div></div>'+
  '<div class="row"><div class="field"><label>Telefono</label><input id="pamQuickPhone" inputmode="tel"></div><div class="field"><label>Email</label><input id="pamQuickEmail" type="email"></div></div>'+
  '<div class="row"><div class="field"><label>Categoria</label><select id="pamQuickGender"><option '+(category==="Maschile"?"selected":"")+'>Maschile</option><option '+(category==="Femminile"?"selected":"")+'>Femminile</option></select></div><div class="field"><label>Saldo gettoni</label><input id="pamQuickTokens" type="number" min="0" value="0"></div></div>'+
  '<div class="row"><div class="field"><label>Livello</label><input id="pamQuickLevel" placeholder="Es. principiante, NC, 4ª"></div><div class="field"><label>Comune</label><input id="pamQuickTown"></div></div>'+
  '<button class="primary" data-save-quick-player>Salva e inserisci nel torneo</button>'+
 '</div>';
 document.body.appendChild(overlay);
 setTimeout(function(){document.getElementById("pamQuickFirst")?.focus()},50);
}

function pamSaveQuickPlayer(){
 if(!pamIsAdmin())return;
 const first=document.getElementById("pamQuickFirst").value.trim();
 const last=document.getElementById("pamQuickLast").value.trim();
 const msg=document.getElementById("pamQuickPlayerMessage");
 if(!first||!last){
  msg.className="notice error";msg.textContent="Nome e cognome sono obbligatori.";return;
 }
 const duplicate=state.players.find(function(p){
  return normalizeName(playerName(p))===normalizeName(first+" "+last);
 });
 if(duplicate){
  msg.className="notice error";
  msg.innerHTML='Esiste già <b>'+esc(playerName(duplicate))+'</b>. Usa il giocatore esistente oppure correggi il nome.';
  return;
 }
 const p={
  id:uid("p"),firstName:first,lastName:last,
  phone:document.getElementById("pamQuickPhone").value.trim(),
  email:document.getElementById("pamQuickEmail").value.trim(),
  birth:"",birthPlace:"",postalCode:"",
  residenceTown:document.getElementById("pamQuickTown").value.trim(),
  residenceProvince:"",
  level:document.getElementById("pamQuickLevel").value.trim(),
  notes:"Inserito rapidamente durante la gestione di un torneo",
  gender:document.getElementById("pamQuickGender").value,
  tokenBalance:Math.max(0,Number(document.getElementById("pamQuickTokens").value)||0)
 };
 state.players.push(p);
 const ctx=pamQuickPlayerContext||{};
 if(ctx.mode==="new-event"){
  if(ctx.replaceId)state.draft.selected=state.draft.selected.filter(function(id){return id!==ctx.replaceId});
  if(!state.draft.selected.includes(p.id))state.draft.selected.push(p.id);
  save();document.getElementById("pamQuickPlayerOverlay")?.remove();render();
 }else if(ctx.mode==="pair-partner"){
  if(!state.draft.selected.includes(p.id))state.draft.selected.push(p.id);
  pamAssignPartner(ctx.primaryPlayerId,p.id);
  document.getElementById("pamQuickPlayerOverlay")?.remove();
 }else if(ctx.mode==="existing-event"){
  const e=state.events.find(function(x){return x.id===ctx.eventId});
  if(e){
   let base=Array.isArray(ctx.selectedIds)?ctx.selectedIds.slice():(e.playerIds||[]).slice();
   if(ctx.replaceId)base=base.filter(function(id){return id!==ctx.replaceId});
   if(!base.includes(p.id))base.push(p.id);
   e.playerIds=Array.from(new Set(base));
   save();
  }
  document.getElementById("pamQuickPlayerOverlay")?.remove();
  pamTournamentPlayersModal(ctx.eventId);
 }else{
  save();document.getElementById("pamQuickPlayerOverlay")?.remove();render();
 }
 pamToast("Nuova anagrafica inserita.","success");
}

function pamOpenReplacePlayer(context){
 if(!pamIsAdmin())return;
 const old=playerById(context.replaceId);if(!old)return;
 document.getElementById("pamReplacePlayerOverlay")?.remove();
 const currentIds=context.mode==="new-event"?(state.draft.selected||[]):((state.events.find(function(e){return e.id===context.eventId})||{}).playerIds||[]);
 const candidates=state.players.filter(function(p){return p.id!==old.id&&!currentIds.includes(p.id)})
  .sort(function(a,b){return playerName(a).localeCompare(playerName(b),"it")});
 const rows=candidates.map(function(p){
  return '<button class="pam-replacement-row" data-replacement-player="'+p.id+'">'+
   '<img src="'+esc(pamPlayerPhoto(p))+'" alt=""><span><b>'+esc(playerName(p))+'</b><small>'+esc(p.gender||"Categoria non indicata")+(p.level?" · "+esc(p.level):"")+'</small></span>'+
  '</button>';
 }).join("")||'<div class="notice">Non ci sono altri giocatori disponibili.</div>';
 const overlay=document.createElement("div");
 overlay.id="pamReplacePlayerOverlay";
 overlay.className="pam-modal-overlay";
 overlay.innerHTML='<div class="pam-modal-card">'+
  '<div class="pam-modal-head"><div><h2>Sostituisci giocatore</h2><div class="muted">Stai sostituendo <b>'+esc(playerName(old))+'</b>.</div></div><button class="secondary" data-close-replace-player>Chiudi</button></div>'+
  '<div class="pam-replace-actions"><button class="primary" data-replace-with-new>➕ Crea un nuovo giocatore</button></div>'+
  '<div class="field"><label>Oppure cerca un giocatore già esistente</label><input id="pamReplacementSearch" type="search" placeholder="Nome o cognome"></div>'+
  '<div class="pam-replacement-list">'+rows+'</div>'+
 '</div>';
 document.body.appendChild(overlay);
 overlay.dataset.context=JSON.stringify(context);
 overlay.querySelector("#pamReplacementSearch").addEventListener("input",function(ev){
  const q=normalizeName(ev.target.value);
  overlay.querySelectorAll(".pam-replacement-row").forEach(function(row){
   row.style.display=!q||normalizeName(row.textContent).includes(q)?"grid":"none";
  });
 });
}

function pamApplyReplacement(newId){
 const overlay=document.getElementById("pamReplacePlayerOverlay");if(!overlay)return;
 const ctx=JSON.parse(overlay.dataset.context||"{}");
 if(ctx.mode==="new-event"){
  state.draft.selected=(state.draft.selected||[]).map(function(id){return id===ctx.replaceId?newId:id});
  state.draft.selected=Array.from(new Set(state.draft.selected));
  save();overlay.remove();render();
 }else if(ctx.mode==="existing-event"){
  const e=state.events.find(function(x){return x.id===ctx.eventId});if(!e)return;
  let base=Array.isArray(ctx.selectedIds)?ctx.selectedIds.slice():(e.playerIds||[]).slice();
  base=base.map(function(id){return id===ctx.replaceId?newId:id});
  e.playerIds=Array.from(new Set(base));
  save();overlay.remove();pamTournamentPlayersModal(e.id);
 }
 pamToast("Giocatore sostituito. Ricorda di rigenerare le partite.","success");
}

function editPlayer(id){
 const p=state.players.find(function(x){return x.id===id});if(!p)return;
 const first=prompt("Nome",p.firstName);if(first===null)return;
 const last=prompt("Cognome",p.lastName);if(last===null)return;
 const phone=prompt("Telefono",p.phone||"");if(phone===null)return;
 const email=prompt("Email",p.email||"");if(email===null)return;
 const birthPlace=prompt("Luogo di nascita",p.birthPlace||"");if(birthPlace===null)return;
 const postalCode=prompt("CAP",p.postalCode||"");if(postalCode===null)return;
 const residenceTown=prompt("Comune di residenza",p.residenceTown||"");if(residenceTown===null)return;
 const residenceProvince=prompt("Provincia",p.residenceProvince||"");if(residenceProvince===null)return;
 p.firstName=first.trim();p.lastName=last.trim();p.phone=phone.trim();p.email=email.trim();
 p.birthPlace=birthPlace.trim();p.postalCode=postalCode.trim();p.residenceTown=residenceTown.trim();p.residenceProvince=residenceProvince.trim().toUpperCase();
 save();render();
}
function competitionTypeLabel(v){
 return v==="rodeo_simple"?"RODEO SEMPLICE":v==="fixed_pairs"?"Coppie fisse":"Rodeo a gettoni";
}
function newEventView(){
 const d=state.draft;
 const eligible=state.players.filter(function(p){return d.category==="Misto"||!p.gender||p.gender===d.category}).sort(function(a,b){return Number(b.tokenBalance||0)-Number(a.tokenBalance||0)||playerName(a).localeCompare(playerName(b),"it")});
 const checks=eligible.length?eligible.map(function(p){
  const checked=d.selected.includes(p.id)?"checked":"";
  return '<div class="check event-player-search-row pam-select-player-row '+(d.showSelectedOnly&&!checked?"pam-hidden-unselected":"")+'" data-event-player-search="'+esc([playerName(p),p.phone,p.email,p.residenceTown].join(" ").toLowerCase())+'">'+
   '<label class="pam-player-select-main"><input type="checkbox" data-select-player="'+p.id+'" '+checked+'><span><b>'+esc(playerName(p))+'</b><br><small>'+(
   d.competitionType==="rodeo_tokens"?"Saldo aggiornato: "+Number(p.tokenBalance||0)+" gettoni":"Giocatore registrato"
  )+(p.level?" · "+esc(p.level):"")+
  (d.competitionType==="fixed_pairs"&&checked?'<br><b class="pam-pair-reg-label">'+esc(pamPairRegistrationLabel(p.id)||"DA DEFINIRE")+'</b>':'')+
  '</small></span></label>'+
   (checked?'<button type="button" class="small pam-replace-inline" data-replace-new-event-player="'+p.id+'">Sostituisci</button>':'')+
  '</div>';
 }).join(""):'<div class="notice error">Prima crea almeno 4 giocatori nell’anagrafica.</div>';
 const fixedOptions=d.competitionType==="fixed_pairs"?
  '<div class="row"><div class="field"><label>Coppie per girone</label><select id="ePairsPerGroup">'+[3,4,5,6].map(function(x){return'<option '+(Number(d.pairsPerGroup)===x?"selected":"")+'>'+x+'</option>'}).join("")+'</select></div>'+
  '<div class="field"><label>Qualificazione fasi finali</label><select id="eFinalsOption"><option value="top1" '+(d.finalsOption==="top1"?"selected":"")+'>Solo prime</option><option value="top2" '+(d.finalsOption==="top2"?"selected":"")+'>Prime due</option></select></div></div>'+
  '<div class="notice">Per ogni giocatore selezionato indica se l’iscrizione è singola oppure in coppia. Le iscrizioni in coppia resteranno unite; le singole verranno abbinate tra loro.</div>':'';
 return header("Nuova competizione","Scegli il formato e seleziona i partecipanti")+
 '<div class="card"><div class="row"><div class="field"><label>Formato competizione</label><select id="eCompetitionType" data-action="change-type">'+
 '<option value="rodeo_tokens" '+(d.competitionType==="rodeo_tokens"?"selected":"")+'>RODEO A GETTONI</option>'+
 '<option value="rodeo_simple" '+(d.competitionType==="rodeo_simple"?"selected":"")+'>RODEO SEMPLICE</option>'+
 '<option value="fixed_pairs" '+(d.competitionType==="fixed_pairs"?"selected":"")+'>COPPIE FISSE</option></select></div>'+
 '<div class="field"><label>Quota individuale (€)</label><input id="eFee" type="number" min="0" step="0.50" value="'+Number(d.fee||0)+'"></div></div>'+
 '<div class="row"><div class="field"><label>Nome competizione</label><input id="eName" value="'+esc(d.name)+'"></div><div class="field"><label>Data</label><input id="eDate" type="date" value="'+esc(d.date)+'"></div></div>'+
 '<div class="row"><div class="field"><label>Centro ospitante</label><select id="eClub">'+Object.keys(CLUBS).map(function(x){return'<option value="'+esc(x)+'" '+(x===d.club?"selected":"")+'>'+esc(x)+' - '+esc(CLUBS[x].address)+'</option>'}).join("")+'</select></div><div class="field"><label>Categoria</label><select id="eCategory" data-action="change-category">'+["Maschile","Femminile","Misto"].map(function(x){return'<option '+(x===d.category?"selected":"")+'>'+x+'</option>'}).join("")+'</select></div><div class="field"><label>Campi</label><select id="eCourts">'+[1,2,3,4].map(function(x){return'<option '+(Number(d.courts)===x?"selected":"")+'>'+x+'</option>'}).join("")+'</select></div></div>'+
 '<div id="pamCustomAddressWrap" class="field '+(pamClubAllowsCustomAddress(d.club)?"":"hidden")+'"><label>Indirizzo completo dell’evento</label><input id="eCustomAddress" value="'+esc(d.customAddress||"")+'" placeholder="Via, numero civico, città e provincia"></div>'+
 '<div class="row"><div class="field"><label>Orario di inizio</label><input id="eStartTime" type="time" value="'+esc(d.startTime||"20:00")+'"></div>'+
 '<div class="field"><label>Durata effettiva partita / timer (minuti)</label><input id="eTimerDuration" type="number" min="1" value="'+Number(d.timerDuration||d.matchDuration||15)+'"></div>'+
 '<div class="field"><label>Intervallo tra gli inizi delle partite (minuti)</label><input id="eSlotDuration" type="number" min="1" value="'+Number(d.slotDuration||d.matchDuration||20)+'"></div></div>'+
 '<div class="notice"><b>Esempio:</b> timer da 15 minuti e nuova partita ogni 20 minuti = 5 minuti di pausa.</div>'+
 '<div class="row"><div class="field"><label>Timer fase iniziale</label><select id="eInitialTimer"><option value="yes" '+(d.initialTimerEnabled?"selected":"")+'>Attivo</option><option value="no" '+(!d.initialTimerEnabled?"selected":"")+'>Disattivo</option></select></div>'+
 '<div class="field"><label>Timer eliminatorie</label><select id="eEliminationTimer"><option value="yes" '+(d.eliminationTimerEnabled?"selected":"")+'>Attivo</option><option value="no" '+(!d.eliminationTimerEnabled?"selected":"")+'>Disattivo</option></select></div>'+
 '<div class="field"><label>Timer semifinali</label><select id="eSemifinalTimer"><option value="yes" '+(d.semifinalTimerEnabled?"selected":"")+'>Attivo</option><option value="no" '+(!d.semifinalTimerEnabled?"selected":"")+'>Disattivo</option></select></div>'+
 '<div class="field"><label>Timer finale</label><select id="eFinalTimer"><option value="yes" '+(d.finalTimerEnabled?"selected":"")+'>Attivo</option><option value="no" '+(!d.finalTimerEnabled?"selected":"")+'>Disattivo</option></select></div></div>'+
 '<div class="row"><div class="field"><label>Gironi / fase iniziale</label><select id="eReturnLeg"><option value="no" '+(!d.returnLeg?"selected":"")+'>SOLO ANDATA</option><option value="yes" '+(d.returnLeg?"selected":"")+'>ANDATA E RITORNO</option></select></div>'+
 '<div class="field"><label>Eliminatorie</label><select id="eEliminationReturnLeg"><option value="no" '+(!d.eliminationReturnLeg?"selected":"")+'>SOLO ANDATA</option><option value="yes" '+(d.eliminationReturnLeg?"selected":"")+'>ANDATA E RITORNO</option></select></div>'+
 '<div class="field"><label>Semifinali</label><select id="eSemifinalReturnLeg"><option value="no" '+(!d.semifinalReturnLeg?"selected":"")+'>SOLO ANDATA</option><option value="yes" '+(d.semifinalReturnLeg?"selected":"")+'>ANDATA E RITORNO</option></select></div>'+
 '<div class="field"><label>Finale</label><select id="eFinalReturnLeg"><option value="no" '+(!d.finalReturnLeg?"selected":"")+'>SOLO ANDATA</option><option value="yes" '+(d.finalReturnLeg?"selected":"")+'>ANDATA E RITORNO</option></select></div></div>'+fixedOptions+'</div>'+
 '<div class="card"><h2>Pubblicazione e iscrizioni</h2>'+
 '<div class="field"><label>Descrizione invito</label><textarea id="eDescription" rows="4" placeholder="Presentazione, programma, premi e informazioni utili...">'+esc(d.description||"")+'</textarea></div>'+
 '<div class="row"><div class="field"><label>Fine prevista: data</label><input id="eEndDate" type="date" value="'+esc(d.endDate||d.date)+'"></div><div class="field"><label>Fine prevista: ora</label><input id="eEndTime" type="time" value="'+esc(d.endTime||"23:00")+'"></div></div>'+
 '<div class="row"><div class="field"><label>Numero minimo giocatori</label><input id="eRegistrationMin" type="number" min="1" value="'+Number(d.registrationMin||4)+'"></div><div class="field"><label>Numero massimo giocatori</label><input id="eRegistrationCapacity" type="number" min="4" value="'+Number(d.registrationCapacity||16)+'"></div></div>'+
 '<div class="row"><div class="field"><label>Stato iscrizioni</label><select id="eRegistrationOpen"><option value="yes" '+(d.registrationOpen!==false?"selected":"")+'>APERTE</option><option value="no" '+(d.registrationOpen===false?"selected":"")+'>CHIUSE</option></select></div><div class="field"><label>Lista di attesa</label><select id="eWaitlistEnabled"><option value="yes" '+(d.waitlistEnabled!==false?"selected":"")+'>ATTIVA</option><option value="no" '+(d.waitlistEnabled===false?"selected":"")+'>DISATTIVA</option></select></div></div>'+
 '<div class="field"><label>Base grafica locandina</label><select id="ePosterTheme"><option value="eden_summer" '+(d.posterTheme==="eden_summer"?"selected":"")+'>EDEN SUMMER · piscina, Spritz, musica e bar</option><option value="cupra_bossoni" '+(d.posterTheme==="cupra_bossoni"?"selected":"")+'>CUPRA BOSSONI · nero, rame e stile automotive</option><option value="aics_mare" '+(d.posterTheme==="aics_mare"?"selected":"")+'>AICS AL MARE · tricolore, spiaggia e competizione</option></select></div>'+
 '<div id="pamTimeFeasibility" class="notice">Il controllo automatico della durata sarà aggiornato mentre compili.</div></div>'+
 '<div class="card create-event-toolbar"><div><b>Partecipanti selezionati: <span id="selectedPlayersCount">'+d.selected.length+'</span></b><div class="muted">Puoi salvare e pubblicare il torneo anche senza avere ancora inserito i giocatori.</div></div><button class="primary create-event-top-button" data-action="create-event">SALVA E PUBBLICA TORNEO</button></div>'+
 '<div id="eventMessage"></div>'+
 '<div class="card"><h2>Seleziona partecipanti</h2>'+
 '<div class="pam-inline-create"><div class="field"><label>Cerca nell’anagrafica</label><input id="eventPlayerSearchInput" type="search" placeholder="Scrivi alcune lettere del nome o cognome..." autocomplete="off"></div>'+
 '<button class="primary" data-quick-player-new-event>➕ Nuova anagrafica e inserisci</button></div>'+
 '<div class="notice">Per un partecipante già selezionato puoi usare <b>Sostituisci</b> e scegliere un giocatore esistente oppure crearne uno nuovo.</div>'+
 '<div class="pam-player-selection-tools">'+
  '<button type="button" class="secondary" data-deselect-all-players>DESELEZIONA TUTTI</button>'+
  '<button type="button" class="secondary" data-toggle-selected-only aria-pressed="'+(d.showSelectedOnly?"true":"false")+'">'+(d.showSelectedOnly?"MOSTRA TUTTI I GIOCATORI":"MOSTRA SOLO SELEZIONATI")+'</button>'+
  '<span class="pill" id="pamSelectedPlayersBadge">'+d.selected.length+' SELEZIONATI</span>'+
 '</div>'+
 '<div class="checklist" id="pamEventPlayersChecklist">'+checks+'</div></div>'+
 '<button class="primary" data-action="create-event">SALVA E PUBBLICA TORNEO</button>';
}

function pamOptimizeRoundGroups(matches,courts){
 courts=Math.max(1,Number(courts)||1);
 const list=(matches||[]).slice();
 const people=function(m){return (m.t1||[]).concat(m.t2||[])};
 const compatible=function(a,b){
  const used=new Set(people(a));
  return people(b).every(function(id){return !used.has(id)});
 };

 if(courts===1)return {groups:list.map(function(m){return[m]}),wastedSlots:0};

 if(courts===2&&list.length<=22){
  const n=list.length;
  const memo=new Map();
  function solve(mask){
   if(mask===0)return {singletons:0,groups:[]};
   if(memo.has(mask))return memo.get(mask);
   let first=0;while(first<n&&!(mask&(1<<first)))first++;
   let best=solve(mask&~(1<<first));
   best={singletons:best.singletons+1,groups:[[first]].concat(best.groups)};
   for(let j=first+1;j<n;j++){
    if(!(mask&(1<<j))||!compatible(list[first],list[j]))continue;
    const sub=solve(mask&~(1<<first)&~(1<<j));
    if(sub.singletons<best.singletons){
     best={singletons:sub.singletons,groups:[[first,j]].concat(sub.groups)};
     if(best.singletons===0)break;
    }
   }
   memo.set(mask,best);return best;
  }
  const result=solve((1<<n)-1);
  const groups=result.groups.map(function(g){return g.map(function(i){return list[i]})});
  return {groups:groups,wastedSlots:result.singletons};
 }

 const remaining=list.slice(),groups=[];
 while(remaining.length){
  let bestGroup=[];
  function grow(start,chosen){
   if(chosen.length>bestGroup.length)bestGroup=chosen.slice();
   if(chosen.length>=courts)return;
   for(let i=start;i<remaining.length;i++){
    if(chosen.every(function(m){return compatible(m,remaining[i])}))grow(i+1,chosen.concat([remaining[i]]));
   }
  }
  grow(0,[]);
  if(!bestGroup.length)bestGroup=[remaining[0]];
  groups.push(bestGroup);
  bestGroup.forEach(function(m){const i=remaining.indexOf(m);if(i>=0)remaining.splice(i,1)});
 }
 const wasted=groups.reduce(function(sum,g){return sum+(courts-g.length)},0);
 return {groups:groups,wastedSlots:wasted};
}

function buildMatches(ids,courts,returnLeg){
 const playerIds=(ids||[]).slice();
 if(playerIds.length<4)throw new Error("servono almeno 4 giocatori per generare le partite");
 courts=Math.max(1,Number(courts)||1);

 function makeMatch(t1,t2){
  return{
   id:uid("m"),round:0,leg:1,court:1,
   t1:t1.slice(),t2:t2.slice(),
   score1:null,score2:null,note:""
  };
 }
 function pairKey(a,b){return[a,b].sort().join("|")}
 function teamKey(team){return team.slice().sort().join("|")}
 function matchKey(m){return[teamKey(m.t1),teamKey(m.t2)].sort().join(" VS ")}
 function shuffle(arr){
  const out=arr.slice();
  for(let i=out.length-1;i>0;i--){
   const j=Math.floor(Math.random()*(i+1));
   [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
 }

 const candidates=[];
 const seen=new Set();
 for(let a=0;a<playerIds.length-3;a++){
  for(let b=a+1;b<playerIds.length-2;b++){
   for(let c=b+1;c<playerIds.length-1;c++){
    for(let d=c+1;d<playerIds.length;d++){
     const q=[playerIds[a],playerIds[b],playerIds[c],playerIds[d]];
     [
      [[q[0],q[1]],[q[2],q[3]]],
      [[q[0],q[2]],[q[1],q[3]]],
      [[q[0],q[3]],[q[1],q[2]]]
     ].forEach(function(pairing){
      const m=makeMatch(pairing[0],pairing[1]);
      const key=matchKey(m);
      if(!seen.has(key)){seen.add(key);candidates.push(m)}
     });
    }
   }
  }
 }

 const targetByPlayers={6:6,8:8,10:10,12:12,16:16};
 const target=Math.min(candidates.length,targetByPlayers[playerIds.length]||Math.max(4,playerIds.length));
 let selected=[];

 /* Regola fondamentale Rodeo:
    mai la stessa coppia di compagni; mai lo stesso incontro completo;
    ridurre al minimo gli stessi avversari. */
 if(playerIds.length===6&&target>=6){
  const p=shuffle(playerIds);
  selected=[
   makeMatch([p[0],p[1]],[p[2],p[3]]),
   makeMatch([p[0],p[2]],[p[1],p[3]]),
   makeMatch([p[0],p[4]],[p[1],p[5]]),
   makeMatch([p[0],p[5]],[p[1],p[4]]),
   makeMatch([p[2],p[4]],[p[3],p[5]]),
   makeMatch([p[2],p[5]],[p[3],p[4]])
  ];
 }else{
  let best=null;
  let bestPenalty=Infinity;

  for(let attempt=0;attempt<1800;attempt++){
   const pool=shuffle(candidates);
   const chosen=[];
   const appearances={};
   const teammateUsed=new Set();
   const opponentCount={};
   const opponentTeamUsed=new Set();
   playerIds.forEach(function(id){appearances[id]=0;opponentCount[id]={}});

   while(chosen.length<target){
    let bestCandidate=null;
    let bestScore=Infinity;

    pool.forEach(function(m){
     if(m._picked)return;
     const mate1=pairKey(m.t1[0],m.t1[1]);
     const mate2=pairKey(m.t2[0],m.t2[1]);
     if(teammateUsed.has(mate1)||teammateUsed.has(mate2))return;

     const people=m.t1.concat(m.t2);
     const balance=people.reduce(function(sum,id){return sum+appearances[id]*appearances[id]},0);
     let repeatOpponents=0;
     let repeatOpponentTeams=0;

     m.t1.forEach(function(id){
      m.t2.forEach(function(opp){repeatOpponents+=(opponentCount[id][opp]||0)});
      if(opponentTeamUsed.has(id+"::"+teamKey(m.t2)))repeatOpponentTeams++;
     });
     m.t2.forEach(function(id){
      m.t1.forEach(function(opp){repeatOpponents+=(opponentCount[id][opp]||0)});
      if(opponentTeamUsed.has(id+"::"+teamKey(m.t1)))repeatOpponentTeams++;
     });

     const score=
      balance*25+
      repeatOpponentTeams*100000+
      repeatOpponents*2500+
      Math.random();
     if(score<bestScore){bestScore=score;bestCandidate=m}
    });

    if(!bestCandidate)break;
    bestCandidate._picked=true;
    chosen.push(bestCandidate);

    teammateUsed.add(pairKey(bestCandidate.t1[0],bestCandidate.t1[1]));
    teammateUsed.add(pairKey(bestCandidate.t2[0],bestCandidate.t2[1]));
    bestCandidate.t1.concat(bestCandidate.t2).forEach(function(id){appearances[id]++});

    bestCandidate.t1.forEach(function(id){
     bestCandidate.t2.forEach(function(opp){opponentCount[id][opp]=(opponentCount[id][opp]||0)+1});
     opponentTeamUsed.add(id+"::"+teamKey(bestCandidate.t2));
    });
    bestCandidate.t2.forEach(function(id){
     bestCandidate.t1.forEach(function(opp){opponentCount[id][opp]=(opponentCount[id][opp]||0)+1});
     opponentTeamUsed.add(id+"::"+teamKey(bestCandidate.t1));
    });
   }

   pool.forEach(function(m){delete m._picked});
   if(chosen.length<target)continue;

   const values=Object.values(appearances);
   const spread=Math.max.apply(null,values)-Math.min.apply(null,values);
   let repeatedOpp=0;
   Object.values(opponentCount).forEach(function(map){
    Object.values(map).forEach(function(n){if(n>1)repeatedOpp+=n-1});
   });
   let maxOpponentRepeat=0;
   Object.values(opponentCount).forEach(function(map){
    Object.values(map).forEach(function(n){maxOpponentRepeat=Math.max(maxOpponentRepeat,n)});
   });
   const optimizedSchedule=pamOptimizeRoundGroups(chosen,courts);
   const unavoidableWaste=(courts-(target%courts))%courts;
   const extraUnusedCourtSlots=Math.max(0,optimizedSchedule.wastedSlots-unavoidableWaste);
   const penalty=
    extraUnusedCourtSlots*1000000000+
    optimizedSchedule.groups.length*10000000+
    spread*1000000+
    maxOpponentRepeat*100000+
    repeatedOpp;

   if(penalty<bestPenalty){
    bestPenalty=penalty;
    best=chosen.map(function(m){return makeMatch(m.t1,m.t2)});
    if(spread===0&&repeatedOpp===0)break;
   }
  }

  if(best)selected=best;
 }

 if(!selected.length)throw new Error("non è stato possibile generare un calendario senza ripetere le coppie");

 const optimized=pamOptimizeRoundGroups(selected,courts);
 const ordered=[];
 optimized.groups.forEach(function(group,roundIndex){
  group.forEach(function(m,courtIndex){
   m.round=roundIndex+1;
   m.court=courtIndex+1;
   ordered.push(m);
  });
 });
 selected=ordered;
 let round=optimized.groups.length+1;

 if(returnLeg){
  const firstLeg=selected.slice();
  firstLeg.forEach(function(m){
   selected.push({
    id:uid("m"),
    round:m.round+(round-1),
    leg:2,
    court:m.court,
    t1:m.t2.slice(),
    t2:m.t1.slice(),
    score1:null,score2:null,note:""
   });
  });
 }

 return selected;
}
function pamRodeoQuality(e){
 if(!e||e.competitionType==="fixed_pairs")return null;
 const teammate={};
 const opponent={};
 (e.matches||[]).forEach(function(m){
  if(!m.t1||!m.t2)return;
  [m.t1,m.t2].forEach(function(team){
   if(team.length===2){
    const k=team.slice().sort().join("|");
    teammate[k]=(teammate[k]||0)+1;
   }
  });
  m.t1.forEach(function(a){m.t2.forEach(function(b){
   const k=[a,b].sort().join("|");
   opponent[k]=(opponent[k]||0)+1;
  })});
 });
 const repeatedTeams=Object.values(teammate).filter(function(n){return n>1}).length;
 const repeatedOpponents=Object.values(opponent).reduce(function(s,n){return s+Math.max(0,n-1)},0);
 return{repeatedTeams:repeatedTeams,repeatedOpponents:repeatedOpponents};
}


function pamIsFixedPairsDraft(){
 return state.draft&&state.draft.competitionType==="fixed_pairs";
}
function pamPairRegistrationLabel(playerId){
 const reg=(state.draft.fixedPairRegistrations||{})[playerId];
 if(!reg)return "";
 if(reg.mode==="single")return "ISCRIZIONE SINGOLA";
 if(reg.mode==="pair"&&reg.partnerId){
  const partner=playerById(reg.partnerId);
  return "IN COPPIA CON "+(partner?playerName(partner):"PARTNER");
 }
 return "";
}
function pamRemovePairRegistration(playerId){
 const regs=state.draft.fixedPairRegistrations||{};
 const reg=regs[playerId];
 if(reg&&reg.partnerId&&regs[reg.partnerId]&&regs[reg.partnerId].partnerId===playerId)delete regs[reg.partnerId];
 delete regs[playerId];
}
function pamAskFixedPairRegistration(playerId){
 if(!pamIsFixedPairsDraft()||!state.draft.selected.includes(playerId))return;
 const p=playerById(playerId);if(!p)return;
 document.getElementById("pamPairChoiceOverlay")?.remove();
 const overlay=document.createElement("div");
 overlay.id="pamPairChoiceOverlay";overlay.className="pam-modal-overlay";
 overlay.innerHTML='<div class="pam-modal-card"><div class="pam-modal-head"><div><h2>'+esc(playerName(p))+'</h2><div class="muted">Come vuoi iscrivere questo giocatore?</div></div><button class="secondary" data-close-pair-choice>Chiudi</button></div>'+
 '<div class="pam-pair-choice-grid"><button class="primary" data-pair-single="'+playerId+'">ISCRIZIONE SINGOLA</button><button class="secondary" data-pair-together="'+playerId+'">ISCRIZIONE IN COPPIA</button></div></div>';
 document.body.appendChild(overlay);
}
function pamSetPairSingle(playerId){
 state.draft.fixedPairRegistrations[playerId]={mode:"single"};
 save();document.getElementById("pamPairChoiceOverlay")?.remove();render();
}
function pamOpenPartnerPicker(playerId){
 const p=playerById(playerId);if(!p)return;
 document.getElementById("pamPairChoiceOverlay")?.remove();
 const rows=state.players.filter(function(x){return x.id!==playerId}).sort(function(a,b){return playerName(a).localeCompare(playerName(b),"it")}).map(function(x){
  return '<button class="pam-replacement-row" data-pair-partner="'+x.id+'" data-pair-primary="'+playerId+'"><img src="'+esc(pamPlayerPhoto(x))+'"><span><b>'+esc(playerName(x))+'</b><small>'+esc(x.gender||"")+'</small></span></button>';
 }).join("");
 const overlay=document.createElement("div");
 overlay.id="pamPairPartnerOverlay";overlay.className="pam-modal-overlay";
 overlay.innerHTML='<div class="pam-modal-card"><div class="pam-modal-head"><div><h2>Partner di '+esc(playerName(p))+'</h2><div class="muted">Seleziona un giocatore esistente oppure inseriscine uno nuovo.</div></div><button class="secondary" data-close-pair-partner>Chiudi</button></div>'+
 '<button class="primary" data-new-pair-partner="'+playerId+'">➕ NUOVO GIOCATORE</button><div class="field"><label>Cerca partner</label><input id="pamPairPartnerSearch" type="search"></div><div class="pam-replacement-list">'+rows+'</div></div>';
 document.body.appendChild(overlay);
 overlay.querySelector("#pamPairPartnerSearch").addEventListener("input",function(ev){
  const q=normalizeName(ev.target.value);
  overlay.querySelectorAll(".pam-replacement-row").forEach(function(row){row.style.display=!q||normalizeName(row.textContent).includes(q)?"grid":"none"});
 });
}
function pamAssignPartner(playerId,partnerId){
 const regs=state.draft.fixedPairRegistrations||{};
 regs[playerId]={mode:"pair",partnerId:partnerId};
 regs[partnerId]={mode:"pair",partnerId:playerId};
 if(!state.draft.selected.includes(partnerId))state.draft.selected.push(partnerId);
 save();document.getElementById("pamPairPartnerOverlay")?.remove();render();
}
function pamOrderedFixedPairIds(ids){
 const regs=state.draft.fixedPairRegistrations||{};
 const pairs=[],singles=[],used=new Set();
 ids.forEach(function(id){
  if(used.has(id))return;
  const reg=regs[id];
  if(reg&&reg.mode==="pair"&&reg.partnerId&&ids.includes(reg.partnerId)){
   pairs.push([id,reg.partnerId]);used.add(id);used.add(reg.partnerId);
  }else{singles.push(id);used.add(id)}
 });
 if(singles.length%2!==0)throw new Error("Le iscrizioni singole devono essere in numero pari.");
 const ordered=[];
 pairs.forEach(function(pair){ordered.push(pair[0],pair[1])});
 for(let i=0;i<singles.length;i+=2)ordered.push(singles[i],singles[i+1]);
 return ordered;
}
function buildFixedPairs(ids,pairsPerGroup,courts,returnLeg){
 const pairs=[];
 for(let i=0;i+1<ids.length;i+=2)pairs.push({id:uid("pair"),players:[ids[i],ids[i+1]],name:"Coppia "+(pairs.length+1),group:null});
 const groupCount=Math.max(1,Math.ceil(pairs.length/Math.max(2,pairsPerGroup)));
 pairs.forEach(function(pair,i){pair.group=String.fromCharCode(65+(i%groupCount))});
 const matches=[];
 const groups={};
 pairs.forEach(function(p){(groups[p.group]||(groups[p.group]=[])).push(p)});
 Object.keys(groups).forEach(function(g){
  const gp=groups[g];
  for(let i=0;i<gp.length;i++){
   for(let j=i+1;j<gp.length;j++){
    matches.push({id:uid("m"),round:g,leg:1,court:(matches.length%courts)+1,pair1:gp[i].id,pair2:gp[j].id,score1:null,score2:null,note:"",group:g});
   }
  }
 });
 if(returnLeg){
  const firstLeg=matches.slice();
  firstLeg.forEach(function(m){
   matches.push({id:uid("m"),round:m.round,leg:2,court:(matches.length%courts)+1,pair1:m.pair2,pair2:m.pair1,score1:null,score2:null,note:"",group:m.group});
  });
 }
 return {pairs:pairs,matches:matches};
}
function defaultPayments(ids,fee){
 const out={};
 ids.forEach(function(id){out[id]={fee:Number(fee)||0,paid:false,method:"",notes:""}});
 return out;
}
function createEvent(){
 const msg=document.getElementById("eventMessage");
 try{
  state.draft.name=document.getElementById("eName").value.trim();
  state.draft.date=document.getElementById("eDate").value;
  state.draft.club=document.getElementById("eClub").value.trim();
  state.draft.customAddress=pamClubAllowsCustomAddress(state.draft.club)?(document.getElementById("eCustomAddress")?.value.trim()||""):"";
  state.draft.category=document.getElementById("eCategory").value;
  state.draft.competitionType=document.getElementById("eCompetitionType").value;
  state.draft.courts=Number(document.getElementById("eCourts").value)||1;
  state.draft.fee=Math.max(0,Number(document.getElementById("eFee").value)||0);
  state.draft.returnLeg=document.getElementById("eReturnLeg").value==="yes";
  state.draft.eliminationReturnLeg=document.getElementById("eEliminationReturnLeg").value==="yes";
  state.draft.semifinalReturnLeg=document.getElementById("eSemifinalReturnLeg").value==="yes";
  state.draft.finalReturnLeg=document.getElementById("eFinalReturnLeg").value==="yes";
  state.draft.startTime=document.getElementById("eStartTime").value||"20:00";
  state.draft.matchMode="timed";
  const timerInput=document.getElementById("eTimerDuration")||document.getElementById("eMatchDuration");
  const slotInput=document.getElementById("eSlotDuration")||document.getElementById("eMatchDuration");
  state.draft.timerDuration=Math.max(1,Number(timerInput&&timerInput.value)||15);
  state.draft.slotDuration=Math.max(state.draft.timerDuration,Number(slotInput&&slotInput.value)||20);
  state.draft.matchDuration=state.draft.slotDuration;
  state.draft.initialTimerEnabled=document.getElementById("eInitialTimer").value==="yes";
  state.draft.eliminationTimerEnabled=document.getElementById("eEliminationTimer").value==="yes";
  state.draft.semifinalTimerEnabled=document.getElementById("eSemifinalTimer").value==="yes";
  state.draft.finalTimerEnabled=document.getElementById("eFinalTimer").value==="yes";
  state.draft.description=document.getElementById("eDescription")?.value.trim()||"";
  state.draft.endDate=document.getElementById("eEndDate")?.value||state.draft.date;
  state.draft.endTime=document.getElementById("eEndTime")?.value||"23:00";
  state.draft.registrationMin=Math.max(1,Number(document.getElementById("eRegistrationMin")?.value)||4);
  state.draft.registrationCapacity=Math.max(state.draft.registrationMin,Number(document.getElementById("eRegistrationCapacity")?.value)||16);
  state.draft.registrationOpen=document.getElementById("eRegistrationOpen")?.value!=="no";
  state.draft.waitlistEnabled=document.getElementById("eWaitlistEnabled")?.value!=="no";
  state.draft.posterTheme=document.getElementById("ePosterTheme")?.value||"eden_summer";
  if(document.getElementById("ePairsPerGroup"))state.draft.pairsPerGroup=Number(document.getElementById("ePairsPerGroup").value)||4;
  if(document.getElementById("eFinalsOption"))state.draft.finalsOption=document.getElementById("eFinalsOption").value;
  const selectedCount=state.draft.selected.length;
  if(selectedCount>0&&state.draft.competitionType==="rodeo_tokens"&&![6,8,10,12,16].includes(selectedCount))throw new Error("per generare subito il Rodeo a gettoni seleziona 6, 8, 10, 12 oppure 16 giocatori; in alternativa salva il torneo con zero giocatori e raccogli le iscrizioni dal link");
  if(selectedCount>0&&selectedCount<4)throw new Error("con giocatori già inseriti ne servono almeno 4; in alternativa deselezionali e salva il torneo vuoto");
  if(state.draft.competitionType==="fixed_pairs"&&selectedCount>0){
   if(selectedCount%2!==0)throw new Error("per le coppie fisse devi selezionare un numero pari di giocatori");
   const missing=state.draft.selected.filter(function(id){return !(state.draft.fixedPairRegistrations||{})[id]});
   if(missing.length)throw new Error("indica per ogni giocatore se l’iscrizione è singola oppure in coppia");
  }
  const feasibility=pamEstimateDraftFeasibility();
  if(feasibility.overrun&&!confirm(feasibility.message+"\n\nVuoi salvare comunque il torneo?"))throw new Error("salvataggio annullato: modifica orari, campi o formula");
  const event={
   id:uid("e"),
   name:state.draft.name||"Nuova competizione",
   date:state.draft.date,
   club:state.draft.club,
   customAddress:state.draft.customAddress||"",
   category:state.draft.category,
   competitionType:state.draft.competitionType,
   courts:state.draft.courts,
   entryFee:state.draft.fee,
   returnLeg:state.draft.returnLeg,
   eliminationReturnLeg:state.draft.eliminationReturnLeg,
   semifinalReturnLeg:state.draft.semifinalReturnLeg,
   finalReturnLeg:state.draft.finalReturnLeg,
   startTime:state.draft.startTime,
   matchMode:"timed",
   matchDuration:state.draft.slotDuration,
   timerDuration:state.draft.timerDuration,
   slotDuration:state.draft.slotDuration,
   initialTimerEnabled:state.draft.initialTimerEnabled,
   eliminationTimerEnabled:state.draft.eliminationTimerEnabled,
   semifinalTimerEnabled:state.draft.semifinalTimerEnabled,
   finalTimerEnabled:state.draft.finalTimerEnabled,
   description:state.draft.description||"",
   endDate:state.draft.endDate,
   endTime:state.draft.endTime,
   registrationMin:state.draft.registrationMin,
   registrationCapacity:state.draft.registrationCapacity,
   registrationOpen:state.draft.registrationOpen,
   waitlistEnabled:state.draft.waitlistEnabled,
   registrationApproval:"manual",
   posterTheme:state.draft.posterTheme,
   sponsorLogos:[],
   timers:{},
   playerIds:state.draft.selected.slice(),
   payments:defaultPayments(state.draft.selected.slice(),state.draft.fee),
   fixedPairRegistrations:JSON.parse(JSON.stringify(state.draft.fixedPairRegistrations||{})),
   matches:[],
   ledger:{},
   finalStages:{
    elimination:{teamA:[],teamB:[],score1:null,score2:null},
    auction1:{spending:{}},
    semifinals:[
     {id:"semi1",teamA:[],teamB:[],score1:null,score2:null},
     {id:"semi2",teamA:[],teamB:[],score1:null,score2:null}
    ],
    auction2:{spending:{}},
    final:{teamA:[],teamB:[],score1:null,score2:null}
   }
  };
  if(event.playerIds.length){
   if(event.competitionType==="fixed_pairs"){
    event.playerIds=pamOrderedFixedPairIds(event.playerIds);
    const built=buildFixedPairs(event.playerIds,state.draft.pairsPerGroup,event.courts,event.returnLeg);
    event.pairs=built.pairs;event.matches=built.matches;
    event.pairsPerGroup=state.draft.pairsPerGroup;event.finalsOption=state.draft.finalsOption;
    event.fixedFinals={semifinals:[],final:{pair1:null,pair2:null,score1:null,score2:null}};
   }else event.matches=buildMatches(event.playerIds,event.courts,event.returnLeg);
  }
  event.status=event.registrationOpen?"registration_open":"registration_closed";
  event.playerIds.forEach(function(id){const p=playerById(id);event.ledger[id]={carried:Number((p&&p.tokenBalance)||0),spent:0,podium:0}});
  state.events.unshift(event);state.currentEventId=event.id;state.view="event";state.tab="matches";save();render();
 }catch(e){if(msg){msg.className="notice error";msg.textContent="Errore: "+e.message}}
}
function eventsView(){
 const rows=state.events.length?state.events.map(function(e){
  const done=e.matches.filter(function(m){return m.score1!==null&&m.score2!==null}).length;
  return '<div class="item">'+
  '<img class="player-avatar" src="'+esc(e.logoUrl||"assets/padel-arena-reggio-emilia.jpeg")+'" alt="">'+
  '<div class="grow"><b>'+esc(e.name)+'</b><div class="muted">'+esc(e.date)+' · '+competitionTypeLabel(e.competitionType)+' · '+(e.returnLeg?"Andata/Ritorno":"SOLO ANDATA")+' · '+e.playerIds.length+' giocatori · '+done+'/'+e.matches.length+' risultati</div></div>'+
  '<button class="small" data-open-event="'+e.id+'">Apri</button>'+
  '<button class="small" data-share-event="'+e.id+'">Condividi</button>'+
  '<button class="small" data-share-registration="'+e.id+'">Link iscrizioni</button>'+
  (pamIsAdmin()?'<button class="small" data-duplicate-event="'+e.id+'">Duplica</button><button class="small" data-edit-event="'+e.id+'">Modifica</button><button class="danger" data-delete-event="'+e.id+'">Elimina</button>':'')+
  '</div>'
 }).join(""):'<div class="muted">Nessuna competizione salvata.</div>';
 const reset=state.events.length?
  '<div class="card print-hide"><h2>Pulizia tornei di prova</h2><div class="notice error">Questa funzione cancella tutte le competizioni salvate, ma mantiene intatti anagrafica giocatori e saldi gettoni.</div><button class="danger" data-action="delete-all-events">Cancella tutti i tornei</button></div>':'';
 return header("Competizioni salvate","Riapri senza perdere i risultati")+'<div class="card">'+rows+'</div>'+reset;
}
function playerById(id){return state.players.find(function(p){return p.id===id})}
function names(ids){return ids.map(function(id){const p=playerById(id);return p?playerName(p):"Giocatore"}).join(" / ")}
function teamStackHtml(ids){
 return '<div class="team-stack">'+ids.map(function(id){
  const p=playerById(id);
  return '<div>'+esc(p?playerName(p):"Giocatore")+'</div>';
 }).join("")+'</div>';
}
function pairStackHtml(e,pairId){
 const p=pairById(e,pairId);
 return p?teamStackHtml(p.players):'<div class="team-stack"><div>Coppia</div></div>';
}
function simplePairStackHtml(e,pairId){
 const p=simplePairById(e,pairId);
 return p?teamStackHtml(p.players):'<div class="team-stack"><div>Coppia</div></div>';
}
function matchupStackHtml(teamA,teamB){
 return '<div class="matchup-stack">'+teamA+'<div class="vs-divider"><span>VS</span></div>'+teamB+'</div>';
}
function eventView(){
 const e=currentEvent();if(!e)return eventsView();
 let tabDefs;
 if(e.competitionType==="rodeo_tokens"){
  const n=e.playerIds.length;
  if(n===6){
   tabDefs=[["matches","Partite"],["standings","Classifica"],["elimination","Eliminatoria"],["auction1","Asta e finale"],["tokens","Gettoni"],["payments","Pagamenti"],["players","Giocatori"]];
  }else if(n===8){
   tabDefs=[["matches","Partite"],["standings","Classifica"],["auction1","Fasi finali"],["auction2","Finale"],["tokens","Gettoni"],["payments","Pagamenti"],["players","Giocatori"]];
  }else if(n===10||n===12){
   tabDefs=[["matches","Partite"],["standings","Classifica"],["elimination","Eliminatoria"],["auction1","Fasi finali"],["auction2","Finale"],["tokens","Gettoni"],["payments","Pagamenti"],["players","Giocatori"]];
  }else if(n===16){
   tabDefs=[["matches","Partite"],["standings","Classifica"],["elimination","Quarti di finale"],["auction1","Semifinali"],["auction2","Finale"],["tokens","Gettoni"],["payments","Pagamenti"],["players","Giocatori"]];
  }else{
   tabDefs=[["matches","Partite"],["standings","Classifica"],["elimination","Fasi finali"],["tokens","Gettoni"],["payments","Pagamenti"],["players","Giocatori"]];
  }
 }else if(e.competitionType==="rodeo_simple"){
  tabDefs=[["matches","Partite"],["standings","Classifica"],["simplefinals","Fasi finali"],["payments","Pagamenti"],["players","Giocatori"]];
 }else{
  tabDefs=[["matches","Partite"],["pairstandings","Classifiche gironi"],["pairs","Coppie"],["fixedfinals","Fasi finali"],["payments","Pagamenti"],["players","Giocatori"]];
 }
 const tabs=tabDefs.map(function(t){return'<button data-tab="'+t[0]+'" class="'+(state.tab===t[0]?"on":"")+'">'+t[1]+'</button>'}).join("");
 let body=
  state.tab==="standings"?standingsView(e):
  state.tab==="elimination"?eliminationView(e):
  state.tab==="auction1"?auction1View(e):
  state.tab==="auction2"?auction2View(e):
  state.tab==="tokens"?tokensView(e):
  state.tab==="payments"?paymentsView(e):
  state.tab==="simplefinals"?simpleFinalsView(e):
  state.tab==="pairstandings"?pairStandingsView(e):
  state.tab==="pairs"?pairsView(e):
  state.tab==="fixedfinals"?fixedFinalsView(e):
  state.tab==="players"?eventPlayersView(e):
  matchesView(e);
 return header(e.name,e.date+" · "+e.club+" · "+competitionTypeLabel(e.competitionType))+
 (e.logoUrl?'<img class="event-logo-preview print-hide" src="'+esc(e.logoUrl)+'" alt="'+esc(e.name)+'">':'')+
 '<div class="event-online-tools print-hide">'+
  '<button class="secondary" data-refresh-cloud="1">🔄 Aggiorna dati</button>'+
  '<button class="secondary" data-share-event="'+e.id+'">🔗 Condividi torneo</button>'+
  '<button class="primary" data-open-poster="'+e.id+'">🖼️ LOCANDINA + QR</button>'+
  (pamIsAdmin()?'<button class="secondary" data-toggle-registration="'+e.id+'">'+(e.registrationOpen?'🔒 Chiudi iscrizioni':'🔓 Apri iscrizioni')+'</button>':'')+
  '<button class="primary" data-share-registration="'+e.id+'">📲 CONDIVIDI ISCRIZIONI</button>'+
  (pamIsAdmin()?'<button class="secondary" data-open-registrations="'+e.id+'">📥 Iscrizioni ricevute</button><button class="secondary" data-duplicate-event="'+e.id+'">📄 Duplica torneo</button><button class="secondary" data-edit-event="'+e.id+'">✏️ Modifica dati</button><button class="secondary" data-manage-tournament-players="'+e.id+'">👥 Partecipanti / Rigenera</button><label class="upload-button">🖼️ Carica logo<input type="file" accept="image/*" data-tournament-logo="'+e.id+'"></label>':'')+
 '</div>'+
 '<div class="notice '+(e.registrationOpen?'success':'error')+' print-hide"><b>Iscrizioni '+(e.registrationOpen?'APERTE':'CHIUSE')+':</b> '+(e.playerIds||[]).length+' / '+Number(e.registrationCapacity||16)+' partecipanti · '+(e.waitlistEnabled?'lista di attesa attiva':'lista di attesa disattiva')+'</div>'+
 '<div class="notice success print-hide"><b>Archivio online attivo:</b> risultati e modifiche vengono sincronizzati con Supabase.</div>'+
 (!pamIsAdmin()?'<div class="notice print-hide"><b>Modalità collaboratore:</b> puoi inserire o correggere esclusivamente i risultati delle partite.</div>':'')+
 '<div class="notice print-hide"><b>Programmazione:</b> inizio ore '+esc(e.startTime||"20:00")+
 ' · durata effettiva '+Number(e.timerDuration||e.matchDuration||15)+' minuti'+
 ' · nuova partita ogni '+Number(e.slotDuration||e.matchDuration||20)+' minuti'+
 ' · pausa prevista '+Math.max(0,Number(e.slotDuration||e.matchDuration||20)-Number(e.timerDuration||e.matchDuration||15))+' minuti<br>Fase iniziale: '+(e.initialTimerEnabled?"timer attivo":"timer disattivo")+' · Eliminatorie: '+(e.eliminationTimerEnabled?"attivo":"disattivo")+' · Semifinali: '+(e.semifinalTimerEnabled?"attivo":"disattivo")+' · Finale: '+(e.finalTimerEnabled?"attivo":"disattivo")+'</div>'+
 '<div class="notice print-hide"><b>PDF condivisibile:</b> apri la sezione desiderata e premi “PDF pagina”.</div>'+
 '<div class="tabs">'+tabs+'</div>'+body+printFooter(e);
}

function phaseFormula(e,phase){
 if(phase==="Eliminatoria")return e.eliminationReturnLeg?"ANDATA E RITORNO":"SOLO ANDATA";
 if(phase.indexOf("Semifinale")===0)return e.semifinalReturnLeg?"ANDATA E RITORNO":"SOLO ANDATA";
 if(phase==="Finale")return e.finalReturnLeg?"ANDATA E RITORNO":"SOLO ANDATA";
 return e.returnLeg?"ANDATA E RITORNO":"SOLO ANDATA";
}
function scheduleInfo(e,index,phase,court){
 const dateText=e.date||new Date().toISOString().slice(0,10);
 const timeText=e.startTime||"20:00";
 const parts=timeText.split(":");
 const base=new Date(dateText+"T"+timeText+":00");
 const slotDuration=Math.max(1,Number(e.slotDuration||e.matchDuration)||20);
 const slot=Math.floor(index/Math.max(1,Number(e.courts)||1));
 base.setMinutes(base.getMinutes()+slot*slotDuration);
 const day=base.toLocaleDateString("it-IT",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"});
 const hour=base.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});
 return {day:day,hour:hour,court:court||((index%Math.max(1,Number(e.courts)||1))+1),phase:phase};
}
function matchMetaHtml(e,index,phase,court){
 const s=scheduleInfo(e,index,phase,court);
 return '<div class="notice"><b>'+esc(s.phase)+'</b> · '+esc(s.day)+' · ore '+esc(s.hour)+' · Campo '+s.court+' · '+phaseFormula(e,phase)+'</div>';
}
function timerEnabledForPhase(e,phase){
 if(phase==="initial")return e.initialTimerEnabled!==false;
 if(phase==="elimination")return !!e.eliminationTimerEnabled;
 if(phase==="semifinal")return !!e.semifinalTimerEnabled;
 if(phase==="final")return !!e.finalTimerEnabled;
 return false;
}
function timerHtml(e,key,phase){
 if(!timerEnabledForPhase(e,phase))return "";
 e.timers=e.timers||{};
 const t=e.timers[key]||{};
 const remaining=t.endAt?Math.max(0,t.endAt-Date.now()):(Number(e.timerDuration||e.matchDuration)||15)*60000;
 const status=t.endAt?(remaining<=0?"expired":"running"):"";
 return '<div class="timer-panel '+status+'" data-timer-panel="'+esc(key)+'">'+
  '<div class="timer-title">'+(remaining<=0&&t.endAt?"TEMPO TERMINATO":"CONTO ALLA ROVESCIA")+'</div>'+
  '<span class="timer-display" data-timer-display="'+esc(key)+'">'+formatRemaining(remaining)+'</span>'+
  '<button class="primary" data-action="start-timer" data-timer-key="'+esc(key)+'">'+(t.endAt?"Ricomincia partita":"Inizia partita")+'</button> '+
  '<button class="secondary" data-action="reset-timer" data-timer-key="'+esc(key)+'">Azzera timer</button>'+
  '</div>';
}function formatRemaining(ms){
 const total=Math.max(0,Math.ceil(ms/1000));
 const min=Math.floor(total/60),sec=total%60;
 return String(min).padStart(2,"0")+":"+String(sec).padStart(2,"0");
}

let timerAudioContext=null;
function playTimerAlarm(){
 try{
  timerAudioContext=timerAudioContext||new (window.AudioContext||window.webkitAudioContext)();
  const ctx=timerAudioContext;
  const now=ctx.currentTime;
  [0,0.35,0.7,1.05,1.4].forEach(function(offset){
   const osc=ctx.createOscillator();
   const gain=ctx.createGain();
   osc.type="square";
   osc.frequency.setValueAtTime(offset%0.7===0?880:660,now+offset);
   gain.gain.setValueAtTime(0.0001,now+offset);
   gain.gain.exponentialRampToValueAtTime(0.35,now+offset+0.02);
   gain.gain.exponentialRampToValueAtTime(0.0001,now+offset+0.28);
   osc.connect(gain);gain.connect(ctx.destination);
   osc.start(now+offset);osc.stop(now+offset+0.3);
  });
 }catch(err){}
 try{if(navigator.vibrate)navigator.vibrate([500,200,500,200,900])}catch(err){}
}
function showTimerAlert(key){
 const overlay=document.getElementById("timerAlertOverlay");
 if(overlay){overlay.classList.add("visible");overlay.setAttribute("data-expired-key",key)}
 playTimerAlarm();
}
function dismissTimerAlert(){
 const overlay=document.getElementById("timerAlertOverlay");
 if(overlay)overlay.classList.remove("visible");
}
function startTimer(key){
 const e=currentEvent();e.timers=e.timers||{};
 e.timers[key]={endAt:Date.now()+Math.max(1,Number(e.timerDuration||e.matchDuration)||15)*60000,alerted:false};
 dismissTimerAlert();
 save();render();
}
function resetTimer(key){
 const e=currentEvent();e.timers=e.timers||{};delete e.timers[key];dismissTimerAlert();save();render();
}
function updateTimers(){
 const e=currentEvent();if(!e)return;
 e.timers=e.timers||{};
 let changed=false;
 document.querySelectorAll("[data-timer-display]").forEach(function(el){
  const key=el.getAttribute("data-timer-display");
  const t=e.timers[key];
  const panel=document.querySelector('[data-timer-panel="'+CSS.escape(key)+'"]');
  const ms=t&&t.endAt?Math.max(0,t.endAt-Date.now()):Math.max(1,Number(e.timerDuration||e.matchDuration)||15)*60000;
  el.textContent=ms<=0&&t&&t.endAt?"00:00":formatRemaining(ms);
  if(panel){
   panel.classList.toggle("running",!!(t&&t.endAt&&ms>0));
   panel.classList.toggle("expired",!!(t&&t.endAt&&ms<=0));
   const title=panel.querySelector(".timer-title");
   if(title)title.textContent=t&&t.endAt&&ms<=0?"TEMPO TERMINATO":"CONTO ALLA ROVESCIA";
  }
  if(t&&t.endAt&&ms<=0&&!t.alerted){
   t.alerted=true;
   changed=true;
   showTimerAlert(key);
  }
 });
 if(changed)save();
}
setInterval(updateTimers,1000);
function pairById(e,id){return (e.pairs||[]).find(function(p){return p.id===id})}
function pairName(e,id){const p=pairById(e,id);return p?names(p.players):"Coppia"}
function matchesView(e){
 if(!e.matches||!e.matches.length){
  return '<div class="notice error"><b>Nessuna partita presente.</b><br>Elimina questa competizione e rigenerala con la versione 2.0.1.</div>';
 }
 const html=e.matches.map(function(m,i){
  const saved=m.score1!==null&&m.score2!==null;
  const a=e.competitionType==="fixed_pairs"?pairName(e,m.pair1):names(m.t1);
  const b=e.competitionType==="fixed_pairs"?pairName(e,m.pair2):names(m.t2);
  const legLabel=(m.leg===2?" · Ritorno":" · Andata");
  const roundLabel=(e.competitionType==="fixed_pairs"?"Girone "+m.group:"Turno "+m.round)+legLabel;
  return '<div class="match" data-match-card="'+m.id+'"><div><span class="pill">Partita '+(i+1)+'</span></div>'+
  matchMetaHtml(e,i,roundLabel,m.court)+timerHtml(e,"match-"+m.id,"initial")+
  (e.competitionType==="fixed_pairs"?matchupStackHtml(pairStackHtml(e,m.pair1),pairStackHtml(e,m.pair2)):matchupStackHtml(teamStackHtml(m.t1),teamStackHtml(m.t2)))+
  (saved?'<div class="notice success">Risultato salvato: <b>'+m.score1+' - '+m.score2+'</b></div><button class="secondary" data-action="edit-result" data-match-id="'+m.id+'">Modifica risultato</button>':
  '<div class="score-row"><input data-score-a type="number" min="0" step="1" inputmode="numeric" placeholder="Game coppia A"><input data-score-b type="number" min="0" step="1" inputmode="numeric" placeholder="Game coppia B"></div><input data-note placeholder="Nota facoltativa"><div class="match-message"></div><button class="primary" style="margin-top:10px" data-action="save-result" data-match-id="'+m.id+'">Salva risultato</button>')+
  '</div>';
 }).join("");
 const quality=pamRodeoQuality(e);
 const qualityHtml=quality?'<div class="notice '+(quality.repeatedTeams===0?"success":"error")+'"><b>Controllo abbinamenti Rodeo:</b> coppie di compagni ripetute: '+quality.repeatedTeams+' · ripetizioni individuali contro gli stessi avversari: '+quality.repeatedOpponents+'.<br><b>Priorità assoluta:</b> nessuna coppia di compagni ripetuta; gli avversari vengono variati al massimo consentito dal numero di giocatori e partite.</div>':"";
 return qualityHtml+'<div class="notice">Ogni risultato viene salvato online e resta disponibile su tutti i dispositivi autorizzati.</div>'+html;
}
function saveResult(button){
 const e=currentEvent();const id=button.getAttribute("data-match-id");const card=button.closest("[data-match-card]");const msg=card.querySelector(".match-message");
 try{
  const m=e.matches.find(function(x){return x.id===id});if(!m)throw new Error("partita non trovata");
  const a=card.querySelector("[data-score-a]").value;const b=card.querySelector("[data-score-b]").value;
  if(a===""||b==="")throw new Error("inserisci entrambi i punteggi");
  const na=Number(a),nb=Number(b);if(!Number.isFinite(na)||!Number.isFinite(nb)||na<0||nb<0)throw new Error("punteggio non valido");
  m.score1=na;m.score2=nb;m.note=card.querySelector("[data-note]").value||"";
  save();render();
 }catch(err){msg.className="notice error";msg.textContent="Errore: "+err.message}
}
function editResult(id){const e=currentEvent();const m=e.matches.find(function(x){return x.id===id});if(m){m.score1=null;m.score2=null;save();render()}}
function standings(e){
 const r={};e.playerIds.forEach(function(id){r[id]={id:id,played:0,points:0,gf:0,gs:0,w:0,d:0,l:0}});
 e.matches.forEach(function(m){
  if(m.score1===null||m.score2===null)return;
  m.t1.concat(m.t2).forEach(function(id){r[id].played++});
  m.t1.forEach(function(id){r[id].gf+=m.score1;r[id].gs+=m.score2});
  m.t2.forEach(function(id){r[id].gf+=m.score2;r[id].gs+=m.score1});
  if(m.score1===m.score2){m.t1.concat(m.t2).forEach(function(id){r[id].points+=1;r[id].d++})}
  else{const win=m.score1>m.score2?m.t1:m.t2;const lose=m.score1>m.score2?m.t2:m.t1;win.forEach(function(id){r[id].points+=3;r[id].w++});lose.forEach(function(id){r[id].l++})}
 });
 Object.values(r).forEach(function(x){x.diff=x.gf-x.gs;x.bonus=Math.max(0,Math.floor(x.diff/3));const l=e.ledger[x.id]||{carried:0,spent:0,podium:0};x.balance=3+(Number(l.carried)||0)+x.points+x.bonus-(Number(l.spent)||0)+(Number(l.podium)||0)});
 return Object.values(r).sort(function(a,b){return b.points-a.points||b.diff-a.diff||b.gf-a.gf||playerName(playerById(a.id)).localeCompare(playerName(playerById(b.id)))});
}
function standingsView(e){
 const rows=standings(e).map(function(r,i){return'<tr><td>'+(i+1)+'</td><td><b>'+esc(playerName(playerById(r.id)))+'</b></td><td>'+r.played+'</td><td>'+r.points+'</td><td>'+r.gf+'</td><td>'+r.gs+'</td><td>'+(r.diff>=0?"+":"")+r.diff+'</td><td>'+r.bonus+'</td></tr>'}).join("");
 return '<div class="card table-wrap"><table class="table"><thead><tr><th>Pos.</th><th>Giocatore</th><th>PG</th><th>Punti</th><th>GF</th><th>GS</th><th>Diff.</th><th>Bonus</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function tokensView(e){
 const rows=standings(e).map(function(r){
  const l=e.ledger[r.id]||{carried:0,spent:0,podium:0};
  return '<tr><td><b>'+esc(playerName(playerById(r.id)))+'</b></td><td>3</td><td><input type="number" min="0" value="'+(l.carried||0)+'" data-ledger="'+r.id+'" data-field="carried"></td><td>'+r.points+'</td><td>'+r.bonus+'</td><td><input type="number" min="0" value="'+(l.spent||0)+'" data-ledger="'+r.id+'" data-field="spent"></td><td><select data-ledger="'+r.id+'" data-field="podium">'+[0,5,10].map(function(x){return'<option '+((Number(l.podium)||0)===x?"selected":"")+'>'+x+'</option>'}).join("")+'</select></td><td><b>'+r.balance+'</b></td></tr>'
 }).join("");
 return '<div class="notice">Calcolo: saldo precedente + 3 gettoni di benvenuto + punti + bonus differenza game − spesi + bonus podio.</div><div class="card table-wrap"><table class="table"><thead><tr><th>Giocatore</th><th>Benvenuto</th><th>Saldo precedente</th><th>Punti</th><th>Bonus diff.</th><th>Spesi</th><th>Podio</th><th>Saldo</th></tr></thead><tbody>'+rows+'</tbody></table></div><button class="primary" data-action="commit-balances">Salva i saldi nell’anagrafica per la prossima tappa</button>';
}


function paymentsView(e){
 if(!e.payments)e.payments=defaultPayments(e.playerIds,e.entryFee||0);
 const rows=e.playerIds.slice().sort(function(a,b){return playerName(playerById(a)).localeCompare(playerName(playerById(b)),"it")}).map(function(id,i){
  const p=playerById(id),x=e.payments[id]||(e.payments[id]={fee:Number(e.entryFee)||0,paid:false,method:"",notes:""});
  return '<tr><td>'+(i+1)+'</td><td><b>'+esc(playerName(p))+'</b></td><td><input type="number" min="0" step="0.50" value="'+Number(x.fee||0)+'" data-payment="'+id+'" data-pay-field="fee"></td><td><input type="checkbox" '+(x.paid?"checked":"")+' data-payment="'+id+'" data-pay-field="paid"></td><td><select data-payment="'+id+'" data-pay-field="method"><option value=""></option>'+["Contanti","Carta","Bonifico","Satispay","Altro"].map(function(v){return'<option '+(x.method===v?"selected":"")+'>'+v+'</option>'}).join("")+'</select></td><td><input value="'+esc(x.notes||"")+'" data-payment="'+id+'" data-pay-field="notes"></td></tr>';
 }).join("");
 const expected=Object.values(e.payments).reduce(function(s,x){return s+(Number(x.fee)||0)},0);
 const collected=Object.values(e.payments).reduce(function(s,x){return s+(x.paid?(Number(x.fee)||0):0)},0);
 return '<div class="notice"><b>Foglio reception:</b> stampa questa pagina in PDF. La reception può segnare pagamento, modalità e note.</div>'+
 '<div class="card"><div class="row"><div><b>Totale previsto:</b> '+expected.toLocaleString("it-IT",{style:"currency",currency:"EUR"})+'</div><div><b>Totale segnato come pagato:</b> '+collected.toLocaleString("it-IT",{style:"currency",currency:"EUR"})+'</div></div></div>'+
 '<div class="card table-wrap"><table class="table"><thead><tr><th>N.</th><th>Giocatore</th><th>Quota €</th><th>Pagato</th><th>Modalità</th><th>Note</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function ensureSimpleFinals(e){
 if(!e.simpleFinals)e.simpleFinals={
  pairs:[],
  semifinals:[
   {id:"sf1",pair1:null,pair2:null,score1:null,score2:null},
   {id:"sf2",pair1:null,pair2:null,score1:null,score2:null}
  ],
  final:{id:"sff",pair1:null,pair2:null,score1:null,score2:null}
 };
 return e.simpleFinals;
}
function initSimplePairs(e){
 const sf=ensureSimpleFinals(e),rank=standings(e);
 if(rank.length<8)return false;
 if(!sf.pairs.length){
  sf.pairs=[
   {id:"sp1",players:[rank[0].id,rank[7].id]},
   {id:"sp2",players:[rank[1].id,rank[6].id]},
   {id:"sp3",players:[rank[2].id,rank[5].id]},
   {id:"sp4",players:[rank[3].id,rank[4].id]}
  ];
  sf.semifinals[0].pair1="sp1";sf.semifinals[0].pair2="sp4";
  sf.semifinals[1].pair1="sp2";sf.semifinals[1].pair2="sp3";
  save();
 }
 return true;
}
function simplePairById(e,id){return ensureSimpleFinals(e).pairs.find(function(p){return p.id===id})}
function simplePairName(e,id){const p=simplePairById(e,id);return p?names(p.players):"Coppia"}
function simpleWinners(e){
 const sf=ensureSimpleFinals(e);
 return sf.semifinals.map(function(m){
  if(m.score1===null||m.score2===null||m.score1===m.score2)return null;
  return m.score1>m.score2?m.pair1:m.pair2;
 });
}
function ensureSixKnockout(e,type){
 const key=type==="tokens"?"sixTokenKnockout":"sixSimpleKnockout";
 const rank=standings(e);
 if(!e[key])e[key]={rankingSnapshot:[],elimination:{teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null},final:{teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null}};
 const k=e[key],snapshot=rank.map(function(x){return x.id}).join("|");
 if(rank.length===6&&(k.rankingSnapshot.join("|")!==snapshot||k.elimination.teamA.length!==2)){
  k.rankingSnapshot=rank.map(function(x){return x.id});
  k.elimination={teamA:[rank[2].id,rank[5].id],teamB:[rank[3].id,rank[4].id],score1:null,score2:null,score1R:null,score2R:null};
  k.final={teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null};
  save();
 }
 return k;
}
function sixWinner(e,type){
 const k=ensureSixKnockout(e,type);
 return stageWinnerTeam(e,"elimination",k.elimination);
}
function prepareSixFinal(e,type){
 const k=ensureSixKnockout(e,type),rank=standings(e),w=sixWinner(e,type);
 if(w.length!==2)return false;
 const pos={};rank.forEach(function(r,i){pos[r.id]=i});
 w.sort(function(a,b){return pos[a]-pos[b]});
 const a=[rank[0].id,w[0]],b=[rank[1].id,w[1]];
 if(k.final.teamA.join("|")!==a.join("|")||k.final.teamB.join("|")!==b.join("|")){
  k.final.teamA=a;k.final.teamB=b;k.final.score1=null;k.final.score2=null;k.final.score1R=null;k.final.score2R=null;save();
 }
 return true;
}
function sixKnockoutView(e,type){
 const k=ensureSixKnockout(e,type),rank=standings(e),base=(e.matches||[]).length;
 if(rank.length!==6)return '<div class="notice error">Questo formato richiede esattamente 6 giocatori.</div>';
 const elimCards=stageLegCard(e,"elimination",k.elimination,"Eliminatoria",1,base,1,"elimination")+
  (e.eliminationReturnLeg?stageLegCard(e,"elimination",k.elimination,"Eliminatoria",2,base+1,1,"elimination"):"");
 const et=stageAggregate(e,"elimination",k.elimination);
 const es=et?(et.a===et.b?'<div class="notice error">Totale eliminatoria in parità: <b>'+et.a+' - '+et.b+'</b>.</div>':'<div class="notice success">Totale eliminatoria: <b>'+et.a+' - '+et.b+'</b><br>Coppia vincente: <b>'+esc(names(sixWinner(e,type)))+'</b></div>'):"";
 let finalHtml='<div class="notice">Completa l’eliminatoria per generare la finale.</div>';
 if(prepareSixFinal(e,type)){
  const finalCards=stageLegCard(e,"final",k.final,"Finale",1,base+(e.eliminationReturnLeg?2:1),1,"final")+
   (e.finalReturnLeg?stageLegCard(e,"final",k.final,"Finale",2,base+(e.eliminationReturnLeg?3:2),1,"final"):"");
  const ft=stageAggregate(e,"final",k.final);
  let fs="";
  if(ft){
   if(ft.a===ft.b)fs='<div class="notice error">Totale finale in parità: <b>'+ft.a+' - '+ft.b+'</b>.</div>';
   else{
    const winners=ft.a>ft.b?k.final.teamA:k.final.teamB,seconds=ft.a>ft.b?k.final.teamB:k.final.teamA;
    if(type==="tokens"){
     e.playerIds.forEach(function(id){e.ledger[id].podium=0});
     winners.forEach(function(id){e.ledger[id].podium=10});
     seconds.forEach(function(id){e.ledger[id].podium=5});
     save();
    }
    fs='<div class="notice success">Totale finale: <b>'+ft.a+' - '+ft.b+'</b><br>Vincitori: <b>'+esc(names(winners))+'</b>'+(type==="tokens"?'<br>Secondi: <b>'+esc(names(seconds))+'</b>':"")+'</div>';
   }
  }
  finalHtml='<div class="notice"><b>Finale:</b> il 1° prende il giocatore meglio piazzato tra i vincitori dell’eliminatoria; il 2° prende l’altro.</div>'+finalCards+fs;
 }
 return '<div class="notice"><b>Rodeo a 6:</b> eliminatoria 3°+6° contro 4°+5°.</div>'+elimCards+es+finalHtml;
}
function simpleFinalsView(e){
 if(e.playerIds.length===6)return sixKnockoutView(e,"simple");
 if(!initSimplePairs(e))return '<div class="notice error">Per questo formato servono 6 oppure almeno 8 giocatori.</div>';
 const sf=ensureSimpleFinals(e),wins=simpleWinners(e);
 if(wins[0]&&wins[1]){sf.final.pair1=wins[0];sf.final.pair2=wins[1]}
 const pairCards=sf.pairs.map(function(p,i){return'<div class="item"><div class="rank">'+(i+1)+'</div><div><b>'+esc(names(p.players))+'</b><div class="muted">Incrocio '+(i+1)+'</div></div></div>'}).join("");
 const semis=sf.semifinals.map(function(m,i){return simpleStageCard(e,m,"Semifinale "+(i+1))}).join("");
 const finalCard=wins[0]&&wins[1]?simpleStageCard(e,sf.final,"Finale"):'<div class="notice">Completa entrambe le semifinali per generare la finale.</div>';
 return '<div class="notice"><b>Incroci automatici:</b> 1°+8°, 2°+7°, 3°+6°, 4°+5°.</div><div class="card"><h2>Coppie qualificate</h2>'+pairCards+'</div>'+semis+finalCard;
}
function simpleStageCard(e,m,label){
 const saved=m.score1!==null&&m.score2!==null;
 const baseIndex=(e.matches||[]).length+(label.indexOf("Semifinale")===0?Number(label.replace(/\D/g,""))-1:2);
 return '<div class="match" data-simple-stage="'+m.id+'"><span class="pill">'+label+'</span>'+matchMetaHtml(e,baseIndex,label,((baseIndex)%Math.max(1,e.courts))+1)+timerHtml(e,"simple-"+m.id,label.indexOf("Semifinale")===0?"semifinal":"final")+matchupStackHtml(simplePairStackHtml(e,m.pair1),simplePairStackHtml(e,m.pair2))+
 (saved?'<div class="notice success">Risultato: <b>'+m.score1+' - '+m.score2+'</b></div><button class="secondary" data-action="edit-simple-result" data-simple-id="'+m.id+'">Modifica risultato</button>':
 '<div class="score-row"><input data-simple-a type="number" min="0" placeholder="Game A"><input data-simple-b type="number" min="0" placeholder="Game B"></div><div class="match-message"></div><button class="primary" data-action="save-simple-result" data-simple-id="'+m.id+'">Salva risultato</button>')+'</div>';
}
function saveSimpleResult(button){
 const e=currentEvent(),sf=ensureSimpleFinals(e),id=button.getAttribute("data-simple-id");
 const m=sf.semifinals.concat([sf.final]).find(function(x){return x.id===id}),card=button.closest("[data-simple-stage]"),msg=card.querySelector(".match-message");
 try{
  const a=card.querySelector("[data-simple-a]").value,b=card.querySelector("[data-simple-b]").value;
  if(a===""||b==="")throw new Error("inserisci entrambi i punteggi");
  if(Number(a)===Number(b))throw new Error("nelle fasi finali non è previsto il pareggio");
  m.score1=Number(a);m.score2=Number(b);save();render();
 }catch(err){msg.className="notice error";msg.textContent="Errore: "+err.message}
}
function editSimpleResult(id){
 const e=currentEvent(),sf=ensureSimpleFinals(e),m=sf.semifinals.concat([sf.final]).find(function(x){return x.id===id});
 if(m){m.score1=null;m.score2=null;if(id!=="sff"){sf.final.score1=null;sf.final.score2=null;sf.final.pair1=null;sf.final.pair2=null}save();render()}
}
function pairStandings(e){
 const rows={};
 (e.pairs||[]).forEach(function(p){rows[p.id]={id:p.id,group:p.group,played:0,points:0,gf:0,gs:0,w:0,d:0,l:0}});
 e.matches.forEach(function(m){
  if(m.score1===null||m.score2===null)return;
  const a=rows[m.pair1],b=rows[m.pair2];a.played++;b.played++;a.gf+=m.score1;a.gs+=m.score2;b.gf+=m.score2;b.gs+=m.score1;
  if(m.score1===m.score2){a.points++;b.points++;a.d++;b.d++}
  else if(m.score1>m.score2){a.points+=3;a.w++;b.l++}else{b.points+=3;b.w++;a.l++}
 });
 Object.values(rows).forEach(function(x){x.diff=x.gf-x.gs});
 return Object.values(rows).sort(function(a,b){return a.group.localeCompare(b.group)||b.points-a.points||b.diff-a.diff||b.gf-a.gf});
}
function pairStandingsView(e){
 const groups={};pairStandings(e).forEach(function(r){(groups[r.group]||(groups[r.group]=[])).push(r)});
 return Object.keys(groups).map(function(g){
  const rows=groups[g].map(function(r,i){return'<tr><td>'+(i+1)+'</td><td><b>'+esc(pairName(e,r.id))+'</b></td><td>'+r.played+'</td><td>'+r.points+'</td><td>'+r.gf+'</td><td>'+r.gs+'</td><td>'+(r.diff>=0?"+":"")+r.diff+'</td></tr>'}).join("");
  return '<div class="card table-wrap"><h2>Girone '+g+'</h2><table class="table"><thead><tr><th>Pos.</th><th>Coppia</th><th>PG</th><th>Pt</th><th>GF</th><th>GS</th><th>Diff.</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
 }).join("");
}
function pairsView(e){
 return '<div class="notice">Le coppie sono state formate seguendo l’ordine di selezione dei giocatori.</div><div class="card">'+(e.pairs||[]).map(function(p,i){return'<div class="item"><div class="rank">'+(i+1)+'</div><div><b>'+esc(names(p.players))+'</b><div class="muted">Girone '+p.group+'</div></div></div>'}).join("")+'</div>';
}

function pamFixedGeneralRanking(e){
 return pairStandings(e).slice().sort(function(a,b){
  return b.points-a.points||b.diff-a.diff||b.gf-a.gf||a.group.localeCompare(b.group);
 });
}
function pamFixedGroupRanking(e){
 const grouped={};
 pairStandings(e).forEach(function(r){(grouped[r.group]||(grouped[r.group]=[])).push(r)});
 Object.keys(grouped).forEach(function(g){
  grouped[g].sort(function(a,b){return b.points-a.points||b.diff-a.diff||b.gf-a.gf});
 });
 const out=[];
 const max=Math.max(0,...Object.values(grouped).map(function(rows){return rows.length}));
 for(let pos=0;pos<max;pos++){
  const band=[];
  Object.keys(grouped).sort().forEach(function(g){
   if(grouped[g][pos])band.push(grouped[g][pos]);
  });
  band.sort(function(a,b){return b.points-a.points||b.diff-a.diff||b.gf-a.gf});
  out.push.apply(out,band);
 }
 return out;
}
function pamFixedRanking(e,source){
 return source==="groups"?pamFixedGroupRanking(e):pamFixedGeneralRanking(e);
}
function pamHighestPowerOfTwo(n){
 let p=1;
 while(p*2<=n)p*=2;
 return p;
}
function pamRoundName(size){
 if(size===2)return "FINALE";
 if(size===4)return "SEMIFINALI";
 if(size===8)return "QUARTI DI FINALE";
 if(size===16)return "OTTAVI DI FINALE";
 if(size===32)return "SEDICESIMI DI FINALE";
 return "TURNO A "+size;
}
function pamSeedPairings(ids){
 const arr=ids.slice(),out=[];
 while(arr.length>1){
  out.push([arr.shift(),arr.pop()]);
 }
 return out;
}
function pamFixedWinner(bracket,matchId){
 const result=(bracket.results||{})[matchId];
 if(!result||result.a===null||result.b===null||Number(result.a)===Number(result.b))return null;
 const match=(bracket.matchIndex||{})[matchId];
 if(!match)return null;
 return Number(result.a)>Number(result.b)?match.pair1:match.pair2;
}
function pamBuildTierBracket(tier,oldResults){
 const entrants=tier.entrants.slice();
 const n=entrants.length;
 const target=pamHighestPowerOfTwo(n);
 const prelimCount=n-target;
 const byeCount=target-prelimCount;
 const prelimPlayers=entrants.slice(byeCount);
 const byes=entrants.slice(0,byeCount);
 const bracket={
  name:tier.name,
  entrants:entrants,
  results:oldResults||{},
  rounds:[],
  matchIndex:{},
  target:target
 };
 let mainEntrants=byes.slice();

 if(prelimCount>0){
  const prelimMatches=[];
  for(let i=0;i<prelimCount;i++){
   const pair1=prelimPlayers[i];
   const pair2=prelimPlayers[prelimPlayers.length-1-i];
   const id=tier.key+"_pre_"+(i+1);
   const m={id:id,label:"PRELIMINARE "+(i+1),pair1:pair1,pair2:pair2,round:"PRELIMINARI"};
   prelimMatches.push(m);bracket.matchIndex[id]=m;
  }
  bracket.rounds.push({name:"PRELIMINARI",matches:prelimMatches});
  prelimMatches.forEach(function(m){mainEntrants.push(pamFixedWinner(bracket,m.id))});
 }else{
  mainEntrants=entrants.slice();
 }

 if(target>=2){
  let current=pamSeedPairings(mainEntrants);
  let size=target;
  let roundNo=0;
  while(size>=2){
   const roundName=pamRoundName(size);
   const matches=current.map(function(pair,i){
    const id=tier.key+"_r"+roundNo+"_"+(i+1);
    const m={id:id,label:roundName+" "+(i+1),pair1:pair[0]||null,pair2:pair[1]||null,round:roundName};
    bracket.matchIndex[id]=m;
    return m;
   });
   bracket.rounds.push({name:roundName,matches:matches});
   if(size===2)break;
   const next=[];
   for(let i=0;i<matches.length;i+=2){
    next.push([pamFixedWinner(bracket,matches[i].id),pamFixedWinner(bracket,matches[i+1].id)]);
   }
   current=next;size=size/2;roundNo++;
  }
 }
 return bracket;
}
function pamTierSplit(rows,mode){
 const ids=rows.map(function(r){return r.id});
 if(mode==="classic")return[{key:"gold",name:"TABELLONE CLASSICO",entrants:ids}];
 if(mode==="gold_silver"){
  const goldCount=Math.ceil(ids.length/2);
  return[
   {key:"gold",name:"GOLD",entrants:ids.slice(0,goldCount)},
   {key:"silver",name:"SILVER",entrants:ids.slice(goldCount)}
  ].filter(function(t){return t.entrants.length>=2});
 }
 const goldCount=Math.ceil(ids.length/3);
 const remaining=ids.length-goldCount;
 const silverCount=Math.ceil(remaining/2);
 return[
  {key:"gold",name:"GOLD",entrants:ids.slice(0,goldCount)},
  {key:"silver",name:"SILVER",entrants:ids.slice(goldCount,goldCount+silverCount)},
  {key:"bronze",name:"BRONZE",entrants:ids.slice(goldCount+silverCount)}
 ].filter(function(t){return t.entrants.length>=2});
}
function pamGenerateFixedFinals(e){
 const source=document.getElementById("pamFinalRankingSource").value;
 const countValue=document.getElementById("pamFinalQualifiedCount").value;
 const mode=document.getElementById("pamFinalMode").value;
 const ranking=pamFixedRanking(e,source);
 let count=countValue==="all"?ranking.length:Number(countValue);
 count=Math.min(count,ranking.length);
 if(count<2)throw new Error("Servono almeno 2 coppie qualificate.");
 const selected=ranking.slice(0,count);
 const old=(e.fixedFinalsAdvanced&&e.fixedFinalsAdvanced.brackets)||{};
 const tiers=pamTierSplit(selected,mode);
 e.fixedFinalsAdvanced={
  config:{source:source,count:countValue,mode:mode},
  ranking:selected.map(function(r){return r.id}),
  brackets:{}
 };
 tiers.forEach(function(tier){
  const oldResults=old[tier.key]&&old[tier.key].results?old[tier.key].results:{};
  e.fixedFinalsAdvanced.brackets[tier.key]=pamBuildTierBracket(tier,oldResults);
 });
 save();render();
}
function pamRefreshFixedFinals(e){
 if(!e.fixedFinalsAdvanced)return;
 const cfg=e.fixedFinalsAdvanced.config;
 const ranking=pamFixedRanking(e,cfg.source);
 let count=cfg.count==="all"?ranking.length:Number(cfg.count);
 count=Math.min(count,ranking.length);
 const selected=ranking.slice(0,count);
 const tiers=pamTierSplit(selected,cfg.mode);
 const old=e.fixedFinalsAdvanced.brackets||{};
 e.fixedFinalsAdvanced.ranking=selected.map(function(r){return r.id});
 e.fixedFinalsAdvanced.brackets={};
 tiers.forEach(function(tier){
  e.fixedFinalsAdvanced.brackets[tier.key]=pamBuildTierBracket(
   tier,
   old[tier.key]&&old[tier.key].results?old[tier.key].results:{}
  );
 });
}
function pamFixedMatchTeam(e,id){
 return id?pairStackHtml(e,id):'<div class="team-stack pam-waiting-team"><div>IN ATTESA</div></div>';
}
function pamFixedBracketMatchCard(e,bracket,m,index){
 const res=(bracket.results||{})[m.id]||{a:null,b:null};
 const ready=!!(m.pair1&&m.pair2);
 const saved=res.a!==null&&res.b!==null;
 return '<div class="match pam-bracket-match" data-fixed-final-match="'+esc(m.id)+'" data-fixed-tier="'+esc(bracket.name)+'">'+
  '<span class="pill">'+esc(m.label)+'</span>'+
  matchMetaHtml(e,(e.matches||[]).length+index,m.round,((index)%Math.max(1,e.courts))+1)+
  matchupStackHtml(pamFixedMatchTeam(e,m.pair1),pamFixedMatchTeam(e,m.pair2))+
  (!ready?'<div class="notice">Completa il turno precedente per conoscere le coppie.</div>':
   saved?'<div class="notice success">Risultato: <b>'+res.a+' - '+res.b+'</b></div><button class="secondary" data-edit-fixed-final="'+esc(m.id)+'">MODIFICA RISULTATO</button>':
   '<div class="score-row"><input data-fixed-score-a type="number" min="0" placeholder="Game A"><input data-fixed-score-b type="number" min="0" placeholder="Game B"></div><div class="match-message"></div><button class="primary" data-save-fixed-final="'+esc(m.id)+'">SALVA RISULTATO</button>')+
 '</div>';
}
function pamFixedTierView(e,key,bracket){
 let idx=0;
 const rounds=bracket.rounds.map(function(round){
  const cards=round.matches.map(function(m){return pamFixedBracketMatchCard(e,bracket,m,idx++)}).join("");
  return '<section class="card pam-bracket-round"><h2>'+esc(round.name)+'</h2>'+cards+'</section>';
 }).join("");
 const finalRound=bracket.rounds[bracket.rounds.length-1];
 let champion="";
 if(finalRound&&finalRound.matches.length===1){
  const winner=pamFixedWinner(bracket,finalRound.matches[0].id);
  if(winner)champion='<div class="notice success pam-champion"><b>VINCITORI '+esc(bracket.name)+':</b><br>'+esc(pairName(e,winner))+'</div>';
 }
 return '<section class="pam-tier-block pam-tier-'+key+'"><div class="pam-tier-title"><h2>'+esc(bracket.name)+'</h2><span>'+bracket.entrants.length+' coppie</span></div>'+champion+rounds+'</section>';
}
function pamFixedFinalsConfigView(e){
 const cfg=e.fixedFinalsAdvanced&&e.fixedFinalsAdvanced.config||{source:"general",count:"all",mode:"classic"};
 const total=(e.pairs||[]).length;
 return '<div class="card pam-finals-config">'+
  '<h2>CONFIGURAZIONE FASI FINALI</h2>'+
  '<div class="notice">Puoi rigenerare il tabellone in qualsiasi momento. La classifica generale ordina tutte le coppie insieme; la classifica per gironi prende prima tutte le prime, poi tutte le seconde e così via.</div>'+
  '<div class="row">'+
   '<div class="field"><label>Classifica per gli incroci</label><select id="pamFinalRankingSource">'+
    '<option value="general" '+(cfg.source==="general"?"selected":"")+'>CLASSIFICA GENERALE</option>'+
    '<option value="groups" '+(cfg.source==="groups"?"selected":"")+'>CLASSIFICA DIVISA PER GIRONI</option>'+
   '</select></div>'+
   '<div class="field"><label>Coppie qualificate</label><select id="pamFinalQualifiedCount">'+
    '<option value="all" '+(cfg.count==="all"?"selected":"")+'>TUTTE LE COPPIE</option>'+
    [2,4,8,16].filter(function(n){return n<=total}).map(function(n){return'<option value="'+n+'" '+(String(cfg.count)===String(n)?"selected":"")+'>'+n+' COPPIE</option>'}).join("")+
   '</select></div>'+
   '<div class="field"><label>Modalità fasi finali</label><select id="pamFinalMode">'+
    '<option value="classic" '+(cfg.mode==="classic"?"selected":"")+'>CLASSICHE</option>'+
    '<option value="gold_silver" '+(cfg.mode==="gold_silver"?"selected":"")+'>GOLD E SILVER</option>'+
    '<option value="gold_silver_bronze" '+(cfg.mode==="gold_silver_bronze"?"selected":"")+'>GOLD, SILVER E BRONZE</option>'+
   '</select></div>'+
  '</div>'+
  '<div class="pam-final-actions"><button class="primary" data-generate-fixed-finals>GENERA FASI FINALI</button>'+
  (e.fixedFinalsAdvanced?'<button class="secondary" data-reset-fixed-finals>AZZERA FASI FINALI</button>':'')+'</div>'+
 '</div>';
}
function fixedFinalsView(e){
 const table=pairStandings(e);
 const played=(e.matches||[]).filter(function(m){return m.score1!==null&&m.score2!==null}).length;
 const total=(e.matches||[]).length;
 let html=pamFixedFinalsConfigView(e);
 html+='<div class="notice '+(played===total?"success":"")+'"><b>Risultati gironi:</b> '+played+' di '+total+' partite completate.</div>';
 if(!e.fixedFinalsAdvanced)return html+'<div class="notice">Scegli le opzioni e premi <b>GENERA FASI FINALI</b>.</div>';
 pamRefreshFixedFinals(e);
 const keys=["gold","silver","bronze"];
 html+=keys.filter(function(k){return e.fixedFinalsAdvanced.brackets[k]}).map(function(k){
  return pamFixedTierView(e,k,e.fixedFinalsAdvanced.brackets[k]);
 }).join("");
 return html;
}
function pamFindFixedFinalMatch(e,id){
 if(!e.fixedFinalsAdvanced)return null;
 const brackets=e.fixedFinalsAdvanced.brackets||{};
 for(const key of Object.keys(brackets)){
  const b=brackets[key];
  if(b.matchIndex&&b.matchIndex[id])return{bracket:b,match:b.matchIndex[id],key:key};
 }
 return null;
}
function pamSaveFixedFinalResult(button){
 const e=currentEvent(),id=button.getAttribute("data-save-fixed-final");
 const found=pamFindFixedFinalMatch(e,id);if(!found)return;
 const card=button.closest("[data-fixed-final-match]");
 const a=card.querySelector("[data-fixed-score-a]").value;
 const b=card.querySelector("[data-fixed-score-b]").value;
 const msg=card.querySelector(".match-message");
 try{
  if(a===""||b==="")throw new Error("inserisci entrambi i punteggi");
  if(Number(a)===Number(b))throw new Error("nelle fasi finali non è previsto il pareggio");
  found.bracket.results[id]={a:Number(a),b:Number(b)};
  save();render();
 }catch(err){
  msg.className="notice error";msg.textContent="Errore: "+err.message;
 }
}
function pamEditFixedFinalResult(id){
 const e=currentEvent(),found=pamFindFixedFinalMatch(e,id);if(!found)return;
 delete found.bracket.results[id];
 save();render();
}

function ensureFinalStages(e){
 if(!e.finalStages){
  e.finalStages={
   elimination:{teamA:[],teamB:[],score1:null,score2:null},
   auction1:{spending:{}},
   semifinals:[
    {id:"semi1",teamA:[],teamB:[],score1:null,score2:null},
    {id:"semi2",teamA:[],teamB:[],score1:null,score2:null}
   ],
   auction2:{spending:{}},
   final:{teamA:[],teamB:[],score1:null,score2:null},
   elimination12:[
    {id:"elim12_1",teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null},
    {id:"elim12_2",teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null}
   ],
   quarterfinals:[
    {id:"qf1",teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null},
    {id:"qf2",teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null},
    {id:"qf3",teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null},
    {id:"qf4",teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null}
   ]
  };
 }
 if(!e.finalStages.auction1)e.finalStages.auction1={spending:{}};
 if(!e.finalStages.auction1.spending)e.finalStages.auction1.spending={};
 if(!e.finalStages.auction2)e.finalStages.auction2={spending:{}};
 if(!e.finalStages.auction2.spending)e.finalStages.auction2.spending={};
 if(!Array.isArray(e.finalStages.elimination12)||e.finalStages.elimination12.length!==2){
  e.finalStages.elimination12=[
   {id:"elim12_1",teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null},
   {id:"elim12_2",teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null}
  ];
 }
 if(!Array.isArray(e.finalStages.quarterfinals)||e.finalStages.quarterfinals.length!==4){
  e.finalStages.quarterfinals=[1,2,3,4].map(function(i){return{id:"qf"+i,teamA:[],teamB:[],score1:null,score2:null,score1R:null,score2R:null}});
 }
 if(!Array.isArray(e.finalStages.semifinals)||e.finalStages.semifinals.length!==2){
  e.finalStages.semifinals=[
   {id:"semi1",teamA:[],teamB:[],score1:null,score2:null},
   {id:"semi2",teamA:[],teamB:[],score1:null,score2:null}
  ];
 }
 return e.finalStages;
}

function stageNeedsReturn(e,stage){
 if(stage==="elimination")return !!e.eliminationReturnLeg;
 if(stage==="semi1"||stage==="semi2")return !!e.semifinalReturnLeg;
 if(stage==="final")return !!e.finalReturnLeg;
 return false;
}
function stageLegComplete(m,leg){
 if(leg===2)return m.score1R!==null&&m.score1R!==undefined&&m.score2R!==null&&m.score2R!==undefined;
 return m.score1!==null&&m.score1!==undefined&&m.score2!==null&&m.score2!==undefined;
}
function stageAggregate(e,stage,m){
 if(!stageLegComplete(m,1))return null;
 if(stageNeedsReturn(e,stage)&&!stageLegComplete(m,2))return null;
 return {
  a:Number(m.score1||0)+(stageNeedsReturn(e,stage)?Number(m.score1R||0):0),
  b:Number(m.score2||0)+(stageNeedsReturn(e,stage)?Number(m.score2R||0):0)
 };
}
function stageWinnerTeam(e,stage,m){
 const t=stageAggregate(e,stage,m);
 if(!t||t.a===t.b)return [];
 return t.a>t.b?m.teamA.slice():m.teamB.slice();
}
function stageLegCard(e,stage,m,label,leg,index,court,phase){
 const ret=leg===2;
 const a=ret?m.score1R:m.score1,b=ret?m.score2R:m.score2;
 const saved=a!==null&&a!==undefined&&b!==null&&b!==undefined;
 return '<div class="match" data-stage-card="'+stage+'" data-stage-leg="'+leg+'">'+
 '<span class="pill">'+label+' · '+(ret?"Ritorno":"Andata")+'</span>'+
 matchMetaHtml(e,index,label+(ret?" - Ritorno":" - Andata"),court)+timerHtml(e,"stage-"+stage+"-"+leg,phase)+
 matchupStackHtml(teamStackHtml(m.teamA),teamStackHtml(m.teamB))+
 (saved?'<div class="notice success">Risultato: <b>'+a+' - '+b+'</b></div><button class="secondary" data-action="edit-stage-result" data-stage="'+stage+'" data-leg="'+leg+'">Modifica risultato</button>':
 '<div class="score-row"><input data-stage-score-a type="number" min="0" placeholder="Game A"><input data-stage-score-b type="number" min="0" placeholder="Game B"></div><div class="match-message"></div><button class="primary" data-action="save-stage-result" data-stage="'+stage+'" data-leg="'+leg+'">Salva risultato</button>')+
 '</div>';
}
function stagePlayerOptions(ids,selected){
 return '<option value="">-- seleziona --</option>'+ids.map(function(id){
  return '<option value="'+id+'" '+(id===selected?"selected":"")+'>'+esc(playerName(playerById(id)))+'</option>';
 }).join("");
}
function initEliminationFromRanking(e){
 const fs=ensureFinalStages(e);
 const rank=standings(e);
 if(rank.length<10)return false;
 if(fs.elimination.teamA.length===0&&fs.elimination.teamB.length===0){
  fs.elimination.teamA=[rank[6].id,rank[9].id];
  fs.elimination.teamB=[rank[7].id,rank[8].id];
  save();
 }
 return true;
}

function initElimination12(e){
 const fs=ensureFinalStages(e),rank=standings(e);
 if(rank.length!==12)return false;
 const wanted=[
  {teamA:[rank[4].id,rank[11].id],teamB:[rank[7].id,rank[8].id]},
  {teamA:[rank[5].id,rank[10].id],teamB:[rank[6].id,rank[9].id]}
 ];
 fs.elimination12.forEach(function(m,i){
  if(m.teamA.join("|")!==wanted[i].teamA.join("|")||m.teamB.join("|")!==wanted[i].teamB.join("|")){
   m.teamA=wanted[i].teamA.slice();m.teamB=wanted[i].teamB.slice();
   m.score1=null;m.score2=null;m.score1R=null;m.score2R=null;
  }
 });
 save();return true;
}
function elimination12Winners(e){
 const fs=ensureFinalStages(e),out=[];
 fs.elimination12.forEach(function(m,i){
  const w=stageWinnerTeam(e,"elim12_"+(i+1),m);
  if(w.length===2)out.push.apply(out,w);
 });
 return out;
}
function initQuarterfinals16(e){
 const fs=ensureFinalStages(e),rank=standings(e);
 if(rank.length!==16)return false;
 const pairs=[
  [rank[0].id,rank[15].id],[rank[7].id,rank[8].id],
  [rank[3].id,rank[12].id],[rank[4].id,rank[11].id],
  [rank[1].id,rank[14].id],[rank[6].id,rank[9].id],
  [rank[2].id,rank[13].id],[rank[5].id,rank[10].id]
 ];
 const wanted=[
  {teamA:pairs[0],teamB:pairs[1]},
  {teamA:pairs[2],teamB:pairs[3]},
  {teamA:pairs[4],teamB:pairs[5]},
  {teamA:pairs[6],teamB:pairs[7]}
 ];
 fs.quarterfinals.forEach(function(m,i){
  if(m.teamA.join("|")!==wanted[i].teamA.join("|")||m.teamB.join("|")!==wanted[i].teamB.join("|")){
   m.teamA=wanted[i].teamA.slice();m.teamB=wanted[i].teamB.slice();
   m.score1=null;m.score2=null;m.score1R=null;m.score2R=null;
  }
 });
 save();return true;
}
function quarterfinalWinners(e){
 const fs=ensureFinalStages(e),out=[];
 fs.quarterfinals.forEach(function(m,i){
  const w=stageWinnerTeam(e,"qf"+(i+1),m);
  if(w.length===2)out.push.apply(out,w);
 });
 return out;
}

function eliminationWinners(e){
 return stageWinnerTeam(e,"elimination",ensureFinalStages(e).elimination);
}
function eliminationView(e){
 const fs=ensureFinalStages(e),rank=standings(e),n=rank.length,base=(e.matches||[]).length;
 if(n===6){
  return sixKnockoutView(e,e.competitionType==="rodeo_simple"?"simple":"tokens");
 }
 if(n===8){
  return '<div class="notice success"><b>8 giocatori:</b> nessuna eliminatoria. Tutti accedono direttamente alle fasi finali.</div>';
 }
 if(n===10){
  initEliminationFromRanking(e);
  const m=fs.elimination;
  const cards=stageLegCard(e,"elimination",m,"Eliminatoria",1,base,1,"elimination")+
   (e.eliminationReturnLeg?stageLegCard(e,"elimination",m,"Eliminatoria",2,base+1,1,"elimination"):"");
  const t=stageAggregate(e,"elimination",m),w=stageWinnerTeam(e,"elimination",m);
  const summary=t?(t.a===t.b?'<div class="notice error">Totale in parità: <b>'+t.a+' - '+t.b+'</b>.</div>':'<div class="notice success">Qualificati: <b>'+esc(names(w))+'</b></div>'):"";
  return '<div class="notice"><b>10 giocatori:</b> 7°+10° contro 8°+9°. I vincitori raggiungono i primi 6.</div>'+cards+summary;
 }
 if(n===12){
  initElimination12(e);
  const cards=fs.elimination12.map(function(m,i){
   const stage="elim12_"+(i+1),idx=base+i*(e.eliminationReturnLeg?2:1);
   const c=stageLegCard(e,stage,m,"Eliminatoria "+(i+1),1,idx,i+1,"elimination")+
    (e.eliminationReturnLeg?stageLegCard(e,stage,m,"Eliminatoria "+(i+1),2,idx+1,i+1,"elimination"):"");
   const t=stageAggregate(e,stage,m),w=stageWinnerTeam(e,stage,m);
   return c+(t?(t.a===t.b?'<div class="notice error">Totale in parità.</div>':'<div class="notice success">Qualificati: <b>'+esc(names(w))+'</b></div>'):"");
  }).join("");
  return '<div class="notice"><b>12 giocatori:</b> i primi 4 passano direttamente. Dal 5° al 12° disputano due eliminatorie per completare gli 8 finalisti.</div>'+cards;
 }
 if(n===16){
  initQuarterfinals16(e);
  const cards=fs.quarterfinals.map(function(m,i){
   const stage="qf"+(i+1),idx=base+i*(e.eliminationReturnLeg?2:1);
   const c=stageLegCard(e,stage,m,"Quarto di finale "+(i+1),1,idx,(i%Math.max(1,e.courts))+1,"elimination")+
    (e.eliminationReturnLeg?stageLegCard(e,stage,m,"Quarto di finale "+(i+1),2,idx+1,(i%Math.max(1,e.courts))+1,"elimination"):"");
   const t=stageAggregate(e,stage,m),w=stageWinnerTeam(e,stage,m);
   return c+(t?(t.a===t.b?'<div class="notice error">Totale in parità.</div>':'<div class="notice success">Qualificati: <b>'+esc(names(w))+'</b></div>'):"");
  }).join("");
  return '<div class="notice success"><b>16 giocatori:</b> nessuna fase eliminatoria preliminare. Si parte direttamente dai quarti di finale.</div>'+cards;
 }
 return '<div class="notice error">Formati automatici disponibili con 6, 8, 10, 12 oppure 16 giocatori.</div>';
}
function semifinalQualified(e){
 const rank=standings(e),n=rank.length;
 if(n===8)return rank.map(function(x){return x.id});
 if(n===10)return rank.slice(0,6).map(function(x){return x.id}).concat(eliminationWinners(e));
 if(n===12)return rank.slice(0,4).map(function(x){return x.id}).concat(elimination12Winners(e));
 if(n===16)return quarterfinalWinners(e);
 return [];
}
function auctionBalanceBefore(e,id){
 const row=standings(e).find(function(x){return x.id===id});
 return row?row.balance:0;
}
function auction1View(e){
 if(e.playerIds.length===6){
  const fs=ensureFinalStages(e),qualified=standings(e).map(function(x){return x.id});
  const spendRows=qualified.map(function(id){
   const available=auctionBalanceBefore(e,id)+(Number(fs.auction1.spending[id])||0);
   const spent=Number(fs.auction1.spending[id])||0;
   return '<tr><td><b>'+esc(playerName(playerById(id)))+'</b></td><td>'+available+'</td><td><input type="number" min="0" max="'+available+'" value="'+spent+'" data-auction1-spend="'+id+'"></td><td><b>'+(available-spent)+'</b></td></tr>';
  }).join("");
  return '<div class="notice"><b>Rodeo a 6:</b> asta unica, eliminatoria 3°+6° contro 4°+5°, poi finale automatica.</div>'+
   '<div class="card table-wrap"><table class="table"><thead><tr><th>Giocatore</th><th>Disponibili</th><th>Spesi</th><th>Residui</th></tr></thead><tbody>'+spendRows+'</tbody></table></div>'+
   '<button class="primary" data-action="save-auction1">Salva asta</button><div style="height:12px"></div>'+sixKnockoutView(e,"tokens");
 }
 const fs=ensureFinalStages(e),qualified=semifinalQualified(e);
 if(qualified.length!==8){
  const n=e.playerIds.length;
  const msg=n===16?"Prima completa tutti i quarti di finale.":(n===8?"Impossibile caricare gli 8 finalisti.":"Prima completa l’eliminatoria.");
  return '<div class="notice error">'+msg+'</div>';
 }
 const spendRows=qualified.map(function(id){
  const available=auctionBalanceBefore(e,id)+(Number(fs.auction1.spending[id])||0),spent=Number(fs.auction1.spending[id])||0;
  return '<tr><td><b>'+esc(playerName(playerById(id)))+'</b></td><td>'+available+'</td><td><input type="number" min="0" max="'+available+'" value="'+spent+'" data-auction1-spend="'+id+'"></td><td><b>'+(available-spent)+'</b></td></tr>';
 }).join("");
 const semis=fs.semifinals.map(function(m,index){
  const stage="semi"+(index+1),base=(e.matches||[]).length+1+index*(e.semifinalReturnLeg?2:1);
  const selectors='<div class="row"><div class="field"><label>Coppia A - giocatore 1</label><select data-team-stage="'+stage+'" data-side="A" data-pos="0">'+stagePlayerOptions(qualified,m.teamA[0])+'</select></div><div class="field"><label>Coppia A - giocatore 2</label><select data-team-stage="'+stage+'" data-side="A" data-pos="1">'+stagePlayerOptions(qualified,m.teamA[1])+'</select></div></div>'+
  '<div class="row"><div class="field"><label>Coppia B - giocatore 1</label><select data-team-stage="'+stage+'" data-side="B" data-pos="0">'+stagePlayerOptions(qualified,m.teamB[0])+'</select></div><div class="field"><label>Coppia B - giocatore 2</label><select data-team-stage="'+stage+'" data-side="B" data-pos="1">'+stagePlayerOptions(qualified,m.teamB[1])+'</select></div></div>';
  const cards=stageLegCard(e,stage,m,"Semifinale "+(index+1),1,base,index+1,"semifinal")+
   (e.semifinalReturnLeg?stageLegCard(e,stage,m,"Semifinale "+(index+1),2,base+1,index+1,"semifinal"):"");
  const t=stageAggregate(e,stage,m),w=stageWinnerTeam(e,stage,m);
  const summary=t?(t.a===t.b?'<div class="notice error">Totale in parità: <b>'+t.a+' - '+t.b+'</b>.</div>':'<div class="notice success">Totale semifinale: <b>'+t.a+' - '+t.b+'</b><br>Finalisti: <b>'+esc(names(w))+'</b></div>'):"";
  return '<div class="card"><h2>Composizione semifinale '+(index+1)+'</h2>'+selectors+'</div>'+cards+summary;
 }).join("");
 return '<div class="notice"><b>Prima asta:</b> inserisci i gettoni spesi e componi le semifinali.</div>'+
 '<div class="card table-wrap"><table class="table"><thead><tr><th>Giocatore</th><th>Disponibili</th><th>Spesi</th><th>Residui</th></tr></thead><tbody>'+spendRows+'</tbody></table></div>'+
 '<button class="primary" data-action="save-auction1">Salva prima asta</button><div style="height:12px"></div>'+semis;
}
function semifinalWinners(e){
 const fs=ensureFinalStages(e),out=[];
 fs.semifinals.forEach(function(m,i){
  const w=stageWinnerTeam(e,"semi"+(i+1),m);
  if(w.length===2)out.push.apply(out,w);
 });
 return out;
}
function auction2View(e){
 const fs=ensureFinalStages(e),finalists=semifinalWinners(e);
 if(finalists.length!==4)return '<div class="notice error">Prima completa entrambe le semifinali.</div>';
 const spendRows=finalists.map(function(id){
  const row=standings(e).find(function(x){return x.id===id}),current=row?row.balance:0,old2=Number(fs.auction2.spending[id])||0,available=current+old2;
  return '<tr><td><b>'+esc(playerName(playerById(id)))+'</b></td><td>'+available+'</td><td><input type="number" min="0" max="'+available+'" value="'+old2+'" data-auction2-spend="'+id+'"></td><td><b>'+(available-old2)+'</b></td></tr>';
 }).join("");
 const m=fs.final,base=(e.matches||[]).length+3+(e.semifinalReturnLeg?2:0);
 const selectors='<div class="row"><div class="field"><label>Coppia A - giocatore 1</label><select data-team-stage="final" data-side="A" data-pos="0">'+stagePlayerOptions(finalists,m.teamA[0])+'</select></div><div class="field"><label>Coppia A - giocatore 2</label><select data-team-stage="final" data-side="A" data-pos="1">'+stagePlayerOptions(finalists,m.teamA[1])+'</select></div></div>'+
 '<div class="row"><div class="field"><label>Coppia B - giocatore 1</label><select data-team-stage="final" data-side="B" data-pos="0">'+stagePlayerOptions(finalists,m.teamB[0])+'</select></div><div class="field"><label>Coppia B - giocatore 2</label><select data-team-stage="final" data-side="B" data-pos="1">'+stagePlayerOptions(finalists,m.teamB[1])+'</select></div></div>';
 const cards=stageLegCard(e,"final",m,"Finale",1,base,1,"final")+
  (e.finalReturnLeg?stageLegCard(e,"final",m,"Finale",2,base+1,1,"final"):"");
 const t=stageAggregate(e,"final",m);
 let summary="";
 if(t){
  if(t.a===t.b)summary='<div class="notice error">Totale finale in parità: <b>'+t.a+' - '+t.b+'</b>.</div>';
  else{
   const winners=t.a>t.b?m.teamA:m.teamB,seconds=t.a>t.b?m.teamB:m.teamA;
   e.playerIds.forEach(function(id){e.ledger[id].podium=0});
   winners.forEach(function(id){e.ledger[id].podium=10});
   seconds.forEach(function(id){e.ledger[id].podium=5});
   save();
   summary='<div class="notice success">Totale finale: <b>'+t.a+' - '+t.b+'</b><br>Vincitori: <b>'+esc(names(winners))+'</b><br>Secondi: <b>'+esc(names(seconds))+'</b></div>';
  }
 }
 return '<div class="notice"><b>Seconda asta:</b> inserisci i gettoni spesi e componi la finale.</div>'+
 '<div class="card table-wrap"><table class="table"><thead><tr><th>Finalista</th><th>Disponibili</th><th>Spesi</th><th>Residui</th></tr></thead><tbody>'+spendRows+'</tbody></table></div>'+
 '<button class="primary" data-action="save-auction2">Salva seconda asta</button>'+
 '<div class="card"><h2>Composizione finale</h2>'+selectors+'</div>'+cards+summary;
}
function stageMatch(e,stage){
 if(e.playerIds&&e.playerIds.length===6&&(stage==="elimination"||stage==="final")){
  const type=e.competitionType==="rodeo_simple"?"simple":"tokens";
  const k=ensureSixKnockout(e,type);
  return stage==="elimination"?k.elimination:k.final;
 }
 const fs=ensureFinalStages(e);
 if(stage==="elimination")return fs.elimination;
 if(stage.indexOf("elim12_")===0)return fs.elimination12[Number(stage.split("_")[1])-1];
 if(stage.indexOf("qf")===0)return fs.quarterfinals[Number(stage.replace("qf",""))-1];
 if(stage==="semi1")return fs.semifinals[0];
 if(stage==="semi2")return fs.semifinals[1];
 if(stage==="final")return fs.final;
 return null;
}
function validateStageTeams(m){
 if(!m||m.teamA.length!==2||m.teamB.length!==2)return false;
 const all=m.teamA.concat(m.teamB);
 return all.every(Boolean)&&new Set(all).size===4;
}
function saveStageResult(button){
 const e=currentEvent(),stage=button.getAttribute("data-stage"),leg=Number(button.getAttribute("data-leg")||1),m=stageMatch(e,stage),card=button.closest("[data-stage-card]"),msg=card.querySelector(".match-message");
 try{
  if(stage!=="elimination"&&!validateStageTeams(m))throw new Error("seleziona quattro giocatori diversi");
  const a=card.querySelector("[data-stage-score-a]").value,b=card.querySelector("[data-stage-score-b]").value;
  if(a===""||b==="")throw new Error("inserisci entrambi i punteggi");
  if(leg===2){m.score1R=Number(a);m.score2R=Number(b)}else{m.score1=Number(a);m.score2=Number(b)}
  if(stage==="final"&&e.competitionType==="rodeo_tokens"){
   e.playerIds.forEach(function(id){e.ledger[id].podium=0});
   const t=stageAggregate(e,"final",m);
   if(t&&t.a!==t.b){
    const w=t.a>t.b?m.teamA:m.teamB,s=t.a>t.b?m.teamB:m.teamA;
    w.forEach(function(id){e.ledger[id].podium=10});s.forEach(function(id){e.ledger[id].podium=5});
   }
  }
  save();render();
 }catch(err){if(msg){msg.className="notice error";msg.textContent="Errore: "+err.message}}
}
function editStageResult(stage,leg){
 const e=currentEvent(),m=stageMatch(e,stage),n=Number(leg||1);
 if(!m)return;
 if(n===2){m.score1R=null;m.score2R=null}else{m.score1=null;m.score2=null}
 if(stage==="final")e.playerIds.forEach(function(id){e.ledger[id].podium=0});
 save();render();
}
function saveAuction(which){
 const e=currentEvent(),fs=ensureFinalStages(e);
 const selector=which===1?"[data-auction1-spend]":"[data-auction2-spend]";
 const inputs=Array.from(document.querySelectorAll(selector));
 const target=which===1?fs.auction1.spending:fs.auction2.spending;
 inputs.forEach(function(input){target[input.getAttribute(which===1?"data-auction1-spend":"data-auction2-spend")]=Math.max(0,Number(input.value)||0)});
 e.playerIds.forEach(function(id){
  e.ledger[id].spent=(Number(fs.auction1.spending[id])||0)+(Number(fs.auction2.spending[id])||0);
 });
 save();alert((which===1?"Prima":"Seconda")+" asta salvata.");render();
}
function updateStageTeam(select){
 const e=currentEvent(),stage=select.getAttribute("data-team-stage"),side=select.getAttribute("data-side"),pos=Number(select.getAttribute("data-pos")),m=stageMatch(e,stage);
 if(!m)return;
 const key=side==="A"?"teamA":"teamB";
 while(m[key].length<2)m[key].push("");
 m[key][pos]=select.value;
 save();
}
function eventPlayersView(e){
 return '<div class="card">'+e.playerIds.map(function(id,i){const p=playerById(id);return'<div class="item"><div class="rank">'+(i+1)+'</div><div><b>'+esc(playerName(p))+'</b><div class="muted">'+esc(p.phone||"")+(p.level?" · "+esc(p.level):"")+'</div></div></div>'}).join("")+'</div>';
}
function commitBalances(){
 const e=currentEvent();if(!e)return;
 const rows=standings(e);
 rows.forEach(function(r){
  const p=playerById(r.id);
  if(p)p.tokenBalance=Math.max(0,Number(r.balance)||0);
 });
 save();
 alert("Saldi gettoni aggiornati nell’anagrafica.");
 render();
}

function printCurrentPage(){
 const oldTitle=document.title;
 const e=currentEvent();
 const sectionNames={
  matches:"Partite",
  standings:"Classifica",
  elimination:"Eliminatoria",
  auction1:"Asta 1 e semifinali",
  auction2:"Asta 2 e finale",
  tokens:"Situazione gettoni",
  players:"Partecipanti",payments:"Pagamenti reception",simplefinals:"Fasi finali",pairstandings:"Classifiche gironi",pairs:"Coppie",fixedfinals:"Fasi finali"
 };
 if(state.view==="event"&&e){
  document.title=(e.name+" - "+(sectionNames[state.tab]||"Riepilogo")).replace(/[\\/:*?"<>|]/g,"-");
 }else{
  document.title=("Padel Arena Manager - "+state.view).replace(/[\\/:*?"<>|]/g,"-");
 }
 const printClass="print-tab-"+(state.tab||state.view||"page");
 document.body.classList.add(printClass);
 window.print();
 setTimeout(function(){
  document.title=oldTitle;
  document.body.classList.remove(printClass);
 },500);
}
function deleteEvent(id){
 const e=state.events.find(function(x){return x.id===id});
 if(!e)return;
 if(!confirm('Eliminare definitivamente il torneo "'+e.name+'"?\\n\\nAnagrafica e saldi gettoni non verranno modificati.'))return;
 state.events=state.events.filter(function(x){return x.id!==id});
 if(state.currentEventId===id)state.currentEventId=null;
 save();render();
 if(PAM_SESSION&&pamIsAdmin()){
  sb.from("tournaments").delete().eq("id",id).then(function(r){
   if(r.error)pamToast("Eliminazione online non riuscita: "+r.error.message,"error");
  });
 }
}
function deleteAllEvents(){
 if(!state.events.length)return;
 const first=confirm("Vuoi cancellare tutte le "+state.events.length+" competizioni di prova?\\n\\nI giocatori e i loro saldi gettoni resteranno salvati.");
 if(!first)return;
 const second=confirm("Conferma definitiva: tutti i tornei, risultati, aste e fasi finali verranno eliminati. Procedere?");
 if(!second)return;
 state.events=[];
 state.currentEventId=null;
 state.view="events";
 state.tab="matches";
 save();render();
 alert("Tutti i tornei sono stati cancellati. Anagrafica e saldi gettoni sono rimasti invariati.");
}
document.addEventListener("click",function(ev){
 const refreshCloud=ev.target.closest("[data-refresh-cloud]");
 if(refreshCloud){pamCloudLoad(false).then(function(){pamToast("Dati aggiornati","success")}).catch(function(err){pamToast(err.message,"error")});return}
 const share=ev.target.closest("[data-share-event]");if(share){pamShareEvent(share.getAttribute("data-share-event"));return}
 const shareRegistration=ev.target.closest("[data-share-registration]");if(shareRegistration){pamShareRegistration(shareRegistration.getAttribute("data-share-registration"));return}
 const openRegistrations=ev.target.closest("[data-open-registrations]");if(openRegistrations){pamOpenRegistrations(openRegistrations.getAttribute("data-open-registrations"));return}
 const closeRegistrations=ev.target.closest("[data-close-registrations]");if(closeRegistrations){document.getElementById("pamRegistrationsOverlay")?.remove();return}
 const setCapacity=ev.target.closest("[data-set-registration-capacity]");if(setCapacity){pamSetRegistrationCapacity(setCapacity.getAttribute("data-set-registration-capacity"));return}
 const processRegistration=ev.target.closest("[data-process-registration]");if(processRegistration){pamProcessRegistration(processRegistration.getAttribute("data-process-registration"),processRegistration.getAttribute("data-action"),processRegistration.getAttribute("data-event-id"));return}

 const dup=ev.target.closest("[data-duplicate-event]");if(dup){pamDuplicateEvent(dup.getAttribute("data-duplicate-event"));return}
 const editEventBtn=ev.target.closest("[data-edit-event]");if(editEventBtn){pamEditEvent(editEventBtn.getAttribute("data-edit-event"));return}
 const managePlayers=ev.target.closest("[data-manage-tournament-players]");if(managePlayers){pamTournamentPlayersModal(managePlayers.getAttribute("data-manage-tournament-players"));return}
 const closePlayers=ev.target.closest("[data-close-tournament-players]");if(closePlayers){document.getElementById("pamTournamentPlayersOverlay")?.remove();return}
 const renameTournamentPlayer=ev.target.closest("[data-rename-tournament-player]");if(renameTournamentPlayer){pamRenameTournamentPlayer(renameTournamentPlayer.getAttribute("data-rename-tournament-player"));return}
 const regenerateTournament=ev.target.closest("[data-regenerate-tournament]");if(regenerateTournament){pamRegenerateTournament(regenerateTournament.getAttribute("data-regenerate-tournament"));return}
 const generateFixedFinals=ev.target.closest("[data-generate-fixed-finals]");if(generateFixedFinals){
  try{pamGenerateFixedFinals(currentEvent())}catch(err){pamToast(err.message,"error")}
  return
 }
 const resetFixedFinals=ev.target.closest("[data-reset-fixed-finals]");if(resetFixedFinals){
  if(confirm("Azzerare tabelloni e risultati delle fasi finali?")){
   delete currentEvent().fixedFinalsAdvanced;save();render();
  }
  return
 }
 const saveFixedFinal=ev.target.closest("[data-save-fixed-final]");if(saveFixedFinal){pamSaveFixedFinalResult(saveFixedFinal);return}
 const editFixedFinal=ev.target.closest("[data-edit-fixed-final]");if(editFixedFinal){pamEditFixedFinalResult(editFixedFinal.getAttribute("data-edit-fixed-final"));return}
 const deselectAllPlayers=ev.target.closest("[data-deselect-all-players]");if(deselectAllPlayers){
  if(!state.draft.selected.length){pamToast("Non ci sono giocatori selezionati.","error");return}
  if(!confirm("Deselezionare tutti i giocatori inseriti in questo torneo?"))return;
  state.draft.selected=[];
  state.draft.fixedPairRegistrations={};
  state.draft.showSelectedOnly=false;
  save();render();
  pamToast("Tutti i giocatori sono stati deselezionati.","success");
  return
 }
 const toggleSelectedOnly=ev.target.closest("[data-toggle-selected-only]");if(toggleSelectedOnly){
  state.draft.showSelectedOnly=!state.draft.showSelectedOnly;
  save();render();
  return
 }
 const quickNewEvent=ev.target.closest("[data-quick-player-new-event]");if(quickNewEvent){pamOpenQuickPlayer({mode:"new-event",category:state.draft.category});return}
 const quickExisting=ev.target.closest("[data-quick-player-existing-event]");if(quickExisting){
  const eventId=quickExisting.getAttribute("data-quick-player-existing-event");
  const e=state.events.find(function(x){return x.id===eventId});
  pamOpenQuickPlayer({
   mode:"existing-event",
   eventId:eventId,
   category:e&&e.category,
   selectedIds:pamCurrentModalSelectedIds()||((e&&e.playerIds)||[]).slice()
  });
  return
 }
 const replaceNewEvent=ev.target.closest("[data-replace-new-event-player]");if(replaceNewEvent){pamOpenReplacePlayer({mode:"new-event",replaceId:replaceNewEvent.getAttribute("data-replace-new-event-player"),category:state.draft.category});return}
 const replaceExisting=ev.target.closest("[data-replace-existing-event-player]");if(replaceExisting){
  pamOpenReplacePlayer({
   mode:"existing-event",
   eventId:replaceExisting.getAttribute("data-event-id"),
   replaceId:replaceExisting.getAttribute("data-replace-existing-event-player"),
   selectedIds:pamCurrentModalSelectedIds()
  });
  return
 }
 const closePairChoice=ev.target.closest("[data-close-pair-choice]");if(closePairChoice){document.getElementById("pamPairChoiceOverlay")?.remove();return}
 const pairSingle=ev.target.closest("[data-pair-single]");if(pairSingle){pamSetPairSingle(pairSingle.getAttribute("data-pair-single"));return}
 const pairTogether=ev.target.closest("[data-pair-together]");if(pairTogether){pamOpenPartnerPicker(pairTogether.getAttribute("data-pair-together"));return}
 const closePairPartner=ev.target.closest("[data-close-pair-partner]");if(closePairPartner){document.getElementById("pamPairPartnerOverlay")?.remove();return}
 const pairPartner=ev.target.closest("[data-pair-partner]");if(pairPartner){pamAssignPartner(pairPartner.getAttribute("data-pair-primary"),pairPartner.getAttribute("data-pair-partner"));return}
 const newPairPartner=ev.target.closest("[data-new-pair-partner]");if(newPairPartner){
  document.getElementById("pamPairPartnerOverlay")?.remove();
  pamOpenQuickPlayer({mode:"pair-partner",primaryPlayerId:newPairPartner.getAttribute("data-new-pair-partner"),category:state.draft.category});
  return
 }
 const closeQuick=ev.target.closest("[data-close-quick-player]");if(closeQuick){document.getElementById("pamQuickPlayerOverlay")?.remove();return}
 const saveQuick=ev.target.closest("[data-save-quick-player]");if(saveQuick){pamSaveQuickPlayer();return}
 const closeReplace=ev.target.closest("[data-close-replace-player]");if(closeReplace){document.getElementById("pamReplacePlayerOverlay")?.remove();return}
 const replacement=ev.target.closest("[data-replacement-player]");if(replacement){pamApplyReplacement(replacement.getAttribute("data-replacement-player"));return}
 const replaceWithNew=ev.target.closest("[data-replace-with-new]");if(replaceWithNew){
  const overlay=document.getElementById("pamReplacePlayerOverlay");
  const ctx=JSON.parse(overlay.dataset.context||"{}");
  overlay.remove();
  pamOpenQuickPlayer(ctx);
  return
 }


 const openChamp=ev.target.closest("[data-open-champ-team]");if(openChamp){state.champTeamId=openChamp.getAttribute("data-open-champ-team");state.view="championship-team";save();render();return}
 const toggleChamp=ev.target.closest("[data-toggle-team-access]");if(toggleChamp){pamToggleTeamAccess(toggleChamp.getAttribute("data-toggle-team-access"));return}
 const shareChamp=ev.target.closest("[data-share-team-invite]");if(shareChamp){pamShareTeamInvite(shareChamp.getAttribute("data-share-team-invite"));return}
 const saveChamp=ev.target.closest("[data-save-champ-team]");if(saveChamp){pamSaveChampTeamForm(saveChamp.getAttribute("data-save-champ-team"));return}
 const previewChamp=ev.target.closest("[data-preview-team-portal]");if(previewChamp){const t=pamChampTeam(previewChamp.getAttribute("data-preview-team-portal"));if(t)window.open(pamCaptainPortalUrl(t)+"&preview=1","_blank");return}

 const posterBtn=ev.target.closest("[data-open-poster]");if(posterBtn){pamOpenPoster(posterBtn.getAttribute("data-open-poster"));return}
 const toggleReg=ev.target.closest("[data-toggle-registration]");if(toggleReg){pamToggleTournamentRegistration(toggleReg.getAttribute("data-toggle-registration"));return}
 const posterClose=ev.target.closest("[data-close-poster]");if(posterClose){document.getElementById("pamPosterOverlay")?.remove();return}
 const posterDownload=ev.target.closest("[data-download-poster]");if(posterDownload){pamDownloadPoster(posterDownload.getAttribute("data-download-poster"));return}
 const viewBtn=ev.target.closest("[data-view]");if(viewBtn){
  const requested=viewBtn.getAttribute("data-view");
  if(!pamIsAdmin()&&["players","new"].includes(requested)){
   pamToast("L'account collaboratore può aprire i tornei e inserire i risultati.","error");
   return;
  }
  setView(requested);return
 }
 const tabBtn=ev.target.closest("[data-tab]");if(tabBtn){setTab(tabBtn.getAttribute("data-tab"));return}
 const action=ev.target.closest("[data-action]");if(action){
  const a=action.getAttribute("data-action");
  if(a==="cloud-check")pamRefreshSyncPanel();
  if(a==="cloud-upload-local")pamForceUploadLocal();
  if(a==="cloud-download")pamForceDownloadCloud();
  if(a==="dismiss-timer-alert")dismissTimerAlert();
  if(a==="start-timer")startTimer(action.getAttribute("data-timer-key"));
  if(a==="reset-timer")resetTimer(action.getAttribute("data-timer-key"));
  if(a==="save-player")savePlayer();
  if(a==="create-event")createEvent();
  if(a==="save-result")saveResult(action);
  if(a==="edit-result")editResult(action.getAttribute("data-match-id"));
  if(a==="commit-balances")commitBalances();
  if(a==="save-stage-result")saveStageResult(action);
  if(a==="edit-stage-result")editStageResult(action.getAttribute("data-stage"),action.getAttribute("data-leg"));
  if(a==="save-auction1")saveAuction(1);
  if(a==="save-auction2")saveAuction(2);
  if(a==="print-pdf")printCurrentPage();
  if(a==="delete-all-events")deleteAllEvents();
  if(a==="save-simple-result")saveSimpleResult(action);
  if(a==="edit-simple-result")editSimpleResult(action.getAttribute("data-simple-id"));
  if(a==="save-six-result")saveSixResult(action);
  if(a==="edit-six-result")editSixResult(action.getAttribute("data-six-id"),action.getAttribute("data-six-type"));
  return;
 }
 const open=ev.target.closest("[data-open-event]");if(open){state.currentEventId=open.getAttribute("data-open-event");state.view="event";state.tab="matches";save();render();return}
 const del=ev.target.closest("[data-delete-event]");if(del){deleteEvent(del.getAttribute("data-delete-event"));return}
 const edit=ev.target.closest("[data-edit-player]");if(edit){editPlayer(edit.getAttribute("data-edit-player"));return}
});



function pamDraftValue(id,fallback){const el=document.getElementById(id);return el?el.value:fallback}
function pamEstimateTournamentEnd(opts){
 const count=Math.max(0,Number(opts.count)||0),courts=Math.max(1,Number(opts.courts)||1),slot=Math.max(1,Number(opts.slot)||20);
 let matches=0;
 if(count>=4){
  if(opts.type==="fixed_pairs"){const pairs=Math.floor(count/2),g=Math.max(2,Number(opts.pairsPerGroup)||4);matches=Math.ceil(pairs/g)*(g*(g-1)/2)+3}
  else matches=({6:6,8:8,10:10,12:12,16:16}[count]||count)+3;
  if(opts.returnLeg)matches*=2;
 }
 const slots=Math.ceil(matches/courts),minutes=slots*slot;
 const start=new Date((opts.date||new Date().toISOString().slice(0,10))+"T"+(opts.start||"20:00"));
 return{matches,minutes,end:new Date(start.getTime()+minutes*60000)};
}
function pamEstimateDraftFeasibility(){
 const count=Number(pamDraftValue("eRegistrationCapacity",state.draft.registrationCapacity||16));
 const result=pamEstimateTournamentEnd({count:count,courts:pamDraftValue("eCourts",state.draft.courts),slot:pamDraftValue("eSlotDuration",state.draft.slotDuration),type:pamDraftValue("eCompetitionType",state.draft.competitionType),pairsPerGroup:pamDraftValue("ePairsPerGroup",state.draft.pairsPerGroup),returnLeg:pamDraftValue("eReturnLeg",state.draft.returnLeg?"yes":"no")==="yes",date:pamDraftValue("eDate",state.draft.date),start:pamDraftValue("eStartTime",state.draft.startTime)});
 const limit=new Date((pamDraftValue("eEndDate",state.draft.endDate)||pamDraftValue("eDate",state.draft.date))+"T"+(pamDraftValue("eEndTime",state.draft.endTime)||"23:00"));
 const overrun=result.end>limit;
 const fmt=d=>d.toLocaleString("it-IT",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
 return{overrun,result,limit,message:(overrun?"ATTENZIONE: con ":"Configurazione compatibile: con ")+count+" giocatori sono previste circa "+result.matches+" partite e la fine stimata è "+fmt(result.end)+(overrun?", oltre il limite impostato "+fmt(limit)+".":".")};
}
function pamUpdateFeasibility(){const box=document.getElementById("pamTimeFeasibility");if(!box)return;const f=pamEstimateDraftFeasibility();box.className="notice "+(f.overrun?"error":"success");box.innerHTML="<b>Controllo automatico tempi:</b> "+esc(f.message)+(f.overrun?"<br>Potrai comunque salvare confermando l’avviso.":"");}
async function pamToggleTournamentRegistration(id){const e=state.events.find(x=>x.id===id);if(!e)return;e.registrationOpen=!e.registrationOpen;e.status=e.registrationOpen?"registration_open":"registration_closed";save();render();pamToast("Iscrizioni "+(e.registrationOpen?"aperte":"chiuse"),"success")}
function pamPosterTheme(e){
 if(e.posterTheme==="cupra_bossoni")return{bg:"#08090b",accent:"#c67855",sub:"CUPRA BOSSONI",motif:"AUTOMOTIVE · PADEL · PERFORMANCE"};
 if(e.posterTheme==="aics_mare")return{bg:"#f5fbff",accent:"#087a4a",sub:"AICS PADEL AL MARE",motif:"SPORT · MARE · ITALIA",light:true};
 return{bg:"#06253b",accent:"#ff8a18",sub:"EDEN SUMMER PADEL",motif:"PISCINA · SPRITZ · MUSICA · BAR"};
}
function pamOpenPoster(id){
 const e=state.events.find(x=>x.id===id);if(!e)return;document.getElementById("pamPosterOverlay")?.remove();
 const o=document.createElement("div");o.id="pamPosterOverlay";o.className="pam-modal-overlay";o.innerHTML='<div class="pam-modal-card" style="max-width:760px"><div class="pam-modal-head"><div><h2>Locandina dinamica</h2><div class="muted">Include il QR Code collegato all’iscrizione pubblica.</div></div><button class="secondary" data-close-poster>Chiudi</button></div><canvas id="pamPosterCanvas" width="1080" height="1350" style="width:100%;border-radius:16px;background:#fff"></canvas><div class="actions" style="margin-top:12px"><button class="primary" data-download-poster="'+id+'">SCARICA LOCANDINA PNG</button><button class="secondary" data-share-registration="'+id+'">CONDIVIDI LINK ISCRIZIONE</button></div></div>';document.body.appendChild(o);pamDrawPoster(e);
}
function pamDrawPoster(e){
 const c=document.getElementById("pamPosterCanvas"),x=c.getContext("2d"),t=pamPosterTheme(e),url=pamRegistrationUrl(e);x.fillStyle=t.bg;x.fillRect(0,0,c.width,c.height);
 x.fillStyle=t.accent;x.fillRect(0,0,1080,28);x.fillRect(0,1322,1080,28);
 x.textAlign="center";x.fillStyle=t.light?"#09254b":"#fff";x.font="900 46px Arial";x.fillText(t.sub,540,110);x.font="700 25px Arial";x.fillText(t.motif,540,155);
 x.font="900 74px Arial";wrapCanvasText(x,(e.name||"TORNEO PADEL").toUpperCase(),540,280,920,82);
 x.fillStyle=t.accent;x.font="900 38px Arial";x.fillText((e.category||"").toUpperCase()+" · "+competitionTypeLabel(e.competitionType),540,510);
 x.fillStyle=t.light?"#09254b":"#fff";x.font="800 44px Arial";x.fillText((e.date||"")+" · ORE "+(e.startTime||""),540,590);x.font="700 34px Arial";x.fillText(e.club||"",540,645);
 x.font="700 28px Arial";wrapCanvasText(x,e.description||"Iscriviti ora e assicurati il tuo posto!",540,735,880,38);
 x.fillStyle=t.accent;x.fillRect(115,880,850,250);x.fillStyle="#07111f";x.font="900 38px Arial";x.fillText("INQUADRA IL QR CODE E ISCRIVITI",540,940);
 const box=document.createElement("div");box.style.cssText="position:fixed;left:-9999px;top:-9999px";document.body.appendChild(box);new QRCode(box,{text:url,width:150,height:150,correctLevel:QRCode.CorrectLevel.H});setTimeout(()=>{const img=box.querySelector("img")||box.querySelector("canvas");if(img)x.drawImage(img,465,970,150,150);box.remove();},80);
 x.fillStyle=t.light?"#09254b":"#fff";x.font="800 27px Arial";x.fillText("POSTI: "+Number(e.registrationCapacity||16)+" · QUOTA: € "+Number(e.entryFee||0),540,1205);x.font="600 22px Arial";x.fillText("Padel Arena Manager · iscrizioni online e lista d’attesa",540,1260);
}
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight){const words=String(text||"").split(/\s+/);let line="",yy=y;for(const w of words){const test=line+w+" ";if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line.trim(),x,yy);line=w+" ";yy+=lineHeight}else line=test}if(line)ctx.fillText(line.trim(),x,yy);return yy}
function pamDownloadPoster(id){const e=state.events.find(x=>x.id===id),c=document.getElementById("pamPosterCanvas");if(!e||!c)return;setTimeout(()=>{const a=document.createElement("a");a.download=(e.name||"torneo").replace(/[^a-z0-9]+/gi,"_")+"_locandina.png";a.href=c.toDataURL("image/png");a.click()},150)}

function pamFilterChampTeams(){
 const q=(document.getElementById("champTeamSearch")?.value||"").trim().toLowerCase();
 const series=document.getElementById("champSeriesFilter")?.value||"";
 document.querySelectorAll("[data-champ-team-row]").forEach(function(row){
  const okQ=!q||String(row.getAttribute("data-champ-team-row")||"").includes(q);
  const okS=!series||String(row.getAttribute("data-champ-series")||"").includes(series);
  row.style.display=okQ&&okS?"":"none";
 });
}
document.addEventListener("input",function(ev){
 if(["eRegistrationCapacity","eCourts","eSlotDuration","eStartTime","eEndTime","eDate","eEndDate"].includes(ev.target.id)){pamUpdateFeasibility()}
 if(ev.target.id==="champTeamSearch"){pamFilterChampTeams();return}

 if(ev.target.id==="playerSearchInput"){
  const query=ev.target.value.trim().toLowerCase();
  let visible=0;
  document.querySelectorAll(".player-search-row").forEach(function(row){
   const show=!query||String(row.getAttribute("data-player-search")||"").includes(query);
   row.style.display=show?"":"none";
   if(show)visible++;
  });
  const count=document.getElementById("playerSearchCount");
  if(count)count.textContent=visible+" nominativi visualizzati";
 }
 if(ev.target.id==="eventPlayerSearchInput"){
  const query=normalizeName(ev.target.value||"");
  let visible=0;
  document.querySelectorAll(".event-player-search-row").forEach(function(row){
   const haystack=normalizeName(row.getAttribute("data-event-player-search")||"");
   const checked=!!row.querySelector('[data-select-player]:checked');
   const selectedOnly=!!(state.draft&&state.draft.showSelectedOnly);
   const show=query ? haystack.includes(query) : (!selectedOnly||checked);
   row.classList.toggle("pam-hidden-unselected",!show);
   row.style.removeProperty("display");
   if(show)visible++;
  });
  const badge=document.getElementById("pamSelectedPlayersBadge");
  if(badge){
   badge.textContent=query ? visible+" TROVATI" : (state.draft.selected.length+" SELEZIONATI");
  }
 }
});

document.addEventListener("change",function(ev){
 const accessBox=ev.target.closest("[data-team-access-checkbox]");if(accessBox){pamToggleTeamAccess(accessBox.getAttribute("data-team-access-checkbox"),accessBox.checked);return}
 if(ev.target.id==="champSeriesFilter"){pamFilterChampTeams()}

 if(ev.target.id==="eClub"){
  const wrap=document.getElementById("pamCustomAddressWrap");
  if(wrap)wrap.classList.toggle("hidden",!pamClubAllowsCustomAddress(ev.target.value));
 }

 if(ev.target.matches("[data-tournament-logo]")){pamUploadTournamentLogo(ev.target.getAttribute("data-tournament-logo"),ev.target.files&&ev.target.files[0]);return}
 if(ev.target.matches("[data-player-photo]")){pamUploadPlayerPhoto(ev.target.getAttribute("data-player-photo"),ev.target.files&&ev.target.files[0]);return}

 if(ev.target.matches("[data-team-stage]")){
  updateStageTeam(ev.target);return;
 }
 if(ev.target.matches('[data-action="change-type"]')){
  state.draft.name=document.getElementById("eName").value;
  state.draft.date=document.getElementById("eDate").value;
  state.draft.club=document.getElementById("eClub").value;
  state.draft.customAddress=pamClubAllowsCustomAddress(state.draft.club)?(document.getElementById("eCustomAddress")?.value.trim()||""):"";
  state.draft.category=document.getElementById("eCategory").value;
  state.draft.competitionType=ev.target.value;
  if(state.draft.competitionType!=="fixed_pairs")state.draft.fixedPairRegistrations={};
  state.draft.courts=Number(document.getElementById("eCourts").value)||1;
  state.draft.fee=Math.max(0,Number(document.getElementById("eFee").value)||0);
  state.draft.returnLeg=document.getElementById("eReturnLeg").value==="yes";
  state.draft.eliminationReturnLeg=document.getElementById("eEliminationReturnLeg").value==="yes";
  state.draft.semifinalReturnLeg=document.getElementById("eSemifinalReturnLeg").value==="yes";
  state.draft.finalReturnLeg=document.getElementById("eFinalReturnLeg").value==="yes";
  state.draft.startTime=document.getElementById("eStartTime").value||"20:00";
  state.draft.matchMode="timed";
  state.draft.timerDuration=Math.max(1,Number(document.getElementById("eTimerDuration").value)||15);
  state.draft.slotDuration=Math.max(state.draft.timerDuration,Number(document.getElementById("eSlotDuration").value)||20);
  state.draft.matchDuration=state.draft.slotDuration;
  state.draft.initialTimerEnabled=document.getElementById("eInitialTimer").value==="yes";
  state.draft.eliminationTimerEnabled=document.getElementById("eEliminationTimer").value==="yes";
  state.draft.semifinalTimerEnabled=document.getElementById("eSemifinalTimer").value==="yes";
  state.draft.finalTimerEnabled=document.getElementById("eFinalTimer").value==="yes";
  state.draft.description=document.getElementById("eDescription")?.value.trim()||"";
  state.draft.endDate=document.getElementById("eEndDate")?.value||state.draft.date;
  state.draft.endTime=document.getElementById("eEndTime")?.value||"23:00";
  state.draft.registrationMin=Math.max(1,Number(document.getElementById("eRegistrationMin")?.value)||4);
  state.draft.registrationCapacity=Math.max(state.draft.registrationMin,Number(document.getElementById("eRegistrationCapacity")?.value)||16);
  state.draft.registrationOpen=document.getElementById("eRegistrationOpen")?.value!=="no";
  state.draft.waitlistEnabled=document.getElementById("eWaitlistEnabled")?.value!=="no";
  state.draft.posterTheme=document.getElementById("ePosterTheme")?.value||"eden_summer";
  if(ev.target.value==="rodeo_tokens")state.draft.name="Rodeo a Gettoni";
  if(ev.target.value==="rodeo_simple")state.draft.name="RODEO SEMPLICE";
  if(ev.target.value==="fixed_pairs")state.draft.name="COPPIE FISSE";
  save();render();return;
 }
 if(ev.target.matches('[data-action="change-category"]')){
  state.draft.name=document.getElementById("eName").value;
  state.draft.date=document.getElementById("eDate").value;
  state.draft.club=document.getElementById("eClub").value;
  state.draft.customAddress=pamClubAllowsCustomAddress(state.draft.club)?(document.getElementById("eCustomAddress")?.value.trim()||""):"";
  state.draft.category=ev.target.value;
  state.draft.courts=Number(document.getElementById("eCourts").value)||1;
  state.draft.competitionType=document.getElementById("eCompetitionType").value;
  state.draft.fee=Math.max(0,Number(document.getElementById("eFee").value)||0);
  state.draft.returnLeg=document.getElementById("eReturnLeg").value==="yes";
  state.draft.eliminationReturnLeg=document.getElementById("eEliminationReturnLeg").value==="yes";
  state.draft.semifinalReturnLeg=document.getElementById("eSemifinalReturnLeg").value==="yes";
  state.draft.finalReturnLeg=document.getElementById("eFinalReturnLeg").value==="yes";
  state.draft.startTime=document.getElementById("eStartTime").value||"20:00";
  state.draft.matchMode="timed";
  state.draft.timerDuration=Math.max(1,Number(document.getElementById("eTimerDuration").value)||15);
  state.draft.slotDuration=Math.max(state.draft.timerDuration,Number(document.getElementById("eSlotDuration").value)||20);
  state.draft.matchDuration=state.draft.slotDuration;
  state.draft.initialTimerEnabled=document.getElementById("eInitialTimer").value==="yes";
  state.draft.eliminationTimerEnabled=document.getElementById("eEliminationTimer").value==="yes";
  state.draft.semifinalTimerEnabled=document.getElementById("eSemifinalTimer").value==="yes";
  state.draft.finalTimerEnabled=document.getElementById("eFinalTimer").value==="yes";
  state.draft.description=document.getElementById("eDescription")?.value.trim()||"";
  state.draft.endDate=document.getElementById("eEndDate")?.value||state.draft.date;
  state.draft.endTime=document.getElementById("eEndTime")?.value||"23:00";
  state.draft.registrationMin=Math.max(1,Number(document.getElementById("eRegistrationMin")?.value)||4);
  state.draft.registrationCapacity=Math.max(state.draft.registrationMin,Number(document.getElementById("eRegistrationCapacity")?.value)||16);
  state.draft.registrationOpen=document.getElementById("eRegistrationOpen")?.value!=="no";
  state.draft.waitlistEnabled=document.getElementById("eWaitlistEnabled")?.value!=="no";
  state.draft.posterTheme=document.getElementById("ePosterTheme")?.value||"eden_summer";
  if(document.getElementById("ePairsPerGroup"))state.draft.pairsPerGroup=Number(document.getElementById("ePairsPerGroup").value)||4;
  if(document.getElementById("eFinalsOption"))state.draft.finalsOption=document.getElementById("eFinalsOption").value;
  state.draft.selected=[];
  save();render();return;
 }
 if(ev.target.matches("[data-select-player]")){
  const id=ev.target.getAttribute("data-select-player");
  if(ev.target.checked){
   if(!state.draft.selected.includes(id))state.draft.selected.push(id);
   save();render();
   if(pamIsFixedPairsDraft())setTimeout(function(){pamAskFixedPairRegistration(id)},60);
  }else{
   pamRemovePairRegistration(id);
   state.draft.selected=state.draft.selected.filter(function(x){return x!==id});
   save();render();
  }
  return;
 }
 if(ev.target.matches("[data-payment]")){
  const e=currentEvent(),id=ev.target.getAttribute("data-payment"),field=ev.target.getAttribute("data-pay-field");
  e.payments=e.payments||defaultPayments(e.playerIds,e.entryFee||0);
  e.payments[id]=e.payments[id]||{fee:Number(e.entryFee)||0,paid:false,method:"",notes:""};
  e.payments[id][field]=field==="paid"?ev.target.checked:field==="fee"?Math.max(0,Number(ev.target.value)||0):ev.target.value;
  save();render();return;
 }
 if(ev.target.matches("[data-ledger]")){
  const e=currentEvent();const id=ev.target.getAttribute("data-ledger");const field=ev.target.getAttribute("data-field");
  e.ledger[id]=e.ledger[id]||{carried:0,spent:0,podium:0};e.ledger[id][field]=Math.max(0,Number(ev.target.value)||0);save();render();
 }
});

function pamActiveBrand(){
 if(state.view==="event"){
  const e=currentEvent();
  return clubInfo(e&&e.club);
 }
 if(state.view==="new")return clubInfo(state.draft&&state.draft.club);
 return clubInfo("Padel Arena Manager");
}
function pamApplyDynamicTheme(){
 const c=pamActiveBrand();
 const root=document.documentElement;
 root.style.setProperty("--club-accent",c.accent||"#9DFF25");
 root.style.setProperty("--club-accent2",c.accent2||"#16A8FF");
 root.style.setProperty("--club-bg",c.background||"#07111F");
 root.style.setProperty("--accent",c.accent||"#9DFF25");
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.setAttribute("content",c.background||"#07111F");
 document.body.dataset.club=(c.name||"").toLowerCase().replace(/\s+/g,"-");
}

function render(){
 let body=state.view==="championship-team"?championshipTeamView():state.view==="championship"?championshipView():state.view==="players"?playersView():state.view==="new"?newEventView():state.view==="events"?eventsView():state.view==="event"?eventView():home();
 document.getElementById("root").innerHTML='<main class="app">'+body+'</main>'+nav();
 pamApplyDynamicTheme();
}
const pamOriginalRender=render;
render=function(){
 pamOriginalRender();
 setTimeout(pamRestrictCollaboratorUI,0);
};

render();

if("serviceWorker" in navigator){
 window.addEventListener("load",function(){
  navigator.serviceWorker.register("./service-worker.js?v=5.0-preview",{updateViaCache:"none"}).then(function(reg){
   reg.update();
   if(reg.waiting)reg.waiting.postMessage({type:"SKIP_WAITING"});
   reg.addEventListener("updatefound",function(){
    const worker=reg.installing;
    if(!worker)return;
    worker.addEventListener("statechange",function(){
     if(worker.state==="installed"&&navigator.serviceWorker.controller){
      worker.postMessage({type:"SKIP_WAITING"});
     }
    });
   });
  }).catch(function(err){
   console.warn("Service worker non registrato:",err);
  });

  let refreshing=false;
  navigator.serviceWorker.addEventListener("controllerchange",function(){
   if(refreshing)return;
   refreshing=true;
   window.location.reload();
  });
 });
}



const pamObserver=new MutationObserver(()=>pamRestrictCollaboratorUI());
window.addEventListener("DOMContentLoaded",()=>{
 pamObserver.observe(document.body,{subtree:true,childList:true});
 setTimeout(pamBootAuth,0);
});




async function pamToggleRoster(team){
 const next=!team.rosterOpen;
 try{
  if(typeof supabaseClient!=='undefined'){
   const {error}=await supabaseClient.from('championship_teams').update({roster_open:next,player_self_registration_enabled:next}).eq('id',team.id);
   if(error)throw error;
  } else if(typeof sb!=='undefined'){
   const {error}=await sb.from('championship_teams').update({roster_open:next,player_self_registration_enabled:next}).eq('id',team.id);
   if(error)throw error;
  }
  team.rosterOpen=next; team.playerSelfRegistrationEnabled=next;
  alert(next?'Raccolta rosa aperta: capitano e giocatori possono inserire dati.':'Raccolta rosa chiusa: i link non accettano nuove richieste.');
 }catch(e){alert('Non è stato possibile cambiare lo stato: '+(e.message||e))}
}
function pamPlayerRegistrationUrl(team){
 const token=(team.playerInviteToken||team.player_invite_token||team.inviteToken+'player');
 return new URL('player-registration.html?team='+encodeURIComponent(token),location.href).href;
}
function pamPlayerInstructions(team){
 const link=pamPlayerRegistrationUrl(team);
 return `Ciao! Sei stato invitato a inserirti nella rosa di ${team.teamName} per l’AICS Padel Championship 2027.\n\nApri questo link personale della squadra:\n${link}\n\nCosa devi fare:\n1. Compila i tuoi dati anagrafici e di contatto.\n2. Carica una foto riconoscibile.\n3. Accetta privacy e regolamento.\n4. Invia la richiesta.\n\nLa tua iscrizione resterà in attesa di approvazione da parte del capitano e dell’organizzazione. Tessera AICS e certificato medico potranno essere completati successivamente.`;
}
async function pamShareText(title,text){
 try{if(navigator.share){await navigator.share({title,text});return} await navigator.clipboard.writeText(text);alert('Messaggio e link copiati. Ora puoi incollarli su WhatsApp o email.')}catch(e){if(e.name!=='AbortError') prompt('Copia questo messaggio:',text)}
}
document.addEventListener('click',e=>{
 const a=e.target.closest('[data-add-team-player]');
 const sh=e.target.closest('[data-share-player-link]');
 const cp=e.target.closest('[data-copy-player-link]');
 const tg=e.target.closest('[data-toggle-roster]');
 const id=(a||sh||cp||tg)?.getAttribute(a?'data-add-team-player':sh?'data-share-player-link':cp?'data-copy-player-link':'data-toggle-roster');
 if(!id)return;
 const team=(typeof PAM_CHAMPIONSHIP_TEAMS!=='undefined'?PAM_CHAMPIONSHIP_TEAMS:[]).find(t=>t.id===id) || (typeof DEMO_TEAMS!=='undefined'?DEMO_TEAMS.find(t=>t.id===id):null);
 if(!team)return alert('Squadra non trovata.');
 if(tg){pamToggleRoster(team);return}
 if(a){location.href=pamPlayerRegistrationUrl(team)+'&mode=admin';return}
 if(sh){pamShareText('Invito rosa '+team.teamName,pamPlayerInstructions(team));return}
 navigator.clipboard?.writeText(pamPlayerRegistrationUrl(team)); alert('Link della squadra copiato.');
});
