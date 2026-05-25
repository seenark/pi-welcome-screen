// ANSI color rendering utilities for pi-welcome-screen
// Converts Catppuccin Mocha color names to 24-bit RGB ANSI escape codes.

import { CATPPUCCIN_MOCHA } from "./config.js";
import type { AnimationStyle } from "./types.js";

// ─── ANSI Escape Code Helpers ─────────────────────────────────────────────────

export const ansi = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",

	fg(r: number, g: number, b: number): string {
		return `\x1b[38;2;${r};${g};${b}m`;
	},
	bg(r: number, g: number, b: number): string {
		return `\x1b[48;2;${r};${g};${b}m`;
	},
};

// ─── Hex → RGB ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	return [
		parseInt(h.slice(0, 2), 16),
		parseInt(h.slice(2, 4), 16),
		parseInt(h.slice(4, 6), 16),
	];
}

// ─── Color Name → ANSI Code ───────────────────────────────────────────────────

/**
 * Resolve a Catppuccin Mocha color name to a foreground ANSI escape code.
 */
export function colorToAnsi(colorName: string): string {
	const hex = CATPPUCCIN_MOCHA[colorName];
	if (!hex) return ansi.reset;
	const [r, g, b] = hexToRgb(hex);
	return ansi.fg(r, g, b);
}

/**
 * Resolve a Catppuccin Mocha color name to a background ANSI escape code.
 */
export function bgColorToAnsi(colorName: string): string {
	const hex = CATPPUCCIN_MOCHA[colorName];
	if (!hex) return "";
	const [r, g, b] = hexToRgb(hex);
	return ansi.bg(r, g, b);
}

// ─── Line Rendering ───────────────────────────────────────────────────────────

/**
 * Apply a color to a line of text, returning the ANSI-escaped string.
 */
export function colorize(text: string, colorName: string): string {
	return colorToAnsi(colorName) + text + ansi.reset;
}

/**
 * Center a line within a given terminal width.
 * Uses visible width estimation (handles ANSI codes correctly).
 */
export function centerLine(line: string, width: number): string {
	// Strip ANSI codes for length calculation
	const visibleLen = visibleWidth(line);
	if (visibleLen >= width) return stripAnsi(line).slice(0, width);
	const pad = Math.floor((width - visibleLen) / 2);
	return " ".repeat(pad) + line;
}

/**
 * Pad a line to a given width, truncating if necessary.
 */
export function fitLine(line: string, width: number): string {
	const stripped = stripAnsi(line);
	if (stripped.length > width) {
		return stripAnsi(line).slice(0, width - 1) + "…";
	}
	return line + " ".repeat(width - stripped.length);
}

/**
 * Strip ANSI escape codes from a string.
 */
export function stripAnsi(str: string): string {
	return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

/**
 * Calculate visible width of a string (excluding ANSI codes).
 */
export function visibleWidth(str: string): number {
	return stripAnsi(str).length;
}

// ─── Color Marker Replacement ─────────────────────────────────────────────────

/**
 * Replace color markers like \x00COLOR:lavender\x00 with actual ANSI codes.
 */
export function resolveColorMarkers(
	line: string,
	colorMap: Record<string, string>,
): string {
	return line.replace(/\x00COLOR:(\w+)\x00/g, (_, colorName) => {
		return colorMap[colorName] ?? colorName;
	});
}

// ─── Animation Color Map ───────────────────────────────────────────────────────

/**
 * Build a color map for resolving color markers in animation frames.
 * The map includes all Catppuccin Mocha colors plus special markers.
 */
export function buildAnimationColorMap(
	baseColorName: string,
): Record<string, string> {
	const map: Record<string, string> = {};
	for (const [name, hex] of Object.entries(CATPPUCCIN_MOCHA)) {
		const [r, g, b] = hexToRgb(hex);
		map[name] = ansi.fg(r, g, b);
	}
	// Reset marker
	map["reset"] = ansi.reset;
	// Store the requested animation color under a dedicated key
	// (do NOT overwrite "base" — that should remain the real base color)
	map["animation"] = colorToAnsi(baseColorName);
	return map;
}

// ─── Rainbow Color Sequence ───────────────────────────────────────────────────

const RAINBOW_COLORS = [
	"red",
	"peach",
	"yellow",
	"green",
	"teal",
	"sapphire",
	"blue",
	"lavender",
	"pink",
	"mauve",
];

/**
 * Apply rainbow coloring to a line of text, cycling per character.
 */
export function rainbowLine(line: string): string {
	let out = "";
	let colorIdx = 0;
	for (const char of line) {
		const colorName = RAINBOW_COLORS[colorIdx % RAINBOW_COLORS.length];
		out += colorToAnsi(colorName) + char;
		colorIdx++;
	}
	return out + ansi.reset;
}

/**
 * Apply rainbow coloring cycling per line.
 */
export function rainbowLines(lines: string[], frameOffset = 0): string[] {
	return lines.map((line, i) => {
		const colorName = RAINBOW_COLORS[(i + frameOffset) % RAINBOW_COLORS.length];
		return colorToAnsi(colorName) + line + ansi.reset;
	});
}
