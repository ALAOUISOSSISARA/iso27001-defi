# ISO 27001 · Le défi Maersk

Quiz compétitif en temps réel pour clôturer la présentation ISO 27001 (module PCA/PRA).
Les étudiants jouent sur leur téléphone ou PC ; le présentateur projette `/admin`.

```
index.html          page joueur (téléphone / PC)
admin.html          page présentateur (écran projeté + contrôles)
config.js           URL + clé anon Supabase  ← à remplir
js/                 logique des pages + bibliothèques embarquées
css/style.css       design
supabase/schema.sql tables, sécurité RLS, logique de jeu et de score
supabase/seed.sql   contenu du cas Maersk (modifiable)
vercel.json         configuration Vercel
```

---

## 1. Créer la base Supabase (≈ 10 min)

1. Sur [supabase.com](https://supabase.com), créez un projet (région conseillée : **Europe**, ex. Frankfurt).
2. **SQL Editor** → nouvelle requête → collez tout `supabase/schema.sql` → **Run**.
3. Nouvelle requête → collez `supabase/seed.sql` → **Run**.
4. **Authentication → Users → Add user → Create new user** : votre e-mail + un mot de passe, cochez *Auto Confirm User*.
   Copiez l'**UID** de l'utilisateur créé.
5. SQL Editor :
   ```sql
   insert into public.admins values ('COLLEZ-L-UID-ICI');
   ```
   (Répétez pour chaque membre du groupe qui doit pouvoir piloter.)
6. **Project Settings → API** (ou bouton *Connect*) : copiez la **Project URL** et la clé **anon public**.

> Le temps réel est activé automatiquement par `schema.sql` sur la table `game_state`.
> Vérification : *Database → Publications → supabase_realtime* doit contenir `game_state`.

## 2. Configurer le site

Dans `config.js` :
```js
SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
SUPABASE_ANON_KEY: 'eyJhbGciOi...',
```
⚠️ Uniquement la clé **anon**. Jamais la clé `service_role`.

## 3. Déployer sur Vercel (≈ 5 min)

**Option A — GitHub** : poussez le dossier sur un dépôt GitHub → [vercel.com](https://vercel.com) → *Add New → Project* → importez le dépôt → *Framework Preset : Other*, pas de commande de build → **Deploy**.

**Option B — en ligne de commande** :
```bash
npm i -g vercel
cd iso-quiz
vercel --prod
```

Résultat :
- `https://votre-projet.vercel.app/` → page joueurs (c'est l'URL du QR code)
- `https://votre-projet.vercel.app/admin` → page présentateur

Astuce : dans Vercel → *Settings → Domains*, renommez le sous-domaine en quelque chose de court
(ex. `iso27001-defi.vercel.app`) : il s'affiche sous le QR code.

---

## 4. La veille de la présentation

- **Réveillez Supabase** : un projet gratuit se met en pause après ~1 semaine d'inactivité. Ouvrez le tableau de bord la veille et le matin même.
- **Répétition** : ouvrez `/admin`, rejoignez avec 2-3 téléphones, jouez une partie complète.
- Puis **Réinitialiser** (bouton en bas, taper `RESET`) pour vider joueurs et réponses.
- Prévoyez le partage de connexion d'un téléphone si le Wi-Fi de l'école est capricieux. Le site bascule tout seul en mode « sondage » si le temps réel est bloqué.

## 5. Le jour J

| Moment | Action |
|---|---|
| Début de la présentation | Ouvrez `/admin`, touche **F** (plein écran). Le lobby affiche le QR code : laissez-le 1-2 min pendant l'intro. |
| Pendant la présentation | Basculez sur vos slides. Les inscriptions continuent. |
| Partie pratique | Revenez sur `/admin` et appuyez sur **→** / **Espace** (ou le bouton *Suivant* d'une télécommande). |

Chaque appui sur **→** fait avancer :
`Lobby → Mise en situation → Question → Révélation → (histoire du Ghana) → Classement → Question suivante → … → Podium`

- **Révélation auto** (cochée par défaut) : la réponse s'affiche dès que tout le monde a répondu ou que le temps est écoulé.
- **←** : revenir en arrière. **Classement** : afficher le top 10 à tout moment.
- **Joueurs** : liste des inscrits, bouton *Exclure* pour un pseudo inapproprié.

## 6. Barème

| Règle | Points |
|---|---|
| Bonne réponse | 500 à 1000 selon la rapidité |
| Estimation (RTO) | 1000 si à ±2 h, dégressif jusqu'à 0 à ±30 h |
| 3 bonnes réponses d'affilée | +200 |
| Question finale | ×2 |

## 7. Modifier le contenu

Supabase → **Table Editor → steps**. Chaque ligne est une étape :
- `kind` : `intro`, `question`, `estimate` ou `incident`
- `options` : liste JSON de 4 réponses
- `correct_choice` : 0 = A, 1 = B, 2 = C, 3 = D
- `time_limit` (secondes), `multiplier`, `explanation`, `story` (puces affichées après la révélation)

Ou modifiez `supabase/seed.sql` et ré-exécutez-le.

---

## Sécurité (à mentionner pendant la présentation)

La clé anon est visible dans le code du site, c'est normal : **toute la sécurité est dans la base**.

- **RLS** activée sur toutes les tables ; les étudiants n'ont aucun accès direct (contrôle d'accès, 5.15).
- Tout passe par des fonctions qui vérifient l'état du jeu : impossible de répondre hors délai, deux fois, ou à une autre question.
- **Les bonnes réponses ne quittent jamais la base avant la révélation** : inutile d'ouvrir les DevTools 😉
- Les points sont calculés **côté serveur**, avec l'horloge du serveur : on ne peut pas tricher sur le temps.
- Chaque joueur reçoit un jeton secret ; seul son hachage SHA-256 est stocké.
- Les fonctions présentateur exigent un compte authentifié présent dans la table `admins`.
- Les pseudos sont affichés en texte brut (pas d'injection HTML possible).

## Sources du cas

- A. Greenberg, *The Untold Story of NotPetya, the Most Devastating Cyberattack in History*, Wired, août 2018.
- Maersk, rapport intermédiaire T2 2017 : coût estimé à 200-300 M$.
