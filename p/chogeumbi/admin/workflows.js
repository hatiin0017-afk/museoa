'use strict';
function initWorkflows(){
  const A=window.GEUMBI_ADMIN;if(!A)return;
  const $=s=>document.querySelector(s), node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
  const button=(label,action)=>{const b=node('button',label);b.type='button';b.addEventListener('click',action);return b;};
  document.querySelectorAll('[data-pane]').forEach(button=>button.addEventListener('click',()=>{
    const section=button.closest('.panel');
    section.querySelectorAll('[data-pane]').forEach(b=>{if(b===button)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    section.querySelectorAll('.subpanel').forEach(p=>p.hidden=p.id!==button.dataset.pane);
  }));
  function filterSchedules(){const month=$('#schedule-filter').value;let count=0;document.querySelectorAll('#schedule-list .record').forEach(card=>{const row=A.data.schedules.find(r=>r.id===card.dataset.rowId);card.hidden=!!month&&!row.date.startsWith(month);if(!card.hidden)count++;});$('#schedule-empty').hidden=count>0||!A.data.schedules.length;}
  $('#schedule-filter').value=GEUMBI.today().slice(0,7);$('#schedule-filter').addEventListener('change',filterSchedules);
  $('#schedule-all').addEventListener('click',()=>{$('#schedule-filter').value='';filterSchedules();});
  ['upbo-filter','upbo-season-filter','upbo-state-filter'].forEach(id=>$('#'+id).addEventListener(id==='upbo-filter'?'input':'change',renderUpbo));
  function renderUpbo(){
    const list=$('#upbo-list');list.replaceChildren();const query=$('#upbo-filter').value.trim().toLowerCase(),season=$('#upbo-season-filter').value,state=$('#upbo-state-filter').value;
    const rows=A.data.upbo.filter(r=>(!query||(r.nickname+' '+r.viewerId).toLowerCase().includes(query))&&(!season||r.season===season)&&(!state||r.status===state));
    $('#upbo-count').textContent=`${rows.length}건 · 남은 수량 ${rows.reduce((sum,r)=>sum+r.quantity,0)}개`;
    rows.forEach(r=>{
      const card=node('div','');card.className='record';card.dataset.rowId=r.id;
      const info=node('div','');info.append(node('strong',`${r.nickname} · ${r.item}`),node('p',`${r.viewerId} · ${r.season} · ${r.status}`));
      const stats=node('p',`누적 ${r.allocated} · 처리 ${r.completed} · 남음 ${r.quantity}`);stats.className='counts';info.append(stats);
      const actions=node('div','');actions.className='quick-actions';
      const done=button('1개 처리',()=>A.commit(d=>CHOGEUMBI_MODEL.finish(d,r.id)));done.disabled=r.quantity===0;
      const ready=button(r.status==='준비 완료'?'준비 취소':'준비완료',()=>A.commit(d=>{const row=d.upbo.find(x=>x.id===r.id);row.status=row.status==='준비 완료'?'대기':'준비 완료';}));ready.disabled=r.quantity===0;
      actions.append(button('+1',()=>A.commit(d=>CHOGEUMBI_MODEL.assign(d,r.memberId,r.typeId,r.season,1))),done,ready);
      const remove=button('삭제',()=>{if(confirm('이 배정을 삭제할까요?'))A.commit(d=>d.upbo=d.upbo.filter(x=>x.id!==r.id));});remove.className='delete';actions.append(remove);card.append(info,actions);list.append(card);
    });
    if(!rows.length)list.append(node('p','표시할 업보가 없습니다. 시청자와 종류를 등록한 뒤 배정해 주세요.'));
  }
  const schedule=A.forms.schedules;
  const times=$('#schedule-time');times.append(new Option('시간 없음',''));
  for(let h=0;h<24;h++)for(let m=0;m<60;m+=10){const t=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');times.append(new Option(t,t));}
  times.value='19:00';
  function categoryChanged(){const c=A.data.categories.find(c=>c.name===schedule.elements.type.value);schedule.elements.color.value=c?.color||'#c5e8c7';times.disabled=schedule.elements.type.value==='휴방';if(times.disabled)times.value='';else if(!times.value)times.value='19:00';}
  schedule.elements.type.addEventListener('change',categoryChanged);
  $('#category-form').addEventListener('submit',e=>{e.preventDefault();const f=e.target,name=f.elements.name.value.trim(),color=f.elements.color.value;if(!name)return;A.commit(d=>{const c=d.categories.find(c=>c.name===name);if(c)c.color=color;else d.categories.push({id:crypto.randomUUID(),name,color});d.schedules.filter(s=>s.type===name).forEach(s=>s.color=color);});});
  $('#member-form').addEventListener('submit',e=>{e.preventDefault();const f=e.target,nickname=f.elements.nickname.value.trim(),viewerId=f.elements.viewerId.value.trim();if(!nickname||!viewerId)return;A.commit(d=>{let m=d.members.find(m=>m.viewerId===viewerId);if(m){m.nickname=nickname;d.upbo.filter(r=>r.memberId===m.id).forEach(r=>r.nickname=nickname);}else d.members.push({id:crypto.randomUUID(),nickname,viewerId});});});
  $('#type-form').addEventListener('submit',e=>{e.preventDefault();const name=e.target.elements.name.value.trim();if(!name)return;A.commit(d=>{const t=d.taskTypes.find(t=>t.name===name);if(t)t.active=true;else d.taskTypes.push({id:crypto.randomUUID(),name,active:true});});});
  function members(){const select=$('#assign-member'),chosen=select.value,q=$('#member-search').value.trim().toLowerCase();select.replaceChildren(new Option('시청자를 선택해 주세요',''));A.data.members.filter(m=>(m.nickname+' '+m.viewerId).toLowerCase().includes(q)).forEach(m=>select.append(new Option(m.nickname+' · '+m.viewerId,m.id)));if([...select.options].some(o=>o.value===chosen))select.value=chosen;else if(select.options.length===2)select.selectedIndex=1;}
  $('#member-search').addEventListener('input',members);
  function render(){
    const data=A.data,selected=schedule.elements.type.value||'소통';schedule.elements.type.replaceChildren();data.categories.forEach(c=>schedule.elements.type.append(new Option(c.name,c.name)));schedule.elements.type.value=selected;categoryChanged();
    const cl=$('#category-list');cl.replaceChildren();data.categories.forEach(c=>{const chip=button(c.name,()=>{$('#category-form').elements.name.value=c.name;$('#category-form').elements.color.value=c.color;});chip.style.background=c.color;cl.append(chip);});
    members();$('#season-options').replaceChildren();[...new Set(data.upbo.map(r=>r.season))].forEach(s=>$('#season-options').append(new Option(s,s)));
    const ml=$('#member-list');ml.replaceChildren();data.members.forEach(m=>ml.append(button(m.nickname+' · '+m.viewerId,()=>{$('#member-form').elements.nickname.value=m.nickname;$('#member-form').elements.viewerId.value=m.viewerId;})));
    const tl=$('#type-list');tl.replaceChildren();data.taskTypes.forEach(t=>tl.append(button(t.name+(t.active===false?' · 중지':' · 사용 중'),()=>A.commit(d=>{d.taskTypes.find(x=>x.id===t.id).active=t.active===false;}))));
    const quick=$('#quick-types');quick.replaceChildren();data.taskTypes.filter(t=>t.active!==false).forEach(t=>{const card=node('div','');card.className='quick-type';card.append(node('strong',t.name));const amount=document.createElement('input');amount.type='number';amount.value='1';amount.min='1';amount.max='9999';amount.setAttribute('aria-label',t.name+' 추가 수량');card.append(amount,button('+ 누적',()=>A.commit(d=>CHOGEUMBI_MODEL.assign(d,$('#assign-member').value,t.id,$('#assign-season').value,Number(amount.value)))));quick.append(card);});
    const seasonFilter=$('#upbo-season-filter'),previousSeason=seasonFilter.value;seasonFilter.replaceChildren(new Option('전체 시즌',''));[...new Set(data.upbo.map(r=>r.season))].forEach(s=>seasonFilter.append(new Option(s,s)));seasonFilter.value=previousSeason;
    renderUpbo();filterSchedules();
    const history=$('#upbo-history');history.replaceChildren();[...data.history].reverse().forEach(h=>history.append(node('p',`${new Date(h.at).toLocaleString('ko-KR',{hour12:false})} · ${h.nickname} / ${h.item} / ${h.season} · ${h.action} ${h.delta>0?'+':''}${h.delta} · 남음 ${h.remaining}`)));if(!data.history.length)history.append(node('p','아직 처리 이력이 없습니다. 기존 데이터의 과거 이력은 생성하지 않습니다.'));
    document.querySelectorAll('#outfit-list .record').forEach((card,i)=>{const move=direction=>A.commit(d=>{const next=i+direction;if(next<0||next>=d.outfits.length)return;[d.outfits[i],d.outfits[next]]=[d.outfits[next],d.outfits[i]];});const up=button('↑',()=>move(-1)),down=button('↓',()=>move(1));up.setAttribute('aria-label',data.outfits[i].name+' 위로');down.setAttribute('aria-label',data.outfits[i].name+' 아래로');up.disabled=i===0;down.disabled=i===data.outfits.length-1;card.append(up,down);});
  }
  addEventListener('geumbi-admin-render',render);render();
}
if(window.GEUMBI_ADMIN)initWorkflows();else addEventListener('geumbi-admin-ready',initWorkflows,{once:true});
