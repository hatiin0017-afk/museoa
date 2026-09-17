'use strict';
(() => {
  if(!window.GEUMBI_ADMIN)return;
  const $=s=>document.querySelector(s), status=message=>$('#storage-status').textContent=message;
  let client=null, config=null, uploadBusy=false;
  try{const saved=JSON.parse(localStorage.getItem('chogeumbi.storage.config')||'null');if(saved){$('#storage-url').value=saved.url;$('#storage-key').value=saved.key;$('#storage-bucket').value=saved.bucket;}}catch{}
  function sdk(){return new Promise((resolve,reject)=>{if(window.supabase)return resolve();const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';script.onload=resolve;script.onerror=()=>{script.remove();reject(new Error('Supabase 모듈을 불러오지 못했습니다.'));};document.head.append(script);});}
  $('#storage-login').addEventListener('click',async()=>{
    const login=$('#storage-login');login.disabled=true;
    try{
      const url=$('#storage-url').value.trim().replace(/\/$/,''),key=$('#storage-key').value.trim(),bucket=$('#storage-bucket').value.trim();
      if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)||!bucket||!/^[a-zA-Z0-9_-]+$/.test(bucket))throw new Error('Supabase 프로젝트 URL과 버킷 이름을 확인해 주세요.');
      let anon=false;try{anon=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch{}
      if(!anon&&!key.startsWith('sb_publishable_'))throw new Error('공개 anon 또는 publishable 키만 입력해 주세요.');
      await sdk();if(client)await client.auth.signOut();client=window.supabase.createClient(url,key,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});
      const {error}=await client.auth.signInWithPassword({email:$('#storage-email').value.trim(),password:$('#storage-password').value});
      if(error)throw new Error('로그인 실패: 프로젝트 연결과 계정 정보를 확인해 주세요.');
      config={url,key,bucket};localStorage.setItem('chogeumbi.storage.config',JSON.stringify(config));status('로그인되었습니다. 선택한 파일을 업로드할 수 있습니다.');
    }catch(error){client=null;config=null;status(error.message);}finally{$('#storage-password').value='';login.disabled=false;}
  });
  $('#storage-logout').addEventListener('click',async()=>{if(client)await client.auth.signOut();client=null;config=null;status('로그아웃되었습니다.');});
  $('#upload-storage').addEventListener('click',async()=>{
    if(uploadBusy)return;const result=$('#upload-feedback'),form=document.querySelector('#outfit-form'),file=form.elements.file.files[0];
    if(!client||!config){result.textContent='Storage 연결에서 먼저 로그인해 주세요.';return;}
    if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024){result.textContent='PNG/JPG/WebP 8MB 이하 파일을 선택해 주세요.';return;}
    uploadBusy=true;$('#upload-storage').disabled=true;form.querySelector('.primary').disabled=true;form.elements.file.disabled=true;result.textContent='업로드 중…';
    try{
      const {data:{user},error:authError}=await client.auth.getUser();if(authError||!user)throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type];const path=`${user.id}/chogeumbi/${crypto.randomUUID()}.${ext}`;
      const {error}=await client.storage.from(config.bucket).upload(path,file,{contentType:file.type,cacheControl:'31536000',upsert:false});
      if(error)throw new Error('업로드 실패: 버킷 존재 여부와 업로드 권한을 확인해 주세요.');
      const {data}=client.storage.from(config.bucket).getPublicUrl(path);
      try{await new Promise((resolve,reject)=>{const image=new Image();const timer=setTimeout(()=>reject(new Error('이미지 확인 시간 초과')),15000);image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(new Error('공개 이미지에 접근할 수 없습니다.'));};image.src=data.publicUrl;});}catch{throw new Error('파일은 업로드됐지만 공개 읽기를 확인하지 못했습니다. 버킷의 공개 설정을 확인해 주세요. 경로: '+path);}
      form.elements.image.value=data.publicUrl;form.elements.image.dispatchEvent(new Event('input'));result.textContent='업로드 완료. 의상 저장을 누르면 이 URL로 연결됩니다.';
    }catch(error){result.textContent=error.message;}finally{uploadBusy=false;$('#upload-storage').disabled=false;form.querySelector('.primary').disabled=false;form.elements.file.disabled=false;}
  });
})();
