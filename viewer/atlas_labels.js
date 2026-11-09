/** Parcel-label placement for the atlas frame. Labels sit in two columns at the frame edges,
 * stacked top to bottom without overlapping each other, kept inside the frame margin and clear of
 * obstacles such as the orientation marker. Pure: atlas_scene.js measures each label (anchor x/y,
 * width, height) and the obstacles, this decides where every label goes. The order of the result
 * is the order of `labels`. */

/** @param {{width:number,height:number,labels:Array<{x:number,y:number,width:number,height:number}>,
 *   obstacles?:Array<{left:number,top:number,right:number,bottom:number}>,gap?:number,margin?:number}} frame
 * @returns {Array<{left:number,top:number,side:0|1}>} one placement per label */
export function placeLabels({width:w,height:h,labels,obstacles=[],gap=6,margin=8}){
  const columns=[[],[]];
  for(const a of labels)columns[a.x<w/2?0:1].push(a);
  const columnHeight=list=>list.reduce((sum,a)=>sum+a.height+gap,0)-gap;
  const real=obstacles.filter(o=>o&&o.right>o.left&&o.bottom>o.top);
  // The vertical room a column has: the frame margins, pulled in by any obstacle its labels would
  // cross. An obstacle in the lower half raises the floor; one in the upper half lowers the ceiling.
  function room(side,list){
    const span=Math.max(0,...list.map(a=>a.width)),left=side?w-margin-span:margin,right=left+span;
    let ceiling=margin,floor=h-margin;
    for(const o of real){if(o.left>=right||o.right<=left)continue;
      if(o.top+o.bottom>h)floor=Math.min(floor,o.top-gap);else ceiling=Math.max(ceiling,o.bottom+gap);}
    return {ceiling,floor};
  }
  const capacity=(side,list)=>{const {ceiling,floor}=room(side,list);return floor-ceiling;};
  // Move labels across the frame only when their preferred column cannot fit them.
  for(const [side,list] of columns.entries())while(list.length>1&&columnHeight(list)>capacity(side,list)){
    const other=columns[1-side],move=[...list].sort((a,b)=>Math.abs(a.x-w/2)-Math.abs(b.x-w/2))
      .find(a=>columnHeight([...other,a])<=capacity(1-side,[...other,a]));
    if(!move)break;list.splice(list.indexOf(move),1);other.push(move);
  }
  const placed=new Map();
  for(const [side,list] of columns.entries()){
    list.sort((a,b)=>a.y-b.y);
    // A column that cannot clear an obstacle keeps the whole frame: a label over the marker beats one cut off at the edge.
    const clear=room(side,list),{ceiling,floor}=columnHeight(list)<=clear.floor-clear.ceiling?clear:{ceiling:margin,floor:h-margin};
    let previous=ceiling-gap,remaining=columnHeight(list);
    for(const a of list){
      const top=Math.min(floor-remaining,Math.max(ceiling,a.y-a.height/2,previous+gap));
      previous=top+a.height;remaining-=a.height+gap;
      placed.set(a,{left:side?w-a.width-margin:margin,top,side});
    }
  }
  return labels.map(a=>placed.get(a));
}
