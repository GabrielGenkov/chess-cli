// Some terminals (notably the classic Windows console / conhost with a font
// that substitutes the chess glyphs U+265A–F) render those glyphs as TWO cells
// wide instead of one. A fixed padding template then mis-centers the piece and
// makes columns drift. To stay correct everywhere we measure the real rendered
// width once at startup with a cursor-position report and pad accordingly.

export type GlyphWidth = 1 | 2;

// Cursor starts at column 1, we print one glyph, then ask where the cursor is.
// A 1-cell glyph lands the cursor at column 2, a 2-cell glyph at column 3.
export function widthFromCprColumn(column: number): GlyphWidth {
  return column >= 3 ? 2 : 1;
}

const SAMPLE_GLYPH = "♟"; // ♟ — representative solid chess glyph

export function measureGlyphWidth(timeoutMs = 1000): Promise<GlyphWidth> {
  const { stdin, stdout } = process;

  // We only need stdout to be a terminal to emit the query; the reply may still
  // arrive over a non-raw stdin (e.g. Git Bash / winpty), so don't require it.
  if (!stdout.isTTY) {
    return Promise.resolve(1);
  }

  return new Promise((resolve) => {
    let settled = false;
    let buffer = "";

    const finish = (width: GlyphWidth) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      stdin.removeListener("data", onData);
      resolve(width);
    };

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("latin1");
      const match = /\x1b\[\d+;(\d+)R/.exec(buffer);

      if (match) {
        finish(widthFromCprColumn(Number(match[1])));
      }
    };

    const timer = setTimeout(() => finish(1), timeoutMs);

    try {
      stdin.setRawMode(true);
    } catch {
      // Non-settable stdin; the CPR may still arrive, otherwise we time out to 1.
    }

    stdin.resume();
    stdin.on("data", onData);

    // Home cursor, print the sample glyph, request the cursor position. The
    // leftover glyph is wiped by the first full-screen clear on render.
    stdout.write(`\x1b[H${SAMPLE_GLYPH}\x1b[6n`);
  });
}
