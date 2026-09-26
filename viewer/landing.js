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
  var label=function(){var playing=!video.paused;toggle.textContent=playing?'Pause the walkthrough':'Play the walkthrough';toggle.setAttribute('aria-pressed',String(playing));};
  var settle=function(){if(!ready)return;if(!userPaused&&onScreen&&!reduced.matches){var p=video.play();if(p&&p.catch)p.catch(function(){});}else video.pause();label();};
  video.addEventListener('canplay',function(){if(ready)return;ready=true;video.parentNode.classList.add('is-live');toggle.hidden=false;settle();},{once:true});
  video.addEventListener('play',label);video.addEventListener('pause',label);
  toggle.addEventListener('click',function(){userPaused=!video.paused;settle();});
  reduced.addEventListener('change',settle);
  if('IntersectionObserver' in window){new IntersectionObserver(function(entries){onScreen=entries.some(function(e){return e.isIntersecting});settle();},{threshold:0.2}).observe(video);}
  video.src=src;video.load();
})();

// Family tiles: each loop is fetched only as its tile nears the viewport, plays while on screen,
// and one control pauses all of them. Same motion and data-saver conditions as the hero.
(function(){
  var loops=[].slice.call(document.querySelectorAll('.family-loop'));
  var toggle=document.getElementById('familiesToggle');
  if(!loops.length||!toggle||!('IntersectionObserver' in window)||!('play' in loops[0]))return;
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches||(navigator.connection&&navigator.connection.saveData))return;
  var userPaused=false, visible=new Set();
  var label=function(){toggle.textContent=userPaused?'Play the loops':'Pause the loops';toggle.setAttribute('aria-pressed',String(!userPaused));};
  var settle=function(v){if(!v.parentNode.classList.contains('is-live'))return;if(!userPaused&&visible.has(v)&&!reduced.matches){var p=v.play();if(p&&p.catch)p.catch(function(){});}else v.pause();};
  var all=function(){loops.forEach(settle);label();};
  loops.forEach(function(v){v.addEventListener('canplay',function(){v.parentNode.classList.add('is-live');toggle.hidden=false;settle(v);label();},{once:true});});
  var load=new IntersectionObserver(function(entries){entries.forEach(function(e){if(!e.isIntersecting)return;var v=e.target;load.unobserve(v);v.src=v.getAttribute('data-src');v.load();});},{rootMargin:'300px 0px'});
  var watch=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target);settle(e.target);});},{threshold:0.25});
  loops.forEach(function(v){load.observe(v);watch.observe(v);});
  toggle.addEventListener('click',function(){userPaused=!userPaused;all();});
  reduced.addEventListener('change',all);
})();

// Lesson demo: a recording of the live lesson player, wide screens only (phones keep the still).
(function(){
  var video=document.getElementById('demoLoop');
  var toggle=document.getElementById('demoToggle');
  if(!video||!toggle||!('play' in video)||!('IntersectionObserver' in window))return;
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches||(navigator.connection&&navigator.connection.saveData)||matchMedia('(max-width: 700px)').matches)return;
  var userPaused=false, onScreen=false, ready=false, requested=false;
  var label=function(){var playing=!video.paused;toggle.textContent=playing?'Pause the walkthrough':'Play the walkthrough';toggle.setAttribute('aria-pressed',String(playing));};
  var settle=function(){if(!ready)return;if(!userPaused&&onScreen&&!reduced.matches){var p=video.play();if(p&&p.catch)p.catch(function(){});}else video.pause();label();};
  video.addEventListener('canplay',function(){if(ready)return;ready=true;video.parentNode.classList.add('is-live');toggle.hidden=false;settle();},{once:true});
  video.addEventListener('play',label);video.addEventListener('pause',label);
  toggle.addEventListener('click',function(){userPaused=!video.paused;settle();});
  reduced.addEventListener('change',settle);
  new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting&&!requested){requested=true;video.src=video.getAttribute('data-src');video.load();}});},{rootMargin:'300px 0px'}).observe(video);
  new IntersectionObserver(function(entries){onScreen=entries.some(function(e){return e.isIntersecting});settle();},{threshold:0.3}).observe(video);
})();
