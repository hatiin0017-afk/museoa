'use strict';
function initStorage(){
  if(!window.GEUMBI_ADMIN)return;
  const $=s=>document.querySelector(s);
  let uploadBusy=false;
  $('#upload-storage').addEventListener('click',async()=>{
    if(uploadBusy)return;const result=$('#upload-feedback'),form=document.querySelector('#outfit-form'),file=form.elements.file.files[0];
    if(GEUMBI.local){result.textContent='이미지 업로드는 운영 관리 화면에서 로그인한 뒤 사용해 주세요.';return;}
    if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024){result.textContent='PNG/JPG/WebP 8MB 이하 파일을 선택해 주세요.';return;}
    uploadBusy=true;$('#upload-storage').disabled=true;form.querySelector('.primary').disabled=true;form.elements.file.disabled=true;result.textContent='업로드 중…';
    try{
      const client=await GEUMBI_CLOUD.client(),config=GEUMBI_CLOUD.config;
      const {data:{user},error:authError}=await client.auth.getUser();if(authError||!user)throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type];const path=`${user.id}/chogeumbi/${crypto.randomUUID()}.${ext}`;
      const {error}=await client.storage.from(config.bucket).upload(path,file,{contentType:file.type,cacheControl:'31536000',upsert:false});
      if(error)throw new Error('업로드 실패: 버킷 존재 여부와 업로드 권한을 확인해 주세요.');
      const {data}=client.storage.from(config.bucket).getPublicUrl(path);
      try{await new Promise((resolve,reject)=>{const image=new Image();const timer=setTimeout(()=>reject(new Error('이미지 확인 시간 초과')),15000);image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(new Error('공개 이미지에 접근할 수 없습니다.'));};image.src=data.publicUrl;});}catch{throw new Error('파일은 업로드됐지만 공개 읽기를 확인하지 못했습니다. 버킷의 공개 설정을 확인해 주세요. 경로: '+path);}
      form.elements.image.value=data.publicUrl;form.elements.image.dispatchEvent(new Event('input'));result.textContent='업로드 완료. 의상 저장을 누르면 이 URL로 연결됩니다.';
    }catch(error){result.textContent=error.message;}finally{uploadBusy=false;$('#upload-storage').disabled=false;form.querySelector('.primary').disabled=false;form.elements.file.disabled=false;}
  });
}
if(window.GEUMBI_ADMIN)initStorage();else addEventListener('geumbi-admin-ready',initStorage,{once:true});
