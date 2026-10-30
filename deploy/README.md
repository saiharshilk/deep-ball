# Hosting DEEP BALL on Oracle Cloud (Always Free)

Everything runs on one free Oracle server: the game (Next.js), its SQLite database file, and Caddy, a web server that sets up HTTPS on its own. There are no API keys and no monthly bill.

You do steps 1–4 in your browser. Steps 5–6 are one command each from this folder on your Mac.

## 1. Make the GitHub repo private
GitHub → `saiharshilk/deep-ball` → **Settings** → scroll to **Danger Zone** → **Change visibility** → **Private**.
The puzzle files contain every answer, so they shouldn't be public once people are competing. The server never needs GitHub: the deploy script copies files straight from your Mac.

## 2. Create an Oracle Cloud account
Sign up at **cloud.oracle.com** → **Start for free**.
- Oracle asks for a card to verify your identity. Always Free resources aren't charged, and the account stays on the free tier unless you choose to upgrade it.
- **Home region:** pick one close to your players (for example *US East (Ashburn)*). You can't change it later.

## 3. Create the server
Console → **Compute → Instances → Create instance**:
- **Name:** `deepball`
- **Image:** click *Change image* → **Canonical Ubuntu 24.04**
- **Shape:** click *Change shape* → **Ampere** → `VM.Standard.A1.Flex`, set to **1 OCPU, 6 GB memory**. It's marked "Always Free-eligible".
  - If you get "Out of capacity", try a different *Availability domain*, or use **AMD → `VM.Standard.E2.1.Micro`**, which is also free. It's slower, but the setup script adds swap so the build still fits.
- **Networking:** keep *Create new virtual cloud network* and *public subnet*, and make sure **Assign a public IPv4 address** is on.
- **SSH keys:** choose **Generate a key pair for me** and click **Save private key**. Then, in Terminal on your Mac:
  ```bash
  mkdir -p ~/.ssh && mv ~/Downloads/ssh-key-*.key ~/.ssh/deepball-oracle.key && chmod 600 ~/.ssh/deepball-oracle.key
  ```
Click **Create**. When the instance turns green, copy its **Public IP address**.

## 4. Open the web ports
On the instance page → click the **Subnet** link → **Security** (or *Security Lists*) → **Default Security List** → **Add Ingress Rules**. Add two rules:

| Source CIDR | IP Protocol | Destination port |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

## 5. Set up the server (once)
From the `deepball-krillion` folder (replace `<ip>`):
```bash
ssh -i ~/.ssh/deepball-oracle.key ubuntu@<ip> 'bash -s' < deploy/server-setup.sh
```
This takes about 3 minutes. It installs Node, pnpm and Caddy, opens the server's own firewall, creates the background service and adds a nightly database backup. At the end it prints your site address, for example `https://129-146-12-34.sslip.io`. sslip.io is a free service that points that name at your server's IP, so you get HTTPS without buying a domain.

## 6. Deploy
```bash
deploy/deploy.sh ubuntu@<ip>
```
This checks the puzzles, uploads the code (never your local database), builds it on the server and restarts the game. Run it again any time you change code or add puzzle files.

---

## Day to day
- **Add puzzles:** add `deep-ball/content/matches/YYYY-MM-DD.json`, run `pnpm puzzles:check`, then `deploy/deploy.sh ubuntu@<ip>`. Without a file for today, the site keeps serving the latest match.
- **Download a backup:**
  ```bash
  scp -i ~/.ssh/deepball-oracle.key "ubuntu@<ip>:/var/lib/deepball/backups/*" ~/Downloads/
  ```
- **Logs:**
  ```bash
  ssh -i ~/.ssh/deepball-oracle.key ubuntu@<ip> 'journalctl -u deepball -n 100 --no-pager'
  ```
- **Remove an offensive nickname** (that player shows as Anonymous again): `ssh` in, then run
  `sqlite3 /var/lib/deepball/deepball.db "DELETE FROM players WHERE nickname = 'BadName'"`.

## If something's wrong
- **The site doesn't load at all:** check the step 4 port rules. Caddy can't get an HTTPS certificate until port 80 is reachable, and it keeps retrying on its own once it is.
- **502 error:** the game isn't running. Check the logs above, then run `deploy/deploy.sh` again.
- **Using your own domain later:** point its DNS A record at the IP, then on the server run `DOMAIN=yourdomain.com bash -s < deploy/server-setup.sh` (same ssh command as step 5).

## Good to know
- Oracle may reclaim Always Free servers that sit almost completely idle for a week. A game people are playing is normally fine. Upgrading the account to *Pay As You Go* removes that rule and still costs nothing as long as you stay within the free limits.
- Where things live on the server: the database is `/var/lib/deepball/deepball.db`, backups are in `/var/lib/deepball/backups/` (14 days kept), and the app is in `/opt/deepball/app`.
