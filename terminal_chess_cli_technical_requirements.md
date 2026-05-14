# Technical Requirements: Interactive Terminal Chess CLI

## 1. Product Scope

The system is a terminal-based chess application that allows two players to play a friendly chess match from one terminal session. The application renders a chess board directly inside the terminal, supports mouse interaction, highlights legal moves for selected pieces, and enforces valid chess rules.

The first version supports only local pass-and-play mode:

- White and Black are controlled from the same terminal.
- No online multiplayer.
- No AI opponent.
- No account system.
- No persistent rating system.

The CLI should behave like a modern TUI application, similar in spirit to tools such as Codex CLI, Claude Code, OpenCode, lazygit, or terminal dashboards, rather than a plain command-input program.

---

## 2. Recommended Tech Stack

### Preferred Option: TypeScript / Node.js

This is a strong choice if the rest of the ecosystem is web-oriented or if the developer prefers JavaScript/TypeScript.

Recommended libraries:

```txt
Language: TypeScript
Runtime: Node.js
TUI rendering: terminal-kit, blessed, neo-blessed, or ink
Chess engine/rules: chess.js
CLI packaging: commander or yargs
Testing: vitest or jest
Build: tsup or esbuild
```

Most important dependency:

```txt
chess.js
```

This library can handle legal move generation, turn validation, check, checkmate, stalemate, FEN, PGN, castling, en passant, and promotion logic.

Recommended UI library:

```txt
terminal-kit
```

or:

```txt
blessed / neo-blessed
```

`terminal-kit` has good support for mouse input and low-level terminal drawing. `blessed` is better if you want a component-like terminal UI layout.

### Alternative Option: Python

```txt
Language: Python
TUI rendering: textual or urwid
Chess engine/rules: python-chess
CLI packaging: typer
Testing: pytest
```

Most important dependency:

```txt
python-chess
```

Python is also a strong option because `python-chess` is mature and reliable. For a polished modern terminal UI, `textual` is a strong choice.

---

## 3. Core Functional Requirements

### 3.1 Game Mode

The system shall support a local friendly chess match.

The only initial mode is:

```txt
Pass and Play
```

Both players use the same terminal session.

The game alternates turns between White and Black.

The system must clearly display whose turn it currently is.

Example:

```txt
Turn: White
```

or:

```txt
Turn: Black
```

The system must prevent a player from moving the opponent's pieces.

---

## 4. Board Rendering Requirements

### 4.1 Terminal Board

The application shall render an 8x8 chess board in the terminal.

The board should be drawn using terminal-safe characters.

Possible display style:

```txt
  a b c d e f g h
8 ♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜ 8
7 ♟ ♟ ♟ ♟ ♟ ♟ ♟ ♟ 7
6 · · · · · · · · 6
5 · · · · · · · · 5
4 · · · · · · · · 4
3 · · · · · · · · 3
2 ♙ ♙ ♙ ♙ ♙ ♙ ♙ ♙ 2
1 ♖ ♘ ♗ ♕ ♔ ♗ ♘ ♖ 1
  a b c d e f g h
```

The application should support Unicode chess pieces by default.

Recommended piece mapping:

```ts
const pieces = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙"
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟"
  }
};
```

A fallback ASCII mode should be considered for terminals that do not render Unicode properly:

```txt
White: K Q R B N P
Black: k q r b n p
```

---

## 5. Mouse Interaction Requirements

### 5.1 Mouse Support

The application shall support mouse clicks inside the terminal.

The terminal UI layer must enable mouse tracking.

When the user clicks on a square containing a piece belonging to the current player, the system shall select that piece.

After selecting a piece, the board shall highlight all legal destination squares for that piece.

When the user clicks one of the highlighted destination squares, the system shall execute the move.

When the user clicks outside the board, the system should ignore the click.

When the user clicks another own piece, selection should move to the newly clicked piece.

When the user clicks an illegal square, the system should either:

```txt
- ignore the action
```

or:

```txt
- show a short status message: "Illegal move"
```

Recommended behavior: ignore illegal board clicks silently but show invalid move messages for keyboard input.

---

## 6. Legal Move Requirements

