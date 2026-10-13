// ===== World generation, buildings, NPCs, quests =====
'use strict';
const T={CWALL:29,CFLOOR:30,ROOF_T:31,ALTAR:32,HWALL:33,HFLOOR:34,SFLOOR:35,MURAL:36,SEAL:37,GRASS:0,TALL:1,TREE:2,PATH:3,WATER:4,SAND:5,SNOW:6,CAVE:7,ROCK:8,BRIDGE:9,WALL:10,ROOF_H:11,ROOF_C:12,ROOF_S:13,ROOF_G:14,DOOR:15,FLOWER:16,FLOOR:18,IWALL:19,COUNTER:20,BED:21,TABLE:22,PC:23,MAT:24,SNOWTALL:25,ROOF_L:26,PILLAR:27,ICE:28};
const SOLID=new Set([T.TREE,T.WATER,T.ROCK,T.WALL,T.ROOF_H,T.ROOF_C,T.ROOF_S,T.ROOF_G,T.ROOF_L,T.IWALL,T.COUNTER,T.BED,T.TABLE,T.PC,T.PILLAR,T.CWALL,T.ROOF_T,T.ALTAR,T.HWALL,T.MURAL,T.SEAL]);
T.SHRINE=38;T.RUIN=39;SOLID.add(T.SHRINE);SOLID.add(T.RUIN);
const WW=272,WH=208; // Elderreach, the First Shore (game 1 island was 256x200)
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function hsh(x,y,s){let n=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul((s|0)+1,2246822519))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return ((n^(n>>>16))>>>0)/4294967296;}
function vn(x,y,sc,s){const fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy;const a=hsh(ix,iy,s),b=hsh(ix+1,iy,s),c=hsh(ix,iy+1,s),d=hsh(ix+1,iy+1,s);const u=tx*tx*(3-2*tx),v=ty*ty*(3-2*ty);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const MAPS={};const DOORS={};const ZONEMAP=new Array(WW*WH).fill(null);const REGION=new Array(WW*WH).fill('coast');const OCEAN=new Uint8Array(WW*WH);
// ---- fixed layout (all world coordinates live here)
// ---- fixed layout: Elderreach, the First Shore (all world coordinates live here)
const LAY={plaza:{x0:60,y0:24,x1:86,y1:42},league:{x:67,y:27,w:11,h:5},castle:{x:100,y:12,w:11,h:9},citadel:{x:230,y:30,w:4,h:3},skysea:{x:129,y:95,w:3,h:2},
 lake:{cx:130,cy:100,rx:24,ry:15},cave:{x0:88,y0:44,x1:136,y1:74},island:{cx:136,cy:104,rx:130,ry:98}};
LAY.leagueDoor=[72,31];LAY.castleDoor=[105,20];LAY.citadelDoor=[231,32];LAY.skyseaDoor=[130,96];LAY.start=[40,168];
const RSEEDS=[['leaf',44,158],['leaf',66,150],['leaf',30,132],['leaf',76,120],['leaf',56,136],['leaf',126,16],['dusk',40,80],['dusk',22,96],['dusk',60,92],['dusk',58,62],['dusk',20,60],
 ['ember',112,170],['ember',120,145],['ember',90,186],['ember',134,180],['coast',196,178],['coast',160,182],['coast',130,100],['coast',160,128],['coast',156,156],['gale',226,96],['gale',226,125],['gale',242,72],['gale',206,74],['gale',240,145],
 ['snow',176,30],['snow',226,26],['snow',200,46],['snow',148,22],['cave',112,58],['cave',98,48],['cave',130,64],['summit',72,35],['summit',58,50],['summit',80,48],['crimson',105,16]];
function regionAt(x,y){if(x<0||y<0||x>=WW||y>=WH)return 'coast';return REGION[y*WW+x];}
const REGZONE={leaf:'forest',dusk:'duskwild',ember:'slopes',coast:'shore',gale:'bluffs',snow:'heights',cave:'cave',summit:'r6',crimson:'r6'};
const SHRINES=[];const LANDMARKS=[];const HIDDEN=[];const EXTRA_BLDS=[];
function buildWorld(){
 const m={id:'world',w:WW,h:WH,t:new Array(WW*WH).fill(T.WATER),outdoor:true};
 const I=(x,y)=>y*WW+x;const inb=(x,y)=>x>=0&&y>=0&&x<WW&&y<WH;
 const set=(x,y,v)=>{if(inb(x,y))m.t[I(x,y)]=v;};const get=(x,y)=>inb(x,y)?m.t[I(x,y)]:T.WATER;
 const R=rng(4321);const RES=new Uint8Array(WW*WH);const res=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(inb(x,y))RES[I(x,y)]=1;};
 const IS=LAY.island;const LAND=new Uint8Array(WW*WH);
 for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){const dx=(x-IS.cx)/IS.rx,dy=(y-IS.cy)/IS.ry,d=Math.cbrt(Math.abs(dx)**3+Math.abs(dy)**3),th=Math.atan2(dy,dx);
  const r=0.94+0.05*Math.sin(4*th+0.7)+0.03*Math.sin(7*th+2.1)+0.02*Math.sin(13*th+1)+(vn(x,y,9,17)-.5)*0.12;if(d<r)LAND[I(x,y)]=1;}
 // outer isles of the archipelago
 for(const [cx,cy,rx,ry] of [[252,182,10,8],[14,186,9,7],[256,30,8,7],[20,20,8,6]])for(let y=cy-ry-2;y<=cy+ry+2;y++)for(let x=cx-rx-2;x<=cx+rx+2;x++)if(inb(x,y)&&Math.hypot((x-cx)/rx,(y-cy)/ry)+(vn(x,y,5,19)-.5)*.2<1)LAND[I(x,y)]=1;
 const edge=th=>{let x=IS.cx,y=IS.cy;for(let k=0;k<220;k++){const xx=Math.round(IS.cx+Math.cos(th)*k),yy=Math.round(IS.cy+Math.sin(th)*k*IS.ry/IS.rx);if(!inb(xx,yy)||!LAND[I(xx,yy)])break;x=xx;y=yy;}return [x,y];};
 const COVES=[[2.3,6,'Moonbite Cove'],[3.0,5,'Wreckers\' Bay'],[4.3,5,'Bellwater Cove'],[0.6,5,'Galewhite Inlet'],[5.3,4,'Hush Fjord']];
 const coveC=[];for(const [th,r,nm] of COVES){const [ex,ey]=edge(th);const cx=Math.round(ex-Math.cos(th)*r*.5),cy=Math.round(ey-Math.sin(th)*r*.5);coveC.push([cx,cy,r,nm]);for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if(inb(x,y)&&Math.hypot(x-cx,y-cy)<=r)LAND[I(x,y)]=0;}
 const FORCE=[];TOWNS.forEach(t=>FORCE.push([t.x-6,t.y-6,t.x+TW+6,t.y+TH+6]));FORCE.push([LAY.plaza.x0-4,LAY.plaza.y0-6,LAY.plaza.x1+4,LAY.plaza.y1+4],[94,6,118,30],[222,22,242,40],[12,110,36,126],[116,8,138,24],[104,136,120,148],[222,132,246,148],[34,160,48,172]);
 for(const [x0,y0,x1,y1] of FORCE)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(inb(x,y))LAND[I(x,y)]=1;
 {const q=[0];OCEAN[0]=1;for(let qi=0;qi<q.length;qi++){const i=q[qi],x=i%WW,y=(i/WW)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+a,yy=y+b;if(!inb(xx,yy))continue;const j=I(xx,yy);if(OCEAN[j]||LAND[j])continue;OCEAN[j]=1;q.push(j);}}
  for(let i=0;i<WW*WH;i++)if(!OCEAN[i])LAND[i]=1;}
 for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){let best=1e9,b='coast';const jx=(vn(x,y,11,3)-.5)*14,jy=(vn(x,y,11,4)-.5)*14;for(const [r,sx,sy] of RSEEDS){const d=Math.hypot(x+jx-sx,y+jy-sy);if(d<best){best=d;b=r;}}
  if(x>=LAY.cave.x0&&x<=LAY.cave.x1&&y>=LAY.cave.y0&&y<=LAY.cave.y1&&vn(x,y,6,5)>0.25)b='cave';
  if(Math.hypot((x-LAY.lake.cx)/(LAY.lake.rx+5),(y-LAY.lake.cy)/(LAY.lake.ry+5))<1)b='coast';REGION[I(x,y)]=b;}
 for(const t of TOWNS){const rr=['leaf','ember','coast','gale','snow','dusk'][t.id];for(let y=t.y-3;y<t.y+TH+3;y++)for(let x=t.x-3;x<t.x+TW+3;x++)if(inb(x,y))REGION[I(x,y)]=rr;}
 for(let y=LAY.plaza.y0-3;y<=LAY.plaza.y1+2;y++)for(let x=LAY.plaza.x0-3;x<=LAY.plaza.x1+1;x++)REGION[I(x,y)]='summit';
 for(let y=4;y<=30;y++)for(let x=92;x<=118;x++)if(Math.hypot(x-105,y-16)<11)REGION[I(x,y)]='crimson';
 const base=(x,y)=>{const r=REGION[I(x,y)];return r==='snow'?T.SNOW:r==='cave'?T.CAVE:T.GRASS;};
 for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){const i=I(x,y);if(!LAND[i]){m.t[i]=T.WATER;continue;}let od=9;
  for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const xx=x+a,yy=y+b;if(!inb(xx,yy)||OCEAN[I(xx,yy)])od=Math.min(od,Math.max(Math.abs(a),Math.abs(b)));}
  const r=REGION[i];if(od<=2){if(r==='gale'&&od===1&&!TOWNS.some(t=>x>=t.x-2&&x<t.x+TW+2&&y>=t.y-2&&y<t.y+TH+2))m.t[i]=T.ROCK;else if(r==='snow')m.t[i]=od===1?T.ICE:T.SNOW;else if(r==='gale'||r==='crimson')m.t[i]=T.GRASS;else m.t[i]=T.SAND;}
  else m.t[i]=base(x,y);}
 // Stillwater lake with Hollowmere isle
 const L=LAY.lake;for(let y=L.cy-L.ry-3;y<=L.cy+L.ry+3;y++)for(let x=L.cx-L.rx-3;x<=L.cx+L.rx+3;x++){const d=Math.hypot((x-L.cx)/L.rx,(y-L.cy)/L.ry)+(vn(x,y,5,9)-.5)*.08;if(d<1)set(x,y,T.WATER);else if(d<1.13)set(x,y,T.SAND);}
 for(let y=91;y<=99;y++)for(let x=124;x<=136;x++)if(Math.hypot((x-130)/5.5,(y-95.5)/4)<1)set(x,y,T.SAND);
 const river=(pts,w)=>{for(let k=0;k<pts.length-1;k++){const [x1,y1]=pts[k],[x2,y2]=pts[k+1];const n=Math.ceil(Math.hypot(x2-x1,y2-y1)*2);for(let s=0;s<=n;s++){const t=s/n;const cx=x1+(x2-x1)*t+(vn(s+k*50,0,6,13)-.5)*3,cy=y1+(y2-y1)*t;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const xx=Math.round(cx+a),yy=Math.round(cy+b);if(!inb(xx,yy))continue;const d=Math.hypot(xx-cx,yy-cy);if(d<=w)set(xx,yy,T.WATER);else if(d<=w+1&&get(xx,yy)!==T.WATER&&REGION[I(xx,yy)]!=='snow'&&R()<0.5)set(xx,yy,T.SAND);}}}};
 river([[192,40],[174,60],[152,80],[140,90]],1.3);// Hushrun: peaks -> lake
 river([[142,113],[146,130],[150,150],[152,175],[154,208]],1.3);// Kiln river: lake -> south sea
 river([[80,108],[66,118],[50,128],[30,132],[0,134]],1.2);// Bramblewater -> west sea
 for(let y=LAY.cave.y0;y<=LAY.cave.y1;y++)for(let x=LAY.cave.x0;x<=LAY.cave.x1;x++)if(REGION[I(x,y)]==='cave'&&get(x,y)!==T.WATER){set(x,y,T.CAVE);ZONEMAP[I(x,y)]='cave';}
 function seg(x1,y1,x2,y2,zone){const dx=Math.sign(x2-x1),dy=Math.sign(y2-y1);let x=x1,y=y1;
  while(true){for(let o=-3;o<=3;o++){const xx=dy!==0?x+o:x,yy=dx!==0?y+o:y;if(!inb(xx,yy))continue;const i=I(xx,yy),cur=m.t[i];const center=o===0;
    if(cur===T.WATER||cur===T.BRIDGE){if(center&&!OCEAN[i])set(xx,yy,T.BRIDGE);continue;}
    const r=REGION[i];let v;if(r==='cave'){v=T.CAVE;}else if(center)v=T.PATH;else{const tall=R()<0.62&&Math.abs(o)>=1;v=r==='snow'?(tall?T.SNOWTALL:T.SNOW):(tall?T.TALL:(R()<0.06?T.FLOWER:T.GRASS));}
    if(!center&&(cur===T.SAND||cur===T.ICE||cur===T.ROCK))continue;set(xx,yy,v);ZONEMAP[i]=zone;if(Math.abs(o)<=1)RES[i]=1;}
   if(x===x2&&y===y2)break;x+=dx;y+=dy;}}
 function route(pts,zone){for(let i=0;i<pts.length-1;i++)seg(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],zone);
  for(const [x,y] of pts.slice(1,-1))for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const i=I(x+a,y+b);if(m.t[i]===T.WATER)continue;set(x+a,y+b,REGION[i]==='cave'?T.CAVE:T.PATH);RES[i]=1;}}
 const Tn=TOWNS;
 route([[Tn[0].x+TW,Tn[0].y+6],[80,156],[80,170],[Tn[1].x-1,Tn[1].y+6]],'r1');
 route([[Tn[1].x+TW,Tn[1].y+6],[165,170],[165,174],[Tn[2].x-1,Tn[2].y+6]],'r2');
 route([[Tn[2].x+10,Tn[2].y-1],[186,124],[Tn[3].x+10,124],[Tn[3].x+10,Tn[3].y+TH]],'r3');
 route([[Tn[3].x+10,Tn[3].y-1],[226,52],[Tn[4].x+10,52],[Tn[4].x+10,Tn[4].y+TH]],'r4');
 route([[226,52],[226,LAY.citadelDoor[1]+1],[LAY.citadelDoor[0],LAY.citadelDoor[1]+1]],'r4');
 route([[Tn[4].x-1,Tn[4].y+6],[140,28],[140,64],[100,64],[100,Tn[5].y+6],[Tn[5].x+TW,Tn[5].y+6]],'cave');
 route([[Tn[5].x+10,Tn[5].y-1],[40,50],[72,50],[72,LAY.plaza.y1+1]],'r6');
 function trail(pts){for(let k=0;k<pts.length-1;k++){let [x,y]=pts[k];const [x2,y2]=pts[k+1];while(true){const i=I(x,y),c=m.t[i];if(c===T.WATER){if(!OCEAN[i])set(x,y,T.BRIDGE);}else if(c!==T.DOOR&&!SOLID.has(c)||c===T.TREE||c===T.ROCK){set(x,y,REGION[i]==='cave'?T.CAVE:T.PATH);}RES[i]=1;if(x===x2&&y===y2)break;if(x!==x2)x+=Math.sign(x2-x);else y+=Math.sign(y2-y);}}}
 trail([[Tn[0].x+10,Tn[0].y-1],[40,118],[34,118]]);trail([[Tn[5].x+10,Tn[5].y+TH],[40,118]]);
 trail([[LAY.plaza.x1+1,36],[105,36],[105,LAY.castleDoor[1]+1]]);trail([[105,36],[127,36],[127,18]]);
 trail([[Tn[1].x+10,Tn[1].y-1],[110,143]]);trail([[226,124],[234,124],[234,142]]);
 trail([[Tn[0].x+10,Tn[0].y+TH],[Tn[0].x+10,LAY.start[1]]]);
 for(let y=LAY.skysea.y+2;y<=LAY.lake.cy+LAY.lake.ry+2;y++){const c=get(130,y);set(130,y,c===T.WATER||c===T.BRIDGE?T.BRIDGE:T.PATH);RES[I(130,y)]=1;}
 trail([[130,LAY.lake.cy+LAY.lake.ry+2],[130,136],[116,136],[116,Tn[1].y-1]]);
 trail([[70,Tn[5].y+6],[70,86]]);trail([[210,52],[210,60]]);trail([[Tn[4].x+TW,28],[190,28],[190,18]]);trail([[40,90],[24,90]]);trail([[200,110],[Tn[3].x-1,110]]);
 TOWNS.forEach(tn=>{const snow=tn.id===4;
  for(let y=tn.y;y<tn.y+TH;y++)for(let x=tn.x;x<tn.x+TW;x++){set(x,y,snow?T.SNOW:T.GRASS);RES[I(x,y)]=1;}res(tn.x-1,tn.y-1,tn.x+TW,tn.y+TH);
  for(let x=tn.x;x<tn.x+TW;x++)set(x,tn.y+6,T.PATH);for(let y=tn.y;y<tn.y+TH;y++)set(tn.x+10,y,T.PATH);
  const blds=[['house',1,1,4,3],['temple',5,1,4,3],['center',12,1,6,3],['shop',12,8,6,3],['gym',1,8,6,4],['house',7,9,3,3]];tn.blds=[];
  blds.forEach(([type,rx,ry,w,h],i)=>{const bx=tn.x+rx,by=tn.y+ry;const roof={house:T.ROOF_H,center:T.ROOF_C,shop:T.ROOF_S,gym:T.ROOF_G,lab:T.ROOF_L,temple:T.ROOF_T}[type];
   for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)set(bx+xx,by+yy,yy<h-1?roof:T.WALL);
   const dx=bx+Math.floor(w/2),dy=by+h-1;set(dx,dy,T.DOOR);set(dx,dy+1,T.PATH);const id='b'+tn.id+'_'+i;DOORS[dx+','+dy]=id;tn.blds.push({id,type,dx,dy,bx,by,w,h,idx:i});MAPS[id]=makeInterior(id,type,tn,dx,dy);});
  for(let k=0;k<8;k++){const x=tn.x+2+Math.floor(R()*16),y=tn.y+4+Math.floor(R()*3);if(get(x,y)===T.GRASS)set(x,y,T.FLOWER);}});
 const P=LAY.plaza;for(let y=P.y0;y<=P.y1;y++)for(let x=P.x0;x<=P.x1;x++){set(x,y,(x+y)%11===0?T.FLOWER:T.GRASS);RES[I(x,y)]=1;}
 for(let y=LAY.leagueDoor[1]+1;y<=P.y1;y++)for(let x=70;x<=74;x++)set(x,y,T.PATH);for(let x=P.x0;x<=P.x1;x++)set(x,34,T.PATH);for(let y=P.y0+10;y<=P.y1+1;y++)set(72,y,T.PATH);
 {const b=LAY.league;for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)set(x,y,y<b.y+b.h-1?T.ROOF_L:T.WALL);const [dx,dy]=LAY.leagueDoor;set(dx,dy,T.DOOR);DOORS[dx+','+dy]='league';MAPS.league=makeLeague();}
 {const b=LAY.castle;for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)set(x,y,T.CWALL);const [dx,dy]=LAY.castleDoor;set(dx,dy,T.DOOR);DOORS[dx+','+dy]='castle';set(dx,dy+1,T.PATH);res(b.x-1,b.y-1,b.x+b.w,b.y+b.h+1);MAPS.castle=makeCastle();}
 {const b=LAY.citadel;for(let y=b.y-2;y<=b.y+b.h+2;y++)for(let x=b.x-2;x<=b.x+b.w+2;x++)set(x,y,T.SNOW);for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)set(x,y,T.HWALL);const [dx,dy]=LAY.citadelDoor;set(dx,dy,T.DOOR);DOORS[dx+','+dy]='citadel';set(dx,dy+1,T.SNOW);res(b.x-2,b.y-2,b.x+b.w+2,b.y+b.h+2);}
 {const b=LAY.skysea;for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)set(x,y,T.HWALL);const [dx,dy]=LAY.skyseaDoor;set(dx,dy,T.DOOR);DOORS[dx+','+dy]='skysea';res(124,90,136,99);}
 set(TOWNS[5].x+19,TOWNS[5].y+2,T.SEAL);
 const hut=(bx,by,w,h,id,name,town,rk)=>{for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)set(bx+xx,by+yy,yy<h-1?T.ROOF_H:T.WALL);const dx=bx+Math.floor(w/2),dy=by+h-1;set(dx,dy,T.DOOR);set(dx,dy+1,T.PATH);res(bx-1,by-1,bx+w,by+h+1);DOORS[dx+','+dy]=id;
  const tn={id:town,name};MAPS[id]=makeInterior(id,'house',tn,dx,dy);MAPS[id].name=name;EXTRA_BLDS.push({x:bx,y:by,w,h,type:'house',town,dx,dy,idx:-1,rk});return [dx,dy];};
 const clear=(x0,y0,x1,y1,v)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(inb(x,y)&&get(x,y)!==T.WATER){set(x,y,v||base(x,y));RES[I(x,y)]=1;}};
 clear(14,112,36,124);hut(17,114,4,3,'h_dew0','Dewmeadow - Herbalist\'s Hut',0,'leaf');hut(27,114,4,3,'h_dew1','Dewmeadow - Shepherd\'s Cottage',0,'leaf');for(let x=16;x<=34;x++)set(x,118,T.PATH);
 clear(118,10,136,22);hut(120,13,4,3,'h_pine0','Pinecrest - Pilgrim Lodge',4,'leaf');hut(130,13,4,3,'h_pine1','Pinecrest - Bellmaker\'s Cottage',4,'leaf');for(let x=120;x<=134;x++)set(x,18,T.PATH);
 clear(104,138,118,146);hut(106,139,4,3,'h_kiln0','Ashcone Camp - Glass-digger\'s Hut',1,'ember');for(let x=104;x<=118;x++)set(x,143,T.PATH);
 clear(224,134,244,146);hut(226,136,4,3,'h_gale0','Gale\'s End - Net House',3,'gale');hut(236,136,4,3,'h_gale1','Gale\'s End - Lookout Cottage',3,'gale');for(let x=226;x<=240;x++)set(x,142,T.PATH);
 clear(LAY.start[0]-4,LAY.start[1]-3,LAY.start[0]+4,LAY.start[1]+1,T.SAND);
 {const x=Tn[2].x+10;let y=Tn[2].y+TH;while(y<WH-2&&!OCEAN[I(x,y)]){if(get(x,y)!==T.WATER)set(x,y,T.PATH);else set(x,y,T.BRIDGE);RES[I(x,y)]=1;y++;}LAY.dockStart=[x,y];for(let k=0;k<8&&y<WH-1;k++,y++){set(x,y,T.BRIDGE);set(x+1,y,T.BRIDGE);}for(let a=-2;a<=3;a++)set(x+a,y-1,T.BRIDGE);LAY.dockEnd=[x,y-1];}
 {let best=null;for(let x=228;x<=246;x++){let y=WH-1;while(y>0&&OCEAN[I(x,y)])y--;if(y>WH-30)continue;if(!best||y+(x-236)*0.3>best[1]+(best[0]-236)*0.3)best=[x,y];}if(!best)best=[236,170];
  const [lx,ly]=best;const bx=lx-1,by=ly-6;clear(bx-3,by-2,bx+4,ly-1,T.SAND);for(let yy=0;yy<4;yy++)for(let xx=0;xx<2;xx++)set(bx+xx,by+yy,yy<3?T.ROOF_H:T.WALL);const dx=bx,dy=by+3;set(dx,dy,T.DOOR);set(dx,dy+1,T.PATH);DOORS[dx+','+dy]='h_light';
  MAPS.h_light=makeInterior('h_light','house',{id:2,name:'Saltmere'},dx,dy);MAPS.h_light.name='Reach Lighthouse';EXTRA_BLDS.push({x:bx,y:by,w:2,h:4,type:'lighthouse',town:2,dx,dy,idx:-1,rk:'coast'});LAY.lighthouse=[dx,dy];
  trail([[Tn[2].x+TW,Tn[2].y+6],[dx,Tn[2].y+6],[dx,dy+1]]);}
 const ruin=(cx,cy,r,nm)=>{clear(cx-r-1,cy-r-1,cx+r+1,cy+r+1,null);for(let k=0;k<14;k++){const a=k/14*6.283,x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r*.8);if(k%2===0&&k!==10)set(x,y,T.RUIN);else set(x,y,T.PATH);}for(let y=cy-1;y<=cy+1;y++)for(let x=cx-2;x<=cx+2;x++)set(x,y,T.PATH);LANDMARKS.push({name:nm,x:cx,y:cy,r:r+2});};
 ruin(70,90,5,'Ruins of the First Word');ruin(212,64,4,'Choir Ruins');ruin(190,14,4,'Old Bell Tower');ruin(22,88,3,'Silent Barrow');
 for(let y=140;y<=156;y++)for(let x=124;x<=140;x++){const d=Math.hypot(x-132,y-148);if(d<7&&get(x,y)!==T.WATER){set(x,y,d<1.5?T.ROCK:T.CAVE);RES[I(x,y)]=1;if(d>=1.5)ZONEMAP[I(x,y)]='slopes';}}
 LANDMARKS.push({name:'The Ashcone',x:132,y:148,r:7});
 const SHR=[[66,146,'Brightwater wayside shrine'],[165,150,'Shore shrine'],[206,114,'Storm shrine'],[194,40,'Pilgrim\'s cairn'],[18,58,'Vesper shrine'],[120,128,'Stillwater shrine'],[78,52,'Concord shrine'],[70,82,'First Word altar'],[238,40,'Lumen cairn'],[126,22,'Pinecrest shrine']];
 SHR.forEach(([x,y,nm],k)=>{for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const c=get(x+a,y+b);if(c!==T.WATER&&!SOLID.has(c)||c===T.TREE||c===T.ROCK)set(x+a,y+b,b===1&&a===0?T.PATH:base(x+a,y+b));RES[I(x+a,y+b)]=1;}set(x,y,T.SHRINE);SHRINES.push({x,y,name:nm,k});});
 const dens={leaf:.34,dusk:.16,ember:.07,coast:.08,gale:.06,snow:.12,cave:0,summit:.1,crimson:.12};
 for(let y=1;y<WH-1;y++)for(let x=1;x<WW-1;x++){const i=I(x,y);if(RES[i])continue;const v=m.t[i],r=REGION[i];if(v!==T.GRASS&&v!==T.SNOW)continue;
  const n=vn(x,y,7,11);if(n>(r==='leaf'?0.64:0.66)){set(x,y,v===T.SNOW?T.SNOWTALL:T.TALL);if(!ZONEMAP[i])ZONEMAP[i]=REGZONE[r];continue;}
  if(v===T.GRASS&&vn(x,y,4,21)>0.8){set(x,y,T.FLOWER);continue;}
  if(r==='snow'&&vn(x,y,8,23)>0.78){set(x,y,T.ICE);continue;}}
 const isoOK=(x,y)=>{for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const c=get(x+a,y+b);if(SOLID.has(c)||c===T.DOOR||c===T.PATH||c===T.BRIDGE)return false;}return true;};
 for(let y=1;y<WH-1;y++)for(let x=1;x<WW-1;x++){const i=I(x,y);if(RES[i])continue;const v=m.t[i],r=REGION[i];if(v!==T.GRASS&&v!==T.SNOW&&v!==T.CAVE&&v!==T.FLOWER)continue;
  const clearing=vn(x,y,9,31)>0.72;let d=(dens[r]||.08)*(clearing?0.1:1)*(0.5+vn(x,y,13,33));const h=hsh(x,y,77);
  if(v===T.CAVE){if(h<0.05&&isoOK(x,y))set(x,y,T.ROCK);continue;}
  if(h<d&&isoOK(x,y))set(x,y,(r==='gale'||r==='snow')&&hsh(x,y,78)<0.35?T.ROCK:T.TREE);}
 for(let i=0;i<WW*WH;i++)if(m.t[i]===T.CAVE&&!ZONEMAP[i])ZONEMAP[i]=REGION[i]==='cave'?'cave':'slopes';
 coveC.forEach(([x,y,r,nm])=>LANDMARKS.push({name:nm,x,y,r:r+3}));
 LANDMARKS.push({name:'Waking Shore',x:LAY.start[0],y:LAY.start[1],r:4},{name:'Stillwater Lake',x:130,y:100,r:28},{name:'Bramble Clearing',x:62,y:140,r:6},{name:'Stormbreak Cliffs',x:240,y:92,r:8},{name:'Lumenspire Heights',x:231,y:28,r:8},{name:'Dewmeadow',x:26,y:118,r:9},{name:'Pinecrest',x:127,y:16,r:9},{name:'Ashcone Camp',x:111,y:142,r:6},{name:'Gale\'s End',x:234,y:140,r:9},{name:'Reach Lighthouse',x:LAY.lighthouse[0],y:LAY.lighthouse[1],r:6},{name:'Saltmere Pier',x:LAY.dockEnd[0],y:LAY.dockEnd[1]-4,r:6},{name:'Concord Plaza',x:73,y:34,r:13},{name:'The Hollow Crown',x:105,y:26,r:6});
 const HID=[[60,140,'Rare Candy'],[124,140,'Ultra Orb'],[214,60,'Max Potion'],[190,11,'Rare Candy'],[70,88,'Dawn Orb'],[LAY.dockEnd[0]+3,LAY.dockEnd[1],'Revive'],[20,122,'Super Potion'],[236,42,'Ultra Orb'],[124,20,'Full Heal'],[22,86,'Max Potion']];
 HID.forEach(([x,y,it],k)=>{if(SOLID.has(get(x,y))||get(x,y)===T.WATER)set(x,y,T.PATH);HIDDEN.push({id:'hid'+k,x,y,item:it});});
 return m;}
