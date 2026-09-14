// Landing page behaviour: the hero plate's real orbit loop plays over the still only when motion is
// welcome (no reduced-motion or data-saver preference), only while on screen, and with a visible
// pause control. The still stays the first paint and the fallback.
(function(){
  var video=document.getElementById('heroLoop');
  var toggle=document.getElementById('loopToggle');
  if(!video||!toggle||!('play' in video))return;
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var saveData=Boolean(navigator.connection&&navigator.connection.saveData);
  if(reduced.matches||saveData)return;
  var narrow=matchMedia('(max-width: 700px)').matches;
  var src=narrow?video.getAttribute('data-src-narrow'):video.getAttribute('data-src');
  if(!src)return;
  var userPaused=false, onScreen=true, ready=false;
  var label=function(){var playing=!video.paused;toggle.textContent=playing?'Pause':'Play';toggle.setAttribute('aria-pressed',String(playing));};
  var settle=function(){if(!ready)return;if(!userPaused&&onScreen&&!reduced.matches){var p=video.play();if(p&&p.catch)p.catch(function(){});}else video.pause();label();};
  video.addEventListener('canplay',function(){if(ready)return;ready=true;video.parentNode.classList.add('is-live');toggle.hidden=false;settle();},{once:true});
  video.addEventListener('play',label);video.addEventListener('pause',label);
  toggle.addEventListener('click',function(){userPaused=!video.paused;settle();});
  reduced.addEventListener('change',settle);
  if('IntersectionObserver' in window){new IntersectionObserver(function(entries){onScreen=entries.some(function(e){return e.isIntersecting});settle();},{threshold:0.2}).observe(video);}
  video.src=src;video.load();
})();