The system should not manually implement chess rules in the first version.

Instead, legal move validation should be delegated to a reliable chess rules library.

Recommended choices:

For TypeScript:

```txt
chess.js
```

For Python:

```txt
python-chess
```

The library must support:

- Legal move generation
- Turn validation
- Check detection
- Checkmate detection
- Stalemate detection
- Castling
- En passant
- Pawn promotion
- FEN state representation
- PGN move history

The application itself should only handle:

- Rendering
- User input
- Selected square state
- Highlighted legal moves
- Calling the chess library
- Displaying game status

---

## 7. Move Selection Flow

The basic interaction flow should be:

1. Render board.
2. User clicks a square.
3. If the square contains a current-player piece:
   - Select the piece.
   - Calculate legal moves for that piece.
   - Highlight legal destination squares.
4. User clicks a destination square.
5. If destination is legal:
   - Apply move through chess rules library.
   - Clear selection.
   - Clear highlights.
   - Switch turn automatically.
   - Re-render board.
6. If game is over:
   - Show result.

Pseudo-flow:

```ts
function onBoardClick(square: Square) {
  if (!selectedSquare) {
    if (isOwnPiece(square)) {
      selectedSquare = square;
      legalMoves = getLegalMovesForSquare(square);
      render();
    }

    return;
  }

  if (isLegalDestination(selectedSquare, square)) {
    makeMove(selectedSquare, square);
    selectedSquare = null;
    legalMoves = [];
    render();
    return;
  }

  if (isOwnPiece(square)) {
    selectedSquare = square;
    legalMoves = getLegalMovesForSquare(square);
    render();
    return;
  }

  selectedSquare = null;
  legalMoves = [];
  render();
}
```

---

## 8. Keyboard Fallback Requirements

Even though mouse interaction is required, the application should support keyboard fallback.

Minimum keyboard commands:

```txt
q        quit
r        restart game
u        undo last move
h        help
esc      clear selected piece
```

Optional move input:

```txt
e2e4
g1f3
e7e8q
```

The move parser should accept UCI-style input:

```txt
fromSquare + toSquare + optionalPromotionPiece
```

Examples:

```txt
e2e4
a7a8q
e1g1
```

This makes the app usable even in terminals with limited mouse support.

---

## 9. Highlighting Requirements

The board should visually distinguish:

- Selected square
- Legal move squares
- Capture squares
- Last move
- Check state

Suggested rendering behavior:

```txt
Selected piece: highlighted background
Legal quiet move: dot or colored square
Legal capture: marker around enemy piece
Last move: subtle highlight on from/to squares
King in check: warning highlight
```

Example text-based display:

```txt
· = empty square
● = legal move
x = legal capture
```

For colored terminals, use ANSI styles.

The system should detect whether the terminal supports color.

If color is unavailable, the app must remain readable through symbols alone.

---

## 10. Pawn Promotion Requirements

When a pawn reaches the final rank, the system shall ask the user which piece to promote to.

Default promotion options:

- Queen
- Rook
- Bishop
- Knight

For mouse mode, the first version may show a simple terminal prompt:

```txt
Promote to: [q] Queen, [r] Rook, [b] Bishop, [n] Knight
```

Default promotion may be Queen if the user presses Enter.

Promotion must be passed to the chess library as part of the move.

Example with `chess.js`:

```ts
chess.move({
  from: "e7",
  to: "e8",
  promotion: "q"
});
```

---

## 11. Game State Requirements

The system shall maintain game state using the chess rules library.

The internal state should include:

- Current board position
- Current turn
- Selected square
- Legal moves for selected square
- Move history
- Captured pieces, optional
- Current game result
- Last move

The chess library should be the source of truth for board state.

The UI should not maintain a separate independent board model unless it is derived from the library state.

Recommended model:

```ts
type UiState = {
  selectedSquare: Square | null;
  legalMoves: Move[];
  lastMove: Move | null;
  message: string | null;
};
```

The actual chess position should come from:

```ts
const chess = new Chess();
```

---

## 12. Game Status Requirements

The UI shall display current game status.

Required statuses:

- White to move
- Black to move
- White is in check
- Black is in check
- Checkmate
- Stalemate
- Draw
- Game over

