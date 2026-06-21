# CLAUDE.md

Project guidance for Claude Code lives in [AGENTS.md](AGENTS.md) — single source
of truth for both. Read it first.

@AGENTS.md

## Claude-specific notes

- Run `npm run dev` to play/test from source; `npm run ci` before committing.
- For rendering changes, verify visually with the harness in `.tools/preview/`
  (render real output → `ansi2html.mjs` → screenshot). It can simulate the
  Windows console / Git Bash wide-glyph drawing (`wide` / `overdraw` modes).
- Do not publish to npm unless explicitly asked; publishing goes through the
  GitHub Action on `main` after a `version` bump (see AGENTS.md → Publishing).
