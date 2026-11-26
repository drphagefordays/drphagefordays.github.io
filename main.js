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

  /* ---------- step-through animations (infection sequence, SEC-MS workflow) ---------- */
  function initStepper(card, copy, interval) {
    if (!card) return;
    var scene = card.querySelector('svg'), N = copy.length;
    var btns = [].slice.call(card.querySelectorAll('.step-btn'));
    var capEl = card.querySelector('.step-caption');
    var capT = capEl.querySelector('h4'), capP = capEl.querySelector('p');
    var playBtn = card.querySelector('.play-btn'), capTools = card.querySelector('.step-tools');
    var cur = 1, timer = null, inView = false, userPaused = false;
    function setStep(n) {
      cur = n;
      scene.setAttribute('data-step', String(n));
      for (var i = 1; i <= N; i++) scene.classList.toggle('s' + i, i <= n);
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-step') === n)); });
      capT.textContent = copy[n - 1][0]; capP.textContent = copy[n - 1][1];
      if (capTools && copy[n - 1][2]) {
        capTools.textContent = '';
        copy[n - 1][2].forEach(function (t) { var s = doc.createElement('span'); s.className = 'chip'; s.textContent = t; capTools.appendChild(s); });
      }
    }
    function sync() {
      var should = inView && !userPaused && !reduce;
      if (should && !timer) timer = setInterval(function () { setStep(cur % N + 1); }, interval);
      else if (!should && timer) { clearInterval(timer); timer = null; }
      capEl.setAttribute('aria-live', timer ? 'off' : 'polite'); // avoid screen-reader chatter while auto-playing
      playBtn.classList.toggle('paused', !timer);
      playBtn.setAttribute('aria-label', timer ? 'Pause animation' : 'Play animation');
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { userPaused = true; setStep(+b.getAttribute('data-step')); sync(); });
    });
    playBtn.addEventListener('click', function () { userPaused = !!timer; sync(); });
    setStep(1);
    if ('IntersectionObserver' in window) {
      var intro = scene.classList.contains('scene'); // the infection scene has a landing intro
      if (intro) scene.classList.add('pre');
      new IntersectionObserver(function (en) {
        inView = en[0].isIntersecting;
        if (inView && intro) setTimeout(function () { scene.classList.remove('pre'); }, 150);
        sync();
      }, { threshold: 0.35 }).observe(scene);
    }
    sync();
  }

  initStepper(doc.querySelector('.infection-card:not(.sec-card)'), [
    ['Adsorption', 'The phage binds receptors on the bacterial surface. Mycobacteria add a thick, waxy envelope that the phage must then get through.',
      ['Host-range screening', 'Plaque assays', 'Smooth / rough morphotypes']],
    ['Injection', 'The tail punctures the envelope and the phage genome is released into the cell.',
      ['Genome sequencing and assembly', 'Golden Gate', 'Gibson / HiFi', 'BRED']],
    ['Takeover', 'The cell’s transcription and translation machinery now reads phage genes, redirecting its resources to making new phages.',
      ['RNA-seq', 'Cappable-seq', 'TnSeq', 'AP-MS']],
    ['Assembly', 'New capsids, tails and genomes are made and put together into complete phages.',
      ['SEC-DIA-MS', 'Functional characterization', 'AlphaFold3']],
    ['Lysis', 'Phage enzymes break open the cell and the new phages are released to infect their neighbours.',
      ['Kill curves', 'MIC', 'High-titre phage stocks']]
  ], 4300);

  initStepper(doc.querySelector('.sec-card'), [
    ['Infect', 'A bacterial culture is infected with phage, and the cells are harvested at a chosen time after infection.'],
    ['Lyse', 'The cells are lysed under native conditions so that protein complexes stay intact, leaving a mixture of host and phage proteins of every size.'],
    ['Fractionate by size', 'Size-exclusion chromatography on an HPLC system separates the lysate by size. Large complexes elute first and small proteins last, and the eluate is collected as fractions.'],
    ['Separate peptides', 'Each fraction is digested into peptides, which are separated on a reverse-phase LC column by a rising solvent gradient.'],
    ['Measure by MS/MS', 'Peptides are ionised into the mass spectrometer. In data-independent acquisition (DIA), everything in each m/z window is fragmented in turn, so every peptide in every fraction is measured. Proteins that peak in the same fractions are candidate members of the same complex.']
  ], 5600);

  /* ---------- hero scene: molecules, bacteria and phage infections ---------- */
  var canvas = doc.getElementById('net');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var TAU = Math.PI * 2;
    var w = 0, h = 0, lastW = 0, dots = [], phages = [], bacteria = [], pointer = { x: -999, y: -999 }, running = true, raf = 0, last = 0;
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var glow = function () { return getComputedStyle(root).getPropertyValue('--glow').trim() || '15,118,110'; };
    var violet = function () { return root.getAttribute('data-theme') === 'dark' ? '155,140,255' : '106,92,245'; };

    function newBacterium(fadeIn) {
      var L = rnd(58, 84), R = rnd(13, 17);
      return {
        x: rnd(L, Math.max(L + 1, w - L)), y: rnd(L / 2, Math.max(L / 2 + 1, h - L / 2)), a: rnd(0, TAU), va: rnd(-.0005, .0005),
        vx: rnd(-.14, .14), vy: rnd(-.1, .1), L: L, R: R, H: L / 2 - R, state: 'ok', t: 0, alpha: fadeIn ? 0 : 1,
        host: [], prog: [], seed: rnd(0, 10), gone: 0
      };
    }
    function newPhage(x, y, th) {
      var s = rnd(.4, .75); if (th == null) th = rnd(0, TAU);
      return { x: x, y: y, vx: Math.cos(th) * s, vy: Math.sin(th) * s, a: th - Math.PI / 2, cool: 0 };
    }
    function seed() {
      dots = []; phages = []; bacteria = [];
      var i, nd = Math.round(Math.min(46, Math.max(16, (w * h) / 20000)));
      for (i = 0; i < nd; i++) dots.push({ x: Math.random() * w, y: Math.random() * h, vx: rnd(-.12, .12), vy: rnd(-.12, .12), r: rnd(.9, 2.2) });
      var nb = Math.round(Math.min(5, Math.max(2, (w * h) / 150000)));
      for (i = 0; i < nb; i++) bacteria.push(newBacterium(false));
      var np = Math.round(Math.min(8, Math.max(3, (w * h) / 100000)));
      for (i = 0; i < np; i++) phages.push(newPhage(Math.random() * w, Math.random() * h));
    }
    function size() {
      var r = canvas.getBoundingClientRect(); w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!lastW || Math.abs(w - lastW) > 40) { seed(); lastW = w; } // ignore small height changes (mobile toolbars)
    }

    /* phage glyph: hexagonal head, tail, two fibres. Tail tip sits 8.5 units along local +y. */
    function glyph(x, y, ang, rgb, alpha, sc) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc);
      ctx.strokeStyle = 'rgba(' + rgb + ',' + alpha + ')'; ctx.lineWidth = 1 / sc; ctx.beginPath();
      for (var k = 0; k < 6; k++) { var t = k * 1.0472 + 0.5236; ctx.lineTo(Math.cos(t) * 4.2, -7 + Math.sin(t) * 4.2); }
      ctx.closePath();
      ctx.moveTo(0, -2.6); ctx.lineTo(0, 5);
      ctx.moveTo(0, 5); ctx.lineTo(-3.5, 8.5); ctx.moveTo(0, 5); ctx.lineTo(3.5, 8.5);
      ctx.stroke(); ctx.restore();
    }

    /* nearest point on a bacterium's capsule axis */
    function nearest(b, px, py) {
      var ca = Math.cos(b.a), sa = Math.sin(b.a), s = (px - b.x) * ca + (py - b.y) * sa;
      s = Math.max(-b.H, Math.min(b.H, s));
      var qx = b.x + ca * s, qy = b.y + sa * s;
      return { s: s, qx: qx, qy: qy, d: Math.hypot(px - qx, py - qy) };
    }
    function countInfected() {
      var n = 0; for (var i = 0; i < bacteria.length; i++) if (bacteria[i].state === 'inj' || bacteria[i].state === 'rep') n++;
      return n;
    }
    function attach(b, q, nx, ny) {
      b.host.push({ s: q.s, la: Math.atan2(ny, nx) - b.a });
      b.state = 'inj'; b.t = 0;
    }
    function spawnProgeny(b) {
      var ca = Math.cos(b.a), sa = Math.sin(b.a), k, p, np;
      for (k = 0; k < b.prog.length && phages.length < 16; k++) {
        p = b.prog[k];
        var wx = b.x + ca * p.u - sa * p.v, wy = b.y + sa * p.u + ca * p.v;
        np = newPhage(wx, wy, Math.atan2(wy - b.y, wx - b.x) + rnd(-.8, .8)); np.cool = 40; phages.push(np);
      }
      for (k = 0; k < b.host.length && phages.length < 16; k++) { np = newPhage(b.x, b.y, rnd(0, TAU)); np.cool = 40; phages.push(np); }
      b.host = [];
    }

    /* free phage: wanders, is drawn toward healthy bacteria, then either attaches or bounces off */
    function stepPhage(p) {
      var sp = Math.hypot(p.vx, p.vy) || .5, th = Math.atan2(p.vy, p.vx), i, b, q;
      th += rnd(-.03, .03);
      var best = null, bd = 170;
      for (i = 0; i < bacteria.length; i++) {
        b = bacteria[i]; if (b.state !== 'ok' || b.alpha < .9) continue;
        q = nearest(b, p.x, p.y); if (q.d < bd) { bd = q.d; best = q; }
      }
      if (best) { var want = Math.atan2(best.qy - p.y, best.qx - p.x); th += Math.atan2(Math.sin(want - th), Math.cos(want - th)) * .02; }
      p.vx = Math.cos(th) * sp; p.vy = Math.sin(th) * sp;
      var dx = p.x - pointer.x, dy = p.y - pointer.y;
      if (dx * dx + dy * dy < 9000) { p.vx += dx * .0006; p.vy += dy * .0006; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 8 || p.x > w - 8) { p.vx *= -1; p.x = Math.max(8, Math.min(w - 8, p.x)); }
      if (p.y < 8 || p.y > h - 8) { p.vy *= -1; p.y = Math.max(8, Math.min(h - 8, p.y)); }
      th = Math.atan2(p.vy, p.vx);
      var tx = p.x + Math.cos(th) * 8.5, ty = p.y + Math.sin(th) * 8.5; // tail tip leads
      if (p.cool > 0) p.cool--;
      for (i = 0; i < bacteria.length; i++) {
        b = bacteria[i]; if (b.state === 'gone' || b.state === 'lysis' || b.alpha < .5) continue;
        q = nearest(b, tx, ty);
        if (q.d < b.R + 1 && p.cool <= 0) {
          var nx = (tx - q.qx) / (q.d || 1), ny = (ty - q.qy) / (q.d || 1), dot = p.vx * nx + p.vy * ny;
          if (dot < 0) {
            if (b.state === 'ok' && countInfected() < 2 && Math.random() < .55) { attach(b, q, nx, ny); return true; }
            p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; // bounce off the cell wall
            p.x += nx * (b.R + 2 - q.d); p.y += ny * (b.R + 2 - q.d); p.cool = 25;
          }
          break;
        }
      }
      var target = Math.atan2(p.vy, p.vx) - Math.PI / 2;
      p.a += Math.atan2(Math.sin(target - p.a), Math.cos(target - p.a)) * .15;
      return false;
    }

    /* infection timeline: inject (1.0 s) -> replicate (3.6 s) -> lyse (0.9 s) -> gone, then a fresh cell fades in */
    function stepBacterium(b, dt, i) {
      if (b.state === 'gone') { b.gone -= dt; if (b.gone <= 0) bacteria[i] = newBacterium(true); return; }
      b.x += b.vx; b.y += b.vy; b.a += b.va;
      var m = b.L / 2 + 4;
      if (b.x < m || b.x > w - m) b.vx *= -1;
      if (b.y < m || b.y > h - m) b.vy *= -1;
      b.x = Math.max(m, Math.min(w - m, b.x)); b.y = Math.max(m, Math.min(h - m, b.y));
      if (b.alpha < 1 && b.state === 'ok') b.alpha = Math.min(1, b.alpha + dt / 900);
      if (b.state === 'ok') return;
      b.t += dt;
      if (b.state === 'inj' && b.t >= 1000) {
        b.state = 'rep'; b.prog = [];
        for (var k = 0, n = Math.round(rnd(4, 6)); k < n; k++) b.prog.push({ u: rnd(-b.H, b.H), v: rnd(-b.R * .55, b.R * .55) });
      } else if (b.state === 'rep' && b.t >= 4600) { b.state = 'lysis'; b.t = 0; spawnProgeny(b); }
      else if (b.state === 'lysis' && b.t >= 900) { b.state = 'gone'; b.gone = rnd(1800, 3800); }
    }

    function drawBacterium(b, c, v, tm) {
      var al = b.state === 'lysis' ? 1 - b.t / 900 : b.alpha;
      if (b.state === 'gone' || al <= .01) return;
      var infected = b.state === 'inj' || b.state === 'rep', col = infected ? v : c;
      var prog = b.state === 'rep' ? Math.min(1, (b.t - 1000) / 3600) : 0, H = b.H, R = b.R, k;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.globalAlpha = al;
      ctx.beginPath(); ctx.moveTo(-H, -R); ctx.lineTo(H, -R); ctx.arc(H, 0, R, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-H, R); ctx.arc(-H, 0, R, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
      ctx.fillStyle = 'rgba(' + col + ',' + (.07 + prog * .13).toFixed(3) + ')'; ctx.fill();
      ctx.strokeStyle = 'rgba(' + col + ',.6)'; ctx.lineWidth = 1.5;
      if (b.state === 'lysis') ctx.setLineDash([5, 6]);
      ctx.stroke(); ctx.setLineDash([]);
      // host DNA squiggle fades as the phage takes over the cell
      ctx.beginPath();
      for (k = 0; k <= 8; k++) { var x = -H + (2 * H * k) / 8, y = Math.sin(k * 1.5 + b.seed) * R * .38; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.strokeStyle = 'rgba(' + c + ',' + (.3 - prog * .22).toFixed(3) + ')'; ctx.lineWidth = 1.1; ctx.stroke();
      // attached phage and the DNA thread it injects
      for (k = 0; k < b.host.length; k++) {
        var hp = b.host[k], nx = Math.cos(hp.la), ny = Math.sin(hp.la), px = hp.s + nx * R, py = ny * R;
        glyph(px + nx * 8.5, py + ny * 8.5, Math.atan2(-ny, -nx) - Math.PI / 2, col, .9, 1);
        if (b.state === 'inj') {
          var len = Math.min(1, b.t / 1000) * R * 1.5;
          ctx.beginPath(); ctx.moveTo(px, py);
          for (var j = 1; j <= 10; j++) { var tt = (j / 10) * len, wob = Math.sin(j * 1.3) * 1.6; ctx.lineTo(px - nx * tt - ny * wob, py - ny * tt + nx * wob); }
          ctx.strokeStyle = 'rgba(' + v + ',.95)'; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }
      // new phages assembling inside
      if (b.state === 'rep') {
        var shown = Math.floor(prog * (b.prog.length + .99));
        for (k = 0; k < shown && k < b.prog.length; k++) glyph(b.prog[k].u + Math.sin(tm * .003 + k) * .8, b.prog[k].v + Math.cos(tm * .0027 + k) * .8, k * 1.3, v, .85, .5);
      }
      // lysis: expanding ring as the cell bursts
      if (b.state === 'lysis') {
        ctx.beginPath(); ctx.arc(0, 0, R + (b.t / 900) * R * 2.2, 0, TAU);
        ctx.strokeStyle = 'rgba(' + v + ',' + (.45 * (1 - b.t / 900)).toFixed(3) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
      }
      ctx.restore();
    }

    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min(48, now - last) : 16; last = now;
      var c = glow(), v = violet(), i, j;
      ctx.clearRect(0, 0, w, h);
      for (i = 0; i < dots.length; i++) { // molecules and their faint network
        var a = dots[i]; a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        var dx = a.x - pointer.x, dy = a.y - pointer.y;
        if (dx * dx + dy * dy < 14000) { a.x += dx * .004; a.y += dy * .004; }
        for (j = i + 1; j < dots.length; j++) {
          var d2 = dots[j], ex = a.x - d2.x, ey = a.y - d2.y, dd = ex * ex + ey * ey;
          if (dd < 15000) { ctx.strokeStyle = 'rgba(' + c + ',' + (.2 * (1 - dd / 15000)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(d2.x, d2.y); ctx.stroke(); }
        }
        ctx.fillStyle = 'rgba(' + c + ',.5)'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.fill();
      }
      for (i = 0; i < bacteria.length; i++) { stepBacterium(bacteria[i], dt, i); drawBacterium(bacteria[i], c, v, now); }
      for (i = phages.length - 1; i >= 0; i--) {
        if (stepPhage(phages[i])) phages.splice(i, 1);
        else glyph(phages[i].x, phages[i].y, phages[i].a, c, .8, 1);
      }
      if (phages.length < 3) phages.push(newPhage(Math.random() < .5 ? 10 : w - 10, rnd(20, h - 20)));
      raf = requestAnimationFrame(frame);
    }

    size(); raf = requestAnimationFrame(frame);
    window.addEventListener('resize', size);
    canvas.parentElement.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; });
    canvas.parentElement.addEventListener('pointerleave', function () { pointer.x = pointer.y = -999; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
        else if (!vis) { running = false; cancelAnimationFrame(raf); }
      }).observe(canvas);
    }
  }
})();
