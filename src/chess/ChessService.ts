import { Chess, type Color, type Move } from "chess.js";
import type { PromotionPiece } from "./MoveService.js";
import { FILES, type Square } from "../types/Square.js";

export type BoardPiece = NonNullable<ReturnType<Chess["get"]>>;

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
