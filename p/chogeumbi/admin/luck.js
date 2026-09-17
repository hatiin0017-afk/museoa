'use strict';
function initLuckEditor(){
  const A=window.GEUMBI_ADMIN;if(!A)return;const editors=new Map(),node=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e;};
  for(const [kind,title]of [['click','과정 멘트'],['complete','결과 멘트 (100% 충전)']]){
    const card=node('section','');card.className='luck-editor';card.append(node('h3',title));const mode=document.createElement('select');mode.setAttribute('aria-label',title+' 출력 방식');mode.append(new Option('한 가지 고정','fixed'),new Option('랜덤','random'));const modeLabel=node('label','출력 방식');modeLabel.append(mode);card.append(modeLabel);
    const list=node('div','');list.className='luck-message-list';card.append(list);const add=node('button','멘트 추가');add.type='button';card.append(add);
    const fixed=document.createElement('select');fixed.setAttribute('aria-label',title+' 고정 멘트');const fixedLabel=node('label','고정으로 표시할 멘트');fixedLabel.append(fixed);card.append(fixedLabel);
    const preview=node('button','결과 미리보기');preview.type='button';const output=node('p','');output.className='luck-preview';output.setAttribute('role','status');card.append(preview,output);document.querySelector('#luck-setting-fields').append(card);
    function syncOptions(){const previous=fixed.selectedIndex;fixed.replaceChildren();[...list.querySelectorAll('input')].forEach((input,i)=>fixed.append(new Option(`${i+1}. ${input.value||'(멘트를 입력해 주세요)'}`,String(i))));fixed.selectedIndex=Math.max(0,Math.min(previous,fixed.options.length-1));fixedLabel.hidden=mode.value==='random';add.disabled=list.children.length>=30;list.querySelectorAll('button').forEach(b=>b.disabled=list.children.length<=1);}
    function addRow(value=''){const row=node('div',''),input=document.createElement('input');input.type='text';input.maxLength=65;input.value=value;input.setAttribute('aria-label',title+' 문구');const remove=node('button','삭제');remove.type='button';remove.addEventListener('click',()=>{const index=[...list.children].indexOf(row),selected=fixed.selectedIndex;row.remove();syncOptions();fixed.selectedIndex=Math.max(0,Math.min(selected-(index<selected?1:0),fixed.options.length-1));output.textContent='';});input.addEventListener('input',()=>{syncOptions();output.textContent='';});row.append(input,remove);list.append(row);syncOptions();}
    function read(){const messages=[...list.querySelectorAll('input')].map(input=>input.value.trim());if(!messages.length||messages.some(value=>!value))throw new Error(title+'의 빈 문구를 채우거나 삭제해 주세요.');return {mode:mode.value,messages,fixedIndex:Math.max(0,fixed.selectedIndex)};}
    function render(){const value=GEUMBI_LUCK.config(A.data.settings,kind);mode.value=value.mode;list.replaceChildren();value.messages.forEach(addRow);fixed.value=String(value.fixedIndex);syncOptions();output.textContent='';}
    mode.addEventListener('change',()=>{syncOptions();output.textContent='';});fixed.addEventListener('change',()=>output.textContent='');add.addEventListener('click',()=>{if(list.children.length<30)addRow();});
    preview.addEventListener('click',()=>{try{output.textContent=GEUMBI_LUCK.pick({luck:{[kind]:read()}},kind);}catch(error){output.textContent=error.message;}});
    editors.set(kind,{read,render});render();
  }
  window.GEUMBI_LUCK_EDITOR={read(){return {luck:Object.fromEntries([...editors].map(([key,editor])=>[key,editor.read()]))};}};
  addEventListener('geumbi-admin-render',()=>editors.forEach(editor=>editor.render()));
}
if(window.GEUMBI_ADMIN)initLuckEditor();else addEventListener('geumbi-admin-ready',initLuckEditor,{once:true});
