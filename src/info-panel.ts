/**
 * Info panel data discovery for pi-welcome-screen.
 * Scans filesystem to discover loaded extensions, skills, context files, and sessions.
 */

import { readdirSync, existsSync, statSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir as osHomedir } from "node:os";

import type { LoadedCounts, RecentSession, InfoPanelData } from "./types.js";

// ─── Logging ──────────────────────────────────────────────────────────────────

const loggedErrors = new Set<string>();

function logError(scope: string, error: unknown): void {
	const message = error instanceof Error ? error.message : String(error);
	const key = `${scope}:${message}`;
	if (loggedErrors.has(key)) return;

	loggedErrors.add(key);
	if (loggedErrors.size > 500) loggedErrors.clear();

	console.debug(`[pi-welcome-screen] ${scope}:`, error);
}

// ─── Loaded Counts Discovery ───────────────────────────────────────────────────

/**
 * Discover loaded counts by scanning filesystem.
 */
export function discoverLoadedCounts(): LoadedCounts {
	const homeDir = process.env.HOME || process.env.USERPROFILE || osHomedir();
	const cwd = process.cwd();

	let contextFiles = 0;
	let extensions = 0;
	let skills = 0;
	let promptTemplates = 0;

	// Scan for context files (AGENTS.md)
	const agentsMdPaths = [
		join(homeDir, ".pi", "agent", "AGENTS.md"),
		join(homeDir, ".claude", "AGENTS.md"),
		join(cwd, "AGENTS.md"),
		join(cwd, ".pi", "AGENTS.md"),
		join(cwd, ".claude", "AGENTS.md"),
	];

	for (const path of agentsMdPaths) {
		if (existsSync(path)) contextFiles++;
	}

	// Count extensions from settings.json
	const extensionDirs = [
		join(homeDir, ".pi", "agent", "extensions"),
		join(cwd, "extensions"),
		join(cwd, ".pi", "extensions"),
	];

	const countedExtensions = new Set<string>();

	const settingsPaths = [
		join(homeDir, ".pi", "agent", "settings.json"),
		join(cwd, ".pi", "settings.json"),
	];

	for (const settingsPath of settingsPaths) {
		if (!existsSync(settingsPath)) continue;

		try {
			const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
			let packages: unknown = null;
			if (
				typeof settings === "object" &&
				settings !== null &&
				!Array.isArray(settings)
			) {
				packages = (settings as { packages?: unknown }).packages;
			}

			if (Array.isArray(packages)) {
				for (const pkg of packages) {
					let source: unknown = null;
					let extensionsFilter: unknown = null;

					if (typeof pkg === "string") {
						source = pkg;
					} else if (typeof pkg === "object" && pkg !== null) {
						source = (pkg as { source?: unknown }).source;
						extensionsFilter = (pkg as { extensions?: unknown }).extensions;
					}

					if (typeof source !== "string") continue;

					const normalizedSource = source.trim();
					if (!normalizedSource.startsWith("npm:")) continue;

					if (Array.isArray(extensionsFilter) && extensionsFilter.length === 0)
						continue;

					const body = normalizedSource.slice(4);
					const versionIndex = body.lastIndexOf("@");
					const name = versionIndex > 0 ? body.slice(0, versionIndex) : body;
					if (!name || countedExtensions.has(name)) continue;

					countedExtensions.add(name);
					extensions++;
				}
			}
		} catch (error) {
			logError(`Failed to read settings at ${settingsPath}`, error);
		}
	}

	// Scan extension directories
	for (const dir of extensionDirs) {
		if (!existsSync(dir)) continue;
		try {
			const entries = readdirSync(dir);
			for (const entry of entries) {
				const entryPath = join(dir, entry);
				try {
					const stats = statSync(entryPath);
					if (stats.isDirectory()) {
						if (
							existsSync(join(entryPath, "index.ts")) ||
							existsSync(join(entryPath, "index.js")) ||
							existsSync(join(entryPath, "package.json"))
						) {
							if (!countedExtensions.has(entry)) {
								countedExtensions.add(entry);
								extensions++;
							}
						}
					} else if (
						(entry.endsWith(".ts") || entry.endsWith(".js")) &&
						!entry.startsWith(".")
					) {
						const ext = entry.endsWith(".ts") ? ".ts" : ".js";
						const name = basename(entry, ext);
						if (!countedExtensions.has(name)) {
							countedExtensions.add(name);
							extensions++;
						}
					}
				} catch (error) {
					logError(`Failed to inspect extension entry ${entryPath}`, error);
				}
			}
		} catch (error) {
			logError(`Failed to scan extensions dir ${dir}`, error);
		}
	}

	// Scan skills directories
	const skillDirs = [
		join(homeDir, ".pi", "agent", "skills"),
		join(cwd, ".pi", "skills"),
		join(cwd, "skills"),
	];

	const countedSkills = new Set<string>();

	for (const dir of skillDirs) {
		if (!existsSync(dir)) continue;
		try {
			const entries = readdirSync(dir);
			for (const entry of entries) {
				const entryPath = join(dir, entry);
				try {
					if (statSync(entryPath).isDirectory()) {
						if (existsSync(join(entryPath, "SKILL.md"))) {
							if (!countedSkills.has(entry)) {
								countedSkills.add(entry);
								skills++;
							}
						}
					}
				} catch (error) {
					logError(`Failed to inspect skill entry ${entryPath}`, error);
				}
			}
		} catch (error) {
			logError(`Failed to scan skills dir ${dir}`, error);
		}
	}

	// Scan prompt templates
	const templateDirs = [
		join(homeDir, ".pi", "agent", "commands"),
		join(homeDir, ".claude", "commands"),
		join(cwd, ".pi", "commands"),
		join(cwd, ".claude", "commands"),
	];

	const countedTemplates = new Set<string>();

	function countTemplatesInDir(dir: string): void {
		if (!existsSync(dir)) return;
		try {
			const entries = readdirSync(dir);
			for (const entry of entries) {
				const entryPath = join(dir, entry);
				try {
					const stats = statSync(entryPath);
					if (stats.isDirectory()) {
						countTemplatesInDir(entryPath);
					} else if (entry.endsWith(".md")) {
						const name = basename(entry, ".md");
						if (!countedTemplates.has(name)) {
							countedTemplates.add(name);
							promptTemplates++;
						}
					}
				} catch (error) {
					logError(`Failed to inspect template entry ${entryPath}`, error);
				}
			}
		} catch (error) {
			logError(`Failed to scan template dir ${dir}`, error);
		}
	}

	for (const dir of templateDirs) {
		countTemplatesInDir(dir);
	}

	return { contextFiles, extensions, skills, promptTemplates };
}

