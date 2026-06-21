import type { ThemeName } from "../config/theme.js";
import type { ColorDepth } from "../ui/color.js";
import type { GlyphWidth } from "../ui/glyphWidth.js";

export type CliOptions = {
  ascii: boolean;
  colorDepth: ColorDepth;
  mouse: boolean;
  flipBoard: boolean;
  theme: ThemeName;
  // How many terminal columns a chess glyph occupies. Measured at startup unless
  // pinned with --piece-width; ASCII pieces are always 1.
  pieceWidth: GlyphWidth;
  detectPieceWidth: boolean;
  // Some terminals (Windows console / Git Bash mintty) draw the chess glyphs
  // wider than their cell; even-width tiles keep such glyphs centered.
  wideTiles: boolean;
};
