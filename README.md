# Homelink

Base Next.js de Homelink avec shadcn/ui, theme de marque et proxy API serveur.

## Demarrage

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Configuration API

Le frontend ne doit pas appeler l'URL du backend directement. Configurez
`API_BASE_URL` dans `.env.local`, puis appelez le backend via le proxy Next:

```ts
import { apiFetch } from "@/lib/api-client"

const biens = await apiFetch("/biens")
```

La requete ci-dessus passe par `/api/proxy/biens`; l'URL reelle du backend reste
cote serveur. N'utilisez pas de variable `NEXT_PUBLIC_*` pour l'URL API.

## Authentification

Les formulaires `/register` et `/login` appellent les routes serveur Homelink:

- `POST /api/auth/register` transmet vers `/api/accounts/register/`
- `POST /api/auth/login` transmet vers `/api/accounts/login/`

Les tokens `access` et `refresh` renvoyes par le login sont conserves en
`localStorage`. Le helper `apiFetch` ajoute ensuite l'en-tete `Authorization`
aux appels `/api/proxy/*`. Le header interroge `/accounts/me/` via le proxy et
affiche un skeleton pendant le chargement du profil.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```
