// ===== Monster Wilds: engine =====
'use strict';
const VW=320,VH=240,TS=16,SAVE_KEY='monsterwilds2_save_v1',G1_SAVE_KEY='monsterwilds_save_v1';
const C=document.getElementById('game'),X=C.getContext('2d');
X.imageSmoothingEnabled=false;
let S=null; // persistent state
const G={mode:'title',mv:null,held:new Set(),frame:0,busy:false,lastAuto:0,toast:null,toastT:0,zoneShown:null};
window.G=G;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function fmt(t){return S?String(t).replace(/@NAME/g,S.name).replace(/@RIVAL/g,S.rival):t;}

// ===== Monsters =====
let UIDC=1;
function calcStats(sp,lv){const b=SPECIES[sp].base;const f=x=>Math.floor(2*x*lv/100)+5;return {hp:Math.floor(2*b[0]*lv/100)+lv+10,atk:f(b[1]),def:f(b[2]),spa:f(b[3]),spd:f(b[4]),spe:f(b[5])};}
function stats(m){return m.ov?Object.assign({},m.ov):calcStats(m.sp,m.lv);}
function ppOf(n){const p=MOVES[n].pow;return p>=120?5:p>=90?10:p===0?20:25;}
function setMovesForLevel(m){const L=SPECIES[m.sp].learn.filter(x=>x[0]<=m.lv).map(x=>x[1]);m.moves=L.slice(-4).map(n=>({n,pp:ppOf(n)}));}
function speciesForLevel(sp,lv){const line=evoLine(sp);let cur=line[0];while(SPECIES[cur].evo&&lv>=SPECIES[cur].evo.lv)cur=SPECIES[cur].evo.to;return cur;}
function mkMon(sp,lv,wild){const m={uid:(Date.now()%1e8)+'_'+(UIDC++)+'_'+ri(0,999),sp,lv,xp:lv**3,st:null,ov:null,moves:[]};setMovesForLevel(m);m.hp=stats(m).hp;return m;}
function mname(m){return m.nick||m.sp;}
function alive(p){return p.filter(m=>m.hp>0&&!m.weak);}
function healAll(){if(window.SFX&&S&&G.mode==='world')SFX.play('heal');for(const m of S.party.concat(S.box)){m.hp=stats(m).hp;m.st=null;m.moves.forEach(x=>x.pp=ppOf(x.n));}}
function markCaught(sp){S.seen[sp]=1;S.caught[sp]=1;}
function addMon(m){markCaught(m.sp);if(S.party.length<6){S.party.push(m);return 'party';}S.box.push(m);return 'box';}
// returns list of messages; handles level-ups & move learning; evolution done separately
function gainXP(m,amt){const msgs=[];if(m.lv>=100)return msgs;m.xp+=amt;msgs.push(mname(m)+' gained '+amt+' XP!');
 while(m.lv<100&&m.xp>=(m.lv+1)**3){const before=calcStats(m.sp,m.lv);m.lv++;const after=calcStats(m.sp,m.lv);
  if(m.ov){for(const k in m.ov)m.ov[k]+=Math.max(1,after[k]-before[k]);}
  m.hp+=Math.max(1,(m.ov?1:0)+after.hp-before.hp);m.hp=Math.min(m.hp,stats(m).hp);
  msgs.push(mname(m)+' grew to Lv '+m.lv+'!');if(window.SFX)SFX.play('level');
  for(const [l,n] of SPECIES[m.sp].learn)if(l===m.lv&&!m.moves.find(x=>x.n===n)){if(m.moves.length>=4){const old=m.moves.shift();msgs.push(mname(m)+' forgot '+old.n+'...');}m.moves.push({n,pp:ppOf(n)});msgs.push(mname(m)+' learned '+n+'!');}
 }return msgs;}
function checkEvo(m){const s=SPECIES[m.sp];if(s.evo&&m.lv>=s.evo.lv){const from=m.sp;const oldMax=stats(m).hp;m.sp=s.evo.to;if(!m.ov){m.hp+=stats(m).hp-oldMax;}markCaught(m.sp);
  for(const [l,n] of SPECIES[m.sp].learn)if(l<=m.lv&&!m.moves.find(x=>x.n===n)&&!SPECIES[from].learn.find(x=>x[1]===n)){if(m.moves.length>=4)m.moves.shift();m.moves.push({n,pp:ppOf(n)});}
  return from;}return null;}

// ===== Mandara artwork (bundled locally) =====
const ART={Mandara:{src:'assets/mandara.png',cut:true,pal:{skin:'#c02020',hair:'#101010',arm:'#1a1a1a',trim:'#d4a030',wep:'#ff3020',bg:['#200808','#601010'],crown:'horns'}},
 Mancaco:{src:'assets/mancaco.png',cut:true,pal:{skin:'#e8c878',hair:'#f8f0d0',arm:'#f4f4f8',trim:'#e8c040',wep:'#fff8a0',bg:['#fffaf0','#e0b040'],crown:'halo'}},
 Mantermo:{src:'assets/mantermo.png',cut:true,pal:{skin:'#5080c0',hair:'#103050',arm:'#183850',trim:'#40e0e0',wep:'#80f0ff',bg:['#082a48','#20a8b0'],crown:'fins'}},
 Legranta:{src:'assets/legranta.jpg',cut:false,crop:[380,0,520,720],pal:{skin:'#c8c0e8',hair:'#e8e8ff',arm:'#1a1840',trim:'#e0c060',wep:'#c0a0ff',bg:['#05030f','#2a1850'],crown:'halo'}}};
const HEAD={img:new Image(),ok:false,eyes:[[102,88],[124,81]]};HEAD.img.onload=()=>{HEAD.ok=true;};
// Severed-ear art hook: replace assets/legranta-earless.jpg / legranta-head-earless.png with final art.
function setEarless(){if(ART.Legranta.src.includes('earless'))return;ART.Legranta.src='assets/legranta-earless.jpg';const im=new Image();im.onload=()=>{ART.Legranta.img=im;ART.Legranta.ok=true;};im.src=ART.Legranta.src;const h=new Image();h.onload=()=>{HEAD.img=h;HEAD.ok=true;if(typeof SKYC!=='undefined')SKYC=null;};h.src='assets/legranta-head-earless.png';}HEAD.img.src='assets/legranta-head.png';
const MONIMG={};SPRAW.split('\n').forEach(l=>{const n=l.split('|')[0];if(!n||['Mandara','Mancaco','Mantermo','Legranta'].includes(n))return;const o={img:new Image(),ok:false};o.img.onload=()=>{o.ok=true;clearTimeout(MONIMG._t);MONIMG._t=setTimeout(()=>{document.querySelectorAll('.spr').forEach(e=>{e.innerHTML='';});if(typeof paintSprites==='function')paintSprites(document);},50);};o.img.onerror=()=>{o.ok=false;};o.img.src='assets/monsters/'+n.toLowerCase()+'.png';MONIMG[n]=o;});
function drawMonImg(ctx,sp,cx,cy,size,back){const o=MONIMG[sp];if(!o||!o.ok)return false;const im=o.img,b=size*1.35,r=b/Math.max(im.naturalWidth,im.naturalHeight),w=im.naturalWidth*r,h=im.naturalHeight*r;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(cx,cy+size*0.5-h);if(back)ctx.scale(-1,1);if(window.MFX&&!MFX.red()&&size>=24){const n=8,iw=im.naturalWidth,ih=im.naturalHeight,t=performance.now()/1000+(hash(sp)%50)/9;for(let i=0;i<n;i++){const dx=Math.sin(t*2.2+i*0.75)*w*0.014*(1-i/n);ctx.drawImage(im,0,ih*i/n,iw,ih/n+1,-w/2+dx,h*i/n,w,h/n+0.6);}}else ctx.drawImage(im,-w/2,0,w,h);ctx.restore();return true;}
for(const k in ART){const a=ART[k];a.img=new Image();a.ok=false;a.img.onload=()=>{a.ok=true;};a.img.onerror=()=>{a.ok=false;};a.img.src=a.src;}
const MIMG=ART.Mandara.img;
function artOk(sp){return ART[sp]&&ART[sp].ok&&ART[sp].img.naturalWidth>0;}
function drawWarrior(ctx,sp,cx,cy,size,withBg){const p=ART[sp].pal,k=size/100;ctx.save();ctx.translate(cx,cy);
 if(withBg){const g=ctx.createLinearGradient(0,-60*k,0,60*k);g.addColorStop(0,p.bg[0]);g.addColorStop(1,p.bg[1]);ctx.fillStyle=g;ctx.fillRect(-70*k,-62*k,140*k,124*k);}
 ctx.fillStyle=p.hair;ctx.beginPath();ctx.ellipse(-4*k,-28*k,16*k,30*k,0.2,0,7);ctx.fill();
 ctx.fillStyle=p.arm;ctx.fillRect(-14*k,20*k,10*k,34*k);ctx.fillRect(4*k,20*k,10*k,34*k);
 ctx.fillStyle=p.trim;ctx.fillRect(-14*k,30*k,10*k,3*k);ctx.fillRect(4*k,30*k,10*k,3*k);
 ctx.fillStyle=p.skin;ctx.fillRect(-12*k,-20*k,24*k,12*k);
 ctx.fillStyle=p.arm;ctx.beginPath();ctx.moveTo(-16*k,-22*k);ctx.lineTo(16*k,-22*k);ctx.lineTo(18*k,22*k);ctx.lineTo(-18*k,22*k);ctx.fill();
 ctx.strokeStyle=p.trim;ctx.lineWidth=2*k;ctx.stroke();ctx.beginPath();ctx.moveTo(0,-20*k);ctx.lineTo(0,20*k);ctx.stroke();
 ctx.fillStyle=p.trim;ctx.beginPath();ctx.arc(-18*k,-20*k,6*k,0,7);ctx.arc(18*k,-20*k,6*k,0,7);ctx.fill();
 ctx.fillStyle=p.skin;ctx.beginPath();ctx.arc(0,-34*k,9*k,0,7);ctx.fill();
 ctx.fillStyle='#ffd040';ctx.fillRect(-5*k,-36*k,3*k,2*k);ctx.fillRect(2*k,-36*k,3*k,2*k);
 ctx.strokeStyle=p.trim;ctx.lineWidth=2.5*k;
 if(p.crown==='horns'){ctx.beginPath();ctx.moveTo(-6*k,-42*k);ctx.quadraticCurveTo(-14*k,-50*k,-8*k,-56*k);ctx.moveTo(6*k,-42*k);ctx.quadraticCurveTo(14*k,-50*k,8*k,-56*k);ctx.stroke();}
 if(p.crown==='halo'){ctx.strokeStyle='#fff6b0';ctx.beginPath();ctx.ellipse(0,-50*k,12*k,4*k,0,0,7);ctx.stroke();}
 if(p.crown==='fins'){ctx.fillStyle=p.trim;ctx.beginPath();ctx.moveTo(-9*k,-38*k);ctx.lineTo(-18*k,-50*k);ctx.lineTo(-5*k,-44*k);ctx.moveTo(9*k,-38*k);ctx.lineTo(18*k,-50*k);ctx.lineTo(5*k,-44*k);ctx.fill();}
 ctx.shadowColor=p.wep;ctx.shadowBlur=12*k;ctx.strokeStyle=p.wep;ctx.lineWidth=4*k;ctx.beginPath();ctx.moveTo(24*k,10*k);ctx.lineTo(44*k,-50*k);ctx.stroke();ctx.shadowBlur=0;
 ctx.fillStyle=p.skin;ctx.beginPath();ctx.arc(22*k,12*k,4*k,0,7);ctx.fill();
 ctx.restore();}
function drawMandaraArt(ctx,cx,cy,size,sp){sp=sp||'Mandara';if(!artOk(sp)){drawWarrior(ctx,sp,cx,cy,size,false);return true;}const a=ART[sp],im=a.img;let [sx,sy,sw,sh]=a.crop||(a.cut?[0,0,im.naturalWidth,im.naturalHeight]:null)||[im.naturalWidth*0.28,0,im.naturalWidth*0.44,im.naturalHeight];if(window.SIS&&a.cut&&SIS.draw(ctx,sp,im,cx,cy,size,{flash:BT&&BT.ea&&BT.ea.flash&&BT.e&&BT.e.m.sp===sp?BT.ea.flash:0}))return true;const h=size*1.25,w=h*sw/sh;ctx.drawImage(im,sx,sy,sw,sh,cx-w/2,cy-h*0.62,w,h);return true;}
// 16x16 pixel overworld sprite of Mandara
function drawMandaraPix(px,py,sp){sp=sp||'Mandara';const q=ART[sp].pal;const MAP={'#101010':q.hair,'#e8c070':q.trim,'#c02020':q.skin,'#1a1a1a':q.arm,'#d4a030':q.trim,'#801010':q.bg[1]};const P=(c,x,y,w,h)=>{X.fillStyle=MAP[c]||c;X.fillRect(px+x,py+y,w,h);};
 P('rgba(0,0,0,.3)',2,14,12,2);P('#101010',3,2,10,9);// hair
 P('#e8c070',3,0,1,3);P('#e8c070',12,0,1,3);// horns
 P('#c02020',5,2,6,5);P('#ffd040',6,4,1,1);P('#ffd040',9,4,1,1);// face+eyes
 P('#1a1a1a',4,7,8,6);P('#d4a030',5,7,6,1);P('#d4a030',7,8,2,4);P('#d4a030',4,7,1,3);P('#d4a030',11,7,1,3);// armor
 P('#c02020',5,12,2,1);P('#c02020',9,12,2,1);P('#801010',3,10,1,4);P('#801010',12,10,1,4);// skin + cape
 P('#1a1a1a',5,13,2,3);P('#1a1a1a',9,13,2,3);
 const gl=(G.frame>>2)%2?q.wep:'#ffffff';P(gl,13,3,1,10);P('#ffb0a0',13,4,1,3);P('#d4a030',12,11,3,1);}
// ===== Monster sprite =====
function drawMon(ctx,sp,cx,cy,size,back,opt){if(ART[sp]&&window.SIS)return drawMon0(ctx,sp,cx,cy,size,back);const still=(opt&&opt.still)||!window.MFX||MFX.red();if(still)return drawMon0(ctx,sp,cx,cy,size,back);const I=MFX.idle(sp,size,opt&&opt.seed);const fy=cy+size*0.5;ctx.save();ctx.translate(cx,fy);ctx.rotate(I.rot);ctx.scale(I.sx,I.sy);ctx.translate(-cx,-fy);drawMon0(ctx,sp,cx,cy+I.dy,size,back);ctx.restore();if(!(opt&&opt.noAura))MFX.aura(ctx,sp,cx,cy+I.dy,size*0.9);}
function drawMon0(ctx,sp,cx,cy,size,back){if(ART[sp]&&drawMandaraArt(ctx,cx,cy,size,sp))return;if(drawMonImg(ctx,sp,cx,cy,size,back))return;const s=SPECIES[sp];const h=hash(sp);const c1=TCOL[s.types[0]],c2=TCOL[s.types[1]||s.types[0]];const stage=evoLine(sp).indexOf(sp);const k=size/40;
 ctx.save();ctx.translate(cx,cy);if(back)ctx.scale(-1,1);
 if(s.legend){ctx.fillStyle='rgba(255,240,150,0.25)';ctx.beginPath();ctx.arc(0,-4*k,30*k,0,7);ctx.fill();}
 ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(0,18*k,20*k,5*k,0,0,7);ctx.fill();
 const bw=(14+(h%7)+stage*2)*k,bh=(12+((h>>3)%6)+stage*2)*k;
 // tail
 ctx.fillStyle=c2;ctx.beginPath();ctx.moveTo(bw*.6,4*k);ctx.lineTo(bw+10*k,-((h>>5)%10)*k);ctx.lineTo(bw*.6,10*k);ctx.fill();
 // ears/horns/spikes
 const n=1+((h>>7)%3)+stage;ctx.fillStyle=c2;for(let i=0;i<n;i++){const a=-Math.PI/2+(i-(n-1)/2)*0.5;const x=Math.cos(a)*bw*.8,y=Math.sin(a)*bh*.9;ctx.beginPath();ctx.moveTo(x-4*k,y+2*k);ctx.lineTo(x+Math.cos(a)*9*k,y+Math.sin(a)*9*k-2*k);ctx.lineTo(x+4*k,y+2*k);ctx.fill();}
 // wings for Gale
 if(s.types.includes('Gale')){ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.ellipse(-bw*.2,-bh*.3,bw*.9,bh*.35,-0.6,0,7);ctx.fill();}
 // body
 ctx.fillStyle=c1;ctx.strokeStyle='#202020';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,bw,bh,0,0,7);ctx.fill();ctx.stroke();
 ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-bw*.2,bh*.35,bw*.5,bh*.35,0,0,7);ctx.fill();
 // feet
 ctx.fillStyle=c2;ctx.fillRect(-bw*.6,bh*.7,6*k,5*k);ctx.fillRect(bw*.3,bh*.7,6*k,5*k);
 // eyes
 const ey=-bh*.25,ex=bw*.35;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-ex,ey,3.6*k,0,7);ctx.arc(ex*.6,ey,3.6*k,0,7);ctx.fill();ctx.fillStyle=s.types.includes('Dark')?'#e02020':'#101010';ctx.beginPath();ctx.arc(-ex-1*k,ey,1.8*k,0,7);ctx.arc(ex*.6-1*k,ey,1.8*k,0,7);ctx.fill();
 // mouth
 ctx.strokeStyle='#202020';ctx.beginPath();ctx.arc(-bw*.15,bh*.1,3*k,0.2,Math.PI-0.2);ctx.stroke();
 ctx.restore();}
