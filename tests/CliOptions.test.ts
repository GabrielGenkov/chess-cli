import { describe, expect, it } from "vitest";
import { createProgram } from "../src/main.js";
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
    expect(parseCliOptions(["--ascii", "--no-color", "--no-mouse", "--flip-board"])).toEqual({
      ascii: true,
      color: false,
      mouse: false,
      flipBoard: true
    });
  });

  it("applies play subcommand options", () => {
    expect(parseCliOptions(["play", "--ascii", "--no-color", "--no-mouse", "--flip-board"])).toEqual({
      ascii: true,
      color: false,
      mouse: false,
      flipBoard: true
    });
  });

  it("applies options before and after the play subcommand", () => {
    expect(parseCliOptions(["--ascii", "play", "--no-color", "--no-mouse", "--flip-board"])).toEqual({
      ascii: true,
      color: false,
      mouse: false,
      flipBoard: true
    });
  });
});
