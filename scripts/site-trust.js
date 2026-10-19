// Trust bar after overtake-wbs.framer.website: inject a 3-avatar cluster before the headline and a vertical
// divider before the client logo marquee. Avatars are decorative (aria-hidden). Only sibling nodes are added,
// never moving Framer's own nodes, and Framer can re-render the row, so missing nodes are re-added.
(() => {
  const rafOnce = f => { let t = 0; return () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; f(); }); }; };
  const AVATARS = [
    'eZ8inPIozwVXbVStRvddal5ZO84.jpg',
    'nuSd8BM1kTHOuMIUAWaixG8WBHc.jpg',
    'RfaecSOAwLoEpM5d0m2wamaL7Q.png',
  ];
  function build() {
    const row = document.querySelector('.framer-19b0sxl');
    if (!row) return;
    const head = row.querySelector(':scope > .framer-zney4t');
    const marquee = row.querySelector(':scope > .framer-662aja');
    if (!head || !marquee) return;
    if (!row.querySelector('.mg-trust-avatars')) {
      const cluster = document.createElement('div');
      cluster.className = 'mg-trust-avatars';
      cluster.setAttribute('aria-hidden', 'true');
      for (const name of AVATARS) {
        const dot = document.createElement('span');
        dot.style.backgroundImage = "url('/mirror/framerusercontent.com/images/" + name + "')";
        cluster.appendChild(dot);
      }
      row.insertBefore(cluster, head);
    }
    if (!row.querySelector('.mg-trust-divider')) {
      const divider = document.createElement('div');
      divider.className = 'mg-trust-divider';
      divider.setAttribute('aria-hidden', 'true');
      row.insertBefore(divider, marquee);
    }
  }
  const start = () => {
    build();
    new MutationObserver(rafOnce(build)).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
