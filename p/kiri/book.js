const frameBox=document.querySelector('.book-frame');
const book=frameBox.querySelector('.book');
function fitBook(){
  book.style.transform='scale('+frameBox.clientWidth/book.offsetWidth+')';
}
new ResizeObserver(fitBook).observe(frameBox);
fitBook();
const leaves=[...document.querySelectorAll('.leaf')];
const links=[...document.querySelectorAll('header a')];
const titles=['메인','상세 프로필','업보책','노래책'];
const stage=document.querySelector('.stage');
const ns='http://www.w3.org/2000/svg';
const fold=document.createElementNS(ns,'svg');
fold.setAttribute('class','fold-art');
fold.setAttribute('aria-hidden','true');
fold.setAttribute('viewBox','0 0 1000 1000');
fold.setAttribute('preserveAspectRatio','none');
fold.innerHTML=`
  <defs>
    <linearGradient id="paper-light" gradientUnits="userSpaceOnUse" x1="-1" x2="0">
      <stop stop-color="#aaa9bd"/><stop offset=".14" stop-color="#dedde4"/>
      <stop offset=".41" stop-color="#fffdf0"/><stop offset=".70" stop-color="#faf8ef"/>
      <stop offset=".94" stop-color="#d8d7df"/><stop offset="1" stop-color="#bcbacb"/>
    </linearGradient>
    <pattern id="paper-ruling" width="96" height="29" patternUnits="userSpaceOnUse">
      <path d="M0 28.4 Q48 26.8 96 28.4" fill="none" stroke="#abb7ce" stroke-width="1" opacity=".52"/>
      <path d="m8 6 2 .3m15 8 1.6 -.4m13 -3 2 .5m16 10 2 -.3m22 -16 1.6 .4" stroke="#afa7a2" opacity=".34" fill="none"/>
    </pattern>
    <filter id="lift-shadow" x="-90%" width="280%" y="-10%" height="120%">
      <feGaussianBlur stdDeviation="7"/>
    </filter>
  </defs>
  <path class="cast" fill="#3f4164" filter="url(#lift-shadow)"/>
  <path class="reverse" fill="url(#paper-light)"/>
  <path class="ruling" fill="url(#paper-ruling)"/>
  <path class="rim" fill="none" stroke="#fffef6" stroke-width="2.3"/>
`;
const shadow=fold.querySelector('.cast'),back=fold.querySelector('.reverse');
const ruling=fold.querySelector('.ruling'),rim=fold.querySelector('.rim');
const light=fold.querySelector('#paper-light'),pattern=fold.querySelector('#paper-ruling');
let active=-1, frame=0;

function settle(){
  cancelAnimationFrame(frame);fold.remove();
  leaves.forEach((leaf,i)=>{
    leaf.hidden=i!==active;
    leaf.inert=i!==active;
    leaf.style.clipPath='';
    leaf.style.zIndex='';
  });
}

function turn(previous,next){
  const forward=next>previous;
  const upper=leaves[forward?previous:next];
  leaves[previous].hidden=false;
  upper.style.zIndex=2;
  stage.append(fold);
  const start=performance.now();
  function paint(now){
    const elapsed=Math.min(1,(now-start)/880);
    const eased=elapsed*elapsed*(3-2*elapsed);
    const t=forward?eased:1-eased;
    const bow=Math.sin(Math.PI*t);
    const center=1000*(1-t);
    const top=center+165*bow,bottom=center-185*bow;
    const mid=center+70*bow,width=170*bow;
    const toPercent=n=>(n/10)+'%';
    const points=['0 0',toPercent(top)+' 0'];
    for(let i=1;i<=24;i++){
      const y=i/24,x=(1-y)**2*top+2*(1-y)*y*mid+y*y*bottom;
      points.push(toPercent(x)+' '+(100*y)+'%');
    }
    upper.style.clipPath='polygon('+points.join(',')+',0 100%)';
    const edge='M '+top+' 0 Q '+mid+' 500 '+bottom+' 1000';
    const sheetBack=edge+' L '+(bottom-width*.88)+' 1000 Q '+(mid-width*1.16)+' 510 '+(top-width*.52)+' 0 Z';
    back.setAttribute('d',sheetBack);
    ruling.setAttribute('d',sheetBack);
    rim.setAttribute('d',edge);
    rim.style.opacity=bow;
    // Keep the light and the fine rules attached to the moving sheet.
    light.setAttribute('gradientTransform','matrix('+Math.max(width,1)+' 0 '+((bottom-top)/1000)+' 1 '+top+' 0)');
    pattern.setAttribute('patternTransform','translate('+center+' 0) skewY('+(-6*bow)+') scale('+(1-.28*bow)+' 1)');
    const lift=width*.46;
    shadow.setAttribute('d',edge+' L '+(bottom+lift*.65)+' 1000 Q '+(mid+lift)+' 500 '+(top+lift*.25)+' 0 Z');
    shadow.style.opacity=.26*bow;
    if(elapsed<1)frame=requestAnimationFrame(paint);else settle();
  }
  paint(start);
}

function openPage(){
  const next=Math.max(0,leaves.findIndex(leaf=>'#'+leaf.dataset.page===location.hash));
  if(next===active)return;
  const previous=active;
  active=next;settle();
  links.forEach(link=>{
    if(link.hash==='#'+leaves[next].dataset.page)link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  document.title=titles[next]+' · 키리';
  if(previous<0)return;
  window.scrollTo({top:0,behavior:'instant'});
  const dialog=document.querySelector('dialog');
  if(dialog.open)dialog.close();
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches)turn(previous,next);
}
window.addEventListener('hashchange',openPage);
openPage();
