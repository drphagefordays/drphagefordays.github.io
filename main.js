/* David R. Parker — site behaviour. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme toggle (with circular View Transition) ---------- */
  var themeBtn = doc.getElementById('theme-toggle');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#060c0d' : '#0f5c5a');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function (ev) {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      var r = themeBtn.getBoundingClientRect();
      root.style.setProperty('--vx', (r.left + r.width / 2) + 'px');
      root.style.setProperty('--vy', (r.top + r.height / 2) + 'px');
      if (doc.startViewTransition && !reduce) doc.startViewTransition(function () { applyTheme(next); });
      else applyTheme(next);
    });
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = doc.getElementById('menu-toggle'), nav = doc.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---------- header state ---------- */
  var header = doc.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- scroll reveal ---------- */
  var reveals = [].slice.call(doc.querySelectorAll('.reveal'));
  reveals.forEach(function (el, i) { el.style.setProperty('--d', ((i % 4) * 70) + 'ms'); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- active nav link ---------- */
  var links = [].slice.call(doc.querySelectorAll('.nav a'));
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (a) { a.classList.remove('active'); });
          map[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = doc.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- card spotlight ---------- */
  doc.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- magnetic buttons ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    doc.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.12, y = (e.clientY - r.top - r.height / 2) * 0.2;
        b.style.transform = 'translate(' + x + 'px,' + (y - 2) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- publication filter ---------- */
  var filters = [].slice.call(doc.querySelectorAll('.filter'));
  var pubs = [].slice.call(doc.querySelectorAll('.pub'));
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      pubs.forEach(function (p) { p.hidden = !(f === 'all' || p.getAttribute('data-type') === f); });
    });
  });

  /* ---------- infection sequence stepper ---------- */
  var scene = doc.querySelector('.scene');
  if (scene) {
    var btns = [].slice.call(doc.querySelectorAll('.step-btn'));
    var capT = doc.getElementById('step-title'), capP = doc.getElementById('step-text');
    var playBtn = doc.getElementById('step-play');
    var capTools = doc.getElementById('step-tools');
    var copy = [
      ['Adsorption', 'The phage binds receptors on the bacterial surface. Mycobacteria add a thick, waxy envelope that the phage must then get through.',
        ['Host-range screening', 'Plaque assays', 'Smooth / rough morphotypes']],
      ['Injection', 'The tail punctures the envelope and the phage genome is released into the cell.',
        ['Genome sequencing and assembly', 'Golden Gate', 'Gibson / HiFi', 'BRED']],
      ['Takeover', 'The cell’s transcription and translation machinery now reads phage genes, redirecting its resources to making new phages.',
        ['RNA-seq', 'Cappable-seq', 'TnSeq', 'AP-MS']],
      ['Assembly', 'New capsids, tails and genomes are made and put together into complete phages.',
        ['SEC-DIA-MS', 'AlphaFold3', 'Functional characterization']],
      ['Lysis', 'Phage enzymes break open the cell and the new phages are released to infect their neighbours.',
        ['Kill curves', 'MIC', 'High-titre phage stocks']]
    ];
    var cur = 1, timer = null, inView = false, userPaused = false;
    var setStep = function (n) {
      cur = n;
      for (var i = 1; i <= 5; i++) scene.classList.toggle('s' + i, i <= n);
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-step') === n)); });
      capT.textContent = copy[n - 1][0]; capP.textContent = copy[n - 1][1];
      if (capTools) {
        capTools.textContent = '';
        copy[n - 1][2].forEach(function (t) { var s = doc.createElement('span'); s.className = 'chip'; s.textContent = t; capTools.appendChild(s); });
      }
    };
    var sync = function () {
      var should = inView && !userPaused && !reduce;
      if (should && !timer) timer = setInterval(function () { setStep(cur % 5 + 1); }, 4300);
      else if (!should && timer) { clearInterval(timer); timer = null; }
      var live = doc.querySelector('.step-caption');
      if (live) live.setAttribute('aria-live', timer ? 'off' : 'polite'); // avoid screen-reader chatter while auto-playing
      playBtn.classList.toggle('paused', !timer);
      playBtn.setAttribute('aria-label', timer ? 'Pause animation' : 'Play animation');
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () { userPaused = true; setStep(+b.getAttribute('data-step')); sync(); });
    });
    playBtn.addEventListener('click', function () { userPaused = !!timer; sync(); });
    setStep(1);
    if ('IntersectionObserver' in window) {
      scene.classList.add('pre');
      new IntersectionObserver(function (en) {
        inView = en[0].isIntersecting;
        if (inView) setTimeout(function () { scene.classList.remove('pre'); }, 150);
        sync();
      }, { threshold: 0.35 }).observe(scene);
    }
    sync();
  }

  /* ---------- molecular network canvas (hero) ---------- */
  var canvas = doc.getElementById('net');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], pointer = { x: -999, y: -999 }, running = true, raf;
    function size() {
      var r = canvas.getBoundingClientRect(); w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, Math.max(24, (w * h) / 16000)));
      nodes = [];
      for (var i = 0; i < n; i++) nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.6 + .9, ph: Math.random() < .22, a: Math.random() * 6.2832, va: (Math.random() - .5) * .006 });
    }
    function drawPhage(a, c) { // tiny phage glyph: hexagonal head, tail, two fibres
      a.a += a.va;
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.a);
      ctx.strokeStyle = 'rgba(' + c + ',.75)'; ctx.lineWidth = 1; ctx.beginPath();
      for (var k = 0; k < 6; k++) { var t = k * 1.0472 + 0.5236; ctx.lineTo(Math.cos(t) * 4.2, -7 + Math.sin(t) * 4.2); }
      ctx.closePath();
      ctx.moveTo(0, -2.6); ctx.lineTo(0, 5);
      ctx.moveTo(0, 5); ctx.lineTo(-3.5, 8.5); ctx.moveTo(0, 5); ctx.lineTo(3.5, 8.5);
      ctx.stroke(); ctx.restore();
    }
    function color() { return getComputedStyle(root).getPropertyValue('--glow').trim() || '15,118,110'; }
    function frame() {
      if (!running) return;
      var c = color(); ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1; if (a.y < 0 || a.y > h) a.vy *= -1;
        var dx = a.x - pointer.x, dy = a.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { a.x += dx * 0.004; a.y += dy * 0.004; }
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], ex = a.x - b.x, ey = a.y - b.y, dd = ex * ex + ey * ey;
          if (dd < 15000) { ctx.strokeStyle = 'rgba(' + c + ',' + (0.22 * (1 - dd / 15000)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        if (a.ph) { drawPhage(a, c); } else { ctx.fillStyle = 'rgba(' + c + ',.55)'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill(); }
      }
      raf = requestAnimationFrame(frame);
    }
    size(); frame();
    window.addEventListener('resize', size);
    canvas.parentElement.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; });
    canvas.parentElement.addEventListener('pointerleave', function () { pointer.x = pointer.y = -999; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; frame(); } else if (!vis) { running = false; cancelAnimationFrame(raf); }
      }).observe(canvas);
    }
  }
})();
