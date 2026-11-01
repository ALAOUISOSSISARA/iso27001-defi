// Page présentateur : écran projeté + contrôles
(function () {
  const root = document.getElementById('root');
  const A = {
    steps: [], state: null, stats: null, offset: 0,
    view: 'main',          // 'main' | 'board' (pendant la phase reveal)
    storyIdx: 0,           // nb de puces d'histoire affichées
    autoReveal: true, revealing: false,
    lastBoard: [], refs: {}, tick: null, podiumTimers: [],
  };
  const isQ = s => s && (s.kind === 'question' || s.kind === 'estimate');
  const cur = () => A.steps.find(s => s.idx === A.state.step);
  const qSteps = () => A.steps.filter(isQ);
  const playerUrl = () => (APP_CONFIG.PLAYER_URL || (location.origin + location.pathname.replace(/admin(\.html)?$/, ''))).replace(/\/$/, '') + '/';

  if (!Backend.configured) {
    root.append(h('div', { class: 'login' }, h('h2', {}, 'Configuration manquante'),
      h('p', { class: 'notice' }, 'Renseignez SUPABASE_URL et SUPABASE_ANON_KEY dans config.js.')));
    return;
  }

  // ------------------------------------------------------------------
  // Connexion
  // ------------------------------------------------------------------
  async function init() {
    const { data } = await Backend.client.auth.getSession();
    if (data && data.session) start(data.session); else viewLogin();
  }

  function viewLogin(msg) {
    const email = h('input', { class: 'input', type: 'email', placeholder: 'E-mail du présentateur', autocomplete: 'username' });
    const pass = h('input', { class: 'input', type: 'password', placeholder: 'Mot de passe', autocomplete: 'current-password' });
    const err = h('div', { class: 'error-msg' }, msg || '');
    const btn = h('button', { class: 'btn', type: 'submit' }, 'Se connecter');
    root.replaceChildren(h('form', { class: 'login', onsubmit: async ev => {
      ev.preventDefault(); btn.disabled = true; err.textContent = '';
      const { data, error } = await Backend.client.auth.signInWithPassword({ email: email.value.trim(), password: pass.value });
      if (error) { err.textContent = 'Identifiants incorrects.'; btn.disabled = false; return; }
      start(data.session);
    } },
      h('span', { class: 'tag' }, 'Espace présentateur'),
      h('div', { class: 'brand' }, 'ISO ', h('em', {}, '27001')),
      email, pass, btn, err));
  }

  async function start(session) {
    try {
      A.steps = await Backend.rpc('admin_get_steps');
    } catch (e) {
      if (e.code === 'NOT_ADMIN') {
        root.replaceChildren(h('div', { class: 'login' },
          h('h2', {}, 'Compte non autorisé'),
          h('div', { class: 'notice' },
            'Ce compte est connecté mais n\'est pas déclaré comme présentateur. Dans Supabase > SQL Editor, exécutez :',
            h('br'), h('br'), h('code', {}, `insert into public.admins values ('${session.user.id}');`)),
          h('button', { class: 'btn ghost', onclick: logout }, 'Se déconnecter')));
        return;
      }
      root.replaceChildren(h('div', { class: 'login' }, h('p', { class: 'notice' }, 'Erreur : ' + e.message)));
      return;
    }
    await loadState();
    buildStage();
    render();
    Backend.onStateChange(async () => { const k = key(); await loadState(); if (key() !== k) { A.view = 'main'; render(); } }, 4000);
    setInterval(pollStats, 1000);
    pollStats();
  }

  async function logout() { await Backend.client.auth.signOut(); location.reload(); }
  const key = () => A.state ? [A.state.phase, A.state.step, A.state.started_at].join('|') : '';
  async function loadState() {
    A.state = await Backend.rpc('get_state');
    A.offset = new Date(A.state.server_now).getTime() - Date.now();
  }
  async function loadStats() {
    try { A.stats = await Backend.rpc('admin_stats'); } catch (e) { console.warn(e); }
  }

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------
  let busy = false;
  async function act(fn) {
    if (busy) return; busy = true;
    try { await fn(); } catch (e) { toast(e.message); } finally { busy = false; }
  }
  const setState = st => { A.state = st; A.offset = new Date(st.server_now).getTime() - Date.now(); };

  async function goto(i) {
    setState(await Backend.rpc('admin_goto', { p_step: i }));
    A.view = 'main'; A.storyIdx = 0; A.revealing = false; A.stats = null;
    await loadStats(); render();
  }
  async function reveal() {
    if (A.state.phase !== 'question') return;
    setState(await Backend.rpc('admin_reveal'));
    await loadStats(); A.view = 'main'; A.storyIdx = 0; render();
  }
  async function showBoard() {
    const rows = await Backend.rpc('get_leaderboard', { p_limit: 10 });
    A.view = 'board'; render(rows);
  }
  async function podium() {
    setState(await Backend.rpc('admin_set_phase', { p_phase: 'podium' }));
    A.view = 'main'; render();
  }
  async function toLobby() {
    setState(await Backend.rpc('admin_set_phase', { p_phase: 'lobby' }));
    A.view = 'main'; render();
  }

  function next() {
    act(async () => {
      const st = A.state, s = cur();
      const last = Math.max(...A.steps.map(x => x.idx));
      const after = () => (st.step < last ? goto(st.step + 1) : podium());
      if (st.phase === 'lobby') return goto(A.steps[0].idx);
      if (st.phase === 'show') return after();
      if (st.phase === 'question') return reveal();
      if (st.phase === 'reveal') {
        const story = (s && s.story) || [];
        if (A.view === 'main' && A.storyIdx < story.length) { A.storyIdx++; return render(); }
        if (A.view === 'main') return showBoard();
        return after();
      }
    });
  }
  function prev() {
    act(async () => {
      const st = A.state;
      if (st.phase === 'reveal' && A.view === 'board') { A.view = 'main'; return render(); }
      if (st.phase === 'reveal' && A.storyIdx > 0) { A.storyIdx--; return render(); }
      if (st.phase === 'podium') return goto(Math.max(...A.steps.map(x => x.idx)));
      if (st.step > A.steps[0].idx) return goto(st.step - 1);
    });
  }

  async function pollStats() {
    if (!A.state || !['lobby', 'question'].includes(A.state.phase)) return;
    await loadStats();
    updateLive();
    // Révélation automatique : temps écoulé, ou tout le monde a répondu
    if (A.autoReveal && A.state.phase === 'question' && !A.revealing && A.stats) {
      const s = cur();
      const left = s.time_limit - (Date.now() + A.offset - new Date(A.state.started_at).getTime()) / 1000;
      const all = A.stats.players > 0 && A.stats.answered >= A.stats.players;
      if ((left < -0.8 || all) && !busy) { A.revealing = true; act(reveal); }
    }
  }

  // ------------------------------------------------------------------
  // Structure de la scène
  // ------------------------------------------------------------------
  function buildStage() {
    A.refs.head = h('div', { class: 'stage-head' });
    A.refs.body = h('div', { class: 'stage-body' });
    A.refs.nextBtn = h('button', { class: 'btn', onclick: next }, 'Suivant');
    const auto = h('input', { type: 'checkbox', checked: A.autoReveal, onchange: e => (A.autoReveal = e.target.checked) });
    A.refs.stage = h('div', { class: 'stage' },
      A.refs.head, A.refs.body,
      h('div', { class: 'controls' },
        h('button', { class: 'btn ghost', onclick: prev, title: 'Retour (←)' }, '◀'),
        A.refs.nextBtn,
        h('span', { class: 'kbd' }, '→ / Espace'),
        h('button', { class: 'btn ghost', onclick: () => act(showBoard) }, 'Classement'),
        h('button', { class: 'btn ghost', onclick: openPlayers }, 'Joueurs'),
        h('label', {}, auto, 'Révélation auto'),
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn ghost', onclick: fullscreen }, 'Plein écran'),
        h('button', { class: 'btn ghost', onclick: () => act(toLobby) }, 'Lobby'),
        h('button', { class: 'btn ghost', onclick: openReset }, 'Réinitialiser'),
        h('button', { class: 'btn ghost', onclick: logout }, 'Déconnexion')));
    root.replaceChildren(A.refs.stage);
    document.addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input, .modal, .drawer')) return;
      if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'f' || e.key === 'F') fullscreen();
    });
  }

  function fullscreen() {
    try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {}
  }

  function nextLabel() {
    const st = A.state, s = cur();
    const last = Math.max(...A.steps.map(x => x.idx));
    if (st.phase === 'lobby') return 'Lancer le défi ▶';
    if (st.phase === 'question') return 'Révéler ▶';
    if (st.phase === 'podium') return 'Terminé';
    if (st.phase === 'reveal' && A.view === 'main') {
      const story = (s && s.story) || [];
      return A.storyIdx < story.length ? `Ce qui s'est passé (${A.storyIdx + 1}/${story.length}) ▶` : 'Classement ▶';
    }
    return st.step < last ? 'Suite ▶' : 'Podium ▶';
  }

  // ------------------------------------------------------------------
  // Rendu
  // ------------------------------------------------------------------
  function render(boardRows) {
    clearInterval(A.tick);
    A.podiumTimers.forEach(clearTimeout); A.podiumTimers = [];
    const st = A.state, s = cur();
    A.refs.stage.classList.toggle('incident', st.phase === 'show' && s && s.kind === 'incident');
    A.refs.nextBtn.textContent = nextLabel();
    A.refs.nextBtn.disabled = st.phase === 'podium';

    // En-tête
    const qs = qSteps();
    const qn = s ? qs.findIndex(x => x.idx === s.idx) + 1 : 0;
    A.refs.head.replaceChildren(
      h('span', { class: 'tag' }, st.phase === 'lobby' ? 'Module PCA / PRA' : st.phase === 'podium' ? 'Classement final' : (s && s.clause) || ''),
      h('span', { class: 'count' }, (st.phase !== 'lobby' && st.phase !== 'podium' && qn) ? `Question ${qn} / ${qs.length}` : ''));

    const b = A.refs.body;
    if (st.phase === 'lobby') b.replaceChildren(viewLobby());
    else if (st.phase === 'show') b.replaceChildren(viewShow(s));
    else if (st.phase === 'question') b.replaceChildren(...viewQuestion(s, false));
    else if (st.phase === 'reveal' && A.view === 'board') b.replaceChildren(...viewBoard(boardRows || []));
    else if (st.phase === 'reveal') b.replaceChildren(...viewQuestion(s, true));
    else if (st.phase === 'podium') { b.replaceChildren(...viewPodium()); }
    updateLive();
  }

  function updateLive() {
    const st = A.stats; if (!st) return;
    const r = A.refs;
    if (r.count && r.count.isConnected) r.count.firstChild.textContent = st.players;
    if (r.names && r.names.isConnected) {
      const have = new Set([...r.names.children].map(x => x.textContent));
      const want = (st.recent || []).slice(0, 40);
      if (want.join('|') !== [...r.names.children].map(x => x.textContent).join('|')) {
        r.names.replaceChildren(...want.map(n => {
          const el = h('span', {}, n);
          if (have.has(n)) el.style.animation = 'none';
          return el;
        }));
      }
    }
    if (r.answered && r.answered.isConnected) r.answered.replaceChildren(h('b', {}, st.answered), ` / ${st.players} ont répondu`);
  }

  function viewLobby() {
    const qr = qrcode(0, 'M');
    qr.addData(playerUrl()); qr.make();
    const qrBox = h('div');
    qrBox.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
    A.refs.count = h('div', { class: 'big-count' }, '0', h('small', {}, 'joueurs connectés'));
    A.refs.names = h('div', { class: 'names' });
    return h('div', { class: 'lobby' },
      h('div', {},
        h('div', { class: 'brand' }, 'ISO ', h('em', {}, '27001'), h('br'), 'Le défi'),
        h('div', { class: 'sub' }, 'Scannez le QR code, choisissez un pseudo. Tout ce qu\'on présente peut tomber.'),
        A.refs.count, A.refs.names),
      h('div', { class: 'qr-card' }, qrBox, h('div', { class: 'url' }, playerUrl().replace(/^https?:\/\//, ''))));
  }

  function viewShow(s) {
    const isInc = s.kind === 'incident';
    const els = [
      h('div', { class: 'show' },
        h('h1', { class: 's-title s-xl' }, s.title),
        s.body ? h('p', { class: 's-text' }, s.body) : null)];
    if (isInc) {
      els.push(h('div', { class: 'flash' }));
      els.push(h('div', { class: 'ticker' }, h('span', {}, '⚠ INCIDENT MAJEUR · RÉSEAU MONDIAL HORS SERVICE · 45 000 POSTES TOUCHÉS · CONTRÔLEURS DE DOMAINE DÉTRUITS · ⚠ INCIDENT MAJEUR · ')));
    }
    return h('div', { style: 'height:100%' }, ...els);
  }

  function countdownEl(s) {
    const R = 44, C = 2 * Math.PI * R;
    const prog = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    for (const c of [track, prog]) { c.setAttribute('cx', 50); c.setAttribute('cy', 50); c.setAttribute('r', R); }
    track.setAttribute('class', 'track'); prog.setAttribute('class', 'prog');
    prog.setAttribute('stroke-dasharray', C);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.append(track, prog);
    const num = h('span', { class: 'num' });
    const el = h('div', { class: 'countdown' }, svg, num);
    const start = new Date(A.state.started_at).getTime();
    const tick = () => {
      const left = Math.max(0, s.time_limit - (Date.now() + A.offset - start) / 1000);
      prog.setAttribute('stroke-dashoffset', C * (1 - left / s.time_limit));
      num.textContent = Math.ceil(left);
      el.classList.toggle('low', left <= 5);
    };
    tick(); A.tick = setInterval(tick, 250);
    return el;
  }

  function viewQuestion(s, revealed) {
    const stats = A.stats || { distribution: [], values: [], players: 0, answered: 0 };
    const storyMode = revealed && A.storyIdx > 0;
    A.refs.answered = h('div', { class: 'answered-count' });
    const side = revealed
      ? h('div', { class: 'answered-count' }, h('b', {}, stats.answered), ` réponses · `, h('b', {}, stats.correct_count || 0), ' justes')
      : h('div', {}, countdownEl(s), A.refs.answered);

    const head = h('div', { class: 'q-wrap' },
      h('div', {},
        h('h1', { class: 's-title', style: storyMode ? 'font-size:clamp(22px,2.2vw,38px);color:var(--muted)' : '' }, s.title),
        s.body && !storyMode ? h('div', { class: 'q-sub' }, s.body) : null,
        s.multiplier > 1 && !revealed ? h('span', { class: 'tag', style: 'margin-top:1.5vh;color:var(--gold)' }, `Question finale · points ×${s.multiplier}`) : null),
      storyMode ? h('div') : side);

    if (storyMode) {
      const items = s.story.slice(0, A.storyIdx);
      return [head,
        h('div', { class: 's-l', style: 'font-family:var(--display);font-weight:800;margin-top:3vh' }, 'Ce qui s\'est vraiment passé'),
        h('ul', { class: 'story' }, items.map((t, i) =>
          h('li', { class: i === s.story.length - 1 ? 'punch' : '' }, t)))];
    }

    let main;
    if (s.kind === 'estimate') main = revealed ? estimateReveal(s, stats) : h('div', { class: 'est-stage' },
      h('div', { class: 'est-waiting' }, `Réglez votre estimation sur le téléphone · entre ${Number(s.est_min)} et ${Number(s.est_max)} ${s.est_unit || ''}`));
    else {
      const total = stats.distribution.reduce((a, d) => a + Number(d.n), 0) || 0;
      main = h('div', { class: 'tiles' + (revealed ? ' revealed' : '') }, s.options.map((opt, i) => {
        const n = Number((stats.distribution.find(d => d.choice === i) || {}).n || 0);
        const pct = total ? n / total : 0;
        const fill = h('div', { class: 'fill' });
        if (revealed) requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.transform = `scaleX(${pct})`)));
        return h('div', { class: `tile c${i}` + (revealed ? (i === s.correct_choice ? ' right' : ' wrong') : '') },
          fill,
          h('span', { class: 'shape' }, revealed && i === s.correct_choice ? '✓' : SHAPES[i]),
          h('span', { class: 'label' }, opt),
          h('span', { class: 'stat' }, revealed ? `${n} · ${Math.round(pct * 100)} %` : ''));
      }));
    }

    const out = [head, main];
    if (revealed && s.explanation) out.push(h('div', { class: 'explain' }, h('b', {}, 'Pourquoi ? '), s.explanation));
    return out;
  }

  function estimateReveal(s, stats) {
    const min = Number(s.est_min), max = Number(s.est_max), target = Number(s.correct_value);
    const vals = (stats.values || []).map(Number);
    const BINS = 20, w = (max - min) / BINS;
    const counts = Array(BINS).fill(0);
    vals.forEach(v => counts[Math.min(BINS - 1, Math.floor((v - min) / w))]++);
    const peak = Math.max(1, ...counts);
    const bars = counts.map((c, i) => {
      const lo = min + i * w, hi = lo + w;
      const bar = h('div', { class: 'bar' + (target >= lo && target < hi + (i === BINS - 1 ? 1e-9 : 0) ? ' hit' : '') });
      requestAnimationFrame(() => requestAnimationFrame(() => (bar.style.height = (c / peak * 100) + '%')));
      return bar;
    });
    const pos = (target - min) / (max - min) * 100;
    const sorted = [...vals].sort((a, b) => a - b);
    const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : null;
    const unit = s.est_unit || '';
    return h('div', { class: 'est-stage' },
      h('div', { class: 'est-scale' }, ...bars,
        h('div', { class: 'est-marker', style: `left:${pos}%` }, h('span', {}, `${target} ${unit}`))),
      h('div', { class: 'est-axis' }, h('span', {}, `${min} ${unit}`), h('span', {}, `${(min + max) / 2} ${unit}`), h('span', {}, `${max} ${unit}`)),
      h('div', { class: 'est-facts' },
        h('span', {}, 'Bonne réponse : ', h('b', {}, `${target} ${unit}`)),
        h('span', {}, 'Médiane de la classe : ', h('b', {}, median == null ? '—' : `${Math.round(median * 10) / 10} ${unit}`)),
        h('span', {}, 'Dans la cible : ', h('b', {}, `${stats.correct_count || 0} / ${vals.length}`))));
  }

  function viewBoard(rows) {
    const before = new Map(A.lastBoard.map((r, i) => [r.pseudo, i]));
    const list = h('div', { class: 'board' }, rows.map((r, i) => {
      const was = before.has(r.pseudo) ? before.get(r.pseudo) : null;
      const mv = A.lastBoard.length === 0 ? '' : was == null ? '▲ new' : was > i ? `▲ ${was - i}` : was < i ? `▼ ${i - was}` : '';
      const row = h('div', { class: 'row' },
        h('span', { class: 'rk' }, ordinal(r.rank)),
        h('span', { class: 'nm' }, r.pseudo),
        h('span', { class: 'mv ' + (mv.startsWith('▲') ? 'up' : mv.startsWith('▼') ? 'down' : '') }, mv),
        h('span', { class: 'sc' }, fmt(r.score)));
      row.dataset.from = was == null ? rows.length : was;
      row.dataset.to = i;
      return row;
    }));
    // Animation FLIP : chaque ligne part de son ancienne position
    requestAnimationFrame(() => {
      const rowH = list.firstChild ? list.firstChild.getBoundingClientRect().height + 8 : 0;
      [...list.children].forEach(el => {
        const d = (Number(el.dataset.from) - Number(el.dataset.to)) * rowH;
        el.style.transition = 'none'; el.style.transform = `translateY(${d}px)`;
      });
      requestAnimationFrame(() => [...list.children].forEach(el => { el.style.transition = ''; el.style.transform = ''; }));
    });
    A.lastBoard = rows.map(r => ({ pseudo: r.pseudo }));
    return [h('h1', { class: 's-title s-l' }, 'Classement'),
      rows.length ? list : h('p', { class: 's-text muted' }, 'Aucun joueur pour l\'instant.')];
  }

  function viewPodium() {
    const wrap = h('div', { class: 'podium' });
    const rest = h('div', { class: 'names', style: 'justify-content:center;margin-top:2.5vh' });
    const canvas = h('canvas', { id: 'confetti' });
    Backend.rpc('get_leaderboard', { p_limit: 10 }).then(rows => {
      const byPos = [rows[1], rows[0], rows[2]];
      const cls = ['p2', 'p1', 'p3'];
      const pods = byPos.map((r, i) => h('div', { class: 'pod ' + cls[i] },
        h('div', { class: 'nm' }, r ? r.pseudo : '—'),
        h('div', { class: 'sc' }, r ? fmt(r.score) + ' pts' : ''),
        h('div', { class: 'block' }, cls[i].slice(1))));
      wrap.replaceChildren(...pods);
      const show = (i, ms) => A.podiumTimers.push(setTimeout(() => pods[i].classList.add('on'), ms));
      show(2, 700); show(0, 2200);
      A.podiumTimers.push(setTimeout(() => { pods[1].classList.add('on'); confetti(canvas); }, 4000));
      A.podiumTimers.push(setTimeout(() => {
        rest.replaceChildren(...rows.slice(3).map(r => h('span', {}, `${ordinal(r.rank)} ${r.pseudo} · ${fmt(r.score)}`)));
      }, 5200));
    }).catch(e => toast(e.message));
    return [canvas, h('h1', { class: 's-title s-l', style: 'text-align:center' }, 'Podium'), wrap, rest];
  }

  function confetti(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth, H = canvas.height = canvas.offsetHeight;
    const colors = ['#e8b24a', '#c4532b', '#7fb27a', '#7d4370', '#f4ede4'];
    const ps = Array.from({ length: 220 }, () => ({
      x: Math.random() * W, y: -Math.random() * H * .6, r: 4 + Math.random() * 6,
      vx: -1.5 + Math.random() * 3, vy: 2 + Math.random() * 4, a: Math.random() * 6.28, va: -.2 + Math.random() * .4,
      c: colors[Math.floor(Math.random() * colors.length)] }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
      });
      if (t - t0 < 6000 && canvas.isConnected) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    })(t0);
  }

  // ------------------------------------------------------------------
  // Panneaux
  // ------------------------------------------------------------------
  async function openPlayers() {
    const list = h('div', { class: 'list' }, 'Chargement…');
    const close = () => drawer.remove();
    const drawer = h('div', { class: 'drawer' },
      h('header', {}, h('strong', {}, 'Joueurs'), h('button', { class: 'btn ghost', onclick: close }, 'Fermer')), list);
    document.body.append(drawer);
    const load = async () => {
      const rows = await Backend.rpc('admin_players');
      list.replaceChildren(...(rows.length ? rows : []).map(p => h('div', { class: 'pl' + (p.banned ? ' banned' : '') },
        h('span', {}, `${p.pseudo} · ${fmt(p.score)}`),
        p.banned ? h('span', { class: 'muted' }, 'exclu') :
          h('button', { class: 'btn danger', onclick: async () => { await Backend.rpc('admin_kick', { p_player: p.id }); load(); } }, 'Exclure'))));
      if (!rows.length) list.textContent = 'Aucun joueur.';
    };
    load().catch(e => (list.textContent = e.message));
  }

  function openReset() {
    const input = h('input', { class: 'input', placeholder: 'Tapez RESET' });
    const err = h('div', { class: 'error-msg' });
    const back = h('div', { class: 'modal-back' }, h('div', { class: 'modal' },
      h('h3', {}, 'Réinitialiser la partie ?'),
      h('p', { class: 'muted', style: 'margin:0' }, 'Supprime tous les joueurs et toutes les réponses, et revient au lobby.'),
      input, err,
      h('div', { style: 'display:flex;gap:.6rem;justify-content:flex-end' },
        h('button', { class: 'btn ghost', onclick: () => back.remove() }, 'Annuler'),
        h('button', { class: 'btn danger', onclick: async () => {
          try {
            setState(await Backend.rpc('admin_reset', { p_confirm: input.value.trim() }));
            A.lastBoard = []; A.view = 'main'; back.remove(); await loadStats(); render();
          } catch (e) { err.textContent = 'Tapez exactement RESET.'; }
        } }, 'Réinitialiser'))));
    document.body.append(back);
    input.focus();
  }

  function toast(msg) {
    const t = h('div', { style: 'position:fixed;top:1rem;left:50%;transform:translateX(-50%);background:var(--bad);color:#fff;padding:.7rem 1.2rem;border-radius:10px;z-index:40' }, msg);
    document.body.append(t); setTimeout(() => t.remove(), 3500);
  }

  init();
})();
