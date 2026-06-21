import { describe, expect, it } from "vitest";
import { measureGlyphWidth, widthFromCprColumn } from "../src/ui/glyphWidth.js";

describe("glyph width detection", () => {
  it("derives width from the reported cursor column", () => {
    // Printed at column 1: a 1-cell glyph leaves the cursor at column 2, a
    // 2-cell glyph at column 3.
    expect(widthFromCprColumn(2)).toBe(1);
    expect(widthFromCprColumn(3)).toBe(2);
    expect(widthFromCprColumn(1)).toBe(1);
  });

  it("falls back to 1 when stdin is not a TTY", async () => {
    // In the test runner stdin is not a TTY, so the probe resolves immediately.
    await expect(measureGlyphWidth(10)).resolves.toBe(1);
  });
});
