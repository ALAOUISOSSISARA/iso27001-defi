// Contenu de la présentation « ISO 27001 — Le SMSI à travers l'affaire Maersk »
// kind : 'lobby' (les téléphones restent sur l'inscription), 'html', 'vote' (étapes Supabase), 'quiz'
// steps : nombre d'appuis sur → pour faire apparaître les éléments [data-at="n"]
(function () {
  const I = {
    alert: '<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5"/><path d="M12 17.5v.01"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.6c2.9.2 5.4 2.2 5.4 5.4"/>',
    cycle: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    shield: '<path d="M12 3l8 3v6c0 4.6-3.4 8-8 9-4.6-1-8-4.4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    server: '<rect x="4" y="4" width="16" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="16" height="6.5" rx="1.5"/><path d="M8 7.2h.01M8 16.7h.01"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20"/>',
    law: '<path d="M12 3v17"/><path d="M6 21h12"/><path d="M5 7h14"/><path d="M5 7l-3 6.5a3 3 0 0 0 6 0z"/><path d="M19 7l-3 6.5a3 3 0 0 0 6 0z"/>',
    case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M20 20l-5-5"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h7"/>',
    bug: '<rect x="7" y="8" width="10" height="12" rx="5"/><path d="M12 8v12M4 12h3M17 12h3M5 18l2.5-1.5M19 18l-2.5-1.5M9 5l1.5 2M15 5l-1.5 2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3"/>',
  };
  const ic = (n, t) => `<span class="ic t${t}"><svg viewBox="0 0 24 24">${I[n]}</svg></span>`;
  const K = t => `<div class="kicker">${t}</div>`;
  const opts = (o) => `<div class="vopts">${o.map((x, i) => `<div class="vopt"><b>${'ABCD'[i]}</b><span>${x}</span></div>`).join('')}</div>`;
  const VH = '<div class="vhint">Votez sur votre téléphone</div>';

  // Graphiques construits à partir des données de la présentation
  const hbars = (rows, max, lw) => `<div class="hbars">${rows.map(r => `
    <div class="hbar${r.hl ? ' hl' : ''}"${lw ? ` style="grid-template-columns:${lw}px 1fr 90px"` : ''}><span>${r.n}</span>
      <div class="track"><div class="fill grow" style="width:${(r.v / max * 100).toFixed(1)}%"></div></div>
      <span class="v">${r.v.toLocaleString('fr-FR', { minimumFractionDigits: r.v % 1 ? 2 : 0 })}</span></div>`).join('')}</div>`;

  function columns(data, opt) {
    const W = opt.w, H = opt.h, n = data.length, bw = opt.bw, gap = (W - n * bw) / (n - 1);
    const max = opt.max;
    return `<svg viewBox="0 0 ${W} ${H + 90}" width="${W}" height="${H + 90}" style="overflow:visible">
      <line x1="0" x2="${W}" y1="${H}" y2="${H}" stroke="#0f3d33" stroke-width="2"/>
      ${data.map((d, i) => {
        const x = i * (bw + gap), h = d.v / max * H, hl = d.hl;
        return `<g><rect class="growy" style="transition-delay:${i * .12}s" x="${x}" y="${H - h}" width="${bw}" height="${h}" fill="${hl ? '#e48aa6' : '#22b2a6'}"/>
          <text x="${x + bw / 2}" y="${H - h - 18}" text-anchor="middle" font-size="30" font-weight="700" fill="${hl ? '#c9587f' : '#0f3d33'}" class="fade">${d.t}</text>
          <text x="${x + bw / 2}" y="${H + 46}" text-anchor="middle" font-size="26" fill="#5f6b6a">${d.x}</text></g>`;
      }).join('')}</svg>`;
  }

  window.SLIDES = [
  // 1 ─ Page de garde
  { kind: 'lobby', label: 'Accueil', html: () => `
    <div style="display:grid;grid-template-columns:1.25fr .75fr;align-items:center;height:100%">
      <div>
        <div style="font-size:22px;font-weight:600;letter-spacing:.22em;color:var(--accent)">ENSA MARRAKECH · MODULE PCA / PRA <span style="color:var(--rose);letter-spacing:0">✿</span></div>
        <h1 style="font-size:190px;margin-top:40px;line-height:.92">ISO 27001</h1>
        <h2 style="font-size:52px;font-weight:600;margin-top:28px;max-width:1000px;line-height:1.2">Le SMSI, ou comment ne plus dépendre de la <em>chance</em></h2>
        <div style="display:grid;grid-template-columns:auto auto;gap:90px;margin-top:84px;justify-content:start">
          <div style="border-top:2px solid var(--text);padding-top:22px">
            <div style="font-size:18px;letter-spacing:.2em;font-weight:600;color:var(--accent-ink)">PRÉPARÉ PAR</div>
            <div style="font-size:27px;line-height:1.6;margin-top:12px">El Ouarzazi Aya<br>Alaoui Sossi Sara<br>Elamiri Laila<br>Ezbiri Amira<br>Jamiri Sara</div>
          </div>
          <div style="border-top:2px solid var(--text);padding-top:22px">
            <div style="font-size:18px;letter-spacing:.2em;font-weight:600;color:var(--accent-ink)">ENCADRÉ PAR</div>
            <div style="font-size:27px;line-height:1.6;margin-top:12px">Pr. ABBASS Wissam</div>
          </div>
        </div>
      </div>
      <svg viewBox="0 0 600 700" width="600" height="700" style="justify-self:end">
        <circle cx="330" cy="300" r="230" fill="#22b2a6" class="fade"/>
        <circle cx="200" cy="470" r="150" fill="#0f3d33" class="fade" style="transition-delay:.4s"/>
        <circle cx="470" cy="520" r="96" fill="none" stroke="#e48aa6" stroke-width="18" class="fade" style="transition-delay:.7s"/>
        <circle cx="160" cy="170" r="34" fill="#e48aa6" class="fade" style="transition-delay:.9s"/>
        <path d="M290 250 330 230 370 250v52c0 32-18 54-40 62-22-8-40-30-40-62z" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round" class="fade" style="transition-delay:.6s"/>
        <path d="M312 300l14 14 26-30" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" class="fade" style="transition-delay:.8s"/>
      </svg>
    </div>` },

  // 2 ─ À vous de jouer (QR + compteur)
  { kind: 'lobby', label: 'À vous de jouer', html: c => `
    ${K('À vous de jouer')}
    <div class="split">
      <div>
        <h1>Sortez vos <em>téléphones.</em></h1>
        <p class="lead">Scannez, entrez votre prénom et gardez la page ouverte. Vous voterez pendant toute la présentation.</p>
        <p class="lead" style="color:var(--text);font-weight:600">Le quiz final est classé en direct.</p>
        <div style="margin-top:56px;font-size:30px"><span id="lobby-count" style="font-size:96px;font-weight:800;color:var(--accent)">0</span>&nbsp; connectés</div>
      </div>
      <div class="qrbox">${c.qr(c.site)}<div class="u">${c.siteShort}</div></div>
    </div>` },

  // 3 ─ 27 juin 2017
  { kind: 'html', label: 'L\'affaire Maersk', steps: 4, html: () => `
    ${K('27 juin 2017 · Copenhague')}
    <h1 class="case" style="max-width:1450px">Une mise à jour d'un logiciel comptable ukrainien. Quelques minutes plus tard, Maersk <em>ne voit plus rien.</em></h1>
    <svg viewBox="0 0 1600 320" width="1600" height="320" style="margin-top:80px;overflow:visible">
      <line x1="60" x2="1455" y1="70" y2="70" stroke="#dbe3e1" stroke-width="4"/>
      ${[['Mise à jour piégée', 'Le logiciel M.E.Doc,', 'en Ukraine'], ['Faille + identifiants', 'EternalBlue et', 'mots de passe volés'], ['Propagation mondiale', 'Un réseau plat,', 'sans barrière'], ['Disques effacés', 'Fausse rançon,', 'vrai « wiper »']].map((t, i) => {
        const x = 60 + i * 465; const col = ['#22b2a6', '#0f3d33', '#636b6f', '#e48aa6'][i];
        return `<g data-at="${i + 1}">
          ${i ? `<line x1="${x - 465}" x2="${x}" y1="70" y2="70" stroke="${col}" stroke-width="4"/>` : ''}
          <circle cx="${x}" cy="70" r="46" fill="${col}"/><text x="${x}" y="82" text-anchor="middle" font-size="34" font-weight="800" fill="#fff">${i + 1}</text>
          <text x="${x - 46}" y="180" font-size="32" font-weight="700" fill="#0f3d33">${t[0]}</text>
          <text x="${x - 46}" y="226" font-size="26" fill="#5f6b6a">${t[1]}</text>
          <text x="${x - 46}" y="262" font-size="26" fill="#5f6b6a">${t[2]}</text></g>`;
      }).join('')}
    </svg>` },

  // 4 ─ Le bilan
  { kind: 'html', label: 'L\'affaire Maersk', html: () => `
    ${K('Le bilan')}
    <h1>Dix jours pour <em>tout reconstruire</em></h1>
    <div class="stats">
      <div class="stat"><div class="n" data-count="45000">45 000</div><div class="l">postes de travail à réinstaller</div></div>
      <div class="stat"><div class="n" data-count="4000">4 000</div><div class="l">serveurs détruits</div></div>
      <div class="stat"><div class="n">≈ <span data-count="10">10</span></div><div class="l">jours pour reconstruire le réseau</div></div>
      <div class="stat"><div class="n">≈ <span data-count="300">300</span> M$</div><div class="l">de pertes estimées</div></div>
    </div>` },

  // 5 ─ Bilan mondial
  { kind: 'html', label: 'L\'affaire Maersk', html: () => `
    ${K('Le bilan, à l\'échelle mondiale')}
    <div style="display:grid;grid-template-columns:1.35fr .65fr;gap:110px;align-items:end">
      <div>
        <h1 class="sm">Maersk n'était qu'une <em>victime parmi d'autres</em></h1>
        <div style="font-size:22px;color:var(--muted);margin-top:30px">Pertes déclarées, en millions de dollars</div>
        ${hbars([{ n: 'Merck (pharmacie)', v: 870 }, { n: 'FedEx (TNT Express)', v: 400 }, { n: 'Saint-Gobain', v: 384 }, { n: 'Maersk', v: 300, hl: 1 }, { n: 'Mondelēz', v: 188 }, { n: 'Reckitt Benckiser', v: 129 }], 870)}
      </div>
      <div style="border-top:2px solid var(--text);padding-top:28px">
        <div style="font-size:24px;color:var(--muted)">Au total, environ</div>
        <div style="font-size:150px;font-weight:800;color:var(--rose-deep);line-height:1;letter-spacing:-.03em">10 Md$</div>
        <div style="font-size:24px;color:var(--muted);margin-top:16px;line-height:1.45">de dégâts dans le monde, selon l'estimation de la Maison-Blanche.</div>
      </div>
    </div>
    <div class="src">Source : Wired, « The Untold Story of NotPetya » (2018), montants approximatifs déclarés par les entreprises.</div>` },

  // 6 ─ VOTE 1
  { kind: 'vote', label: 'Vote 1', vote: [0], html: () => `
    ${K('Vote 1 · Hypothèse')}
    <h1 class="case">Puis ils ont trouvé un seul serveur intact. <em>Qu'est-ce qui l'a sauvé ?</em></h1>
    ${opts(['Un antivirus haut de gamme', 'Une sauvegarde hors ligne bien planifiée', 'Un pare-feu parfaitement configuré', 'Autre chose…'])}${VH}` },

  // 7 ─ Le programme
  { kind: 'html', label: 'Le programme', html: () => `
    ${K('Le programme')}
    <h1>Cinq parties, <em>une seule histoire</em></h1>
    <div class="rows">
      <div class="row2"><span class="no">01</span><span>Principes fondamentaux</span><span></span></div>
      <div class="row2"><span class="no">02</span><span>Cycle PDCA et structure de la norme</span><span></span></div>
      <div class="row2"><span class="no">03</span><span>Annexe A : les 93 contrôles</span><span></span></div>
      <div class="row2"><span class="no">04</span><span>Mettre en œuvre un SMSI</span><span></span></div>
      <div class="row2"><span class="no">05</span><span>Certification, avantages et limites</span><span></span></div>
      <div class="row2 star"><span class="no">✿</span><span>Quiz final et fin de l'histoire</span><span class="who">Toute l'équipe</span></div>
    </div>` },

  // 8 ─ 01 SMSI
  { kind: 'html', label: '01 · Principes fondamentaux', html: () => `
    ${K('01 / Principes fondamentaux')}
    <h1>Un SMSI est un système de management, <em>pas un outil</em></h1>
    <p class="lead">ISO/IEC 27001:2022 fixe les exigences pour établir, mettre en œuvre, maintenir et améliorer en continu un Système de Management de la Sécurité de l'Information.</p>
    <div class="cols c3">
      <div class="col">${ic('alert', 0)}<h3>Les risques d'abord</h3><p>On protège ce qui compte, à la hauteur du risque réel.</p></div>
      <div class="col">${ic('users', 2)}<h3>La direction s'engage</h3><p>Elle signe la politique, fixe les rôles et donne les moyens.</p></div>
      <div class="col">${ic('cycle', 4)}<h3>On s'améliore sans cesse</h3><p>Le système se mesure, s'audite et se corrige en permanence.</p></div>
    </div>` },

  // 9 ─ CID
  { kind: 'html', label: '01 · Principes fondamentaux', steps: 3, html: () => `
    ${K('01 / Principes fondamentaux')}
    <h1>Trois propriétés <em>à protéger</em></h1>
    <div class="cols c3">
      <div class="col" data-at="1"><span class="ic t0 letter">C</span><h3>Confidentialité</h3><p>Seules les personnes autorisées accèdent à l'information.</p><p class="ex">Exemple : fuite d'une base de clients.</p></div>
      <div class="col" data-at="2"><span class="ic t2 letter" style="color:#fff">I</span><h3>Intégrité</h3><p>L'information reste exacte, complète et non altérée.</p><p class="ex">Exemple : un virement modifié en transit.</p></div>
      <div class="col" data-at="3"><span class="ic t4 letter">D</span><h3>Disponibilité</h3><p>L'information est accessible quand on en a besoin.</p><p class="ex">Exemple : serveurs chiffrés par un rançongiciel.</p></div>
    </div>` },

  // 10 ─ VOTE 2
  { kind: 'vote', label: 'Vote 2', vote: [1], html: () => `
    ${K('Vote 2 · Retour chez Maersk')}
    <h1>Chez Maersk, quel pilier a cédé <em>en premier ?</em></h1>
    ${opts(['Confidentialité', 'Intégrité', 'Disponibilité'])}${VH}` },

  // 11 ─ Risque
  { kind: 'html', label: '01 · Principes fondamentaux', html: () => `
    ${K('01 / Principes fondamentaux')}
    <h1>Risque = Vraisemblance <em>×</em> Impact</h1>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:140px;align-items:center;margin-top:64px">
      <div>
        <div class="mx">
          <div class="h">Forte</div><div class="cell lv2">3</div><div class="cell lv3">6</div><div class="cell lv3">9</div>
          <div class="h">Moyenne</div><div class="cell lv1">2</div><div class="cell lv2">4</div><div class="cell lv3">6</div>
          <div class="h">Faible</div><div class="cell lv1">1</div><div class="cell lv1">2</div><div class="cell lv2">3</div>
          <div></div><div class="h c">Faible</div><div class="h c">Moyen</div><div class="h c">Fort</div>
        </div>
        <div class="legend"><span>Lignes : vraisemblance · Colonnes : impact</span><span><i style="background:var(--rose)"></i>6 et plus = risque élevé</span></div>
      </div>
      <div>
        <h2>Quatre façons de traiter un risque</h2>
        <div class="rows" style="margin-top:28px">
          <div class="row2" style="grid-template-columns:240px 1fr"><span style="font-weight:700;color:var(--accent-ink)">Réduire</span><span style="font-size:28px">mettre en place des contrôles</span></div>
          <div class="row2" style="grid-template-columns:240px 1fr"><span style="font-weight:700;color:var(--accent-ink)">Transférer</span><span style="font-size:28px">assurance, sous-traitance</span></div>
          <div class="row2" style="grid-template-columns:240px 1fr"><span style="font-weight:700;color:var(--accent-ink)">Éviter</span><span style="font-size:28px">arrêter l'activité qui expose</span></div>
          <div class="row2" style="grid-template-columns:240px 1fr"><span style="font-weight:700;color:var(--accent-ink)">Accepter</span><span style="font-size:28px">décision formelle et documentée</span></div>
        </div>
      </div>
    </div>` },

  // 12 ─ PDCA
  { kind: 'html', label: '02 · PDCA et structure', steps: 4, html: () => {
    const arc = (a0, a1, r0, r1) => {
      const p = (a, r) => [640 / 2 + r * Math.cos(a), 640 / 2 + r * Math.sin(a)].map(v => v.toFixed(1)).join(' ');
      return `M${p(a0, r1)} A${r1} ${r1} 0 0 1 ${p(a1, r1)} L${p(a1, r0)} A${r0} ${r0} 0 0 0 ${p(a0, r0)}Z`;
    };
    const seg = [['P', '#0f3d33'], ['D', '#22b2a6'], ['C', '#636b6f'], ['A', '#e48aa6']];
    const g = 0.04;
    const parts = seg.map((s, i) => {
      const a0 = -Math.PI / 2 + i * Math.PI / 2 + g, a1 = a0 + Math.PI / 2 - 2 * g, am = (a0 + a1) / 2;
      return `<g data-at="${i + 1}"><path d="${arc(a0, a1, 150, 300)}" fill="${s[1]}"/>
        <text x="${(320 + 225 * Math.cos(am)).toFixed(0)}" y="${(320 + 225 * Math.sin(am) + 26).toFixed(0)}" text-anchor="middle" font-size="76" font-weight="800" fill="${i === 3 ? '#0f3d33' : '#fff'}">${s[0]}</text></g>`;
    }).join('');
    return `
    ${K('02 / Cycle PDCA')}
    <div style="display:grid;grid-template-columns:auto 1fr;gap:130px;align-items:center">
      <svg viewBox="0 0 640 640" width="620" height="620">${parts}
        <text x="320" y="312" text-anchor="middle" font-size="30" font-weight="700" fill="#0f3d33">Amélioration</text>
        <text x="320" y="350" text-anchor="middle" font-size="30" font-family="Playfair Display" font-style="italic" fill="#c9587f">continue</text></svg>
      <div>
        <h1 class="sm">Le PDCA est le squelette <em>de la norme</em></h1>
        <div class="rows" style="margin-top:40px">
          <div class="row2" data-at="1" style="grid-template-columns:330px 1fr"><b style="color:#0f3d33">Plan · clauses 4 à 7</b><span style="font-size:27px;color:var(--muted)">Contexte, leadership, risques, objectifs.</span></div>
          <div class="row2" data-at="2" style="grid-template-columns:330px 1fr"><b style="color:var(--accent-ink)">Do · clause 8</b><span style="font-size:27px;color:var(--muted)">On traite les risques, on applique les contrôles.</span></div>
          <div class="row2" data-at="3" style="grid-template-columns:330px 1fr"><b style="color:#4f5859">Check · clause 9</b><span style="font-size:27px;color:var(--muted)">Mesures, audit interne, revue de direction.</span></div>
          <div class="row2" data-at="4" style="grid-template-columns:330px 1fr"><b style="color:var(--rose-deep)">Act · clause 10</b><span style="font-size:27px;color:var(--muted)">On corrige les écarts, puis on recommence.</span></div>
        </div>
      </div>
    </div>`; } },

  // 13 ─ VOTE 3
  { kind: 'vote', label: 'Vote 3', vote: [2], html: () => `
    ${K('Vote 3 · Placez-les dans le cycle')}
    <h1>P, D, C ou <em>A ?</em></h1>
    <div class="vopts" style="grid-template-columns:1fr 1fr 1fr">
      ${['Réaliser un audit interne', 'Apprécier les risques', 'Corriger une non-conformité', 'Déployer le MFA sur le VPN', 'Revue de direction', 'Définir le périmètre du SMSI'].map((t, i) => `<div class="vopt" style="grid-template-columns:70px 1fr"><span style="font-weight:700;color:var(--accent);font-size:24px">0${i + 1}</span><span>${t}</span></div>`).join('')}
    </div>${VH}` },

  // 14 ─ Structure
  { kind: 'html', label: '02 · PDCA et structure', html: () => `
    ${K('02 / Structure de la norme')}
    <h1 class="sm">Dix clauses <em>et une annexe</em></h1>
    <table class="t" style="font-size:24px;margin-top:40px">
      <tr><th style="width:150px">Clause</th><th>Contenu</th><th style="width:130px">PDCA</th><th style="width:220px">Statut</th></tr>
      <tr><td class="k">0 à 3</td><td class="muted">Introduction, domaine, références, termes</td><td>—</td><td><span class="pill gray">Informatif</span></td></tr>
      <tr><td class="k">4</td><td>Contexte de l'organisme, périmètre</td><td><b>P</b></td><td><span class="pill">Exigence</span></td></tr>
      <tr><td class="k">5</td><td>Leadership, politique, rôles</td><td><b>P</b></td><td><span class="pill">Exigence</span></td></tr>
      <tr><td class="k">6</td><td>Planification : risques, objectifs</td><td><b>P</b></td><td><span class="pill">Exigence</span></td></tr>
      <tr><td class="k">7</td><td>Support : ressources, compétences, documents</td><td><b>P</b></td><td><span class="pill">Exigence</span></td></tr>
      <tr><td class="k">8</td><td>Fonctionnement : traitement des risques</td><td><b>D</b></td><td><span class="pill">Exigence</span></td></tr>
      <tr><td class="k">9</td><td>Évaluation des performances</td><td><b>C</b></td><td><span class="pill">Exigence</span></td></tr>
      <tr><td class="k">10</td><td>Amélioration</td><td><b>A</b></td><td><span class="pill">Exigence</span></td></tr>
      <tr class="hl"><td class="k">Annexe A</td><td>93 contrôles de référence</td><td><b>D</b></td><td><span class="pill rose">Via la DdA</span></td></tr>
    </table>` },

  // 15 ─ Mythe ou réalité
  { kind: 'html', label: '02 · PDCA et structure', steps: 3, html: () => `
    ${K('02 / Structure de la norme')}
    <h1>Mythe <em>ou réalité ?</em></h1>
    <div class="rows" style="margin-top:48px">
      ${[['« Il faut appliquer les 93 contrôles de l\'Annexe A. »', 'Chaque contrôle est examiné. La Déclaration d\'applicabilité justifie ce qu\'on retient et ce qu\'on exclut.'],
         ['« Le certificat couvre toute l\'entreprise. »', 'Il couvre le périmètre déclaré : un site, un service, un datacenter. Toujours lire le périmètre.'],
         ['« ISO 27001, c\'est l\'affaire de l\'équipe IT. »', 'Direction, RH, juridique, achats et fournisseurs sont concernés. C\'est un système de management.']].map((r, i) => `
        <div style="display:grid;grid-template-columns:1fr 150px 1fr;gap:48px;align-items:center;padding:30px 0;border-bottom:1px solid var(--line)">
          <span style="font-size:32px;font-weight:600">${r[0]}</span>
          <span data-at="${i + 1}" class="pill rose" style="font-size:22px;justify-self:start">MYTHE</span>
          <span data-at="${i + 1}" style="font-size:25px;color:var(--muted);line-height:1.45">${r[1]}</span>
        </div>`).join('')}
    </div>` },

  // 16 ─ Annexe A 4 thèmes
  { kind: 'html', label: '03 · Annexe A', html: () => `
    ${K('03 / Annexe A')}
    <h1>93 contrôles, <em>rangés en 4 thèmes</em></h1>
    <div style="display:flex;height:84px;margin-top:64px;gap:6px">
      ${[[37, '#22b2a6', '37 · Organisationnels', '#fff'], [8, '#e48aa6', '8', '#0f3d33'], [14, '#636b6f', '14', '#fff'], [34, '#0f3d33', '34 · Technologiques', '#fff']].map(([n, c, t, f], i) =>
        `<div class="grow" style="flex:${n};background:${c};color:${f};display:flex;align-items:center;padding-left:22px;font-size:26px;font-weight:700;transition-delay:${i * .15}s">${t}</div>`).join('')}
    </div>
    <div class="cols c4" style="margin-top:64px">
      <div class="col"><div class="code">5.1 → 5.37</div><h3>Organisationnels</h3><p>Politiques, fournisseurs, incidents, continuité</p></div>
      <div class="col"><div class="code" style="color:var(--rose-deep)">6.1 → 6.8</div><h3>Humains</h3><p>Recrutement, sensibilisation, télétravail</p></div>
      <div class="col"><div class="code" style="color:#4f5859">7.1 → 7.14</div><h3>Physiques</h3><p>Locaux, accès, équipements, supports</p></div>
      <div class="col"><div class="code" style="color:var(--text)">8.1 → 8.34</div><h3>Technologiques</h3><p>Accès, chiffrement, sauvegarde, réseau, développement</p></div>
    </div>
    <div class="src">Version 2013 : 114 contrôles en 14 domaines. Version 2022 : regroupés, fusionnés, et 11 nouveaux.</div>` },

  // 17 ─ VOTE 4
  { kind: 'vote', label: 'Vote 4', vote: [3], html: () => `
    ${K('Vote 4 · Devinez le thème')}
    <h1 class="sm">Organisationnel, humain, physique <em>ou technologique ?</em></h1>
    <div class="rows" style="margin-top:44px">
      ${['Quelqu\'un entre dans la salle serveurs derrière vous, sans badger.', 'Une fausse campagne de phishing pour entraîner le personnel.', 'Le VPN demande un code sur le téléphone en plus du mot de passe.', 'La direction signe et diffuse la politique de sécurité.'].map((t, i) => `<div class="row2" style="grid-template-columns:90px 1fr"><span class="no">0${i + 1}</span><span style="font-size:32px">${t}</span></div>`).join('')}
    </div>${VH}` },

  // 18 ─ 114 → 93
  { kind: 'html', label: '03 · Annexe A', html: () => {
    const s = 1250 / 114;
    return `
    ${K('03 / Annexe A · version 2022')}
    <h1>De 114 <em>à 93 contrôles</em></h1>
    <div style="margin-top:72px;display:grid;grid-template-columns:140px 1fr;row-gap:36px;align-items:center;font-size:26px">
      <b>2013</b><div style="display:flex;align-items:center;gap:24px"><div class="grow" style="width:${114 * s}px;height:64px;background:#cfd6d4"></div><span class="muted">114 contrôles · 14 domaines</span></div>
      <b>2022</b><div style="display:flex;align-items:center;gap:6px">
        <div class="grow" style="width:${58 * s}px;height:64px;background:#22b2a6;color:#fff;display:flex;align-items:center;padding-left:18px;font-weight:700">58 révisés</div>
        <div class="grow" style="width:${24 * s}px;height:64px;background:#0f3d33;color:#fff;display:flex;align-items:center;padding-left:18px;font-weight:700;transition-delay:.15s">24 fusionnés</div>
        <div class="grow" style="width:${11 * s}px;height:64px;background:#e48aa6;color:#0f3d33;display:flex;align-items:center;justify-content:center;font-weight:800;transition-delay:.3s">11</div></div>
    </div>
    <div class="cols c3" style="margin-top:72px">
      <div class="col"><h3 style="margin-top:0">58 révisés</h3><p>Même sujet qu'en 2013, texte mis à jour.</p></div>
      <div class="col"><h3 style="margin-top:0">24 fusionnés</h3><p>Ils regroupent 57 anciens contrôles qui se recoupaient.</p></div>
      <div class="col" style="border-top-color:var(--rose)"><h3 style="margin-top:0;color:var(--rose-deep)">11 nouveaux</h3><p>Cloud, menaces, données : détaillés sur la slide suivante.</p></div>
    </div>
    <div class="src">Barres à l'échelle du nombre de contrôles. Source : BSI, « ISO/IEC 27001:2022 — What's changed ».</div>`; } },

  // 19 ─ 11 nouveaux
  { kind: 'html', label: '03 · Annexe A', html: () => `
    ${K('03 / Annexe A')}
    <h1>Les 11 nouveaux contrôles <em>de 2022</em></h1>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0 56px;margin-top:56px">
      ${[['5.7', 'Renseignement sur les menaces'], ['5.23', 'Sécurité des services cloud'], ['5.30', 'Préparation des TIC pour la continuité d\'activité', 1], ['7.4', 'Surveillance de la sécurité physique'], ['8.9', 'Gestion de la configuration'], ['8.10', 'Suppression des informations'], ['8.11', 'Masquage des données'], ['8.12', 'Prévention de la fuite de données'], ['8.16', 'Activités de surveillance'], ['8.23', 'Filtrage web'], ['8.28', 'Codage sécurisé']].map(([c, t, hl]) => `
        <div style="padding:22px 0;border-bottom:1px solid var(--line)">
          <div style="font-size:24px;font-weight:800;color:${hl ? 'var(--rose-deep)' : 'var(--accent)'}">${c}${hl ? ' <span class="pill rose" style="font-size:15px;vertical-align:3px">lien PCA/PRA</span>' : ''}</div>
          <div style="font-size:25px;margin-top:6px;line-height:1.3">${t}</div></div>`).join('')}
    </div>
    <p class="lead" style="margin-top:44px">Cloud, données, menaces actuelles : la norme <em class="serif">rattrape son époque.</em></p>` },

  // 20 ─ Lien PCA/PRA
  { kind: 'html', label: '03 · Annexe A', dark: true, html: () => `
    ${K('03 / Le lien avec notre module')}
    <h1>Là où ISO 27001 <em>rejoint le PCA/PRA</em></h1>
    <div class="cols c2" style="row-gap:56px;margin-top:80px">
      <div class="col"><div class="code" style="color:#9fdcd5">5.29</div><h3>Sécurité de l'information durant une perturbation</h3></div>
      <div class="col" style="border-top-color:#e48aa6"><div class="code" style="color:#f3a9c0">5.30 · nouveau</div><h3>Préparation des TIC pour la continuité d'activité</h3></div>
      <div class="col"><div class="code" style="color:#9fdcd5">8.13</div><h3>Sauvegarde des informations</h3></div>
      <div class="col"><div class="code" style="color:#9fdcd5">8.14</div><h3>Redondance des moyens de traitement</h3></div>
    </div>
    <p class="lead" style="margin-top:64px;color:#fff">ISO 27001 exige de <em class="serif" style="color:#f3a9c0">prévoir</em> la continuité. ISO 22301 détaille comment la <em class="serif" style="color:#f3a9c0">gérer.</em></p>` },

  // 21 ─ Démo 8.13 / 5.30
  { kind: 'html', label: '03 · Annexe A', steps: 3, html: () => `
    ${K('03 / Démonstration · contrôles 8.13 et 5.30')}
    <h1>Une sauvegarde doit être <em>débranchée</em></h1>
    <svg viewBox="0 0 1600 520" width="1600" height="520" style="margin-top:56px;overflow:visible">
      <line x1="300" x2="760" y1="210" y2="210" stroke="#0f3d33" stroke-width="5"/>
      <line x1="1040" x2="1180" y1="210" y2="210" stroke="#0f3d33" stroke-width="5" stroke-dasharray="4 18" stroke-linecap="round"/>
      <text x="1150" y="262" text-anchor="middle" font-size="22" fill="#5f6b6a">câble débranché</text>
      ${[[180, 'Serveur', 'production'], [900, 'Sauvegarde', 'en ligne'], [1400, 'Sauvegarde', 'hors ligne']].map(([x, a, b], i) => `
        <circle cx="${x}" cy="210" r="120" fill="${i === 2 ? '#0f3d33' : '#22b2a6'}"/>
        <g transform="translate(${x - 44} ${166}) scale(3.7)" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I.server}</g>
        <text x="${x}" y="390" text-anchor="middle" font-size="32" font-weight="700" fill="#0f3d33">${a}</text>
        <text x="${x}" y="430" text-anchor="middle" font-size="27" fill="#5f6b6a">${b}</text>`).join('')}
      <g data-at="1"><circle cx="180" cy="210" r="120" fill="#e48aa6"/><text x="180" y="226" text-anchor="middle" font-size="42" font-weight="800" fill="#0f3d33">CHIFFRÉ</text></g>
      <g data-at="2"><circle cx="900" cy="210" r="120" fill="#e48aa6"/><text x="900" y="226" text-anchor="middle" font-size="42" font-weight="800" fill="#0f3d33">CHIFFRÉE</text>
        <text x="530" y="190" text-anchor="middle" font-size="24" font-weight="600" fill="#c9587f">le rançongiciel suit le câble</text></g>
      <g data-at="3"><circle cx="1400" cy="210" r="132" fill="none" stroke="#22b2a6" stroke-width="10"/>
        <text x="1400" y="490" text-anchor="middle" font-size="30" font-weight="800" fill="#12877d">INTACTE → on restaure</text></g>
    </svg>
    <div class="legend" style="font-size:24px">1. L'attaque chiffre le serveur · 2. puis toute sauvegarde joignable · 3. seule la copie hors ligne survit</div>` },

  // 22 ─ VOTE 5
  { kind: 'vote', label: 'Vote 5', vote: [4], html: () => `
    ${K('Vote 5 · Retour chez Maersk')}
    <h1>Quel contrôle aurait <em>limité les dégâts ?</em></h1>
    ${opts(['8.8 · Gestion des vulnérabilités techniques', '8.22 · Cloisonnement des réseaux', '8.13 · Sauvegarde des informations, hors ligne', '5.30 · Préparation des TIC pour la continuité'])}${VH}` },

  // 23 ─ Démo 8.22
  { kind: 'html', label: '03 · Annexe A', steps: 2, html: () => {
    const grid = (ox, seg) => {
      let out = '', nodes = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) nodes.push([ox + 70 + c * 150, 90 + r * 130, r, c]);
      if (!seg) {
        nodes.forEach(a => nodes.forEach(b => { if ((a[2] === b[2] && Math.abs(a[3] - b[3]) === 1) || (a[3] === b[3] && Math.abs(a[2] - b[2]) === 1)) out += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#c9d4d1" stroke-width="4"/>`; }));
      } else {
        nodes.forEach(a => nodes.forEach(b => { if (a[2] === b[2] && Math.abs(a[3] - b[3]) === 1) out += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#c9d4d1" stroke-width="4"/>`; }));
        [0, 1].forEach(r => { out += `<line x1="${ox}" x2="${ox + 590}" y1="${155 + r * 130}" y2="${155 + r * 130}" stroke="#0f3d33" stroke-width="8"/><text x="${ox + 600}" y="${163 + r * 130}" font-size="20" font-weight="700" fill="#0f3d33">pare-feu</text>`; });
      }
      nodes.forEach(([x, y]) => { out += `<circle cx="${x}" cy="${y}" r="34" fill="#22b2a6"/>`; });
      nodes.forEach(([x, y, r, c]) => {
        const hit = !seg || r === 0;
        const d = seg ? c * .25 : (r + c) * .22;
        if (hit) out += `<circle cx="${x}" cy="${y}" r="34" fill="#e48aa6" class="inf" style="transition-delay:${d.toFixed(2)}s"/>`;
      });
      return out;
    };
    return `
    ${K('03 / Démonstration · contrôle 8.22')}
    <h1>Le même ver, <em>deux réseaux</em></h1>
    <style>.inf{opacity:0;transition:opacity .4s}.slide [data-at="1"].on .inf{opacity:1}</style>
    <svg viewBox="0 0 1600 470" width="1600" height="470" style="margin-top:56px;overflow:visible">
      <text x="0" y="20" font-size="30" font-weight="700" fill="#0f3d33">Réseau à plat</text>
      <text x="900" y="20" font-size="30" font-weight="700" fill="#0f3d33">Réseau cloisonné</text>
      <g transform="translate(0 30)">${grid(0, false)}</g>
      <g transform="translate(0 30)">${grid(900, true)}</g>
      <g data-at="1" style="transform:none"><g transform="translate(0 30)">${grid(0, false).replace(/<line[^>]*>/g, '').replace(/<circle[^>]*fill="#22b2a6"\/>/g, '')}${grid(900, true).replace(/<(line|text)[^>]*>([^<]*<\/text>)?/g, '').replace(/<circle[^>]*fill="#22b2a6"\/>/g, '')}</g></g>
      <g data-at="2"><text x="0" y="470" font-size="30" font-weight="800" fill="#c9587f">12 machines sur 12 tombent</text>
        <text x="900" y="470" font-size="30" font-weight="800" fill="#12877d">4 sur 12 : l'attaque reste dans sa zone</text></g>
    </svg>`; } },

  // 24 ─ Pas seulement Maersk
  { kind: 'html', label: '03 · Annexe A', html: () => `
    ${K('03 / Pas seulement Maersk')}
    <h1>Les mêmes failles, <em>ailleurs</em></h1>
    <div class="cols c3" style="margin-top:64px">
      ${[['2017', 'Equifax', 'Une faille Apache Struts connue, corrigée en mars. Le correctif n\'est pas appliqué ; l\'attaque commence en mai.', '147 M', 'de personnes exposées', '8.8 Vulnérabilités techniques · 5.9 Inventaire des actifs'],
         ['2020', 'SolarWinds', 'Des pirates piègent les mises à jour du logiciel Orion. Les clients installent eux-mêmes la porte dérobée.', '≈ 18 000', 'clients ont installé la version piégée', '5.21 Chaîne d\'approvisionnement TIC · 8.16 Surveillance'],
         ['2021', 'Colonial Pipeline', 'Un ancien compte VPN, un mot de passe déjà fuité, aucune double authentification.', '6 jours', 'd\'arrêt de l\'oléoduc, 4,4 M$ de rançon', '8.5 Authentification sécurisée · 5.18 Droits d\'accès']].map(c => `
        <div class="col"><div class="code">${c[0]}</div><h3 style="margin-top:12px">${c[1]}</h3><p style="font-size:23px">${c[2]}</p>
          <div style="font-size:72px;font-weight:800;color:var(--rose-deep);margin-top:26px;line-height:1">${c[3]}</div>
          <p style="font-size:22px;margin-top:8px">${c[4]}</p><p class="ex" style="font-size:20px">${c[5]}</p></div>`).join('')}
    </div>
    <div class="src" style="font-size:16px">Sources : Equifax et Apache (2017) ; SolarWinds, déclaration à la SEC (déc. 2020) ; Colonial Pipeline et FireEye (2021).</div>` },

  // 25 ─ Six étapes
  { kind: 'html', label: '04 · Mise en œuvre', steps: 6, html: () => `
    ${K('04 / Mise en œuvre d\'un SMSI')}
    <h1>Six étapes pour <em>construire un SMSI</em></h1>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:56px 72px;margin-top:72px">
      ${[['Périmètre et contexte', 'Ce qu\'on protège, où, et pour quelles parties intéressées.'], ['Engagement de la direction', 'Politique de sécurité signée, rôles attribués, budget validé.'], ['Appréciation des risques', 'Actifs, menaces, vulnérabilités : chaque risque est évalué.'], ['Traitement et DdA', 'Choix des contrôles, plan de traitement, Déclaration d\'applicabilité.'], ['Déploiement et formation', 'Appliquer les contrôles, sensibiliser, produire des preuves.'], ['Audit interne et revue', 'Vérifier que tout fonctionne, décider des améliorations… puis recommencer.']].map((s, i) => `
        <div data-at="${i + 1}" style="display:grid;grid-template-columns:96px 1fr;gap:28px;align-items:start">
          <span class="ic t${[0, 2, 3, 0, 2, 4][i]} letter" style="width:96px;height:96px;font-size:40px;${i === 4 ? 'color:#fff' : ''}">${i + 1}</span>
          <div><h3 style="font-size:31px;margin:6px 0 10px">${s[0]}</h3><p style="font-size:23px;line-height:1.45;color:var(--muted);margin:0">${s[1]}</p></div></div>`).join('')}
    </div>` },

  // 26 ─ Ce que l'auditeur demandera
  { kind: 'html', label: '04 · Mise en œuvre', html: () => `
    ${K('04 / Mise en œuvre d\'un SMSI')}
    <h1 class="sm">Ce que l'auditeur <em>vous demandera</em></h1>
    <table class="t" style="font-size:24px;margin-top:40px">
      <tr><th>Document</th><th style="width:200px">Clause</th><th>Il répond à…</th></tr>
      ${[['Périmètre du SMSI', '4.3', 'Qu\'est-ce qui est couvert ?'], ['Politique de sécurité', '5.2', 'Quelles sont nos intentions ?'], ['Appréciation des risques', '6.1.2 · 8.2', 'Qu\'est-ce qui nous menace ?'], ['Plan de traitement des risques', '6.1.3 · 8.3', 'Que fait-on pour chaque risque ?'], ['Déclaration d\'applicabilité', '6.1.3', 'Quels contrôles, et pourquoi ?'], ['Objectifs de sécurité', '6.2', 'Comment mesure-t-on le succès ?'], ['Rapport d\'audit interne', '9.2', 'Est-ce que ça fonctionne ?'], ['Compte rendu de revue de direction', '9.3', 'Qu\'a décidé la direction ?'], ['Non-conformités et actions correctives', '10.2', 'Qu\'avons-nous corrigé ?']].map(r => `<tr${r[0].startsWith('Déclaration') ? ' class="hl"' : ''}><td class="k">${r[0]}</td><td>${r[1]}</td><td class="muted">${r[2]}</td></tr>`).join('')}
    </table>` },

  // 27 ─ DdA
  { kind: 'html', label: '04 · Mise en œuvre', html: c => `
    ${K('04 / Le cœur du SMSI')}
    <div style="display:grid;grid-template-columns:1fr 440px;gap:100px;align-items:center">
      <div>
        <h1 class="sm">La Déclaration <em>d'applicabilité</em></h1>
        <table class="t" style="font-size:24px">
          <tr><th>Contrôle</th><th>Applicable</th><th>Justification</th><th>État</th></tr>
          <tr><td class="k">8.13 Sauvegarde des informations</td><td>Oui</td><td class="muted">Risque R-04 : rançongiciel</td><td><span class="pill">En place</span></td></tr>
          <tr><td class="k">5.30 Préparation des TIC</td><td>Oui</td><td class="muted">Risque R-07 : arrêt du SI</td><td><span class="pill dark">En cours</span></td></tr>
          <tr><td class="k">6.7 Travail à distance</td><td>Oui</td><td class="muted">Équipes en télétravail</td><td><span class="pill gray">Planifié</span></td></tr>
          <tr><td class="k">8.28 Codage sécurisé</td><td>Non</td><td class="muted">Aucun développement interne</td><td><span class="pill rose">Exclu</span></td></tr>
        </table>
      </div>
      <div style="text-align:center">
        <div class="qrbox" style="padding:26px">${c.qr(c.site + 'kit', 300)}</div>
        <h2 style="margin-top:36px;font-size:34px">Repartez <em>avec le kit</em></h2>
        <p style="font-size:22px;color:var(--muted);line-height:1.45;margin:12px 0 0">Un modèle de DdA avec les 93 contrôles et un registre des risques, prêts à remplir pour vos stages et votre PFE.</p>
      </div>
    </div>` },

  // 28 ─ Certification
  { kind: 'html', label: '05 · Certification', steps: 5, html: () => `
    ${K('05 / Certification')}
    <h1>Le parcours <em>de certification</em></h1>
    <svg viewBox="0 0 1600 300" width="1600" height="300" style="margin-top:56px;overflow:visible">
      <line x1="40" x2="1440" y1="50" y2="50" stroke="#dbe3e1" stroke-width="4"/>
      ${[['Choisir l\'organisme', 'Accrédité, et indépendant', 'de votre consultant.'], ['Audit étape 1', 'Revue documentaire :', 'le SMSI est-il prêt ?'], ['Audit étape 2', 'Sur le terrain : est-il', 'appliqué et efficace ?'], ['Certificat', 'Valable 3 ans, pour', 'le périmètre audité.'], ['Surveillance', 'Un audit chaque année', 'pour le garder.']].map((s, i) => {
        const x = 40 + i * 350, col = ['#636b6f', '#22b2a6', '#0f3d33', '#e48aa6', '#22b2a6'][i];
        return `<g data-at="${i + 1}">${i ? `<line x1="${x - 350}" x2="${x}" y1="50" y2="50" stroke="${col}" stroke-width="4"/>` : ''}<circle cx="${x}" cy="50" r="22" fill="${col}"/>
          <text x="${x - 22}" y="140" font-size="30" font-weight="700" fill="#0f3d33">${s[0]}</text>
          <text x="${x - 22}" y="184" font-size="23" fill="#5f6b6a">${s[1]}</text><text x="${x - 22}" y="216" font-size="23" fill="#5f6b6a">${s[2]}</text></g>`;
      }).join('')}
    </svg>
    <div style="margin-top:40px">
      <div style="font-size:20px;letter-spacing:.2em;font-weight:600;color:var(--accent-ink)">LE CYCLE DE 3 ANS</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);margin-top:18px;gap:6px">
        ${[['An 0', 'Certification', '#0f3d33', '#fff'], ['An 1', 'Surveillance', '#e1f1ef', '#0f3d33'], ['An 2', 'Surveillance', '#e1f1ef', '#0f3d33'], ['An 3', 'Recertification', '#e48aa6', '#0f3d33']].map(a => `<div style="background:${a[2]};color:${a[3]};padding:22px 26px;font-size:25px"><b>${a[0]}</b> · ${a[1]}</div>`).join('')}
      </div>
    </div>` },

  // 29 ─ Écarts
  { kind: 'html', label: '05 · Certification', html: () => `
    ${K('05 / Certification')}
    <h1>Ce que l'auditeur <em>peut relever</em></h1>
    <div class="cols c3" style="margin-top:72px">
      <div class="col" style="border-top-color:var(--rose)"><span class="pill rose">GRAVE</span><h3>Non-conformité majeure</h3><p>Une exigence absente ou défaillante de façon systémique. Bloque la certification tant qu'elle n'est pas corrigée.</p></div>
      <div class="col" style="border-top-color:#636b6f"><span class="pill gray">PONCTUEL</span><h3>Non-conformité mineure</h3><p>Un écart isolé. Un plan d'action est exigé, et vérifié à l'audit suivant.</p></div>
      <div class="col" style="border-top-color:var(--accent)"><span class="pill">CONSEIL</span><h3>Observation</h3><p>Pas un écart, mais un risque à surveiller ou une piste d'amélioration.</p></div>
    </div>` },

  // 30 ─ VOTE 6
  { kind: 'vote', label: 'Vote 6', vote: [5], html: () => `
    ${K('Vote 6 · Sketch d\'audit, 2 minutes')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:96px">
      <div class="col" style="border-top-color:var(--accent)"><div class="code">L'AUDITEUR</div>
        <p style="font-size:44px;font-weight:700;color:var(--text);line-height:1.25;margin-top:26px">« Montrez-moi la preuve de votre dernière revue des droits d'accès. »</p></div>
      <div class="col" style="border-top-color:var(--rose)"><div class="code" style="color:var(--rose-deep)">L'AUDITÉ</div>
        <p style="font-size:38px;font-family:var(--serif);font-style:italic;color:var(--text);line-height:1.35;margin-top:26px">« Euh… on retire les accès quand quelqu'un part. Normalement. Mais on n'a rien d'écrit. »</p></div>
    </div>
    <h2 style="margin-top:72px">Votre verdict : conforme, NC mineure <em>ou NC majeure ?</em></h2>${VH}` },

  // 31 ─ Avantages et limites
  { kind: 'html', label: '05 · Avantages et limites', html: () => `
    ${K('05 / Avantages et limites')}
    <h1 class="sm">Ce que la norme apporte, <em>et ce qu'elle ne garantit pas</em></h1>
    <div class="cols c2" style="margin-top:64px">
      <div class="col" style="border-top-color:var(--accent)"><h3 style="margin-top:0;color:var(--accent-ink)">Avantages</h3>
        ${['Confiance des clients, accès aux appels d\'offres', 'Décisions de sécurité fondées sur les risques', 'Appui pour la conformité : loi 05-20, loi 09-08', 'Une culture sécurité portée par la direction', 'Un référentiel reconnu dans le monde entier'].map(t => `<p style="font-size:27px;color:var(--text);padding:14px 0;border-bottom:1px solid var(--line)">${t}</p>`).join('')}</div>
      <div class="col" style="border-top-color:var(--rose)"><h3 style="margin-top:0;color:var(--rose-deep)">Limites</h3>
        ${['Coût et temps : plusieurs mois de projet', 'Charge documentaire importante', 'Périmètre parfois réduit au strict minimum', 'Risque de conformité « sur le papier »', 'Certifié ne veut pas dire inviolable'].map(t => `<p style="font-size:27px;color:var(--text);padding:14px 0;border-bottom:1px solid var(--line)">${t}</p>`).join('')}</div>
    </div>` },

  // 32 ─ Coût de l'inaction
  { kind: 'html', label: '05 · Avantages et limites', html: () => `
    ${K('05 / Le coût de l\'inaction')}
    <h1 class="sm">Une fuite coûte <em>près de 5 M$</em></h1>
    <div style="display:grid;grid-template-columns:1.25fr .75fr;gap:110px;margin-top:56px;align-items:end">
      <div><div style="font-size:22px;color:var(--muted);margin-bottom:56px">Coût moyen mondial d'une fuite, en millions de dollars · 2026 = record</div>
        ${columns([{ x: '2021', v: 4.24, t: '4,24' }, { x: '2022', v: 4.35, t: '4,35' }, { x: '2023', v: 4.45, t: '4,45' }, { x: '2024', v: 4.88, t: '4,88' }, { x: '2025', v: 4.44, t: '4,44' }, { x: '2026', v: 4.99, t: '4,99', hl: 1 }], { w: 900, h: 330, bw: 100, max: 5.2 })}</div>
      <div>
        <h2 style="font-size:36px">Détecter vite, <em>ça paie</em></h2>
        <p style="font-size:22px;color:var(--muted);margin:10px 0 0">Coût moyen selon le temps mis à identifier et contenir la fuite (2026)</p>
        ${hbars([{ n: 'Moins de 200 jours', v: 4.32 }, { n: 'Plus de 200 jours', v: 5.65, hl: 1 }], 5.65, 250)}
      </div>
    </div>
    <div class="src">Source : IBM et Ponemon Institute, Cost of a Data Breach Report, éditions 2021 à 2026 (moyenne mondiale).</div>` },

  // 33 ─ Certificats dans le monde
  { kind: 'html', label: '05 · Avantages et limites', html: () => `
    ${K('05 / ISO 27001 dans le monde')}
    <div style="display:grid;grid-template-columns:1.3fr .7fr;gap:110px;align-items:end">
      <div><h1 class="sm">Toujours plus <em>de certificats</em></h1>
        <div style="font-size:22px;color:var(--muted);margin:24px 0 56px">Certificats ISO/IEC 27001 valides au 31 décembre</div>
        ${columns([{ x: '2018', v: 31910, t: '31 910' }, { x: '2019', v: 36362, t: '36 362' }, { x: '2020', v: 44486, t: '44 486' }, { x: '2021', v: 58687, t: '58 687' }, { x: '2022', v: 71549, t: '71 549', hl: 1 }], { w: 960, h: 360, bw: 130, max: 75000 })}</div>
      <div style="border-top:2px solid var(--text);padding-top:28px">
        <div style="font-size:150px;font-weight:800;color:var(--rose-deep);line-height:1">× 2,2</div>
        <p style="font-size:26px;color:var(--muted);line-height:1.45">en quatre ans, dans plus de 150 pays et tous les secteurs.</p></div>
    </div>
    <div class="src">Source : ISO Survey 2018 à 2022 (iso.org). 2023 non représenté : données publiées incomplètes.</div>` },

  // 34 ─ VOTE 7
  { kind: 'vote', label: 'Vote 7', vote: [6, 7], html: () => `
    ${K('Vote 7 · Débat express')}
    <h1 class="case">« Une entreprise certifiée ISO 27001 est <em>une entreprise sécurisée.</em> »</h1>
    <div class="cols c3" style="margin-top:72px">
      <div class="col"><span class="ic t0 letter" style="width:84px;height:84px;font-size:36px">1</span><h3>Votez : d'accord ou pas d'accord</h3></div>
      <div class="col"><span class="ic t2 letter" style="width:84px;height:84px;font-size:36px;color:#fff">2</span><h3>Deux arguments pour, deux contre</h3></div>
      <div class="col"><span class="ic t4 letter" style="width:84px;height:84px;font-size:36px">3</span><h3>On revote. Qui a changé d'avis ?</h3></div>
    </div>${VH}` },

  // 35 ─ Maroc
  { kind: 'html', label: '05 · Et pour nous ?', html: () => `
    ${K('05 / Et pour nous ?')}
    <h1>ISO 27001 au Maroc, <em>et dans vos carrières</em></h1>
    <div class="cols c3" style="margin-top:80px">
      <div class="col">${ic('book', 0)}<h3>DNSSI</h3><p>La directive nationale de sécurité des SI, portée par la DGSSI, s'inspire d'ISO 27001 et 27002.</p></div>
      <div class="col">${ic('law', 2)}<h3>Loi 05-20</h3><p>La loi sur la cybersécurité impose des règles aux administrations et aux infrastructures d'importance vitale.</p></div>
      <div class="col">${ic('case', 4)}<h3>Métiers GRC</h3><p>Lead Implementer, Lead Auditor : des certifications très demandées en conseil et en audit.</p></div>
    </div>` },

  // 36 ─ Quiz final
  { kind: 'quiz', label: 'Quiz final', first: 8, html: c => `
    ${K('Quiz final')}
    <div class="split">
      <div>
        <h1 style="font-size:120px">Place <em>au quiz.</em></h1>
        <p class="lead">Toute la norme, appliquée à l'affaire Maersk. Classement en direct. Et à la fin, la réponse à la question du début.</p>
      </div>
      <div class="qrbox">${c.qr(c.site, 360)}<div class="u">${c.siteShort}</div></div>
    </div>` },

  // 37 ─ La fin de l'histoire
  { kind: 'html', label: 'La fin de l\'histoire', steps: 2, dark: true, html: () => `
    ${K('La fin de l\'histoire')}
    <div style="display:grid;grid-template-columns:1fr 760px;gap:90px;align-items:center">
      <div>
        <h1 class="sm">Le seul serveur intact <em>était au Ghana.</em></h1>
        <p class="lead">Une coupure de courant l'avait mis hors ligne juste avant l'attaque. C'était la dernière copie de l'Active Directory encore vivante.</p>
        <p data-at="2" style="font-size:44px;font-weight:700;margin-top:56px;line-height:1.25;color:#fff">Maersk a été sauvée par la chance.<br><span class="serif" style="color:#f3a9c0">Un SMSI sert à ne plus en dépendre.</span></p>
      </div>
      <svg viewBox="0 0 760 640" width="760" height="640" style="overflow:visible">
        <style>.route{stroke-dasharray:900;stroke-dashoffset:900;transition:stroke-dashoffset 2.4s ease}.on .route{stroke-dashoffset:0}</style>
        <circle cx="150" cy="540" r="18" fill="#e48aa6"/><circle cx="150" cy="540" r="46" fill="none" stroke="#e48aa6" stroke-width="3" opacity=".6"/>
        <text x="215" y="532" font-size="32" font-weight="700" fill="#fff">Accra, Ghana</text>
        <text x="215" y="568" font-size="22" fill="#c7dbd6">Contrôleur de domaine hors ligne,</text>
        <text x="215" y="596" font-size="22" fill="#c7dbd6">donc épargné</text>
        <g data-at="1" style="transform:none">
          <path class="route" d="M150 540 C 90 360, 300 200, 560 150" fill="none" stroke="#9fdcd5" stroke-width="5" stroke-linecap="round" stroke-dasharray="900"/>
          <text x="250" y="370" font-size="22" fill="#c7dbd6">la copie est acheminée</text>
          <text x="250" y="398" font-size="22" fill="#c7dbd6">physiquement</text>
          <circle cx="560" cy="150" r="18" fill="#22b2a6"/><circle cx="560" cy="150" r="46" fill="none" stroke="#22b2a6" stroke-width="3" opacity=".6"/>
          <text x="560" y="70" font-size="32" font-weight="700" fill="#fff" text-anchor="middle">Londres</text>
          <text x="625" y="198" font-size="22" fill="#c7dbd6">Reconstruction</text>
          <text x="625" y="226" font-size="22" fill="#c7dbd6">du réseau mondial</text>
        </g>
      </svg>
    </div>` },

  // 38 ─ À retenir
  { kind: 'html', label: 'À retenir', steps: 3, html: () => `
    ${K('À retenir')}
    <h1>Trois idées <em>à emporter</em></h1>
    <div class="rows" style="margin-top:56px">
      ${['ISO 27001 est un système de management, <em class="serif">pas une checklist.</em>', 'Tout part des risques, et la Déclaration d\'applicabilité <em class="serif">en est le cœur.</em>', 'Certifié ne veut pas dire sécurisé : <em class="serif">un SMSI doit vivre.</em>'].map((t, i) => `
        <div data-at="${i + 1}" style="display:grid;grid-template-columns:140px 1fr;align-items:center;padding:34px 0;border-bottom:1px solid var(--line)">
          <span class="ic t${[0, 2, 4][i]} letter" style="width:96px;height:96px;font-size:44px;${i === 1 ? 'color:#fff' : ''}">${i + 1}</span>
          <span style="font-size:42px;font-weight:600;line-height:1.25">${t}</span></div>`).join('')}
    </div>` },

  // 39 ─ Merci
  { kind: 'html', label: 'Merci', html: c => `
    <div class="split">
      <div>
        <h1 style="font-size:200px;line-height:.9">Merci<span style="color:var(--rose)">.</span></h1>
        <h2 style="font-size:60px;margin-top:32px;font-weight:600">Des <em>questions ?</em></h2>
        <p class="lead" style="margin-top:64px">ENSA Marrakech · Module PCA/PRA · Encadré par Pr. ABBASS Wissam</p>
      </div>
      <div style="text-align:center">
        <div class="qrbox" style="display:inline-flex">${c.qr(c.site + 'kit', 340)}<div class="u">Modèle de DdA et registre des risques</div></div>
      </div>
    </div>` },
  ];
})();
