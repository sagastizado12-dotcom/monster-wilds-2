// ===== World style: painterly dark-fantasy renderer (procedural, HD chunk cache at devicePixelRatio) =====
'use strict';
(function(){
const WS={};window.WS=WS;
const CH=12,CS=CH*16,CAP=24;
let cache=new Map(),cacheSc=0,built=0;
function h2(a,b,c){let n=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul((c|0)+1,1013904223))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return ((n^(n>>>16))>>>0)/4294967296;}
function rngT(x,y,k){let s=(Math.floor(h2(x,y,k)*4294967295)>>>0)||7;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const hex=c=>{const n=parseInt(c.slice(1),16);return [n>>16,(n>>8)&255,n&255];};
const rgb=(a,al)=>al===undefined?'rgb('+(a[0]|0)+','+(a[1]|0)+','+(a[2]|0)+')':'rgba('+(a[0]|0)+','+(a[1]|0)+','+(a[2]|0)+','+al+')';
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const sh=(a,k)=>{if(typeof a==='string')a=hex(a);return k>=0?mix(a,[255,250,235],k):mix(a,[4,2,10],-k);};
const shs=(a,k,al)=>rgb(sh(a,k),al);
const GOLD='#d9a94a',GOLD2='#f6dc8c',GOLDD='#7a5418';
// ---- regional palettes
const PAL={
 leaf:{g:'#4a9a34',path:'#8a6a44',tip:'#a6d052',fl:['#ffd76a','#ff7a9a','#fff0c0'],tree:['#0a2410','#1e5426','#4a9a3a','#e8ff90'],roof:'#6a2418',wall:'#54463a'},
 ember:{g:'#8a4a26',path:'#6e4c36',tip:'#ff8a3a',fl:['#ffb040','#ff5a2a','#ffd890'],tree:['#1e0806','#4c160c','#92301a','#ffae4a'],roof:'#7a1a0e',wall:'#4a3028',glowfl:1},
 coast:{g:'#2e8a6a',path:'#9a8460',tip:'#7ad8b4',fl:['#9ff0ff','#ffffff','#f0a0d0'],tree:['#08221f','#164638','#2a7a5e','#a0ffe0'],roof:'#1a4658',wall:'#4a4a48'},
 gale:{g:'#7a9a2e',path:'#9a8250',tip:'#e8d470',fl:['#ffe080','#ffffff','#c0e0ff'],tree:['#1a2812','#344a20','#68863a','#ffe890'],roof:'#6a4a16',wall:'#5a4c3a'},
 dusk:{g:'#5a46a0',path:'#6a5c80',tip:'#b48aff',fl:['#c890ff','#80d0ff','#ff90e0'],tree:['#120a20','#2e1c48','#563680','#e0b0ff'],roof:'#3a1a4e',wall:'#3e3448',glowfl:1},
 snow:{g:'#d0deF2',path:'#9eacc8',tip:'#eef6ff',fl:['#bfe8ff','#ffffff','#d0c0ff'],tree:['#081a20','#173840','#2a5a66','#d0f0ff'],roof:'#24365a',wall:'#565c6c',pine:1},
 cave:{g:'#54443a',path:'#6a5440',tip:'#8a7050',fl:['#80e0ff','#c090ff','#ffd080'],tree:['#14100c','#2c2018','#4a3828','#c0a070'],roof:'#3a2a20',wall:'#3a3028'},
 summit:{g:'#527a40',path:'#857e6a',tip:'#d8d090',fl:['#ffe8a0','#ffffff','#c0d0ff'],tree:['#0e1c12','#22402a','#406a3e','#f8e8a0'],roof:'#2a2236',wall:'#5a5250'},
 crimson:{g:'#5a2228',path:'#5e3a3e',tip:'#ff4a30',fl:['#ff5030','#ffb040','#ff8080'],tree:['#120406','#2a0a0c','#4a1414','#ff5a3a'],roof:'#2a080a',wall:'#2a1416',dead:1,glowfl:1}
};
for(const k in PAL){PAL[k].gc=hex(PAL[k].g);}
const TOWNREG=['leaf','ember','coast','gale','snow','dusk'];
function reg(x,y){return window.regionAt?regionAt(Math.max(0,Math.min(WW-1,x)),Math.max(0,Math.min(WH-1,y))):'leaf';}
WS.region=reg;
let W=null;
function prep(){if(W)return W;const m=MAPS.world,w=m.w,h=m.h,n=w*h;W={reg:new Array(n),gc:new Array(n),dep:new Uint8Array(n),inTown:new Uint8Array(n)};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){W.reg[y*w+x]=reg(x,y);if(TOWNS.some(t=>x>=t.x&&x<t.x+TW&&y>=t.y&&y<t.y+TH))W.inTown[y*w+x]=1;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let s=[0,0,0],c=0;for(const dy of [-4,-2,0,2,4])for(const dx of [-4,-2,0,2,4]){const xx=Math.max(0,Math.min(w-1,x+dx)),yy=Math.max(0,Math.min(h-1,y+dy));const g=PAL[W.reg[yy*w+xx]].gc;const wt=(dx===0&&dy===0)?3:1;s[0]+=g[0]*wt;s[1]+=g[1]*wt;s[2]+=g[2]*wt;c+=wt;}
  const v=(h2(x,y,3)-.5)*0.07;W.gc[y*w+x]=sh([s[0]/c,s[1]/c,s[2]/c],v);}
 // water depth (distance to shore) BFS
 const q=[];for(let i=0;i<n;i++){const v=m.t[i];if(v===T.WATER||v===T.BRIDGE)W.dep[i]=255;else{W.dep[i]=0;q.push(i);}}
 for(let qi=0;qi<q.length;qi++){const i=q[qi],x=i%w,y=(i/w)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=yy*w+xx;if(W.dep[j]>W.dep[i]+1){W.dep[j]=W.dep[i]+1;q.push(j);}}}
 return W;}
// ---- buildings
let BLD=null;
function blds(){if(BLD)return BLD;BLD=[];for(const tn of TOWNS)for(const b of (tn.blds||[]))BLD.push({x:b.bx,y:b.by,w:b.w,h:b.h,type:b.type,town:tn.id,dx:b.dx,dy:b.dy,idx:b.idx,tn});
 for(const k of ['league','castle','citadel','skysea']){const b=LAY[k],d=LAY[k+'Door'];BLD.push({x:b.x,y:b.y,w:b.w,h:b.h,type:k,town:-1,dx:d[0],dy:d[1]});}
 for(const b of EXTRA_BLDS)BLD.push(Object.assign({tn:null},b));return BLD;}
const tt=(m,x,y)=>(x<0||y<0||x>=m.w||y>=m.h)?-1:m.t[y*m.w+x];
const BUILD=new Set([T.WALL,T.ROOF_H,T.ROOF_C,T.ROOF_S,T.ROOF_G,T.ROOF_L,T.ROOF_T,T.HWALL,T.CWALL,T.DOOR]);
function gk(m,x,y){const v=tt(m,x,y);if(v<0)return 'none';
 if(v===T.PATH||v===T.DOOR)return 'path';if(v===T.SAND)return 'sand';if(v===T.WATER||v===T.BRIDGE)return 'water';if(v===T.CAVE||v===T.ROCK)return 'cave';if(v===T.SNOW||v===T.SNOWTALL||v===T.ICE)return 'snow';
 if(BUILD.has(v)||v===T.SEAL){return W.reg[y*m.w+x]==='snow'?'snow':'path';}return 'grass';}
// ================= WORLD PAINT =================
function paintWorld(g,m,x0,y0,x1,y1){prep();const w=m.w;
 // pass 1: base fills
 for(let y=y0-1;y<=y1+1;y++)for(let x=x0-1;x<=x1+1;x++){const k=gk(m,x,y);if(k==='none')continue;const i=y*w+x,P=PAL[W.reg[i]],px=x*16,py=y*16;let c;
  if(k==='grass')c=W.gc[i];else if(k==='snow')c=sh(PAL.snow.gc,(h2(x,y,5)-.4)*.07);
  else if(k==='path')c=sh(hex(P.path),(h2(x,y,6)-.5)*.12+(W.inTown[i]?-.08:0));else if(k==='sand')c=sh('#9c7f4c',(h2(x,y,6)-.5)*.1);
  else if(k==='cave')c=sh(PAL.cave.gc,(h2(x,y,6)-.5)*.05);
  else continue;
  g.fillStyle=rgb(c);g.fillRect(px-.05,py-.05,16.1,16.1);}
 waterBase(g,m,x0,y0,x1,y1);
 if(true){for(let y=y0-1;y<=y1+1;y++)for(let x=x0-1;x<=x1+1;x++){if(gk(m,x,y)!=='path'||W.reg[y*w+x]!=='ember'||h2(x,y,61)>0.22)continue;lava(g,x,y);}
  for(let y=y0-1;y<=y1+1;y++)for(let x=x0-1;x<=x1+1;x++){if(gk(m,x,y)!=='grass'||W.reg[y*w+x]!=='ember'||h2(x,y,62)>0.05)continue;lava(g,x,y);}}
 // pass 2: painterly blotches (low-frequency light/dark)
 for(let by=Math.floor((y0-4)/2)*2;by<=y1+4;by+=2)for(let bx=Math.floor((x0-4)/2)*2;bx<=x1+4;bx+=2){const r=h2(bx,by,7);const cx=(bx+h2(bx,by,8)*2)*16,cy=(by+h2(bx,by,9)*2)*16,rad=(1.6+r*2.6)*16;
  const k=gk(m,bx,by);const lite=h2(bx,by,10)<0.45;const al=k==='water'?0.10:0.13;
  const gr=g.createRadialGradient(cx,cy,0,cx,cy,rad);const col=k==='water'?(lite?'60,220,230':'0,10,30'):lite?(k==='snow'?'255,255,255':'230,210,140'):'6,2,14';
  gr.addColorStop(0,'rgba('+col+','+al+')');gr.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gr;g.fillRect(cx-rad,cy-rad,rad*2,rad*2);}
 // pass 3: edges + fine texture
 g.lineCap='round';
 for(let y=y0-1;y<=y1+1;y++)for(let x=x0-1;x<=x1+1;x++){const k=gk(m,x,y);if(k==='none')continue;const i=y*w+x,P=PAL[W.reg[i]],px=x*16,py=y*16,R=rngT(x,y,11);
  const nb=[[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy])=>gk(m,x+dx,y+dy));
  if(k==='grass'){const c=W.gc[i];for(let n=0;n<9;n++){const bx=px+R()*16,byy=py+R()*16+2,hh=2.5+R()*3.5,lean=(R()-.5)*3;g.strokeStyle=R()<0.55?shs(c,-.35,.8):shs(c,.28,.7);g.lineWidth=.55+R()*.4;g.beginPath();g.moveTo(bx,byy);g.quadraticCurveTo(bx+lean*.3,byy-hh*.6,bx+lean,byy-hh);g.stroke();}
   if(R()<0.25){g.fillStyle=shs(c,.35,.5);g.beginPath();g.arc(px+R()*16,py+R()*16,.6,0,7);g.fill();}}
  else if(k==='path'){const base=hex(P.path);
   if(W.inTown[i]){for(let r=0;r<3;r++)for(let q=0;q<3;q++){const sx=px+q*5.5+(r&1?2.6:0)+R()*.8-1,sy=py+r*5.4+R()*.8;const cc=sh(base,(R()-.45)*.3);g.fillStyle=rgb(sh(cc,-.45));g.beginPath();g.ellipse(sx+2.6,sy+2.9,2.6,2.3,0,0,7);g.fill();g.fillStyle=rgb(cc);g.beginPath();g.ellipse(sx+2.5,sy+2.5,2.3,2.0,0,0,7);g.fill();g.fillStyle=shs(cc,.3,.45);g.beginPath();g.ellipse(sx+2,sy+1.8,1.2,.7,0,0,7);g.fill();}}
   else{for(let n=0;n<4;n++){const sx=px+R()*15,sy=py+R()*15,rr=.5+R()*1.1;g.fillStyle=shs(base,-.4,.8);g.beginPath();g.ellipse(sx+.3,sy+.4,rr,rr*.7,0,0,7);g.fill();g.fillStyle=shs(base,.25,.8);g.beginPath();g.ellipse(sx,sy,rr*.8,rr*.55,0,0,7);g.fill();}
    g.strokeStyle=shs(base,-.3,.35);g.lineWidth=.6;g.beginPath();g.moveTo(px,py+5+R()*2);g.lineTo(px+16,py+5+R()*2);g.moveTo(px,py+11+R()*2);g.lineTo(px+16,py+11+R()*2);g.stroke();}
   // soft edges toward grass
   for(let d=0;d<4;d++){const n=nb[d];if(n==='path'||n==='none'||n==='water')continue;const gr=d===0?g.createLinearGradient(0,py,0,py+4):d===2?g.createLinearGradient(0,py+16,0,py+12):d===1?g.createLinearGradient(px+16,0,px+12,0):g.createLinearGradient(px,0,px+4,0);gr.addColorStop(0,'rgba(8,4,10,.45)');gr.addColorStop(1,'rgba(8,4,10,0)');g.fillStyle=gr;g.fillRect(px,py,16,16);
    if(n==='grass'){const c=W.gc[(y+[-1,0,1,0][d])*w+x+[0,1,0,-1][d]];for(let e=0;e<5;e++){let bx,byy;const t=R()*16;if(d===0){bx=px+t;byy=py+1.5;}else if(d===2){bx=px+t;byy=py+17;}else if(d===1){bx=px+15.5;byy=py+t+2;}else{bx=px+.5;byy=py+t+2;}g.strokeStyle=R()<.5?shs(c,-.3):shs(c,.2);g.lineWidth=.7;g.beginPath();g.moveTo(bx,byy);g.lineTo(bx+(R()-.5)*2.5+(d===1?-1.5:d===3?1.5:0),byy-2.5-R()*2.5);g.stroke();}}}}
  else if(k==='sand'){g.strokeStyle='rgba(255,236,180,.22)';g.lineWidth=.6;for(let n=0;n<2;n++){const sy=py+3+R()*11,sx=px+R()*6;g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo(sx+4,sy-1.5,sx+9,sy);g.stroke();}g.fillStyle='rgba(40,20,10,.35)';for(let n=0;n<3;n++)g.fillRect(px+R()*16,py+R()*16,.6,.6);
   if(R()<0.08){g.fillStyle='#f0d8c8';g.beginPath();g.arc(px+R()*12+2,py+R()*12+2,1,0,Math.PI);g.fill();}
   for(let d=0;d<4;d++)if(nb[d]==='water'){g.fillStyle='rgba(10,40,40,.3)';if(d===0)g.fillRect(px,py,16,2);if(d===2)g.fillRect(px,py+14,16,2);if(d===1)g.fillRect(px+14,py,2,16);if(d===3)g.fillRect(px,py,2,16);}}
  else if(k==='water'){const d=W.dep[i];g.strokeStyle='rgba(130,240,250,'+(d<=1?.20:.10)+')';g.lineWidth=.6;for(let n=0;n<2;n++){const sx=px+R()*10,sy=py+R()*15;g.beginPath();g.moveTo(sx,sy);g.bezierCurveTo(sx+2,sy-1.6,sx+4,sy+1.6,sx+7,sy);g.stroke();}
   for(let dd=0;dd<4;dd++){const n=nb[dd];if(n==='water'||n==='none')continue;const len=16;g.strokeStyle='rgba(180,255,250,.55)';g.lineWidth=.8;g.beginPath();if(dd===0){g.moveTo(px,py+1.2);g.bezierCurveTo(px+5,py+2.4,px+10,py+.3,px+len,py+1.4);}if(dd===2){g.moveTo(px,py+14.8);g.bezierCurveTo(px+5,py+13.6,px+10,py+15.6,px+16,py+14.6);}if(dd===1){g.moveTo(px+14.8,py);g.bezierCurveTo(px+13.6,py+5,px+15.6,py+10,px+14.6,py+16);}if(dd===3){g.moveTo(px+1.2,py);g.bezierCurveTo(px+2.4,py+5,px+.3,py+10,px+1.4,py+16);}g.stroke();
    const gr=dd===0?g.createLinearGradient(0,py,0,py+5):dd===2?g.createLinearGradient(0,py+16,0,py+11):dd===1?g.createLinearGradient(px+16,0,px+11,0):g.createLinearGradient(px,0,px+5,0);gr.addColorStop(0,'rgba(90,230,220,.32)');gr.addColorStop(1,'rgba(90,230,220,0)');g.fillStyle=gr;g.fillRect(px,py,16,16);}}
  else if(k==='cave'){const c=PAL.cave.gc;g.strokeStyle=shs(c,-.55,.7);g.lineWidth=.5;g.beginPath();let cx=px+R()*16,cy=py+R()*16;g.moveTo(cx,cy);for(let n=0;n<3;n++){cx+=(R()-.5)*7;cy+=(R()-.5)*7;g.lineTo(cx,cy);}g.stroke();
   for(let n=0;n<4;n++){const sx=px+R()*16,sy=py+R()*16;g.fillStyle=R()<.5?shs(c,.25,.7):shs(c,-.4,.8);g.beginPath();g.ellipse(sx,sy,.6+R()*1.3,.5+R()*.8,0,0,7);g.fill();}
   if(h2(x,y,77)<0.035)crystal(g,px+8,py+12,h2(x,y,78)<.5?'#5ae0ff':'#b070ff');}
  else if(k==='snow'){for(let n=0;n<2;n++){const sx=px+R()*16,sy=py+R()*16;const gr=g.createRadialGradient(sx,sy,0,sx,sy,4);gr.addColorStop(0,'rgba(70,90,150,.18)');gr.addColorStop(1,'rgba(70,90,150,0)');g.fillStyle=gr;g.fillRect(sx-4,sy-4,8,8);}
   g.fillStyle='rgba(255,255,255,.9)';for(let n=0;n<3;n++)g.fillRect(px+R()*16,py+R()*16,.5,.5);g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=.6;g.beginPath();const sx=px+R()*8;g.moveTo(sx,py+R()*16);g.quadraticCurveTo(sx+4,py+R()*16,sx+8,py+R()*16);g.stroke();}
 }
 // pass 4: objects (row-ordered)
 for(let y=y0-1;y<=y1+2;y++)for(let x=x0-2;x<=x1+2;x++){const v=tt(m,x,y);if(v<0)continue;const i=y*w+x,P=PAL[W.reg[i]];
  if(v===T.TALL||v===T.SNOWTALL)tuft(g,x,y,v===T.SNOWTALL?PAL.snow.gc:W.gc[i],v===T.SNOWTALL?'#f0f8ff':P.tip);
  else if(v===T.FLOWER)flowers(g,x,y,P);
  else if(v===T.TREE)tree(g,x,y,W.reg[i]);
  else if(v===T.ROCK)boulder(g,x*16+8,y*16+12);
  else if(v===T.BRIDGE)bridge(g,m,x,y);
  else if(v===T.SEAL)seal(g,x*16,y*16);
  else if(v===T.SHRINE)wayShrine(g,x,y,W.reg[i]);
  else if(v===T.RUIN)ruinCol(g,x,y);
  else if(v===T.ICE){g.fillStyle='rgba(200,240,255,.35)';g.fillRect(x*16+1,y*16+1,14,14);g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=.5;g.beginPath();g.moveTo(x*16+3,y*16+5);g.lineTo(x*16+9,y*16+3);g.moveTo(x*16+6,y*16+12);g.lineTo(x*16+13,y*16+9);g.stroke();}}
 // pass 5: buildings + props
 const L=blds().filter(b=>b.x-2<=x1+1&&b.x+b.w+2>=x0-1&&b.y-3<=y1+1&&b.y+b.h+1>=y0-1).sort((a,b)=>(a.y+a.h)-(b.y+b.h));
 for(const b of L)building(g,b);
 for(const tn of TOWNS){if(tn.x-1>x1+1||tn.x+TW+1<x0-1||tn.y-1>y1+1||tn.y+TH+1<y0-1)continue;townProps(g,tn);}
}
function waterBase(g,m,x0,y0,x1,y1){const n=CH+6,c=document.createElement('canvas');c.width=c.height=n;const q=c.getContext('2d');const im=q.createImageData(n,n);let any=false;
 for(let j=0;j<n;j++)for(let k=0;k<n;k++){const x=x0-3+k,y=y0-3+j;let d=0;if(x>=0&&y>=0&&x<m.w&&y<m.h){d=W.dep[y*m.w+x];if(d)any=true;}const dd=Math.min(6,Math.max(.4,d));const col=mix(hex('#3ccac0'),hex('#0c4a7a'),Math.min(1,Math.max(0,(dd-.8)/4.2)));const o=(j*n+k)*4;im.data[o]=col[0];im.data[o+1]=col[1];im.data[o+2]=col[2];im.data[o+3]=255;}
 if(!any)return;q.putImageData(im,0,0);g.save();g.beginPath();let has=false;for(let y=y0-1;y<=y1+1;y++)for(let x=x0-1;x<=x1+1;x++)if(gk(m,x,y)==='water'){g.rect(x*16-.05,y*16-.05,16.1,16.1);has=true;}
 if(has){g.clip();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(c,0,0,n,n,(x0-3+.5)*16-8,(y0-3+.5)*16-8,n*16,n*16);}g.restore();}
