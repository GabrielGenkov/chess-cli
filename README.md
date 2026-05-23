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
