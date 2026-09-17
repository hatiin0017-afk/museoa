'use strict';
(() => {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const key = 'chogeumbi.preview.v1';
  const defaults = {
    settings: { greeting: '안녕, 양갱이!', tagline: '모두에게 행복이 가득하길 🍀', birthday: '07.16', debut: '2023.12.11', mbti: 'ISTP', color: '초록 + 노랑', scheduleKicker: '02 / SAVE THE DATE', scheduleBadge: 'BATTERY CHARGING…', scheduleTitle: '우리 언제 만나?', scheduleSubtitle: '함께할 날을 기다리는 중!', restNote: '매주 토요일은 고정 휴방이에요.', restDay: 6, luckMessage: '오늘도 금비와 웃는 하루 ♡' },
    schedules: [], outfits: [{ id: 'original', name: '금비의 교복', image: './assets/main.png', blur: 0, note: '초록과 노랑, 오늘의 금비.' }], upbo: []
  };
  function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()); }
  function dateOffset(n) { const d = new Date(today() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
  function samples() {
    return {
      outfits: Array.from({length:9},(_,i)=>({id:'sample-outfit-'+i,name:'배치 예시 '+(i+1),image:i%2?'./assets/main2.png':'./assets/main.png',blur:i%3===2?5:0,note:'페이지네이션 확인용 · 동일 원본 이미지 예시'})),
      schedules: [
        { id:'sample-talk', date:dateOffset(0), time:'20:00', title:'양갱이와 수다', type:'소통', color:'#c5e8c7', description:'일정 표시를 확인하기 위한 테스트입니다.', sample:true },
        { id:'sample-game', date:dateOffset(1), time:'21:00', title:'스팀 게임 같이 보기', type:'게임', color:'#ffe5a3', description:'달력 칩을 누르면 이 상세 내용이 보여요.', sample:true },
        { id:'sample-event', date:dateOffset(3), time:'19:30', title:'금비의 작은 이벤트', type:'이벤트', color:'#f4cfdf', description:'실제 방송 일정이 아닌 화면 확인용 예시입니다.', sample:true },
        { id:'sample-song', date:dateOffset(0), time:'22:00', title:'양갱이 신청곡 타임', type:'노래', color:'#d9d0ef', description:'수다 다음에는 가볍게 노래 한 곡! 같은 날짜의 두 번째 일정 예시예요.', sample:true },
        { id:'sample-ending', date:dateOffset(0), time:'23:10', title:'오늘의 마무리 수다', type:'소통', color:'#c5e8c7', description:'미니 달력의 더 보기에서 세 번째 일정까지 확인하는 예시입니다.', sample:true },
        { id:'sample-coop', date:dateOffset(4), time:'20:30', title:'같이 하는 협동게임', type:'게임', color:'#cce6f0', description:'양갱이와 함께하는 게임 방송 예시입니다.', sample:true },
        { id:'sample-chat', date:dateOffset(-2), time:'20:00', title:'금비의 근황 토크', type:'소통', color:'#c5e8c7', description:'이번 주 지난 일정도 함께 볼 수 있어요.', sample:true }
      ],
      upbo: [
        { id:'sample-upbo-1', nickname:'테스트 양갱이 A', viewerId:'sample_a', item:'방셀', quantity:2, season:'시즌 1', status:'대기', sample:true },
        { id:'sample-upbo-2', nickname:'민트양갱', viewerId:'sample_b', item:'손편지', quantity:1, season:'시즌 1', status:'준비 완료', sample:true },
        { id:'sample-upbo-3', nickname:'행운한스푼', viewerId:'sample_c', item:'방셀', quantity:3, season:'시즌 1', status:'대기', sample:true },
        { id:'sample-upbo-4', nickname:'말랑클로버', viewerId:'sample_d', item:'음성 메시지', quantity:1, season:'시즌 1', status:'준비 완료', sample:true },
        { id:'sample-upbo-5', nickname:'금비바라기', viewerId:'sample_e', item:'닉네임 캘리', quantity:2, season:'시즌 2', status:'대기', sample:true },
        { id:'sample-upbo-6', nickname:'초록한조각', viewerId:'sample_f', item:'손편지', quantity:0, season:'시즌 2', status:'전달 완료', sample:true }
      ]
    };
  }
  function load() {
    if (!local) return CHOGEUMBI_MODEL.normalize(structuredClone(defaults));
    if (new URLSearchParams(location.search).get('preview') === 'sample') return CHOGEUMBI_MODEL.normalize({ ...structuredClone(defaults), ...samples() });
    const raw = localStorage.getItem(key);
    if (!raw) return CHOGEUMBI_MODEL.normalize({ ...structuredClone(defaults), ...samples() });
    const saved = JSON.parse(raw);
    return CHOGEUMBI_MODEL.normalize({ ...structuredClone(defaults), ...saved, settings:{...defaults.settings, ...saved.settings} });
  }
  function save(data) {
    if (!local) throw new Error('운영 DB 연결이 준비되지 않았습니다.');
    localStorage.setItem(key, JSON.stringify(data));
    dispatchEvent(new Event('chogeumbi-data'));
  }
  function imageURL(value) {
    if (typeof value !== 'string') return '';
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return local ? value : '';
    if (/^\.\/assets\/[\w.-]+$/.test(value)) return new URL(value, new URL('../', document.currentScript?.src || location.href)).href;
    try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
  }
  // Capture the profile root before document.currentScript is cleared.
  const root = new URL('./', document.currentScript.src);
  window.GEUMBI = { local, key, defaults, samples, today, load, save, imageURL: value => /^\.\/assets\/[\w.-]+$/.test(value || '') ? new URL(value, root).href : imageURL(value) };
})();
