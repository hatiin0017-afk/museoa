'use strict';
(() => {
  const key='chogeumbi.preview.inquiries.v1';
  function localRows(){return JSON.parse(localStorage.getItem(key)||'[]');}
  function failure(error){return new Error(['PGRST202','PGRST205','42P01'].includes(error?.code)?'문의 기능을 준비 중입니다. 잠시 후 다시 이용해 주세요.':error?.message||'연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');}
  async function submit(nickname,content){
    nickname=nickname.trim();content=content.trim();if(!nickname||nickname.length>40||!content||content.length>2000)throw new Error('닉네임과 내용을 확인해 주세요.');
    if(GEUMBI.local){const rows=localRows();if(rows.some(r=>r.nickname.toLowerCase()===nickname.toLowerCase()&&Date.now()-Date.parse(r.created_at)<60000))throw new Error('같은 닉네임의 문의는 1분 후 다시 보낼 수 있습니다.');rows.unshift({id:crypto.randomUUID(),nickname,content,status:'new',created_at:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(rows));return;}
    const db=await GEUMBI_CLOUD.client(),result=await db.rpc('chogeumbi_submit_inquiry',{sender_name:nickname,message_text:content});if(result.error)throw failure(result.error);
  }
  async function list(status,page){
    if(GEUMBI.local){const rows=localRows().filter(r=>!status||r.status===status);return {rows:rows.slice(page*20,page*20+20),count:rows.length};}
    const db=await GEUMBI_CLOUD.client();let query=db.from('chogeumbi_inquiries').select('id,nickname,content,status,created_at',{count:'exact'});if(status)query=query.eq('status',status);const result=await query.order('created_at',{ascending:false}).order('id').range(page*20,page*20+19);if(result.error)throw failure(result.error);return {rows:result.data,count:result.count};
  }
  async function update(id,status){
    if(!['new','read','done'].includes(status))throw new Error('올바른 상태가 아닙니다.');
    if(GEUMBI.local){const rows=localRows(),row=rows.find(r=>r.id===id);if(!row)throw new Error('문의를 찾을 수 없습니다.');row.status=status;localStorage.setItem(key,JSON.stringify(rows));return;}
    const db=await GEUMBI_CLOUD.client(),result=await db.from('chogeumbi_inquiries').update({status}).eq('id',id).select('id').single();if(result.error)throw failure(result.error);
  }
  window.GEUMBI_INQUIRIES={submit,list,update};
})();
