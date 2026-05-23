import { ChessService } from "../chess/ChessService.js";
import type { CliOptions } from "../types/AppOptions.js";
import type { UiState } from "../types/UiState.js";
import { ansi, applyStyle, truncateText } from "./ansi.js";
import { BoardRenderer, createBoardLayout, type BoardLayout } from "./BoardRenderer.js";
import { HelpModal } from "./HelpModal.js";
import { StatusRenderer } from "./StatusRenderer.js";

export type RenderResult = {
  output: string;
  boardLayout: BoardLayout | null;
};

const WIDTH = 60;
const HEIGHT = 24;
const INNER_WIDTH = WIDTH - 2;

export class LayoutRenderer {
  private readonly boardRenderer = new BoardRenderer();
  private readonly statusRenderer = new StatusRenderer();
  private readonly helpModal = new HelpModal();

  render(chess: ChessService, state: UiState, options: CliOptions): RenderResult {
    const columns = process.stdout.columns ?? 80;
    const rows = process.stdout.rows ?? 24;

    if (columns < WIDTH || rows < HEIGHT) {
      return {
        output: `${ansi.clear}${ansi.showCursor}Terminal too small. Minimum size: ${WIDTH}x${HEIGHT}.\n`,
        boardLayout: null
      };
    }

    const left = Math.max(1, Math.floor((columns - WIDTH) / 2) + 1);
    const top = 1;
    const boardLayout = createBoardLayout(left, top, options.flipBoard);
    const box = this.getBox(options.ascii);
    const prefix = " ".repeat(left - 1);
    const lines: string[] = [];
    const pushRule = (leftChar: string, rightChar: string) => {
      lines.push(`${prefix}${leftChar}${box.h.repeat(INNER_WIDTH)}${rightChar}`);
    };
    const pushContent = (raw: string, visibleWidth = raw.length) => {
      const truncated = visibleWidth > INNER_WIDTH ? truncateText(raw, INNER_WIDTH) : raw;
      const truncatedVisibleWidth = Math.min(visibleWidth, INNER_WIDTH);
      lines.push(`${prefix}${box.v}${truncated}${" ".repeat(Math.max(0, INNER_WIDTH - truncatedVisibleWidth))}${box.v}`);
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
      boardLayout
    };
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
