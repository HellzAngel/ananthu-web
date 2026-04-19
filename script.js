/* ══════════════════════════════════════════════
   ANANTHU A NAIR — PORTFOLIO SCRIPT
   Three.js 3D Scene · Typed Text · Scroll Reveal
   ══════════════════════════════════════════════ */

'use strict';

// ── AUTO-UPDATING EXPERIENCE YEARS ───────────────────────────────────────────

(function updateExperience() {
  // Career started at Atemon — May 2020
  const START_DATE = new Date(2020, 4, 1); // month is 0-indexed; 4 = May
  const now        = new Date();

  const diffMs    = now - START_DATE;
  const years     = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  const fullYears = Math.floor(years);
  const label     = fullYears + '+';

  // Stat card
  const statEl = document.getElementById('stat-exp-years');
  if (statEl) statEl.textContent = label;

  // Hero bio inline span
  const heroEl = document.getElementById('hero-exp-years');
  if (heroEl) heroEl.textContent = label;
}());

// ── THREE.JS SCENE ───────────────────────────────────────────────────────────

(function initThree() {
  if (typeof THREE === 'undefined') return;

  const canvas   = document.getElementById('bg-canvas');
  const scene    = new THREE.Scene();
  const clock    = new THREE.Clock();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 60);

  // ── Mouse state
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  let scrollY = 0, targetScrollY = 0;

  // ── 1. STAR FIELD ──────────────────────────────────────────────────────────
  (function createStars() {
    const N   = 3500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      pos[i3]     = (Math.random() - 0.5) * 350;
      pos[i3 + 1] = (Math.random() - 0.5) * 350;
      pos[i3 + 2] = (Math.random() - 0.5) * 350;

      const r = Math.random();
      if (r < 0.55) {                         // white-blue
        col[i3] = 0.75 + Math.random() * 0.25;
        col[i3 + 1] = 0.85 + Math.random() * 0.15;
        col[i3 + 2] = 1;
      } else if (r < 0.82) {                  // cyan
        col[i3] = 0;
        col[i3 + 1] = 0.75 + Math.random() * 0.25;
        col[i3 + 2] = 1;
      } else {                                // purple-ish
        col[i3] = 0.5 + Math.random() * 0.4;
        col[i3 + 1] = 0.1 + Math.random() * 0.2;
        col[i3 + 2] = 1;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    // Store base colours and a random twinkle phase + speed per star
    const baseCol    = col.slice();          // snapshot
    const twinklePhase = new Float32Array(N);
    const twinkleSpeed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      twinklePhase[i] = Math.random() * Math.PI * 2;
      twinkleSpeed[i] = 0.6 + Math.random() * 2.4;  // rad/s — mix slow + fast
    }

    const stars = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.35, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true
    }));
    stars.userData.type      = 'stars';
    stars.userData.baseCol   = baseCol;
    stars.userData.twinklePhase = twinklePhase;
    stars.userData.twinkleSpeed = twinkleSpeed;
    stars.userData.N         = N;
    scene.add(stars);
  }());

  // ── 2. HERO NODE-NETWORK (sphere topology) ─────────────────────────────────
  (function createNetwork() {
    const COUNT    = 140;
    const RADIUS   = 18;
    const MAX_DIST = 11;
    const verts    = [];

    for (let i = 0; i < COUNT; i++) {
      // Fibonacci sphere distribution
      const theta = Math.acos(1 - 2 * (i + 0.5) / COUNT);
      const phi   = Math.PI * (1 + Math.sqrt(5)) * i;
      const noise = 1 + (Math.random() - 0.5) * 0.4;
      verts.push(new THREE.Vector3(
        RADIUS * noise * Math.sin(theta) * Math.cos(phi),
        RADIUS * noise * Math.sin(theta) * Math.sin(phi),
        RADIUS * noise * Math.cos(theta)
      ));
    }

    // Node points
    const nodePosArr = new Float32Array(COUNT * 3);
    verts.forEach((v, i) => { nodePosArr[i * 3] = v.x; nodePosArr[i * 3 + 1] = v.y; nodePosArr[i * 3 + 2] = v.z; });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePosArr, 3));
    const nodes = new THREE.Points(nodeGeo, new THREE.PointsMaterial({
      color: 0x00d4ff, size: 0.7, transparent: true, opacity: 1.0
    }));

    // Connection lines (pre-computed)
    const linePts = [];
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        if (verts[i].distanceTo(verts[j]) < MAX_DIST) {
          linePts.push(verts[i].x, verts[i].y, verts[i].z,
                       verts[j].x, verts[j].y, verts[j].z);
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePts), 3));
    const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
      color: 0x00d4ff, transparent: true, opacity: 0.13
    }));

    // Outer wireframe icosahedron overlay
    const icoGeo  = new THREE.IcosahedronGeometry(RADIUS * 1.08, 2);
    const icoMesh = new THREE.Mesh(icoGeo, new THREE.MeshBasicMaterial({
      color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.1
    }));

    // Inner glow sphere
    const glowGeo  = new THREE.SphereGeometry(RADIUS * 0.85, 24, 24);
    const glowMesh = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
      color: 0x002244, transparent: true, opacity: 0.18
    }));

    const network = new THREE.Group();
    network.add(nodes, lines, icoMesh, glowMesh);
    network.position.set(30, 2, -8);
    network.userData.type = 'network';
    scene.add(network);

    // Small orbiting nodes
    const orbitData = [];
    for (let i = 0; i < 6; i++) {
      const sg   = new THREE.SphereGeometry(0.55, 8, 8);
      const sm   = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x00d4ff : 0x7c3aed });
      const mesh = new THREE.Mesh(sg, sm);
      const r    = RADIUS + 4 + i * 1.5;
      const spd  = 0.25 + i * 0.07;
      const ang  = (i / 6) * Math.PI * 2;
      const inc  = (i / 6) * Math.PI * 0.6;
      orbitData.push({ mesh, r, spd, ang, inc });
      network.add(mesh);
    }
    network.userData.orbits = orbitData;
  }());

  // ── ANIMATION LOOP ─────────────────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    scene.children.forEach(obj => {
      // Stars — very slow drift + random twinkle
      if (obj.userData.type === 'stars') {
        obj.rotation.y = t * 0.015;
        obj.rotation.x = t * 0.008;

        const colAttr = obj.geometry.attributes.color;
        const base    = obj.userData.baseCol;
        const phase   = obj.userData.twinklePhase;
        const speed   = obj.userData.twinkleSpeed;
        const nStars  = obj.userData.N;
        for (let i = 0; i < nStars; i++) {
          // brightness oscillates between ~0.25 and 1.0 per star
          const brightness = 0.62 + 0.38 * Math.sin(t * speed[i] + phase[i]);
          const i3 = i * 3;
          colAttr.array[i3]     = base[i3]     * brightness;
          colAttr.array[i3 + 1] = base[i3 + 1] * brightness;
          colAttr.array[i3 + 2] = base[i3 + 2] * brightness;
        }
        colAttr.needsUpdate = true;
      }

      // Network — rotate + orbit (base rotation + scroll boost)
      if (obj.userData.type === 'network') {
        obj.rotation.y = t * 0.18 + scrollY * 0.0025;
        obj.rotation.x = t * 0.08 + scrollY * 0.0012;
        // Orbiting spheres
        const orbits = obj.userData.orbits;
        if (orbits) {
          orbits.forEach(o => {
            o.ang += o.spd * 0.012;
            o.mesh.position.set(
              o.r * Math.cos(o.ang) * Math.cos(o.inc),
              o.r * Math.sin(o.ang),
              o.r * Math.cos(o.ang) * Math.sin(o.inc)
            );
          });
        }
      }

      // Rings
      // (removed)
    });

    // Smooth mouse parallax
    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;
    // Smooth scroll
    scrollY += (targetScrollY - scrollY) * 0.08;
    camera.position.x = mx * 9;
    camera.position.y = my * 6;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  // ── EVENT LISTENERS ────────────────────────────────────────────────────────
  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY;
  }, { passive: true });

  window.addEventListener('mousemove', e => {
    tmx =  (e.clientX / window.innerWidth  - 0.5) * 2;
    tmy = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}());


