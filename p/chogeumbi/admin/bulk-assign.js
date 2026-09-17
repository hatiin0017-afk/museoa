'use strict';
function initBulkAssign(){
  const A=window.GEUMBI_ADMIN;if(!A)return;const form=document.querySelector('#bulk-assign-form'),result=document.querySelector('#bulk-assign-result');let busy=false;
  function options(){
    if(busy)return;const type=form.elements.type,season=form.elements.season,oldType=type.value,oldSeason=season.value;
    type.replaceChildren(new Option('업보 선택',''));A.data.taskTypes.filter(t=>!t.deleted&&t.active!==false).forEach(t=>type.append(new Option(t.name,t.id)));if([...type.options].some(o=>o.value===oldType))type.value=oldType;
    season.replaceChildren(new Option('배정할 시즌 선택',''));A.data.seasons.forEach(s=>season.append(new Option(s,s)));const selected=oldSeason||document.querySelector('#assign-season').value;if([...season.options].some(o=>o.value===selected))season.value=selected;
  }
  document.querySelector('#assign-season').addEventListener('change',()=>{if(!busy)form.elements.season.value=document.querySelector('#assign-season').value;});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;const typeId=form.elements.type.value,season=form.elements.season.value,ids=[...new Set(form.elements.ids.value.split(/[\s,;]+/).map(id=>id.trim().toLowerCase()).filter(Boolean))];
    if(!typeId||!season){result.textContent='업보와 배정할 시즌을 선택해 주세요.';return;}if(!ids.length||ids.length>100){result.textContent='한 번에 아이디 1~100개를 입력해 주세요.';return;}
    busy=true;form.querySelectorAll('input,textarea,select,button').forEach(e=>e.disabled=true);const profiles=[],failed=[];
    try{
      for(let start=0;start<ids.length;start+=3){const chunk=ids.slice(start,start+3);const responses=await Promise.all(chunk.map(async id=>({id,profile:GEUMBI_SOOP.valid(id)?await GEUMBI_SOOP.lookup(id):null})));responses.forEach(({id,profile})=>{if(profile)profiles.push(profile);else failed.push(id);});result.textContent=`프로필 조회 ${Math.min(start+3,ids.length)}/${ids.length} · 성공 ${profiles.length}명`;}
      if(!profiles.length){result.textContent='프로필 조회에 실패했습니다. 아이디와 연결 상태를 확인해 주세요.\n'+failed.join('\n');return;}
      const saved=await A.commit(data=>CHOGEUMBI_MODEL.assignProfiles(data,profiles,typeId,season));
      if(saved){form.elements.ids.value=failed.join('\n');result.textContent=`${profiles.length}명에게 ${season} 업보를 각 1개씩 배정했습니다.`+(failed.length?`\n조회 실패 ${failed.length}명 (입력란에 남김):\n${failed.join('\n')}`:'');}
      else result.textContent='배정 저장을 완료하지 못했습니다. 입력은 유지했습니다. 상단 안내를 확인해 주세요.';
    }catch(error){result.textContent=error.message||'조회 중 오류가 발생했습니다. 입력을 확인해 주세요.';}
    finally{busy=false;form.querySelectorAll('input,textarea,select,button').forEach(e=>e.disabled=false);options();}
  });
  addEventListener('geumbi-admin-render',options);options();
}
if(window.GEUMBI_ADMIN)initBulkAssign();else addEventListener('geumbi-admin-ready',initBulkAssign,{once:true});
