-- =====================================================================
--  Contenu du jeu — aligné sur la présentation Canva
--  « ISO 27001 — Le SMSI à travers l'affaire Maersk »
--
--   idx 0 à 7  : les 7 VOTES de la présentation (non notés, résultats en direct)
--   idx 8      : écran « Place au quiz »
--   idx 9 à 25 : QUIZ FINAL, 17 questions notées (la dernière compte double)
--
--  Modifiable ici ou dans Supabase > Table Editor > steps.
--  correct_choice : index de la bonne réponse (0 = A, 1 = B, 2 = C, 3 = D).
--  active = false  : l'étape est sautée (pratique pour raccourcir le quiz).
--  Réexécuter ce fichier efface les étapes ET toutes les réponses.
-- =====================================================================

delete from public.answers where true;
delete from public.steps where true;

-- ------------------------------------------------------------------ VOTES
insert into public.steps
  (idx, kind, label, clause, title, body, options, items, scored, time_limit,
   correct_choice, correct_items, compare_to, explanation)
values
(0, 'question', 'Vote 1', 'Hypothèse',
 'Ils ont trouvé un seul serveur intact. Qu''est-ce qui l''a sauvé ?', null,
 '["Un antivirus haut de gamme", "Une sauvegarde hors ligne bien planifiée", "Un pare-feu parfaitement configuré", "Autre chose…"]',
 null, false, 30, null, null, null,
 'Réponse à la toute fin de la présentation.'),

(1, 'question', 'Vote 2', 'Retour chez Maersk',
 'Chez Maersk, quel pilier a cédé en premier ?', null,
 '["Confidentialité", "Intégrité", "Disponibilité"]',
 null, false, 30, 2, null, null,
 'Disponibilité : disques effacés, plus aucun système ne répond. NotPetya ne cherchait pas à voler des données mais à tout rendre inutilisable.'),

(2, 'multi', 'Vote 3', 'Placez-les dans le cycle',
 'P, D, C ou A ?', null,
 '["Plan", "Do", "Check", "Act"]',
 '["Réaliser un audit interne", "Apprécier les risques", "Corriger une non-conformité", "Déployer le MFA sur le VPN", "Revue de direction", "Définir le périmètre du SMSI"]',
 false, 60, null, '[2, 0, 3, 1, 2, 0]', null,
 'Audit interne et revue de direction = Check (clause 9). Risques et périmètre = Plan (4 et 6). Déployer un contrôle = Do (8). Corriger = Act (10).'),

(3, 'multi', 'Vote 4', 'Devinez le thème',
 'Organisationnel, humain, physique ou technologique ?', null,
 '["Organisationnel", "Humain", "Physique", "Technologique"]',
 '["Quelqu''un entre dans la salle serveurs derrière vous, sans badger", "Une fausse campagne de phishing pour entraîner le personnel", "Le VPN demande un code sur le téléphone en plus du mot de passe", "La direction signe et diffuse la politique de sécurité"]',
 false, 50, null, '[2, 1, 3, 0]', null,
 'Physique : 7.2 (accès physique). Humain : 6.3 (sensibilisation). Technologique : 8.5 (authentification). Organisationnel : 5.1 (politiques).'),

(4, 'question', 'Vote 5', 'Retour chez Maersk',
 'Quel contrôle aurait limité les dégâts ?', null,
 '["8.8 — Gestion des vulnérabilités techniques", "8.22 — Cloisonnement des réseaux", "8.13 — Sauvegarde des informations, hors ligne", "5.30 — Préparation des TIC pour la continuité"]',
 null, false, 30, null, null, null,
 'Les quatre auraient aidé : 8.8 fermait la porte d''EternalBlue, 8.22 freinait la propagation, 8.13 et 5.30 accéléraient la reprise. La sécurité se pense en couches.'),

(5, 'question', 'Vote 6', 'Sketch d''audit',
 'Votre verdict ?', 'Aucune preuve écrite de revue des droits d''accès.',
 '["Conforme", "Non-conformité mineure", "Non-conformité majeure"]',
 null, false, 30, null, null, null,
 'Sans preuve, l''exigence n''est pas démontrée (5.18, droits d''accès). Écart isolé : mineure. Aucun processus du tout : majeure.'),

(6, 'question', 'Vote 7 · 1er tour', 'Débat express',
 '« Une entreprise certifiée ISO 27001 est une entreprise sécurisée. »', null,
 '["D''accord", "Pas d''accord"]',
 null, false, 30, null, null, null, null),

(7, 'question', 'Vote 7 · 2e tour', 'Débat express · on revote',
 '« Une entreprise certifiée ISO 27001 est une entreprise sécurisée. »', 'Après les arguments : avez-vous changé d''avis ?',
 '["D''accord", "Pas d''accord"]',
 null, false, 30, null, null, 6,
 'Certifié ne veut pas dire inviolable : le certificat atteste qu''un système de management fonctionne sur un périmètre, pas qu''aucune attaque ne réussira.');