// ── TYPED TEXT EFFECT ────────────────────────────────────────────────────────

(function typedText() {
  const el    = document.getElementById('typed-role');
  if (!el) return;
  const roles = [
    'Python Developer',
    'AIOps Engineer',
    'Full Stack Developer',
    'System Engineer',
    'Backend Specialist',
  ];
  let ri = 0, ci = 0, deleting = false;

  function type() {
    const current = roles[ri];
    if (deleting) {
      el.textContent = current.slice(0, --ci);
      if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; setTimeout(type, 500); return; }
      setTimeout(type, 55);
    } else {
      el.textContent = current.slice(0, ++ci);
      if (ci === current.length) { deleting = true; setTimeout(type, 2000); return; }
      setTimeout(type, 100);
    }
  }
  setTimeout(type, 1200);
}());


// ── NAVBAR SCROLL EFFECT ─────────────────────────────────────────────────────

(function navbarScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}());


// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────

(function scrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        // Determine stagger index among visible siblings
        const siblings = Array.from(el.parentElement.querySelectorAll('.reveal'));
        const idx = siblings.indexOf(el);
        el.classList.remove('scroll-out');
        setTimeout(() => el.classList.add('visible'), idx * 80);
      } else {
        // Slide back out so it re-animates next time
        el.classList.remove('visible');
        el.classList.add('scroll-out');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}());