function lava(g,x,y){const R=rngT(x,y,63),px=x*16,py=y*16;g.save();g.lineCap='round';let sx=px+R()*16,sy=py+R()*16;const pts=[[sx,sy]];for(let k=0;k<4;k++){sx+=(R()-.5)*9;sy+=(R()-.5)*9;pts.push([sx,sy]);}
 g.strokeStyle='rgba(20,4,0,.8)';g.lineWidth=2.6;g.beginPath();pts.forEach(([a,b],i)=>i?g.lineTo(a,b):g.moveTo(a,b));g.stroke();g.shadowColor='#ff5010';g.shadowBlur=5*SCX;g.strokeStyle='#ff7a20';g.lineWidth=.9;g.stroke();g.shadowBlur=0;g.strokeStyle='#ffe080';g.lineWidth=.3;g.stroke();g.restore();}
function crystal(g,x,y,col){g.save();g.shadowColor=col;g.shadowBlur=4*SCX;const c=hex(col);for(const [dx,hh,a] of [[-2.2,5,-.3],[0,8,0],[2.4,6,.35]]){g.save();g.translate(x+dx,y);g.rotate(a);const gr=g.createLinearGradient(-1.5,0,1.5,0);gr.addColorStop(0,rgb(sh(c,.5)));gr.addColorStop(1,rgb(sh(c,-.4)));g.fillStyle=gr;g.beginPath();g.moveTo(-1.5,0);g.lineTo(-1.2,-hh*.7);g.lineTo(0,-hh);g.lineTo(1.2,-hh*.7);g.lineTo(1.5,0);g.closePath();g.fill();g.restore();}g.restore();}
let SCX=1;
function tuft(g,x,y,c,tip){const R=rngT(x,y,21),px=x*16,py=y*16;const tc=hex(tip);
 g.fillStyle='rgba(4,2,10,.35)';g.beginPath();g.ellipse(px+8,py+14.5,8,2.4,0,0,7);g.fill();
 for(const row of [0,1]){const by=py+(row?15.5:9);for(let n=0;n<8;n++){const bx=px+.5+n*2+R()*1.4,hh=8+R()*5,lean=(R()-.5)*5;
  const gr=g.createLinearGradient(0,by,0,by-hh);gr.addColorStop(0,rgb(sh(c,-.55)));gr.addColorStop(.6,rgb(sh(mix(c,tc,.4),-.05)));gr.addColorStop(1,rgb(sh(tc,.15)));
  g.fillStyle=gr;g.beginPath();g.moveTo(bx-1.1,by);g.quadraticCurveTo(bx-.6+lean*.3,by-hh*.55,bx+lean,by-hh);g.quadraticCurveTo(bx+.6+lean*.3,by-hh*.55,bx+1.1,by);g.closePath();g.fill();}}}
function flowers(g,x,y,P){const R=rngT(x,y,31),px=x*16,py=y*16;for(let n=0;n<3;n++){const fx=px+2+R()*12,fy=py+3+R()*11,col=P.fl[Math.floor(R()*3)];g.strokeStyle='rgba(20,50,20,.8)';g.lineWidth=.5;g.beginPath();g.moveTo(fx,fy+3);g.lineTo(fx,fy);g.stroke();
 g.save();if(P.glowfl){g.shadowColor=col;g.shadowBlur=3*SCX;}g.fillStyle=col;for(let p=0;p<5;p++){const a=p*1.2566+R()*.2;g.beginPath();g.ellipse(fx+Math.cos(a)*1.3,fy+Math.sin(a)*1.3,1.05,.75,a,0,7);g.fill();}g.restore();g.fillStyle=GOLD2;g.beginPath();g.arc(fx,fy,.6,0,7);g.fill();}}
function boulder(g,x,y){const gr=g.createRadialGradient(x-2,y-4,1,x,y-2,8);gr.addColorStop(0,'#6a6070');gr.addColorStop(1,'#1c1820');g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(x+1,y+2,7,2.5,0,0,7);g.fill();g.fillStyle=gr;g.beginPath();g.ellipse(x,y-2,7,5.5,0,0,7);g.fill();g.strokeStyle='rgba(200,190,230,.35)';g.lineWidth=.6;g.beginPath();g.arc(x,y-2,6.5,3.6,4.9);g.stroke();}
function tree(g,x,y,rk){const P=PAL[rk],[cd,cm,cl,rim]=P.tree.map(hex),R=rngT(x,y,41);const cx=x*16+8+(R()-.5)*2,by=y*16+14.5;
 g.fillStyle='rgba(2,0,8,.45)';g.beginPath();g.ellipse(cx+2.5,by+.5,9,3.4,0,0,7);g.fill();
 const tg=g.createLinearGradient(cx-2,0,cx+2,0);tg.addColorStop(0,'#3a2418');tg.addColorStop(1,'#120a06');g.fillStyle=tg;g.beginPath();g.moveTo(cx-2,by);g.lineTo(cx-1.2,by-8);g.lineTo(cx+1.2,by-8);g.lineTo(cx+2,by);g.fill();
 if(P.dead){g.strokeStyle='#160608';g.lineWidth=1.6;g.beginPath();g.moveTo(cx,by-6);g.lineTo(cx,by-16);g.moveTo(cx,by-10);g.lineTo(cx-6,by-17);g.moveTo(cx,by-12);g.lineTo(cx+6,by-19);g.moveTo(cx-3,by-13);g.lineTo(cx-5,by-21);g.stroke();g.strokeStyle=rgb(rim,.5);g.lineWidth=.5;g.beginPath();g.moveTo(cx-.6,by-6);g.lineTo(cx-.6,by-16);g.lineTo(cx-6.4,by-17);g.stroke();return;}
 if(P.pine){for(let k=0;k<3;k++){const ty=by-6-k*5.2,wd=8-k*2;const gr=g.createLinearGradient(cx-wd,0,cx+wd,0);gr.addColorStop(0,rgb(cl));gr.addColorStop(.45,rgb(cm));gr.addColorStop(1,rgb(cd));g.fillStyle=gr;g.beginPath();g.moveTo(cx-wd,ty);g.lineTo(cx,ty-9);g.lineTo(cx+wd,ty);g.quadraticCurveTo(cx,ty+2,cx-wd,ty);g.fill();
  g.fillStyle='rgba(240,250,255,.92)';g.beginPath();g.moveTo(cx-wd*.55,ty-4);g.lineTo(cx,ty-9);g.lineTo(cx+wd*.3,ty-5.5);g.quadraticCurveTo(cx-.5,ty-4.2,cx-wd*.55,ty-4);g.fill();}
  g.strokeStyle=rgb(rim,.6);g.lineWidth=.5;g.beginPath();g.moveTo(cx-8,by-6);g.lineTo(cx,by-25);g.stroke();return;}
 const bl=[[0,-12,7],[-4.5,-9,5],[4.5,-9.5,5.2],[-2.5,-15.5,4.8],[2.8,-15,4.6],[0,-7,5.5]].map(([dx,dy,r])=>[cx+dx+(R()-.5)*1.2,by+dy+(R()-.5)*1.2,r*(0.9+R()*.2)]);
 g.fillStyle=rgb(sh(cd,-.3));for(const [bx,b2,r] of bl){g.beginPath();g.arc(bx,b2,r+1,0,7);g.fill();}
 for(const [bx,b2,r] of bl){const gr=g.createRadialGradient(bx-r*.45,b2-r*.5,r*.1,bx,b2,r*1.05);gr.addColorStop(0,rgb(cl));gr.addColorStop(.55,rgb(cm));gr.addColorStop(1,rgb(cd));g.fillStyle=gr;g.beginPath();g.arc(bx,b2,r,0,7);g.fill();}
 g.lineWidth=.7;for(const [bx,b2,r] of bl){g.strokeStyle=rgb(rim,.55);g.beginPath();g.arc(bx,b2,r-.4,3.5,4.9);g.stroke();}
 for(let n=0;n<10;n++){const [bx,b2,r]=bl[Math.floor(R()*bl.length)];const a=R()*6.28,d=R()*r*.85;g.fillStyle=R()<.5?rgb(sh(cl,.2),.6):rgb(cd,.6);g.beginPath();g.ellipse(bx+Math.cos(a)*d,b2+Math.sin(a)*d,1.1,.7,a,0,7);g.fill();}
 if(P.glowfl||rk==='dusk'){g.save();g.shadowColor=rgb(rim);g.shadowBlur=3*SCX;g.fillStyle=rgb(sh(rim,.3));for(let n=0;n<4;n++){const [bx,b2,r]=bl[Math.floor(R()*bl.length)];g.beginPath();g.arc(bx+(R()-.5)*r,b2+(R()-.5)*r,.6,0,7);g.fill();}g.restore();}}
function bridge(g,m,x,y){const px=x*16,py=y*16;
 g.fillStyle='rgba(0,0,0,.4)';g.fillRect(px-2,py,20,16);
 for(let k=0;k<4;k++){const sy=py+k*4;const gr=g.createLinearGradient(0,sy,0,sy+4);gr.addColorStop(0,'#5a3a22');gr.addColorStop(1,'#26160c');g.fillStyle=gr;g.fillRect(px-1,sy+.35,18,3.4);g.fillStyle='rgba(255,220,160,.12)';g.fillRect(px-1,sy+.4,18,.5);g.fillStyle='rgba(240,200,120,.5)';g.fillRect(px+1,sy+1.8,.6,.6);g.fillRect(px+14.4,sy+1.8,.6,.6);}
 for(const rx of [px-1.5,px+17.5]){g.fillStyle='#1a0e08';g.fillRect(rx-1,py,2,16);g.fillStyle=GOLD;g.fillRect(rx-1.1,py,.7,16);g.fillStyle='#2a180c';g.fillRect(rx-1.2,py+1,2.4,2.4);g.fillStyle=GOLD2;g.fillRect(rx-1.2,py+1,2.4,.6);
  if(y%3===0){g.fillStyle='#1a1008';g.fillRect(rx-1.4,py-3.5,2.8,3.4);g.fillStyle='#ffe0a0';g.fillRect(rx-.8,py-3,1.6,2.4);g.fillStyle=GOLD;g.fillRect(rx-1.6,py-4.2,3.2,.8);}}}
function seal(g,px,py){const gr=g.createLinearGradient(px,py,px+16,py+16);gr.addColorStop(0,'#2a2234');gr.addColorStop(1,'#08060c');g.fillStyle=gr;g.beginPath();g.moveTo(px+1,py+16);g.lineTo(px+1,py+5);g.quadraticCurveTo(px+8,py-3,px+15,py+5);g.lineTo(px+15,py+16);g.fill();g.strokeStyle=GOLDD;g.lineWidth=.8;g.stroke();
 g.save();g.shadowColor='#b080ff';g.shadowBlur=4*SCX;g.strokeStyle='#b890ff';g.lineWidth=.6;for(let k=0;k<8;k++){const a=k*0.785;g.beginPath();g.arc(px+8+Math.cos(a)*4,py+9+Math.sin(a)*4,1.3,0,7);g.stroke();}g.beginPath();g.arc(px+8,py+9,2,0,7);g.stroke();g.restore();}
