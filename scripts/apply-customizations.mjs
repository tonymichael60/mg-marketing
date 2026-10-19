import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const style='<style id="site-branding-overrides">#__framer-badge-container,.__framer-badge{display:none!important}</style>';
let count=0;
function visit(dir) {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) {visit(file);continue;}
    if(!entry.name.endsWith('.html')) continue;
    const html=fs.readFileSync(file,'utf8');
    if(html.includes('id="site-branding-overrides"')) continue;
    if(!html.includes('</head>')) throw new Error(`Missing document head: ${file}`);
    fs.writeFileSync(file,html.replace('</head>',style+'</head>'));
    count++;
  }
}
visit(root);
console.log(`Removed visible Framer branding on ${count} pages.`);

// Social icon hover: the accent token resolves to navy, so Twitter and Instagram icons
// use the same literal red (#FD3A25) that the Facebook and LinkedIn hover icons hardcode.
const hoverToken='RzcxcTLBQ:`var(--token-1971cadb-8b29-4614-aa27-7217857b58f4, rgb(253, 58, 37))`';
const hoverRed='RzcxcTLBQ:`rgb(253, 58, 37)`';
let scripts=0;
function visitScripts(dir) {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) {visitScripts(file);continue;}
    if(!entry.name.endsWith('.mjs')) continue;
    const js=fs.readFileSync(file,'utf8');
    if(!js.includes(hoverToken)) continue;
    fs.writeFileSync(file,js.replaceAll(hoverToken,hoverRed));
    scripts++;
  }
}
visitScripts(root);
console.log(`Set red social icon hover in ${scripts} scripts.`);

// Pricing nav link: remove it from the header and footer menus. The Pricing Plans section stays.
const pricingMarker='HKpWLV4Tx:`Pricing`';
function removePricingLinks(js) {
  let removed=0;
  for(let at=js.indexOf(pricingMarker);at!==-1;at=js.indexOf(pricingMarker)) {
    const start=js.lastIndexOf(',x(F,{links:',at);
    if(start===-1) throw new Error('Pricing nav link wrapper not found');
    let depth=0,end=start+1;
    for(;end<js.length;end++) {
      if(js[end]==='(') depth++;
      else if(js[end]===')'&&--depth===0) break;
    }
    if(end<=at) throw new Error('Pricing nav link wrapper does not contain the link');
    js=js.slice(0,start)+js.slice(end+1);
    removed++;
  }
  return [js,removed];
}
let pricingLinks=0;
function visitPricing(dir) {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) {visitPricing(file);continue;}
    const text=fs.readFileSync(file,'utf8');
    let next=text,removed=0;
    if(entry.name.endsWith('.mjs')&&text.includes(pricingMarker)) [next,removed]=removePricingLinks(text);
    if(entry.name.endsWith('.html')) {
      next=text.replace(/<!--\$--><div class="framer-(?:1w8axx1|1gtfu3t)-container"><!--\$--><a [^>]*>(?:(?!<\/a>).)*?>Pricing<\/p>.*?<\/a><!--\/\$--><\/div><!--\/\$-->/gs,()=>{removed++;return '';});
    }
    if(next===text) continue;
    fs.writeFileSync(file,next);
    pricingLinks+=removed;
  }
}
visitPricing(root);
console.log(`Removed ${pricingLinks} Pricing nav links.`);

// Nav overlay fix: on desktop the mobile menu overlay is disabled, but each nav click still toggled it,
// and the toggle locked page scrolling on every other click. Block scrolling only while the overlay is enabled.
const overlayHook='ce({blockDocumentScrolling:t,dismissWithEsc:r&&n})';
const overlayHookFixed='ce({blockDocumentScrolling:r&&t!==!1,dismissWithEsc:r&&n})';
const mainScript=path.join(root,'mirror/framerusercontent.com/sites/4nHYQx2yRdfCawW7aBBb5U/script_main.CBZeWClt.mjs');
const mainJs=fs.readFileSync(mainScript,'utf8');
if(mainJs.includes(overlayHook)) fs.writeFileSync(mainScript,mainJs.replace(overlayHook,overlayHookFixed));
else if(!mainJs.includes(overlayHookFixed)) throw new Error('Nav overlay hook not found');
console.log('Applied nav scroll lock fix.');

