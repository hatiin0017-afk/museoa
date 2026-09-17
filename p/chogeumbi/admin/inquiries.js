'use strict';
function initInquiryAdmin(){
  const $=s=>document.querySelector(s),node=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e;};let page=0,request=0;
  async function render(){
    const current=++request,status=$('#inquiry-filter').value;$('#inquiry-admin-status').textContent='불러오는 중…';
    try{const result=await GEUMBI_INQUIRIES.list(status,page);if(current!==request)return;const pages=Math.ceil(result.count/20);if(page>0&&page>=pages){page=Math.max(0,pages-1);return render();}
      const list=$('#inquiry-admin-list');list.replaceChildren();
      result.rows.forEach(row=>{const card=node('article','');card.className='inquiry-record';const title=node('h3',row.nickname),meta=node('small',`${new Date(row.created_at).toLocaleString('ko-KR',{hour12:false})} · ${{new:'새 문의',read:'확인',done:'처리 완료'}[row.status]}`);card.append(title,meta,node('p',row.content));const actions=node('div','');actions.className='actions';for(const [value,label]of [['read','확인'],['done','처리 완료'],['new','미확인으로']]){if(value===row.status)continue;const button=node('button',label);button.type='button';button.addEventListener('click',async()=>{button.disabled=true;try{await GEUMBI_INQUIRIES.update(row.id,value);await render();}catch(error){$('#inquiry-admin-status').textContent=error.message;button.disabled=false;}});actions.append(button);}card.append(actions);list.append(card);});
      $('#inquiry-admin-status').textContent=result.count?`${result.count}건 · ${page+1}/${pages}페이지`:'문의가 없습니다.';$('#inquiry-prev').disabled=page===0;$('#inquiry-next').disabled=page+1>=pages;
    }catch(error){if(current===request){$('#inquiry-admin-list').replaceChildren();$('#inquiry-admin-status').textContent=error.message+' 관리자 초기 설정: inquiries.sql';}}
  }
  $('#inquiry-filter').addEventListener('change',()=>{page=0;render();});$('#inquiry-refresh').addEventListener('click',render);$('#inquiry-prev').addEventListener('click',()=>{if(page>0){page--;render();}});$('#inquiry-next').addEventListener('click',()=>{page++;render();});
  document.querySelector('[data-pane="upbo-inquiries"]').addEventListener('click',render);
}
if(window.GEUMBI_ADMIN)initInquiryAdmin();else addEventListener('geumbi-admin-ready',initInquiryAdmin,{once:true});