// ── SMOOTH NAV SCROLL ─────────────────────────────────────────────────────────

(function navScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}());


// ── GITHUB PROJECTS ───────────────────────────────────────────────────────────

(function loadGitHubRepos() {
  const GITHUB_USER = 'HellzAngel';
  const SKIP = ['HellzAngel']; // profile config repo

  // Language → colour mapping (GitHub colours)
  const LANG_COLORS = {
    'Python':     '#3572A5',
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'Vue':        '#41b883',
    'HTML':       '#e34c26',
    'CSS':        '#563d7c',
    'Hack':       '#878787',
    'Shell':      '#89e051',
    'default':    '#8892b0'
  };

  function langColor(lang) {
    return LANG_COLORS[lang] || LANG_COLORS['default'];
  }

  function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 3600)   return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400)  return Math.floor(diff / 3600) + 'h ago';
    if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
    if (diff < 31536000) return Math.floor(diff / 2592000) + 'mo ago';
    return Math.floor(diff / 31536000) + 'yr ago';
  }

  function buildCard(repo) {
    const card = document.createElement('a');
    card.className = 'repo-card';
    card.href = repo.html_url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.dataset.lang = repo.language || 'Other';

    const color = langColor(repo.language);
    const desc  = repo.description || 'No description provided.';

    card.innerHTML =
      '<div class="repo-card-top">' +
        '<span class="repo-icon">&#9670;</span>' +
        '<span class="repo-name">' + repo.name + '</span>' +
        (repo.fork ? '<span class="repo-fork-badge">fork</span>' : '') +
      '</div>' +
      '<p class="repo-desc">' + desc + '</p>' +
      '<div class="repo-footer">' +
        (repo.language
          ? '<span class="repo-lang"><span class="lang-dot" style="background:' + color + '"></span>' + repo.language + '</span>'
          : '') +
        '<span class="repo-updated">&#128336; ' + timeAgo(repo.pushed_at) + '</span>' +
        (repo.stargazers_count > 0
          ? '<span class="repo-stars">&#9733; ' + repo.stargazers_count + '</span>'
          : '') +
      '</div>';

    return card;
  }

  function buildFilters(repos, grid) {
    const filterEl = document.getElementById('repos-filter');
    if (!filterEl) return;

    // Collect languages with counts
    const langCount = {};
    repos.forEach(r => {
      const l = r.language || 'Other';
      langCount[l] = (langCount[l] || 0) + 1;
    });

    // Sort by count descending
    const langs = Object.keys(langCount).sort((a, b) => langCount[b] - langCount[a]);

    langs.forEach(lang => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.lang = lang;
      const color = langColor(lang);
      btn.innerHTML = '<span class="lang-dot" style="background:' + color + '"></span>' + lang + ' <span style="opacity:.5">(' + langCount[lang] + ')</span>';
      filterEl.appendChild(btn);
    });

    filterEl.addEventListener('click', function(e) {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lang = btn.dataset.lang;
      grid.querySelectorAll('.repo-card').forEach(card => {
        card.classList.toggle('hidden', lang !== 'all' && card.dataset.lang !== lang);
      });
    });
  }

  function loadRepos() {
  fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?per_page=100&sort=updated&_=' + Date.now(), { cache: 'no-cache' })
    .then(function(r) { return r.json(); })
    .then(function(repos) {
      var grid = document.getElementById('repos-grid');
      if (!grid) return;
      grid.innerHTML = '';

      // Filter out skipped repos
      var filtered = repos.filter(function(r) { return !SKIP.includes(r.name); });

      // Sort: non-fork first, then by stars desc, then updated
      filtered.sort(function(a, b) {
        if (a.fork !== b.fork) return a.fork ? 1 : -1;
        if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
        return new Date(b.pushed_at) - new Date(a.pushed_at);
      });

      // Summary stats
      var totalStars = filtered.reduce(function(s, r) { return s + r.stargazers_count; }, 0);
      var langs = new Set(filtered.map(function(r) { return r.language; }).filter(Boolean));
      var totalEl = document.getElementById('gh-total');
      var starsEl = document.getElementById('gh-stars');
      var langsEl = document.getElementById('gh-langs');
      var lastSyncEl = document.getElementById('gh-last-sync');
      if (totalEl) totalEl.textContent = filtered.length;
      if (starsEl) starsEl.textContent = totalStars;
      if (langsEl) langsEl.textContent = langs.size;
      if (lastSyncEl) lastSyncEl.textContent = new Date().toLocaleTimeString();

      // Rebuild filters (clear old buttons except 'all')
      var filterEl = document.getElementById('repos-filter');
      if (filterEl) {
        var allBtn = filterEl.querySelector('[data-lang="all"]');
        filterEl.innerHTML = '';
        if (allBtn) { allBtn.className = 'filter-btn active'; filterEl.appendChild(allBtn); }
      }
      buildFilters(filtered, grid);

      filtered.forEach(function(repo) {
        grid.appendChild(buildCard(repo));
      });

      // Staggered fade-in
      grid.querySelectorAll('.repo-card').forEach(function(el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      });
      setTimeout(function() {
        grid.querySelectorAll('.repo-card').forEach(function(el, i) {
          setTimeout(function() { el.style.opacity = '1'; el.style.transform = ''; }, i * 40);
        });
      }, 80);

      // Update refresh button state
      var refreshBtn = document.getElementById('gh-refresh-btn');
      if (refreshBtn) { refreshBtn.classList.remove('spinning'); refreshBtn.title = 'Refreshed at ' + new Date().toLocaleTimeString(); }
    })
    .catch(function() {
      var grid = document.getElementById('repos-grid');
      if (grid) grid.innerHTML = '<p style="color:var(--text-dim);padding:2rem">Could not load repositories. Check your connection.</p>';
      var refreshBtn = document.getElementById('gh-refresh-btn');
      if (refreshBtn) refreshBtn.classList.remove('spinning');
    });
  }

  // Initial load
  loadRepos();

  // Auto-refresh every 5 minutes
  setInterval(loadRepos, 5 * 60 * 1000);

  // Manual refresh button — injected into the meta row
  var meta = document.getElementById('gh-meta');
  if (meta) {
    var btn = document.createElement('button');
    btn.id = 'gh-refresh-btn';
    btn.className = 'gh-refresh-btn';
    btn.title = 'Refresh repositories';
    btn.innerHTML = '&#8635;';
    btn.addEventListener('click', function() {
      btn.classList.add('spinning');
      loadRepos();
    });
    meta.appendChild(btn);
  }

}());


