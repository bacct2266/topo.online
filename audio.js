const AudioFX=(()=>{
 let ctx=null, master=.35, enabled=true;
 function init(){if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)()}
 function tone(freq,dur=.08,type="square",gain=.08){if(!enabled)return;init();const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur)}
 return {setEnabled:v=>enabled=v,setVolume:v=>master=v,jump:()=>tone(430,.08,"square",.06),coin:()=>{tone(700,.05,"sine",.07);setTimeout(()=>tone(950,.07,"sine",.05),35)},portal:()=>tone(220,.15,"sawtooth",.04),button:()=>tone(330,.04,"square",.04),win:()=>{tone(520,.1,"sine",.07);setTimeout(()=>tone(780,.18,"sine",.06),100)},die:()=>{tone(150,.18,"sawtooth",.07);setTimeout(()=>tone(90,.2,"sawtooth",.05),80)}}
})();