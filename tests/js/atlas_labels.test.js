import test from 'node:test';
import assert from 'node:assert/strict';
import {placeLabels} from '../../viewer/atlas_labels.js';

const rect=(p,a)=>({left:p.left,top:p.top,right:p.left+a.width,bottom:p.top+a.height});
const overlaps=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
// The orientation marker as the stylesheet places it: 80 x 80, centred, 8 px above the frame's bottom edge.
const marker=(w,h)=>({left:w/2-40,top:h-88,right:w/2+40,bottom:h-8});
const label=(x,y,width=150,height=26)=>({x,y,width,height});

test('labels: two edge columns, stacked by anchor height, clamped inside the margin',()=>{
  const w=900,h=600,labels=[label(100,300),label(120,310,128,26),label(800,20,128,40),label(850,590,140,26)];
  const placed=placeLabels({width:w,height:h,labels});
  assert.deepEqual(placed.map(p=>p.side),[0,0,1,1]);
  assert.deepEqual(placed.map(p=>p.left),[8,8,900-128-8,900-140-8]);
  assert.deepEqual(placed[0].top,287);assert.equal(placed[1].top,287+26+6,'the second label stacks below the first with the gap');
  assert.equal(placed[2].top,8,'a label above the frame is held at the top margin');
  assert.equal(placed[3].top,600-8-26,'a label below the frame is held at the bottom margin');
  for(const [i,a] of labels.entries())for(const [j,b] of labels.entries())if(j>i)assert(!overlaps(rect(placed[i],a),rect(placed[j],b)),`labels ${i} and ${j} overlap`);
});
test('labels: a full column spills its most central label into the other column',()=>{
  const h=120,labels=[label(100,10,150,40),label(110,50,150,40),label(300,90,150,40)];
  const placed=placeLabels({width:900,height:h,labels});
  assert.deepEqual(placed.map(p=>p.side),[0,0,1],'the label nearest the centre moves right');
  assert(placed.every(p=>p.top>=8&&p.top+40<=h-8));
});
// The confirmed defect (atlas_v1 gate, motor-cst step 4 compare, 390 x 844): "L · Globus pallidus" sat on the orientation marker.
test('labels: a label avoids the orientation marker\'s rectangle as it avoids the frame edge',()=>{
  const w=358,h=560,obstacle=marker(w,h),labels=[label(60,540,150,26)];
  const [p]=placeLabels({width:w,height:h,labels,obstacles:[obstacle]});
  assert.equal(p.side,0);
  assert(!overlaps(rect(p,labels[0]),obstacle),`label ${JSON.stringify(rect(p,labels[0]))} overlaps the marker ${JSON.stringify(obstacle)}`);
  assert.equal(p.top,h-88-6-26,'the label stops one gap above the marker');
});
test('labels: a stack above the marker keeps every label clear of it and of each other',()=>{
  const w=358,h=400,obstacle=marker(w,h),labels=[label(40,380,150,40),label(50,390,150,26),label(300,395,120,26)];
  const placed=placeLabels({width:w,height:h,labels,obstacles:[obstacle]});
  for(const [i,a] of labels.entries()){
    assert(!overlaps(rect(placed[i],a),obstacle),`label ${i} overlaps the marker`);
    assert(placed[i].top>=8&&placed[i].top+a.height<=h-8,`label ${i} inside the frame`);
    for(const [j,b] of labels.entries())if(j>i)assert(!overlaps(rect(placed[i],a),rect(placed[j],b)),`labels ${i} and ${j} overlap`);
  }
});
test('labels: an obstacle the columns never reach changes nothing (wide frames keep their pixels)',()=>{
  const w=900,h=600,labels=[label(100,590),label(850,595,128,26)];
  assert.deepEqual(placeLabels({width:w,height:h,labels,obstacles:[marker(w,h)]}),placeLabels({width:w,height:h,labels}));
  assert.deepEqual(placeLabels({width:w,height:h,labels,obstacles:[{left:0,top:0,right:0,bottom:0}]}),placeLabels({width:w,height:h,labels}),'a degenerate obstacle is ignored');
});
