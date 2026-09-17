"use strict";
(() => {
  const config=window.CHOGEUMBI_SUPABASE;
  let clientPromise;
  function client(){
    if(!clientPromise)clientPromise=new Promise((resolve,reject)=>{
      const create=()=>resolve(window.supabase.createClient(config.url,config.key,{auth:{storage:sessionStorage,storageKey:'chogeumbi.auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
      if(window.supabase){create();return;}
      const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload=create;script.onerror=()=>{clientPromise=null;script.remove();reject(new Error('연결 모듈을 불러오지 못했습니다. 네트워크를 확인해 주세요.'));};document.head.append(script);
    });
    return clientPromise;
  }
  function message(error){
    if(['PGRST202','PGRST205','42P01'].includes(error?.code))return 'Supabase 연결됨 · DB 초기 설정이 필요합니다. setup.sql을 먼저 실행해 주세요.';
    if(error?.code==='42501')return '이 계정은 관리자 권한이 없습니다. 관리자 등록을 확인해 주세요.';
    if(error?.code==='40001')return '다른 관리 창에서 먼저 저장했습니다. 새로고침 후 다시 수정해 주세요.';
    return error?.message||'서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }
  async function read(admin=false){
    const db=await client();
    if(admin){
      const {data:{user},error}=await db.auth.getUser();
      if(error||!user)throw new Error('관리자 로그인이 필요합니다.');
      const result=await db.from('chogeumbi_state').select('payload,revision').eq('id',1).single();
      if(result.error)throw new Error(result.error.code==='PGRST116'?'관리자 권한 또는 초기 데이터를 확인해 주세요.':message(result.error));
      return result.data;
    }
    const {data,error}=await db.rpc('chogeumbi_public');if(error)throw new Error(message(error));return {payload:data};
  }
  async function save(payload,revision){
    const db=await client();const {data,error}=await db.rpc('chogeumbi_save',{new_payload:payload,expected_revision:revision});
    if(error)throw new Error(message(error));return data;
  }
  window.GEUMBI_CLOUD={config,client,read,save};
})();
