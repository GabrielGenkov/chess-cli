import { describe, expect, it } from "vitest";
import { ChessService } from "../src/chess/ChessService.js";
import type { CliOptions } from "../src/types/AppOptions.js";
import type { Square } from "../src/types/Square.js";
import { createInitialUiState } from "../src/types/UiState.js";
import { ansi } from "../src/ui/ansi.js";
import { LayoutRenderer } from "../src/ui/LayoutRenderer.js";

const options: CliOptions = {
  ascii: false,
  color: true,
  mouse: true,
  flipBoard: false
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

describe("LayoutRenderer styled output", () => {
  it("does not truncate ANSI-styled board rows that fit visibly", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    state.selectedSquare = "e2" as Square;
    state.legalMoves = chess.getLegalMoves("e2" as Square);

    const rendered = withTerminalSize(80, 32, () => new LayoutRenderer().render(chess, state, options));

    expect(rendered.output).toContain(ansi.bgYellow);
    expect(rendered.output).toContain(ansi.bgGreen);
    expect(rendered.output).not.toContain("…");
  });

  it("does not color the last played move blue", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    state.lastMove = chess.makeMove("e2" as Square, "e4" as Square);

    const rendered = withTerminalSize(80, 32, () => new LayoutRenderer().render(chess, state, options));

    expect(rendered.output).not.toContain(ansi.bgBlue);
  });

  it("renders the boxed board in compact 66x24 terminals", () => {
    const chess = new ChessService();
    const state = createInitialUiState();

    const rendered = withTerminalSize(66, 24, () => new LayoutRenderer().render(chess, state, options));

    expect(rendered.boardLayout).not.toBeNull();
    expect(rendered.output).toContain(ansi.bold);
    expect(rendered.output).toContain(ansi.fgCyan);
    expect(rendered.output).toContain("Terminal Chess");
    expect(rendered.output).toContain("| White");
    expect(rendered.output).toContain("┌─────┬─────");
  });

  it("moves info into a side panel in short wide terminals", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    state.lastMove = chess.makeMove("e2" as Square, "e4" as Square);

    const rendered = withTerminalSize(100, 24, () => new LayoutRenderer().render(chess, state, options));

    expect(rendered.boardLayout).not.toBeNull();
    expect(rendered.output).toContain("Commands");
    expect(rendered.output).toContain("Last move: e2e4");
  });

  it("uses the smaller 66x24 minimum terminal size", () => {
    const chess = new ChessService();
    const state = createInitialUiState();

    const rendered = withTerminalSize(65, 24, () => new LayoutRenderer().render(chess, state, options));

    expect(rendered.boardLayout).toBeNull();
    expect(rendered.output).toContain("Terminal too small. Minimum size: 66x24.");
  });
});
