const LEVELS=[
{name:"TOPO START",difficulty:"Easy",theme:"#19d9ff",speed:270,length:2600,gravity:1,mechanics:["spike","coin"],music:110},
{name:"NEON RUN",difficulty:"Easy",theme:"#ff4fd8",speed:300,length:3000,gravity:1,mechanics:["spike","block","pad"],music:125},
{name:"ELECTRIC CITY",difficulty:"Normal",theme:"#ffdd4d",speed:320,length:3400,gravity:1,mechanics:["laser","moving","coin"],music:140},
{name:"SKY JUMP",difficulty:"Normal",theme:"#7d8cff",speed:335,length:3700,gravity:1,mechanics:["gap","pad","ring"],music:150},
{name:"GRAVITY SHIFT",difficulty:"Hard",theme:"#7aff72",speed:350,length:4000,gravity:1,mechanics:["gravity","portal","spike"],music:160},
{name:"LASER ZONE",difficulty:"Hard",theme:"#ff5268",speed:370,length:4300,gravity:1,mechanics:["laser","moving","speed"],music:175},
{name:"CYBER FACTORY",difficulty:"Hard",theme:"#42a7ff",speed:390,length:4600,gravity:1,mechanics:["moving","falling","teleport"],music:185},
{name:"DARK PULSE",difficulty:"Very Hard",theme:"#c35cff",speed:415,length:5000,gravity:1,mechanics:["gravity","laser","enemy"],music:195},
{name:"INFINITE RUSH",difficulty:"Insane",theme:"#ff9a38",speed:445,length:5500,gravity:1,mechanics:["speed","teleport","enemy"],music:210},
{name:"TOPO FINAL",difficulty:"Extreme",theme:"#ffffff",speed:480,length:6100,gravity:1,mechanics:["gravity","laser","moving","teleport"],music:225}
];

function buildLevel(level){
  const arr=[]; let x=480, seed=level*7919;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  while(x<LEVELS[level].length-400){
    const gap=170+rand()*210; x+=gap;
    const type=LEVELS[level].mechanics[Math.floor(rand()*LEVELS[level].mechanics.length)];
    if(type==="spike") arr.push({type:"spike",x,y:430,w:34,h:40});
    else if(type==="block") arr.push({type:"block",x,y:380,w:80,h:80});
    else if(type==="laser") arr.push({type:"laser",x,y:285,w:12,h:195});
    else if(type==="moving") arr.push({type:"moving",x,y:300-rand()*100,w:90,h:25,amp:80+rand()*100,phase:rand()*6});
    else if(type==="falling") arr.push({type:"falling",x,y:350,w:100,h:25});
    else if(type==="gravity") arr.push({type:"gravity",x,y:330});
    else if(type==="teleport") arr.push({type:"teleport",x,y:300});
    else if(type==="speed") arr.push({type:"speed",x,y:330,dir:rand()>.5?1:-1});
    else if(type==="enemy") arr.push({type:"enemy",x,y:420,w:32,h:32});
    else if(type==="pad") arr.push({type:"pad",x,y:450});
    else if(type==="ring") arr.push({type:"ring",x,y:300});
    else arr.push({type:"coin",x,y:260-rand()*180});
    if(rand()>.62) arr.push({type:"coin",x:x+55,y:230-rand()*180});
    if(rand()>.82) arr.push({type:"secret",x:x+25,y:150-rand()*170});
  }
  return arr;
}