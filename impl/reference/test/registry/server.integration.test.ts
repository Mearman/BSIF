// BSIF Reference Implementation - Registry Server Integration Tests

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RegistryServer } from "../../src/registry/server.js";
import { HttpRegistryClient } from "../../src/registry/client.js";
import type { BSIFDocument } from "../../src/schemas.js";

const sampleDoc: BSIFDocument = {
	metadata: {
		bsif_version: "1.0.0",
		name: "test-spec",
		version: "1.0.0",
		description: "A test spec for registry",
	},
	semantics: {
		type: "state-machine",
		states: [{ name: "idle" }, { name: "active" }],
		transitions: [{ from: "idle", to: "active", event: "start" }],
		initial: "idle",
	},
};

describe("Registry Server", () => {
	let server: RegistryServer;
	let client: HttpRegistryClient;
	let storagePath: string;
	let port: number;

	before(async () => {
		storagePath = await mkdtemp(join(tmpdir(), "bsif-registry-test-"));
		// Use a high random port to avoid conflicts
		port = 30000 + Math.floor(Math.random() * 30000);
		server = new RegistryServer({ port, storagePath });
		await server.start();
		client = new HttpRegistryClient(`http://127.0.0.1:${port}`);
	});

	after(async () => {
		await server.stop();
		await rm(storagePath, { recursive: true, force: true });
	});

	it("publishes and fetches a spec", async () => {
		await client.publish(sampleDoc);
		const fetched = await client.fetch("test-spec", "1.0.0");
		assert.strictEqual(fetched.metadata.name, "test-spec");
		assert.strictEqual(fetched.metadata.version, "1.0.0");
	});

	it("fetches latest version when no version specified", async () => {
		const fetched = await client.fetch("test-spec");
		assert.strictEqual(fetched.metadata.name, "test-spec");
	});

	it("returns versions", async () => {
		const versions = await client.versions("test-spec");
		assert.ok(versions.includes("1.0.0"));
	});

	it("searches specs", async () => {
		const result = await client.search("test");
		assert.ok(result.entries.length > 0);
		assert.strictEqual(result.entries[0].name, "test-spec");
	});

	it("returns 404 for unknown spec", async () => {
		await assert.rejects(
			() => client.fetch("nonexistent-spec"),
			(err: Error) => err.message.includes("404"),
		);
	});

	it("rejects invalid BSIF document", async () => {
		await assert.rejects(
			() => client.publish({ invalid: true } as never),
			(err: Error) => err.message.includes("400"),
		);
	});

	it("publishes a second version and lists both", async () => {
		const v2: BSIFDocument = {
			...sampleDoc,
			metadata: { ...sampleDoc.metadata, version: "2.0.0" },
		};
		await client.publish(v2);
		const versions = await client.versions("test-spec");
		assert.ok(versions.includes("1.0.0"));
		assert.ok(versions.includes("2.0.0"));
	});
});
