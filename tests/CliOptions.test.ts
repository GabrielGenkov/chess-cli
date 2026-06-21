import { describe, expect, it } from "vitest";
import { createProgram, prefersWideTiles } from "../src/main.js";
import type { CliOptions } from "../src/types/AppOptions.js";

function parseCliOptions(args: string[]): CliOptions {
  const calls: CliOptions[] = [];
  const program = createProgram((options) => {
    calls.push(options);
  });

  program.exitOverride();
  program.configureOutput({
    writeErr: () => {},
    writeOut: () => {}
  });
  program.parse(args, { from: "user" });

  expect(calls).toHaveLength(1);
  return calls[0];
}

describe("CLI option parsing", () => {
  it("applies root command options", () => {
    const options = parseCliOptions(["--ascii", "--no-color", "--no-mouse", "--flip-board"]);

    expect(options).toMatchObject({
      ascii: true,
      colorDepth: "none",
      mouse: false,
      flipBoard: true,
      theme: "walnut"
    });
  });

  it("applies play subcommand options", () => {
    const options = parseCliOptions(["play", "--ascii", "--no-color", "--no-mouse", "--flip-board"]);

    expect(options).toMatchObject({
      ascii: true,
      colorDepth: "none",
      mouse: false,
      flipBoard: true
    });
  });

  it("applies options before and after the play subcommand", () => {
    const options = parseCliOptions(["--ascii", "play", "--no-color", "--flip-board"]);

    expect(options).toMatchObject({ ascii: true, colorDepth: "none", flipBoard: true });
  });

  it("defaults to the walnut theme and enabled mouse", () => {
    const options = parseCliOptions([]);

    expect(options.theme).toBe("walnut");
    expect(options.mouse).toBe(true);
    expect(options.ascii).toBe(false);
    expect(["truecolor", "ansi256", "ansi16", "none"]).toContain(options.colorDepth);
  });

  it("accepts a named theme", () => {
    expect(parseCliOptions(["--theme", "emerald"]).theme).toBe("emerald");
    expect(parseCliOptions(["play", "--theme", "midnight"]).theme).toBe("midnight");
  });

  it("rejects an unknown theme", () => {
    expect(() => parseCliOptions(["--theme", "bogus"])).toThrow();
  });

  it("auto-detects piece width by default and pins it when given", () => {
    const auto = parseCliOptions([]);
    expect(auto.pieceWidth).toBe(1);
    expect(auto.detectPieceWidth).toBe(true);

    const pinned = parseCliOptions(["--piece-width", "2"]);
    expect(pinned.pieceWidth).toBe(2);
    expect(pinned.detectPieceWidth).toBe(false);
  });

  it("does not auto-detect piece width in ASCII mode", () => {
    expect(parseCliOptions(["--ascii"]).detectPieceWidth).toBe(false);
  });

  it("prefers wide tiles only on Windows outside Windows Terminal", () => {
    expect(prefersWideTiles("win32", {})).toBe(true);
    expect(prefersWideTiles("win32", { WT_SESSION: "abc" })).toBe(false);
    expect(prefersWideTiles("linux", {})).toBe(false);
    expect(prefersWideTiles("darwin", {})).toBe(false);
  });
});
