import type { BoardPiece } from "../chess/ChessService.js";

export const unicodePieces = {
  w: {
    k: "♔",
    q: "♕",
    r: "♖",
    b: "♗",
    n: "♘",
    p: "♙"
  },
  b: {
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟"
  }
} as const;

export const asciiPieces = {
  w: {
    k: "K",
    q: "Q",
    r: "R",
    b: "B",
    n: "N",
    p: "P"
  },
  b: {
    k: "k",
    q: "q",
    r: "r",
    b: "b",
    n: "n",
    p: "p"
  }
} as const;

export function pieceGlyph(piece: BoardPiece, ascii: boolean): string {
  const pieces = ascii ? asciiPieces : unicodePieces;
  return pieces[piece.color][piece.type];
}

export function emptySquareGlyph(ascii: boolean): string {
  return ascii ? "." : "·";
}

export function legalMoveGlyph(ascii: boolean): string {
  return ascii ? "*" : "●";
}

export function detectColor(forceColor: boolean): boolean {
  if (!forceColor || process.env.NO_COLOR) {
    return false;
  }

  const stdout = process.stdout as NodeJS.WriteStream & {
    hasColors?: () => boolean;
  };

  return stdout.hasColors ? stdout.hasColors() : stdout.isTTY !== false;
}
