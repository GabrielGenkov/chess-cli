import { describe, expect, it } from "vitest";
import { isUciPrefix, parseUciMove } from "../src/chess/MoveService.js";

describe("MoveService", () => {
  it("parses UCI moves with optional promotion", () => {
    expect(parseUciMove("e2e4")).toEqual({ from: "e2", to: "e4", promotion: undefined });
    expect(parseUciMove("a7a8q")).toEqual({ from: "a7", to: "a8", promotion: "q" });
  });

  it("rejects invalid UCI moves", () => {
    expect(parseUciMove("e2e9")).toBeNull();
    expect(parseUciMove("castle")).toBeNull();
  });

  it("validates partial UCI input", () => {
    expect(isUciPrefix("h")).toBe(true);
    expect(isUciPrefix("h2h4")).toBe(true);
    expect(isUciPrefix("h2h4q")).toBe(true);
    expect(isUciPrefix("z")).toBe(false);
  });
});
