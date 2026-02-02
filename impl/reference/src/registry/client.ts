// BSIF Reference Implementation - Registry Client

import type { BSIFDocument } from "../schemas.js";
import type { RegistrySearchResult } from "./types.js";

export interface RegistryClient {
	publish(doc: BSIFDocument): Promise<void>;
	fetch(name: string, version?: string): Promise<BSIFDocument>;
	search(query: string): Promise<RegistrySearchResult>;
	versions(name: string): Promise<readonly string[]>;
}

export class HttpRegistryClient implements RegistryClient {
	private readonly baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.replace(/\/$/, "");
	}

	async publish(doc: BSIFDocument): Promise<void> {
		const response = await fetch(`${this.baseUrl}/specs`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(doc),
		});
		if (!response.ok) {
			const text = await response.text();
			throw new Error(`Registry publish failed (${response.status}): ${text}`);
		}
	}

	async fetch(name: string, version?: string): Promise<BSIFDocument> {
		const url = version
			? `${this.baseUrl}/specs/${encodeURIComponent(name)}/${encodeURIComponent(version)}`
			: `${this.baseUrl}/specs/${encodeURIComponent(name)}`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Registry fetch failed (${response.status}): ${name}${version ? `@${version}` : ""}`);
		}
		return (await response.json()) as BSIFDocument;
	}

	async search(query: string): Promise<RegistrySearchResult> {
		const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
		if (!response.ok) {
			throw new Error(`Registry search failed (${response.status})`);
		}
		return (await response.json()) as RegistrySearchResult;
	}

	async versions(name: string): Promise<readonly string[]> {
		const response = await fetch(`${this.baseUrl}/specs/${encodeURIComponent(name)}/versions`);
		if (!response.ok) {
			throw new Error(`Registry versions failed (${response.status}): ${name}`);
		}
		return (await response.json()) as string[];
	}
}
