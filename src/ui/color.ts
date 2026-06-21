// Color engine: turns hex theme colors into ANSI escape sequences, degrading
// across four tiers — 24-bit truecolor, xterm-256, the 16 base colors, and
// monochrome (no color). This is what lets one theme look great in Windows
// Terminal / iTerm2 / modern emulators and still stay legible everywhere else.

export type ColorDepth = "truecolor" | "ansi256" | "ansi16" | "none";

export type Rgb = { r: number; g: number; b: number };

const RESET = "\x1b[0m";

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

// Standard xterm base-16 palette, used only to find the nearest match when we
// have to degrade a rich hex color down to the 16-color tier.
const BASE16: Array<Rgb & { index: number }> = [
  { index: 0, r: 0x00, g: 0x00, b: 0x00 },
  { index: 1, r: 0x80, g: 0x00, b: 0x00 },
  { index: 2, r: 0x00, g: 0x80, b: 0x00 },
  { index: 3, r: 0x80, g: 0x80, b: 0x00 },
  { index: 4, r: 0x00, g: 0x00, b: 0x80 },
  { index: 5, r: 0x80, g: 0x00, b: 0x80 },
  { index: 6, r: 0x00, g: 0x80, b: 0x80 },
  { index: 7, r: 0xc0, g: 0xc0, b: 0xc0 },
  { index: 8, r: 0x80, g: 0x80, b: 0x80 },
  { index: 9, r: 0xff, g: 0x00, b: 0x00 },
  { index: 10, r: 0x00, g: 0xff, b: 0x00 },
  { index: 11, r: 0xff, g: 0xff, b: 0x00 },
  { index: 12, r: 0x00, g: 0x00, b: 0xff },
  { index: 13, r: 0xff, g: 0x00, b: 0xff },
  { index: 14, r: 0x00, g: 0xff, b: 0xff },
  { index: 15, r: 0xff, g: 0xff, b: 0xff }
];

function distance(a: Rgb, b: Rgb): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

// The actual RGB of every xterm-256 color from index 16 up (the 6x6x6 color
// cube followed by the 24-step grayscale ramp). We deliberately skip indices
// 0-15 because terminals re-theme those, so matching against them is unstable.
const CUBE_LEVELS = [0, 95, 135, 175, 215, 255];

const ANSI256_TABLE: Array<{ index: number; rgb: Rgb }> = (() => {
  const table: Array<{ index: number; rgb: Rgb }> = [];

  for (let r = 0; r < 6; r += 1) {
    for (let g = 0; g < 6; g += 1) {
      for (let b = 0; b < 6; b += 1) {
        table.push({
          index: 16 + 36 * r + 6 * g + b,
          rgb: { r: CUBE_LEVELS[r], g: CUBE_LEVELS[g], b: CUBE_LEVELS[b] }
        });
      }
    }
  }

  for (let step = 0; step < 24; step += 1) {
    const value = 8 + step * 10;
    table.push({ index: 232 + step, rgb: { r: value, g: value, b: value } });
  }

  return table;
})();

// Nearest xterm-256 color by Euclidean distance. The naive "round each channel
// into the cube" shortcut maps dark, low-saturation colors (browns, navies) to
// jarring primaries, so we match against the real palette instead.
export function rgbToAnsi256(rgb: Rgb): number {
  let best = ANSI256_TABLE[0];
  let bestDistance = Infinity;

  for (const candidate of ANSI256_TABLE) {
    const current = distance(rgb, candidate.rgb);

    if (current < bestDistance) {
      bestDistance = current;
      best = candidate;
    }
  }

  return best.index;
}

export function rgbToAnsi16Index(rgb: Rgb): number {
  let best = BASE16[0];
  let bestDistance = Infinity;

  for (const candidate of BASE16) {
    const current = distance(rgb, candidate);

    if (current < bestDistance) {
      bestDistance = current;
      best = candidate;
    }
  }

  return best.index;
}

function fgCodeForDepth(rgb: Rgb, depth: ColorDepth): string {
  if (depth === "truecolor") {
    return `38;2;${rgb.r};${rgb.g};${rgb.b}`;
  }

  if (depth === "ansi256") {
    return `38;5;${rgbToAnsi256(rgb)}`;
  }

  const index = rgbToAnsi16Index(rgb);
  return String(index < 8 ? 30 + index : 90 + (index - 8));
}

function bgCodeForDepth(rgb: Rgb, depth: ColorDepth): string {
  if (depth === "truecolor") {
    return `48;2;${rgb.r};${rgb.g};${rgb.b}`;
  }

  if (depth === "ansi256") {
    return `48;5;${rgbToAnsi256(rgb)}`;
  }

  const index = rgbToAnsi16Index(rgb);
  return String(index < 8 ? 40 + index : 100 + (index - 8));
}

export type StyleSpec = {
  fg?: string;
  bg?: string;
  bold?: boolean;
  dim?: boolean;
};

// Build a single SGR prefix from a style spec at the given color depth.
export function sgr(spec: StyleSpec, depth: ColorDepth): string {
  const codes: string[] = [];

  if (spec.bold) {
    codes.push("1");
  }

  if (spec.dim) {
    codes.push("2");
  }

  if (depth !== "none") {
    if (spec.fg) {
      codes.push(fgCodeForDepth(hexToRgb(spec.fg), depth));
    }

    if (spec.bg) {
      codes.push(bgCodeForDepth(hexToRgb(spec.bg), depth));
    }
  }

  if (codes.length === 0) {
    return "";
  }

  return `\x1b[${codes.join(";")}m`;
}

// Wrap text in a style, resetting afterwards. No-ops to plain text when the
// style produces no codes (monochrome with no bold/dim).
export function paint(text: string, spec: StyleSpec, depth: ColorDepth): string {
  const prefix = sgr(spec, depth);
  return prefix ? `${prefix}${text}${RESET}` : text;
}

type ColorCapableStream = NodeJS.WriteStream & {
  hasColors?: (count?: number) => boolean;
};

// Detect the richest color tier the terminal supports, honoring NO_COLOR and an
// explicit opt-out. Prefers Node's stdout.hasColors(), with env-var heuristics
// as a fallback for terminals that under-report (e.g. Windows Terminal).
export function detectColorDepth(forceColor: boolean): ColorDepth {
  if (!forceColor || process.env.NO_COLOR) {
    return "none";
  }

  const env = process.env;

  if (env.COLORTERM === "truecolor" || env.COLORTERM === "24bit") {
    return "truecolor";
  }

  const stdout = process.stdout as ColorCapableStream;

  if (typeof stdout.hasColors === "function") {
    if (stdout.hasColors(2 ** 24)) {
      return "truecolor";
    }

    if (env.WT_SESSION || env.WT_PROFILE_ID) {
      return "truecolor";
    }

    if (stdout.hasColors(256)) {
      return "ansi256";
    }

    if (stdout.hasColors()) {
      return "ansi16";
    }

    // hasColors() under-reports on some terminals (Git Bash/mintty); if it's an
    // interactive TTY, assume 256-color rather than dropping to grey pieces.
    return stdout.isTTY ? "ansi256" : "none";
  }

  if (env.WT_SESSION || env.WT_PROFILE_ID) {
    return "truecolor";
  }

  const term = env.TERM ?? "";

  if (/(^|-)(direct|truecolor|24bit)/.test(term)) {
    return "truecolor";
  }

  if (/256color/.test(term)) {
    return "ansi256";
  }

  // Any interactive terminal gets color; only truly non-TTY output stays plain.
  return stdout.isTTY ? "ansi256" : "none";
}
