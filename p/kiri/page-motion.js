function slideSheets(cover, underneath, forward){
  const options={
    duration:420,
    easing:'cubic-bezier(.32,.04,.16,1)',
    fill:'both'
  };
  const coverFrames=[
    {transform:'translateX(101%)',boxShadow:'-4px 0 12px #394f740d'},
    {transform:'translateX(0)',boxShadow:'-2px 0 6px #394f741a'}
  ];
  const underneathFrames=[
    {transform:'translateX(0)'},
    {transform:'translateX(-4%)'}
  ];
  // Blur only in motion. Leave translation to its original continuous easing.
  if(!forward){
    coverFrames.reverse();
    underneathFrames.reverse();
  }
  const softening=[
    {filter:'blur(0px)'},
    {filter:'blur(1.6px)',offset:.43},
    {filter:'blur(0px)'}
  ];
  return [
    cover.animate(coverFrames,options),
    underneath.animate(underneathFrames,options),
    cover.animate(softening,{duration:options.duration,easing:'ease-in-out'}),
    underneath.animate(softening,{duration:options.duration,easing:'ease-in-out'})
  ];
}