// ---- building painter
const ROOFT={house:null,center:'#7e1222',shop:'#1a2462',lab:'#123e46',gym:null,temple:'#221e36',league:'#2a2236'};
function typeCol(tn){return (window.TCOL&&TCOL[tn.type])||'#a03030';}
function building(g,b){const X0=b.x*16,Y0=b.y*16,Wd=b.w*16,wy=(b.y+b.h-1)*16,rk=b.rk||(b.town>=0?TOWNREG[b.town]:'summit'),P=PAL[rk];if(b.type==='lighthouse')return lighthouse(g,b);
 if(b.type==='castle')return castle(g,b);if(b.type==='citadel')return shrine(g,b,'#f4ead0','#e8c060','#fff4c0');if(b.type==='skysea')return shrine(g,b,'#2a6a86','#40e0e0','#a0ffff');
 // ground shadow
 g.save();g.fillStyle='rgba(2,0,8,.5)';g.shadowColor='rgba(0,0,0,.7)';g.shadowBlur=5*SCX;g.fillRect(X0+2,Y0+5,Wd+1,b.h*16-4);g.restore();
 // wall
 const wc=hex(P.wall);let gr=g.createLinearGradient(0,wy,0,wy+16);gr.addColorStop(0,rgb(sh(wc,.12)));gr.addColorStop(1,rgb(sh(wc,-.45)));g.fillStyle=gr;g.fillRect(X0,wy,Wd,16);
 g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=.45;for(let r=0;r<3;r++){const yy=wy+3+r*4.5;g.beginPath();g.moveTo(X0,yy);g.lineTo(X0+Wd,yy);g.stroke();for(let q=X0+(r&1?3:0);q<X0+Wd;q+=6){g.beginPath();g.moveTo(q,yy);g.lineTo(q,yy+4.5);g.stroke();}}
 g.fillStyle='#1c120c';for(let q=0;q<=b.w;q++){const bx=X0+q*16-(q===b.w?2:0);g.fillRect(bx,wy,2,16);}
 g.fillStyle='rgba(0,0,0,.45)';g.fillRect(X0,wy+14,Wd,2);
 // windows
 const wins=[];for(let tx=b.x;tx<b.x+b.w;tx++){if(tx===b.dx)continue;if(Math.abs(tx-b.dx)===1||(b.w>=6&&(tx===b.x+1||tx===b.x+b.w-2)))wins.push(tx);}
 const stained=b.type==='gym'||b.type==='temple'||b.type==='league';
 for(const tx of wins){const wx=tx*16+4.5,wt=wy+3;g.fillStyle='#120a08';arch(g,wx-1,wt-1,9,10.5);g.fill();
  const gc=stained?(b.type==='temple'?['#fff0c0','#6080ff','#ff4030'][(tx-b.x)%3]:b.type==='league'?'#ffe090':typeCol(b.tn)):'#ffd27a';
  const gg=g.createLinearGradient(0,wt,0,wt+8);gg.addColorStop(0,rgb(sh(gc,.35)));gg.addColorStop(1,rgb(sh(gc,-.35)));g.fillStyle=gg;arch(g,wx,wt,7,8.5);g.fill();
  g.strokeStyle='#2a1a10';g.lineWidth=.6;g.beginPath();g.moveTo(wx+3.5,wt+.5);g.lineTo(wx+3.5,wt+8.5);g.moveTo(wx,wt+4.5);g.lineTo(wx+7,wt+4.5);g.stroke();g.fillStyle=GOLD;g.fillRect(wx-1.2,wt+8.5,9.4,1);}
 // door
 {const dx=b.dx*16;g.fillStyle='#0e0806';arch(g,dx+2.5,wy+1,11,15);g.fill();const dg=g.createLinearGradient(dx+3,0,dx+13,0);dg.addColorStop(0,'#4a2a16');dg.addColorStop(1,'#1e0e06');g.fillStyle=dg;arch(g,dx+3.5,wy+2,9,14);g.fill();
  g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=.5;g.beginPath();g.moveTo(dx+6.5,wy+4);g.lineTo(dx+6.5,wy+16);g.moveTo(dx+9.5,wy+4);g.lineTo(dx+9.5,wy+16);g.stroke();
  g.strokeStyle=GOLD;g.lineWidth=.8;arch(g,dx+3,wy+1.5,10,14.5);g.stroke();g.fillStyle=GOLD2;g.beginPath();g.arc(dx+10.6,wy+10,.8,0,7);g.fill();g.fillRect(dx+4,wy+7,3,.6);g.fillRect(dx+4,wy+12,3,.6);}
 // roof
 const rc=hex(ROOFT[b.type]||(b.type==='gym'?mixHex(typeCol(b.tn),'#140a14',.55):P.roof));const top=Y0+2,bot=wy+.5;
 g.save();g.beginPath();g.moveTo(X0-2.5,bot);g.lineTo(X0+Wd+2.5,bot);g.lineTo(X0+Wd-1,top);g.lineTo(X0+1,top);g.closePath();
 gr=g.createLinearGradient(0,top,0,bot);gr.addColorStop(0,rgb(sh(rc,.22)));gr.addColorStop(.6,rgb(rc));gr.addColorStop(1,rgb(sh(rc,-.5)));g.fillStyle=gr;g.fill();g.clip();
 for(let ry=top+2,row=0;ry<bot+3;ry+=3.4,row++){for(let sx=X0-4+(row&1?2:0);sx<X0+Wd+4;sx+=4){g.fillStyle=rgb(sh(rc,-.55),.7);g.beginPath();g.arc(sx,ry,2.1,0,Math.PI);g.fill();g.strokeStyle=rgb(sh(rc,.3),.35);g.lineWidth=.35;g.beginPath();g.arc(sx,ry-.2,1.9,Math.PI*.15,Math.PI*.85);g.stroke();}}
 const sg=g.createLinearGradient(X0,0,X0+Wd,0);sg.addColorStop(0,'rgba(255,220,160,.12)');sg.addColorStop(.5,'rgba(0,0,0,0)');sg.addColorStop(1,'rgba(0,0,10,.3)');g.fillStyle=sg;g.fillRect(X0-3,top,Wd+6,bot-top);
 g.restore();
 // eave + gold trim
 g.fillStyle='#140a06';g.fillRect(X0-2.5,bot-1.4,Wd+5,2);g.fillStyle=GOLD;g.fillRect(X0-2.5,bot+.4,Wd+5,.7);for(let q=X0-1;q<X0+Wd+2;q+=3){g.fillRect(q,bot+1,1,.9);}
 g.strokeStyle=GOLD2;g.lineWidth=1;g.beginPath();g.moveTo(X0+1,top);g.lineTo(X0+Wd-1,top);g.stroke();g.strokeStyle=GOLD;g.lineWidth=.6;g.beginPath();g.moveTo(X0+1,top);g.lineTo(X0-2.5,bot);g.moveTo(X0+Wd-1,top);g.lineTo(X0+Wd+2.5,bot);g.stroke();
 g.fillStyle=GOLD2;for(const fx of [X0+1,X0+Wd-1]){g.beginPath();g.arc(fx,top-.6,1.1,0,7);g.fill();}
 if(rk==='snow'){g.fillStyle='rgba(240,248,255,.95)';g.beginPath();g.moveTo(X0,top+1);for(let q=0;q<=Wd;q+=4)g.quadraticCurveTo(X0+q+2,top+4+((q*7)%3),X0+q+4,top+1.5);g.lineTo(X0+Wd,top-1);g.lineTo(X0,top-1);g.fill();g.fillStyle='rgba(220,236,255,.85)';for(let q=X0-2;q<X0+Wd+2;q+=5)g.fillRect(q,bot-2,4,1.4);}
 if(rk==='ember'){g.save();g.globalCompositeOperation='lighter';g.strokeStyle='rgba(255,110,30,.35)';g.lineWidth=.5;const R=rngT(b.x,b.y,5);for(let n=0;n<4;n++){let sx=X0+4+R()*(Wd-8),sy=top+3+R()*6;g.beginPath();g.moveTo(sx,sy);for(let k=0;k<3;k++){sx+=(R()-.5)*5;sy+=2+R()*2;g.lineTo(sx,sy);}g.stroke();}g.restore();}
 // chimney (house idx 0 & 5 match smoke positions)
 if(b.tn&&b.idx>=0&&(b.idx===0||b.idx===5)){const hx=b.tn.x*16+(b.idx===0?2:8)*16+12,hy=b.tn.y*16+(b.idx===0?1:9)*16;g.fillStyle='#2a2220';g.fillRect(hx-.5,hy-5,5,8);g.fillStyle='#4a3a34';g.fillRect(hx-.5,hy-5,1.4,8);g.fillStyle=GOLD;g.fillRect(hx-1.2,hy-5.8,6.4,1);}
 // emblem + spires
 const ecx=X0+Wd/2,ecy=top+(bot-top)*.45;
 if(b.type==='gym'){const tc=typeCol(b.tn);spire(g,X0+3,top+3,5,26,rc,tc);spire(g,X0+Wd-3,top+3,5,26,rc,tc);rune(g,ecx,ecy,5.2,tc);}
 else if(b.type==='temple'){spire(g,ecx,top+2,7,32,rc,'#ffe8a0');spire(g,X0+3,top+4,4,18,rc,'#80a0ff');spire(g,X0+Wd-3,top+4,4,18,rc,'#ff5030');
  [['#fff4d0',-9],['#70a0ff',0],['#ff5030',9]].forEach(([c,o])=>flameRune(g,ecx+o,ecy+3,c));}
 else if(b.type==='league'){spire(g,X0+4,top+3,6,30,rc,'#ffe090');spire(g,X0+Wd-4,top+3,6,30,rc,'#ffe090');spire(g,ecx,top+2,9,42,rc,'#fff0b0');rune(g,ecx,ecy+4,7,'#ffd070');}
 else if(b.type==='center')emblem(g,ecx,ecy,'#ff4a5a','cross');
 else if(b.type==='shop')emblem(g,ecx,ecy,'#6ab0ff','coin');
 else if(b.type==='lab'){g.fillStyle='#8a6a2a';g.beginPath();g.arc(ecx,top+1,6,Math.PI,0);g.fill();const og=g.createRadialGradient(ecx-2,top-2,0,ecx,top,6);og.addColorStop(0,'#fff0b0');og.addColorStop(1,'#7a5418');g.fillStyle=og;g.beginPath();g.arc(ecx,top+.5,5,Math.PI,0);g.fill();g.strokeStyle='#2a1a08';g.lineWidth=1.4;g.beginPath();g.moveTo(ecx,top-1);g.lineTo(ecx+7,top-7);g.stroke();emblem(g,ecx,ecy+2,'#60f0d0','star');}
 else filigree(g,ecx,ecy);}

function wayShrine(g,x,y,rk){const px=x*16,py=y*16;g.fillStyle='rgba(2,0,8,.45)';g.beginPath();g.ellipse(px+8,py+15,7,2.4,0,0,7);g.fill();
 let gr=g.createLinearGradient(px+3,0,px+13,0);gr.addColorStop(0,'#b8b0a4');gr.addColorStop(1,'#4a4440');g.fillStyle=gr;g.fillRect(px+3,py+6,10,9);g.fillStyle=GOLD;g.fillRect(px+2,py+5,12,1.2);g.fillRect(px+3,py+14,10,.8);
 g.fillStyle='#3a2a30';g.beginPath();g.moveTo(px+1.5,py+5.5);g.lineTo(px+8,py-1.5);g.lineTo(px+14.5,py+5.5);g.fill();g.strokeStyle=GOLD2;g.lineWidth=.6;g.stroke();
 g.save();g.shadowBlur=4*SCX;[['#fff4d0',5.2],['#70a0ff',8],['#ff5030',10.8]].forEach(([c,cx])=>{g.shadowColor=c;g.fillStyle=c;g.beginPath();g.moveTo(cx,py+8);g.quadraticCurveTo(cx+1.4,py+10.2,cx,py+11.4);g.quadraticCurveTo(cx-1.4,py+10.2,cx,py+8);g.fill();});g.restore();
 g.fillStyle='rgba(255,255,255,.18)';g.fillRect(px+3,py+6,1.2,9);g.strokeStyle='rgba(60,40,30,.6)';g.lineWidth=.4;g.beginPath();g.moveTo(px+8,py+1.5);g.lineTo(px+8,py-1);g.stroke();}
function ruinCol(g,x,y){const px=x*16,py=y*16,R=rngT(x,y,95),hgt=6+R()*12;g.fillStyle='rgba(2,0,8,.45)';g.beginPath();g.ellipse(px+9,py+15,7,2.4,0,0,7);g.fill();
 g.fillStyle='#5a5462';g.fillRect(px+2,py+12,12,3.5);let gr=g.createLinearGradient(px+4,0,px+12,0);gr.addColorStop(0,'#c8c0d0');gr.addColorStop(.5,'#8a8296');gr.addColorStop(1,'#3a3444');g.fillStyle=gr;
 g.beginPath();g.moveTo(px+4,py+12.5);g.lineTo(px+4,py+12-hgt);g.lineTo(px+7,py+13-hgt-R()*3);g.lineTo(px+9,py+12-hgt+2);g.lineTo(px+12,py+12-hgt-1);g.lineTo(px+12,py+12.5);g.fill();
 g.strokeStyle='rgba(30,20,40,.5)';g.lineWidth=.4;for(let k=5.5;k<12;k+=2.2){g.beginPath();g.moveTo(px+k,py+12);g.lineTo(px+k,py+13-hgt);g.stroke();}
 g.fillStyle='rgba(80,140,60,.7)';for(let n=0;n<4;n++){g.beginPath();g.arc(px+4+R()*8,py+12-R()*hgt,.9,0,7);g.fill();}g.fillStyle=GOLD;g.fillRect(px+3.5,py+11.5,9,.6);}
function lighthouse(g,b){const X0=b.x*16,Y0=b.y*16,base=(b.y+b.h)*16,cx=X0+16;g.fillStyle='rgba(2,0,8,.5)';g.beginPath();g.ellipse(cx+3,base-1,16,4,0,0,7);g.fill();
 const top=Y0-22;let gr=g.createLinearGradient(cx-10,0,cx+10,0);gr.addColorStop(0,'#f4ece0');gr.addColorStop(.6,'#c8bcb0');gr.addColorStop(1,'#6a6058');g.fillStyle=gr;g.beginPath();g.moveTo(cx-11,base-2);g.lineTo(cx-7,top+10);g.lineTo(cx+7,top+10);g.lineTo(cx+11,base-2);g.fill();
 g.save();g.clip();g.fillStyle='rgba(150,20,30,.85)';for(let k=0;k<3;k++)g.fillRect(cx-12,top+18+k*16,24,6);g.restore();
 g.fillStyle='#1a1418';g.fillRect(cx-8,top+6,16,4);g.fillStyle=GOLD;g.fillRect(cx-9,top+9.4,18,1);g.save();g.shadowColor='#fff0a0';g.shadowBlur=8*SCX;g.fillStyle='#fff4c0';g.fillRect(cx-5,top-1,10,7);g.restore();
 g.fillStyle='#2a1a20';g.beginPath();g.moveTo(cx-7,top-1);g.lineTo(cx,top-9);g.lineTo(cx+7,top-1);g.fill();g.strokeStyle=GOLD2;g.lineWidth=.7;g.stroke();g.fillStyle=GOLD2;g.beginPath();g.arc(cx,top-10,1.2,0,7);g.fill();
 const dx=b.dx*16;g.fillStyle='#0e0806';arch(g,dx+3,base-15,10,14);g.fill();g.strokeStyle=GOLD;g.lineWidth=.8;arch(g,dx+3,base-15,10,14);g.stroke();}
function mixHex(a,b,t){return '#'+mix(hex(a),hex(b),t).map(v=>(v|0).toString(16).padStart(2,'0')).join('');}
function arch(g,x,y,w,h){g.beginPath();g.moveTo(x,y+h);g.lineTo(x,y+w/2);g.arc(x+w/2,y+w/2,w/2,Math.PI,0);g.lineTo(x+w,y+h);g.closePath();}
function spire(g,cx,baseY,w,hgt,rc,glowc){const tb=baseY-hgt*.45;let gr=g.createLinearGradient(cx-w/2,0,cx+w/2,0);gr.addColorStop(0,'#5a5060');gr.addColorStop(1,'#1a1620');g.fillStyle=gr;g.fillRect(cx-w/2,tb,w,baseY-tb);
 g.fillStyle=GOLD;g.fillRect(cx-w/2-.6,tb-.6,w+1.2,1);g.save();g.shadowColor=glowc;g.shadowBlur=3*SCX;g.fillStyle=glowc;arch(g,cx-w*.15,tb+2,w*.3,w*.9);g.fill();g.restore();
 gr=g.createLinearGradient(cx-w/2,0,cx+w/2,0);gr.addColorStop(0,rgb(sh(rc,.25)));gr.addColorStop(1,rgb(sh(rc,-.5)));g.fillStyle=gr;g.beginPath();g.moveTo(cx-w/2-1,tb);g.lineTo(cx,baseY-hgt);g.lineTo(cx+w/2+1,tb);g.closePath();g.fill();
 g.strokeStyle=GOLD;g.lineWidth=.6;g.stroke();g.strokeStyle=GOLD2;g.lineWidth=.6;g.beginPath();g.moveTo(cx,baseY-hgt);g.lineTo(cx,baseY-hgt-3);g.stroke();g.fillStyle=GOLD2;g.beginPath();g.arc(cx,baseY-hgt-3.5,.9,0,7);g.fill();}
function rune(g,cx,cy,r,col){g.save();g.shadowColor=col;g.shadowBlur=5*SCX;g.strokeStyle=col;g.lineWidth=.7;g.beginPath();g.arc(cx,cy,r,0,7);g.stroke();g.beginPath();g.arc(cx,cy,r*.62,0,7);g.stroke();
 for(let k=0;k<6;k++){const a=k*1.047;g.beginPath();g.moveTo(cx+Math.cos(a)*r*.62,cy+Math.sin(a)*r*.62);g.lineTo(cx+Math.cos(a+.5)*r,cy+Math.sin(a+.5)*r);g.stroke();}g.fillStyle=col;g.beginPath();g.arc(cx,cy,r*.22,0,7);g.fill();g.restore();g.strokeStyle=GOLD;g.lineWidth=.5;g.beginPath();g.arc(cx,cy,r+1,0,7);g.stroke();}
