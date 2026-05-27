# Plan: Fix Overlay Right Border Alignment

## Context

The overlay box's right border (`│`) appears too close to the text content instead of maintaining consistent width. When there's no text, the right border collapses toward the left. When there is text, it hugs the text rather than staying at the full `innerWidth` position.

## Root Cause

In `WelcomeOverlay.ts`, the `buildOverlayLines()` method wraps each content line with borders:

```ts
`${dimColor}${b.v}${ansi.reset}${line}${dimColor}${b.v}${ansi.reset}`
```

There is **no padding** between the `line` content and the right border. The right border is placed immediately after whatever `line` contains. If `line` is shorter than `innerWidth` visible characters, the right border appears too far left.

### Specific unpadded lines in `buildSingleColumnContent()`:

1. **Empty spacer lines** — `lines.push("")` and `lines.push("")` around the separator — these are empty strings, so the right border appears right after the left border.

2. **Info panel content lines** — `this.buildInfoPanelContent(innerWidth)` returns lines that are NOT padded to `innerWidth`. They have short content like `" Model"`, `" gpt-4o"`, etc.

3. **Separator line** — `dimColor + "─".repeat(innerWidth) + ansi.reset` — this one IS correctly padded to `innerWidth`. ✅

4. **Padding lines** — `" ".repeat(innerWidth)` — these are correctly padded. ✅

5. **Banner/text lines** — these use `centerPadLine()` which pads to full width. ✅

### The two-column path (`buildTwoColumnContent`) is NOT affected because:
- `fitLine()` pads both left and right columns to their exact widths
- The separator `" │ "` fills the gap
- Total visible width = `innerWidth` ✅

## Approach

### Fix 1: Pad content lines to `innerWidth` before wrapping with borders

The cleanest fix is to ensure every content line passed into `buildOverlayLines()` has exactly `innerWidth` visible characters. This way the right border always appears at the correct position.

Two options:

**Option A (Recommended): Pad in `buildOverlayLines()` itself**
- After receiving content lines, pad each one to `innerWidth` using `fitLine()` or a simple visible-length pad
- This catches ALL lines regardless of which layout path produced them (single-column, two-column, future layouts)
- Single point of fix, can't be bypassed by future code paths

**Option B: Pad in each content builder individually**
- Fix `buildSingleColumnContent()` to pad info panel lines and empty lines
- More scattered, easier to miss a line

Going with **Option A**.

## Files to Modify

- `src/WelcomeOverlay.ts` — Add padding logic in `buildOverlayLines()` for content lines

## Reuse

- `fitLine()` from `src/renderer.ts` — already pads lines to a given visible width, preserving ANSI codes
- `visibleWidth()` from `src/renderer.ts` — calculates visible character count

## Steps

- [ ] In `buildOverlayLines()`, after `contentLines` is computed (from either single or two-column path), iterate over each line and pad it to `innerWidth` using `fitLine()` before wrapping with borders
- [ ] Ensure the padding handles ANSI-colored lines correctly (visible width vs byte length)
- [ ] Verify empty lines (`""`) are padded to `innerWidth` spaces so right border appears at correct position

## Verification

1. Run the overlay in a terminal — the right border should be a uniform vertical line regardless of content
2. Test with info panel visible (single-column, narrow terminal) — info text should have whitespace padding to the right border
3. Test with empty lines — right border should stay at full width
4. Test two-column layout — should remain unchanged (already correct)
5. Run existing tests if any
