document.getElementById('copy-email').addEventListener('click', function () {
  var btn = this, text = document.getElementById('email-addr').textContent;
  function done(msg) { btn.textContent = msg; setTimeout(function () { btn.textContent = 'Copy email'; }, 1800); }
  function fallback() {
    var r = document.createRange(); r.selectNodeContents(document.getElementById('email-addr'));
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); done('Selected');
  }
  try { navigator.clipboard.writeText(text).then(function () { done('Copied'); }, fallback); }
  catch (e) { fallback(); }
});

(function () {
  var btn = document.getElementById('menu-btn'), nav = document.getElementById('site-nav');
  function setOpen(open) {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  btn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  addEventListener('resize', function () { if (innerWidth > 760) setOpen(false); });
})();

(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var progress = document.getElementById('progress');
  var mark = document.querySelector('.mark');
  var ticking = false;

  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    if (!reduce && mark && scrollY < innerHeight * 1.5) {
      mark.style.transform = 'translateY(' + scrollY * 0.18 + 'px) rotate(' + scrollY * -0.012 + 'deg)';
    }
    ticking = false;
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (reduce || !('IntersectionObserver' in window)) return;

  // [selector, extra class, stagger in ms]
  var groups = [
    ['.head .label', '', 0], ['.head h2', 'wipe', 0], ['.head p', '', 120],
    ['.stat', '', 110],
    ['.about .copy p', '', 120], ['.side > div', '', 140], ['.chips span', '', 35], ['.certs li', 'from-left', 120],
    ['.svc', '', 100],
    ['.proj', 'from-left', 70],
    ['.belief .bar', 'grow', 0], ['.belief p', '', 150],
    ['.contact .label', '', 0], ['.contact h2', 'wipe', 0], ['.contact .muted', '', 150], ['.email', '', 250],
    ['.socials li', '', 80]
  ];

  var fold = innerHeight;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.remove('pre');
      if (e.target.matches('.stat')) countUp(e.target.querySelector('b'));
    });
  }, { rootMargin: '0px 0px -12% 0px' });

  groups.forEach(function (g) {
    document.querySelectorAll(g[0]).forEach(function (el, i) {
      // Leave anything already on screen untouched so the page is complete at rest
      if (el.getBoundingClientRect().top < fold) return;
      el.classList.add('rv', 'pre');
      if (g[1]) el.classList.add(g[1]);
      el.style.setProperty('--d', Math.min(i * g[2], 700) + 'ms');
      el.dataset.count = '1';
      io.observe(el);
      el.addEventListener('transitionend', function done() {
        if (el.classList.contains('pre')) return;
        el.removeEventListener('transitionend', done);
        el.classList.remove('rv', 'wipe', 'grow', 'from-left');
        el.style.removeProperty('--d');
      });
    });
  });

  function countUp(b) {
    if (!b || !b.closest('[data-count]')) return;
    var m = b.textContent.match(/^(\d+)(.*)$/);
    if (!m) return;
    var end = +m[1], suffix = m[2], start = performance.now(), dur = 1200;
    (function step(t) {
      var p = Math.min((t - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      b.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
})();
