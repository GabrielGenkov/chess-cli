import { ChessService } from "../chess/ChessService.js";
import { resolveTheme, type Theme } from "../config/theme.js";
import type { CliOptions } from "../types/AppOptions.js";
import type { UiState } from "../types/UiState.js";
import { ansi } from "./ansi.js";
import {
  BoardRenderer,
  createBoardLayout,
  widgetHeight,
  widgetWidth,
  type BoardGeometry,
  type BoardLayout
} from "./BoardRenderer.js";
import type { ColorDepth } from "./color.js";
import { HelpModal } from "./HelpModal.js";
import {
  blankLine,
  fillRun,
  joinHorizontal,
  padRight,
  styled,
  type RenderedLine
} from "./lines.js";
import { PANEL_WIDTH, SidePanel } from "./SidePanel.js";
import { StatusRenderer } from "./StatusRenderer.js";

export type RenderResult = {
  output: string;
  boardLayout: BoardLayout | null;
};

const GAP = 2;
const FULL_CHROME = 5; // header(2) + gap(1) + footer(2)
const BOARD_CHROME = 3; // header(1) + footer(2)
// A 3-row-tall board only fits comfortably in a tall terminal; otherwise we use
// a compact 1-row board. Both heights are odd so pieces stay vertically centered.
const TALL_ROWS = 34;

export class LayoutRenderer {
  private readonly boardRenderer = new BoardRenderer();
  private readonly sidePanel = new SidePanel();
  private readonly helpModal = new HelpModal();
  private readonly status = new StatusRenderer();

  render(chess: ChessService, state: UiState, options: CliOptions): RenderResult {
    const columns = process.stdout.columns ?? 80;
    const rows = process.stdout.rows ?? 24;
    const theme = resolveTheme(options.theme);
    const depth = options.colorDepth;

    // Even tile width centers glyphs the terminal draws ~2 cells wide (the glyph
    // sits at column 1 and its drawing is centered in the 4-wide square); odd
    // width dead-centers a true 1-cell glyph. Pick per terminal.
    const evenTiles = options.pieceWidth === 2 || options.wideTiles;
    const geometry: BoardGeometry = {
      pieceWidth: options.pieceWidth,
      tileWidth: evenTiles ? 4 : 5,
      tileHeight: rows >= TALL_ROWS ? 3 : 1
    };

    const widgetW = widgetWidth(geometry);
    const widgetH = widgetHeight(geometry);
    const fullBlockWidth = widgetW + GAP + PANEL_WIDTH;

    if (columns >= fullBlockWidth && rows >= widgetH + FULL_CHROME) {
      return this.composeFull(chess, state, options, theme, depth, geometry, columns, rows);
    }

    if (columns >= widgetW && rows >= widgetH + BOARD_CHROME) {
      return this.composeBoardOnly(chess, state, options, theme, depth, geometry, columns, rows);
    }

    const compact: BoardGeometry = { ...geometry, tileHeight: 1 };
    const minCols = widgetWidth(compact);
    const minRows = widgetHeight(compact) + BOARD_CHROME;

    return {
      output: `${ansi.clear}${ansi.showCursor}Terminal too small. Minimum size: ${minCols}x${minRows}.\n`,
      boardLayout: null
    };
  }

  private composeFull(
    chess: ChessService,
    state: UiState,
    options: CliOptions,
    theme: Theme,
    depth: ColorDepth,
    geometry: BoardGeometry,
    columns: number,
    rows: number
  ): RenderResult {
    const widgetW = widgetWidth(geometry);
    const widgetH = widgetHeight(geometry);
    const blockWidth = widgetW + GAP + PANEL_WIDTH;
    const header = this.header(theme, depth, options, chess, blockWidth);
    const footer = this.footer(theme, depth, state, blockWidth);

    let body: RenderedLine[];
    let withBoard = false;

    if (state.showHelp) {
      body = this.helpBody(theme, depth, blockWidth, widgetH);
    } else {
      const boardLines = this.boardLines(chess, state, options, geometry);
      const panelLines = this.sidePanel.render(chess, state, options, widgetH);
      body = boardLines.map((line, index) =>
        joinHorizontal(line, panelLines[index] ?? blankLine(PANEL_WIDTH, theme.panelBg, depth), GAP, theme.outerBg, depth)
      );
      withBoard = true;
    }

    const content = [...header, ...body, blankLine(blockWidth, theme.outerBg, depth), ...footer];
    const screen = this.assemble(content, blockWidth, columns, rows, theme, depth);
    const boardLayout = withBoard
      ? createBoardLayout(screen.left + 1, screen.top + header.length + 1, options.flipBoard, geometry)
      : null;

    return { output: screen.output, boardLayout };
  }

