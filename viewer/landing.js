// Landing page behaviour: the hero film plays only while it is on screen, respects reduced motion
// and the data-saver preference, and has a visible toggle.
const film=document.getElementById('heroFilm');
const toggle=document.getElementById('filmToggle');
if(film&&toggle){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const saveData=Boolean(navigator.connection&&navigator.connection.saveData);
  let userPaused=false;
  let onScreen=true;
  const label=()=>{const playing=!film.paused;toggle.textContent=playing?'Pause':'Play';toggle.setAttribute('aria-pressed',String(playing));};
  const play=()=>film.play().then(label,label);
  const pause=()=>{film.pause();label();};
  const autoAllowed=()=>!reduced.matches&&!saveData&&!userPaused&&onScreen;
  const settle=()=>autoAllowed()?play():pause();
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{onScreen=entries.some(e=>e.isIntersecting);settle();},{threshold:0.25});
    io.observe(film);
  }else settle();
  reduced.addEventListener('change',settle);
  toggle.addEventListener('click',()=>{userPaused=!film.paused;film.paused?play():pause();});
  film.addEventListener('play',label);film.addEventListener('pause',label);
  label();
}
