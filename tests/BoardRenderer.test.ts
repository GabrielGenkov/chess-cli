import { describe, expect, it } from "vitest";
import { ChessService } from "../src/chess/ChessService.js";
import type { CliOptions } from "../src/types/AppOptions.js";
import type { Square } from "../src/types/Square.js";
import { createInitialUiState } from "../src/types/UiState.js";
import { BoardRenderer, createBoardLayout } from "../src/ui/BoardRenderer.js";

const options: CliOptions = {
  ascii: true,
  color: false,
  mouse: true,
  flipBoard: false
};

const gridStart = 12;
const cellWidth = 6;
const cellInnerWidth = 5;
const files = "abcdefgh";

function getRankLine(renderedLines: Array<{ raw: string }>, rank: number): string {
  const line = renderedLines.find((candidate) => candidate.raw.trimStart().startsWith(`${rank}  |`));

  if (!line) {
    throw new Error(`Rank ${rank} was not rendered`);
  }

  return line.raw;
}

function getCell(rankLine: string, square: Square): string {
  const fileIndex = files.indexOf(square[0]);
  const start = gridStart + 1 + fileIndex * cellWidth;
  return rankLine.slice(start, start + cellInnerWidth);
}

describe("BoardRenderer visual cells", () => {
  it("renders a larger boxed ASCII board with blank empty squares", () => {
    const chess = new ChessService();
    const state = createInitialUiState();

    const rendered = new BoardRenderer().render(chess, state, options, createBoardLayout(1, 1, false));

    expect(rendered.lines.some((line) => line.raw.includes("+-----+-----+-----+-----+-----+-----+-----+-----+"))).toBe(true);
    expect(rendered.lines[1].raw).toContain("  a   ");
    expect(getCell(getRankLine(rendered.lines, 4), "d4" as Square)).toBe("     ");
  });

  it("renders a Unicode boxed board by default", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    const unicodeOptions = {
      ...options,
      ascii: false
    };

    const rendered = new BoardRenderer().render(chess, state, unicodeOptions, createBoardLayout(1, 1, false));

    expect(rendered.lines.some((line) => line.raw.includes("┌─────┬─────"))).toBe(true);
  });

  it("renders selected pawn highlights on the expected destination cells", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    state.selectedSquare = "e2" as Square;
    state.legalMoves = chess.getLegalMoves("e2" as Square);

    const rendered = new BoardRenderer().render(chess, state, options, createBoardLayout(1, 1, false));

    expect(getCell(getRankLine(rendered.lines, 2), "e2" as Square)).toBe(" [P] ");
    expect(getCell(getRankLine(rendered.lines, 3), "e3" as Square)).toBe("  *  ");
    expect(getCell(getRankLine(rendered.lines, 4), "e4" as Square)).toBe("  *  ");
    expect(getCell(getRankLine(rendered.lines, 4), "d4" as Square)).toBe("     ");
  });

  it("renders knight highlights only on legal destination cells", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    state.selectedSquare = "b1" as Square;
    state.legalMoves = chess.getLegalMoves("b1" as Square);

    const rendered = new BoardRenderer().render(chess, state, options, createBoardLayout(1, 1, false));
    const rank3 = getRankLine(rendered.lines, 3);

    expect(getCell(getRankLine(rendered.lines, 1), "b1" as Square)).toBe(" [N] ");
    expect(getCell(rank3, "a3" as Square)).toBe("  *  ");
    expect(getCell(rank3, "c3" as Square)).toBe("  *  ");
    expect(getCell(rank3, "b3" as Square)).toBe("     ");
  });
});
