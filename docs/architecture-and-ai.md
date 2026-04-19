# Architecture and AI Notes

This project is intentionally small: the game rules are pure TypeScript, the
state machine lives in one React hook, and the UI is SVG rendered with a
hand-drawn Rough.js style.

## Runtime Flow

`src/main.tsx` mounts `App`, and `App` wires together three concerns:

- Visual settings: aesthetic, roughness, board size, texture, coordinates.
- Game state: board, turn, history, last move, and win result from `useGame`.
- Computer turns: a React effect waits for `O`, calls `aiMove`, and places the
  returned move after a small delay.

The player move path is:

1. `Board` converts a pointer location into board coordinates.
2. `App.onCellClick` ignores invalid clicks and calls `place(row, col, 'X')`.
3. `useGame` copies the board, places the stone, checks for a win, flips turns,
   and records the move in history.
4. React re-renders the SVG board, including the latest move animation and any
   win decoration.

## Game Layer

`src/game/checkWin.ts` owns the core board types:

- `Player`: `'X'` or `'O'`
- `Cell`: a player or `null`
- `Board`: a square matrix of cells
- `WinResult`: winner plus the five cells that made the line

`checkWinAt` checks only the newest move. That is enough because a move cannot
create a win somewhere else on the board. It scans four axes: horizontal,
vertical, and the two diagonals.

`src/game/useGame.ts` is the state machine. Its reducer handles:

- `PLACE`: write one stone, check win, flip turn, append history.
- `UNDO`: remove one move after a win, or the human-plus-AI pair during active
  play.
- `RESET`: create a fresh empty board.

## Rendering Layer

`Board` is the root SVG surface. It layers the board like paper:

1. paper texture
2. optional coordinate labels
3. Rough.js grid
4. hover preview
5. X/O marks
6. win strike and loop

`roughPaths.ts` centralizes the path generation for marks and win decorations.
That keeps the visual style reusable while leaving components responsible for
placement and animation.

## AI Model

The AI is a shallow heuristic, not minimax and not machine learning. It does not
simulate future turns. Instead, it scores the best-looking moves right now, then
uses the selected difficulty profile to decide how sharp or fallible the final
choice should be.

The algorithm:

1. Find all occupied cells.
2. If the board is empty, play the center.
3. Build a candidate set of empty cells within two rows/columns of any occupied
   cell.
4. First check direct tactics: take an immediate AI win, then decide whether to
   block an immediate human win.
5. Score each candidate as both an attacking move for `O` and a blocking move
   against `X`.
6. Sort the candidates, then pick from the top of the list according to the
   difficulty profile.

The scoring function pretends the candidate cell already contains the evaluated
player. For each of the four axes, it counts contiguous stones in both
directions and records whether the line has open ends.

The score table is deliberately simple:

| Shape | Score |
| --- | ---: |
| Five or more | 100000 |
| Open four | 10000 |
| Closed four | 1000 |
| Open three | 500 |
| Closed three | 80 |
| Open two | 40 |
| Closed two | 8 |
| Everything else | 1 |

The final move score is the larger of:

- the AI's attack score
- the human's threat score, weighted by the difficulty's defense value

That defense value controls how urgently the AI treats blocking. Easy is more
attack-biased and noisy, medium is close to the original balanced heuristic, and
hard treats defense as equally important.

## Difficulty Profiles

Difficulty affects decision quality as well as the visible thinking delay:

- Easy uses high randomness, weaker defense, and often chooses from a wider pool
  of plausible moves.
- Medium mostly chooses the best heuristic move, but can occasionally pick a
  nearby alternative and can sometimes miss an immediate block.
- Hard has minimal randomness, always takes immediate wins, always blocks
  immediate human wins, and chooses the top-scored candidate.

The delay values still live in `TIMINGS.aiDelayMs`; those are presentation only.

## Current Limits

The game also has no draw state yet. In practice this is rare on larger boards,
but a complete rules layer would explicitly detect a full board with no winner.

The tactical block step handles only the first identified winning threat. If the
human creates a fork — two simultaneous winning cells — the AI blocks one of
them but cannot prevent the other. A minimax or threat-space search would be
needed to handle forks reliably.