-- ---------------------------------------------------- ÉCRAN D'ENTRÉE DU QUIZ
insert into public.steps (idx, kind, label, clause, title, body, scored)
values (8, 'intro', null, 'Quiz final', 'Place au quiz.',
 '17 questions sur toute la norme, appliquée à l''affaire Maersk. 30 secondes chacune, classement en direct. La dernière compte double.', true);

-- ------------------------------------------------------------- QUIZ FINAL
insert into public.steps
  (idx, kind, clause, title, body, options,
   est_min, est_max, est_step, est_unit, time_limit, multiplier,
   correct_choice, correct_value, tolerance, zero_at, explanation)
values

-- 01 — Principes fondamentaux
(9, 'question', '01 — Principes · CID',
 'Les données clients de Maersk fuitent sur un forum. Quel critère est atteint ?', null,
 '["Disponibilité", "Intégrité", "Confidentialité", "Traçabilité"]',
 null, null, null, null, 30, 1, 2, null, null, null,
 'Confidentialité : une personne non autorisée accède à l''information. NotPetya, lui, a frappé la disponibilité.'),

(10, 'question', '01 — Principes · Risque',
 'Échelle de 1 à 3. Quel risque traiter en priorité ?', 'Risque = Vraisemblance × Impact',
 '["Phishing (V = 3, I = 2)", "Wiper sur l''Active Directory (V = 3, I = 3)", "Incendie au siège (V = 1, I = 3)", "Panne de l''ERP (V = 2, I = 2)"]',
 null, null, null, null, 30, 1, 1, null, null, null,
 'Scores : 6, 9, 3 et 4. Le wiper sur l''AD (9) arrive en tête ; à partir de 6, le risque est élevé.'),

(11, 'question', '01 — Principes · Traitement',
 'Maersk souscrit une cyber-assurance contre les rançongiciels. Quelle option de traitement ?', null,
 '["Réduire", "Éviter", "Accepter", "Transférer"]',
 null, null, null, null, 30, 1, 3, null, null, null,
 'Transférer : le coût passe à l''assureur, mais le risque reste. Plusieurs victimes de NotPetya ont vu leur assureur invoquer l''exclusion « acte de guerre ».'),

-- 02 — PDCA et structure
(12, 'question', '02 — Structure · Clause 5',
 'Qui doit établir et approuver la politique de sécurité ?', null,
 '["La direction générale", "Le RSSI", "Le DSI", "L''auditeur de certification"]',
 null, null, null, null, 30, 1, 0, null, null, null,
 'Clause 5.2 : la direction établit la politique. Le RSSI la rédige et la pilote, mais sans engagement de la direction, pas de certification.'),

(13, 'question', '02 — Structure · PDCA',
 'Dans quelle clause trouve-t-on l''audit interne et la revue de direction ?', null,
 '["Clause 6 — Planification", "Clause 8 — Fonctionnement", "Clause 9 — Évaluation des performances", "Clause 10 — Amélioration"]',
 null, null, null, null, 30, 1, 2, null, null, null,
 'Clause 9, le « Check » du PDCA : 9.1 mesure, 9.2 audit interne, 9.3 revue de direction.'),

(14, 'question', '02 — Structure · Clause 7',
 'Lors d''un exercice, la plupart des employés ne savent pas à qui signaler un incident. Quelle exigence est en défaut ?', null,
 '["Clause 7.3 — Sensibilisation", "Clause 4.2 — Parties intéressées", "Clause 9.3 — Revue de direction", "Clause 6.2 — Objectifs de sécurité"]',
 null, null, null, null, 30, 1, 0, null, null, null,
 'Clause 7.3 : chacun doit connaître la politique, son rôle et les conséquences d''un manquement. Côté Annexe A : 6.3 (sensibilisation) et 6.8 (signalement).'),

-- 03 — Annexe A
(15, 'question', '03 — Annexe A',
 'Combien de contrôles compte l''Annexe A de la version 2022 ?', null,
 '["114", "93", "34", "11"]',
 null, null, null, null, 30, 1, 1, null, null, null,
 '93 contrôles en 4 thèmes : 37 organisationnels, 8 humains, 14 physiques et 34 technologiques. La version 2013 en comptait 114.'),

(16, 'question', '03 — Annexe A · Fournisseurs',
 'Quel groupe de contrôles vise ce point d''entrée ?', 'NotPetya est entré par la mise à jour piégée d''un logiciel comptable tiers.',
 '["7.1 à 7.4 — Sécurité physique", "6.1 — Sélection des candidats", "8.10 — Suppression des informations", "5.19 à 5.22 — Relations avec les fournisseurs"]',
 null, null, null, null, 30, 1, 3, null, null, null,
 '5.21 cible la chaîne d''approvisionnement TIC : exiger des garanties sur les produits et les mises à jour des fournisseurs. Même scénario que SolarWinds en 2020.'),

