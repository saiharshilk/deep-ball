# v0 PROMPT — "DEEP BALL" (tennis rarity-trivia game)

> Copy everything below the line into v0. "DEEP BALL" is a working title; find-and-replace it if you choose another name.

---

## 1. What you're building

Build the complete frontend for **DEEP BALL — Tennis Edition**, a daily web trivia game with a retro 8-bit tennis-stadium look.

**Core loop:** Each day there are **7 tennis prompts** (e.g. "Name a left-handed tennis player"). The player has **25 seconds** per prompt to type **one** answer. Correct answers score points based on **how rare** they are. Common answers score a little and obscure ones score a lot. Every point also counts as **feet of distance**: after each answer, a pixel tennis ball is struck from the near baseline and flies **down a very long vertical court**. It travels past the net, the far baseline, the back fence, into the crowd and higher, and the camera scrolls to follow it. The total distance after 7 prompts is the day's result. The tagline is **"Rarer answers hit deeper."**

The game is fully playable on **mock data** for now. Every data call goes through one API module (`lib/api.ts`) so I can swap in a real backend later without touching UI code. **This separation is mandatory.**

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS. Use framer-motion for animation. Use shadcn/ui only for primitives such as Dialog, Sheet, and Tooltip, restyled to fit the theme. Use no external image assets: draw all art with CSS, inline SVG, or `<canvas>` so it stays crisp and pixel-perfect (`image-rendering: pixelated`). Fonts come from Google Fonts: **"Press Start 2P"** for big display numbers and titles, and **"VT323"** or **"Silkscreen"** for HUD labels and body copy.

---

## 2. Art direction — retro tennis stadium at night

Picture a **1984 arcade tennis cabinet** crossed with a **night session under floodlights at a grand old grass-court stadium**. Use a top-down, vertically scrolling pixel world with a CRT finish.

### Palette (define as CSS variables / Tailwind theme tokens)
| Token | Hex | Use |
|---|---|---|
| `--night` | `#0B1220` | page background, stands shadow |
| `--navy` | `#14213D` | panels, HUD boxes |
| `--grass-1` | `#2F7D32` | court stripe A |
| `--grass-2` | `#3A8F3D` | court stripe B (mowing pattern) |
| `--chalk` | `#F4F1E6` | court lines, primary text |
| `--ball` | `#D7F542` | optic-yellow tennis ball, primary accent, CTA |
| `--clay` | `#D9733B` | secondary accent (scores, warnings, "YOU" marker) |
| `--cream` | `#EAD9A6` | crowd sprites, scoreboard bulbs |
| `--purple` | `#4B2E83` | heritage-club trim on walls and banners |
| `--net` | `#C9CED6` | net mesh / tape |

### The world (one tall scrolling scene, bottom to top = near to far)
1. **Near baseline (0 ft)** with a tiny pixel player sprite: a 2-frame idle and a 4-frame swing.
2. **Grass court** with alternating light and dark **mowing stripes**, chalk singles and doubles lines, service boxes, center mark, and a worn brown patch behind each baseline.
3. **The net (39 ft)**: pixel mesh, white tape, and net posts. The ball clears it with a little shadow.
4. **Far baseline (78 ft)**, then the **back wall** with a purple-and-green sponsor-free banner that reads "DEEP BALL · DEEP BALL ·" and scrolls slowly like a marquee.
5. **Line judges and ball kids** (tiny sprites) along the sides, plus an **umpire's high chair** at the net.
6. **Stands (100 ft+)**: rows of pixel crowd heads in cream and navy with occasional flickering camera flashes. A few heads turn to track the ball as it flies past.
7. Further landmarks appear as the ball goes deeper: **press box**, **dot-matrix scoreboard**, **floodlight towers** with lens glow, **the stadium roof edge**, **the night sky** with pixel stars, **a blimp**, and **the moon** at the very top (≈700 ft).

**Landmark labels:** Thin text callouts sit on the left and right margins, styled like the screenshots, e.g. `— the service line`, `the net —`, `— the far baseline`, `the front row —`, `— the press box`, `the floodlights —`, `— the cheap seats`, `over the roof —`, `— orbit`.

