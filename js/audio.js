// ===== Procedural audio (brief 44): Web Audio music + SFX, fully offline, no files =====
'use strict';
(function(){
const KEY='monsterwilds2_audio';let cfg={ma:0.4,mv:0.3,sv:0.4,mute:false,ver:2};try{const o=JSON.parse(localStorage.getItem(KEY)||'null');if(o){if(!o.ver){if(o.mv===0.55)delete o.mv;if(o.sv===0.8)delete o.sv;o.ver=2;Object.assign(cfg,o);try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(e){}}else Object.assign(cfg,o);}}catch(e){}// brief 47: one-time migration of untouched old defaults
const A={ok:false,ac:null,cfg,track:null,err:null};window.SFX=A;window.MUS=A;
let master,mus,sfx,amb,noiseBuf,cur=null,nextT=0,step=0,timer=null,ambNodes={};
function save(){try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(e){}}
function apply(){if(!A.ac)return;const t=A.ac.currentTime;master.gain.setTargetAtTime(cfg.mute?0:cfg.ma,t,.05);mus.gain.setTargetAtTime(cfg.mv*0.5,t,.1);sfx.gain.setTargetAtTime(cfg.sv,t,.05);amb.gain.setTargetAtTime(cfg.sv*0.3,t,.2);}
A.init=function(){if(A.ac)return true;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC){A.err='no WebAudio';return false;}
  try{if(navigator.audioSession)navigator.audioSession.type='ambient';}catch(e){}// iOS 16.4+: respect the silent switch
  A.ac=new AC();master=A.ac.createGain();master.connect(A.ac.destination);mus=A.ac.createGain();sfx=A.ac.createGain();amb=A.ac.createGain();
  const comp=A.ac.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=12;comp.ratio.value=3;comp.attack.value=.01;comp.release.value=.25;const lim=A.ac.createDynamicsCompressor();lim.threshold.value=-6;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.002;lim.release.value=.1;mus.connect(comp);sfx.connect(comp);amb.connect(comp);comp.connect(lim);lim.connect(master);A.limiter=lim;
  noiseBuf=A.ac.createBuffer(1,A.ac.sampleRate,A.ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  apply();A.ok=true;timer=setInterval(tick,90);return true;}catch(e){A.err=String(e);A.ok=false;return false;}};
A.unlock=function(){if(!A.init())return;if(A.ac.state!=='running')A.ac.resume().catch(()=>{});try{const b=A.ac.createBuffer(1,1,22050),s=A.ac.createBufferSource();s.buffer=b;s.connect(A.ac.destination);s.start(0);}catch(e){}};
['pointerdown','touchend','keydown'].forEach(ev=>window.addEventListener(ev,()=>A.unlock(),{passive:true}));
A.setMaster=v=>{cfg.ma=Math.max(0,Math.min(1,v));save();apply();};A.setMusic=v=>{cfg.mv=Math.max(0,Math.min(1,v));save();apply();};A.setSfx=v=>{cfg.sv=Math.max(0,Math.min(1,v));save();apply();};A.toggleMute=()=>{cfg.mute=!cfg.mute;save();apply();return cfg.mute;};
// ---- synth helpers
function env(g,t,a,d,s,r,peak){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.linearRampToValueAtTime(peak*s,t+a+d);g.gain.setValueAtTime(peak*s,t+a+d+0.001);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d+r);}
function tone(dst,t,f,dur,o){o=o||{};const ac=A.ac;const os=ac.createOscillator();os.type=o.w||'square';os.frequency.setValueAtTime(f,t);if(o.slide)os.frequency.exponentialRampToValueAtTime(Math.max(20,f*o.slide),t+dur);if(o.vib){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=5.5;lg.gain.value=f*o.vib;l.connect(lg);lg.connect(os.frequency);l.start(t);l.stop(t+dur+.5);}
 const g=ac.createGain();let n=os;if(o.lp){const fl=ac.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;fl.Q.value=o.q||0.7;os.connect(fl);n=fl;}n.connect(g);g.connect(dst);env(g,t,o.a||0.005,o.d||0.05,o.s===undefined?0.6:o.s,o.r||Math.max(0.05,dur),o.v||0.2);os.start(t);os.stop(t+(o.a||0.005)+(o.d||0.05)+(o.r||dur)+0.05);}
