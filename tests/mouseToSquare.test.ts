import { describe, expect, it } from "vitest";
import { mouseToSquare, type BoardLayout } from "../src/ui/BoardRenderer.js";

describe("mouseToSquare", () => {
  const whiteLayout: BoardLayout = {
    startX: 10,
    startY: 5,
    squareWidth: 4,
    squareHeight: 1,
    orientation: "white"
  };

  it("maps white-oriented board coordinates to squares", () => {
    expect(mouseToSquare(10, 5, whiteLayout)).toBe("a8");
    expect(mouseToSquare(13, 5, whiteLayout)).toBe("a8");
    expect(mouseToSquare(14, 5, whiteLayout)).toBe("b8");
    expect(mouseToSquare(41, 12, whiteLayout)).toBe("h1");
  });

  it("returns null for clicks outside the board", () => {
    expect(mouseToSquare(9, 5, whiteLayout)).toBeNull();
    expect(mouseToSquare(42, 5, whiteLayout)).toBeNull();
    expect(mouseToSquare(10, 13, whiteLayout)).toBeNull();
  });

  it("maps flipped board coordinates from black perspective", () => {
    const blackLayout: BoardLayout = {
      ...whiteLayout,
      orientation: "black"
    };

    expect(mouseToSquare(10, 5, blackLayout)).toBe("h1");
    expect(mouseToSquare(41, 12, blackLayout)).toBe("a8");
  });
});
