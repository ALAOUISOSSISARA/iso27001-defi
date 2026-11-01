-- =====================================================================
--  Contenu du jeu : le cas Maersk / NotPetya (2017)
--  Modifiable ici ou directement dans Supabase > Table Editor > steps.
--  correct_choice est l'index de la bonne réponse : 0 = A, 1 = B, 2 = C, 3 = D.
-- =====================================================================

delete from public.answers where true;
delete from public.steps where true;

insert into public.steps
  (idx, kind, clause, title, body, options,
   est_min, est_max, est_step, est_unit, time_limit, multiplier,
   correct_choice, correct_value, tolerance, zero_at, explanation, story)
values

-- 0 — Mise en situation ------------------------------------------------
(0, 'intro', 'Étude de cas',
 'Juin 2017. Vous êtes le RSSI de Maersk.',
 'Leader mondial du transport de conteneurs : présent dans 130 pays, près d''un cinquième de la capacité mondiale de fret maritime. Votre direction lance une démarche ISO 27001. À vous de jouer.',
 null, null, null, null, null, 20, 1, null, null, null, null, null, null),

-- 1 — Clause 4 : périmètre ----------------------------------------------
(1, 'question', 'Clause 4 — Contexte et périmètre',
 'Lequel de ces éléments peut raisonnablement être exclu du périmètre du SMSI ?',
 null,
 '["Le système de réservation des conteneurs", "Les terminaux portuaires et leurs systèmes", "L''Active Directory mondial", "La cafétéria du siège"]',
 null, null, null, null, 20, 1,
 3, null, null, null,
 'Le périmètre couvre les actifs informationnels qui portent les activités critiques. Une exclusion est possible si elle est justifiée et documentée (clause 4.3).',
 null),

-- 2 — Clause 5 : leadership ---------------------------------------------
(2, 'question', 'Clause 5 — Leadership',
 'Qui doit établir et approuver la politique de sécurité de l''information ?',
 null,
 '["La direction générale", "Le RSSI", "Le DSI", "L''auditeur de certification"]',
 null, null, null, null, 20, 1,
 0, null, null, null,
 'Clause 5.2 : c''est la direction qui établit la politique. Le RSSI la rédige et la pilote, mais sans engagement de la direction, pas de certification.',
 null),

-- 3 — Clause 6 : appréciation des risques -------------------------------
(3, 'question', 'Clause 6 — Appréciation des risques',
 'Criticité = Probabilité × Impact. Quel risque traiter en priorité ?',
 null,
 '["Phishing sur les employés (P = 4, I = 3)", "Malware destructeur sur l''Active Directory (P = 3, I = 5)", "Incendie au siège (P = 1, I = 4)", "Panne de l''ERP (P = 2, I = 5)"]',
 null, null, null, null, 25, 1,
 1, null, null, null,
 'Criticités : 12, 15, 4 et 10. Le malware destructeur sur l''AD (15) est le plus critique. Retenez-le…',
 null),

-- 4 — Clause 6.1.3 : traitement du risque ------------------------------
(4, 'question', 'Clause 6.1.3 — Traitement du risque',
 'Pour le risque « malware destructeur sur l''Active Directory », quelle option de traitement ?',
 null,
 '["Transférer (assurance cyber)", "Accepter", "Réduire (sauvegardes hors ligne, segmentation)", "Éviter (supprimer l''Active Directory)"]',
 null, null, null, null, 20, 1,
 2, null, null, null,
 'On réduit : l''AD est indispensable, on ne peut ni l''éviter ni accepter ce risque. L''assurance indemnise mais ne restaure rien ; plusieurs victimes de NotPetya ont même vu leur assureur invoquer l''exclusion « acte de guerre ».',
 null),

-- 5 — PCA/PRA : estimation du RTO --------------------------------------
(5, 'estimate', 'PCA / PRA — Analyse d''impact (BIA)',
 'Quel RTO maximal fixer pour le système de réservation ?',
 'Hypothèse pédagogique : une heure d''arrêt coûte environ 1,5 M$. La direction fixe la perte maximale tolérable à 72 M$.',
 null,
 0, 120, 1, 'h', 30, 1,
 null, 48, 2, 30,
 'RTO ≤ perte tolérable ÷ coût horaire = 72 ÷ 1,5 = 48 h. En réalité, la reprise de Maersk a pris environ 10 jours (≈ 240 h).',
 null),

-- 6 — Coup de théâtre ---------------------------------------------------
(6, 'incident', '27 juin 2017',
 'NotPetya frappe Maersk.',
 'Une mise à jour piégée du logiciel de comptabilité ukrainien M.E.Doc diffuse le malware. En quelques minutes, il se propage à tout le réseau mondial : postes, serveurs, contrôleurs de domaine.',
 null, null, null, null, null, 20, 1, null, null, null, null, null, null),

-- 7 — Réponse à incident -------------------------------------------------
(7, 'question', 'Annexe A 5.24 à 5.26 — Gestion des incidents',
 'Tous les écrans affichent une demande de rançon. Quelle est votre première action ?',
 null,
 '["Payer la rançon", "Isoler le réseau", "Restaurer immédiatement les sauvegardes", "Prévenir la presse"]',
 null, null, null, null, 20, 1,
 1, null, null, null,
 'D''abord endiguer : restaurer sans isoler, c''est réinfecter les sauvegardes. Et NotPetya était un « wiper » : payer n''aurait rien récupéré.',
 null),

-- 8 — Sauvegarde et redondance -----------------------------------------
(8, 'question', 'Annexe A 8.13 / 8.14 — Sauvegarde et redondance',
 'Les ~150 contrôleurs de domaine sont détruits. Qu''est-ce qui aurait garanti la reprise ?',
 null,
 '["Ajouter encore plus de contrôleurs de domaine", "Un meilleur antivirus", "Tout migrer vers le cloud", "Une copie hors ligne de l''AD, testée régulièrement"]',
 null, null, null, null, 20, 1,
 3, null, null, null,
 'La redondance en ligne ne protège pas d''un malware qui détruit tout en même temps. Il faut une copie isolée (hors ligne) et des tests de restauration.',
 '["Aucun scénario ne prévoyait la destruction simultanée de tous les contrôleurs de domaine.", "Un seul a survécu : au Ghana, éteint par hasard à cause d''une coupure de courant.", "Le lien réseau était trop lent : un employé a rapporté le serveur en avion jusqu''à Londres.", "Bilan : environ 4 000 serveurs et 45 000 postes réinstallés en 10 jours, 200 à 300 M$ de pertes.", "La chance n''est pas un PRA."]'),

-- 9 — Question finale : audit et amélioration --------------------------
(9, 'question', 'Clauses 9 et 10 — Audit et amélioration',
 'L''auditeur arrive après l''incident. Quelle non-conformité relève-t-il en priorité ?',
 null,
 '["Restauration de l''AD jamais testée pour une destruction totale", "Absence totale de PCA", "Pas de charte informatique signée", "Antivirus pas à jour"]',
 null, null, null, null, 25, 2,
 0, null, null, null,
 'La mesure 8.13 exige des sauvegardes testées. Après l''incident, la clause 10.2 impose une action corrective : corriger, analyser la cause racine, éviter que cela se reproduise.',
 null);
