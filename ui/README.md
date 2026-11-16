# RustXNG — Vue Search UI

A clean, modern search UI for [RustXNG](https://github.com/sahenjp/RustXNG)
(the Rust rewrite of SearXNG, a self-hosted metasearch engine), built with
**Vue 3.5 + Vite + TypeScript**. This folder is the `ui/` folder of the
forked RustXNG repo.

- Text search, image search (masonry grid + lightbox), videos, news
- Autocomplete, recent searches, suggestions / “Did you mean”, pagination
- Light/dark mode, mobile-responsive, plain CSS (no UI framework)
- Settings: backend URL, results per page, SafeSearch, time range, language
- URL-synced state: `?q=`, `category`, `page`

## Prerequisite

A running RustXNG server (default `http://127.0.0.1:29483`).

## Run

```bash
npm install
npm run dev      # http://127.0.0.1:5173 — needs RustXNG running on :29483
npm run build    # type-check + production build into dist/
npm run preview  # http://127.0.0.1:4173 — serves dist/ with the same proxy
```

## CORS — how the UI talks to RustXNG

RustXNG sends **no CORS headers**, so a page served from another origin
cannot call it directly with `fetch`.

- **Dev / preview:** the app calls `/api/search`, `/api/autocompleter`,
  `/api/healthz`, … and Vite proxies `/api/*` to the backend
  (`vite.config.ts`, `server.proxy` + `preview.proxy`).
  Proxy target: `$VITE_RUSTXNG_BASE_URL`, default
  `http://127.0.0.1:29483` (see `.env.example`). The target is read when
  Vite starts — restart `npm run dev` after changing it.
- **Served from the same origin** (see “Serving from RustXNG” below):
  the app calls `/search`, … directly (no `/api` prefix, no proxy).
- **Anywhere else:** the app calls the configured backend URL directly.
  That only works if that origin serves the UI too, or if a reverse proxy
  maps `/api` → RustXNG. A plain cross-origin fetch will be blocked.

Changing the backend URL in the in-app Settings is saved to
`localStorage` and is used for display, health checks, and direct
(same-origin) calls. In dev/preview it does **not** retarget the Vite
proxy — use `VITE_RUSTXNG_BASE_URL` for that.

## API used

All calls live in `src/api/rustxng.ts`:

| Call | Purpose |
| --- | --- |
| `GET /search?q=&format=json&categories=&pageno=&max_results=&language=&time_range=&engines=&safesearch=` | Text (`categories=general`) / image (`categories=images`) / video / news search |
| `GET /autocompleter?q=` | Autocomplete suggestions (JSON array of strings) |
| `GET /healthz` | Backend reachable? |

Image results use `thumbnail` first, falling back to `img_src`. Both may
be `/image_proxy?url=…` URLs — the app uses them as-is, prefixed with
the backend base / proxy prefix.

## Mock API (no real RustXNG needed)

To smoke-test the UI without a Rust server:

```bash
node scripts/mock-api.mjs   # mock on :29483 — 3 text + 3 image results
npm run preview             # in another terminal — http://127.0.0.1:4173/
```

Then open `http://127.0.0.1:4173/?q=cats` and
`http://127.0.0.1:4173/?q=cats&category=images`. The mock serves the exact
RustXNG JSON shape (`query`, `results`, `answers`, `corrections`,
`suggestions`, `infoboxes`, `unresponsive_engines`) plus
`/autocompleter` and `/healthz`. **This proves the UI wiring only — it is
not a test against a real RustXNG server.**

## Serving from RustXNG (follow-up, not implemented here)

No Rust code was changed in this folder. A later step in the fork could
serve the built UI from RustXNG itself, so the UI and the API share one
origin (and CORS disappears):

1. Build the UI: `npm run build` → `ui/dist/`
2. In the Rust server, serve `ui/dist` as static files at `/ui/`
   (e.g. with `tower-http`'s `ServeDir`, falling back to `index.html`
   for the SPA route), keeping `/search`, `/autocompleter` and
   `/healthz` on the API as today.
3. The UI detects it is on port `29483` and calls the API directly
   (no `/api` prefix) — see `src/api/rustxng.ts` (`apiPrefix()`).

That is a Rust-side change in the fork, not in this UI folder.

## Structure

```
src/
  api/rustxng.ts        typed API client (search / autocomplete / health)
  types/index.ts        SearchResponse / SearchResult / Settings types
  components/
    SearchBar.vue       search box + debounced autocomplete dropdown
    Tabs.vue            All / Images / Videos / News
    ResultList.vue      text results
    ImageGrid.vue       image masonry grid
    Lightbox.vue        full-image viewer with Prev/Next
    SettingsBar.vue     backend URL, per-page, SafeSearch, time, language
  App.vue               home + results views, URL-synced state, theme
  main.ts               app entry
  style.css             plain CSS, light/dark via [data-theme]
scripts/mock-api.mjs    mock RustXNG API for UI smoke tests
```

## Versions

Vue 3.5.44, Vite 8.3.6, TypeScript 6.0.3, vue-tsc 3.3.14 (from the
scaffold — `npm create vite@latest` at build time).
