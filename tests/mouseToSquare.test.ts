import { describe, expect, it } from "vitest";
import { mouseToSquare, type BoardLayout } from "../src/ui/BoardRenderer.js";

describe("mouseToSquare", () => {
  const whiteLayout: BoardLayout = {
    startX: 10,
    startY: 5,
    squareWidth: 6,
    squareHeight: 2,
    orientation: "white"
  };

  it("maps white-oriented board coordinates to squares", () => {
    expect(mouseToSquare(11, 6, whiteLayout)).toBe("a8");
    expect(mouseToSquare(15, 6, whiteLayout)).toBe("a8");
    expect(mouseToSquare(17, 6, whiteLayout)).toBe("b8");
    expect(mouseToSquare(57, 20, whiteLayout)).toBe("h1");
  });

  it("returns null for clicks outside the board or on grid borders", () => {
    expect(mouseToSquare(9, 5, whiteLayout)).toBeNull();
    expect(mouseToSquare(59, 6, whiteLayout)).toBeNull();
    expect(mouseToSquare(11, 22, whiteLayout)).toBeNull();
    expect(mouseToSquare(10, 5, whiteLayout)).toBeNull();
    expect(mouseToSquare(16, 6, whiteLayout)).toBeNull();
    expect(mouseToSquare(11, 7, whiteLayout)).toBeNull();
  });

  it("maps flipped board coordinates from black perspective", () => {
    const blackLayout: BoardLayout = {
      ...whiteLayout,
      orientation: "black"
    };

    expect(mouseToSquare(11, 6, blackLayout)).toBe("h1");
    expect(mouseToSquare(57, 20, blackLayout)).toBe("a8");
  });
});
