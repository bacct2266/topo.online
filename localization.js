const I18N={
en:{PLAY:"PLAY",LEVELS:"LEVELS",HOW:"HOW TO PLAY",SHOP:"SHOP",SETTINGS:"SETTINGS",STATS:"STATISTICS"},
he:{PLAY:"שחק",LEVELS:"שלבים",HOW:"איך משחקים",SHOP:"חנות",SETTINGS:"הגדרות",STATS:"סטטיסטיקות"},
ar:{PLAY:"العب",LEVELS:"المراحل",HOW:"طريقة اللعب",SHOP:"المتجر",SETTINGS:"الإعدادات",STATS:"الإحصائيات"},
es:{PLAY:"JUGAR",LEVELS:"NIVELES",HOW:"CÓMO JUGAR",SHOP:"TIENDA",SETTINGS:"AJUSTES",STATS:"ESTADÍSTICAS"},
fr:{PLAY:"JOUER",LEVELS:"NIVEAUX",HOW:"COMMENT JOUER",SHOP:"BOUTIQUE",SETTINGS:"PARAMÈTRES",STATS:"STATISTIQUES"}
};
function applyLanguage(lang){
 document.documentElement.lang=lang; document.body.classList.toggle("rtl",lang==="he"||lang==="ar");
 const t=I18N[lang]||I18N.en;
 const buttons=document.querySelectorAll(".menu-buttons button");
 if(buttons.length>=6){buttons[0].textContent=t.PLAY;buttons[1].textContent=t.LEVELS;buttons[2].textContent=t.HOW;buttons[3].textContent=t.SHOP;buttons[4].textContent=t.SETTINGS;buttons[5].textContent=t.STATS}
}