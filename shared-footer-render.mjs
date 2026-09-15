// The accepted homepage is the canonical footer template. Subpages reuse its
// static markup at build time, so the closing remains usable without JavaScript.
export const SHARED_FOOTER_ASSETS='  <link rel="stylesheet" href="ball-finale.css">\n  <link rel="stylesheet" href="shared-footer.css">\n  <link rel="stylesheet" href="footer-socials.css">\n  <script type="module" src="footer-controls.mjs"></script>\n  <script type="module" src="shared-footer.mjs"></script>\n';

export function footerParts(home){
  const signup=home.match(/<section class="signup signup-finale"[\s\S]*?<\/section>/)?.[0];
  const legal=home.match(/  <footer class="site-footer section-wrap"[\s\S]*?<\/footer>/)?.[0];
  if(!signup||!legal)throw new Error('Accepted homepage closing not found');
  return {signup,legal};
}

export function renderSharedFooter(home){
  const {signup,legal}=footerParts(home);
  const picture=signup.match(/<img class="signup-image"[^>]*>/)[0]
    .replace('class="signup-image"','class="footer-scene-image"').replace('alt="KAVEO-Inselgrün"','alt=""');
  const links=legal.replace('class="brand" href="#start"','class="brand" href="/#start"');
  // Same viewport camera and normal-flow dock as the home finale. Signup and
  // legal content remain the canonical no-JS template.
  return '  <div class="site-closing" data-shared-footer>\n    <div class="footer-finale">\n'+
    '      <div class="footer-backdrop" aria-hidden="true"><div class="footer-scene-media">'+picture+
    '<div class="footer-scene-shade"></div><canvas class="footer-ball" width="1920" height="1080" hidden></canvas></div></div>\n'+
    '      <div class="ball-brand-moment" aria-hidden="true"></div>\n'+signup+'\n    </div>\n'+links+'\n  </div>';
}
