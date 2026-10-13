// ===== Pixel-art chibi overworld sprites (brief 50). Original procedural 16x24 sprites, 1px outline,
// 2-3 flat shades, 4 directions, 4-frame walk with stepping feet, idle weight shift, contact shadow (brief 46).
'use strict';
(function(){
const W=16,H=24,OUT='#1c1220';
const hx=c=>{const n=parseInt(c.slice(1),16);return [n>>16,(n>>8)&255,n&255];};
const mx=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const sd=(c,k)=>{const a=hx(c);const m=k>=0?mx(a,[255,248,232],k):mx(a,[16,8,24],-k);return '#'+m.map(v=>Math.max(0,Math.min(255,v|0)).toString(16).padStart(2,'0')).join('');};
const pal=c=>({b:c,l:sd(c,.3),d:sd(c,-.35),dd:sd(c,-.6)});
const GOLD='#f0c040',GOLDL='#fff0a0',BOOT='#4a2c1c',BOOTD='#2a1810';
function frameInfo(fr){if(typeof fr==='number')fr=fr===1?'w1':fr===3?'w3':fr===2?'i1':'i0';const w=fr[0]==='w'?(+fr.slice(1))%4:-1;return {step:w===1?1:w===3?-1:0,walk:w>=0,i1:fr==='i1'};}
function build(L,dir,fr){const G=new Array(W*H).fill(null);const F=frameInfo(fr);
 const P=(x,y,c)=>{x|=0;y|=0;if(x>=0&&y>=0&&x<W&&y<H&&c)G[y*W+x]=c;};const R=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(x+i,y+j,c);};
 const side=dir==='left'||dir==='right',up=dir==='up',down=dir==='down';
 const kid=!!L.kid,wide=(L.bw||1)>1.05;
 const skin=pal(L.skin),hair=pal(L.hair),o1=pal(L.out),o2=pal(L.out2),cl=L.cloak?pal(L.cloak):null;
 const bob=F.walk&&F.step!==0?-1:0,br=F.i1?1:0;
 const hy=(kid?4:1)+bob+br,ty=(kid?15:12)+bob,tb=kid?19:18;// head top, torso top, torso bottom
 const tx0=wide?3:4,tx1=wide?12:11;
 const acc=a=>(L.acc||[]).includes(a);
 // --- staff/pole behind when facing up
 const pole=()=>{const x=up?1:14;if(acc('staff')||acc('spear')||acc('trident')){R(x,hy+3,1,22-hy-3,'#6a4424');P(x,hy+4,'#9a6a3a');
   if(acc('spear')){P(x,hy,'#e8ecf4');P(x,hy+1,'#c8ccd8');P(x,hy+2,'#a0a4b0');}else if(acc('trident')){P(x-1,hy+1,'#8af0ff');P(x+1,hy+1,'#8af0ff');P(x,hy,'#bff8ff');P(x,hy+1,'#8af0ff');P(x,hy+2,'#5ac0e0');}
   else{const oc=L.monk?'#ff4030':L.glow||'#ffe880';P(x,hy+1,oc);P(x,hy+2,sd(oc,-.3));P(x-1,hy+2,sd(oc,.4));}}
  if(acc('hammer')){R(x,ty,1,6,'#6a4424');R(x-1,ty-2,3,2,'#7a7a88');}if(acc('sword')){R(x,ty-2,1,7,'#e8f0ff');P(x,ty+5,GOLD);P(x-1,ty+5,GOLD);}};
 if(up)pole();
 // --- cloak behind (down/side)
 if(cl&&!up){if(side){R(3,ty,3,(kid?21:20)-ty,cl.d);}else{R(tx0-1,ty+1,1,(kid?20:19)-ty,cl.d);R(tx1+1,ty+1,1,(kid?20:19)-ty,cl.dd);}}
 // --- legs & feet
 const legC=L.robe?null:o2.d,legL=L.robe?null:o2.b;
 if(side){const x=6;const st=F.walk?F.step:0;
  if(st===0){if(legC){R(x,tb+1,4,22-tb-1,legC);P(x,tb+1,legL);}R(x,22,5,1,BOOT);P(x+4,22,BOOTD);}
  else{// back leg + front leg spread
   if(legC){P(x+1,tb+1,legC);P(x,tb+2,o2.dd);P(x-1,tb+3,o2.dd);P(x+3,tb+1,legC);P(x+4,tb+2,legC);P(x+5,tb+3,legL);if(!kid){P(x,tb+3,o2.dd);P(x+4,tb+3,legC);}}
   R(x-2,22,3,1,BOOTD);R(x+4,22,3,1,BOOT);P(x+6,21,BOOT);}}
 else{const lx=5,rx=9;// front/back view
  const liftL=F.walk&&F.step===-1?1:0,liftR=F.walk&&F.step===1?1:0;
  if(legC){R(lx,tb+1,2,21-tb-liftL,legC);R(rx,tb+1,2,21-tb-liftR,legC);P(lx,tb+1,legL);P(rx,tb+1,legL);}
  R(lx-1,22-liftL,3,1,BOOT);R(rx,22-liftR,3,1,BOOT);P(lx-1,22-liftL,BOOTD);P(rx+2,22-liftR,BOOTD);
  if(L.robe){/* boots peek below hem */}}
 // --- torso / robe
 const bot=L.robe?(kid?20:21):tb;
 for(let y=ty;y<=bot;y++){const ex=L.robe?Math.max(0,Math.floor((y-tb)/1.5)):0;const a=Math.max(1,tx0-ex),b=Math.min(14,tx1+ex);
  for(let x=a;x<=b;x++){let c=o1.b;if(x===a)c=o1.l;if(x>=b-1)c=o1.d;if(y===bot&&L.robe)c=o1.dd;P(x,y,c);}}
 if(L.robe&&F.walk&&F.step!==0&&!side){P(F.step>0?tx0:tx1,bot,null);}
 // patterns
 const mid=(tx0+tx1)>>1;
 if(L.pat==='stripes'){for(let y=ty+1;y<=bot;y+=2)R(tx0+1,y,tx1-tx0-1,1,o2.b);}
 else if(L.pat==='checks'){for(let y=ty;y<=bot;y++)for(let x=tx0+1;x<tx1;x++)if((x+y)&1)P(x,y,o2.l);}
 else if(L.pat==='sash'&&!up){for(let k=0;k<=bot-ty;k++)P(tx0+1+k,ty+k,L.monk?'#a01820':o2.b);}
 else if(L.pat==='runes'){P(tx0+1,ty+3,'#ff3020');P(tx1-1,ty+3,'#ff3020');P(tx0+1,ty+6,'#c02018');P(tx1-1,ty+6,'#c02018');if(!up){P(mid,ty+2,'#ff3020');P(mid+1,ty+3,'#ff3020');P(mid,ty+4,'#ff3020');}}
 if(L.pat==='trim'||L.robe){if(!up&&!side)R(mid,ty+1,1,bot-ty,GOLD);}
 if(!L.robe)R(tx0,tb-1,tx1-tx0+1,1,L.pat==='trim'?GOLD:o2.dd);// belt
 // chest details
 if(!up){if(acc('apron'))R(tx0+1,ty+2,tx1-tx0-1,bot-ty-1,L.out2==='#e07a90'?'#ffffff':'#e8d8b0');
  if(acc('armor')){R(tx0,ty,tx1-tx0+1,3,'#c8ccd8');R(tx0,ty,tx1-tx0+1,1,'#f0f4fa');P(tx1,ty+1,'#7a8090');P(tx1,ty+2,'#7a8090');}
  if(L.sym==='three'&&!side){P(mid-1,ty+2,'#ffffff');P(mid,ty+2,'#5a8aff');P(mid+1,ty+2,'#ff5030');}
  if(L.sym==='rune'){P(mid,ty+2,'#ff4020');P(mid-1,ty+3,'#ff4020');P(mid+1,ty+3,'#ff4020');P(mid,ty+4,'#ff4020');}
  if(acc('beads'))for(let k=0;k<4;k++)P(tx0+1+k*2,ty+1+(k===1||k===2?1:0),'#d8b070');
  if(L.typec&&!side){P(mid,ty+1,L.typec);P(mid+1,ty+1,sd(L.typec,.4));}
  if(acc('scarf')){R(tx0,ty,tx1-tx0+1,1,L.out2==='#101830'?'#e03030':o2.l);if(down)R(tx0+1,ty+1,1,3,L.out2==='#101830'?'#c02020':o2.b);}}
 if(acc('satchel')){if(!up)for(let k=0;k<5;k++)P(tx0+1+k,ty+k,'#7a4a22');R(side?4:tx1-1,tb-2,3,3,'#8a5428');P(side?4:tx1-1,tb-2,GOLD);}
 // arms
 const armY=ty+1,armH=kid?3:4;
 if(side){const sw=F.walk?F.step:0;const ax=7+sw;R(7,armY,2,armH-1,o1.d);P(ax,armY+armH-1,o1.d);P(ax+(sw>0?1:sw<0?-1:0),armY+armH,skin.b);if(!sw)P(7,armY+armH,skin.b);}
 else{const sL=F.walk?(F.step>0?-1:F.step<0?1:0):0;for(const [x,s] of [[tx0-1,sL],[tx1+1,-sL]]){R(x,armY,1,armH+s,o1.d);P(x,armY,o1.b);P(x,armY+armH+s,skin.b);}}
 if(acc('basket')&&!up){R(tx1,tb-2,3,2,'#a07838');P(tx1,tb-3,'#ff7a9a');P(tx1+1,tb-3,'#ffe06a');}
 if(acc('lantern')){const x=up?2:13;P(x,armY+armH,'#3a3020');R(x,armY+armH+1,1,2,'#ffe08a');P(x,armY+armH+2,'#ffb040');}
 if(acc('book')&&!up)R(side?9:tx1,ty+2,2,3,'#7a1828');
 if(!up)pole();
 // cloak over back facing up
 if(cl&&up){R(tx0-1,ty,tx1-tx0+3,(kid?20:20)-ty+1,cl.b);R(tx1+1,ty,1,20-ty+1,cl.d);R(tx0-1,ty,1,20-ty+1,cl.l);R(tx0-1,20,tx1-tx0+3,1,GOLD);}
 // --- head (chibi: ~half the body)
 const dh=L.head==='deephood',hood=dh||L.head==='hood'||L.head==='headscarf'||L.head==='furhood';
 const hx0=2,hx1=13;const HH=11;
 for(let y=0;y<HH;y++)for(let x=hx0;x<=hx1;x++){const corner=(y===0||y===HH-1)&&(x===hx0||x===hx1);if(corner)continue;if((y===0||y===HH-1)&&(x===hx0+1||x===hx1-1))continue;P(x,hy+y,x>=hx1-1?skin.d:x===hx0?skin.d:skin.b);}
 P(hx0+2,hy+2,skin.l);
 // hair
 const hs=hood||L.head==='helmet'?'hidden':L.hs;const hb=hair.b,hd=hair.d,hl=hair.l;
 const fillHairTop=(rows)=>{for(let y=0;y<rows;y++)for(let x=hx0;x<=hx1;x++){if(G[(hy+y)*W+x])P(x,hy+y,x>=hx1-1?hd:hb);}R(hx0+3,hy+1,3,1,hl);};
 if(hs!=='hidden'){
  if(up){for(let y=0;y<HH;y++)for(let x=hx0;x<=hx1;x++)if(G[(hy+y)*W+x])P(x,hy+y,x>=hx1-1||y>=HH-2?hd:hb);R(hx0+3,hy+1,4,1,hl);
   if(hs==='bald'){for(let y=0;y<HH-4;y++)for(let x=hx0+1;x<hx1;x++)P(x,hy+y,skin.b);P(hx0+3,hy+2,skin.l);}
   if(hs==='long'||hs==='braid')R(hx0+1,hy+HH,hx1-hx0-1,3,hd);if(hs==='bun'){R(6,hy-2,4,3,hb);P(7,hy-2,hl);}}
  else if(side){// facing right: hair covers back (left) part
   if(hs!=='bald'){fillHairTop(4);for(let y=4;y<9;y++)R(hx0,hy+y,y<7?4:3,1,y<6?hb:hd);P(hx1,hy+4,hb);}else{R(hx0,hy+4,3,3,hb);}
   if(hs==='long'||hs==='braid')R(hx0,hy+9,4,4,hd);if(hs==='bob')R(hx0,hy+9,4,1,hd);if(hs==='bun'){R(hx0,hy-1,4,3,hb);P(hx0+1,hy-1,hl);}
   if(hs==='spiky'){P(4,hy-1,hb);P(7,hy-1,hb);P(10,hy-1,hb);P(1,hy+2,hb);P(1,hy+4,hd);}}
  else{// down
   if(hs!=='bald'){fillHairTop(4);R(hx0,hy+4,2,3,hb);R(hx1-1,hy+4,2,3,hd);P(5,hy+4,hb);P(8,hy+4,hb);P(hx1-2,hy+4,hd);}
   else{R(hx0,hy+4,2,3,hb);R(hx1-1,hy+4,2,3,hd);}
   if(hs==='long'||hs==='braid'){R(hx0,hy+7,2,6,hb);R(hx1-1,hy+7,2,6,hd);}
   if(hs==='bob'){R(hx0,hy+7,2,2,hb);R(hx1-1,hy+7,2,2,hd);}
   if(hs==='bun'){R(6,hy-2,4,3,hb);P(7,hy-2,hl);}
   if(hs==='spiky'){P(3,hy-1,hb);P(6,hy-1,hb);P(9,hy-1,hb);P(12,hy-1,hd);P(4,hy-2,hb);P(10,hy-2,hd);}
   if(hs==='braid')R(hx1,hy+13,1,3,hd);}}
 // hood shapes
 if(hood){const hc=L.head==='furhood'?pal('#e8f0ff'):pal(L.head==='headscarf'?L.out2:(L.cloak||L.out));
  for(let y=-1;y<HH+1;y++)for(let x=hx0-1;x<=hx1+1;x++){const inFace=!up&&(side?(x>=7&&x<=hx1&&y>=4&&y<=9):(x>=4&&x<=hx1-2&&y>=4&&y<=9));const edge=(y===-1||y===HH)&&(x<=hx0||x>=hx1);if(edge||inFace)continue;P(x,hy+y,x>=hx1?hc.d:x<=hx0?hc.l:hc.b);}
  R(hx0+2,hy,3,1,hc.l);if(L.head==='furhood'&&!up)for(let x=3;x<=12;x+=2)P(x,hy+3,'#ffffff');
  if(dh&&!up){for(let y=4;y<=9;y++)for(let x=(side?7:4);x<=(side?hx1:hx1-2);x++)P(x,hy+y,'#0a0610');}}
 // face
 if(!up){const ey=hy+6;if(dh){const ec=L.eyes||'#ff3020';if(side)P(11,ey,ec);else{P(5,ey,ec);P(10,ey,ec);}if(L.beard){R(side?8:6,hy+9,side?3:4,2,hair.b);}}
  else{const ec=L.eyes||'#1a0c12';if(side){R(10,ey,1,2,ec);P(10,ey,sd('#ffffff',0));P(12,ey+2,skin.d);}
   else{R(4,ey,2,2,ec);R(10,ey,2,2,ec);P(4,ey,'#ffffff');P(10,ey,'#ffffff');P(3,ey+2,'#f08a8a');P(12,ey+2,'#f08a8a');P(7,ey+3,skin.d);P(8,ey+3,skin.d);}
   if(acc('glasses')){if(side){P(9,ey-1,GOLD);P(11,ey-1,GOLD);P(9,ey+2,GOLD);}else{R(3,ey-1,4,1,GOLD);R(9,ey-1,4,1,GOLD);P(7,ey,GOLD);P(8,ey,GOLD);}}
   if(L.beard){if(side)R(8,hy+8,5,3,hair.b);else{R(4,hy+8,8,2,hair.b);R(5,hy+10,6,1,hair.d);R(6,hy+11,4,1,hair.d);}}}}
 // headwear
 const hw=L.head,hc=pal(L.out2);
 if(hw==='hat'){R(1,hy+2,14,1,hc.d);R(3,hy-2,10,4,hc.b);R(3,hy-2,2,4,hc.l);R(3,hy+1,10,1,GOLD);}
 else if(hw==='cap'){R(hx0,hy-1,12,3,hc.b);R(hx0,hy-1,3,1,hc.l);if(down)R(3,hy+2,10,1,hc.dd);else if(side)R(10,hy+2,5,1,hc.dd);}
 else if(hw==='bandana'){R(hx0,hy+2,12,2,hc.l);if(!up){P(side?3:13,hy+4,hc.b);P(side?2:14,hy+5,hc.b);}else{P(7,hy+4,hc.b);P(8,hy+5,hc.b);}}
 else if(hw==='helmet'){R(hx0-1,hy-1,14,5,'#b8bcc8');R(hx0-1,hy-1,14,1,'#e8ecf4');R(hx1,hy,1,4,'#6a7080');R(hx0-1,hy+3,14,1,GOLD);R(7,hy-3,2,2,'#c02030');}
 else if(hw==='circlet'||hw==='wave'){if(!up||true){const c=hw==='wave'?'#7af0ff':GOLD;R(hx0,hy+3,12,1,c);if(!up){P(side?11:7,hy+2,hw==='wave'?'#ffffff':GOLDL);P(side?11:8,hy+2,hw==='wave'?'#bff8ff':GOLDL);}}}
 else if(hw==='flowers'){R(hx0,hy+2,12,1,'#4a9a3a');for(const [x,c] of [[3,'#ff7a9a'],[6,'#ffe06a'],[9,'#ffffff'],[12,'#ff7a9a']])P(x,hy+1,c);}
 else if(hw==='tophat'){R(1,hy+1,14,1,'#140a18');R(4,hy-5,8,6,'#201028');R(4,hy-5,2,6,'#382044');R(4,hy-1,8,1,'#8a2aa0');}
 else if(hw==='goggles'){R(hx0,hy+3,12,1,'#6a4422');if(!up){if(side){R(10,hy+2,2,2,'#9ae0ff');}else{R(4,hy+2,2,2,'#9ae0ff');R(10,hy+2,2,2,'#9ae0ff');}}}
 else if(hw==='nursecap'){R(5,hy-2,6,3,'#ffffff');P(7,hy-1,'#e02040');P(8,hy-1,'#e02040');P(7,hy-2,'#e02040');P(7,hy,'#e02040');}
 if(L.hero&&!up){P(side?11:7,hy+2,'#ff9030');}
 // --- outline pass
 const out=G.slice();for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(G[y*W+x])continue;if((x>0&&G[y*W+x-1])||(x<W-1&&G[y*W+x+1])||(y>0&&G[(y-1)*W+x])||(y<H-1&&G[(y+1)*W+x]))out[y*W+x]=OUT;}
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 for(let i=0;i<out.length;i++)if(out[i]){g.fillStyle=out[i];g.fillRect(i%W,(i/W)|0,1,1);}
 if(dir==='left'){const f=document.createElement('canvas');f.width=W;f.height=H;const fg=f.getContext('2d');fg.translate(W,0);fg.scale(-1,1);fg.drawImage(c,0,0);return f;}
 return c;}
