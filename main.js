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
          status.textContent = 'Thank you. You\u2019ll hear from Layered Health when it opens.';
        })
        .catch(function () { status.textContent = 'Something went wrong. Please try again, or email info@layered.health.'; });
    });
  }
})();