function noise(dst,t,dur,o){o=o||{};const ac=A.ac;const s=ac.createBufferSource();s.buffer=noiseBuf;s.loop=true;const f=ac.createBiquadFilter();f.type=o.type||'bandpass';f.frequency.setValueAtTime(o.f||2000,t);if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+dur);f.Q.value=o.q||1;const g=ac.createGain();s.connect(f);f.connect(g);g.connect(dst);env(g,t,o.a||0.002,o.d||0.02,o.s===undefined?0.5:o.s,o.r||dur,o.v||0.3);s.start(t,Math.random()*0.5);s.stop(t+(o.a||0)+(o.d||0.02)+(o.r||dur)+0.05);}
const mtof=n=>440*Math.pow(2,(n-69)/12);
// ---- music themes: [bpm, root midi, mode intervals, chord degrees, lead wave, pad wave, drums 0-3, feel]
const MIN=[0,2,3,5,7,8,10],MAJ=[0,2,4,5,7,9,11],HAR=[0,2,3,5,7,8,11],PHR=[0,1,3,5,7,8,10],DOR=[0,2,3,5,7,9,10],LYD=[0,2,4,6,7,9,11];
const TH={title:[72,50,HAR,[0,5,3,4],'triangle','sawtooth',0,'epic'],leaf:[92,55,MAJ,[0,3,4,0],'triangle','triangle',1,'pastoral'],ember:[100,52,PHR,[0,1,0,6],'square','sawtooth',2,'forge'],coast:[84,57,DOR,[0,6,3,4],'triangle','sine',1,'sea'],
 gale:[112,60,LYD,[0,1,4,0],'square','triangle',1,'wind'],snow:[70,54,MIN,[0,5,2,6],'sine','sine',0,'frost'],dusk:[66,49,HAR,[0,5,1,4],'triangle','sawtooth',0,'eerie'],route:[118,57,DOR,[0,3,6,4],'square','triangle',2,'march'],
 night:[60,52,MIN,[0,5,3,6],'sine','sine',0,'night'],interior:[80,60,MAJ,[0,5,3,4],'triangle','sine',0,'home'],cave:[64,45,PHR,[0,1,5,0],'triangle','sawtooth',0,'cave'],summit:[96,53,MAJ,[0,4,5,3],'square','sawtooth',1,'noble'],
 wild:[150,57,MIN,[0,5,6,4],'square','sawtooth',3,'battle'],trainer:[160,55,DOR,[0,6,5,4],'square','sawtooth',3,'battle'],gym:[168,52,HAR,[0,5,3,4],'square','sawtooth',3,'battle'],follower:[140,50,PHR,[0,1,5,1],'sawtooth','sawtooth',3,'cult'],
 mandara:[132,46,HAR,[0,1,5,4],'sawtooth','sawtooth',3,'boss'],mancaco:[120,58,LYD,[0,4,1,5],'triangle','sawtooth',2,'radiant'],mantermo:[126,51,DOR,[0,6,3,4],'square','sawtooth',3,'storm'],legranta:[58,41,HAR,[0,5,1,4],'sawtooth','sawtooth',2,'boss'],awakening:[64,45,PHR,[0,1,5,4],'triangle','sawtooth',1,'epic'],choir:[136,48,PHR,[0,1,6,1],'triangle','sawtooth',3,'cult'],champion:[172,50,MIN,[0,5,6,4],'sawtooth','sawtooth',3,'boss'],victory:[120,60,MAJ,[0,3,4,0],'square','triangle',1,'fanfare']};
A.play=function(name){};// overwritten below (SFX)
A.music=function(name){if(!A.ok||!TH[name]){A.track=name;return;}if(cur&&cur.name===name)return;const ac=A.ac,t=ac.currentTime;if(cur){const g=cur.g;g.gain.setTargetAtTime(0,t,.35);setTimeout(()=>g.disconnect(),2500);}
 const g=ac.createGain();g.gain.value=0;g.gain.setTargetAtTime(1,t,.4);g.connect(mus);cur={name,g,th:TH[name],seed:name.length*7+name.charCodeAt(0)};A.track=name;nextT=t+0.1;step=0;};
