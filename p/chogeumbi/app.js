'use strict';
(() => {
  const routes = ['intro', 'home', 'profile', 'schedule', 'upbo'];
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
  resize();
  function route() {
    const requested = location.hash.slice(1);
    const current = routes.includes(requested) ? requested : 'intro';
    if (requested !== current) history.replaceState(null, '', `#${current}`);
    document.querySelector('#shell').hidden = current === 'intro';
    document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== current; });
    document.querySelectorAll('[data-route]').forEach(link => {
      if (link.dataset.route === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = `초금비 · ${{ intro: 'MAKE IT LUCKY', home: 'LUCKY CHAMELEON', profile: '자기소개', schedule: '일정', upbo: '업보' }[current]}`;
    const title = document.querySelector(`#${current} h2`);
    if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); }
  }
  addEventListener('hashchange', route);
  route();
  const hero = document.querySelector('#hero-screen');
  hero.addEventListener('pointermove', event => {
    if (reducedMotion.matches || event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--dx', `${((event.clientX - rect.left) / rect.width - .5) * 12}px`);
    hero.style.setProperty('--dy', `${((event.clientY - rect.top) / rect.height - .5) * 8}px`);
  });
  hero.addEventListener('pointerleave', () => { hero.style.setProperty('--dx', '0px'); hero.style.setProperty('--dy', '0px'); });
  let toastTimer;
  const messages = ['양갱이에게 행운 한 조각! 🍀', '오늘도 초금비와 웃는 하루 ♡', '작은 행복을 발견하게 될 거예요 ✳', '행복 충전 완료! 양갱이 출발 ↗'];
  let luckIndex = 0;
  document.querySelector('#luck-button').addEventListener('click', () => {
    const toast = document.querySelector('#toast');
    toast.textContent = messages[luckIndex++ % messages.length];
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
    if (reducedMotion.matches) return;
    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('span');
      spark.className = 'spark'; spark.textContent = i % 2 ? '✿' : '♡'; spark.setAttribute('aria-hidden', 'true');
      spark.style.cssText = `left:${700 + Math.random() * 70}px;top:530px;--sx:${(Math.random() - .5) * 210}px`;
      hero.append(spark); spark.addEventListener('animationend', () => spark.remove(), { once: true });
    }
  });
  // The intake supplied weekly rest and anniversaries only. Never invent live events.
  const seoul = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = name => Number(seoul.find(p => p.type === name).value);
  const today = { y: part('year'), m: part('month') - 1, d: part('day') };
  let year = today.y, month = today.m, selected = today.d;
  const calendar = document.querySelector('#calendar');
  function eventsFor(day) {
    const notes = [];
    if (new Date(year, month, day).getDay() === 6) notes.push('토요일 고정 휴방');
    if (month === 6 && day === 16) notes.push('초금비 생일');
    if (month === 11 && day === 11 && year >= 2023) notes.push(year === 2023 ? '초금비 데뷔' : `데뷔 ${year - 2023}주년`);
    return notes;
  }
  function selectDay(day) {
    selected = day;
    calendar.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.day) === day)));
    const notes = eventsFor(day);
    document.querySelector('#selected-day').textContent = `${year}년 ${month + 1}월 ${day}일 · ${['일','월','화','수','목','금','토'][new Date(year, month, day).getDay()]}요일`;
    document.querySelector('#selected-note').textContent = notes.length ? notes.join(' · ') : '등록된 상세 일정이 없어요. 방송 시간은 SOOP 공지를 확인해 주세요.';
  }
  function renderCalendar() {
    document.querySelector('#month-title').textContent = `${year}. ${String(month + 1).padStart(2, '0')}`;
    calendar.replaceChildren();
    const first = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    for (let cell = 0; cell < 42; cell++) {
      const day = cell - first + 1;
      if (day < 1 || day > count) { const blank = document.createElement('span'); blank.className = 'blank'; blank.setAttribute('aria-hidden', 'true'); calendar.append(blank); continue; }
      const button = document.createElement('button');
      const notes = eventsFor(day);
      button.type = 'button'; button.dataset.day = day; button.textContent = day;
      button.setAttribute('aria-label', `${month + 1}월 ${day}일${notes.length ? ', ' + notes.join(', ') : ''}`);
      if (new Date(year, month, day).getDay() === 6) button.classList.add('rest');
      if (notes.some(note => note !== '토요일 고정 휴방')) button.classList.add('anniversary');
      if (year === today.y && month === today.m && day === today.d) { button.classList.add('today'); button.setAttribute('aria-current', 'date'); }
      if (notes.length) { const label = document.createElement('small'); label.textContent = notes.some(note => note !== '토요일 고정 휴방') ? '✿ 기념일' : '휴방'; button.append(label); }
      button.addEventListener('click', () => selectDay(day)); calendar.append(button);
    }
    selectDay(Math.min(selected, count));
  }
  function changeMonth(delta) { const next = new Date(year, month + delta, 1); year = next.getFullYear(); month = next.getMonth(); selected = 1; renderCalendar(); }
  document.querySelector('#prev-month').addEventListener('click', () => changeMonth(-1));
  document.querySelector('#next-month').addEventListener('click', () => changeMonth(1));
  document.querySelector('#today-month').addEventListener('click', () => { year = today.y; month = today.m; selected = today.d; renderCalendar(); });
  renderCalendar();
})();
