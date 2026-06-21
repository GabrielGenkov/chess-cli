import type { Move } from "chess.js";
import { ChessService } from "../chess/ChessService.js";
import {
  captureGlyph,
  darkSquareTexture,
  legalMoveGlyph,
  pieceGlyph,
  resolveTheme,
  type Theme
} from "../config/theme.js";
import type { CliOptions } from "../types/AppOptions.js";
import { FILES, type Square } from "../types/Square.js";
import type { UiState } from "../types/UiState.js";
import { ansi } from "./ansi.js";
import { sgr, type ColorDepth } from "./color.js";
import type { GlyphWidth } from "./glyphWidth.js";
import type { RenderedLine } from "./lines.js";

export type { RenderedLine } from "./lines.js";

export type BoardOrientation = "white" | "black";

// Geometry of a single board square. Heights are kept ODD so a single glyph can
// sit on the exact middle row (true vertical centering); pieceWidth is how many
// columns the glyph actually occupies in this terminal, so padding can center it
// horizontally whether the font renders it as 1 or 2 cells.
export type BoardGeometry = {
  tileWidth: number;
  tileHeight: number;
  pieceWidth: GlyphWidth;
};

export const DEFAULT_GEOMETRY: BoardGeometry = { tileWidth: 5, tileHeight: 3, pieceWidth: 1 };

export type BoardLayout = {
  startX: number;
  startY: number;
  squareWidth: number;
  squareHeight: number;
  orientation: BoardOrientation;
};

export type RenderedBoard = {
  lines: RenderedLine[];
  layout: BoardLayout;
};

const GRID_SIZE = 8;
const LEFT_GUTTER = 3; // " 8 "
const RIGHT_GUTTER = 2; // " 8"
const FRAME = 1;
const SHADOW = 1;

// Where the playable grid begins relative to the widget's own top-left corner.
const GRID_ORIGIN_X = LEFT_GUTTER + FRAME; // 4
const GRID_ORIGIN_Y = 2; // file-label row + top-frame row

export function widgetWidth(geometry: BoardGeometry): number {
  return LEFT_GUTTER + FRAME + GRID_SIZE * geometry.tileWidth + FRAME + RIGHT_GUTTER + SHADOW;
}

export function widgetHeight(geometry: BoardGeometry): number {
  // file labels + top frame + tiles + bottom frame + shadow row + file labels
  return 1 + 1 + GRID_SIZE * geometry.tileHeight + 1 + 1 + 1;
}

export function createBoardLayout(
  widgetLeft: number,
  widgetTop: number,
  flipBoard: boolean,
  geometry: BoardGeometry = DEFAULT_GEOMETRY
): BoardLayout {
  return {
    startX: widgetLeft + GRID_ORIGIN_X,
    startY: widgetTop + GRID_ORIGIN_Y,
    squareWidth: geometry.tileWidth,
    squareHeight: geometry.tileHeight,
    orientation: flipBoard ? "black" : "white"
  };
}

export function mouseToSquare(x: number, y: number, layout: BoardLayout): Square | null {
  const localX = x - layout.startX;
  const localY = y - layout.startY;

  if (localX < 0 || localX >= GRID_SIZE * layout.squareWidth) {
    return null;
  }

  if (localY < 0 || localY >= GRID_SIZE * layout.squareHeight) {
    return null;
  }

  const fileIndex = Math.floor(localX / layout.squareWidth);
  const rankIndex = Math.floor(localY / layout.squareHeight);

  const file = layout.orientation === "white" ? FILES[fileIndex] : FILES[GRID_SIZE - 1 - fileIndex];
  const rank = layout.orientation === "white" ? GRID_SIZE - rankIndex : rankIndex + 1;

  return `${file}${rank}` as Square;
}

type TileState = {
  isLight: boolean;
  piece: ReturnType<ChessService["getPiece"]>;
  isSelected: boolean;
  isChecked: boolean;
  isLastMove: boolean;
  legalMove: Move | undefined;
  isCapture: boolean;
};

export class BoardRenderer {
  render(
    chess: ChessService,
    state: UiState,
    options: CliOptions,
    geometry: BoardGeometry = DEFAULT_GEOMETRY
  ): RenderedBoard {
    const theme = resolveTheme(options.theme);
    const depth = options.colorDepth;
    const files = this.getDisplayFiles(options.flipBoard);
    const ranks = this.getDisplayRanks(options.flipBoard);
    const checkedKing = chess.getCheckedKingSquare();

    const lines: RenderedLine[] = [];
    lines.push(this.renderFileLabels(theme, depth, geometry, files));
    lines.push(this.renderTopFrame(theme, depth, geometry));

    for (const rank of ranks) {
      const tiles = files.map((file) => this.toTileState(chess, state, `${file}${rank}` as Square, checkedKing));
      lines.push(...this.renderRankRows(theme, depth, options, geometry, rank, tiles));
    }

    lines.push(this.renderBottomFrame(theme, depth, geometry));
    lines.push(this.renderShadowRow(theme, depth, geometry));
    lines.push(this.renderFileLabels(theme, depth, geometry, files));

    return { lines, layout: createBoardLayout(0, 0, options.flipBoard, geometry) };
  }

