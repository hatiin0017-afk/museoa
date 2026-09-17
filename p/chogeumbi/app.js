'use strict';
(() => {
  const routes = ['intro', 'home', 'outfits', 'schedule', 'upbo'];
  let data = GEUMBI.load();
  const $ = selector => document.querySelector(selector);
  const text = (tag, value, cls) => { const e = document.createElement(tag); e.textContent = value; if (cls) e.className = cls; return e; };
  const settingDefaults=Object.fromEntries([...document.querySelectorAll('[data-setting]')].map(e=>[e.dataset.setting,e.textContent]));
  function applySettings() {
    document.querySelectorAll('[data-setting]').forEach(e => { e.textContent=data.settings[e.dataset.setting]??settingDefaults[e.dataset.setting]; });
    $('.intro-art').src=GEUMBI.imageURL(data.settings.introImage)||'./assets/main2.png';
    const main=GEUMBI.imageURL(data.settings.mainImage);$('.character img').src=main||'./assets/main.png';$('.character').classList.toggle('custom-image',!!main);
    const background=GEUMBI.imageURL(data.settings.mainBackground),hero=$('#hero-screen');
    hero.style.backgroundImage=background?`url(${JSON.stringify(background)})`:'';hero.classList.toggle('custom-background',!!background);
  }
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
    showToast(GEUMBI_LUCK.pick(data.settings,luck===100?'complete':'click'));
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
  function isRestDay(day){return new Date(year,month,day).getDay()===Number(data.settings.restDay)&&!rowsFor(dateKey(day)).some(e=>e.type!=='휴방');}
  function notesFor(day) {
    const notes = [];
    if (isRestDay(day)) notes.push(data.settings.restNote);
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
  }
  function renderUpcoming() {
    const host = $('#upcoming-events'); if (!host) return; host.replaceChildren();
    const todayKey = GEUMBI.today();
    const rows = data.schedules.filter(e => e.date >= todayKey)
      .sort((a,b) => a.date.localeCompare(b.date) || String(a.time||'').localeCompare(String(b.time||'')))
      .slice(0,3);
    if (!rows.length) { host.append(text('p','다가오는 일정이 아직 없어요.','event-empty')); return; }
    rows.forEach(event => {
      const [y,m,d] = event.date.split('-').map(Number);
      const dow = ['일','월','화','수','목','금','토'][new Date(y,m-1,d).getDay()];
      const row = text('button','','upcoming-row'); row.type='button'; row.style.setProperty('--chip',color(event.color));
      const when = text('div','','upcoming-when');
      when.append(text('strong',`${m}/${d}`), text('small',`${dow} · ${event.time || (event.type==='휴방'?'종일':'시간 미정')}`));
      const body = text('div','','upcoming-body');
      body.append(text('strong',event.title), text('small',`${event.type}${event.sample ? ' · 테스트' : ''}`));
      row.append(when, body);
      if (event.date === todayKey) row.append(text('span','TODAY','upcoming-today'));
      row.setAttribute('aria-label',`${m}월 ${d}일 ${event.title}, 일정 상세 보기`);
      row.addEventListener('click',()=>{ year=y; month=m-1; selected=d; renderCalendar(); showSchedule(row); });
      host.append(row);
    });
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
      if (isRestDay(day)) button.classList.add('rest');
      if (year===today.y&&month===today.m&&day===today.d) {button.classList.add('today');button.setAttribute('aria-current','date');}
      if (events.length) { const chip=text('span',`${events[0].time} ${events[0].title}`,'event-chip');chip.style.setProperty('--chip',color(events[0].color));button.append(chip);if(events.length>1)button.append(text('span',`+${events.length-1}개`,'event-more')); }
      else if(notes.length) button.append(text('small',notes.some(n=>n!==data.settings.restNote)?'기념일':'휴방'));
      button.addEventListener('click',()=>{selectDay(day);showSchedule(button);}); calendar.append(button);
    }
    selectDay(Math.min(selected,count));
    renderUpcoming();
    const note=$('#schedule-data-note');
    note.textContent=GEUMBI.local?'로컬 테스트 일정입니다. 실제 방송 공지가 아닙니다.':'';
    note.hidden=!note.textContent;
  }
  function changeMonth(delta) { const next=new Date(year,month+delta,1);year=next.getFullYear();month=next.getMonth();selected=1;renderCalendar(); }
  $('#prev-month').addEventListener('click',()=>changeMonth(-1));$('#next-month').addEventListener('click',()=>changeMonth(1));
  $('#today-month').addEventListener('click',()=>{ today=currentDate();year=today.y;month=today.m;selected=today.d;renderCalendar(); });
  const scheduleDialog=$('#schedule-dialog');let scheduleAnchor=null;
  function positionSchedule(){
    if(!scheduleDialog.open)return;
    const viewport=window.visualViewport,top=viewport?.offsetTop||0,height=viewport?.height||innerHeight;
    const dialogHeight=scheduleDialog.getBoundingClientRect().height;
    scheduleDialog.style.top=Math.max(top+12,top+(height-dialogHeight)/2)+'px';
  }
  function showSchedule(anchor){
    scheduleAnchor=anchor;const x=scrollX,y=scrollY;
    scheduleDialog.showModal();scrollTo({left:x,top:y,behavior:'instant'});positionSchedule();
  }
  scheduleDialog.addEventListener('close',()=>{const target=scheduleAnchor?.isConnected?scheduleAnchor:calendar.querySelector('[aria-pressed=true]');target?.focus({preventScroll:true});scheduleAnchor=null;});
  scheduleDialog.addEventListener('click',event=>{if(event.target!==scheduleDialog)return;const rect=scheduleDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)scheduleDialog.close();});
  addEventListener('scroll',positionSchedule,{passive:true});addEventListener('resize',positionSchedule);window.visualViewport?.addEventListener('resize',positionSchedule);
  addEventListener('hashchange',()=>{if(scheduleDialog.open)scheduleDialog.close();});
  let outfitPage=0;
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
  let searchedViewerId='';
  function renderUpbo(){
    const result=$('#upbo-result'),person=$('#upbo-person'),list=$('#upbo-items'),summary=$('#upbo-summary');
    person.replaceChildren();list.replaceChildren();result.hidden=true;summary.hidden=!searchedViewerId;summary.textContent='';
    if(!searchedViewerId)return;
    const rows=data.upbo.filter(row=>row.viewerId.trim().toLowerCase()===searchedViewerId&&row.quantity>0);
    if(!rows.length){summary.textContent='검색 결과가 없어요. 아이디 또는 닉네임을 확인해 주세요.';return;}
    const member=rows[0],name=text('strong',GEUMBI_SOOP.nickname(member.viewerId,member.nickname)),copy=text('div','','viewer-copy');
    copy.append(name,text('small',member.viewerId));person.append(GEUMBI_SOOP.picture(member.viewerId,member.nickname),copy);
    rows.sort((a,b)=>a.season.localeCompare(b.season,'ko')||a.item.localeCompare(b.item,'ko')).forEach(row=>{
      const entry=text('div','','upbo-detail-row'),info=text('div','');info.append(text('strong',row.item),text('small',`${row.season} · ${row.status}${row.sample?' · 테스트':''}`));
      entry.style.setProperty('--type-color',color(data.settings.upboColors?.[row.item]));entry.append(info,text('b','× '+row.quantity));list.append(entry);
    });
    summary.textContent=`남은 업보 ${rows.reduce((total,row)=>total+row.quantity,0)}개`;result.hidden=false;
    GEUMBI_SOOP.lookup(member.viewerId).then(profile=>{if(profile&&name.isConnected)name.textContent=profile.nickname;});
  }
  const searchInput=$('#upbo-search'),suggestBox=$('#upbo-suggest');
  let suggestItems=[],suggestIndex=-1;
  function upboPeople(){
    const people=new Map();
    data.upbo.forEach(row=>{
      if(!(Number(row.quantity)>0))return;
      const id=String(row.viewerId||'').trim();if(!id)return;
      const key=id.toLowerCase();
      if(!people.has(key))people.set(key,{id,key,nickname:GEUMBI_SOOP.nickname(id,row.nickname)||id});
    });
    return [...people.values()];
  }
  function matchPeople(term){
    const query=term.trim().toLowerCase();if(!query)return [];
    return upboPeople()
      .filter(person=>person.key.includes(query)||person.nickname.toLowerCase().includes(query))
      .sort((a,b)=>{
        const rank=person=>person.key===query?0:person.key.startsWith(query)?1:person.nickname.toLowerCase().startsWith(query)?2:3;
        return rank(a)-rank(b)||a.nickname.localeCompare(b.nickname,'ko');
      });
  }
  function closeSuggest(){
    suggestBox.hidden=true;suggestBox.replaceChildren();suggestItems=[];suggestIndex=-1;
    searchInput.setAttribute('aria-expanded','false');searchInput.removeAttribute('aria-activedescendant');
  }
  function highlightSuggest(next){
    if(!suggestItems.length)return;
    suggestIndex=(next+suggestItems.length)%suggestItems.length;
    [...suggestBox.children].forEach((item,index)=>{
      const on=index===suggestIndex;item.classList.toggle('active',on);item.setAttribute('aria-selected',String(on));
      if(on)item.scrollIntoView({block:'nearest'});
    });
    searchInput.setAttribute('aria-activedescendant',`upbo-suggest-${suggestIndex}`);
  }
  function renderSuggest(term){
    suggestItems=matchPeople(term).slice(0,8);suggestIndex=-1;suggestBox.replaceChildren();
    if(!suggestItems.length){closeSuggest();return;}
    suggestItems.forEach((person,index)=>{
      const item=document.createElement('li');
      item.className='upbo-suggest-item';item.id=`upbo-suggest-${index}`;
      item.setAttribute('role','option');item.setAttribute('aria-selected','false');
      item.append(text('strong',person.nickname),text('small',person.id));
      item.addEventListener('mousedown',event=>{event.preventDefault();chooseViewer(person);});
      suggestBox.append(item);
    });
    suggestBox.hidden=false;searchInput.setAttribute('aria-expanded','true');
  }
  function chooseViewer(person){
    searchInput.value=person.id;searchedViewerId=person.key;closeSuggest();renderUpbo();
  }
  $('#upbo-search-form').addEventListener('submit',event=>{
    event.preventDefault();
    if(suggestIndex>=0&&suggestItems[suggestIndex]){chooseViewer(suggestItems[suggestIndex]);return;}
    const term=searchInput.value.trim().toLowerCase();
    const matches=matchPeople(term);
    if(matches.length===1||(matches.length&&matches[0].key===term)){chooseViewer(matches[0]);return;}
    if(matches.length>1){searchedViewerId='';renderUpbo();renderSuggest(term);return;}
    closeSuggest();searchedViewerId=term;renderUpbo();
  });
  searchInput.addEventListener('input',()=>{searchedViewerId='';renderUpbo();renderSuggest(searchInput.value);});
  searchInput.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();if(suggestBox.hidden)renderSuggest(searchInput.value);else highlightSuggest(suggestIndex+1);}
    else if(event.key==='ArrowUp'){if(suggestBox.hidden)return;event.preventDefault();highlightSuggest(suggestIndex-1);}
    else if(event.key==='Escape'&&!suggestBox.hidden){event.preventDefault();closeSuggest();}
  });
  searchInput.addEventListener('blur',()=>setTimeout(closeSuggest,120));
  function refresh() { try {data=GEUMBI.load();applySettings();renderCalendar();renderOutfits();renderUpbo();} catch {showToast('저장된 데이터를 읽지 못했어요. 관리 화면에서 확인해 주세요.');} }
  addEventListener('storage',e=>{if(e.key===GEUMBI.key)refresh();});addEventListener('chogeumbi-data',refresh);
  renderCalendar();renderOutfits();renderUpbo();
  if(!GEUMBI.local){
    let syncing=false;
    async function syncPublic(){if(syncing)return;syncing=true;try{await GEUMBI.sync();refresh();}catch{const note=$('#schedule-data-note');note.textContent='일정을 불러오지 못했어요. 잠시 후 새로고침해 주세요.';note.hidden=false;}finally{syncing=false;}}
    syncPublic();addEventListener('focus',syncPublic);
    setInterval(()=>{if(!document.hidden)syncPublic();},60000);
  }
})();
