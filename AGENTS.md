# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

`@gtryp/chess-cli` — an interactive, local pass-and-play chess TUI for the
terminal (TypeScript / Node ≥ 20, ESM). Published to npm; the installed command
is `chess-cli`. Chess rules come entirely from `chess.js`; this codebase owns
only rendering, input, and state.

## Commands

```bash
npm run dev        # run from source via tsx (use this to play/test locally)
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run build      # tsup -> dist/
npm run ci         # typecheck + test + build (run before committing)
```

Always run `npm run ci` before committing — it is also the `prepublishOnly` gate.

## Architecture

The chess library is the source of truth; the UI never mutates board state
directly and never reimplements rules.

```
src/
  main.ts                 CLI parsing (commander), option normalization, color-depth detect
  app/
    ChessCliApp.ts        wiring + lifecycle; alt-screen, guards, startup glyph-width probe
    GameController.ts      UI state machine (selection, input buffer, promotion, undo)
    InputController.ts     raw stdin: keyboard + SGR mouse parsing
    RenderController.ts    thin bridge to LayoutRenderer; holds current BoardLayout
  chess/
    ChessService.ts        wraps chess.js (moves, status, captured pieces, material)
    MoveService.ts         UCI parse/validate, move formatting
  ui/
    LayoutRenderer.ts      composes header + board + side panel + footer; centers & fills screen
    BoardRenderer.ts       the board widget: tiles, frame, coords, shadow, highlights; mouseToSquare
    SidePanel.ts           captured tray, material, move list
    StatusRenderer.ts      plain semantic status strings (theming applied by layout)
    HelpModal.ts           help overlay
    color.ts               hex -> ANSI across truecolor/256/16/none; detectColorDepth
    lines.ts               RenderedLine helpers (pad/center/join/fill)
    ansi.ts                control codes + small text utils
    glyphWidth.ts          startup CSI-6n probe of glyph cell advance
  config/theme.ts          Theme type + 4 palettes (walnut/slate/emerald/midnight); glyphs
  types/                   Square, UiState, AppOptions (CliOptions)
```

Data flow: `InputController` → `GameController` (updates `UiState`, calls
`ChessService`) → `RenderController` → `LayoutRenderer` → `BoardRenderer` /
`SidePanel`. `mouseToSquare` maps terminal coords back to squares using the
`BoardLayout` returned from the last render.

## Rendering model (read before touching the board)

- **Solid-tile checkerboard, no grid lines** — alternating background colors
  define the squares. Pieces use the SOLID glyphs (`♚♛♜♝♞♟`) for BOTH colors;
  side is conveyed only by foreground color + bold.
- **Color degradation** (`color.ts`): truecolor → xterm-256 → 16 → monochrome.
  An interactive TTY never degrades all the way to grey; `none` is for non-TTY
  output only. Colors are hex in the theme and converted per depth.
- **Geometry is the subtle part** (`BoardGeometry`):
  - Tile **height is odd** (3 when the terminal is tall enough, else 1) so a
    single glyph sits on the exact middle row — true vertical centering.
  - Tile **width** is even (4) on terminals that draw the chess glyphs ~2 cells
    wide, odd (5) otherwise. Windows console / Git Bash (mintty) draw them wide
    but advance the cursor only 1 cell, which pushes a glyph centered in an odd
    tile off to the right; even tiles fix it. `prefersWideTiles()` in `main.ts`
    decides (`win32 && !WT_SESSION`).
  - `glyphWidth.ts` probes the cursor **advance** (1 or 2) at startup to keep
    columns from drifting; `--piece-width 1|2` pins it.
- **Verify visuals** with the gitignored harness in `.tools/preview/`:
  `node .tools/preview/board-preview.mjs` or render the real renderer and pipe
  through `ansi2html.mjs` (supports `wide` / `overdraw` modes that simulate
  conhost/mintty glyph drawing) — screenshot the HTML to see real color.

## Conventions

- ESM with NodeNext: import sibling modules with the `.js` extension even from
  `.ts` files. `strict` TS; no implicit any.
- Named exports; small focused classes; no default exports.
- Keep comments sparse and explain *why* (match existing density).
- Tests live in `tests/` (vitest, globals enabled). Add/adjust tests when
  changing rendering geometry, option parsing, or chess-state helpers.
- Don't commit `dist/` or `.tools/` (both gitignored).

## Publishing

The repo publishes via GitHub Actions, not local `npm publish`:

1. Bump `version` in `package.json` (the action publishes only when the version
   is not already on npm).
2. Commit and push to `main`.
3. The "Publish to npm" workflow runs `npm run ci` then publishes using the
   `NPM_TOKEN` repo secret.

Publishing is irreversible — only do it when explicitly asked.