function emptyRoom(w,h){const t=new Array(w*h).fill(T.FLOOR);for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x===0||y===0||x===w-1||y===h-1)t[y*w+x]=T.IWALL;return t;}
function makeInterior(id,type,tn,dx,dy){
 const w=type==='gym'?13:11,h=type==='gym'?15:9;const t=emptyRoom(w,h);const s=(x,y,v)=>t[y*w+x]=v;
 const ex=Math.floor(w/2);s(ex,h-1,T.MAT);
 if(type==='house'){s(1,1,T.BED);s(2,1,T.BED);s(8,1,T.BED);s(9,1,T.BED);s(5,3,T.TABLE);s(4,3,T.TABLE);}
 if(type==='temple'){s(5,1,T.ALTAR);s(3,0,T.MURAL);s(7,0,T.MURAL);s(1,1,T.BED);s(9,1,T.BED);for(const yy of [4,6])for(const xx of [2,3,7,8])s(xx,yy,T.TABLE);}
 if(type==='center'){for(let x=1;x<w-2;x++)s(x,3,T.COUNTER);s(5,3,T.COUNTER);s(ex,3,T.COUNTER);s(9,1,T.PC);s(ex,3,T.COUNTER);}
 if(type==='shop'){for(let x=1;x<w-1;x++)s(x,3,T.COUNTER);s(1,6,T.TABLE);s(9,6,T.TABLE);}
 if(type==='lab'){s(4,3,T.TABLE);s(5,3,T.TABLE);s(6,3,T.TABLE);s(1,1,T.PC);s(9,1,T.PC);}
 if(type==='gym'){for(let y=3;y<h-2;y+=3)for(let x=1;x<w-1;x++)if(Math.abs(x-ex)>((y/3)%2?1:3))s(x,y,T.PILLAR);}
 return {id,w,h,t,type,town:tn.id,exit:{x:dx,y:dy+1},spawn:{x:ex,y:h-2},name:tn.name+' '+({house:'House',center:'Healing Center',shop:'Market',gym:'Gym',lab:'Lodge',temple:'Temple of the Three'}[type])};
}
function makeLeague(){const w=11,h=26;const t=emptyRoom(w,h);
 // Summit Hall (brief 38): wide hall, pillars at the edges, elites stand in side alcoves so the carpet lane stays clear
 for(let y=3;y<h-2;y+=4){t[y*w+1]=T.PILLAR;t[y*w+9]=T.PILLAR;}t[(h-1)*w+5]=T.MAT;
 return {id:'league',w,h,t,type:'league',town:-1,exit:{x:LAY.leagueDoor[0],y:LAY.leagueDoor[1]+1},spawn:{x:5,y:h-2},name:'Concord Hall'};}
