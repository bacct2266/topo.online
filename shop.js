const SKINS=[
["Neon Cube",100,"◆"],["Plasma Cube",250,"◇"],["Cyber Cube",400,"⬢"],["Fire Cube",600,"♦"],
["Ice Cube",800,"❖"],["Galaxy Cube",1200,"✦"],["Shadow Cube",1600,"■"],["Rainbow Cube",2500,"⬣"]
];
function renderShop(){
 const s=save; document.getElementById("shopCoins").textContent=s.coins;
 document.getElementById("shopGrid").className="shop-grid";
 document.getElementById("shopGrid").innerHTML=SKINS.map((x,i)=>{
 const owned=s.purchases.includes(i), selected=s.skin===i;
 return `<div class="shop-item"><div class="skin-preview">${x[2]}</div><h3>${x[0]}</h3><p>${selected?"EQUIPPED":owned?"OWNED":"◆ "+x[1]}</p><button data-skin="${i}">${selected?"EQUIPPED":owned?"EQUIP":"BUY"}</button></div>`
 }).join("");
 document.querySelectorAll("[data-skin]").forEach(b=>b.onclick=()=>buySkin(+b.dataset.skin));
}
function buySkin(i){
 const [name,cost]=SKINS[i];
 if(save.purchases.includes(i)){save.skin=i;persist();renderShop();return}
 if(save.coins<cost)return showModal("NOT ENOUGH COINS","Collect more coins to buy this skin.",[{t:"OK",f:closeModal}]);
 save.coins-=cost;save.purchases.push(i);save.skin=i;persist();renderShop();AudioFX.coin();
}