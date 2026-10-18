(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveals
  var els = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  // Sticky header: tighten once the page scrolls
  var header = document.querySelector('.site-header[data-sticky]');

  // Hero layers drift apart at different rates as the page scrolls
  var bands = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('.hero-bands .band'));
  var ticking = false;
  function update() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    bands.forEach(function (b) {
      var k = parseFloat(b.getAttribute('data-drift')) || 0;
      b.style.translate = (y * k).toFixed(1) + 'px 0';
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  update();

  // Word band pause button
  var marquee = document.querySelector('.marquee');
  var toggle = marquee && marquee.querySelector('.marquee-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var paused = marquee.classList.toggle('is-paused');
      toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
      toggle.textContent = paused ? 'Play' : 'Pause';
    });
  }

  // Why video: plays while on screen, with a pause button; stays still for reduced motion
  var vid = document.querySelector('.why-video');
  var vt = document.querySelector('.video-toggle');
  if (vid && vt) {
    var held = false;
    var setPaused = function (p) {
      if (p) { vid.pause(); vt.textContent = 'Play'; vt.setAttribute('aria-pressed', 'true'); }
      else { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); vt.textContent = 'Pause'; vt.setAttribute('aria-pressed', 'false'); }
    };
    vt.addEventListener('click', function () { held = !vid.paused; setPaused(held); });
    if (reduce || !('IntersectionObserver' in window)) { held = true; setPaused(true); }
    else {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (held) return; if (e.isIntersecting) setPaused(false); else vid.pause(); });
      }, { threshold: 0.25 }).observe(vid);
    }
  }

  // "Keep me updated" form. Set data-endpoint on the form (e.g. a Formspree URL) to start collecting sign-ups.
  var form = document.querySelector('form.updates');
  if (form) {
    var status = form.querySelector('.updates-status');

    // Phone: format as (xxx) xxx-xxxx while typing
    var phone = form.elements.phone;
    if (phone) {
      phone.addEventListener('input', function () {
        var d = phone.value.replace(/\D/g, '');
        if (d.length > 10 && d.charAt(0) === '1') d = d.slice(1);
        d = d.slice(0, 10);
        phone.value = !d ? '' : d.length < 4 ? '(' + d
          : d.length < 7 ? '(' + d.slice(0, 3) + ') ' + d.slice(3)
          : '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
      });
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      ['name', 'email'].forEach(function (n) {
        var el = form.elements[n];
        var bad = !el.value.trim() || (n === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim()));
        el.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) { status.textContent = 'Please add your name and a valid email.'; return; }
      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) { status.textContent = 'Sign-ups open soon. This form is not connected yet.'; return; }
      status.textContent = 'Sending\u2026';
      fetch(endpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          status.textContent = 'Thanks for joining our mailing list!';
        })
        .catch(function () { status.textContent = 'Something went wrong. Please try again, or email info@layered.health.'; });
    });
  }

  // Full-bleed hero video: pause button; stays still for people who ask for less motion
  var hv = document.querySelector('.hero-bg');
  var ht = document.querySelector('.hero-toggle');
  if (hv && ht) {
    var setHero = function (paused) {
      if (paused) { hv.pause(); ht.textContent = 'Play'; ht.setAttribute('aria-pressed', 'true'); ht.setAttribute('aria-label', 'Play background video'); }
      else { var pr = hv.play(); if (pr && pr.catch) pr.catch(function () {}); ht.textContent = 'Pause'; ht.setAttribute('aria-pressed', 'false'); ht.setAttribute('aria-label', 'Pause background video'); }
    };
    ht.addEventListener('click', function () { setHero(!hv.paused); });
    // Loop by restarting on 'ended' instead of the native loop attribute: Safari's native
    // loop gets stuck seeking back to 0 and freezes the frame, while this restart doesn't.
    hv.loop = false;
    hv.addEventListener('ended', function () { if (ht.getAttribute('aria-pressed') !== 'true') { hv.currentTime = 0; var pr = hv.play(); if (pr && pr.catch) pr.catch(function () {}); } });
    // if the browser pauses it on its own (some do at the loop point or after a tab switch), start it again
    var resume = function () { if (!reduce && ht.getAttribute('aria-pressed') !== 'true' && hv.paused && !document.hidden) { var pr = hv.play(); if (pr && pr.catch) pr.catch(function () {}); } };
    hv.addEventListener('pause', function () { setTimeout(resume, 250); });
    document.addEventListener('visibilitychange', resume);
    if (reduce) { hv.removeAttribute('autoplay'); setHero(true); }
  }

  // Blog post: background fades between the brand tints, one per section, as you scroll
  var post = document.querySelector('.page-post .post');
  if (post) {
    var root = getComputedStyle(document.documentElement);
    var hex = function (n) { var h = root.getPropertyValue(n).trim().replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); };
    var palette = ['--surface', '--tint-rose', '--tint-slate', '--tint-sage'].map(hex);
    var heads = Array.prototype.slice.call(post.querySelectorAll('.post-body h2'));
    var tintTicking = false;
    var tint = function () {
      var line = window.scrollY + window.innerHeight * 0.3;
      var stops = [0].concat(heads.map(function (h) { return h.getBoundingClientRect().top + window.scrollY; }));
      var i = 0;
      while (i < stops.length - 1 && line >= stops[i + 1]) i++;
      var b = palette[i % palette.length], a = i ? palette[(i - 1) % palette.length] : b;
      var next = i < stops.length - 1 ? stops[i + 1] : stops[i] + 600;
      var t = Math.max(0, Math.min(1, (line - stops[i]) / Math.min(300, (next - stops[i]) * 0.5)));
      t = t * t * (3 - 2 * t);
      post.style.backgroundColor = 'rgb(' + a.map(function (v, k) { return Math.round(v + (b[k] - v) * t); }).join(',') + ')';
      tintTicking = false;
    };
    window.addEventListener('scroll', function () { if (!tintTicking) { tintTicking = true; window.requestAnimationFrame(tint); } }, { passive: true });
    window.addEventListener('resize', tint);
    tint();
  }

  // Why, About and Launch marks: the bands slide apart and back as each section passes through the screen
  var drifters = reduce ? [] : [
    { box: document.querySelector('.why-art'), bands: '.why-bands g.l1, .why-bands g.l2, .why-bands g.l3, .why-bands g.l4', amp: [-70, 46, -34, 62], unit: 'px' },
    { box: document.querySelector('.page-about .intro .bg-layers'), bands: '.page-about .intro .bg-layers g.l1, .page-about .intro .bg-layers g.l2, .page-about .intro .bg-layers g.l3, .page-about .intro .bg-layers g.l4', amp: [-70, 46, -34, 62], unit: 'px', fromTop: true },
    { box: document.querySelector('svg.launch-art'), bands: 'svg.launch-art g.l1, svg.launch-art g.l2, svg.launch-art g.l3, svg.launch-art g.l4', amp: [-11, 7.5, -5.5, 9.5], unit: 'px', whole: true }
  ].filter(function (d) { return d.box; }).map(function (d) {
    d.els = Array.prototype.slice.call(document.querySelectorAll(d.bands));
    return d;
  });
  if (drifters.length) {
    var driftTicking = false;
    var drift = function () {
      var vh = window.innerHeight;
      drifters.forEach(function (d) {
        var r = d.box.getBoundingClientRect();
        // -1 as the mark enters from below, 0 when centered, 1 as it leaves at the top
        var p = d.fromTop
          // starts stacked at the top of the page and drifts apart until the mark scrolls off
          ? Math.min(1, window.scrollY / Math.max(1, r.bottom + window.scrollY))
          : Math.max(-1, Math.min(1, ((vh / 2) - (r.top + r.height / 2)) / (vh / 2 + r.height / 2)));
        d.els.forEach(function (el, i) { el.style.transform = 'translate(' + (d.amp[i] * p).toFixed(2) + d.unit + ', 0)'; });
        if (d.whole) { d.box.style.translate = '0 ' + (p * -36).toFixed(1) + 'px'; d.box.style.rotate = (p * 8).toFixed(2) + 'deg'; }
      });
      driftTicking = false;
    };
    window.addEventListener('scroll', function () { if (!driftTicking) { driftTicking = true; window.requestAnimationFrame(drift); } }, { passive: true });
    window.addEventListener('resize', drift);
    drift();
  }
})();

