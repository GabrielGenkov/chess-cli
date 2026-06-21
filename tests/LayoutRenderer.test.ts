import { describe, expect, it } from "vitest";
import { ChessService } from "../src/chess/ChessService.js";
import { THEMES } from "../src/config/theme.js";
import type { CliOptions } from "../src/types/AppOptions.js";
import type { Square } from "../src/types/Square.js";
import { createInitialUiState } from "../src/types/UiState.js";
import { sgr } from "../src/ui/color.js";
import { LayoutRenderer } from "../src/ui/LayoutRenderer.js";

const options: CliOptions = {
  ascii: false,
  colorDepth: "truecolor",
  mouse: true,
  flipBoard: false,
  theme: "walnut",
  pieceWidth: 1,
  detectPieceWidth: false,
  wideTiles: false
};

function withTerminalSize<T>(columns: number, rows: number, callback: () => T): T {
  const stdout = process.stdout;
  const originalColumns = stdout.columns;
  const originalRows = stdout.rows;

  stdout.columns = columns;
  stdout.rows = rows;

  try {
    return callback();
  } finally {
    stdout.columns = originalColumns;
    stdout.rows = originalRows;
  }
}

describe("LayoutRenderer", () => {
  it("renders the full layout with board and side panel", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    state.lastMove = chess.makeMove("e2" as Square, "e4" as Square);

    const rendered = withTerminalSize(96, 40, () => new LayoutRenderer().render(chess, state, options));

    expect(rendered.boardLayout).not.toBeNull();
    expect(rendered.boardLayout?.squareWidth).toBe(5);
    expect(rendered.boardLayout?.squareHeight).toBe(3);
    expect(rendered.output).toContain("Terminal Chess");
    expect(rendered.output).toContain("TO MOVE");
    expect(rendered.output).toContain("CAPTURED");
    expect(rendered.output).toContain("MOVES");
    expect(rendered.output).toContain("Black to move");
    expect(rendered.output).toContain(sgr({ bg: THEMES.walnut.lightSquare }, "truecolor"));
  });

  it("uses even-width tiles when the terminal draws glyphs wide", () => {
    const chess = new ChessService();
    const rendered = withTerminalSize(96, 40, () =>
      new LayoutRenderer().render(chess, createInitialUiState(), { ...options, wideTiles: true })
    );

    expect(rendered.boardLayout?.squareWidth).toBe(4);
  });

  it("renders a board-only layout in a small terminal", () => {
    const chess = new ChessService();
    const rendered = withTerminalSize(60, 24, () => new LayoutRenderer().render(chess, createInitialUiState(), options));

    expect(rendered.boardLayout).not.toBeNull();
    expect(rendered.output).toContain("Terminal Chess");
    expect(rendered.output).toContain("q quit");
  });

  it("shows a too-small message when the terminal cannot fit the board", () => {
    const rendered = withTerminalSize(30, 12, () => new LayoutRenderer().render(new ChessService(), createInitialUiState(), options));

    expect(rendered.boardLayout).toBeNull();
    expect(rendered.output).toContain("Terminal too small");
  });

  it("renders the help overlay without a board layout", () => {
    const state = createInitialUiState();
    state.showHelp = true;

    const rendered = withTerminalSize(96, 32, () => new LayoutRenderer().render(new ChessService(), state, options));

    expect(rendered.boardLayout).toBeNull();
    expect(rendered.output).toContain("How to play");
  });
});
