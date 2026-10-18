// On refresh, always land at the top (home), not the last scroll position.
// Framer saves scroll in history.state.scrollPosition and restores it on reload; this runs in <head>
// before Framer's deferred modules, zeroes that saved position, then forces the top once hydration settles.
(function () {
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  try {
    var s = history.state;
    if (s && s.scrollPosition) { s.scrollPosition = { x: 0, y: 0 }; history.replaceState(s, ''); }
  } catch (e) {}
  function top() { try { window.scrollTo(0, 0); } catch (e) {} }
  addEventListener('DOMContentLoaded', top);
  addEventListener('load', function () { top(); requestAnimationFrame(top); setTimeout(top, 60); setTimeout(top, 200); });
  addEventListener('pageshow', function (e) { if (e.persisted) top(); });
})();