// Services accordion: open/close over 0.8s on a soft ease-in-out curve, and fade the description in on the same curve
// instead of a linear 0.4s, so cards opened on hover (site-services.js) grow and shrink smoothly.
const servicesScript=path.join(root,'mirror/framerusercontent.com/sites/4nHYQx2yRdfCawW7aBBb5U/gMDC8wuXltBR4wh60X5cUr025fkyq8Qs6oYlq5qzICs.qCTdhhq8.mjs');
const servicesEase=/Ln=\{delay:[^,]+,duration:[^,]+,ease:\[[^\]]+\],type:`tween`\},Rn=\{opacity:1,rotate:0,rotateX:0,rotateY:0,scale:1,skewX:0,skewY:0,transition:\{delay:[^,]+,duration:[^,]+,ease:\[[^\]]+\],type:`tween`\}/;
const servicesEaseFixed='Ln={delay:0,duration:.8,ease:[.4,0,.2,1],type:`tween`},Rn={opacity:1,rotate:0,rotateX:0,rotateY:0,scale:1,skewX:0,skewY:0,transition:{delay:.15,duration:.6,ease:[.4,0,.2,1],type:`tween`}';
const servicesJs=fs.readFileSync(servicesScript,'utf8');
if(!servicesEase.test(servicesJs)) throw new Error('Services accordion transition not found');
fs.writeFileSync(servicesScript,servicesJs.replace(servicesEase,()=>servicesEaseFixed));
console.log('Applied smooth services accordion transition.');

