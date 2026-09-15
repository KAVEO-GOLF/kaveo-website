import {finaleState,ballDock,smooth} from './ball-finale-model.mjs';

// Identical desktop choreography to the homepage, evaluated from current
// geometry on EVERY scroll. No played/entered flag, timers or accumulated time.
export function sharedFooterState({top,signupTop,copyTop,formTop,height,anchor,media,width,mediaHeight,columnHeight,
  ballMotion=true,reduced=false,focused=false}){
  if(!ballMotion){
    const copyOpacity=reduced||focused?1:smooth((height*.92-copyTop)/(height*.38));
    const formOpacity=reduced||focused?1:smooth((height*.92-formTop)/(height*.38));
    return {progress:0,dock:null,shade:.8,copyOpacity,formOpacity};
  }
  const state=finaleState(top,signupTop,height,{signupFocused:focused,
    anchorBottom:anchor?.bottom??null,columnHeight});
  const dock=ballDock(top,height,anchor,media,width,mediaHeight);
  // The normal-flow text must not become readable behind the approaching ball.
  const clear=focused?1:smooth(((dock?.progress??0)-.84)/.14);
  return {...state,copyOpacity:state.copyOpacity*clear,
    shade:.64*state.preludeOpacity+state.shade,dock};
}
