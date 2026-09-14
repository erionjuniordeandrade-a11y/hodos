// Landing page behaviour: the hero film respects reduced motion and has a visible toggle.
const film=document.getElementById('heroFilm');
const toggle=document.getElementById('filmToggle');
if(film&&toggle){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const label=()=>{const playing=!film.paused;toggle.textContent=playing?'Pause':'Play';toggle.setAttribute('aria-pressed',String(playing));};
  const play=()=>film.play().then(label,label);
  const pause=()=>{film.pause();label();};
  if(reduced.matches)pause();else play();
  reduced.addEventListener('change',e=>e.matches?pause():play());
  toggle.addEventListener('click',()=>film.paused?play():pause());
  film.addEventListener('play',label);film.addEventListener('pause',label);
  label();
}
