'use strict';
(async () => {
  const $=s=>document.querySelector(s), el=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;return n;};
  function feedback(message,error=false){$('#feedback').textContent=message;$('#feedback').classList.toggle('error',error);}
  const connection=$('#connection-status'),login=$('#login-form');
  login.addEventListener('submit',async e=>{e.preventDefault();const button=login.querySelector('button');button.disabled=true;connection.textContent='로그인 중…';try{const client=await GEUMBI_CLOUD.client();const {error}=await client.auth.signInWithPassword({email:$('#admin-email').value.trim(),password:$('#admin-password').value});if(error)throw new Error('이메일과 비밀번호를 확인해 주세요.');location.reload();}catch(error){connection.textContent=error.message;}finally{$('#admin-password').value='';button.disabled=false;}});
  $('#admin-logout').addEventListener('click',async()=>{try{const client=await GEUMBI_CLOUD.client();const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;location.reload();}catch{$('#connection').hidden=false;connection.textContent='로그아웃에 실패했습니다. 다시 시도해 주세요.';}});
  let data;
  if(GEUMBI.local){
    $('#mode-note').hidden=false;
    $('#connection').hidden=true;
    try{data=GEUMBI.load();}catch{feedback('로컬 데이터를 읽지 못했습니다. 백업을 복원해 주세요.',true);data=CHOGEUMBI_MODEL.normalize(structuredClone(GEUMBI.defaults));}
  }else{
    try{
      const client=await GEUMBI_CLOUD.client();const {data:{session}}=await client.auth.getSession();
      if(!session){login.hidden=false;await GEUMBI_CLOUD.read();connection.textContent='서버 연결 완료. 관리자 계정으로 로그인해 주세요.';return;}
      $('#admin-logout').hidden=false;data=await GEUMBI.sync(true);$('#connection').hidden=true;
      client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){document.querySelector('#editor').hidden=true;$('#connection').hidden=false;connection.textContent='로그인이 만료되었습니다. 다시 로그인해 주세요.';login.hidden=false;}});
    }catch(error){connection.textContent=error.message;login.hidden=!$('#admin-logout').hidden;return;}
  }
  $('#editor').hidden=false;
  let snapshot=localStorage.getItem(GEUMBI.key);
  const fields={greeting:['메인 인사말',36],tagline:['메인 아래 멘트',70],birthday:['생일 (MM.DD)',5],debut:['데뷔일 (YYYY.MM.DD)',10],mbti:['MBTI',8],color:['대표 색상',20],scheduleKicker:['일정 상단 영문 멘트',35],scheduleBadge:['휴방 안내 영문 멘트',24],scheduleTitle:['일정 제목',22],scheduleSubtitle:['일정 소개 멘트',50],restNote:['휴방 안내 문구',50],luckMessage:['행운 버튼 메시지',65]};
  for(const [key,[label,max]]of Object.entries(fields)){const l=el('label',label),input=document.createElement('input');input.name=key;input.maxLength=max;input.required=true;l.append(input);$('#setting-fields').append(l);}
  const forms={schedules:$('#schedule-form'),outfits:$('#outfit-form')};
  const entries=(form)=>Object.fromEntries(new FormData(form));
  async function save(next){
    if(GEUMBI.local&&localStorage.getItem(GEUMBI.key)!==snapshot)throw new Error('다른 관리 창에서 데이터가 변경되었습니다. 새로고침 후 다시 수정해 주세요.');
    CHOGEUMBI_MODEL.normalize(next);await GEUMBI.save(next);data=next;snapshot=localStorage.getItem(GEUMBI.key);render();feedback(GEUMBI.local?'로컬 예시에 저장했습니다.':'저장했습니다. 공개 페이지에도 반영됩니다.');
  }
  let saving=false;
  async function commit(change){
    if(saving)return false;saving=true;$('#editor').inert=true;feedback('저장 중…');
    try{const next=structuredClone(data);change(next);await save(next);return true;}
    catch(e){feedback(e.name==='QuotaExceededError'?'브라우저 저장 공간이 부족합니다. 이미지 주소로 등록해 주세요.':e.message,true);return false;}
    finally{saving=false;$('#editor').inert=false;}
  }
  function reset(form){form.reset();form.elements.id.value='';if(form===forms.schedules){form.elements.date.value=GEUMBI.today();form.elements.time.value='19:00';form.elements.type.dispatchEvent(new Event('change'));}if(form===forms.outfits){uploaded='';updatePreview();}}
  document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(b=>{if(b===button)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==button.dataset.tab);}));
  document.querySelectorAll('[data-cancel]').forEach(b=>b.addEventListener('click',()=>reset($('#'+b.dataset.cancel))));
  $('#settings-form').addEventListener('submit',e=>{e.preventDefault();const values=entries(e.target);values.restDay=Number(values.restDay);const birthday=/^(\d{2})\.(\d{2})$/.exec(values.birthday),debut=/^(\d{4})\.(\d{2})\.(\d{2})$/.exec(values.debut);function valid(y,m,d){const dt=new Date(Date.UTC(y,m-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d;}if(!birthday||!valid(2000,+birthday[1],+birthday[2])||!debut||!valid(+debut[1],+debut[2],+debut[3])){feedback('생일과 데뷔일을 실제 날짜 형식으로 입력해 주세요.',true);return;}commit(next=>next.settings={...next.settings,...values});});
  let uploaded='';
  function updatePreview(){const form=forms.outfits,img=$('#outfit-preview');const source=uploaded||form.elements.image.value;const url=GEUMBI.imageURL(source);img.hidden=!url;if(url)img.src=url;else img.removeAttribute('src');img.style.filter=`blur(${form.elements.blur.value}px)`;$('#blur-value').textContent=form.elements.blur.value+'px';}
  forms.outfits.elements.blur.addEventListener('input',updatePreview);forms.outfits.elements.image.addEventListener('input',()=>{uploaded='';forms.outfits.elements.file.value='';updatePreview();});
  forms.outfits.elements.file.addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;uploaded='';if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024){e.target.value='';feedback('PNG/JPG/WebP 8MB 이하 파일을 선택해 주세요.',true);updatePreview();return;}const submit=forms.outfits.querySelector('[type=submit]')||forms.outfits.querySelector('.primary');submit.disabled=true;try{uploaded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('이미지 파일을 읽지 못했습니다.'));reader.readAsDataURL(file);});await new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(new Error('정상 이미지 파일이 아닙니다.'));image.src=uploaded;});updatePreview();}catch(err){uploaded='';e.target.value='';feedback(err.message,true);}finally{submit.disabled=false;}});
  for(const [kind,form]of Object.entries(forms))form.addEventListener('submit',async e=>{e.preventDefault();if(kind==='outfits'&&!GEUMBI.local&&form.elements.file.files[0]){if(!await GEUMBI_STORAGE.upload())return;}const row=entries(form);row.id=row.id||crypto.randomUUID();if(kind==='outfits'){delete row.file;row.image=uploaded||row.image;if(!GEUMBI.local&&row.image.startsWith('data:')){feedback('이미지를 다시 선택한 뒤 저장해 주세요.',true);return;}row.blur=Number(row.blur);if(row.image.startsWith('data:')&&row.image.length>1400000){feedback('로컬 예시는 1MB 이하 이미지를 사용해 주세요.',true);return;}if(!GEUMBI.imageURL(row.image)){feedback('사용할 이미지 파일 또는 HTTPS 이미지 주소를 입력해 주세요.',true);return;}}else row.sample=form.elements.sample.checked;if(kind==='schedules'){const category=data.categories.find(c=>c.name===row.type);row.color=category?.color||'#c5e8c7';if(row.type==='휴방')row.time='';}if(await commit(next=>{const i=next[kind].findIndex(r=>r.id===row.id);if(i<0)next[kind].push(row);else next[kind][i]=row;}))reset(form);});
  function render(){
    const settings=$('#settings-form');for(const [key,value]of Object.entries(data.settings))if(settings.elements.namedItem(key))settings.elements.namedItem(key).value=value;
    for(const [kind,form]of Object.entries(forms)){const list=$('#'+({schedules:'schedule',outfits:'outfit',upbo:'upbo'}[kind])+'-list');list.replaceChildren();
      const rows=[...data[kind]];if(kind==='schedules')rows.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
      rows.forEach(row=>{const card=el('div','');card.className='record';const content=el('div','');content.append(el('strong',kind==='schedules'?`${row.date} ${row.time} · ${row.title}`:kind==='outfits'?row.name:`${row.nickname} · ${row.item} × ${row.quantity}`),el('p',kind==='outfits'?`블러 ${row.blur}px`:`${row.sample?'테스트 · ':''}${kind==='upbo'?row.season+' · '+row.status:row.type}`));const edit=el('button','수정'),remove=el('button','삭제');remove.className='delete';
        edit.addEventListener('click',()=>{reset(form);for(const [key,value]of Object.entries(row)){const input=form.elements.namedItem(key);if(input){if(input.type==='checkbox')input.checked=!!value;else if(key==='image'&&String(value).startsWith('data:')){uploaded=value;input.value='';}else input.value=value;}}if(kind==='outfits')updatePreview();if(kind==='schedules'){form.elements.type.dispatchEvent(new Event('change'));$('#schedules [data-pane="schedule-edit"]').click();}if(form.closest('details'))form.closest('details').open=true;form.scrollIntoView({behavior:'smooth',block:'start'});form.querySelector('input:not([type=hidden])').focus({preventScroll:true});feedback('수정 후 저장 버튼을 눌러 주세요.');});
        remove.addEventListener('click',async()=>{
          if(!confirm(kind==='outfits'?'이 의상을 삭제할까요? 다른 의상에서 사용하지 않는 업로드 이미지도 함께 삭제됩니다.':'이 항목을 삭제할까요?'))return;
          const saved=await commit(next=>{next[kind]=next[kind].filter(r=>r.id!==row.id);if(kind==='outfits'&&!GEUMBI.local&&window.GEUMBI_STORAGE?.path(row.image)&&!next.outfits.some(o=>o.image===row.image)){next.imageCleanup||=[];if(!next.imageCleanup.some(x=>x.image===row.image))next.imageCleanup.push({id:crypto.randomUUID(),image:row.image,name:row.name});}});
          if(saved&&kind==='outfits'&&!GEUMBI.local)await window.GEUMBI_STORAGE?.clean(row.image);
        });card.dataset.rowId=row.id;card.append(content,edit,remove);list.append(card);});
      if(!rows.length)list.append(el('p','아직 등록된 항목이 없어요.'));
    }
    dispatchEvent(new Event('geumbi-admin-render'));
  }
  const baseRender=render;
  window.GEUMBI_ADMIN={get data(){return data;},commit,feedback,render:baseRender,forms};
  $('#add-samples').addEventListener('click',()=>commit(next=>{const samples=GEUMBI.samples();for(const kind of ['schedules','upbo'])for(const row of samples[kind])if(!next[kind].some(r=>r.id===row.id))next[kind].push(row);}));
  $('#clear-samples').addEventListener('click',()=>{if(confirm('테스트로 표시된 일정과 업보만 삭제할까요?'))commit(next=>{next.schedules=next.schedules.filter(r=>!r.sample);next.upbo=next.upbo.filter(r=>!r.sample);});});
  $('#export-data').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='chogeumbi-backup-'+GEUMBI.today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('#import-data').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>4*1024*1024)throw new Error('백업 파일이 너무 큽니다.');const value=JSON.parse(await file.text());if(!value.settings||!['schedules','outfits','upbo'].every(k=>Array.isArray(value[k]))||!Object.keys(GEUMBI.defaults.settings).every(k=>typeof value.settings[k]===typeof GEUMBI.defaults.settings[k]))throw new Error('올바른 초금비 백업 파일이 아닙니다.');for(const kind of ['schedules','outfits','upbo']){const keys=kind==='schedules'?['id','date','time','title','type','color','description']:kind==='outfits'?['id','name','image','note']:['id','nickname','viewerId','item','season','status'];if(value[kind].length>1000||value[kind].some(r=>!r||keys.some(k=>typeof r[k]!=='string')))throw new Error('백업 항목 형식이 맞지 않습니다.');}if(value.outfits.some(r=>!GEUMBI.imageURL(r.image)||!Number.isFinite(r.blur)||r.blur<0||r.blur>20)||value.upbo.some(r=>!Number.isInteger(r.quantity)||r.quantity<0||r.quantity>9999))throw new Error('백업 이미지 또는 수량이 올바르지 않습니다.');if(confirm('현재 데이터를 이 백업으로 교체할까요?'))await commit(next=>{for(const key of Object.keys(next))delete next[key];Object.assign(next,value);});}catch(err){feedback(err.message,true);}finally{e.target.value='';}});
  reset(forms.schedules);render();dispatchEvent(new Event('geumbi-admin-ready'));
})();
