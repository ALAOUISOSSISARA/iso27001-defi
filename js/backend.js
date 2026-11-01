// Couche d'accès Supabase partagée par les deux pages.
(function () {
  const cfg = window.APP_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('VOTRE-PROJET');
  const client = configured
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  const MESSAGES = {
    PSEUDO_INVALID: 'Le pseudo doit faire entre 2 et 20 caractères.',
    PSEUDO_TAKEN: 'Ce pseudo est déjà pris, choisissez-en un autre.',
    GAME_FULL: 'La partie est complète.',
    UNKNOWN_PLAYER: 'Session expirée, rejoignez à nouveau.',
    BANNED: 'Vous avez été retiré de la partie.',
    CLOSED: 'La question est fermée.',
    TOO_LATE: 'Trop tard, le temps est écoulé !',
    ALREADY_ANSWERED: 'Vous avez déjà répondu.',
    BAD_INPUT: 'Réponse invalide.',
    NOT_ADMIN: "Ce compte n'est pas présentateur.",
  };

  async function rpc(name, params) {
    if (!client) throw new Error('NOT_CONFIGURED');
    const { data, error } = await client.rpc(name, params || {});
    if (error) {
      const code = Object.keys(MESSAGES).find(k => (error.message || '').includes(k));
      const e = new Error(code ? MESSAGES[code] : (error.message || 'Erreur réseau'));
      e.code = code || 'ERROR';
      throw e;
    }
    return data;
  }

  // Appelle cb() à chaque changement de game_state (temps réel) + filet de
  // sécurité par sondage, au cas où le Wi-Fi de l'école bloque les websockets.
  function onStateChange(cb, pollMs) {
    let channel = null;
    if (client) {
      try {
        channel = client
          .channel('game_state_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, () => cb('realtime'))
          .subscribe();
      } catch (e) { /* le sondage prend le relais */ }
    }
    const timer = setInterval(() => cb('poll'), pollMs || 3000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) cb('visible'); });
    return () => { clearInterval(timer); if (channel) client.removeChannel(channel); };
  }

  window.Backend = { client, configured, rpc, onStateChange };

  // Petits utilitaires d'affichage
  window.h = function (tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  };
  window.LETTERS = ['A', 'B', 'C', 'D'];
  window.SHAPES = ['▲', '◆', '●', '■'];
  window.fmt = n => new Intl.NumberFormat('fr-FR').format(n || 0);
  window.ordinal = n => (n === 1 ? '1er' : n + 'e');
})();