  private toTileState(
    chess: ChessService,
    state: UiState,
    square: Square,
    checkedKing: Square | null
  ): TileState {
    const piece = chess.getPiece(square);
    const fileIndex = FILES.indexOf(square[0] as (typeof FILES)[number]);
    const rank = Number(square[1]);
    const legalMove = state.legalMoves.find((move) => move.to === square);

    return {
      isLight: (fileIndex + rank) % 2 === 0,
      piece,
      isSelected: state.selectedSquare === square,
      isChecked: checkedKing === square,
      isLastMove: Boolean(state.lastMove && (state.lastMove.from === square || state.lastMove.to === square)),
      legalMove,
      isCapture: Boolean(legalMove?.captured)
    };
  }

  private renderRankRows(
    theme: Theme,
    depth: ColorDepth,
    options: CliOptions,
    geometry: BoardGeometry,
    rank: number,
    tiles: TileState[]
  ): RenderedLine[] {
    const cellRows = tiles.map((tile) => this.renderTile(theme, depth, options, geometry, tile));
    const glyphRow = Math.floor(geometry.tileHeight / 2);
    const frame = this.frameChar(theme, depth, "│");
    const shadow = this.fill(theme.shadow, depth, " ");

    return Array.from({ length: geometry.tileHeight }, (_unused, row) => {
      const showRank = row === glyphRow ? String(rank) : " ";
      const left = this.coord(theme, depth, ` ${showRank} `);
      const right = this.coord(theme, depth, ` ${showRank}`);
      const cells = cellRows.map((cell) => cell[row]).join("");
      return { raw: `${left}${frame}${cells}${frame}${right}${shadow}`, visibleWidth: widgetWidth(geometry) };
    });
  }

  // Returns one styled string per tile row (length === tileHeight).
  private renderTile(
    theme: Theme,
    depth: ColorDepth,
    options: CliOptions,
    geometry: BoardGeometry,
    tile: TileState
  ): string[] {
    const glyphRow = Math.floor(geometry.tileHeight / 2);
    const content = this.tileContent(theme, options.ascii, tile, geometry.pieceWidth);

    return Array.from({ length: geometry.tileHeight }, (_unused, row) => {
      const token = row === glyphRow ? content : null;

      if (depth === "none") {
        return this.monoRow(options.ascii, tile, geometry, token);
      }

      return this.colorRow(depth, geometry, this.tileBackground(theme, tile), token);
    });
  }

  private colorRow(
    depth: ColorDepth,
    geometry: BoardGeometry,
    background: string,
    token: TileContent | null
  ): string {
    const bg = sgr({ bg: background }, depth);

    if (!token || token.char === " ") {
      return `${bg}${" ".repeat(geometry.tileWidth)}${ansi.reset}`;
    }

    const { left, right } = this.split(geometry.tileWidth, geometry.pieceWidth);
    const glyph = `${sgr({ bg: background, fg: token.fg, bold: true }, depth)}${token.char}`;
    return `${bg}${" ".repeat(left)}${glyph}${bg}${" ".repeat(right)}${ansi.reset}`;
  }

  private monoRow(ascii: boolean, tile: TileState, geometry: BoardGeometry, token: TileContent | null): string {
    const fillChar = tile.isLight ? " " : darkSquareTexture(ascii);
    const fill = (count: number) => fillChar.repeat(Math.max(0, count));

    if (!token || token.char === " ") {
      return fill(geometry.tileWidth);
    }

    const decorated = `${token.markerLeft ?? ""}${token.char}${token.markerRight ?? ""}`;
    const decoratedWidth = geometry.pieceWidth + (token.markerLeft ? 1 : 0) + (token.markerRight ? 1 : 0);
    const { left, right } = this.split(geometry.tileWidth, decoratedWidth);
    return `${fill(left)}${decorated}${fill(right)}`;
  }

  private split(tileWidth: number, tokenWidth: number): { left: number; right: number } {
    const total = Math.max(0, tileWidth - tokenWidth);
    const left = Math.floor(total / 2);
    return { left, right: total - left };
  }

  private tileContent(theme: Theme, ascii: boolean, tile: TileState, pieceWidth: GlyphWidth): TileContent {
    if (tile.piece) {
      const glyph = pieceGlyph(tile.piece, ascii);

      if (tile.isChecked) {
        return { char: glyph, fg: theme.checkFg, markerLeft: "!", markerRight: "!" };
      }

      if (tile.isSelected) {
        return { char: glyph, fg: theme.selectedFg, markerLeft: "[", markerRight: "]" };
      }

      if (tile.isCapture) {
        return { char: glyph, fg: theme.capture, markerLeft: captureGlyph(true), markerRight: captureGlyph(true) };
      }

      return { char: glyph, fg: this.pieceForeground(theme, tile) };
    }

    if (tile.legalMove) {
      return { char: legalMoveGlyph(ascii), fg: theme.legalMove };
    }

    return { char: " ", fg: theme.text };
  }

