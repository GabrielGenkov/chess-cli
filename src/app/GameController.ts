import { ChessService } from "../chess/ChessService.js";
import {
  isLegalDestination,
  isUciPrefix,
  parseUciMove,
  type PromotionPiece
} from "../chess/MoveService.js";
import type { Square } from "../types/Square.js";
import {
  createInitialUiState,
  isPromotionPiece,
  type UiState
} from "../types/UiState.js";

export type KeyName = "ctrl-c" | "escape" | "enter" | "backspace";

export class GameController {
  private state: UiState = createInitialUiState();

  constructor(
    private readonly chess: ChessService,
    private readonly onChange: () => void,
    private readonly onQuit: () => void
  ) {}

  getState(): UiState {
    return this.state;
  }

  handleSquareClick(square: Square | null): void {
    if (!square || this.state.showHelp || this.state.pendingPromotion) {
      return;
    }

    const piece = this.chess.getPiece(square);

    if (!this.state.selectedSquare) {
      if (piece && this.chess.isOwnPiece(square)) {
        this.selectSquare(square);
      }

      return;
    }

    if (isLegalDestination(this.state.legalMoves, square)) {
      this.tryMove(this.state.selectedSquare, square);
      return;
    }

    if (piece && this.chess.isOwnPiece(square)) {
      this.selectSquare(square);
      return;
    }

    this.clearInteraction("Selection cleared");
  }

  handleChar(input: string): void {
    const char = input.toLowerCase();

    if (this.state.pendingPromotion) {
      this.handlePromotionChar(char);
      return;
    }

    if (char === "?") {
      this.toggleHelp();
      return;
    }

    if (this.state.showHelp && char === "h") {
      this.toggleHelp();
      return;
    }

    if (this.state.inputBuffer.length === 0) {
      if (char === "q") {
        this.onQuit();
        return;
      }

      if (char === "r") {
        this.restart();
        return;
      }

      if (char === "u") {
        this.undo();
        return;
      }

      if (char === "h") {
        this.state.inputBuffer = "h";
        this.state.message = "Press Enter for help, or continue a h-file move";
        this.onChange();
        return;
      }
    }

    if (!/^[a-h1-8qrbn]$/.test(char)) {
      this.state.message = `Unknown command: ${input}`;
      this.onChange();
      return;
    }

    this.appendMoveInput(char);
  }

  handleKey(key: KeyName): void {
    if (key === "ctrl-c") {
      this.onQuit();
      return;
    }

    if (key === "escape") {
      this.state = {
        ...this.state,
        selectedSquare: null,
        legalMoves: [],
        pendingPromotion: null,
        inputBuffer: "",
        showHelp: false,
        message: "Selection cleared"
      };
      this.onChange();
      return;
    }

    if (key === "backspace") {
      this.state.inputBuffer = this.state.inputBuffer.slice(0, -1);
      this.onChange();
      return;
    }

    if (key === "enter") {
      if (this.state.pendingPromotion) {
        this.completePromotion("q");
        return;
      }

      if (this.state.inputBuffer === "h") {
        this.state.inputBuffer = "";
        this.toggleHelp();
        return;
      }

      if (this.state.inputBuffer) {
        this.submitMoveInput();
      }
    }
  }

  private selectSquare(square: Square): void {
    this.state = {
      ...this.state,
      selectedSquare: square,
      legalMoves: this.chess.getLegalMoves(square),
      message: `Selected ${square}`,
      inputBuffer: ""
    };
    this.onChange();
  }

  private tryMove(from: Square, to: Square, promotion?: PromotionPiece): boolean {
    if (!promotion && this.chess.isPromotionMove(from, to)) {
      this.state = {
        ...this.state,
        pendingPromotion: { from, to },
        message: "Choose promotion piece",
        inputBuffer: ""
      };
      this.onChange();
      return false;
    }

    const move = this.chess.makeMove(from, to, promotion);

    if (!move) {
      this.state = {
        ...this.state,
        message: "Illegal move",
        inputBuffer: ""
      };
      this.onChange();
      return false;
    }

    this.state = {
      ...this.state,
      selectedSquare: null,
      legalMoves: [],
      lastMove: move,
      pendingPromotion: null,
      inputBuffer: "",
      message: this.chess.isGameOver() ? this.chess.getStatusLabel() : `Moved ${move.san}`
    };
    this.onChange();
    return true;
  }

  private appendMoveInput(char: string): void {
    const nextInput = `${this.state.inputBuffer}${char}`.toLowerCase();

    if (!isUciPrefix(nextInput)) {
      this.state.inputBuffer = "";
      this.state.message = "Invalid move input";
      this.onChange();
      return;
    }

    this.state.inputBuffer = nextInput;
    this.state.message = `Input: ${nextInput}`;

    if (nextInput.length >= 4) {
      this.submitMoveInput();
      return;
    }

    this.onChange();
  }

  private submitMoveInput(): void {
    const parsed = parseUciMove(this.state.inputBuffer);

    if (!parsed) {
      this.state.inputBuffer = "";
      this.state.message = "Invalid move input";
      this.onChange();
      return;
    }

    this.tryMove(parsed.from, parsed.to, parsed.promotion);
  }

  private handlePromotionChar(char: string): void {
    if (!isPromotionPiece(char)) {
      this.state.message = "Promotion must be q, r, b, or n";
      this.onChange();
      return;
    }

    this.completePromotion(char);
  }

  private completePromotion(piece: PromotionPiece): void {
    const pendingPromotion = this.state.pendingPromotion;

    if (!pendingPromotion) {
      return;
    }

    this.tryMove(pendingPromotion.from, pendingPromotion.to, piece);
  }

  private restart(): void {
    this.chess.reset();
    this.state = createInitialUiState("New game started");
    this.onChange();
  }

  private undo(): void {
    const undone = this.chess.undo();

    if (!undone) {
      this.state.message = "No moves to undo";
      this.onChange();
      return;
    }

    this.state = {
      ...this.state,
      selectedSquare: null,
      legalMoves: [],
      pendingPromotion: null,
      inputBuffer: "",
      lastMove: this.chess.getLastMove(),
      message: `Undid ${undone.san}`
    };
    this.onChange();
  }

  private toggleHelp(): void {
    this.state = {
      ...this.state,
      showHelp: !this.state.showHelp,
      inputBuffer: "",
      message: this.state.showHelp ? "Help closed" : "Help opened"
    };
    this.onChange();
  }

  private clearInteraction(message: string): void {
    this.state = {
      ...this.state,
      selectedSquare: null,
      legalMoves: [],
      inputBuffer: "",
      message
    };
    this.onChange();
  }
}