function rnd(a,b){let n=(Math.imul(a,374761393)+Math.imul(b,668265263))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return ((n^(n>>>16))>>>0)/4294967296;}
function tick(){if(!A.ok||!cur||A.ac.state!=='running')return;const ac=A.ac;const [bpm,root,mode,prog,lw,pw,dr,feel]=cur.th;const s16=60/bpm/4;
 while(nextT<ac.currentTime+0.35){const t=nextT,st=step,bar=Math.floor(st/16),pos=st%16,ch=prog[bar%prog.length];const g=cur.g;const deg=k=>root+mode[((ch+k)%7+7)%7]+12*Math.floor((ch+k)/7);
  // pad (strings): chord on bar start
  if(pos===0)for(const k of [0,2,4])tone(g,t,mtof(deg(k)),s16*15,{w:pw,a:0.25,d:0.3,s:0.7,r:s16*6,v:0.035,lp:pw==='sawtooth'?1400:3000,vib:0.004});
  // bass
  const bassHit=dr>=3?(pos%2===0):dr>=2?(pos%4===0||pos===10):(pos===0||pos===8);if(bassHit)tone(g,t,mtof(deg(0)-24+(pos===8&&dr<2?7:0)),s16*1.6,{w:'triangle',a:0.004,d:0.08,s:0.5,r:s16*1.4,v:0.12});
  // lead melody (seeded per theme, repeats every 4 bars with variation)
  const ph=(bar%4)*16+pos;const r=rnd(cur.seed*31+ph,bar>>2&1);const dens=dr>=3?0.62:feel==='night'||feel==='frost'||feel==='eerie'?0.24:0.42;
  if(r<dens&&(pos%2===0||dr>=3)){const k=[0,2,4,1,3,5,6,7][Math.floor(rnd(cur.seed+ph,9)*8)];tone(g,t,mtof(deg(k)+12),s16*(dr>=3?1.4:2.4),{w:lw,a:0.008,d:0.06,s:0.5,r:s16*2,v:lw==='sawtooth'?0.04:0.06,lp:lw==='sine'?0:3600,vib:0.006});}
  if(feel==='sea'&&pos===0)noise(g,t,s16*12,{type:'lowpass',f:500,f2:1400,a:s16*6,s:0.4,r:s16*6,v:0.05});
  if(feel==='wind'&&pos===0&&bar%2===0)noise(g,t,s16*14,{type:'bandpass',f:800,f2:2200,q:3,a:s16*5,s:0.5,r:s16*7,v:0.035});
  // drums
  if(dr){if(pos===0||(dr>=3&&pos===8)||(dr===2&&pos===10))tone(g,t,110,0.18,{w:'sine',slide:0.35,a:0.002,d:0.05,s:0.3,r:0.15,v:0.28});
   if(dr>=2&&(pos===4||pos===12))noise(g,t,0.12,{f:1800,q:0.8,v:0.12,r:0.1});
   if(dr>=1&&pos%2===0)noise(g,t,0.03,{type:'highpass',f:7000,v:dr>=3?0.05:0.03,r:0.03});
   if(feel==='boss'&&pos%4===2)tone(g,t,mtof(deg(0)-12),0.3,{w:'sine',slide:0.6,v:0.15,r:0.25});}
  step++;nextT+=s16;}}
// ---- SFX
const TYPEFX={Fire:t=>{noise(sfx,t,0.5,{type:'lowpass',f:1600,f2:300,a:0.02,v:0.24,r:0.45});tone(sfx,t,180,0.4,{w:'sawtooth',slide:0.5,v:0.048,lp:900});},
 Tide:t=>{noise(sfx,t,0.45,{type:'bandpass',f:600,f2:2400,q:2,a:0.03,v:0.18,r:0.4});tone(sfx,t+0.05,500,0.2,{w:'sine',slide:2.2,v:0.06});},
 Leaf:t=>{for(let i=0;i<6;i++)noise(sfx,t+i*0.05,0.06,{f:3000+i*300,q:4,v:0.072,r:0.05});},
 Volt:t=>{for(let i=0;i<5;i++)tone(sfx,t+i*0.04,800+Math.random()*1600,0.05,{w:'square',v:0.048,r:0.04,s:0.2});noise(sfx,t,0.3,{type:'highpass',f:3000,v:0.12,r:0.25});},
 Stone:t=>{tone(sfx,t,90,0.3,{w:'sine',slide:0.5,v:0.21,r:0.25});noise(sfx,t,0.25,{type:'lowpass',f:700,v:0.21,r:0.2});},
 Gale:t=>{noise(sfx,t,0.6,{type:'bandpass',f:500,f2:3000,q:5,a:0.1,v:0.18,r:0.5});},
 Frost:t=>{for(let i=0;i<4;i++)tone(sfx,t+i*0.06,1800+i*400,0.12,{w:'triangle',v:0.042,r:0.12});noise(sfx,t,0.3,{type:'highpass',f:5000,v:0.072,r:0.3});},
 Dark:t=>{tone(sfx,t,140,0.6,{w:'sawtooth',slide:0.6,v:0.06,lp:500,vib:0.02});noise(sfx,t,0.5,{type:'lowpass',f:400,v:0.15,a:0.1,r:0.4});},
 Mind:t=>{tone(sfx,t,440,0.5,{w:'sine',v:0.072,vib:0.05,r:0.5});tone(sfx,t,660,0.5,{w:'sine',v:0.048,vib:0.07,r:0.5});},
 Metal:t=>{tone(sfx,t,1200,0.25,{w:'square',slide:0.8,v:0.048,r:0.25,lp:5000});noise(sfx,t,0.15,{type:'highpass',f:4000,v:0.12,r:0.12});},
 Light:t=>{[0,4,7,12].forEach((k,i)=>tone(sfx,t+i*0.05,mtof(76+k),0.4,{w:'triangle',v:0.048,r:0.4}));},
 Echo:t=>{[0,7,12,19].forEach((k,i)=>tone(sfx,t+i*0.07,mtof(60+k),0.6,{w:'sine',v:0.05,vib:0.03,r:0.6}));},
 Normal:t=>{noise(sfx,t,0.12,{type:'lowpass',f:1200,v:0.21,r:0.1});}};
