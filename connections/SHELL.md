# Connections shared shell

`index.html` (Group), `one-shot.html` (One Shot), and `practice.html` (Practice) must keep shared regions identical.

## Shared (edit both files together)

- `<head>` — title, `style.css`
- `<header class="app-header">` — title, `#puzzle-label`, `.mode-nav`
- `<hr class="section-divider">`
- `<section id="pool">` — structure, `#tile-grid`, `.pool-controls` button labels
- Win modal markup
- Script load order: `daily.js`, `puzzles/prototype-01.js`, then mode script

## Mode-only

| Region | Practice (`practice.html`) | Group (`index.html`) |
|--------|--------------------------|---------------------|
| `#play-top` inner | `#category-board` | `#solved-groups` |
| Pool hint | Drag Tile To Correct Section Above | Select Four Tiles, Then Submit |
| Extra CSS | — | `nyt.css` |
| JS | `script.js` | `nyt.js` |

## Button behavior (labels stay the same)

| Button | Practice | Group |
|--------|-----------|-------|
| Clear | Clear all placements | Clear tile selection |
| Submit | Grade placements | Group 4 selected tiles |
| Show Answer | Fill slots + translations | Reveal all category bars |
| New Puzzle | Random practice puzzle | Random practice puzzle |
