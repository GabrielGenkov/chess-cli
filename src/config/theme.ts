import type { BoardPiece } from "../chess/ChessService.js";

export type ThemeName = "walnut" | "slate" | "emerald" | "midnight";

export type Theme = {
  name: ThemeName;
  label: string;
  // Board squares (the checkerboard is drawn as solid background fills).
  lightSquare: string;
  darkSquare: string;
  // Piece foregrounds. The same solid glyph is used for both sides; color is
  // the only thing that distinguishes White from Black. Optional per-tile
  // overrides keep contrast healthy on the weaker square.
  whitePiece: string;
  whitePieceOnDark?: string;
  blackPiece: string;
  blackPieceOnLight?: string;
  // App chrome.
  outerBg: string;
  panelBg: string;
  frame: string;
  frameShadow: string;
  shadow: string;
  coordLabel: string;
  title: string;
  text: string;
  textDim: string;
  // Interaction highlights.
  selectedBg: string;
  selectedFg: string;
  legalMove: string;
  capture: string;
  lastMoveLight: string;
  lastMoveDark: string;
  checkBg: string;
  checkFg: string;
};

export const THEMES: Record<ThemeName, Theme> = {
  walnut: {
    name: "walnut",
    label: "Walnut",
    lightSquare: "#E8C99B",
    darkSquare: "#7B4A2B",
    whitePiece: "#FBF3E2",
    whitePieceOnDark: "#FCF5E6",
    blackPiece: "#241409",
    outerBg: "#1A120B",
    panelBg: "#211710",
    frame: "#6B4A2E",
    frameShadow: "#3A2415",
    shadow: "#0D0805",
    coordLabel: "#C9A96A",
    title: "#E8C99B",
    text: "#E4D3B4",
    textDim: "#9A7C53",
    selectedBg: "#C8922E",
    selectedFg: "#241409",
    legalMove: "#3E8E4F",
    capture: "#D9533B",
    lastMoveLight: "#D9B86E",
    lastMoveDark: "#6E5320",
    checkBg: "#B23A22",
    checkFg: "#FFE9DF"
  },
  slate: {
    name: "slate",
    label: "Slate",
    lightSquare: "#DCE1E8",
    darkSquare: "#90A0B0",
    whitePiece: "#FFFFFF",
    blackPiece: "#161B22",
    outerBg: "#161A20",
    panelBg: "#1B2028",
    frame: "#3A424E",
    frameShadow: "#23282F",
    shadow: "#0C0F13",
    coordLabel: "#7C8896",
    title: "#E7EAEE",
    text: "#C7CDD6",
    textDim: "#6C7884",
    selectedBg: "#2FA6A0",
    selectedFg: "#06201F",
    legalMove: "#2FA6A0",
    capture: "#E06C66",
    lastMoveLight: "#BFE0DD",
    lastMoveDark: "#6E9C99",
    checkBg: "#C2554D",
    checkFg: "#FFF1EF"
  },
  emerald: {
    name: "emerald",
    label: "Emerald",
    lightSquare: "#F3E4C3",
    darkSquare: "#1F5C45",
    whitePiece: "#FBF6EA",
    blackPiece: "#10120F",
    outerBg: "#0C1A14",
    panelBg: "#10241B",
    frame: "#D4AF37",
    frameShadow: "#7A6520",
    shadow: "#04100A",
    coordLabel: "#C8A24B",
    title: "#EBD9A6",
    text: "#E7D9B4",
    textDim: "#8A7A3F",
    selectedBg: "#C9A227",
    selectedFg: "#10120F",
    legalMove: "#E7C45A",
    capture: "#E6B422",
    lastMoveLight: "#E7CFA0",
    lastMoveDark: "#2C7A5B",
    checkBg: "#9E2B25",
    checkFg: "#FBEDE3"
  },
  midnight: {
    name: "midnight",
    label: "Midnight",
    lightSquare: "#1B2A4A",
    darkSquare: "#0E1830",
    whitePiece: "#7DF9FF",
    blackPiece: "#FF6FE0",
    outerBg: "#070B16",
    panelBg: "#0C1426",
    frame: "#34E1FF",
    frameShadow: "#0E3A52",
    shadow: "#02040A",
    coordLabel: "#5C7CC4",
    title: "#8BE6FF",
    text: "#AFC4E8",
    textDim: "#4A638F",
    selectedBg: "#243D6E",
    selectedFg: "#DCEBFF",
    legalMove: "#5BFF3A",
    capture: "#FF4F7B",
    lastMoveLight: "#2A3F66",
    lastMoveDark: "#1A2747",
    checkBg: "#5A0E2D",
    checkFg: "#FFD9E6"
  }
};

export const DEFAULT_THEME: ThemeName = "walnut";

export function isThemeName(value: string): value is ThemeName {
  return value === "walnut" || value === "slate" || value === "emerald" || value === "midnight";
}

export function resolveTheme(name: ThemeName): Theme {
  return THEMES[name];
}

// Solid filled glyphs (U+265A..U+265F) for BOTH colors — the hollow "white"
// glyphs (♔..♙) render as thin outlines that vanish on light squares, so we use
// the filled set for everyone and let foreground color carry the side.
const solidPieces = {
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟"
} as const;

export const asciiPieces = {
  w: { k: "K", q: "Q", r: "R", b: "B", n: "N", p: "P" },
  b: { k: "k", q: "q", r: "r", b: "b", n: "n", p: "p" }
} as const;

export function pieceGlyph(piece: BoardPiece, ascii: boolean): string {
  if (ascii) {
    return asciiPieces[piece.color][piece.type];
  }

  return solidPieces[piece.type];
}

export function legalMoveGlyph(ascii: boolean): string {
  return ascii ? "*" : "●";
}

export function captureGlyph(ascii: boolean): string {
  return ascii ? "x" : "✕";
}

// Texture used to imply the checkerboard when no background color is available
// (monochrome / NO_COLOR) — dark squares get a faint fill, light squares stay
// blank, so the grid reads without any color at all.
export function darkSquareTexture(ascii: boolean): string {
  return ascii ? ":" : "░";
}
