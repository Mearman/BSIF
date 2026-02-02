// BSIF Reference Implementation - Registry File Storage

import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { RegistryEntry, RegistrySearchResult } from "./types.js";

export class FileStorage {
	private readonly basePath: string;

	constructor(basePath: string) {
		this.basePath = basePath;
	}

	async init(): Promise<void> {
		await mkdir(this.basePath, { recursive: true });
		await mkdir(join(this.basePath, "specs"), { recursive: true });
		await mkdir(join(this.basePath, "index"), { recursive: true });
	}

	async store(name: string, version: string | undefined, content: string, entry: RegistryEntry): Promise<void> {
		if (!version) version = "0.0.0";
		const specDir = join(this.basePath, "specs", name);
		await mkdir(specDir, { recursive: true });
		await writeFile(join(specDir, `${version}.json`), content, "utf-8");

		// Update index
		const indexPath = join(this.basePath, "index", `${name}.json`);
		const existing = await this.readIndex(name);
		const entries = existing.filter((e) => e.version !== version);
		entries.push(entry);
		await writeFile(indexPath, JSON.stringify(entries, null, 2), "utf-8");
	}

	async fetch(name: string, version?: string): Promise<string | null> {
		if (!version) {
			version = await this.latestVersion(name);
			if (!version) return null;
		}
		const specPath = join(this.basePath, "specs", name, `${version}.json`);
		try {
			return await readFile(specPath, "utf-8");
		} catch {
			return null;
		}
	}

	async versions(name: string): Promise<readonly string[]> {
		const entries = await this.readIndex(name);
		return entries.map((e) => e.version);
	}

	async search(query: string): Promise<RegistrySearchResult> {
		const indexDir = join(this.basePath, "index");
		let files: string[];
		try {
			files = await readdir(indexDir);
		} catch {
			return { entries: [], total: 0 };
		}

		const allEntries: RegistryEntry[] = [];
		const lowerQuery = query.toLowerCase();

		for (const file of files) {
			if (!file.endsWith(".json")) continue;
			try {
				const content = await readFile(join(indexDir, file), "utf-8");
				const entries: RegistryEntry[] = JSON.parse(content) as RegistryEntry[];
				for (const entry of entries) {
					if (
						entry.name.toLowerCase().includes(lowerQuery) ||
						(entry.description && entry.description.toLowerCase().includes(lowerQuery))
					) {
						allEntries.push(entry);
					}
				}
			} catch {
				// Skip malformed index files
			}
		}

		return { entries: allEntries, total: allEntries.length };
	}

	private async readIndex(name: string): Promise<RegistryEntry[]> {
		const indexPath = join(this.basePath, "index", `${name}.json`);
		try {
			const content = await readFile(indexPath, "utf-8");
			return JSON.parse(content) as RegistryEntry[];
		} catch {
			return [];
		}
	}

	private async latestVersion(name: string): Promise<string | undefined> {
		const entries = await this.readIndex(name);
		if (entries.length === 0) return undefined;
		// Sort by publishedAt descending
		entries.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
		const latest = entries[0];
		return latest ? latest.version : undefined;
	}
}
