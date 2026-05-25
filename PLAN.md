# Plan — pi-welcome-screen

## v0.2.0 — Correct Extension Architecture

### Problems Fixed

The original code had several fundamental issues:

1. **Wrong extension pattern**: Exported a `WelcomeScreen` class, but Pi extensions must export a default **factory function** `(pi: ExtensionAPI) => void`
2. **Wrong integration method**: Tried to be a standalone Component, but should use `ctx.ui.setHeader()` API
3. **Unnecessary build step**: Pi loads TypeScript via jiti — no compilation needed
4. **Wrong package.json**: `pi.extensions` pointed to `./dist/index.js` instead of `./src/index.ts`
5. **Incorrect peer dependencies**: Listed `pi-ai`, `pi-tui`, `pi-coding-agent` as devDeps when only `pi-coding-agent` is needed as a peerDep

### Architecture

```
Pi starts
  → loads extensions (jiti loads src/index.ts)
  → calls default export function(pi)
  → extension subscribes to session_start
  → on session_start: ctx.ui.setHeader(factory)
  → Pi's TUI calls render(width) on every frame tick
  → Component returns ANSI-colored lines
```

### Current Status

- [x] Rewrite `src/index.ts` as proper extension factory
- [x] Move Component logic into `WelcomeHeader` class in index.ts
- [x] Update `package.json` with correct pi.extensions path
- [x] Remove build step (no dist/ needed)
- [x] Simplify dependencies
- [x] Update README.md with correct installation and usage
- [x] Update AGENTS.md with correct architecture docs
- [ ] Test with actual Pi instance
- [ ] Add tests

### Future Improvements

- [ ] Support custom ASCII art banners via config
- [ ] Add more animation styles
- [ ] Support custom color palettes beyond Catppuccin Mocha
- [ ] Add auto-dismiss after countdown (currently unused in header mode)
