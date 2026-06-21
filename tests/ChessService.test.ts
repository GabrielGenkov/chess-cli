import { describe, expect, it } from "vitest";
import { ChessService } from "../src/chess/ChessService.js";
import type { Square } from "../src/types/Square.js";

describe("ChessService captured pieces and material", () => {
  it("reports no captures and even material at the start", () => {
    const chess = new ChessService();

    expect(chess.getCapturedPieces()).toEqual({ white: [], black: [] });
    expect(chess.getMaterialBalance()).toBe(0);
  });

  it("attributes a capture to the side that made it", () => {
    const chess = new ChessService();
    chess.makeMove("e2" as Square, "e4" as Square);
    chess.makeMove("d7" as Square, "d5" as Square);
    chess.makeMove("e4" as Square, "d5" as Square); // exd5

    expect(chess.getCapturedPieces()).toEqual({ white: ["p"], black: [] });
    expect(chess.getMaterialBalance()).toBe(1);
  });

  it("orders captured pieces by value, queen first", () => {
    // White is missing a queen and a pawn (Black captured them); Black is
    // missing one rook (White captured it).
    const chess = new ChessService("1nbqkbnr/pppppppp/8/8/8/8/PPPPPPP1/RNB1KBNR w - - 0 1");

    const captured = chess.getCapturedPieces();
    expect(captured.white).toEqual(["r"]);
    expect(captured.black).toEqual(["q", "p"]);
    // Black is up a queen+pawn (10) minus the rook it lost (5) => -5.
    expect(chess.getMaterialBalance()).toBe(-5);
  });
});
