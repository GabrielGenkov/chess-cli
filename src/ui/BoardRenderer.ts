import type { Move } from "chess.js";
import { ChessService } from "../chess/ChessService.js";
import { emptySquareGlyph, legalMoveGlyph, pieceGlyph } from "../config/theme.js";
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
const SQUARE_WIDTH = 4;
const SQUARE_HEIGHT = 1;

export function createBoardLayout(left: number, top: number, flipBoard: boolean): BoardLayout {
  return {
    startX: left + 1 + BOARD_START_RELATIVE_X,
    startY: top + 9,
    squareWidth: SQUARE_WIDTH,
    squareHeight: SQUARE_HEIGHT,
    orientation: flipBoard ? "black" : "white"
  };
}

export function mouseToSquare(x: number, y: number, layout: BoardLayout): Square | null {
  const fileIndex = Math.floor((x - layout.startX) / layout.squareWidth);
  const rankIndex = Math.floor((y - layout.startY) / layout.squareHeight);

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
      ...ranks.map((rank) => this.renderRankLine(chess, state, options, rank, files)),
      this.renderFileLabels(files),
      { raw: "", visibleWidth: 0 }
    ];

    return {
      lines,
      layout
    };
  }

  private renderFileLabels(files: readonly string[]): { raw: string; visibleWidth: number } {
    const raw = `${" ".repeat(BOARD_START_RELATIVE_X)}${files.map((file) => ` ${file}  `).join("")}`;
    return {
      raw,
      visibleWidth: BOARD_START_RELATIVE_X + files.length * SQUARE_WIDTH
    };
  }

  private renderRankLine(
    chess: ChessService,
    state: UiState,
    options: CliOptions,
    rank: number,
    files: readonly string[]
  ): { raw: string; visibleWidth: number } {
    const cells = files.map((file) => {
      const square = `${file}${rank}` as Square;
      return this.renderSquare(chess, state, options, square);
    });
    const leftPadding = " ".repeat(BOARD_START_RELATIVE_X - 3);
    const raw = `${leftPadding}${rank}  ${cells.join("")} ${rank}`;

    return {
      raw,
      visibleWidth: BOARD_START_RELATIVE_X - 3 + 1 + 2 + cells.length * SQUARE_WIDTH + 2
    };
  }

  private renderSquare(chess: ChessService, state: UiState, options: CliOptions, square: Square): string {
    const piece = chess.getPiece(square);
    const legalMove = state.legalMoves.find((move) => move.to === square);
    const isSelected = state.selectedSquare === square;
    const isLastMove = this.isLastMoveSquare(state.lastMove, square);
    const isCheckedKing = chess.getCheckedKingSquare() === square;
    const isCapture = Boolean(legalMove?.captured);
    const glyph = piece ? pieceGlyph(piece, options.ascii) : emptySquareGlyph(options.ascii);

    let cell = ` ${glyph}  `;

    if (legalMove && !piece) {
      cell = ` ${legalMoveGlyph(options.ascii)}  `;
    }

    if (isLastMove && !piece && !legalMove) {
      cell = " +  ";
    }

    if (isCapture && piece) {
      cell = `x${glyph}x `;
    }

    if (isSelected && piece) {
      cell = `[${glyph}] `;
    }

    if (isCheckedKing && piece) {
      cell = `!${glyph}! `;
    }

    return applyStyle(cell, this.getSquareStyle({ isCheckedKing, isSelected, isCapture, legalMove, isLastMove }), options.color);
  }

  private getSquareStyle({
    isCheckedKing,
    isSelected,
    isCapture,
    legalMove,
    isLastMove
  }: {
    isCheckedKing: boolean;
    isSelected: boolean;
    isCapture: boolean;
    legalMove: Move | undefined;
    isLastMove: boolean;
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

    if (isLastMove) {
      return [ansi.bgBlue, ansi.fgWhite];
    }

    return [];
  }

  private getDisplayFiles(flipBoard: boolean): readonly string[] {
    return flipBoard ? [...FILES].reverse() : FILES;
  }

  private getDisplayRanks(flipBoard: boolean): number[] {
    return flipBoard ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  }

  private isLastMoveSquare(lastMove: Move | null, square: Square): boolean {
    return Boolean(lastMove && (lastMove.from === square || lastMove.to === square));
  }
}
