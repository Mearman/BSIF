// BSIF Reference Implementation - Registry Client/Storage Unit Tests

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileStorage } from "../../src/registry/storage.js";
import type { RegistryEntry } from "../../src/registry/types.js";

describe("FileStorage", () => {
	let storage: FileStorage;
	let storagePath: string;

	before(async () => {
		storagePath = await mkdtemp(join(tmpdir(), "bsif-storage-test-"));
		storage = new FileStorage(storagePath);
		await storage.init();
	});

	after(async () => {
		await rm(storagePath, { recursive: true, force: true });
	});

	it("stores and fetches a spec", async () => {
		const content = JSON.stringify({ metadata: { name: "my-spec" } });
		const entry: RegistryEntry = {
			name: "my-spec",
			version: "1.0.0",
			publishedAt: new Date().toISOString(),
		};
		await storage.store("my-spec", "1.0.0", content, entry);
		const fetched = await storage.fetch("my-spec", "1.0.0");
		assert.strictEqual(fetched, content);
	});

	it("returns null for nonexistent spec", async () => {
		const fetched = await storage.fetch("nonexistent");
		assert.strictEqual(fetched, null);
	});

	it("lists versions", async () => {
		const versions = await storage.versions("my-spec");
		assert.deepStrictEqual([...versions], ["1.0.0"]);
	});

	it("searches by name", async () => {
		const result = await storage.search("my");
		assert.strictEqual(result.entries.length, 1);
		assert.strictEqual(result.entries[0].name, "my-spec");
	});

	it("search returns empty for no matches", async () => {
		const result = await storage.search("zzz-no-match");
		assert.strictEqual(result.entries.length, 0);
	});

	it("stores multiple versions", async () => {
		const content2 = JSON.stringify({ metadata: { name: "my-spec", version: "2.0.0" } });
		const entry2: RegistryEntry = {
			name: "my-spec",
			version: "2.0.0",
			publishedAt: new Date().toISOString(),
		};
		await storage.store("my-spec", "2.0.0", content2, entry2);
		const versions = await storage.versions("my-spec");
		assert.ok(versions.includes("1.0.0"));
		assert.ok(versions.includes("2.0.0"));
	});

	it("fetches latest version when no version given", async () => {
		const fetched = await storage.fetch("my-spec");
		assert.ok(fetched !== null);
	});
});