function flameRune(g,cx,cy,col){g.save();g.shadowColor=col;g.shadowBlur=4*SCX;g.fillStyle=col;g.beginPath();g.moveTo(cx,cy-4);g.quadraticCurveTo(cx+2.4,cy-.5,cx,cy+1.5);g.quadraticCurveTo(cx-2.4,cy-.5,cx,cy-4);g.fill();g.restore();g.strokeStyle=GOLD;g.lineWidth=.5;g.beginPath();g.arc(cx,cy-1,3.4,0,7);g.stroke();}
function emblem(g,cx,cy,col,kind){g.fillStyle='#140a06';g.beginPath();g.arc(cx,cy,4.6,0,7);g.fill();g.strokeStyle=GOLD;g.lineWidth=.9;g.beginPath();g.arc(cx,cy,4.4,0,7);g.stroke();filigree(g,cx,cy,1);
 g.save();g.shadowColor=col;g.shadowBlur=4*SCX;g.fillStyle=col;if(kind==='cross'){g.fillRect(cx-.9,cy-2.8,1.8,5.6);g.fillRect(cx-2.8,cy-.9,5.6,1.8);}else if(kind==='coin'){g.beginPath();g.arc(cx,cy,2.3,0,7);g.fill();g.fillStyle='#0a1430';g.fillRect(cx-.4,cy-1.4,.8,2.8);}else{for(let k=0;k<4;k++){const a=k*1.5708;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a-.3)*1.2,cy+Math.sin(a-.3)*1.2);g.lineTo(cx+Math.cos(a)*3,cy+Math.sin(a)*3);g.lineTo(cx+Math.cos(a+.3)*1.2,cy+Math.sin(a+.3)*1.2);g.fill();}}g.restore();}
function filigree(g,cx,cy,small){g.strokeStyle=GOLD;g.lineWidth=.55;const s=small?1.4:1;for(const d of [-1,1]){g.beginPath();g.moveTo(cx+d*(small?5:1.5),cy);g.bezierCurveTo(cx+d*6*s,cy-3*s,cx+d*9*s,cy+1*s,cx+d*7*s,cy+2.5*s);g.bezierCurveTo(cx+d*6*s,cy+3.4*s,cx+d*5*s,cy+2*s,cx+d*6*s,cy+1.4*s);g.stroke();}
 if(!small){g.fillStyle=GOLD2;g.beginPath();g.moveTo(cx,cy-2.5);g.lineTo(cx+1.5,cy);g.lineTo(cx,cy+2.5);g.lineTo(cx-1.5,cy);g.fill();}}
function castle(g,b){const X0=b.x*16,Y0=b.y*16,Wd=b.w*16,Hd=b.h*16;g.save();g.shadowColor='rgba(0,0,0,.8)';g.shadowBlur=8*SCX;g.fillStyle='#060204';g.fillRect(X0+2,Y0+8,Wd,Hd-6);g.restore();
 let gr=g.createLinearGradient(0,Y0,0,Y0+Hd);gr.addColorStop(0,'#2a1218');gr.addColorStop(1,'#0a0406');g.fillStyle=gr;g.fillRect(X0+8,Y0+22,Wd-16,Hd-22);
 g.strokeStyle='rgba(255,60,40,.12)';g.lineWidth=.5;for(let yy=Y0+26;yy<Y0+Hd;yy+=5){g.beginPath();g.moveTo(X0+8,yy);g.lineTo(X0+Wd-8,yy);g.stroke();}
 for(let q=X0+8;q<X0+Wd-8;q+=6){g.fillStyle='#1a080c';g.fillRect(q,Y0+18,4,5);}
 const towers=[[X0+8,46,14],[X0+Wd-8,46,14],[X0+Wd*.32,58,11],[X0+Wd*.68,58,11],[X0+Wd/2,80,13]];
 for(const [tx,ht,tw] of towers){const tb=Y0+Hd-6-ht+40;gr=g.createLinearGradient(tx-tw/2,0,tx+tw/2,0);gr.addColorStop(0,'#3a1a22');gr.addColorStop(1,'#08030a');g.fillStyle=gr;g.fillRect(tx-tw/2,tb,tw,Y0+Hd-tb);
  g.fillStyle='#160408';g.beginPath();g.moveTo(tx-tw/2-2,tb);g.lineTo(tx,tb-ht*.55);g.lineTo(tx+tw/2+2,tb);g.fill();g.strokeStyle='#8a2a1a';g.lineWidth=.6;g.stroke();
  g.save();g.shadowColor='#ff3a20';g.shadowBlur=5*SCX;g.fillStyle='#ff5030';for(let k=0;k<3;k++){arch(g,tx-1.2,tb+6+k*12,2.4,5);g.fill();}g.restore();g.fillStyle=GOLD;g.fillRect(tx-.5,tb-ht*.55-5,1,5);}
 const dx=b.dx*16;g.fillStyle='#000';arch(g,dx-3,Y0+Hd-22,22,22);g.fill();g.save();g.shadowColor='#ff2a10';g.shadowBlur=8*SCX;const fg=g.createLinearGradient(0,Y0+Hd-20,0,Y0+Hd);fg.addColorStop(0,'#ff6a30');fg.addColorStop(1,'#5a0804');g.fillStyle=fg;arch(g,dx,Y0+Hd-19,16,19);g.fill();g.restore();g.strokeStyle=GOLD;g.lineWidth=1;arch(g,dx-3,Y0+Hd-22,22,22);g.stroke();
 for(const bx of [X0+20,X0+Wd-26]){g.fillStyle='#6a0a10';g.beginPath();g.moveTo(bx,Y0+30);g.lineTo(bx+6,Y0+30);g.lineTo(bx+6,Y0+52);g.lineTo(bx+3,Y0+48);g.lineTo(bx,Y0+52);g.fill();g.fillStyle=GOLD;g.fillRect(bx-.5,Y0+29,7,1);g.save();g.shadowColor='#ff4020';g.shadowBlur=3*SCX;g.fillStyle='#ffb050';g.beginPath();g.arc(bx+3,Y0+38,1.5,0,7);g.fill();g.restore();}}
function shrine(g,b,body,trim,glowc){const X0=b.x*16,Y0=b.y*16,Wd=b.w*16,Hd=b.h*16;g.save();g.shadowColor='rgba(0,0,0,.6)';g.shadowBlur=5*SCX;g.fillStyle='rgba(0,0,0,.5)';g.fillRect(X0+2,Y0+4,Wd,Hd-2);g.restore();
 let gr=g.createLinearGradient(X0,0,X0+Wd,0);gr.addColorStop(0,rgb(sh(body,.15)));gr.addColorStop(1,rgb(sh(body,-.45)));g.fillStyle=gr;g.fillRect(X0+1,Y0+Hd*.42,Wd-2,Hd*.58);
 for(let q=0;q<=b.w*2;q++){const cx=X0+2+q*(Wd-4)/(b.w*2);g.fillStyle=rgb(sh(body,.3));g.fillRect(cx-.8,Y0+Hd*.45,1.6,Hd*.55);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(cx+.4,Y0+Hd*.45,.5,Hd*.55);}
 g.fillStyle=trim;g.fillRect(X0,Y0+Hd*.42-1.4,Wd,1.6);g.fillRect(X0,Y0+Hd-1.5,Wd,1.5);
 const cx=X0+Wd/2,cy=Y0+Hd*.42;gr=g.createRadialGradient(cx-4,cy-9,1,cx,cy-4,Wd*.42);gr.addColorStop(0,rgb(sh(trim,.5)));gr.addColorStop(1,rgb(sh(trim,-.45)));g.fillStyle=gr;g.beginPath();g.ellipse(cx,cy-1,Wd*.4,Hd*.32,0,Math.PI,0);g.fill();g.strokeStyle=GOLD2;g.lineWidth=.7;g.stroke();
 g.save();g.shadowColor=glowc;g.shadowBlur=6*SCX;g.fillStyle=glowc;g.beginPath();g.arc(cx,cy-Hd*.32-3,1.8,0,7);g.fill();g.restore();
 const dx=b.dx*16;g.fillStyle='#08080c';arch(g,dx+3,Y0+Hd-14,10,14);g.fill();g.save();g.shadowColor=glowc;g.shadowBlur=5*SCX;g.strokeStyle=glowc;g.lineWidth=.8;arch(g,dx+3,Y0+Hd-14,10,14);g.stroke();g.restore();}
function townProps(g,tn){const ox=tn.x*16,oy=tn.y*16,rk=TOWNREG[tn.id];
 const cloth=[['#7a1020','#d9a94a'],['#1a2a6a','#d9a94a'],['#4a1a6a','#d9a94a'],['#14504a','#d9a94a']];
 for(let i=0;i<3;i++){const sx=ox+(13+i*2)*16,sy=oy+4*16+6,c=cloth[(i+tn.id)%4];
  g.fillStyle='rgba(0,0,0,.45)';g.beginPath();g.ellipse(sx+9,sy+15,9,2.5,0,0,7);g.fill();
  g.fillStyle='#24140a';g.fillRect(sx+1,sy+3,1.6,11);g.fillRect(sx+13.4,sy+3,1.6,11);
  let gr=g.createLinearGradient(0,sy+8,0,sy+13);gr.addColorStop(0,'#5a3a20');gr.addColorStop(1,'#24140a');g.fillStyle=gr;g.fillRect(sx,sy+8.5,16,4.5);g.fillStyle=GOLD;g.fillRect(sx,sy+8.5,16,.6);
  const goods=['#ff5a3a','#7ad850','#ffd040','#b070ff','#60d0ff'];for(let k=0;k<4;k++){g.fillStyle=goods[(k+i+tn.id)%5];g.beginPath();g.arc(sx+2.5+k*3.6,sy+7.6,1.4,0,7);g.fill();g.fillStyle='rgba(255,255,255,.4)';g.fillRect(sx+2+k*3.6,sy+6.8,.6,.6);}
  gr=g.createLinearGradient(0,sy-1,0,sy+5);gr.addColorStop(0,rgb(sh(c[0],.25)));gr.addColorStop(1,rgb(sh(c[0],-.35)));g.fillStyle=gr;g.beginPath();g.moveTo(sx-1.5,sy+4);g.lineTo(sx+1,sy-1.5);g.lineTo(sx+15,sy-1.5);g.lineTo(sx+17.5,sy+4);
  for(let k=4;k>=0;k--)g.quadraticCurveTo(sx-1.5+k*3.8+1.9,sy+6.2,sx-1.5+k*3.8,sy+4);g.fill();g.strokeStyle=c[1];g.lineWidth=.6;g.beginPath();g.moveTo(sx+1,sy-1.5);g.lineTo(sx+15,sy-1.5);g.stroke();
  for(let k=0;k<5;k++){g.fillStyle=GOLD2;g.beginPath();g.arc(sx-1.5+k*3.8+1.9,sy+5.4,.45,0,7);g.fill();}}
 for(const [lx,ly] of LAMPS){const px=ox+lx*16+8,py=oy+ly*16+2;lamp(g,px,py);}
 for(const [fx,fy,col] of [[1,8,typeCol(tn)],[17,1,'#b01828']]){const px=ox+fx*16+4,py=oy+fy*16-12;g.fillStyle='#1a120c';g.fillRect(px-.5,py,1.2,14);g.fillStyle=GOLD2;g.beginPath();g.arc(px+.1,py-.4,.9,0,7);g.fill();
  const gr=g.createLinearGradient(px,py,px+8,py);gr.addColorStop(0,rgb(sh(col,-.1)));gr.addColorStop(1,rgb(sh(col,-.5)));g.fillStyle=gr;g.beginPath();g.moveTo(px+.7,py+.6);g.lineTo(px+7,py+1.4);g.lineTo(px+5.6,py+3.6);g.lineTo(px+7,py+5.8);g.lineTo(px+.7,py+6.4);g.fill();g.fillStyle=GOLD;g.fillRect(px+.7,py+.6,6.4,.5);}
 if(rk==='snow'){g.fillStyle='rgba(235,245,255,.9)';for(let i=0;i<3;i++){const sx=ox+(13+i*2)*16-1;g.beginPath();g.ellipse(sx+9,oy+4*16+4.5,8,1.3,0,0,7);g.fill();}}}
const LAMPS=[[9,5],[11,7],[3,7],[17,5]];
function lamp(g,px,py){g.fillStyle='rgba(0,0,0,.45)';g.beginPath();g.ellipse(px+1,py+13.5,3.2,1.2,0,0,7);g.fill();g.fillStyle='#14100e';g.fillRect(px-.8,py-1,1.6,14.5);g.fillRect(px-2,py+12.6,4,1.4);g.strokeStyle='#14100e';g.lineWidth=.7;g.beginPath();g.moveTo(px,py+1);g.quadraticCurveTo(px+2.5,py-1,px+2,py+2);g.stroke();
 g.fillStyle='#1a120a';g.beginPath();g.moveTo(px-2.6,py-2.5);g.lineTo(px+2.6,py-2.5);g.lineTo(px+2,py+2.6);g.lineTo(px-2,py+2.6);g.fill();g.fillStyle='#ffe2a0';g.fillRect(px-1.5,py-1.8,3,3.8);g.fillStyle=GOLD;g.beginPath();g.moveTo(px-3,py-2.6);g.lineTo(px,py-5);g.lineTo(px+3,py-2.6);g.fill();g.fillRect(px-2.2,py+2.4,4.4,.6);}
// ================= INTERIORS =================
const IPAL={house:{fl:'#8a5a36',wall:'#6a5040',rug:'#6a1420'},shop:{fl:'#6a4a32',wall:'#4a4e6a',rug:'#1a2a6a'},lab:{fl:'#5a6066',wall:'#3e5a62',rug:'#14504a',stone:1},center:{fl:'#7a4a4a',wall:'#6a3a44',rug:'#7e1222'},temple:{fl:'#7a7090',wall:'#4e4870',rug:'#6a1018',stone:1},gym:{fl:'#4a4256',wall:'#342c40',rug:'#000',stone:1},league:{fl:'#3a3446',wall:'#2e2838',rug:'#6a1420',stone:1},castle:{fl:'#4a1c22',wall:'#2a1014',rug:'#4a0a0e',stone:1},lair:{fl:'#ece0c0',wall:'#c8b890',rug:'#d9a94a',stone:1}};
function ipal(m){const p=Object.assign({},IPAL[m.type]||IPAL.house);if(m.type==='gym'&&TOWNS[m.town]){const tc=typeCol(TOWNS[m.town]);p.fl=mixHex(tc,'#100810',.45);p.wall=mixHex(tc,'#08040a',.62);p.tc=tc;}
 if(m.id==='skysea'){p.fl='#1a4a66';p.wall='#0e2a3e';p.rug='#40e0e0';}if(m.id==='citadel'){p.fl='#e8dcc0';p.wall='#b8a070';p.rug='#d9a94a';}return p;}
const BEAMS=[];
function paintInterior(g,m,x0,y0,x1,y1){const P=ipal(m),w=m.w;BEAMS.length=0;
 for(let y=y0-1;y<=y1+1;y++)for(let x=x0-1;x<=x1+1;x++){const v=tt(m,x,y);if(v<0)continue;floor(g,m,x,y,v,P);}
 // rug / runner
 g.save();const ex=Math.floor(w/2);let rr=null;
 if(m.type==='house')rr=[3,4.2,5,2.6];else if(m.type==='temple'||m.type==='league'||m.type==='castle'||m.type==='lair')rr=[ex-.1,2,1.2,m.h-3];else if(m.type==='center'||m.type==='shop')rr=[ex-1.5,4.3,4,m.h-5.3];else if(m.type==='lab')rr=[3,5,5,2.4];
 if(rr){const [rx,ry,rw,rh]=rr.map(v=>v*16);const rc=hex(P.rug);const gr=g.createLinearGradient(rx,0,rx+rw,0);gr.addColorStop(0,rgb(sh(rc,-.3)));gr.addColorStop(.5,rgb(sh(rc,.1)));gr.addColorStop(1,rgb(sh(rc,-.3)));g.fillStyle='rgba(0,0,0,.4)';g.fillRect(rx+1,ry+1,rw,rh);g.fillStyle=gr;g.fillRect(rx,ry,rw,rh);
  g.strokeStyle=GOLD;g.lineWidth=.9;g.strokeRect(rx+1.5,ry+1.5,rw-3,rh-3);g.lineWidth=.4;g.strokeRect(rx+3,ry+3,rw-6,rh-6);
  for(let yy=ry+8;yy<ry+rh-6;yy+=12){filigree(g,rx+rw/2,yy,rw<24);}}
 if(m.type==='gym'&&P.tc){const cx=(ex+.5)*16,cy=m.h*16*.5;g.globalAlpha=.55;rune(g,cx,cy,22,P.tc);g.globalAlpha=1;}
 g.restore();
 for(let y=y0-1;y<=y1+2;y++)for(let x=x0-1;x<=x1+1;x++){const v=tt(m,x,y);if(v<0)continue;furn(g,m,x,y,v,P);}
 g.save();g.globalCompositeOperation='lighter';for(const [px,py,gc] of BEAMS){const bg=g.createLinearGradient(0,py,0,py+64);const bc=hex(gc);bg.addColorStop(0,rgb(bc,.2));bg.addColorStop(1,rgb(bc,0));g.fillStyle=bg;g.beginPath();g.moveTo(px+4.5,py+2);g.lineTo(px+11.5,py+2);g.lineTo(px+24,py+66);g.lineTo(px+6,py+66);g.closePath();g.fill();}g.restore();}