**Side rails:** A **vertical distance ruler** on the right edge has ticks every 10 ft and labels every 50 ft. A **"YOU ◂"** marker in clay orange shows current distance. Vertical marquee text on both outer edges reads `DEEP BALL · 7 PROMPTS · DEEPBALL.GAME ·`.

**Finish:** Add a subtle CRT scanline overlay, faint vignette, and slight chromatic text shadow on titles (1px cyan/red offset). The whole court should feel lit by floodlights: radial light pools on the grass. Respect `prefers-reduced-motion` by disabling the marquee, shake, and flashes and making scroll transitions instant.

---

## 3. Screens & flow

### A. Landing / title
- Huge chunky title **DEEP BALL** (Press Start 2P, chalk with cyan/red offset). Subtitle: **T E N N I S   E D I T I O N** in letter-spaced optic yellow.
- Info line: `7 prompts · 25 seconds each · rarer answers hit deeper`.
- The court scene sits behind it, idle and parked at the near baseline. The ball bounces gently in the player's hand.
- Collapsible **▶ HOW TO PLAY** panel (content in §6).
- Primary CTA: full-width bordered button **▼ SERVE ▼** in an optic-yellow glow border on navy.
- Footer chip: `MATCH #3 · THU, OCT 29` (from mock data).
- Top-left hamburger menu and top-right sound toggle (see §5).

### B. Pre-prompt countdown
- The camera returns to the baseline and the prompt card drops in.
- A small pill under the card reads `serving · the clock starts in 3… 2… 1…`. The input stays disabled during the countdown.

### C. Prompt / answering
- **HUD (fixed top):** a left box labeled `DISTANCE` with a value like `40 ft` in cyan. A center row of **7 progress pips**: done ones filled (color = tier earned), the current one outlined and pulsing, future ones dark. Under the pips: `PROMPT 3 OF 7`. A right box labeled `SCORE` with the value in clay orange.
- **Prompt card** (center, navy panel with pixel-stepped corners): `PROMPT 3 OF 7` in small clay caps, then the question in large chalk text, then an optional ▼ hint/clarifier line in small cyan (e.g. "Open Era only, 1968–present").
- **Answer bar** (fixed bottom): a **circular countdown ring** showing seconds left, which turns clay orange at ≤5s and shakes slightly at ≤3s. Next to it is a wide text input with placeholder `type one answer…` and an optic-yellow **HIT** button. A thin progress bar under the input drains over 25s.
- **Invalid answer:** when the guess isn't on the list, show an inline message above the input: `"idk" — FAULT. not on the list, try again`. Shake the input. The clock keeps running and the player can retry as many times as they like.
- **Duplicate-of-alias handling** is done by the API. The UI just displays the returned canonical name.
- Enter submits. Autofocus the input. Trim whitespace. Disable the input while a request is in flight.

### D. Reveal (the shot)
On a valid answer:
1. The player sprite swings and the ball launches **up the court**. The camera smoothly scrolls with it (ease-out, ~1.6s + 0.4s per 100 ft) and the ball leaves a short pixel trail and a ground shadow. Landmarks pass by.
2. The ball lands at the new cumulative distance with a bounce, dust puff, and small screen shake. Crowd heads near it pop up (cheer).
3. A **tilted banner** (rotated −8°, navy with tier-colored glow border) shows the canonical answer in caps: **"RAFAEL NADAL" ▼**.
4. A centered **tier stamp** shows the big tier name (e.g. **DOWN THE LINE**) in the tier color, then `+30 PTS · +30 ft`, then a one-line flavor text (§4).
5. **Tier ladder** on the right: dashed horizontal guide lines at each tier with a colored dot and label, `MOONBALL · 10`, `CROSSCOURT · 20`, … The earned tier lights up. Use `% of players said this` if the API returns it, e.g. `2.1% of players said this`.
6. CTA: **NEXT SHOT ▼** (on prompt 7 it becomes **SEE THE SCORECARD ▼**).

