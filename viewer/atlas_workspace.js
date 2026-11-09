/** Workspace mode on the atlas page: which pane owns the layout (library, lesson, recap, explore),
 * whether the atlas is expanded over the lesson, and whether the Layers drawer shows. The whole
 * machine lives here; atlas_app.js renders it (body[data-mode], body[data-expanded],
 * body[data-drawer]) and sends events. Event handlers never set the drawer's `open` themselves. */
export const WORKSPACE_MODES=Object.freeze(['library','lesson','recap','explore']);
export const DRAWER_STATES=Object.freeze(['docked','open','closed']);
export const INITIAL_WORKSPACE=Object.freeze({mode:'library',expanded:false,drawerOpen:false});

/** How the drawer shows. In Explore the stylesheet lays it out as a column of the page (docked):
 * its summary is a heading, not a toggle. `overlay` says whether the stylesheet floats it instead
 * (position fixed, the narrow layouts and every other mode); then it is simply open or closed. */
export function drawerOf(state,overlay=state.mode!=='explore'){
  return state.mode==='explore'&&!overlay?'docked':state.drawerOpen?'open':'closed';
}

/** One pure transition. Events:
 *  {type:'mode',mode}            the player changes the pane; entering Explore opens the drawer, leaving it closes it
 *  {type:'expand'}               the Expand button
 *  {type:'tools',overlay}        the Layers button
 *  {type:'summary',overlay}      the drawer's own <summary>
 *  {type:'skip'}                 the skip link to the atlas controls
 *  {type:'escape',overlay}       Esc while nothing above the drawer is open */
export function workspaceTransition(state,event){
  switch(event.type){
    case 'mode':{
      const mode=WORKSPACE_MODES.includes(event.mode)?event.mode:state.mode;
      const drawerOpen=mode==='explore'?true:state.mode==='explore'?false:state.drawerOpen;
      return {mode,expanded:false,drawerOpen};
    }
    case 'expand':return {...state,expanded:!state.expanded};
    // A docked drawer is part of the page: neither its summary nor the Layers button can collapse it.
    case 'tools':case 'summary':return drawerOf(state,event.overlay)==='docked'?state:{...state,drawerOpen:!state.drawerOpen};
    case 'skip':return {...state,drawerOpen:true};
    case 'escape':return drawerOf(state,event.overlay)==='open'?{...state,drawerOpen:false}:state;
    default:return state;
  }
}
