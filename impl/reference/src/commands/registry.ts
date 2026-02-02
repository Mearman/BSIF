// BSIF Reference Implementation - Registry CLI Commands

import { readFile } from "node:fs/promises";
import { HttpRegistryClient } from "../registry/client.js";

const DEFAULT_REGISTRY_URL = "http://127.0.0.1:8642";

function getRegistryUrl(values: Record<string, unknown>): string {
	return typeof values.registry === "string" ? values.registry : DEFAULT_REGISTRY_URL;
}

export async function registryPublishCommand(filePath: string, values: Record<string, unknown>): Promise<number> {
	const client = new HttpRegistryClient(getRegistryUrl(values));
	const content = await readFile(filePath, "utf-8");
	const doc = JSON.parse(content) as Record<string, unknown>;
	await client.publish(doc as never);
	console.log(`Published ${filePath} to registry`);
	return 0;
}

export async function registryFetchCommand(name: string, values: Record<string, unknown>): Promise<number> {
	const client = new HttpRegistryClient(getRegistryUrl(values));
	const version = typeof values.version === "string" ? values.version : undefined;
	const doc = await client.fetch(name, version);
	console.log(JSON.stringify(doc, null, 2));
	return 0;
}

export async function registrySearchCommand(query: string, values: Record<string, unknown>): Promise<number> {
	const client = new HttpRegistryClient(getRegistryUrl(values));
	const result = await client.search(query);
	if (result.entries.length === 0) {
		console.log("No results found.");
		return 0;
	}
	for (const entry of result.entries) {
		console.log(`${entry.name}@${entry.version} — ${entry.description ?? "(no description)"}`);
	}
	return 0;
}
