# pi-welcome-screen

Customizable animated ASCII art welcome banner for the [Pi coding agent](https://github.com/earendil-works/pi-mono).

Displays a full-screen ASCII art banner with animations on startup. Fully customizable: text, URL, animation style, and colors (Catppuccin Mocha palette).

## How It Works

This is a **Pi extension** that:

1. Subscribes to the `session_start` event
2. Calls `ctx.ui.setHeader()` to replace the built-in header with a custom `Component`
3. The component implements `render(width: number): string[]` — Pi's TUI calls this on every frame tick, producing the animation

## Installation

### Option A — Local directory (recommended for development)

```bash
# Clone the repo
git clone https://github.com/codesook/pi-welcome-screen.git
cd pi-welcome-screen
```

Add to your Pi `settings.json` (`~/.pi/agent/settings.json`):

```json
{
  "extensions": ["/path/to/pi-welcome-screen"]
}
```

Or use the `-e` flag for quick testing:

```bash
pi -e /path/to/pi-welcome-screen
```

### Option B — Copy to extensions directory

```bash
cp -r /path/to/pi-welcome-screen ~/.pi/agent/extensions/pi-welcome-screen
```

Pi auto-discovers extensions in `~/.pi/agent/extensions/`.

### Option C — Pi package (npm/git)

```bash
pi install git:github.com/codesook/pi-welcome-screen
```

Or add to `settings.json` under `packages`:

```json
{
  "packages": ["git:github.com/codesook/pi-welcome-screen"]
}
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

Config file search order:
1. `~/.pi/welcome-screen.config.json`
2. `~/.pi/config/welcome-screen.json`
3. `./welcome-screen.config.json`

## Commands

| Command | Description |
|---------|-------------|
| `/builtin-header` | Restore the built-in Pi header |
| `/welcome-reload` | Reload welcome screen config from disk |

## Animation Styles

| Style | Description |
|-------|-------------|
| `wave` | Letters shift with a sinusoidal wave effect |
| `rainbow` | Each line cycles through the full Catppuccin spectrum |
| `glitch` | Random glitch artifacts appear on lines |
| `matrix` | Text is revealed from left to right (Matrix-style) |
| `typewriter` | Characters appear one-by-one |
| `static` | No animation — just the banner in full color |

## Color Names (Catppuccin Mocha)

| Name | Hex | Name | Hex |
|------|-----|------|-----|
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

## Project Structure

```
pi-welcome-screen/
├── package.json        # pi.extensions → ./src/index.ts
├── src/
│   ├── index.ts        # Extension entry — exports factory function
│   ├── WelcomeScreen.ts# Legacy stub (kept for compat)
│   ├── config.ts       # Defaults + config file loading
│   ├── animations.ts   # ASCII banner + frame builders
│   ├── renderer.ts     # ANSI color utilities
│   └── types.ts        # TypeScript interfaces
└── README.md
```

## Development

No build step needed — Pi loads TypeScript extensions via [jiti](https://github.com/unjs/jiti).

```bash
# Test locally
pi -e .

# Or install as extension and run pi normally
```

## License

MIT