function makeCastle(){const w=11,h=18;const t=emptyRoom(w,h);for(let i=0;i<w*h;i++)if(t[i]===T.FLOOR)t[i]=T.CFLOOR;for(let y=2;y<h-2;y+=3){t[y*w+2]=T.PILLAR;t[y*w+8]=T.PILLAR;}t[(h-1)*w+5]=T.MAT;
 return {id:'castle',w,h,t,type:'castle',town:-1,exit:{x:LAY.castleDoor[0],y:LAY.castleDoor[1]+1},spawn:{x:5,y:h-2},name:'The Eighth Door Sanctum'};}
function makeLair(id,floor,name,exit){const w=11,h=14;const t=emptyRoom(w,h);for(let i=0;i<w*h;i++)if(t[i]===T.FLOOR)t[i]=floor;for(let y=3;y<h-2;y+=3){t[y*w+2]=T.PILLAR;t[y*w+8]=T.PILLAR;}t[(h-1)*w+5]=T.MAT;return {id,w,h,t,type:'lair',town:-1,exit,spawn:{x:5,y:h-2},name};}
MAPS.citadel=makeLair('citadel',T.HFLOOR,'Lumenspire',{x:LAY.citadelDoor[0],y:LAY.citadelDoor[1]+1});MAPS.skysea=makeLair('skysea',T.SFLOOR,'Hollowmere Shrine',{x:LAY.skyseaDoor[0],y:LAY.skyseaDoor[1]+1});
MAPS.world=buildWorld();
MAPS.world=buildWorld();
// ===== People =====
function tp(tn,rx,ry){return [TOWNS[tn].x+rx,TOWNS[tn].y+ry];}
function townSched(tn,home,hx,hy,wx,wy,px,py,wake=7,work=9,eve=18,sleep=21){const [a,b]=tp(tn,wx,wy),[c,d]=tp(tn,px,py);return [[wake,home,hx,hy+2,1],[work,'world',a,b,1],[eve,'world',c,d,1],[sleep,home,hx,hy,0]];}
const PRJOB={p0:'Dawnwarden (Order of Mancaco)',p1:'Hearthkeeper (Order of Mandara)',p2:'Tidecaller (Order of Mantermo)',p3:'Dawnwarden bell-keeper',p4:'Tidecaller of the silent rite',p5:'Hearthkeeper elder'};
const PRIEST_EXTRA={p0:'Our oldest calendar counts back two hundred billion years to "the Leaving". We thought it was a typo. It was not.',p1:'At the Last Hearth the dead lie one night beside Mandara\'s fire. Lately the fire leans toward the sky, as if listening.',p2:'Mantermo\'s blue flame went dark the night you arrived. It still burns - but somewhere else, as if it is holding something shut.',p3:'Our bells were cast to ring in threes. Since the giant opened his eyes, they ring a fourth time on their own.',p4:'The Silent Book says a member learns one verse each year. I have learned eleven. Verse 5:3 says those who keep the Silent Book will know his face. I know his face. That on the horizon is his face - and also not.',p5:'The Calling never preached. We only listened. We listened for a loving Father for three hundred years. What came back is not loving. The Silent Book never said he would come back unharmed.'};
const PEOPLE=[];
const MAIN=[
 // id,name,town,age,job,pers,back,home,hx,hy,wx,wy,px,py,quest,talk0,talk3,talk7
 ['hob','Miller Hob',0,58,'Miller','Kind, worried, chatty','Hob runs the Brightwater watermill. The mill bell that calls the village to supper fell into the Bramblewalk during the night the giant appeared, and he has not slept since.','b0_0',3,1,4,5,8,7,'q0','The mill bell! Gone in the night when the sky split. Without it nobody comes home for supper.','The bell rings again. Folk come home on time - and keep looking up at him.','Supper bell rings for the hero of the Reach!'],
 ['mirelle','Mirelle',0,33,'Innkeeper','Brisk, generous, unflappable','Mirelle runs the Brightwater inn. She found you on the Waking Shore and has kept a bed aired for you since, no questions asked.','b0_5',1,1,15,5,11,7,null,'Rest at the inn any time - the bed upstairs is yours. You fell out of the sky, after all.','Nine strangers fell from the sky the same night as you. I kept a list.','Free bed for life, dear.'],
 ['tibb','Tibb',0,11,'Goatherd','Brave, nosy, loud','Tibb watched the giant rise over the horizon and decided he was not scary, just very far away.','b0_5',3,1,17,8,6,7,null,'Mum says not to stare at the giant. I stare anyway. He blinked at me!','You beat Bryony?! Can I hold the medal?','The giant smiles more since you came.'],
 ['petra','Petra',1,27,'Glassblower','Fiery, precise, proud','Petra blows the coloured temple glass of Kilnmouth. The Hollow Choir smashed half her kiln stock looking for "seal-glass".','b1_0',3,1,5,5,10,8,'q1','The kilns need a fire-hearted monster to wake them. Show me one?','Fires are hot again. The Choir won\'t get my glass.','I\'m blowing a window with your face in it.'],
 ['dunmore','Dunmore',1,61,'Kiln Master','Gruff, fair, tired','Dunmore has fired the ancient kilns for forty years. He says the oldest kiln was built for a fire nobody remembers lighting.','b1_5',2,2,16,7,9,5,null,'The oldest kiln won\'t light. It never would. Built for a fourth fire, the stories say.','The Choir are gone from Kilnmouth. Good riddance.','Kilns roar in your honour tonight.'],
 ['ama','Ama',1,9,'Clay Kid','Curious, messy, sweet','Ama makes clay monsters and gives them to strangers. She made a clay giant head and buried it "so he can rest".','b1_5',3,1,7,12,12,5,null,'I made a clay Kilnpup! And a clay giant. Shh, he is sleeping.','You can have a clay medal. It\'s a bit wonky.','I made a clay YOU.'],
 ['marta','Marta',2,49,'Pearl Diver','Blunt, brave, salty','Marta dives the Saltmere pearl beds. Since the giant woke, sea-pests swarm the pier and bite her lines.','b2_0',3,1,14,12,9,5,'q2','Pests all over the pier! Clear some out for me, would you?','Pier is quiet. Pearls are back.','Pearls for the hero. Take your pick.'],
 ['rook','Captain Rook',2,48,'Ferry Captain','Boastful, brave, honest','Rook sailed his rebuilt ferry out of Tidehaven to search for you after the world shook - and found Saltmere instead. He swears the stars here are arranged differently.','b2_5',2,2,17,12,11,7,null,'Ha! Thought I\'d lost you, Champion! My ferry found this shore by accident... or by somebody\'s design.','Your rival rode with me. Never shuts up about you.','We\'ll sail home together when this is done.'],
 ['nell','Nell',2,13,'Shell Collector','Curious, chatty, fearless','Nell stowed away on Rook\'s ferry to find her grandma\'s missing friend - Old Corwin, who vanished the night the world shook.','b2_5',3,1,7,13,11,7,null,'Have you seen Old Corwin? He tells the best stories and he just... vanished!','You found Corwin? I knew it!','I\'m going to be the Reach Champion next!'],
 ['tamsin','Tamsin',3,36,'Bell Engineer','Precise, impatient, loyal','Tamsin moved from Galecrest years ago to tune Stormwatch\'s lightning bells. The Choir stole the great clapper to silence the warning bell.','b3_0',3,1,6,5,12,7,'q3','The great clapper is gone! Without it the storm bell can\'t warn anyone.','The bell sings again! Engineering triumphs.','I\'m tuning a bell to your name.'],
 ['pell','Pell',3,40,'Herald','Grand, precise','Pell crossed from the Summit League to herald the Concord League here. He records every challenger.','b3_1',2,2,16,5,9,8,null,'The Concord League awaits those who hold six medals. Bring them to the Concord Plaza in the north-west!','Four medals! The Concord takes note.','Champion of two lands! Unheard of!'],
 ['ozzie','Ozzie',3,12,'Gull Trainer','Noisy, sweet','Ozzie tries to send letters home by Sparrook. They always come back, and he does not know why.','b3_5',3,1,11,4,8,5,null,'My Sparrook won\'t fly past the horizon. Something big is in the way.','I think the giant is reading my letters.','Champion! Sign my Sparrook!'],
 ['oswin_s','Sister Wenna',4,44,'Snow-shrine Keeper','Gentle, stubborn','Wenna tends the silent shrine. Her brother Oswin went to live alone in the Ninefold Caverns after a quarrel and has never written back.','b4_0',3,1,5,5,12,7,'q4','Will you carry a whispered letter to my brother Oswin in the Ninefold Caverns? He listens to nobody else.','Oswin will visit at the thaw? Oh, that stubborn old goat.','Warm tea for you, always.'],
 ['ivo','Shrine-keeper Ivo',4,67,'Pilgrim','Solemn, gentle, devout','Ivo walked from Frostmere to Hushpeak in a single night - he does not remember the walk. He believes the Three carried him.','b4_1',2,2,9,4,15,7,null,'I woke on a mountain I had never seen. The Three carried me, I think. Or their father did.','The Lumenspire glows at night now. Something waits there.','The Three will be free soon. I can feel it.'],
 ['lisbet','Lisbet',4,24,'Ice Carver','Artsy, moody','Lisbet carves the faces she sees in her dreams. Lately they are all the same enormous face.','b4_5',3,1,15,12,8,8,null,'I keep carving him. I can\'t stop. He\'s... beautiful, isn\'t he?','My carvings smile now.','I carved you beside him. You looked small. That\'s fine.'],
 ['wynn','Wynn',5,31,'Lamplighter','Quiet, diligent, brave','Wynn keeps Vesperdeep\'s lamps lit against the Choir\'s darkness. A Choir straggler has been stealing the bell-glass lenses.','b5_0',3,1,6,5,14,5,'q5','Someone steals my bell-glass every night. Without it the lamps can\'t hold the dark.','The lamps hold. Thank you.','A lamp lit for you, Champion.'],
 ['silas','Silas',5,18,'Ruins Guide','Cocky, clever, lonely','Silas came over with Rook\'s ferry chasing rumours of the Calling. He knows every tunnel under Vesperdeep already.','b5_5',3,1,17,11,10,5,null,'The Choir hold their rites under the bell-ruins. Their leader calls himself the Cantor.','The Cantor ran north, to the Hollow Crown.','Told you I\'d help. Mostly.'],
 ['gideon','Gideon',5,55,'Gravekeeper','Gloomy, kind','Gideon tends graves so old their names were never written - only a mark of three flames and one star above.','b5_1',2,2,4,5,17,12,null,'These graves have no names. Just three flames and one star. The Calling buried their own here.','The graves feel lighter lately.','Rest easy, hero.']];