function floor(g,m,x,y,v,P){const px=x*16,py=y*16,R=rngT(x,y,91);let fc=hex(P.fl);
 if(v===T.CFLOOR)fc=hex('#2e0c12');if(v===T.HFLOOR)fc=hex('#e8dcc0');if(v===T.SFLOOR)fc=hex('#164a66');
 if(v===T.IWALL||y===0){return wallT(g,m,x,y,P);}
 if(P.stone||v===T.CFLOOR||v===T.HFLOOR||v===T.SFLOOR){const c=sh(fc,((x+y)&1?.06:-.06)+(R()-.5)*.06);g.fillStyle=rgb(c);g.fillRect(px,py,16,16);const gr=g.createLinearGradient(px,py,px+16,py+16);gr.addColorStop(0,'rgba(255,240,220,.08)');gr.addColorStop(1,'rgba(0,0,0,.18)');g.fillStyle=gr;g.fillRect(px,py,16,16);
  g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=.6;g.strokeRect(px+.3,py+.3,15.4,15.4);g.strokeStyle='rgba(255,230,180,.1)';g.beginPath();g.moveTo(px+.8,py+15);g.lineTo(px+.8,py+.8);g.lineTo(px+15,py+.8);g.stroke();
  g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=.4;g.beginPath();let vx=px+R()*16,vy=py;g.moveTo(vx,vy);for(let k=0;k<3;k++){vx+=(R()-.5)*8;vy+=5.3;g.lineTo(vx,vy);}g.stroke();
  if(((x+y)&3)===0){g.fillStyle=(m.type==='lair'||v===T.HFLOOR)?'rgba(200,150,50,.6)':'rgba(217,169,74,.45)';g.beginPath();g.moveTo(px,py-1.4);g.lineTo(px+1.4,py);g.lineTo(px,py+1.4);g.lineTo(px-1.4,py);g.fill();}
  return;}
 for(let k=0;k<4;k++){const by=py+k*4;const c=sh(fc,(h2(x,y*4+k,92)-.5)*.2);g.fillStyle=rgb(c);g.fillRect(px,by,16,4);g.fillStyle='rgba(0,0,0,.45)';g.fillRect(px,by+3.5,16,.5);const off=((y*4+k)*7)%16;g.fillRect(px+off,by,.5,4);
  g.strokeStyle=rgb(sh(c,.12),.5);g.lineWidth=.3;g.beginPath();g.moveTo(px,by+1.5+R());g.bezierCurveTo(px+5,by+.8,px+10,by+2.6,px+16,by+1.5+R());g.stroke();}
 g.fillStyle='rgba(255,220,170,.05)';g.fillRect(px,py,16,1);}
function wallT(g,m,x,y,P){const px=x*16,py=y*16,wc=hex(P.wall);
 if(y===0){const up=py-14;let sg=g.createLinearGradient(0,up,0,py);sg.addColorStop(0,rgb(sh(wc,-.6)));sg.addColorStop(1,rgb(sh(wc,-.15)));g.fillStyle=sg;g.fillRect(px,up,16,14);g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=.4;for(let r=0;r<3;r++){const yy=up+2+r*4.4;g.beginPath();g.moveTo(px,yy);g.lineTo(px+16,yy);g.stroke();for(let q=px+(r&1?4:0);q<px+16;q+=8){g.beginPath();g.moveTo(q,yy);g.lineTo(q,yy+4.4);g.stroke();}}
  g.fillStyle=GOLD;g.fillRect(px,up,16,.8);
  if(x>0&&x<m.w-1&&x%3===2&&tt(m,x,y)===T.IWALL){const gc=m.type==='temple'?['#fff0c0','#6a90ff','#ff4a30'][x%3?(x>>1)%3:0]:m.type==='castle'?'#ff3a20':m.type==='gym'&&P.tc?P.tc:'#ffd890';g.fillStyle='#0c0608';arch(g,px+3.5,up+1.5,9,13);g.fill();g.save();g.shadowColor=gc;g.shadowBlur=5*SCX;const wg=g.createLinearGradient(0,up+2,0,up+14);wg.addColorStop(0,rgb(sh(gc,.4)));wg.addColorStop(1,rgb(sh(gc,-.3)));g.fillStyle=wg;arch(g,px+4.5,up+2.5,7,11.5);g.fill();g.restore();
   g.strokeStyle='#1a0e08';g.lineWidth=.5;g.beginPath();g.moveTo(px+8,up+2.5);g.lineTo(px+8,up+14);g.moveTo(px+4.5,up+8);g.lineTo(px+11.5,up+8);g.stroke();g.strokeStyle=GOLD;g.lineWidth=.6;arch(g,px+3.5,up+1.5,9,13);g.stroke();
   BEAMS.push([px,py,gc]);}}
 if(y===0&&x>0&&x<m.w-1){let gr=g.createLinearGradient(0,py,0,py+16);gr.addColorStop(0,rgb(sh(wc,-.35)));gr.addColorStop(.55,rgb(sh(wc,.1)));gr.addColorStop(1,rgb(sh(wc,-.2)));g.fillStyle=gr;g.fillRect(px,py,16,16);
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(px+7.6,py,.6,9);g.fillStyle='rgba(255,230,190,.07)';g.fillRect(px+8.2,py,.5,9);
  gr=g.createLinearGradient(0,py+9,0,py+16);gr.addColorStop(0,'#3a2216');gr.addColorStop(1,'#1a0e08');g.fillStyle=gr;g.fillRect(px,py+9,16,7);g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=.5;g.strokeRect(px+1.5,py+10.5,5.5,4);g.strokeRect(px+9,py+10.5,5.5,4);
  g.fillStyle=GOLD;g.fillRect(px,py+8.6,16,.8);g.fillRect(px,py+15.4,16,.6);g.fillStyle=GOLDD;g.fillRect(px,py+.5,16,.8);
  if(x%3===1&&tt(m,x,y)===T.IWALL&&!(m.type==='temple'&&(x===3||x===7))){g.fillStyle=GOLDD;g.fillRect(px+7,py+4,2,3);g.fillStyle=GOLD;g.fillRect(px+6,py+3.4,4,.8);g.fillStyle='#f0e6d0';g.fillRect(px+7.4,py+1.2,1.2,2.3);}
  return;}
 // side / bottom wall tops
 const gr=g.createLinearGradient(px,py,px+16,py+16);gr.addColorStop(0,'#120a0a');gr.addColorStop(1,'#060306');g.fillStyle=gr;g.fillRect(px,py,16,16);
 g.fillStyle=GOLD;const inner=x===0?[px+15,py,1,16]:x===m.w-1?[px,py,1,16]:y===m.h-1?[px,py,16,1]:y===0?[px,py+15,16,1]:null;if(inner){g.globalAlpha=.6;g.fillRect(...inner);g.globalAlpha=1;}}
function furn(g,m,x,y,v,P){const px=x*16,py=y*16;
 if(v===T.MAT){const gr=g.createLinearGradient(0,py,0,py+16);gr.addColorStop(0,'#7a1420');gr.addColorStop(1,'#3a060c');g.fillStyle=gr;g.fillRect(px+1,py+1,14,14);g.strokeStyle=GOLD;g.lineWidth=.7;g.strokeRect(px+2,py+2,12,12);g.fillStyle=GOLD2;for(let q=px+2;q<px+15;q+=2)g.fillRect(q,py+14.5,.6,1.3);g.fillStyle='rgba(255,220,150,.5)';g.beginPath();g.moveTo(px+5,py+7);g.lineTo(px+8,py+11);g.lineTo(px+11,py+7);g.fill();}
 else if(v===T.BED){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(px+1.5,py+2,14,14);g.fillStyle='#24140a';g.fillRect(px+1,py+.5,14,15);g.fillStyle=GOLD;g.fillRect(px+1,py+.5,14,.8);g.fillRect(px+1,py+.5,1,1);g.fillRect(px+14,py+.5,1,1);
  g.fillStyle='#ece2cc';g.beginPath();g.ellipse(px+8,py+4,5,2.3,0,0,7);g.fill();const bc=m.type==='temple'?'#2a3a6a':'#7e1626';const gr=g.createLinearGradient(0,py+6,0,py+15);gr.addColorStop(0,rgb(sh(bc,.2)));gr.addColorStop(1,rgb(sh(bc,-.4)));g.fillStyle=gr;g.fillRect(px+2,py+6.5,12,8.5);g.fillStyle=GOLD;g.fillRect(px+2,py+6.5,12,.7);g.fillRect(px+2,py+10.5,12,.4);}
 else if(v===T.TABLE){if(m.type==='temple'){g.fillStyle='rgba(0,0,0,.45)';g.fillRect(px,py+9,16,6);g.fillStyle='#3a2414';g.fillRect(px,py+4,16,5);g.fillStyle='#24140a';g.fillRect(px,py+9,16,4);g.fillStyle=GOLDD;g.fillRect(px,py+4,16,.6);return;}
  g.fillStyle='rgba(0,0,0,.45)';g.beginPath();g.ellipse(px+9,py+14,7,2.5,0,0,7);g.fill();g.fillStyle='#1e1008';g.fillRect(px+2,py+9,1.6,6);g.fillRect(px+12.4,py+9,1.6,6);
  const gr=g.createLinearGradient(0,py+3,0,py+10);gr.addColorStop(0,'#6a4228');gr.addColorStop(1,'#2a160a');g.fillStyle=gr;g.fillRect(px+.5,py+3,15,6.5);g.fillStyle=GOLD;g.fillRect(px+.5,py+9,15,.6);g.fillStyle='#4a0e14';g.fillRect(px+5,py+3,6,6.5);
  if(m.id==='b0_5'||m.type==='lab'){g.fillStyle='#e8e0d0';g.beginPath();g.arc(px+8,py+5.4,1.8,0,7);g.fill();g.fillStyle='#c02020';g.fillRect(px+6.2,py+4.6,3.6,.8);}else{g.fillStyle='#f0e6d0';g.fillRect(px+7.4,py+1.5,1.2,3.5);}}
 else if(v===T.COUNTER){g.fillStyle='rgba(0,0,0,.45)';g.fillRect(px,py+12,16,4);let gr=g.createLinearGradient(0,py+5,0,py+14);gr.addColorStop(0,'#4a2a18');gr.addColorStop(1,'#1a0c06');g.fillStyle=gr;g.fillRect(px,py+5,16,9);g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=.5;g.strokeRect(px+2,py+7,12,5);g.fillStyle=GOLD;g.fillRect(px,py+13.4,16,.6);
  gr=g.createLinearGradient(0,py+2,0,py+5.5);gr.addColorStop(0,'#c8b8a0');gr.addColorStop(1,'#6a5a4a');g.fillStyle=gr;g.fillRect(px,py+2,16,3.6);g.fillStyle=GOLD2;g.fillRect(px,py+5.3,16,.5);
  if(m.type==='shop'&&x%2)for(let k=0;k<3;k++){g.fillStyle=['#ff5a3a','#60d0ff','#ffd040'][(k+x)%3];g.fillRect(px+2+k*4.5,py-.5,3,3);}
  if(m.type==='center'&&x===Math.floor(m.w/2)+2){g.save();g.shadowColor='#ff6a80';g.shadowBlur=4*SCX;g.fillStyle='#ff9ab0';g.beginPath();g.arc(px+8,py+1.5,2.3,0,7);g.fill();g.restore();}}
 else if(v===T.PC){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(px+2,py+12,13,4);g.fillStyle='#1a1418';g.fillRect(px+3,py+8,10,7);g.fillStyle=GOLD;g.fillRect(px+3,py+8,10,.6);crystal(g,px+8,py+9.5,'#60f0ff');}
 else if(v===T.PILLAR){g.fillStyle='rgba(0,0,0,.5)';g.beginPath();g.ellipse(px+9.5,py+15,6,2,0,0,7);g.fill();const gr=g.createLinearGradient(px+3,0,px+13,0);gr.addColorStop(0,'#6a6070');gr.addColorStop(.35,'#9a90a0');gr.addColorStop(1,'#1e1a24');g.fillStyle=gr;g.fillRect(px+4,py-6,8,21);
  g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=.4;for(const q of [6,8,10]){g.beginPath();g.moveTo(px+q,py-5);g.lineTo(px+q,py+14);g.stroke();}g.fillStyle=GOLD;g.fillRect(px+2.8,py-7,10.4,2);g.fillRect(px+2.8,py+13.5,10.4,1.6);g.fillStyle=GOLD2;g.fillRect(px+2.8,py-7,10.4,.5);}
 else if(v===T.ALTAR){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(px,py+12,17,4);const gr=g.createLinearGradient(0,py+7,0,py+16);gr.addColorStop(0,'#8a7a6a');gr.addColorStop(1,'#2a221c');g.fillStyle=gr;g.fillRect(px+.5,py+7,15,8.5);g.fillStyle='#6a0e16';g.fillRect(px+4,py+7,8,8.5);g.fillStyle=GOLD;g.fillRect(px+.5,py+7,15,.8);g.fillRect(px+4,py+14,8,.6);filigree(g,px+8,py+11,1);
  for(const cx of [px+3.5,px+8,px+12.5]){g.fillStyle='#e8dcc0';g.fillRect(cx-.8,py+3.5,1.6,3.6);}}
 else if(v===T.MURAL){g.fillStyle=GOLDD;g.fillRect(px+.5,py+.5,15,11);g.fillStyle=GOLD;g.fillRect(px+1,py+1,14,10);const gr=g.createLinearGradient(0,py+1.6,0,py+10.4);gr.addColorStop(0,'#1a1430');gr.addColorStop(1,'#3a2030');g.fillStyle=gr;g.fillRect(px+1.6,py+1.6,12.8,8.8);
  g.fillStyle='rgba(140,120,100,.5)';g.fillRect(px+2.4,py+2,11.2,3);[['#c02020',4],['#f0f0e0',8],['#4080c0',12]].forEach(([c,cx])=>{g.fillStyle=c;g.beginPath();g.arc(cx+px,py+6,1,0,7);g.fill();g.fillRect(px+cx-1,py+7,2,3);});g.fillStyle='rgba(0,0,0,.35)';g.fillRect(px+.5,py+11.5,15,1.2);}
 else if(v===T.SEAL)seal(g,px,py);}
// ================= CHUNK CACHE + DRAW =================
function chunk(m,cx,cy,sc){const key=m.id+':'+cx+':'+cy+':'+sc;let c=cache.get(key);if(c){cache.delete(key);cache.set(key,c);return c;}
 c=document.createElement('canvas');const n=Math.ceil(CS*sc)+1;c.width=c.height=n;const g=c.getContext('2d');SCX=sc;g.setTransform(sc,0,0,sc,-cx*CS*sc,-cy*CS*sc);g.beginPath();g.rect(cx*CS,cy*CS,CS+2/sc,CS+2/sc);g.clip();
 const x0=cx*CH,y0=cy*CH;if(m.outdoor)paintWorld(g,m,x0,y0,x0+CH-1,y0+CH-1);else paintInterior(g,m,x0,y0,x0+CH-1,y0+CH-1);
 cache.set(key,c);built++;while(cache.size>CAP){cache.delete(cache.keys().next().value);}return c;}
WS.ground=function(m,camx,camy,sc){if(m.outdoor&&sc!==cacheSc){cache.clear();cacheSc=sc;}SCX=sc;built=0;
 const vw=WS.vw||VW,vh=WS.vh||VH;const c0=Math.floor(camx/CS),c1=Math.floor((camx+vw)/CS),r0=Math.floor(camy/CS),r1=Math.floor((camy+vh)/CS);const mxC=Math.ceil(m.w/CH)-1,myC=Math.ceil(m.h/CH)-1;
 for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){if(cx<0||cy<(m.outdoor?0:-1)||cx>mxC||cy>myC)continue;const c=chunk(m,cx,cy,sc);X.drawImage(c,Math.round((cx*CS-camx)*sc),Math.round((cy*CS-camy)*sc));}
 // prewarm one neighbour chunk per frame (keeps walking smooth)
 if(!built){const d=G.dir||'down',v={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[d];const cand=[];for(let cy=r0-1;cy<=r1+1;cy++)for(let cx=c0-1;cx<=c1+1;cx++){if(cx<0||cy<0||cx>mxC||cy>myC||cache.has(m.id+':'+cx+':'+cy+':'+sc))continue;cand.push([cx,cy,-(cx-(c0+c1)/2)*v[0]-(cy-(r0+r1)/2)*v[1]]);}
  if(cand.length){cand.sort((a,b)=>a[2]-b[2]);chunk(m,cand[0][0],cand[0][1],sc);}}};
