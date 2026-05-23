import { ChessService } from "../chess/ChessService.js";
import { formatMove } from "../chess/MoveService.js";
import type { CliOptions } from "../types/AppOptions.js";
import type { UiState } from "../types/UiState.js";
import { ansi, applyStyle, truncateText } from "./ansi.js";
import {
  BOARD_VISIBLE_WIDTH,
  BoardRenderer,
  createBoardLayout,
  type BoardLayout
} from "./BoardRenderer.js";
import { HelpModal } from "./HelpModal.js";
import { StatusRenderer } from "./StatusRenderer.js";

export type RenderResult = {
  output: string;
  boardLayout: BoardLayout | null;
};

const FULL_WIDTH = 80;
const FULL_HEIGHT = 32;
const SIDE_WIDTH = 100;
const SHORT_HEIGHT = 24;
const COMPACT_WIDTH = BOARD_VISIBLE_WIDTH + 2;
const COMPACT_BOARD_GRID_TOP_OFFSET = 5;

export class LayoutRenderer {
  private readonly boardRenderer = new BoardRenderer();
  private readonly statusRenderer = new StatusRenderer();
  private readonly helpModal = new HelpModal();

  render(chess: ChessService, state: UiState, options: CliOptions): RenderResult {
    const columns = process.stdout.columns ?? 80;
    const rows = process.stdout.rows ?? 24;

    if (columns >= FULL_WIDTH && rows >= FULL_HEIGHT) {
      return this.renderFullLayout(chess, state, options, columns);
    }

    if (columns >= SIDE_WIDTH && rows >= SHORT_HEIGHT) {
      return this.renderSideLayout(chess, state, options, columns);
    }

    if (columns >= COMPACT_WIDTH && rows >= SHORT_HEIGHT) {
      return this.renderCompactLayout(chess, state, options, columns);
    }

    return {
      output: `${ansi.clear}${ansi.showCursor}Terminal too small. Minimum size: ${COMPACT_WIDTH}x${SHORT_HEIGHT}.\n`,
      boardLayout: null
    };
  }

  private renderFullLayout(chess: ChessService, state: UiState, options: CliOptions, columns: number): RenderResult {
    const width = FULL_WIDTH;
    const innerWidth = width - 2;
    const left = Math.max(1, Math.floor((columns - width) / 2) + 1);
    const top = 1;
    const boardLayout = createBoardLayout(left, top, options.flipBoard);
    const box = this.getBox(options.ascii);
    const prefix = " ".repeat(left - 1);
    const lines: string[] = [];
    const pushRule = (leftChar: string, rightChar: string) => {
      lines.push(`${prefix}${leftChar}${box.h.repeat(innerWidth)}${rightChar}`);
    };
    const pushContent = (raw: string, visibleWidth = raw.length) => {
      lines.push(this.renderBoxContent(prefix, box.v, raw, visibleWidth, innerWidth));
    };

    const title = applyStyle("Terminal Chess", [ansi.bold, ansi.fgCyan], options.color);
    pushRule(box.tl, box.tr);
    pushContent(title, "Terminal Chess".length);
    pushRule(box.lt, box.rt);
    pushContent(this.statusRenderer.renderTurn(chess));
    pushContent(this.statusRenderer.renderStatus(chess));
    pushContent(this.statusRenderer.renderMessage(state));
    pushRule(box.lt, box.rt);

    const contentLines = state.showHelp
      ? this.helpModal.render()
      : this.boardRenderer.render(chess, state, options, boardLayout).lines;

    for (const line of contentLines) {
      pushContent(line.raw, line.visibleWidth);
    }

    pushRule(box.lt, box.rt);
    pushContent(this.statusRenderer.renderLastMove(state));
    pushContent(this.statusRenderer.renderInput(state));
    pushContent("Commands: q quit | r restart | u undo | ? help | Esc clear");
    pushRule(box.bl, box.br);

    return {
      output: `${ansi.clear}${ansi.hideCursor}${lines.join("\n")}`,
      boardLayout: state.showHelp ? null : boardLayout
    };
  }

  private renderSideLayout(chess: ChessService, state: UiState, options: CliOptions, columns: number): RenderResult {
    const width = SIDE_WIDTH;
    const innerWidth = width - 2;
    const sideWidth = innerWidth - BOARD_VISIBLE_WIDTH - 2;
    const left = Math.max(1, Math.floor((columns - width) / 2) + 1);
    const top = 1;
    const boardLayout = createBoardLayout(left, top, options.flipBoard, COMPACT_BOARD_GRID_TOP_OFFSET);
    const box = this.getBox(options.ascii);
    const prefix = " ".repeat(left - 1);
    const title = applyStyle("Terminal Chess", [ansi.bold, ansi.fgCyan], options.color);
    const boardLines = state.showHelp
      ? this.padRenderableLines(this.helpModal.render(), 20)
      : this.padRenderableLines(this.boardRenderer.render(chess, state, options, boardLayout).lines, 20);
    const sideLines = this.renderSidePanel(chess, state);
    const lines = [
      `${prefix}${box.tl}${box.h.repeat(innerWidth)}${box.tr}`,
      this.renderBoxContent(prefix, box.v, title, "Terminal Chess".length, innerWidth),
      `${prefix}${box.lt}${box.h.repeat(innerWidth)}${box.rt}`
    ];

    for (let index = 0; index < 20; index += 1) {
      const boardLine = boardLines[index];
      const sideText = this.fitPlainText(sideLines[index] ?? "", sideWidth);
      const raw = `${boardLine.raw}${" ".repeat(Math.max(0, BOARD_VISIBLE_WIDTH - boardLine.visibleWidth))}  ${sideText}`;
      lines.push(this.renderBoxContent(prefix, box.v, raw, BOARD_VISIBLE_WIDTH + 2 + sideText.length, innerWidth));
    }

    lines.push(`${prefix}${box.bl}${box.h.repeat(innerWidth)}${box.br}`);

    return {
      output: `${ansi.clear}${ansi.hideCursor}${lines.join("\n")}`,
      boardLayout: state.showHelp ? null : boardLayout
    };
  }

