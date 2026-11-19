const panel=document.querySelector('.song');
const filters=panel.querySelector('.filters'),search=panel.querySelector('input'),count=panel.querySelector('.count');
let selectedFilter,page=0;
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
{
  const work=document.querySelector('.work');
  const list=work.querySelector('.members');
  const input=work.querySelector('input');
  const modal=document.querySelector('#rewards');
  const owners=[
    ['nk890926k','강샤연'],['dj0011','대두쮸'],['goodluca11','무뿌'],
    ['jjang4856','아쮸__'],['khojune1226','젠이쮸'],['zzzhj12','찹쌀망량꿀떡'],['choiharu','Melt']
  ].map(([id,name])=>({id,name}));
  const seasons=[
    [[0,'신청권',2],[0,'손편지',1],[1,'모닝콜',1],[2,'손편지',1],[3,'신청권',1],[4,'앵콜권',2],[5,'손편지',1],[6,'신청권',1]],
    [[0,'앵콜권',1],[4,'신청권',2]]
  ];
  let season=0, opened=null;
  const elem=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el};
  function photo(user){
    const holder=elem('span',user.name.slice(0,1),'avatar');
    if(user.photo){const img=new Image();img.alt='';img.onerror=()=>img.remove();img.src=user.photo;holder.append(img)}
    return holder;
  }
  function rewards(user){return seasons[season].filter(([n])=>owners[n]===user)}
  function show(user){
    opened=user;
    const heading=elem('h2',user.name);heading.id='viewer';
    const info=elem('div');info.append(heading,elem('p','@'+user.id));
    const link=elem('a',user.station||'SOOP 방송국');link.href='https://www.sooplive.com/station/'+encodeURIComponent(user.id);link.target='_blank';link.rel='noopener noreferrer';info.append(link);
    modal.querySelector('.identity').replaceChildren(photo(user),info);
    const tickets=rewards(user).map(([,name,qty])=>{const ticket=elem('li',null,'ticket');ticket.append(elem('span','✧'),elem('strong',name),elem('b','×'+qty));return ticket});
    modal.querySelector('ul').replaceChildren(...tickets);
    if(!modal.open)modal.showModal();
  }
  modal.querySelector('.close').onclick=()=>modal.close();
  modal.onclose=()=>{opened=null};
  modal.onclick=e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}};
  function draw(){
    const query=input.value.trim().toLowerCase();
    const matches=owners.filter(u=>rewards(u).length&&(u.name+' @'+u.id).toLowerCase().includes(query));
    work.querySelector('.count').textContent='예시 내역 · '+matches.length+'명';
    list.replaceChildren(...matches.map(user=>{
      const li=elem('li'),button=elem('button',null,'folder');
      button.dataset.id=user.id;button.setAttribute('aria-haspopup','dialog');
      button.append(photo(user),elem('strong',user.name),elem('small','@'+user.id),elem('span','업보 '+rewards(user).reduce((sum,row)=>sum+row[2],0),'stamp'));
      button.onclick=()=>show(user);li.append(button);return li;
    }));
    if(!matches.length)list.append(elem('li','검색 결과가 없어요.'));
  }
  const tabs=work.querySelector('.filters');
  seasons.forEach((_,i)=>{const b=elem('button','시즌 '+(i+1));tabs.append(b);b.setAttribute('aria-pressed',String(i===season));b.onclick=()=>{season=i;[...tabs.children].forEach((t,n)=>t.setAttribute('aria-pressed',String(n===i)));draw()}});
  input.oninput=draw;draw();
  async function hydrate(user){
    try{
      const result=await fetch('https://api-channel.sooplive.com/v1.1/channel/'+encodeURIComponent(user.id)+'/station',{credentials:'omit',signal:AbortSignal.timeout(7000)});
      if(!result.ok)return;
      const {station}=await result.json();
      if(station?.userId?.toLowerCase()!==user.id)return;
      user.name=station.userNick||user.name;
      user.station=station.stationTitle||station.stationName||'SOOP 방송국';
      if(/^https:\/\//.test(station.profileImage))user.photo=station.profileImage;
    }catch{/* Keep the saved name if the station is unavailable. */}
  }
  const observer=new IntersectionObserver(entries=>{
    if(!entries.some(e=>e.isIntersecting))return;
    observer.disconnect();
    Promise.all(owners.map(hydrate)).then(()=>{
      const focused=document.activeElement.closest('.folder')?.dataset.id;
      draw();
      if(opened&&modal.open)show(opened);
      else if(focused)list.querySelector('[data-id="'+focused+'"]')?.focus();
    });
  });observer.observe(work);
}