// ─── Recent Sessions Discovery ────────────────────────────────────────────────

/**
 * Get recent sessions from the sessions directory.
 */
export function getRecentSessions(maxCount: number = 3): RecentSession[] {
	const homeDir = process.env.HOME || process.env.USERPROFILE || osHomedir();

	const sessionsDirs = [
		join(homeDir, ".pi", "agent", "sessions"),
		join(homeDir, ".pi", "sessions"),
	];

	const sessions: { name: string; mtime: number }[] = [];

	function scanDir(dir: string): void {
		if (!existsSync(dir)) return;
		try {
			const entries = readdirSync(dir);
			for (const entry of entries) {
				const entryPath = join(dir, entry);
				try {
					const stats = statSync(entryPath);
					if (stats.isDirectory()) {
						scanDir(entryPath);
					} else if (entry.endsWith(".jsonl")) {
						const parentName = basename(dir);
						let projectName = parentName;
						if (parentName.startsWith("--")) {
							const parts = parentName.split("-").filter((p) => p);
							projectName = parts[parts.length - 1] || parentName;
						}
						sessions.push({ name: projectName, mtime: stats.mtimeMs });
					}
				} catch (error) {
					logError(`Failed to inspect session entry ${entryPath}`, error);
				}
			}
		} catch (error) {
			logError(`Failed to scan sessions dir ${dir}`, error);
		}
	}

	for (const sessionsDir of sessionsDirs) {
		scanDir(sessionsDir);
	}

	if (sessions.length === 0) return [];

	sessions.sort((a, b) => b.mtime - a.mtime);

	const seen = new Set<string>();
	const uniqueSessions: typeof sessions = [];
	for (const s of sessions) {
		if (!seen.has(s.name)) {
			seen.add(s.name);
			uniqueSessions.push(s);
		}
	}

	const now = Date.now();
	return uniqueSessions.slice(0, maxCount).map((s) => ({
		name: s.name.length > 20 ? s.name.slice(0, 17) + "…" : s.name,
		timeAgo: formatTimeAgo(now - s.mtime),
	}));
}

function formatTimeAgo(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	if (minutes > 0) return `${minutes}m ago`;
	return "just now";
}

// ─── Default Info Panel Data ───────────────────────────────────────────────────

const defaultInfoPanelData: InfoPanelData = {
	modelName: "pi agent",
	providerName: "pi",
	recentSessions: [],
	loadedCounts: {
		contextFiles: 0,
		extensions: 0,
		skills: 0,
		promptTemplates: 0,
	},
};

/**
 * Get all info panel data, discovering counts and sessions.
 */
export function getInfoPanelData(
	modelName: string,
	providerName: string,
): InfoPanelData {
	return {
		modelName: modelName || defaultInfoPanelData.modelName,
		providerName: providerName || defaultInfoPanelData.providerName,
		recentSessions: getRecentSessions(3),
		loadedCounts: discoverLoadedCounts(),
	};
}
