# Amőba — Five in a Row

A hand-drawn Gomoku game built with React 18, TypeScript, and [Rough.js](https://roughjs.com/). Every line on screen — grid, marks, win decoration — is rendered as a wobbly SVG stroke, mimicking ballpoint pen on notebook paper.

## Status

**Runnable.** `pnpm dev` starts the dev server. `pnpm build` produces a clean production bundle (TypeScript strict, no errors).

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # dist/
pnpm preview    # serve dist/ locally
```

Requires Node 18+.

## How to play

Click any empty cell to place **X**. The AI plays **O** automatically after a short thinking delay. Get five in a row (horizontally, vertically, or diagonally) to win. The win line is highlighted with a pencil strike-through and a hand-drawn loop.

Open **Tweaks** (bottom-right button) to change aesthetics, board size, roughness, and more.

## Features

| | |
|---|---|
| **Three aesthetics** | (a) graphite on cream · (b) blue ballpoint on white *(default)* · (c) two-colour pencil |
| **Board sizes** | 13×13 · 15×15 · 19×19 (toggleable mid-session) |
| **Hand-drawn rendering** | Rough.js for grid, X/O marks, win loop + strike-through, buttons |
| **Draw-on animation** | `stroke-dashoffset` per stroke, ~220 ms, cubic-bezier easing |
| **AI opponent** | Heuristic chain-scoring across 4 directions; difficulty scales the thinking delay |
| **Tweaks panel** | Aesthetic · Grid size · Roughness slider · Paper fibre texture · Coordinate labels |
| **Undo** | Pops the last player+AI move pair |
| **Accessibility** | `prefers-reduced-motion` respected; shape-distinguishable marks (no colour-only diff) |

## Project structure

```
src/
  tokens.ts          — design tokens: colours, timings, stroke weights, grid sizes
  roughPaths.ts      — Rough.js path generators (X, O, win loop, win strike, grid)
  game/
    checkWin.ts      — pure win detection
    aiMove.ts        — heuristic opponent (chain scoring, open-end counting)
    useGame.ts       — useReducer-based game state hook
  components/
    Board.tsx        — SVG board, hit-testing, hover preview
    Grid.tsx         — dashed wobbly grid lines via Rough.js
    Mark.tsx         — animated X / O stroke rendering
    PaperDefs.tsx    — SVG defs: turbulence noise filter, fiber pattern
    WinDecoration.tsx — animated strike-through + loop on win
    MarginNotes.tsx  — sidebar with score, turn, difficulty, actions
    TurnIndicator.tsx
    DifficultyPicker.tsx
    RoughButton.tsx  — Rough.js-bordered button
    Tweaks.tsx       — floating tweaks panel
    WinBanner.tsx    — win banner overlay
  App.tsx            — root: state wiring, AI effect, tweak state
  main.tsx
  styles.css
index.html
```

## Design artefacts

The `design/` folder preserves the original handoff from [claude.ai/design](https://claude.ai/design):

- **`design/Amőba.html`** — interactive HTML/CSS/JS prototype (the visual source of truth; open in a browser)
- **`design/README.html`** — handoff doc with design tokens, Rough.js configs, component tree, interaction spec, and accessibility notes
- **`design/chat1.md`** — full design-session transcript showing how the aesthetic and feature decisions were reached

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict)
- [Rough.js 4.6](https://roughjs.com/) — hand-drawn SVG primitives
- [Caveat](https://fonts.google.com/specimen/Caveat) (handwriting) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (data/UI) via Google Fonts
