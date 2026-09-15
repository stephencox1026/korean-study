# Korean Study

Flashcards and Connections for learning Korean vocabulary.

- **Flashcards** — ~1,700 words across 35 decks with audio, breakdowns, and progress saved in your browser
- **Connections** — daily word-grouping puzzle in three modes: Group, One Shot, and Practice

## Run locally

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm run serve
```

Open [http://localhost:8765/](http://localhost:8765/) for flashcards and [http://localhost:8765/connections/](http://localhost:8765/connections/) for Connections.

> Use the local server (not `file://`). Connections loads puzzle data over HTTP.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run serve` | Start the dev server on port 8765 |
| `npm run check` | Validate all deck files |
| `npm run build` | Run checks, then regenerate `connections/data/deck-groups.json` |

## Editing decks

See [ADDING-A-SET.md](ADDING-A-SET.md). After changing decks:

```bash
npm run build
```

## Deploy

This is a static site — no backend required. Deploy the project root after `npm run build`.

### GitHub Pages (included)

Pushes to `main` deploy automatically via [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml).

Live site: **https://stephencox1026.github.io/korean-study/**

Enable in repo settings if needed: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Cloudflare Pages (recommended for custom domain)

1. Push this repo to GitHub.
2. In [Cloudflare Pages](https://pages.cloudflare.com/), create a project from the repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `/` (project root)
   - **Node version:** 20
4. Deploy. HTTPS is automatic.

Optional: add a custom domain under **Custom domains** in the Pages project.

Optional: enable [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) in the dashboard (no code changes needed).

### Netlify

Connect the repo or run `netlify deploy`. Settings are in [netlify.toml](netlify.toml).

### GitHub Actions

Every push to `main` runs `npm run build` in CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Privacy

See [privacy.html](privacy.html) for what is stored locally and how analytics may be used.

## Project layout

```
index.html          Flashcards app
app.js              Flashcard logic
decks/              Vocabulary deck files
connections/        Connections game (Group, One Shot, Practice)
tools/              Deck checker, puzzle builder, local server
```
