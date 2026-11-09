import {YEO7,networkLabel,networkSelection,networkFromSearch,rgbCss} from './atlas_networks.js';
import {arterialSelection,arterialFromSearch,arterialLabel,ARTERIAL_NOTE} from './atlas_arterial.js';

/** The Wash is the one colour layer over the cortex: none, a Network, or an arterial territory.
 * One colour on the cortex always means one thing, so a Wash is a single value, never two layers. */
export const WASH_KINDS=Object.freeze(['none','network','arterial']);
export const NO_WASH=Object.freeze({kind:'none',mode:'off',focus:null});

export const networkWash=sel=>sel&&sel.mode!=='off'?{kind:'network',mode:sel.mode,focus:sel.focus}:NO_WASH;
export const arterialWash=sel=>sel&&sel.mode!=='off'?{kind:'arterial',mode:sel.mode,focus:sel.focus}:NO_WASH;

/** The Wash the scene shows. Arterial wins, as it does in the scene's colour pass. */
export const washOf=({network,arterial}={})=>arterial&&arterial.mode!=='off'?arterialWash(arterial):networkWash(network);

/** The scene's two layer selections for one Wash: the other layer is always off. */
export function washLayers(wash,rows=[]){
  return {network:wash.kind==='network'?networkSelection(wash.mode,wash.focus):networkSelection('off'),
    arterial:wash.kind==='arterial'?arterialSelection(wash.mode,wash.focus,rows):arterialSelection('off')};
}

/** URL keys `net` and `art` as one Wash; `art` wins, as it did when both were applied in turn at boot.
 * No arterial rows means the arterial set is not installed, so `art` is ignored and `net` still applies. */
export function washFromSearch(search,rows=[]){
  const arterial=rows.length?arterialWash(arterialFromSearch(search,rows)):NO_WASH;
  return arterial.kind==='none'?networkWash(networkFromSearch(search)):arterial;
}

const gradient=items=>`linear-gradient(90deg,${items.map(item=>rgbCss(item.rgb)).join(',')})`;
/** What the scene chip says and what an empty picked panel says for a Wash. chip null: hidden. */
export function washReadout(wash,rows=[]){
  if(wash.kind==='network')return {
    chip:wash.mode==='all'?'Yeo-7 · all group networks':`${networkLabel(wash.focus).replace(' · ',', ')} · Yeo-7 group`,
    swatch:wash.mode==='focus'?rgbCss(YEO7.find(n=>n.id===wash.focus).rgb):gradient(YEO7),
    picked:['Network context, Yeo-7',wash.mode==='all'?'Seven cortical networks':networkLabel(wash.focus),
      'Population cortical grouping. Select cortex to compare its HCP parcel identity; network colour does not show task activation.']};
  if(wash.kind==='arterial')return {
    chip:wash.mode==='all'?'Arterial territories · Liu 2023 group template':`${arterialLabel(rows,wash.focus)} territory · Liu 2023 group template`,
    swatch:wash.mode==='focus'?rgbCss(rows.find(r=>r.id===wash.focus).rgb):gradient(rows),
    picked:['Vascular context, arterial atlas',wash.mode==='all'?'Four supply territories':`${arterialLabel(rows,wash.focus)} territory`,ARTERIAL_NOTE]};
  return {chip:null,swatch:null,picked:['Atlas parcel','No parcel selected','Select cortex to inspect its HCP-MMP1 label.']};
}