const PC=new Map();
function sprite(L,dir,fr){if(typeof fr==='number')fr=fr===1?'w1':fr===3?'w3':fr===2?'i1':'i0';if(fr[0]==='w')fr='w'+((+fr.slice(1))%4);const k=L.key+'|'+dir+'|'+fr;let c=PC.get(k);if(c){PC.delete(k);PC.set(k,c);return c;}c=build(L,dir,fr);PC.set(k,c);while(PC.size>1200)PC.delete(PC.keys().next().value);return c;}
const WS=window.WS;WS.npcSoft=WS.npc;
WS.npc=function(ctx,px,py,L,dir,fr){const sc=(ctx.getTransform().a||1);const c=sprite(L,dir,fr);const F=frameInfo(typeof fr==='string'||typeof fr==='number'?fr:'i0');
 // soft contact shadow anchored to the ground tile
 ctx.save();ctx.fillStyle='rgba(16,6,28,.32)';ctx.beginPath();ctx.ellipse(px+8,py+15,F.walk&&F.step?5.6:5,1.7,0,0,7);ctx.fill();ctx.fillStyle='rgba(16,6,28,.18)';ctx.beginPath();ctx.ellipse(px+8,py+15,7,2.3,0,0,7);ctx.fill();
 ctx.imageSmoothingEnabled=false;const dx=Math.round(px*sc)/sc,dy=Math.round((py-8)*sc)/sc;ctx.drawImage(c,dx,dy,W,H);ctx.restore();};
WS.npcSprite=sprite;WS.npcCacheSize=()=>PC.size;
})();
