export const ansi = {
  clear: "\x1b[2J\x1b[H",
  reset: "\x1b[0m",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
  enterAltScreen: "\x1b[?1049h",
  exitAltScreen: "\x1b[?1049l",
  enableMouse: "\x1b[?1000h\x1b[?1002h\x1b[?1006h",
  disableMouse: "\x1b[?1000l\x1b[?1002l\x1b[?1006l",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  fgBlack: "\x1b[30m",
  fgRed: "\x1b[31m",
  fgGreen: "\x1b[32m",
  fgYellow: "\x1b[33m",
  fgBlue: "\x1b[34m",
  fgCyan: "\x1b[36m",
  fgWhite: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m"
} as const;

export function applyStyle(text: string, codes: string[], enabled: boolean): string {
  if (!enabled || codes.length === 0) {
    return text;
  }

  return `${codes.join("")}${text}${ansi.reset}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  if (maxLength <= 1) {
    return text.slice(0, maxLength);
  }

  return `${text.slice(0, maxLength - 1)}…`;
}
