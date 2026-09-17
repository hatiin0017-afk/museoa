'use strict';
(() => {
  function config(settings,kind){
    const fallback=kind==='complete'?'행복 충전 완료! 양갱이에게 행운 가득 ♡':settings.luckMessage||'오늘도 금비와 웃는 하루 ♡',saved=settings.luck?.[kind];
    const messages=Array.isArray(saved?.messages)?saved.messages.filter(value=>typeof value==='string'&&value.trim()).slice(0,30).map(value=>value.trim().slice(0,65)):[];
    if(!messages.length)messages.push(fallback);
    return {messages,mode:saved?.mode==='random'?'random':'fixed',fixedIndex:Math.max(0,Math.min(messages.length-1,Number.isInteger(saved?.fixedIndex)?saved.fixedIndex:0))};
  }
  function pick(settings,kind,random=Math.random){const value=config(settings,kind);return value.messages[value.mode==='random'?Math.min(value.messages.length-1,Math.floor(random()*value.messages.length)):value.fixedIndex];}
  window.GEUMBI_LUCK={config,pick};
})();
