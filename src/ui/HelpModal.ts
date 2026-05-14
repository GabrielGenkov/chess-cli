export class HelpModal {
  render(): Array<{ raw: string; visibleWidth: number }> {
    const lines = [
      "Help",
      "",
      "Mouse: click an own piece, then a highlighted destination.",
      "Moves: type UCI input like e2e4, g1f3, or a7a8q.",
      "Promotion: choose q, r, b, or n when prompted.",
      "",
      "q quit        r restart       u undo",
      "Esc clear     ? help          h + Enter help",
      "",
      "Markers: [] selected, ● legal move, x capture, ! check.",
      "Board stays fixed from White perspective unless --flip-board.",
      ""
    ];

    return lines.map((line) => ({
      raw: `  ${line}`,
      visibleWidth: line.length + 2
    }));
  }
}
