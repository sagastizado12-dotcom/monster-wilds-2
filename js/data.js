// Guard: animations can momentarily produce tiny negative radii; clamp instead of throwing.
(function(){const P=CanvasRenderingContext2D.prototype,e=P.ellipse,a=P.arc;P.ellipse=function(x,y,rx,ry,...r){return e.call(this,x,y,Math.max(0,rx),Math.max(0,ry),...r);};P.arc=function(x,y,r,...o){return a.call(this,x,y,Math.max(0,r),...o);};})();
// ===== Monster Wilds: data =====
'use strict';
const TYPES=['Normal','Fire','Tide','Leaf','Volt','Stone','Gale','Frost','Dark','Mind','Metal','Light','Echo'];
const TCOL={Normal:'#b8b090',Fire:'#f06030',Tide:'#3878e8',Leaf:'#48b048',Volt:'#f0d030',Stone:'#a08858',Gale:'#90b8f0',Frost:'#90e0f0',Dark:'#604878',Mind:'#e858a0',Metal:'#a0a8b8',Light:'#e8c848',Echo:'#b090f0'};
// attacker -> {defender:mult}
const CHART={
 Normal:{Stone:.5,Metal:.5,Dark:0},
 Fire:{Leaf:2,Frost:2,Metal:2,Tide:.5,Stone:.5,Fire:.5},
 Tide:{Fire:2,Stone:2,Leaf:.5,Tide:.5,Frost:.5},
 Leaf:{Tide:2,Stone:2,Fire:.5,Gale:.5,Leaf:.5,Metal:.5},
 Volt:{Tide:2,Gale:2,Leaf:.5,Volt:.5,Stone:0},
 Stone:{Fire:2,Gale:2,Frost:2,Metal:.5},
 Gale:{Leaf:2,Mind:2,Volt:.5,Stone:.5,Metal:.5},
 Frost:{Leaf:2,Gale:2,Fire:.5,Tide:.5,Metal:.5,Frost:.5},
 Dark:{Mind:2,Dark:2,Metal:.5,Normal:0,Light:.5},
 Light:{Dark:2,Frost:2,Fire:.5,Metal:.5,Light:.5},
 Mind:{Normal:2,Stone:2,Metal:.5,Mind:.5,Dark:.5},
 Metal:{Frost:2,Stone:2,Fire:.5,Tide:.5,Volt:.5,Metal:.5},
 Echo:{Dark:2,Mind:2,Stone:.5,Metal:.5,Echo:.5}
};
CHART.Gale.Echo=2;CHART.Metal.Echo=2;CHART.Mind.Echo=.5;CHART.Normal.Echo=.5;
function eff(at,defTypes){let m=1;for(const d of defTypes){const v=CHART[at][d];if(v!==undefined)m*=v;}return m;}
// moves: name:[type,power,acc,cat(p/s/x),effect]
const MOVES={};
const MT={
 Normal:[['Tackle',40],['Quick Jab',45],['Body Slam',85,'para'],['Hyper Rush',110]],
 Fire:[['Spark Flick',40,'burn'],['Fire Fang',65,'burn'],['Blaze Wave',90,'burn'],['Sunfire',120]],
 Tide:[['Splash Shot',40],['Aqua Lunge',65],['Tidal Crash',90],['Maelstrom',120]],
 Leaf:[['Leaf Nip',40],['Sap Drain',60,'drain'],['Thorn Whip',85],['Verdant Storm',120]],
 Volt:[['Static Zap',40,'para'],['Volt Bite',65,'para'],['Thunder Lance',90],['Skybolt',120]],
 Stone:[['Pebble Toss',40],['Rock Slide',70],['Quake Stomp',95],['Meteor Fall',120]],
 Gale:[['Gust',40],['Wing Slice',65],['Cyclone',90],['Tempest',120]],
 Frost:[['Chill Breath',40],['Ice Fang',65],['Frost Beam',90],['Glacier Crash',120]],
 Dark:[['Shadow Claw',50],['Night Wisp',65],['Hex Pulse',90],['Umbral Void',120]],
 Mind:[['Mind Poke',40],['Psy Beam',65],['Mind Crush',90],['Psionic Nova',120]],
 Light:[['Glimmer',40],['Halo Strike',65],['Radiant Beam',90],['Heaven\'s Judgment',120]],
 Echo:[['Hum',40],['Resonance',65],['Chorus Wave',90],['First Word',120]],
 Metal:[['Iron Tap',40],['Steel Rake',70],['Gear Grind',90],['Titan Press',120]]
};
const PHYS=new Set(['Tackle','Quick Jab','Body Slam','Hyper Rush','Fire Fang','Aqua Lunge','Leaf Nip','Thorn Whip','Volt Bite','Pebble Toss','Rock Slide','Quake Stomp','Meteor Fall','Wing Slice','Ice Fang','Glacier Crash','Shadow Claw','Iron Tap','Steel Rake','Gear Grind','Titan Press','Halo Strike']);
for(const t in MT)for(const [n,p,e] of MT[t])MOVES[n]={type:t,pow:p,acc:p>=120?80:p>=90?90:100,cat:PHYS.has(n)?'p':'s',eff:e||null};
const STATUSMOVES={Normal:'Growl',Fire:'Heat Haze',Tide:'Soak',Leaf:'Toxic Spores',Volt:'Thunder Wave',Stone:'Harden',Gale:'Tailwind',Frost:'Harden',Dark:'Lullaby',Mind:'Focus',Metal:'Harden',Light:'Focus',Echo:'Focus'};
Object.assign(MOVES,{
 'Growl':{type:'Normal',pow:0,acc:100,cat:'x',eff:'atk-'},
 'Heat Haze':{type:'Fire',pow:0,acc:85,cat:'x',eff:'burnS'},
 'Soak':{type:'Tide',pow:0,acc:100,cat:'x',eff:'spe-'},
 'Toxic Spores':{type:'Leaf',pow:0,acc:85,cat:'x',eff:'poisonS'},
 'Thunder Wave':{type:'Volt',pow:0,acc:90,cat:'x',eff:'paraS'},
 'Harden':{type:'Normal',pow:0,acc:100,cat:'x',eff:'def+'},
 'Tailwind':{type:'Gale',pow:0,acc:100,cat:'x',eff:'spe+'},
 'Lullaby':{type:'Dark',pow:0,acc:65,cat:'x',eff:'sleepS'},
 'Focus':{type:'Mind',pow:0,acc:100,cat:'x',eff:'spa+'},
 'Crimson Edge':{type:'Fire',pow:100,acc:95,cat:'p',eff:'burn'},'Abyss Night':{type:'Dark',pow:100,acc:95,cat:'s',eff:null},
 'Heaven\'s Lance':{type:'Light',pow:100,acc:95,cat:'p',eff:null},'Seraph Wings':{type:'Gale',pow:90,acc:100,cat:'s',eff:null},
 'Word of Making':{type:'Echo',pow:110,acc:95,cat:'s',eff:null},'Eighth Seal':{type:'Light',pow:100,acc:95,cat:'p',eff:'para'},'Seal Toll':{type:'Echo',pow:95,acc:100,cat:'p',eff:null},'Undertow Dirge':{type:'Dark',pow:95,acc:100,cat:'s',eff:null},'Dawnwing':{type:'Light',pow:95,acc:100,cat:'s',eff:null},
 'Tempest Tide':{type:'Tide',pow:100,acc:95,cat:'s',eff:null},'Skysea Spiral':{type:'Gale',pow:100,acc:95,cat:'p',eff:'para'}
});
const ABIL={Normal:'Steadfast',Fire:'Kindling Heart',Tide:'Riptide Skin',Leaf:'Photosynth',Volt:'Static Fur',Stone:'Bedrock',Gale:'Updraft',Frost:'Rimecoat',Dark:'Umbral Veil',Mind:'Foresight',Metal:'Alloy Plating',Light:'Halo',Echo:'Resound'};
// species: name|types|hp,atk,def,spa,spd,spe|evoLv>evoTo|catch|height m|weight kg|habitat|lore
const SPRAW=`Cindle|Fire|39,52,43,60,50,65|16>Pyrrix|45|0.5|7|Volcanic foothills|A spark-tailed pup that sleeps curled around its own warm tail. Its flame flickers blue when it is happy.
Pyrrix|Fire|58,64,58,80,65,80|34>Blazewyrm|45|1.1|19|Volcanic foothills|Its mane of embers grows denser as it wins battles. It patrols lava vents at dusk.
Blazewyrm|Fire,Gale|78,84,78,109,85,100||45|1.7|90|Volcanic peaks|A winged serpent whose breath melts stone. Legends say it guided early smiths to the first forges.
Drizzlet|Tide|44,48,65,50,64,43|16>Torrentail|45|0.5|9|Freshwater ponds|It stores rain in its round cheeks and sprays curious children for fun.
Torrentail|Tide|59,63,80,65,80,58|34>Abyssault|45|1.0|22|Rivers and lakes|Its whip-like tail can split river stones with a single crack of water.
Abyssault|Tide,Metal|79,83,100,85,105,78||45|1.6|85|Deep lakes|Armored by mineral scales from the lakebed, it guards sunken ruins.
Sprigling|Leaf|45,49,49,65,65,45|16>Thornback|45|0.4|6|Forest clearings|A sprout-headed sprite that bobs in sunlight. Its leaf droops when it is lonely.
Thornback|Leaf|60,62,63,80,80,60|34>Grovegiant|45|1.0|30|Old forests|Thorns along its spine release a calming scent that settles frightened animals.
Grovegiant|Leaf,Stone|80,82,83,100,100,80||45|2.0|155|Ancient groves|A walking hillside of moss and root. Villages once planted orchards in its footprints.
Fluffin|Normal|50,45,40,35,40,55|18>Puffalo|190|0.3|3|Meadows|A cotton-ball creature that floats on warm breezes. Flocks of them signal good weather.
Puffalo|Normal|85,80,70,50,60,70||75|1.4|110|Grasslands|Its fluffy coat hides solid muscle; herds shake the ground when they stampede.
Zappip|Volt|35,50,30,60,40,85|20>Voltusk|190|0.3|2|Power lines and fields|It nibbles on static from fur and sweaters. Rubbing it is a shocking experience.
Voltusk|Volt|65,90,60,95,70,110||75|1.2|40|Stormy plains|Twin tusks crackle with lightning; it charges them by running into storms.
Pebblit|Stone|40,70,90,30,30,20|20>Boulderon|190|0.4|20|Caves and cliffs|It disguises itself as a pebble on paths. Hikers often trip over sleeping Pebblit.
Boulderon|Stone|60,95,110,40,45,30|36>Montitan|90|1.0|105|Caves|It rolls down mountainsides to travel, leaving grooves that become streams.
Montitan|Stone,Metal|85,120,130,55,65,40||45|1.8|300|Mountain cores|Veins of ore glitter across its body. It sleeps for decades inside mountains.
Breezel|Gale|40,45,35,40,35,70|18>Galeon|190|0.3|2|Windy hills|A tiny bird that rides gusts for hours without flapping once.
Galeon|Gale|70,80,65,70,65,105||75|1.3|30|Cliffs and peaks|Its cry can be heard across valleys; it dives faster than falling hail.
Frostfin|Frost|45,40,50,55,60,40|28>Rimewhale|190|0.6|12|Cold waters|A fish that freezes the water around it into a protective shell at night.
Rimewhale|Frost,Tide|100,75,85,85,90,45||60|3.0|400|Icy seas|It sings ancient songs; icebergs are said to form where it breathes.
Gloomote|Dark|40,45,40,55,45,60|25>Umbrawl|190|0.4|4|Ruins at night|A shadow mote that steals small trinkets and hides them in moonlit corners.
Umbrawl|Dark|65,85,65,90,70,90||75|1.5|45|Abandoned towns|It walks inside other creatures' shadows to sneak up on prey.
Psyfly|Mind,Gale|35,30,35,60,55,70|24>Mindmoth|190|0.2|1|Flower fields|Its wing patterns hypnotise predators into forgetting what they were doing.
Mindmoth|Mind,Gale|70,50,60,100,90,90||75|1.3|20|Moonlit meadows|Its scales glow with dreams it has gathered from sleeping villagers.
Boltnut|Metal,Volt|40,50,60,45,40,40|28>Gearhorn|190|0.3|11|Factories and scrapyards|A screw-shaped creature that spins into machines to feed on their current.
Gearhorn|Metal,Volt|70,95,100,80,70,55||75|1.6|140|Old mines|The gears on its horn turn faster when angry, building a crushing charge.
Mossnail|Leaf,Stone|50,40,70,40,60,20|22>Shellgrove|190|0.3|5|Damp forests|Moss on its shell is so lush that tiny flowers bloom on it in spring.
Shellgrove|Leaf,Stone|85,70,110,70,90,25||75|1.1|80|Forest floors|Birds nest in the garden growing on its shell; it moves gently so as not to disturb them.
Emberat|Fire|40,55,35,45,35,70|22>Scorchrat|190|0.3|3|Volcanic vents|A rodent with a coal-hot nose that it uses to toast seeds.
Scorchrat|Fire|65,85,60,70,55,95||75|0.8|18|Lava fields|It digs tunnels through cooled lava and smells of smoke.
Pondhop|Tide,Leaf|45,45,45,50,50,55|20>Lilyleap|190|0.3|3|Ponds|It wears a lily pad like a hat and hops between them all day.
Lilyleap|Tide,Leaf|75,70,70,85,85,80||75|1.1|28|Marshes|It conducts frog-choir concerts on summer nights.
Duskowl|Dark,Gale|70,65,60,85,75,85||60|0.9|15|Dark woods|A silent owl whose eyes see only in darkness. It hoots at every new moon.
Ironmite|Metal|45,60,70,30,40,40|30>Ferrobeast|190|0.3|15|Mines|It eats iron filings and grows a new layer of plating each year.
Ferrobeast|Metal|80,105,115,45,70,55||75|1.4|250|Deep mines|Its steel hide rings like a bell when struck.
Snowpup|Frost|45,50,45,45,45,60|26>Blizzhound|190|0.5|8|Snowfields|It loves to roll in fresh snow and leaves angel-shaped imprints.
Blizzhound|Frost|75,95,70,80,70,100||75|1.3|50|Mountain passes|It guides lost travelers down mountains, howling to call search parties.
Solaryx|Fire,Mind|100,100,100,130,110,100||10|3.2|210|Heart of the Ember Caverns|Herald of Mancaco. The Dawn Beast. It is said that the sun rose for the first time when Solaryx opened its eyes.
Tidemaw|Tide,Dark|105,120,100,100,100,95||10|5.0|680|Mirrorlake Isle|Herald of Mantermo's seas. It sleeps beneath the island and its dreams form the lake's tides.
Aurorath|Frost,Gale|95,85,100,120,125,110||10|3.4|160|Frostpeak Summit|Herald of Mantermo's winds. Auroras are the shed light of its feathers drifting across the north.
Mandara|Dark,Fire|110,135,95,130,95,110||5|2.1|88|Crimsonspire Castle|The Crimson Sovereign, Keeper of the Hearth. Crimson skin, hair black as smoke, a blade that glows like a forge. She lit the first fire and drew the night across the sky so all things could be warm and rest. A pure summoning brings her blessing; the Monk's Deep Rite twisted her into ruin.
Mancaco|Light,Gale|105,120,100,135,110,105||5|2.2|82|Celestine Citadel, Frostpeak Summit|The Radiant Mother, Creator of Light and Heaven. Pale gold skin, eyes burning blue. She drove her spear upward and split the Deep; the top half became the heavens, and she set the sun, moon and stars in them.
Mantermo|Tide,Gale|115,115,105,125,115,100||5|2.1|90|Skysea Temple, Mirrorlake Isle|Creator of Water and Air. Her hair moves like a tide and her voice sounds like wind. She calmed the lower Deep into seas, rivers and rain, then breathed across it to make the sky. Sailors pray to her before leaving port.
Brambit|Leaf|42,52,40,40,40,62|20>Thornhare|190|0.4|5|Brightwater meadows|A burr-eared rabbit that plants seeds wherever it hops. Fields it crosses bloom a week later.
Thornhare|Leaf|68,88,62,60,62,98||75|1.1|28|Hedgerows and orchards|It drums its bramble-feet to warn the warren. Brightwater farmers leave it the first apple of each tree.
Mosslamb|Leaf,Normal|55,45,55,45,55,40|24>Woolgrove|190|0.6|14|Grassy downs|Its fleece is a living carpet of moss. Sleeping on one is said to cure bad dreams.
Woolgrove|Leaf,Normal|95,75,90,70,85,45||75|1.4|120|Ancient downs|A whole meadow rides on its back. Shepherds swear it remembers the first spring.
Kilnpup|Fire|40,55,40,45,40,60|18>Forgehound|190|0.5|9|Kilnmouth kilns|A soot-nosed puppy that naps inside cooling kilns and wakes up toasty and cheerful.
Forgehound|Fire|62,80,60,62,58,78|38>Magmastiff|90|1.0|36|Volcanic flats|Its bark rings like a hammer on an anvil. Smiths borrow it to judge if a blade is true.
Magmastiff|Fire,Stone|90,115,95,75,80,80||45|1.7|160|Caldera rims|Cracks of magma glow along its stony hide. It guards the kilns of Kilnmouth through the night.
Shalecrab|Stone,Tide|45,65,85,30,40,30|30>Cliffclaw|190|0.4|18|Rocky tide pools|It wears a slab of shale as a shell and swaps it for a bigger one each spring tide.
Cliffclaw|Stone,Tide|75,105,125,45,65,40||75|1.5|190|Sea cliffs|Its pincers can pry a boulder out of a cliff face. Colonies sound like rockfalls when they quarrel.
Pebbuzz|Stone,Gale|50,70,80,40,50,75||120|0.4|12|Windy ridges|A hovering pebble with whirring wing-flakes. Swarms of them hum across the Stormwatch ridges.
Saltkit|Tide|42,48,42,55,50,60|26>Brinefox|190|0.5|7|Saltmere shores|A kit that licks salt crystals off driftwood. Its tail leaves sparkling trails in the surf.
Brinefox|Tide|70,72,65,92,80,95||75|1.1|26|Salt marshes|It wraps itself in sea-mist to vanish. Saltmere sailors call a foggy dawn a "fox morning".
Coralume|Tide,Light|45,35,50,60,65,45|34>Reefseraph|190|0.4|4|Glowing reefs|A coral sprite that glows at night so lost fish can find home.
Reefseraph|Tide,Light|85,60,85,110,110,75||45|1.6|40|Deep reefs|Its six coral wings shine like stained glass under the sea. Old Calling texts call it "the light that listens".
Sparrook|Volt,Gale|38,50,35,55,40,80|30>Stormcrest|190|0.3|2|Stormwatch cliffs|A sparrow with a static crest that sparks whenever it chirps.
Stormcrest|Volt,Gale|72,85,65,100,70,115||45|1.4|30|Thunderheads|It nests inside storm clouds. A single feather can light a village lamp for a year.
Joltail|Volt|40,55,35,50,35,75|24>Arcoyote|190|0.5|8|Open plains|A pup whose tail crackles like a fuse when it is excited.
Arcoyote|Volt|70,90,60,85,60,105||75|1.2|30|Storm plains|It howls at lightning and the lightning answers. Packs run along the Stormwatch power-stones.
Hushmouse|Echo|40,40,40,55,50,65|22>Bellwhisker|190|0.2|2|Quiet ruins|A tiny mouse that copies every sound it hears. It is silent only near the old seals.
Bellwhisker|Echo|70,65,65,90,85,90||75|0.8|14|Bell towers|Its whiskers ring like small bells. Temple bells in Elderreach were tuned by its song.
Glyphling|Echo,Mind|45,35,45,70,60,55|32>Runesage|190|0.4|3|Carved stones|A living letter that peeled itself off an ancient wall. It is trying to remember which word it belonged to.
Runesage|Echo,Mind|75,55,70,115,100,80||45|1.5|30|Ruins of the First Word|A towering script-spirit. Scholars believe it is one syllable of the name that must not be written.
Snowmote|Frost,Mind|40,35,45,60,60,55|34>Auroracle|190|0.3|1|Hushpeak snowfields|A drifting snowflake with one sleepy eye. It falls slower than any other snow.
Auroracle|Frost,Mind|75,55,75,110,110,90||45|1.6|20|High glaciers|Its aurora-veil shows glimpses of other worlds. Gazing too long makes travellers homesick for places they never visited.
Veilkit|Dark,Echo|45,55,40,55,40,70|30>Hollowfox|190|0.4|6|Vesperdeep twilight|A shadow kit that speaks in other creatures' voices to lure them close.
Hollowfox|Dark,Echo|72,95,62,90,65,105||45|1.3|30|Moonless woods|It has no echo of its own. The Hollow Choir keep them as sentinels.
Lanternewt|Fire,Light|42,45,45,60,55,55|28>Wickwyrm|190|0.4|3|Temple gardens|A newt whose tail-tip burns like a candle. Pilgrims follow it through dark caves.
Wickwyrm|Fire,Light|78,75,72,105,90,85||45|1.8|45|Shrine caves|A serpent with a hundred candle-scales. It keeps the three flames of forgotten altars lit.
Starseed|Light,Leaf|45,40,50,55,60,45|30>Cosmoss|190|0.3|2|Night meadows|A seed that fell from the night sky. It sprouts only when someone makes a wish.
Cosmoss|Light,Leaf|85,65,85,100,100,60||45|1.5|60|Starlit clearings|Its moss glows with constellations no astronomer has charted - possibly the sky of another world.
Cogwisp|Metal,Echo|55,70,85,70,70,55||120|0.6|20|Old clockworks|A floating gear that ticks out messages in a forgotten code. It always points toward the Sanctum.
Driftjelly|Tide,Mind|45,35,40,60,70,40|28>Nebulune|190|0.5|3|Calm bays|A jelly that floats from sea to sky on still nights.
Nebulune|Tide,Mind|80,50,70,100,115,65||45|2.0|50|Night sky over the sea|It drifts high above the waves at night, and its body holds a small swirl of stars.
Octavel|Metal,Echo|100,120,130,90,110,70||8|3.0|400|The Seal Vault, Ninefold Caverns|Warden of the eighth seal. An armoured bell-colossus whose eight rings toll once for each world the One has made. It has rung without pause since the knowers arrived.
Hollowmere|Tide,Dark|110,110,100,115,100,85||8|6.0|700|Hollowmere Shrine, Stillwater Lake|The Deep itself, given shape. It rises when the stillness between worlds is disturbed. It is not cruel. It simply remembers being everything.
Lumenwing|Light,Gale|95,95,90,125,110,115||8|3.6|120|Lumenspire, Hushpeak Heights|Herald of the One. A great bird of white flame that appears only to those who have heard the Calling.
Legranta|Echo,Light|130,130,120,140,120,110||3|30.0|0|The Eighth Door Sanctum|The One above the Three, whom scripture called maker of all worlds. In truth he is a devourer: he made trillions of worlds without meaning to, each holding a piece of his energy, and now he takes it back by eating them. This world holds more of him than any other. Only ten names spoken in welcome, and a world that gives its light freely, could ever hold him back. His daughters banished him from this reality and hid this world again.`;
const SPECIES={};const SPLIST=[];
SPRAW.split('\n').forEach((l,i)=>{const p=l.split('|');const s={id:i+1,name:p[0],types:p[1].split(','),base:p[2].split(',').map(Number),catch:+p[4],h:p[5],w:p[6],habitat:p[7],lore:p[8]};
 if(p[3]){const [lv,to]=p[3].split('>');s.evo={lv:+lv,to};}
 s.ability=ABIL[s.types[0]];s.legend=s.catch<=10;s.creator=s.catch<=5;SPECIES[s.name]=s;SPLIST.push(s);});
