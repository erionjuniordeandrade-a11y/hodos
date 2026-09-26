// Pure model for the Connections page: quoted teaching-note rows become merged links and named views.
// No DOM here, so the views can be tested in Node.

export const NODE_TYPES={
  Tract:{label:'Tract',color:'#d8bf8e'},
  CorticalArea:{label:'Cortical area',color:'#86c7dc'},
  Network:{label:'Network',color:'#b39abd'},
  Function:{label:'Function',color:'#8fc4a0'},
  Deficit:{label:'Deficit',color:'#d9837a'},
  Test:{label:'Intraoperative test',color:'#dca66a'},
  Model:{label:'Model',color:'#e9e4d8'},
};

export const VERBS={CONNECTS:'connects',TERMINATES_IN:'terminates in',MEMBER_OF:'is part of',HUB_OF:'is a hub of',
  INJURY_CAUSES:'injury causes',MONITORED_BY:'is tested by',SUPPORTS:'supports',CLAIMS:'claims'};

// Repeated (subject, relation, object) statements merge into one link that carries every quote.
export function buildGraph(rows){
  const links=[],byKey=new Map(),nodeType=new Map();
  for(const [subj,st,rel,obj,ot,quote,section,contested] of rows){
    if(!NODE_TYPES[st]||!NODE_TYPES[ot]||!VERBS[rel])throw Error(`Unknown type or relation: ${st} ${rel} ${ot}`);
    const key=`${subj}\u0000${rel}\u0000${obj}`;
    let link=byKey.get(key);
    if(!link){link={id:`l${links.length}`,subj,st,rel,obj,ot,contested:false,evidence:[]};byKey.set(key,link);links.push(link);}
    link.contested||=!!contested;
    link.evidence.push({quote,section});
    nodeType.set(subj,st);nodeType.set(obj,ot);
  }
  return {links,nodeType,quotes:rows.length};
}

export const around=(graph,name)=>graph.links.filter(l=>l.subj===name||l.obj===name);

// Cortical areas that the notes place in two or more networks.
export function sharedNodes(graph){
  const member=l=>(l.rel==='MEMBER_OF'||l.rel==='HUB_OF')&&l.st==='CorticalArea'&&l.ot==='Network';
  const nets=new Map();
  for(const l of graph.links)if(member(l)){if(!nets.has(l.subj))nets.set(l.subj,new Set());nets.get(l.subj).add(l.obj);}
  const keep=new Set([...nets].filter(([,s])=>s.size>=2).map(([a])=>a));
  return graph.links.filter(l=>member(l)&&keep.has(l.subj));
}

export const VIEWS=[
  {id:'debate',title:'The semantic debate',blurb:'Four models, four carrier tracts',focus:'semantic processing (word meaning access)',
    links:g=>g.links.filter(l=>l.contested),
    intro:'The notes quote four models for which tract carries word meaning to the frontal lobe. Select each tract to read the claim behind it. The question is contested, so teach it as a debate.'},
  {id:'shared',title:'Shared network nodes',blurb:'Areas that sit in two or more networks',focus:'area 44',links:sharedNodes,
    intro:'Area 44, the SMA and the intraparietal sulcus each belong to more than one network. A resection there is expected to touch every network the area belongs to.'},
  {id:'fat',title:'Frontal aslant tract',blurb:'FAT and its neighbours',focus:'FAT',links:g=>around(g,'FAT'),intro:'Everything the notes state about the frontal aslant tract.'},
  {id:'sma',title:'Supplementary motor area',blurb:'SMA and its neighbours',focus:'SMA',links:g=>around(g,'SMA'),intro:'Everything the notes state about the supplementary motor area.'},
  {id:'arcuate',title:'Arcuate fasciculus',blurb:'The dorsal phonological route',focus:'arcuate fasciculus',links:g=>around(g,'arcuate fasciculus'),intro:'Everything the notes state about the arcuate fasciculus.'},
  {id:'ifof',title:'Inferior fronto-occipital fasciculus',blurb:'IFOF and its neighbours',focus:'IFOF',links:g=>around(g,'IFOF'),intro:'Everything the notes state about the IFOF.'},
  {id:'routes',title:'Tract routes',blurb:'Which tracts link which cortical areas',focus:null,
    links:g=>g.links.filter(l=>(l.rel==='CONNECTS'||l.rel==='TERMINATES_IN')&&l.st==='Tract'&&l.ot==='CorticalArea'),
    intro:'Tracts and the cortical areas the notes say they connect or end in.'},
  {id:'deficits',title:'Injury and testing',blurb:'What a tract costs and how it is tested',focus:null,
    links:g=>g.links.filter(l=>l.st==='Tract'&&(l.rel==='INJURY_CAUSES'||l.rel==='MONITORED_BY')),
    intro:'Each tract links to the deficit its injury causes and the intraoperative test that monitors it. A tract without a test link has no test named in the notes.'},
  {id:'all',title:'Whole graph',blurb:'Every structure and link',focus:null,links:g=>g.links,intro:'The complete graph. Use Find to open one structure.'},
];

export function findNode(graph,query){
  const q=String(query||'').trim().toLowerCase();
  if(!q)return null;
  const names=[...graph.nodeType.keys()];
  return names.find(n=>n.toLowerCase()===q)||names.find(n=>n.toLowerCase().includes(q))||null;
}