const FX={select:t=>tone(sfx,t,880,0.06,{w:'square',v:0.06,r:0.05}),move:t=>tone(sfx,t,660,0.03,{w:'square',v:0.035,r:0.03}),back:t=>tone(sfx,t,440,0.08,{w:'square',slide:0.6,v:0.06,r:0.07}),
 blip:t=>tone(sfx,t,520+Math.random()*60,0.03,{w:'triangle',v:0.016,r:0.03}),door:t=>{noise(sfx,t,0.2,{type:'lowpass',f:500,v:0.3,r:0.18});tone(sfx,t+0.12,160,0.15,{w:'triangle',v:0.15,r:0.12});},
 heal:t=>[0,4,7,12,16].forEach((k,i)=>tone(sfx,t+i*0.09,mtof(72+k),0.3,{w:'triangle',v:0.09,r:0.3})),hit:t=>{noise(sfx,t,0.12,{type:'lowpass',f:1400,v:0.22,a:0.005,r:0.1});tone(sfx,t,160,0.12,{w:'triangle',slide:0.5,v:0.07,r:0.1});},
 crit:t=>{noise(sfx,t,0.25,{type:'lowpass',f:1800,v:0.28,a:0.006,r:0.2});tone(sfx,t,90,0.3,{w:'sine',slide:0.4,v:0.2,r:0.3});},super:t=>[0,7,12].forEach((k,i)=>tone(sfx,t+i*0.04,mtof(79+k),0.15,{w:'square',v:0.05,r:0.12})),
 faint:t=>tone(sfx,t,500,0.7,{w:'square',slide:0.2,v:0.08,r:0.6}),level:t=>[0,4,7,12].forEach((k,i)=>tone(sfx,t+i*0.08,mtof(72+k),0.2,{w:'triangle',v:0.06,r:0.18})),
 throw:t=>noise(sfx,t,0.3,{type:'bandpass',f:600,f2:2000,q:3,v:0.2,r:0.25}),wobble:t=>{tone(sfx,t,300,0.08,{w:'triangle',v:0.15,r:0.07});tone(sfx,t+0.1,260,0.08,{w:'triangle',v:0.12,r:0.07});},
 catch:t=>{[0,4,7,12,7,12].forEach((k,i)=>tone(sfx,t+i*0.1,mtof(67+k),0.18,{w:'square',v:0.07,r:0.16}));},breakfree:t=>noise(sfx,t,0.25,{f:1200,v:0.35,r:0.2}),
 shake:t=>{tone(sfx,t,40,2.2,{w:'sine',v:0.22,a:0.4,r:1.8,vib:0.1});noise(sfx,t,2.2,{type:'lowpass',f:160,v:0.25,a:0.4,r:1.8});},heart:t=>{tone(sfx,t,988,0.1,{w:'triangle',v:0.06,r:0.1});tone(sfx,t+0.09,1319,0.15,{w:'triangle',v:0.06,r:0.14});},
 status:t=>tone(sfx,t,330,0.5,{w:'sine',slide:1.6,v:0.08,vib:0.03,r:0.45}),appear:t=>noise(sfx,t,0.35,{type:'bandpass',f:400,f2:3000,v:0.2,r:0.3})};
