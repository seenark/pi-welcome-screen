// ASCII art animations for pi-welcome-screen
// Each animation style defines frames; each frame is an array of lines.

import type { AnimationStyle } from "./types.js";

// ─── ASCII Art Banner ─────────────────────────────────────────────────────────

/**
 * Big block-letter "CodeSook" banner using box-drawing + block characters.
 * Each character is 6 lines tall.
 */

export const BANNER_LINES: string[] = [
    " ██████╗ ██████╗ ██████╗ ███████╗    ███████╗ ██████╗  ██████╗ ██╗  ██╗",
    "██╔════╝██╔═══██╗██╔══██╗██╔════╝    ██╔════╝██╔═══██╗██╔═══██╗██║ ██╔╝",
    "██║     ██║   ██║██║  ██║█████╗      ███████╗██║   ██║██║   ██║█████╔╝ ",
    "██║     ██║   ██║██║  ██║██╔══╝      ╚════██║██║   ██║██║   ██║██╔═██╗ ",
    "╚██████╗╚██████╔╝██████╔╝███████╗    ███████║╚██████╔╝╚██████╔╝██║  ██╗",
    " ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝    ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝",
];

export const BANNER_LINES1: string[] = [
    "   █████████               █████              █████████                    █████     ",
    "  ███░░░░░███             ░░███              ███░░░░░███                  ░░███      ",
    " ███     ░░░   ██████   ███████   ██████    ░███    ░░░   ██████   ██████  ░███ █████",
    "░███          ███░░███ ███░░███  ███░░███   ░░█████████  ███░░███ ███░░███ ░███░░███ ",
    "░███         ░███ ░███░███ ░███ ░███████     ░░░░░░░░███░███ ░███░███ ░███ ░██████░  ",
    "░░███     ███░███ ░███░███ ░███ ░███░░░      ███    ░███░███ ░███░███ ░███ ░███░░███ ",
    " ░░█████████ ░░██████ ░░████████░░██████    ░░█████████ ░░██████ ░░██████  ████ █████",
    "  ░░░░░░░░░   ░░░░░░   ░░░░░░░░  ░░░░░░      ░░░░░░░░░   ░░░░░░   ░░░░░░  ░░░░ ░░░░░ ",
];

/** Simpler one-liner banner for smaller terminals */
export const BANNER_ONE_LINER =
    "═══ Code Sook ═══  https://codesook.dev  ══════════════";

// ─── Animation Frame Builders ─────────────────────────────────────────────────

export type FrameBuilder = (
    bannerLines: string[],
    frameIndex: number,
    totalFrames: number,
) => string[][];

/**
 * Returns a flat list of frame arrays.
 * Each "frame" is a set of lines representing one moment in the animation.
 */
export function buildAnimationFrames(
    style: AnimationStyle,
    bannerLines: string[],
    totalFrames: number,
): string[][] {
    switch (style) {
        case "wave":
            return buildWaveFrames(bannerLines, totalFrames);
        case "rainbow":
            return buildRainbowFrames(bannerLines, totalFrames);
        case "glitch":
            return buildGlitchFrames(bannerLines, totalFrames);
        case "matrix":
            return buildMatrixFrames(bannerLines, totalFrames);
        case "typewriter":
            return buildTypewriterFrames(bannerLines, totalFrames);
        case "static":
        default:
            return buildStaticFrames(bannerLines);
    }
}

function buildStaticFrames(bannerLines: string[]): string[][] {
    return [bannerLines];
}

function buildWaveFrames(
    bannerLines: string[],
    totalFrames: number,
): string[][] {
    const frames: string[][] = [];
    for (let f = 0; f < totalFrames; f++) {
        frames.push(
            bannerLines.map((line) => {
                const offset = Math.round(
                    Math.sin((f / totalFrames) * Math.PI * 2) * 2,
                );
                return shiftChars(line, offset);
            }),
        );
    }
    return frames;
}

function buildRainbowFrames(
    bannerLines: string[],
    totalFrames: number,
): string[][] {
    const colors = [
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
    const frames: string[][] = [];
    for (let f = 0; f < totalFrames; f++) {
        frames.push(
            bannerLines.map((line, lineIdx) => {
                const colorIdx = (lineIdx + f) % colors.length;
                return (
                    colorMarker(colors[colorIdx]) + line + colorMarker("reset")
                );
            }),
        );
    }
    return frames;
}

function buildGlitchFrames(
    bannerLines: string[],
    totalFrames: number,
): string[][] {
    const frames: string[][] = [];
    for (let f = 0; f < totalFrames; f++) {
        frames.push(
            bannerLines.map((line, lineIdx) => {
                if ((f + lineIdx) % 5 === 0) {
                    return glitchLine(line, f);
                }
                return line;
            }),
        );
    }
    return frames;
}

function buildMatrixFrames(
    bannerLines: string[],
    totalFrames: number,
): string[][] {
    const frames: string[][] = [];
    for (let f = 0; f < totalFrames; f++) {
        frames.push(
            bannerLines.map((line, lineIdx) => {
                const revealProgress = Math.min(
                    1,
                    Math.max(0, (f - lineIdx * 2) / (totalFrames / 2)),
                );
                if (revealProgress >= 1) return line;
                const revealChars = Math.floor(line.length * revealProgress);
                const revealed = line.slice(0, revealChars);
                const hidden = line
                    .slice(revealChars)
                    .replace(/█/g, "░")
                    .replace(/╗/g, " ")
                    .replace(/║/g, " ");
                return revealed + hidden;
            }),
        );
    }
    return frames;
}

function buildTypewriterFrames(
    bannerLines: string[],
    totalFrames: number,
): string[][] {
    const frames: string[][] = [];
    const maxLen = Math.max(...bannerLines.map((l) => l.length));
    const charsPerFrame = Math.ceil(maxLen / totalFrames);

    for (let f = 0; f < totalFrames; f++) {
        frames.push(
            bannerLines.map((line) => {
                const charsToShow = Math.min(line.length, f * charsPerFrame);
                return line.slice(0, charsToShow);
            }),
        );
    }
    return frames;
}

// ─── Utility Functions ────────────────────────────────────────────────────────

/** Insert color marker tokens that the renderer will replace with ANSI codes */
export function colorMarker(color: string): string {
    return `\x00COLOR:${color}\x00`;
}

/** Shift characters in a string left or right by offset (circular) */
function shiftChars(str: string, offset: number): string {
    if (offset === 0) return str;
    const arr = [...str];
    const shifted: string[] = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        shifted[i] = arr[(i - offset + arr.length) % arr.length];
    }
    return shifted.join("");
}

/** Apply glitch distortion to a line */
function glitchLine(line: string, seed: number): string {
    const glitchChars = ["▓", "▒", "░", "█", "▄", "▀", "■", "□", "▪", "▫"];
    let out = "";
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if ((seed + i * 7) % 11 === 0) {
            out += glitchChars[(seed + i) % glitchChars.length];
        } else {
            out += char;
        }
    }
    return out;
}

// ─── Frame Count for Each Style ───────────────────────────────────────────────

export function getFrameCount(style: AnimationStyle): number {
    switch (style) {
        case "wave":
            return 30;
        case "rainbow":
            return 20;
        case "glitch":
            return 25;
        case "matrix":
            return 40;
        case "typewriter":
            return 30;
        case "static":
            return 1;
        default:
            return 30;
    }
}
