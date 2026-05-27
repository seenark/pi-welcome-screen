/**
 * WelcomeScreen — DEPRECATED
 *
 * This file is kept for backwards compatibility but is no longer used.
 * The welcome screen is now shown as an overlay (WelcomeOverlay) instead of
 * a header component.
 *
 * @deprecated Use WelcomeOverlay.ts for the current implementation
 */

// Re-export WelcomeOverlay for any consumers that might import from here
export { WelcomeOverlay } from "./WelcomeOverlay.js";
export type {
	WelcomeConfig,
	AnimationStyle,
	BorderStyle,
} from "./types.js";