// Accent dot glow: the animated dot component hardcodes an orange glow; use the blue accent from site-polish.css.
const dotScript=path.join(root,'mirror/framerusercontent.com/sites/4nHYQx2yRdfCawW7aBBb5U/Z8MROexOS.Dh7cvlqX.mjs');
const dotJs=fs.readFileSync(dotScript,'utf8');
const dotJsBlue=dotJs.replace(/boxShadow:`([^`]*)`/g,(m,v)=>'boxShadow:`'+v.replaceAll('rgba(253, 58, 37,','rgba(20, 34, 227,').replaceAll('rgb(253, 58, 37)','rgb(20, 34, 227)')+'`');
if(dotJsBlue!==dotJs) fs.writeFileSync(dotScript,dotJsBlue);
else if(!dotJs.includes('rgb(20, 34, 227)')) throw new Error('Accent dot glow not found');
console.log('Applied blue accent dot glow.');

// Testimonial rating stars: orange SVG asset, recoloured to the blue accent.
const starSvg=path.join(root,'mirror/framerusercontent.com/images/ir3Y9RLfZ854i7W0EQDhS0Zl4M.svg');
fs.writeFileSync(starSvg,fs.readFileSync(starSvg,'utf8').replace('fill="#FD3A25"','fill="#1422E3"'));
console.log('Set blue rating stars.');

// Phone menu: the overlay popped in and out with 0s transitions. Fade the backdrop and slide the menu panel instead.
// The panel's full-screen backdrop blur is dropped in site-polish.css, since repainting it made phones stutter.
const menuEdits=[
  ['animate:{opacity:1,transition:{delay:0,duration:0,ease:[.5,0,.88,.77],type:`tween`}},className:`${P(b,`framer-1d1l2ka`)}','animate:{opacity:1,transition:{delay:0,duration:.35,ease:[.22,1,.36,1],type:`tween`}},className:`${P(b,`framer-1d1l2ka`)}'],
  ['exit:{opacity:0,transition:{delay:0,duration:0,ease:[.12,.23,.5,1],type:`tween`}},initial:{opacity:0},onTap:()=>e.hide()},`lk3t5TMlZ`)','exit:{opacity:0,transition:{delay:0,duration:.3,ease:[.4,0,.2,1],type:`tween`}},initial:{opacity:0},onTap:()=>e.hide()},`lk3t5TMlZ`)'],
  ['y(O.div,{className:P(b,`framer-19wkzlx`),','y(O.div,{initial:{opacity:0,y:-24},animate:{opacity:1,y:0,transition:{duration:.45,ease:[.22,1,.36,1]}},exit:{opacity:0,y:-24,transition:{duration:.3,ease:[.4,0,.2,1]}},className:P(b,`framer-19wkzlx`),'],
];
let menuJs=fs.readFileSync(mainScript,'utf8');
for(const [from,to] of menuEdits) {
  if(menuJs.includes(from)) menuJs=menuJs.replace(from,to);
  else if(!menuJs.includes(to)) throw new Error('Phone menu animation hook not found');
}
fs.writeFileSync(mainScript,menuJs);
console.log('Applied smooth phone menu.');

// Link hover colour: dark blue instead of orange in the shared nav link component (header, footer, phone menu).
const linkOrange='rgb(255, 77, 0)', linkBlue='rgb(2, 10, 112)';
const linkComponent=path.join(root,'mirror/framerusercontent.com/sites/4nHYQx2yRdfCawW7aBBb5U/Xx_sbLkzD.hqZYkhdL.mjs');
let linkFiles=0;
for(const file of [linkComponent,...fs.readdirSync(root,{recursive:true}).filter(f=>f.endsWith('.html')).map(f=>path.join(root,f))]) {
  const text=fs.readFileSync(file,'utf8');
  if(!text.includes(linkOrange)) continue;
  fs.writeFileSync(file,text.replaceAll(linkOrange,linkBlue));
  linkFiles++;
}
console.log(`Set dark blue link hover in ${linkFiles} files.`);

// Hero eyebrow: rename the badge. Replaced in HTML and in the hydration module so it does not revert on hydrate.
const heroFrom='AI-Driven Agency', heroTo='DIGITAL MARKETING & GROWTH STUDIO';
let heroFiles=0;
function visitHero(dir) {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) {visitHero(file);continue;}
    if(!/\.(html|mjs)$/.test(entry.name)) continue;
    const t=fs.readFileSync(file,'utf8');
    if(!t.includes(heroFrom)) continue;
    fs.writeFileSync(file,t.split(heroFrom).join(heroTo));
    heroFiles++;
  }
}
visitHero(root);
console.log(`Set hero eyebrow text in ${heroFiles} files.`);

// Browser tab and share title: the template name, in the HTML head and in the runtime that resets it on hydrate.
const titleFrom='AgenAI - AI Agency Framer Template', titleTo='MG Marketing';
let titleFiles=0;
for(const f of fs.readdirSync(root,{recursive:true}).filter(f=>/\.(html|mjs|json)$/.test(f)).map(f=>path.join(root,f))) {
  const t=fs.readFileSync(f,'utf8');
  if(!t.includes(titleFrom)) continue;
  fs.writeFileSync(f,t.split(titleFrom).join(titleTo));
  titleFiles++;
}
console.log(`Set page title in ${titleFiles} files.`);

// Contact form "You are interested in" options: replace the template's design services with ours.
// Changed in the HTML and the hydration module so the dropdown does not revert on hydrate.
const interests=['Performance marketing','Social media','AI video','Business automation','Brand & web','SEO & AEO','Not sure yet'];
const oldHtmlOpts='<option value="Website Design ">Website Design</option><option value="Web Development ">Web Development</option><option value="UI/UX Design">UI/UX Design</option><option value="Framer Landing Page">Framer Landing Page</option>';
const newHtmlOpts=interests.map(t=>`<option value="${t.replace('&','&amp;')}">${t.replace('&','&amp;')}</option>`).join('');
const oldJsOpts='{title:`Website Design`,type:`option`,value:`Website Design `},{title:`Web Development`,type:`option`,value:`Web Development `},{title:`UI/UX Design`,type:`option`,value:`UI/UX Design`},{title:`Framer Landing Page`,type:`option`,value:`Framer Landing Page`}';
const newJsOpts=interests.map(t=>`{title:\`${t}\`,type:\`option\`,value:\`${t}\`}`).join(',');
let optFiles=0;
for(const f of fs.readdirSync(root,{recursive:true}).filter(f=>/\.(html|mjs)$/.test(f)).map(f=>path.join(root,f))) {
  const t=fs.readFileSync(f,'utf8');
  const next=t.split(oldHtmlOpts).join(newHtmlOpts).split(oldJsOpts).join(newJsOpts);
  if(next!==t) {fs.writeFileSync(f,next);optFiles++;}
}
console.log(`Set contact form interest options in ${optFiles} files.`);

// Load speed: Framer marks images eager when their Y position inside a component is small, so images far down
// the page loaded up front on phones. The HTML already lazy-loads every image; make the runtime render match.
const framerRuntime=path.join(root,'mirror/framerusercontent.com/sites/4nHYQx2yRdfCawW7aBBb5U/framer.CYMQxEW1.mjs');
// The hero background is the exception: Framer can re-create it after hydration, and a lazy copy then painted
// seconds late, so it stays eager and high priority.
const rt=fs.readFileSync(framerRuntime,'utf8');
const imgHooks=['fetchpriority:e.fetchPriority,loading:e.loading,width:e.pixelWidth','fetchpriority:e.fetchPriority,loading:"lazy",width:e.pixelWidth'];
const imgHook='fetchpriority:String(f).includes(`qOqZWjFrFzcXBBiXFlYL0PKeHk`)?`high`:e.fetchPriority,loading:String(f).includes(`qOqZWjFrFzcXBBiXFlYL0PKeHk`)?`eager`:`lazy`,width:e.pixelWidth';
const oldHook=imgHooks.find(h=>rt.includes(h));
if(oldHook) fs.writeFileSync(framerRuntime,rt.replace(oldHook,imgHook));
else if(!rt.includes(imgHook)) throw new Error('Framer image loading hook not found');
console.log('Forced lazy image loading in the Framer runtime.');

// Load speed: Framer's on-page editor bar (an iframe and about seven scripts from framer.com) and Framer
// analytics (reporting to the original Framer project) load on every visit but serve nothing on this host.
const editorFrom='EditorBar:D===void 0?void 0:', editorTo='EditorBar:!0?void 0:';
const ms=fs.readFileSync(mainScript,'utf8');
if(ms.includes(editorFrom)) fs.writeFileSync(mainScript,ms.replace(editorFrom,editorTo));
else if(!ms.includes(editorTo)) throw new Error('Framer editor bar hook not found');
let analyticsPages=0;
for(const f of fs.readdirSync(root,{recursive:true}).filter(f=>f.endsWith('.html')).map(f=>path.join(root,f))) {
  const t=fs.readFileSync(f,'utf8'), next=t.replace(/<script async src="https:\/\/events\.framer\.com\/script[^"]*"[^>]*><\/script>/g,'');
  if(next!==t) {fs.writeFileSync(f,next);analyticsPages++;}
}
console.log(`Disabled the Framer editor bar and removed Framer analytics from ${analyticsPages} pages.`);

// Load speed: images without a loading hint were fetched eagerly, including the hidden original
// Framer work cards (several MB). Lazy-load them; images in the viewport still load straight away.
let lazyImgs=0;
for(const f of fs.readdirSync(root,{recursive:true}).filter(f=>f.endsWith('.html')).map(f=>path.join(root,f))) {
  const t=fs.readFileSync(f,'utf8');
  const next=t.replace(/<img(?![^>]*\sloading=)([^>]*)>/g,(m,a)=>{lazyImgs++;return `<img loading="lazy"${/\sdecoding=/.test(a)?'':' decoding="async"'}${a}>`;});
  if(next!==t) fs.writeFileSync(f,next);
}
console.log(`Lazy-loaded ${lazyImgs} images.`);

// Load speed: the hero background is the largest paint, but as a lazy image it waited for layout before
// loading. Load it eagerly at high priority, and preload it from the top of the head so the download starts at once.
const heroImg='qOqZWjFrFzcXBBiXFlYL0PKeHk.jpg';
let heroPages=0;
for(const f of fs.readdirSync(root,{recursive:true}).filter(f=>f.endsWith('.html')).map(f=>path.join(root,f))) {
  let t=fs.readFileSync(f,'utf8').replace(/<link id="site-hero-preload"[^>]*>/,'');
  if(!t.includes(heroImg)) continue;
  t=t.replace(new RegExp(`<img loading="lazy"(?=[^>]*${heroImg})`,'g'),'<img loading="eager" fetchpriority="high"');
  t=t.replace(/<head[^>]*>/,m=>`${m}<link id="site-hero-preload" rel="preload" as="image" fetchpriority="high" href="/mirror/framerusercontent.com/images/${heroImg}">`);
  fs.writeFileSync(f,t);
  heroPages++;
}
console.log(`Prioritised the hero image on ${heroPages} pages.`);

// Liquid glass nav, smoother load, interactive buttons. Replaced on each run so CSS edits apply.
const scriptsDir=path.dirname(fileURLToPath(import.meta.url));
const polishCss=['site-polish.css','site-process.css','site-services.css','site-works.css','site-features.css','site-trust.css','site-metrics.css','site-svcindex.css','site-perf.css','site-iwork.css'].map(f=>fs.readFileSync(path.join(scriptsDir,f),'utf8')).join('\n');
const polishStyle=`<style id="site-polish">${polishCss}</style>`;
// Runs early in <head>, before Framer's deferred modules, so a refresh lands at the top (home).
const headScript=`<script id="site-home">${fs.readFileSync(path.join(scriptsDir,'site-home.js'),'utf8')}</script>`;
const processScript=`<script id="site-process">${['site-process.js','site-services.js','site-works.js','site-features.js','site-faq.js','site-trust.js','site-metrics.js','site-svcindex.js','site-perf.js','site-iwork.js'].map(f=>fs.readFileSync(path.join(scriptsDir,f),'utf8')).join('\n')}</script>`;
// Liquid glass lens: a displacement map that is neutral in the middle and pulls the backdrop inward near each edge,
// so the glass bends what is behind it like Apple's Liquid Glass. Red drives x, green drives y.
const glassFilter='<svg id="site-polish-filter" aria-hidden="true" style="position:absolute;width:0;height:0"><filter id="mg-glass-distortion" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB"><feImage href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27 preserveAspectRatio=%27none%27%3E%3ClinearGradient id=%27g%27%3E%3Cstop offset=%270%27 stop-color=%27rgb(255,0,0)%27/%3E%3Cstop offset=%27.12%27 stop-color=%27rgb(128,0,0)%27/%3E%3Cstop offset=%27.88%27 stop-color=%27rgb(128,0,0)%27/%3E%3Cstop offset=%271%27 stop-color=%27rgb(0,0,0)%27/%3E%3C/linearGradient%3E%3Crect width=%27100%27 height=%27100%27 fill=%27url(%23g)%27/%3E%3C/svg%3E" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="rx"/><feImage href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27 preserveAspectRatio=%27none%27%3E%3ClinearGradient id=%27g%27 x2=%270%27 y2=%271%27%3E%3Cstop offset=%270%27 stop-color=%27rgb(0,255,0)%27/%3E%3Cstop offset=%27.3%27 stop-color=%27rgb(0,128,0)%27/%3E%3Cstop offset=%27.7%27 stop-color=%27rgb(0,128,0)%27/%3E%3Cstop offset=%271%27 stop-color=%27rgb(0,0,0)%27/%3E%3C/linearGradient%3E%3Crect width=%27100%27 height=%27100%27 fill=%27url(%23g)%27/%3E%3C/svg%3E" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="gy"/><feComposite in="rx" in2="gy" operator="arithmetic" k2="1" k3="1" result="map"/><feDisplacementMap in="SourceGraphic" in2="map" scale="0.08" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';

let polished=0;
function visitPolish(dir) {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) {visitPolish(file);continue;}
    if(!entry.name.endsWith('.html')) continue;
    let html=fs.readFileSync(file,'utf8')
      .replace(/<style id="site-polish">.*?<\/style>/s,'')
      .replace(/<script id="site-home">.*?<\/script>/s,'')
      .replace(/<svg id="site-polish-filter".*?<\/svg>/s,'')
      .replace(/<script id="site-process">.*?<\/script>/s,'');
    if(!html.includes('</body>')) throw new Error(`Missing document body: ${file}`);
    html=html.replace('</head>',()=>headScript+polishStyle+'</head>').replace('</body>',()=>glassFilter+processScript+'</body>');
    fs.writeFileSync(file,html);
    polished++;
  }
}
visitPolish(root);
console.log(`Applied site polish on ${polished} pages.`);

