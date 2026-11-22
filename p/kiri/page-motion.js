function createPageTurn(container, pages, initial) {
  let current = initial;
  let running = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const edge = document.createElement('span');
  edge.setAttribute('aria-hidden', 'true');
  edge.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2;background:linear-gradient(170deg,#fefcfa 15%,#f3efef 62%,#cdd9e7)';
  edge.hidden = true;
  container.append(edge);

  function settle(index) {
    if (running) {
      running.effects.forEach(effect => effect.cancel());
      running = null;
    }
    current = index;
    pages.forEach((page, i) => {
      page.hidden = i !== index;
      page.inert = page.hidden;
    });
    edge.hidden = true;
  }

  function show(next) {
    if (next === current) return;
    if (reduced.matches) return settle(next);
    if (running) {
      if (next === running.from || next === running.to) {
        current = next;
        pages.forEach((page, i) => { page.inert = i !== next; });
        running.effects.forEach(effect => effect.reverse());
        return;
      }
      // Retain the larger visible sheet when a third tab interrupts the turn.
      const progress = running.effects[0].effect.getComputedTiming().progress ?? 0;
      settle(progress < 0.5 ? running.from : running.to);
    }

    const from = current;
    current = next;
    const forward = next > from;
    const outgoing = pages[from];
    const incoming = pages[next];
    incoming.hidden = false;
    incoming.inert = false;
    outgoing.inert = true;
    edge.hidden = false;
    // Move a shallow curve from one corner to the opposite edge.
    const heights = [0, 25, 50, 75, 100];
    const curve = [5, 4, 2, -1, -5];
    const foldWidth = [0.1, 0.55, 1.25, 2.4, 4.4];
    const near = forward ? '0%' : '100%';
    const far = forward ? '100%' : '0%';
    const outgoingFrames = [], incomingFrames = [], edgeFrames = [];
    for (const center of [107, 50, -7]) {
      const point = (i, width) => {
        const x = center + curve[i] + width;
        return (forward ? x : 100 - x) + '% ' + heights[i] + '%';
      };
      const boundary = heights.map((_, i) => point(i, 0));
      const folded = heights.map((_, i) => point(i, center === 50 ? foldWidth[i] : 0));
      outgoingFrames.push({clipPath:'polygon('+[near+' 0%', ...boundary, near+' 100%'].join(',')+')'});
      incomingFrames.push({clipPath:'polygon('+[far+' 0%', ...boundary, far+' 100%'].join(',')+')'});
      edgeFrames.push({clipPath:'polygon('+[...boundary,...folded.reverse()].join(',')+')'});
    }
    const timing = {duration:300, easing:'cubic-bezier(.36,.04,.22,1)', fill:'both'};
    const effects = [
      outgoing.animate(outgoingFrames,timing),
      incoming.animate(incomingFrames,timing),
      edge.animate(edgeFrames,timing),
      outgoing.animate([{filter:'blur(0)'},{filter:'blur(.65px)',offset:.5},{filter:'blur(0)'}],timing)
    ];
    running = {from,to:next,effects};
    effects[0].onfinish = () => {
      if (running?.effects === effects) settle(current);
    };
  }
  reduced.addEventListener('change', () => { if (reduced.matches) settle(current); });
  settle(initial);
  return show;
}
