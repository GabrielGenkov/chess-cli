import { ansi } from "../ui/ansi.js";
import type { KeyName } from "./GameController.js";

export type InputControllerCallbacks = {
  onMouse: (x: number, y: number) => void;
  onChar: (char: string) => void;
  onKey: (key: KeyName) => void;
  onResize: () => void;
};

export class InputController {
  private readonly stdin = process.stdin;
  private readonly stdout = process.stdout;
  private started = false;

  constructor(
    private readonly callbacks: InputControllerCallbacks,
    private readonly mouseEnabled: boolean
  ) {}

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;

    if (this.stdin.isTTY) {
      this.stdin.setRawMode(true);
    }

    this.stdin.resume();
    this.stdin.on("data", this.handleData);
    this.stdout.on("resize", this.callbacks.onResize);

    if (this.mouseEnabled) {
      this.stdout.write(ansi.enableMouse);
    }
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.stdin.off("data", this.handleData);
    this.stdout.off("resize", this.callbacks.onResize);

    if (this.mouseEnabled) {
      this.stdout.write(ansi.disableMouse);
    }

    if (this.stdin.isTTY) {
      this.stdin.setRawMode(false);
    }

    this.stdin.pause();
  }

  private readonly handleData = (chunk: Buffer): void => {
    const input = chunk.toString("utf8");
    const mousePattern = /\x1b\[<(\d+);(\d+);(\d+)([mM])/g;
    const withoutMouse = input.replace(mousePattern, (_match, button, x, y, suffix) => {
      const buttonCode = Number(button);

      if (suffix === "M" && buttonCode < 64) {
        this.callbacks.onMouse(Number(x), Number(y));
      }

      return "";
    });

    for (let index = 0; index < withoutMouse.length; index += 1) {
      const char = withoutMouse[index];

      if (char === "\u0003") {
        this.callbacks.onKey("ctrl-c");
        continue;
      }

      if (char === "\r" || char === "\n") {
        this.callbacks.onKey("enter");
        continue;
      }

      if (char === "\u007f" || char === "\b") {
        this.callbacks.onKey("backspace");
        continue;
      }

      if (char === "\u001b") {
        const csi = /^\x1b\[[0-9;?]*[A-Za-z~]/.exec(withoutMouse.slice(index));

        if (csi) {
          index += csi[0].length - 1;
        }

        this.callbacks.onKey("escape");
        continue;
      }

      if (char >= " " && char !== "\u007f") {
        this.callbacks.onChar(char);
      }
    }
  };
}
