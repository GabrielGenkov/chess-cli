import { afterEach, describe, expect, it } from "vitest";
import {
  detectColorDepth,
  hexToRgb,
  paint,
  rgbToAnsi16Index,
  rgbToAnsi256,
  sgr
} from "../src/ui/color.js";

describe("color engine", () => {
  const originalNoColor = process.env.NO_COLOR;

  afterEach(() => {
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
  });

  it("parses hex colors", () => {
    expect(hexToRgb("#E8C99B")).toEqual({ r: 232, g: 201, b: 155 });
    expect(hexToRgb("000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("emits truecolor SGR sequences", () => {
    expect(sgr({ fg: "#ff8800" }, "truecolor")).toBe("\x1b[38;2;255;136;0m");
    expect(sgr({ bg: "#102030" }, "truecolor")).toBe("\x1b[48;2;16;32;48m");
    expect(sgr({ fg: "#ffffff", bold: true }, "truecolor")).toBe("\x1b[1;38;2;255;255;255m");
  });

  it("drops color but keeps bold/dim in monochrome", () => {
    expect(sgr({ fg: "#ffffff", bg: "#000000" }, "none")).toBe("");
    expect(sgr({ fg: "#ffffff", bold: true }, "none")).toBe("\x1b[1m");
  });

  it("wraps text with paint and resets", () => {
    expect(paint("x", { fg: "#ff0000" }, "truecolor")).toBe("\x1b[38;2;255;0;0mx\x1b[0m");
    expect(paint("x", {}, "none")).toBe("x");
  });

  it("maps colors to the nearest 16-color index", () => {
    expect(rgbToAnsi16Index({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(rgbToAnsi16Index({ r: 255, g: 0, b: 0 })).toBe(9);
    expect(rgbToAnsi16Index({ r: 255, g: 255, b: 255 })).toBe(15);
  });

  it("maps dark low-saturation colors to a sane 256 index (not a primary)", () => {
    // #1A120B is a near-black brown; the naive cube shortcut used to map it to
    // dark red (52). It should resolve to a near-black gray instead.
    const index = rgbToAnsi256(hexToRgb("#1A120B"));
    expect(index).toBeGreaterThanOrEqual(232); // grayscale ramp
    expect(rgbToAnsi256({ r: 255, g: 255, b: 255 })).toBe(231);
  });

  it("honors NO_COLOR and explicit opt-out", () => {
    process.env.NO_COLOR = "1";
    expect(detectColorDepth(true)).toBe("none");

    delete process.env.NO_COLOR;
    expect(detectColorDepth(false)).toBe("none");
  });
});