// ── CARD 3D TILT on hover ─────────────────────────────────────────────────────

(function cardTilt() {
  document.querySelectorAll('.glass-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 10;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -10;
      card.style.transform = `translateY(-3px) rotateX(${y}deg) rotateY(${x}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}());

// ── AMBIENT AUDIO — Lo-fi Chill ────────────────────────────────────────────────

(function ambientAudio() {
  var ctx        = null;
  var masterGain = null;
  var reverbNode = null;
  var beatTimer  = null;
  var chordTimer = null;
  var playing    = false;
  var btn     = document.getElementById('audio-toggle');
  var iconOff = document.getElementById('audio-icon-off');
  var iconOn  = document.getElementById('audio-icon-on');

  // Convolution reverb from white-noise impulse
  function makeReverb(duration, decay) {
    var len     = ctx.sampleRate * duration;
    var impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = impulse.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    var conv = ctx.createConvolver();
    conv.buffer = impulse;
    return conv;
  }

  function buildAudio() {
    ctx        = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);

    // Warm reverb → master
    reverbNode = makeReverb(2.5, 2.0);
    reverbNode.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Lo-fi warmth: roll off harsh highs
    var warmFilter = ctx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.value = 3500;
    warmFilter.Q.value = 0.7;
    warmFilter.connect(reverbNode);

    // ── 1. Chord pad — Cmaj7 → Am7 → Fmaj7 → G7 ─────────────────────────────
    var chords = [
      [261.63, 329.63, 392.00, 493.88],   // Cmaj7: C4 E4 G4 B4
      [220.00, 261.63, 329.63, 392.00],   // Am7:   A3 C4 E4 G4
      [174.61, 220.00, 261.63, 329.63],   // Fmaj7: F3 A3 C4 E4
      [196.00, 246.94, 293.66, 349.23],   // G7:    G3 B3 D4 F4
    ];
    var bassRoots = [130.81, 110.00, 87.31, 98.00];  // C3 A2 F2 G2

    var padOscs = [];
    chords[0].forEach(function(f, idx) {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      osc.detune.value = (idx - 1.5) * 10;   // vinyl-style detuning
      gain.gain.value = 0.07;
      osc.connect(gain);
      gain.connect(warmFilter);
      osc.start();
      padOscs.push({ osc: osc, gain: gain });
    });

    // ── 2. Bass oscillator ────────────────────────────────────────────────────
    var bass  = ctx.createOscillator();
    var bassG = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.value = bassRoots[0];
    bassG.gain.value = 0.20;
    bass.connect(bassG);
    bassG.connect(masterGain);   // bass direct — no reverb mud
    bass.start();

    // Cycle chords every 8 seconds
    var chordIdx = 0;
    function nextChord() {
      chordIdx = (chordIdx + 1) % chords.length;
      var now  = ctx.currentTime;
      chords[chordIdx].forEach(function(f, i) {
        padOscs[i].osc.frequency.linearRampToValueAtTime(f, now + 0.8);
      });
      bass.frequency.linearRampToValueAtTime(bassRoots[chordIdx], now + 0.8);
      chordTimer = setTimeout(nextChord, 8000);
    }
    chordTimer = setTimeout(nextChord, 8000);

    // ── 3. Vinyl crackle ──────────────────────────────────────────────────────
    var cSize = ctx.sampleRate * 2;
    var cBuf  = ctx.createBuffer(1, cSize, ctx.sampleRate);
    var cd    = cBuf.getChannelData(0);
    for (var i = 0; i < cSize; i++) {
      cd[i] = Math.random() < 0.0003
        ? (Math.random() * 2 - 1) * 0.35
        : (Math.random() * 2 - 1) * 0.002;
    }
    var cSrc  = ctx.createBufferSource();
    cSrc.buffer = cBuf; cSrc.loop = true;
    var cFilt = ctx.createBiquadFilter();
    cFilt.type = 'bandpass'; cFilt.frequency.value = 1500; cFilt.Q.value = 1.0;
    var cGain = ctx.createGain(); cGain.gain.value = 0.035;
    cSrc.connect(cFilt); cFilt.connect(cGain); cGain.connect(masterGain);
    cSrc.start();

    // ── 4. Melody oscillators — C major pentatonic (C5 D5 E5 G5 A5) ──────────
    var melFreqs = [523.25, 587.33, 659.25, 783.99, 880.00];
    var melOscs  = melFreqs.map(function(f) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = 8;   // slightly flat for warmth
      g.gain.value = 0;
      o.connect(g); g.connect(warmFilter);
      o.start();
      return { osc: o, gain: g };
    });

    // ── 5. Lo-fi beat (80 BPM, swung 16th-note feel) ─────────────────────────
    var beat       = 60 / 80;                          // 0.75 s per beat
    var melPattern = [0, 2, 4, 2, 3, 1, 4, 3, 0, 4, 2, 3];
    var melStep    = 0;

    function playKick(t) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
      g.gain.setValueAtTime(0.65, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g); g.connect(masterGain);
      o.start(t); o.stop(t + 0.25);
    }

    function playHihat(t, open) {
      var sz  = Math.floor(ctx.sampleRate * (open ? 0.22 : 0.04));
      var buf = ctx.createBuffer(1, sz, ctx.sampleRate);
      var bd  = buf.getChannelData(0);
      for (var j = 0; j < sz; j++) bd[j] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var f   = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 9000;
      var g   = ctx.createGain();
      g.gain.setValueAtTime(open ? 0.07 : 0.04, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.18 : 0.035));
      src.connect(f); f.connect(g); g.connect(masterGain);
      src.start(t);
    }

    function playSnare(t) {
      var o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 180;
      og.gain.setValueAtTime(0.25, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(og); og.connect(masterGain);
      o.start(t); o.stop(t + 0.14);
      var nb  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
      var nd  = nb.getChannelData(0);
      for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
      var ns  = ctx.createBufferSource(); ns.buffer = nb;
      var nf  = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 3000;
      var ng  = ctx.createGain();
      ng.gain.setValueAtTime(0.18, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      ns.connect(nf); nf.connect(ng); ng.connect(masterGain);
      ns.start(t);
    }

    function trigMelody(t, offset) {
      var idx = melPattern[(melStep + offset) % melPattern.length];
      var mn  = melOscs[idx];
      mn.gain.gain.cancelScheduledValues(t);
      mn.gain.gain.setValueAtTime(0, t);
      mn.gain.gain.linearRampToValueAtTime(0.04, t + 0.04);
      mn.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    }

    function beatLoop() {
      var now = ctx.currentTime + 0.05;   // small lookahead
      // Beat 1 — kick + closed hat
      playKick(now);
      playHihat(now, false);
      // Swung 16th after beat 1 — melody note
      playHihat(now + beat * 0.55, false);
      trigMelody(now + beat * 0.55, 0);
      // Beat 2 — closed hat
      playHihat(now + beat, false);
      // Beat 2.5 — snare
      playSnare(now + beat * 1.5);
      playHihat(now + beat * 1.5, false);
      trigMelody(now + beat * 1.5, 1);
      // Beat 3 — kick + closed hat
      playKick(now + beat * 2);
      playHihat(now + beat * 2, false);
      // Swung 16th after beat 3 — melody note
      playHihat(now + beat * 2.55, false);
      trigMelody(now + beat * 2.55, 2);
      // Beat 4 — closed hat
      playHihat(now + beat * 3, false);
      // Beat 4.5 — snare + open hat
      playSnare(now + beat * 3.5);
      playHihat(now + beat * 3.5, false);
      playHihat(now + beat * 3.75, true);
      trigMelody(now + beat * 3.5, 3);

      melStep   = (melStep + 4) % melPattern.length;
      beatTimer = setTimeout(beatLoop, beat * 4 * 1000);
    }
    beatLoop();

    // Gentle master breath (very subtle)
    var bLFO = ctx.createOscillator(), bG = ctx.createGain();
    bLFO.frequency.value = 0.04;
    bG.gain.value = 0.03;
    bLFO.connect(bG); bG.connect(masterGain.gain);
    bLFO.start();
  }

  function fadeIn() {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3);
  }

  function fadeOut() {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    if (beatTimer)  { clearTimeout(beatTimer);  beatTimer  = null; }
    if (chordTimer) { clearTimeout(chordTimer); chordTimer = null; }
  }

  function setUI(on) {
    iconOff.style.display = on ? 'none' : '';
    iconOn.style.display  = on ? ''     : 'none';
    on ? btn.classList.add('playing') : btn.classList.remove('playing');
  }

  btn.addEventListener('click', function() {
    if (!ctx) buildAudio();
    if (ctx.state === 'suspended') ctx.resume();
    playing = !playing;
    setUI(playing);
    playing ? fadeIn() : fadeOut();
  });
}());