WS.clear=function(){cache.clear();};WS._lf=function(m){return lightsFor(m);};
// ================= CHARACTERS =================
const CC=new Map();let CSC=2;
WS.char=function(ctx,px,py,col,dir,step,cap){const sc=Math.round((ctx.getTransform().a||2)*100)/100;CSC=sc;const key=col+'|'+dir+'|'+(step?1:0)+'|'+cap+'|'+sc;let c=CC.get(key);
 if(!c){c=document.createElement('canvas');c.width=Math.ceil(24*sc);c.height=Math.ceil(28*sc);const g=c.getContext('2d');g.setTransform(sc,0,0,sc,4*sc,10*sc);paintChar(g,col,dir,step,cap);CC.set(key,c);if(CC.size>300)CC.delete(CC.keys().next().value);}
 const k=sc;const dx=Math.round((px-4)*k)/k,dy=Math.round((py-10)*k)/k;ctx.drawImage(c,dx,dy,24,28);};
function paintChar(g,col,dir,step,cap){const hero=col==='#d03030'&&cap==='#d03030';const bob=step?1:0;const cc=hex(hero?'#8a1420':col);const hair=hex(hero?'#1a1018':(cap||'#3a2010'));
 g.fillStyle='rgba(2,0,8,.5)';g.beginPath();g.ellipse(8,15,5.6,2,0,0,7);g.fill();
 g.fillStyle='#120c10';g.fillRect(5,12.5-bob+(step?-.5:0),2.4,3.5);g.fillRect(8.6,12.5-bob+(step?.5:0),2.4,3.5);g.fillStyle=GOLDD;g.fillRect(5,15.3,2.4,.6);g.fillRect(8.6,15.3,2.4,.6);
 const by=-bob;let gr=g.createLinearGradient(3,0,13,0);gr.addColorStop(0,rgb(sh(cc,.3)));gr.addColorStop(.5,rgb(cc));gr.addColorStop(1,rgb(sh(cc,-.5)));
 g.fillStyle=gr;g.strokeStyle='#0a060c';g.lineWidth=.7;g.beginPath();g.moveTo(5,7.4+by);g.quadraticCurveTo(8,6.4+by,11,7.4+by);g.lineTo(12.8,14+by);g.quadraticCurveTo(8,14.8+by,3.2,14+by);g.closePath();g.fill();g.stroke();
 g.fillStyle=rgb(sh(cc,-.35));g.fillRect(3.3,8.6+by,1.6,4.4);g.fillRect(11.1,8.6+by,1.6,4.4);
 g.fillStyle=GOLD;g.fillRect(4.2,11+by,7.6,.8);g.fillStyle=GOLD2;g.fillRect(7.4,10.8+by,1.2,1.2);if(hero||cap==='#e02020'){g.strokeStyle=GOLD;g.lineWidth=.5;g.beginPath();g.moveTo(8,7+by);g.lineTo(8,14.4+by);g.stroke();}
 if(dir!=='up'){g.fillStyle=GOLD;g.beginPath();g.moveTo(6,7.2+by);g.lineTo(8,9+by);g.lineTo(10,7.2+by);g.lineTo(9.2,7+by);g.lineTo(8,8+by);g.lineTo(6.8,7+by);g.fill();}
 // head
 gr=g.createRadialGradient(6.8,3.6+by,.5,8,4.6+by,4.2);gr.addColorStop(0,'#f6dcc0');gr.addColorStop(1,'#b07a5c');g.fillStyle=gr;g.beginPath();g.arc(8,4.6+by,3.5,0,7);g.fill();g.strokeStyle='#0a060c';g.lineWidth=.6;g.stroke();
 g.fillStyle=rgb(hair);g.beginPath();if(dir==='up'){g.arc(8,4.4+by,3.8,0,7);}else{g.arc(8,3.9+by,3.8,Math.PI*1.02,Math.PI*1.98);g.lineTo(11.6,5+by);g.quadraticCurveTo(8,1.8+by,4.4,5+by);g.closePath();}g.fill();
 if(dir==='left'){g.fillRect(9.5,3+by,2.2,4.2);}if(dir==='right'){g.fillRect(4.3,3+by,2.2,4.2);}
 g.strokeStyle='rgba(255,236,190,.55)';g.lineWidth=.45;g.beginPath();g.arc(8,4.3+by,3.7,3.6,4.8);g.stroke();g.beginPath();g.moveTo(4.6,8.4+by);g.lineTo(3.6,13.6+by);g.stroke();
 if(dir!=='up'){const o=dir==='left'?-1.2:dir==='right'?1.2:0;g.fillStyle='#1a0c12';const es=dir==='down'?[6.6,9.4]:[8+o*1.2];for(const ex of es){g.fillRect(ex+o*.5-.55,5+by,1.1,1.3);}g.fillStyle='rgba(255,255,255,.8)';for(const ex of es)g.fillRect(ex+o*.5-.45,5.1+by,.4,.4);}
 if(hero){g.save();g.shadowColor='#ffb040';g.shadowBlur=2*CSC;g.fillStyle=GOLD2;g.beginPath();g.moveTo(8,.4+by);g.lineTo(9,1.4+by);g.lineTo(8,2.4+by);g.lineTo(7,1.4+by);g.fill();g.restore();}}
// ================= NPC SPRITES (brief 40): deterministic per-NPC looks, role designs, cached at device resolution =================
const LOOKS=new Map();const NC=new Map();
function hs(str,k){let n=2166136261^k;for(let i=0;i<str.length;i++){n^=str.charCodeAt(i);n=Math.imul(n,16777619);}n^=n>>>15;n=Math.imul(n,2246822519);n^=n>>>13;return (n>>>0)/4294967296;}
const pick=(a,str,k)=>a[Math.floor(hs(str,k)*a.length)%a.length];
const SKIN=['#f6dcc0','#efc8a4','#dcae86','#c08c62','#9a6a44','#74482e'];
const HAIRC=['#1a1018','#3a2010','#5e341a','#8a4e24','#c89a50','#e6d8b8','#8a2a1a','#2a2a48','#c0c4cc'];
const CLOTH=['#7a1a24','#1e3a7a','#2a6a3a','#6a4a1a','#4a2a6a','#14606a','#8a6a2a','#5a5a66','#9a3a5a','#3a5a2a','#a05a20','#2a4a5a'];
WS.look=function(key,role,o){o=o||{};const ck=key+'|'+role;let L=LOOKS.get(ck);if(L)return L;
 const h=k=>hs(key,k);L={key:ck,bw:0.9+h(1)*0.24,bh:0.93+h(2)*0.12,skin:pick(SKIN,key,3),hair:pick(HAIRC,key,4),hs:pick(['short','long','bun','spiky','bob','braid','short','bald'],key,5),
  head:pick(['none','none','hat','cap','bandana','headscarf','circlet','hood','none'],key,6),out:pick(CLOTH,key,7),out2:pick(CLOTH,key,8),cloak:h(9)<0.4?pick(CLOTH,key,10):null,
  pat:pick(['plain','stripes','sash','trim','checks','plain'],key,11),acc:[],robe:false,eyes:'#1a0c12',beard:false,glow:null,sym:null,stoop:0};
 if(h(12)<0.3)L.acc.push(pick(['satchel','scarf','apron','basket','book','lantern'],key,13));if(h(14)<0.15)L.acc.push('glasses');
 const age=o.age;if(typeof age==='number'&&age<15){L.bh=0.78;L.bw=0.86;L.kid=1;L.head=pick(['none','cap','bandana','none'],key,15);L.out=pick(['#d04040','#3a7ad0','#e0a020','#40a060','#c050c0'],key,16);}
 else if(typeof age==='number'&&age>=58){L.hair=pick(['#e6e2da','#c0c4cc','#9a9aa4'],key,17);L.stoop=1;if(h(18)<0.6)L.acc.push('staff');if(h(19)<0.45)L.beard=true;if(L.hs==='spiky')L.hs='short';}
 const R=role.split(':');
 switch(R[0]){
  case 'player':Object.assign(L,{bw:1,bh:1,skin:'#f0d0b0',hair:'#1a1018',hs:'short',head:'circlet',out:'#a01828',out2:'#2a1018',cloak:'#5a0c18',pat:'trim',acc:['satchel'],hero:1});break;
  case 'rival':Object.assign(L,{bw:1,bh:1.02,hair:'#5e341a',hs:'spiky',head:'none',out:'#1e3a9a',out2:'#101830',cloak:null,pat:'stripes',acc:['scarf']});break;
  case 'priest':Object.assign(L,{robe:true,out:'#efe6cc',out2:'#c8b88a',cloak:null,pat:'trim',head:pick(['circlet','hood','none'],key,20),sym:'three',acc:['staff']});break;
  case 'follower':Object.assign(L,{robe:true,out:'#16161f',out2:'#0a0a10',cloak:'#0c0c14',pat:'runes',head:'deephood',eyes:'#ff3020',glow:'#ff2a20',acc:[]});break;
  case 'monk':Object.assign(L,{robe:true,bw:1.06,bh:1.08,out:'#2a2028',out2:'#120c10',cloak:'#1a0c10',pat:'sash',head:'deephood',eyes:'#ff5030',glow:'#ff3020',beard:true,hair:'#9a9aa4',acc:['staff','beads'],sym:'rune',monk:1});break;
  case 'guard':Object.assign(L,{head:'helmet',out:'#3a4a6a',out2:'#1a2030',cloak:'#1e3a7a',pat:'trim',acc:['armor','spear']});break;
  case 'nurse':Object.assign(L,{head:'nursecap',out:'#f4e8ea',out2:'#e07a90',cloak:null,pat:'trim',acc:['apron'],hs:'bun',hair:'#c86a7a'});break;
  case 'clerk':Object.assign(L,{head:'cap',out:'#2a5ab0',out2:'#18306a',cloak:null,pat:'plain',acc:['apron']});break;
  case 'stranger':Object.assign(L,{robe:true,out:'#5a5866',out2:'#3a3844',cloak:'#4a4854',head:'deephood',eyes:'#c0e0ff',glow:'#a0c0ff',acc:['staff']});break;
  case 'ranger':Object.assign(L,{head:'hood',out:'#3a5a2a',out2:'#2a3a1a',cloak:'#2a4a20',acc:['satchel','beardshort']});L.beard=true;break;
  case 'champion':Object.assign(L,{bw:1.02,bh:1.06,head:'circlet',hair:'#e8d8a8',hs:'long',out:'#e8d080',out2:'#8a6a20',cloak:'#f4f0e4',pat:'trim',acc:['armor','sword']});break;
  case 'elite':{const c=['#8a7050','#8a96a8','#c060a0','#e0c030'][+R[1]||0];Object.assign(L,{out:c,out2:'#2a2228',cloak:'#2a1a20',pat:'trim',acc:['armor'],head:['helmet','glasses','circlet','bandana'][+R[1]||0]});if(R[1]==='1')L.acc.push('glasses');break;}
  case 'leader':{const tp=R[1];const D={Leaf:{out:'#3a8a3a',out2:'#1e4a1e',head:'flowers',hair:'#8a3a1a',hs:'bun',acc:['basket'],cloak:'#5a3a1a'},Fire:{out:'#6a3a22',out2:'#2a160c',head:'none',hair:'#b03a12',hs:'short',acc:['apron','hammer'],beard:true,bw:1.15,cloak:null},
    Tide:{out:'#1e8aa0',out2:'#0e3a5a',head:'wave',hair:'#14243a',hs:'long',acc:['trident'],cloak:'#0e4a6a'},Gale:{out:'#c0a040',out2:'#5a4a1e',head:'goggles',hair:'#e6d080',hs:'spiky',acc:['scarf'],cloak:null},
    Frost:{out:'#8aa8c8',out2:'#3a4a6a',head:'furhood',hair:'#e6e2da',hs:'short',acc:['armor'],beard:true,bw:1.12,cloak:'#e8f0ff'},Dark:{out:'#3a1a4a',out2:'#140818',head:'tophat',hair:'#1a1018',hs:'short',acc:['lantern'],cloak:'#4a1a6a'}}[tp]||{};
   Object.assign(L,D,{pat:'trim',typec:TCOL[tp]||'#d9a94a'});break;}
  case 'kid':Object.assign(L,{bh:0.78,bw:0.86,kid:1});break;
 }
 if(o.acc)L.acc.push(o.acc);if(o.head)L.head=o.head;if(o.out)L.out=o.out;
 LOOKS.set(ck,L);return L;};
