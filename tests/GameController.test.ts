import { describe, expect, it } from "vitest";
import { ChessService } from "../src/chess/ChessService.js";
import { GameController } from "../src/app/GameController.js";
import type { Square } from "../src/types/Square.js";

function setup(fen?: string): {
  chess: ChessService;
  controller: GameController;
  getRenderCount: () => number;
  didQuit: () => boolean;
} {
  const chess = new ChessService(fen);
  let renderCount = 0;
  let quit = false;
  const controller = new GameController(
    chess,
    () => {
      renderCount += 1;
    },
    () => {
      quit = true;
    }
  );

  return {
    chess,
    controller,
    getRenderCount: () => renderCount,
    didQuit: () => quit
  };
}

function playInput(controller: GameController, input: string): void {
  for (const char of input) {
    controller.handleChar(char);
  }
}

describe("GameController", () => {
  it("selects an own piece and highlights legal moves", () => {
    const { controller } = setup();

    controller.handleSquareClick("e2" as Square);

    expect(controller.getState().selectedSquare).toBe("e2");
    expect(controller.getState().legalMoves.map((move) => move.to)).toContain("e4");
  });

  it("moves selected pieces and switches turns", () => {
    const { chess, controller } = setup();

    controller.handleSquareClick("e2" as Square);
    controller.handleSquareClick("e4" as Square);

    expect(chess.getPiece("e4" as Square)?.type).toBe("p");
    expect(chess.getTurnLabel()).toBe("Black");
    expect(controller.getState().selectedSquare).toBeNull();
  });

  it("rejects illegal moves", () => {
    const { chess, controller } = setup();

    controller.handleSquareClick("e2" as Square);
    controller.handleSquareClick("e5" as Square);

    expect(chess.getPiece("e2" as Square)?.type).toBe("p");
    expect(chess.getTurnLabel()).toBe("White");
  });

  it("accepts keyboard UCI input", () => {
    const { chess, controller } = setup();

    playInput(controller, "e2e4");

    expect(chess.getPiece("e4" as Square)?.type).toBe("p");
    expect(chess.getTurnLabel()).toBe("Black");
  });

  it("supports h-file keyboard moves despite h help command", () => {
    const { chess, controller } = setup();

    playInput(controller, "h2h4");

    expect(chess.getPiece("h4" as Square)?.type).toBe("p");
    expect(chess.getTurnLabel()).toBe("Black");
  });

  it("promotes pawns through the promotion prompt", () => {
    const { chess, controller } = setup("7k/P7/8/8/8/8/8/7K w - - 0 1");

    playInput(controller, "a7a8");

    expect(controller.getState().pendingPromotion).toEqual({ from: "a7", to: "a8" });

    controller.handleChar("n");

    expect(chess.getPiece("a8" as Square)?.type).toBe("n");
    expect(chess.getTurnLabel()).toBe("Black");
  });

  it("undoes the last move", () => {
    const { chess, controller } = setup();

    playInput(controller, "e2e4");
    controller.handleChar("u");

    expect(chess.getPiece("e2" as Square)?.type).toBe("p");
    expect(chess.getPiece("e4" as Square)).toBeNull();
    expect(chess.getTurnLabel()).toBe("White");
  });

  it("detects checkmate status", () => {
    const { chess, controller } = setup();

    playInput(controller, "f2f3");
    playInput(controller, "e7e5");
    playInput(controller, "g2g4");
    playInput(controller, "d8h4");

    expect(chess.isCheckmate()).toBe(true);
    expect(chess.getStatusLabel()).toContain("Checkmate");
  });

  it("restarts games and quits", () => {
    const { chess, controller, didQuit, getRenderCount } = setup();

    playInput(controller, "e2e4");
    controller.handleChar("r");

    expect(chess.getPiece("e2" as Square)?.type).toBe("p");
    expect(chess.getTurnLabel()).toBe("White");

    controller.handleChar("q");

    expect(didQuit()).toBe(true);
    expect(getRenderCount()).toBeGreaterThan(0);
  });
});
