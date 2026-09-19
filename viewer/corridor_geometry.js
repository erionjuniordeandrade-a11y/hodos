const MAX_COORDINATE_MM=250;
const MAX_RADIUS_MM=20;

function finiteVector(value,name){
  if(!Array.isArray(value)||value.length!==3)throw new TypeError(`${name} must be a three-number vector`);
  const copy=[...value];
  for(const coordinate of copy){
    if(!Number.isFinite(coordinate))throw new TypeError(`${name} coordinates must be finite`);
    if(Math.abs(coordinate)>MAX_COORDINATE_MM)throw new RangeError(`${name} coordinates must be within ${MAX_COORDINATE_MM} mm`);
  }
  return copy;
}

function nonemptyString(value,name){
  if(typeof value!=='string'||value.trim().length===0)throw new TypeError(`${name} must be a nonempty string`);
  return value;
}

/**
 * Validates an explicitly authored illustrative axis in atlas MNI/RAS millimetres.
 * This intentionally supplies no endpoint, width, label, or colour defaults.
 */
export function normalizeCorridor(spec){
  if(!spec||typeof spec!=='object'||Array.isArray(spec))throw new TypeError('corridor spec must be an object');
  const start=finiteVector(spec.start,'start');
  const end=finiteVector(spec.end,'end');
  const id=nonemptyString(spec.id,'id');
  const label=nonemptyString(spec.label,'label');
  const radiusMm=spec.radiusMm;
  if(!Number.isFinite(radiusMm)||radiusMm<=0||radiusMm>MAX_RADIUS_MM)throw new RangeError(`radiusMm must be finite and between 0 and ${MAX_RADIUS_MM} mm`);
  const color=spec.color;
  if(!Number.isInteger(color)||color<0||color>0xffffff)throw new RangeError('color must be an integer between 0x000000 and 0xffffff');
  const delta=[end[0]-start[0],end[1]-start[1],end[2]-start[2]];
  const lengthMm=Math.hypot(...delta);
  if(!Number.isFinite(lengthMm)||lengthMm===0)throw new RangeError('start and end must define a nonzero axis');
  return {...spec,id,label,color,start,end,radiusMm,
    center:[(start[0]+end[0])/2,(start[1]+end[1])/2,(start[2]+end[2])/2],
    direction:delta.map(component=>component/lengthMm),lengthMm};
}
