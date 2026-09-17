'use strict';
function initInquiryAdmin(){
  const $=s=>document.querySelector(s),node=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e;};let page=0,request=0;
  const badges=[['[data-pane="upbo-inquiries"]','문의함'],['[data-tab="upbo"]','업보']].map(([selector,label])=>{const tab=$(selector),dot=node('span','');dot.className='inquiry-unread-dot';dot.hidden=true;dot.setAttribute('aria-hidden','true');tab.append(dot);return {tab,dot,label};});let badgeRequest=0;
  async function refreshBadge(){
    const current=++badgeRequest;
    try{const count=await GEUMBI_INQUIRIES.unreadCount();if(current!==badgeRequest)return;badges.forEach(({tab,dot,label})=>{dot.hidden=count===0;tab.setAttribute('aria-label',count?`${label} · 새 문의 ${count}건`:label);tab.title=count?`확인하지 않은 문의 ${count}건`:'';});}catch{/* Keep the last known indicator when a refresh fails. */}
  }
  async function render(){
    refreshBadge();
    const current=++request,status=$('#inquiry-filter').value;$('#inquiry-admin-status').textContent='불러오는 중…';
    try{const result=await GEUMBI_INQUIRIES.list(status,page);if(current!==request)return;const pages=Math.ceil(result.count/20);if(page>0&&page>=pages){page=Math.max(0,pages-1);return render();}
      const list=$('#inquiry-admin-list');list.replaceChildren();
      result.rows.forEach(row=>{const card=node('article','');card.className='inquiry-record';const title=node('h3',row.nickname),meta=node('small',`${new Date(row.created_at).toLocaleString('ko-KR',{hour12:false})} · ${{new:'새 문의',read:'확인',done:'처리 완료'}[row.status]}`);card.append(title,meta,node('p',row.content));const actions=node('div','');actions.className='actions';for(const [value,label]of [['read','확인'],['done','처리 완료'],['new','미확인으로']]){if(value===row.status)continue;const button=node('button',label);button.type='button';button.addEventListener('click',async()=>{button.disabled=true;try{await GEUMBI_INQUIRIES.update(row.id,value);await render();}catch(error){$('#inquiry-admin-status').textContent=error.message;button.disabled=false;}});actions.append(button);}if(row.status==='read'||row.status==='done'){const remove=node('button','삭제');remove.type='button';remove.className='delete';remove.addEventListener('click',async()=>{if(!confirm(row.nickname+' 님의 문의를 삭제할까요? 삭제한 문의는 복구할 수 없습니다.'))return;actions.querySelectorAll('button').forEach(b=>b.disabled=true);try{await GEUMBI_INQUIRIES.remove(row.id);await render();}catch(error){$('#inquiry-admin-status').textContent=error.message;actions.querySelectorAll('button').forEach(b=>b.disabled=false);}});actions.append(remove);}card.append(actions);list.append(card);});
      $('#inquiry-admin-status').textContent=result.count?`${result.count}건 · ${page+1}/${pages}페이지`:'문의가 없습니다.';$('#inquiry-prev').disabled=page===0;$('#inquiry-next').disabled=page+1>=pages;
    }catch(error){if(current===request){$('#inquiry-admin-list').replaceChildren();$('#inquiry-admin-status').textContent=error.message+' 관리자 초기 설정: inquiries.sql';}}
  }
  $('#inquiry-filter').addEventListener('change',()=>{page=0;render();});$('#inquiry-refresh').addEventListener('click',render);$('#inquiry-prev').addEventListener('click',()=>{if(page>0){page--;render();}});$('#inquiry-next').addEventListener('click',()=>{page++;render();});
  document.querySelector('[data-pane="upbo-inquiries"]').addEventListener('click',render);
  refreshBadge();addEventListener('focus',refreshBadge);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshBadge();});
  addEventListener('storage',event=>{if(event.key==='chogeumbi.preview.inquiries.v1')refreshBadge();});
  setInterval(()=>{if(!document.hidden)refreshBadge();},30000);
}
if(window.GEUMBI_ADMIN)initInquiryAdmin();else addEventListener('geumbi-admin-ready',initInquiryAdmin,{once:true});