  private tileBackground(theme: Theme, tile: TileState): string {
    if (tile.isChecked) {
      return theme.checkBg;
    }

    if (tile.isSelected) {
      return theme.selectedBg;
    }

    if (tile.isLastMove) {
      return tile.isLight ? theme.lastMoveLight : theme.lastMoveDark;
    }

    return tile.isLight ? theme.lightSquare : theme.darkSquare;
  }

  private pieceForeground(theme: Theme, tile: TileState): string {
    if (tile.piece?.color === "w") {
      return tile.isLight ? theme.whitePiece : theme.whitePieceOnDark ?? theme.whitePiece;
    }

    return tile.isLight ? theme.blackPieceOnLight ?? theme.blackPiece : theme.blackPiece;
  }

  private renderFileLabels(
    theme: Theme,
    depth: ColorDepth,
    geometry: BoardGeometry,
    files: readonly string[]
  ): RenderedLine {
    const lead = this.fill(theme.outerBg, depth, " ".repeat(GRID_ORIGIN_X));
    const labels = files
      .map((file) => {
        const { left, right } = this.split(geometry.tileWidth, 1);
        return this.coord(theme, depth, `${" ".repeat(left)}${file}${" ".repeat(right)}`);
      })
      .join("");
    const trail = this.fill(theme.outerBg, depth, " ".repeat(FRAME + RIGHT_GUTTER + SHADOW));

    return { raw: `${lead}${labels}${trail}`, visibleWidth: widgetWidth(geometry) };
  }

  private renderTopFrame(theme: Theme, depth: ColorDepth, geometry: BoardGeometry): RenderedLine {
    return this.renderHorizontalFrame(theme, depth, geometry, "╭", "╮");
  }

  private renderBottomFrame(theme: Theme, depth: ColorDepth, geometry: BoardGeometry): RenderedLine {
    const lead = this.fill(theme.outerBg, depth, " ".repeat(LEFT_GUTTER));
    const rule = this.frameChar(theme, depth, `╰${"─".repeat(GRID_SIZE * geometry.tileWidth)}╯`);
    const shadow = this.fill(theme.shadow, depth, " ".repeat(RIGHT_GUTTER + SHADOW));

    return { raw: `${lead}${rule}${shadow}`, visibleWidth: widgetWidth(geometry) };
  }

  private renderHorizontalFrame(
    theme: Theme,
    depth: ColorDepth,
    geometry: BoardGeometry,
    left: string,
    right: string
  ): RenderedLine {
    const lead = this.fill(theme.outerBg, depth, " ".repeat(LEFT_GUTTER));
    const rule = this.frameChar(theme, depth, `${left}${"─".repeat(GRID_SIZE * geometry.tileWidth)}${right}`);
    const trail = this.fill(theme.outerBg, depth, " ".repeat(RIGHT_GUTTER + SHADOW));

    return { raw: `${lead}${rule}${trail}`, visibleWidth: widgetWidth(geometry) };
  }

  private renderShadowRow(theme: Theme, depth: ColorDepth, geometry: BoardGeometry): RenderedLine {
    const lead = this.fill(theme.outerBg, depth, " ".repeat(LEFT_GUTTER + FRAME));
    const shadow = this.fill(theme.shadow, depth, " ".repeat(GRID_SIZE * geometry.tileWidth + FRAME + RIGHT_GUTTER));

    return { raw: `${lead}${shadow}`, visibleWidth: widgetWidth(geometry) };
  }

  private coord(theme: Theme, depth: ColorDepth, text: string): string {
    if (depth === "none") {
      return text;
    }

    return `${sgr({ bg: theme.outerBg, fg: theme.coordLabel }, depth)}${text}${ansi.reset}`;
  }

  private frameChar(theme: Theme, depth: ColorDepth, text: string): string {
    if (depth === "none") {
      return text;
    }

    return `${sgr({ bg: theme.outerBg, fg: theme.frame }, depth)}${text}${ansi.reset}`;
  }

  private fill(color: string, depth: ColorDepth, text: string): string {
    if (depth === "none") {
      return text;
    }

    return `${sgr({ bg: color }, depth)}${text}${ansi.reset}`;
  }

  private getDisplayFiles(flipBoard: boolean): readonly string[] {
    return flipBoard ? [...FILES].reverse() : FILES;
  }

  private getDisplayRanks(flipBoard: boolean): number[] {
    return flipBoard ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  }
}

type TileContent = {
  char: string;
  fg: string;
  markerLeft?: string;
  markerRight?: string;
};
