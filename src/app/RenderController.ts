import { ChessService } from "../chess/ChessService.js";
import type { CliOptions } from "../types/AppOptions.js";
import type { UiState } from "../types/UiState.js";
import type { BoardLayout } from "../ui/BoardRenderer.js";
import { LayoutRenderer } from "../ui/LayoutRenderer.js";

export class RenderController {
  private readonly layoutRenderer = new LayoutRenderer();
  private boardLayout: BoardLayout | null = null;

  constructor(
    private readonly chess: ChessService,
    private readonly getState: () => UiState,
    private readonly options: CliOptions
  ) {}

  render(): void {
    const result = this.layoutRenderer.render(this.chess, this.getState(), this.options);
    this.boardLayout = result.boardLayout;
    process.stdout.write(result.output);
  }

  getBoardLayout(): BoardLayout | null {
    return this.boardLayout;
  }
}
