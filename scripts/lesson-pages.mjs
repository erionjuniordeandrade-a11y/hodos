import {LESSONS,SOURCES,REGIONS,sourceIdsForStep} from '../viewer/lesson_content.js';
import {CURRICULUM,TEACHING_GUIDES} from '../viewer/lesson_briefings.js';

export const SITE_ORIGIN='https://hodosatlas.com';
const AUTHOR={"@type":'Person',"@id":`${SITE_ORIGIN}/#erion`,name:'Dr. Erion de Andrade',honorificPrefix:'Dr.',jobTitle:'Neurosurgeon',url:'https://www.dreriondeandrade.com.br/'};
const COURSE={"@type":'Course',name:'Hodos',url:`${SITE_ORIGIN}/`};
const LESSON_KEYS=new Set(['id','title','minutes','summary','goals','steps','audience','reviewStatus','category','referenceOnly','version']);
const STEP_KEYS=new Set(['title','text','observe','anatomy','surgical','question','answer','sources','scene','regions','evidenceClass','notes','targets','referencePlate']);
const TARGET_KEYS=new Set(['kind','id','label']);
export const LESSON_NON_CONTENT_KEYS=Object.freeze({reviewStatus:'publication state',referenceOnly:'reference-mode flag',version:'content version metadata'});
export const STEP_NON_CONTENT_KEYS=Object.freeze({scene:'interactive scene and camera state',referencePlate:'interactive reference-media handle'});
const TARGET_NON_CONTENT_KEYS=Object.freeze({kind:'interactive target type',id:'interactive target identifier'});

const htmlEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jsonEscape=value=>JSON.stringify(value).replace(/[<>&]/g,c=>({'<':'\\u003c','>':'\\u003e','&':'\\u0026'}[c]));
const text=value=>htmlEscape(value);
const list=value=>Array.isArray(value)&&value.length?value.map(item=>`<li>${text(item)}</li>`).join(''):'<li>None authored.</li>';
const unique=value=>[...new Set(value)];
const evidenceLabel=value=>text(String(value).replaceAll('_',' '));

function assertKeys(value,allowed,excluded,label){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`Expected ${label} object`);
  for(const key of Object.keys(value))if(!allowed.has(key)&&!Object.hasOwn(excluded,key))throw Error(`Unknown ${label} key: ${key}`);
}

export function validateLessonKeys(lessons=LESSONS){
  if(!Array.isArray(lessons)||lessons.length!==14)throw Error(`Expected exactly 14 lessons, found ${lessons?.length??'invalid'}`);
  const ids=new Set();
  for(const lesson of lessons){
    assertKeys(lesson,LESSON_KEYS,LESSON_NON_CONTENT_KEYS,'lesson');
    if(typeof lesson.id!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lesson.id)||ids.has(lesson.id))throw Error(`Invalid or duplicate lesson id: ${lesson.id}`);
    if(typeof lesson.title!=='string'||!lesson.title.trim()||typeof lesson.summary!=='string'||!lesson.summary.trim()||typeof lesson.category!=='string'||!lesson.category.trim()||typeof lesson.audience!=='string'||!lesson.audience.trim())throw Error(`Invalid lesson text: ${lesson.id}`);
    if(!Number.isInteger(lesson.minutes)||lesson.minutes<=0||!Array.isArray(lesson.goals)||lesson.goals.some(goal=>typeof goal!=='string'||!goal.trim())||!Array.isArray(lesson.steps)||!lesson.steps.length)throw Error(`Invalid lesson metadata: ${lesson.id}`);
    ids.add(lesson.id);
    lesson.steps.forEach((step,index)=>{
      assertKeys(step,STEP_KEYS,STEP_NON_CONTENT_KEYS,`step ${lesson.id}/${index+1}`);
      for(const field of ['title','text','observe','surgical','question','answer','notes','evidenceClass'])if(typeof step[field]!=='string'||!step[field].trim())throw Error(`Invalid step ${lesson.id}/${index+1} field ${field}`);
      if(!Array.isArray(step.anatomy)||step.anatomy.some(item=>typeof item!=='string'||!item.trim())||!Array.isArray(step.sources)||!Array.isArray(step.regions)||(step.targets!=null&&!Array.isArray(step.targets)))throw Error(`Invalid step ${lesson.id}/${index+1} arrays`);
      for(const target of step.targets||[]){
        assertKeys(target,TARGET_KEYS,TARGET_NON_CONTENT_KEYS,`target ${lesson.id}/${index+1}`);
        if(typeof target.label!=='string'||!target.label.trim())throw Error(`Invalid target label ${lesson.id}/${index+1}`);
      }
    });
  }
  return true;
}

