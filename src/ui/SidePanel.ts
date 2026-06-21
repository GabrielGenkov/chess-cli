import { ChessService, type PieceType } from "../chess/ChessService.js";
import type { Color } from "chess.js";
import { pieceGlyph, resolveTheme, type Theme } from "../config/theme.js";
import type { CliOptions } from "../types/AppOptions.js";
import type { UiState } from "../types/UiState.js";
import type { ColorDepth } from "./color.js";
import { blankLine, padRight, styled, type RenderedLine } from "./lines.js";
import { StatusRenderer } from "./StatusRenderer.js";

export const PANEL_WIDTH = 30;

export class SidePanel {
  private readonly status = new StatusRenderer();

  render(chess: ChessService, state: UiState, options: CliOptions, height: number): RenderedLine[] {
    const theme = resolveTheme(options.theme);
    const depth = options.colorDepth;
    const lines: RenderedLine[] = [];

    const seg = (text: string, fg?: string, opts?: { bold?: boolean; dim?: boolean }): string =>
      styled(text, { bg: theme.panelBg, fg, bold: opts?.bold, dim: opts?.dim }, depth);

    const row = (raw: string, visibleWidth: number): RenderedLine =>
      padRight({ raw, visibleWidth }, PANEL_WIDTH, theme.panelBg, depth);

    const blank = (): RenderedLine => blankLine(PANEL_WIDTH, theme.panelBg, depth);

    const heading = (label: string): RenderedLine =>
      row(seg(` ${label}`, theme.textDim, { bold: true }), label.length + 1);

    // Turn indicator with a piece-colored dot.
    const turn = this.status.turn(chess);
    const dotColor = turn === "White" ? theme.whitePiece : theme.blackPiece;
    const dot = options.ascii ? "*" : "●";
    lines.push(heading("TO MOVE"));
    lines.push(
      row(`${seg("  ", undefined)}${seg(dot, dotColor, { bold: true })}${seg(` ${turn}`, theme.text)}`, 2 + 1 + 1 + turn.length)
    );

    const statusText = this.status.status(chess);
    lines.push(row(seg(`  ${statusText}`, theme.text), 2 + statusText.length));

    const material = this.status.material(chess);
    if (material) {
      lines.push(row(seg(`  Lead ${material}`, theme.coordLabel), 2 + 5 + material.length));
    }

    lines.push(blank());
    lines.push(heading("CAPTURED"));
    lines.push(this.capturedRow(chess, options, theme, depth, "white", row, seg));
    lines.push(this.capturedRow(chess, options, theme, depth, "black", row, seg));

    lines.push(blank());
    lines.push(heading("LAST MOVE"));
    const last = this.status.lastMove(state);
    lines.push(row(seg(`  ${last}`, theme.text), 2 + last.length));

    lines.push(blank());
    lines.push(heading("MOVES"));

    const reserved = lines.length + 1; // leave a trailing blank
    const moveLines = this.moveLines(chess, theme, depth, seg, row, Math.max(0, height - reserved));
    lines.push(...moveLines);

    while (lines.length < height) {
      lines.push(blank());
    }

    return lines.slice(0, height);
  }

  private capturedRow(
    chess: ChessService,
    options: CliOptions,
    theme: Theme,
    depth: ColorDepth,
    side: "white" | "black",
    row: (raw: string, visibleWidth: number) => RenderedLine,
    seg: (text: string, fg?: string, opts?: { bold?: boolean; dim?: boolean }) => string
  ): RenderedLine {
    const captured = chess.getCapturedPieces()[side];
    // White's tray holds the black pieces it removed, and vice versa.
    const pieceColor: Color = side === "white" ? "b" : "w";
    const label = side === "white" ? "W" : "B";

    if (captured.length === 0) {
      return row(`${seg(` ${label} `, theme.textDim)}${seg("—", theme.textDim)}`, 3 + 1);
    }

    const glyphs = captured
      .map((type: PieceType) => pieceGlyph({ color: pieceColor, type }, options.ascii))
      .join(" ");

    return row(
      `${seg(` ${label} `, theme.textDim)}${seg(glyphs, theme.text, { bold: true })}`,
      3 + glyphs.length
    );
  }

  private moveLines(
    chess: ChessService,
    theme: Theme,
    depth: ColorDepth,
    seg: (text: string, fg?: string, opts?: { bold?: boolean; dim?: boolean }) => string,
    row: (raw: string, visibleWidth: number) => RenderedLine,
    maxLines: number
  ): RenderedLine[] {
    if (maxLines <= 0) {
      return [];
    }

    const history = chess.getHistory();
    const pairs: Array<{ no: number; white: string; black: string }> = [];

    for (let index = 0; index < history.length; index += 2) {
      pairs.push({
        no: index / 2 + 1,
        white: history[index]?.san ?? "",
        black: history[index + 1]?.san ?? ""
      });
    }

    const visible = pairs.slice(-maxLines);

    return visible.map((pair) => {
      const number = `${pair.no}.`.padEnd(4);
      const white = pair.white.padEnd(8);
      const text = ` ${number}${white}${pair.black}`;
      const clipped = text.slice(0, PANEL_WIDTH - 1);
      return row(seg(clipped, theme.text), clipped.length);
    });
  }
}
