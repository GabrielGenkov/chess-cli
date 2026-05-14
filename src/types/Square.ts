import type { Square as ChessSquare } from "chess.js";

export type Square = ChessSquare;

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export function makeSquare(fileIndex: number, rank: number): Square {
  return `${FILES[fileIndex]}${rank}` as Square;
}
