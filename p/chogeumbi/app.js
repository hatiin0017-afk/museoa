'use strict';
(() => {
  const routes = ['intro', 'home', 'outfits', 'schedule', 'upbo'];
  let data = GEUMBI.load();
  const $ = selector => document.querySelector(selector);
  const text = (tag, value, cls) => { const e = document.createElement(tag); e.textContent = value; if (cls) e.className = cls; return e; };
  function applySettings() { document.querySelectorAll('[data-setting]').forEach(e => { const v = data.settings[e.dataset.setting]; if (v !== undefined) e.textContent = v; }); }
  applySettings();
  $('#preview-label').hidden = !GEUMBI.local;
  const stage = document.querySelector('#stage');
  const fit = document.querySelector('#fit');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function resize() {
    const scale = Math.min(1, document.documentElement.clientWidth / 940);
    stage.style.transform = `scale(${scale})`;
    fit.style.width = `${940 * scale}px`;
    fit.style.height = `${1350 * scale}px`;
  }
  addEventListener('resize', resize);
  new ResizeObserver(resize).observe(document.documentElement);
  resize();
  function route() {
    const requested = location.hash.slice(1) === 'profile' ? 'outfits' : location.hash.slice(1);
    const current = routes.includes(requested) ? requested : 'intro';
    document.querySelector('#toast').classList.remove('show');
    if (location.hash.slice(1) !== current) history.replaceState(null, '', `#${current}`);
    document.querySelector('#shell').hidden = current === 'intro';
    document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== current; });
    document.querySelectorAll('[data-route]').forEach(link => {
      if (link.dataset.route === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = `초금비 · ${{ intro: 'MAKE IT LUCKY', home: 'LUCKY CHAMELEON', outfits: '의상 앨범', schedule: '일정', upbo: '업보' }[current]}`;
    const title = document.querySelector(current === 'intro' ? '.intro-entry' : `#${current} h2`);
    if (title) { if (current !== 'intro') title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); }
    // Hash targets are panels below the navigation, not document scroll destinations.
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  }
  addEventListener('hashchange', route);
  addEventListener('load', () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), { once: true });
  route();
  const hero = document.querySelector('#hero-screen');
  hero.addEventListener('pointermove', event => {
    if (reducedMotion.matches || event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--dx', `${((event.clientX - rect.left) / rect.width - .5) * 12}px`);
    hero.style.setProperty('--dy', `${((event.clientY - rect.top) / rect.height - .5) * 8}px`);
  });
  hero.addEventListener('pointerleave', () => { hero.style.setProperty('--dx', '0px'); hero.style.setProperty('--dy', '0px'); });
  let toastTimer, resetTimer, luck = 0, celebrating = false;
  function showToast(message) {
    $('#toast').textContent = message; $('#toast').classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2800);
  }
  function setLuck(value) {
    luck = value; $('.meter').setAttribute('aria-valuenow', value); $('.meter i').style.width = value + '%'; $('#luck-value').textContent = value + '%';
  }
  $('#luck-button').addEventListener('click', () => {
    if (celebrating) return;
    setLuck(Math.min(100, luck + 20));
    showToast(luck === 100 ? '행복 충전 완료! 양갱이에게 행운 가득 ♡' : data.settings.luckMessage);
    if (luck !== 100) return;
    celebrating = true; $('#luck-button').setAttribute('aria-disabled', 'true');
    if (!reducedMotion.matches) for (let i = 0; i < 20; i++) {
      const heart = document.createElement('i'); heart.className = 'pixel-heart';
      heart.style.cssText = `left:${10+Math.random()*80}%;--drift:${Math.random()*100-50}px;--delay:${i*.09}s;width:${22+Math.random()*25}px;height:${22+Math.random()*25}px`;
      $('#luck-particles').append(heart);
    }
    clearTimeout(resetTimer); resetTimer = setTimeout(() => { $('#luck-particles').replaceChildren(); setLuck(0); celebrating = false; $('#luck-button').removeAttribute('aria-disabled'); }, reducedMotion.matches ? 1800 : 6200);
  });
  function currentDate() { const [y,m,d] = GEUMBI.today().split('-').map(Number); return { y, m:m-1, d }; }
  let today = currentDate(), year = today.y, month = today.m, selected = today.d;
  const calendar = $('#calendar');
  const dateKey = day => `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const color = value => /^#[0-9a-f]{6}$/i.test(value) ? value : '#c5e8c7';
  function notesFor(day) {
    const notes = [];
    if (Number(data.settings.restDay) >= 0 && new Date(year,month,day).getDay() === Number(data.settings.restDay)) notes.push(data.settings.restNote);
    const birthday = /^([0-9]{2})[.]([0-9]{2})$/.exec(data.settings.birthday);
    if (birthday && month+1 === Number(birthday[1]) && day === Number(birthday[2])) notes.push('금비 생일');
    const debut = /^([0-9]{4})[.]([0-9]{2})[.]([0-9]{2})$/.exec(data.settings.debut);
    if (debut && year >= Number(debut[1]) && month+1 === Number(debut[2]) && day === Number(debut[3])) notes.push(year === Number(debut[1]) ? '금비 데뷔' : `데뷔 ${year-Number(debut[1])}주년`);
    return notes.filter(Boolean);
  }
  function rowsFor(date) { return data.schedules.filter(e => e.date === date).sort((a,b) => a.time.localeCompare(b.time)); }
  function eventRow(event, withDate=false) {
    const row = text('div','', 'event-row'); row.style.setProperty('--chip',color(event.color));
    row.append(text('strong', `${withDate ? event.date.slice(5).replace('-','/')+' · ' : ''}${event.time || (event.type==='휴방'?'종일':'시간 미정')} ${event.title}`));
    row.append(text('small',`${event.type}${event.sample ? ' · 테스트' : ''}`));
    if (event.description) row.append(text('p',event.description)); return row;
  }
  function selectDay(day) {
    selected = day; calendar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(Number(b.dataset.day) === day)));
    $('#selected-day').textContent = `${month+1}월 ${day}일 · ${['일','월','화','수','목','금','토'][new Date(year,month,day).getDay()]}요일`;
    const detail = $('#selected-events'); detail.replaceChildren(); const notes = notesFor(day);
    notes.forEach(n => detail.append(text('p',n,'event-empty')));
    rowsFor(dateKey(day)).forEach(e => detail.append(eventRow(e)));
    if (!detail.children.length) detail.append(text('p',GEUMBI.local ? '등록된 일정이 없어요.' : '등록된 일정이 없어요.','event-empty'));
    const start = new Date(Date.UTC(year,month,day)); start.setUTCDate(start.getUTCDate()-start.getUTCDay());
    const end = new Date(start); end.setUTCDate(end.getUTCDate()+6);
    const from = start.toISOString().slice(0,10), to = end.toISOString().slice(0,10);
    $('#week-title').textContent = `${from.slice(5).replace('-','/')} – ${to.slice(5).replace('-','/')}`;
    const week = $('#week-events'); week.replaceChildren();
    for(let i=0;i<7;i++) {
      const date=new Date(start);date.setUTCDate(date.getUTCDate()+i);const key=date.toISOString().slice(0,10);
      const cell=text('button','','week-day');cell.type='button';cell.classList.toggle('selected',key===dateKey(day));
      cell.append(text('strong',`${['일','월','화','수','목','금','토'][i]} ${date.getUTCMonth()+1}/${date.getUTCDate()}`));
      const events=rowsFor(key);events.slice(0,2).forEach(e=>{const chip=text('span',`${e.time||''} ${e.title}`,'mini-event');chip.style.setProperty('--chip',color(e.color));cell.append(chip);});
      if(events.length>2)cell.append(text('small',`+${events.length-2}개 더 보기`));
      if(!events.length)cell.append(text('small',i===Number(data.settings.restDay)?'정기 휴방':'—'));
      cell.setAttribute('aria-label',`${key}, ${events.length}개 일정 상세 보기`);
      cell.addEventListener('click',()=>{year=date.getUTCFullYear();month=date.getUTCMonth();selected=date.getUTCDate();renderCalendar();$('#schedule-dialog').showModal();});week.append(cell);
    }

  }
  function renderCalendar() {
    today = currentDate(); $('#month-title').textContent = `${year}. ${String(month+1).padStart(2,'0')}`; calendar.replaceChildren();
    const first = new Date(year,month,1).getDay(), count = new Date(year,month+1,0).getDate();
    for (let cell=0;cell<42;cell++) {
      const day=cell-first+1;
      if (day<1||day>count) { const blank=text('span','','blank'); blank.setAttribute('aria-hidden','true'); calendar.append(blank); continue; }
      const button=text('button',day); button.type='button'; button.dataset.day=day;
      const notes=notesFor(day), events=rowsFor(dateKey(day));
      button.setAttribute('aria-label',`${year}년 ${month+1}월 ${day}일${notes.length?', '+notes.join(', '):''}${events.length?', '+events.map(e=>e.time+' '+e.title).join(', '):''}`);
      if (new Date(year,month,day).getDay()===Number(data.settings.restDay)) button.classList.add('rest');
      if (year===today.y&&month===today.m&&day===today.d) {button.classList.add('today');button.setAttribute('aria-current','date');}
      if (events.length) { const chip=text('span',`${events[0].time} ${events[0].title}`,'event-chip');chip.style.setProperty('--chip',color(events[0].color));button.append(chip);if(events.length>1)button.append(text('span',`+${events.length-1}개`,'event-more')); }
      else if(notes.length) button.append(text('small',notes.some(n=>n!==data.settings.restNote)?'기념일':'휴방'));
      button.addEventListener('click',()=>{selectDay(day);$('#schedule-dialog').showModal();}); calendar.append(button);
    }
    selectDay(Math.min(selected,count));
    $('#schedule-data-note').textContent=GEUMBI.local?'로컬 테스트 일정입니다. 실제 방송 공지가 아닙니다.':'수동 등록 일정 · 방송국 공지 자동 연동은 지원하지 않습니다.';
  }
  function changeMonth(delta) { const next=new Date(year,month+delta,1);year=next.getFullYear();month=next.getMonth();selected=1;renderCalendar(); }
  $('#prev-month').addEventListener('click',()=>changeMonth(-1));$('#next-month').addEventListener('click',()=>changeMonth(1));
  $('#today-month').addEventListener('click',()=>{ today=currentDate();year=today.y;month=today.m;selected=today.d;renderCalendar(); });
  let outfitPage=0, upboPage=0;
  function pager(target,page,count,callback) {
    target.replaceChildren(); if(count<=1)return;
    const prev=text('button','← 이전'), next=text('button','다음 →');prev.disabled=page===0;next.disabled=page>=count-1;
    prev.addEventListener('click',()=>callback(page-1));next.addEventListener('click',()=>callback(page+1));target.append(prev,text('span',`${page+1} / ${count}`),next);
  }
  $('#close-schedule').addEventListener('click',()=>$('#schedule-dialog').close());
  const dialog=$('#outfit-dialog');$('#close-outfit').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  function renderOutfits() {
    const grid=$('#outfit-grid');grid.replaceChildren();const pages=Math.ceil(data.outfits.length/4);outfitPage=Math.max(0,Math.min(outfitPage,pages-1));
    data.outfits.slice(outfitPage*4,outfitPage*4+4).forEach(outfit=>{
      const button=text('button','','outfit-card'), frame=text('div','','outfit-image'), img=document.createElement('img');
      const blur=Math.max(0,Math.min(20,Number(outfit.blur)||0));img.src=GEUMBI.imageURL(outfit.image);img.alt=outfit.name;button.style.setProperty('--blur',blur+'px');frame.append(img);
      button.append(frame,text('strong',outfit.name),text('p',outfit.note||'의상 크게 보기 ↗')); if(blur)button.append(text('span','살짝 비밀','blur-label'));
      button.addEventListener('click',()=>{ $('#outfit-dialog-title').textContent=outfit.name;dialog.querySelector('img').src=img.src;dialog.querySelector('img').alt=outfit.name;dialog.style.setProperty('--blur',blur+'px');dialog.querySelector('p').textContent=outfit.note||'';dialog.showModal(); });grid.append(button);
    });
    if(!data.outfits.length)grid.append(text('p','의상 앨범을 준비하고 있어요.','upbo-empty'));
    pager($('#outfit-pages'),outfitPage,pages,p=>{outfitPage=p;renderOutfits();});
  }
  const upboDialog=$('#upbo-dialog');let upboAnchor=null;
  function positionUpbo(){
    if(!upboDialog.open||!upboAnchor)return;
    const rect=upboAnchor.getBoundingClientRect(),height=upboDialog.getBoundingClientRect().height;
    const viewport=window.visualViewport,offset=viewport?.offsetTop||0,space=viewport?.height||innerHeight;
    const y=Math.max(offset+12,Math.min(rect.top+rect.height/2-height/2,offset+space-height-12));
    upboDialog.style.top=y+'px';
  }
  $('#close-upbo').addEventListener('click',()=>upboDialog.close());
  upboDialog.addEventListener('click',e=>{if(e.target!==upboDialog)return;const r=upboDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)upboDialog.close();});
  upboDialog.addEventListener('close',()=>{if(upboAnchor?.isConnected)upboAnchor.focus({preventScroll:true});upboAnchor=null;});
  addEventListener('resize',positionUpbo);addEventListener('scroll',positionUpbo,{passive:true});window.visualViewport?.addEventListener('resize',positionUpbo);
  addEventListener('hashchange',()=>{if(upboDialog.open)upboDialog.close();});
  function showUpbo(member,anchor){
    upboAnchor=anchor;const person=$('#upbo-dialog-person');person.replaceChildren(GEUMBI_SOOP.picture(member.viewerId,member.nickname));
    const name=text('div','');const title=text('h2',member.nickname);title.id='upbo-dialog-title';name.append(title,text('small',member.viewerId));person.append(name);
    const items=$('#upbo-dialog-items');items.replaceChildren();
    member.rows.forEach(row=>{const entry=text('div','','upbo-detail-row'),info=text('div','');info.append(text('strong',row.item),text('small',`${row.season} · ${row.status}${row.sample?' · 테스트':''}`));entry.style.setProperty('--type-color',color(data.settings.upboColors?.[row.item]));entry.append(info,text('b','× '+row.quantity));items.append(entry);});
    const pageX=scrollX,pageY=scrollY;
    upboDialog.style.top=Math.max(12,anchor.getBoundingClientRect().top)+'px';upboDialog.showModal();
    window.scrollTo({left:pageX,top:pageY,behavior:'instant'});positionUpbo();
    GEUMBI_SOOP.lookup(member.viewerId).then(profile=>{if(profile&&upboDialog.open&&upboAnchor===anchor)title.textContent=profile.nickname;});
  }
  function renderUpbo(refreshSeasons=false) {
    const season=$('#upbo-season');
    if(refreshSeasons){const selected=season.value;season.replaceChildren(new Option('전체 시즌',''));[...new Set(data.upbo.map(e=>e.season))].sort().forEach(s=>season.append(new Option(s,s)));if([...season.options].some(o=>o.value===selected))season.value=selected;}
    const q=$('#upbo-search').value.trim().toLocaleLowerCase(),groups=new Map();
    data.upbo.filter(e=>!season.value||e.season===season.value).forEach(row=>{
      const id=row.viewerId.trim().toLowerCase();if(!groups.has(id))groups.set(id,{viewerId:row.viewerId,nickname:GEUMBI_SOOP.nickname(row.viewerId,row.nickname),rows:[]});groups.get(id).rows.push(row);
    });
    const members=[...groups.values()].filter(m=>!q||`${m.nickname} ${m.viewerId}`.toLocaleLowerCase().includes(q));
    const pages=Math.ceil(members.length/12);upboPage=Math.max(0,Math.min(upboPage,pages-1));const list=$('#upbo-list');list.replaceChildren();
    members.slice(upboPage*12,upboPage*12+12).forEach(member=>{
      const chip=text('button','','viewer-chip');chip.style.setProperty('--type-color',color(data.settings.upboColors?.[member.rows[0]?.item]));chip.type='button';chip.setAttribute('aria-haspopup','dialog');
      const copy=text('span','','viewer-copy'),name=text('strong',member.nickname),quantity=member.rows.reduce((total,r)=>total+r.quantity,0);
      copy.append(name,text('small',`남은 업보 ${quantity}개`));chip.append(GEUMBI_SOOP.picture(member.viewerId,member.nickname),copy,text('span','↗','viewer-arrow'));
      chip.addEventListener('click',()=>showUpbo(member,chip));list.append(chip);
      GEUMBI_SOOP.lookup(member.viewerId).then(profile=>{if(profile&&chip.isConnected){member.nickname=profile.nickname;name.textContent=profile.nickname;}});
    });
    if(!members.length)list.append(text('p',data.upbo.length?'검색 결과가 없어요.':'등록된 업보가 없어요.','upbo-empty'));
    $('#upbo-summary').textContent=(GEUMBI.local?'로컬 테스트 · ':'')+`${members.length}명의 양갱이 · 칩을 누르면 상세 내역을 볼 수 있어요.`;
    pager($('#upbo-pages'),upboPage,pages,p=>{upboPage=p;renderUpbo();});
  }
  $('#upbo-search').addEventListener('input',()=>{upboPage=0;renderUpbo();});$('#upbo-season').addEventListener('change',()=>{upboPage=0;renderUpbo();});
  function refresh() { try {data=GEUMBI.load();applySettings();renderCalendar();renderOutfits();renderUpbo(true);} catch {showToast('저장된 데이터를 읽지 못했어요. 관리 화면에서 확인해 주세요.');} }
  addEventListener('storage',e=>{if(e.key===GEUMBI.key)refresh();});addEventListener('chogeumbi-data',refresh);
  renderCalendar();renderOutfits();renderUpbo(true);
  if(!GEUMBI.local){
    let syncing=false;
    async function syncPublic(){if(syncing)return;syncing=true;try{await GEUMBI.sync();refresh();}catch{$('#schedule-data-note').textContent='일정을 불러오지 못했어요. 잠시 후 새로고침해 주세요.';}finally{syncing=false;}}
    syncPublic();addEventListener('focus',syncPublic);
    setInterval(()=>{if(!document.hidden)syncPublic();},60000);
  }
})();