function monCanvas(sp,size,back){const c=document.createElement('canvas');const k=Math.max(2,Math.min(4,Math.ceil((window.devicePixelRatio||1)*2)));c.width=size*k;c.height=size*k;const x=c.getContext('2d');x.scale(k,k);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';drawMon0(x,sp,size/2,size/2,size*0.8,back);return c;}

// ===== Map helpers =====
function curMap(){return MAPS[S.map];}
function tileAt(map,x,y){const m=MAPS[map];if(x<0||y<0||x>=m.w||y>=m.h)return T.TREE;return m.t[y*m.w+x];}
function stage(){return S.flags.champ?7:S.medals.filter(Boolean).length;}
function medalCount(){return S.medals.filter(Boolean).length;}
function hour(){return Math.floor(S.time/60)%24;}
function minute(){return Math.floor(S.time)%60;}
function npcPlace(p){const h=hour();if(p.walk){const e0=p.sched.filter(s=>s[0]<=h).pop()||p.sched[p.sched.length-1];if(e0[1]==='world'){const W=p.walk,T0=TOWNS[p.town];const len=Math.abs(W.bx-W.ax)+Math.abs(W.by-W.ay);const ph=((S.time/1.6+hash(p.id)%97)%(2*len));const u=ph<len?ph:2*len-ph;const fx=W.ax+(W.bx-W.ax)*u/len,fy=W.ay+(W.by-W.ay)*u/len;let x=T0.x+Math.round(fx),y=T0.y+Math.round(fy);if(x===S.x&&y===S.y&&S.map==='world'){x=T0.x+Math.floor(fx);y=T0.y+Math.floor(fy);if(x===S.x&&y===S.y){x=T0.x+Math.ceil(fx);y=T0.y+Math.ceil(fy);}}const fwd=ph<len;const d=W.ax!==W.bx?((W.bx>W.ax)===fwd?'right':'left'):((W.by>W.ay)===fwd?'down':'up');return {map:'world',x,y,fx:T0.x+fx,fy:T0.y+fy,dir:d,moving:true};}}let e=p.sched[p.sched.length-1];for(const s of p.sched)if(s[0]<=h)e=s;
 let [_,map,x,y,w]=e;if(w&&MAPS[map]){const seq=[[0,0],[1,0],[0,0],[-1,0],[0,1],[0,0],[0,-1],[1,0]];const o=seq[(Math.floor(S.time/4)+hash(p.id))%seq.length];const nx=x+o[0],ny=y+o[1];if(!SOLID.has(tileAt(map,nx,ny))&&!(nx===S.x&&ny===S.y&&map===S.map)&&tileAt(map,nx,ny)!==T.DOOR&&tileAt(map,nx,ny)!==T.MAT&&tileAt(map,nx,ny-1)!==T.DOOR&&tileAt(map,nx,ny+1)!==T.MAT){x=nx;y=ny;}}
 return {map,x,y};}
function entities(){const out=[];const map=S.map;
 for(const p of PEOPLE){if(p.hidden&&!S.flags[p.hidden])continue;if(p.id==='osric'&&false)continue;const pl=npcPlace(p);if(pl.map===map)out.push({kind:'person',x:pl.x,y:pl.y,fx:pl.fx,fy:pl.fy,dir:pl.dir,moving:pl.moving,col:p.col,ref:p,name:p.name});}
 for(const t of TRAINERS){if(t.map!==map)continue;if(t.vanish&&S.beaten[t.id])continue;if(t.id==='rival1'&&!S.flags.starter)continue;out.push({kind:'trainer',x:t.x,y:t.y,col:t.col,ref:t,name:fmt(t.name)});}
 if(map==='world'){GATES.forEach((g,i)=>{if(!S.flags['gate'+i])out.push({kind:'gate',x:g.x,y:g.y,col:'#4060a0',ref:g,i,name:'Guard'});});
  QITEMS.forEach(q=>{if(!S.flags['has_'+q.id])out.push({kind:'item',x:q.x,y:q.y,ref:q,name:'?'});});}
 LEGENDS.forEach(l=>{if(l.map===map&&!S.flags['leg_'+l.sp])out.push({kind:'legend',x:l.x,y:l.y,ref:l,name:l.sp});});
 const m=curMap();
 if(m.type==='center')out.push({kind:'nurse',x:Math.floor(m.w/2),y:2,col:'#f080a0',name:'Nurse Joy'.replace('Joy','Mae')});
 if(m.type==='shop')out.push({kind:'clerk',x:Math.floor(m.w/2),y:2,col:'#4080f0',name:'Clerk'});
 return out;}
function entAt(x,y,ents){return (ents||entities()).find(e=>e.x===x&&e.y===y);}
function blocked(x,y){const t=tileAt(S.map,x,y);if(SOLID.has(t))return true;return !!entAt(x,y);}

// ===== Rendering =====
const TILECOL={0:'#78c850',1:'#48a038',2:'#78c850',3:'#d8c088',4:'#3890e0',5:'#e8d8a0',6:'#eef4ff',7:'#6a5a4c',8:'#3a3030',9:'#a07040',10:'#e8e0d0',11:'#c05038',12:'#e04848',13:'#4870d8',14:'#8048a8',15:'#704828',16:'#78c850',18:'#d8c8a8',19:'#806850',20:'#a07040',21:'#e8e8f0',22:'#b08050',23:'#606878',24:'#c03030',25:'#c8d8e8',26:'#e8a020',27:'#a0a0a8',28:'#b0e0f0',29:'#1a0c10',30:'#3a1418',31:'#e0b030',32:'#f0e8c0',33:'#f4f0e0',34:'#fff8e0',35:'#4888b0',36:'#806850',37:'#403040'};
function drawTile(t,x,y,wx,wy,m){const f=G.frame;X.fillStyle=TILECOL[t]||'#f0f';
 if(t===T.FLOOR&&m.type==='gym'){const tn=TOWNS[m.town];X.fillStyle=TCOL[tn.type];X.globalAlpha=0.5;X.fillRect(x,y,TS,TS);X.globalAlpha=1;X.fillStyle=((wx+wy)&1)?'rgba(255,255,255,.25)':'rgba(0,0,0,.08)';X.fillRect(x,y,TS,TS);return;}
 X.fillRect(x,y,TS,TS);
 switch(t){
 case T.GRASS:X.fillStyle='#68b840';if((wx*7+wy*3)%5===0)X.fillRect(x+4,y+6,2,2);break;
 case T.TALL:case T.SNOWTALL:X.fillStyle=t===T.TALL?'#2f7a28':'#90a8c0';for(let i=0;i<4;i++){X.fillRect(x+1+i*4,y+5+(i%2)*3,2,8);}break;
 case T.TREE:X.fillStyle=(wx<82&&wy<44&&wy>8&&wx>46)?'#3a3030':'#215a20';X.beginPath();X.arc(x+8,y+7,7,0,7);X.fill();X.fillStyle='#2e7a2a';X.beginPath();X.arc(x+6,y+5,3,0,7);X.fill();X.fillStyle='#6a4020';X.fillRect(x+7,y+12,2,4);if(wx>=80&&wy<44){X.fillStyle='#fff';X.fillRect(x+4,y+2,6,2);}break;
 case T.WATER:X.fillStyle='#68b0f0';X.fillRect(x+((f>>4)+wx)%12,y+5+(wy%2)*5,4,1);break;
 case T.ROCK:X.fillStyle='#54463e';X.fillRect(x+2,y+2,12,10);X.fillStyle='#2a2222';X.fillRect(x,y+12,TS,4);break;
 case T.CAVE:X.fillStyle='#5c4c40';if((wx+wy*3)%7===0)X.fillRect(x+5,y+9,3,2);break;
 case T.BRIDGE:X.fillStyle='#704818';for(let i=0;i<4;i++)X.fillRect(x,y+i*4,TS,1);break;
 case T.WALL:X.fillStyle='#7890b0';X.fillRect(x+4,y+4,8,6);break;
 case T.ROOF_H:case T.ROOF_C:case T.ROOF_S:case T.ROOF_G:case T.ROOF_L:X.fillStyle='rgba(0,0,0,.15)';X.fillRect(x,y+12,TS,4);X.fillRect(x,y+5,TS,1);if(t===T.ROOF_C&&wx%3===1){X.fillStyle='#fff';X.fillRect(x+5,y+3,6,2);X.fillRect(x+7,y+1,2,6);}break;
 case T.DOOR:X.fillStyle='#40280c';X.fillRect(x+3,y+2,10,14);X.fillStyle='#e0c040';X.fillRect(x+10,y+9,2,2);break;
 case T.FLOWER:X.fillStyle=['#f04060','#f0e040','#ffffff'][(wx+wy)%3];X.fillRect(x+3,y+4,3,3);X.fillRect(x+10,y+9,3,3);break;
 case T.FLOOR:X.fillStyle=((wx+wy)&1)?'#d0c0a0':'#dccca8';X.fillRect(x,y,TS,TS);break;
 case T.IWALL:X.fillStyle='#6a5440';X.fillRect(x,y+12,TS,4);break;
 case T.COUNTER:X.fillStyle='#c09060';X.fillRect(x,y,TS,5);break;
 case T.BED:X.fillStyle='#d04040';X.fillRect(x+1,y+6,14,9);X.fillStyle='#fff';X.fillRect(x+3,y+1,10,5);break;
 case T.TABLE:X.fillStyle='#8a5a30';X.fillRect(x+1,y+12,3,4);X.fillRect(x+12,y+12,3,4);break;
 case T.PC:X.fillStyle='#90f0f0';X.fillRect(x+3,y+2,10,7);break;
 case T.PILLAR:X.fillStyle='#707078';X.fillRect(x+3,y,10,TS);break;
 case T.CWALL:X.fillStyle='#2a1218';X.fillRect(x+2,y,4,TS);X.fillRect(x+10,y,4,TS);X.fillStyle=(G.frame>>4)%2?'#e03020':'#a02018';if((wx+wy)%3===0)X.fillRect(x+7,y+6,2,3);break;
 case T.CFLOOR:X.fillStyle=((wx+wy)&1)?'#40161c':'#341014';X.fillRect(x,y,TS,TS);if((wx*3+wy)%7===0){X.fillStyle='#a02010';X.fillRect(x+6,y+7,4,1);}break;
 case T.ROOF_T:X.fillStyle='rgba(0,0,0,.15)';X.fillRect(x,y+12,TS,4);if(wx%4===2){X.fillStyle='#fff';X.fillRect(x+7,y+1,2,8);X.fillRect(x+4,y+3,8,2);}break;
 case T.ALTAR:X.fillStyle='#c0a060';X.fillRect(x+1,y+8,14,8);const fl=(G.frame>>3)%2;X.fillStyle=fl?'#ffffff':'#f0f0d0';X.fillRect(x+3,y+2+fl,2,6);X.fillStyle=fl?'#60a0ff':'#4080f0';X.fillRect(x+7,y+1,2,7);X.fillStyle=fl?'#ff4030':'#e02020';X.fillRect(x+11,y+2+fl,2,6);break;
 case T.HWALL:X.fillStyle=wy>60?'#3a6890':'#e8d070';X.fillRect(x+2,y+2,12,3);X.fillRect(x+6,y,4,TS);break;
 case T.HFLOOR:X.fillStyle=((wx+wy)&1)?'#fff0c0':'#fff8e8';X.fillRect(x,y,TS,TS);break;
 case T.SFLOOR:X.fillStyle=((wx+wy+(G.frame>>4))&1)?'#3878a8':'#4890c0';X.fillRect(x,y,TS,TS);break;
 case T.MURAL:X.fillStyle='#a08060';X.fillRect(x+1,y+1,14,11);X.fillStyle='#c02020';X.fillRect(x+3,y+5,2,6);X.fillStyle='#f0f0f0';X.fillRect(x+7,y+5,2,6);X.fillStyle='#4080c0';X.fillRect(x+11,y+5,2,6);X.fillStyle='rgba(40,20,60,.6)';X.fillRect(x+2,y+2,12,3);break;
 case T.SEAL:X.fillStyle='#2a2030';X.fillRect(x+1,y,14,TS);X.strokeStyle='#a080f0';X.beginPath();X.arc(x+8,y+8,5,0,7);X.stroke();X.fillStyle='#a080f0';X.fillRect(x+7,y+3,2,10);break;
 case T.SNOW:X.fillStyle='#dde6f4';if((wx*5+wy)%6===0)X.fillRect(x+6,y+6,3,2);break;
 }}
function drawChar(px,py,col,dir,step,cap){if(window.WS){WS.char(X,px,py,col,dir,step,cap);return;}X.fillStyle='rgba(0,0,0,.25)';X.fillRect(px+3,py+13,10,3);
 const bob=step?1:0;X.fillStyle=col;X.fillRect(px+4,py+7-bob,8,7);X.fillStyle='#f0c8a0';X.fillRect(px+4,py+1-bob,8,7);X.fillStyle=cap||'#402010';X.fillRect(px+3,py-bob,10,3);
 X.fillStyle='#000';if(dir!=='up'){const o=dir==='left'?-1:dir==='right'?1:0;X.fillRect(px+5+o,py+4-bob,2,2);X.fillRect(px+9+o,py+4-bob,2,2);}
 X.fillStyle='#303030';X.fillRect(px+4+(step?1:0),py+14-bob,3,2);X.fillRect(px+9-(step?1:0),py+14-bob,3,2);}
function render(){const m=curMap();G.frame++;
 let ox=0,oy=0;if(G.mv){ox=G.mv.dx*G.mv.t*TS;oy=G.mv.dy*G.mv.t*TS;}
 const Z=m.outdoor?1:Math.max(1,Math.min(1.5,VW/(m.w*TS+24),VH/(m.h*TS+44))),vw=VW/Z,vh=VH/Z;
 const pxw=S.x*TS+ox,pyw=S.y*TS+oy;let camx=pxw-vw/2+8,camy=pyw-vh/2+8;
 if(m.w*TS<=vw)camx=(m.w*TS-vw)/2;else camx=clamp(camx,0,m.w*TS-vw);
 if(m.h*TS<=vh)camy=(m.h*TS-14-vh)/2-5;else camy=clamp(camy,-14,m.h*TS-vh);
 const SC0=C.width/VW,SC=SC0*Z;WS.vw=vw;WS.vh=vh;
 X.setTransform(1,0,0,1,0,0);if(m.outdoor){X.fillStyle='#000';}else{const bg=X.createRadialGradient(C.width/2,C.height/2,C.width*.1,C.width/2,C.height/2,C.width*.7);bg.addColorStop(0,'#3a2a44');bg.addColorStop(1,'#120a18');X.fillStyle=bg;}X.fillRect(0,0,C.width,C.height);
 if(G.shake>0){G.shake--;camx+=Math.round((Math.random()-.5)*8);camy+=Math.round((Math.random()-.5)*8);$('stage').style.transform='translate('+((Math.random()-.5)*6)+'px,'+((Math.random()-.5)*6)+'px)';if(G.shake===0)$('stage').style.transform='';}
 camx=Math.round(camx*SC)/SC;camy=Math.round(camy*SC)/SC;
 X.imageSmoothingEnabled=true;WS.ground(m,camx,camy,SC);
 X.setTransform(SC,0,0,SC,0,0);X.imageSmoothingEnabled=true;
 if(window.AMB)AMB.under(m,camx,camy);
 const ents=entities();
 ents.sort((a,b)=>(a.fy!==undefined?a.fy:a.y)-(b.fy!==undefined?b.fy:b.y));
 if(m.outdoor&&window.MFX)MFX.roamers(m,camx,camy);
 for(const e of ents){const sx=(e.fx!==undefined?e.fx:e.x)*TS-camx,sy=(e.fy!==undefined?e.fy:e.y)*TS-camy;if(sx<-24||sy<-24||sx>VW+8||sy>VH+16)continue;
  if(e.kind==='legend'&&ART[e.ref.sp]){if(window.MFX&&!window.SIS)MFX.aura(X,e.ref.sp,sx+8,sy+6,16);if(!(window.SIS&&SIS.pix(X,sx,sy,e.ref.sp,Math.abs(S.x-e.x)>=Math.abs(S.y-e.y)?(S.x<e.x?'left':'right'):(S.y<e.y?'up':'down'))))drawMandaraPix(sx,sy+Math.sin(G.frame/20)*1.5-1,e.ref.sp);}else if(e.kind==='legend'){if(window.MFX)MFX.aura(X,e.ref.sp,sx+8,sy+6,18);drawMon(X,e.ref.sp,sx+8,sy+2+Math.sin(G.frame/15)*2.5,30);}
  else if(e.kind==='item'){const k=Math.sin(G.frame/8);X.fillStyle='#fff6c0';X.beginPath();X.moveTo(sx+8,sy+3-k);X.lineTo(sx+9.2,sy+7);X.lineTo(sx+13+k,sy+8);X.lineTo(sx+9.2,sy+9);X.lineTo(sx+8,sy+13+k);X.lineTo(sx+6.8,sy+9);X.lineTo(sx+3-k,sy+8);X.lineTo(sx+6.8,sy+7);X.fill();}
  else drawEnt(e,sx,sy);}
 WS.npc(X,pxw-camx,pyw-camy,WS.look('player','player'),G.dir||'down',window.AMB&&AMB.reduced?'i0':G.mv?'w'+(((S.x+S.y)&1)?(G.mv.t<0.5?3:0):(G.mv.t<0.5?1:2)):('i'+((((G.frame||0)>>4)%7)===0?1:0)));
 drawHearts(camx,camy);
 if(window.AMB)AMB.mid(m,camx,camy,ents);
 WS.tint(m);
 WS.lights(m,camx,camy,ents);
 X.setTransform(SC0,0,0,SC0,0,0);
 if(window.AMB)AMB.top(m,camx,camy);
 WS.post(m);
 if(m.outdoor)drawSkyHead(m);
 // HUD (dark panel, gold trim)
 const hg=X.createLinearGradient(0,0,0,13);hg.addColorStop(0,'rgba(20,10,24,.92)');hg.addColorStop(1,'rgba(8,4,12,.8)');X.fillStyle=hg;X.fillRect(0,0,VW,13);X.fillStyle='#d9a94a';X.fillRect(0,13,VW,.6);X.fillStyle='rgba(217,169,74,.35)';X.fillRect(0,13.8,VW,.4);
 X.font='bold 8px Georgia,"Times New Roman",serif';X.textBaseline='top';X.fillStyle='#f3e2b8';
 X.fillText(locName().slice(0,24),4,2.5);const hh=hour(),mm=minute();X.fillText(String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+' '+(hh>=6&&hh<18?'Day':hh<20&&hh>=18?'Dusk':'Night'),VW-62,2.5);
 X.fillStyle='#e8c060';X.fillText('Medals '+medalCount()+'  Knowers '+knowerCount()+'/9',VW-160,2.5);const fs=festival();if(fs&&m.outdoor){X.fillStyle='rgba(60,20,8,.85)';X.fillRect(0,14,130,10);X.fillStyle='#ffd070';X.fillText('Festival: '+fs.name,4,15);}
 if(G.toast&&G.toastT>0){G.toastT--;X.fillStyle='rgba(12,6,16,.88)';X.fillRect(VW/2-90,20,180,14);X.strokeStyle='#d9a94a';X.lineWidth=.6;X.strokeRect(VW/2-89.5,20.5,179,13);X.fillStyle='#ffe8a0';X.fillText(G.toast,VW/2-86,23);}
 if(window.AMB&&AMB.map)AMB.map(m);
}
const SHRINE_TXT=['A wayside shrine with four stones: three set together, one set high on a post.','"Mantermo, calm the waters." Someone has added: "...and come home."','The storm-wind sings through a hole in the stone, four notes over and over.','Pilgrims stack stones here. The top stone always faces the giant on the horizon.','"For a thing does not rise unless it is called."','A shrine to the Three at the lake\'s edge. Under the water, a fourth carving glows.','"Walk the Reach Road with a pure heart." Champions have carved their names below.','The altar where, the Calling says, the first word was spoken. It is warm.','A cairn of white stones. Snow refuses to settle on it.','A tiny pine shrine with a bell that never rings.'];const SHRINE_TXT_OLD=['"Light to see by, water and air to live on, fire and night to rest in." Someone has left three pebbles... and a fourth, set a little apart.','A weathered prayer: "Mantermo, calm the waters for those who sail." The wax of three candles is still warm.','The wind sings through a hole in the stone. For a moment it almost sounds like a name.','Pilgrims have stacked stones here for centuries. The topmost stone is always found turned to face the sky.','"For a thing does not rise unless it is called." The rest of the line is worn away.','A river-shrine to the Three. Coins glitter in the shallows - one is stamped with a symbol you do not recognise.','"Walk the Pilgrim\'s Road with a pure heart." Champions have carved their names below.','An ancient altar, cracked down the middle. Three hollows for offerings - and a fourth, larger, at the centre.','At the top of the world, a cairn. Scratched into it: "Even the sisters looked up."','A tiny forest shrine woven of pine. The old woodcutters say it was here before the temples.'];
async function wayShrineTalk(x,y){const sh=SHRINES.find(s=>s.x===x&&s.y===y);if(!sh)return;await say(sh.name+': '+SHRINE_TXT[sh.k%SHRINE_TXT.length]);if(!S.flags['shr'+sh.k]){S.flags['shr'+sh.k]=1;healAll();await say('A gentle warmth washes over your team. They feel refreshed.');}}
function townAt(x,y){return TOWNS.find(t=>x>=t.x&&x<t.x+TW&&y>=t.y&&y<t.y+TH);}
function locName(){const m=curMap();if(S.map!=='world')return m.name;const t=townAt(S.x,S.y);if(t)return t.name;const lm=LANDMARKS.filter(l=>Math.abs(l.x-S.x)<=l.r&&Math.abs(l.y-S.y)<=l.r).sort((a,b)=>a.r-b.r)[0];if(lm)return lm.name;const z=ZONEMAP[S.y*WW+S.x];if(z)return ZONES[z].name;return {leaf:'Brightwater Wilds',dusk:'Vesper Moors',ember:'Ashcone Flats',coast:'Reach Coast',gale:'Stormwatch Heath',snow:'Hushpeak Heights',cave:'Ninefold Caverns',summit:'Concord Highlands',crimson:'The Hollow Crown'}[regionAt(S.x,S.y)]||'Wilds';}
function toast(t){G.toast=t;G.toastT=120;}

// ===== UI layers =====
const UI=[];
function topL(){return UI[UI.length-1];}
function focusOpts(L){if(!L.el)return;const os=[...L.el.querySelectorAll('.opt')];os.forEach((o,i)=>o.classList.toggle('sel',i===L.idx));const s=os[L.idx];if(s&&s.scrollIntoView)s.scrollIntoView({block:'nearest'});}
function pushL(L){L.idx=L.idx||0;UI.push(L);L.el.style.display='';focusOpts(L);}
function popL(L){const i=UI.indexOf(L);if(i>=0)UI.splice(i,1);if(L.el&&L.remove)L.el.remove();else if(L.el)L.el.style.display='none';}
function layerKey(L,k){if(L.onKey&&L.onKey(k)===true)return;const os=[...L.el.querySelectorAll('.opt')];
 if(k==='up'||k==='left'){L.idx=(L.idx-1+os.length)%Math.max(1,os.length);focusOpts(L);}
 else if(k==='down'||k==='right'){L.idx=(L.idx+1)%Math.max(1,os.length);focusOpts(L);}
 else if(k==='a'){const o=os[L.idx];if(o){if(o.tagName==='INPUT'){o.focus();o.select&&o.select();}else o.click();}}
 else if(k==='b'){if(L.onB)L.onB();}}
function mkEl(cls,html){const d=document.createElement('div');d.className=cls;d.innerHTML=html;$('ui').appendChild(d);return d;}
function say(text){if(window.SFX)SFX.play('blip');if(window.MATURE)text=MATURE.line(text,fmt);return new Promise(res=>{const el=mkEl('dlg','<div class="dtext">'+esc(fmt(text))+'</div><div class="more">&#9660;</div>');const L={el,remove:true,onKey:k=>{if(k==='a'||k==='b'){popL(L);res();}return true;}};el.onclick=()=>L.onKey('a');pushL(L);});}
async function sayAll(arr){for(const t of arr)await say(t);}
function choose(prompt,opts,cancel=true,cls){return new Promise(res=>{const el=mkEl('menu '+(cls||''),(prompt?'<div class="mp">'+esc(fmt(prompt))+'</div>':'')+opts.map((o,i)=>'<button class="opt" data-i="'+i+'">'+esc(fmt(o))+'</button>').join(''));
 const L={el,remove:true,onB:()=>{if(cancel){popL(L);res(-1);}}};el.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{popL(L);res(+b.dataset.i);});pushL(L);});}