function paintNPC(g,L,dir,fr){if(typeof fr==='number')fr=fr===1?'w1':fr===3?'w4':fr===2?'i1':'i0';const WI=fr[0]==='w'?+fr.slice(1):-1,ph=WI>=0?WI/6*Math.PI*2:0,ws=WI>=0?Math.sin(ph):0,wc=WI>=0?Math.cos(ph):0,idle1=fr==='i1';const step=ws,br=WI>=0?-(1-Math.abs(ws))*.6:idle1?-.25:0,side=dir==='left'?-1:dir==='right'?1:0,up=dir==='up';
 const C=k=>hex(k),out=C(L.out),out2=C(L.out2),skin=C(L.skin),hair=C(L.hair);
 {const sg=g.createRadialGradient(8,15.5,.3,8,15.5,5.6*L.bw);sg.addColorStop(0,'rgba(10,4,20,.55)');sg.addColorStop(.6,'rgba(10,4,20,.3)');sg.addColorStop(1,'rgba(10,4,20,0)');g.fillStyle=sg;g.save();g.translate(8,15.5);g.scale(1+Math.abs(ws)*.08,.36);g.translate(-8,-15.5);g.beginPath();g.arc(8,15.5,5.6*L.bw,0,7);g.fill();g.restore();}
 g.save();g.translate(8,16);g.scale(L.bw,L.bh);g.translate(-8,-16);const by=br+(L.stoop?.6:0);
 const staffSide=side===-1?3:13;
 const longAcc=a=>L.acc.includes(a);
 // staff / spear / trident / hammer (behind when facing up)
 const pole=()=>{if(longAcc('staff')||longAcc('spear')||longAcc('trident')){const x=staffSide;g.strokeStyle='#3a2414';g.lineWidth=.9;g.beginPath();g.moveTo(x,15.5);g.lineTo(x,-1+by);g.stroke();g.strokeStyle=GOLD;g.lineWidth=.4;g.beginPath();g.moveTo(x-.3,15);g.lineTo(x-.3,0+by);g.stroke();
   if(longAcc('spear')){g.fillStyle='#d8dce8';g.beginPath();g.moveTo(x-1.1,-1+by);g.lineTo(x,-4.5+by);g.lineTo(x+1.1,-1+by);g.fill();}
   else if(longAcc('trident')){g.strokeStyle='#9af0ff';g.lineWidth=.6;g.beginPath();for(const d of [-1.4,0,1.4]){g.moveTo(x+d,-1+by);g.lineTo(x+d,-3.6+by);}g.moveTo(x-1.4,-1+by);g.lineTo(x+1.4,-1+by);g.stroke();}
   else{const oc=L.monk?'#ff3020':L.glow||'#fff0a0';g.save();g.shadowColor=oc;g.shadowBlur=3*CSC;g.fillStyle=oc;g.beginPath();g.arc(x,-1.6+by,1.25,0,7);g.fill();g.restore();g.strokeStyle=GOLD2;g.lineWidth=.4;g.beginPath();g.arc(x,-1.6+by,1.6,0,7);g.stroke();}}
  if(longAcc('hammer')){const x=staffSide;g.strokeStyle='#3a2414';g.lineWidth=.9;g.beginPath();g.moveTo(x,13);g.lineTo(x,6+by);g.stroke();g.fillStyle='#5a5a66';g.fillRect(x-2,4.6+by,4,2.2);g.fillStyle=GOLD;g.fillRect(x-2,4.6+by,4,.4);}
  if(longAcc('sword')){const x=staffSide;g.save();g.shadowColor='#fff4c0';g.shadowBlur=2*CSC;g.strokeStyle='#f0f4ff';g.lineWidth=.9;g.beginPath();g.moveTo(x,13);g.lineTo(x,3+by);g.stroke();g.restore();g.fillStyle=GOLD;g.fillRect(x-1.6,10.6+by,3.2,.7);}};
 if(up)pole();
 // cloak behind body
 if(L.cloak&&!up){const cc=C(L.cloak);g.fillStyle=rgb(sh(cc,-.35));g.beginPath();g.moveTo(4.2,7.6+by);g.lineTo(11.8,7.6+by);g.lineTo(13.4+(side?-side*.6:0)+ws*.3,14.3);g.lineTo(2.6+(side?-side*.6:0)+ws*.3,14.3);g.closePath();g.fill();}
 // legs
 {const legc=rgb(sh(out2,-.3)),legd=rgb(sh(out2,-.55)),boot=L.robe?'#2a1a14':'#1a1010';const top=11.6+by;
  const leg=(x,lift,dark,toe)=>{const fy=14.5-lift;if(!L.robe){g.fillStyle=dark?legd:legc;g.fillRect(x,top,2.3,fy-top+.3);g.fillStyle='rgba(255,240,210,.18)';g.fillRect(x,top,.5,fy-top);}
   g.fillStyle=dark?'#0c0808':boot;g.beginPath();if(g.roundRect)g.roundRect(x-.2+(toe<0?-1:0),fy,2.7+(toe?1:0),1.35,.5);else g.rect(x-.2+(toe<0?-1:0),fy,2.7+(toe?1:0),1.35);g.fill();g.fillStyle=GOLDD;g.fillRect(x-.2+(toe<0?-1:0),fy+1.05,2.7+(toe?1:0),.3);g.fillStyle='rgba(255,240,200,.35)';g.fillRect(x+.3,fy+.15,1,.35);};
  if(side){const o=ws*2.1*side;const la=Math.max(0,wc)*1.1,lb=Math.max(0,-wc)*1.1;leg(6.85-o,lb,1,side);leg(6.85+o,la,0,side);}
  else{const la=Math.max(0,wc)*.9,lb=Math.max(0,-wc)*.9;leg(5.2,la-(ws>0?0:0)+ (idle1?.25:0),0,0);leg(8.5,lb,0,0);}}
 // torso / robe
 let gr=g.createLinearGradient(3.5,0,12.5,0);gr.addColorStop(0,rgb(sh(out,.3)));gr.addColorStop(.45,rgb(out));gr.addColorStop(1,rgb(sh(out,-.5)));g.fillStyle=gr;g.strokeStyle='#0a060c';g.lineWidth=.6;g.beginPath();
 if(L.robe){g.moveTo(5,7.4+by);g.quadraticCurveTo(8,6.5+by,11,7.4+by);g.lineTo(12.6+step*.4,14.7);g.quadraticCurveTo(8,15.3+Math.abs(ws)*.2,3.4+step*.4,14.7);}else{g.moveTo(5,7.4+by);g.quadraticCurveTo(8,6.5+by,11,7.4+by);g.lineTo(12,12.6+by);g.quadraticCurveTo(8,13.3+by,4,12.6+by);}
 g.closePath();g.fill();g.stroke();
 g.save();g.clip();
 if(L.pat==='stripes'){g.fillStyle=rgb(sh(out2,.1),.55);for(let k=0;k<3;k++)g.fillRect(3,8.6+k*1.6+by,10,.6);}
 else if(L.pat==='checks'){g.fillStyle=rgb(out2,.45);for(let a=0;a<4;a++)for(let b=0;b<4;b++)if((a+b)&1)g.fillRect(4+a*2,7.5+b*1.6+by,2,1.6);}
 else if(L.pat==='sash'&&!up){g.strokeStyle=L.monk?'#8a1418':rgb(out2);g.lineWidth=1.3;g.beginPath();g.moveTo(5,7.6+by);g.lineTo(11.4,12.4+by);g.stroke();}
 else if(L.pat==='runes'){g.save();g.shadowColor='#ff2a20';g.shadowBlur=2*CSC;g.strokeStyle='#e02a20';g.lineWidth=.45;for(let k=0;k<3;k++){const yy=10+k*2+by;g.beginPath();g.moveTo(4.4,yy);g.lineTo(5.4,yy-1);g.lineTo(6.2,yy);g.moveTo(10,yy);g.lineTo(10.8,yy-1);g.lineTo(11.8,yy);g.stroke();}g.restore();}
 g.fillStyle=rgb(sh(out,-.6),.5);g.fillRect(L.robe?11.2:10.8,7.5+by,2,8.3);g.strokeStyle='rgba(255,236,190,.5)';g.lineWidth=.45;g.beginPath();g.moveTo(4.7,8.4+by);g.lineTo(3.8,L.robe?14.4:12.4+by);g.stroke();
 g.restore();
 if(L.pat==='trim'||L.robe){g.strokeStyle=GOLD;g.lineWidth=.45;g.beginPath();g.moveTo(8,7+by);g.lineTo(8,(L.robe?14.8:12.9)+by*(L.robe?0:1));g.stroke();}
 g.fillStyle=GOLD;g.fillRect(4.2,11+by,7.6,.75);g.fillStyle=GOLD2;g.fillRect(7.4,10.8+by,1.2,1.1);
 // chest accessories
 if(!up){if(longAcc('apron')){g.fillStyle=L.out2==='#e07a90'?'#ffffff':'#c8b088';g.fillRect(5.6,9+by,4.8,L.robe?6:4.4);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(9.6,9+by,.8,4.4);}
  if(longAcc('armor')){gr=g.createLinearGradient(5,0,11,0);gr.addColorStop(0,'#e8ecf4');gr.addColorStop(1,'#5a6070');g.fillStyle=gr;g.beginPath();g.moveTo(5,7.8+by);g.lineTo(11,7.8+by);g.lineTo(10.4,10.6+by);g.lineTo(5.6,10.6+by);g.fill();g.fillStyle=GOLD;g.fillRect(5,7.6+by,6,.5);g.fillStyle='#c8ccd8';g.fillRect(3.4,7.6+by,2,1.6);g.fillRect(10.6,7.6+by,2,1.6);}
  if(L.sym==='three'){g.save();g.shadowBlur=2*CSC;[['#fff4d0',6.4],['#70a0ff',8],['#ff5030',9.6]].forEach(([c,x])=>{g.shadowColor=c;g.fillStyle=c;g.beginPath();g.arc(x,9.4+by,.62,0,7);g.fill();});g.restore();}
  if(L.sym==='rune'){g.save();g.shadowColor='#ff2010';g.shadowBlur=4*CSC;g.strokeStyle='#ff4020';g.lineWidth=.55;g.beginPath();g.arc(8,9.6+by,1.5,0,7);g.moveTo(8,7.8+by);g.lineTo(8,11.4+by);g.moveTo(6.6,10.4+by);g.lineTo(9.4,8.8+by);g.stroke();g.restore();}
  if(longAcc('beads')){g.fillStyle='#c8a060';for(let k=0;k<6;k++){g.beginPath();g.arc(6+k*.8,8+Math.sin(k/5*3.14)*2.4+by,.35,0,7);g.fill();}}
  if(L.typec){g.save();g.shadowColor=L.typec;g.shadowBlur=3*CSC;g.fillStyle=L.typec;g.beginPath();g.arc(8,9+by,.8,0,7);g.fill();g.restore();}}
 if(longAcc('satchel')){g.strokeStyle='#5a3a1a';g.lineWidth=.6;g.beginPath();g.moveTo(5,7.8+by);g.lineTo(11,11+by);g.stroke();g.fillStyle='#6a4422';g.fillRect(side===-1?3.4:10,10.4+by,2.6,2.4);g.fillStyle=GOLD;g.fillRect(side===-1?3.4:10,10.4+by,2.6,.4);}
 if(longAcc('basket')&&!up){g.fillStyle='#8a6a30';g.beginPath();g.ellipse(side===-1?4:12,12+by,2,1.4,0,0,7);g.fill();g.fillStyle='#ff7a9a';g.fillRect((side===-1?4:12)-1,10.8+by,.9,.9);g.fillStyle='#ffe06a';g.fillRect(side===-1?4:12,10.6+by,.9,.9);}
 if(longAcc('lantern')){const x=side===-1?3.2:12.8;g.strokeStyle='#14100e';g.lineWidth=.4;g.beginPath();g.moveTo(x,10.4+by);g.lineTo(x,11.6+by);g.stroke();g.save();g.shadowColor='#ffd070';g.shadowBlur=4*CSC;g.fillStyle='#ffe2a0';g.fillRect(x-.9,11.6+by,1.8,2);g.restore();}
 if(longAcc('book')&&!up){g.fillStyle='#6a1420';g.fillRect(side===-1?3:10.6,9.8+by,2.4,3);g.fillStyle=GOLD;g.fillRect(side===-1?3:10.6,9.8+by,.4,3);}
 // arms + hands
 {const ac=rgb(sh(out,-.25)),sk=rgb(skin);const arm=(x,dy,dark)=>{g.fillStyle=dark?rgb(sh(out,-.5)):ac;g.fillRect(x,8.4+by,1.6,4+dy);g.fillStyle=sk;g.fillRect(x+.1,12.2+by+dy,1.4,1.1);};
  if(side){const o=-ws*1.6*side;g.save();g.translate(7.6,8.6+by);g.rotate(-ws*.35*side);g.fillStyle=ac;g.fillRect(-.8,0,1.6,3.8);g.fillStyle=sk;g.fillRect(-.7,3.6,1.4,1.1);g.restore();}
  else{arm(3.3,-ws*.6,0);arm(11.1,ws*.6,0);}}
 if(!up)pole();
 // scarf
 if(longAcc('scarf')){g.fillStyle=L.out2==='#101830'?'#e03030':rgb(sh(out2,.2));g.fillRect(5,6.8+by,6,1.4);if(!up)g.fillRect(side===-1?9.6:5.6,7.6+by,1.2,3);}
 // cloak over back when facing up
 if(L.cloak&&up){const cc=C(L.cloak);gr=g.createLinearGradient(3,0,13,0);gr.addColorStop(0,rgb(sh(cc,.2)));gr.addColorStop(1,rgb(sh(cc,-.45)));g.fillStyle=gr;g.beginPath();g.moveTo(4.4,7.2+by);g.lineTo(11.6,7.2+by);g.lineTo(13+ws*.3,14.3);g.lineTo(3+ws*.3,14.3);g.closePath();g.fill();g.fillStyle=GOLD;g.fillRect(3+ws*.3,13.9,10,.5);}
 // head
 const hy=4.4+by+(L.kid?.6:0),hr=L.kid?3.8:3.4;const dh=L.head==='deephood';
 if(dh){const hc=C(L.cloak||L.out);gr=g.createRadialGradient(7,hy-1.4,.5,8,hy,5);gr.addColorStop(0,rgb(sh(hc,.25)));gr.addColorStop(1,rgb(sh(hc,-.5)));g.fillStyle=gr;g.beginPath();g.moveTo(3.6,hy+3.4);g.quadraticCurveTo(3.4,hy-4.6,8,hy-5.2);g.quadraticCurveTo(12.6,hy-4.6,12.4,hy+3.4);g.closePath();g.fill();g.strokeStyle='#05030a';g.lineWidth=.5;g.stroke();
  if(!up){g.fillStyle='#050308';g.beginPath();g.ellipse(8+side*.8,hy+.6,2.5,2.6,0,0,7);g.fill();if(L.beard){g.fillStyle=rgb(hair);g.beginPath();g.moveTo(6.4+side*.6,hy+2);g.lineTo(9.6+side*.6,hy+2);g.lineTo(8+side*.6,hy+4.6);g.fill();}
   g.save();g.shadowColor=L.glow;g.shadowBlur=3*CSC;g.fillStyle=L.eyes;const es=side?[8+side*1.6]:[7,9];for(const ex of es)g.fillRect(ex-.45,hy+.1,.9,.7);g.restore();}
  if(L.glow&&L.monk){g.strokeStyle='#8a1418';g.lineWidth=.5;g.beginPath();g.moveTo(3.8,hy+3);g.quadraticCurveTo(3.6,hy-4.2,8,hy-4.8);g.stroke();}}
 else{gr=g.createRadialGradient(6.8,hy-1,.5,8,hy,hr+.6);gr.addColorStop(0,rgb(sh(skin,.25)));gr.addColorStop(1,rgb(sh(skin,-.35)));g.fillStyle=gr;g.beginPath();g.arc(8,hy,hr,0,7);g.fill();g.strokeStyle='#0a060c';g.lineWidth=.5;g.stroke();
  // hair
  g.fillStyle=rgb(hair);const hs2=L.head==='hood'||L.head==='furhood'||L.head==='headscarf'||L.head==='helmet'?'hidden':L.hs;
  if(hs2!=='bald'&&hs2!=='hidden'){g.beginPath();if(up){g.arc(8,hy-.2,hr+.35,0,7);}else{g.arc(8,hy-.5,hr+.35,Math.PI*1.02,Math.PI*1.98);g.lineTo(8+hr+.2,hy+.4);g.quadraticCurveTo(8,hy-2.6,8-hr-.2,hy+.4);g.closePath();}g.fill();
   if(hs2==='long'||hs2==='braid'){g.fillRect(4.3,hy-.5,1.6,5.4);g.fillRect(10.1,hy-.5,1.6,5.4);if(up)g.fillRect(4.6,hy,6.8,5.2);}
   if(hs2==='bob'){g.fillRect(4.3,hy-.4,1.6,3);g.fillRect(10.1,hy-.4,1.6,3);}
   if(hs2==='bun'){g.beginPath();g.arc(8,hy-hr-.6,1.5,0,7);g.fill();}
   if(hs2==='spiky'){g.beginPath();for(let k=0;k<5;k++){const x=4.6+k*1.7;g.moveTo(x,hy-2);g.lineTo(x+.6,hy-hr-1.8);g.lineTo(x+1.4,hy-2);}g.fill();}
   if(hs2==='braid'&&!up){g.fillRect(side===-1?10.4:4.4,hy+4.6,1.2,2.4);}
   if(side===-1)g.fillRect(9.5,hy-1.6,2.2,3.8);if(side===1)g.fillRect(4.3,hy-1.6,2.2,3.8);
   g.strokeStyle=rgb(sh(hair,.45),.6);g.lineWidth=.4;g.beginPath();g.arc(8,hy-.5,hr,3.6,4.6);g.stroke();}
  // face
  if(!up){const o=side*1.3;const es=side?[8+o*1.2]:[6.7,9.3];g.fillStyle=L.eyes;for(const ex of es)g.fillRect(ex+o*.4-.5,hy+.3,1,1.2);g.fillStyle='rgba(255,255,255,.8)';for(const ex of es)g.fillRect(ex+o*.4-.4,hy+.35,.35,.35);
   g.fillStyle='rgba(200,80,80,.35)';if(!side){g.fillRect(5.6,hy+1.8,1,.6);g.fillRect(9.4,hy+1.8,1,.6);}
   if(L.acc.includes('glasses')){g.strokeStyle=GOLD2;g.lineWidth=.35;for(const ex of es){g.beginPath();g.arc(ex+o*.4,hy+.9,1,0,7);g.stroke();}}
   if(L.beard){g.fillStyle=rgb(hair);g.beginPath();g.moveTo(5.2+o*.5,hy+1.8);g.quadraticCurveTo(8+o*.5,hy+(L.acc.includes('beardshort')?4.2:6.2),10.8+o*.5,hy+1.8);g.lineTo(9.6+o*.5,hy+2.6);g.lineTo(6.4+o*.5,hy+2.6);g.fill();}}
  // headwear
  const hw=L.head;const hc=C(L.out2);
  if(hw==='hat'){g.fillStyle=rgb(sh(hc,-.1));g.beginPath();g.ellipse(8,hy-1.8,5.6,1.4,0,0,7);g.fill();g.fillStyle=rgb(sh(hc,.15));g.fillRect(5.4,hy-4.8,5.2,3.2);g.fillStyle=GOLD;g.fillRect(5.4,hy-2.4,5.2,.6);}
  else if(hw==='cap'){g.fillStyle=rgb(hc);g.beginPath();g.arc(8,hy-1.2,hr+.2,Math.PI,0);g.fill();if(!up){g.fillRect(side===-1?3:side===1?8:5,hy-1.4,side?5:6,1);}}
  else if(hw==='bandana'){g.fillStyle=rgb(sh(hc,.2));g.fillRect(4.6,hy-2.2,6.8,1.5);g.fillRect(side===1?3.6:11,hy-1.6,1.4,2);}
  else if(hw==='headscarf'||hw==='hood'||hw==='furhood'){const c2=hw==='furhood'?[232,240,255]:hw==='hood'?C(L.cloak||L.out2):hc;g.fillStyle=rgb(c2);g.beginPath();if(up)g.arc(8,hy-.2,hr+.8,0,7);else{g.arc(8,hy-.3,hr+.8,Math.PI*.95,Math.PI*2.05);g.lineTo(8+hr+.8,hy+2.6);g.lineTo(8+hr-.4,hy+2.6);g.quadraticCurveTo(8,hy-3,8-hr+.4,hy+2.6);g.lineTo(8-hr-.8,hy+2.6);}g.fill();if(hw==='furhood'){g.fillStyle='#ffffff';for(let k=0;k<7;k++)g.fillRect(4+k*1.2,hy-hr-.4+Math.abs(k-3)*.3,.8,.8);}}
  else if(hw==='helmet'){gr=g.createLinearGradient(4,0,12,0);gr.addColorStop(0,'#e8ecf4');gr.addColorStop(1,'#4a5060');g.fillStyle=gr;g.beginPath();g.arc(8,hy-.4,hr+.6,Math.PI,0);g.lineTo(8+hr+.6,hy+.6);g.lineTo(8-hr-.6,hy+.6);g.fill();g.fillStyle=GOLD;g.fillRect(4.2,hy+.1,7.6,.5);g.fillStyle='#b01828';g.fillRect(7.4,hy-hr-2,1.2,2);}
  else if(hw==='circlet'||hw==='flowers'||hw==='wave'){if(!up||hw==='flowers'){g.strokeStyle=hw==='wave'?'#7af0ff':GOLD2;g.lineWidth=.55;g.beginPath();g.moveTo(4.8,hy-1.5);g.quadraticCurveTo(8,hy-2.6,11.2,hy-1.5);g.stroke();
    if(hw==='flowers'){for(const [x,c] of [[5.4,'#ff7a9a'],[8,'#ffe06a'],[10.6,'#ffffff']]){g.fillStyle=c;g.beginPath();g.arc(x,hy-2,.8,0,7);g.fill();}}
    else{g.save();g.shadowColor=hw==='wave'?'#7af0ff':'#ffd070';g.shadowBlur=2*CSC;g.fillStyle=hw==='wave'?'#bff8ff':GOLD2;g.beginPath();g.moveTo(8,hy-4.2);g.lineTo(8.9,hy-2.4);g.lineTo(8,hy-1.6);g.lineTo(7.1,hy-2.4);g.fill();g.restore();}}}
  else if(hw==='tophat'){g.fillStyle='#120814';g.beginPath();g.ellipse(8,hy-2,5.2,1.2,0,0,7);g.fill();g.fillRect(5.6,hy-7,4.8,5);g.fillStyle='#8a2aa0';g.fillRect(5.6,hy-3.4,4.8,.8);g.strokeStyle=GOLD;g.lineWidth=.3;g.strokeRect(5.6,hy-7,4.8,5);}
  else if(hw==='goggles'){g.fillStyle='#5a3a1a';g.fillRect(4.4,hy-2.2,7.2,1);if(!up){g.fillStyle='#9ae0ff';g.beginPath();g.arc(6.6,hy-1.8,1,0,7);g.arc(9.4,hy-1.8,1,0,7);g.fill();g.strokeStyle=GOLD;g.lineWidth=.35;g.stroke();}}
  else if(hw==='nursecap'){g.fillStyle='#ffffff';g.fillRect(5.6,hy-hr-1.4,4.8,2);g.fillStyle='#e02040';g.fillRect(7.6,hy-hr-1.2,.8,1.6);g.fillRect(7.2,hy-hr-.8,1.6,.8);}
  if(L.hero){g.save();g.shadowColor='#ffb040';g.shadowBlur=2*CSC;g.fillStyle=GOLD2;g.beginPath();g.moveTo(8,hy-4.4);g.lineTo(9,hy-3.4);g.lineTo(8,hy-2.4);g.lineTo(7,hy-3.4);g.fill();g.restore();}}
 g.restore();}
