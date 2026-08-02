# Capstone Book

Web app privée (React + Supabase) reproduisant votre journal de trading
`Capstone_book.xlsx` : Trade Log, Dashboard, Calculateur de Lot Size,
Hypothèses, Objectifs Funding, Résumé.

## 1. Créer le projet Supabase (base de données + connexion)

1. Allez sur [supabase.com](https://supabase.com) → **New project**
2. Une fois créé : **SQL Editor** → **New query** → collez le contenu de
   `supabase/schema.sql` → **Run**
   → Ça crée les tables et charge vos données existantes (hypothèses, tailles
   de point, objectifs funding, et vos 5 trades déjà enregistrés).
3. **Authentication** → **Users** → **Add user** → créez votre propre compte
   (email + mot de passe) : c'est ce compte qui vous servira à vous connecter
   à l'app.
4. **Project Settings** → **API** → notez :
   - `Project URL` → deviendra `VITE_SUPABASE_URL`
   - `anon public` key → deviendra `VITE_SUPABASE_ANON_KEY`
   (ne jamais utiliser la clé `service_role`, réservée au backend)

## 2. Pousser le code sur GitHub

```bash
cd capstone-book-app
git init
git add .
git commit -m "Capstone Book v1"
```

Créez un repo vide sur [github.com/new](https://github.com/new) (ex:
`capstone-book`), puis :

```bash
git remote add origin https://github.com/VOTRE_USER/capstone-book.git
git branch -M main
git push -u origin main
```

## 3. Déployer sur Render

1. [render.com](https://render.com) → **New** → **Static Site**
2. Connectez votre dépôt GitHub `capstone-book`
3. Paramètres de build :
   - **Build command** : `npm install && npm run build`
   - **Publish directory** : `dist`
4. **Environment** → ajoutez les deux variables de `.env.example` avec vos
   vraies valeurs Supabase
5. **Create Static Site** → Render déploie et vous donne une URL
   (`capstone-book.onrender.com`), avec redéploiement automatique à chaque
   `git push`

## 4. Se connecter

Ouvrez l'URL Render → connectez-vous avec l'email/mot de passe créés à
l'étape 1.3. Vous êtes seul à pouvoir accéder à vos données (RLS activé sur
toutes les tables, réservé aux utilisateurs authentifiés).

## Développement local (optionnel)

```bash
npm install
cp .env.example .env   # puis renseignez vos vraies clés Supabase
npm run dev
```

## Notes importantes / hypothèses

- **Solde de départ par compte** : le solde initial d'un compte
  (`broker_compte`) est pris depuis `capital_vise` dans Objectifs Funding.
  Les 5 trades historiques importés n'ont pas de compte assigné et démarrent
  donc à 5 000 $ par défaut (comme dans votre fichier d'origine) — assignez-
  leur une clé de compte dans le Trade Log si besoin.
- **Colonnes "À renseigner"** : plusieurs valeurs de pip par broker/paire
  n'étaient pas confirmées dans votre fichier d'origine — elles apparaissent
  vides dans l'onglet Hypothèses ; remplissez-les avant de vous fier au
  calculateur pour ces paires.
- **R Realized / P&L** ne se calculent que si un Exit Price est renseigné.
- Le mot de passe et l'email de connexion sont gérés entièrement par
  Supabase Auth — pas de mot de passe stocké dans le code.