const FOOTNOTES={Legranta:'Silent Book 3:2 - "Write it once in your life, then burn the page. A name written too often becomes a summoning."',Octavel:'Calling footnote: "Seven seals were given to the Three to keep. The eighth he kept himself."',Runesage:'Footnote: it hums one syllable over and over. Every knower who hears it flinches.',Lumenwing:'Footnote: it is said to have carried the three words down into the Deep.',Hollowmere:'Silent Book 1:3 - "Between the worlds he left a stillness, and that stillness was the Deep."',Solaryx:'Temple footnote: "Even the dawn answers to a sunrise older than itself."',Tidemaw:'Fisher\'s footnote: it is said to sleep facing upward, as if waiting to be called.',Aurorath:'Shrine footnote: its aurora sometimes forms a fourth band that no instrument can record.',Mandara:'Scholar\'s footnote: "For a thing does not rise unless it is called." Who called the Three?',Mancaco:'Scholar\'s footnote: Mancaco\'s spear split the Deep - yet the oldest murals show her looking up, not down.',Mantermo:'Scholar\'s footnote: her breath became the sky. Whose breath became the Deep?',Gloomote:'Footnote: Gloomote hoard only shiny things... except near the sealed door in Duskhollow, where they leave offerings.',Mindmoth:'Footnote: villagers who dream with Mindmoth nearby sometimes speak of "the one above" on waking.'};
for(const s of SPLIST){if(s.evo)SPECIES[s.evo.to].pre=s.name;}
for(const s of SPLIST){
 const t1=s.types[0],t2=s.types[1];const L=[[1,'Tackle'],[1,MT[t1][0][0]],[5,'Growl'],[10,MT[t1][1][0]],[19,STATUSMOVES[t1]],[26,MT[t1][2][0]],[42,MT[t1][3][0]]];
 if(t2){L.push([14,MT[t2][0][0]],[32,MT[t2][1][0]],[50,MT[t2][2][0]]);}
 if(t1==='Normal'){L.splice(0,2,[1,'Tackle'],[3,'Quick Jab']);}
 if(s.name==='Mandara')L.push([45,'Crimson Edge'],[55,'Abyss Night']);if(s.name==='Mancaco')L.push([45,'Heaven\'s Lance'],[55,'Seraph Wings']);if(s.name==='Mantermo')L.push([45,'Tempest Tide'],[55,'Skysea Spiral']);if(s.name==='Legranta')L.push([45,'Word of Making'],[55,'Eighth Seal']);if(s.name==='Octavel')L.push([40,'Seal Toll']);if(s.name==='Hollowmere')L.push([40,'Undertow Dirge']);if(s.name==='Lumenwing')L.push([40,'Dawnwing']);
 s.learn=L.filter((v,i,a)=>a.findIndex(x=>x[1]===v[1])===i).sort((a,b)=>a[0]-b[0]);
}
function evoLine(n){let r=n;while(SPECIES[r].pre)r=SPECIES[r].pre;const out=[r];while(SPECIES[out[out.length-1]].evo)out.push(SPECIES[out[out.length-1]].evo.to);return out;}