export function lessonIdsInCurriculum(lessons=LESSONS){
  validateLessonKeys(lessons);
  const byId=new Map(lessons.map(lesson=>[lesson.id,lesson]));
  const ids=CURRICULUM.flatMap(group=>group.ids);
  if(ids.length!==lessons.length||new Set(ids).size!==ids.length||ids.some(id=>!byId.has(id)))throw Error('Curriculum does not cover exactly the lesson data');
  return ids;
}

function sourceURL(source,id){
  if(!source||typeof source!=='object'||source.id!==id||typeof source.title!=='string'||typeof source.scope!=='string'||typeof source.evidenceClass!=='string')throw Error(`Invalid source ${id}`);
  if(Object.keys(source).some(key=>!['id','title','url','evidenceClass','scope'].includes(key)))throw Error(`Unknown source ${id} key`);
  if(typeof source.url!=='string'||!/^https:\/\/(?:pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/?|doi\.org\/[^?#]+)$/.test(source.url))throw Error(`Unsupported source URL ${id}`);
  return source.url;
}

function regionCard(id,regions,sources){
  const region=regions[id];
  if(!region||Object.keys(region).some(key=>!['name','text','sources','evidenceClass'].includes(key)))throw Error(`Invalid region ${id}`);
  if(typeof region.name!=='string'||typeof region.text!=='string'||typeof region.evidenceClass!=='string'||!Array.isArray(region.sources))throw Error(`Invalid region ${id}`);
  const links=region.sources.map(sourceId=>{const source=sources[sourceId];const url=sourceURL(source,sourceId);return `<a href="${htmlEscape(url)}" target="_blank" rel="noopener noreferrer">${text(sourceId)}</a>`;}).join(' · ');
  return `<section class="lesson-region"><h4>${text(region.name)}</h4><p>${text(region.text)}</p><p class="lesson-region-meta">Evidence class: ${evidenceLabel(region.evidenceClass)} · ${links}</p></section>`;
}

function sourceList(ids,sources,className='lesson-source-list'){
  return `<ol class="${className}">${ids.map(id=>{const source=sources[id],url=sourceURL(source,id);return `<li><a href="${htmlEscape(url)}" target="_blank" rel="noopener noreferrer">${text(id)} · ${text(source.title)}</a><p>${text(source.scope)}</p><p class="lesson-source-meta">Evidence class: ${evidenceLabel(source.evidenceClass)}</p></li>`;}).join('')}</ol>`;
}

function metaDescription(summary){
  const max=160;
  if(summary.length<=max)return summary;
  const cut=summary.slice(0,max+1).replace(/\s+\S*$/,'').trim();
  if(!cut)throw Error('Cannot produce a word-boundary meta description');
  return cut;
}

function breadcrumb(items){
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((item,index)=>`<li>${item.url?`<a href="${htmlEscape(item.url)}">${text(item.name)}</a>`:text(item.name)}</li>`).join('')}</ol></nav>`;
}

function jsonLdScript(value){return `<script type="application/ld+json">${jsonEscape(value)}</script>`;}

function head({title,description,url,jsonLd,styles=['tokens.css','hodos.css','lesson-page.css']}){
  const meta=metaDescription(description);
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text(title)} · Hodos</title><meta name="author" content="Dr. Erion de Andrade"><meta name="description" content="${text(meta)}"><link rel="canonical" href="${htmlEscape(url)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Hodos"><meta property="og:title" content="${text(title)} · Hodos"><meta property="og:description" content="${text(meta)}"><meta property="og:url" content="${htmlEscape(url)}"><meta property="og:image" content="${SITE_ORIGIN}/brand/hodos-og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Hodos wordmark over a rendered reference brain with sampled white matter pathways."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${text(title)} · Hodos"><meta name="twitter:description" content="${text(meta)}"><meta name="twitter:image" content="${SITE_ORIGIN}/brand/hodos-og.png"><meta name="theme-color" content="#0f1215"><link rel="icon" href="/brand/hodos-favicon.svg" type="image/svg+xml">${styles.map(style=>`<link rel="stylesheet" href="/${style}">`).join('')}${jsonLdScript(jsonLd)}`;
}

function cleanPath(target){
  if(target==='')return '/';
  for(const [file,route] of [['index.html','/'],['atlas.html','/atlas'],['atlas-sources.html','/atlas-sources'],['case-conference.html','/case-conference'],['mips.html','/mips'],['lessons.html','/lessons']])if(target===file||target.startsWith(`${file}?`)||target.startsWith(`${file}#`))return `${route}${target.slice(file.length)}`;
  return `/${target}`;
}

export function rootAbsoluteMarkup(markup){
  return markup.replace(/\b(href|src)=(['"])\.\/([^'"]*)\2/g,(_,attribute,quote,target)=>`${attribute}=${quote}${cleanPath(target)}${quote}`);
}

export function extractSingleElement(markup,tag,label,className){
  const elements=[...markup.matchAll(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`,'gi'))].map(match=>match[0]);
  if(elements.length!==1)throw Error(`Expected exactly one ${label}, found ${elements.length}`);
  if(className&&!new RegExp(`\\bclass\\s*=\\s*["'][^"']*\\b${className}\\b[^"']*["']`,'i').test(elements[0]))throw Error(`Expected ${label} to have class ${className}`);
  return elements[0];
}

function draftNotice(sourceHTML){
  const matches=[...sourceHTML.matchAll(/Lesson text is an educational draft awaiting anatomical review\./g)];
  if(matches.length!==1)throw Error(`Expected exactly one lesson draft notice, found ${matches.length}`);
  return matches[0][0];
}

function page({headHTML,headerHTML,bodyHTML,footerHTML}){return `<!doctype html><html lang="en"><head>${headHTML}</head><body><a class="skip-link" href="#lessonMain">Skip to content</a>${headerHTML}${bodyHTML}${footerHTML}</body></html>\n`;}

function lessonJSON(lesson,url){
  return {"@context":'https://schema.org',"@graph":[{"@type":'LearningResource',name:lesson.title,description:lesson.summary,url,timeRequired:`PT${lesson.minutes}M`,inLanguage:'en',isAccessibleForFree:true,author:AUTHOR,isPartOf:COURSE,learningResourceType:'Interactive lesson'}, {"@type":'BreadcrumbList',itemListElement:[{"@type":'ListItem',position:1,name:'Hodos',item:`${SITE_ORIGIN}/`},{"@type":'ListItem',position:2,name:'Lessons',item:`${SITE_ORIGIN}/lessons`},{"@type":'ListItem',position:3,name:lesson.title,item:url}]}]};
}

function renderStep(lesson,step,index,sources,regions){
  const targets=step.targets||[];
  const targetPrompt=targets.length?'Select each structure to light it on the atlas, then rotate until you can name what lies in front, behind and beneath it.':'Rotate the atlas until you can name what lies in front, behind and beneath the displayed structures.';
  const targetList=targets.length?`<h4>Targets</h4><ul class="lesson-targets">${targets.map(target=>`<li>${text(target.label)}</li>`).join('')}</ul>`:'';
  const sourceIds=unique(sourceIdsForStep(step,regions));
  const regionCards=step.regions.map(id=>regionCard(id,regions,sources)).join('');
  const directSources=unique(step.sources).map(id=>{const source=sources[id],url=sourceURL(source,id);return `<li><a href="${htmlEscape(url)}" target="_blank" rel="noopener noreferrer">${text(id)} · ${text(source.title)}</a></li>`;}).join('');
  return `<article class="lesson-relationship" id="relationship-${index+1}"><p class="lesson-step-meta">Relationship ${index+1} of ${lesson.steps.length} · ${evidenceLabel(step.evidenceClass)}</p><h2>${text(step.title)}</h2><section class="lesson-orient"><h3>Orient</h3><p>${text(step.text)}</p><p>${text(targetPrompt)}</p>${targetList}</section><section class="lesson-compare"><h3>Compare</h3><p>${text(step.observe)}</p><h4>Read the neighbours</h4><ul>${list(step.anatomy)}</ul></section><section class="lesson-question"><h3>Explain before revealing</h3><p>${text(step.question)}</p><details class="lesson-explanation"><summary>Explanation</summary><p>${text(step.answer)}</p></details></section><section class="lesson-surgical"><h3>In a surgical discussion</h3><p>${text(step.surgical)}</p></section><details class="lesson-step-notes"><summary>Sources &amp; anatomy notes</summary><p class="lesson-evidence">Evidence class: ${evidenceLabel(step.evidenceClass)}</p>${directSources?`<ul class="lesson-step-sources">${directSources}</ul>`:''}${regionCards}<details class="lesson-teaching-notes"><summary>Teaching notes</summary><p>${text(step.notes)}</p></details><p class="lesson-step-source-count">This relationship draws on ${sourceIds.length} cited source${sourceIds.length===1?'':'s'}.</p></details></article>`;
}

function lessonBody(lesson,ordered,index,draft,headerHTML,footerHTML,sources,regions){
  const url=`${SITE_ORIGIN}/lessons/${lesson.id}`;
  const guide=TEACHING_GUIDES[lesson.id];
  if(!guide||typeof guide.question!=='string'||!Array.isArray(guide.takeaways)||guide.takeaways.length!==3)throw Error(`Invalid teaching guide ${lesson.id}`);
  for(const takeaway of guide.takeaways)if(typeof takeaway.text!=='string'||!Number.isInteger(takeaway.step)||takeaway.step<0||takeaway.step>=lesson.steps.length)throw Error(`Invalid recap for ${lesson.id}`);
  const prev=ordered[index-1],next=ordered[index+1];
  const allSourceIds=unique(lesson.steps.flatMap(step=>sourceIdsForStep(step,regions)));
  const previous=prev?`<a href="/lessons/${text(prev.id)}">← Previous: ${text(prev.title)}</a>`:'<span>First lesson in the curriculum</span>';
  const following=next?`<a href="/lessons/${text(next.id)}">Next: ${text(next.title)} →</a>`:'<span>End of curriculum</span>';
  const json=lessonJSON(lesson,url);
  return page({headHTML:head({title:lesson.title,description:lesson.summary,url,jsonLd:json}),headerHTML,footerHTML,bodyHTML:`<main id="lessonMain" class="prose lesson-page"><div>${breadcrumb([{name:'Hodos',url:'/'},{name:'Lessons',url:'/lessons'},{name:lesson.title}])}</div><p class="lesson-draft-notice">${text(draft)}</p><p class="lesson-meta">${text(lesson.category)} · ${lesson.steps.length} relationships · ${lesson.minutes} minutes · ${text(lesson.audience)}</p><h1>${text(lesson.title)}</h1><p class="lesson-summary">${text(lesson.summary)}</p><section class="lesson-goals"><h2>Goals</h2><ul>${list(lesson.goals)}</ul></section><p class="lesson-action"><a class="lesson-primary-link" href="/atlas?lesson=${text(lesson.id)}">Start this lesson in the atlas</a></p><section class="lesson-relationships"><h2>Relationships</h2>${lesson.steps.map((step,stepIndex)=>renderStep(lesson,step,stepIndex,sources,regions)).join('')}</section><section class="lesson-recap"><h2>Recap</h2><p>${text(guide.question)}</p><ol>${guide.takeaways.map(takeaway=>`<li>${text(takeaway.text)}</li>`).join('')}</ol><details><summary>Review the final explanation</summary><p>${text(lesson.steps.at(-1).answer)}</p></details></section><section class="lesson-full-sources"><h2>Full source list</h2>${sourceList(allSourceIds,sources)}</section><nav class="lesson-navigation" aria-label="Lesson navigation"><div>${previous}</div><a href="/lessons">All lessons</a><div>${following}</div></nav></main>`});
}

function indexJSON(ordered){
  return {"@context":'https://schema.org',"@graph":[{"@type":'ItemList',name:'Hodos lessons',numberOfItems:ordered.length,itemListElement:ordered.map((lesson,index)=>({"@type":'ListItem',position:index+1,name:lesson.title,url:`${SITE_ORIGIN}/lessons/${lesson.id}`}))},{"@type":'BreadcrumbList',itemListElement:[{"@type":'ListItem',position:1,name:'Hodos',item:`${SITE_ORIGIN}/`},{"@type":'ListItem',position:2,name:'Lessons',item:`${SITE_ORIGIN}/lessons`}]},{"@type":'Person',"@id":AUTHOR['@id'],name:AUTHOR.name,honorificPrefix:AUTHOR.honorificPrefix,jobTitle:AUTHOR.jobTitle,url:AUTHOR.url}]};
}

function indexBody(ordered,draft,headerHTML,footerHTML){
  const description='Browse fourteen Hodos lessons in neuroanatomy, from atlas evidence and regional relationships to networks and behaviour.';
  return page({headHTML:head({title:'Lessons',description,url:`${SITE_ORIGIN}/lessons`,jsonLd:indexJSON(ordered)}),headerHTML,footerHTML,bodyHTML:`<main id="lessonMain" class="prose lessons-index-page"><div>${breadcrumb([{name:'Hodos',url:'/'},{name:'Lessons'}])}</div><p class="lesson-draft-notice">${text(draft)}</p><p class="lesson-meta">Fourteen lessons · orient, compare, explain</p><h1>Lessons</h1><p class="lesson-summary">A curriculum of relationships for neurosurgical residents. Each lesson moves from a reference view to a question you can explain.</p><ol class="lessons-index-list">${ordered.map((lesson,index)=>`<li><p class="lesson-index-number">${String(index+1).padStart(2,'0')} · ${text(lesson.category)} · ${lesson.steps.length} relationships · ${lesson.minutes} minutes</p><h2><a href="/lessons/${text(lesson.id)}">${text(lesson.title)}</a></h2><p>${text(lesson.summary)}</p><p><a href="/lessons/${text(lesson.id)}">Read the lesson</a></p></li>`).join('')}</ol></main>`});
}

export function lessonIdsFromLanding(landingHTML){
  const ids=[];
  for(const match of landingHTML.matchAll(/href="([^"]+)"/g)){
    const href=match[1].replaceAll('&amp;','&');
    const url=new URL(href,SITE_ORIGIN+'/');
    if(url.pathname==='/atlas'&&url.searchParams.has('lesson'))ids.push(url.searchParams.get('lesson'));
  }
  return unique(ids);
}

export function generateLessonPages({landingHTML,headerSourceHTML,footerSourceHTML,lessons=LESSONS,sources=SOURCES,regions=REGIONS}={}){
  if(typeof landingHTML!=='string'||typeof headerSourceHTML!=='string'||typeof footerSourceHTML!=='string')throw Error('Lesson page sources are required');
  validateLessonKeys(lessons);
  const ids=lessonIdsInCurriculum(lessons),landingIds=lessonIdsFromLanding(landingHTML);
  if(landingIds.length!==14||ids.length!==14||landingIds.length!==ids.length||landingIds.some(id=>!ids.includes(id)))throw Error(`Landing lesson links do not match the 14 lesson ids: ${landingIds.join(',')}`);
  const header=rootAbsoluteMarkup(extractSingleElement(headerSourceHTML,'header','atlas-sources header'));
  const footer=rootAbsoluteMarkup(extractSingleElement(footerSourceHTML,'footer','case-conference footer','source-footer'));
  const draft=draftNotice(headerSourceHTML);
  const byId=new Map(lessons.map(lesson=>[lesson.id,lesson]));
  const ordered=ids.map(id=>byId.get(id));
  const pages=new Map([['lessons.html',indexBody(ordered,draft,header,footer)]]);
  const titles=new Set(),descriptions=new Set(),canonicals=new Set();
  for(const [index,lesson] of ordered.entries()){
    const description=metaDescription(lesson.summary),url=`${SITE_ORIGIN}/lessons/${lesson.id}`;
    if(titles.has(lesson.title)||descriptions.has(description)||canonicals.has(url))throw Error(`Non-unique lesson metadata: ${lesson.id}`);
    titles.add(lesson.title);descriptions.add(description);canonicals.add(url);
    pages.set(`lessons/${lesson.id}.html`,lessonBody(lesson,ordered,index,draft,header,footer,sources,regions));
  }
  return pages;
}