MAIN.forEach(([id,name,town,age,job,pers,back,home,hx,hy,wx,wy,px,py,quest,t0,t3,t7])=>PEOPLE.push({id,name,town,col:'#888',age,job,pers,back,sched:townSched(town,home,hx,hy,wx,wy,px,py),quest:quest||undefined,talk:[[0,t0],[3,t3],[7,t7]]}));
[['p0','Sister Aelin',0,31,'Gentle, curious','A Dawnwarden of the Reach who keeps calendars that count years in fours.'],
 ['p1','Brother Kael',1,52,'Gruff, warm','A Hearthkeeper who sat with the dying through the night the giant rose, and says not one of them was afraid.'],
 ['p2','Mother Isolde',2,64,'Serene, sharp','Keeper of the Saltmere temple. She has blessed every boat for forty years and is the only priest who has never doubted the Calling were real.'],
 ['p3','Brother Tolle',3,35,'Anxious, scholarly','Keeper of the Stormwatch bell-temple. He counts the fourth toll each night and writes down the time.'],
 ['p4','Sister Merrow',4,41,'Stern, loyal','A Tidecaller who secretly learned eleven verses of the Silent Book from her grandmother.'],
 ['p5','Elder Ansel',5,79,'Wise, sorrowful','The eldest priest in the Reach. He was a full member of the Calling once and left when they cast out Aldric.']]
