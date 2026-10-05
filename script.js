(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  // The site opens in light (white) mode; dark is only used when chosen.
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    window.dispatchEvent(new Event('themechange'));
  });

  /* ---------- Mobile menu ---------- */
  var menu = document.getElementById('menu');
  var menuBtn = document.getElementById('menu-toggle');
  menuBtn.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- Header state + scroll progress ---------- */
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.progress');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  var links = Array.prototype.slice.call(menu.querySelectorAll('a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) navObserver.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Stagger siblings that enter together.
        var siblings = Array.prototype.indexOf.call(entry.target.parentNode.children, entry.target);
        entry.target.style.transitionDelay = Math.min(siblings, 4) * 80 + 'ms';
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll('.count');
  counters.forEach(function (el) {
    var target = el.dataset.fromYear
      ? new Date().getFullYear() - parseInt(el.dataset.fromYear, 10)
      : parseInt(el.dataset.to, 10);
    el.textContent = target;
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    el.textContent = '0';
    var obs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      var start = performance.now(), dur = 1200;
      (function tick(now) {
        var t = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    });
    obs.observe(el);
  });

  /* ---------- Rotating research words ---------- */
  var rotator = document.querySelector('.rotator');
  if (rotator && !reduceMotion) {
    var words = rotator.dataset.words.split('|');
    var wi = 0, ci = words[0].length, deleting = true;
    setTimeout(function step() {
      if (deleting) {
        ci--;
        if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
      } else {
        ci++;
      }
      rotator.textContent = words[wi].slice(0, ci) || ' ';
      var delay = deleting ? 40 : 75;
      if (!deleting && ci === words[wi].length) { deleting = true; delay = 2200; }
      setTimeout(step, delay);
    }, 2200);
  }

  /* ---------- Cite / copy BibTeX ---------- */
  var toast = document.querySelector('.toast');
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }
  document.querySelectorAll('.cite-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wrap = btn.closest('.pub-body').querySelector('.bib-wrap');
      var open = wrap.hidden;
      wrap.hidden = !open;
      btn.setAttribute('aria-expanded', open);
    });
  });
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.parentNode.querySelector('.bib').textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () { showToast('BibTeX copied to clipboard'); },
          function () { showToast('Select the text to copy it'); });
      } else {
        showToast('Select the text to copy it');
      }
    });
  });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Hero network animation ---------- */
  var canvas = document.getElementById('network');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var hero = canvas.parentNode;
  var nodes = [], w = 0, h = 0, dpr = 1, running = false, mouse = { x: -9999, y: -9999 };
  var LINK = 140;
  var rgb = '29, 78, 137';
  function readColor() {
    rgb = getComputedStyle(root).getPropertyValue('--net-rgb').trim() || rgb;
    if (!running) draw();
  }
  window.addEventListener('themechange', readColor);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.min(Math.round((w * h) / 14000), 90);
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 1
      });
    }
    if (!running) draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK) {
          ctx.strokeStyle = 'rgba(' + rgb + ',' + (1 - d / LINK) * 0.22 + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      var mx = a.x - mouse.x, my = a.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
      if (md < LINK * 1.4) {
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (1 - md / (LINK * 1.4)) * 0.45 + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(' + rgb + ', 0.45)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function step() {
    if (!running) return;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    draw();
    requestAnimationFrame(step);
  }

  function setRunning(on) {
    if (reduceMotion) return;
    if (on && !running) { running = true; requestAnimationFrame(step); }
    else if (!on) running = false;
  }

  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });

  window.addEventListener('resize', resize);
  readColor();
  resize();

  // Only animate while the hero is on screen and the tab is visible.
  var heroVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      setRunning(heroVisible && !document.hidden);
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () { setRunning(heroVisible && !document.hidden); });
  setRunning(true);
})();
