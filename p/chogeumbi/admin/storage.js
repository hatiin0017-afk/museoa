'use strict';
function initStorage(){
  if(!window.GEUMBI_ADMIN)return;
  const $=s=>document.querySelector(s);
  let uploadBusy=false;
  const A=GEUMBI_ADMIN;let cleanupBusy=false;
  function path(image){
    try{const u=new URL(image),config=GEUMBI_CLOUD.config,prefix='/storage/v1/object/public/'+config.bucket+'/';
      if(u.origin!==new URL(config.url).origin||!u.pathname.startsWith(prefix))return null;
      const key=decodeURIComponent(u.pathname.slice(prefix.length));
      return /^[0-9a-f-]{36}\/chogeumbi\/[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(key)?key:null;
    }catch{return null;}
  }
  function pending(){
    const wrap=$('#image-cleanup');wrap.replaceChildren();if(GEUMBI.local)return;
    for(const item of A.data.imageCleanup||[]){const line=document.createElement('p');line.textContent=item.name+' · 이미지 정리 대기 ';const retry=document.createElement('button');retry.type='button';retry.textContent='이미지 삭제 재시도';retry.disabled=cleanupBusy;retry.addEventListener('click',()=>clean(item.image));line.append(retry);wrap.append(line);}
  }
  async function clean(image){
    if(cleanupBusy||GEUMBI.local||!A.data.imageCleanup?.some(x=>x.image===image))return;
    cleanupBusy=true;pending();
    try{
      const key=path(image);if(!key)throw new Error('이 프로젝트의 업로드 이미지가 아닙니다.');
      const latest=await GEUMBI_CLOUD.read(true);
      if(!latest.payload.imageCleanup?.some(x=>x.image===image))return;
      if(latest.payload.outfits.some(o=>o.image===image)||['introImage','mainImage','mainBackground'].some(key=>latest.payload.settings?.[key]===image))throw new Error('다른 항목이 같은 이미지를 사용하고 있어 보존했습니다.');
      const client=await GEUMBI_CLOUD.client();const {data,error}=await client.storage.from(GEUMBI_CLOUD.config.bucket).remove([key]);
      if(error)throw new Error('이미지 삭제 권한 또는 연결을 확인해 주세요. image-cleanup.sql 설정이 필요할 수 있습니다.');
      if(!data?.some(object=>object.name===key))throw new Error('이미지 삭제를 확인하지 못했습니다. 삭제 권한을 확인해 주세요.');
      if(await A.commit(next=>next.imageCleanup=(next.imageCleanup||[]).filter(x=>x.image!==image)))A.feedback('의상과 업로드 이미지를 삭제했습니다.');
    }catch(error){A.feedback('의상은 삭제했습니다. '+error.message+' 아래 재시도 버튼으로 정리할 수 있습니다.',true);}
    finally{cleanupBusy=false;pending();}
  }
  window.GEUMBI_STORAGE={path,clean,upload,uploadFile};addEventListener('geumbi-admin-render',pending);pending();

  async function upload(){
    if(uploadBusy)return false;const result=$('#upload-feedback'),form=document.querySelector('#outfit-form'),file=form.elements.file.files[0];
    if(GEUMBI.local){result.textContent='이미지 업로드는 운영 관리 화면에서 로그인한 뒤 사용해 주세요.';return false;}
    if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024){result.textContent='PNG/JPG/WebP 8MB 이하 파일을 선택해 주세요.';return false;}
    uploadBusy=true;form.querySelector('.primary').disabled=true;form.elements.file.disabled=true;result.textContent='업로드 중…';
    try{
      const url=await uploadFile(file);
      form.elements.image.value=url;form.elements.image.dispatchEvent(new Event('input'));result.textContent='이미지 업로드 완료';return true;
    }catch(error){result.textContent=error.message;return false;}finally{uploadBusy=false;form.querySelector('.primary').disabled=false;form.elements.file.disabled=false;}
  }
  async function uploadFile(file){
      if(GEUMBI.local)throw new Error('운영 관리 화면에서 로그인해 주세요.');
      if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('PNG/JPG/WebP 8MB 이하 파일을 선택해 주세요.');
      const client=await GEUMBI_CLOUD.client(),config=GEUMBI_CLOUD.config;
      const {data:{user},error:authError}=await client.auth.getUser();if(authError||!user)throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type];const path=`${user.id}/chogeumbi/${crypto.randomUUID()}.${ext}`;
      const {error}=await client.storage.from(config.bucket).upload(path,file,{contentType:file.type,cacheControl:'31536000',upsert:false});
      if(error)throw new Error('업로드 실패: 버킷 존재 여부와 업로드 권한을 확인해 주세요.');
      const {data}=client.storage.from(config.bucket).getPublicUrl(path);
      try{await new Promise((resolve,reject)=>{const image=new Image();const timer=setTimeout(()=>reject(new Error('이미지 확인 시간 초과')),15000);image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(new Error('공개 이미지에 접근할 수 없습니다.'));};image.src=data.publicUrl;});}catch{throw new Error('파일은 업로드됐지만 공개 읽기를 확인하지 못했습니다. 버킷의 공개 설정을 확인해 주세요. 경로: '+path);}
      return data.publicUrl;
  }
}
if(window.GEUMBI_ADMIN)initStorage();else addEventListener('geumbi-admin-ready',initStorage,{once:true});
