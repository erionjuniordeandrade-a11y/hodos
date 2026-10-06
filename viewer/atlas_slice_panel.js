// Slice panel: one orthogonal plane through the reference scene, drawn in 2D beside the 3D cut.
// The section shows what the 3D plane cuts (cortex, deep structures, pathways) over an optional
// MNI152 2009a T1 template. All layers share MNI coordinates; the template is a different
// construction from the surface and tractography, so the overlay is an illustrative juxtaposition.
import {SLICE_AXES,toPlane,fromPlane,sampleVolume,linearToSrgbByte} from './atlas_slice.js';

// The drawn field in world mm: the template brain plus a small margin, the same for every slice.
const FIELD=[[-76,76],[-112,78],[-74,86]];
// The 3D view that faces the cut surface for each plane and kept side.
const FACING={axial:{'-1':'superior','1':'inferior'},coronal:{'-1':'anterior','1':'posterior'},sagittal:{'-1':'right','1':'left'}};
export const SLICE_CREDIT='MNI152 2009a T1 template · Fonov et al. 2011 · group average, not a patient scan';

const fmt=v=>`${v>0?'+':v<0?'−':''}${Math.abs(Math.round(v))}`;
const css=(r,g,b,a=1)=>`rgba(${r},${g},${b},${a})`;

// Even-odd point-in-polygon on plane coordinates.
function inside(loop,u,v){
  let hit=false;
  for(let i=0,j=loop.length-1;i<loop.length;j=i++){const [ui,vi]=loop[i],[uj,vj]=loop[j];
    if((vi>v)!==(vj>v)&&u<(uj-ui)*(v-vi)/(vj-vi)+ui)hit=!hit;}
  return hit;
}

