/** Full-frame photographs supplied in the owner's lecture. Original highlighting
 * and watermarks are retained. These specimens are not registered to the atlas. */
export const RHOTON_URL='https://www.aans.org/education-publications/references/the-rhoton-collection/';
export const RHOTON_CREDIT='Courtesy of the Rhoton Collection, American Association of Neurological Surgeons (AANS)/Neurosurgical Research and Education Foundation (NREF).';
export const DISSECTION_PLATES=Object.freeze({
  'lateral-association':{
    title:'Lateral association fibres in dissection',slide:56,sha:'10c70f5e5bfa',width:1619,
    alt:'Left lateral hemisphere dissection with longitudinal fibres highlighted yellow above the exposed insular region; frontal pole at the left.',
    observe:'Find the frontal and temporal poles, then follow the exposed longitudinal fibres above the insular region. Compare that course with the AF and SLF samples in the atlas.',
    limits:'The dissection exposes a layered lateral system. Its yellow highlight does not resolve every AF/SLF subdivision or reproduce the atlas bundle definitions.',
  },
  ifof:{
    title:'The long fronto-occipital course',slide:82,sha:'cafcb05ab5b2',width:1601,
    alt:'Left lateral dissection with the IFOF highlighted yellow, fanning anteriorly and posteriorly around a narrower subinsular course.',
    observe:'Follow the long highlighted course from its frontal fan through the subinsular region toward the occipital lobe. Locate the removed insular surface before comparing the IFOF sample.',
    limits:'The photograph shows a dissection plane. It does not delineate every capsule layer or measure an individual distance between IFOF and neighbouring pathways.',
  },
  uncinate:{
    title:'The uncinate turn at the limen',slide:98,sha:'2ab120349195',width:1601,
    alt:'Left lateral dissection showing a short yellow uncinate hook between anterior temporal and orbital frontal white matter.',
    observe:'Find the short anterior hook joining temporal and frontal white matter. Compare its turn with the longer IFOF course and the occipitotemporal ILF in the atlas.',
    limits:'Overlying insular and opercular tissue has been removed. This exposed course establishes neither functional redundancy nor tolerance of sectioning the uncinate.',
  },
  'optic-radiation':{
    title:'Optic radiation beside the ventricular region',slide:124,sha:'0ddbbe03d46f',width:1608,
    alt:'Deep left lateral dissection with optic-radiation fibres highlighted yellow beside the opened ventricular region and coursing toward occipital white matter.',
    observe:'Orient anterior and posterior, then follow the exposed yellow fibres toward the occipital region. Compare their course with the separate OR, gross thalamus and V1 references.',
    limits:'The photograph supplies deep dissection context. The atlas has no separate lateral geniculate nucleus or ventricular surface; neither is created by this comparison.',
  },
  'temporal-horn':{
    title:'Temporal horn beneath the exposed fibres',slide:127,sha:'1e584780bff6',width:1608,
    alt:'Deep left lateral dissection with the temporal horn highlighted green beneath exposed temporal and occipital white-matter fibres.',
    observe:'Locate the green temporal-horn reference below the exposed fibres. Compare this cavity with the nearby hippocampal reference in the atlas, then follow the anterior OR turn.',
    limits:'Hippocampus and temporal horn are different structures. The horn appears only in this photograph; no ventricular mesh or patient-specific loop distance is supplied.',
  },
});
const node=(tag,attrs={},text='')=>{const el=document.createElement(tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));el.textContent=text;return el;};
const photo=(id,plate)=>node('img',{src:`./reference-plates/${id}.png?v=${plate.sha}`,alt:plate.alt,width:plate.width,height:1080,loading:'lazy',decoding:'async'});
const credit=()=>{const p=node('p',{class:'dissection-credit'},'K. Yagmurlu. ');p.append(node('a',{href:RHOTON_URL,target:'_blank',rel:'noopener noreferrer'},RHOTON_CREDIT));return p;};

export function createDissectionReference(id){
  const plate=DISSECTION_PLATES[id];if(!plate)return null;
  const figure=node('figure',{'data-dissection':id,class:'dissection-reference'});
  figure.append(node('h3',{},'Compare with dissection'),node('p',{class:'dissection-orientation'},'Left hemisphere · lateral dissection · anterior at image left'));
  const open=node('button',{type:'button',class:'dissection-open','aria-haspopup':'dialog','aria-label':`Enlarge ${plate.title}`});
  const image=photo(id,plate);open.append(image,node('span',{},'Enlarge reference'));
  const status=node('p',{class:'dissection-status',role:'status',hidden:''},'Reference image unavailable. Continue with the atlas and the written comparison.');
  image.addEventListener('error',()=>{image.hidden=true;open.disabled=true;status.hidden=false;});
  const caption=node('figcaption');caption.append(node('p',{},plate.observe),node('p',{class:'dissection-limit'},plate.limits),credit());
  const dialog=node('dialog',{class:'dissection-dialog','aria-labelledby':'dissectionDialogTitle'});
  const close=node('button',{type:'button',id:'dissectionClose',autofocus:''},'Close reference');
  close.addEventListener('click',()=>dialog.close());
  const header=node('div',{class:'dissection-dialog-head'});header.append(node('h2',{id:'dissectionDialogTitle'},plate.title),close);
  // Create the large image only when requested. Removing the relationship also
  // removes its dialog; no global handler, scene callback or modal state survives.
  open.addEventListener('click',()=>{
    if(!dialog.childElementCount){const large=photo(id,plate);large.loading='eager';dialog.append(header,large,node('p',{},'Left hemisphere · anterior at image left. Independent reference photograph; atlas camera and colours are separate.'),node('p',{},plate.limits),credit());}
    dialog.showModal();
  });
  figure.append(open,status,caption,dialog);return figure;
}