  private renderCompactLayout(chess: ChessService, state: UiState, options: CliOptions, columns: number): RenderResult {
    const width = Math.min(FULL_WIDTH, Math.max(COMPACT_WIDTH, columns));
    const innerWidth = width - 2;
    const left = Math.max(1, Math.floor((columns - width) / 2) + 1);
    const top = 1;
    const boardLayout = createBoardLayout(left, top, options.flipBoard, COMPACT_BOARD_GRID_TOP_OFFSET);
    const box = this.getBox(options.ascii);
    const prefix = " ".repeat(left - 1);
    const title = this.getCompactTitle(chess, state, options, innerWidth);
    const contentLines = state.showHelp
      ? this.padRenderableLines(this.helpModal.render(), 20)
      : this.padRenderableLines(this.boardRenderer.render(chess, state, options, boardLayout).lines, 20);
    const lines = [
      `${prefix}${box.tl}${box.h.repeat(innerWidth)}${box.tr}`,
      this.renderBoxContent(prefix, box.v, title.raw, title.visibleWidth, innerWidth),
      `${prefix}${box.lt}${box.h.repeat(innerWidth)}${box.rt}`
    ];

    for (const line of contentLines) {
      lines.push(this.renderBoxContent(prefix, box.v, line.raw, line.visibleWidth, innerWidth));
    }

    lines.push(`${prefix}${box.bl}${box.h.repeat(innerWidth)}${box.br}`);

    return {
      output: `${ansi.clear}${ansi.hideCursor}${lines.join("\n")}`,
      boardLayout: state.showHelp ? null : boardLayout
    };
  }

  private renderSidePanel(chess: ChessService, state: UiState): string[] {
    const message = state.pendingPromotion
      ? "Promote: q/r/b/n"
      : `Msg: ${state.message ?? "Ready"}`;

    return [
      "Info",
      "",
      this.statusRenderer.renderTurn(chess),
      this.statusRenderer.renderStatus(chess),
      message,
      "",
      this.statusRenderer.renderLastMove(state),
      this.statusRenderer.renderInput(state),
      "",
      "Commands",
      "q quit",
      "r restart",
      "u undo",
      "? or h help",
      "Esc clear",
      "",
      "Mouse",
      "Click piece",
      "then target",
      "Borders ignored"
    ];
  }

  private getCompactTitle(
    chess: ChessService,
    state: UiState,
    options: CliOptions,
    innerWidth: number
  ): { raw: string; visibleWidth: number } {
    const appTitle = "Terminal Chess";
    const message = state.pendingPromotion
      ? "Promote q/r/b/n"
      : state.message ?? "Ready";
    const suffix = ` | ${chess.getTurnLabel()} | ${chess.getStatusLabel()} | ${message} | Last: ${formatMove(state.lastMove)}`;
    const suffixWidth = Math.max(0, innerWidth - appTitle.length);
    const visibleSuffix = this.fitPlainText(suffix, suffixWidth);

    return {
      raw: `${applyStyle(appTitle, [ansi.bold, ansi.fgCyan], options.color)}${visibleSuffix}`,
      visibleWidth: appTitle.length + visibleSuffix.length
    };
  }

  private padRenderableLines(
    lines: Array<{ raw: string; visibleWidth: number }>,
    count: number
  ): Array<{ raw: string; visibleWidth: number }> {
    return Array.from({ length: count }, (_value, index) => lines[index] ?? { raw: "", visibleWidth: 0 });
  }

  private renderBoxContent(prefix: string, vertical: string, raw: string, visibleWidth: number, innerWidth: number): string {
    const truncated = visibleWidth > innerWidth ? truncateText(raw, innerWidth) : raw;
    const truncatedVisibleWidth = Math.min(visibleWidth, innerWidth);
    return `${prefix}${vertical}${truncated}${" ".repeat(Math.max(0, innerWidth - truncatedVisibleWidth))}${vertical}`;
  }

  private fitPlainText(text: string, width: number): string {
    return text.length > width ? truncateText(text, width) : text;
  }

  private getBox(ascii: boolean): {
    tl: string;
    tr: string;
    bl: string;
    br: string;
    h: string;
    v: string;
    lt: string;
    rt: string;
  } {
    if (ascii) {
      return {
        tl: "+",
        tr: "+",
        bl: "+",
        br: "+",
        h: "-",
        v: "|",
        lt: "+",
        rt: "+"
      };
    }

    return {
      tl: "┌",
      tr: "┐",
      bl: "└",
      br: "┘",
      h: "─",
      v: "│",
      lt: "├",
      rt: "┤"
    };
  }
}