Optional statuses:

- Draw by insufficient material
- Draw by threefold repetition
- Draw by fifty-move rule

If using `chess.js`, these can be detected through its built-in methods.

---

## 13. Screen Layout Requirements

The CLI should use a structured terminal layout.

Recommended layout:

```txt
┌──────────────────────────────────────┐
│ Terminal Chess                       │
├──────────────────────────────────────┤
│ Turn: White                          │
│ Status: Normal                       │
├──────────────────────────────────────┤
│                                      │
│        a  b  c  d  e  f  g  h        │
│     8  ♜  ♞  ♝  ♛  ♚  ♝  ♞  ♜  8     │
│     7  ♟  ♟  ♟  ♟  ♟  ♟  ♟  ♟  7     │
│     6  ·  ·  ·  ·  ·  ·  ·  ·  6     │
│     5  ·  ·  ·  ·  ·  ·  ·  ·  5     │
│     4  ·  ·  ·  ·  ·  ·  ·  ·  4     │
│     3  ·  ·  ·  ·  ·  ·  ·  ·  3     │
│     2  ♙  ♙  ♙  ♙  ♙  ♙  ♙  ♙  2     │
│     1  ♖  ♘  ♗  ♕  ♔  ♗  ♘  ♖  1     │
│        a  b  c  d  e  f  g  h        │
│                                      │
├──────────────────────────────────────┤
│ Last move: -                         │
│ Commands: q quit | r restart | h help │
└──────────────────────────────────────┘
```

The board should remain centered if the terminal is wide enough.

The app should gracefully handle small terminal windows by showing:

```txt
Terminal too small. Minimum size: 60x24.
```

---

## 14. Coordinate Mapping Requirements

The renderer must map terminal mouse coordinates to chess squares.

The system needs to know:

- Board start X position
- Board start Y position
- Square width in terminal cells
- Square height in terminal cells
- Board orientation

For example:

```ts
type BoardLayout = {
  startX: number;
  startY: number;
  squareWidth: number;
  squareHeight: number;
};
```

Mouse click conversion:

```ts
function mouseToSquare(x: number, y: number, layout: BoardLayout): Square | null {
  const fileIndex = Math.floor((x - layout.startX) / layout.squareWidth);
  const rankIndex = Math.floor((y - layout.startY) / layout.squareHeight);

  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) {
    return null;
  }

  const file = "abcdefgh"[fileIndex];
  const rank = String(8 - rankIndex);

  return `${file}${rank}` as Square;
}
```

For the initial version, the board should be rendered from White's perspective.

Optional later feature:

```txt
Flip board after each turn
```

For pass-and-play, the first version should keep the board fixed to avoid confusing mouse mapping.

---

## 15. Architecture Requirements

Recommended architecture:

```txt
src/
  main.ts
  app/
    ChessCliApp.ts
    GameController.ts
    InputController.ts
    RenderController.ts
  chess/
    ChessService.ts
    MoveService.ts
  ui/
    BoardRenderer.ts
    LayoutRenderer.ts
    StatusRenderer.ts
    HelpModal.ts
  types/
    Square.ts
    Move.ts
    UiState.ts
  config/
    theme.ts
```

### 15.1 ChessService

Responsible for interaction with the chess rules library.

Responsibilities:

- Initialize new game
- Return board state
- Return legal moves for a square
- Make move
- Undo move
- Detect check/checkmate/stalemate/draw
- Return current turn
- Return move history

### 15.2 RenderController

Responsible for drawing the full terminal UI.

Responsibilities:

- Clear/redraw screen
- Draw header
- Draw board
- Draw status area
- Draw command hints
- Draw help overlay
- Draw promotion prompt

### 15.3 InputController

Responsible for user input.

Responsibilities:

- Listen to mouse clicks
- Listen to keyboard events
- Convert terminal coordinates to board squares
- Dispatch user intent to GameController

### 15.4 GameController

Coordinates the game behavior.

Responsibilities:

- Manage selected square
- Manage legal move highlights
- Process square clicks
- Process keyboard commands
- Call ChessService to apply moves
- Trigger render updates

