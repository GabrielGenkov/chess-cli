# Terminal Chess CLI

Interactive local pass-and-play chess for the terminal, built from `terminal_chess_cli_technical_requirements.md`.

## Features

- Local White-vs-Black pass-and-play mode.
- Unicode chess pieces by default, with `--ascii` fallback.
- Keyboard move input such as `e2e4`, `g1f3`, and promotion handling.
- Mouse square selection with legal move highlighting in terminals that support SGR mouse tracking.
- Legal move validation, check, checkmate, stalemate, draw, FEN, PGN, undo, and promotion via `chess.js`.
- Clean terminal restore on quit, Ctrl+C, and runtime errors.

## Usage

```bash
npm install
npm run build
npx chess-cli
```

Development mode:

```bash
npm run dev
```

Command variants:

```bash
chess-cli
chess-cli play
chess-cli play --ascii
chess-cli play --no-mouse
chess-cli play --no-color
chess-cli play --flip-board
```

## Controls

- `q` quit
- `r` restart
- `u` undo last move
- `h` then Enter, or `?`, help
- `Esc` clear selection/input
- Type UCI moves directly: `e2e4`, `a7a8q`
- Click a piece, then click a highlighted legal destination

## Validation

```bash
npm run typecheck
npm test
npm run build
```
