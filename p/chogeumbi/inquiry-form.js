'use strict';
(() => {
  const dialog=document.querySelector('#inquiry-dialog'),form=document.querySelector('#inquiry-form'),status=document.querySelector('#inquiry-status'),opener=document.querySelector('#open-inquiry');
  opener.addEventListener('click',()=>{const x=scrollX,y=scrollY;dialog.showModal();scrollTo({left:x,top:y,behavior:'instant'});});
  document.querySelector('#close-inquiry').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>opener.focus({preventScroll:true}));
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});let busy=false;
  form.addEventListener('submit',async event=>{event.preventDefault();if(busy)return;busy=true;const button=form.querySelector('[type=submit]');button.disabled=true;status.textContent='보내는 중…';
    try{await GEUMBI_INQUIRIES.submit(form.elements.nickname.value,form.elements.content.value);form.reset();status.textContent=GEUMBI.local?'로컬 예시에 접수했습니다.':'문의가 접수되었습니다.';}catch(error){status.textContent=error.message;}finally{busy=false;button.disabled=false;}
  });
})();
