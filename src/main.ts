#!/usr/bin/env node
import { Command } from "commander";
import { ChessCliApp } from "./app/ChessCliApp.js";
import { detectColor } from "./config/theme.js";
import type { CliOptions } from "./types/AppOptions.js";

type RawOptions = {
  ascii?: boolean;
  color?: boolean;
  mouse?: boolean;
  flipBoard?: boolean;
};

function addPlayOptions(command: Command): Command {
  return command
    .option("--ascii", "render board and pieces using ASCII characters")
    .option("--no-color", "disable ANSI colors")
    .option("--no-mouse", "disable terminal mouse tracking")
    .option("--flip-board", "render the board from Black's perspective");
}

function normalizeOptions(options: RawOptions): CliOptions {
  return {
    ascii: Boolean(options.ascii),
    color: detectColor(options.color !== false),
    mouse: options.mouse !== false,
    flipBoard: Boolean(options.flipBoard)
  };
}

function run(options: RawOptions): void {
  const app = new ChessCliApp(normalizeOptions(options));
  app.start();
}

const program = addPlayOptions(new Command())
  .name("chess-cli")
  .description("Interactive terminal chess for local pass-and-play matches")
  .version("0.1.0")
  .action(run);

addPlayOptions(program.command("play").description("start a local pass-and-play chess match")).action(run);

program.parse(process.argv);
