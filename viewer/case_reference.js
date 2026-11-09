// Keep reference browsing isolated, including a round trip through Sources.
export const caseReference=new URLSearchParams(location.search).get('caseReference')==='1';
if(caseReference){
  document.getElementById('caseConferenceLink')?.setAttribute('hidden','');
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&window.parent!==window){event.preventDefault();window.parent.postMessage({type:'hodos:close-reference'},location.origin);}
  });
  document.addEventListener('click',event=>{
    const a=event.target.closest?.('a[href]');if(!a)return;
    const url=new URL(a.href,location.href);
    if(url.origin===location.origin&&!a.hash){url.searchParams.set('caseReference','1');a.href=url.href;}
  },true);
  // Embedded in Case Conference, a followed link replaces the frame's page, so the conference's Back never lands on a
  // dead frame entry. Runs last (window, bubble): links the page already handles stay untouched.
  if(window.parent!==window)addEventListener('click',event=>{
    const a=event.target.closest?.('a[href]');
    if(!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||a.target||a.hasAttribute('download'))return;
    const url=new URL(a.href,location.href);if(url.origin!==location.origin)return;
    event.preventDefault();location.replace(url.href);
  });
}
