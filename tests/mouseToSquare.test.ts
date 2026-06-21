import { describe, expect, it } from "vitest";
import { mouseToSquare, type BoardLayout } from "../src/ui/BoardRenderer.js";

describe("mouseToSquare", () => {
  // Grid origin at (10, 5); tiles are 5 wide x 2 tall with no border gaps.
  const whiteLayout: BoardLayout = {
    startX: 10,
    startY: 5,
    squareWidth: 5,
    squareHeight: 2,
    orientation: "white"
  };

  it("maps white-oriented board coordinates to squares", () => {
    expect(mouseToSquare(10, 5, whiteLayout)).toBe("a8");
    expect(mouseToSquare(14, 6, whiteLayout)).toBe("a8");
    expect(mouseToSquare(15, 5, whiteLayout)).toBe("b8");
    expect(mouseToSquare(49, 20, whiteLayout)).toBe("h1");
  });

  it("treats every cell of a tile as clickable (no border gaps)", () => {
    // The whole 5x2 block for a8 maps to a8, including the previously dead
    // grid-line columns/rows.
    expect(mouseToSquare(13, 5, whiteLayout)).toBe("a8");
    expect(mouseToSquare(10, 6, whiteLayout)).toBe("a8");
  });

  it("returns null for clicks outside the board", () => {
    expect(mouseToSquare(9, 5, whiteLayout)).toBeNull();
    expect(mouseToSquare(50, 5, whiteLayout)).toBeNull();
    expect(mouseToSquare(10, 4, whiteLayout)).toBeNull();
    expect(mouseToSquare(10, 21, whiteLayout)).toBeNull();
  });

  it("maps flipped board coordinates from black perspective", () => {
    const blackLayout: BoardLayout = { ...whiteLayout, orientation: "black" };

    expect(mouseToSquare(10, 5, blackLayout)).toBe("h1");
    expect(mouseToSquare(49, 20, blackLayout)).toBe("a8");
  });
});
