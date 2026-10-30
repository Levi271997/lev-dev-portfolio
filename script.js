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

// Hero headline: wrap each word in its own mask so it can rise into place on load (the animation lives in CSS)
(function () {
  var h1 = document.querySelector('.hero h1'), i = 0;
  if (!h1) return;
  (function walk(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 1) return walk(n);
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
        var w = document.createElement('span'), inner = document.createElement('span');
        w.className = 'w'; inner.className = 'wi'; inner.textContent = part;
        inner.style.setProperty('--i', i++);
        w.appendChild(inner); frag.appendChild(w);
      });
      n.parentNode.replaceChild(frag, n);
    });
  })(h1);
})();

// Marquee: constant drift that speeds up and leans with scroll velocity
(function () {
  var band = document.querySelector('.marquee'), track = band && band.querySelector('.track');
  if (!track) return;
  track.innerHTML += track.innerHTML;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var x = 0, half = 0, last = performance.now(), lastY = scrollY, boost = 0, visible = true;
  function measure() { half = track.offsetWidth / 2; }
  measure();
  addEventListener('resize', measure);
  if (document.fonts) document.fonts.ready.then(measure);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(band);
  }
  (function step(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    boost += (Math.abs(scrollY - lastY) / Math.max(dt, 0.001) - boost) * 0.08;
    lastY = scrollY;
    if (visible && half) {
      x -= (70 + boost * 0.6) * dt;
      if (-x >= half) x += half;
      track.style.transform = 'translate3d(' + x + 'px,0,0) skewX(' + -Math.min(boost / 250, 10) + 'deg)';
    }
    requestAnimationFrame(step);
  })(last);
})();

// Belief line: words light up one by one as the band scrolls through the viewport
(function () {
  var p = document.querySelector('.belief p');
  if (!p || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var words = p.textContent.trim().split(/\s+/);
  p.textContent = '';
  words.forEach(function (w, i) {
    var s = document.createElement('span');
    s.className = 'bw'; s.textContent = w;
    p.appendChild(s);
    if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
  });
  var spans = p.querySelectorAll('.bw'), lit = -1;
  function update() {
    var r = p.getBoundingClientRect(), prog = (innerHeight * 0.85 - r.top) / (innerHeight * 0.5);
    var n = Math.round(Math.max(0, Math.min(1, prog)) * spans.length);
    if (n === lit) return;
    lit = n;
    spans.forEach(function (s, i) { s.classList.toggle('lit', i < n); });
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();

// Pointer-only polish: magnetic buttons, tilting service cards, a "Visit" tag that trails the cursor over projects
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('.btn, .email button').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.25 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.35 + 'px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });

  document.querySelectorAll('.svc').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      if (el.classList.contains('rv')) return;
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', x * 100 + '%');
      el.style.setProperty('--my', y * 100 + '%');
      el.style.transform = 'perspective(900px) rotateX(' + (0.5 - y) * 8 + 'deg) rotateY(' + (x - 0.5) * 10 + 'deg)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });

  var tag = document.createElement('div');
  tag.className = 'cursor-tag';
  tag.setAttribute('aria-hidden', 'true');
  tag.innerHTML = '<span>Visit site ↗</span>';
  document.body.appendChild(tag);
  var tx = 0, ty = 0, x = 0, y = 0, on = false;
  addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
  function loop() {
    x += (tx - x) * 0.18; y += (ty - y) * 0.18;
    tag.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    if (on) requestAnimationFrame(loop);
  }
  document.querySelectorAll('.proj').forEach(function (el) {
    el.addEventListener('pointerenter', function (e) {
      if (on) return;
      if (!tag.classList.contains('on')) { x = tx = e.clientX; y = ty = e.clientY; }
      on = true; tag.classList.add('on'); loop();
    });
    el.addEventListener('pointerleave', function () { on = false; tag.classList.remove('on'); });
  });
})();