A.play=function(n){if(!A.ok||A.ac.state!=='running')return;try{const t=A.ac.currentTime+0.005;(FX[n]||TYPEFX[n]||FX.select)(t);}catch(e){}};
A.attack=function(type){A.play(TYPEFX[type]?type:'Normal');};
let lastStep=0;A.step=function(tile){if(!A.ok||A.ac.state!=='running')return;const now=A.ac.currentTime;if(now-lastStep<0.12)return;lastStep=now;const t=now+0.005;
 if(tile===T.SNOW||tile===T.SNOWTALL||tile===T.ICE)noise(sfx,t,0.07,{type:'highpass',f:2500,v:0.08,r:0.06});else if(tile===T.SAND)noise(sfx,t,0.08,{type:'bandpass',f:5000,q:0.6,v:0.05,r:0.07});
 else if(tile===T.BRIDGE)tone(sfx,t,180,0.06,{w:'triangle',v:0.08,r:0.05});else if(tile===T.CAVE)noise(sfx,t,0.12,{type:'bandpass',f:900,q:3,v:0.07,r:0.12});else if(tile===T.TALL||tile===T.SNOWTALL)noise(sfx,t,0.1,{type:'bandpass',f:3500,q:1.5,v:0.07,r:0.09});
 else if(tile===T.PATH||tile===T.FLOOR||tile===T.CFLOOR)noise(sfx,t,0.04,{type:'bandpass',f:1500,q:2,v:0.06,r:0.04});else noise(sfx,t,0.06,{type:'lowpass',f:1200,v:0.05,r:0.05});};
// ---- ambience (birds, rain, wind, waves, fire crackle)
let brownBuf=null;function brown(){if(brownBuf)return brownBuf;const ac=A.ac,n=ac.sampleRate*4;brownBuf=ac.createBuffer(2,n,ac.sampleRate);for(let c=0;c<2;c++){const d=brownBuf.getChannelData(c);let l=0;for(let i=0;i<n;i++){l=(l+0.02*(Math.random()*2-1))/1.02;d[i]=l*3.2;}}return brownBuf;}
function loopNoise(key,ftype,f,q){if(ambNodes[key])return ambNodes[key];const ac=A.ac,s=ac.createBufferSource();s.buffer=key==='rain'?brown():noiseBuf;s.loop=true;const fl=ac.createBiquadFilter();fl.type=ftype;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(amb);s.start();
 const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=key==='waves'?0.12:0.25;lg.gain.value=key==='rain'?f*0.08:f*0.4;l.connect(lg);lg.connect(fl.frequency);l.start();return ambNodes[key]={g,fl};}
function drop(t,v,muff){const ac=A.ac;const os=ac.createOscillator(),g=ac.createGain(),p=ac.createStereoPanner?ac.createStereoPanner():null,lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=muff?700:2200;const f=muff?500+Math.random()*300:900+Math.random()*1400;os.type='sine';os.frequency.setValueAtTime(f,t);os.frequency.exponentialRampToValueAtTime(f*0.55,t+0.07);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.004);g.gain.exponentialRampToValueAtTime(0.0001,t+0.09);os.connect(lp);lp.connect(g);if(p){p.pan.value=Math.random()*1.6-0.8;g.connect(p);p.connect(amb);}else g.connect(amb);os.start(t);os.stop(t+0.12);}
A.ambient=function(st){if(!A.ok||A.ac.state!=='running')return;const t=A.ac.currentTime;const want={rain:st.rain?(st.indoor?0.03:0.07):0,wind:st.wind?0.18:0,waves:st.waves?0.22:0};
 for(const k in want){const n=loopNoise(k,k==='wind'?'bandpass':'lowpass',k==='rain'?1500:k==='wind'?700:500,k==='wind'?2:0.7);if(k==='rain')n.fl.frequency.setTargetAtTime(st.indoor?450:1500,t,0.8);n.g.gain.setTargetAtTime(want[k],t,k==='rain'?0.85:0.8);}// rain: ~2.5 s fade
 if(st.rain){const nd=st.indoor?(Math.random()<0.25?1:0):Math.floor(Math.random()*3);for(let i=0;i<nd;i++)drop(t+Math.random()*0.09,st.indoor?0.006:0.012,st.indoor);if(Math.random()<0.04)drop(t+Math.random()*0.09,st.indoor?0.012:0.025,true);}
 if(st.birds&&Math.random()<0.35){const f=2200+Math.random()*1800;for(let i=0;i<2+Math.random()*3;i++)tone(amb,t+i*0.09,f*(1+Math.random()*0.2),0.06,{w:'sine',slide:1.3,v:0.03,r:0.05});}
 if(st.fire&&Math.random()<0.8)for(let i=0;i<4;i++)noise(amb,t+Math.random()*0.4,0.02,{type:'highpass',f:2000+Math.random()*3000,v:0.06,r:0.02});};
})();
