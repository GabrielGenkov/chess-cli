import { ChessService } from "../chess/ChessService.js";
import type { CliOptions } from "../types/AppOptions.js";
import { ansi } from "../ui/ansi.js";
import { mouseToSquare } from "../ui/BoardRenderer.js";
import { measureGlyphWidth } from "../ui/glyphWidth.js";
import { GameController } from "./GameController.js";
import { InputController } from "./InputController.js";
import { RenderController } from "./RenderController.js";

export class ChessCliApp {
  private readonly chess = new ChessService();
  private readonly game: GameController;
  private readonly renderer: RenderController;
  private readonly input: InputController;
  private stopped = false;

  constructor(private readonly options: CliOptions) {
    this.game = new GameController(
      this.chess,
      () => this.renderer.render(),
      () => this.quit(0)
    );
    this.renderer = new RenderController(this.chess, () => this.game.getState(), options);
    this.input = new InputController(
      {
        onMouse: (x, y) => this.handleMouse(x, y),
        onChar: (char) => this.game.handleChar(char),
        onKey: (key) => this.game.handleKey(key),
        onResize: () => this.renderer.render()
      },
      options.mouse
    );
  }

  async start(): Promise<void> {
    this.installGuards();
    process.stdout.write(`${ansi.enterAltScreen}${ansi.hideCursor}`);

    if (this.options.detectPieceWidth && !this.stopped) {
      this.options.pieceWidth = await measureGlyphWidth();
    }

    if (this.stopped) {
      return;
    }

    this.input.start();
    this.renderer.render();
  }

  quit(code: number): void {
    this.stop();
    process.exit(code);
  }

  stop(): void {
    if (this.stopped) {
      return;
    }

    this.stopped = true;
    this.input.stop();
    process.stdout.write(`${ansi.reset}${ansi.showCursor}${ansi.exitAltScreen}`);
    this.removeGuards();
  }

  private handleMouse(x: number, y: number): void {
    const layout = this.renderer.getBoardLayout();

    if (!layout) {
      return;
    }

    this.game.handleSquareClick(mouseToSquare(x, y, layout));
  }

  private readonly handleExit = (): void => {
    this.stop();
  };

  private readonly handleSigint = (): void => {
    this.quit(0);
  };

  private readonly handleUncaughtException = (error: Error): void => {
    this.stop();
    console.error(error);
    process.exit(1);
  };

  private readonly handleUnhandledRejection = (reason: unknown): void => {
    this.stop();
    console.error(reason);
    process.exit(1);
  };

  private installGuards(): void {
    process.on("exit", this.handleExit);
    process.on("SIGINT", this.handleSigint);
    process.on("uncaughtException", this.handleUncaughtException);
    process.on("unhandledRejection", this.handleUnhandledRejection);
  }

  private removeGuards(): void {
    process.off("exit", this.handleExit);
    process.off("SIGINT", this.handleSigint);
    process.off("uncaughtException", this.handleUncaughtException);
    process.off("unhandledRejection", this.handleUnhandledRejection);
  }
}
