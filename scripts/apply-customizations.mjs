import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

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

// Liquid glass nav, smoother load, interactive buttons. Replaced on each run so CSS edits apply.
const scriptsDir=path.dirname(fileURLToPath(import.meta.url));
const polishCss=['site-polish.css','site-process.css','site-services.css','site-works.css'].map(f=>fs.readFileSync(path.join(scriptsDir,f),'utf8')).join('\n');
const polishStyle=`<style id="site-polish">${polishCss}</style>`;
const processScript=`<script id="site-process">${['site-process.js','site-services.js','site-works.js'].map(f=>fs.readFileSync(path.join(scriptsDir,f),'utf8')).join('\n')}</script>`;
const glassFilter='<svg id="site-polish-filter" aria-hidden="true" style="position:absolute;width:0;height:0"><filter id="mg-glass-distortion" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox"><feTurbulence type="fractalNoise" baseFrequency="0.003 0.007" numOctaves="1" result="turbulence"/><feDisplacementMap in="SourceGraphic" in2="turbulence" scale="60" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
let polished=0;
function visitPolish(dir) {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) {visitPolish(file);continue;}
    if(!entry.name.endsWith('.html')) continue;
    let html=fs.readFileSync(file,'utf8')
      .replace(/<style id="site-polish">.*?<\/style>/s,'')
      .replace(/<svg id="site-polish-filter".*?<\/svg>/s,'')
      .replace(/<script id="site-process">.*?<\/script>/s,'');
    if(!html.includes('</body>')) throw new Error(`Missing document body: ${file}`);
    html=html.replace('</head>',()=>polishStyle+'</head>').replace('</body>',()=>glassFilter+processScript+'</body>');
    fs.writeFileSync(file,html);
    polished++;
  }
}
visitPolish(root);
console.log(`Applied site polish on ${polished} pages.`);
