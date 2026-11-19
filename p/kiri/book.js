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
let active=-1;
let motion=[];

function settle(){
  for(const animation of motion) animation.cancel();
  motion=[];
  leaves.forEach((leaf,i)=>{
    leaf.hidden=i!==active;
    leaf.inert=i!==active;
    leaf.style.zIndex='';
  });
}

function turn(previous,next){
  const outgoing=leaves[previous], incoming=leaves[next];
  const direction=next>previous?1:-1;
  outgoing.hidden=false;
  incoming.style.zIndex='1';
  const timing={duration:330,easing:'cubic-bezier(.22,.67,.24,1)'};
  const exit=outgoing.animate([
    {transform:'translateX(0)',filter:'blur(0)'},
    {transform:'translateX('+(-direction*12)+'px)',filter:'blur(1.5px)'}
  ],{...timing,fill:'forwards'});
  const enter=incoming.animate([
    {transform:'translateX('+direction*24+'px)',opacity:0,filter:'blur(2px)'},
    {transform:'translateX(0)',opacity:1,filter:'blur(0)'}
  ],timing);
  motion=[exit,enter];
  enter.onfinish=()=>{if(active===next && motion.includes(enter))settle()};
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