.forEach(([id,name,tn,age,pers,back])=>PEOPLE.push({id,name,town:tn,col:'#f0e8c0',age,job:'Priest of the Three - '+PRJOB[id],pers,back,priest:true,
  sched:[[0,'b'+tn+'_1',8,1,0],[6,'b'+tn+'_1',3,2,0],[22,'b'+tn+'_1',8,1,0]],
  talk:[[0,'Welcome to the Temple of the Three. Our altar has three flames and a fourth hollow, empty. We were taught the hollow was for a guest. Now a face fills the whole sky, and I no longer know what we were taught.'],[2,'The Synod has split. The Fourth Flame faction pray to the face on the horizon as the true god. The Triune Loyalists say it is a demon and bar the temple doors. I... light all three flames and leave the fourth hollow empty. I am afraid to choose.'],[4,'We misread everything. The Silent Book says the Deep is the stillness between the worlds - not a sea, not a mother of the Three. And the Father came home through it. Ruin calls ruin, 2:3 says. What did he bring back with him?'],[6,'Gather the knowers, child. If the Father is in there, ten names spoken with a pure heart may reach him. Spoken in ruin, they will only feed what wears him.'],[7,'The Father is free, the Three remember his face, and the books are one. Blessed be your road.']]}));
// ===== The nine other knowers (main quest: find them all) =====
const KNOWER_IDS=['seren','fenwick','corwin','wendeline','thessaly','moira','fenna','quill','aldric'];
[['seren','Seren',-1,'?','The Hooded Stranger','Calm, amused, ancient','A member of the Calling in a grey hood. On your island they stood beside the eighth door the day the world shook - and the night you finished, they told you to sleep. Their shadow still falls the wrong way.',[[0,'world',LAY.start[0]+3,LAY.start[1]-1,0]]],
 ['fenwick','Brother Fenwick',1,34,'Dawnwarden archivist','Anxious, scholarly, kind','The Galecrest scripture scholar who catalogued sky-omens. He woke inside a Kilnmouth kiln, sooty and delighted.',[[0,'world',...tp(1,17,12),0]]],
 ['corwin','Old Corwin',2,81,'Storyteller','Dreamy, wise, long-winded','He told your father the tale of the Three and never told him the ending. He woke on the Saltmere pier and immediately started telling fishermen stories.',[[0,'world',...tp(2,17,12),0]]],
 ['wendeline','Wendeline',3,68,'Weather Watcher','Mysterious, precise','She logged every wind on your island for forty years. Some winds blew from nowhere. Now she knows where.',[[0,'world',...tp(3,17,12),0]]],
 ['thessaly','Elder Thessaly',4,78,'Hearthkeeper elder','Wise, sorrowful, patient','The eldest priest of the faith, who trained Brother Aldric and blamed herself for his fall. She has been waiting a long time to forgive him.',[[0,'world',...tp(4,17,12),0]]],
 ['moira','Archivist Moira',5,46,'Ruins Archivist','Sharp, secretive, principled','She studied scripture beside Aldric before he became the Monk and hid the forbidden pages - all but one.',[[0,'world',...tp(5,17,12),0]]],
 ['fenna','Old Fenna',0,82,'Herbalist','Sharp, cryptic','She met Aldric weeping among the pines long ago and never told anyone what he whispered. She woke in a Dewmeadow herb garden.',[[0,'world',22,120,0]]],
 ['quill','Scholar Quill',3,36,'Ruin Scholar','Excitable, scholarly','He was right: the ruins had a fourth gate. He woke in the Choir Ruins, next to it.',[[0,'world',214,64,0]]],
 ['aldric','Aldric (the Monk)',-1,59,'Former leader of the Followers of the Deep','Quiet, broken, honest','Once Brother Aldric of Duskhollow, then the Monk. He read the Silent Book in a single night, lost his wife and two children, and tried to break the world so its Father would look. Now the Father has looked - and dragged Aldric here with the rest of the knowers.',[[0,'world',72,92,0]]]
].forEach(([id,name,town,age,job,pers,back,sched])=>PEOPLE.push({id,name,town,col:'#504060',age,job,pers,back,sched,knower:true,talk:[[0,'...']]}));
// ===== Townsfolk & hamlet NPCs =====
const FOLK_RAW=[
 [0,'tilly','Tilly',34,'Shepherd','Cheerful, chatty','Tilly herds Mosslamb on the downs. She swears the moss on their backs grows toward the giant.'],
 [0,'bram2','Young Bram',15,'Apprentice Miller','Restless, brave','Hob\'s nephew. He wants to climb to the horizon and ask the giant what he wants.'],
 [0,'hesta','Hesta',63,'Beekeeper','Slow, kind, wise','Her bees fly in circles of four now. She says they are counting.'],
 [0,'dale2','Dalen',27,'Woodcarver','Shy, gentle','Dalen carves temple candle-holders with four cups, as Reach custom demands.'],
 [1,'varga2','Vargo',45,'Clay Digger','Blunt, loyal','Vargo digs kiln-clay at the Ashcone and finds glass beads shaped like little eyes.'],
 [1,'emmet2','Emmet',10,'Bellows Boy','Sooty, cheerful','Emmet pumps the bellows and keeps a jar of lava pearls.'],
 [1,'sorrel2','Sorrel',31,'Window Painter','Proud, artistic','Sorrel paints temple windows - always three sisters, and lately a fourth shape above.'],
 [1,'grum2','Old Grum',70,'Retired Potter','Grumbling, warm','Grum critiques every pot that leaves Kilnmouth, including his own.'],
 [2,'nerys2','Nerys',38,'Net Mender','Patient, funny','Nerys sings hymns to Mantermo and leaves a gap in the verse where the blue flame used to be.'],
 [2,'fynn2','Fynn',14,'Deckhand','Eager, reckless','Fynn tried to row to the horizon. The horizon moved.'],
 [2,'marlow2','Marlow',52,'Fishmonger','Loud, honest','Marlow says the fish all face the giant at dawn.'],
 [2,'ysa','Ysa',24,'Salt Raker','Calm, daring','Ysa rakes salt and found one crystal shaped like a sword.'],
 [3,'brisa2','Brisa',29,'Kite Maker','Bright, quick','Brisa\'s kites refuse to fly toward the giant. They tug sideways, politely.'],
 [3,'tor2','Torvin',41,'Rod Smith','Steady, quiet','Torvin forges the lightning rods that keep Stormwatch standing.'],
 [3,'cass','Cass',33,'Storm Chaser','Wild, honest','Cass chases thunderheads and once saw a Stormcrest nest inside one.'],
 [3,'lumi','Lumi',8,'Bell Kid','Noisy, sweet','Lumi rings the little bells and counts to four every time.'],
 [4,'katla2','Katla',36,'Ice Fisher','Stoic, dry','Katla fishes the frozen tarns and has never admitted to being cold.'],
 [4,'bjorn2','Bjorn',58,'Fur Trader','Jolly, shrewd','Bjorn sells furs and tall tales in equal measure.'],
 [4,'sigrid2','Sigrid',14,'Sled Racer','Fearless, proud','Sigrid plans to sled from Lumenspire to Stillwater in one run.'],
 [4,'elof2','Elof',33,'Pilgrim Guide','Devout, careful','Elof guides pilgrims to Lumenspire and counts each step as a prayer.'],
 [5,'morwen2','Morwen',39,'Candle Maker','Soft-spoken, eerie','Morwen makes candles with four wicks and lights only three.'],
 [5,'liesel2','Liesel',9,'Lantern Kid','Curious, fearless','Liesel follows Wynn on lamp rounds.'],
 [5,'ravel2','Ravel',46,'Relic Seller','Shifty, charming','Ravel sells "pieces of the giant". They are rocks.'],
 [5,'hilde','Hilde',57,'Bell Founder','Stern, honest','Hilde casts bells for every town in the Reach and refuses the Choir\'s commissions.']];
