/* FinStarter — shared behaviour for all pages */
// Book-a-demo modal: opens from every "Book a Demo" / "Talk to our experts" button.
(function () {
  var modal = document.getElementById('demo-modal');
  if (!modal) return;
  var dialog = modal.querySelector('.modal__dialog');
  var form = document.getElementById('demo-form');
  var viewForm = modal.querySelector('.modal__view--form');
  var viewDone = modal.querySelector('.modal__view--done');
  var lastFocus = null, closeTimer = null;

  function open(from) {
    lastFocus = from || document.activeElement;
    clearTimeout(closeTimer);
    viewForm.hidden = false; viewDone.hidden = true;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(function () { requestAnimationFrame(function () { modal.classList.add('is-open'); }); });
    setTimeout(function () { var first = form.querySelector('input'); if (first) first.focus(); }, 60);
  }
  function close() {
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    closeTimer = setTimeout(function () {
      modal.hidden = true;
      form.reset(); clearErrors();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, 220);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-open-demo]'), function (btn) {
    btn.addEventListener('click', function (e) { e.preventDefault(); open(btn); });
  });
  Array.prototype.forEach.call(modal.querySelectorAll('[data-close]'), function (el) {
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') { // keep focus inside the dialog
      var f = dialog.querySelectorAll('button, input, textarea, [tabindex]:not([tabindex="-1"])');
      f = Array.prototype.filter.call(f, function (n) { return !n.disabled && n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // validation
  function setError(input, msg) {
    var err = document.getElementById(input.id + '-err');
    input.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  }
  function clearErrors() {
    Array.prototype.forEach.call(form.querySelectorAll('.field__input'), function (i) { setError(i, ''); });
  }
  function validate() {
    var ok = true;
    var name = form.elements.name, email = form.elements.email, company = form.elements.company;
    if (!name.value.trim()) { setError(name, 'Please enter your name.'); ok = false; } else setError(name, '');
    if (!email.value.trim()) { setError(email, 'Please enter your work email.'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { setError(email, 'That doesn’t look like a valid email.'); ok = false; }
    else setError(email, '');
    if (!company.value.trim()) { setError(company, 'Please enter your company name.'); ok = false; } else setError(company, '');
    return ok;
  }
  Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (i) {
    i.addEventListener('input', function () { if (i.classList.contains('is-invalid')) setError(i, ''); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) { var bad = form.querySelector('.is-invalid'); if (bad) bad.focus(); return; }
    // TODO: send form data to your CRM / backend here (fetch POST).
    viewForm.hidden = true; viewDone.hidden = false;
    var done = viewDone.querySelector('button'); if (done) done.focus();
  });
})();

// Burger menu (tablet / mobile): toggles the site menu panel under the header.
(function () {
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.nav__burger');
  if (!nav || !burger) return;
  function setOpen(open) {
    nav.classList.toggle('is-menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setOpen(!nav.classList.contains('is-menu-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setOpen(false); });
})();

// "Built for you" dropdown: hover opens it (CSS); click/tap toggles it, Esc or outside click closes.
(function () {
  var dd = document.querySelector('.nav__dd');
  var trigger = dd && dd.querySelector('.nav__item--dd');
  if (!dd || !trigger) return;
  function setOpen(open) {
    dd.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    setOpen(!dd.classList.contains('is-open'));
  });
  document.addEventListener('click', function (e) { if (!dd.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
})();

// FAQ accordion: each question opens and closes independently.
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.qa__head'), function (head) {
    head.addEventListener('click', function () {
      var item = head.closest('.qa');
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();

// "Backed by Itransition": numbers count up from 0 once they scroll into view.
// Width is reserved up front and digits are tabular, so nothing shifts while counting.
(function () {
  var els = document.querySelectorAll('.nmbr__v');
  if (!els.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function fmt(n, comma) { return comma ? n.toLocaleString('en-US') : String(n); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function run(item) {
    var dur = 1800, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var v = Math.round(easeOut(p) * item.target);
      item.el.textContent = fmt(v, item.comma) + item.suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function setup() {
    var items = [];
    Array.prototype.forEach.call(els, function (el) {
      var text = el.textContent.trim();
      var m = text.match(/^([\d,]+)(\D*)$/);
      if (!m) return;
      // measure with the real font loaded, then reserve that width
      el.style.minWidth = Math.ceil(el.getBoundingClientRect().width) + 'px';
      items.push({ el: el, target: parseInt(m[1].replace(/,/g, ''), 10), suffix: m[2], comma: m[1].indexOf(',') !== -1, done: false });
      el.textContent = '0' + m[2];
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        items.forEach(function (it) { if (it.el === e.target && !it.done) { it.done = true; run(it); } });
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    items.forEach(function (it) { io.observe(it.el); });
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(setup);
})();

// "Companies" cards slide in from the right once the row scrolls into view.
(function () {
  var row = document.querySelector('.companies__row');
  if (!row || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  row.classList.add('reveal');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { row.classList.add('reveal--in'); io.disconnect(); }
    });
  }, { threshold: 0.2 });
  io.observe(row);
})();

// "24 months": the two roadmaps draw in once they scroll into view.
// Layout is pure CSS (month positions in --at); JS only arms the reveal and, on
// horizontal tracks, keeps two labels on the same side from running into each other
// (narrow laptops) by clamping the earlier one — the launch label always keeps its text.
(function () {
  var maps = document.querySelectorAll('.rmap');
  if (!maps.length) return;
  var GAP = 8, MIN = 32;
  var vertical = window.matchMedia('(max-width: 1024px)'); // tablets and phones: tracks run top→bottom (responsive.css)

  function fit(map) {
    var labels = map.querySelectorAll('.rmap__label');
    Array.prototype.forEach.call(labels, function (l) { l.style.maxWidth = ''; });
    if (vertical.matches) return;
    var width = map.querySelector('.rmap__track').getBoundingClientRect().width;
    var total = parseFloat(map.style.getPropertyValue('--total')) || 24;
    ['top', 'bottom'].forEach(function (side) {
      var items = Array.prototype.map.call(map.querySelectorAll('.rmap__stop--' + side), function (s) {
        var label = s.querySelector('.rmap__label');
        return {
          x: (parseFloat(s.style.getPropertyValue('--at')) || 0) / total * width,
          w: label.scrollWidth,
          label: label,
          keep: s.classList.contains('rmap__stop--launch'),
          align: s.classList.contains('rmap__stop--start') ? 'start' : s.classList.contains('rmap__stop--end') ? 'end' : 'center'
        };
      });
      function left(it) { return it.align === 'start' ? it.x : it.align === 'end' ? it.x - it.w : it.x - it.w / 2; }
      function right(it) { return left(it) + it.w; }
      for (var i = 0; i < items.length - 1; i++) {
        var a = items[i], b = items[i + 1];
        if (right(a) + GAP <= left(b) || a.keep) continue;
        var room = left(b) - GAP - (a.align === 'start' ? a.x : left(a)); // space a may keep
        a.w = Math.max(MIN, Math.min(a.w, a.align === 'center' ? 2 * (left(b) - GAP - a.x) : room));
      }
      items.forEach(function (it) { if (it.w < it.label.scrollWidth) it.label.style.maxWidth = Math.floor(it.w) + 'px'; });
    });
  }
  function fitAll() { Array.prototype.forEach.call(maps, fit); }
  var raf = null;
  window.addEventListener('resize', function () { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(fitAll); });
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fitAll);
  fitAll();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  Array.prototype.forEach.call(maps, function (m) { m.classList.add('rmap--armed'); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      Array.prototype.forEach.call(maps, function (m) { m.classList.add('rmap--in'); });
      io.disconnect();
    });
  }, { threshold: 0.35 });
  io.observe(document.querySelector('.months__maps'));
})();

// Hero: text, glow and the dashboard cards enter on load (once the card images have decoded),
// then the scene drifts up and fades as the hero scrolls away (--hero-p, used by styles.css).
(function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  hero.classList.add('hero--anim');
  var started = false;
  function start() { if (!started) { started = true; hero.classList.add('hero--in'); } }
  var imgs = Array.prototype.slice.call(hero.querySelectorAll('.hs'));
  Promise.all(imgs.map(function (img) {
    return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
  })).then(start);
  setTimeout(start, 1500); // never hold the page for a slow image

  if (!hero.querySelector('.hero__scene')) return;
  var raf = null;
  function update() {
    raf = null;
    var r = hero.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, -r.top / r.height));
    hero.style.setProperty('--hero-p', p.toFixed(4));
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
})();

// Header theme: the sticky header sits over whatever block the page has scrolled to, so it
// reads that block's background once on load and flips to light type over the dark ones
// (.nav--on-dark, styles.css). Blocks are measured, not listed, so it holds on every page.
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;

  var blocks = [];
  function luminance(c) {
    var m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return null;
    var p = m[1].split(',').map(parseFloat);
    if (p.length > 3 && p[3] < 0.5) return null;      // see-through: not this block's colour
    return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
  }
  function collect() {
    var pageLum = luminance(getComputedStyle(document.body).backgroundColor);
    blocks = [];
    Array.prototype.forEach.call(document.querySelectorAll('body > *'), function (el) {
      if (el === nav || !el.getBoundingClientRect) return;
      var kids = el.classList.contains('tail') ? el.children : [el];  // banner + footer sit inside .tail
      Array.prototype.forEach.call(kids, function (b) {
        var l = luminance(getComputedStyle(b).backgroundColor);
        if (l === null) l = pageLum;                  // transparent block: the page shows through
        if (l !== null) blocks.push({ el: b, dark: l < 0.45 });
      });
    });
  }

  var raf = null;
  function update() {
    raf = null;
    var line = nav.getBoundingClientRect().bottom - 2;  // just inside the header's lower edge
    for (var i = 0; i < blocks.length; i++) {
      var r = blocks[i].el.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) {
        nav.classList.toggle('nav--on-dark', blocks[i].dark);
        return;
      }
    }
    nav.classList.remove('nav--on-dark');
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(update); }

  collect();
  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { collect(); schedule(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { collect(); update(); });
})();

// Dark hero: the collage swaps to the baked-on-white card renders (see hero-dark.css).
// Runs before the entrance animation, which waits for the images to decode anyway.
(function () {
  if (!document.body.classList.contains('hero-dark')) return;
  Array.prototype.forEach.call(document.querySelectorAll('.hero__scene .hs'), function (img) {
    img.src = img.getAttribute('src').replace('assets/hero/', 'assets/hero/dark/');
  });
})();

// Hero: pointer parallax. The cursor moves every card by its own --pd (small cards on top
// react most), drifts the glow, and tilts the whole plane a degree or two — all through
// --px/--py on .hero__scene, which styles.css folds into translate/rotate. Fine pointers only.
(function () {
  var scene = document.querySelector('.hero__scene');
  if (!scene) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var hero = scene.closest('.hero');
  var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

  function frame() {
    cx += (tx - cx) * 0.08;  // ease towards the cursor instead of snapping to it
    cy += (ty - cy) * 0.08;
    scene.style.setProperty('--px', cx.toFixed(4));
    scene.style.setProperty('--py', cy.toFixed(4));
    raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(frame) : null;
  }
  function run() { if (!raf) raf = requestAnimationFrame(frame); }
  function clamp(v) { return Math.max(-1, Math.min(1, v)); }

  window.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;  // hero off screen: nothing to move
    tx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
    ty = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
    run();
  }, { passive: true });
  document.addEventListener('pointerleave', function () { tx = 0; ty = 0; run(); });
})();

// Reveal on scroll: section headers and cards fade up as they come into view.
// Siblings that match the same selector are staggered; blocks with their own choreography
// (company cards, the roadmaps) are left to it.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SEL = '.section > .h2group, .why__accent, .why__card, .fcard, .ocard, .months__maps, .mcard, ' +
            '.faq__list, .nmbr, .backed__cols, .banner__content, .pcard, .pay__op, .ycard, .built__wrap, .contact__wrap';
  var els = Array.prototype.slice.call(document.querySelectorAll(SEL));
  if (!els.length) return;
  els.forEach(function (el) {
    var i = 0, s = el.previousElementSibling;
    while (s) { if (s.classList.contains('fx')) i++; s = s.previousElementSibling; }
    el.style.setProperty('--fx-d', Math.min(i, 5) * 0.09 + 's');
    el.classList.add('fx');
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('fx--in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();

// Header: transparent at the top of the page, glass once the page has scrolled.
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  var on = null;
  function update() {
    var next = window.scrollY > 8;
    if (next !== on) { on = next; nav.classList.toggle('nav--scrolled', next); }
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();