(17, 'question', '03 — Annexe A · Accès',
 'Pour se propager, NotPetya volait les mots de passe administrateur en mémoire. Quel contrôle limite ce risque ?', null,
 '["5.9 — Inventaire des actifs", "8.2 — Droits d''accès privilégiés", "8.23 — Filtrage web", "7.7 — Bureau propre et écran verrouillé"]',
 null, null, null, null, 30, 1, 1, null, null, null,
 '8.2 : limiter, séparer et surveiller les comptes à privilèges. Un même compte administrateur partout, c''est un passe-partout pour le ver.'),

(18, 'question', '03 — Annexe A · Version 2022',
 'Lequel de ces contrôles est nouveau dans la version 2022 ?', null,
 '["8.13 — Sauvegarde des informations", "5.1 — Politiques de sécurité", "5.30 — Préparation des TIC pour la continuité", "8.5 — Authentification sécurisée"]',
 null, null, null, null, 30, 1, 2, null, null, null,
 '5.30 fait partie des 11 nouveaux contrôles, et c''est le lien direct entre ISO 27001 et notre module PCA/PRA.'),

(19, 'estimate', '03 — Lien PCA/PRA · BIA',
 'Quel RTO maximal fixer pour le système de réservation ?',
 'Hypothèse : une heure d''arrêt coûte environ 1,5 M$. La direction tolère au plus 72 M$ de pertes.',
 null, 0, 120, 1, 'h', 40, 1, null, 48, 2, 30,
 'RTO ≤ perte tolérable ÷ coût horaire = 72 ÷ 1,5 = 48 h. Maersk, elle, a mis environ 10 jours (≈ 240 h).'),

-- 04 — Mise en œuvre
(20, 'question', '04 — Mise en œuvre · DdA',
 'Maersk ne développe aucun logiciel en interne. Où justifie-t-on l''exclusion du contrôle 8.28 « Codage sécurisé » ?', null,
 '["Le registre des risques", "La politique de sécurité", "Le plan de continuité", "La Déclaration d''applicabilité"]',
 null, null, null, null, 30, 1, 3, null, null, null,
 'La DdA (clause 6.1.3) passe en revue les 93 contrôles : retenu ou exclu, toujours avec une justification.'),

(21, 'question', '04 — Mise en œuvre · Étapes',
 'Par quelle étape commence la construction d''un SMSI ?', null,
 '["Choisir les contrôles de l''Annexe A", "Définir le périmètre et le contexte", "Lancer l''audit interne", "Former le personnel"]',
 null, null, null, null, 30, 1, 1, null, null, null,
 'Clause 4 d''abord : on ne protège bien que ce qu''on a délimité. Les contrôles viennent après l''appréciation des risques.'),

(22, 'question', '04 — Mise en œuvre · Incident',
 'Lundi, 14 h : tous les écrans affichent une demande de rançon. Quelle est la première action ?', null,
 '["Payer la rançon", "Restaurer immédiatement les sauvegardes", "Isoler les systèmes touchés", "Prévenir la presse"]',
 null, null, null, null, 30, 1, 2, null, null, null,
 'Endiguer d''abord (5.26) : restaurer sans isoler, c''est réinfecter les sauvegardes. Et NotPetya était un wiper : payer n''aurait rien rendu.'),

-- 05 — Certification et contexte
(23, 'question', '05 — Certification',
 'Une fois obtenu, combien de temps un certificat ISO 27001 est-il valable ?', null,
 '["1 an, sans contrôle", "5 ans, avec un audit à mi-parcours", "À vie, une fois obtenu", "3 ans, avec des audits de surveillance annuels"]',
 null, null, null, null, 30, 1, 3, null, null, null,
 'Cycle de 3 ans : certification, surveillance en années 1 et 2, puis recertification. Le SMSI doit vivre toute l''année, pas seulement le jour de l''audit.'),

(24, 'question', '05 — Et pour nous ?',
 'Quelle loi marocaine impose des règles de cybersécurité aux administrations et aux infrastructures d''importance vitale ?', null,
 '["Loi 09-08", "Loi 05-20", "Loi 53-05", "Loi 31-08"]',
 null, null, null, null, 30, 1, 1, null, null, null,
 'Loi 05-20 relative à la cybersécurité. La 09-08 protège les données personnelles, la 53-05 encadre l''échange électronique de données juridiques.'),

(25, 'question', '05 — Amélioration · Question finale',
 'Après l''incident, quelle clause impose d''analyser la cause racine et d''empêcher la récidive ?', null,
 '["Clause 10.2 — Non-conformité et action corrective", "Clause 6.1 — Actions face aux risques", "Clause 9.2 — Audit interne", "Clause 5.2 — Politique"]',
 null, null, null, null, 30, 2, 0, null, null, null,
 'Clause 10.2 : corriger, analyser la cause, agir pour que cela ne se reproduise pas, puis vérifier l''efficacité. C''est le « Act » du PDCA.');