---

## 16. Non-Functional Requirements

### 16.1 Responsiveness

The terminal UI should update immediately after user input.

Target response time:

```txt
< 50ms after click or keypress
```

### 16.2 Portability

The CLI should work on:

- macOS Terminal
- iTerm2
- Linux terminals
- Windows Terminal

Mouse support may vary by terminal, so keyboard fallback is required.

### 16.3 Reliability

The application must never allow illegal chess moves.

The chess rules library must be treated as the source of truth.

The UI must not mutate board state directly.

### 16.4 Terminal Safety

On exit, the application must restore terminal state.

Required cleanup:

- Disable mouse tracking
- Show cursor again
- Reset colors/styles
- Exit raw mode
- Clear temporary UI state if necessary

The app should handle:

- Ctrl+C
- q
- Uncaught runtime errors

and still restore terminal state.

---

## 17. CLI Commands

Minimum CLI command:

```bash
chess-cli
```

Optional named command:

```bash
chess-cli play
```

Potential future commands:

```bash
chess-cli play
chess-cli play --ascii
chess-cli play --flip-board
chess-cli play --no-mouse
chess-cli replay game.pgn
chess-cli load position.fen
```

Initial version should only require:

```bash
chess-cli
```

or:

```bash
chess-cli play
```

---

## 18. Configuration Requirements

Initial optional flags:

```bash
--ascii
--no-color
--no-mouse
--flip-board
--help
--version
```

Recommended for MVP:

```bash
chess-cli play --ascii
chess-cli play --no-mouse
```

---

## 19. Testing Requirements

### 19.1 Unit Tests

Required tests:

- Mouse coordinate to square conversion
- Selected piece logic
- Legal move highlighting
- Illegal move rejection
- Turn switching
- Promotion handling
- Undo move
- Check/checkmate status display

### 19.2 Integration Tests

Required tests:

- Start new game
- Perform `e2e4`
- Perform `e7e5`
- Reject illegal move
- Detect checkmate
- Restart game

### 19.3 Manual Terminal Tests

Manual testing should be done in:

- Windows Terminal
- macOS Terminal or iTerm2
- GNOME Terminal / KDE Konsole

Validate:

- Unicode pieces render correctly
- Mouse clicks map to correct squares
- Colors are readable
- Terminal state restores after exit

---

## 20. MVP Acceptance Criteria

The MVP is complete when:

1. User can launch the app from terminal.
2. The board renders correctly.
3. White moves first.
4. User can click a white piece and see legal moves.
5. User can click a legal destination and move the piece.
6. Turns alternate between White and Black.
7. Illegal moves are blocked.
8. Check, checkmate, stalemate, and draw are detected.
9. Pawn promotion is supported.
10. User can restart the game.
11. User can quit cleanly.
12. Terminal state is restored after quitting.

---

## 21. Suggested Implementation Order

Recommended order:

1. Set up CLI project.
2. Integrate chess rules library.
3. Render static board.
4. Render pieces from actual chess state.
5. Add keyboard input for moves, for example `e2e4`.
6. Add mouse tracking.
7. Map mouse clicks to board squares.
8. Add piece selection.
9. Add legal move highlighting.
10. Add click-to-move.
11. Add game status display.
12. Add promotion flow.
13. Add restart, undo, quit.
14. Add terminal cleanup and error handling.
15. Add tests.

The best technical approach is to first make the game fully playable with keyboard input, then add mouse interaction on top. That isolates the chess logic from terminal coordinate complexity.

---

## 22. Recommended Stack Summary

Recommended stack:

```txt
Language: TypeScript
Runtime: Node.js
Chess rules: chess.js
Terminal UI: terminal-kit
CLI framework: commander
Testing: vitest
Build: tsup
```

Reason:

- `chess.js` solves the hard chess-rule problem.
- `terminal-kit` gives direct control over drawing and mouse input.
- TypeScript keeps the codebase structured.
- `commander` makes CLI commands and flags simple.
- `vitest` is fast and comfortable for unit tests.

The core technical principle should be:

```txt
The chess library owns the rules.
The app owns the interaction and rendering.
```

That separation will keep the project maintainable.
