// Shared TypeScript interfaces for pi-welcome-screen

export type AnimationStyle =
  | "wave"
  | "rainbow"
  | "glitch"
  | "matrix"
  | "typewriter"
  | "static";

export interface WelcomeConfig {
  /** Main text displayed below ASCII banner */
  mainText: string;
  /** URL displayed in footer */
  url: string;
  /** Animation style for the ASCII banner */
  animationStyle: AnimationStyle;
  /** Text used for animation */
  animationText: string;
  /** Frame delay in milliseconds (animation speed) */
  frameDelayMs: number;
  /** Catppuccin Mocha color name for main text */
  fgColor: string;
  /** Catppuccin Mocha color name for background */
  bgColor: string;
  /** Catppuccin Mocha color name for accent elements */
  accentColor: string;
  /** Catppuccin Mocha color name for URL */
  urlColor: string;
  /** Catppuccin Mocha color name for animated elements */
  animationColor: string;
  /** Number of empty lines above content */
  paddingTop: number;
  /** Number of empty lines below content */
  paddingBottom: number;
  /** Countdown seconds before auto-dismiss (0 = never) */
  countdown: number;
}

// Deep partial for config merging
export type PartialConfig = Partial<WelcomeConfig>;