// "We are" flipboard: plays through once and stops on "layered"
(function () {
  var root = document.querySelector('.we-are');
  if (!root) return;

  var WORDS = ['becoming', 'learning', 'healing', 'growing', 'curious', 'exploring', 'evolving', 'seen', 'heard', 'layered'];
  var ACCENTS = ['#d4a5a0', '#8a97a8', '#2b2a28']; // rose, slate, ink: the sheet under each tile (sage is the background)
  var BLANK_EDGE = '#ddd5c8';
  var SIZE = 9;       // longest word
  var HOLD = 2200;    // ms each word stays up
  var STAGGER = 55, STEP = 70;
  var ALPHA = 'abcdefghijklmnopqrstuvwxyz';

  var board = root.querySelector('.we-are-board');
  var btn = root.querySelector('.we-are-toggle');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var tiles = [];
  for (var i = 0; i < SIZE; i++) {
    var tile = document.createElement('span');
    tile.className = 'we-are-tile is-blank';
    var glyph = document.createElement('span');
    glyph.className = 'we-are-glyph';
    tile.appendChild(glyph);
    board.appendChild(tile);
    tiles.push({ el: tile, glyph: glyph, ch: '', n: 0 });
  }

  var wi = -1, timers = [], paused = false, visible = false, running = false, done = false;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearAll() { timers.forEach(clearTimeout); timers = []; running = false; }

  function setTile(i, ch, accent) {
    var t = tiles[i];
    if (t.ch === ch) return;
    t.ch = ch; t.n++;
    t.glyph.textContent = ch;
    t.glyph.className = 'we-are-glyph ' + (t.n % 2 ? 'flip-a' : 'flip-b'); // alternating names restarts the animation
    var blank = ch === '';
    t.el.classList.toggle('is-blank', blank);
    t.el.style.boxShadow = '0 6px 0 -1px ' + (blank ? BLANK_EDGE : accent);
  }

  function finish() {
    done = true; running = false;
    btn.textContent = 'Replay';
    btn.setAttribute('aria-pressed', 'false');
  }

  function advance() {
    if (paused || done || !visible) { running = false; return; }
    if (wi === WORDS.length - 1) { finish(); return; } // already on "layered"
    running = true;
    wi++;
    var isLast = wi === WORDS.length - 1;
    var word = WORDS[wi], accent = ACCENTS[wi % ACCENTS.length], last = 0;
    tiles.forEach(function (t, i) {
      var target = word[i] || '';
      if (target === t.ch) { if (target) t.el.style.boxShadow = '0 6px 0 -1px ' + accent; return; }
      var spins = reduce ? 0 : 2 + (i % 3), start = i * STAGGER;
      for (var s = 0; s < spins; s++) {
        (function (r, at) { later(function () { setTile(i, r, accent); }, at); })
          (ALPHA[Math.floor(Math.random() * ALPHA.length)], start + s * STEP);
      }
      var end = start + spins * STEP;
      later(function () { setTile(i, target, accent); }, end);
      if (end > last) last = end;
    });
    if (isLast) { later(finish, last + 150); return; }
    later(advance, last + 150 + HOLD);
  }

  function settle() {
    var k = Math.max(wi, 0), word = WORDS[k], accent = ACCENTS[k % ACCENTS.length];
    tiles.forEach(function (t, i) { setTile(i, word[i] || '', accent); });
  }

  function start() {
    if (running || paused || done || !visible) return;
    running = true;
    later(advance, 300);
  }

  btn.addEventListener('click', function () {
    if (done) { // Replay from the first word
      clearAll(); done = false; paused = false; wi = -1;
      btn.textContent = 'Pause';
      start();
      return;
    }
    paused = !paused;
    btn.textContent = paused ? 'Play' : 'Pause';
    btn.setAttribute('aria-pressed', String(paused));
    if (paused) { clearAll(); settle(); } else { start(); }
  });

  // Only runs while the section is on screen and the tab is visible
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else if (wi >= 0) { clearAll(); settle(); }
    }, { threshold: 0.25 }).observe(root);
  } else { visible = true; start(); }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (wi >= 0) { clearAll(); settle(); } } else if (visible) start();
  });
})();
