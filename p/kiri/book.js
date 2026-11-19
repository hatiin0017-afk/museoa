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
fold.innerHTML='<defs><linearGradient id="paper"><stop stop-color="#aebbd0"/><stop offset=".38" stop-color="#e5eaf4"/><stop offset=".78" stop-color="#fff"/><stop offset="1" stop-color="#e4e9f4"/></linearGradient></defs><path fill="#496386" opacity=".12"/><path fill="url(#paper)"/>';
const [shadow,crease]=fold.querySelectorAll('path');
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
    const elapsed=Math.min(1,(now-start)/780);
    const eased=elapsed*elapsed*(3-2*elapsed);
    const t=forward?eased:1-eased;
    const bow=Math.sin(Math.PI*t);
    const center=1000*(1-t);
    const top=center+165*bow,bottom=center-185*bow;
    const mid=center+70*bow,width=78*bow;
    const toPercent=n=>(n/10)+'%';
    const points=['0 0',toPercent(top)+' 0'];
    for(let i=1;i<=24;i++){
      const y=i/24,x=(1-y)**2*top+2*(1-y)*y*mid+y*y*bottom;
      points.push(toPercent(x)+' '+(100*y)+'%');
    }
    upper.style.clipPath='polygon('+points.join(',')+',0 100%)';
    const edge='M '+top+' 0 Q '+mid+' 500 '+bottom+' 1000';
    crease.setAttribute('d',edge+' Q '+(mid-width*1.7)+' 540 '+(top-width*.24)+' 0 Z');
    shadow.setAttribute('d',edge+' Q '+(mid+width*.65)+' 490 '+(top+width*.15)+' 0 Z');
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
