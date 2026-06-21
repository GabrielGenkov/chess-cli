# Terminal Chess CLI

Interactive local pass-and-play chess for the terminal, built from `terminal_chess_cli_technical_requirements.md`.

## Features

- A board designed to not look like it lives in a terminal: solid-color square
  tiles (no grid lines), filled piece glyphs distinguished by color, a framed
  board with coordinates, a drop shadow, and a full-screen themed canvas.
- Four hand-tuned color themes — `walnut` (default), `slate`, `emerald`,
  `midnight` — selectable with `--theme`.
- 24-bit truecolor that degrades gracefully to 256-color, 16-color, and a
  readable monochrome/`--ascii` mode (highlights stay legible via glyph markers).
- A side panel with the move list, captured pieces, and material balance when
  the terminal is wide enough; a compact board-only layout otherwise.
- Local White-vs-Black pass-and-play mode.
- Keyboard move input such as `e2e4`, `g1f3`, and promotion handling.
- Mouse square selection with legal move highlighting in terminals that support SGR mouse tracking.
- Legal move validation, check, checkmate, stalemate, draw, FEN, PGN, undo, and promotion via `chess.js`.
- Clean terminal restore on quit, Ctrl+C, and runtime errors.

## Usage

Install from npm:

```bash
npm install -g @gtryp/chess-cli
chess-cli
```

Run without installing:

```bash
npx @gtryp/chess-cli
```

The npm package is `@gtryp/chess-cli` because the unscoped `chess-cli` package name is already taken on npm. The installed command is still `chess-cli`.

Local development:

```bash
npm install
npm run build
npm run dev
```

## Publishing

The GitHub Actions workflow publishes new package versions from `main` when `package.json` contains a version that is not already on npm.

Required repository secret:

- `NPM_TOKEN`: npm automation token with publish access.

Bump the version before merging to `main`:

```bash
npm version patch
```

Command variants:

```bash
chess-cli
chess-cli play
chess-cli play --theme emerald
chess-cli play --ascii
chess-cli play --no-mouse
chess-cli play --no-color
chess-cli play --flip-board
```

Themes: `--theme walnut|slate|emerald|midnight` (default `walnut`).

The board uses tall, square tiles with centered pieces when the terminal is at
least ~34 rows high, and a compact (still centered) board otherwise. On the
Windows console and Git Bash (mintty) the chess glyphs are drawn wider than one
cell, so the board uses even-width squares there to keep pieces centered;
Windows Terminal, macOS and Linux terminals get tighter odd-width squares. Piece
glyph advance is also probed at startup (`--piece-width 1|2` pins it). For the
crispest result, run inside Windows Terminal, iTerm2, or a modern Linux terminal
with a font that includes the chess glyphs (e.g. Cascadia Mono, DejaVu Sans Mono).

## Controls

- `q` quit
- `r` restart
- `u` undo last move
- `h` then Enter, or `?`, help
- `Esc` clear selection/input
- Type UCI moves directly: `e2e4`, `a7a8q`
- Click a piece, then click a highlighted legal destination

Board markers: the selected square is highlighted, `●` marks a legal move, a
piece in the capture color marks a legal capture, the king's square turns red in
check, and the last move's from/to squares are tinted. With `--no-color` these
become glyph markers: `[P]` selected, `*` legal move, `xPx` capture, `!K!` check.

## Validation

```bash
npm run typecheck
npm test
npm run build
```
