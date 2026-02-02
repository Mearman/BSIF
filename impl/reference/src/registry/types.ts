// BSIF Reference Implementation - Registry Types

export interface RegistryEntry {
	readonly name: string;
	readonly version: string;
	readonly description?: string;
	readonly author?: string;
	readonly publishedAt: string;
}

export interface RegistrySearchResult {
	readonly entries: readonly RegistryEntry[];
	readonly total: number;
}
