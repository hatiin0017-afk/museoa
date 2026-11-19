const leaves = [...document.querySelectorAll('.leaf')];
const links = [...document.querySelectorAll('header a')];
const titles = ['메인','상세 프로필','업보책','노래책'];
let active = -1;
let running = [];

function openPage() {
  const found = leaves.findIndex(leaf => '#'+leaf.dataset.page === location.hash);
  const next = Math.max(0, found);
  if (next === active) return;
  running.forEach(animation => animation.cancel());
  running = [];
  const previous = active;
  active = next;
  leaves.forEach((leaf,i) => {
    leaf.hidden = i !== next;
    leaf.inert = i !== next;
    leaf.style.zIndex = '';
    leaf.classList.remove('turning');
  });
  links.forEach(link => {
    if (link.hash === '#'+leaves[next].dataset.page) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  document.title = titles[next]+' · 키리';
  if (previous < 0) return;
  window.scrollTo({top:0,behavior:'instant'});
  if (document.querySelector('dialog').open) document.querySelector('dialog').close();
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const forward = next > previous;
  const turning = leaves[forward ? previous : next];
  leaves[previous].hidden = false;
  turning.classList.add('turning');
  turning.style.zIndex = 2;
  const frames = [
    {transform:'rotateY(0deg) skewY(0deg)',filter:'brightness(1)',opacity:1},
    {transform:'rotateY(-45deg) skewY(-2deg)',filter:'brightness(.92)',opacity:1,offset:.48},
    {transform:'rotateY(-94deg) skewY(-4deg)',filter:'brightness(.76)',opacity:0}
  ];
  const opts = {duration:560,easing:'cubic-bezier(.38,.04,.22,1)',direction:forward?'normal':'reverse'};
  const flip = turning.animate(frames,opts);
  const shade = turning.animate([{opacity:0},{opacity:.65,offset:.52},{opacity:.08}],{...opts,pseudoElement:'::after'});
  running=[flip,shade];
  flip.onfinish=()=>{
    leaves[previous].hidden=true;
    turning.classList.remove('turning');
    turning.style.zIndex='';
  };
}
window.addEventListener('hashchange',openPage);
openPage();
