import { ansi } from "./ansi.js";
import { sgr, type ColorDepth, type StyleSpec } from "./color.js";

// A single rendered terminal line: the raw string (which may contain ANSI escape
// sequences) plus how many visible columns it actually occupies.
export type RenderedLine = {
  raw: string;
  visibleWidth: number;
};

// Style a run of text, keeping it a no-op when no styling is produced.
export function styled(text: string, spec: StyleSpec, depth: ColorDepth): string {
  const prefix = sgr(spec, depth);
  return prefix ? `${prefix}${text}${ansi.reset}` : text;
}

// A solid run of background color (used for padding and screen fills).
export function fillRun(width: number, bg: string, depth: ColorDepth): string {
  if (width <= 0) {
    return "";
  }

  return styled(" ".repeat(width), { bg }, depth);
}

export function blankLine(width: number, bg: string, depth: ColorDepth): RenderedLine {
  return { raw: fillRun(width, bg, depth), visibleWidth: width };
}

// Right-pad a line to a target visible width with a background fill.
export function padRight(line: RenderedLine, target: number, bg: string, depth: ColorDepth): RenderedLine {
  const missing = target - line.visibleWidth;

  if (missing <= 0) {
    return line;
  }

  return { raw: `${line.raw}${fillRun(missing, bg, depth)}`, visibleWidth: target };
}

// Join two lines side by side with a background gap between them.
export function joinHorizontal(
  left: RenderedLine,
  right: RenderedLine,
  gap: number,
  bg: string,
  depth: ColorDepth
): RenderedLine {
  return {
    raw: `${left.raw}${fillRun(gap, bg, depth)}${right.raw}`,
    visibleWidth: left.visibleWidth + gap + right.visibleWidth
  };
}