WS.npc=function(ctx,px,py,L,dir,fr){const sc=Math.round((ctx.getTransform().a||2)*100)/100;CSC=sc;const key=L.key+'|'+dir+'|'+fr+'|'+sc;let c=NC.get(key);
 if(c){NC.delete(key);NC.set(key,c);}else{c=document.createElement('canvas');c.width=Math.ceil(24*sc);c.height=Math.ceil(32*sc);const g=c.getContext('2d');g.setTransform(sc,0,0,sc,4*sc,14*sc);paintNPC(g,L,dir,fr);NC.set(key,c);while(NC.size>720)NC.delete(NC.keys().next().value);}
 const dx=Math.round((px-4)*sc)/sc,dy=Math.round((py-14)*sc)/sc;ctx.drawImage(c,dx,dy,24,32);};
WS.npcCacheSize=()=>NC.size;
// ================= LIGHTS / BLOOM / VIGNETTE =================
let glowC={};
function gsprite(col){let c=glowC[col];if(c)return c;c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const r=g.createRadialGradient(32,32,0,32,32,32);const k=hex(col);r.addColorStop(0,rgb(k,1));r.addColorStop(.22,rgb(k,.5));r.addColorStop(.55,rgb(k,.14));r.addColorStop(1,rgb(k,0));g.fillStyle=r;g.fillRect(0,0,64,64);glowC[col]=c;return c;}
function glow(x,y,r,col,a){if(a<=0.01)return;X.globalAlpha=Math.min(1,a);X.drawImage(gsprite(col),x-r,y-r,r*2,r*2);}
WS.dark=function(){if(!S)return 0;const h=(S.time/60)%24;if(h>=21.5||h<4.5)return 1;if(h>=19.5)return (h-19.5)/2;if(h<5.5)return 1-(h-4.5);return 0;};
const LIGHTS={};
function lightsFor(m){if(LIGHTS[m.id])return LIGHTS[m.id];const L=[];
 if(m.outdoor){prep();for(const b of blds()){const wy=(b.y+b.h-1)*16;if(b.type==='castle'){L.push({x:b.dx*16+8,y:wy+6,r:30,c:'#ff4020',a:.8,k:'flick'});continue;}if(b.type==='citadel'||b.type==='skysea'){L.push({x:b.dx*16+8,y:b.y*16+6,r:26,c:b.type==='citadel'?'#ffe8a0':'#60f0ff',a:.6,k:'pulse'});continue;}
   for(let tx=b.x;tx<b.x+b.w;tx++){if(tx===b.dx)continue;if(Math.abs(tx-b.dx)===1||(b.w>=6&&(tx===b.x+1||tx===b.x+b.w-2)))L.push({x:tx*16+8,y:wy+7,r:14,c:'#ffb050',a:.55,k:'win'});}
   const top=b.y*16+2,ecy=top+((b.y+b.h-1)*16-top)*.45;if(b.type==='gym')L.push({x:b.x*16+b.w*8,y:ecy,r:16,c:typeCol(b.tn),a:.6,k:'pulse'});if(b.type==='temple')L.push({x:b.x*16+b.w*8,y:ecy+3,r:18,c:'#ffd0a0',a:.5,k:'pulse'});if(b.type==='league')L.push({x:b.x*16+b.w*8,y:ecy+4,r:22,c:'#ffd070',a:.5,k:'pulse'});
   if(b.type==='center'||b.type==='shop')L.push({x:b.x*16+b.w*8,y:ecy,r:12,c:b.type==='center'?'#ff5a6a':'#6ab0ff',a:.45,k:'pulse'});}
  for(const tn of TOWNS)for(const [lx,ly] of LAMPS)L.push({x:tn.x*16+lx*16+8,y:tn.y*16+ly*16+2,r:22,c:'#ffc060',a:.75,k:'lamp'});
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const v=m.t[y*m.w+x];if(v===T.BRIDGE&&y%3===0)for(const rx of [x*16-1.5,x*16+17.5]){L.push({x:rx,y:y*16-1.8,r:12,c:'#ffc060',a:.8,k:'lamp'});L.push({x:rx,y:y*16+9,r:8,c:'#ffb050',a:.35,k:'refl'});}
   if(v===T.SEAL)L.push({x:x*16+8,y:y*16+9,r:20,c:'#a070ff',a:.6,k:'pulse'});
   if(v===T.CAVE&&h2(x,y,77)<0.035)L.push({x:x*16+8,y:y*16+8,r:14,c:h2(x,y,78)<.5?'#40d0ff':'#a060ff',a:.55,k:'pulse'});
   if(v===T.FLOWER&&PAL[W.reg[y*m.w+x]].glowfl)L.push({x:x*16+8,y:y*16+8,r:8,c:PAL[W.reg[y*m.w+x]].fl[0],a:.35,k:'night'});}}
 else{for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const v=m.t[y*m.w+x];
   if(v===T.IWALL&&y===0&&x%3===1&&!(m.type==='temple'&&(x===3||x===7))&&x>0&&x<m.w-1)L.push({x:x*16+8,y:y*16+1.5,r:20,c:'#ffb860',a:.7,k:'candle'});
   if(v===T.TABLE&&m.type!=='temple'&&!(m.id==='b0_5'||m.type==='lab'))L.push({x:x*16+8,y:y*16+1.5,r:12,c:'#ffc070',a:.6,k:'candle'});
   if(v===T.PC)L.push({x:x*16+8,y:y*16+5,r:16,c:'#40e8ff',a:.7,k:'pulse'});if(v===T.ALTAR)L.push({x:x*16+8,y:y*16+3,r:26,c:'#ffd0a0',a:.6,k:'altar',ax:x*16,ay:y*16});
   if(v===T.SFLOOR&&(x+y)%3===0)L.push({x:x*16+8,y:y*16+8,r:16,c:'#40c0ff',a:.25,k:'pulse'});if(v===T.HFLOOR&&(x+y)%4===0)L.push({x:x*16+8,y:y*16+8,r:18,c:'#fff0b0',a:.22,k:'pulse'});}
  L.push({x:m.w*8,y:m.h*7,r:Math.max(m.w,m.h)*11,c:'#ffa060',a:.75,k:'pool'});
  if(m.type==='center'){const ex=Math.floor(m.w/2);L.push({x:(ex+2)*16+8,y:3*16+1.5,r:14,c:'#ff7a90',a:.6,k:'pulse'});}
  if(m.type==='castle')for(let y=2;y<m.h-2;y+=3)for(const x of [2,8])L.push({x:x*16+8,y:y*16-4,r:18,c:'#ff3a20',a:.6,k:'candle'});}
 LIGHTS[m.id]=L;return L;}
WS.lights=function(m,camx,camy,ents){const f=G.frame,d=m.outdoor?WS.dark():0.7,t=f/60;X.save();X.globalCompositeOperation='lighter';
 for(const l of lightsFor(m)){const sx=l.x-camx,sy=l.y-camy;if(sx<-40||sy<-40||sx>VW+40||sy>VH+40)continue;let a=l.a;
  if(l.k==='win')a*=.25+.75*d;else if(l.k==='lamp')a*=(.3+.7*d)*(.88+.12*Math.sin(f/5+l.x));else if(l.k==='refl')a*=(.3+.7*d)*(.6+.4*Math.sin(f/9+l.y));else if(l.k==='pulse')a*=.65+.35*Math.sin(t*2+l.x*.1);else if(l.k==='night')a*=d;else if(l.k==='candle'||l.k==='flick')a*=.85+.15*Math.sin(f/4+l.x*1.7)*Math.sin(f/7+l.y);
  if(l.k==='altar'){X.globalCompositeOperation='source-over';for(const [o,c1,c2] of [[3.5,'#ffffff','#fff0c0'],[8,'#a0c8ff','#4080ff'],[12.5,'#ffb080','#ff3010']]){const fl=Math.sin(f/5+o)*.6;X.fillStyle=c2;X.beginPath();X.moveTo(l.ax-camx+o,l.ay-camy+.2+fl);X.quadraticCurveTo(l.ax-camx+o+1.6,l.ay-camy+2.6,l.ax-camx+o,l.ay-camy+4);X.quadraticCurveTo(l.ax-camx+o-1.6,l.ay-camy+2.6,l.ax-camx+o,l.ay-camy+.2+fl);X.fill();X.fillStyle=c1;X.fillRect(l.ax-camx+o-.4,l.ay-camy+2.2,.8,1.4);}X.globalCompositeOperation='lighter';
   for(const [o,c] of [[3.5,'#fff0c0'],[8,'#5090ff'],[12.5,'#ff4020']])glow(l.ax-camx+o,l.ay-camy+2,14,c,.7);continue;}
  glow(sx,sy,l.r,l.c,a);if(l.k==='lamp'&&d>.3)glow(sx,sy,l.r*2.4,l.c,a*.25);}
 // water: moving light reflections + bioluminescent shimmer
 if(m.outdoor&&!(window.AMB&&AMB.reduced&&false)){const x0=Math.floor(camx/16),y0=Math.floor(camy/16);
  for(let y=y0;y<=y0+VH/16+1;y++)for(let x=x0;x<=x0+VW/16+1;x++){const v=tt(m,x,y);if(v!==T.WATER)continue;const r=h2(x,y,55);const sx=x*16-camx,sy=y*16-camy;
   const ph=Math.sin(t*1.3+r*20+x*.4-y*.25);if(ph>.55){const a=(ph-.55)*1.6;X.globalAlpha=a*.7;X.fillStyle='#c8fcff';const gx=sx+2+r*10+Math.sin(t+r*9)*2,gy=sy+3+((r*97)%1)*10;X.fillRect(gx,gy,3+r*3,.6);X.fillRect(gx+1.5,gy+2.2,2,.5);}
   if(r<0.18)glow(sx+8,sy+8,18,'#20c0c8',(.12+.18*d)*(.7+.3*Math.sin(t*1.7+r*30)));}}
 // legends + items aura
 if(ents)for(const e of ents){if(e.kind==='legend')glow(e.x*16-camx+8,e.y*16-camy+6,26,ART[e.ref.sp]?'#ff4030':'#ffe0a0',.55+.2*Math.sin(t*3));else if(e.kind==='item')glow(e.x*16-camx+8,e.y*16-camy+8,10,'#fff0a0',.5+.3*Math.sin(t*5));}
 X.restore();};
let VIG=null;
WS.post=function(m){if(!VIG){VIG=document.createElement('canvas');VIG.width=160;VIG.height=120;const g=VIG.getContext('2d');const r=g.createRadialGradient(80,62,30,80,60,104);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(.7,'rgba(6,2,16,.03)');r.addColorStop(1,'rgba(4,0,12,.24)');g.fillStyle=r;g.fillRect(0,0,160,120);}
 X.save();X.globalAlpha=m.outdoor?.9:1;X.drawImage(VIG,0,0,VW,VH);
 // cinematic grade: cool shadows, warm highlights
 X.globalCompositeOperation='soft-light';X.globalAlpha=.06;const gr=X.createLinearGradient(0,0,0,VH);gr.addColorStop(0,'#7a5aa0');gr.addColorStop(.5,'#c08850');gr.addColorStop(1,'#3a1a40');X.fillStyle=gr;X.fillRect(0,0,VW,VH);X.restore();};
WS.tint=function(m){if(!m.outdoor)return;const d=WS.dark(),h=(S.time/60)%24;
 if(h>=17&&h<19.5){const k=1-Math.abs(h-18.2)/1.3;X.fillStyle='rgba(150,50,20,'+(0.18*Math.max(0,k))+')';X.fillRect(0,0,VW,VH);}
 if(h>=4.5&&h<7){const k=1-Math.abs(h-5.8)/1.2;X.fillStyle='rgba(120,60,140,'+(0.15*Math.max(0,k))+')';X.fillRect(0,0,VW,VH);}
 if(d>0){X.fillStyle='rgba(40,60,120,'+(0.30*d)+')';X.fillRect(0,0,VW,VH);X.save();X.globalCompositeOperation='soft-light';X.fillStyle='rgba(150,180,255,'+(0.18*d)+')';X.fillRect(0,0,VW,VH);X.restore();}};
WS.mini=function(x,y,v){prep();const i=y*MAPS.world.w+x,r=W.reg[i],P=PAL[r];
 if(v===T.WATER){const d=W.dep[i];return d<=2?'#3ab8c0':d<=5?'#1f86b0':'#14508a';}if(v===T.SHRINE)return '#ffe080';if(v===T.RUIN)return '#a098b0';if(v===T.ICE)return '#d8f4ff';if(v===T.BRIDGE)return '#d9a94a';if(v===T.PATH||v===T.DOOR)return W.inTown[i]?'#8a7a68':rgb(sh(P.path,.25));if(v===T.SAND)return '#b8985c';if(v===T.CAVE||v===T.ROCK)return '#4a3a30';if(v===T.SNOW)return '#b8c8e0';if(v===T.SNOWTALL)return '#8898b8';
 if(v===T.TREE)return rgb(hex(P.tree[1]));if(v===T.TALL)return rgb(sh(W.gc[i],-.25));if(v===T.FLOWER||v===T.GRASS)return rgb(sh(W.gc[i],.12));if(v===T.CWALL)return '#3a0a10';if(v===T.SEAL)return '#a070ff';if(v===T.HWALL)return '#e8c060';return '#c9a050';};
})();
