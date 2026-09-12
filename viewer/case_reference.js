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
}
