import type { Move } from "chess.js";
import { ChessService } from "../chess/ChessService.js";
import { legalMoveGlyph, pieceGlyph } from "../config/theme.js";
import type { CliOptions } from "../types/AppOptions.js";
import { FILES, type Square } from "../types/Square.js";
import type { UiState } from "../types/UiState.js";
import { ansi, applyStyle } from "./ansi.js";

export type BoardOrientation = "white" | "black";

export type BoardLayout = {
  startX: number;
  startY: number;
  squareWidth: number;
  squareHeight: number;
  orientation: BoardOrientation;
};

export type RenderedBoard = {
  lines: Array<{
    raw: string;
    visibleWidth: number;
  }>;
  layout: BoardLayout;
};

const BOARD_START_RELATIVE_X = 12;
const CELL_INNER_WIDTH = 5;
const SQUARE_WIDTH = CELL_INNER_WIDTH + 1;
const SQUARE_HEIGHT = 2;
const GRID_SIZE = 8;
const GRID_WIDTH = 1 + GRID_SIZE * SQUARE_WIDTH;
const GRID_HEIGHT = 1 + GRID_SIZE * SQUARE_HEIGHT;
export const BOARD_VISIBLE_WIDTH = BOARD_START_RELATIVE_X - 3 + 1 + 2 + GRID_WIDTH + 2 + 1;

export function createBoardLayout(left: number, top: number, flipBoard: boolean, gridTopOffset = 9): BoardLayout {
  return {
    startX: left + 1 + BOARD_START_RELATIVE_X,
    startY: top + gridTopOffset,
    squareWidth: SQUARE_WIDTH,
    squareHeight: SQUARE_HEIGHT,
    orientation: flipBoard ? "black" : "white"
  };
}

export function mouseToSquare(x: number, y: number, layout: BoardLayout): Square | null {
  const localX = x - layout.startX;
  const localY = y - layout.startY;

  if (localX < 0 || localX > GRID_SIZE * layout.squareWidth || localY < 0 || localY > GRID_SIZE * layout.squareHeight) {
    return null;
  }

  if (localX % layout.squareWidth === 0 || localY % layout.squareHeight === 0) {
    return null;
  }

  const fileIndex = Math.floor((localX - 1) / layout.squareWidth);
  const rankIndex = Math.floor((localY - 1) / layout.squareHeight);

  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) {
    return null;
  }

  const file = layout.orientation === "white" ? FILES[fileIndex] : FILES[7 - fileIndex];
  const rank = layout.orientation === "white" ? 8 - rankIndex : rankIndex + 1;

  return `${file}${rank}` as Square;
}

export class BoardRenderer {
  render(chess: ChessService, state: UiState, options: CliOptions, layout: BoardLayout): RenderedBoard {
    const files = this.getDisplayFiles(options.flipBoard);
    const ranks = this.getDisplayRanks(options.flipBoard);
    const lines = [
      { raw: "", visibleWidth: 0 },
      this.renderFileLabels(files),
      this.renderHorizontalBorder("top", options.ascii),
      ...ranks.flatMap((rank, index) => [
        this.renderRankLine(chess, state, options, rank, files),
        this.renderHorizontalBorder(index === ranks.length - 1 ? "bottom" : "middle", options.ascii)
      ]),
      this.renderFileLabels(files)
    ];

    return {
      lines,
      layout
    };
  }

  private renderFileLabels(files: readonly string[]): { raw: string; visibleWidth: number } {
    const raw = `${" ".repeat(BOARD_START_RELATIVE_X)} ${files.map((file) => `  ${file}   `).join("")}`;
    return {
      raw,
      visibleWidth: BOARD_START_RELATIVE_X + GRID_WIDTH
    };
  }

  private renderHorizontalBorder(
    position: "top" | "middle" | "bottom",
    ascii: boolean
  ): { raw: string; visibleWidth: number } {
    const border = this.getGridCharacters(ascii);
    const joints = {
      top: [border.topLeft, border.topJoin, border.topRight],
      middle: [border.leftJoin, border.centerJoin, border.rightJoin],
      bottom: [border.bottomLeft, border.bottomJoin, border.bottomRight]
    }[position];
    const raw = `${" ".repeat(BOARD_START_RELATIVE_X)}${joints[0]}${Array.from({ length: GRID_SIZE }, (_value, index) => {
      const right = index === GRID_SIZE - 1 ? joints[2] : joints[1];
      return `${border.horizontal.repeat(CELL_INNER_WIDTH)}${right}`;
    }).join("")}`;

    return {
      raw,
      visibleWidth: BOARD_START_RELATIVE_X + GRID_WIDTH
    };
  }

