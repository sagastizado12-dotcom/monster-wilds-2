// ===== Mature language layer (brief 49). Clean text is the original; mature text is derived per speaker.
'use strict';
(function(){
const KEY='monsterwilds2_mature';
const M={get on(){try{return localStorage.getItem(KEY)!=='0';}catch(e){return true;}},set(v){try{localStorage.setItem(KEY,v?'1':'0');}catch(e){}}};window.MATURE=M;
const h=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return x>>>0;};
const HEAVY=new Set(['dunn','varga','rook','fynn','marlow','brin','rusk','ravel','bjorn','grum','osric','mott','vesper2','rival1','rival2','syn0','syn1','syn2','syn3','syn4','katla','kiri','ozzie']);
const NONE=new Set(['linnea','hale','coraline','fenwick','rimma','thessaly','stranger','ivo','pell']);
const LIGHT=new Set(['ilsa','wren','syn5','rowan','corwin','moira','elof','fenna','nerys','morwen']);
const KIDS=new Set(['corin','emmet','nell','pip','liesel','tobin']);
function tier(id,cls){if(!id)return 'mid';if(NONE.has(id))return 'none';if(KIDS.has(id))return 'kid';if(HEAVY.has(id)||/^rt\d/.test(id)||/Follower|Choir/.test(cls||''))return 'heavy';if(LIGHT.has(id))return 'light';return 'mid';}
const PRE={heavy:['Hell. ','Shit. ','Damn it. ','Fuckin\' hell. ','Ah, bollocks. ','Son of a bitch. ','Goddamn. '],mid:['Damn. ','Hell. ','Well, shit. ','Ugh, hell. '],light:['Damn. ']};
const SUF={heavy:[' Damn it all.',' Bastards, the lot of \'em.',' Hell of a thing.',' What a load of shit.',' Fuck me.',' Don\'t be a jackass about it.',' Piss off if you don\'t like it.'],mid:[' Damn shame.',' Hell of a thing.',' Pain in the ass, honestly.'],light:[],kid:[' ...Don\'t tell anyone I said "crap".',' Heh. Butt-face.',' Pfft. Dummy.',' That\'s what my uncle says, anyway. Then he says a bad word.',' Crap, that sounded grown-up.']};
const SW=[[/\bvery\b/g,'damn'],[/\bidiot\b/gi,'dumbass'],[/\bfool\b/gi,'jackass'],[/\bWow\b/g,'Holy shit'],[/\bOh no\b/g,'Oh, hell'],[/\bscoundrels?\b/gi,'bastards'],[/\bnonsense\b/gi,'bullshit'],[/\bstupid\b/gi,'goddamn stupid'],[/\bheck\b/gi,'hell'],[/\bdarn\b/gi,'damn']];
let NAMES=null;function speaker(name){if(!NAMES){NAMES={};(typeof PEOPLE!=='undefined'?PEOPLE:[]).forEach(p=>NAMES[p.name]={id:p.id});(typeof TRAINERS!=='undefined'?TRAINERS:[]).forEach(t=>{const n=String(t.name).replace(/\{[A-Z]+\}/g,'');if(!NAMES[n])NAMES[n]={id:t.id,cls:t.cls};});}
 return NAMES[name]||(/Follower|Choir|Grunt|Admin|Chanter/.test(name)?{id:'syn0',cls:'Follower'}:/rival|\{R\}/i.test(name)?{id:'rival1'}:null);}
function spice(txt,id,cls){const t=tier(id,cls);if(t==='none')return txt;const k=h(id+'|'+txt);let s=txt;
 if(t==='heavy'||t==='mid'&&k%2===0)for(const [re,w] of SW)s=s.replace(re,w);
 if(t==='kid'){if(k%3===0)s=s+SUF.kid[k%SUF.kid.length];return s;}
 const pre=PRE[t],suf=SUF[t];const r=k%100;
 if(t==='heavy'){if(r<55)s=pre[(k>>8)%pre.length]+s;else if(r<85&&suf.length)s=s+suf[(k>>8)%suf.length];}
 else if(t==='mid'){if(r<22)s=pre[(k>>8)%pre.length]+s;else if(r<34)s=s+suf[(k>>8)%suf.length];}
 else if(t==='light'){if(r<8)s=pre[0]+s;}
 return s;}
// Speech lines are "Name: text". Narration, parentheses and system lines stay clean.
M.line=function(text,fmtName){if(!M.on||typeof text!=='string')return text;const m=text.match(/^([^:()\n]{2,40}): ([\s\S]+)$/);if(!m)return text;const nm=fmtName?fmtName(m[1]):m[1];const sp=speaker(nm)||speaker(m[1]);if(!sp)return text;return m[1]+': '+spice(m[2],sp.id,sp.cls);};
// Darker, grittier backstories (clean original is p.back). No slurs, no sexual content; lore rules intact.
const BACK={
 dunn:'Dunn has run the Cinderbrook mines for thirty years. The cave-in that took two of his fingers also took four of his men, and he still pays their widows out of his own damn pocket.',
 varga:'Varga dug herself out of that cave-in with a broken arm and three dead friends beside her. She drank for two years straight after. Sober now, mostly, and meaner for it.',
 rook:'Rook lost his ferry when the Followers drained the harbour. He spent a year drinking his savings away in Gull\'s Rest before Wilma threw him out and told him to get his shit together.',
 rusk:'Rusk did four years in a Galecrest cell for smuggling fire-opals. He swears he\'s clean now. The scar on his face says the people he owed money to weren\'t so forgiving.',
 ravel:'Ravel sells "ancient" trinkets to tourists and steals the rest. Most of it is junk. A few pieces are real, and a few of those came off graves he\'d rather not talk about.',
 osric:'Greta\'s brother. After their father drank the inn into debt and their mother died of the cold, the two of them tore each other apart over what was left. Osric walked into the snow and never came back.',
 greta:'Greta runs the only inn in Frostmere. She kept it afloat after her father pissed the family money away on drink. She hasn\'t forgiven him, or her brother Osric for leaving her to clean up the mess.',
 gideon:'Gideon tends Duskhollow\'s graves. He dug his own son\'s grave during the fever winter, and he still talks to him every night, because the silence is worse.',
 aldous:'Aldous has kept the light burning for thirty years. The one night he fell asleep drunk at his post, a fishing boat broke on the rocks. He has not touched a drop since.',
 brin:'Brin sailed every coast of the island, ran contraband for a decade, and buried half his crew at sea. Now he sits at the end of the dock and swears at the gulls.',
 ash:'Ashlynn burned out as a city doctor after losing a ward full of patients in one bad week. She came to Cinderbrook to stop hearing the alarms in her sleep.',
 marlow:'Marlow\'s brother drowned hauling nets in a storm Marlow told him to sail into. He sells fish, cracks jokes, and never goes out on the water anymore.',
 bjorn:'Bjorn trades furs and tells tall tales. The true one he never tells: the winter he got lost and survived by eating his own sled dogs.',
 fynn:'Fynn ran away from a father who hit him and signed on as a deckhand at twelve. He dreams of sailing past the horizon, mostly so nobody can find him.',
 grum:'Grum taught Brann to forge after his own son ran off with the Followers. He critiques every blade that leaves Cinderbrook because it\'s easier than talking about the boy.',
 jory:'Jory came to the cliffs after a bar fight in Tidehaven left a man half-dead. Charges were dropped. The guilt wasn\'t. Birds don\'t ask questions.',
 wilma:'Wilma\'s first husband gambled away their house, then their boat, then tried to sell her inn out from under her. She threw him in the harbour. Gull\'s Rest has been hers ever since.'};
M.back=p=>p&&M.on&&BACK[p.id]?BACK[p.id]:(p&&p.back);
M.BACK=BACK;M.spice=spice;M.tier=tier;
})();
