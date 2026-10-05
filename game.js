const defaultSave={unlocked:1,completed:[],coins:0,purchases:[0],skin:0,lang:"en",settings:{music:true,sfx:true,volume:.35,graphics:"High",controls:"Keyboard"},best:{},stats:{play:0,attempts:0,levels:0,secret:0,deaths:0}};
let save=JSON.parse(localStorage.getItem("topoSave")||"null")||structuredClone(defaultSave);
function persist(){localStorage.setItem("topoSave",JSON.stringify(save))}
const $=id=>document.getElementById(id);
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.add("hidden"));$(id).classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden")}
function showModal(title,body,buttons=[]){$("modalTitle").textContent=title;$("modalBody").innerHTML=body;$("modalButtons").innerHTML=buttons.map((b,i)=>`<button id="mb${i}">${b.t}</button>`).join("");$("modal").classList.remove("hidden");buttons.forEach((b,i)=>$("mb"+i).onclick=b.f)}
function renderLevels(){
 const grid=$("levelGrid");grid.className="level-grid";
 grid.innerHTML=LEVELS.map((l,i)=>{const n=i+1,un=n<=save.unlocked,b=save.best[n]||{pct:0,score:0,attempts:0,coins:0};
 return `<div class="level-card ${un?"":"locked"}"><h2>${n}. ${l.name}</h2><span class="badge">${l.difficulty}</span><p>Best: ${b.pct||0}% · Attempts: ${b.attempts||0}</p><div class="bar"><i style="width:${b.pct||0}%"></i></div>${un?`<button class="play" data-level="${i}">PLAY</button>`:`<span class="play">🔒</span>`}</div>`}).join("");
 document.querySelectorAll("[data-level]").forEach(b=>b.onclick=()=>startGame(+b.dataset.level));
}
function renderStats(){
 const s=save.stats;
 $("statsGrid").className="stats-grid";
 $("statsGrid").innerHTML=[["TOTAL PLAY TIME",Math.floor(s.play/60)+"m"],["TOTAL ATTEMPTS",s.attempts],["LEVELS COMPLETED",s.levels],["TOTAL COINS",save.coins],["BEST SCORE",Math.max(0,...Object.values(save.best).map(x=>x.score||0))],["BEST LEVEL",save.completed.length?Math.max(...save.completed):0],["SECRET COINS",s.secret],["DEATHS",s.deaths]].map(x=>`<div class="stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join("");
}
function initSettings(){
 $("musicToggle").checked=save.settings.music;$("sfxToggle").checked=save.settings.sfx;$("volume").value=save.settings.volume;
 $("graphics").value=save.settings.graphics;$("controls").value=save.settings.controls;$("language").value=save.lang;
 $("musicToggle").onchange=e=>{save.settings.music=e.target.checked;AudioFX.setEnabled(save.settings.sfx);persist()};
 $("sfxToggle").onchange=e=>{save.settings.sfx=e.target.checked;AudioFX.setEnabled(e.target.checked);persist()};
 $("volume").oninput=e=>{save.settings.volume=+e.target.value;persist()};
 $("graphics").onchange=e=>{save.settings.graphics=e.target.value;persist()};
 $("controls").onchange=e=>{save.settings.controls=e.target.value;persist()};
 $("language").onchange=e=>{save.lang=e.target.value;persist();applyLanguage(save.lang)};
 $("fullscreen").onclick=()=>document.documentElement.requestFullscreen?.();
 $("reset").onclick=()=>showModal("RESET PROGRESS?","This will permanently delete local progress.",[{t:"CANCEL",f:closeModal},{t:"RESET",f:()=>{localStorage.removeItem("topoSave");location.reload()}}]);
}
document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{const a=b.dataset.action;AudioFX.button();
 if(a==="menu")show("menu"); if(a==="levels"){renderLevels();show("levels")} if(a==="how")show("how"); if(a==="shop"){renderShop();show("shop")}
 if(a==="settings"){initSettings();show("settings")} if(a==="stats"){renderStats();show("stats")} if(a==="editor"){initEditor();show("editor")}
 if(a==="play")startGame(0)
});
$("pauseBtn").onclick=()=>togglePause();

let canvas=$("gameCanvas"),ctx=canvas.getContext("2d"),g={running:false,paused:false,level:0,objects:[],player:null,start:0,worldX:0,attempt:0,coins:0,secret:0};
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
addEventListener("resize",resize);resize();

function startGame(i){
 g.level=i;g.objects=buildLevel(i);g.worldX=0;g.attempt=(save.best[i+1]?.attempts||0)+1;g.coins=0;g.secret=0;g.running=true;g.paused=false;
 g.player={x:120,y:390,w:34,h:34,vy:0,gravity:1,ground:false,trail:[]};save.stats.attempts++;persist();show("game");$("levelHud").textContent=`LEVEL ${i+1} — ${LEVELS[i].name}`;$("attemptsHud").textContent=g.attempt;AudioFX.setEnabled(save.settings.sfx);
 const c=$("countdown");c.classList.remove("hidden");let n=3;c.textContent=n;const timer=setInterval(()=>{n--;if(n===0){clearInterval(timer);c.classList.add("hidden");g.start=performance.now()}else c.textContent=n},550);
 requestAnimationFrame(loop);
}
function jump(){if(!g.running||g.paused)return;if(g.player.ground||g.player.gravity<0){g.player.vy=-610*g.player.gravity;g.player.ground=false;AudioFX.jump()}}
addEventListener("keydown",e=>{if(["Space","KeyW"].includes(e.code)){e.preventDefault();jump()}if(e.code==="Escape")togglePause()});
canvas.addEventListener("pointerdown",jump);
function togglePause(){if(!g.running)return;g.paused=!g.paused;if(g.paused)showModal("PAUSED","The game is paused.",[{t:"RESUME",f:()=>{closeModal();g.paused=false}},{t:"RESTART",f:()=>{closeModal();startGame(g.level)}},{t:"LEVEL SELECT",f:()=>{closeModal();g.running=false;renderLevels();show("levels")}}]);else closeModal()}
function rectHit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function die(){
 if(!g.running)return;g.running=false;save.stats.deaths++;save.stats.play+=Math.max(0,(performance.now()-g.start)/1000);persist();AudioFX.die();
 showModal("TRY AGAIN",`<p>Reached <b>${Math.floor(g.worldX/LEVELS[g.level].length*100)}%</b> · Coins ${g.coins}</p>`,[{t:"RESTART",f:()=>{closeModal();startGame(g.level)}},{t:"LEVEL SELECT",f:()=>{closeModal();renderLevels();show("levels")}},{t:"MAIN MENU",f:()=>{closeModal();show("menu")}}])
}
function complete(){
 g.running=false;const n=g.level+1,pct=100,time=(performance.now()-g.start)/1000,score=Math.max(0,Math.round(10000+g.coins*500-time*20-g.attempt*40));
 save.coins+=g.coins;save.completed=[...new Set([...save.completed,n])];save.unlocked=Math.min(10,Math.max(save.unlocked,n+1));save.stats.levels=save.completed.length;save.stats.secret+=g.secret;
 const old=save.best[n]||{score:0};save.best[n]={pct,score:Math.max(old.score,score),attempts:g.attempt,coins:g.coins,time};persist();AudioFX.win();
 showModal("LEVEL COMPLETE!",`<p>Score: <b>${score}</b></p><p>Coins: <b>${g.coins}</b> · Time: <b>${time.toFixed(2)}s</b></p><p>Attempts: <b>${g.attempt}</b></p>`,[
 {t:n<10?"NEXT LEVEL":"LEVEL SELECT",f:()=>{closeModal();n<10?startGame(g.level+1):(renderLevels(),show("levels"))}},
 {t:"REPLAY",f:()=>{closeModal();startGame(g.level)}},{t:"LEVEL SELECT",f:()=>{closeModal();renderLevels();show("levels")}}])
}
let last=0;
function loop(ts){
 if(!g.running)return;requestAnimationFrame(loop);if(g.paused||ts<g.start)return;
 const dt=Math.min(.025,(ts-last||16)/1000);last=ts;const l=LEVELS[g.level],W=innerWidth,H=innerHeight;
 g.worldX+=l.speed*dt;g.player.vy+=900*g.player.gravity*dt;g.player.y+=g.player.vy*dt;g.player.ground=false;
 const floor=H-105;if(g.player.y+g.player.h>=floor&&g.player.gravity>0){g.player.y=floor-g.player.h;g.player.vy=0;g.player.ground=true}
 if(g.player.y<=70&&g.player.gravity<0){g.player.y=70;g.player.vy=0;g.player.ground=true}
 const sx=g.worldX-g.player.x+120;
 ctx.clearRect(0,0,W,H);ctx.fillStyle="#070a17";ctx.fillRect(0,0,W,H);
 ctx.fillStyle=l.theme+"18";for(let x=-(sx%100);x<W;x+=100){ctx.fillRect(x,0,2,H)}
 ctx.fillStyle=l.theme;ctx.fillRect(0,floor,W,4);ctx.fillStyle="#11182d";ctx.fillRect(0,floor+4,W,H-floor);
 for(const o of g.objects){
   const ox=o.x-sx, oy=o.y;
   if(ox<-120||ox>W+120)continue;
   if(o.type==="moving")o.y=300+Math.sin(ts/500+o.phase)*o.amp;
   if(o.type==="falling"&&o.touched)o.y+=120*dt;
   drawObject(o,ox,oy,l.theme);
   const box={x:ox,y:oy,w:o.w||30,h:o.h||30};
   const pb={x:g.player.x,y:g.player.y,w:g.player.w,h:g.player.h};
   if(rectHit(pb,box)){
    if(["spike","block","laser","moving","falling","enemy"].includes(o.type))return die();
    if(o.type==="coin"||o.type==="secret"){o.collected=true;g.coins++;if(o.type==="secret")g.secret++;AudioFX.coin()}
    if(o.type==="pad"&&g.player.vy>0){g.player.vy=-850;AudioFX.jump()}
    if(o.type==="ring"){g.player.vy=-700;AudioFX.jump()}
    if(o.type==="gravity"){g.player.gravity*=-1;AudioFX.portal()}
    if(o.type==="speed"){l.speed=Math.max(180,l.speed+(o.dir*60));AudioFX.portal()}
    if(o.type==="teleport"){g.worldX+=400;AudioFX.portal()}
   }
 }
 if(g.worldX>=l.length)return complete();
 const pct=Math.min(100,g.worldX/l.length*100);$("percent").textContent=Math.floor(pct)+"%";$("progressBar").style.width=pct+"%";$("coinsHud").textContent=g.coins;
 drawPlayer(l.theme);g.player.trail.push([g.player.x,g.player.y]);if(g.player.trail.length>12)g.player.trail.shift();
}
function drawObject(o,x,y,c){
 if(o.collected)return;ctx.save();ctx.translate(x,y);
 if(o.type==="spike"){ctx.fillStyle="#ff5268";ctx.beginPath();ctx.moveTo(0,o.h);ctx.lineTo(o.w/2,0);ctx.lineTo(o.w,o.h);ctx.closePath();ctx.fill()}
 else if(o.type==="coin"||o.type==="secret"){ctx.strokeStyle=o.type==="secret"?"#fff":"#ffe66d";ctx.lineWidth=5;ctx.beginPath();ctx.arc(16,16,13,0,7);ctx.stroke()}
 else if(o.type==="laser"){ctx.fillStyle="#ff466d";ctx.shadowBlur=18;ctx.shadowColor="#ff466d";ctx.fillRect(0,0,o.w,o.h)}
 else if(o.type==="gravity"||o.type==="teleport"||o.type==="speed"){ctx.strokeStyle=c;ctx.lineWidth=6;ctx.beginPath();ctx.arc(16,16,14,0,7);ctx.stroke();ctx.fillStyle=c;ctx.fillText(o.type==="gravity"?"↕":o.type==="teleport"?"↗":"»",9,22)}
 else if(o.type==="pad"||o.type==="ring"){ctx.fillStyle="#5df4ff";ctx.fillRect(0,10,o.w||32,o.h||18)}
 else{ctx.fillStyle=c;ctx.shadowBlur=15;ctx.shadowColor=c;ctx.fillRect(0,0,o.w||50,o.h||30)}
 ctx.restore();
}
function drawPlayer(c){
 const p=g.player;for(let i=0;i<p.trail.length;i++){ctx.globalAlpha=i/p.trail.length*.25;ctx.fillStyle=c;ctx.fillRect(p.trail[i][0]-i*1,p.trail[i][1],p.w,p.h)}ctx.globalAlpha=1;
 ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);ctx.rotate(performance.now()/250);ctx.fillStyle="#fff";ctx.shadowBlur=20;ctx.shadowColor=c;ctx.fillRect(-17,-17,34,34);ctx.fillStyle=c;ctx.fillRect(-7,-7,14,14);ctx.restore()
}
function initEditor(){
 const ec=$("editorCanvas"),e=ec.getContext("2d");let tool="block",objects=[];
 document.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll("[data-tool]").forEach(x=>x.classList.remove("active"));b.classList.add("active")});
 function render(){e.fillStyle="#080b18";e.fillRect(0,0,ec.width,ec.height);e.strokeStyle="#182244";for(let x=0;x<900;x+=45){e.beginPath();e.moveTo(x,0);e.lineTo(x,360);e.stroke()}for(let y=0;y<360;y+=45){e.beginPath();e.moveTo(0,y);e.lineTo(900,y);e.stroke()}objects.forEach(o=>{e.fillStyle=o.type==="spike"?"#ff5268":o.type==="coin"?"#ffe66d":"#43dcff";e.fillRect(o.x,o.y,o.w||35,o.h||35)})}
 ec.onpointerdown=ev=>{const r=ec.getBoundingClientRect(),x=Math.floor((ev.clientX-r.left)/45)*45,y=Math.floor((ev.clientY-r.top)/45)*45;if(tool==="erase")objects=objects.filter(o=>o.x!==x||o.y!==y);else objects.push({type:tool,x,y,w:tool==="spike"?35:45,h:tool==="spike"?45:45});render()};render();
 $("saveCustom").onclick=()=>{localStorage.setItem("topoCustom",JSON.stringify(objects));showModal("SAVED","Your custom level was saved locally.",[{t:"OK",f:closeModal}])};
 $("testCustom").onclick=()=>{localStorage.setItem("topoCustom",JSON.stringify(objects));showModal("TEST LEVEL","Custom editor testing is saved locally. Use the saved layout as your own level data.",[{t:"OK",f:closeModal}])};
}
applyLanguage(save.lang);initSettings();