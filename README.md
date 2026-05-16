# Mahjong Hand Betting Game 🀄

A web-based card game using Mahjong tiles where you bet whether the next hand will score higher or lower than the current one. Built with Angular 18 using modern standalone components and signals for reactive state.

## Live Demo

> Deploy to any static host after `ng build` — the `dist/mahjong-betting-game/browser` folder is fully self-contained.

---

## Setup & Running

```bash
# Install dependencies (requires Node 18+)
npm install

# Start development server at http://localhost:4200
npx ng serve

# Production build
npx ng build
```

---

## How to Play

1. **Landing page** — Start a new game or check the leaderboard.
2. **Game screen** — You're dealt 5 Mahjong tiles. Their values sum to your *Current Hand Total*.
3. **Bet** — Predict whether the *next* hand total will be **Higher** or **Lower**.
4. **Reveal** — The next hand is dealt. A correct bet adds the revealed total to your score.
5. **Continue** until the game ends — then enter your name if you made the leaderboard!

### Tile Values

| Tile type | Value |
|-----------|-------|
| Number tiles (1–9) | Face value |
| Wind tiles (East/South/West/North) | Starts at **5**, ±1 per round |
| Dragon tiles (Red/Green/White) | Starts at **5**, ±1 per round |

Honor tile values change **per tile type**: if that type of tile appears in a winning hand it goes up by 1; in a losing hand it goes down by 1.

### Game Over Conditions

- Any single honor-tile value reaches **0** (too low) or **10** (too high).
- The draw pile is exhausted **3 times** (2 reshuffles allowed).

---

## Architecture

```
src/app/
├── core/
│   ├── models/          # tile.model.ts, game.model.ts, leaderboard.model.ts
│   └── services/        # deck.service.ts, game.service.ts, leaderboard.service.ts
├── features/
│   ├── landing/         # Landing page + leaderboard display
│   ├── game/            # Main game screen (betting / revealing phases)
│   └── game-over/       # End-of-game screen with score submission
└── shared/
    └── components/
        └── tile-card/   # Reusable tile visual component
```

**State management** uses Angular signals (`signal` / `computed`) inside `GameService`. All components are `OnPush` and read state reactively — adding a new game mechanic means touching only `game.service.ts` and the relevant component template.

**Leaderboard** is persisted in `localStorage` — no backend required.

---

## Extending the Game (Interview Notes)

The codebase is deliberately designed to be easy to extend:

- **New tile types** → add entries to `TileSuit` in `tile.model.ts` and update `DeckService.createDeck()`.
- **Different scoring rules** → update `GameService.resolveRound()`.
- **New game-over conditions** → extend `GameService.checkGameOver()`.
- **New UI phases** → add a value to `GamePhase` and handle it in `game.component.html`.

---

## AI Usage

| Area | Approach |
|------|----------|
| Architecture & component design | Handwritten — I designed the signal-based state model, route structure, and component boundaries |
| CSS / animations | Handwritten — all SCSS was authored by me |
| Game logic | Handwritten — deck creation, shuffle, tile-value dynamics, game-over checks |
| Boilerplate reduction | Claude Code (AI) was used to accelerate scaffolding and to sanity-check the reactive patterns |

---

## Tech Stack

- **Angular 18** — standalone components, signals, `OnPush` change detection
- **SCSS** — component-scoped styles, CSS custom properties
- **localStorage** — leaderboard persistence (no backend)
- **Google Fonts** — Cinzel (headings), Inter (body), Noto Serif SC (tile characters)
