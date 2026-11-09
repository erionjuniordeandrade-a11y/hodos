/** Cinematic view decisions shared by atlas_app.js and atlas_scene.js. In Cinematic view the Peel
 * owns the cortex and the fibre traces are hidden under the Lit streamlines, so nothing else may
 * move the Layers surface level and no fibre animation runs. Pure: no DOM, no three. */
export const SURFACE_OWNERS=Object.freeze(['layers','peel']);
/** Who owns the cortical surface level: the Layers slider, or the Peel while Cinematic view is on. */
export const surfaceOwner=cinematic=>cinematic?'peel':'layers';
/** The Layers level (0..100) a reveal sets when a pathway or deep structure is picked, or null to
 * leave the level alone. A defined cortex (>= 60) opens to 15 so the interior shows. */
export function revealedSurfaceLevel({level,cinematic=false}){
  if(surfaceOwner(cinematic)==='peel')return null;
  return level>=60?15:null;
}
/** Whether the fibre-path animation advances this frame. Only the Study profile animates, never
 * under prefers-reduced-motion, in a hidden tab, or while Cinematic view hides the traces. */
export function fibreMotion({playing,profile,reducedMotion=false,hidden=false,cinematic=false}){
  return !!playing&&profile==='teaching'&&!reducedMotion&&!hidden&&!cinematic;
}
