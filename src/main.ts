#!/usr/bin/env node
import { Command, Option } from "commander";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ChessCliApp } from "./app/ChessCliApp.js";
import { DEFAULT_THEME, isThemeName, THEMES, type ThemeName } from "./config/theme.js";
import type { CliOptions } from "./types/AppOptions.js";
import { detectColorDepth } from "./ui/color.js";

export type RawOptions = {
  ascii?: boolean;
  color?: boolean;
  mouse?: boolean;
  flipBoard?: boolean;
  theme?: string;
  pieceWidth?: string;
};

export type StartApp = (options: CliOptions) => void;

const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

function addPlayOptions(command: Command): Command {
  return command
    .option("--ascii", "render board and pieces using ASCII characters")
    .option("--no-color", "disable ANSI colors")
    .option("--no-mouse", "disable terminal mouse tracking")
    .option("--flip-board", "render the board from Black's perspective")
    .addOption(
      new Option("--theme <name>", "board color theme").choices(THEME_NAMES).default(DEFAULT_THEME)
    )
    .addOption(
      new Option("--piece-width <cells>", "terminal cells a piece glyph occupies (auto-detected by default)").choices([
        "1",
        "2"
      ])
    );
}

// Windows consoles and Git Bash (mintty) commonly draw the chess glyphs wider
// than one cell while still advancing one; Windows Terminal handles them
// correctly. Use even-width tiles on the former so pieces stay centered.
export function prefersWideTiles(platform: NodeJS.Platform, env: NodeJS.ProcessEnv): boolean {
  return platform === "win32" && !env.WT_SESSION && !env.WT_PROFILE_ID;
}

export function normalizeOptions(options: RawOptions): CliOptions {
  const theme = options.theme && isThemeName(options.theme) ? options.theme : DEFAULT_THEME;
  const pinnedWidth = options.pieceWidth === "1" || options.pieceWidth === "2";

  return {
    ascii: Boolean(options.ascii),
    colorDepth: detectColorDepth(options.color !== false),
    mouse: options.mouse !== false,
    flipBoard: Boolean(options.flipBoard),
    theme,
    pieceWidth: options.pieceWidth === "2" ? 2 : 1,
    detectPieceWidth: !pinnedWidth && !options.ascii,
    wideTiles: !options.ascii && prefersWideTiles(process.platform, process.env)
  };
}

function startChessCli(options: CliOptions): void {
  const app = new ChessCliApp(options);
  void app.start();
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