function screen(html,onB,cls){const el=mkEl('screen '+(cls||''),html);const L={el,remove:true,onB:()=>{popL(L);onB&&onB();}};pushL(L);return L;}
function promptName(title,def){return new Promise(res=>{const el=mkEl('screen namebox','<h2>'+esc(title)+'</h2><input class="opt" id="nameIn" maxlength="12" value="'+esc(def)+'" autocomplete="off"><br><button class="opt" id="nameOk">OK</button><p class="hint">Type a name, then press Enter or OK.</p>');
 const inp=el.querySelector('input');const done=()=>{const v=inp.value.trim().replace(/[<>]/g,'').slice(0,12);if(!v){inp.focus();return;}popL(L);res(v);};
 const L={el,remove:true,onB:()=>{}};el.querySelector('#nameOk').onclick=done;inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();done();}});pushL(L);setTimeout(()=>inp.focus(),50);});}

// ===== Input =====
const KEYMAP={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right',z:'a',Z:'a',Enter:'a',' ':'a',x:'b',X:'b',Escape:'b',m:'start',M:'start'};
window.addEventListener('keydown',e=>{const ae=document.activeElement;
 if(ae&&ae.tagName==='INPUT'){if(e.key==='Escape'||e.key==='Enter'){ae.blur();e.preventDefault();}return;}
 const k=KEYMAP[e.key];if(!k)return;e.preventDefault();if(e.repeat&&(k==='a'||k==='b'||k==='start'))return;press(k,true);});
window.addEventListener('keyup',e=>{const k=KEYMAP[e.key];if(k)press(k,false);});
function press(k,down){if(['up','down','left','right'].includes(k)){if(down)G.held.add(k);else G.held.delete(k);}
 if(!down)return;const L=topL();if(L){layerKey(L,k);return;}
 if(G.mode==='world'&&!G.busy&&!G.mv){if(k==='a')interact();else if(k==='b'||k==='start')openMenu();}}
// touch controls
function setupTouch(){document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;
 const dn=e=>{e.preventDefault();b.classList.add('on');press(k,true);if(navigator.vibrate)try{navigator.vibrate(8);}catch(_){} };
 const up=e=>{e.preventDefault();b.classList.remove('on');press(k,false);};
 b.addEventListener('pointerdown',dn);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);});
 document.addEventListener('gesturestart',e=>e.preventDefault());document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
 document.addEventListener('touchmove',e=>{if(!e.target.closest('.screen,.menu'))e.preventDefault();},{passive:false});}

