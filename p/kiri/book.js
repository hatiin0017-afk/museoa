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
  const forward=next>previous;
  const cover=leaves[forward?next:previous];
  const underneath=leaves[forward?previous:next];
  leaves[previous].hidden=false;
  cover.style.zIndex='1';
  motion=slideSheets(cover,underneath,forward);
  const slide=motion[0];
  slide.onfinish=()=>{if(motion.includes(slide))settle()};

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
