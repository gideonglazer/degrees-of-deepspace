# modules

Tweego is invoked with `--module modules`, which embeds everything in this directory ahead of the
story's own scripts and stylesheets. That ordering guarantee is the whole point of the directory:
anything here is guaranteed to exist before a single line of `game/` code runs.

Use it for:

-   **Polyfills and compatibility shims** — they must run before anything else touches the APIs.
-   **Prototype extensions** (`Array`, `Number`, …) — `game/` code calls these freely.
-   **All CSS** (`modules/css/`) — see below.

Do not put game logic here; that belongs in `game/`.

## Load order

Files are embedded in sort order by path, so the numeric prefixes are load-order declarations, not
decoration. Keep new files numbered.

## css/

CSS lives here rather than in `game/` so that it is embedded as a proper stylesheet block instead of
being parsed as passage markup. Files are concatenated in sort order, so later files win on equal
specificity.

`style.css` in the project root is deliberately _not_ part of this directory. It is fetched at
runtime by `importStyles()` in `game/01-config/sugarcubeConfig.js`, which means you can tweak it and
just refresh the browser instead of rebuilding.
