const filters = document.querySelector('.filters');
const search = document.querySelector('input[type=search]');
const count = document.querySelector('.count');
let selectedFilter;
let page = 0;

function setupFilters(labels, render) {
  selectedFilter = labels[0];
  for (const label of labels) {
    const button = document.createElement('button');
    button.textContent = label;
    button.setAttribute('aria-pressed', String(label === selectedFilter));
    button.onclick = () => {
      selectedFilter = label;
      page = 0;
      for (const item of filters.children) item.setAttribute('aria-pressed', String(item === button));
      render();
    };
    filters.append(button);
  }
  search.oninput = () => { page = 0; render(); };
  render();
}

if (document.querySelector('.work')) {
  const seasons = {
    '시즌 1': [
      ['구름콩','cloud','피아노 신청권 ×3','손편지 ×1'],
      ['별사탕','star','애교 쿠폰 ×2'],
      ['푸딩','pudding','모닝콜 ×1','피아노 신청권 ×2'],
      ['민트','mint','손편지 ×2'],
      ['달토끼','moon','피아노 신청권 ×1'],
      ['하늘','sky','모닝콜 ×2']
    ],
    '시즌 2': [['구름콩','cloud','손편지 ×1'],['하늘','sky','피아노 신청권 ×2']]
  };
  setupFilters(Object.keys(seasons), () => {
    const query = search.value.trim().toLowerCase();
    const matches = seasons[selectedFilter].filter(([name,id]) => (name+' @'+id).toLowerCase().includes(query));
    count.textContent = '예시 내역 · '+matches.length+'명';
    const list = document.querySelector('.members');
    list.innerHTML = matches.map(([name,id,...rewards]) => '<li><span class="member">'+name+'<small>@'+id+'</small></span><span class="rewards">'+rewards.map(item => '<span class="chip">'+item+'</span>').join('')+'</span></li>').join('');
    if (!matches.length) list.innerHTML = '<li>검색 결과가 없어요.</li>';
  });
} else {
  const groups = {
    '가요': '아이유|밤편지;윤하|사건의 지평선;이무진|신호등;태연|사계;이적|다행이다;폴킴|모든 날, 모든 순간;악뮤|오랜 날 오랜 밤;볼빨간사춘기|우주를 줄게;잔나비|주저하는 연인들을 위해;성시경|두 사람;아이유|무릎;윤하|기다리다;아이유|금요일에 만나요;태연|만약에;성시경|희재;김광석|바람이 불어오는 곳;박효신|야생화;이소라|바람이 분다',
    '팝': 'Adele|Someone Like You;The Beatles|Let It Be;Coldplay|Yellow;Norah Jones|Don’t Know Why;Elton John|Your Song;Christina Perri|A Thousand Years;Carpenters|Close to You;Bruno Mars|Count on Me',
    '애니': 'RADWIMPS|스파클;기무라 유미|언제나 몇 번이라도;Aimer|잔향산가;LiSA|홍련화;YOASOBI|아이돌;히사이시 조|바람이 지나가는 길',
    '연주곡': '드뷔시|달빛;쇼팽|즉흥환상곡;사티|짐노페디 1번;베토벤|엘리제를 위하여;이루마|River Flows in You;류이치 사카모토|Merry Christmas Mr. Lawrence;슈만|트로이메라이;모차르트|터키 행진곡'
  };
  const songs = Object.entries(groups).flatMap(([genre,rows]) => rows.split(';').map(row => {
    const [artist,title] = row.split('|');
    return {artist,title,genre};
  }));
  const pageSize = 12;
  const pages = document.querySelector('.pages');
  async function copySong(text) {
    const status = document.querySelector('output');
    try { await navigator.clipboard.writeText(text); status.textContent = '곡 정보를 복사했어요.'; }
    catch { window.prompt('곡 정보를 복사하세요.',text); }
  }
  function render() {
    const query = search.value.trim().toLowerCase();
    const matches = songs.filter(s => (selectedFilter === '전체' || s.genre === selectedFilter) && (s.artist+' '+s.title).toLowerCase().includes(query));
    const totalPages = Math.ceil(matches.length/pageSize);
    count.textContent = '예시 목록 · '+matches.length+'곡';
    const body = document.querySelector('tbody');
    body.replaceChildren();
    document.querySelector('output').textContent = matches.length ? '' : '검색 결과가 없어요.';
    for (const song of matches.slice(page*pageSize,(page+1)*pageSize)) {
      const row = body.insertRow();
      for (const text of [song.artist,song.title,'—',song.genre]) row.insertCell().textContent=text;
      const copy = document.createElement('button');
      copy.textContent = '⧉';
      copy.setAttribute('aria-label',song.title+' 곡 정보 복사');
      copy.onclick = () => copySong(song.artist+' - '+song.title);
      row.insertCell().append(copy);
    }
    pages.replaceChildren();
    for (let i=0;i<totalPages;i++) {
      const button = document.createElement('button');
      button.textContent = i+1;
      button.setAttribute('aria-label', (i+1)+'페이지');
      button.disabled = page === i;
      button.onclick = () => { page=i; render(); };
      pages.append(button);
    }
  }
  setupFilters(['전체',...Object.keys(groups)],render);
}

