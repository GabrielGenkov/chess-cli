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

describe("LayoutRenderer styled output", () => {
  it("does not truncate ANSI-styled board rows that fit visibly", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    state.selectedSquare = "e2" as Square;
    state.legalMoves = chess.getLegalMoves("e2" as Square);

    const rendered = new LayoutRenderer().render(chess, state, options);

    expect(rendered.output).toContain(ansi.bgYellow);
    expect(rendered.output).toContain(ansi.bgGreen);
    expect(rendered.output).not.toContain("…");
  });

  it("does not color the last played move blue", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    state.lastMove = chess.makeMove("e2" as Square, "e4" as Square);

    const rendered = new LayoutRenderer().render(chess, state, options);

    expect(rendered.output).not.toContain(ansi.bgBlue);
  });
});
