#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ChessCliApp } from "./app/ChessCliApp.js";
import { detectColor } from "./config/theme.js";
import type { CliOptions } from "./types/AppOptions.js";

export type RawOptions = {
  ascii?: boolean;
  color?: boolean;
  mouse?: boolean;
  flipBoard?: boolean;
};

export type StartApp = (options: CliOptions) => void;

function addPlayOptions(command: Command): Command {
  return command
    .option("--ascii", "render board and pieces using ASCII characters")
    .option("--no-color", "disable ANSI colors")
    .option("--no-mouse", "disable terminal mouse tracking")
    .option("--flip-board", "render the board from Black's perspective");
}

export function normalizeOptions(options: RawOptions): CliOptions {
  return {
    ascii: Boolean(options.ascii),
    color: detectColor(options.color !== false),
    mouse: options.mouse !== false,
    flipBoard: Boolean(options.flipBoard)
  };
}

function startChessCli(options: CliOptions): void {
  const app = new ChessCliApp(options);
  app.start();
}

function runFromCommand(command: Command, startApp: StartApp): void {
  startApp(normalizeOptions(command.optsWithGlobals() as RawOptions));
}

export function createProgram(startApp: StartApp = startChessCli): Command {
  const program = addPlayOptions(new Command())
    .name("chess-cli")
    .description("Interactive terminal chess for local pass-and-play matches")
    .version("0.1.0")
    .action((_options: RawOptions, command: Command) => runFromCommand(command, startApp));

  addPlayOptions(program.command("play").description("start a local pass-and-play chess match")).action(
    (_options: RawOptions, command: Command) => runFromCommand(command, startApp)
  );

  return program;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createProgram().parse(process.argv);
}
