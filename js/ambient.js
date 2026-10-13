// ===== Ambient life: critters, townsfolk, weather, lights (visual only; never affects collisions/saves) =====
(function(){
const FXKEY='monsterwilds2_fx';
const A={reduced:false,parts:[],critters:[],folk:null,t:0};
try{A.reduced=localStorage.getItem(FXKEY)==='low';}catch(e){}
A.toggle=function(){A.reduced=!A.reduced;A.parts.length=0;try{localStorage.setItem(FXKEY,A.reduced?'low':'full');}catch(e){}return A.reduced;};
A.label=function(){return 'Effects: '+(A.reduced?'Reduced':'Full');};
const MAXP=()=>A.reduced?0:70;
function h01(a,b){let n=(a*374761393+b*668265263)>>>0;n=(n^(n>>>13))*1274126177>>>0;return ((n^(n>>>16))>>>0)/4294967296;}
function gh(){return (S.time/60)%24;}// fractional hour
function night(){const h=gh();return h>=19.5||h<5.5;}
function dark(){const h=gh();if(h>=21.5||h<4.5)return 1;if(h>=19.5)return (h-19.5)/2;if(h<5.5)return 1-(h-4.5);return 0;}
// glow sprite (pre-rendered, cheap)
const glow=document.createElement('canvas');glow.width=glow.height=32;{const g=glow.getContext('2d');const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,220,140,.9)');r.addColorStop(.4,'rgba(255,180,80,.35)');r.addColorStop(1,'rgba(255,160,60,0)');g.fillStyle=r;g.fillRect(0,0,32,32);}
const gglow=document.createElement('canvas');gglow.width=gglow.height=16;{const g=gglow.getContext('2d');const r=g.createRadialGradient(8,8,0,8,8,8);r.addColorStop(0,'rgba(220,255,140,1)');r.addColorStop(1,'rgba(160,255,80,0)');g.fillStyle=r;g.fillRect(0,0,16,16);}
function region(x,y){const r=regionAt(Math.max(0,Math.min(WW-1,x)),Math.max(0,Math.min(WH-1,y)));return r==='summit'||r==='crimson'?(r==='crimson'?'ember':'leaf'):r;}
function raining(r){if(r!=='coast'&&r!=='gale'&&r!=='leaf')return false;const d=Math.floor(S.time/150);return h01(d,r.length)<0.3;}
// ---- per-tile overlay pass (after tiles, before entities): only animated life; static art lives in style.js chunks
A.under=function(m,cx,cy){if(!m.outdoor||A.reduced)return;const f=G.frame;
 const x0=Math.floor(cx/TS),y0=Math.floor(cy/TS),W=m.w,t=m.t;
 for(let y=y0;y<=y0+VH/TS+1;y++)for(let x=x0;x<=x0+VW/TS+1;x++){if(x<0||y<0||x>=m.w||y>=m.h)continue;const v=t[y*W+x];const sx=x*TS-cx,sy=y*TS-cy;
  if(v===T.TALL||v===T.SNOWTALL){const s=Math.sin(f/22+x*0.7+y*0.3);if(s>0.6){X.fillStyle=v===T.TALL?'rgba(220,255,160,.10)':'rgba(255,255,255,.14)';X.beginPath();X.ellipse(sx+8+s*2,sy+6,6,2.2,0,0,7);X.fill();}
   const r=h01(x,y+Math.floor(f/180));if(r<0.012){const k=(f%180)/180;X.fillStyle='rgba(4,10,4,.45)';X.beginPath();X.ellipse(sx+8+((f>>2)&1),sy+8,7,3,0,0,7);X.fill();
    if(k>0.4&&k<0.8){X.fillStyle='rgba(255,230,120,.9)';X.fillRect(sx+5,sy+5,1.4,1);X.fillRect(sx+9.5,sy+5,1.4,1);}}}
  else if(v===T.WATER){if(h01(x*3,y)<0.02){const k=(f+Math.floor(h01(x,y*5)*400))%400;if(k<60){X.strokeStyle='rgba(170,250,255,'+(0.55-k/120)+')';X.lineWidth=.6;X.beginPath();X.ellipse(sx+8,sy+8,2+k/8,1+k/16,0,0,7);X.stroke();}}}
 }
};
// ---- chimney smoke + townsfolk + critters (after player, before tint)
function initFolk(){A.folk=[];TOWNS.forEach(tn=>{const c=['#5080c0','#c06090','#70a050','#c0a040','#8060b0','#40a0a0'];
  // walkers on the main road / cross road
  A.folk.push({tn,ax:2,ay:6,bx:17,by:6,p:h01(tn.id,1),sp:0.0016,col:c[tn.id%6],cap:'#603010'});
  A.folk.push({tn,ax:10,ay:12,bx:10,by:4,p:h01(tn.id,2),sp:0.002,col:c[(tn.id+2)%6],cap:'#202020'});
  A.folk.push({tn,ax:18,ay:6,bx:11,by:6,p:h01(tn.id,3),sp:0.0012,col:c[(tn.id+4)%6],cap:'#a08060',day:1});
  // chatting pair
  A.folk.push({tn,pair:1,x:15,y:7,col:c[(tn.id+1)%6],col2:c[(tn.id+3)%6]});});}
const EMO=['♥','!','♪','...','?','☺'];
function bubble(x,y,txt){X.font='8px monospace';const w=Math.max(10,X.measureText(txt).width+6);X.fillStyle='rgba(14,8,18,.9)';X.fillRect(x-w/2,y-11,w,10);X.fillRect(x-1,y-1,3,2);X.strokeStyle='#d9a94a';X.lineWidth=.5;X.strokeRect(x-w/2+.25,y-10.75,w-.5,9.5);X.fillStyle='#f3e2b8';X.textBaseline='top';X.fillText(txt,x-w/2+3,y-10);}
A.mid=function(m,cx,cy,ents){const f=G.frame,red=A.reduced;
 if(m.outdoor){
  // idle emotes on real NPCs (occasional)
  if(!red&&ents)for(const e of ents){if(e.kind!=='person')continue;const k=(f+Math.floor(h01(e.x,e.y)*900))%900;if(k<70){bubble(e.x*TS-cx+8,e.y*TS-cy-1,EMO[Math.floor(h01(e.y,e.x)*EMO.length)]);}}
  // chimney smoke on houses (bld 0 and 5)
  if(!red)for(const tn of TOWNS){const ox=tn.x*TS-cx,oy=tn.y*TS-cy;if(ox>VW+20||ox+TW*TS<-20||oy>VH+20||oy+TH*TS<-40)continue;
   for(const [hx,hy] of [[2,1],[8,9]]){const px=ox+hx*TS+12,py=oy+hy*TS-2;
    for(let i=0;i<4;i++){const k=((f+i*30)%120)/120;X.fillStyle='rgba(150,140,160,'+(0.35*(1-k))+')';const r=1.5+k*4;X.beginPath();X.arc(px+2+Math.sin(k*6+i)*3+k*6,py-6-k*26,r,0,7);X.fill();}}}
  critters(m,cx,cy);
 }};
function critters(m,cx,cy){if(A.reduced)return;const f=G.frame,nt=night();const camT=[cx,cy];
 // birds / butterflies / fireflies spawned near the camera, capped
 const want=nt?10:6;while(A.critters.length<want){const k=nt?'fly':(Math.random()<0.5?'bird':'butt');A.critters.push({k,x:cx+Math.random()*VW,y:cy+Math.random()*VH,vx:(Math.random()-.5)*(k==='bird'?1.6:0.4),vy:(Math.random()-.5)*0.3,ph:Math.random()*7,life:600+Math.random()*600});}
 for(let i=A.critters.length-1;i>=0;i--){const c=A.critters[i];c.life--;
  if((nt&&c.k!=='fly')||(!nt&&c.k==='fly')||c.life<0||c.x<cx-60||c.x>cx+VW+60||c.y<cy-60||c.y>cy+VH+60){A.critters.splice(i,1);continue;}
  c.ph+=0.1;const sx=c.x-cx,sy=c.y-cy;
  if(c.k==='bird'){c.x+=c.vx||1;c.y+=Math.sin(c.ph*0.3)*0.3;X.fillStyle='#303040';const w=Math.sin(c.ph*2)>0?1:-1;X.fillRect(sx-3,sy-w,3,1);X.fillRect(sx,sy,1,1);X.fillRect(sx+1,sy-w,3,1);}
  else if(c.k==='butt'){c.x+=c.vx+Math.sin(c.ph*0.7)*0.5;c.y+=c.vy+Math.cos(c.ph*0.9)*0.4;const w=Math.sin(c.ph*3)>0;X.fillStyle=['#f0a0e0','#f0f080','#a0d0ff'][i%3];X.fillRect(sx-(w?2:1),sy,w?2:1,2);X.fillRect(sx+1,sy,w?2:1,2);}
  else{c.x+=Math.sin(c.ph*0.2)*0.3;c.y+=Math.cos(c.ph*0.17)*0.3;}}
}
// ---- weather + lights (after day/night tint)
A.top=function(m,cx,cy){if(!m.outdoor)return;const f=G.frame,red=A.reduced,d=dark();
 // fireflies (window/lamp glows are drawn by style.js)
 if(d>0.05&&!red){X.globalCompositeOperation='lighter';for(const c of A.critters)if(c.k==='fly'){const a=0.5+0.5*Math.sin(c.ph);X.globalAlpha=a*Math.min(1,d);X.drawImage(gglow,c.x-cx-4,c.y-cy-4,8,8);}X.globalAlpha=1;X.globalCompositeOperation='source-over';}
 if(red)return;
 const r=region(S.x,S.y);if(r==='cave'){A.parts.length=0;return;}
 const rain=raining(r);const kind=r==='snow'?'snow':rain?'rain':r==='leaf'||r==='gale'?'leaf':r==='dusk'||r==='ember'?'mote':null;
 if(!kind){A.parts.length=0;return;}
 const cap=Math.min(MAXP(),kind==='rain'?70:kind==='snow'?55:kind==='mote'?24:14);
 while(A.parts.length<cap){A.parts.push({k:kind,x:Math.random()*VW,y:Math.random()*VH,v:Math.random(),ph:Math.random()*7});}
 if(A.parts.length>cap)A.parts.length=cap;
 if(rain){X.fillStyle='rgba(40,60,90,.12)';X.fillRect(0,0,VW,VH);}
 for(const p of A.parts){if(p.k!==kind){p.k=kind;}p.ph+=0.05;
  if(kind==='rain'){p.x-=1;p.y+=6+p.v*3;X.fillStyle='rgba(180,200,240,.55)';X.fillRect(p.x,p.y,1,5);}
  else if(kind==='snow'){p.y+=0.4+p.v*0.6;p.x+=Math.sin(p.ph)*0.4;X.fillStyle='rgba(255,255,255,.85)';X.fillRect(p.x,p.y,p.v>0.6?2:1,p.v>0.6?2:1);}
  else if(kind==='leaf'){p.y+=0.35+p.v*0.4;p.x+=Math.sin(p.ph)*0.8+(r==='gale'?0.8:0);X.fillStyle=['#d07020','#e0a030','#a04020'][Math.floor(p.v*3)];X.fillRect(p.x,p.y,Math.sin(p.ph*2)>0?3:2,2);}
  else{p.y-=0.15+p.v*0.2;p.x+=Math.sin(p.ph)*0.3;X.fillStyle=r==='ember'?'rgba(255,150,60,'+(0.4+0.4*Math.sin(p.ph*3))+')':'rgba(200,170,255,'+(0.3+0.3*Math.sin(p.ph*3))+')';X.fillRect(p.x,p.y,1,1);}
  if(p.y>VH+6){p.y=-6;p.x=Math.random()*(VW+40);}else if(p.y<-6){p.y=VH+4;p.x=Math.random()*VW;}if(p.x<-6)p.x=VW+4;else if(p.x>VW+6)p.x=-4;}
};
window.AMB=A;A.raining=raining;A.region=region;
})();
// ===== Minimap + full world map (brief 35) =====
(function(A){
let base=null,mini=null;const MW=74,MH=58,MX=320-MW-3,MY=15;A.bigMap=false;
const MC={0:'#5cb040',1:'#3a8a30',2:'#1f5a1c',3:'#d8c088',4:'#3080d8',5:'#e8d8a0',6:'#eef4ff',7:'#7a6a5c',8:'#3a3030',9:'#a07040',15:'#402810',16:'#7cc858',25:'#b8c8d8'};
function build(){const m=MAPS.world;base=document.createElement('canvas');base.width=m.w;base.height=m.h;const g=base.getContext('2d');const im=g.createImageData(m.w,m.h);
 for(let i=0;i<m.t.length;i++){const c=(window.WS&&WS.mini(i%m.w,Math.floor(i/m.w),m.t[i]))||MC[m.t[i]]||(SOLID.has(m.t[i])?'#c06050':'#c0b090');const n=c[0]==='#'?parseInt(c.slice(1),16):(c.match(/\d+/g).slice(0,3).reduce((a,v)=>a*256+(+v),0));im.data[i*4]=n>>16;im.data[i*4+1]=(n>>8)&255;im.data[i*4+2]=n&255;im.data[i*4+3]=255;}g.putImageData(im,0,0);
 mini=document.createElement('canvas');const ms=3;mini.width=MW*ms;mini.height=MH*ms;const q=mini.getContext('2d');q.imageSmoothingEnabled=true;q.imageSmoothingQuality='high';q.fillStyle='#14508a';q.fillRect(0,0,mini.width,mini.height);const k=Math.min(MW/m.w,MH/m.h)*ms;mini.k=k/ms;mini.ox=(MW-m.w*mini.k)/2;mini.oy=(MH-m.h*mini.k)/2;q.drawImage(base,mini.ox*ms,mini.oy*ms,m.w*k,m.h*k);
 for(const tn of TOWNS){q.strokeStyle='rgba(255,240,200,.9)';q.lineWidth=1.2;q.strokeRect((mini.ox+tn.x*mini.k)*ms,(mini.oy+tn.y*mini.k)*ms,TW*mini.k*ms,TH*mini.k*ms);}}
function markers(){const out=[];GYMS.forEach((gy,i)=>{if(S.medals[i])return;const tn=TOWNS[gy.town];const b=tn.blds&&tn.blds.find(b=>b.type==='gym');if(b)out.push([b.dx,b.dy,TCOL[gy.type],'G']);});
 for(const id in QUESTS){const st=S.quests[id];if(st&&st.st==='active'){const p=PEOPLE_BY_ID[QUESTS[id].giver];if(p){const pl=npcPlace(p);if(pl.map==='world')out.push([pl.x,pl.y,'#ffe040','!']);else{const tn=TOWNS[QUESTS[id].town];out.push([tn.x+10,tn.y+6,'#ffe040','!']);}}}}
 for(const q of QITEMS)if(!S.flags['has_'+q.id]&&S.quests[q.q]&&S.quests[q.q].st==='active')out.push([q.x,q.y,'#ffe040','?']);
 if(S.flags.champ&&!S.flags.finale)out.push([LAY.castleDoor[0],LAY.castleDoor[1],'#ff3030','!']);return out;}
A.map=function(m){if(!m.outdoor||S.map!=='world')return;if(!base)build();const f=G.frame;const fd={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[G.dir||'down'];
 if(A.bigMap){const k=Math.min((VW-8)/base.width,(VH-20)/base.height),w=base.width*k,h=base.height*k,ox=(VW-w)/2,oy=14+(VH-14-h)/2;
  X.fillStyle='rgba(0,0,0,.85)';X.fillRect(0,12,VW,VH-12);X.imageSmoothingEnabled=false;X.drawImage(base,ox,oy,w,h);
  X.font='7px monospace';X.textBaseline='top';for(const tn of TOWNS){const x=ox+(tn.x+TW/2)*k,y=oy+tn.y*k;X.fillStyle='rgba(255,255,255,.25)';X.fillRect(ox+tn.x*k,oy+tn.y*k,TW*k,TH*k);const tw=X.measureText(tn.name).width;X.fillStyle='rgba(0,0,0,.6)';X.fillRect(x-tw/2-1,y-9,tw+2,8);X.fillStyle='#fff';X.fillText(tn.name,x-tw/2,y-8);}
  for(const [x,y,c,l] of markers()){X.fillStyle=c;X.fillRect(ox+x*k-2,oy+y*k-2,4,4);}
  if((f>>4)&1||true){X.fillStyle='#ff2020';X.fillRect(ox+S.x*k-2,oy+S.y*k-2,5,5);X.fillStyle='#fff';X.fillRect(ox+(S.x+fd[0]*2)*k-1,oy+(S.y+fd[1]*2)*k-1,2,2);}
  X.fillStyle='#ccc';X.fillText('World Map - tap or press N to close   G gym  ! quest',6,VH-9);return;}
 const k=mini.k;X.fillStyle='rgba(8,4,12,.8)';X.fillRect(MX-2,MY-2,MW+4,MH+4);X.globalAlpha=0.95;X.imageSmoothingEnabled=true;X.drawImage(mini,MX,MY,MW,MH);X.globalAlpha=1;
 for(const [x,y,c] of markers()){const px=MX+mini.ox+x*k,py=MY+mini.oy+y*k;X.fillStyle='#000';X.fillRect(px-1.5,py-1.5,3,3);X.fillStyle=c;X.fillRect(px-1,py-1,2,2);}
 const px=MX+mini.ox+S.x*k,py=MY+mini.oy+S.y*k;X.strokeStyle='rgba(255,255,255,.5)';X.lineWidth=.5;X.strokeRect(px-VW/TS*k/2,py-VH/TS*k/2,VW/TS*k,VH/TS*k);X.fillStyle=(f>>4)&1?'#ff2020':'#ffffff';X.fillRect(px-1.5,py-1.5,3,3);X.fillStyle='#ffff80';X.fillRect(px+fd[0]*3-.5,py+fd[1]*3-.5,1,1);
 X.strokeStyle='#d9a94a';X.lineWidth=1;X.strokeRect(MX-1.5,MY-1.5,MW+3,MH+3);X.strokeStyle='rgba(246,220,140,.5)';X.lineWidth=.5;X.strokeRect(MX-3,MY-3,MW+6,MH+6);X.fillStyle='#f6dc8c';for(const [qx,qy] of [[MX-3,MY-3],[MX+MW+3,MY-3],[MX-3,MY+MH+3],[MX+MW+3,MY+MH+3]]){X.beginPath();X.arc(qx,qy,1.3,0,7);X.fill();}};
function tog(){if(G.mode==='world'&&S&&S.map==='world'&&!(GAME.UI.length)){A.bigMap=!A.bigMap;return true;}return false;}
A.toggleMap=tog;
window.addEventListener('keydown',e=>{if((e.key==='n'||e.key==='N')&&!(document.activeElement&&document.activeElement.tagName==='INPUT'))tog();});
function hook(){const c=document.getElementById('game');if(!c)return setTimeout(hook,50);c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect();const x=(e.clientX-r.left)*VW/r.width,y=(e.clientY-r.top)*VH/r.height;if(A.bigMap||(x>=MX-3&&y>=MY-3&&x<=MX+MW+3&&y<=MY+MH+3)){if(tog())e.preventDefault();}});}
hook();
})(window.AMB);
