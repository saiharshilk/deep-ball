# Writing Deep Ball puzzles

Each day is one file: `content/matches/YYYY-MM-DD.json`. The date is the day in the game's
time zone (`GAME_TZ`, default `America/New_York`), and the match unlocks at that midnight.

```json
{
  "date": "2026-11-06",
  "matchNumber": 11,
  "prompts": [
    {
      "text": "Name a tennis player from Spain",
      "hint": "Any era, men or women.",
      "answers": [
        { "name": "Rafael Nadal", "aliases": ["rafa"], "pct": 40 },
        { "name": "Manuel Santana", "pct": 0.04 }
      ]
    }
  ]
}
```

## Rules the checker enforces

- Exactly **7 prompts**, each with at least **5 answers**.
- `matchNumber` goes up by exactly one per day (streaks depend on it), and the file name matches `date`.
- `pct` is your guess at the share of players (0–100) who'd give that answer. It sets the starting
  rarity; real plays take over as people answer. Under 0.05 is GRAND SLAM, 0.05–0.3 ACE,
  0.3–1 PASSING SHOT, 1–4 DOWN THE LINE, 4–10 CROSSCOURT, 10+ MOONBALL.
- No name or alias may belong to two answers in the same prompt.

Players don't need to type exactly: accents, capitals, a leading "the", a unique surname, and small
typos are all accepted, so aliases are only for genuinely different names ("rafa", "roland garros").

## Workflow

```bash
pnpm puzzles:check
```

This validates every file and shows how many days are scheduled. The server loads changes on restart.
You can safely fix a day after people have played it: answers someone was already scored on are kept.

To preview a future day locally: `GAME_DATE=2026-11-03 pnpm dev`.
