import type { Theme } from "../config/theme.js";
import type { ColorDepth } from "./color.js";
import { padRight, styled, type RenderedLine } from "./lines.js";

export class HelpModal {
  render(theme: Theme, depth: ColorDepth, width: number): RenderedLine[] {
    const entries: Array<{ text: string; kind: "title" | "head" | "body" | "blank" }> = [
      { text: "How to play", kind: "title" },
      { text: "", kind: "blank" },
      { text: "Mouse", kind: "head" },
      { text: "Click one of your pieces, then a highlighted square.", kind: "body" },
      { text: "", kind: "blank" },
      { text: "Keyboard", kind: "head" },
      { text: "Type UCI moves: e2e4, g1f3, a7a8q.", kind: "body" },
      { text: "Promotion: press q, r, b, or n when asked.", kind: "body" },
      { text: "", kind: "blank" },
      { text: "Board markers", kind: "head" },
      { text: "● legal move    ✕ capture", kind: "body" },
      { text: "gold square selected    red square check", kind: "body" },
      { text: "tinted squares show the last move", kind: "body" },
      { text: "", kind: "blank" },
      { text: "Commands", kind: "head" },
      { text: "q quit   r restart   u undo   ? help   Esc clear", kind: "body" }
    ];

    return entries.map((entry) => {
      const spec =
        entry.kind === "title"
          ? { bg: theme.panelBg, fg: theme.title, bold: true }
          : entry.kind === "head"
            ? { bg: theme.panelBg, fg: theme.coordLabel, bold: true }
            : { bg: theme.panelBg, fg: theme.text };
      const text = entry.text ? `  ${entry.text}` : "";
      const line: RenderedLine = { raw: styled(text, spec, depth), visibleWidth: text.length };
      return padRight(line, width, theme.panelBg, depth);
    });
  }
}