const FOLK_HOME=tn=>'b'+tn+'_5';
FOLK_RAW.forEach(([tn,id,name,age,job,pers,back],i)=>{const k=i%4,home=FOLK_HOME(tn);const T0=TOWNS[tn];let sched,walk=null;
 if(k===0){walk={ax:2,ay:6,bx:17,by:6};sched=[[0,home,1,5,0],[7,'world',T0.x+2,T0.y+6,0],[20,home,1,5,0]];}
 else if(k===1){walk={ax:10,ay:4,bx:10,by:12};sched=[[0,home,3,5,0],[8,'world',T0.x+10,T0.y+4,0],[19,home,3,5,0]];}
 else sched=[[0,home,k*2+3,5,0],[8,'world',T0.x+13+k,T0.y+7,0],[20,home,k*2+3,5,0]];
 PEOPLE.push({id,name,town:tn,col:'#888',age,job,pers,back,sched,walk,folk:true,face:k===2?'right':k===3?'left':null,
  talk:[[0,'Life in '+T0.name+' goes on, even with that face in the sky.'],[3,'Folk say you are driving the Hollow Choir out of every town. Thank you.'],[7,'The Champion of the Reach! Wait until I tell everyone.']]});});
const hamSched=(home,wx,wy)=>[[0,home,3,4,0],[7,'world',wx,wy,1],[20,home,3,4,0]];
[['maren2','Maren',0,44,'Shepherd','Practical, wistful','Maren keeps the Dewmeadow flock and lets lost travellers sleep in her hay.',hamSched('h_dew1',31,119)],
 ['tobin2','Tobin',0,10,'Herb Boy','Talkative','Tobin helps in the herbalist\'s garden and keeps a list of every monster he sees.',hamSched('h_dew0',21,119)],
 ['edda2','Edda',4,50,'Pilgrim Host','Strong, reverent','Edda runs the Pinecrest lodge for pilgrims bound for the Hollow Crown.',hamSched('h_pine0',122,19)],
 ['bellam','Bellam',4,60,'Bellmaker','Sharp, cryptic','Bellam makes small bells that ring in four tones. He will not say who taught him.',hamSched('h_pine1',132,19)],
 ['rusk2','Rusk',1,37,'Glass-digger','Rough, hopeful','Rusk digs volcanic glass at the Ashcone camp and has a scar for every eruption.',hamSched('h_kiln0',109,144)],
 ['wilma2','Wilma',3,61,'Innkeeper of Gale\'s End','Hearty, nosy','Wilma feeds every storm-blown traveller and every stray Sparrook.',hamSched('h_gale0',230,143)],
 ['jory2','Jory',3,12,'Birdwatcher','Quiet, dreamy','Jory watches seabirds that fly in the shape of four stars.',hamSched('h_gale1',239,143)],
 ['aldous2','Keeper Hallam',2,66,'Lighthouse Keeper','Solemn, gentle','Hallam keeps the Reach light burning. The night the giant rose, his lamp turned by itself to face the horizon.',[[0,'h_light',3,4,0],[6,'world',LAY.lighthouse[0]+2,LAY.lighthouse[1]+1,1],[18,'h_light',3,4,0]]],
 ['brin2','Old Brin',2,72,'Retired Sailor','Storyteller','Brin sits at the end of the Saltmere pier telling stories about seas that are not on any map.',[[0,'world',LAY.dockEnd[0]-2,LAY.dockEnd[1],0]]],
 ['herald2','Warden Osk',-1,40,'Concord Warden','Grand, precise','Osk guards the Concord Hall and knows every champion\'s record by heart.',[[0,'world',76,33,0]]],
 ['oswin','Hermit Oswin',-1,58,'Hermit','Grumpy, lonely, secretly kind','Wenna\'s brother. After a quarrel he fled into the Ninefold Caverns and lives on cave mushrooms.',[[0,'world',112,52,0]]]
].forEach(([id,name,tn,age,job,pers,back,sched])=>PEOPLE.push({id,name,town:tn,col:'#888',age,job,pers,back,sched,hamlet:true,
  talk:[[0,{maren2:'Mind the flock. They spook when the giant blinks.',tobin2:'Fenna says I have a gift for weeds.',edda2:'Pilgrims come to see the Hollow Crown. Few go in.',bellam:'Four tones. Always four.',rusk2:'The Ashcone rumbled again. Good for glass!',wilma2:'Welcome to Gale\'s End! Mind the wind.',jory2:'Shh. The gulls are landing in fours.',aldous2:'The light must never go out.',brin2:'Did I ever tell you about the sea past the horizon?',herald2:'Challengers of the Concord! The Hall lies straight ahead - the way is clear.',oswin:'Go away. Caves are quiet. People are loud.'}[id]],[7,'Champion! The whole Reach is talking about you.']]}));
