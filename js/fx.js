// ===== Monster motion (brief 45) + battle animations (brief 43) =====
'use strict';
(function(){
const M={};window.MFX=M;
const now=()=>performance.now()/1000;
M.red=()=>!!(window.AMB&&AMB.reduced);
M.fast=()=>!!(navigator.webdriver&&!window.ANIM_FORCE);
const FLY=new Set(['Sparrook','Stormcrest','Lumenwing','Legranta','Driftjelly','Nebulune','Coralume','Reefseraph','Snowmote','Auroracle','Cogwisp','Pebbuzz','Glyphling','Breezel','Galeon','Psyfly','Duskowl','Mindmoth','Aurorath','Solaryx','Mancaco','Mantermo','Gloomote','Zappip']);
M.isFly=sp=>FLY.has(sp)||(SPECIES[sp]&&SPECIES[sp].types.includes('Gale'));
// ---- idle motion: returns transform params for a monster
M.idle=function(sp,size,seed){if(M.red())return {sx:1,sy:1,dy:0,rot:0,sway:0};const t=now()+(seed||0)+(hash(sp)%100)/37;const b=Math.sin(t*2.4);
 return {sx:1+0.022*b,sy:1-0.03*b,dy:M.isFly(sp)?Math.sin(t*1.7)*size*0.07-size*0.04:0,rot:Math.sin(t*0.9)*0.025,sway:Math.sin(t*1.3)};};
// ---- elemental aura particles (stateless; derived from time)
const AUR={Fire:['#ff7a2a',-1,'ember'],Tide:['#6ac8ff',1,'drop'],Volt:['#ffe84a',0,'spark'],Frost:['#e8f8ff',1,'snow'],Leaf:['#7ad850',1,'leaf'],Dark:['#a060e0',-1,'wisp'],Light:['#fff0a0',-1,'glint'],Gale:['#c0e0ff',0,'swirl'],Mind:['#ff8ad0',-1,'ring'],Metal:['#d8e0f0',-1,'glint'],Stone:['#c8a070',1,'dust'],Echo:['#c8b0ff',-1,'ring']};
M.aura=function(ctx,sp,cx,cy,size,n){if(M.red()||!SPECIES[sp])return;const ty=SPECIES[sp].types;const A=AUR[ty[0]]||AUR[ty[1]];if(!A)return;const [col,dir,kind]=A;const t=now();n=n||(SPECIES[sp].legend?10:6);ctx.save();
 for(let k=0;k<n;k++){const ph=((t*0.45+k/n+hash(sp+k)%13/13)%1);const ang=k*2.399+t*0.3;const r=size*(0.35+0.25*Math.sin(k*1.7+t));let x=cx+Math.cos(ang)*r,y=cy+Math.sin(ang)*r*0.45;y+=dir*(ph-0.5)*size*0.9;const a=Math.sin(ph*Math.PI);
  ctx.globalAlpha=a*0.85;ctx.fillStyle=col;ctx.strokeStyle=col;const s=Math.max(0.8,size*0.035);
  if(kind==='ember'||kind==='spark'||kind==='glint'){if(kind==='spark'&&(Math.floor(t*12+k)%3))continue;ctx.shadowColor=col;ctx.shadowBlur=s*3;ctx.beginPath();ctx.arc(x,y,s*(kind==='glint'?0.8:1),0,7);ctx.fill();ctx.shadowBlur=0;if(kind==='glint'){ctx.fillRect(x-s*2,y-s*.2,s*4,s*.4);ctx.fillRect(x-s*.2,y-s*2,s*.4,s*4);}}
  else if(kind==='drop'){ctx.beginPath();ctx.moveTo(x,y-s*1.6);ctx.quadraticCurveTo(x+s,y,x,y+s*.8);ctx.quadraticCurveTo(x-s,y,x,y-s*1.6);ctx.fill();}
  else if(kind==='snow'){ctx.fillRect(x-s*.6,y-s*.6,s*1.2,s*1.2);}
  else if(kind==='leaf'){ctx.save();ctx.translate(x,y);ctx.rotate(t*2+k);ctx.beginPath();ctx.ellipse(0,0,s*1.6,s*.7,0,0,7);ctx.fill();ctx.restore();}
  else if(kind==='wisp'){ctx.globalAlpha=a*0.45;ctx.beginPath();ctx.arc(x,y,s*2.2,0,7);ctx.fill();}
  else if(kind==='swirl'){ctx.lineWidth=s*.5;ctx.beginPath();ctx.arc(cx,cy,r,ang,ang+0.8);ctx.stroke();}
  else if(kind==='ring'){ctx.lineWidth=s*.4;ctx.beginPath();ctx.ellipse(cx,cy,r*ph*1.4,r*ph*0.5,0,0,7);ctx.stroke();}
  else{ctx.globalAlpha=a*0.5;ctx.fillRect(x,y,s,s);}}
 ctx.restore();};
// ---- overworld roaming wild monsters in tall grass (visual life; encounters stay random)
M.roamers=function(m,camx,camy){if(M.red()||S.map!=='world')return;const t=now();const x0=Math.floor(camx/TS),y0=Math.floor(camy/TS);let cnt=0;
 for(let y=y0;y<=y0+VH/TS+1&&cnt<4;y++)for(let x=x0;x<=x0+VW/TS+1&&cnt<4;x++){if(x<0||y<0||x>=m.w||y>=m.h)continue;const v=m.t[y*m.w+x];if(v!==T.TALL&&v!==T.SNOWTALL)continue;
  const h=hash(x+','+y);if(h%61!==0)continue;const z=ZONEMAP[y*m.w+x];if(!z||!ZONES[z])continue;const sp=ZONES[z].sp[h%ZONES[z].sp.length];cnt++;
  const per=6+(h%5);const ph=((t+h%17)/per)%1;const vis=ph<0.7;if(!vis)continue;const k=ph/0.7;const dx=Math.sin(k*Math.PI*2+h)*10,hop=Math.abs(Math.sin(k*Math.PI*6))*(M.isFly(sp)?0:3)+(M.isFly(sp)?4+Math.sin(t*3)*2:0);
  const sx=x*TS-camx+8+dx,sy=y*TS-camy+10-hop;X.save();X.globalAlpha=Math.min(1,Math.sin(k*Math.PI)*3)*0.95;{const fl=M.isFly(sp),hk=fl?Math.max(.35,1-hop/12):1-hop/10;X.fillStyle='rgba(10,4,20,'+(fl?.22*hk:.34)+')';X.beginPath();X.ellipse(x*TS-camx+8+dx,y*TS-camy+14,4.4*hk,1.5*hk,0,0,7);X.fill();}
  drawMon(X,sp,sx,sy-2,11,Math.cos(k*Math.PI*2+h)<0,{still:true});X.restore();}};
// ================= Battle FX =================
const B={fx:[],nums:[],busy:null,shake:0};M.B=B;
const POS={p:[90,150],e:[230,86]};
function wait(ms){if(M.fast())return Promise.resolve();if(M.red())ms*=0.5;return new Promise(res=>{const t0=performance.now();B.busy={res,end:t0+ms};const chk=()=>{if(!B.busy||B.busy.res!==res)return;if(performance.now()>=B.busy.end){B.busy=null;res();}else requestAnimationFrame(chk);};requestAnimationFrame(chk);});}
M.skip=function(){if(B.busy){const r=B.busy.res;B.busy=null;B.fx.length=0;r();return true;}return false;};
function anim(k){return BT&&(BT[k]||(BT[k]={dx:0,dy:0,a:1,flash:0,sc:1}));}
M.st=k=>anim(k);
M.entrance=async function(){if(!BT)return;const e=anim('ea'),p=anim('pa');if(M.fast()){e.dx=p.dx=0;e.sc=p.sc=1;return;}
 const t0=performance.now();e.dx=160;p.sc=0;if(window.SFX)SFX.play('appear');B.fx.push({kind:'burst',x:POS.p[0],y:POS.p[1]-10,col:'#fff0c0',t0,dur:500});
 await new Promise(res=>{const f=()=>{const k=Math.min(1,(performance.now()-t0)/600);e.dx=160*(1-k)*(1-k);p.sc=k<0.3?0:Math.min(1,(k-0.3)/0.4*1.15);if(k>=1){e.dx=0;p.sc=1;res();}else requestAnimationFrame(f);};f();});};
M.sendOut=async function(side){const a=anim(side==='p'?'pa':'ea');a.a=1;a.dy=0;if(M.fast()){a.sc=1;return;}a.sc=0;const [x,y]=POS[side];B.fx.push({kind:'burst',x,y:y-10,col:'#ffffff',t0:performance.now(),dur:450});if(window.SFX)SFX.play('appear');
 const t0=performance.now();await new Promise(res=>{const f=()=>{const k=Math.min(1,(performance.now()-t0)/400);a.sc=k<1?k*1.12:1;if(k>=1)res();else requestAnimationFrame(f);};f();});};
// move animation by type; isE: enemy attacks
M.move=async function(isE,mvName,type,status,sp){const from=isE?'e':'p',to=isE?'p':'e';const A=anim(from+'a');const [fx,fy]=POS[from],[tx,ty]=POS[to];const t0=performance.now();
 if(window.SFX)SFX[status?'play':'attack'](status?'status':type);if(M.fast())return;
 const uniq=sp==='Mandara'||sp==='Mancaco'||sp==='Mantermo'?sp:null;const dur=uniq?1100:status?700:750;
 B.fx.push({kind:status?'aura':'type',type,uniq,fx,fy:fy-14,tx,ty:ty-14,t0,dur,col:TCOL[type]||'#fff',self:status&&/\+$/.test((MOVES[mvName]||{}).eff||'')});
 // lunge
 const dir=isE?-1:1;const lunge=()=>{const k=(performance.now()-t0)/dur;if(!BT)return;if(k<0.25){A.dx=Math.sin(k/0.25*Math.PI)*12*dir*(status?0.3:1);A.dy=-Math.sin(k/0.25*Math.PI)*4*(isE?-1:1);requestAnimationFrame(lunge);}else{A.dx=0;A.dy=0;}};if(!status)lunge();
 await wait(dur*0.85);};
M.hit=async function(isE,dmg,crit,eff){const to=isE?'p':'e';const D=anim(to+'a');const [tx,ty]=POS[to];if(window.SFX){SFX.play(crit?'crit':'hit');if(eff>1)setTimeout(()=>SFX.play('super'),80);}
 if(M.fast())return;const t0=performance.now();B.nums.push({x:tx,y:ty-36,txt:String(dmg),col:crit?'#ffd040':eff>1?'#ff7a4a':'#ffffff',t0,big:crit||eff>1});
 if(eff>1)B.fx.push({kind:'super',x:tx,y:ty-14,t0,dur:600,col:'#ffb040'});if(crit){B.shake=performance.now()+300;}
 // hit-stop then shake + flash
 await wait(80);const t1=performance.now();await new Promise(res=>{const f=()=>{const k=(performance.now()-t1)/360;if(!BT||k>=1){D.dx=0;D.flash=0;res();return;}D.dx=Math.sin(k*40)*4*(1-k);D.flash=Math.floor(k*8)%2?0.8:0;requestAnimationFrame(f);};f();});};
M.faint=async function(side){const D=anim(side==='p'?'pa':'ea');if(window.SFX)SFX.play('faint');if(M.fast()){D.a=0;return;}const t0=performance.now();await new Promise(res=>{const f=()=>{const k=Math.min(1,(performance.now()-t0)/650);D.dy=k*k*30;D.a=1-k;if(k>=1)res();else requestAnimationFrame(f);};f();});};
M.restore=function(side){const D=anim(side==='p'?'pa':'ea');D.dy=0;D.a=1;D.sc=1;D.dx=0;};
// capture orb
M.throwOrb=async function(){B.orb={x:40,y:220,st:'fly',t0:performance.now(),wob:0};if(window.SFX)SFX.play('throw');const E=anim('ea');if(M.fast()){B.orb.st='ground';B.orb.x=POS.e[0];B.orb.y=POS.e[1]+10;E.sc=0;return;}
 await wait(550);B.orb.st='open';B.fx.push({kind:'burst',x:POS.e[0],y:POS.e[1]-10,col:'#fff8d0',t0:performance.now(),dur:400});const t0=performance.now();
 await new Promise(res=>{const f=()=>{const k=Math.min(1,(performance.now()-t0)/350);E.sc=1-k;if(k>=1)res();else requestAnimationFrame(f);};f();});B.orb.st='ground';B.orb.t0=performance.now();await wait(250);};
M.wobble=async function(){if(window.SFX)SFX.play('wobble');if(!B.orb)return;B.orb.wob=performance.now();await wait(520);};
M.caught=async function(){if(window.SFX)SFX.play('catch');if(B.orb){B.orb.st='caught';B.orb.t0=performance.now();}await wait(900);B.orb=null;};
M.breakFree=async function(){if(window.SFX)SFX.play('breakfree');const E=anim('ea');B.fx.push({kind:'burst',x:POS.e[0],y:POS.e[1]-10,col:'#ffffff',t0:performance.now(),dur:400});B.orb=null;if(M.fast()){E.sc=1;return;}const t0=performance.now();await new Promise(res=>{const f=()=>{const k=Math.min(1,(performance.now()-t0)/300);E.sc=k;if(k>=1)res();else requestAnimationFrame(f);};f();});};
M.reset=function(){B.fx.length=0;B.nums.length=0;B.orb=null;B.busy=null;};
// ---- per-frame drawing in battle canvas (320x240 logical, device-res canvas)
M.shakeOff=function(){if(B.shake>performance.now()&&!M.red())return [(Math.random()-.5)*6,(Math.random()-.5)*5];return [0,0];};
M.draw=function(x){const T0=performance.now();B.fx=B.fx.filter(f=>T0-f.t0<f.dur);for(const f of B.fx){const k=(T0-f.t0)/f.dur;x.save();drawFx(x,f,k);x.restore();}
 B.nums=B.nums.filter(n=>T0-n.t0<900);for(const n of B.nums){const k=(T0-n.t0)/900;x.save();x.globalAlpha=Math.min(1,(1-k)*2);x.font=(n.big?'bold 15px':'bold 12px')+' Georgia,serif';x.textAlign='center';x.lineWidth=3;x.strokeStyle='#1a0a10';const y=n.y-k*18-Math.sin(Math.min(1,k*4)*Math.PI)*6;x.strokeText(n.txt,n.x,y);x.fillStyle=n.col;x.fillText(n.txt,n.x,y);x.restore();}
 if(B.orb)drawOrb(x,B.orb,T0);};
function drawOrb(x,o,T0){let ox=o.x,oy=o.y,rot=0;const [ex,ey]=POS.e;if(o.st==='fly'){const k=Math.min(1,(T0-o.t0)/550);ox=40+(ex-40)*k;oy=220+(ey-14-220)*k-Math.sin(k*Math.PI)*70;rot=k*12;}else if(o.st==='open'){ox=ex;oy=ey-14;}else{ox=ex;oy=ey+10;if(o.wob&&T0-o.wob<520){rot=Math.sin((T0-o.wob)/520*Math.PI*3)*0.5;}}
 x.save();x.translate(ox,oy);x.rotate(rot);const r=7;const g=x.createRadialGradient(-2,-3,1,0,0,r);g.addColorStop(0,'#ff8a8a');g.addColorStop(1,'#8a0a18');x.fillStyle=g;x.beginPath();x.arc(0,0,r,Math.PI,0);x.fill();x.fillStyle='#f0ece0';x.beginPath();x.arc(0,0,r,0,Math.PI);x.fill();x.fillStyle='#1a1010';x.fillRect(-r,-0.8,r*2,1.6);x.fillStyle='#d9a94a';x.beginPath();x.arc(0,0,2.2,0,7);x.fill();x.strokeStyle='#1a1010';x.lineWidth=.6;x.stroke();
 if(o.st==='open'){x.globalCompositeOperation='lighter';x.fillStyle='rgba(255,250,200,.6)';x.beginPath();x.arc(0,0,14,0,7);x.fill();}x.restore();
 if(o.st==='caught'){const k=(T0-o.t0)/900;x.save();x.fillStyle='#fff6a0';x.shadowColor='#ffe060';x.shadowBlur=6;for(let i=0;i<6;i++){const a=i/6*6.28+k*2,d=8+k*22;star(x,ox+Math.cos(a)*d,oy+Math.sin(a)*d*0.7,3*(1-k)+1);}x.restore();}}
function star(x,cx,cy,r){x.beginPath();for(let i=0;i<8;i++){const a=i/8*6.283,rr=i%2?r*.35:r;x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}x.closePath();x.fill();}
function lerp(a,b,k){return a+(b-a)*k;}
function drawFx(x,f,k){const col=f.col;x.globalCompositeOperation='lighter';
 if(f.kind==='burst'){x.globalAlpha=1-k;x.fillStyle=col;x.beginPath();x.arc(f.x,f.y,6+k*30,0,7);x.fill();x.strokeStyle=col;x.lineWidth=2;for(let i=0;i<10;i++){const a=i/10*6.28;x.beginPath();x.moveTo(f.x+Math.cos(a)*k*20,f.y+Math.sin(a)*k*20);x.lineTo(f.x+Math.cos(a)*(k*20+8),f.y+Math.sin(a)*(k*20+8));x.stroke();}return;}
 if(f.kind==='super'){x.globalAlpha=1-k;x.strokeStyle='#ffd060';x.lineWidth=3*(1-k)+1;x.beginPath();x.arc(f.x,f.y,10+k*40,0,7);x.stroke();x.fillStyle='#fff0a0';for(let i=0;i<8;i++){const a=i/8*6.28+k;star(x,f.x+Math.cos(a)*(14+k*30),f.y+Math.sin(a)*(14+k*30),4*(1-k)+1);}return;}
 if(f.kind==='aura'){const cx=f.self?f.fx:f.tx,cy=f.self?f.fy:f.ty;x.globalAlpha=Math.sin(k*Math.PI)*0.7;const g=x.createRadialGradient(cx,cy,2,cx,cy,34);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.beginPath();x.arc(cx,cy,34,0,7);x.fill();
  x.strokeStyle=col;x.lineWidth=1.5;for(let i=0;i<3;i++){x.globalAlpha=Math.sin(k*Math.PI)*(0.8-i*0.2);x.beginPath();x.ellipse(cx,cy+18-((k+i/3)%1)*40,26-i*4,7,0,0,7);x.stroke();}return;}
 const {fx,fy,tx,ty}=f;const pk=Math.min(1,k/0.6),ik=Math.max(0,(k-0.5)/0.5);const px=lerp(fx,tx,pk),py=lerp(fy,ty,pk);const R=(i)=>((Math.sin(i*12.9898+f.t0)*43758.5453)%1+1)%1;
 if(f.uniq==='Mandara'){x.globalAlpha=1-ik;const g=x.createLinearGradient(tx,ty+30,tx,ty-80);g.addColorStop(0,'#ff2a10');g.addColorStop(.5,'#ff8a20');g.addColorStop(1,'rgba(40,0,10,0)');x.fillStyle=g;const w=10+Math.sin(k*30)*3+k*16;x.fillRect(tx-w,ty-90*Math.min(1,k*2),w*2,120);
  x.globalCompositeOperation='source-over';x.strokeStyle='rgba(30,0,20,.85)';x.lineWidth=3;x.beginPath();x.arc(tx,ty+12,20+k*40,0,7);x.stroke();for(let i=0;i<14;i++){x.fillStyle='#ffb040';x.globalAlpha=(1-k);x.fillRect(tx+(R(i)-.5)*60,ty+20-R(i+5)*90*k,2,2);}return;}
 if(f.uniq==='Mancaco'){x.globalAlpha=Math.sin(k*Math.PI);const g=x.createLinearGradient(tx-14,0,tx+14,0);g.addColorStop(0,'rgba(255,240,160,0)');g.addColorStop(.5,'#fffbe0');g.addColorStop(1,'rgba(255,240,160,0)');x.fillStyle=g;x.fillRect(tx-14,0,28,ty+20);
  x.fillStyle='#ffe890';star(x,tx,ty-10,10+k*18);x.strokeStyle='#ffd060';x.lineWidth=2;x.beginPath();x.moveTo(tx,-10+k*20);x.lineTo(tx,ty-24);x.stroke();return;}
 if(f.uniq==='Mantermo'){x.globalAlpha=Math.sin(k*Math.PI);x.strokeStyle='#7ae0ff';for(let i=0;i<5;i++){x.lineWidth=3-i*.4;x.beginPath();x.ellipse(tx,ty-10+i*6,40-i*6+k*10,10-i,k*6+i,0,5);x.stroke();}x.fillStyle='rgba(160,230,255,.8)';for(let i=0;i<16;i++)x.fillRect(tx+(R(i)-.5)*90,ty-60+((R(i+3)+k*2)%1)*90,1.2,6);return;}
 switch(f.type){
  case 'Fire':{for(let i=0;i<8;i++){const kk=Math.max(0,pk-i*0.05);const xx=lerp(fx,tx,kk),yy=lerp(fy,ty,kk)-Math.sin(kk*Math.PI)*14;x.globalAlpha=(1-ik)*(1-i/9);x.fillStyle=i<3?'#ffe080':'#ff5a20';x.beginPath();x.arc(xx,yy,6-i*0.5,0,7);x.fill();}
   if(ik>0){x.globalAlpha=1-ik;x.fillStyle='#ff7a20';for(let i=0;i<10;i++){const a=i/10*6.28;x.beginPath();x.arc(tx+Math.cos(a)*ik*26,ty+Math.sin(a)*ik*18-ik*10,5*(1-ik)+1,0,7);x.fill();}}break;}
  case 'Tide':{x.strokeStyle='#6ad0ff';x.lineWidth=5;x.globalAlpha=1-ik;x.beginPath();x.moveTo(fx,fy);x.quadraticCurveTo((fx+tx)/2,Math.min(fy,ty)-30,px,py);x.stroke();x.lineWidth=2;x.strokeStyle='#e0faff';x.stroke();
   if(ik>0){x.fillStyle='#9ae8ff';for(let i=0;i<12;i++){const a=-Math.PI*R(i);x.beginPath();x.arc(tx+Math.cos(a)*ik*30,ty+Math.sin(a)*ik*26+ik*ik*20,2.2,0,7);x.fill();}}break;}
  case 'Leaf':{for(let i=0;i<12;i++){const kk=Math.min(1,Math.max(0,k*1.4-i*0.04));const a=i*0.9+k*10;const xx=lerp(fx,tx,kk)+Math.cos(a)*14*(1-kk*0.5),yy=lerp(fy,ty,kk)+Math.sin(a)*10;x.globalAlpha=1-ik*0.8;x.fillStyle=i%2?'#7ad850':'#c8f080';x.save();x.translate(xx,yy);x.rotate(a);x.beginPath();x.ellipse(0,0,4,1.8,0,0,7);x.fill();x.restore();}break;}
  case 'Volt':{if(k>0.15){x.globalAlpha=Math.floor(k*20)%2?1:0.4;x.strokeStyle='#fff6a0';x.lineWidth=2.5;x.shadowColor='#ffe040';x.shadowBlur=8;x.beginPath();x.moveTo(tx+(R(1)-.5)*20,0);let yy=0,xx=tx;while(yy<ty-10){yy+=12;xx=tx+(R(yy)-.5)*24;x.lineTo(xx,yy);}x.lineTo(tx,ty-10);x.stroke();
    x.globalAlpha=0.3*(1-ik);x.fillStyle='#fff8c0';x.fillRect(0,0,320,240);}break;}
  case 'Stone':{for(let i=0;i<7;i++){const kk=Math.min(1,Math.max(0,k*1.5-i*0.06));const xx=lerp(fx,tx,kk)+(R(i)-.5)*16,yy=lerp(fy-20,ty,kk)-Math.sin(kk*Math.PI)*30;x.globalCompositeOperation='source-over';x.globalAlpha=1-ik;x.fillStyle=i%2?'#a08858':'#c8b080';x.beginPath();x.moveTo(xx,yy-5);x.lineTo(xx+4,yy);x.lineTo(xx+1,yy+5);x.lineTo(xx-4,yy+2);x.closePath();x.fill();x.strokeStyle='#3a2a1a';x.lineWidth=.8;x.stroke();}break;}
  case 'Gale':{x.strokeStyle='#d8f0ff';for(let i=0;i<4;i++){x.globalAlpha=(1-ik)*(0.9-i*0.15);x.lineWidth=2-i*0.3;x.beginPath();x.arc(px,py,8+i*6+k*6,k*12+i,k*12+i+3.5);x.stroke();}break;}
  case 'Frost':{for(let i=0;i<9;i++){const kk=Math.min(1,Math.max(0,k*1.3-i*0.03));const xx=lerp(fx,tx,kk)+(R(i)-.5)*20,yy=lerp(fy,ty,kk)+(R(i+9)-.5)*16;x.globalAlpha=1-ik;x.fillStyle='#e0faff';x.save();x.translate(xx,yy);x.rotate(i);x.beginPath();x.moveTo(0,-6);x.lineTo(1.6,0);x.lineTo(0,6);x.lineTo(-1.6,0);x.closePath();x.fill();x.restore();}
   if(ik>0){x.globalAlpha=(1-ik)*0.5;x.fillStyle='#c0f0ff';x.beginPath();x.arc(tx,ty-6,22,0,7);x.fill();}break;}
  case 'Dark':{x.globalCompositeOperation='source-over';for(let i=0;i<6;i++){x.globalAlpha=Math.sin(k*Math.PI)*0.85;x.strokeStyle=i%2?'#2a0a3a':'#6a2a9a';x.lineWidth=4-i*0.4;const a=i/6*6.28;x.beginPath();x.moveTo(tx+Math.cos(a)*50,ty+Math.sin(a)*30+10);x.quadraticCurveTo(tx+Math.cos(a+1)*25,ty+Math.sin(a+1)*20,lerp(tx+Math.cos(a)*50,tx,pk),lerp(ty+Math.sin(a)*30,ty-8,pk));x.stroke();}break;}
  case 'Mind':{x.strokeStyle='#ff8ad0';for(let i=0;i<5;i++){const kk=(k*1.6+i*0.15)%1;x.globalAlpha=(1-kk)*0.9;x.lineWidth=2;x.beginPath();x.ellipse(lerp(fx,tx,kk),lerp(fy,ty,kk),6+kk*14,3+kk*7,0,0,7);x.stroke();}break;}
  case 'Metal':{if(k>0.2){const kk=Math.min(1,(k-0.2)/0.4);x.globalAlpha=1-ik;x.strokeStyle='#ffffff';x.lineWidth=3;x.shadowColor='#c0d0ff';x.shadowBlur=6;for(let i=0;i<3;i++){x.beginPath();x.moveTo(tx-26+i*8,ty-34+i*4);x.lineTo(lerp(tx-26+i*8,tx+22+i*8,kk),lerp(ty-34+i*4,ty+10+i*4,kk));x.stroke();}}break;}
  case 'Light':{x.globalAlpha=Math.sin(k*Math.PI);const g=x.createLinearGradient(fx,fy,tx,ty);g.addColorStop(0,'rgba(255,250,210,.2)');g.addColorStop(1,'#fffbe0');x.strokeStyle=g;x.lineWidth=7;x.beginPath();x.moveTo(fx,fy);x.lineTo(px,py);x.stroke();x.lineWidth=2;x.strokeStyle='#ffffff';x.stroke();x.fillStyle='#fff6c0';star(x,px,py,8+ik*10);break;}
  case 'Echo':{for(let i=0;i<6;i++){const kk=(k*1.4+i*0.12)%1;x.globalAlpha=(1-kk)*0.85;x.strokeStyle=i%2?'#e8d8ff':'#9a70ff';x.lineWidth=2;x.beginPath();x.arc(lerp(fx,tx,kk),lerp(fy,ty,kk),4+kk*18,0,7);x.stroke();}if(ik>0){x.globalAlpha=(1-ik)*0.4;x.fillStyle='#e0d0ff';x.beginPath();x.arc(tx,ty-8,26*ik,0,7);x.fill();}break;}
  default:{x.globalAlpha=1-ik;x.fillStyle='#fff';star(x,tx+(R(1)-.5)*10,ty-10,6+k*10);x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.arc(tx,ty-10,k*24,0,7);x.stroke();}}}
})();
