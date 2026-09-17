'use strict';
function initAppearance(){
  const A=window.GEUMBI_ADMIN;if(!A)return;
  const fields=[['introImage','인트로 이미지','세로 화면에 맞춰 채웁니다.','./assets/main2.png'],['mainImage','메인 이미지','캐릭터용 투명 배경 PNG를 권장합니다.','./assets/main.png'],['mainBackground','메인 배경','캐릭터 뒤 영역을 채우는 배경입니다.','']];
  const node=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e;};
  fields.forEach(([key,label,hint,fallback])=>{
    const form=document.createElement('form');form.className='appearance-card';form.dataset.imageSetting=key;
    const preview=document.createElement('img');preview.alt=label+' 미리보기';const placeholder=node('p','기본 그래픽 배경');placeholder.className='appearance-placeholder';
    const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';const fileLabel=node('label',label+' 파일');fileLabel.append(input);
    const status=node('p','');status.setAttribute('role','status');status.className='hint';const save=node('button','저장');save.className='primary';const reset=node('button','기본 이미지로 복원');reset.type='button';const actions=node('div','');actions.className='actions';actions.append(save,reset);
    form.append(node('h3',label),preview,placeholder,node('p',hint),fileLabel,status,actions);document.querySelector('#appearance-fields').append(form);
    let selectedURL='',pendingURL='',busy=false;
    function render(){const url=selectedURL||GEUMBI.imageURL(A.data.settings[key]||fallback);preview.hidden=!url;placeholder.hidden=!!url;if(url)preview.src=url;else preview.removeAttribute('src');}
    function clear(){if(selectedURL)URL.revokeObjectURL(selectedURL);selectedURL='';pendingURL='';input.value='';render();}
    input.addEventListener('change',()=>{if(selectedURL)URL.revokeObjectURL(selectedURL);selectedURL='';pendingURL='';const file=input.files[0];if(file){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024){input.value='';status.textContent='PNG/JPG/WebP 8MB 이하 파일을 선택해 주세요.';}else{selectedURL=URL.createObjectURL(file);status.textContent='저장하면 반영됩니다.';}}render();});
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(busy)return;const file=input.files[0];if(!file){status.textContent='먼저 이미지 파일을 선택해 주세요.';return;}
      busy=true;save.disabled=true;reset.disabled=true;input.disabled=true;status.textContent='저장 중…';
      try{
        await new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(new Error('정상 이미지 파일을 선택해 주세요.'));image.src=selectedURL;});
        if(!pendingURL){if(GEUMBI.local){if(file.size>1024*1024)throw new Error('로컬 예시는 1MB 이하 이미지를 사용해 주세요.');pendingURL=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('파일을 읽지 못했습니다.'));reader.readAsDataURL(file);});}else pendingURL=await GEUMBI_STORAGE.uploadFile(file);}
        if(await A.commit(data=>{data.settings[key]=pendingURL;})){clear();status.textContent='저장했습니다.';}else status.textContent='저장하지 못했습니다. 위 안내를 확인하고 다시 저장해 주세요.';
      }catch(error){status.textContent=error.message;}finally{busy=false;save.disabled=false;reset.disabled=false;input.disabled=false;}
    });
    reset.addEventListener('click',async()=>{if(busy)return;busy=true;reset.disabled=true;save.disabled=true;input.disabled=true;try{if(await A.commit(data=>{delete data.settings[key];})){clear();status.textContent='기본 이미지로 복원했습니다.';}}finally{busy=false;reset.disabled=false;save.disabled=false;input.disabled=false;}});
    addEventListener('geumbi-admin-render',render);render();
  });
}
if(window.GEUMBI_ADMIN)initAppearance();else addEventListener('geumbi-admin-ready',initAppearance,{once:true});
