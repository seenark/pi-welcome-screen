# pi-welcome-screen — Project Plan

## 1. Project Overview

**What:** `pi-welcome-screen` is a Pi Extension that displays a full-screen ASCII art welcome banner with animated text on terminal startup. It shows the organization name ("Code Sook"), a URL, and a configurable ASCII animation.

**Why:** When a developer starts a coding session in Pi, the agent has no visual identity or greeting. This extension provides a polished, branded welcome experience using ANSI-colored ASCII art, matching the Catppuccin Mocha aesthetic used throughout the Pi TUI.

**Reference:** Modeled after `pi-powerline-footer` (https://github.com/nicobailon/pi-powerline-footer). Implements the `Component` interface from `@earendil-works/pi-tui`.

---

## 2. Architecture Design

### 2.1 Extension Structure

```
pi-welcome-screen/
├── src/
│   ├── index.ts          # Package entry — registers the Component
│   ├── WelcomeScreen.ts  # Main Component class
│   ├── config.ts         # Config schema + defaults
│   ├── animations.ts     # ASCII animation frame data
│   ├── renderer.ts       # Renders frames with ANSI colors
│   └── types.ts          # Shared TypeScript interfaces
├── package.json
├── tsconfig.json
└── README.md
```

**Entry point (`index.ts`):** Exports a single class decorated as a Pi Component. Pi reads the `pi` field in `package.json` to find this entry.

**Component class (`WelcomeScreen.ts`):**
```typescript
export class WelcomeScreen implements Component {
  constructor(config: WelcomeConfig)
  render(termWidth: number): string[]
  // Also implements Component lifecycle hooks if needed
}
```

### 2.2 Component Interface

Implemented from `@earendil-works/pi-tui`:
- `render(termWidth: number): string[]` — called by Pi TUI each frame. Returns an array of strings (lines) to display. The animation advances on each call.
- `Component` may also have lifecycle methods; these will be confirmed against the actual `pi-tui` interface.

### 2.3 Customization — Config File Approach

Pi extensions support local config files. We'll use a `welcome-screen.config.json` (or `.js`) placed in the Pi config directory, or a `config` field merged with package defaults.

**Config schema (`config.ts`):**
```typescript
interface WelcomeConfig {
  // Text content
  mainText: string;        // Default: "Code Sook"
  url: string;             // Default: "https://codesook.dev"

  // Animation
  animationStyle: 'wave' | 'rainbow' | 'glitch' | 'matrix' | 'typewriter';
  animationText: string;   // Default: "Welcome"
  frameDelayMs: number;    // Default: 80  (speed)

  // Colors (Catppuccin Mocha names)
  fgColor: string;         // Default: 'lavender'  (#b4befe)
  bgColor: string;         // Default: 'base'      (#1e1e2e)
  accentColor: string;     // Default: 'blue'      (#89b4fa)
  urlColor: string;        // Default: 'sapphire'  (#74c7ec)
  animationColor: string;  // Default: 'pink'      (#f5c2e7)

  // Layout
  paddingTop: number;      // Default: 2
  paddingBottom: number;    // Default: 2
}
```

**Config resolution order (lowest → highest priority):**
1. Built-in defaults in `config.ts`
2. `pi-welcome-screen` section in Pi's global `settings.json`
3. Local `welcome-screen.config.json` in the extensions folder

### 2.4 Animation System Design

The animation system is **frame-based**. On each `render()` call, the component returns the next animation frame. The TUI calls `render()` repeatedly, giving the illusion of motion.

**Animation data (`animations.ts`):**

Each animation style is a collection of **frames**, where each frame is an array of lines (the ASCII art at that stage of animation).

```typescript
type AnimationFrames = string[][];  // array of frames, each frame = array of lines
```

**Styles:**

| Style | Description |
|---|---|
| `wave` | Text letters appear sequentially left-to-right with a sinusoidal "wave" effect |
| `rainbow` | Text rendered with cycling Rainbow colors (Red → Yellow → Green → Blue → Pink) |
| `glitch` | Text with random offset/color glitch artifacts |
| `matrix` | Falling green characters revealing the text (Matrix-style) |
| `typewriter` | Characters appear one-by-one from left to right |

**Cool factor — what makes it impressive:**
- ASCII art banner letters built from block characters (`█`, `▓`, `░`, `▀`, `▄`, `▌`, `▐`) for a rich, textured look
- Multi-layer rendering: background → ASCII art → colored overlay text → URL footer
- Each frame calculates character-level ANSI color spans so the same ASCII art gets dynamically re-colored per animation style
- Frame timing controlled by `frameDelayMs` in config

**Example ASCII art for "CodeSook" (big block letters):**
```
 ██████╗ ██████╗ ██╗   ██╗██╗██╗  ██╗
██╔════╝██╔═══██╗██║   ██║██║██║ ██╔╝
██║     ██║   ██║██║   ██║██║█████╔╝ 
██║     ██║   ██║╚██╗ ██╔╝██║██╔═██╗ 
╚██████╗╚██████╔╝ ╚████╔╝ ██║██║  ██╗
 ╚═════╝ ╚═════╝   ╚═══╝  ╚═╝╚═╝  ╚═╝
```

This is pre-defined as a multi-line string constant in `animations.ts`. Each animation style applies different color/effect transforms to the same base ASCII art.

### 2.5 Color System

**Catppuccin Mocha as default.** All colors referenced by name in config are mapped to hex in a lookup table:

```typescript
const CATPPUCCIN_MOCHA: Record<string, string> = {
  base:      '#1e1e2e',
  mantle:    '#181825',
  crust:     '#11111b',
  surface0:  '#313244',
  // ... (full palette from spec)
  lavender:  '#b4befe',
  blue:      '#89b4fa',
  sapphire:  '#74c7ec',
  pink:      '#f5c2e7',
  // ...
};
```

**ANSI escape code generation:**

```typescript
function hexToAnsi(hex: string): string {
  // 24-bit RGB ANSI escape: \x1b[38;2;R;G;Bm
  // Background: \x1b[48;2;R;G;Bm
}
```

Example usage:
```
\x1b[38;2;180;190;254m  → Lavender text (#b4befe)
\x1b[48;2;30;30;46m     → Base background (#1e1e2e)
\x1b[0m                 → Reset
```

**Color swapping:** To use a different palette, replace the `CATPPUCCIN_MOCHA` object in `renderer.ts` with a custom palette map. The rest of the code only uses color names (e.g., `accentColor`), never raw hex, so swapping palettes requires only changing the palette object.

### 2.6 Rendering Pipeline

```
render(termWidth) called by Pi TUI
  │
  ├─► determine current animation frame (frameIndex % totalFrames)
  │
  ├─► build lines:
  │     1. padding-top empty lines
  │     2. ASCII art banner lines (colored with fg/accent)
  │     3. mainText centered (fgColor)
  │     4. urlText centered (urlColor)
  │     5. padding-bottom empty lines
  │
  ├─► wrap each line to termWidth (pad or trim)
  │
  └─► return string[] (each line has embedded ANSI codes)
```

**Centering logic:**
```typescript
function centerLine(line: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - line.length) / 2));
  return ' '.repeat(padding) + line;
}
```

---

## 3. File Structure

```
~/2026/pi-welcome-screen/
├── PLAN.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Entry point — exports Component registration
│   ├── WelcomeScreen.ts      # Main Component class
│   ├── config.ts             # Config schema + defaults + validation
│   ├── animations.ts         # ASCII art frames + style definitions
│   ├── renderer.ts           # ANSI color rendering + frame builder
│   └── types.ts              # WelcomeConfig interface + shared types
└── README.md
```

**Key files:**

| File | Purpose |
|---|---|
| `package.json` | npm package with `pi` field listing entry files. Peer deps: `pi-ai`, `pi-coding-agent`, `pi-tui` (all `^0.74.0`) |
| `index.ts` | Default export is the Component class; Pi uses this to register the extension |
| `WelcomeScreen.ts` | Class implementing `Component.render()`. Holds animation state (frame counter) |
| `config.ts` | `WelcomeConfig` interface, default values, `loadConfig()` function |
| `animations.ts` | Big ASCII art banner as multi-line string. Frame arrays per animation style |
| `renderer.ts` | `hexToAnsi()`, `applyColor()`, `renderFrame()` — all ANSI escape code logic |
| `types.ts` | Shared interfaces |

---

## 4. Build & Install Instructions

### 4.1 Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Pi coding agent installed (to target `settings.json` location)

### 4.1 Build

```bash
cd ~/2026/pi-welcome-screen
npm install          # installs peer deps
npm run build        # compiles TypeScript → dist/
```

Output: `dist/index.js` (CommonJS or ESM based on tsconfig).

### 4.2 Install

**Option A — npm (recommended for distribution)**

```bash
cd ~/2026/pi-welcome-screen
npm pack            # creates pi-welcome-screen-*.tgz
```

Then add to Pi's `settings.json` under `packages`:

```json
{
  "packages": [
    "pi-welcome-screen@0.1.0"
  ]
}
```

Or if using a local `.tgz`:

```json
{
  "packages": [
    "/path/to/pi-welcome-screen-0.1.0.tgz"
  ]
}
```

**Option B — Local extensions folder**

```bash
# Copy extension to Pi's local extensions directory
cp -r ~/2026/pi-welcome-screen ~/.pi/extensions/pi-welcome-screen
```

### 4.3 Configuration

After install, create `~/.pi/welcome-screen.config.json`:

```json
{
  "mainText": "Code Sook",
  "url": "https://codesook.dev",
  "animationStyle": "wave",
  "animationText": "Welcome",
  "frameDelayMs": 80,
  "fgColor": "lavender",
  "bgColor": "base",
  "accentColor": "blue",
  "urlColor": "sapphire",
  "animationColor": "pink",
  "paddingTop": 2,
  "paddingBottom": 2
}
```

### 4.4 Uninstall

Remove from `settings.json` packages array, or delete the extension folder from `~/.pi/extensions/`.

---

## 5. Verification Steps

### 5.1 Local smoke test (no Pi required)

```bash
cd ~/2026/pi-welcome-screen
npm run build

# Run a quick test that instantiates the component and checks render output
node -e "
  const { WelcomeScreen } = require('./dist/index.js');
  const c = new WelcomeScreen({});
  const lines = c.render(120);
  console.log('Lines:', lines.length);
  console.log(lines.join('\n'));
"
```

Expected: ASCII banner prints with ANSI color codes visible (stray `\x1b[` sequences in output).

### 5.2 Verify ANSI color codes are present

```bash
node -e "
  const { WelcomeScreen } = require('./dist/index.js');
  const c = new WelcomeScreen({});
  const lines = c.render(120);
  const hasAnsi = lines.some(l => l.includes('\x1b['));
  console.log('Contains ANSI codes:', hasAnsi);
  const hasReset = lines.some(l => l.includes('\x1b[0m'));
  console.log('Contains reset codes:', hasReset);
"
```

### 5.3 Test all animation styles

```bash
node -e "
  const { WelcomeScreen } = require('./dist/index.js');
  for (const style of ['wave', 'rainbow', 'glitch', 'matrix', 'typewriter']) {
    const c = new WelcomeScreen({ animationStyle: style });
    const lines = c.render(120);
    console.log(style, '->', lines.length, 'lines, first line length:', lines[0].length);
  }
"
```

### 5.4 Verify customization via config object

```bash
node -e "
  const { WelcomeScreen } = require('./dist/index.js');
  const c = new WelcomeScreen({
    mainText: 'TestCorp',
    url: 'https://testcorp.io',
    fgColor: 'green',
    animationStyle: 'typewriter'
  });
  const lines = c.render(120);
  const hasTestCorp = lines.some(l => l.includes('TestCorp'));
  const hasUrl = lines.some(l => l.includes('testcorp.io'));
  console.log('Custom mainText present:', hasTestCorp);
  console.log('Custom URL present:', hasUrl);
"
```

### 5.5 Verify Pi integration (requires Pi environment)

1. Install extension into Pi per Option A or B above.
2. Start a new Pi coding session.
3. Confirm welcome screen ASCII art appears at the top of the terminal.
4. Confirm animation plays (waves/glitch/matrix effect visible).
5. Confirm colors match Catppuccin Mocha (dark background, lavender text, blue accents).
6. Confirm URL `https://codesook.dev` appears in `sapphire` color.
7. Modify `welcome-screen.config.json` to change `mainText` to something else — restart session and verify the change.

### 5.6 Term width handling

```bash
# Test with narrow terminal (80 cols)
node -e "
  const { WelcomeScreen } = require('./dist/index.js');
  const c = new WelcomeScreen({});
  const lines = c.render(80);
  console.log('80-col render:', lines.length, 'lines');
  lines.forEach((l, i) => console.log(i, l.length, 'chars'));
"
```

Verify no overflow/crash — lines should either wrap or be truncated to fit 80 characters.

---

## Appendix: Animation Frame Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  [paddingTop empty lines]                                           │
│                                                                      │
│     ██████╗ ██████╗ ██╗   ██╗██╗██╗  ██╗     ← ASCII banner          │
│    ██╔════╝██╔═══██╗██║   ██║██║██║ ██╔╝       (fgColor/accent)     │
│    ██║     ██║   ██║██║   ██║██║█████╔╝                              │
│    ██║     ██║   ██║╚██╗ ██╔╝██║██╔═██╗                              │
│     ██████╗╚██████╔╝ ╚████╔╝ ██║██║  ██╗                             │
│      ╚═════╝ ╚═════╝   ╚═══╝  ╚═╝╚═╝  ╚═╝                            │
│                                                                      │
│                        Code Sook        ← mainText (fgColor)         │
│                    https://codesook.dev ← URL (urlColor)            │
│                                                                      │
│  [paddingBottom empty lines]                                        │
└──────────────────────────────────────────────────────────────────────┘
```

Animation overlays color cycling/glitch effects onto the ASCII banner portion, frame by frame.

---

## Appendix: Color Palette Quick Reference

| Name | Hex | Use |
|---|---|---|
| Base | `#1e1e2e` | Default background |
| Mantle | `#181825` | Darker background |
| Text | `#cdd6f4` | Default foreground |
| Lavender | `#b4befe` | Default main text color |
| Blue | `#89b4fa` | Accent |
| Sapphire | `#74c7ec` | URL color |
| Pink | `#f5c2e7` | Animation color |
| Green | `#a6e3a1` | Success accents |
| Peach | `#fab387` | Warm accents |
| Red | `#f38ba8` | Error/warning |
