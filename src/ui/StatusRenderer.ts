import { ChessService } from "../chess/ChessService.js";
import { formatMove } from "../chess/MoveService.js";
import type { UiState } from "../types/UiState.js";

// Produces plain, semantic status strings. Theming/coloring is applied by the
// layout so these stay trivially testable.
export class StatusRenderer {
  turn(chess: ChessService): "White" | "Black" {
    return chess.getTurnLabel();
  }

  status(chess: ChessService): string {
    return chess.getStatusLabel();
  }

  lastMove(state: UiState): string {
    return formatMove(state.lastMove);
  }

  material(chess: ChessService): string | null {
    const balance = chess.getMaterialBalance();

    if (balance === 0) {
      return null;
    }

    return balance > 0 ? `White +${balance}` : `Black +${-balance}`;
  }

  message(state: UiState): string {
    if (state.pendingPromotion) {
      return "Promote: q r b n";
    }

    return state.message ?? "Ready";
  }
}
