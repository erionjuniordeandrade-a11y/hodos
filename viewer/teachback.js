/** Teach-back checklist diff. A resident explains a lesson aloud or in writing; this module
 * reports which authored relationships were not named. Pure string matching: no model,
 * no score, no grade. The transcript is only read here and is never returned or stored. */

/** Lowercase, strip diacritics, turn hyphens/underscores/punctuation into spaces, collapse
 * whitespace. The prefix "sub-" is joined to its word ("sub-cortical" → "subcortical"), and a
 * detached "sub" before cortex/cortical is joined too, so neither reads as a cortical synonym. */
export function normalizeTranscript(text){
  return String(text??'').normalize('NFD').replace(/\p{M}+/gu,'').toLowerCase()
    .replace(/(^|[^\p{L}\p{N}])sub[-_‐‑]+(?=\p{L})/gu,'$1sub')
    .replace(/[^\p{L}\p{N}]+/gu,' ').trim()
    .replace(/(^| )sub (?=cort(?:ex|ic))/g,'$1sub');
}

const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
/** Whole-word/phrase pattern; the last word tolerates a simple s/es plural. */
function synonymPattern(synonym){
  const phrase=normalizeTranscript(synonym);
  if(!phrase)return null;
  return new RegExp(`(?<=^| )${phrase.split(' ').map(escape).join(' ')}(?:e?s)?(?= |$)`,'gu');
}

/** Terms carried by a lesson's takeaways, each with the step its takeaway revisits. */
export function teachbackTerms(takeaways){
  const out=[];
  for(const point of takeaways||[])for(const term of point?.terms||[])out.push({...term,step:point.step});
  return out;
}

/** Every synonym hit across all terms becomes a span on the normalized transcript. Spans are
 * accepted longest first (then earliest); a hit overlapping an accepted span is discarded, so
 * "dentato-rubro-thalamic" names the cerebellar route, not the thalamus. */
export function matchTeachback(transcript,takeaways){
  const text=normalizeTranscript(transcript),terms=teachbackTerms(takeaways),hits=[];
  for(const term of terms)for(const synonym of [...(term.en||[]),...(term.pt||[])]){
    const pattern=synonymPattern(synonym);if(!pattern)continue;
    for(const match of text.matchAll(pattern))hits.push({id:term.id,start:match.index,end:match.index+match[0].length});
  }
  hits.sort((a,b)=>(b.end-b.start)-(a.end-a.start)||a.start-b.start);
  const accepted=[],namedIds=new Set();
  for(const hit of hits){
    if(accepted.some(span=>hit.start<span.end&&span.start<hit.end))continue;
    accepted.push(hit);namedIds.add(hit.id);
  }
  const named=[],missing=[];
  for(const term of terms){
    if(namedIds.has(term.id)){if(!named.includes(term.id))named.push(term.id);}
    else missing.push({termId:term.id,label:term.label,step:term.step});
  }
  return {named,missing};
}
