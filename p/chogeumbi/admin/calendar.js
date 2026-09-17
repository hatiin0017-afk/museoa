'use strict';
function initAdminCalendar(){
  const A=window.GEUMBI_ADMIN;if(!A)return;
  const form=A.forms.schedules,$=s=>document.querySelector(s),node=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e;};
  let month=(form.elements.date.value||GEUMBI.today()).slice(0,7);
  function render(){
    const [year,m]=month.split('-').map(Number),selected=form.elements.date.value,grid=$('#admin-calendar-days');grid.replaceChildren();
    $('#admin-month-title').textContent=`${year}년 ${m}월`;
    for(let i=0;i<new Date(year,m-1,1).getDay();i++)grid.append(node('span',''));
    for(let day=1;day<=new Date(year,m,0).getDate();day++){
      const date=`${month}-${String(day).padStart(2,'0')}`,rows=A.data.schedules.filter(r=>r.date===date).sort((a,b)=>a.time.localeCompare(b.time));
      const button=node('button','');button.type='button';button.className='admin-calendar-day';button.setAttribute('aria-label',`${date} · 일정 ${rows.length}개`);button.setAttribute('aria-pressed',String(date===selected));if(date===GEUMBI.today())button.classList.add('today');button.append(node('strong',String(day)));
      rows.slice(0,2).forEach(row=>{const chip=node('span',row.title);chip.className='admin-calendar-chip';chip.style.background=/^#[0-9a-f]{6}$/i.test(row.color)?row.color:'#c5e8c7';button.append(chip);});
      if(rows.length>2)button.append(node('small',`+${rows.length-2}개`));
      button.addEventListener('click',()=>{form.reset();form.elements.id.value='';form.elements.date.value=date;form.elements.time.value='19:00';form.elements.type.dispatchEvent(new Event('change',{bubbles:true}));render();});grid.append(button);
    }
    const list=$('#admin-calendar-events');list.replaceChildren(node('h4',`${selected||'선택 날짜'} 일정`));
    const rows=A.data.schedules.filter(r=>r.date===selected).sort((a,b)=>a.time.localeCompare(b.time));
    rows.forEach(row=>{const button=node('button',`${row.time||'시간 없음'} · ${row.title} · 수정`);button.type='button';button.addEventListener('click',()=>{for(const [key,value]of Object.entries(row)){const field=form.elements.namedItem(key);if(field){if(field.type==='checkbox')field.checked=!!value;else field.value=value;}}form.elements.type.dispatchEvent(new Event('change',{bubbles:true}));A.feedback('수정 후 저장 버튼을 눌러 주세요.');});list.append(button);});
    if(!rows.length)list.append(node('p','등록된 일정이 없습니다.'));
  }
  function move(delta){const [year,m]=month.split('-').map(Number),date=new Date(year,m-1+delta,1);month=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;render();}
  $('#admin-month-prev').addEventListener('click',()=>move(-1));$('#admin-month-next').addEventListener('click',()=>move(1));
  $('#admin-month-today').addEventListener('click',()=>{month=GEUMBI.today().slice(0,7);render();});
  form.addEventListener('change',()=>{if(form.elements.date.value)month=form.elements.date.value.slice(0,7);render();});
  form.addEventListener('reset',()=>queueMicrotask(()=>{month=(form.elements.date.value||GEUMBI.today()).slice(0,7);render();}));
  addEventListener('geumbi-admin-render',render);render();
}
if(window.GEUMBI_ADMIN)initAdminCalendar();else addEventListener('geumbi-admin-ready',initAdminCalendar,{once:true});
