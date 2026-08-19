# Degrees of Deepspace

A Twine sandbox game built on the same toolchain as
[Degrees of Lewdity](https://gitgud.io/Vrelnir/degrees-of-lewdity): **SugarCube 2** compiled by
**Tweego**, with plain JavaScript, ESLint, Stylelint and Prettier around it.

There is no game here yet — only the build pipeline and a small framework layer. See
[Writing content](#writing-content).

## Prerequisites

-   **Node.js** 18+ (linting, the dev server, and the build wrapper)

Tweego is downloaded automatically on first `npm run build` / `npm run dev` if it is not already on
your `PATH` or under `devTools/tweego/`. SugarCube 2.37.3 is already vendored at
[`devTools/tweego/storyFormats/sugarcube-2/`](devTools/tweego/storyFormats/sugarcube-2/).

```bash
npm install
npm run dev
```

Works the same on macOS, Linux, and Windows. Open the `http://localhost:8080` URL it prints.

## Scripts

| Script             | What it does                                                           |
| ------------------ | ---------------------------------------------------------------------- |
| `npm run dev`      | Serves the game on `localhost:8080`, rebuilds on save, reloads the tab |
| `npm run build`    | One-off build, producing `Degrees of Deepspace <version>.html`         |
| `npm run watch`    | Tweego's own watch mode, without the server                            |
| `npm run lint`     | ESLint over all JavaScript, with `--fix`                               |
| `npm run lint:css` | Stylelint over all CSS, with `--fix`                                   |
| `npm run format`   | Prettier over everything else                                          |

`npm run dev` is the one to use day to day. Use `npm run build` when you want a versioned file to
share.

`compile.sh` / `compile.bat` are still there if you want to invoke Tweego directly; day-to-day use
goes through the npm scripts above.

### Build output

The compiled file is named from `git describe`, so each build is traceable to a commit, and
`Degrees of Deepspace.html` is also written as a stable name for the newest build (symlink on Unix,
copy on Windows). Both are gitignored. Override the version with `FORCE_VERSION`:

```bash
FORCE_VERSION=0.2.0-test npm run build
```

Opening the HTML directly from disk works, with one exception: `style.css` is fetched at runtime and
a `file://` page cannot fetch it. Serve over HTTP (or just use `npm run dev`) to pick it up.

## How the build works

Tweego is handed three things:

```
tweego --head devTools/head.html --module modules game/
```

-   **`game/`** — the story. Tweego walks it recursively and treats `.twee` as passages, `.js` as
    script, and `.css` as stylesheet, concatenating each in **path sort order**. This is why folders
    and files carry numeric prefixes: `00-framework-tools` must be evaluated before `01-config`. The
    numbers are load-order declarations, not decoration.
-   **`modules/`** — polyfills, prototype extensions, and all CSS, embedded _ahead_ of `game/`. See
    [`modules/readme.md`](modules/readme.md).
-   **`devTools/head.html`** — injected into `<head>`. Currently the viewport meta and a CSP.

Every `.js` file under `game/` and `modules/` ends up in one shared scope. There is no module system
and no bundler: cross-file references are globals by design. That is what `defineGlobalNamespaces`
exists to keep tidy, and why new globals must be declared in `.eslintrc.cjs`.

There is deliberately no `-f` flag. Tweego picks the story format by matching the `format` and
`format-version` fields in `StoryData` against the vendored `format.js`, which declares its own name
and version. So the version the game is built against is recorded in the source rather than buried in
a build script, and a mismatch fails the build instead of silently compiling against whatever is
installed.

Upgrading SugarCube is therefore two steps: replace
`devTools/tweego/storyFormats/sugarcube-2/format.js` with a newer
[release](https://github.com/tmedwards/sugarcube-2/releases) (the `for-twine-2.1-local` variant), then
bump `format-version` in `game/01-config/start.twee` to match.

## Layout

```
game/                     Story source: .twee passages, .js logic, loaded in path order
  00-framework-tools/     Namespaces, error reporting, save migration, perf logging
  01-config/              StoryData, engine config, build switches
  03-JavaScript/          Helpers and macro plumbing
  04-constants/           Frozen catalogs (`ConstantsLoader.add` / `C()`)
  05-variables/           Game engines: ensure(), mutators, ClassLesson.create
modules/                  Polyfills and prototype extensions, embedded before game/
  css/                    All compiled-in CSS
devTools/                 Tweego, the vendored story format, the injected <head>
tools/dev.mjs             Dev server: rebuild on save, live reload
style.css                 Fetched at runtime, not compiled in — edit and refresh
```

Folder names follow DoL's convention. Numeric prefixes control load order; unprefixed folders
(`base-system`, `overworld-*`, and so on) sort after them alphabetically and are for content.

## What the framework gives you

Nothing here assumes anything about the game. It is the plumbing DoL has that is painful to retrofit.

| Global                         | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `defineGlobalNamespaces()`     | Creates a namespace on `window` at a dotted path                     |
| `V()` / `T()` / `C()`          | `State.variables`, `State.temporary`, `Constants`                    |
| `Errors`                       | Collects runtime errors and shows them in-page; `Errors.guard()`     |
| `Versions`                     | Save migration registry, applied automatically on load               |
| `ConstantsLoader`              | Registers deep-frozen static data readable through `C()`             |
| `Perflog`                      | Opt-in passage timing; `Perflog.enable()` then `Perflog.report()`    |
| `DefineMacro` / `DefineMacroS` | Define macros without boilerplate; failures route through `Errors`   |
| `ObservableValue`              | A value with change subscribers, for UI state that is not saved      |
| Assorted helpers               | `between`, `element`, `ensure`, `selfOr`, `getRandomIntInclusive`, … |

`modules/` also adds `Array.prototype.sum/groupBy/unique/maxBy` and
`Number.prototype.roundTo/fractionOf/percentOf`.

Two things worth knowing before you build on this:

-   **`ConstantsLoader` deep-freezes.** SugarCube clones `State.variables` every turn, so mutable data
    leaking from constants into a story variable gets copied into every history state and then into the
    save file. Freezing turns that into an immediate error instead of save bloat.
-   **`getRandomIntInclusive` uses SugarCube's seeded PRNG.** Never use `Math.random()` for anything
    that touches game state, or saves will not replay consistently.

## Writing content

`game/01-config/start.twee` currently holds the bare minimum Tweego needs: `StoryTitle`, `StoryData`
with an IFID, and an empty `Start` passage. Write into `Start`, or add your own `.twee` files anywhere
under `game/`.

A few conventions the framework expects:

-   Tag menu and intro passages `nosave`. `Config.saves.isAllowed` refuses to save them, because
    restoring into one would skip initialisation.
-   Register a `Versions` migration whenever you rename or restructure a story variable. Old saves
    otherwise break silently.
-   Never call `Engine.play()` from `PassageHeader`, `PassageFooter`, or `StoryCaption` — it re-enters
    the renderer mid-render. Navigate from click handlers instead.
-   Add each new macro to [`t3lt.twee-config.yml`](t3lt.twee-config.yml) so the VS Code extension stops
    flagging it, and each new global to `.eslintrc.cjs`.

Build switches (debug mode, text-only builds, version) live in
`game/01-config/sugarcubeConfig.js` as `window.StartConfig`.

## Code style

Tabs, 160-column lines, double quotes, semicolons — enforced by Prettier via ESLint.

JavaScript targets **ES2019** (`eslint-plugin-es`), and CSS targets browsers from 2015 onward
(`.browserslistrc`), both to support the old mobile WebViews that a browser game inevitably meets.
That is why you will see manual polyfills rather than optional chaining.

Linting is manual — run `npm run lint` and `npm run lint:css` when you want it. There is deliberately
no pre-commit hook: DoL uses one because it takes contributions from many people, and Prettier has no
`.twee` parser, so a hook would not touch passage files anyway.

Install the recommended VS Code extensions (`.vscode/extensions.json`) — in particular **Twee 3
Language Tools**, which provides syntax highlighting and macro checking for `.twee`.
