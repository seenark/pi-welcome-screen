// WelcomeScreen — main Component class for pi-welcome-screen
// Implements the Component interface from @earendil-works/pi-tui

import type { Component } from "@earendil-works/pi-tui";
import { visibleWidth as tuiVisibleWidth } from "@earendil-works/pi-tui";
import { loadConfig, DEFAULT_CONFIG } from "./config.js";
import { BANNER_LINES, buildAnimationFrames, getFrameCount, colorMarker } from "./animations.js";
import {
  colorToAnsi,
  centerLine,
  fitLine,
  stripAnsi,
  resolveColorMarkers,
  buildAnimationColorMap,
  rainbowLine,
  ansi,
} from "./renderer.js";
import type { WelcomeConfig, AnimationStyle } from "./types.js";

// ─── Component Class ────────────────────────────────────────────────────────────

export class WelcomeScreen implements Component {
  private config: WelcomeConfig;
  private frameIndex: number = 0;
  private lastFrameTime: number = 0;
  private frames: string[][] = [];

  constructor(overrides: Partial<WelcomeConfig> = {}) {
    this.config = loadConfig(overrides);
    this.initFrames();
  }

  // ─── Component Interface ────────────────────────────────────────────────────

  invalidate(): void {
    // Called when data changes — reset animation
    this.frameIndex = 0;
    this.lastFrameTime = 0;
    this.initFrames();
  }

  render(termWidth: number): string[] {
    const now = Date.now();

    // Advance frame based on elapsed time
    if (now - this.lastFrameTime >= this.config.frameDelayMs) {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.lastFrameTime = now;
    }

    return this.buildLines(termWidth);
  }

  // ─── Frame Initialization ───────────────────────────────────────────────────

  private initFrames(): void {
    const totalFrames = getFrameCount(this.config.animationStyle);
    this.frames = buildAnimationFrames(
      this.config.animationStyle,
      BANNER_LINES,
      totalFrames,
    );
  }

  // ─── Line Building ──────────────────────────────────────────────────────────

  private buildLines(termWidth: number): string[] {
    const lines: string[] = [];
    const minWidth = 80;

    // Padding top
    for (let i = 0; i < this.config.paddingTop; i++) {
      lines.push("");
    }

    if (termWidth >= minWidth) {
      // ── Big banner mode ──
      const frame = this.frames[this.frameIndex];
      const colorMap = buildAnimationColorMap(this.config.animationColor);

      // Banner lines with animation color
      for (const rawLine of frame) {
        const resolved = resolveColorMarkers(rawLine, colorMap);
        const colorized = this.applyAnimationColor(resolved);
        lines.push(centerLine(colorized, termWidth));
      }

      // Main text
      lines.push("");
      lines.push(centerLine(colorize(this.config.mainText, this.config.fgColor), termWidth));

      // URL
      lines.push(centerLine(colorize(this.config.url, this.config.urlColor), termWidth));
    } else {
      // ── Compact one-liner mode ──
      const banner = colorize("CodeSook", this.config.fgColor);
      const url = colorize(this.config.url, this.config.urlColor);
      lines.push(centerLine(`${banner}  ${url}`, termWidth));
    }

    // Padding bottom
    for (let i = 0; i < this.config.paddingBottom; i++) {
      lines.push("");
    }

    // Countdown line (if countdown > 0)
    if (this.config.countdown > 0) {
      const countdownText = ` Press any key to continue (${this.config.countdown}s) `;
      const countdownLine = centerLine(
        colorize(countdownText, "overlay1"),
        termWidth,
      );
      lines.push(countdownLine);
    }

    // Ensure all lines fit termWidth
    return lines.map((line) => fitLine(line, termWidth));
  }

  private applyAnimationColor(line: string): string {
    const animColor = colorToAnsi(this.config.animationColor);
    // Replace base color markers with the configured animation color
    return line.replace(/\x00COLOR:(\w+)\x00/g, (_, name) => {
      if (name === "reset") return ansi.reset;
      return animColor;
    });
  }
}

// ─── Helper: colorize shorthand ───────────────────────────────────────────────

function colorize(text: string, colorName: string): string {
  return colorToAnsi(colorName) + text + ansi.reset;
}