const ITEMS={
 'Potion':{price:200,desc:'Restores 20 HP.',heal:20},
 'Wildflower Posy':{price:120,desc:'A gift: bright Mossgrove wildflowers.',gift:1},
 'Ember Charm':{price:220,desc:'A gift: a warm glass charm from Cinderbrook.',gift:1},
 'Sea Glass':{price:150,desc:'A gift: smooth sea glass from the island coves.',gift:1},
 'Spiced Tea':{price:140,desc:'A gift: Galecrest wind-dried spiced tea.',gift:1},
 'Frost Lily':{price:260,desc:'A gift: a lily that never thaws, from Frostpeak.',gift:1},
 'Star Candle':{price:240,desc:'A gift: a Duskhollow candle that burns blue.',gift:1},
 'Honey Bread':{price:100,desc:'A gift: Ilsa\'s famous honey bread.',gift:1},
 'Old Coin':{price:300,desc:'A gift: an ancient coin from the ruins.',gift:1},
 'Kiln Glass':{price:200,desc:'A gift: a swirl of Kilnmouth glass.',gift:1},
 'Salt Pearl':{price:260,desc:'A gift: a pearl from the Saltmere beds.',gift:1},
 'Storm Bell':{price:220,desc:'A gift: a tiny bell from Stormwatch that rings before a storm.',gift:1},
 'Hush Candle':{price:240,desc:'A gift: a white Hushpeak candle that burns without sound.',gift:1},
 'Silent Page':{price:300,desc:'A gift: a blank page from Vesperdeep. Calling folk treasure them.',gift:1},
 'Bramble Jam':{price:120,desc:'A gift: Brightwater bramble jam.',gift:1},
 'Super Potion':{price:600,desc:'Restores 60 HP.',heal:60},
 'Max Potion':{price:1500,desc:'Fully restores HP.',heal:9999},
 'Revive':{price:1500,desc:'Revives a fainted monster to half HP.',revive:true},
 'Full Heal':{price:400,desc:'Cures any status condition.',cure:true},
 'Snare Orb':{price:200,desc:'Basic capture orb.',ball:1},
 'Great Orb':{price:600,desc:'Better capture orb (1.5x).',ball:1.5},
 'Ultra Orb':{price:1200,desc:'High-grade capture orb (2x).',ball:2},
 'Dawn Orb':{price:0,desc:'Captures any monster without fail.',ball:255},
 'Rare Candy':{price:0,desc:'Raises a monster by one level.',candy:true}
};

