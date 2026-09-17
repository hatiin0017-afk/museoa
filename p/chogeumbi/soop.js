'use strict';
(() => {
  const cache=new Map(),profiles=new Map();
  const valid=id=>/^[a-z0-9_-]{2,40}$/i.test(id||'');
  const avatar=id=>valid(id)?`https://profile.img.sooplive.com/LOGO/${id.slice(0,2).toLowerCase()}/${id.toLowerCase()}/${id.toLowerCase()}.jpg`:'';
  async function lookup(id){
    id=String(id||'').trim().toLowerCase();
    if(!valid(id)||id.startsWith('sample_'))return null;
    const hit=cache.get(id);if(hit&&Date.now()-hit.at<600000)return hit.promise;
    const promise=(async()=>{
      try{
        const response=await fetch(`https://chapi.sooplive.co.kr/api/${encodeURIComponent(id)}/station`,{credentials:'omit',signal:AbortSignal.timeout(5000)});
        if(!response.ok)return null;
        const data=await response.json(),nickname=data.station?.user_nick;
        if(typeof nickname!=='string'||!nickname.trim())return null;
        const profile={viewerId:id,nickname:nickname.slice(0,60),image:avatar(id)};profiles.set(id,profile);return profile;
      }catch{return null;}
    })();cache.set(id,{at:Date.now(),promise});return promise;
  }
  function picture(id,nickname){
    const frame=document.createElement('span');frame.className='viewer-avatar';frame.setAttribute('aria-hidden','true');
    frame.textContent=String(nickname||'?').slice(0,1);
    if(valid(id)&&!id.startsWith('sample_')){
      const image=new Image();image.alt='';image.loading='lazy';image.referrerPolicy='no-referrer';
      image.addEventListener('error',()=>image.remove(),{once:true});image.src=avatar(id);frame.append(image);
    }
    return frame;
  }
  window.GEUMBI_SOOP={lookup,picture,valid,nickname:(id,fallback)=>profiles.get(String(id).toLowerCase())?.nickname||fallback};
})();