On timeout: no swing. The ball dribbles into the net with a sad thud. Stamp: **TIME VIOLATION**, `—`, `+0 PTS`, flavor `the shot clock beat you.` Then **NEXT SHOT ▼**.

### E. Results / scorecard (after prompt 7)
- Header: `DEEP BALL` left, `MATCH #3 COMPLETE` right.
- Hero: giant distance number **`310`**, with **`310 ft`** in cyan and the landmark reached under it (e.g. `INTO THE PRESS BOX`).
- **Per-prompt breakdown:** a 7-row list with the prompt number, the player's answer, the tier chip, and points. Timeouts show `—` and `TIME VIOLATION`.
- **YOUR DEEP BALL, saved in this browser**: a 3×2 grid of stat tiles: STREAK (days), BEST STREAK, MATCHES played, AVERAGE (ft per match), BEST MATCH (ft + match #), GRAND SLAMS (count of top-tier answers all time). Store this in `localStorage` with try/catch. It must render fine when storage is empty.
- **TODAY'S DRAW: 6,370 finished today**: a big percentile line like `61%  you hit deeper than 61% of players`. Below it, a smooth **distribution curve** (SVG area chart, cyan stroke, navy fill) over 0–700 ft with a dashed `MEDIAN 265` line and a clay-orange vertical `YOU · 310` line.
- **SHARE** button that copies an emoji grid to the clipboard and shows a "Copied!" toast:
  ```
  DEEP BALL #3 🎾 310 ft
  🟨🟩🟦⬜🟪🟥🟩
  deepball.game
  ```
  (one square per prompt, colored by tier; ⬛ for timeout)
- A countdown to the next match: `next match in 10:12:44`.
- If today's match is already complete, a returning visitor lands directly on this scorecard.

### F. Small extras
- A dismissible bottom-sheet micro-survey reads **"THOUGHTS ON MERCH?"** with 👍 and 👎 pixel buttons and an ✕. It appears once on the results screen and stores the dismissal in localStorage.

---

## 4. Scoring tiers (UI constants; the API returns which tier)

| Tier key | Label | Points / ft | Color | Flavor text |
|---|---|---|---|---|
| `MOONBALL` | MOONBALL | 10 | `#C9CED6` grey | "Everyone's first thought. Still in." |
| `CROSSCOURT` | CROSSCOURT | 20 | `#D7F542` optic | "Solid, safe, and in play." |
| `DOWN_THE_LINE` | DOWN THE LINE | 30 | `#3FD0C9` teal | "Good pull. Most fans would know it." |
| `PASSING_SHOT` | PASSING SHOT | 50 | `#4C8DF6` blue | "Ripped past the field." |
| `ACE` | ACE | 80 | `#B26BFF` purple | "Untouchable. Barely anyone said this." |
| `GRAND_SLAM` | GRAND SLAM | 100 | `#FF6B3D` clay-fire, animated shimmer | "Nobody else found this one." |
| `TIME_VIOLATION` | TIME VIOLATION | 0 | `#3A4560` | "The shot clock beat you." |

Invalid guesses are **not** a tier. They produce the inline FAULT message and the player retries.

---

## 5. Chrome / global UI
- **Hamburger menu (top-left)** opens a left Sheet styled as a pixel panel with: How to Play, Stats, Past Matches (list of match #1–#3 from mock, locked/unlocked states), About, and Settings (sound on/off, reduced motion on/off, high-contrast on/off).
- **Sound toggle (top-right):** speaker icon. Wire up tiny Web Audio API beeps (no audio files): a "pock" on hit, a rising arpeggio for ACE/GRAND SLAM, a buzz on FAULT, and a crowd "ooh" made from filtered noise. Default is **muted**, and the preference persists in localStorage.
- **Responsive:** Desktop centers the court column (~760px wide) with stands filling both sides. Mobile at 375px gets a full-width court, a HUD that shrinks to compact boxes, and an answer bar pinned above the keyboard (use `visualViewport` / `dvh`). No horizontal scroll.
- **Accessibility:** All buttons need visible focus rings (optic yellow). The prompt and result have `aria-live="polite"` announcements. The countdown ring is labeled with seconds remaining. Color is never the only tier signal because the label is always shown.

---

## 6. How-to-play copy
1. You get **7 tennis prompts**, one at a time.
2. You have **25 seconds** to type **one** answer per prompt.
3. Wrong guess? That's a **fault**. Try again while the clock runs.
4. Every correct answer scores. **The rarer the answer, the deeper the ball flies.**
5. Points = feet. Hit it past the far baseline, into the crowd, and over the roof.
6. One match a day. Same prompts for everyone.

---

## 7. Architecture (required, this is what the backend will plug into)

```
app/
  page.tsx                 // decides Landing vs Scorecard (if today's match is done)
  play/page.tsx            // game loop
components/
  court/CourtScene.tsx     // the tall scrolling pixel world (canvas or SVG layers)
  court/Ball.tsx, PlayerSprite.tsx, CrowdRows.tsx, Landmarks.tsx, DistanceRuler.tsx
  hud/Hud.tsx, ProgressPips.tsx, CountdownRing.tsx
  game/PromptCard.tsx, AnswerBar.tsx, RevealStamp.tsx, AnswerBanner.tsx, TierLadder.tsx
  results/Scorecard.tsx, StatsGrid.tsx, DistributionChart.tsx, ShareButton.tsx
  chrome/MenuSheet.tsx, SoundToggle.tsx, HowToPlay.tsx, MerchSurvey.tsx
lib/
  types.ts                 // shared types below
  api.ts                   // the ONLY place UI gets data; currently calls mock
  mock/mockServer.ts       // fake implementations with 300–600ms latency
  mock/data.ts             // mock data below
  tiers.ts                 // tier table from §4
  stats.ts                 // localStorage stats helpers (try/catch everything)
  sound.ts                 // Web Audio beeps
hooks/
  useGame.ts               // state machine: idle → countdown → answering → revealing → (next | finished)
```

### Types (`lib/types.ts`)
```ts
export type TierKey =
  | "MOONBALL" | "CROSSCOURT" | "DOWN_THE_LINE"
  | "PASSING_SHOT" | "ACE" | "GRAND_SLAM" | "TIME_VIOLATION";

export interface PromptPublic {
  id: string;
  index: number;          // 1..7
  text: string;           // "Name a left-handed tennis player"
  hint?: string;          // clarifier line under the prompt
  timeLimitSec: number;   // 25
}

export interface DailyMatch {
  matchId: string;        // "2026-10-29"
  matchNumber: number;    // 3
  dateLabel: string;      // "THU, OCT 29"
  prompts: PromptPublic[]; // NOTE: never includes answers
}

export type SubmitResult =
  | { status: "valid"; canonical: string; tier: TierKey; points: number; pctOfPlayers: number }
  | { status: "invalid"; message: string }      // FAULT, retry allowed
  | { status: "duplicate"; message: string };   // same answer submitted twice this prompt

export interface FieldStats {
  playersFinished: number;
  medianDistance: number;
  distribution: { ft: number; density: number }[]; // for the curve, 0..700
  percentile: number;                              // 0..100 for this player's distance
}
```

### API surface (`lib/api.ts`; UI calls only these)
```ts
getTodayMatch(): Promise<DailyMatch>
submitAnswer(matchId: string, promptId: string, answer: string): Promise<SubmitResult>
reportTimeout(matchId: string, promptId: string): Promise<{ tier: "TIME_VIOLATION"; points: 0 }>
getFieldStats(matchId: string, myDistance: number): Promise<FieldStats>
```
For now each function delegates to `lib/mock/mockServer.ts`. Put the env switch at the top of `api.ts` as `const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false"`, with a commented `fetch('/api/...')` stub for each.

**Mock matching rules (in `mockServer.ts`):** Normalize by lowercasing, stripping accents (NFD) and punctuation, and collapsing spaces. Match against `name` and every `alias`. Also accept a surname-only answer when it maps to exactly one entry. Map `pct` to a tier: ≥10 → MOONBALL, ≥4 → CROSSCOURT, ≥1 → DOWN_THE_LINE, ≥0.3 → PASSING_SHOT, ≥0.05 → ACE, otherwise GRAND_SLAM.

---

## 8. Mock data (`lib/mock/data.ts`)

`pct` = share of players who gave that answer (mock popularity). Answers live **only** in the mock server and are never sent in `getTodayMatch()`.

```ts
export const MOCK_MATCH_META = {
  matchId: "2026-10-29",
  matchNumber: 3,
  dateLabel: "THU, OCT 29",
};

type Ans = { name: string; aliases?: string[]; pct: number };
export const MOCK_PROMPTS: { id: string; text: string; hint?: string; answers: Ans[] }[] = [
  {
    id: "p1",
    text: "Name a tennis shot or stroke",
    hint: "Any recognised shot, spin, or serve type.",
    answers: [
      { name: "Forehand", pct: 24 }, { name: "Backhand", pct: 18 },
      { name: "Serve", aliases: ["service"], pct: 14 }, { name: "Volley", pct: 10 },
      { name: "Lob", pct: 7 }, { name: "Drop Shot", aliases: ["dropshot", "drop"], pct: 6 },
      { name: "Overhead Smash", aliases: ["smash", "overhead"], pct: 5 },
      { name: "Slice", pct: 4 }, { name: "Half Volley", pct: 2 },
      { name: "Tweener", aliases: ["between the legs", "hot dog"], pct: 1.6 },
      { name: "Passing Shot", pct: 1.4 }, { name: "Topspin", pct: 1.2 },
      { name: "Kick Serve", aliases: ["kicker", "twist serve"], pct: 0.9 },
      { name: "Approach Shot", pct: 0.8 }, { name: "Drive Volley", pct: 0.6 },
      { name: "Moonball", pct: 0.5 }, { name: "Return of Serve", aliases: ["return"], pct: 0.5 },
      { name: "Flat Serve", pct: 0.4 }, { name: "Chip and Charge", pct: 0.2 },
      { name: "Squash Shot", pct: 0.15 }, { name: "Around the Post", aliases: ["around the net post"], pct: 0.1 },
      { name: "Underarm Serve", aliases: ["underhand serve"], pct: 0.1 },
      { name: "Sky Hook", pct: 0.04 }, { name: "SABR", aliases: ["sneak attack by roger"], pct: 0.02 },
    ],
  },
  {
    id: "p2",
    text: "Name a men's Grand Slam singles champion",
    hint: "Open Era only, 1968 to present.",
    answers: [
      { name: "Roger Federer", pct: 22 }, { name: "Rafael Nadal", aliases: ["rafa"], pct: 20 },
      { name: "Novak Djokovic", aliases: ["nole"], pct: 18 }, { name: "Carlos Alcaraz", pct: 9 },
      { name: "Pete Sampras", pct: 5 }, { name: "Andy Murray", pct: 5 },
      { name: "Jannik Sinner", pct: 4 }, { name: "Andre Agassi", pct: 4 },
      { name: "Bjorn Borg", pct: 3 }, { name: "John McEnroe", pct: 2 },
      { name: "Ivan Lendl", pct: 1.5 }, { name: "Boris Becker", pct: 1.5 },
      { name: "Jimmy Connors", pct: 0.8 }, { name: "Stefan Edberg", pct: 0.8 },
      { name: "Lleyton Hewitt", pct: 0.6 }, { name: "Stan Wawrinka", pct: 0.6 },
      { name: "Andy Roddick", pct: 0.4 }, { name: "Daniil Medvedev", pct: 0.4 },
      { name: "Juan Martin del Potro", aliases: ["delpo"], pct: 0.4 },
      { name: "Marin Cilic", pct: 0.3 }, { name: "Dominic Thiem", pct: 0.3 },
      { name: "Goran Ivanisevic", pct: 0.3 }, { name: "Michael Chang", pct: 0.3 },
      { name: "Gustavo Kuerten", aliases: ["guga"], pct: 0.2 }, { name: "Marat Safin", pct: 0.2 },
      { name: "Mats Wilander", pct: 0.2 }, { name: "Juan Carlos Ferrero", pct: 0.1 },
      { name: "Yevgeny Kafelnikov", pct: 0.1 }, { name: "Patrick Rafter", pct: 0.1 },
      { name: "Carlos Moya", pct: 0.1 }, { name: "Richard Krajicek", pct: 0.1 },
      { name: "Pat Cash", pct: 0.05 }, { name: "Michael Stich", pct: 0.05 },
      { name: "Petr Korda", pct: 0.04 }, { name: "Thomas Johansson", pct: 0.03 },
      { name: "Gaston Gaudio", pct: 0.03 }, { name: "Andres Gomez", pct: 0.02 },
    ],
  },
  {
    id: "p3",
    text: "Name a professional tennis tournament",
    hint: "Grand Slams, ATP/WTA tour events, or the tour finals.",
    answers: [
      { name: "Wimbledon", pct: 30 }, { name: "US Open", pct: 18 },
      { name: "French Open", aliases: ["roland garros"], pct: 14 },
      { name: "Australian Open", pct: 12 },
      { name: "Indian Wells", aliases: ["bnp paribas open"], pct: 5 },
      { name: "Miami Open", aliases: ["miami"], pct: 3.5 },
      { name: "ATP Finals", aliases: ["nitto atp finals", "year end finals"], pct: 2 },
      { name: "Madrid Open", aliases: ["madrid"], pct: 1.8 },
      { name: "Italian Open", aliases: ["rome", "internazionali"], pct: 1.6 },
      { name: "Cincinnati Open", aliases: ["cincinnati", "western and southern open"], pct: 1.4 },
      { name: "Monte Carlo Masters", aliases: ["monte carlo"], pct: 1.2 },
      { name: "Canadian Open", aliases: ["rogers cup", "national bank open"], pct: 1 },
      { name: "Queen's Club Championships", aliases: ["queens", "queen's"], pct: 0.9 },
      { name: "Paris Masters", aliases: ["rolex paris masters", "bercy"], pct: 0.7 },
      { name: "Shanghai Masters", aliases: ["shanghai"], pct: 0.6 },
      { name: "Dubai Tennis Championships", aliases: ["dubai"], pct: 0.5 },
      { name: "Halle Open", aliases: ["halle", "terra wortmann open"], pct: 0.4 },
      { name: "Citi Open", aliases: ["washington open", "mubadala citi dc open"], pct: 0.35 },
      { name: "China Open", aliases: ["beijing"], pct: 0.3 },
      { name: "Mexican Open", aliases: ["acapulco", "abierto mexicano"], pct: 0.25 },
      { name: "Rotterdam Open", aliases: ["rotterdam", "abn amro open"], pct: 0.2 },
      { name: "Swiss Indoors", aliases: ["basel"], pct: 0.2 },
      { name: "Eastbourne International", aliases: ["eastbourne"], pct: 0.15 },
      { name: "Qatar Open", aliases: ["doha"], pct: 0.1 },
      { name: "Hall of Fame Open", aliases: ["newport"], pct: 0.06 },
      { name: "Kitzbuhel", aliases: ["generali open"], pct: 0.04 },
      { name: "Swedish Open", aliases: ["bastad"], pct: 0.03 },
      { name: "Winston-Salem Open", aliases: ["winston salem"], pct: 0.03 },
      { name: "Los Cabos Open", aliases: ["los cabos"], pct: 0.02 },
    ],
  },
  {
    id: "p4",
    text: "Name a woman who has been ranked WTA world No. 1 in singles",
    hint: "Computer rankings, 1975 to present.",
    answers: [
      { name: "Serena Williams", pct: 26 }, { name: "Steffi Graf", pct: 10 },
      { name: "Iga Swiatek", pct: 9 }, { name: "Aryna Sabalenka", pct: 8 },
      { name: "Maria Sharapova", pct: 7 }, { name: "Naomi Osaka", pct: 6 },
      { name: "Martina Navratilova", pct: 5 }, { name: "Venus Williams", pct: 4 },
      { name: "Chris Evert", pct: 3.5 }, { name: "Ashleigh Barty", aliases: ["ash barty"], pct: 3 },
      { name: "Simona Halep", pct: 2 }, { name: "Monica Seles", pct: 1.8 },
      { name: "Caroline Wozniacki", pct: 1.5 }, { name: "Kim Clijsters", pct: 1.2 },
      { name: "Justine Henin", pct: 1 }, { name: "Martina Hingis", pct: 1 },
      { name: "Victoria Azarenka", pct: 0.9 }, { name: "Angelique Kerber", pct: 0.7 },
      { name: "Lindsay Davenport", pct: 0.6 }, { name: "Garbine Muguruza", pct: 0.5 },
      { name: "Karolina Pliskova", pct: 0.4 }, { name: "Ana Ivanovic", pct: 0.4 },
      { name: "Jennifer Capriati", pct: 0.3 }, { name: "Amelie Mauresmo", pct: 0.25 },
      { name: "Jelena Jankovic", pct: 0.2 }, { name: "Arantxa Sanchez Vicario", pct: 0.15 },
      { name: "Dinara Safina", pct: 0.1 }, { name: "Tracy Austin", pct: 0.08 },
      { name: "Evonne Goolagong", aliases: ["evonne goolagong cawley"], pct: 0.04 },
    ],
  },
  {
    id: "p5",
    text: "Name a left-handed tennis player",
    hint: "Must have played on the pro tour and hit left-handed.",
    answers: [
      { name: "Rafael Nadal", aliases: ["rafa"], pct: 38 }, { name: "John McEnroe", pct: 10 },
      { name: "Martina Navratilova", pct: 8 }, { name: "Monica Seles", pct: 5 },
      { name: "Ben Shelton", pct: 4 }, { name: "Rod Laver", pct: 3.5 },
      { name: "Jimmy Connors", pct: 3 }, { name: "Petra Kvitova", pct: 2.5 },
      { name: "Angelique Kerber", pct: 2 }, { name: "Jack Draper", pct: 1.8 },
      { name: "Denis Shapovalov", pct: 1.5 }, { name: "Goran Ivanisevic", pct: 1.2 },
      { name: "Cameron Norrie", pct: 1 }, { name: "Leylah Fernandez", pct: 0.8 },
      { name: "Fernando Verdasco", pct: 0.6 }, { name: "Feliciano Lopez", pct: 0.5 },
      { name: "Thomas Muster", pct: 0.4 }, { name: "Marcelo Rios", pct: 0.35 },
      { name: "Guillermo Vilas", pct: 0.3 }, { name: "Greg Rusedski", pct: 0.25 },
      { name: "Beatriz Haddad Maia", pct: 0.2 }, { name: "Henri Leconte", pct: 0.1 },
      { name: "Lucie Safarova", pct: 0.1 }, { name: "Petr Korda", pct: 0.08 },
      { name: "Ekaterina Makarova", pct: 0.06 }, { name: "Gilles Muller", pct: 0.04 },
      { name: "Manuel Orantes", pct: 0.03 }, { name: "Ann Jones", pct: 0.02 },
    ],
  },
  {
    id: "p6",
    text: "Name a country that has won the Davis Cup",
    hint: "Historic names count (e.g. West Germany, Czechoslovakia).",
    answers: [
      { name: "United States", aliases: ["usa", "us", "america"], pct: 22 },
      { name: "Spain", pct: 15 }, { name: "Australia", pct: 12 },
      { name: "France", pct: 10 }, { name: "Italy", pct: 9 },
      { name: "Great Britain", aliases: ["uk", "britain", "england", "british isles"], pct: 7 },
      { name: "Serbia", pct: 5 }, { name: "Switzerland", pct: 4 },
      { name: "Sweden", pct: 3.5 }, { name: "Argentina", pct: 3 },
      { name: "Germany", aliases: ["west germany"], pct: 2.5 },
      { name: "Croatia", pct: 2 }, { name: "Canada", pct: 1.6 },
      { name: "Russia", pct: 1.4 }, { name: "Czech Republic", aliases: ["czechia"], pct: 0.8 },
      { name: "Czechoslovakia", pct: 0.3 }, { name: "South Africa", pct: 0.04 },
    ],
  },
  {
    id: "p7",
    text: "Name an Olympic singles gold medalist in tennis",
    hint: "Since tennis returned as a full medal sport in 1988.",
    answers: [
      { name: "Novak Djokovic", pct: 20 }, { name: "Rafael Nadal", pct: 15 },
      { name: "Andy Murray", pct: 13 }, { name: "Serena Williams", pct: 12 },
      { name: "Andre Agassi", pct: 6 }, { name: "Venus Williams", pct: 5 },
      { name: "Steffi Graf", pct: 4 }, { name: "Alexander Zverev", aliases: ["sascha zverev"], pct: 3 },
      { name: "Zheng Qinwen", aliases: ["qinwen zheng"], pct: 2 },
      { name: "Justine Henin", pct: 1.2 }, { name: "Belinda Bencic", pct: 1 },
      { name: "Jennifer Capriati", pct: 0.8 }, { name: "Lindsay Davenport", pct: 0.6 },
      { name: "Elena Dementieva", pct: 0.5 }, { name: "Yevgeny Kafelnikov", pct: 0.4 },
      { name: "Monica Puig", pct: 0.3 }, { name: "Nicolas Massu", pct: 0.1 },
      { name: "Marc Rosset", pct: 0.04 }, { name: "Miloslav Mecir", pct: 0.03 },
    ],
  },
];

// Field stats for the results screen
export const MOCK_FIELD = {
  playersFinished: 6370,
  medianDistance: 265,
  // generate the curve in code: skewed bell, peak ~250, tail to 700, sampled every 10 ft
};

// Seed localStorage on first visit so the stats grid isn't empty in the demo
export const MOCK_HISTORY = [
  { matchNumber: 1, date: "2026-10-27", distance: 230, grandSlams: 0, tiers: ["MOONBALL","CROSSCOURT","DOWN_THE_LINE","MOONBALL","PASSING_SHOT","TIME_VIOLATION","CROSSCOURT"] },
  { matchNumber: 2, date: "2026-10-28", distance: 370, grandSlams: 1, tiers: ["CROSSCOURT","ACE","MOONBALL","DOWN_THE_LINE","GRAND_SLAM","CROSSCOURT","MOONBALL"] },
];
```

**Landmarks table (`components/court/Landmarks.tsx`)** for the callouts and the results-screen "reached" line:
```ts
export const LANDMARKS = [
  { ft: 0,   label: "the baseline" },
  { ft: 21,  label: "the service line" },
  { ft: 39,  label: "the net" },
  { ft: 78,  label: "the far baseline" },
  { ft: 100, label: "the back wall" },
  { ft: 130, label: "the front row" },
  { ft: 200, label: "the cheap seats" },
  { ft: 280, label: "the press box" },
  { ft: 360, label: "the scoreboard" },
  { ft: 450, label: "the floodlights" },
  { ft: 540, label: "over the roof" },
  { ft: 620, label: "the blimp" },
  { ft: 700, label: "orbit" },
];
```

---

## 9. Quality bar
- Make it feel like a **polished game**, not a form. Motion should be snappy and tactile: button presses depress 2px, the ball has squash-and-stretch on bounce, and the camera eases.
- Keep everything pixel-aligned: use integer transforms and no blurry scaling on sprites.
- Never leak answer lists to client components. Only `mockServer.ts` imports `MOCK_PROMPTS` answers.
- No ads, no external images, and no lorem ipsum. Use the copy above.
- Make sure the whole flow works end-to-end with mock data: Landing → 7 prompts (including one deliberate invalid retry and the timeout path) → Scorecard → Share → reload lands on the Scorecard.
