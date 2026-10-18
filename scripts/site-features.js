// Features tree: light pulses that travel along each branch from the central logo out to the feature cards.
// Each branch path is cloned into an .mg-pulse path; the clone is styled and animated in site-features.css.
// Framer can re-render the section, so missing pulses are added again.
(() => {
  function addPulses() {
    for (const svg of document.querySelectorAll('svg.framer-9xleZ, svg.framer-x8YHN')) {
      if (svg.querySelector('.mg-pulse')) continue;
      const track = svg.querySelector('path[stroke="rgb(212, 212, 216)"]');
      if (!track) continue;
      const pulse = track.cloneNode(false);
      pulse.removeAttribute('id');
      pulse.setAttribute('class', 'mg-pulse');
      pulse.setAttribute('pathLength', '1');
      track.parentNode.appendChild(pulse);
    }
  }
  const start = () => {
    addPulses();
    new MutationObserver(addPulses).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
