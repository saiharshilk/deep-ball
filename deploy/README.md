# Putting DEEP BALL online: Vercel + Turso (free, no credit card)

- **Vercel** hosts the site and builds it from GitHub on every push to `main`.
- **Turso** hosts the database: players, scores, nicknames and the puzzles themselves.

Both have free plans you sign into with GitHub, and neither asks for a card. The only secret is the Turso database token, which is the password to your own database. It goes into Vercel's settings and a local file that never gets committed.

Puzzle files stay on your Mac (they're kept out of git). `pnpm puzzles:push` uploads them to Turso.

## 1. Create the database (Turso)
1. Go to **turso.tech** → **Sign up** → continue with GitHub. Pick the free plan.
2. Create a database named `deepball`. For the location, pick **AWS US East (Virginia)**. It's the closest to Vercel's default server region, which keeps each request fast.
3. On the database's page, copy:
   - the **URL**: `libsql://deepball-<your-username>.turso.io`
   - a new **token**: click *Create Token* and choose **Read & Write** with no expiry.

## 2. Upload the puzzles
In the `deep-ball` folder on your Mac:
```bash
cp .env.turso.example .env.turso
```
Open `.env.turso` and paste in the URL and token. Then run:
```bash
pnpm puzzles:push
```
It checks every puzzle file and ends with `✓ Done. The database now has N matches`. This also creates the tables, so the database is ready.

## 3. Deploy the site (Vercel)
1. Go to **vercel.com** → **Sign up** → continue with GitHub. Pick the free **Hobby** plan.
2. **Add New → Project** → import `saiharshilk/deep-ball`.
3. **Root Directory:** click *Edit* and choose **`deep-ball`**. The framework is detected as Next.js.
4. Open **Environment Variables** and add both:
   - `TURSO_DATABASE_URL`: the URL from step 1
   - `TURSO_AUTH_TOKEN`: the token from step 1
5. Click **Deploy**. After a minute or two you get a link like `deep-ball.vercel.app`. You can rename it under *Settings → Domains* while the name is free.

## Day to day
- **New puzzles:** add `content/matches/YYYY-MM-DD.json`, then run `pnpm puzzles:check` and `pnpm puzzles:push`. They're live right away; no redeploy is needed.
- **Code changes:** merge to `main` and Vercel redeploys on its own.
- **Local testing:** `pnpm dev` still uses the local file `data/deepball.db`. It never touches the live database, because only `puzzles:push` reads `.env.turso`.
- **Back up your puzzle folder** (`content/matches/`) somewhere like Google Drive. It isn't in git.
- **Remove an offensive nickname:** open the Turso dashboard → your database → **Shell** (or *Edit Data*) and run
  `DELETE FROM players WHERE nickname = 'BadName';`

## If something's wrong
- **"No matches have been loaded"** means the database has no puzzles yet. Run `pnpm puzzles:push`.
- **"Internal error" on every page:** check the two environment variables in Vercel (*Settings → Environment Variables*), then *Deployments → ⋯ → Redeploy*. *Deployments → (latest) → Logs* shows the real error.
- **Vercel's install step fails because of pnpm:** add the environment variable `ENABLE_EXPERIMENTAL_COREPACK=1` and redeploy. That makes Vercel use the exact pnpm version in `package.json`.

## Free plan limits (for a Reddit launch)
Both free plans are built for far more traffic than a small daily game gets. Each dashboard shows current usage. With no card on file nothing can be charged; if a limit were ever hit, the service would pause rather than bill you.
