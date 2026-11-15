// Page joueur (téléphone ou PC)
(function () {
  const app = document.getElementById('app');
  const KEY = 'iso27001_player';
  const S = {
    me: load(),            // { id, token, pseudo }
    state: null,           // retour de get_state
    status: null,          // retour de get_my_status
    offset: 0,             // décalage horloge serveur - locale (ms)
    answered: {},          // step -> { choice | value }
    lastKey: '',
    timer: null,
  };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(v) { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch (e) {} }

  if (!Backend.configured) {
    app.replaceChildren(h('div', { class: 'p-main' }, h('div', { class: 'p-center' },
      h('div', { class: 'brand' }, 'ISO ', h('em', {}, '27001')),
      h('p', { class: 'p-body' }, 'Le site n\'est pas encore configuré : renseignez config.js.'))));
    return;
  }

  // ------------------------------------------------------------------
  // Synchronisation
  // ------------------------------------------------------------------
  let refreshing = false, again = false;
  async function refresh() {
    if (refreshing) { again = true; return; }
    refreshing = true;
    try {
      const st = await Backend.rpc('get_state');
      S.offset = new Date(st.server_now).getTime() - Date.now();
      const key = [st.phase, st.step, st.started_at, st.slide_label || ''].join('|');
      const changed = key !== S.lastKey;
      S.state = st;
      if (changed) {
        S.lastKey = key;
        if (S.me && ['lobby', 'reveal', 'podium', 'question', 'slide'].includes(st.phase)) await loadStatus();
        render();
      }
    } catch (e) {
      console.warn(e);
    } finally {
      refreshing = false;
      if (again) { again = false; refresh(); }
    }
  }

  async function loadStatus() {
    try {
      S.status = await Backend.rpc('get_my_status', { p_id: S.me.id, p_token: S.me.token });
      if (S.status.answered_current && S.state && !S.answered[S.state.step]) S.answered[S.state.step] = {};
    } catch (e) {
      if (e.code === 'UNKNOWN_PLAYER') { S.me = null; S.status = null; save(null); }
      else if (e.code === 'BANNED') { S.me = { ...S.me, banned: true }; }
    }
  }

  // ------------------------------------------------------------------
  // Rendu
  // ------------------------------------------------------------------
  function top() {
    if (!S.me) return null;
    return h('div', { class: 'p-top' },
      h('span', { class: 'who' }, S.me.pseudo),
      h('span', { class: 'score' }, S.status ? fmt(S.status.score) + ' pts' : ''));
  }

  function render() {
    clearInterval(S.timer);
    app.classList.remove('incident');
    const st = S.state;
    let view;
    if (!S.me) view = viewJoin();
    else if (S.me.banned) view = center(h('p', { class: 'p-h1' }, 'Vous avez été retiré de la partie.'));
    else if (!st || st.phase === 'lobby') view = viewLobby();
    else if (st.phase === 'show') view = viewShow(st.content);
    else if (st.phase === 'question') view = st.content.kind === 'estimate' ? viewEstimate(st) : st.content.kind === 'multi' ? viewMulti(st) : viewQuestion(st);
    else if (st.phase === 'reveal') view = viewReveal(st);
    else if (st.phase === 'podium') view = viewPodium();
    else if (st.phase === 'slide') view = viewSlide(st);
    app.replaceChildren(...[top(), h('div', { class: 'p-main' }, view)].filter(Boolean));
  }

  const center = (...c) => h('div', { class: 'p-center' }, ...c);

  function viewJoin() {
    const input = h('input', { class: 'input', placeholder: 'Votre pseudo', maxlength: 20, autocomplete: 'off', autocapitalize: 'words' });
    const err = h('div', { class: 'error-msg' });
    const btn = h('button', { class: 'btn', type: 'submit' }, 'Rejoindre la partie');
    const form = h('form', { class: 'join-form', onsubmit: async ev => {
      ev.preventDefault();
      btn.disabled = true; err.textContent = '';
      try {
        const r = await Backend.rpc('register_player', { p_pseudo: input.value });
        S.me = { id: r.id, token: r.token, pseudo: r.pseudo };
        save(S.me);
        S.lastKey = '';
        await refresh();
      } catch (e) {
        err.textContent = e.message; btn.disabled = false;
      }
    } }, input, btn, err);
    setTimeout(() => input.focus(), 50);
    return center(
      h('span', { class: 'tag' }, 'Module PCA / PRA'),
      h('div', { class: 'brand' }, 'ISO ', h('em', {}, '27001'), h('span', { class: 'spark s2' }, '✦'), h('br'), h('i', {}, 'Le défi'), ' ', h('span', { class: 'spark' }, '✦')),
      h('p', { class: 'p-body' }, 'Choisissez un pseudo pour entrer dans la compétition.'),
      form);
  }

  function viewSlide(st) {
    return center(
      h('span', { class: 'tag' }, st.slide_label || 'Présentation'),
      h('p', { class: 'p-h1' }, 'Suivez la présentation'),
      h('p', { class: 'p-body' }, 'Gardez cette page ouverte : le prochain vote s\'affichera ici tout seul.'),
      h('div', { class: 'pulse-dot' }));
  }

  function viewLobby() {
    return center(
      h('div', { class: 'pulse-dot' }),
      h('p', { class: 'p-h1' }, 'Vous êtes inscrit !'),
      h('p', { class: 'p-body' }, 'Gardez cette page ouverte : vous voterez pendant la présentation, puis place au quiz final classé.'));
  }

  function viewShow(c) {
    if (c.kind === 'incident') {
      app.classList.add('incident');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      return center(
        h('span', { class: 'alarm' }, '⚠ INCIDENT EN COURS'),
        h('p', { class: 'p-h1' }, c.title),
        h('p', { class: 'p-body', style: 'color:#f1c9c9' }, c.body || ''),
        h('p', { class: 'p-body' }, 'Regardez l\'écran…'));
    }
    return center(
      h('span', { class: 'tag' }, c.clause || ''),
      h('p', { class: 'p-h1' }, c.title),
      c.body ? h('p', { class: 'p-body' }, c.body) : null,
      h('p', { class: 'p-body' }, 'La première question arrive…'));
  }

  // Minuteur commun aux questions
  function timerEl(st, onEnd) {
    const bar = h('div');
    const wrap = h('div', { class: 'timer-bar' }, bar);
    const num = h('span');
    const limit = st.content.time_limit;
    const start = new Date(st.started_at).getTime();
    const tick = () => {
      const left = Math.max(0, limit - (Date.now() + S.offset - start) / 1000);
      bar.style.transform = `scaleX(${left / limit})`;
      wrap.classList.toggle('low', left <= 5);
      num.textContent = Math.ceil(left) + ' s';
      if (left <= 0) { clearInterval(S.timer); onEnd && onEnd(); }
    };
    tick();
    S.timer = setInterval(tick, 250);
    return { wrap, num };
  }

  function questionHeader(st, num) {
    const c = st.content;
    return [
      h('div', { class: 'q-meta' }, h('span', {}, c.label ? `${c.label} · ${c.clause || ''}` : (c.clause || '')), num),
      h('p', { class: 'p-h1' }, c.title),
      c.body ? h('p', { class: 'p-body' }, c.body) : null,
      c.multiplier > 1 ? h('span', { class: 'tag', style: 'align-self:flex-start;color:var(--gold)' }, `Points ×${c.multiplier}`) : null,
    ];
  }

  const sentText = c => (c.scored === false ? 'Vote enregistré ✓ — regardez l\'écran.' : 'Réponse envoyée ✓ — attendez la révélation.');

  function waitingCard(text) {
    return h('div', { class: 'card', style: 'text-align:center' }, text);
  }

  function viewQuestion(st) {
    const step = st.step, c = st.content;
    const done = S.answered[step];
    const info = h('div', { class: 'error-msg', style: 'text-align:center' });
    const list = h('div', { class: 'answers' + (done ? ' locked' : '') });
    const t = timerEl(st, () => { if (!S.answered[step]) { list.classList.add('locked'); info.textContent = 'Temps écoulé.'; } });
    c.options.forEach((opt, i) => {
      const b = h('button', { class: `ans c${i}` + (done && done.choice === i ? ' picked' : '') },
        h('span', { class: 'shape' }, SHAPES[i]), h('span', {}, opt));
      b.addEventListener('click', async () => {
        if (S.answered[step] || list.classList.contains('locked')) return;
        S.answered[step] = { choice: i };
        list.classList.add('locked'); b.classList.add('picked');
        info.textContent = 'Envoi…';
        try {
          await Backend.rpc('submit_answer', { p_id: S.me.id, p_token: S.me.token, p_step: step, p_choice: i });
          info.textContent = '';
          info.replaceWith(waitingCard(sentText(c)));
        } catch (e) {
          if (e.code !== 'ALREADY_ANSWERED') { info.textContent = e.message; }
          else info.textContent = 'Réponse déjà enregistrée.';
        }
      });
      list.append(b);
    });
    return [
      h('div', { class: 'timer-bar-wrap' }, t.wrap),
      ...questionHeader(st, t.num),
      list,
      done ? waitingCard(sentText(c)) : info,
    ];
  }

  // Vote / question à plusieurs éléments : une option par élément
  function viewMulti(st) {
    const step = st.step, c = st.content;
    const done = S.answered[step];
    const picks = done && done.choices ? done.choices.slice() : Array(c.items.length).fill(null);
    const info = h('div', { class: 'error-msg', style: 'text-align:center' });
    const btn = h('button', { class: 'btn' });
    const wrap = h('div', { class: 'multi-list' + (done ? ' locked' : '') });
    const refresh = () => {
      const n = picks.filter(x => x != null).length;
      btn.textContent = n < c.items.length ? `Valider (${n} / ${c.items.length})` : 'Valider mes réponses';
      btn.disabled = !!S.answered[step] || n < c.items.length || wrap.classList.contains('locked');
    };
    c.items.forEach((item, k) => {
      const chips = h('div', { class: 'chips' + (c.options.length > 2 ? ' two' : '') });
      c.options.forEach((opt, i) => {
        const chip = h('button', { type: 'button', class: `chip c${i}` + (picks[k] === i ? ' on' : '') }, opt);
        chip.addEventListener('click', () => {
          if (S.answered[step] || wrap.classList.contains('locked')) return;
          picks[k] = i;
          chips.querySelectorAll('.chip').forEach((el, j) => el.classList.toggle('on', j === i));
          refresh();
        });
        chips.append(chip);
      });
      wrap.append(h('div', { class: 'mitem' }, h('div', { class: 'mtext' }, h('b', {}, (k + 1) + '. '), item), chips));
    });
    const t = timerEl(st, () => { if (!S.answered[step]) { wrap.classList.add('locked'); refresh(); info.textContent = 'Temps écoulé.'; } });
    btn.addEventListener('click', async () => {
      if (S.answered[step] || picks.some(x => x == null)) return;
      S.answered[step] = { choices: picks.slice() };
      wrap.classList.add('locked'); refresh(); info.textContent = 'Envoi…';
      try {
        await Backend.rpc('submit_answer', { p_id: S.me.id, p_token: S.me.token, p_step: step, p_choices: picks });
        info.replaceWith(waitingCard(sentText(c)));
      } catch (e) { info.textContent = e.code === 'ALREADY_ANSWERED' ? 'Réponse déjà enregistrée.' : e.message; }
    });
    refresh();
    return [t.wrap, ...questionHeader(st, t.num), wrap, btn, done ? waitingCard(sentText(c)) : info];
  }

  function viewEstimate(st) {
    const step = st.step, c = st.content;
    const done = S.answered[step];
    const min = Number(c.est_min), max = Number(c.est_max), stp = Number(c.est_step) || 1;
    let val = done && done.value != null ? done.value : Math.round((min + max) / 2 / stp) * stp;
    const out = h('div', { class: 'est-value' }, String(val), h('small', {}, c.est_unit || ''));
    const range = h('input', { type: 'range', min, max, step: stp, value: val });
    const set = v => { val = Math.min(max, Math.max(min, v)); range.value = val; out.firstChild.textContent = String(val); };
    range.addEventListener('input', () => set(Number(range.value)));
    const nudges = h('div', { class: 'est-steps' },
      [-10, -1, 1, 10].map(d => h('button', { type: 'button', onclick: () => set(val + d * stp) }, (d > 0 ? '+' : '−') + Math.abs(d))));
    const info = h('div', { class: 'error-msg', style: 'text-align:center' });
    const btn = h('button', { class: 'btn' }, 'Valider ma réponse');
    const box = h('div', { class: 'est-box' }, out, range, nudges, btn);
    const lock = () => { range.disabled = true; btn.disabled = true; nudges.querySelectorAll('button').forEach(b => (b.disabled = true)); box.style.opacity = .6; };
    const t = timerEl(st, () => { if (!S.answered[step]) { lock(); info.textContent = 'Temps écoulé.'; } });
    btn.addEventListener('click', async () => {
      if (S.answered[step]) return;
      S.answered[step] = { value: val };
      lock(); info.textContent = 'Envoi…';
      try {
        await Backend.rpc('submit_answer', { p_id: S.me.id, p_token: S.me.token, p_step: step, p_value: val });
        info.replaceWith(waitingCard(`Réponse envoyée ✓ (${val} ${c.est_unit || ''}) — attendez la révélation.`));
      } catch (e) { info.textContent = e.code === 'ALREADY_ANSWERED' ? 'Réponse déjà enregistrée.' : e.message; }
    });
    if (done) lock();
    return [
      t.wrap,
      ...questionHeader(st, t.num),
      box,
      done ? waitingCard('Réponse envoyée ✓ — attendez la révélation.') : info,
    ];
  }

  function viewReveal(st) {
    const c = st.content;
    if (!['question', 'estimate', 'multi'].includes(c.kind)) return center(h('p', { class: 'p-h1' }, c.title));
    const r = S.status && S.status.result;
    if (!r) return center(h('div', { class: 'pulse-dot' }), h('p', { class: 'p-body' }, 'Chargement du résultat…'));
    if (r.scored === false) return viewVoteResult(c, r);
    if (c.kind === 'multi') return viewVoteResult(c, r);
    if (navigator.vibrate) navigator.vibrate(r.correct ? 60 : [80, 60, 80]);
    const badge = !r.answered
      ? h('div', { class: 'result-badge none' }, '–')
      : h('div', { class: 'result-badge ' + (r.correct ? 'ok' : 'ko') }, r.correct ? '✓' : '✗');
    const headline = !r.answered ? 'Pas de réponse' : r.correct ? 'Bonne réponse !' : (c.kind === 'estimate' && r.points > 0 ? 'Pas loin !' : 'Raté…');
    const good = c.kind === 'estimate'
      ? `${Number(r.correct_value)} ${c.est_unit || ''}` + (r.value != null ? ` (vous : ${Number(r.value)} ${c.est_unit || ''})` : '')
      : `${LETTERS[r.correct_choice]} — ${c.options[r.correct_choice]}`;
    return center(
      badge,
      h('p', { class: 'p-h1' }, headline),
      h('div', { class: 'gain' }, '+' + fmt(r.points) + ' pts'),
      h('div', { class: 'rank-line' },
        h('div', { class: 'card' }, h('div', { class: 'lbl' }, 'Rang'), h('div', { class: 'big' }, ordinal(S.status.rank)), h('div', { class: 'muted' }, 'sur ' + S.status.total)),
        h('div', { class: 'card' }, h('div', { class: 'lbl' }, 'Score'), h('div', { class: 'big' }, fmt(S.status.score)), h('div', { class: 'muted' }, 'points'))),
      h('div', { class: 'card' }, h('div', { class: 'lbl' }, 'Bonne réponse'), good),
      r.explanation ? h('div', { class: 'card' }, h('div', { class: 'lbl' }, 'Pourquoi'), r.explanation) : null);
  }

  // Résultat d'un vote (non noté) : pas de points, pas de rang
  function viewVoteResult(c, r) {
    const why = r.explanation ? h('div', { class: 'card' }, h('div', { class: 'lbl' }, 'À retenir'), r.explanation) : null;
    const screen = h('p', { class: 'p-body' }, 'Les résultats de la classe sont à l\'écran.');
    if (!r.answered) return center(h('div', { class: 'result-badge none' }, '–'), h('p', { class: 'p-h1' }, 'Pas de vote cette fois'), screen, why);
    if (c.kind === 'multi') {
      const good = r.correct_items || [];
      const mine = r.choices || [];
      const n = good.length ? mine.filter((v, i) => v === good[i]).length : 0;
      const rows = c.items.map((item, i) => h('div', { class: 'mres' + (good.length ? (mine[i] === good[i] ? ' ok' : ' ko') : '') },
        h('span', {}, item),
        h('b', {}, good.length ? c.options[good[i]] : c.options[mine[i]])));
      return center(
        h('div', { class: 'result-badge small ' + (good.length ? (n === good.length ? 'ok' : 'ko') : 'none') }, good.length ? `${n}/${good.length}` : '✓'),
        h('p', { class: 'p-h1' }, good.length ? (n === good.length ? 'Sans faute !' : `${n} sur ${good.length} bien placés`) : 'Vote enregistré'),
        h('div', { class: 'card' }, h('div', { class: 'lbl' }, 'La bonne répartition'), ...rows),
        why);
    }
    const mineTxt = `${LETTERS[r.choice]} — ${c.options[r.choice]}`;
    if (r.correct_choice == null) {
      return center(
        h('div', { class: 'result-badge none' }, '✓'),
        h('p', { class: 'p-h1' }, 'Vote enregistré'),
        h('div', { class: 'card' }, h('div', { class: 'lbl' }, 'Votre vote'), mineTxt),
        screen, why);
    }
    return center(
      h('div', { class: 'result-badge ' + (r.correct ? 'ok' : 'ko') }, r.correct ? '✓' : '✗'),
      h('p', { class: 'p-h1' }, r.correct ? 'Bien vu !' : 'Pas tout à fait'),
      h('div', { class: 'card' }, h('div', { class: 'lbl' }, 'La réponse'), `${LETTERS[r.correct_choice]} — ${c.options[r.correct_choice]}`),
      why);
  }

  function viewPodium() {
    const st = S.status || {};
    const box = h('div', { class: 'card' }, h('div', { class: 'lbl' }, 'Podium'), 'Chargement…');
    Backend.rpc('get_leaderboard', { p_limit: 3 }).then(rows => {
      box.replaceChildren(h('div', { class: 'lbl' }, 'Podium'),
        ...rows.map(r => h('div', {}, `${['🥇', '🥈', '🥉'][r.rank - 1] || r.rank + '.'} ${r.pseudo} — ${fmt(r.score)} pts`)));
    }).catch(() => {});
    return center(
      h('span', { class: 'tag' }, 'Classement final'),
      h('div', { class: 'brand' }, st.rank ? ordinal(st.rank) : '—'),
      h('p', { class: 'p-body' }, `sur ${st.total || '?'} joueurs · ${fmt(st.score)} points`),
      box,
      h('p', { class: 'p-body' }, 'Merci d\'avoir joué !'));
  }

  // ------------------------------------------------------------------
  render();
  refresh();
  Backend.onStateChange(() => refresh(), 3000);
})();
