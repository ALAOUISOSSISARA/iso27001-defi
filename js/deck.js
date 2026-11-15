// Présentation web : slides + votes + quiz, pilotés avec une seule touche →
(function () {
  const PRINT = new URLSearchParams(location.search).has('print');
  window.DECK_MODE = !PRINT;
  const SL = window.SLIDES;
  const D = { pos: 0, step: 0, voteIdx: -1, quizOn: false, G: null, online: false, lastLabel: null, gameOn: false };
  const deck = document.getElementById('deck');
  const root = document.getElementById('root');

  // Adresse publique (QR codes) : l'adresse du site, sauf en local
  const local = !location.hostname || /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname);
  const site = ((window.APP_CONFIG && APP_CONFIG.PLAYER_URL) || (local ? 'https://iso27001-defi.vercel.app' : location.origin)).replace(/\/$/, '') + '/';
  const ctx = {
    site, siteShort: site.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    qr(url, size) {
      const q = qrcode(0, 'M'); q.addData(url); q.make();
      return q.createSvgTag({ cellSize: 8, margin: 0, scalable: true })
        .replace(/fill="black"/g, 'fill="#0f3d33"')
        .replace('<svg ', `<svg style="width:${size || 420}px;height:${size || 420}px" `);
    },
  };

  const slideHTML = (i, step) => {
    const s = SL[i];
    return `<section class="slide${s.dark ? ' dark' : ''}" data-i="${i}">${s.html(ctx)}
      ${i > 0 && i < SL.length - 1 ? `<div class="foot"><span>ISO 27001 · ENSA Marrakech</span><span>${i + 1} / ${SL.length}</span></div>` : ''}</section>`;
  };

  function applySteps(scope, step) {
    scope.querySelectorAll('[data-at]').forEach(el => el.classList.toggle('on', step >= Number(el.dataset.at)));
  }

  function counters(scope, instant) {
    scope.querySelectorAll('[data-count]').forEach(el => {
      const n = Number(el.dataset.count);
      const f = v => Math.round(v).toLocaleString('fr-FR');
      if (instant) { el.textContent = f(n); return; }
      const t0 = performance.now();
      (function tick(t) {
        const k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 3);
        el.textContent = f(n * e);
        if (k < 1 && el.isConnected) requestAnimationFrame(tick);
      })(t0);
    });
  }

  // ---------------------------------------------------------------- Impression / PDF
  if (PRINT) {
    document.body.classList.add('print');
    deck.classList.remove('hidden');
    deck.innerHTML = SL.map((s, i) => `<div class="frame">${slideHTML(i)}</div>`).join('');
    deck.querySelectorAll('.slide').forEach((el, i) => {
      el.classList.add('enter');
      applySteps(el, 99);
      counters(el, true);
    });
    document.fonts.ready.then(() => setTimeout(() => (window.__PRINT_READY = true), 300));
    window.DECK = { ready() {}, offline() {} };
    return;
  }

  // ---------------------------------------------------------------- Écran
  const frame = h('div', { class: 'frame' });
  deck.append(frame);
  const fit = () => { frame.style.transform = `translate(-50%, -50%) scale(${Math.min(innerWidth / 1920, innerHeight / 1080)})`; };
  addEventListener('resize', fit); fit();

  function showGame(on) {
    D.gameOn = on;
    deck.classList.toggle('hidden', on);
    root.classList.toggle('behind', !on);
  }

  function render() {
    frame.innerHTML = slideHTML(D.pos);
    const el = frame.firstElementChild;
    applySteps(el, D.step);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add('enter'); counters(el, false); }));
    updateBar();
  }

  function phoneLabel() {
    const s = SL[D.pos];
    if (!D.online || s.kind === 'lobby' || s.label === D.lastLabel) return;
    D.lastLabel = s.label;
    D.G.slide(s.label).catch(() => {});
  }

  function go(np, built) {
    if (np < 0 || np >= SL.length) return;
    D.pos = np; D.voteIdx = -1; D.quizOn = false;
    D.step = built ? (SL[np].steps || 0) : 0;
    showGame(false); render(); phoneLabel();
  }

  function openStep(idx) {
    showGame(true);
    D.G.act(() => D.G.goto(idx));
  }

  function next() {
    const s = SL[D.pos];
    if (D.G && D.G.isBusy()) return;
    if (s.kind === 'vote' && D.online) {
      const st = D.G.A.state;
      if (D.voteIdx < 0) { D.voteIdx = 0; return openStep(s.vote[0]); }
      const cur = s.vote[D.voteIdx];
      if (st.step === cur && st.phase === 'question') return D.G.act(() => D.G.reveal());
      if (D.voteIdx < s.vote.length - 1) { D.voteIdx++; return openStep(s.vote[D.voteIdx]); }
      return go(D.pos + 1);
    }
    if (s.kind === 'quiz' && D.online) {
      if (!D.quizOn) { D.quizOn = true; return openStep(s.first); }
      if (D.G.A.state.phase === 'podium') return go(D.pos + 1);
      return D.G.next();
    }
    if (D.step < (s.steps || 0)) { D.step++; applySteps(frame.firstElementChild, D.step); return; }
    go(D.pos + 1);
  }

  function prev() {
    if (D.gameOn) { showGame(false); D.voteIdx = -1; D.quizOn = false; render(); return; }
    if (D.step > 0) { D.step--; applySteps(frame.firstElementChild, D.step); return; }
    go(D.pos - 1, true);
  }

  // Barre discrète en bas (apparaît au survol)
  const ct = h('span', { class: 'ct' });
  const status = h('span', {});
  const bar = h('div', { class: 'dbar' },
    h('button', { class: 'btn ghost', onclick: prev }, '◀'),
    h('button', { class: 'btn', onclick: next }, 'Suivant ▶'),
    ct, status, h('span', { class: 'sp' }),
    h('button', { class: 'btn ghost', onclick: () => D.G && D.G.openPlayers() }, 'Joueurs'),
    h('button', { class: 'btn ghost', onclick: () => D.G && D.G.openReset() }, 'Réinitialiser le jeu'),
    h('button', { class: 'btn ghost', onclick: () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} } }, 'Plein écran (F)'));
  function updateBar() {
    ct.textContent = `Slide ${D.pos + 1} / ${SL.length}`;
    status.className = D.online ? 'muted' : 'off';
    status.textContent = D.online ? '· site connecté' : '· hors ligne : votes désactivés';
  }

  function start() {
    showGame(false);
    document.body.append(bar);
    render();
    document.addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input, .modal, .drawer')) return;
      if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
      else if (e.key === 'f' || e.key === 'F') { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (er) {} }
      else if (e.key === 'Home') go(0);
    });
    // Compteur de connectés sur la slide « Sortez vos téléphones »
    setInterval(() => {
      const el = document.getElementById('lobby-count');
      if (el && D.G && D.G.A.stats) el.textContent = D.G.A.stats.players;
    }, 1000);
  }

  window.DECK = {
    ready(G) { D.G = G; D.online = true; start(); },
    offline() { D.online = false; start(); },
    state: D, next, prev, go,
  };
})();
