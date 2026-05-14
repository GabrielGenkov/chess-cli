import type { Move } from "chess.js";
import type { Square } from "../types/Square.js";

export type PromotionPiece = "q" | "r" | "b" | "n";

export type ParsedMove = {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
};

const UCI_MOVE_PATTERN = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/;

export function parseUciMove(input: string): ParsedMove | null {
  const normalized = input.trim().toLowerCase();
  const match = UCI_MOVE_PATTERN.exec(normalized);

  if (!match) {
    return null;
  }

  return {
    from: match[1] as Square,
    to: match[2] as Square,
    promotion: match[3] as PromotionPiece | undefined
  };
}

export function isUciPrefix(input: string): boolean {
  const normalized = input.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  if (normalized.length > 5) {
    return false;
  }

  const patterns = [
    /^[a-h]$/,
    /^[a-h][1-8]$/,
    /^[a-h][1-8][a-h]$/,
    /^[a-h][1-8][a-h][1-8]$/,
    /^[a-h][1-8][a-h][1-8][qrbn]$/
  ];

  return patterns[normalized.length - 1].test(normalized);
}

export function isLegalDestination(legalMoves: Move[], to: Square): boolean {
  return legalMoves.some((move) => move.to === to);
}

export function formatMove(move: Move | null): string {
  if (!move) {
    return "-";
  }

  const promotion = move.promotion ? move.promotion : "";
  return `${move.from}${move.to}${promotion} (${move.san})`;
}