export function mountSlicePanel(root,{scene}){
  const $=selector=>root.querySelector(selector);
  const canvas=$('canvas'),ctx=canvas.getContext('2d'),range=$('[data-slice-range]'),output=$('[data-slice-value]');
  const readout=$('[data-slice-readout]'),templateToggle=$('[data-slice-template]'),clipToggle=$('[data-slice-clip]');
  const flipButton=$('[data-slice-flip]'),status=$('[data-slice-status]'),tabs=[...root.querySelectorAll('[data-slice-axis]')];
  let state={axis:'axial',crosshair:[0,-18,10],keep:-1},open=false,template=null,templateError='',section=null,frame=0,dirty=true;
  let image=null,imageKey='',creditBand=30;
  const offscreen=document.createElement('canvas');

  function view(){
    // The bottom band holds the credit line, so the section never draws under it.
    const a=SLICE_AXES[state.axis],w=canvas.clientWidth||1,h=canvas.clientHeight||1,ih=Math.max(1,h-creditBand);
    const us=FIELD[a.u].map(x=>a.uSign*x).sort((p,q)=>p-q),vs=FIELD[a.v].map(x=>a.vSign*x).sort((p,q)=>p-q);
    const scale=Math.min(w/(us[1]-us[0]),ih/(vs[1]-vs[0]));
    const cu=(us[0]+us[1])/2,cv=(vs[0]+vs[1])/2;
    return {w,h,ih,scale,toScreen:(u,v)=>[w/2+(u-cu)*scale,ih/2-(v-cv)*scale],fromScreen:(x,y)=>[cu+(x-w/2)/scale,cv-(y-ih/2)/scale]};
  }
  const value=()=>state.crosshair[SLICE_AXES[state.axis].normal];

  function syncControls(){
    const a=SLICE_AXES[state.axis],[lo,hi]=FIELD[a.normal];
    for(const tab of tabs)tab.setAttribute('aria-pressed',String(tab.dataset.sliceAxis===state.axis));
    range.min=String(lo);range.max=String(hi);range.value=String(Math.round(value()));
    range.setAttribute('aria-label',`${a.label} slice position, MNI ${a.coordinate} in millimetres`);
    output.textContent=`${a.coordinate} ${fmt(value())} mm`;
    const kept={axial:['inferior','superior'],coronal:['posterior','anterior'],sagittal:['left','right']}[state.axis][state.keep===1?1:0];
    flipButton.textContent=`Keep ${kept}`;
    canvas.setAttribute('aria-label',`${a.label} section at MNI ${a.coordinate} ${fmt(value())} mm. Click or use the arrow keys to move the crosshair; Page Up and Page Down move the slice.`);
  }
  function push({face=false}={}){
    dirty=true;syncControls();
    scene.setSlice(open?{axis:state.axis,value:value(),keep:state.keep,clip:clipToggle.checked,crosshair:state.crosshair}:null);
    if(open&&face)scene.flyTo({view:FACING[state.axis][String(state.keep)],tweenMs:700});
    schedule();
  }
  function schedule(){if(!frame&&open)frame=requestAnimationFrame(render);}

  async function ensureTemplate(){
    if(template||!templateToggle.checked)return;
    status.textContent='Loading the MNI152 template…';
    try{template=await scene.loadSliceTemplate();templateError='';status.textContent='';}
    catch(error){templateError='Template unavailable; the section shows the atlas layers only.';status.textContent=templateError;console.warn(error);}
    dirty=true;schedule();
  }

  function render(){
    frame=0;if(!open)return;
    const dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h)return;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    if(dirty){section=scene.sliceAt(state.axis,value());dirty=false;}
    const a=SLICE_AXES[state.axis],styles=getComputedStyle(root),mono=styles.getPropertyValue('--font-outlier').trim()||'monospace';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    // Lay out the credit first: its line count sets the band the section keeps clear of.
    ctx.font=`10px ${mono}`;
    const credit=wrapLines(template&&templateToggle.checked?SLICE_CREDIT:'Group reference atlas layers · not a patient scan',w-12);
    creditBand=8+12*credit.length;
    const v=view();
    const background=styles.getPropertyValue('--slice-bg').trim()||'#0a0e11';ctx.fillStyle=background;ctx.fillRect(0,0,w,h);
    const project=p=>v.toScreen(...toPlane(state.axis,p));
    // Template underlay, 1 px per voxel, scaled with smoothing.
    if(template&&templateToggle.checked){
      const key=`${state.axis}:${value()}`;
      if(key!==imageKey){imageKey=key;image=sampleVolume(template,state.axis,value());
        if(image){offscreen.width=image.width;offscreen.height=image.height;const octx=offscreen.getContext('2d'),img=octx.createImageData(image.width,image.height);
          for(let i=0;i<image.pixels.length;i++){const g=image.pixels[i];img.data.set([g,g,g,g?255:0],i*4);}octx.putImageData(img,0,0);}}
      if(image){const [x0,y0]=v.toScreen(image.left,image.top),[x1,y1]=v.toScreen(image.right,image.bottom);
        ctx.imageSmoothingEnabled=true;ctx.globalAlpha=.92;ctx.drawImage(offscreen,x0,y0,x1-x0,y1-y0);ctx.globalAlpha=1;}
    }
    ctx.lineJoin='round';ctx.lineCap='round';
    // Inferior context (faint), then deep structures (filled), cortex contours and pathway crossings.
    ctx.strokeStyle='rgba(228,230,227,.28)';ctx.lineWidth=1;
    for(const loop of section.context){ctx.beginPath();loop.forEach((p,i)=>{const [x,y]=project(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
    for(const d of section.deep){ctx.beginPath();
      for(const loop of d.loops)loop.forEach((p,i)=>{const [x,y]=project(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      ctx.globalAlpha=.32*Math.min(1,d.opacity/.7);ctx.fillStyle=d.colour;ctx.fill('evenodd');
      ctx.globalAlpha=Math.min(1,.4+d.opacity);ctx.strokeStyle=d.colour;ctx.lineWidth=1.25;ctx.stroke();ctx.globalAlpha=1;}
    ctx.lineWidth=1.6;
    for(const c of section.cortex){const byColour=new Map(),n=c.ids.length;
      for(let i=0;i<n;i++){const key=css(linearToSrgbByte(c.colours[i*3]),linearToSrgbByte(c.colours[i*3+1]),linearToSrgbByte(c.colours[i*3+2]));
        let list=byColour.get(key);if(!list)byColour.set(key,list=[]);list.push(i);}
      for(const [colour,list] of byColour){ctx.strokeStyle=colour;ctx.beginPath();
        for(const i of list){const s=c.segments,[x0,y0]=project([s[i*6],s[i*6+1],s[i*6+2]]),[x1,y1]=project([s[i*6+3],s[i*6+4],s[i*6+5]]);ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);}
        ctx.stroke();}
    }
    for(const b of section.bundles){ctx.fillStyle=b.tint;ctx.globalAlpha=b.ghost?.45:.9;ctx.beginPath();
      for(let i=0;i<b.points.length;i+=3){const [x,y]=project([b.points[i],b.points[i+1],b.points[i+2]]);ctx.moveTo(x+1.7,y);ctx.arc(x,y,1.7,0,Math.PI*2);}
      ctx.fill();ctx.globalAlpha=1;}
    // Crosshair through the two in-plane coordinates.
    const [cx,cy]=v.toScreen(...toPlane(state.axis,state.crosshair));
    ctx.strokeStyle='rgba(228,230,227,.55)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();
    ctx.moveTo(cx,0);ctx.lineTo(cx,v.ih);ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();ctx.setLineDash([]);
    // Orientation letters and the always-visible credit line on its own band.
    ctx.fillStyle=background;ctx.fillRect(0,v.ih,w,h-v.ih);
    ctx.fillStyle='rgba(228,230,227,.85)';ctx.font=`600 11px ${mono}`;ctx.textBaseline='middle';
    const [left,right,top,bottom]=a.edges;
    ctx.textAlign='left';ctx.fillText(left,6,v.ih/2);ctx.textAlign='right';ctx.fillText(right,w-6,v.ih/2);
    ctx.textAlign='center';ctx.fillText(top,w/2,10);ctx.fillText(bottom,w/2,v.ih-8);
    ctx.font=`10px ${mono}`;ctx.fillStyle='rgba(228,230,227,.7)';ctx.textAlign='left';ctx.textBaseline='alphabetic';
    credit.forEach((line,i)=>ctx.fillText(line,6,h-6-12*(credit.length-1-i)));
    describe();
  }
  function wrapLines(text,max){
    // Greedy word wrap at the current font; a word wider than `max` keeps its own line.
    const lines=[];let line='';
    for(const word of text.split(' ')){const next=line?`${line} ${word}`:word;
      if(line&&ctx.measureText(next).width>max){lines.push(line);line=word;}else line=next;}
    if(line)lines.push(line);return lines;
  }
  function describe(){
    const [x,y,z]=state.crosshair,parts=[`MNI x ${fmt(x)} · y ${fmt(y)} · z ${fmt(z)} mm`];
    const [u,v]=toPlane(state.axis,state.crosshair);
    const deep=section?.deep.find(d=>d.loops.reduce((hit,loop)=>hit!==inside(loop.map(p=>toPlane(state.axis,p)),u,v),false));
    if(deep)parts.push(`within ${deep.hemisphere} ${deep.name}`);
    const parcel=scene.parcelNear(state.crosshair,3);
    if(parcel)parts.push(`nearest cortex ${parcel.hemi} ${parcel.code} (${parcel.distance.toFixed(1)} mm)`);
    readout.textContent=parts.join(' · ');
  }

  function setCrosshairFromEvent(event){
    const rect=canvas.getBoundingClientRect(),[u,v]=view().fromScreen(event.clientX-rect.left,event.clientY-rect.top);
    const p=fromPlane(state.axis,u,v,value());
    state.crosshair=p.map((c,k)=>Math.max(FIELD[k][0],Math.min(FIELD[k][1],Math.round(c))));
    push();
  }
  let dragging=false;
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;canvas.setPointerCapture(e.pointerId);setCrosshairFromEvent(e);});
  canvas.addEventListener('pointermove',e=>{if(dragging)setCrosshairFromEvent(e);});
  for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,()=>{dragging=false;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();step(e.deltaY>0?-1:1);},{passive:false});
  canvas.addEventListener('keydown',e=>{
    const a=SLICE_AXES[state.axis],moves={ArrowLeft:[a.u,-a.uSign],ArrowRight:[a.u,a.uSign],ArrowUp:[a.v,a.vSign],ArrowDown:[a.v,-a.vSign]};
    if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();step(e.key==='PageUp'?1:-1);return;}
    const move=moves[e.key];if(!move)return;e.preventDefault();
    const [k,sign]=move,c=[...state.crosshair];c[k]=Math.max(FIELD[k][0],Math.min(FIELD[k][1],c[k]+sign*(e.shiftKey?5:1)));state.crosshair=c;push();
  });
  function step(delta){const n=SLICE_AXES[state.axis].normal,c=[...state.crosshair];
    c[n]=Math.max(FIELD[n][0],Math.min(FIELD[n][1],c[n]+delta));state.crosshair=c;push();}
  range.addEventListener('input',()=>{const n=SLICE_AXES[state.axis].normal,c=[...state.crosshair];c[n]=Number(range.value);state.crosshair=c;push();});
  for(const tab of tabs)tab.addEventListener('click',()=>{if(state.axis===tab.dataset.sliceAxis)return;state.axis=tab.dataset.sliceAxis;imageKey='';push({face:true});});
  flipButton.addEventListener('click',()=>{state.keep=state.keep===1?-1:1;push({face:true});});
  clipToggle.addEventListener('change',()=>push());
  templateToggle.addEventListener('change',()=>{dirty=true;ensureTemplate();schedule();});
  const unsubscribe=scene.onSceneChange(()=>{dirty=true;schedule();});
  const resizeObserver=new ResizeObserver(()=>schedule());resizeObserver.observe(canvas);

  function setOpen(next,{face=true}={}){
    open=!!next;root.hidden=!open;
    if(open)ensureTemplate();
    push({face});
  }
  function setAxis(axis){if(SLICE_AXES[axis]&&axis!==state.axis){state.axis=axis;imageKey='';}}
  syncControls();
  return {setOpen,setAxis,get open(){return open;},get state(){return {open,...state,crosshair:[...state.crosshair],template:!!template,templateError,
      layers:section?{cortex:section.cortex.reduce((n,c)=>n+c.ids.length,0),deep:section.deep.map(d=>d.id),bundles:section.bundles.map(b=>({id:b.id,points:b.points.length/3}))}:null};},
    dispose(){cancelAnimationFrame(frame);unsubscribe();resizeObserver.disconnect();}};
}
