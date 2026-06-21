import { Chess, type Color, type Move } from "chess.js";
import type { PromotionPiece } from "./MoveService.js";
import { FILES, type Square } from "../types/Square.js";

export type BoardPiece = NonNullable<ReturnType<Chess["get"]>>;

export type PieceType = BoardPiece["type"];

export type CapturedPieces = {
  // Pieces each side has captured, ordered by value (queen first).
  white: PieceType[];
  black: PieceType[];
};

const STARTING_COUNT: Record<PieceType, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
const PIECE_VALUE: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const CAPTURE_ORDER: PieceType[] = ["q", "r", "b", "n", "p"];

export class ChessService {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = fen ? new Chess(fen) : new Chess();
  }

  reset(): void {
    this.chess.reset();
  }

  loadFen(fen: string): void {
    this.chess.load(fen);
  }

  getFen(): string {
    return this.chess.fen();
  }

  getPgn(): string {
    return this.chess.pgn();
  }

  getBoard(): ReturnType<Chess["board"]> {
    return this.chess.board();
  }

  getPiece(square: Square): BoardPiece | null {
    return this.chess.get(square) ?? null;
  }

  getTurnColor(): Color {
    return this.chess.turn();
  }

  getTurnLabel(): "White" | "Black" {
    return this.chess.turn() === "w" ? "White" : "Black";
  }

  getLegalMoves(square?: Square): Move[] {
    if (square) {
      return this.chess.moves({ square, verbose: true }) as Move[];
    }

    return this.chess.moves({ verbose: true }) as Move[];
  }

  isOwnPiece(square: Square): boolean {
    const piece = this.getPiece(square);
    return Boolean(piece && piece.color === this.getTurnColor());
  }

  isPromotionMove(from: Square, to: Square): boolean {
    const piece = this.getPiece(from);

    if (!piece || piece.type !== "p") {
      return false;
    }

    return this.getLegalMoves(from).some((move) => move.to === to && Boolean(move.promotion));
  }

  makeMove(from: Square, to: Square, promotion?: PromotionPiece): Move | null {
    try {
      const move = this.chess.move({
        from,
        to,
        ...(promotion ? { promotion } : {})
      });

      return move ?? null;
    } catch {
      return null;
    }
  }

  undo(): Move | null {
    return this.chess.undo() as Move | null;
  }

  getHistory(): Move[] {
    return this.chess.history({ verbose: true }) as Move[];
  }

  getLastMove(): Move | null {
    return this.getHistory().at(-1) ?? null;
  }

  isCheck(): boolean {
    return this.chess.isCheck();
  }

  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  isDraw(): boolean {
    return this.chess.isDraw();
  }

  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  // Pieces removed from the board, attributed to the side that captured them.
  getCapturedPieces(): CapturedPieces {
    const remaining: Record<Color, Record<PieceType, number>> = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
    };

    for (const row of this.getBoard()) {
      for (const piece of row) {
        if (piece) {
          remaining[piece.color][piece.type] += 1;
        }
      }
    }

    const missing = (color: Color): PieceType[] => {
      const result: PieceType[] = [];

      for (const type of CAPTURE_ORDER) {
        const lost = STARTING_COUNT[type] - remaining[color][type];

        for (let index = 0; index < lost; index += 1) {
          result.push(type);
        }
      }

      return result;
    };

    // White's tray shows the black pieces it removed, and vice versa.
    return { white: missing("b"), black: missing("w") };
  }

  // Positive favours White, negative favours Black.
  getMaterialBalance(): number {
    let balance = 0;

    for (const row of this.getBoard()) {
      for (const piece of row) {
        if (piece) {
          balance += piece.color === "w" ? PIECE_VALUE[piece.type] : -PIECE_VALUE[piece.type];
        }
      }
    }

    return balance;
  }

  getCheckedKingSquare(): Square | null {
    if (!this.isCheck()) {
      return null;
    }

    return this.getKingSquare(this.getTurnColor());
  }

  getStatusLabel(): string {
    if (this.chess.isCheckmate()) {
      const winner = this.getTurnColor() === "w" ? "Black" : "White";
      return `Checkmate — ${winner} wins`;
    }

    if (this.chess.isStalemate()) {
      return "Stalemate";
    }

    if (this.chess.isInsufficientMaterial()) {
      return "Draw — insufficient material";
    }

    if (this.chess.isThreefoldRepetition()) {
      return "Draw — threefold repetition";
    }

    if (this.chess.isDraw()) {
      return "Draw";
    }

    if (this.chess.isCheck()) {
      return `${this.getTurnLabel()} is in check`;
    }

    return "Normal";
  }

  private getKingSquare(color: Color): Square | null {
    const board = this.getBoard();

    for (let row = 0; row < board.length; row += 1) {
      for (let fileIndex = 0; fileIndex < FILES.length; fileIndex += 1) {
        const piece = board[row][fileIndex];

        if (piece?.type === "k" && piece.color === color) {
          return `${FILES[fileIndex]}${8 - row}` as Square;
        }
      }
    }

    return null;
  }
}
