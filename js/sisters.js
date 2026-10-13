// ===== Living sisters (brief 52): animated v2 cutouts (battle, cutscenes, Dex) + goddess-sized overworld pixel sprites.
'use strict';
(function(){
const META={
 Mandara:{c:'#ff2a30',c2:'#7a0010',glow:'#ff4040',halo:[0.47,0.075,0.075],eyes:[0.47,0.155,0.012],hands:[[0.25,0.38],[0.75,0.38]],tail:[0.8,0.42,0.78],kind:'blood',hair:'#e8e2ea',robe:'#1a0c12',robe2:'#6a0a14',skin:'#f2dcd8',horn:'#2a1418'},
 Mancaco:{c:'#ffd860',c2:'#a06a10',glow:'#fff0a0',halo:[0.45,0.07,0.075],eyes:[0.45,0.15,0.012],hands:[[0.3,0.45],[0.62,0.42]],tail:[0.78,0.5,0.86],kind:'light',hair:'#f8d870',robe:'#f2e6c8',robe2:'#c89a40',skin:'#f6dcc0',horn:'#d8b060'},
 Mantermo:{c:'#40f0d8',c2:'#0a5a6a',glow:'#a0fff0',halo:[0.5,0.05,0.07],eyes:[0.5,0.125,0.012],hands:[[0.25,0.45],[0.7,0.42]],tail:[0.82,0.45,0.85],kind:'water',hair:'#50d8c8',robe:'#0e2a3a',robe2:'#1a6a7a',skin:'#cfe4ea',horn:'#20444c'}};
const SIS={META};window.SIS=SIS;
const red=()=>!!((window.AMB&&AMB.reduced)||(window.MFX&&MFX.red&&MFX.red()));
const now=()=>performance.now()/1000;
const PARTS=[];let FX=[];
function hexa(c,a){const n=parseInt(c.slice(1),16);return 'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
function sigil(ctx,x,y,r,t,m,a){ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(x,y);
 const g=ctx.createRadialGradient(0,0,r*.2,0,0,r*1.6);g.addColorStop(0,hexa(m.glow,.35*a));g.addColorStop(1,hexa(m.c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*1.6,0,7);ctx.fill();
 ctx.rotate(t*0.35);ctx.strokeStyle=hexa(m.c,.75*a);ctx.lineWidth=Math.max(.6,r*.06);ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();ctx.lineWidth=Math.max(.4,r*.03);ctx.beginPath();ctx.arc(0,0,r*.82,0,7);ctx.stroke();
 for(let i=0;i<12;i++){const an=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(an)*r*.82,Math.sin(an)*r*.82);ctx.lineTo(Math.cos(an)*r*(i%3?1:1.22),Math.sin(an)*r*(i%3?1:1.22));ctx.stroke();}
 ctx.rotate(-t*0.8);ctx.strokeStyle=hexa(m.glow,.6*a);ctx.beginPath();for(let i=0;i<3;i++){const an=i/3*Math.PI*2;const px=Math.cos(an)*r*.6,py=Math.sin(an)*r*.6;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.stroke();ctx.restore();}
function spawn(sp,x,y,s,m,reduced){if(Math.random()>(reduced?0.25:0.9))return;const k=m.kind;
 PARTS.push({sp,x:x+(Math.random()-.5)*s*.04,y:y+(Math.random()-.5)*s*.04,vx:(Math.random()-.5)*s*(k==='water'?.25:.08),vy:k==='blood'?s*(.05+Math.random()*.12):k==='light'?-s*(.08+Math.random()*.12):-s*(Math.random()*.08-.02),life:1,dec:.6+Math.random()*.6,r:s*(.006+Math.random()*.012),c:Math.random()<.5?m.c:m.glow,k});if(PARTS.length>260)PARTS.shift();}
function drawParts(ctx,sp,dt){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=PARTS.length-1;i>=0;i--){const p=PARTS[i];if(p.sp!==sp)continue;p.life-=p.dec*dt;if(p.life<=0){PARTS.splice(i,1);continue;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k==='water')p.vx+=Math.sin(p.y*.05+p.life*6)*p.r*4*dt*60*.02;ctx.fillStyle=hexa(p.c,Math.min(1,p.life*1.3)*.85);ctx.beginPath();
  if(p.k==='water'&&i%3===0){ctx.ellipse(p.x,p.y,p.r*3,p.r*.6,Math.atan2(p.vy,p.vx),0,7);}else ctx.arc(p.x,p.y,p.r*(p.k==='blood'?1.2:1),0,7);ctx.fill();}ctx.restore();}
let lastT=now();
// animated cutout. (cx,cy) = centre point used by drawMandaraArt; top = cy-h*0.62
SIS.draw=function(ctx,sp,im,cx,cy,size,opt){opt=opt||{};const m=META[sp];if(!m)return false;const t=now(),dt=Math.min(.05,Math.max(0,t-lastT));lastT=t;const R=red(),A=R?.35:1;
 const h=size*1.25,w=h*im.naturalWidth/im.naturalHeight;const hover=Math.sin(t*1.1)*h*.014*A,br=1+Math.sin(t*1.6)*.012*A;
 const top=cy-h*.62+hover,left=cx-w/2;SIS.last={sp,hover,br,t};const lunge=opt.lunge||0;
 // halo sigil behind
 const pulse=.75+Math.sin(t*2.2)*.25;sigil(ctx,left+w*m.halo[0],top+h*m.halo[1],h*m.halo[2]*(1+.05*Math.sin(t*2.2)),R?t*.3:t,m,pulse);
 // strip-sliced sway (grows toward hem / hair ends), tail column sways extra
 const N=R?14:36,iw=im.naturalWidth,ih=im.naturalHeight;const tx=m.tail[0];
 ctx.save();ctx.translate(cx,top+h);ctx.scale(1,br);ctx.translate(-cx,-(top+h));
 for(let i=0;i<N;i++){const v0=i/N,v1=(i+1)/N;const v=(v0+v1)/2;const amp=Math.pow(Math.max(0,v-.12)/.88,1.6)*h*.022*A;const off=Math.sin(t*1.3-v*3.4)*amp;
  const sy=ih*v0,sh=ih*(v1-v0)+1,dy=top+h*v0,dh=h*(v1-v0)+.6;
  const inTail=v>m.tail[1]&&v<m.tail[2];
  if(!inTail){ctx.drawImage(im,0,sy,iw,sh,left+off,dy,w,dh);}
  else{const ts=Math.sin(t*1.7-v*5)*h*.03*A*Math.sin((v-m.tail[1])/(m.tail[2]-m.tail[1])*Math.PI);ctx.drawImage(im,0,sy,iw*tx,sh,left+off,dy,w*tx,dh);ctx.drawImage(im,iw*tx,sy,iw*(1-tx),sh,left+w*tx+off+ts,dy,w*(1-tx),dh);}}
 if(opt.flash){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,opt.flash);ctx.drawImage(im,left,top,w,h);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
 ctx.restore();
 // glowing pulsing eyes
 {const ex=left+w*m.eyes[0],ey=top+h*m.eyes[1],d=w*m.eyes[2]*1.6,er=Math.max(.8,h*.008)*(1+.4*Math.sin(t*3.1));ctx.save();ctx.globalCompositeOperation='lighter';for(const s of [-1,1]){const g=ctx.createRadialGradient(ex+s*d,ey,0,ex+s*d,ey,er*3);g.addColorStop(0,hexa(m.glow,.9));g.addColorStop(1,hexa(m.c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(ex+s*d,ey,er*3,0,7);ctx.fill();}ctx.restore();}
 // hand magic
 for(const [hx,hy] of m.hands){const x=left+w*hx,y=top+h*hy;spawn(sp,x,y,h,m,R);ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y,0,x,y,h*.06);g.addColorStop(0,hexa(m.glow,.5+.2*Math.sin(t*4+hx*9)));g.addColorStop(1,hexa(m.c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,h*.06,0,7);ctx.fill();ctx.restore();}
 drawParts(ctx,sp,dt);return true;};
// signature move FX (battle overlay)
SIS.signature=function(sp,x,y){const m=META[sp];if(!m)return;FX.push({sp,m,x,y,t0:now(),dur:red()?.6:1.1});};
SIS.drawFx=function(ctx){const t=now();FX=FX.filter(f=>t-f.t0<f.dur);for(const f of FX){const k=(t-f.t0)/f.dur,m=f.m;ctx.save();ctx.globalCompositeOperation='lighter';
  if(m.kind==='blood'){for(let r=0;r<3;r++){ctx.strokeStyle=hexa(m.c,(1-k)*.8);ctx.lineWidth=4*(1-k)+1;ctx.beginPath();ctx.arc(f.x,f.y,(k*90+r*14),0,7);ctx.stroke();}for(let i=0;i<14;i++){const an=i/14*Math.PI*2+k;ctx.strokeStyle=hexa(m.glow,(1-k));ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x+Math.cos(an)*k*30,f.y+Math.sin(an)*k*30);ctx.lineTo(f.x+Math.cos(an)*k*110,f.y+Math.sin(an)*k*110);ctx.stroke();}}
  else if(m.kind==='light'){for(let i=0;i<5;i++){const bx=f.x+(i-2)*22+Math.sin(i*3)*6;const g=ctx.createLinearGradient(bx,0,bx+14,0);g.addColorStop(0,hexa(m.c,0));g.addColorStop(.5,hexa(m.glow,(1-k)*.85));g.addColorStop(1,hexa(m.c,0));ctx.fillStyle=g;ctx.fillRect(bx-4,0,22,240);}ctx.fillStyle=hexa('#ffffff',Math.max(0,.5-k));ctx.fillRect(0,0,320,240);}
  else{for(let i=0;i<40;i++){const a=i/40*Math.PI*6+k*8,r=i*2.4*(.4+k);ctx.fillStyle=hexa(i%2?m.c:m.glow,(1-k)*.8);ctx.beginPath();ctx.arc(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*.55,2.2,0,7);ctx.fill();}}
  ctx.restore();}};
// hook battle FX: sisters' moves trigger the signature effect; overlay drawn with MFX.draw
if(window.MFX){const om=MFX.move;MFX.move=function(isE,mvName,type,status,sp){if(META[sp]){const tgt=isE?[90,150]:[230,86];SIS.signature(sp,tgt[0],tgt[1]);}return om.apply(this,arguments);};
 const od=MFX.draw;MFX.draw=function(ctx){const r=od?od.apply(this,arguments):undefined;try{SIS.drawFx(ctx);}catch(e){}return r;};}
// ---- overworld goddess sprite (pixel style of item 50, ~2 tiles tall)
const PW=24,PH=36,OUT='#160c18';const PC=new Map();
function shade(c,k){const n=parseInt(c.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const T=k>=0?[255,250,235]:[10,4,16];k=Math.abs(k);r+=(T[0]-r)*k;g+=(T[1]-g)*k;b+=(T[2]-b)*k;return 'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';}
function buildPix(sp,dir,f){const m=META[sp];const G=new Array(PW*PH).fill(null);const P=(x,y,c)=>{if(x>=0&&y>=0&&x<PW&&y<PH)G[y*PW+x]=c;};const R=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(x+i,y+j,c);};
 const up=dir==='up',side=dir==='left'||dir==='right';const sw=[0,1,0,-1][f];
 const rb=m.robe,rl=shade(rb,.3),rd=shade(rb,-.35),r2=m.robe2,hr=m.hair,hd=shade(hr,-.35),sk=m.skin,hn=m.horn;
 // tail (behind)
 const tx=up?6:18;for(let k=0;k<9;k++)P(tx+Math.round(Math.sin(k*.6+f*1.57)*1.2)+(k>>2),30-k*1.5|0,shade(r2,-.2));P(tx+3+sw,16,m.c);P(tx+4+sw,15,m.c);P(tx+3+sw,15,shade(m.c,.3));
 // robe (long, flaring, hem sways)
 for(let y=15;y<=33;y++){const ex=Math.floor((y-15)/3);const a=7-ex+(y>28?sw:0),b=16+ex+(y>28?sw:0);for(let x=a;x<=b;x++)P(x,y,x===a?rl:x>=b-1?rd:rb);}
 for(let y=16;y<=33;y++)P(12+(y>28?sw:0),y,r2);R(7,20,10,1,m.c);
 if(!up){P(11,17,m.c);P(12,17,shade(m.c,.5));P(13,17,m.c);}
 // arms open with magic
 R(5,16,2,5,rd);R(17,16,2,5,rd);P(5,21,sk);P(18,21,sk);P(4,21,m.glow);P(19,21,m.glow);P(4,20,m.c);P(19,22,m.c);
 // feet just under hem (hovering)
 P(10,34,'#2a1810');P(13,34,'#2a1810');
 // head (chibi)
 for(let y=4;y<15;y++)for(let x=6;x<=17;x++){if((y===4||y===14)&&(x<8||x>15))continue;P(x,y,x>=16?shade(sk,-.25):sk);}
 // hair: long, flowing to waist
 if(up){R(6,4,12,13,hr);R(7,17,10,7,hd);}else{R(6,3,12,4,hr);R(6,7,2,15,hr);R(16,7,2,15,hd);R(5,10,1,12,hd);R(18,10,1,12,hd);P(9,7,hr);P(14,7,hr);if(side)R(dir==='right'?6:12,7,6,8,hr);}
 // horns
 for(const s of [-1,1]){const bx=s<0?6:17;P(bx,3,hn);P(bx+s,2,hn);P(bx+s*2,1,hn);P(bx+s*2,0,shade(hn,.3));P(bx+s,3,shade(hn,-.3));}
 // eyes glowing
 if(!up){if(side){P(dir==='right'?14:9,10,m.glow);P(dir==='right'?14:9,11,m.c);}else{P(9,10,m.glow);P(14,10,m.glow);P(9,11,m.c);P(14,11,m.c);}}
 const out=G.slice();for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){if(G[y*PW+x])continue;if((x>0&&G[y*PW+x-1])||(x<PW-1&&G[y*PW+x+1])||(y>0&&G[(y-1)*PW+x])||(y<PH-1&&G[(y+1)*PW+x]))out[y*PW+x]=OUT;}
 const c=document.createElement('canvas');c.width=PW;c.height=PH;const g=c.getContext('2d');for(let i=0;i<out.length;i++)if(out[i]){g.fillStyle=out[i];g.fillRect(i%PW,(i/PW)|0,1,1);}
 if(dir==='left'){const f2=document.createElement('canvas');f2.width=PW;f2.height=PH;const q=f2.getContext('2d');q.translate(PW,0);q.scale(-1,1);q.drawImage(c,0,0);return f2;}return c;}
SIS.pix=function(ctx,sx,sy,sp,dir){const m=META[sp];if(!m)return false;const t=now(),R=red();const f=R?0:Math.floor(t*3)%4;const k=sp+'|'+dir+'|'+f;let c=PC.get(k);if(!c){c=buildPix(sp,dir,f);PC.set(k,c);}
 const hov=(R?2:3)+Math.sin(t*1.6)*(R?.5:1.5);const cx=sx+8,gy=sy+15;
 ctx.save();const sh=Math.max(.45,1-hov/10);ctx.fillStyle='rgba(16,6,28,'+(.3*sh)+')';ctx.beginPath();ctx.ellipse(cx,gy,7*sh,2.2*sh,0,0,7);ctx.fill();
 const top=gy-PH-hov+2;sigil(ctx,cx,top+3,6.5,R?t*.3:t,m,.7+.3*Math.sin(t*2.2));
 ctx.imageSmoothingEnabled=false;const sc=ctx.getTransform().a||1;ctx.drawImage(c,Math.round((cx-PW/2)*sc)/sc,Math.round(top*sc)/sc,PW,PH);
 if(!R&&Math.random()<.5){spawn(sp,cx+(Math.random()<.5?-8:8),top+21,PH*1.1,m,R);}drawParts(ctx,sp,1/60);ctx.restore();return true;};
// ---- animated cutscene + Dex canvases
SIS.animCanvas=function(cv,sp,draw){let alive=true;const loop=()=>{if(!alive||!cv.isConnected)return;draw();requestAnimationFrame(loop);};requestAnimationFrame(loop);return ()=>{alive=false;};};
if(typeof window.monCanvas==='function'){const oc=window.monCanvas;window.monCanvas=function(sp,size,back){const c=oc(sp,size,back);if(META[sp]){const x=c.getContext('2d');const k=c.width/size;SIS.animCanvas(c,sp,()=>{x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);x.setTransform(k,0,0,k,0,0);drawMon0(x,sp,size/2,size/2,size*0.8,back);});}return c;};}
})();
