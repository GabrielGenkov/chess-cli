import { ChessService } from "../chess/ChessService.js";
import { formatMove } from "../chess/MoveService.js";
import type { UiState } from "../types/UiState.js";

export class StatusRenderer {
  renderTurn(chess: ChessService): string {
    return `Turn: ${chess.getTurnLabel()}`;
  }

  renderStatus(chess: ChessService): string {
    return `Status: ${chess.getStatusLabel()}`;
  }

  renderMessage(state: UiState): string {
    if (state.pendingPromotion) {
      return "Promote to: [q] Queen, [r] Rook, [b] Bishop, [n] Knight";
    }

    return `Message: ${state.message ?? "Ready"}`;
  }

  renderLastMove(state: UiState): string {
    return `Last move: ${formatMove(state.lastMove)}`;
  }

  renderInput(state: UiState): string {
    const value = state.inputBuffer ? state.inputBuffer : "-";
    return `Input: ${value}`;
  }
}
