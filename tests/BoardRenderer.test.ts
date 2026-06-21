import { describe, expect, it } from "vitest";
import { ChessService } from "../src/chess/ChessService.js";
import { THEMES } from "../src/config/theme.js";
import type { CliOptions } from "../src/types/AppOptions.js";
import type { Square } from "../src/types/Square.js";
import { createInitialUiState } from "../src/types/UiState.js";
import { BoardRenderer, DEFAULT_GEOMETRY, type BoardGeometry } from "../src/ui/BoardRenderer.js";
import { hexToRgb, sgr } from "../src/ui/color.js";

function fgCode(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `38;2;${r};${g};${b}`;
}

const baseOptions: CliOptions = {
  ascii: false,
  colorDepth: "truecolor",
  mouse: true,
  flipBoard: false,
  theme: "walnut",
  pieceWidth: 1,
  detectPieceWidth: false,
  wideTiles: false
};

function renderText(
  chess: ChessService,
  state = createInitialUiState(),
  options = baseOptions,
  geometry: BoardGeometry = DEFAULT_GEOMETRY
): string {
  const rendered = new BoardRenderer().render(chess, state, options, geometry);
  return rendered.lines.map((line) => line.raw).join("\n");
}

describe("BoardRenderer", () => {
  it("paints a solid-tile checkerboard with no inner grid lines", () => {
    const text = renderText(new ChessService());

    expect(text).toContain(sgr({ bg: THEMES.walnut.lightSquare }, "truecolor"));
    expect(text).toContain(sgr({ bg: THEMES.walnut.darkSquare }, "truecolor"));
    // The old design drew box-drawing grid joints between squares — gone now.
    expect(text).not.toContain("┼");
    expect(text).not.toContain("┬");
  });

  it("draws a rounded frame and coordinate labels", () => {
    const text = renderText(new ChessService());

    expect(text).toContain("╭");
    expect(text).toContain("╰");
    expect(text).toContain(sgr({ bg: THEMES.walnut.outerBg, fg: THEMES.walnut.coordLabel }, "truecolor"));
  });

  it("highlights the selected square and legal destinations", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    state.selectedSquare = "e2" as Square;
    state.legalMoves = chess.getLegalMoves("e2" as Square);

    const text = renderText(chess, state);

    expect(text).toContain(sgr({ bg: THEMES.walnut.selectedBg }, "truecolor"));
    expect(text).toContain("●");
  });

  it("marks captures with the capture color", () => {
    // White bishop on c4 can capture a pawn on f7 after a quick opening.
    const chess = new ChessService("rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1");
    const state = createInitialUiState();
    state.selectedSquare = "c4" as Square;
    state.legalMoves = chess.getLegalMoves("c4" as Square);

    const text = renderText(chess, state);

    expect(state.legalMoves.some((move) => move.to === "f7" && move.captured)).toBe(true);
    expect(text).toContain(fgCode(THEMES.walnut.capture));
  });

  it("renders ASCII pieces when asked", () => {
    const text = renderText(new ChessService(), createInitialUiState(), { ...baseOptions, ascii: true });

    expect(text).toContain("R");
    expect(text).toContain("r");
    expect(text).toContain("K");
  });

  it("falls back to glyph markers and texture with no color", () => {
    const chess = new ChessService();
    const state = createInitialUiState();
    state.selectedSquare = "e2" as Square;
    state.legalMoves = chess.getLegalMoves("e2" as Square);

    const text = renderText(chess, state, { ...baseOptions, ascii: true, colorDepth: "none" });

    expect(text).not.toContain("\x1b[");
    expect(text).toContain("[P]");
    expect(text).toContain("*");
    expect(text).toContain(":"); // dark-square texture
  });
});