  private composeBoardOnly(
    chess: ChessService,
    state: UiState,
    options: CliOptions,
    theme: Theme,
    depth: ColorDepth,
    geometry: BoardGeometry,
    columns: number,
    rows: number
  ): RenderResult {
    const blockWidth = widgetWidth(geometry);
    const widgetH = widgetHeight(geometry);
    const header = [this.headerLine(theme, depth, options, chess, blockWidth)];
    const footer = this.footer(theme, depth, state, blockWidth);

    let body: RenderedLine[];
    let withBoard = false;

    if (state.showHelp) {
      body = this.helpBody(theme, depth, blockWidth, widgetH);
    } else {
      body = this.boardLines(chess, state, options, geometry);
      withBoard = true;
    }

    const content = [...header, ...body, ...footer];
    const screen = this.assemble(content, blockWidth, columns, rows, theme, depth);
    const boardLayout = withBoard
      ? createBoardLayout(screen.left + 1, screen.top + header.length + 1, options.flipBoard, geometry)
      : null;

    return { output: screen.output, boardLayout };
  }

  private boardLines(
    chess: ChessService,
    state: UiState,
    options: CliOptions,
    geometry: BoardGeometry
  ): RenderedLine[] {
    return this.boardRenderer.render(chess, state, options, geometry).lines;
  }

  private helpBody(theme: Theme, depth: ColorDepth, blockWidth: number, height: number): RenderedLine[] {
    const help = this.helpModal.render(theme, depth, blockWidth);
    const lines = help.slice(0, height);

    while (lines.length < height) {
      lines.push(blankLine(blockWidth, theme.panelBg, depth));
    }

    return lines.map((line) => padRight(line, blockWidth, theme.panelBg, depth));
  }

  private header(
    theme: Theme,
    depth: ColorDepth,
    options: CliOptions,
    chess: ChessService,
    blockWidth: number
  ): RenderedLine[] {
    return [this.headerLine(theme, depth, options, chess, blockWidth), blankLine(blockWidth, theme.outerBg, depth)];
  }

  private headerLine(
    theme: Theme,
    depth: ColorDepth,
    options: CliOptions,
    chess: ChessService,
    blockWidth: number
  ): RenderedLine {
    const crown = options.ascii ? "" : "♚ ";
    const title = `${crown}Terminal Chess`;
    const themeTag = ` · ${theme.label}`;
    const statusText = chess.getStatusLabel();
    const right = statusText === "Normal" ? `${this.status.turn(chess)} to move` : statusText;

    const leftWidth = title.length + themeTag.length;
    const rightWidth = right.length;
    const spacer = Math.max(1, blockWidth - leftWidth - rightWidth - 2);

    const raw =
      styled(` ${title}`, { bg: theme.outerBg, fg: theme.title, bold: true }, depth) +
      styled(themeTag, { bg: theme.outerBg, fg: theme.textDim }, depth) +
      fillRun(spacer, theme.outerBg, depth) +
      styled(`${right} `, { bg: theme.outerBg, fg: theme.coordLabel }, depth);

    return padRight({ raw, visibleWidth: 1 + leftWidth + spacer + rightWidth + 1 }, blockWidth, theme.outerBg, depth);
  }

  private footer(theme: Theme, depth: ColorDepth, state: UiState, blockWidth: number): RenderedLine[] {
    const message = this.status.message(state);
    const input = state.inputBuffer ? `input ${state.inputBuffer}` : "";
    const left = ` ${message}`;
    const spacer = Math.max(1, blockWidth - left.length - input.length - 2);
    const messageLine: RenderedLine = padRight(
      {
        raw:
          styled(left, { bg: theme.outerBg, fg: theme.text }, depth) +
          fillRun(spacer, theme.outerBg, depth) +
          styled(`${input} `, { bg: theme.outerBg, fg: theme.coordLabel }, depth),
        visibleWidth: left.length + spacer + input.length + 1
      },
      blockWidth,
      theme.outerBg,
      depth
    );

    const commands = " q quit   r restart   u undo   ? help   Esc clear";
    const commandsLine: RenderedLine = padRight(
      { raw: styled(commands, { bg: theme.outerBg, fg: theme.textDim }, depth), visibleWidth: commands.length },
      blockWidth,
      theme.outerBg,
      depth
    );

    return [messageLine, commandsLine];
  }

  // Center the content block on screen and (for color tiers) paint the whole
  // terminal in the theme background so the app reads as a window, not a prompt.
  private assemble(
    content: RenderedLine[],
    blockWidth: number,
    columns: number,
    rows: number,
    theme: Theme,
    depth: ColorDepth
  ): { output: string; left: number; top: number } {
    const left = Math.max(0, Math.floor((columns - blockWidth) / 2));
    const top = Math.max(0, Math.floor((rows - content.length) / 2));
    const fill = depth !== "none";
    const screenLines: string[] = [];

    const blankScreenLine = (): string => (fill ? fillRun(columns, theme.outerBg, depth) : "");

    for (let index = 0; index < top; index += 1) {
      screenLines.push(blankScreenLine());
    }

    for (const line of content) {
      const leftPad = fill ? fillRun(left, theme.outerBg, depth) : " ".repeat(left);
      const usedRight = left + line.visibleWidth;
      const rightPad = fill ? fillRun(Math.max(0, columns - usedRight), theme.outerBg, depth) : "";
      screenLines.push(`${leftPad}${line.raw}${rightPad}`);
    }

    while (fill && screenLines.length < rows) {
      screenLines.push(blankScreenLine());
    }

    const trimmed = screenLines.slice(0, rows);

    return {
      output: `${ansi.clear}${ansi.hideCursor}${trimmed.join("\n")}`,
      left,
      top
    };
  }
}