  private renderRankLine(
    chess: ChessService,
    state: UiState,
    options: CliOptions,
    rank: number,
    files: readonly string[]
  ): { raw: string; visibleWidth: number } {
    const border = this.getGridCharacters(options.ascii);
    const cells = files.map((file) => {
      const square = `${file}${rank}` as Square;
      return this.renderSquare(chess, state, options, square);
    });
    const leftPadding = " ".repeat(BOARD_START_RELATIVE_X - 3);
    const raw = `${leftPadding}${rank}  ${border.vertical}${cells.join(border.vertical)}${border.vertical}  ${rank}`;

    return {
      raw,
      visibleWidth: BOARD_VISIBLE_WIDTH
    };
  }

  private renderSquare(chess: ChessService, state: UiState, options: CliOptions, square: Square): string {
    const piece = chess.getPiece(square);
    const legalMove = state.legalMoves.find((move) => move.to === square);
    const isSelected = state.selectedSquare === square;
    const isCheckedKing = chess.getCheckedKingSquare() === square;
    const isCapture = Boolean(legalMove?.captured);
    const glyph = piece ? pieceGlyph(piece, options.ascii) : "";

    let cell = this.centerGlyph(glyph);

    if (legalMove && !piece) {
      cell = this.centerGlyph(legalMoveGlyph(options.ascii));
    }

    if (isCapture && piece) {
      cell = ` x${glyph}x `;
    }

    if (isSelected && piece) {
      cell = ` [${glyph}] `;
    }

    if (isCheckedKing && piece) {
      cell = ` !${glyph}! `;
    }

    return applyStyle(cell, this.getSquareStyle({ isCheckedKing, isSelected, isCapture, legalMove }), options.color);
  }

  private getSquareStyle({
    isCheckedKing,
    isSelected,
    isCapture,
    legalMove
  }: {
    isCheckedKing: boolean;
    isSelected: boolean;
    isCapture: boolean;
    legalMove: Move | undefined;
  }): string[] {
    if (isCheckedKing) {
      return [ansi.bgRed, ansi.fgWhite, ansi.bold];
    }

    if (isSelected) {
      return [ansi.bgYellow, ansi.fgBlack, ansi.bold];
    }

    if (isCapture) {
      return [ansi.bgRed, ansi.fgWhite];
    }

    if (legalMove) {
      return [ansi.bgGreen, ansi.fgBlack];
    }

    return [];
  }

  private centerGlyph(glyph: string): string {
    if (!glyph) {
      return " ".repeat(CELL_INNER_WIDTH);
    }

    return `  ${glyph}  `;
  }

  private getDisplayFiles(flipBoard: boolean): readonly string[] {
    return flipBoard ? [...FILES].reverse() : FILES;
  }

  private getDisplayRanks(flipBoard: boolean): number[] {
    return flipBoard ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  }

  private getGridCharacters(ascii: boolean): {
    horizontal: string;
    vertical: string;
    topLeft: string;
    topJoin: string;
    topRight: string;
    leftJoin: string;
    centerJoin: string;
    rightJoin: string;
    bottomLeft: string;
    bottomJoin: string;
    bottomRight: string;
  } {
    if (ascii) {
      return {
        horizontal: "-",
        vertical: "|",
        topLeft: "+",
        topJoin: "+",
        topRight: "+",
        leftJoin: "+",
        centerJoin: "+",
        rightJoin: "+",
        bottomLeft: "+",
        bottomJoin: "+",
        bottomRight: "+"
      };
    }

    return {
      horizontal: "─",
      vertical: "│",
      topLeft: "┌",
      topJoin: "┬",
      topRight: "┐",
      leftJoin: "├",
      centerJoin: "┼",
      rightJoin: "┤",
      bottomLeft: "└",
      bottomJoin: "┴",
      bottomRight: "┘"
    };
  }
}
