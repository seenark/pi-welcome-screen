// pi-welcome-screen — entry point
// This is the file registered in package.json's `pi.extensions` field.

export { WelcomeScreen } from "./WelcomeScreen.js";
export type { WelcomeConfig, AnimationStyle } from "./types.js";
export { loadConfig, DEFAULT_CONFIG, CATPPUCCIN_MOCHA } from "./config.js";
