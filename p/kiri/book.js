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
function routeIndex(){
  return Math.max(0,leaves.findIndex(leaf=>'#'+leaf.dataset.page===location.hash));
}
const turnPage=createPageTurn(document.querySelector('.stage'),leaves,routeIndex());
const artwork=new Map();
let navigation=0;

async function openPage(){
  const next=routeIndex();
  const request=++navigation;
  const name=leaves[next].dataset.page;
  links.forEach(link=>{
    if(link.hash==='#'+name)link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  document.title=titles[next]+' · 키리';
  if(request===1)return;
  window.scrollTo({top:0,behavior:'instant'});
  const dialog=document.querySelector('dialog');
  if(dialog.open)dialog.close();
  if(!artwork.has(name)){
    const image=new Image();
    image.src='assets/'+name+'.webp';
    artwork.set(name,image.decode().catch(()=>artwork.delete(name)));
  }
  await artwork.get(name);
  if(request===navigation)turnPage(next);
}
window.addEventListener('hashchange',openPage);
openPage();
