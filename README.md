# pi-welcome-screen

Customizable animated ASCII art welcome **overlay** for the [Pi coding agent](https://github.com/earendil-works/pi-mono).

Displays an animated ASCII art banner inside a styled box with borders, countdown timer, and auto-dismiss. Fully customizable: text, URL, animation style, border style, and colors (Catppuccin Mocha palette).

## Features

- 🎨 **Animated ASCII banner** — Multiple animation styles (wave, rainbow, glitch, matrix, typewriter)
- 📦 **Styled overlay box** — Box-drawing borders with background fill
- ⏱️ **Countdown timer** — Auto-dismisses after configurable seconds
- ⌨️ **Keyboard dismiss** — Press any key to dismiss immediately
- 🤖 **Auto-dismiss** — Hides when agent starts responding
- 🎨 **Catppuccin colors** — Full Mocha palette support

## How It Works

This is a **Pi extension** that:

1. Subscribes to the `session_start` event
2. Shows an overlay using `ctx.ui.custom({ overlay: true })`
3. The overlay displays an animated ASCII banner inside a styled box
4. Dismisses automatically on countdown, keypress, or agent activity

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
  "mainText": "CodeSook",
  "url": "https://codesook.dev",
  "animationStyle": "rainbow",
  "frameDelayMs": 80,
  "fgColor": "lavender",
  "accentColor": "blue",
  "urlColor": "sapphire",
  "animationColor": "pink",
  "paddingTop": 2,
  "paddingBottom": 2,

  "borderStyle": "rounded",
  "bgFillChar": "",
  "minTerminalWidth": 80,
  "overlayWidth": 120,
  "countdown": -1
}
```

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mainText` | string | "CodeSook" | Main text below banner |
| `url` | string | "https://codesook.dev" | URL displayed below main text |
| `animationStyle` | string | "rainbow" | Animation style |
| `frameDelayMs` | number | 80 | Animation speed (ms between frames) |
| `fgColor` | string | "lavender" | Main text color |
| `urlColor` | string | "sapphire" | URL text color |
| `animationColor` | string | "pink" | Color for animated elements |
| `accentColor` | string | "blue" | Border/background fill color |
| `paddingTop` | number | 2 | Empty lines above content |
| `paddingBottom` | number | 2 | Empty lines below content |
| `countdown` | number | -1 | Auto-dismiss: `-1` = wait for keypress, `0` = never, `>0` = seconds |
| `borderStyle` | string | "rounded" | Border style (rounded/square/double/minimal) |
| `bgFillChar` | string | "" | Background fill (empty = no background) |
| `minTerminalWidth` | number | 80 | Minimum terminal width to show overlay |
| `overlayWidth` | number | 120 | Width of the overlay box |

Config file search order:
1. `~/.pi/welcome-screen.config.json`
2. `~/.pi/config/welcome-screen.json`
3. `./welcome-screen.config.json`

## Border Styles

| Style | Example |
|-------|---------|
| `rounded` | `╭────╮│    │╰────╯` |
| `square` | `┌────┐│    │└────┘` |
| `double` | `╔════╗║    ║╚════╝` |
| `minimal` | `+----++    ++----+` |

## Animation Styles

| Style | Description |
|-------|-------------|
| `wave` | Letters shift with a sinusoidal wave effect |
| `rainbow` | Each line cycles through the full Catppuccin spectrum |
| `glitch` | Random glitch artifacts appear on lines |
| `matrix` | Text is revealed from left to right (Matrix-style) |
| `typewriter` | Characters appear one-by-one |
| `static` | No animation — just the banner in full color |

## Commands

| Command | Description |
|---------|-------------|
| `/welcome-dismiss` | Manually dismiss the welcome overlay |
| `/welcome-reload` | Reload config and reshow overlay |

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

## Compatibility with pi-powerline-footer

If you use [pi-powerline-footer](https://github.com/nicobailon/pi-powerline-footer), you can disable its welcome screen to avoid conflicts:

```json
// ~/.pi/settings.json
{
  "powerline": {
    "welcome": false
  }
}
```

## Project Structure

```
pi-welcome-screen/
├── package.json        # pi.extensions → ./src/index.ts
├── src/
│   ├── index.ts        # Extension entry — exports factory function
│   ├── WelcomeOverlay.ts # Overlay component class
│   ├── config.ts       # Defaults + config file loading
│   ├── animations.ts   # ASCII banner + frame builders
│   ├── renderer.ts     # ANSI color + box-drawing utilities
│   └── types.ts       # TypeScript interfaces
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
