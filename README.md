# pi-welcome-screen

Branded ASCII art welcome screen extension for the [Pi coding agent](https://github.com/nicobailon/pi-powerline-footer).

Displays a full-screen ASCII art banner with animated text on startup. Fully customizable: text, URL, animation style, and colors (defaults to Catppuccin Mocha).

## Features

- **Big ASCII art banner** using box-drawing and block characters
- **5 animation styles**: `wave`, `rainbow`, `glitch`, `matrix`, `typewriter`, `static`
- **Catppuccin Mocha** color palette by default
- **Fully customizable**: main text, URL, colors, animation speed, padding
- **Config file support**: drop a JSON file to override defaults
- **Pi extension**: follows the same structure as `pi-powerline-footer`

## Installation

### Option A — npm pack (recommended)

```bash
cd ~/2026/pi-welcome-screen
npm install
npm run build
npm pack  # creates pi-welcome-screen-*.tgz
```

Add to your Pi `settings.json` under `packages`:

```json
{
  "packages": [
    "/path/to/pi-welcome-screen-0.1.0.tgz"
  ]
}
```

### Option B — Local extensions folder

```bash
cp -r ~/2026/pi-welcome-screen ~/.pi/extensions/pi-welcome-screen
```

## Configuration

Create `~/.pi/welcome-screen.config.json`:

```json
{
  "mainText": "Code Sook",
  "url": "https://codesook.dev",
  "animationStyle": "wave",
  "animationText": "Welcome",
  "frameDelayMs": 80,
  "fgColor": "lavender",
  "accentColor": "blue",
  "urlColor": "sapphire",
  "animationColor": "pink",
  "paddingTop": 2,
  "paddingBottom": 2,
  "countdown": 30
}
```

### Color Names (Catppuccin Mocha)

| Name | Hex | Name | Hex |
|---|---|---|---|
| `base` | #1e1e2e | `lavender` | #b4befe |
| `mantle` | #181825 | `blue` | #89b4fa |
| `crust` | #11111b | `sapphire` | #74c7ec |
| `surface0` | #313244 | `sky` | #89dceb |
| `surface1` | #45475a | `teal` | #94e2d5 |
| `surface2` | #585b70 | `green` | #a6e3a1 |
| `overlay0` | #6c7086 | `yellow` | #f9e2af |
| `overlay1` | #7f849c | `peach` | #fab387 |
| `overlay2` | #9399b2 | `maroon` | #eba0ac |
| `subtext0` | #a6adc8 | `red` | #f38ba8 |
| `subtext1` | #bac2de | `mauve` | #cba6f7 |
| `text` | #cdd6f4 | `pink` | #f5c2e7 |
| | | `flamingo` | #f2cdcd |
| | | `rosewater` | #f5e0dc |

## Animation Styles

| Style | Description |
|---|---|
| `wave` | Letters shift with a sinusoidal wave effect |
| `rainbow` | Each line cycles through the full Catppuccin spectrum |
| `glitch` | Random glitch artifacts appear on lines |
| `matrix` | Text is revealed from left to right (Matrix-style) |
| `typewriter` | Characters appear one-by-one |
| `static` | No animation — just the banner in full color |

## Development

```bash
npm install
npm run build    # compiles TypeScript → dist/
```

### Smoke Test

```bash
node -e "
import { WelcomeScreen } from './dist/index.js';
const c = new WelcomeScreen({});
const lines = c.render(120);
console.log('Lines:', lines.length);
lines.forEach(l => console.log(l));
"
```

## Project Structure

```
pi-welcome-screen/
├── package.json        # pi.extensions → ./dist/index.js
├── tsconfig.json
├── src/
│   ├── index.ts        # Entry — exports WelcomeScreen
│   ├── WelcomeScreen.ts # Component class (implements render())
│   ├── config.ts       # Defaults + config loading
│   ├── animations.ts   # ASCII banner + frame builders
│   ├── renderer.ts     # ANSI color utilities
│   └── types.ts        # TypeScript interfaces
└── README.md
```

## How It Works

1. Pi reads `package.json` → finds `./dist/index.js` via the `pi.extensions` field
2. `index.ts` exports `WelcomeScreen` as the extension's default component
3. `WelcomeScreen` implements the `Component` interface from `@earendil-works/pi-tui`
4. Each `render(termWidth)` call advances the animation frame and returns colored lines
5. The Pi TUI calls `render()` on every animation frame tick, creating motion