// ===== World layout: Elderreach (Monster Wilds II) =====
const TOWNS=[
 {id:0,name:'Brightwater',x:30,y:150,type:'Leaf',desc:'A meadow village of brambles and millstreams on the south-west shore. You woke on the beach below it.'},
 {id:1,name:'Kilnmouth',x:100,y:164,type:'Stone',desc:'A town of potters and glassblowers built around ancient kilns at the foot of the Ashcone.'},
 {id:2,name:'Saltmere',x:176,y:168,type:'Tide',desc:'A salt-harbour on the south-east coast with pearl beds, a long pier and the Reach lighthouse.'},
 {id:3,name:'Stormwatch',x:216,y:92,type:'Volt',desc:'A cliff town of lightning-rods and bell towers that watches the eastern storms.'},
 {id:4,name:'Hushpeak',x:164,y:22,type:'Mind',desc:'A silent mountain town where speaking above a whisper is considered rude.'},
 {id:5,name:'Vesperdeep',x:30,y:66,type:'Echo',desc:'A twilight town of bell-ruins where the Hollow Choir sings by night.'}
];
const TW=20,TH=14; // town size
const GYMS=[
 {town:0,leader:'Bryony',type:'Leaf',medal:'Bramble Medal',party:[['Brambit',13],['Mosslamb',14],['Thornhare',16]],theme:'A glasshouse maze of bramble hedges.'},
 {town:1,leader:'Dorrek',type:'Stone',medal:'Kiln Medal',party:[['Shalecrab',19],['Pebbuzz',20],['Boulderon',21],['Magmastiff',22]],theme:'A kiln-hall of clay pillars and glowing glass.'},
 {town:2,leader:'Corvina',type:'Tide',medal:'Pearl Medal',party:[['Saltkit',25],['Driftjelly',26],['Brinefox',27],['Reefseraph',28]],theme:'A flooded pearl-cave arena.'},
 {town:3,leader:'Zephra',type:'Volt',medal:'Tempest Medal',party:[['Joltail',31],['Sparrook',31],['Arcoyote',33],['Stormcrest',34]],theme:'A bell tower struck by lightning every hour.'},
 {town:4,leader:'Seraphine',type:'Mind',medal:'Hush Medal',party:[['Snowmote',37],['Psyfly',37],['Mindmoth',38],['Nebulune',39],['Auroracle',40]],theme:'A silent hall of floating snow.'},
 {town:5,leader:'Cantor Vale',type:'Echo',medal:'Echo Medal',party:[['Bellwhisker',43],['Cogwisp',43],['Hollowfox',44],['Runesage',45],['Bellwhisker',46]],theme:'A ruined bell-cathedral where every footstep echoes eight times.'}
];
const ELITE=[
 {name:'Ignatia',title:'Elite of Flame',party:[['Wickwyrm',50],['Scorchrat',50],['Magmastiff',51],['Blazewyrm',52]]},
 {name:'Halde',title:'Elite of Frost',party:[['Blizzhound',50],['Rimewhale',51],['Auroracle',51],['Frostfin',50]]},
 {name:'Ferrum',title:'Elite of Iron',party:[['Gearhorn',51],['Cogwisp',51],['Ferrobeast',52],['Montitan',53]]},
 {name:'Nyx',title:'Elite of Night',party:[['Hollowfox',52],['Umbrawl',52],['Duskowl',53],['Mindmoth',53]]},
 {name:'Orrin',title:'Champion of the Concord',party:[['Woolgrove',55],['Stormcrest',56],['Cliffclaw',56],['Reefseraph',57],['Cosmoss',57],['Runesage',58]]}
];
// encounter zones
const ZONES={
 r1:{name:'Route 1 - Bramblewalk',lv:[9,13],sp:['Brambit','Mosslamb','Starseed','Joltail','Fluffin']},
 r2:{name:'Route 2 - Kiln Road',lv:[15,20],sp:['Kilnpup','Shalecrab','Lanternewt','Saltkit','Emberat']},
 r3:{name:'Route 3 - Pearl Climb',lv:[21,27],sp:['Saltkit','Coralume','Driftjelly','Sparrook','Shalecrab']},
 r4:{name:'Route 4 - Bellstorm Pass',lv:[28,34],sp:['Sparrook','Joltail','Pebbuzz','Snowmote','Cogwisp']},
 cave:{name:'Ninefold Caverns',lv:[32,38],sp:['Hushmouse','Glyphling','Cogwisp','Ironmite','Boulderon']},
 forest:{name:'Brightwater Wilds',lv:[8,13],sp:['Brambit','Mosslamb','Starseed','Sprigling','Psyfly']},
 shore:{name:'Saltmere Coast & Stillwater',lv:[18,25],sp:['Saltkit','Coralume','Driftjelly','Shalecrab','Pondhop']},
 slopes:{name:'Ashcone Flats',lv:[16,22],sp:['Kilnpup','Lanternewt','Emberat','Pebbuzz']},
 bluffs:{name:'Stormwatch Heath',lv:[26,32],sp:['Joltail','Sparrook','Pebbuzz','Breezel','Zappip']},
 heights:{name:'Hushpeak Snowfields',lv:[32,38],sp:['Snowmote','Snowpup','Driftjelly','Cogwisp','Frostfin']},
 duskwild:{name:'Vesper Moors',lv:[36,42],sp:['Veilkit','Hushmouse','Glyphling','Gloomote','Duskowl']},
 r6:{name:'Route 6 - The Concord Road',lv:[42,48],sp:['Hollowfox','Runesage','Forgehound','Arcoyote','Bellwhisker','Wickwyrm']}
};
