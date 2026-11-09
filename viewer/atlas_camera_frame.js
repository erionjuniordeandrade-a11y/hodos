/** Camera framing in atlas_scene.js: who placed the camera, and whether a focus flight is still
 * owed a refit when its pathways arrive by range request. The scene keeps one state from this
 * closed list and reads the predicates below; nothing else decides whether the camera may move
 * on its own. `__atlasTest.render.cameraFrame` names the state. */
export const CAMERA_FRAMES=Object.freeze(['auto-framed','authored','flight-pending','user-moved']);

/** One pure transition. Events:
 *  {type:'view'}               an instant named view (setView, Home, Fit): the frame follows the view
 *  {type:'fly',focus,zoom}     a flight: to a focus set it stays pending until the pathways are in;
 *                              a whole-brain flight at zoom 1 is auto-framed; a zoomed authored camera is held
 *  {type:'place'}              a saved camera put back exactly (Explore restore, cam= deep link)
 *  {type:'user',source}        any camera input: pointer drag, touch, wheel, keyboard */
export function cameraFrameTransition(state,event){
  switch(event.type){
    case 'view':return 'auto-framed';
    case 'fly':return event.focus?'flight-pending':(event.zoom??1)<=1?'auto-framed':'authored';
    case 'place':return 'user-moved';
    case 'user':return 'user-moved';
    default:return CAMERA_FRAMES.includes(state)?state:'auto-framed';
  }
}
/** Pathways arriving after a focus flight refit the camera only while that flight is pending. */
export const refitsOnLoad=state=>state==='flight-pending';
/** A pending focus flight frames the focus set, not the whole brain, when the frame is recomputed. */
export const framesFocus=state=>state==='flight-pending';
/** The camera still shows its named view: it refits on resize and the readout names the view, not "free". */
export const holdsView=(state,flight)=>state==='auto-framed'||(state==='flight-pending'&&(flight?.zoom??1)<=1);
