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
  $('#assign-member').addEventListener('change',renderUpbo);$('#assign-season').addEventListener('change',()=>{members();renderUpbo();});
  function typeColor(type){return /^#[0-9a-f]{6}$/i.test(type?.color||'')?type.color:'#c5e8c7';}
  const memoDrafts=new Map();
  function renderUpbo(){
    const list=$('#upbo-list'),quick=$('#quick-types'),header=$('#selected-viewer');list.replaceChildren();quick.replaceChildren();header.replaceChildren();
    renderOverview($('#upbo-overview'),$('#assign-season').value);
    const member=A.data.members.find(m=>m.id===$('#assign-member').value),season=$('#assign-season').value.trim();
    if(!member){$('#upbo-count').textContent='먼저 시청자를 선택해 주세요.';$('#assigned-heading').hidden=true;return;}
    $('#assigned-heading').hidden=false;header.append(GEUMBI_SOOP.picture(member.viewerId,member.nickname),node('strong',member.nickname),node('small',member.viewerId));
    const rows=A.data.upbo.filter(r=>r.memberId===member.id&&r.season===season);
    $('#upbo-count').textContent=`${season||'시즌을 입력해 주세요'} · ${rows.length}종 · 남은 수량 ${rows.reduce((sum,r)=>sum+r.quantity,0)}개`;
    rows.forEach(r=>{
      const type=A.data.taskTypes.find(t=>t.id===r.typeId),card=node('div','');card.className='record';card.dataset.rowId=r.id;card.style.setProperty('--type-color',typeColor(type));
      const info=node('div','');info.append(node('strong',r.item),node('p',r.status));const stats=node('p',`누적 ${r.allocated} · 처리 ${r.completed} · 남음 ${r.quantity}`);stats.className='counts';info.append(stats);
      const actions=node('div','');actions.className='quick-actions';
      const plus=button('+1',()=>A.commit(d=>CHOGEUMBI_MODEL.assign(d,member.id,r.typeId,season,1)));plus.disabled=!type||type.deleted||type.active===false;
      const minus=button('−1',()=>A.commit(d=>CHOGEUMBI_MODEL.unassign(d,r.id)));minus.disabled=r.quantity===0;minus.title='배정 취소 (완료 횟수는 유지)';
      const done=button('1개 처리',()=>A.commit(d=>CHOGEUMBI_MODEL.finish(d,r.id)));done.disabled=r.quantity===0;
      const ready=button(r.status==='준비 완료'?'준비 취소':'준비완료',()=>A.commit(d=>{const row=d.upbo.find(x=>x.id===r.id);row.status=row.status==='준비 완료'?'대기':'준비 완료';}));ready.disabled=r.quantity===0;
      const remove=button('삭제',()=>{if(confirm(`${r.item} 배정을 삭제할까요? 남은 ${r.quantity}개와 완료 ${r.completed}개가 집계에서 제외됩니다. 처리 이력은 유지됩니다.`))A.commit(d=>{d.upbo=d.upbo.filter(row=>row.id!==r.id);});});remove.className='delete';
      const memo=node('div','');memo.className='upbo-private-memo';const label=node('label','비공개 메모'),input=document.createElement('textarea');input.rows=2;input.maxLength=1000;input.placeholder='스트리머·관리자만 볼 수 있어요';input.value=memoDrafts.get(r.id)??r.adminMemo??'';label.append(input);
      const saveMemo=button('메모 저장',async()=>{const value=input.value.trim();memoDrafts.set(r.id,value);const saved=await A.commit(d=>{const row=d.upbo.find(row=>row.id===r.id);if(!row)throw new Error('삭제된 업보입니다. 새로고침해 주세요.');row.adminMemo=value;});if(saved){memoDrafts.delete(r.id);renderUpbo();}});
      const deleteMemo=button('메모 삭제',async()=>{const saved=await A.commit(d=>{const row=d.upbo.find(row=>row.id===r.id);if(!row)throw new Error('삭제된 업보입니다. 새로고침해 주세요.');delete row.adminMemo;});if(saved){memoDrafts.delete(r.id);renderUpbo();}});deleteMemo.className='delete';deleteMemo.disabled=!input.value&&!r.adminMemo;
      saveMemo.disabled=input.value===(r.adminMemo||'');input.addEventListener('input',()=>{memoDrafts.set(r.id,input.value);saveMemo.disabled=input.value===(r.adminMemo||'');deleteMemo.disabled=!input.value&&!r.adminMemo;});memo.append(label,saveMemo,deleteMemo);
      const heading=node('div','');heading.className='upbo-card-heading';heading.append(info,memo);
      actions.append(plus,minus,done,ready,remove);card.append(heading,actions);list.append(card);
    });
    if(!rows.length)list.append(node('p','이 시즌에 배정된 업보가 없습니다. 아래 종류를 눌러 추가하세요.'));
    A.data.taskTypes.filter(t=>t.active!==false&&!t.deleted).forEach(t=>{const add=button(t.name+' +1',()=>A.commit(d=>CHOGEUMBI_MODEL.assign(d,member.id,t.id,season,1)));add.className='type-add';add.style.setProperty('--type-color',typeColor(t));add.disabled=!season;quick.append(add);});
    if(!quick.children.length)quick.append(node('p','업보 종류 탭에서 항목을 먼저 등록해 주세요.'));
  }
  const schedule=A.forms.schedules;
  const times=$('#schedule-time');times.append(new Option('시간 없음',''));
  for(let h=0;h<24;h++)for(let m=0;m<60;m+=10){const t=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');times.append(new Option(t,t));}
  times.value='19:00';
  function categoryChanged(){const c=A.data.categories.find(c=>c.name===schedule.elements.type.value);schedule.elements.color.value=c?.color||'#c5e8c7';times.disabled=schedule.elements.type.value==='휴방';if(times.disabled)times.value='';else if(!times.value)times.value='19:00';}
  schedule.elements.type.addEventListener('change',categoryChanged);
  $('#category-form').addEventListener('submit',e=>{e.preventDefault();const f=e.target,name=f.elements.name.value.trim(),color=f.elements.color.value;if(!name)return;A.commit(d=>{const c=d.categories.find(c=>c.name===name);if(c)c.color=color;else d.categories.push({id:crypto.randomUUID(),name,color});d.schedules.filter(s=>s.type===name).forEach(s=>s.color=color);});});
  $('#lookup-soop').addEventListener('click',async()=>{
    const form=$('#member-form'),id=form.elements.viewerId.value.trim(),result=$('#soop-member-preview'),lookup=$('#lookup-soop');
    if(!GEUMBI_SOOP.valid(id)){result.textContent='SOOP 아이디를 확인해 주세요.';return;}
    lookup.disabled=true;result.textContent='프로필을 불러오는 중…';
    try{const profile=await GEUMBI_SOOP.lookup(id);if(form.elements.viewerId.value.trim()!==id)return;
      if(!profile){result.textContent='프로필 조회가 되지 않습니다. 아이디를 확인하거나 닉네임을 직접 입력해 주세요.';return;}
      form.elements.nickname.value=profile.nickname;result.replaceChildren(GEUMBI_SOOP.picture(profile.viewerId,profile.nickname),node('span',profile.nickname+' · 시청자 저장을 눌러 반영하세요.'));
    }finally{lookup.disabled=false;}
  });
  $('#member-form').addEventListener('submit',e=>{e.preventDefault();const f=e.target,nickname=f.elements.nickname.value.trim(),viewerId=f.elements.viewerId.value.trim();if(!nickname||!viewerId)return;A.commit(d=>{let m=d.members.find(m=>m.viewerId===viewerId);if(m){m.nickname=nickname;d.upbo.filter(r=>r.memberId===m.id).forEach(r=>r.nickname=nickname);}else d.members.push({id:crypto.randomUUID(),nickname,viewerId});});});
  $('#new-upbo-type').addEventListener('click',()=>{$('#type-form').reset();$('#type-form').elements.id.value='';});
  $('#type-form').addEventListener('submit',async e=>{
    e.preventDefault();const form=e.target,name=form.elements.name.value.trim(),color=form.elements.color.value,id=form.elements.id.value;if(!name)return;
    if(await A.commit(d=>{let t=id?d.taskTypes.find(t=>t.id===id):d.taskTypes.find(t=>t.name===name);if(d.taskTypes.some(other=>other.name===name&&other.id!==t?.id&&!other.deleted))throw new Error('이미 등록된 종류 이름입니다.');if(t){t.name=name;t.color=color;t.active=true;t.deleted=false;d.upbo.filter(r=>r.typeId===t.id).forEach(r=>r.item=name);}else d.taskTypes.push({id:crypto.randomUUID(),name,color,active:true});})){form.reset();form.elements.id.value='';}
  });
  function memberTotal(member,season){return A.data.upbo.filter(r=>r.memberId===member.id&&(!season||r.season===season)).reduce((n,r)=>n+r.quantity,0);}
  function orderedMembers(){return [...A.data.members].sort((a,b)=>memberTotal(b,$('#assign-season').value)-memberTotal(a,$('#assign-season').value)||a.nickname.localeCompare(b.nickname,'ko'));}
  function members(){const select=$('#assign-member'),chosen=select.value;select.replaceChildren(new Option('시청자를 선택해 주세요',''));orderedMembers().forEach(m=>select.append(new Option(`${m.nickname} (${m.viewerId}) · 남음 ${memberTotal(m,$('#assign-season').value)}`,m.id)));if([...select.options].some(o=>o.value===chosen))select.value=chosen;}
  let searchIndex=-1;
  function closeMembers(){$('#member-drop').hidden=true;$('#member-search').setAttribute('aria-expanded','false');$('#member-search').removeAttribute('aria-activedescendant');}
  function selectMember(member){$('#assign-member').value=member.id;$('#member-search').value=`${member.nickname} (${member.viewerId})`;closeMembers();renderUpbo();}
  function searchMembers(){
    const input=$('#member-search'),list=$('#member-drop'),q=input.value.trim().toLowerCase();list.replaceChildren();searchIndex=-1;
    orderedMembers().filter(m=>!q||(m.nickname+' '+m.viewerId).toLowerCase().includes(q)).forEach((m,i)=>{const option=button(`${m.nickname} (${m.viewerId}) · 남음 ${memberTotal(m,$('#assign-season').value)}`,()=>selectMember(m));option.id='member-option-'+i;option.setAttribute('role','option');option.tabIndex=-1;option.addEventListener('mousedown',e=>e.preventDefault());list.append(option);});
    if(!list.children.length)list.append(node('p','검색 결과가 없습니다.'));list.hidden=false;input.setAttribute('aria-expanded','true');
  }
  $('#member-search').addEventListener('input',searchMembers);$('#member-search').addEventListener('focus',searchMembers);
  $('#member-search').addEventListener('keydown',event=>{const options=[...$('#member-drop').querySelectorAll('[role=option]')];if(event.key==='Escape'){closeMembers();return;}if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if($('#member-drop').hidden)searchMembers();const choices=[...$('#member-drop').querySelectorAll('[role=option]')];if(!choices.length)return;searchIndex=Math.max(0,Math.min(choices.length-1,searchIndex+(event.key==='ArrowDown'?1:-1)));choices.forEach((o,i)=>o.setAttribute('aria-selected',String(i===searchIndex)));event.target.setAttribute('aria-activedescendant',choices[searchIndex].id);choices[searchIndex].scrollIntoView({block:'nearest'});}else if(event.key==='Enter'&&!$('#member-drop').hidden){event.preventDefault();options[Math.max(0,searchIndex)]?.click();}});
  document.addEventListener('click',event=>{if(!event.target.closest('.member-picker'))closeMembers();});
  $('#assign-member').addEventListener('change',()=>{const m=A.data.members.find(m=>m.id===$('#assign-member').value);$('#member-search').value=m?`${m.nickname} (${m.viewerId})`:'';closeMembers();});
  $('#new-season').addEventListener('click',()=>{$('#season-form').reset();$('#season-form').elements.original.value='';$('#season-save').textContent='시즌 추가';});
  $('#season-form').addEventListener('submit',async event=>{event.preventDefault();const name=event.target.elements.name.value.trim(),original=event.target.elements.original.value;if(!name)return;if(await A.commit(d=>{const seasons=new Set([...d.seasons,...d.upbo.map(r=>r.season)]);if(name!==original&&seasons.has(name))throw new Error('이미 있는 시즌 이름입니다. 다른 이름을 입력해 주세요.');if(original){d.seasons=d.seasons.filter(s=>s!==original);d.upbo.filter(r=>r.season===original).forEach(r=>r.season=name);d.history.filter(r=>r.season===original).forEach(r=>r.season=name);}if(!d.seasons.includes(name))d.seasons.push(name);})){event.target.reset();event.target.elements.original.value='';$('#season-save').textContent='시즌 추가';$('#assign-season').value=name;members();renderUpbo();}});
  ['stats-season','stats-type','stats-status','stats-sort'].forEach(id=>$('#'+id).addEventListener('change',renderStats));$('#stats-search').addEventListener('input',renderStats);
  $('#stats-reset').addEventListener('click',()=>{['stats-season','stats-type','stats-status','stats-search'].forEach(id=>$('#'+id).value='');$('#stats-sort').value='remaining-desc';renderStats();});
  function renderOverview(target,season,filteredRows=null,sort='remaining-desc'){
    target.replaceChildren();const rows=filteredRows||A.data.upbo.filter(r=>!season||r.season===season),groups=new Map();
    rows.forEach(r=>{if(!groups.has(r.memberId))groups.set(r.memberId,[]);groups.get(r.memberId).push(r);});
    [...groups.values()].sort((a,b)=>{if(sort==='name')return a[0].nickname.localeCompare(b[0].nickname,'ko');const field=sort==='completed-desc'?'completed':'quantity',delta=b.reduce((n,r)=>n+r[field],0)-a.reduce((n,r)=>n+r[field],0);return (sort==='remaining-asc'?-delta:delta)||a[0].nickname.localeCompare(b[0].nickname,'ko');}).forEach(group=>{
      const first=group[0],details=node('details','');details.className='viewer-group';const summary=node('summary',`${first.nickname} (${first.viewerId}) · ${group.length}종 / 남음 ${group.reduce((n,r)=>n+r.quantity,0)}개`);details.append(summary);
      group.forEach(r=>{const line=node('div','');line.className='overview-item';const type=A.data.taskTypes.find(t=>t.id===r.typeId);line.style.setProperty('--type-color',typeColor(type));line.append(node('strong',r.item),node('span',`${r.season} · 남음 ${r.quantity} / 처리 ${r.completed}`));details.append(line);});
      details.append(button('이 시청자 관리',()=>{const m=A.data.members.find(m=>m.id===first.memberId);if(!m)return;$('#assign-season').value=season||first.season;members();selectMember(m);$('#upbo [data-pane="upbo-assign"]').click();$('#assign-member').focus();}));target.append(details);
    });
    if(!groups.size)target.append(node('p','배정된 업보가 없습니다.'));
  }
  function renderStats(){
    const season=$('#stats-season').value,type=$('#stats-type').value,status=$('#stats-status').value,q=$('#stats-search').value.trim().toLowerCase(),rows=A.data.upbo.filter(r=>(!season||r.season===season)&&(!type||r.item===type)&&(!q||(r.nickname+' '+r.viewerId).toLowerCase().includes(q))&&(!status||(status==='remaining'?r.quantity>0:status==='ready'?r.status==='준비 완료':r.status==='전달 완료'))),summary=$('#stats-summary');summary.replaceChildren();
    const remaining=rows.reduce((n,r)=>n+r.quantity,0),completed=rows.reduce((n,r)=>n+r.completed,0);
    [['총 배정',remaining+completed],['남은 업보',remaining],['처리 완료',completed],['시청자',new Set(rows.map(r=>r.memberId)).size]].forEach(([label,value])=>{const card=node('div','');card.append(node('small',label),node('strong',String(value)));summary.append(card);});
    const types=$('#stats-types'),groups=new Map();types.replaceChildren();rows.forEach(r=>{const totals=groups.get(r.item)||{remaining:0,completed:0};totals.remaining+=r.quantity;totals.completed+=r.completed;groups.set(r.item,totals);});
    [...groups].sort((a,b)=>{const sort=$('#stats-sort').value;if(sort==='name')return a[0].localeCompare(b[0],'ko');return sort==='completed-desc'?b[1].completed-a[1].completed:sort==='remaining-asc'?a[1].remaining-b[1].remaining:b[1].remaining-a[1].remaining;}).forEach(([name,totals])=>{const row=node('div','');row.className='overview-item';row.style.setProperty('--type-color',typeColor(A.data.taskTypes.find(t=>t.name===name)));row.append(node('strong',name),node('span',`남음 ${totals.remaining} / 처리 ${totals.completed} / 합계 ${totals.remaining+totals.completed}`));types.append(row);});if(!groups.size)types.append(node('p','집계할 업보가 없습니다.'));renderOverview($('#stats-members'),season,rows,$('#stats-sort').value);
  }
  function render(){
    const data=A.data,selected=schedule.elements.type.value||'소통';schedule.elements.type.replaceChildren();data.categories.forEach(c=>schedule.elements.type.append(new Option(c.name,c.name)));schedule.elements.type.value=selected;categoryChanged();
    const cl=$('#category-list');cl.replaceChildren();data.categories.forEach(c=>{const chip=button(c.name,()=>{$('#category-form').elements.name.value=c.name;$('#category-form').elements.color.value=c.color;});chip.style.background=c.color;cl.append(chip);});
    const seasons=[...new Set([...data.seasons,...data.upbo.map(r=>r.season)])];for(const id of ['assign-season','stats-season']){const select=$('#'+id),previous=select.value;select.replaceChildren();if(id==='stats-season')select.append(new Option('전체 시즌',''));else if(!seasons.length)select.append(new Option('시즌을 먼저 등록해 주세요',''));seasons.forEach(s=>select.append(new Option(s,s)));if([...select.options].some(o=>o.value===previous))select.value=previous;}$('#season-list').replaceChildren();seasons.forEach(s=>{const row=node('div','');row.className='season-record';row.append(node('strong',s),button('이름 수정',()=>{const form=$('#season-form');form.elements.original.value=s;form.elements.name.value=s;$('#season-save').textContent='시즌 이름 저장';form.elements.name.focus();}));const remove=button('삭제',async()=>{const count=A.data.upbo.filter(r=>r.season===s).length;if(!confirm(`${s} 시즌을 삭제할까요? 업보 ${count}건과 이 시즌의 처리 이력이 함께 삭제되며 되돌릴 수 없습니다.`))return;if(await A.commit(d=>{d.seasons=d.seasons.filter(name=>name!==s);d.upbo=d.upbo.filter(r=>r.season!==s);d.history=d.history.filter(r=>r.season!==s);})){if($('#season-form').elements.original.value===s)$('#new-season').click();}});remove.className='delete';row.append(remove);$('#season-list').append(row);});members();
    const ml=$('#member-list');ml.replaceChildren();data.members.forEach(m=>{const row=node('div','');row.className='member-record';const edit=button(m.nickname+' · '+m.viewerId,()=>{$('#member-form').elements.nickname.value=m.nickname;$('#member-form').elements.viewerId.value=m.viewerId;});const remove=button('삭제',async()=>{const count=A.data.upbo.filter(r=>r.memberId===m.id).length;if(!confirm(`${m.nickname} 시청자와 연결된 업보 ${count}건을 삭제할까요? 처리 이력은 유지됩니다.`))return;if(await A.commit(d=>{d.upbo=d.upbo.filter(r=>r.memberId!==m.id);d.members=d.members.filter(member=>member.id!==m.id);})){if($('#member-form').elements.viewerId.value===m.viewerId)$('#member-form').reset();$('#member-search').value='';closeMembers();}});remove.className='delete';row.append(edit,remove);ml.append(row);});
    const tl=$('#type-list');tl.replaceChildren();data.taskTypes.filter(t=>!t.deleted).forEach(t=>{
      const card=node('div','');card.className='type-record';card.style.setProperty('--type-color',typeColor(t));card.append(node('strong',t.name));
      card.append(button('수정',()=>{const f=$('#type-form');f.elements.id.value=t.id;f.elements.name.value=t.name;f.elements.color.value=typeColor(t);}),button('삭제',()=>{if(confirm('이 종류를 삭제할까요? 새 배정 목록에서는 사라지고 기존 배정·처리 기록은 보존됩니다.'))A.commit(d=>{const type=d.taskTypes.find(x=>x.id===t.id);type.deleted=true;type.active=false;});}));tl.append(card);
    });
    const statsType=$('#stats-type'),previousType=statsType.value;statsType.replaceChildren(new Option('전체 종류',''));[...new Set(data.upbo.map(r=>r.item))].sort().forEach(name=>statsType.append(new Option(name,name)));if([...statsType.options].some(o=>o.value===previousType))statsType.value=previousType;
    renderUpbo();renderStats();filterSchedules();
    const history=$('#upbo-history');history.replaceChildren();[...data.history].reverse().forEach(h=>history.append(node('p',`${new Date(h.at).toLocaleString('ko-KR',{hour12:false})} · ${h.nickname} / ${h.item} / ${h.season} · ${h.action} ${h.delta>0?'+':''}${h.delta} · 남음 ${h.remaining}`)));if(!data.history.length)history.append(node('p','아직 처리 이력이 없습니다. 기존 데이터의 과거 이력은 생성하지 않습니다.'));
    document.querySelectorAll('#outfit-list .record').forEach((card,i)=>{const move=direction=>A.commit(d=>{const next=i+direction;if(next<0||next>=d.outfits.length)return;[d.outfits[i],d.outfits[next]]=[d.outfits[next],d.outfits[i]];});const up=button('↑',()=>move(-1)),down=button('↓',()=>move(1));up.setAttribute('aria-label',data.outfits[i].name+' 위로');down.setAttribute('aria-label',data.outfits[i].name+' 아래로');up.disabled=i===0;down.disabled=i===data.outfits.length-1;card.append(up,down);});
  }
  addEventListener('geumbi-admin-render',render);render();
}
if(window.GEUMBI_ADMIN)initWorkflows();else addEventListener('geumbi-admin-ready',initWorkflows,{once:true});
