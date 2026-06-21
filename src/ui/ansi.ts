// Terminal control sequences. Per-color styling lives in color.ts; this file is
// just the screen/cursor/mouse plumbing plus the reset every styled run ends on.
export const ansi = {
  clear: "\x1b[2J\x1b[H",
  reset: "\x1b[0m",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
  enterAltScreen: "\x1b[?1049h",
  exitAltScreen: "\x1b[?1049l",
  enableMouse: "\x1b[?1000h\x1b[?1002h\x1b[?1006h",
  disableMouse: "\x1b[?1000l\x1b[?1002l\x1b[?1006l"
} as const;
