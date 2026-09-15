// Shared non-modal disclosure. No routing interception or scene/scroll changes.
export function createSiteNavigation({win=window,doc=document}={}) {
  const header=doc.querySelector('.site-header');
  const nav=header?.querySelector('.site-navigation');
  const toggle=header?.querySelector('.site-menu-toggle');
  if(!header||!nav||!toggle)return null;
  const mobile=win.matchMedia('(max-width: 960px)');
  let open=false;
  function setOpen(next,{restoreFocus=false}={}) {
    open=mobile.matches&&next;
    header.classList.toggle('is-menu-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen');
    nav.inert=mobile.matches&&!open;
    if(nav.inert)nav.setAttribute('aria-hidden','true');
    else nav.removeAttribute('aria-hidden');
    if(restoreFocus)toggle.focus({preventScroll:true});
  }
  function clickToggle() {
    setOpen(!open);
    if(open)nav.querySelector('a')?.focus({preventScroll:true});
  }
  function clickOutside(event) {if(open&&!header.contains(event.target))setOpen(false);}
  function keydown(event) {
    if(open&&event.key==='Escape') {event.preventDefault();setOpen(false,{restoreFocus:true});}
  }
  function leaveHeader(event) {if(open&&event.relatedTarget&&!header.contains(event.relatedTarget))setOpen(false);}
  function navigate(event) {if(event.target.closest('a'))setOpen(false);}
  function reset() {
    const movingToDesktop=!mobile.matches&&(doc.activeElement===toggle||doc.activeElement===nav.querySelector('.site-nav-home'));
    const hidingFocusedLink=mobile.matches&&nav.contains(doc.activeElement);
    setOpen(false,{restoreFocus:hidingFocusedLink});
    if(movingToDesktop)nav.querySelector('[aria-current="page"]:not(.site-nav-home),a:not(.site-nav-home)')?.focus({preventScroll:true});
  }
  header.classList.add('site-menu-ready');
  toggle.hidden=false;
  toggle.addEventListener('click',clickToggle);
  header.addEventListener('click',navigate);
  header.addEventListener('focusout',leaveHeader);
  doc.addEventListener('pointerdown',clickOutside);
  doc.addEventListener('keydown',keydown);
  mobile.addEventListener('change',reset);
  win.addEventListener('pageshow',reset);
  win.addEventListener('hashchange',reset);
  setOpen(false);
  return {dispose() {
    setOpen(false);nav.inert=false;nav.removeAttribute('aria-hidden');
    header.classList.remove('site-menu-ready','is-menu-open');toggle.hidden=true;
    toggle.removeEventListener('click',clickToggle);
    header.removeEventListener('click',navigate);header.removeEventListener('focusout',leaveHeader);
    doc.removeEventListener('pointerdown',clickOutside);doc.removeEventListener('keydown',keydown);
    mobile.removeEventListener('change',reset);win.removeEventListener('pageshow',reset);win.removeEventListener('hashchange',reset);
  }};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')createSiteNavigation();
