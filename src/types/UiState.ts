import type { Move } from "chess.js";
import type { PromotionPiece } from "../chess/MoveService.js";
import type { Square } from "./Square.js";

export type PendingPromotion = {
  from: Square;
  to: Square;
};

export type UiState = {
  selectedSquare: Square | null;
  legalMoves: Move[];
  lastMove: Move | null;
  message: string | null;
  showHelp: boolean;
  pendingPromotion: PendingPromotion | null;
  inputBuffer: string;
};

export function createInitialUiState(message: string | null = "Ready"): UiState {
  return {
    selectedSquare: null,
    legalMoves: [],
    lastMove: null,
    message,
    showHelp: false,
    pendingPromotion: null,
    inputBuffer: ""
  };
}

export function isPromotionPiece(value: string): value is PromotionPiece {
  return value === "q" || value === "r" || value === "b" || value === "n";
}
