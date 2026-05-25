/**
 * pi-welcome-screen — customizable animated ASCII art welcome banner for Pi.
 *
 * This is the extension entry point. Pi loads it via jiti (TypeScript works
 * without compilation) and calls the default export factory function with
 * the ExtensionAPI.
 *
 * The extension uses `ctx.ui.setHeader()` to replace the built-in header
 * with an animated ASCII art banner. Config is loaded from:
 *   1. Built-in defaults
 *   2. ~/.pi/welcome-screen.config.json (or ~/.pi/config/welcome-screen.json)
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";
import { loadConfig } from "./config.js";
import {
	BANNER_LINES,
	buildAnimationFrames,
	getFrameCount,
} from "./animations.js";
import {
	colorToAnsi,
	centerLine,
	fitLine,
	resolveColorMarkers,
	buildAnimationColorMap,
	ansi,
} from "./renderer.js";
import type { WelcomeConfig } from "./types.js";

// ─── Colorize Helper ──────────────────────────────────────────────────────────

function colorize(text: string, colorName: string): string {
	return colorToAnsi(colorName) + text + ansi.reset;
}

// ─── Welcome Header Component ─────────────────────────────────────────────────

class WelcomeHeader implements Component {
	private config: WelcomeConfig;
	private frameIndex: number = 0;
	private lastFrameTime: number = 0;
	private frames: string[][] = [];
	private tui: { requestRender(): void } | null = null;
	private animInterval: ReturnType<typeof setInterval> | null = null;

	constructor(config: WelcomeConfig) {
		this.config = config;
		this.initFrames();
	}

	/** Start the animation timer. Call after the component is returned from setHeader factory. */
	startAnimation(tui: { requestRender(): void }): void {
		this.tui = tui;
		if (this.frames.length > 1) {
			this.lastFrameTime = Date.now();
			this.animInterval = setInterval(() => {
				this.tui?.requestRender();
			}, this.config.frameDelayMs);
		}
	}

	private initFrames(): void {
		const totalFrames = getFrameCount(this.config.animationStyle);
		this.frames = buildAnimationFrames(
			this.config.animationStyle,
			BANNER_LINES,
			totalFrames,
		);
	}

	invalidate(): void {
		this.frameIndex = 0;
		this.lastFrameTime = 0;
		this.initFrames();
	}

	dispose(): void {
		if (this.animInterval !== null) {
			clearInterval(this.animInterval);
			this.animInterval = null;
		}
		this.tui = null;
	}

	render(termWidth: number): string[] {
		const now = Date.now();

		// Advance frame based on elapsed time
		if (
			this.frames.length > 1 &&
			now - this.lastFrameTime >= this.config.frameDelayMs
		) {
			this.frameIndex = (this.frameIndex + 1) % this.frames.length;
			this.lastFrameTime = now;
		}

		return this.buildLines(termWidth);
	}

	private buildLines(termWidth: number): string[] {
		const lines: string[] = [];
		const minWidth = 80;

		// Padding top
		for (let i = 0; i < this.config.paddingTop; i++) {
			lines.push("");
		}

		if (termWidth >= minWidth) {
			// ── Big banner mode ──
			const frame = this.frames[this.frameIndex] ?? this.frames[0] ?? [];
			const colorMap = buildAnimationColorMap(this.config.animationColor);

			// Banner lines with animation color
			for (const rawLine of frame) {
				const resolved = resolveColorMarkers(rawLine, colorMap);
				const colorized = this.applyAnimationColor(resolved);
				lines.push(centerLine(colorized, termWidth));
			}

			// Main text
			lines.push("");
			lines.push(
				centerLine(
					colorize(this.config.mainText, this.config.fgColor),
					termWidth,
				),
			);

			// URL
			lines.push(
				centerLine(colorize(this.config.url, this.config.urlColor), termWidth),
			);
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

		// Ensure all lines fit termWidth
		return lines.map((line) => fitLine(line, termWidth));
	}

	private applyAnimationColor(line: string): string {
		const animColor = colorToAnsi(this.config.animationColor);
		return line.replace(/\x00COLOR:(\w+)\x00/g, (_, name) => {
			if (name === "reset") return ansi.reset;
			return animColor;
		});
	}
}

// ─── Extension Factory ────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	let activeHeader: WelcomeHeader | undefined;

	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;

		const config = loadConfig();

		ctx.ui.setHeader((tui, _theme) => {
			activeHeader?.dispose();
			activeHeader = new WelcomeHeader(config);
			activeHeader.startAnimation(tui);
			return activeHeader;
		});
	});

	pi.on("session_shutdown", async () => {
		activeHeader?.dispose();
		activeHeader = undefined;
	});

	// Command to restore built-in header
	pi.registerCommand("builtin-header", {
		description: "Restore the built-in Pi header",
		handler: async (_args, ctx) => {
			activeHeader?.dispose();
			activeHeader = undefined;
			ctx.ui.setHeader(undefined);
			ctx.ui.notify("Built-in header restored", "info");
		},
	});

	// Command to reload welcome screen config
	pi.registerCommand("welcome-reload", {
		description: "Reload welcome screen config from disk",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) return;
			const config = loadConfig();
			activeHeader?.dispose();

			ctx.ui.setHeader((_tui, _theme) => {
				activeHeader = new WelcomeHeader(config);
				return activeHeader;
			});
			ctx.ui.notify("Welcome screen reloaded", "info");
		},
	});
}

// Re-export types and utilities for programmatic use
export type { WelcomeConfig, AnimationStyle } from "./types.js";
export { loadConfig, DEFAULT_CONFIG, CATPPUCCIN_MOCHA } from "./config.js";