const GIFTS=['Bramble Jam','Kiln Glass','Salt Pearl','Storm Bell','Hush Candle','Silent Page','Honey Bread','Old Coin'];
const shash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
PEOPLE.forEach(p=>{const h=shash(p.id);const reg=GIFTS[p.town>=0?p.town:6];let a=GIFTS[h%8];if(a===reg)a=GIFTS[(h+3)%8];let d=null;for(let j=0;j<8&&!d;j++){const c=GIFTS[((h>>>4)+j)%8];if(c!==reg&&c!==a)d=c;}p.likes=p.likes||[reg,a];p.dislikes=p.dislikes||[d];});
const PEOPLE_BY_ID={};PEOPLE.forEach(p=>PEOPLE_BY_ID[p.id]=p);
// ===== Scripture: Book of the Three + the Silent Book of The Calling (expansion material, now canon) =====
const VERSES=SCRIPTURE_SRC.old.slice();
const REWRITE=SCRIPTURE_SRC.rewritten;
function verseText(i){if(!(typeof S!=='undefined'&&S&&S.flags&&S.flags.rewrite)||S.flags.finale)return VERSES[i];return REWRITE[i]||VERSES[i];}
const BELOVED=SCRIPTURE_SRC.fragments.map((f,i)=>'True text, fragment '+(i+1)+': '+f);
const INSCRIPTIONS=['Brightwater temple lintel: "THREE FLAMES WE LIGHT, AND ONE SEAT WE KEEP."','Kilnmouth temple kiln-stone: "Who struck the first spark? He who spoke the first word."','Saltmere temple: a tide-chart with three currents and a fourth line running straight up - here it was never scratched out.','Stormwatch temple bell: three blessings cast into the bronze, and a fourth word, too worn to read.','Hushpeak temple ice: three sisters looking up toward a face carved whole and smiling.','Vesperdeep temple: "FOR A THING DOES NOT RISE UNLESS IT IS CALLED." Beneath it, newer chisel-work: "AND WHEN HE IS CALLED, HE RISES."'];
// ===== SCRIPTURE: single swap point for Nick's sequel scripture (lore/scripture-2.md) =====
// old: verses as the temples teach them (index-aligned). truth: true Silent Book fragments (Eighth Door seal).
// Content now comes from js/scripture.js (generated from lore/scripture-2.md).
const SCRIPTURE=SCRIPTURE_SRC;
const RUMORS=['Folk say the giant blinked when the first of you strangers fell from the sky.','The kiln-masters say the oldest kiln was built for a fire the Three never lit.','Sailors say no ship has ever sailed past the horizon here. The sea simply turns them home.','The bells ring a fourth time each night. Nobody pulls the rope.','The snow on Hushpeak never lands on the Lumenspire. It drifts around it, as if bowing.','The Choir sing under the bell-ruins. Their song has no words, only gaps where words should go.'];
const FESTS={2:{name:'Ember Vigil',cr:'Mandara',gift:'Super Potion',txt:'One candle in every window - and here, a fourth candle kept unlit.'},4:{name:'Dawnlight Feast',cr:'Mancaco',gift:'Ultra Orb',txt:'We keep watch and greet the sunrise. This year we also greet the face beyond it.'},6:{name:'Tide & Gale Regatta',cr:'Mantermo',gift:'Revive',txt:'Boats and kites race in her name - may she return to see them.'}};
const BIOS={
 rival:{job:'Your Rival',age:17,pers:'Confident, competitive, secretly caring',back:'Your neighbour since childhood. When you vanished in the night, @RIVAL bullied Captain Rook into sailing until they found you.'},
 malrec:{job:'Cantor of the Hollow Choir',age:52,pers:'Gentle-voiced, certain, terrifying',back:'Malrec was a full member of the Calling who memorised the whole Silent Book. When the face rose on the horizon he declared it the true god returned, founded the Hollow Choir, and taught that the Father\'s new hunger is holy: this grieving world must be returned to the stillness so it can be made again. He mirrors Aldric - Aldric wanted the Father to look; Malrec wants the Father to erase. He knows something wears the Father. He worships it anyway.'},
 Bryony:{job:'Brightwater Gym Leader',age:31,pers:'Patient, thorny, warm',back:'A hedge-gardener whose bramble maze has never been solved the same way twice.'},
 Dorrek:{job:'Kilnmouth Gym Leader',age:54,pers:'Booming, fair',back:'A potter who fires his monsters\' armour in the ancient kilns.'},
 Corvina:{job:'Saltmere Gym Leader',age:28,pers:'Graceful, fierce',back:'A pearl diver who can hold her breath longer than a Brinefox.'},
 Zephra:{job:'Stormwatch Gym Leader',age:24,pers:'Reckless, joyful',back:'She rings the storm bell by flying into it on a Stormcrest.'},
 Seraphine:{job:'Hushpeak Gym Leader',age:44,pers:'Silent, kind',back:'She has not spoken aloud in nine years and battles entirely in sign.'},
 'Cantor Vale':{job:'Vesperdeep Gym Leader',age:39,pers:'Theatrical, wounded',back:'Malrec\'s estranged brother, who left the Choir when its song lost its words.'},
 Ignatia:{job:'Elite of Flame',age:47,pers:'Blazing',back:'Keeper of the Concord\'s eternal kiln.'},Halde:{job:'Elite of Frost',age:60,pers:'Stoic',back:'A glacier guide who never loses anyone.'},Ferrum:{job:'Elite of Iron',age:38,pers:'Exacting',back:'A clockmaker who repaired the Cogwisps of the old Sanctum.'},Nyx:{job:'Elite of Night',age:29,pers:'Quiet, perceptive',back:'Grew up in Vesperdeep\'s lamplit nights.'},
 Orrin:{job:'Champion of the Concord',age:50,pers:'Serene, curious',back:'Champion of the Reach for twenty years. He has waited all his life for a challenger from beyond the horizon.'}
};
const QUESTS={
 q0:{town:0,name:'The Mill Bell',giver:'hob',desc:'Find the Brightwater mill bell, lost somewhere in the Bramblewalk (east of town), and return it to Miller Hob.',type:'item',item:'millbell',reward:{items:{'Super Potion':3},money:500}},
 q1:{town:1,name:'Wake the Kilns',giver:'petra',desc:'Show Petra a Fire-type monster in your party.',type:'hasType',ptype:'Fire',reward:{items:{'Great Orb':5}}},
 q2:{town:2,name:'Pier Pests',giver:'marta',desc:'Defeat 4 wild monsters after accepting, then report to Marta.',type:'defeat',n:4,reward:{items:{'Ultra Orb':2},money:1500}},
 q3:{town:3,name:'The Silent Bell',giver:'tamsin',desc:'Find the stolen storm-bell clapper somewhere along Bellstorm Pass (Route 4).',type:'item',item:'clapper',reward:{items:{'Rare Candy':3}}},
 q4:{town:4,name:'A Whispered Letter',giver:'oswin_s',desc:'Deliver Wenna\'s letter to Hermit Oswin in the Ninefold Caverns, then return to Wenna.',type:'deliver',to:'oswin',letter:'Wenna\'s Letter',reward:{items:{'Max Potion':2},money:1000}},
 q5:{town:5,name:'Bell-glass Thief',giver:'wynn',desc:'Defeat Wrenna, the Choir straggler stealing bell-glass near the east ruins of town.',type:'trainer',trainer:'mott',reward:{items:{'Dawn Orb':1}}}
};
const QITEMS=[{id:'millbell',map:'world',x:62,y:136,q:'q0',txt:'a dented brass mill bell'},{id:'clapper',map:'world',x:200,y:56,q:'q3',txt:'a huge iron bell clapper'}];
const LEGENDS=[{sp:'Legranta',map:'castle',x:5,y:2,lv:70,boss:true},{sp:'Lumenwing',map:'citadel',x:5,y:2,lv:58,lair:true},{sp:'Hollowmere',map:'skysea',x:5,y:2,lv:58,lair:true},{sp:'Octavel',map:'world',x:118,y:56,lv:55}];
const TRAINERS=[];
function trn(o){TRAINERS.push(o);return o;}
const SYN=[
 ['Brother Hask','Chanter',0,15,11,[['Veilkit',12],['Hushmouse',13]],'The Hollow Choir hunts the ones who fell from the sky. You are one of them, aren\'t you? Your name belongs to the Cantor!','Hmph. The Cantor will find the other nine without me.'],
 ['Sister Lys','Chanter',1,4,10,[['Kilnpup',18],['Hushmouse',18],['Pebbuzz',19]],'We break the seal-glass in the old kilns. Every broken seal brings the Father closer to unmaking!','The seal-glass... fine. There are seven more seals.'],
 ['Precentor Dane','Precentor',2,16,9,[['Saltkit',24],['Veilkit',25],['Driftjelly',25]],'The pearl beds hide the third seal. When it cracks, the sea forgets its shape!','The sea keeps its shape. For now.'],
 ['Cantor Malrec','Cantor',3,4,11,[['Hollowfox',30],['Cogwisp',30],['Bellwhisker',31]],'I am Malrec, Cantor of the Hollow Choir. The true god has returned after two hundred billion years, and he is hungry. Ten names spoken at his door will let him in. Give me yours.','You sing with a pure heart. That is exactly why you will lose in the end.'],
 ['Precentor Ilda','Precentor',4,16,9,[['Snowmote',35],['Hollowfox',36],['Glyphling',36]],'The silent seal of Hushpeak will break. Even silence ends.','Go on to Vesperdeep, then. The Cantor sings there.'],
 ['Cantor Malrec','Cantor',5,10,3,[['Hollowfox',41],['Runesage',42],['Cogwisp',42],['Bellwhisker',43]],'Seven seals broken. Only the eighth remains, in the Hollow Crown. And you have been so kind as to gather the knowers for me.','...Again. Very well. I will wait for you in the Sanctum. Bring all ten names - I need them.']];