// ===== World loop =====
function dirVec(d){return {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[d];}
let lastT=performance.now();
function loop(now){const dt=Math.min(0.1,(now-lastT)/1000);lastT=now;
 if(S&&S.flags&&S.flags.earless)setEarless();if(S&&G.mode==='world'){S.play+=dt;if(S.flags&&S.flags.rewrite===1&&S.play>(S.mandaraWeakUntil||0)&&!UI.length&&!G.busy&&!G.recovering){G.recovering=1;mandaraRecover().finally(()=>{G.recovering=0;});}if(!UI.length&&!G.busy)S.time+=dt;// 1 real sec = 1 game minute
  if(!UI.length&&!G.busy){if(G.mv){G.mv.t+=dt*7;if(G.mv.t>=1){S.x+=G.mv.dx;S.y+=G.mv.dy;G.mv=null;onStep();}}
   if(!G.mv&&!G.busy&&!UI.length){const d=['up','down','left','right'].find(k=>G.held.has(k));if(d)tryMove(d);}}
  if(now-G.lastAuto>30000&&!G.busy&&!UI.length){G.lastAuto=now;autosave();}
  render();}
 else if(G.mode==='title')drawTitle();
 if(BT&&$('battle').style.display==='block')bRender();
 if(now-(G.audT||0)>500){G.audT=now;audioTick();}
 requestAnimationFrame(loop);}
function pickMusic(){if(G.mode==='title'||!S)return 'title';if(G.victoryUntil>performance.now())return 'victory';
 if(BT&&$('battle').style.display==='block'){const o=BT.o,sp=BT.e.m.sp;if(o.boss||sp==='Legranta')return 'legranta';if(sp==='Mandara')return 'mandara';if(['Lumenwing','Hollowmere','Octavel'].includes(sp))return 'mancaco';if(sp==='Mancaco')return 'mancaco';if(sp==='Mantermo')return 'mantermo';if(o.legend)return 'gym';if(!o.wild){const t=o.t||{};if(t.elite!==undefined)return 'champion';if(t.gym!==undefined)return 'gym';if(/Choir/.test(t.cls||''))return 'choir';return 'trainer';}return 'wild';}
 const m=curMap();if(!m.outdoor)return m.type==='castle'?'legranta':m.type==='league'?'summit':m.type==='lair'?'mancaco':'interior';
 const tn=townAt(S.x,S.y);const r=regionAt(S.x,S.y);if(WS.dark()>0.6)return 'night';if(tn)return ['leaf','ember','coast','gale','snow','dusk'][tn.id];if(r==='cave')return 'cave';if(r==='summit'||r==='crimson')return 'summit';const z=ZONEMAP[S.y*WW+S.x];if(z&&/^r\d/.test(z))return 'route';return r;}
function audioTick(){if(!window.SFX||!SFX.ok)return;SFX.music(pickMusic());if(!S||G.mode!=='world'||S.map!=='world'||(BT&&$('battle').style.display==='block')){SFX.ambient(S&&G.mode==='world'&&S.map!=='world'&&window.AMB&&AMB.raining&&(()=>{const m=curMap(),tn=m&&TOWNS[m.town];return tn?AMB.raining(AMB.region(tn.x+10,tn.y+7)):false;})()?{rain:1,indoor:1}:{});return;}
 const r=regionAt(S.x,S.y);let sea=false;for(const [a,b] of [[0,0],[6,0],[-6,0],[0,6],[0,-6]]){const xx=S.x+a,yy=S.y+b;if(xx>=0&&yy>=0&&xx<WW&&yy<WH&&OCEAN[yy*WW+xx])sea=true;}const ar=window.AMB&&AMB.region?AMB.region(S.x,S.y):r;
 SFX.ambient({rain:window.AMB&&AMB.raining&&AMB.raining(ar),wind:r==='gale'||r==='snow',waves:sea,birds:WS.dark()<0.3&&(r==='leaf'||r==='coast'||r==='gale'),fire:r==='ember'||r==='crimson'});}
async function soundMenu(){while(true){const c=SFX.cfg;const i=await choose('Sound settings (saved on this device)',['Music volume: '+Math.round(c.mv*10)+'/10','Effects volume: '+Math.round(c.sv*10)+'/10',c.mute?'Sound: MUTED (tap to unmute)':'Sound: ON (tap to mute)','Mature language: '+(window.MATURE&&MATURE.on?'On':'Off'),'Back']);if(i<0||i===4)return;if(i===3){MATURE.set(!MATURE.on);continue;}
 if(i===0){let v=Math.round(c.mv*10);v=v>=10?0:v+2;SFX.setMusic(v/10);}if(i===1){let v=Math.round(c.sv*10);v=v>=10?0:v+2;SFX.setSfx(v/10);SFX.play('select');}if(i===2)SFX.toggleMute();}}
function tryMove(d){G.dir=d;S.dir=d;const [dx,dy]=dirVec(d);const nx=S.x+dx,ny=S.y+dy;
 const ents=entities();const e=entAt(nx,ny,ents);
 if(SOLID.has(tileAt(S.map,nx,ny))||e){return;}
 G.mv={dx,dy,t:0};}
async function onStep(){const t=tileAt(S.map,S.x,S.y);
 if(S.map==='world'&&t===T.DOOR){const id=DOORS[S.x+','+S.y];if(id==='castle'&&(!S.flags.champ||knowerCount()<9)){G.busy=true;await say('The Eighth Door is sealed by eight turning rings of starlight. A voice in your head: "Bring all ten names... and the crown of the Concord." ('+knowerCount()+'/9 knowers found'+(S.flags.champ?'':', not yet Champion')+')');S.y+=1;G.busy=false;return;}if(id==='league'&&medalCount()<6){G.busy=true;await say('Concord Warden: Only trainers with all six medals of the Reach may enter the Concord Hall.');S.y+=1;G.busy=false;return;}if(id){await enterMap(id);return;}}
 if(t===T.MAT){const m=curMap();await enterMap('world',m.exit.x,m.exit.y,'down');return;}
 if(window.SFX)SFX.step(t);
 if(S.map==='world'){const hd=HIDDEN.find(h=>h.x===S.x&&h.y===S.y&&!S.flags[h.id]);if(hd){S.flags[hd.id]=1;addItem(hd.item,1);G.busy=true;await say('Something glints at your feet... You found a hidden '+hd.item+'!');G.busy=false;}
  const lm=LANDMARKS.find(l=>Math.abs(l.x-S.x)<=l.r&&Math.abs(l.y-S.y)<=l.r);if(lm&&!(S.flags.disc||{})[lm.name]){S.flags.disc=S.flags.disc||{};S.flags.disc[lm.name]=1;toast('Discovered: '+lm.name);}
  const tn=townAt(S.x,S.y);if(tn&&!S.flags['enter'+tn.id]){S.flags['enter'+tn.id]=1;await townEvent(tn);}
  const z=ZONEMAP[S.y*WW+S.x];if(z!==G.zoneShown){G.zoneShown=z;if(z)toast(ZONES[z].name);}
  let rate=0;if(t===T.TALL||t===T.SNOWTALL)rate=0.12;else if(t===T.CAVE)rate=0.05;
  if(rate&&z&&Math.random()<rate&&alive(S.party).length){const Z=ZONES[z];await wildBattle(mkMon(Z.sp[ri(0,Z.sp.length-1)],Math.min(100,ri(Z.lv[0],Z.lv[1])+(S.flags.heard?3:0))));}}}
async function enterMap(id,x,y,dir){G.busy=true;if(window.SFX)SFX.play('door');S.map=id;const m=MAPS[id];if(x===undefined){x=m.spawn.x;y=m.spawn.y;dir='up';}S.x=x;S.y=y;S.dir=dir;G.dir=dir;G.mv=null;
 await fade();G.busy=false;autosave();}
function fade(){return new Promise(r=>{const f=$('fade');f.classList.add('on');setTimeout(()=>{f.classList.remove('on');r();},180);});}
function facing(){const [dx,dy]=dirVec(G.dir||'down');return [S.x+dx,S.y+dy];}
async function interact(){let [fx,fy]=facing();const [dx,dy]=dirVec(G.dir||'down');let t=tileAt(S.map,fx,fy);
 if(t===T.COUNTER){fx+=dx;fy+=dy;}
 const e=entAt(fx,fy);G.busy=true;
 try{if(e)await talkTo(e);else if(t===T.PC)await storageMenu();else if(t===T.BED&&S.map==='b0_5'){await say('You nap in the inn bed Mirelle keeps for you. Your team feels refreshed!');healAll();S.time+=120;}
  else if(t===T.WATER)await say('The water is deep and still.');
  else if(t===T.ALTAR)await readAltar();
  else if(t===T.MURAL){const tn=curMap().town;addClue('mural'+tn);await sayAll(['An ancient Reach mural: the three sisters with their weapons raised - and above them, never scraped away, a vast smiling figure with a starry halo: Legranta, the One.','Here, unlike on your island, nobody hid him. The Reach was the first shore he ever stood on.',INSCRIPTIONS[tn]||'']);}
  else if(t===T.SEAL)await sealDoor();
  else if(t===T.SHRINE)await wayShrineTalk(fx,fy);
  else if(t===T.RUIN)await say(['A broken column carved with three flames and one star above them: the sign of the Calling.','Moss-covered stone. An inscription reads: "Here the first word was spoken. Here the last will be answered."','A toppled pillar. Its carved sky has three stars and one great eye.'][(fx*3+fy)%3]);}
 finally{G.busy=false;}}

// ===== Story =====
const TOWN_EVENTS=[
 ['Brightwater: villagers stand in the lanes, staring at the colossal face on the horizon.','A hooded Hollow Choir Chanter loiters by the gym, asking everyone about "the ones who fell from the sky".'],
 ['Kilnmouth: the kilns have gone cold and cracked glass litters the square.','The Hollow Choir are smashing the ancient seal-glass inside the kilns.'],
 ['Saltmere: the pearl beds are churning and a strange ferry is moored at the pier...','It flies the flag of Tidehaven! And the Choir are diving for the third seal.'],
 ['Stormwatch: the storm bell hangs silent.','Cantor Malrec himself stands by the gym, singing a song with no words.'],
 ['Hushpeak: the silence has been broken by chanting.','The Choir are cracking the silent seal beneath the snow-temple.'],
 ['Vesperdeep: every bell in the ruins rings at once, out of tune.','The Cantor waits in the bell-ruins plaza. Seven seals are nearly broken.']];
async function townEvent(tn){const ev=TOWN_EVENTS[tn.id];if(ev)await sayAll(ev);}
// ===== OPENING (sequel). Edit OPENING_LINES freely - each entry is [phase, caption]. =====
// phases: dark, sense, wake, rise, sisters, void, slash
const OPENING_LINES=[
 ['dark','(The night the world shook. The hooded stranger by the eighth door lays a hand on your shoulder.)'],
 ['dark','Hooded Stranger: Sleep now, @NAME. Sleep well. It may be the last quiet night any world gets for a long while.'],
 ['dark','. . .'],
 ['sense','Far above every world, something vast stirs. It counts the names spoken of it, one by one.'],
 ['sense','Seven... eight... nine...'],
 ['sense','Ten. Ten now know my name. After two hundred billion years in the stillness between worlds... I can come home.'],
 ['sense','But the voice is wrong. It echoes, as if something hollow is speaking through it.'],
 ['sense','A light older than the Deep reaches down - and takes all ten of them, the hero and nine others, from wherever they sleep.'],
 ['wake','You wake to the sound of surf. Cold sand. A shore you have never seen.'],
 ['rise','The ground trembles. On the horizon, above the edge of the world, a face rises - vast beyond measure, crowned with stars.'],
 ['rise','Its eyes open. They are looking at you.'],
 ['sisters','Three lights fall from the sky and land between you and the horizon: Mandara, Mancaco and Mantermo, swords and spear raised.'],
 ['sisters','Mancaco: Stay behind us, little one. ...Who is he? Why does my light bend toward him?'],
 ['sisters','Mantermo: The scriptures your priests wrote say a Father called us out of the Deep. If that is our Father... why does he look at this world like something to be eaten?'],
 ['sisters','Mandara: I do not remember him. I only feel... grief. As if I lost someone before I was ever born. And dread. That is not the father the Silent Book loves.'],
 ['sisters','Mancaco: Nine others who know his name were taken with you and scattered across this land. Find them, @NAME. They know what we have forgotten.'],
 ['void','The air tears. A void opens behind you - the Deep itself, pulling at everything.'],
 ['slash','Mandara: Not today! (Her crimson blade splits the void wide open.) Go, @NAME - I am with you!'],
 ['slash','Mancaco & Mantermo: We will hold it! Find the knowers - then come back for us!'],
 ['wake','The void slams shut behind you. Mancaco and Mantermo are gone, trapped inside it, holding it closed. Mandara, wounded but smiling, returns to her orb at your side.'],
 ['wake','On the horizon, the giant face watches. Something about it is wrong. It does not move away.']];
function openingScene(lines){lines=lines||OPENING_LINES;return new Promise(async res=>{if(window.SFX)SFX.music('awakening');
 const el=mkEl('screen artscene opening','<canvas class="artcv" width="560" height="480"></canvas><div class="cap"></div>');const cv=el.querySelector('canvas'),g=cv.getContext('2d');let phase='dark',t0=performance.now(),alive=true;G.opening=el;
 const sis=['Mancaco','Mantermo','Mandara'];
 function draw(now){if(!alive)return;const t=(now-t0)/1000;g.setTransform(1,0,0,1,0,0);const sh=(phase==='rise'||phase==='slash')&&t<2.5&&!(window.MFX&&MFX.red())?(2.5-t)*3:0;g.translate((Math.random()-.5)*sh,(Math.random()-.5)*sh);
  if(phase==='dark'){g.fillStyle='#000';g.fillRect(-10,-10,580,500);g.fillStyle='rgba(120,100,160,'+(0.15+0.05*Math.sin(t*2))+')';g.beginPath();g.arc(280,240,40,0,7);g.fill();}
  else if(phase==='sense'){g.fillStyle='#03020a';g.fillRect(-10,-10,580,500);for(let i=0;i<120;i++){g.fillStyle='rgba(255,255,255,'+(0.3+0.7*((i*37+t*20)%60)/60)+')';g.fillRect((i*97)%560,(i*53)%480,1.5,1.5);}
   if(HEAD.ok){g.globalAlpha=Math.min(0.5,t*0.2);g.drawImage(HEAD.img,80,0,400,371);g.globalAlpha=1;drawEyes(g,80,0,400/280,1+Math.sin(t*3)*0.3);}
   for(let k=0;k<10;k++){const a=k/10*6.283+t*0.5,r=200-Math.min(160,t*50);g.fillStyle='#fff8d0';g.beginPath();g.arc(280+Math.cos(a)*r,300+Math.sin(a)*r*0.5,4,0,7);g.fill();}}
  else{const hz=300;const sky=g.createLinearGradient(0,0,0,hz);sky.addColorStop(0,'#140c34');sky.addColorStop(0.6,'#5a3a7a');sky.addColorStop(1,'#f0a070');g.fillStyle=sky;g.fillRect(-10,-10,580,hz+10);
   if(phase!=='wake'||G.openWake>1){const k=phase==='rise'?Math.min(1,t/3):1;const hw=400,hh=hw*260/280,hx=80,hy=hz+20-(hh*0.85+20)*k;g.save();g.beginPath();g.rect(-10,-10,580,hz+10);g.clip();g.globalAlpha=0.92;if(HEAD.ok)g.drawImage(HEAD.img,hx,hy,hw,hh);else{g.fillStyle='#0a0618';g.beginPath();g.ellipse(280,hy+hh*0.45,150,170,0,0,7);g.fill();}g.globalAlpha=1;drawEyes(g,hx,hy,hw/280,1.5);g.restore();}
   const sea=g.createLinearGradient(0,hz,0,480);sea.addColorStop(0,'#4060a0');sea.addColorStop(1,'#102040');g.fillStyle=sea;g.fillRect(-10,hz,580,90);g.fillStyle='#e8d0a0';g.fillRect(-10,hz+80,580,120);
   for(let i=0;i<6;i++){g.fillStyle='rgba(255,255,255,.4)';g.fillRect(((i*120+t*30)%600)-20,hz+20+i*10,40,2);}
   // hero (back view)
   g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(280,452,22,6,0,0,7);g.fill();g.fillStyle='#3050c0';g.fillRect(268,412,24,34);g.fillStyle='#402010';g.beginPath();g.arc(280,402,14,0,7);g.fill();
   if(phase==='sisters'||phase==='void'||phase==='slash'){const k=phase==='sisters'?Math.min(1,t/1.5):1;sis.forEach((sp,i)=>{if(phase==='slash'&&sp!=='Mandara'&&t>1.2)return;const a=ART[sp];const x=[150,410,280][i],y=-200+(370-(-200))*k-(i===2?10:0);const hh=200,ww=a.ok?hh*a.img.naturalWidth/a.img.naturalHeight:80;g.save();g.shadowColor=a.pal.wep;g.shadowBlur=30;if(a.ok)g.drawImage(a.img,x-ww/2,y-hh,ww,hh);else drawWarrior(g,sp,x,y-90,160,false);g.restore();});}
   if(phase==='void'||phase==='slash'){const r=Math.min(1,t/1.2);g.save();g.translate(280,200);g.rotate(t*0.6);for(let i=0;i<6;i++){g.strokeStyle='rgba('+(120+i*20)+',60,200,'+(0.6-i*0.08)+')';g.lineWidth=10-i;g.beginPath();g.ellipse(0,0,(60+i*14)*r,(110+i*10)*r,0,0,7);g.stroke();}g.fillStyle='#000';g.beginPath();g.ellipse(0,0,55*r,100*r,0,0,7);g.fill();g.restore();
    if(phase==='slash'&&t<1.5){g.strokeStyle='#ff3020';g.shadowColor='#ff3020';g.shadowBlur=30;g.lineWidth=8;g.beginPath();g.moveTo(150,40);g.lineTo(150+(410-150)*Math.min(1,t/0.4),360);g.stroke();g.shadowBlur=0;}}}
  requestAnimationFrame(draw);}
 requestAnimationFrame(draw);const L={el,remove:true,onB:()=>{}};pushL(L);
 for(const [ph,txt] of lines){if(ph!==phase){phase=ph;t0=performance.now();if(ph==='wake')G.openWake=(G.openWake||0)+1;if(ph==='rise'||ph==='slash'){if(window.SFX)SFX.play('shake');}if(ph==='sisters'&&window.SFX)SFX.music('mandara');if(ph==='rise'&&window.SFX)SFX.music('legranta');}
  el.querySelector('.cap').textContent=fmt(txt);await new Promise(r=>{L.onKey=k=>{if(k==='a'||k==='b'){L.onKey=null;r();}return true;};el.onclick=()=>{el.onclick=null;L.onKey=null;r();};});}
 alive=false;G.opening=null;G.openWake=0;popL(L);res();});}
function drawEyes(g,ox,oy,sc,k){const now=performance.now()/1000;for(const [ex,ey] of HEAD.eyes){const x=ox+ex*sc,y=oy+ey*sc,r=Math.max(2,6*sc*k);const gr=g.createRadialGradient(x,y,0,x,y,r*2.5);gr.addColorStop(0,'rgba(255,255,255,'+Math.min(1,0.8*k)+')');gr.addColorStop(0.3,'rgba(200,180,255,'+Math.min(0.8,0.5*k*(0.8+0.2*Math.sin(now*2)))+')');gr.addColorStop(1,'rgba(150,120,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r*2.5,0,7);g.fill();}}
// Persistent horizon backdrop: Legranta watches from the sky band at the top of every outdoor screen.
let SKYC=null;function drawSkyHead(m){if(!HEAD.ok||!S||S.flags.finale)return;const red=window.AMB&&AMB.reduced;const dk=window.WS&&WS.dark?WS.dark():0;const lvl=(S.flags.heard?1:0)+Math.min(1,knowerCount()/9);
 const k=C.width/VW;X.setTransform(k,0,0,k,0,0);
 // he sits "north": stronger near the top of the world, fading as you walk south (under/away from him)
 const north=1-Math.min(1,S.y/WH);const a=(0.34+0.14*north+0.1*lvl)*(red?0.6:1);
 const hw=150,hh=hw*260/280,px=(S.x/WW-0.5)*-30;const x0=VW/2-hw/2+px,y0=34-hh*0.33;
 X.save();X.globalAlpha=a;X.beginPath();X.rect(0,14,VW,64);X.clip();
 if(!SKYC){SKYC=document.createElement('canvas');SKYC.width=280;SKYC.height=260;const c=SKYC.getContext('2d');c.drawImage(HEAD.img,0,0);const gr=c.createLinearGradient(0,95,0,170);c.globalCompositeOperation='destination-out';gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');c.fillStyle=gr;c.fillRect(0,95,280,165);}
 if(dk>0.4){X.filter='brightness(0.35)';}X.drawImage(SKYC,x0,y0,hw,hh);X.filter='none';X.restore();
 X.save();X.globalAlpha=Math.min(1,(0.25+0.35*dk+0.25*lvl)*(red?0.6:1));X.beginPath();X.rect(0,14,VW,48);X.clip();
 // eyes follow the player's general position
 const ox=x0+(S.x/WW-0.5)*1.2*0,oy=y0;drawEyes(X,ox,oy,hw/280,0.5+0.6*lvl+0.6*dk);X.restore();}
const HEARD_LINES=['Did you hear it too? "Hear me, my creations. I have returned." There was a second voice under his. I can\'t stop shaking.','The ground shook for a whole minute. His eyes are wider now - and emptier.','He called us his creations. Then the temples were wrong about everything. The Three were not first.','My priest tore the old scripture in half this morning. Then he cried and taped it back together.','Half the town prays to the horizon now. The other half says it is a demon wearing a god. I don\'t know what to pray to.','The wild monsters are restless since the voice. Watch yourself on the roads.'];
const PREMADE=[['Pyrrix',16],['Torrentail',15],['Galeon',15]];
const IMPORT_CAP=22;
function knowerCount(){return Object.keys(S&&S.knowers||{}).length;}
async function newGame(){S={v:1,name:'Robin',rival:'Kestrel',map:'world',x:LAY.start[0],y:LAY.start[1],dir:'up',party:[],box:[],bag:{},money:3000,medals:[false,false,false,false,false,false],flags:{starter:1},quests:{},seen:{},caught:{},met:{},beaten:{},time:6*60,play:0,wildKO:0,lastHeal:{map:'b0_2',x:5,y:4},starter:'Mandara',rel:{},wv:2,knowers:{},legacy:null};
 G.mode='intro';$('ui').classList.add('dark');
 const c=await choose('Monster Wilds II continues the story of Monster Wilds 1.',['Import hero from Monster Wilds 1','Start fresh (premade party)']);
 let imported=false;if(c===0)imported=await importG1();
 if(!imported){S.name=await promptName('What is your name, Champion of the Summit League?','Robin');S.rival=await promptName('And your rival\'s name?','Kestrel');for(const [sp,lv] of PREMADE)addMon(mkMon(sp,lv));}
 if(!S.party.concat(S.box).some(m=>m.sp==='Mandara')){const md=mkMon('Mandara',Math.max(24,Math.min(IMPORT_CAP+4,S.party.reduce((a,m)=>Math.max(a,m.lv),1)+2)));md.nick='Mandara';if(S.party.length<6)S.party.unshift(md);else{S.box.push(S.party.pop());S.party.unshift(md);}markCaught('Mandara');}
 else{const i=S.party.findIndex(m=>m.sp==='Mandara');if(i>0)S.party.unshift(S.party.splice(i,1)[0]);if(i<0){const j=S.box.findIndex(m=>m.sp==='Mandara');const md=S.box.splice(j,1)[0];if(S.party.length>=6)S.box.push(S.party.pop());S.party.unshift(md);}}
 S.seen.Legranta=1;S.seen.Mancaco=1;S.seen.Mantermo=1;addItem('Snare Orb',10);addItem('Potion',8);addItem('Great Orb',5);
 await openingScene();
 $('ui').classList.remove('dark');G.mode='world';G.dir='up';healAll();
 await sayAll(['Seren (the hooded stranger) is sitting on a rock nearby, watching the horizon.','Mandara (from her orb): That one smells of the Calling. Ask them what is wrong with... him. With our father. If he is our father.']);
 autosave();}
// Import game 1 hero (same origin localStorage, or an exported file)
function g1Valid(o){return o&&o.game==='monster-wilds'&&o.data&&typeof o.data.name==='string'&&Array.isArray(o.data.party);}
async function importG1(){let o=null;try{o=JSON.parse(localStorage.getItem(G1_SAVE_KEY)||'null');}catch(e){o=null;}
 if(!g1Valid(o)){const c=await choose('No Monster Wilds 1 save was found in this browser. Import an exported Monster Wilds 1 save file instead?',['Choose file','Start fresh']);if(c!==0)return false;o=await pickJSONFile();if(!g1Valid(o)){await say('That file is not a Monster Wilds 1 save. Starting fresh.');return false;}}
 return applyG1(o.data);}
function pickJSONFile(){return new Promise(res=>{const inp=$('importFile');inp.value='';inp.onchange=()=>{const f=inp.files[0];if(!f){res(null);return;}const r=new FileReader();r.onload=()=>{try{res(JSON.parse(r.result));}catch(e){res(null);}};r.readAsText(f);};inp.click();setTimeout(()=>res(null),120000);});}
async function applyG1(d){S.name=String(d.name).slice(0,12)||'Robin';S.rival=String(d.rival||'Kestrel').slice(0,12);const lost=[];let capped=0;
 const conv=m=>{if(!m||!SPECIES[m.sp])return null;if(m.sp==='Mancaco'||m.sp==='Mantermo'){lost.push(m.sp);return null;}const lv=Math.min(m.sp==='Mandara'?IMPORT_CAP+4:IMPORT_CAP,Math.max(1,m.lv|0));if(lv<m.lv)capped++;const n=mkMon(speciesForLevel(m.sp,1)===m.sp?m.sp:m.sp,lv);n.sp=m.sp;setMovesForLevel(n);n.hp=stats(n).hp;if(m.nick)n.nick=String(m.nick).slice(0,12);return n;};
 const all=(d.party||[]).concat(d.box||[]).map(conv).filter(Boolean);all.slice(0,6).forEach(m=>S.party.push(m));all.slice(6).forEach(m=>S.box.push(m));all.forEach(m=>markCaught(m.sp));
 S.legacy={friends:Object.keys(d.rel||{}).filter(k=>(d.rel[k].p||0)>=50),champ:!!(d.flags&&d.flags.champ),secret:!!(d.flags&&d.flags.legrantaSecret),caught:Object.keys(d.caught||{}).length,playtime:d.play||0,lost};
 if(!S.party.length)for(const [sp,lv] of PREMADE)addMon(mkMon(sp,lv));
 await sayAll(['Imported '+S.name+' (rival: '+S.rival+') with '+all.length+' monsters from Monster Wilds 1.',capped?'Legranta\'s light drained their strength: '+capped+' monsters were reduced to Lv '+IMPORT_CAP+'.':'Your monsters arrive at full strength.',...(lost.length?[lost.join(' and ')+' left your box to answer their father\'s call...']:[]),...(S.legacy.friends.length?['You remember your friends back home: '+S.legacy.friends.slice(0,6).map(k=>(PEOPLE_BY_ID[k]&&PEOPLE_BY_ID[k].name)||k).join(', ')+'.']:[])]);
 return true;}
function rivalParty(key){const line=evoLine(S.rivalStarter||'Drizzlet');return {rival0:[['Galeon',22],['Puffalo',22],[line[1],24]],rival2:[['Galeon',33],['Voltusk',33],['Brinefox',34],[line[2],35]],rival3:[['Galeon',48],['Voltusk',48],['Cliffclaw',49],['Rimewhale',49],['Stormcrest',49],[line[2],51]]}[key];}
function addItem(n,q){S.bag[n]=(S.bag[n]||0)+q;if(S.bag[n]<=0)delete S.bag[n];}

async function talkTo(e){const st=stage();if(e.ref&&e.ref.id){G.faceT=G.faceT||{};const dx=S.x-e.x,dy=S.y-e.y;G.faceT[e.ref.id]={d:Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'),until:S.time+20};}
 if(e.kind==='person'){const p=e.ref;S.met[p.id]=1;
  if(p.id==='oswin'&&S.quests.q4&&S.quests.q4.st==='active'&&!S.flags.delivered){S.flags.delivered=1;await sayAll(['You hand over Wenna\'s whispered letter.','Oswin: ...From my sister? Twenty years... Tell her I\'ll come down at the thaw.']);return;}
  if(p.knower){await knowerTalk(p,e);return;}
  if(p.priest&&!S.flags.forgotten){const ph=S.flags.rewrite?2:S.flags.heard?1:0;if(!S.flags['ps'+ph+'_'+p.id]){S.flags['ps'+ph+'_'+p.id]=1;const L=SCRIPTURE.priest[ph];await say(p.name+': '+L[hash(p.id)%L.length]);}}
  if(S.flags.forgotten&&!S.flags['fg_'+p.id]&&!p.quest){S.flags['fg_'+p.id]=1;await say(p.name+': '+FG_LINES[hash(p.id)%FG_LINES.length]);}
  else if(S.flags.rewrite&&!p.priest&&!S.flags.forgotten&&!S.flags['rw_'+p.id]&&!p.quest){S.flags['rw_'+p.id]=1;await say(p.name+': '+(p.priest?RW_PRIEST[hash(p.id)%RW_PRIEST.length]:RW_FOLK[hash(p.id)%RW_FOLK.length]));}
  if(S.flags.heard&&!S.flags.forgotten&&!p.priest&&!S.flags['hr_'+p.id]&&!p.quest){S.flags['hr_'+p.id]=1;await say(p.name+': '+HEARD_LINES[hash(p.id)%HEARD_LINES.length]);}
  if(p.id==='p5'||Math.random()<0.04)await say('('+p.name+' greets you with three fingers to the brow and one raised to the sky.)');
  if(p.priest&&PRIEST_EXTRA[p.id]){S.flags['px_'+p.id]=(S.flags['px_'+p.id]||0)+1;if(S.flags['px_'+p.id]%2===0&&!festival()){await say(p.name+': '+PRIEST_EXTRA[p.id]);return;}}
  if(p.priest){const f=festival();if(f&&!S.flags['fest'+dayNum()+p.town]){S.flags['fest'+dayNum()+p.town]=1;addItem(f.gift,1);await say(p.name+': Blessings of the '+f.name+', held in honour of '+f.cr+'! '+f.txt+' Please accept this '+f.gift+'.');return;}
   if(p.id==='p5'&&st>=3){addClue('ansel');await sayAll([p.name+': I left the Calling the day they struck Aldric\'s name from the book. A name once written is not easily unwritten.',p.name+': Find him. The Father will want all ten - even the one who tried to break the world.']);return;}}
  if(p.quest&&await questTalk(p))return;
  let line=p.talk[0][1];for(const [s,t] of p.talk)if(st>=s)line=t;
  if(!p.priest&&!p.quest&&p.town>=0&&PEOPLE.filter(q=>q.town===p.town&&!q.priest&&!q.quest)[0]===p){S.flags['rum_'+p.id]=(S.flags['rum_'+p.id]||0)+1;if(S.flags['rum_'+p.id]%2===0)line+=' ...Oh, and a strange thing: '+RUMORS[p.town];}
  const h=hour();if(h>=21||h<6){if(npcPlace(p).map!=='world')line='('+p.name+' is getting ready for bed.) '+line;}
  await say(p.name+': '+line);await relDaily(p,e);await relMenu(p,e);return;}
 if(e.kind==='trainer')return trainerTalk(e.ref,e);
 if(e.kind==='gate'){const g=e.ref,i=e.i;const need=g.need;if(need==='champ'){if(S.flags.champ){await say('The Concord\'s seal recognises its Champion. The road to the Hollow Crown opens.');S.flags['gate'+i]=1;autosave();}else await say('Concord Warden: The road to the Hollow Crown and the Eighth Door is closed to all but the Champion of the Concord.');return;}const ok=medalCount()>=need&&(need<6||S.beaten.syn5);
  if(ok){await say('Guard: You carry '+need+' medal'+(need>1?'s':'')+'. The road ahead is open - stay safe!');S.flags['gate'+i]=1;autosave();}
  else await say('Guard: The road beyond is closed because of Follower activity. Earn the '+GYMS[need-1].medal+' from '+TOWNS[GYMS[need-1].town].name+' Gym first'+(need===6?' and stop the Monk':'')+'.');return;}
 if(e.kind==='legend'&&e.ref.boss)return legrantaEvent(e.ref);
 if(e.kind==='legend'&&e.ref.lair)return lairEvent(e.ref);
 if(e.kind==='legend'){const l=e.ref;await say('A tremendous presence... '+l.sp+' stirs!');if(!alive(S.party).length){await say('Your team is too exhausted to face it.');return;}
  const r=await wildBattle(mkMon(l.sp,l.lv),true);if(r==='catch'||r==='win'){S.flags['leg_'+l.sp]=1;if(r==='win')await say(l.sp+' vanished into the light... it may return in the future (re-enter the area).');}
  if(r==='win')S.flags['leg_'+l.sp]=0;autosave();return;}
 if(e.kind==='item'){const q=e.ref;S.flags['has_'+q.id]=1;await say('You found '+q.txt+'!'+(S.quests[q.q]?'':' Someone in town might be looking for it.'));return;}
 if(e.kind==='nurse'){const c=await choose('Nurse Mae: Welcome to the Healing Center!',['Heal my team','Use storage PC','Leave']);
  if(c===0){healAll();S.lastHeal={map:S.map,x:Math.floor(curMap().w/2),y:4};await say('Your monsters are fully healed! Come again.');autosave();}else if(c===1)await storageMenu();return;}
 if(e.kind==='clerk')return shopMenu();}
async function questTalk(p){const q=QUESTS[p.quest],qs=S.quests[p.quest];
 if(!qs){await say(p.name+': '+q.desc);const c=await choose('Accept "'+q.name+'"?',['Accept','Not now']);if(c===0){S.quests[p.quest]={st:'active',start:S.wildKO};if(q.type==='deliver')addItem(q.letter,1);await say('Quest accepted: '+q.name+' (see Quest Log).');}return true;}
 if(qs.st==='done')return false;
 let done=false;if(q.type==='item')done=!!S.flags['has_'+q.item];if(q.type==='hasType')done=S.party.some(m=>SPECIES[m.sp].types.includes(q.ptype));if(q.type==='defeat')done=S.wildKO-qs.start>=q.n;if(q.type==='deliver')done=!!S.flags.delivered;if(q.type==='trainer')done=!!S.beaten[q.trainer];
 if(!done){await say(p.name+': '+q.desc+(q.type==='defeat'?' ('+Math.min(q.n,S.wildKO-qs.start)+'/'+q.n+')':''));return true;}
 qs.st='done';if(q.type==='deliver')addItem(q.letter,-1);const rw=[];for(const k in q.reward.items){addItem(k,q.reward.items[k]);rw.push(q.reward.items[k]+'x '+k);}if(q.reward.money){S.money+=q.reward.money;rw.push(q.reward.money+' coins');}
 await sayAll([p.name+': You did it! Thank you so much!','Quest complete: '+q.name+'! Received '+rw.join(', ')+'.']);await relAdd(p.id,30,p.name,npcPlace(p));autosave();return true;}
async function trainerTalk(t,ent){const nm=fmt(t.name);
 if(S.beaten[t.id]){await say(nm+': '+fmt(t.post));const tp=trainerPerson(t);await relDaily(tp,ent);await relMenu(tp,ent);return;}
 if(t.needQuest&&!(S.quests[t.needQuest]&&S.quests[t.needQuest].st==='active')){await say(nm+': What are you looking at? Beat it.');return;}
 if(t.gym!==undefined&&t.gym>0&&!S.medals[t.gym-1]){await say(nm+': Come back once you hold the '+GYMS[t.gym-1].medal+' from '+TOWNS[GYMS[t.gym-1].town].name+'. Every challenger follows the Reach Road.');return;}
 if(t.gym!==undefined){if(!S.beaten['syn'+t.gym]){await say(nm+': The Hollow Choir are causing trouble in town! Deal with '+(t.gym===5?'Cantor Malrec in the bell-ruins plaza':'the Chanter outside my door')+' first.');return;}}
 if(t.elite!==undefined&&t.elite>0&&!S.beaten['elite'+(t.elite-1)]){await say(nm+': Defeat the previous Elite first.');return;}
 if(!alive(S.party).length){await say(nm+': You don\'t have any monsters that can fight!');return;}
 if(t.bio)S.met[t.bio]=1;if(t.gym!==undefined||t.elite!==undefined)S.met[t.name]=1;if(t.rival)S.met.rival=1;
 await say(nm+': '+fmt(t.pre));const r=await trainerBattle(t);
 if(r==='win'){S.beaten[t.id]=1;G.victoryUntil=performance.now()+7000;await say(nm+': '+fmt(t.post));if(!t.vanish)await relAdd(t.id,20,nm,ent||t);
  if(t.gym!==undefined){S.medals[t.gym]=true;await say('You received the '+GYMS[t.gym].medal+'! ('+medalCount()+'/6)');addItem('Super Potion',2);}
  if(t.id==='syn5')await sayAll(['Malrec dissolves into a chord of sound and is gone - north, toward the Hollow Crown.','Silas: Seven seals broken, he said. Only the Eighth Door is left. Win the Concord - the Warden only opens the road for its Champion.']);
  if(t.id==='rival0')S.flags.rivalMet=1;
  if(t.elite===4)await ending();
  autosave();}}

// ===== Battle =====
function bMon(m){return {m,stg:{atk:0,def:0,spa:0,spd:0,spe:0},sleep:0};}
function sm(v){return v>=0?(2+v)/2:2/(2-v);}
function eStat(b,k){let v=stats(b.m)[k]*sm(b.stg[k]||0);if(k==='spe'&&b.m.st==='para')v/=2;if(k==='atk'&&b.m.st==='burn')v/=2;return v;}
let BT=null;
function bRender(){if(!BT)return;const c=$('bcv'),x=c.getContext('2d');{const dpr=Math.min(3,window.devicePixelRatio||1),r=c.getBoundingClientRect(),bw=Math.max(320,Math.round((r.width||320)*dpr)),bh=Math.round(bw*0.75);if(c.width!==bw||c.height!==bh){c.width=bw;c.height=bh;}x.setTransform(bw/320,0,0,bh/240,0,0);if(window.MFX){const [a,b]=MFX.shakeOff();x.translate(a,b);}}x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
 const g=x.createLinearGradient(0,0,0,240);g.addColorStop(0,BT.bg[0]);g.addColorStop(1,BT.bg[1]);x.fillStyle=g;x.fillRect(0,0,320,240);
 x.fillStyle='rgba(0,0,0,.15)';x.beginPath();x.ellipse(230,95,60,14,0,0,7);x.fill();x.beginPath();x.ellipse(90,180,70,16,0,0,7);x.fill();
 if(ART[BT.e.m.sp]){const A=ART[BT.e.m.sp];if(artOk(BT.e.m.sp)&&!A.cut){x.globalAlpha=0.55;const im=A.img;x.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,0,0,240*im.naturalWidth/im.naturalHeight,240);x.globalAlpha=1;}else{const g2=x.createLinearGradient(0,0,0,240);g2.addColorStop(0,A.pal.bg[0]);g2.addColorStop(1,A.pal.bg[1]);x.fillStyle=g2;x.fillRect(0,0,320,240);}}
 drawBMon(x,'e');drawBMon(x,'p');if(window.MFX)MFX.draw(x);
 const box=(el,b,show)=>{const st=stats(b.m);el.innerHTML='<b>'+esc(mname(b.m))+'</b> Lv'+b.m.lv+(b.m.st?' <span class="stt">'+b.m.st.toUpperCase()+'</span>':'')+'<div class="hpbar"><div style="width:'+Math.max(0,100*b.m.hp/st.hp)+'%;background:'+(b.m.hp/st.hp>.5?'#4c4':b.m.hp/st.hp>.2?'#ec3':'#e44')+'"></div></div>'+(show?'<small>'+b.m.hp+'/'+st.hp+' HP</small>':'');};
 box($('ebox'),BT.e,false);box($('pbox'),BT.p,true);}
function drawBMon(x,side){const b=side==='e'?BT.e:BT.p;if(!b)return;const A=BT[side+'a']||{dx:0,dy:0,a:1,flash:0,sc:1};if(b.m.hp<=0&&!(A.dy>0&&A.a>0)&&!(side==='e'&&BT.showE))return;if(A.a<=0.01||A.sc<=0.01)return;
 const sp=b.m.sp,isE=side==='e';const cx=isE?230:90,cy=isE?(ART[sp]?92:70):150,size=isE?(ART[sp]?120:SPECIES[sp].legend?80:62):70;x.save();x.globalAlpha=A.a;x.translate(cx+A.dx,cy+A.dy+size*0.5);x.scale(A.sc,A.sc);x.translate(-cx,-cy-size*0.5);drawMon(x,sp,cx,cy,size,!isE);
 if(A.flash>0){x.globalCompositeOperation='lighter';x.globalAlpha=A.flash*0.6;drawMon(x,sp,cx,cy,size,!isE,{noAura:true});}x.restore();}
function bgFor(){const t=tileAt(S.map,S.x,S.y);if(S.map!=='world')return ['#140c12','#4a3024'];if(t===T.CAVE)return ['#0c080a','#3a2a22'];if(t===T.SNOW||t===T.SNOWTALL)return ['#141e36','#7a90b8'];if(t===T.SAND)return ['#06202e','#8a7448'];const r=window.WS?WS.region(S.x,S.y):'leaf';return {ember:['#1a0606','#6a2414'],dusk:['#0c0618','#3a2458'],coast:['#04161c','#1c5a50'],gale:['#10141a','#5a6a2a'],crimson:['#140204','#4a0a10'],summit:['#0e0c14','#3a4a30']}[r]||['#081210','#2c5222'];}
async function wildBattle(wm,legend){S.seen[wm.sp]=1;return runBattle({wild:true,enemy:[wm],legend});}
async function trainerBattle(t){const party=(typeof t.party==='string'?rivalParty(t.party):t.party).map(([s,l])=>mkMon(s,l));party.forEach(m=>S.seen[m.sp]=1);return runBattle({wild:false,enemy:party,t});}
async function runBattle(o){G.busy=true;const bel=$('battle');bel.style.display='block';
 const first=S.party.find(m=>m.hp>0);BT={o,p:bMon(first),e:bMon(o.enemy[0]),bg:bgFor(),parts:new Set([first.uid])};if(window.MFX){MFX.reset();MFX.entrance();}bRender();
 let result=null;
 try{
 if(o.boss)await say('The Creator Mandara draws her burning blade!');else await say(o.wild?(o.legend?'The legendary '+o.enemy[0].sp+' appeared!':'A wild '+o.enemy[0].sp+' appeared!'):fmt(o.t.cls+' '+o.t.name)+' wants to battle!');
 if(!o.wild&&!o.boss)await say(fmt(o.t.name)+' sent out '+o.enemy[0].sp+'!');
 await say('Go, '+mname(BT.p.m)+'!');
 while(!result){
  bRender();const a=await choose('What will '+mname(BT.p.m)+' do?',['Fight','Bag','Monsters','Run'],false,'bmenu');
  let pAct=null;
  if(a===0&&BT.p.m.moves.every(x=>x.pp<=0)){await say(mname(BT.p.m)+' has no PP left and struggles!');pAct={t:'move',mv:{n:'Tackle',pp:99}};}
  else if(a===0){const ms=BT.p.m.moves;const i=await choose('Choose a move',ms.map(x=>x.n+' ['+MOVES[x.n].type+'] '+(MOVES[x.n].pow||'-')+' PP'+x.pp),true,'bmenu moves');if(i<0)continue;if(ms[i].pp<=0){await say('No PP left for that move!');continue;}pAct={t:'move',mv:ms[i]};}
  else if(a===1){const r=await battleBag();if(!r)continue;if(r==='caught'){result='catch';break;}pAct={t:'item'};}
  else if(a===2){const r=await switchMenu(false);if(!r)continue;pAct={t:'switch'};}
  else if(a===3){if(!o.wild){await say('You can\'t run from a trainer battle!');continue;}if(o.legend&&Math.random()<0.3){await say('Could not escape!');pAct={t:'none'};}else if(Math.random()<0.9||eStat(BT.p,'spe')>eStat(BT.e,'spe')){await say('Got away safely!');result='run';break;}else{await say('Could not escape!');pAct={t:'none'};}}
  // enemy action
  const eMv=pickEnemyMove();
  const order=[];if(pAct.t==='move'){const pf=eStat(BT.p,'spe')>=eStat(BT.e,'spe')||pAct.mv.n==='Quick Jab';if(pf)order.push(['p',pAct.mv],['e',eMv]);else order.push(['e',eMv],['p',pAct.mv]);}else order.push(['e',eMv]);
  for(const [who,mv] of order){const A=who==='p'?BT.p:BT.e,D=who==='p'?BT.e:BT.p;if(A.m.hp<=0||D.m.hp<=0)continue;await doMove(A,D,mv,who==='e');bRender();
   const r=await checkFaints();if(r){result=r;break;}}
  if(result)break;
  // end of turn status
  for(const b of [BT.p,BT.e]){if(b.m.hp>0&&(b.m.st==='burn'||b.m.st==='poison')){const d=Math.max(1,Math.floor(stats(b.m).hp/(b.m.st==='burn'?16:8)));b.m.hp=Math.max(0,b.m.hp-d);bRender();await say(mname(b.m)+' is hurt by its '+(b.m.st==='burn'?'burn':'poison')+'!');}}
  const r2=await checkFaints();if(r2)result=r2;
 }
 if(result==='lose'){await sayAll(['You have no monsters left to fight!','You hurried back to safety, dropping some coins...']);S.money=Math.floor(S.money/2);healAll();const lh=S.lastHeal;S.map=lh.map;S.x=lh.x;S.y=lh.y;G.dir='up';}
 if(result==='win'&&!o.wild){const mny=o.t.money||100;S.money+=mny;await say('You won! Got '+mny+' coins.');}
 for(const m of S.party){const f=checkEvo(m);if(f){await say('What? '+f+' is evolving!');await say(f+' evolved into '+m.sp+'!');}}
 }finally{bel.style.display='none';BT=null;G.busy=false;S.party.forEach(m=>{if(m.hp<0)m.hp=0;});autosave();}
 return result;}
function pickEnemyMove(){const ms=BT.e.m.moves;let best=ms[0],bs=-1;for(const mv of ms){const M=MOVES[mv.n];let sc=M.pow?M.pow*eff(M.type,SPECIES[BT.p.m.sp].types)*(SPECIES[BT.e.m.sp].types.includes(M.type)?1.5:1):(BT.p.m.st||M.eff==='def+'||M.eff==='spa+'||M.eff==='spe+'?10:45);sc*=0.7+Math.random()*0.6;if(sc>bs){bs=sc;best=mv;}}return best;}
async function doMove(A,D,mv,isE){const M=MOVES[mv.n];const an=(isE&&!BT.o.wild?'Foe ':isE?'Wild ':'')+mname(A.m);
 if(A.m.st==='sleep'){if(A.sleep>0){A.sleep--;await say(an+' is fast asleep.');return;}A.m.st=null;await say(an+' woke up!');}
 if(A.m.st==='para'&&Math.random()<0.25){await say(an+' is paralyzed and can\'t move!');return;}
 if(!isE)mv.pp=Math.max(0,mv.pp-1);
 await say(an+' used '+mv.n+'!');
 if(Math.random()*100>=M.acc){await say('But it missed!');return;}
 if(M.cat==='x'&&window.MFX)await MFX.move(isE,mv.n,M.type,true,A.m.sp);
 if(M.cat==='x'){const ef=M.eff;if(ef.endsWith('S')){if(D.m.st){await say('But it failed!');return;}const st=ef.slice(0,-1);if(st==='para'&&SPECIES[D.m.sp].types.includes('Stone')){await say('It doesn\'t affect '+mname(D.m)+'...');return;}D.m.st=st;if(st==='sleep')D.sleep=ri(1,3);await say(mname(D.m)+' is now '+{burn:'burned',poison:'poisoned',para:'paralyzed',sleep:'asleep'}[st]+'!');return;}
  const k=ef.slice(0,3),up=ef.endsWith('+');const tgt=up?A:D;tgt.stg[k]=clamp((tgt.stg[k]||0)+(up?1:-1),-6,6);await say(mname(tgt.m)+'\'s '+{atk:'Attack',def:'Defense',spa:'Sp. Atk',spd:'Sp. Def',spe:'Speed'}[k]+(up?' rose!':' fell!'));return;}
 if(window.MFX)await MFX.move(isE,mv.n,M.type,false,A.m.sp);
 const phys=M.cat==='p';const at=eStat(A,phys?'atk':'spa'),df=eStat(D,phys?'def':'spd');
 const e=eff(M.type,SPECIES[D.m.sp].types);const stab=SPECIES[A.m.sp].types.includes(M.type)?1.5:1;const crit=Math.random()<0.0625?1.5:1;
 let dmg=Math.floor(((2*A.m.lv/5+2)*M.pow*at/df/50+2)*stab*e*crit*(0.85+Math.random()*0.15));if(e>0)dmg=Math.max(1,dmg);
 D.m.hp=Math.max(0,D.m.hp-dmg);bRender();flash(isE?'pbox':'ebox');if(window.MFX&&e>0)await MFX.hit(isE,dmg,crit>1,e);
 if(crit>1&&e>0)await say('A critical hit!');if(e>1)await say('It\'s super effective!');else if(e===0)await say('It doesn\'t affect '+mname(D.m)+'...');else if(e<1)await say('It\'s not very effective...');
 if(M.eff==='drain'&&dmg>0){A.m.hp=Math.min(stats(A.m).hp,A.m.hp+Math.ceil(dmg/2));bRender();await say(mname(D.m)+' had its energy drained!');}
 if(D.m.hp>0&&!D.m.st&&['burn','para'].includes(M.eff)&&Math.random()<0.15){D.m.st=M.eff;await say(mname(D.m)+' is '+(M.eff==='burn'?'burned':'paralyzed')+'!');}}
function flash(id){const el=$(id);el.classList.add('hit');setTimeout(()=>el.classList.remove('hit'),300);}
async function checkFaints(){const o=BT.o;
 if(BT.e.m.hp<=0){if(window.MFX)await MFX.faint('e');await say((o.wild?'Wild ':'Foe ')+BT.e.m.sp+' fainted!');
  if(o.wild)S.wildKO++;
  const base=SPECIES[BT.e.m.sp].base.reduce((a,b)=>a+b,0);const xp=Math.max(1,Math.floor(base/6*BT.e.m.lv/5*(o.wild?1:1.5)));
  const parts=S.party.filter(m=>BT.parts.has(m.uid)&&m.hp>0);for(const m of parts){const msgs=gainXP(m,Math.ceil(xp/parts.length));for(const t of msgs)await say(t);}bRender();
  const next=o.enemy.find(m=>m.hp>0);if(!next)return 'win';BT.e=bMon(next);if(window.MFX){MFX.restore('e');MFX.sendOut('e');}await say(fmt(o.t.name)+' sent out '+next.sp+'!');bRender();}
 if(BT.p.m.hp<=0){if(window.MFX)await MFX.faint('p');await say(mname(BT.p.m)+' fainted!');if(!alive(S.party).length)return 'lose';await switchMenu(true);bRender();}
 return null;}
async function switchMenu(forced){while(true){const opts=S.party.map(m=>mname(m)+' Lv'+m.lv+' '+m.hp+'/'+stats(m).hp+(m===BT.p.m?' (in battle)':''));
 const i=await choose(forced?'Choose the next monster':'Switch to which monster?',opts,!forced);if(i<0)return false;const m=S.party[i];
 if(m.weak){await say(mname(m)+' is too weak to fight. She is still recovering from the rewrite.');continue;}if(m.hp<=0){await say(mname(m)+' has no energy left to fight!');continue;}if(m===BT.p.m){await say(mname(m)+' is already in battle!');continue;}
 BT.p=bMon(m);BT.parts.add(m.uid);if(window.MFX){MFX.restore('p');MFX.sendOut('p');}await say('Go, '+mname(m)+'!');bRender();return true;}}
async function battleBag(){const names=Object.keys(S.bag).filter(n=>ITEMS[n]&&!ITEMS[n].gift);if(!names.length){await say('Your bag is empty!');return false;}
 const i=await choose('Use which item?',names.map(n=>n+' x'+S.bag[n]));if(i<0)return false;const n=names[i],it=ITEMS[n];
 if(it.ball){if(!BT.o.wild){await say('The trainer blocked the orb! Don\'t be a thief!');return false;}addItem(n,-1);return await tryCatch(it.ball,n);}
 const r=await useItemOn(n);return r;}
async function tryCatch(ball,n){const e=BT.e.m,st=stats(e);await say('You threw a '+n+'!');if(window.MFX)await MFX.throwOrb();
 let ok;if(ball>=255)ok=true;else{const sb=e.st==='sleep'?2:e.st?1.5:1;const a=(3*st.hp-2*e.hp)*SPECIES[e.sp].catch*ball*sb/(3*st.hp);ok=Math.random()*255<Math.max(1,a);}
 const shakes=ok?3:ri(0,2);for(let k=0;k<shakes;k++){if(window.MFX)await MFX.wobble();await say('...shake...');}
 if(!ok){if(window.MFX)await MFX.breakFree();await say(['Oh no! It broke free!','Argh! Almost had it!','Aww! It appeared to be caught!'][shakes]);return 'used';}
 if(window.MFX)await MFX.caught();await say('Gotcha! '+e.sp+' was caught!');e.st=null;const where=addMon(e);if(where==='box')await say(e.sp+' was sent to the Storage Box.');
 if(SPECIES[e.sp].legend)S.flags['leg_'+e.sp]=1;return 'caught';}
async function useItemOn(n){const it=ITEMS[n];if(it.gift){await say(n+' is a gift. Talk to someone and choose "Give a gift".');return false;}if(it.ball){await say('You can only use that in a wild battle.');return false;}
 const i=await choose('Use '+n+' on which monster?',S.party.map(m=>mname(m)+' '+m.hp+'/'+stats(m).hp+(m.st?' '+m.st:'')));if(i<0)return false;const m=S.party[i],st=stats(m);
 if(it.revive){if(m.hp>0){await say('It won\'t have any effect.');return false;}m.hp=Math.floor(st.hp/2);}
 else if(it.heal){if(m.hp<=0||m.hp>=st.hp){await say('It won\'t have any effect.');return false;}m.hp=Math.min(st.hp,m.hp+it.heal);}
 else if(it.cure){if(!m.st){await say('It won\'t have any effect.');return false;}m.st=null;}
 else if(it.candy){if(m.lv>=100){await say('It won\'t have any effect.');return false;}addItem(n,-1);const msgs=gainXP(m,(m.lv+1)**3-m.xp);for(const t of msgs.slice(1))await say(t);const f=checkEvo(m);if(f)await say(f+' evolved into '+m.sp+'!');return 'used';}
 addItem(n,-1);await say(mname(m)+' was helped by the '+n+'.');if(BT)bRender();return 'used';}

// ===== Shop / storage =====
async function shopMenu(){const md=medalCount();const stock=['Potion','Snare Orb','Full Heal'];if(md>=1)stock.push('Super Potion','Great Orb');if(md>=3)stock.push('Ultra Orb','Revive');if(md>=5)stock.push('Max Potion');stock.push(GIFTS[curMap().town]||'Salt Pearl','Honey Bread');
 while(true){const i=await choose('Clerk: What would you like? (Coins: '+S.money+')',stock.map(n=>n+' - '+ITEMS[n].price+'c').concat(['Leave']));if(i<0||i===stock.length)return;
  const n=stock[i];const q=await choose('How many '+n+'?',['1','5','10']);if(q<0)continue;const qty=[1,5,10][q];const cost=ITEMS[n].price*qty;
  if(S.money<cost){await say('You don\'t have enough coins.');continue;}S.money-=cost;addItem(n,qty);await say('Bought '+qty+'x '+n+'! Thank you!');}}
async function storageMenu(){while(true){const c=await choose('Storage PC  (Party '+S.party.length+'/6, Box '+S.box.length+')',['Deposit','Withdraw','Trainer Editor','Log off']);
 if(c<0||c===3)return;
 if(c===0){if(S.party.length<=1){await say('You can\'t deposit your last monster!');continue;}const i=await choose('Deposit which?',S.party.map(m=>mname(m)+' Lv'+m.lv));if(i<0)continue;const m=S.party.splice(i,1)[0];S.box.push(m);await say(mname(m)+' was stored in the Box.');}
 if(c===1){if(!S.box.length){await say('The Box is empty.');continue;}if(S.party.length>=6){await say('Your party is full!');continue;}const i=await choose('Withdraw which?',S.box.map(m=>mname(m)+' Lv'+m.lv));if(i<0)continue;const m=S.box.splice(i,1)[0];S.party.push(m);await say(mname(m)+' joined your party.');}
 if(c===2)await editorMenu();}}

// ===== Menus =====
async function openMenu(){G.busy=true;try{while(true){let c=await choose(null,['Monsters','Bag','Monsterdex','People','Quest Log','Trainer Card','Trainer Editor','Scripture','Save','Save Backup','Help',(window.AMB?AMB.label():'Effects'),'Sound','Close'],true,'mainmenu');
 if(c<0||c===13)break;if(c===12){await soundMenu();continue;}if(c===11){if(window.AMB){AMB.toggle();document.body.classList.toggle('fxlow',AMB.reduced);toast(AMB.label());}continue;}
 if(c===7){await waitScreen('<h2>'+(S.flags.rewrite&&!S.flags.finale?'The Rewritten Scripture':'The Book of the Three')+'</h2>'+(S.flags.rewrite&&!S.flags.finale?SCRIPTURE.rewritten.map(v=>'<p class="rewritten">'+esc(v)+'</p>').join(''):((S.scripture||[]).length?S.scripture.map(i=>'<p>'+esc(verseText(i))+'</p>').join(''):'<p>Read the altars in each Temple of the Three to collect verses.</p>'))+(!S.flags.finale&&knowerCount()?'<h2>Fragments of the true text</h2>'+SCRIPTURE.fragments.slice(0,knowerCount()).map(f=>'<p><i>'+esc(f)+'</i></p>').join(''):'')+'<p class="hint">The Triune Faith honours Mancaco (Light &amp; Heaven), Mantermo (Water &amp; Air) and Mandara (Dark &amp; Fire). Festivals: Ember Vigil (day 3 of each week), Dawnlight Feast (day 5), Tide &amp; Gale Regatta (day 7). The Calling keep the Silent Book; the Hollow Choir are its heretics.</p>');continue;}
 if(c>7)c--;
 if(c===0)await partyScreen();if(c===1)await bagScreen();if(c===2)await dexScreen();if(c===3)await peopleScreen();if(c===4)await questScreen();if(c===5)await cardScreen();if(c===6)await editorMenu();
 if(c===7){saveGame();await say('Game saved!');}if(c===8)await backupMenu();if(c===9)await helpScreen();}}finally{G.busy=false;}}
function waitScreen(html,cls){return new Promise(r=>{const L=screen(html+'<button class="opt back">Back</button>',r,cls);L.el.querySelector('.back').onclick=()=>L.onB();});}
function monSummary(m){const st=stats(m),s=SPECIES[m.sp];return '<div class="mrow"><span class="spr" data-sp="'+m.sp+'"></span><div><b>'+esc(mname(m))+'</b> ('+m.sp+') Lv '+m.lv+' &nbsp;'+s.types.map(t=>'<span class="ty" style="background:'+TCOL[t]+'">'+t+'</span>').join('')+'<br>HP '+m.hp+'/'+st.hp+(m.st?' ['+m.st+']':'')+' | Atk '+st.atk+' Def '+st.def+' SpA '+st.spa+' SpD '+st.spd+' Spe '+st.spe+(m.ov?' <i>(custom)</i>':'')+'<br>XP '+m.xp+' / next '+(m.lv<100?(m.lv+1)**3:'MAX')+'<br>Moves: '+m.moves.map(x=>x.n+' ('+x.pp+')').join(', ')+'</div></div>';}
function paintSprites(root){root.querySelectorAll('.spr').forEach(s=>{if(!s.firstChild)s.appendChild(monCanvas(s.dataset.sp,48));});}
async function partyScreen(){while(true){const i=await choose('Party',S.party.map(m=>mname(m)+'  Lv'+m.lv+'  '+m.hp+'/'+stats(m).hp));if(i<0)return;const m=S.party[i];
 const c=await choose(mname(m),['Summary','Move to top','Nickname','Use item','Back']);
 if(c===0){const p=waitScreen('<h2>Summary</h2>'+monSummary(m));paintSprites($('ui'));await p;}
 if(c===1){S.party.splice(i,1);S.party.unshift(m);}
 if(c===2){m.nick=await promptName('Nickname for '+m.sp,mname(m));}
 if(c===3){const names=Object.keys(S.bag).filter(n=>ITEMS[n]&&!ITEMS[n].ball);if(!names.length){await say('No usable items.');continue;}const k=await choose('Use which item?',names.map(n=>n+' x'+S.bag[n]));if(k>=0){const n=names[k];const it=ITEMS[n];const idx=S.party.indexOf(m);/* reuse */const r=await useItemOn(n);}}}}
async function bagScreen(){while(true){const names=Object.keys(S.bag);if(!names.length){await say('Your bag is empty.');return;}
 const i=await choose('Bag (Coins: '+S.money+')',names.map(n=>n+' x'+S.bag[n]));if(i<0)return;const n=names[i];if(!ITEMS[n]){await say(n+': A key item for a quest.');continue;}
 await say(n+': '+ITEMS[n].desc);if(!ITEMS[n].ball){const c=await choose('Use '+n+'?',['Use','Cancel']);if(c===0)await useItemOn(n);}}}
function whereFound(sp){const out=[];for(const k in ZONES)if(ZONES[k].sp.includes(sp))out.push(ZONES[k].name);const l=LEGENDS.find(x=>x.sp===sp);if(l)out.push(SPECIES[sp].habitat+' (one of a kind)');if(['Pyrrix','Torrentail','Galeon','Mandara'].includes(sp))out.push('Brought from your home island');if(!out.length){const line=evoLine(sp);if(line.indexOf(sp)>0)out.push('Evolve '+line[line.indexOf(sp)-1]);}return out.join('; ')||'Unknown';}
async function dexScreen(){const seen=Object.keys(S.seen).length,caught=Object.keys(S.caught).length;
 while(true){const i=await choose('Monsterdex  Seen '+seen+' / Caught '+caught+' / '+SPLIST.length,SPLIST.map(s=>'#'+String(s.id).padStart(2,'0')+' '+(S.seen[s.name]?s.name:'?????')+(S.caught[s.name]?' *':'')),true,'tall');if(i<0)return;
  const s=SPLIST[i];if(!S.seen[s.name]){await say('No data. Encounter this monster first.');continue;}const full=S.caught[s.name];
  const h='<h2>#'+s.id+' '+s.name+'</h2><div class="mrow"><span class="spr big" data-sp="'+s.name+'"></span><div>Type: '+s.types.map(t=>'<span class="ty" style="background:'+TCOL[t]+'">'+t+'</span>').join('')+'<br>Height: '+s.h+' m &nbsp; Weight: '+s.w+' kg<br>Ability: '+s.ability+'<br>Habitat: '+s.habitat+'<br>Evolution: '+evoLine(s.name).map((n,j,a)=>n+(SPECIES[n].evo?' (Lv'+SPECIES[n].evo.lv+') &rarr; ':'')).join('')+'<br>Where found: '+esc(whereFound(s.name))+'</div></div><p>'+(full?esc(s.lore):'<i>Catch it to unlock full lore.</i>')+'</p>'+(full&&FOOTNOTES[s.name]?'<p class="hint">'+esc(FOOTNOTES[s.name])+'</p>':'')+(ART[s.name]?(artOk(s.name)?'<img class="dexart"'+(ART[s.name].cut?' style="background:linear-gradient('+ART[s.name].pal.bg[0]+','+ART[s.name].pal.bg[1]+')"':'')+' src="'+ART[s.name].src+'" alt="'+s.name+'">':'<span class="spr big" data-sp="'+s.name+'"></span>'):'')+(full?'<p>Base stats: '+['HP','Atk','Def','SpA','SpD','Spe'].map((k,j)=>k+' '+s.base[j]).join(' / ')+'</p>':'');
  const p=waitScreen(h);paintSprites($('ui'));await p;}}
function schedText(p){return p.sched.map(e=>String(e[0]).padStart(2,'0')+':00 - '+(e[1]==='world'?(townAt(e[2],e[3])||{name:'outdoors'}).name+' (outdoors)':MAPS[e[1]].name)).join('<br>');}
async function peopleScreen(){const list=[];for(const p of PEOPLE)if(S.met[p.id])list.push({id:p.id,n:p.name,age:p.age,job:p.job,pers:p.pers,back:window.MATURE?MATURE.back(p):p.back,sch:schedText(p),p});
 for(const t of TRAINERS)if(S.rel&&S.rel[t.id]&&!PEOPLE_BY_ID[t.id]&&!BIOS[t.name])list.push({id:t.id,n:fmt(t.name),age:'?',job:t.cls,pers:'Competitive',back:'A trainer you have battled.',sch:'At their post.',p:trainerPerson(t)});
 for(const k in BIOS)if(S.met[k]){const b=BIOS[k];{const tt=TRAINERS.find(t=>t.name===k||(k==='rival'&&t.rival&&t.id==='rival1'));list.push({id:tt&&tt.id,p:tt&&trainerPerson(tt),n:k==='rival'?S.rival:k==='monk'?'The Monk':k,age:b.age,job:b.job,pers:b.pers,back:b.back,sch:k==='rival'?'Always on the road ahead of you.':'At their post.'});}}
 if(!list.length){await say('You haven\'t met anyone yet.');return;}
 while(true){const i=await choose('People Journal ('+list.length+' met)',list.map(x=>x.n+' - '+x.job+(x.id?' ['+relName(x.id)+']':'')),true,'tall');if(i<0)return;const x=list[i];
  await waitScreen('<h2>'+esc(x.n)+'</h2><p>Age: '+x.age+'<br>Job: '+esc(x.job)+'<br>Personality: '+esc(x.pers)+'</p><p>'+esc(x.back)+'</p>'+(x.id?'<p><b>Friendship:</b> '+esc(relBar(x.id))+'<br>'+(relLv(x.id)>=1&&x.p?'Likes: '+esc(x.p.likes.join(', '))+(relLv(x.id)>=2?' - Dislikes: '+esc(x.p.dislikes.join(', ')):''):'Likes: ? (get to know them better)')+'</p>':'')+'<p><b>Schedule</b><br>'+x.sch+'</p>');}}
async function questScreen(){const rows=Object.keys(QUESTS).map(id=>{const q=QUESTS[id],s=S.quests[id];return '<div class="q '+(s?s.st:'none')+'"><b>'+q.name+'</b> - '+TOWNS[q.town].name+' ['+(s?s.st==='done'?'COMPLETE':'ACTIVE':'not started')+']<br>'+(s?esc(q.desc):'Talk to '+PEOPLE_BY_ID[q.giver].name+' in '+TOWNS[q.town].name+'.')+(s&&q.type==='defeat'&&s.st==='active'?' ('+Math.min(q.n,S.wildKO-s.start)+'/'+q.n+')':'')+'</div>';}).join('');
 await waitScreen('<h2>Quest Log</h2>'+rows+'<p><b>Main story:</b> '+mainObjective()+'</p><p><b>Ancient clues:</b> '+clueCount()+' / '+CLUE_TOTAL+(S.flags.legrantaSecret?' - the eighth door is open.':' (temple murals in every town, old scripture fragments, an elder\'s whisper, a sealed door...)')+'</p>');}
async function helpScreen(){await waitScreen('<h2>Controls</h2><p><b>Move:</b> Arrow keys / WASD (or touch D-pad)<br><b>Confirm / Talk / Interact:</b> Z or Enter or Space (touch A)<br><b>Back / Menu:</b> X or Esc (touch B); M also opens the menu<br>Walk into doors to enter buildings; step on the red mat to leave.<br>Tall grass and caves have wild monsters.<br>Talk to the nurse in Healing Centers (red roofs) to heal; Markets (blue roofs) sell items; PC = storage &amp; Trainer Editor.<br>Gyms have purple roofs. The game autosaves on map change, after battles and every 30 seconds.</p><p><b>Clock:</b> 1 real second = 1 in-game minute. People go to work by day and home at night.</p>');}

// ===== Trainer Editor =====
async function editorMenu(){while(true){const all=S.party.map((m,i)=>({m,where:'Party'})).concat(S.box.map(m=>({m,where:'Box'})));
 const i=await choose('Trainer Editor - choose a monster',all.map(x=>'['+x.where+'] '+mname(x.m)+' Lv'+x.m.lv));if(i<0)return;await editMon(all[i].m);}}
function editMon(m){return new Promise(res=>{const st=stats(m);const K=['hp','atk','def','spa','spd','spe'],LB={hp:'HP',atk:'Atk',def:'Def',spa:'SpA',spd:'SpD',spe:'Spe'};
 const html='<h2>Trainer Editor</h2><div class="mrow"><span class="spr" data-sp="'+m.sp+'"></span><div><b>'+esc(mname(m))+'</b> ('+m.sp+')</div></div><div class="edgrid"><label>Level (1-100)<input class="opt" type="number" min="1" max="100" id="ed_lv" value="'+m.lv+'"></label>'+K.map(k=>'<label>'+LB[k]+'<input class="opt" type="number" min="1" max="999" id="ed_'+k+'" value="'+st[k]+'"></label>').join('')+'</div><label class="chk"><input type="checkbox" id="ed_auto"> Auto-calculate stats from level</label><br><button class="opt" id="ed_apply">Apply</button><button class="opt" id="ed_reset">Reset to normal stats</button><button class="opt" id="ed_back">Back</button><p class="hint" id="ed_msg">Moves and evolution update automatically. Normal XP training continues from the new level.</p>';
 const L=screen(html,()=>res());paintSprites(L.el);const q=s=>L.el.querySelector(s);
 q('#ed_back').onclick=()=>L.onB();
 q('#ed_reset').onclick=()=>{m.ov=null;applyLevel(m,m.lv);q('#ed_msg').textContent='Stats reset to formula values.';refresh();};
 q('#ed_apply').onclick=()=>{const lv=clamp(parseInt(q('#ed_lv').value)||1,1,100);const vals={};let bad=false;for(const k of K){const v=parseInt(q('#ed_'+k).value);if(!(v>=1&&v<=999))bad=true;vals[k]=clamp(v||1,1,999);}
  const oldLv=m.lv,changedLv=lv!==oldLv;const oldSt=stats(m);applyLevel(m,lv);
  const auto=q('#ed_auto').checked;const statsEdited=K.some(k=>vals[k]!==oldSt[k]);
  if(auto||(!statsEdited&&changedLv&&!m.ov))m.ov=null;else m.ov=vals;
  m.hp=stats(m).hp;m.st=null;markCaught(m.sp);q('#ed_msg').textContent='Applied! Now '+m.sp+' Lv'+m.lv+'. Moves: '+m.moves.map(x=>x.n).join(', ')+(bad?' (some values clamped to 1-999)':'');refresh();autosave();};
 function refresh(){const s2=stats(m);q('#ed_lv').value=m.lv;K.forEach(k=>q('#ed_'+k).value=s2[k]);const sp=L.el.querySelector('.spr');sp.dataset.sp=m.sp;sp.innerHTML='';paintSprites(L.el);L.el.querySelector('.mrow b').nextSibling.textContent=' ('+m.sp+')';}
});}
function applyLevel(m,lv){m.lv=lv;m.xp=lv**3;const ns=speciesForLevel(m.sp,lv);m.sp=ns;setMovesForLevel(m);}
window.applyLevel=applyLevel;

// ===== The nine knowers (main quest) =====
const KNOWERS={
 seren:['(Seren touches three fingers to the brow, then raises one to the sky.)','So you woke too. Good. I told you to sleep - I did not know he would answer while you slept.','I am Seren, of the Calling. Ten of us knew his name: you, me, and eight more. Thessaly, Fenwick, Corwin, Wendeline, Moira, Fenna, Quill... and Aldric. Yes. The Monk.','This is Elderreach. He has been gone two hundred billion years, and he has come back... changed. The Silent Book promised his face. That is not quite his face.','The Hollow Choir worship what stands on the horizon. They want our ten names spoken at the Eighth Door. Find the others before they do.','Brightwater is just north.'],
 fenwick:['Oh! Hello, friend! I woke inside a kiln. A COLD kiln, thankfully.','The bells here ring a fourth time each night. It is a heartbeat - slow, and hungry, like a stomach that has forgotten what full feels like.','The temples here have split. Half the priests now pray to the face on the horizon. The other half bar their doors. Nobody knows which half is right.'],
 corwin:['Heh. Come here, come here. Nell found me on the pier - she stowed away, the rascal.','I never told your father the ending of the story. Here it is: the Father loved one world best, and left his daughters there so it would never be alone.','So why does he look hungry? A father who missed his child does not look at her like that. He looks at this land like a man looks at bread.'],
 wendeline:['The winds here blow toward him, not from him. He is not breathing out. He is breathing in.','Mantermo is trapped in the void with Mancaco - I can feel the missing wind. Free them when you can.'],
 thessaly:['(smiling) There you are, dear. I knew you would come up the mountain.','Aldric was my student. I trained him, and I failed him. If he is here, I want to be there when you find him.','We taught that the Father MADE worlds out of love. The Silent Book only says he made them "the way a sea makes waves, without counting them." Without counting. Without meaning to.','Remember 2:3, child: call in ruin, and it comes in ruin. The Monk\'s Deep Rite called Mandara in ruin and cracked the seals. Through those cracks, he smelled us.'],
 moira:['You found me. Of course you did.','I hid the forbidden pages from Aldric - all but one. Here is one he never saw. Read it: "Every world he made, he made of himself. A little of him is in every stone and star."','He made trillions of worlds and never knew he was spending himself. Now he is thin, and he wants it back. He is not visiting his worlds, child. He is eating them.','And this one... Fenna and Quill have the rest. Go.'],
 fenna:['Hmph. Took you long enough. My herbs did not grow here, so I grew new ones.','Notice anything? Everything here grows too well. Too bright. Too alive. This world has more of him in it than it should.','Aldric wept among the pines, long ago. He said: "I only want someone to answer." Something answered. It was hungry.'],
 quill:['FOUR GATES! I told everyone! There were four gates!','The fourth gate shows the Father with his mouth open over a field of tiny worlds. The carving is labelled "the Devourer who does not know he made them". Someone knew, long ago.','And above it, three small figures pulling one bright world behind a curtain. Your sisters, @NAME. They hid us. The Eighth Door is in the Hollow Crown, north of the Concord Plaza.'],
 aldric:['...You. Of course it is you.','I broke your world to make him look. He looked. My Deep Rite cracked the seals, and he saw the brightest world he ever made, unhidden at last.','My wife. My two children. I wanted the Father to answer for them. Instead I rang the dinner bell for a god.','But under the hunger, he is still in there. I have heard him at night, very faintly, weeping for daughters he cannot remember. Let me come with you to the Door. Let me call him once with a clean heart.']};
async function knowerTalk(p,e){const id=p.id;S.knowers=S.knowers||{};const first=!S.knowers[id];
 if(first){S.knowers[id]=1;S.met[id]=1;await sayAll(KNOWERS[id].map(x=>p.name+': '+fmt(x)));toast('Knower found ('+knowerCount()+'/9)');{const n=knowerCount();if(n===1)await say('(The hooded words come back to you: "'+SCRIPTURE.spoken+'")');await say('A fragment of the true text ('+n+'/9): "'+SCRIPTURE.fragments[n-1]+'"');}if(window.SFX)SFX.play('heal');await say('Knower found: '+p.name+' ('+knowerCount()+'/9). They will make their own way to the Sanctum when the time comes.');await relAdd(id,25,p.name,e);
  if(knowerCount()>=5&&!S.flags.heard)await midpointEvent();if(knowerCount()>=6&&!S.flags.rewrite)await rewriteEvent();else if(S.flags.rewrite===1&&knowerCount()>=7)await mandaraRecover();if(knowerCount()>=9)await sayAll(['All nine knowers are found. Ten names, together at last.','Mandara (from her orb): Then it is time. Win the Concord, @NAME - its Champion alone may walk the road to the Eighth Door.']);autosave();return;}
 await say(p.name+': '+fmt(S.flags.finale?'Have we met? You look at me as if we shared a secret.':S.flags.heard?'You heard him too. "Hear me, my creations." We are his creations. All of us.':KNOWERS[id][KNOWERS[id].length-1]));await relDaily(p,e);await relMenu(p,e);}
const RW_PRIEST=SCRIPTURE.priest[2];
const FG_LINES=['Lovely clear sky lately, isn\'t it? Feels like something was always up there. Silly.','The One above the Three? Never heard of him. The Three are the Three.','I had the strangest week. Can\'t remember a bit of it. Can you?','The temple bells only ring three times now. Was it ever four?'];
const RW_PRIEST_OLD=['The altar book rewrote itself while I was reading it aloud. The congregation saw. I cannot unsay what they saw.','Twenty years I taught that the Father left out of love. The page now says the Three hid us from him. Which of us lied - me, or the ink?','The new verses are signed with one letter. M. Mandara wrote our scripture. Then what did we worship?','Half my order calls the new words a heresy of the Hollow Choir. The other half are weeping. I am doing both.'];
const RW_FOLK=['My grandmother\'s prayer book changed in my hands. The letters glowed like coals and moved.','Did you see the temple books? They say the Three hid our whole world. Hid it from what?','The words went gold and crawled. I swear on - well. I don\'t know what to swear on now.','If the Three wrote the scripture to fool us, maybe they had a reason. That\'s what scares me.'];
// 6th knower: the scripture rewrites itself and Mandara collapses
const REWRITE_LINES=['The page in your pack grows warm. Then every word on it starts to move.','Letters slide apart and rejoin. Lines you have read a hundred times turn into lines you have never seen.','Far away, every temple bell rings at once with no hand on the rope.'];
const MANDARA_FAINT=['Mandara (from her orb): No... not yet. Not the old ink...','Mandara staggers out of her orb and falls. Her flames sink to embers.','Mandara: Forgive me, @NAME. I wrote those words. Long ago, before the first temple. I changed the books.','Mandara: My sisters and I took this world and hid it from our father. We spent ourselves on seven seals, and to keep the seals strong we had to forget his face.','Mandara: I rewrote the scripture so no one here would call to him. A world that does not call cannot be found. That is why your priests say he was gone.','Mandara: Every knower you find is one more voice that remembers. The seal is breaking, and the ink is going back to the truth. It takes my strength with it...','Mandara: There is more. I can almost reach it... something about why we hid THIS world, and not the others...','Mandara is too weak to fight. She will rest in her orb until her strength returns.'];
const MANDARA_RECOVER=['Mandara\'s orb glows warm again. She steps out, unsteady but standing.','Mandara: I remember now. Father never meant to make anything. Every world he made was a piece of himself, spilled. Trillions of them.','Mandara: When he began to take them back, we saw this world had more of him in it than any other. His greatest prize. So we stole it. We hid it, and we forgot him so we could not lead him here.','Mandara: The father in our scripture was the one I wished we had. What stands on the horizon is only the hunger. ...I can fight again, @NAME. We have to.'];
async function rewriteEvent(){S.flags.rewrite=1;if(window.SFX){SFX.music('choir');SFX.play('shake');}G.shake=Math.max(G.shake||0,60);
 const vv=[0,1,4,6,8,9];
 await waitScreen('<h2 class="rewriteh">The Scripture Changes</h2>'+vv.map((i,k)=>'<p class="rewritten" style="animation-delay:'+(k*0.6)+'s"><s>'+esc(VERSES[i])+'</s><br><b>'+esc(REWRITE[i])+'</b></p>').join('')+'<p class="hint">Every scripture in every temple, book and altar has rewritten itself.</p>');
 await sayAll(REWRITE_LINES);
 const m=S.party.find(x=>x.sp==='Mandara')||S.box.find(x=>x.sp==='Mandara');
 if(m){m.weak=1;S.mandaraWeakUntil=S.play+600;if(window.MFX&&MFX.flash)MFX.flash();}
 await sayAll(MANDARA_FAINT.map(fmt));
 if(m&&S.party[0]===m&&S.party.length>1){S.party.push(S.party.shift());}
 toast('Mandara collapsed: she cannot battle for now');autosave();}
async function mandaraRecover(){S.flags.rewrite=2;for(const m of S.party.concat(S.box))if(m.sp==='Mandara'){delete m.weak;m.hp=stats(m).hp;}
 if(window.SFX){SFX.music('awakening');SFX.play('heal');}await sayAll(MANDARA_RECOVER.map(fmt));toast('Mandara has recovered');autosave();}
// Midpoint: the voice
async function midpointEvent(){S.flags.heard=1;$('ui').classList.add('dark');if(window.SFX){SFX.music('legranta');SFX.play('shake');}G.dim=1;
 await sayAll(['The sky darkens. The giant on the horizon lifts his head, and his eyes open wide - too wide, and empty of any warmth.','A voice older than the Deep rolls across every shore, every town, every heart. Under it, something else whispers the same words a heartbeat late:']);
 const sh=worldShake(400);await say('LEGRANTA: "Hear me, my creations. I have returned."');if(window.SFX)SFX.play('shake');await sh;
 await sayAll(['The ground shakes hard and long. Bells ring on their own across the whole Reach.','Mandara (from her orb, trembling): ...That is his voice. I remember being a word in that voice. But the echo under it... that is not him. Creations? He says it like a man counting his coins.','In every temple the three flames gutter. Some priests fall to their knees and pray to the horizon. Others bar the doors.','(The wild monsters of the Reach grow stronger and more restless. People everywhere will want to talk about what they heard.)']);
 G.dim=0;$('ui').classList.remove('dark');}
// ===== Silent pages (ancient clues) =====
const CLUE_TOTAL=9;
function clueCount(){return Object.keys(S.clues||{}).length;}
function addClue(k){S.clues=S.clues||{};if(S.clues[k])return false;S.clues[k]=1;toast('Silent page found ('+clueCount()+'/'+CLUE_TOTAL+')');return true;}
async function sealDoor(){addClue('seal');
 if(S.flags.legrantaSecret){await say('The little seal-door stands open. Inside, the Beloved World verses glow softly.');return;}
 if(clueCount()<CLUE_TOTAL){await sayAll(['A small door of black stone with eight rings - a twin of the Eighth Door, made by the Calling as a reliquary.','(Silent pages: '+clueCount()+'/'+CLUE_TOTAL+'. Read temple murals in every town, every altar verse, and talk to Elder Ansel.)']);return;}
 await sayAll(['The eight rings turn. The reliquary opens. Inside is a single hand-copied page: "The Beloved World".']);
 await silhouetteScene(BELOVED);S.flags.legrantaSecret=1;addItem('Rare Candy',3);await say('You understand now why he came back. (Received 3 Rare Candy.)');autosave();}
function worldShake(n){if(window.SFX)SFX.play('shake');return new Promise(r=>{G.shake=n||150;const t=setInterval(()=>{if(G.shake<=0){clearInterval(t);r();}},50);});}
function silhouetteScene(lines){return new Promise(async res=>{const el=mkEl('screen artscene','<canvas class="artcv" width="280" height="240"></canvas><div class="cap"></div>');const c=el.querySelector('canvas').getContext('2d');
 const g=c.createLinearGradient(0,0,0,240);g.addColorStop(0,'#05030a');g.addColorStop(1,'#201030');c.fillStyle=g;c.fillRect(0,0,280,240);
 for(let i=0;i<60;i++){c.fillStyle='rgba(255,255,255,'+Math.random()*0.8+')';c.fillRect(Math.random()*280,Math.random()*240,1,1);}
 if(HEAD.ok){c.globalAlpha=0.8;c.drawImage(HEAD.img,50,0,180,167);c.globalAlpha=1;drawEyes(c,50,0,180/280,1);}
 [[90,'#e8c878'],[140,'#5080c0'],[190,'#c02020']].forEach(([x,col])=>{c.fillStyle=col;c.fillRect(x-5,200,10,30);c.beginPath();c.arc(x,195,6,0,7);c.fill();});
 const L={el,remove:true,onB:()=>{}};pushL(L);
 for(const t of lines){el.querySelector('.cap').textContent=fmt(t);await new Promise(r=>{L.onKey=k=>{if(k==='a'||k==='b'){L.onKey=null;r();}return true;};el.onclick=()=>{el.onclick=null;L.onKey=null;r();};});}
 popL(L);res();});}
// ===== Faith: scripture, festivals =====
async function readAltar(){S.scripture=S.scripture||[];const unread=VERSES.findIndex((v,i)=>!S.scripture.includes(i)&&(true));
 {const I=SCRIPTURE.inscriptions;const tn=(curMap().town|0);const k='ins_'+S.map;if(!S.flags[k]){S.flags[k]=1;await say('Inscription: '+I[[0,1,2,5][tn%4]]);await say('A sealed door nearby: '+(S.flags.rewrite?I[3]+' Scratched beneath: '+I[4]:I[3]));}}
 if(unread<0){await say('You have read every verse this altar offers. (See Scripture in the menu.)');return;}S.scripture.push(unread);await say((S.flags.rewrite?'The rewritten page: ':'The Book of the Three: ')+verseText(unread));if(VERSES.every((v,i)=>!v.startsWith('[')||S.scripture.includes(i)))addClue('frag');}
function dayNum(){return Math.floor(S.time/1440);}
function festival(){return FESTS[dayNum()%7]||null;}
// ===== Climax: the Eighth Door =====
function artScene(lines,sp){sp=sp||'Mandara';return new Promise(async res=>{const el=mkEl('screen artscene',(artOk(sp)&&ART[sp].cut&&window.SIS?'<canvas class="artcv sisanim" width="560" height="480" style="background:radial-gradient(ellipse at 50% 80%,'+ART[sp].pal.bg[1]+','+ART[sp].pal.bg[0]+')"></canvas>':artOk(sp)?'<img'+(ART[sp].cut?' class="cut" style="background:radial-gradient(ellipse at 50% 80%,'+ART[sp].pal.bg[1]+','+ART[sp].pal.bg[0]+')"':'')+' src="'+ART[sp].src+'" alt="'+sp+'">':'<canvas class="artcv" width="280" height="240"></canvas>')+'<div class="cap"></div>');const cv=el.querySelector('.artcv');if(cv&&cv.classList.contains('sisanim')){const g=cv.getContext('2d');SIS.animCanvas(cv,sp,()=>{g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,560,480);g.setTransform(2,0,0,2,0,0);SIS.draw(g,sp,ART[sp].img,140,128,168,{});});}else if(cv){if(ART[sp])drawWarrior(cv.getContext('2d'),sp,140,120,190,true);else{const g=cv.getContext('2d');g.fillStyle='#120a20';g.fillRect(0,0,280,240);drawMon0(g,sp,140,130,140);}}const L={el,remove:true,onB:()=>{}};pushL(L);
 for(const t of lines){el.querySelector('.cap').textContent=fmt(t);await new Promise(r=>{L.onKey=k=>{if(k==='a'||k==='b'){L.onKey=null;r();}return true;};el.onclick=()=>{L.onKey=null;el.onclick=null;r();};});}
 popL(L);res();});}
async function earScene(){if(window.SFX){SFX.music('mandara');SFX.play('shake');}
 const fl=document.createElement('div');fl.style.cssText='position:fixed;inset:0;background:radial-gradient(circle,#fff 0%,#ff2040 45%,#600010 100%);z-index:99;opacity:1;transition:opacity 1.2s;pointer-events:none';document.body.appendChild(fl);setTimeout(()=>fl.style.opacity=0,120);setTimeout(()=>fl.remove(),1500);G.shake=Math.max(G.shake||0,90);
 await artScene(['Mandara does not wait for her turn. She rises in a column of black fire, and her blade draws a single crimson line across the sky: CRIMSON EDGE.','The line passes through the side of his head. An ear the size of a mountain falls away, tumbling end over end into the clouds of this world.','LEGRANTA: RRRAAAAAAHHHHH!! (The roar cracks every bell in the Reach.)','Mandara (shaking): That is for Mancaco. For Mantermo. For two hundred billion years of hiding.'],'Mandara');
 S.flags.earless=1;setEarless();await worldShake(60);}
async function legrantaEvent(l){if(G.legBusy)return;G.legBusy=1;try{return await legrantaEvent0(l);}finally{G.legBusy=0;}}
async function legrantaEvent0(l){if(S.flags.finale){await say('Beyond the Eighth Door there is only an ordinary sky. You cannot remember why that should feel like a mercy, and yet you do.');return;}
 if(!S.beaten.vesper2){await say('A pressure like the whole sky holds you back. Cantor Malrec stands before the Eighth Door.');return;}
 if(!alive(S.party).length){await say('Your team is too exhausted to face him.');return;}
 S.seen.Legranta=1;
 await artScene(['The Eighth Door stands open. Beyond it there is no room - only sky, and him. Legranta, the One. The Silent Book called him maker of all worlds. Now you see what he is: a devourer of them.','Behind him the sky is full of dim, gnawed worlds. Every one held a piece of him. He has come back for the biggest piece of all: this world.','LEGRANTA: MY CREATIONS. YOU ARE MINE. YOU ARE ME. COME BACK INTO ME.','The void tears open behind you. Mancaco and Mantermo stagger out of it, finally free, and stand at Mandara\'s side.','Mancaco: We hid this world from him once. We can hide it again - but not alone. Fight with us, @NAME.'],'Legranta');
 const PH=[['Mantermo','Phase 1 - The Breath','Mantermo: I will drown his hunger in tide and wind. Lend me your will!',l.lv-8],['Mancaco','Phase 2 - The Light','Mancaco: Now my spear. Let him see how bright the thing he wants to eat can burn!',l.lv-4],['Mandara','Phase 3 - The Rest','Mandara: Last, me. Father... it is time to sleep. @NAME, together!',l.lv]];
 for(let i=0;i<PH.length;i++){const [sp,title,line,lv]=PH[i];
  await sayAll([title,fmt(line),sp+' joins the battle as your ally. Her signature moves are yours to command.']);
  const ally=mkMon(sp,75);ally.tmp=1;ally.nick=sp;const st=stats(ally);ally.ov={};for(const k in st)ally.ov[k]=Math.round(st[k]*1.6);ally.hp=ally.ov.hp;S.party.unshift(ally);
  const boss=mkMon('Legranta',lv);boss.nick='Legranta';
  const r=await runBattle({wild:false,enemy:[boss],t:{name:'Legranta the Devourer ('+(i+1)+'/3)',cls:'The One',money:0,post:''},boss:true});
  S.party=S.party.filter(m=>!m.tmp);
  if(r!=='win'){await say('The hunger storm drives you back through the Door. The sisters hold it shut behind you. Return when you are ready.');healAll();return;}
  healAll();if(i<2){await worldShake(50);await say('Legranta reels, and the sisters tag in. '+PH[i+1][0]+' steps forward.');}
  if(i===1)await earScene();}
 S.flags.legrantaBeaten=1;await worldShake(140);
 await artScene(['The three sisters raise their weapons together - spear, tide and blade - and the seven seals flare back to life across the sky.','LEGRANTA: ...DAUGHTERS? I KNOW YOUR VOICES. WHY DO I KNOW YOUR VOICES?','Mandara (quietly): Because once you were our father. Go, Father. Go where you cannot find us.','The sisters push. Reality folds like a page being turned. The great head on the horizon sinks, and sinks, and is gone. Legranta is banished from this reality, and this world is hidden from him once again.'],'Legranta');
 await finalEnding();}
async function lairEvent(l){const sp=l.sp;S.seen[sp]=1;
 if(medalCount()<4&&!S.flags.heard){await say('A wall of '+(sp==='Lumenwing'?'blinding white flame':'still black water')+' holds you back. Perhaps when the Father\'s voice is heard...');return;}
 if(!alive(S.party).length){await say('Your team is too exhausted.');return;}
 await artScene(sp==='Lumenwing'?['A great bird of white flame unfolds its wings: Lumenwing, Herald of the One.','It carried the three words down into the Deep. It wants to know if you are worthy to carry the ten names back up.']:['The lake goes perfectly still. Something rises that is not water, but the stillness between worlds: Hollowmere.','It is not cruel. It only remembers being everything, and wonders what you are.'],sp);
 const r=await wildBattle(mkMon(sp,l.lv),true);
 if(r==='catch'){S.flags['leg_'+sp]=1;await say(sp+' joins you.');}else if(r==='win')await say(sp+' withdraws... it will return.');autosave();}
const FORGET=[['seren','Seren touches three fingers to the brow one last time. The hand falls. "...Why did I make that sign?"'],['fenwick','Fenwick laughs at something, then stops. "I had a song about a name. How did it go?"'],['corwin','Corwin begins the old story and cannot find the ending. He smiles anyway and pats your hand.'],['wendeline','Wendeline turns her face to the wind. It blows outward again. She does not know why that makes her cry.'],['thessaly','Thessaly closes the Silent Book, reads the cover, and frowns. "Whose is this? Not mine, surely."'],['moira','Moira looks at the forbidden pages in her hands, and the ink has gone blank. "Good," she whispers, not knowing why.'],['fenna','Fenna sniffs. "Hmph. Odd dream. Too much light in it." She goes back to her herbs.'],['quill','Quill stares at the fourth gate carving. "Huh. Three gates. I could have sworn..."'],['aldric','Aldric kneels at the Eighth Door. When he rises, the grief is still there, but the name is gone. "I am the keeper of this door," he says. "I do not remember why. It is enough."']];
async function finalEnding(){$('ui').classList.add('dark');if(window.SFX)SFX.music('choir');
 await sayAll(['Silence. The nine knowers step through the Door behind you: Seren, Fenwick, Corwin, Wendeline, Thessaly, Moira, Fenna, Quill and Aldric.','Mancaco: There is one seal left to make. As long as anyone here remembers his name, this world calls to him. A world that remembers can be found.','Mancaco lifts her spear, and its light falls on each of them like snow.']);
 for(const [id,t] of FORGET){const p=PEOPLE_BY_ID[id];await say(t);if(p)S.met[id]=1;}
 await sayAll(['Mancaco turns to the rest of the world, and her light spreads over every town, every temple and every sleeping house. Across the Reach, a name slips out of every mind at once.','Mancaco looks at you last. Her spear lowers. "Not you. Someone must remember, in case he finds the way back. I am sorry, little one. It is a heavy thing to carry."','Mantermo: The scripture will be ours again. The kind version. Let them have it.','Mandara: My sisters must go and hold the seals. I will stay with you, @NAME. Someone should keep the one who remembers company.','Mancaco and Mantermo fade into the sky like the last of a sunset.']);
 S.flags.finale=1;S.flags.forgotten=1;
 for(const m of S.party.concat(S.box))delete m.weak;
 $('ui').classList.remove('dark');healAll();
 await sayAll(['EPILOGUE','The horizon is empty at last. Just sky.','The temples read from the Book of the Three again: three sisters rising from the Deep. The priests have stopped arguing and cannot remember what about.','Malrec runs a small bell shop in Vesperdeep. He hums four notes all day long and does not know why.','Ask anyone the name of the One above the Three, and they only look puzzled. "There is no one above the Three."',...SCRIPTURE.closing.slice(0,3),'Only you remember. Legranta. You do not say it aloud.','THE END - Monster Wilds II: The Calling Answered. Thank you for playing!']);
 $('ui').classList.add('dark');await sayAll(['. . .','High above the world, long after the battle, something pale is still falling: the severed ear, tumbling through cloud.','It falls past mountains no map has named, into a place no one could recognise. Grey, wet, silent. It could be anywhere.','It lands. For a long moment, nothing.','Then the skin of it splits, and an arm pushes out - slick with blood, its fingers opening slowly, reaching for the sky.',SCRIPTURE.closing[3],...SCRIPTURE.closingVerse]);$('ui').style.background='#000';await sayAll(['. . .','- To be continued -']);$('ui').style.background='';$('ui').classList.remove('dark');autosave();}
// ===== Concord ending =====
async function ending(){S.flags.champ=1;$('ui').classList.add('dark');
 await sayAll(['Orrin: The Concord League has a new Champion: @NAME, Champion of two lands!','@RIVAL: Two championships. You\'re unbearable. ...Congratulations, partner.','Warden Osk: By the oldest law of the Reach, the Champion alone may walk the road to the Hollow Crown.','Mandara (from her orb): The Eighth Door lies north-east of the Plaza. '+(knowerCount()>=9?'All ten names are ready. Let us go to him.':'But we still need all ten names - find the remaining knowers first ('+knowerCount()+'/9).')]);
 $('ui').classList.remove('dark');healAll();S.map='world';S.x=72;S.y=36;G.dir='up';}
function mainObjective(){if(S.flags.finale)return 'Only you remember his name. Explore the Reach, catch Lumenwing, Hollowmere and Octavel, and complete your Monsterdex.';const k=knowerCount();
 if(k===0)return 'Talk to Seren, the hooded stranger on the Waking Shore.';
 if(S.flags.champ){if(k<9)return 'Find the remaining knowers ('+k+'/9), then enter the Eighth Door Sanctum in the Hollow Crown.';return 'Enter the Eighth Door Sanctum in the Hollow Crown (north-east of the Concord Plaza) and stop Cantor Malrec.';}
 const n=medalCount();const kn='Find the 9 knowers ('+k+'/9). ';if(n<6){const g=GYMS[n];return kn+(S.beaten['syn'+n]?'':'Stop the Hollow Choir in '+TOWNS[g.town].name+', then ')+'challenge Gym Leader '+g.leader+' in '+TOWNS[g.town].name+'.';}
 if(!S.beaten.rival2)return kn+'Head north from Vesperdeep to the Concord Plaza.';return kn+'Defeat the Elite Four and Champion Orrin in the Concord Hall.';}
async function cardScreen(){const pt=Math.floor(S.play);const lg=S.legacy;const h='<h2>Trainer Card</h2><div class="card"><p><b>'+esc(S.name)+'</b><br>Hometown: Mossgrove (far across the sea)<br>Family: Mother Ilsa, father Rowan - waiting at home<br>Rival: '+esc(S.rival)+'<br>Titles: Champion of the Summit League'+(S.flags.champ?', Champion of the Concord':'')+'<br>Motivation: Find the nine other knowers, free Mancaco and Mantermo, and answer the Calling with a pure heart.'+(lg?'<br><i>Imported from Monster Wilds 1 ('+lg.caught+' species caught there'+(lg.friends.length?'; best friends: '+lg.friends.length:'')+')</i>':'')+'</p><p>Coins: '+S.money+'<br>Playtime: '+Math.floor(pt/3600)+'h '+Math.floor(pt/60)%60+'m '+pt%60+'s<br>Monsterdex: '+Object.keys(S.caught).length+' caught / '+Object.keys(S.seen).length+' seen<br>Knowers found: '+knowerCount()+'/9</p><div class="medals">'+GYMS.map((g,i)=>'<span class="medal '+(S.medals[i]?'got':'')+'" style="background:'+(S.medals[i]?TCOL[g.type]:'#333')+'" title="'+g.medal+'">'+(S.medals[i]?g.medal.split(' ')[0]:'?')+'</span>').join('')+'</div></div>';await waitScreen(h);}
// ===== Relationships (brief 41) =====
const RLV=[[0,'Stranger'],[20,'Acquaintance'],[50,'Friend'],[100,'Close Friend'],[160,'Best Friend']];
function relGet(id){if(!S.rel)S.rel={};let r=S.rel[id];if(!r){r=S.rel[id]={p:0,talk:-1,gift:-1,fav:0,best:0};}return r;}
function relLv(id){const p=relGet(id).p;let l=0;for(let i=0;i<RLV.length;i++)if(p>=RLV[i][0])l=i;return l;}
function relName(id){return RLV[relLv(id)][1];}
function relBar(id){const r=relGet(id),l=relLv(id);const nx=RLV[l+1];return RLV[l][1]+' '+'\u2665'.repeat(l+1)+'\u2661'.repeat(4-l)+(nx?' ('+r.p+'/'+nx[0]+')':' (max)');}
function heartsAt(map,x,y,n){(G.hearts=G.hearts||[]).push({map,x,y,n,t0:performance.now()});if(window.SFX)SFX.play(n>0?'heart':'back');}
async function relAdd(id,n,name,pos){const r=relGet(id);const l0=relLv(id);r.p=clamp(r.p+n,0,200);if(pos)heartsAt(S.map,pos.x,pos.y,n>0?Math.min(3,Math.ceil(n/8)):-1);const l1=relLv(id);
 if(l1>l0){await say(name+' now sees you as: '+RLV[l1][1]+'! '+['','','(They will share more of their story.)','(They may ask a personal favour.)','(A true bond - they have something special for you.)'][l1]);
  if(l1===4&&!r.best){r.best=1;addItem('Rare Candy',2);addItem('Ultra Orb',2);await say(name+' gives you 2 Rare Candy and 2 Ultra Orbs. "For my best friend."');}}}
function timeWord(){const h=hour();return h<5?'night':h<12?'morning':h<18?'afternoon':h<21?'evening':'night';}
function relChat(p,lv){const nm=p.name;const tw=timeWord();const greet={morning:'Good morning',afternoon:'Good afternoon',evening:'Good evening',night:'You\'re up late'}[tw];
 const st=stage();const prog=st>=7?' Champion of the Concord!':st>=4?' I hear you have '+medalCount()+' medals now.':'';
 if(lv===0)return greet+', stranger. I\'m '+nm+' - '+(p.job||'just passing through')+'.'+prog;
 if(lv===1)return greet+', @NAME!'+prog+' People call me '+(p.pers||'').split(',')[0].toLowerCase()+'. Fair enough, I suppose.';
 if(lv===2)return greet+', @NAME. Can I tell you something? '+p.back;
 if(lv===3)return 'I trust you, @NAME. '+(p.deep||'Some nights I look up at him and I am not afraid at all. Is that strange?');
 return 'Best friends, you and me. '+(st>=7?'Whatever you do next, I\'ll be cheering.':'Go and finish what you started - and come home safe.')+' ('+nm+' smiles warmly.)';}
async function relMenu(p,ent){const id=p.id,nm=p.name;
 while(true){const r=relGet(id),lv=relLv(id);const opts=['Goodbye','Chat','Give a gift'];const favOk=lv>=3&&r.fav<2;if(favOk)opts.push(r.fav===0?'Ask about a favour':'Favour: give '+p.likes[0]);
  const c=await choose(nm+' - '+relBar(id),opts);if(c<=0)return;
  if(c===1){await say(nm+': '+relChat(p,lv));if(r.chat!==dayNum()){r.chat=dayNum();await relAdd(id,3,nm,ent);}}
  else if(c===2){if(r.gift===dayNum()){await say(nm+': You already gave me something today. Save it for tomorrow!');continue;}
   const names=Object.keys(S.bag).filter(n=>ITEMS[n]&&S.bag[n]>0);if(!names.length){await say('You have nothing to give.');continue;}
   const k=await choose('Give '+nm+' which item?',names.map(n=>n+' x'+S.bag[n]+(ITEMS[n].gift?' (gift)':'')));if(k<0)continue;await giveGift(p,names[k],ent);}
  else if(c===3){if(r.fav===0){r.fav=1;await say(nm+': Since you asked... could you bring me some '+p.likes[0]+'? It would mean a lot.');}
   else if(!S.bag[p.likes[0]]){await say(nm+': No '+p.likes[0]+' yet? No hurry.');}else{addItem(p.likes[0],-1);r.fav=2;const rw=['Rare Candy','Max Potion','Ultra Orb'][hash(id)%3];addItem(rw,2);await say(nm+': You remembered! Please, take these: 2x '+rw+'.');await relAdd(id,25,nm,ent);}}}}
async function giveGift(p,item,ent){const r=relGet(p.id);addItem(item,-1);r.gift=dayNum();let n,line;
 if(p.likes.includes(item)){n=15;line='Oh! '+item+'! I love this. Thank you, @NAME!';}else if(p.dislikes.includes(item)){n=-6;line='Er... '+item+'? That\'s... not really for me.';}else{n=6;line='A '+item+'? That\'s thoughtful of you. Thank you.';}
 await say(p.name+': '+line);await relAdd(p.id,n,p.name,ent);return n;}
async function relDaily(p,ent){const r=relGet(p.id);if(r.talk===dayNum())return;r.talk=dayNum();await relAdd(p.id,5,p.name,ent);const lv=relLv(p.id);
 if(lv>=2&&Math.random()<0.25){if(Math.random()<0.5){const it=lv>=3?'Super Potion':'Potion';addItem(it,1);await say(p.name+': Here, take this '+it+' for the road.');}else await say(p.name+': A tip, @NAME - '+mainObjective());}}
function relPerson(id){return PEOPLE_BY_ID[id]||REL_T[id];}
const REL_T={};// trainers as relationship partners (gym leaders, elites, rival, route trainers)
function trainerPerson(t){let p=REL_T[t.id];if(!p){const h=hash(t.id);p=REL_T[t.id]={id:t.id,name:fmt(t.name),job:t.cls,pers:'Competitive',back:(BIOS[t.name]||{}).back||'A trainer who lives for a good battle.',likes:[GIFTS[h%8],GIFTS[(h>>3)%8===h%8?(h+1)%8:(h>>3)%8]],dislikes:[GIFTS[(h+5)%8]]};if(p.likes.includes(p.dislikes[0]))p.dislikes=[GIFTS[(h+6)%8]];}return p;}
// ---- looks & facing
function lookFor(e){if(e.kind==='person'){const p=e.ref;let role=p.priest?'priest':p.knower?'stranger':p.id==='rowan'?'ranger':'person';if(role==='person'&&typeof p.age==='number'&&p.age<15)role='kid';return WS.look(p.id,role,{age:p.age});}
 if(e.kind==='trainer'){const t=e.ref;let role='person',o={};if(t.gym!==undefined&&t.id==='gym'+t.gym)role='leader:'+GYMS[t.gym].type;else if(t.elite!==undefined)role=t.elite===4?'champion':'elite:'+t.elite;else if(t.rival)role='rival';else if(t.bio==='monk')role='monk';else if(/^Follower/.test(t.cls))role='follower';
  else if(/Kid/.test(t.name)){role='kid';o.age=10;}else if(/Hiker/.test(t.name))o={head:'hat',acc:'satchel'};else if(/Fisher/.test(t.name))o={head:'hat',out:'#2a5a6a'};else if(/Skier/.test(t.name))o={head:'cap',acc:'scarf',out:'#c03040'};else if(/Miner/.test(t.name))o={head:'helmet',acc:'apron'};else if(/Ace/.test(t.name))o={acc:'armor',out:'#5a2a6a'};else if(/Gym Trainer/.test(t.cls))o={out:TCOL[GYMS[+t.id.slice(4,5)]?.type]||'#888'};
  return WS.look(t.id,role,o);}
 if(e.kind==='gate')return WS.look('gate'+e.i,'guard');if(e.kind==='nurse')return WS.look('nurse','nurse');if(e.kind==='clerk')return WS.look('clerk','clerk');return WS.look(e.name||'x','person');}
function faceFor(e){const id=e.ref&&e.ref.id||e.kind;if(G.faceT&&G.faceT[id]&&G.faceT[id].until>S.time)return G.faceT[id].d;
 if(S.map===curMap().id){const dx=S.x-e.x,dy=S.y-e.y;if(Math.abs(dx)+Math.abs(dy)<=2&&(dx||dy))return Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');}
 if(e.dir)return e.dir;if(e.ref&&e.ref.face)return e.ref.face;const k=(Math.floor(S.time/6)+hash(String(id)))%7;return ['down','down','left','down','right','down','up'][k];}
function drawEnt(e,sx,sy){const f=G.frame;const walking=e.fx!==undefined&&e.moving;const fr=walking?'w'+(((f/8)|0)%4):('i'+((((f+hash(String(e.x*7+e.y)))>>4)%7)===0?1:0));
 WS.npc(X,sx,sy,lookFor(e),faceFor(e),window.AMB&&AMB.reduced?'i0':fr);}
function drawHearts(camx,camy){if(!G.hearts||!G.hearts.length)return;const now=performance.now();G.hearts=G.hearts.filter(h=>now-h.t0<1400);
 for(const h of G.hearts){if(h.map!==S.map)continue;const k=(now-h.t0)/1400;const n=Math.abs(h.n);for(let i=0;i<n;i++){const x=h.x*TS-camx+8+(i-(n-1)/2)*6+Math.sin(k*8+i)*1.2,y=h.y*TS-camy-12-k*16-i*2;
  X.globalAlpha=Math.max(0,1-k*k);X.fillStyle=h.n<0?'#7a6a8a':'#ff4a6a';X.beginPath();X.moveTo(x,y+2.6);X.bezierCurveTo(x-4,y-.6,x-2,y-3.4,x,y-1.2);X.bezierCurveTo(x+2,y-3.4,x+4,y-.6,x,y+2.6);X.fill();X.strokeStyle='#ffd0a0';X.lineWidth=.4;X.stroke();
  if(h.n<0){X.strokeStyle='#201828';X.beginPath();X.moveTo(x,y-1);X.lineTo(x-.6,y+.6);X.lineTo(x+.4,y+1.4);X.stroke();}}}X.globalAlpha=1;}
// ---- save migration (sequel): ensure defaults and valid tiles
function migrateSave(d){if(!d.rel||typeof d.rel!=='object')d.rel={};try{for(const m of (d.party||[]).concat(d.box||[])){if(m&&SPECIES[m.sp]){const mx=stats(m).hp;if(typeof m.hp!=='number'||m.hp>mx)m.hp=mx;}}}catch(e){}d.wv=2;
 for(const o of [d,d.lastHeal]){if(!o||!MAPS[o.map])continue;const m=MAPS[o.map];o.x=clamp(o.x|0,0,m.w-1);o.y=clamp(o.y|0,0,m.h-1);if(SOLID.has(m.t[o.y*m.w+o.x])){const p=nearestFree(o.map,o.x,o.y);o.x=p[0];o.y=p[1];}}
 return d;}
function nearestFree(map,x,y){const m=MAPS[map];const seen=new Set();const q=[[x,y]];while(q.length){const [a,b]=q.shift();const k=a+','+b;if(seen.has(k)||a<0||b<0||a>=m.w||b>=m.h)continue;seen.add(k);const v=m.t[b*m.w+a];if(!SOLID.has(v)&&v!==T.DOOR&&v!==T.MAT)return [a,b];if(seen.size>4000)break;for(const [c,d] of [[1,0],[-1,0],[0,1],[0,-1]])q.push([a+c,b+d]);}return [m.spawn?m.spawn.x:x,m.spawn?m.spawn.y:y];}
// ===== Save / load =====
function saveGame(){if(!S||G.mode!=='world')return false;try{localStorage.setItem(SAVE_KEY,JSON.stringify({game:'monster-wilds-2',v:1,saved:Date.now(),data:S}));return true;}catch(e){return false;}}
function autosave(){if(saveGame())toast('Autosaved');}
function validSave(o){try{if(!o||o.game!=='monster-wilds-2'||!o.data)return o&&o.game==='monster-wilds'?'That is a Monster Wilds 1 save. Use New Game > Import hero from Monster Wilds 1.':'Not a Monster Wilds II save file.';const d=o.data;
 for(const k of ['name','rival','map'])if(typeof d[k]!=='string')return 'Missing field: '+k;
 if(!MAPS[d.map])return 'Unknown map.';for(const k of ['x','y','money','time','play'])if(typeof d[k]!=='number'||!isFinite(d[k]))return 'Bad number: '+k;
 if(!Array.isArray(d.party)||!Array.isArray(d.box)||d.party.length>6)return 'Bad party/box.';
 for(const m of d.party.concat(d.box)){if(!m||!SPECIES[m.sp]||!(m.lv>=1&&m.lv<=100)||!Array.isArray(m.moves))return 'Invalid monster data.';for(const mv of m.moves)if(!MOVES[mv.n])return 'Invalid move.';}
 if(!Array.isArray(d.medals)||d.medals.length!==6)return 'Bad medals.';for(const k of ['bag','flags','quests','seen','caught','met','beaten'])if(typeof d[k]!=='object'||d[k]===null)return 'Missing field: '+k;
 return null;}catch(e){return 'Corrupt save.';}}
function loadSave(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return null;const o=JSON.parse(raw);return validSave(o)?null:o;}catch(e){return null;}}
function startFromSave(o){S=migrateSave(o.data);G.mode='world';G.dir=S.dir||'down';G.mv=null;$('ui').classList.remove('dark');closeTitle();toast('Welcome back, '+S.name+'!');}
function exportSave(){const o=S?{game:'monster-wilds-2',v:1,saved:Date.now(),data:S}:loadSave();if(!o){return say('No save data to export.');}
 const blob=new Blob([JSON.stringify(o,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='monster-wilds-2-save-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);return say('Save exported as '+a.download+'.');}
function importSave(){return new Promise(res=>{const inp=$('importFile');inp.value='';inp.onchange=()=>{const f=inp.files[0];if(!f){res(false);return;}const r=new FileReader();r.onload=async()=>{let o;try{o=JSON.parse(r.result);}catch(e){await say('Import failed: file is not valid JSON.');res(false);return;}
  const err=validSave(o);if(err){await say('Import failed: '+err);res(false);return;}localStorage.setItem(SAVE_KEY,JSON.stringify(o));await say('Save imported for '+o.data.name+'!');startFromSave(o);res(true);};r.readAsText(f);};inp.click();
  setTimeout(()=>res(false),120000);});}
window.importSaveObject=function(o){const err=validSave(o);if(err)return err;localStorage.setItem(SAVE_KEY,JSON.stringify(o));return null;};
async function backupMenu(){const c=await choose('Save Backup',['Export save to file','Import save from file','Back']);if(c===0){saveGame();await exportSave();}if(c===1){const ok=await choose('Importing replaces your current game. Continue?',['Import','Cancel']);if(ok===0)await importSave();}}

// ===== Title =====
let titleL=null;
function drawTitle(){G.frame++;X.setTransform(C.width/VW,0,0,C.width/VW,0,0);X.imageSmoothingEnabled=true;const g=X.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#08040e');g.addColorStop(1,'#2a1430');X.fillStyle=g;X.fillRect(0,0,VW,VH);
 for(let i=0;i<40;i++){X.fillStyle='rgba(255,255,255,'+(0.3+0.7*((i*37+G.frame)%60)/60)+')';X.fillRect((i*73)%VW,(i*41)%120,1,1);}
 X.fillStyle='rgba(255,255,255,0.05)';X.beginPath();X.ellipse(VW/2,40,70,40,0,0,7);X.fill();X.fillStyle='#140a18';X.fillRect(0,170,VW,70);if(HEAD.ok){X.save();X.globalAlpha=0.55+0.1*Math.sin(G.frame/60);const hw=230,hh=hw*260/280;X.drawImage(HEAD.img,VW/2-hw/2,150-hh,hw,hh);X.restore();drawEyes(X,VW/2-hw/2,150-hh,hw/280,1);}X.fillStyle='#140a18';X.fillRect(0,150,VW,90);drawMon(X,'Lumenwing',60,180,50);drawMon(X,'Octavel',160,190,56);drawMon(X,'Hollowmere',260,180,50);
 X.fillStyle='#ffe070';X.font='bold 24px monospace';X.textAlign='center';X.fillText('MONSTER WILDS II',VW/2,20);X.font='8px monospace';X.fillStyle='#fff';X.fillText('The Calling Answered',VW/2,32);X.textAlign='left';}
function closeTitle(){if(titleL){popL(titleL);titleL=null;}}
function showTitle(){G.mode='title';const sv=loadSave();const opts=[];if(sv)opts.push(['Continue',async()=>{startFromSave(sv);}]);
 opts.push(['New Game',async()=>{if(loadSave()){const c=await choose('A save already exists. Start a new game and overwrite it?',['Overwrite','Cancel']);if(c!==0)return;}closeTitle();await newGame();}]);
 opts.push(['Import Save',async()=>{await importSave();}]);if(sv)opts.push(['Export Save',async()=>{await exportSave();}]);opts.push(['Help',async()=>{await helpScreen();}]);
 const el=mkEl('menu title','<div class="mp">'+(sv?'Save: '+esc(sv.data.name)+' - '+sv.data.medals.filter(Boolean).length+' medals - '+((sv.data.knowers&&Object.keys(sv.data.knowers).length)||0)+'/9 knowers - '+(MAPS[sv.data.map].name||'World')+'':'No save found')+'</div>'+opts.map((o,i)=>'<button class="opt" data-i="'+i+'">'+o[0]+'</button>').join(''));
 titleL={el,remove:true,onB:()=>{}};el.querySelectorAll('.opt').forEach(b=>b.onclick=()=>opts[+b.dataset.i][1]());pushL(titleL);}
// ===== Boot =====
function fit(){const w=$('wrap'),c=C;const r=$('screenbox').getBoundingClientRect();const s=Math.min(r.width/VW,r.height/VH);c.style.width=Math.floor(VW*s)+'px';c.style.height=Math.floor(VH*s)+'px';const u=$('stage');u.style.width=c.style.width;u.style.height=c.style.height;const dpr=Math.min(3,window.devicePixelRatio||1);const bw=Math.max(VW,Math.round(Math.floor(VW*s)*dpr)),bh=Math.round(bw*VH/VW);if(c.width!==bw||c.height!==bh){c.width=bw;c.height=bh;}}
window.addEventListener('resize',fit);window.addEventListener('orientationchange',()=>setTimeout(fit,200));
window.addEventListener('pagehide',()=>saveGame());document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame();});
if(('ontouchstart' in window)||matchMedia('(pointer:coarse)').matches||/[?setupTouch();fit();]touch=1/.test(location.search))document.body.classList.add('touch');setupTouch();fit();showTitle();requestAnimationFrame(loop);
// test hooks
document.getElementById('battle').addEventListener('pointerdown',()=>{if(window.MFX)MFX.skip();});
window.addEventListener('keydown',e=>{if(window.MFX&&(e.key==='z'||e.key==='Enter'||e.key===' '))MFX.skip();if(window.SFX&&UI.length){if(/^Arrow(Up|Down)$/.test(e.key))SFX.play('move');else if(e.key==='x'||e.key==='Escape')SFX.play('back');else if(e.key==='z'||e.key==='Enter')SFX.play('select');}});
if(window.AMB)document.body.classList.toggle('fxlow',AMB.reduced);
window.GAME={get S(){return S;},openingScene,importG1,knowerCount,midpointEvent,knowerTalk,legrantaEvent,finalEnding,rewriteEvent,mandaraRecover,G1_SAVE_KEY,SAVE_KEY,LEGENDS,TRAINERS,MAPS,TOWNS,SPECIES,PEOPLE,entities,saveGame,loadSave,validSave,stats,mkMon,addMon,enterMap,wildBattle,addItem,UI};
