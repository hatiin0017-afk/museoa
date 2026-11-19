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
      <stop stop-color="#f3f0e8"/><stop offset=".68" stop-color="#fbfaf4"/>
      <stop offset="1" stop-color="#e2e0dc"/>
    </linearGradient>
    <pattern id="paper-ruling" width="96" height="29" patternUnits="userSpaceOnUse">
      <path d="M0 28.4 Q48 26.8 96 28.4" fill="none" stroke="#abb7ce" stroke-width="1" opacity=".28"/>
      <path d="m8 6 2 .3m15 8 1.6 -.4m13 -3 2 .5m16 10 2 -.3m22 -16 1.6 .4" stroke="#afa7a2" opacity=".22" fill="none"/>
    </pattern>
    <filter id="lift-shadow" x="-90%" width="280%" y="-10%" height="120%">
      <feGaussianBlur stdDeviation="7"/>
    </filter>
  </defs>
  <path class="cast" fill="#3f4164" filter="url(#lift-shadow)"/>
  <path class="reverse" fill="url(#paper-light)"/>
  <path class="ruling" fill="url(#paper-ruling)"/>
  <path class="rim" fill="none" stroke="#a8a7ad" stroke-width="1"/>
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
    const elapsed=Math.min(1,(now-start)/940);
    const clock=forward?elapsed:1-elapsed;
    // A small dog-ear forms before the upper edge starts to travel.
    const ease=v=>v*v*(3-2*v);
    const lift=ease(Math.min(clock/.24,1));
    const sweep=ease(Math.max(0,(clock-.15)/.85));
    const bottom=1000-86*lift-1160*sweep;
    const slant=810*(1-sweep)+72;
    const bow=74*Math.sin(Math.PI*sweep);
    const hinge=y=>bottom+slant*(1-y)+bow*Math.sin(Math.PI*y);
    const face=['0 0'],seam=[],freeEdge=[],penumbra=[];
    for(let i=0;i<=48;i++){
      const y=i/48,x=hinge(y),height=y*1000;
      face.push(Math.max(0,Math.min(x,1000))/10+'% '+y*100+'%');
      // Start exactly at the right edge where the fold enters the sheet.
      if(x>1000)continue;
      if(!seam.length && i>0){
        const entry=height-(1000-x)/(hinge(y-1/48)-x)*1000/48;
        const tip='1000 '+entry;
        seam.push(tip);freeEdge.push(tip);penumbra.push(tip);
      }
      const loose=1000-x;
      const curl=loose/(1+loose/180);
      seam.push(x+' '+height);
      freeEdge.push((x-.85*curl)+' '+(height-.76*curl*slant/882));
      penumbra.push((x+.19*curl)+' '+(height+.06*curl));
    }
    upper.style.clipPath='polygon('+face.join(',')+',0 100%)';
    const edge='M '+seam.join(' L ');
    const paper=edge+' L '+freeEdge.reverse().join(' L ')+' Z';
    back.setAttribute('d',paper);
    ruling.setAttribute('d',paper);
    rim.setAttribute('d','M '+freeEdge.join(' L '));
    rim.style.opacity=.4*lift;
    const top=hinge(0);
    light.setAttribute('gradientTransform','matrix(130 0 '+(-slant/1000)+' 1 '+top+' 0)');
    pattern.setAttribute('patternTransform','translate('+bottom+' 0) skewY('+(-8*lift*(1-sweep))+')');
    shadow.setAttribute('d',edge+' L '+penumbra.reverse().join(' L ')+' Z');
    shadow.style.opacity=.19*lift;
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