SYN.forEach(([n,cls,tnId,rx,ry,party,pre,post],i)=>{const [x,y]=i<5?tp(tnId,6,12):tp(tnId,11,4);trn({id:'syn'+i,name:n,cls:'Hollow Choir '+cls,col:'#202028',map:'world',x,y,party,money:300+i*400,pre,post,vanish:true,bio:(i===3||i===5)?'malrec':null});});
const MYTH=['My brambles grow toward the horizon now. Even plants want to see him.','Our kilns were built for a fourth fire. Maybe it\'s finally coming.','Mantermo\'s tides are wrong since she was trapped in the void. The sea misses her.','The storm bells ring four times. I ring them back.','(Seraphine signs: "In silence, you can hear him breathing.")','My brother sings for ruin. I sing for welcome. Let us see which song you carry.'];
GYMS.forEach((g,i)=>{const id='b'+g.town+'_4';
 trn({id:'gymt'+i+'a',name:['Fern','Clay','Tide','Volta','Hush','Toll'][i],cls:'Gym Trainer',col:TCOL[g.type],map:id,x:3,y:10,party:g.party.slice(0,2).map(([s,l])=>[s,l-2]),money:200+i*200,pre:'You must pass me before the leader!',post:'Go on, the leader awaits.'});
 trn({id:'gym'+i,name:g.leader,cls:'Gym Leader',col:TCOL[g.type],map:id,x:6,y:2,party:g.party,money:1000+i*800,gym:i,pre:'I am '+g.leader+', master of '+g.type+'-type. '+g.theme+' '+MYTH[i]+' Show me your strength!',post:'You earned the '+g.medal+'. Wear it proudly.'});
});
ELITE.forEach((e,i)=>trn({id:'elite'+i,name:e.name,cls:e.title,col:i===4?'#f0d080':'#806040',map:'league',x:i===4?5:7,y:[21,17,13,9,3][i],party:e.party,money:3000+i*1000,elite:i,pre:i===4?'I am Orrin, Champion of the Concord. A challenger from beyond the horizon... I have waited twenty years. Show me everything!':'I am '+e.name+', the '+e.title+'. Prove you belong here!',post:i===4?'A new Champion of the Concord is crowned!':'Go on. The next challenge awaits.'}));
trn({id:'mott',name:'Wrenna',cls:'Hollow Choir Straggler',col:'#302830',map:'world',x:TOWNS[5].x+19,y:TOWNS[5].y+12,party:[['Veilkit',40],['Hollowfox',41]],money:800,pre:'This bell-glass is MINE! The Choir pays for it - and the god on the horizon will reward us!',post:'Fine! Take the stupid glass back.',vanish:true,needQuest:'q5'});
[['Bug Kid Tam','r',65,158,[['Starseed',10],['Brambit',11]]],['Hiker Ott','r',80,165,[['Pebbuzz',13]]],['Fisher Lou','r',140,172,[['Saltkit',17],['Driftjelly',18]]],['Lass Bea','r',187,146,[['Coralume',22],['Mosslamb',23]]],['Bird Fan Jo','r',205,124,[['Sparrook',25],['Breezel',26]]],['Skier Ana','r',190,51,[['Snowmote',30],['Snowpup',31]]],['Miner Gus','r',140,45,[['Cogwisp',33],['Ironmite',34]]],['Ace Rhea','r',50,48,[['Arcoyote',44],['Wickwyrm',44],['Stormcrest',45]]]]
 .forEach(([n,,x,y,party],i)=>trn({id:'rt'+i,name:n,cls:'Trainer',col:'#60a0a0',map:'world',x,y,party,money:150+i*120,pre:'Our eyes met! Battle!',post:'Good fight! Keep training.'}));
trn({id:'rival0',name:'@RIVAL',cls:'Rival',col:'#3050c0',map:'world',x:TOWNS[2].x+12,y:TOWNS[2].y+7,party:'rival0',money:1200,pre:'@NAME!! You vanished in the middle of the night! I made Rook sail for three days! ...Battle me, so I know you\'re really you.',rival:true}).post='Yeah. It\'s you. Nobody else battles that annoyingly. I\'m sticking around - somebody has to.';
trn({id:'rival1',name:'@RIVAL',cls:'Rival',col:'#3050c0',map:'world',x:TOWNS[3].x+12,y:TOWNS[3].y+7,party:'rival2',money:2500,pre:'Four medals soon? I\'ve been training on the storm cliffs. Let\'s go!',post:'Hah... still better than me. Fine. I\'ll find the knowers you missed.',rival:true});
trn({id:'rival2',name:'@RIVAL',cls:'Rival',col:'#3050c0',map:'world',x:68,y:33,party:'rival3',money:4000,pre:'Concord League. Two lands, two championships. Beat me and you can face the Elite.',post:'Go. Win it for both of us. Then go get your goddesses back.',rival:true,vanish:true});
trn({id:'vesper2',name:'Cantor Malrec',cls:'Hollow Choir Cantor',col:'#202028',map:'castle',x:5,y:8,party:[['Hollowfox',60],['Runesage',60],['Octavel',61],['Cogwisp',60],['Magmastiff',61]],money:6000,pre:'Welcome to the Sanctum. The eighth seal waits. Ten names, spoken in ruin, and the true god walks through - with all the beautiful stillness he brought home!',post:'No... the names will not answer me. They only answer love. Then what I worshipped was never him...',vanish:true,bio:'malrec'});
const GATES=[{x:105,y:28,need:'champ'}];