// Same-origin assets: the runtime modules name fonts, images and CMS data with an absolute origin (the first
// host the site was published on), so another host (Cloudflare) still pulled them cross-origin from it. Every
// such URL sits in a template literal, so the origin becomes ${location.origin}: whichever host serves the page.
let originFiles=0;
for(const f of fs.readdirSync(root,{recursive:true}).filter(f=>f.endsWith('.mjs')).map(f=>path.join(root,f))) {
  const t=fs.readFileSync(f,'utf8'), next=t.replace(/https?:\/\/[^/\s"'`]+\/(?=(?:mirror|m\/[0-9a-f]{10})\/)/g,'${location.origin}/');
  if(next!==t) {fs.writeFileSync(f,next);originFiles++;}
}
console.log(`Made asset URLs same-origin in ${originFiles} runtime files.`);

// Cache busting: /mirror/* is served immutable, so browsers keep old copies for a year. Every reference
// is served under /m/<hash>/ instead (netlify.toml rewrites it to /mirror/), with the hash taken from the
// mirror contents, so any change gives returning visitors fresh files. References are reset first so the
// hash does not depend on the previous run.
const assetRef=/(?<=["'(,\s]|https?:\/\/[^/\s"'`]+|\$\{location\.origin\})\/(?:mirror|m\/[0-9a-f]{10})\//g;
const textAsset=f=>/\.(html|mjs|json|css)$/.test(f);
const allFiles=fs.readdirSync(root,{recursive:true}).map(f=>path.join(root,f)).filter(f=>fs.statSync(f).isFile()).sort();
for(const f of allFiles.filter(textAsset)) {
  const t=fs.readFileSync(f,'utf8'), next=t.replace(assetRef,'/mirror/');
  if(next!==t) fs.writeFileSync(f,next);
}
const assetHash=crypto.createHash('sha256');
for(const f of allFiles.filter(f=>f.startsWith(path.join(root,'mirror')+path.sep))) assetHash.update(path.relative(root,f)).update(fs.readFileSync(f));
const assetPrefix=`/m/${assetHash.digest('hex').slice(0,10)}/`;
let bustFiles=0;
for(const f of allFiles.filter(textAsset)) {
  const t=fs.readFileSync(f,'utf8'), next=t.replace(assetRef,assetPrefix);
  if(next!==t) {fs.writeFileSync(f,next);bustFiles++;}
}
// Netlify placeholders cannot sit before a splat, so the rewrite names the current hash exactly.
fs.writeFileSync(path.join(root,'_redirects'),`${assetPrefix}* /mirror/:splat 200\n`);
// Cache headers for hosts that read a _headers file (Cloudflare Pages; Netlify also takes netlify.toml):
// asset URLs change with their content, so browsers may keep them for a year.
fs.writeFileSync(path.join(root,'_headers'),['/m/*','/mirror/*'].map(p=>`${p}\n  Cache-Control: public, max-age=31536000, immutable\n  Access-Control-Allow-Origin: *\n`).join(''));
console.log(`Served assets under ${assetPrefix} in ${bustFiles} files.`);
