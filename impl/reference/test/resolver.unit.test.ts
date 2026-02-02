// BSIF Reference Implementation - Resolver Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { resolveReferences, validateComposition } from "../src/resolver.js";
import { parseContent } from "../src/parser.js";
import { ErrorCode } from "../src/errors.js";

const fixtureDir = join(import.meta.dirname, "fixtures", "composition");

function loadFixture(name: string) {
	const path = join(fixtureDir, name);
	const content = readFileSync(path, "utf-8");
	return parseContent(content, path);
}

describe("Resolver", () => {
	describe("resolveReferences", () => {
		it("resolves document with no references", async () => {
			const doc = loadFixture("base.bsif.json");
			const resolved = await resolveReferences(doc, { basePath: fixtureDir });

			assert.strictEqual(resolved.references.size, 0);
			assert.strictEqual(resolved.document.metadata.name, "base-spec");
		});

		it("resolves single file:// reference", async () => {
			const doc = loadFixture("dependent.bsif.json");
			const resolved = await resolveReferences(doc, { basePath: fixtureDir });

			assert.strictEqual(resolved.references.size, 1);
			assert.ok(resolved.references.has("base-spec"));
		});

		it("handles circular references without infinite recursion", async () => {
			const doc = loadFixture("circular-a.bsif.json");
			const resolved = await resolveReferences(doc, { basePath: fixtureDir });

			// Should resolve without hanging
			assert.ok(resolved.references.has("circular-b"));
		});

		it("handles missing reference gracefully", async () => {
			const doc = loadFixture("base.bsif.json");
			// Add a fake reference
			const modifiedDoc = {
				...doc,
				metadata: { ...doc.metadata, references: ["file://./nonexistent.bsif.json"] },
			};
			const resolved = await resolveReferences(modifiedDoc as any, { basePath: fixtureDir });

			assert.strictEqual(resolved.references.size, 0);
		});

		it("respects maxDepth", async () => {
			const doc = loadFixture("dependent.bsif.json");
			const resolved = await resolveReferences(doc, { basePath: fixtureDir, maxDepth: 0 });

			// maxDepth 0 means don't resolve anything
			assert.strictEqual(resolved.references.size, 0);
		});

		it("supports custom file reader", async () => {
			const doc = loadFixture("dependent.bsif.json");
			const customReader = async (_path: string) => {
				return JSON.stringify({
					metadata: { bsif_version: "1.0.0", name: "custom-read", version: "1.0.0", description: "From custom reader" },
					semantics: { type: "state-machine", states: [{ name: "idle" }], transitions: [], initial: "idle" },
				});
			};
			const resolved = await resolveReferences(doc, { basePath: fixtureDir, fileReader: customReader });

			assert.strictEqual(resolved.references.size, 1);
			assert.ok(resolved.references.has("custom-read"));
		});
	});

	describe("validateComposition", () => {
		it("validates composition with no errors", async () => {
			const doc = loadFixture("dependent.bsif.json");
			const resolved = await resolveReferences(doc, { basePath: fixtureDir });
			const errors = validateComposition(resolved, doc.metadata.bsif_version);

			assert.strictEqual(errors.filter((e) => e.severity === "error").length, 0);
		});

		it("detects circular composition references", async () => {
			const doc = loadFixture("circular-a.bsif.json");
			const resolved = await resolveReferences(doc, { basePath: fixtureDir });
			const errors = validateComposition(resolved, doc.metadata.bsif_version);

			const circularErrors = errors.filter((e) => e.code === ErrorCode.CircularCompositionReference);
			assert.ok(circularErrors.length > 0, "Expected circular composition reference error");
		});

		it("detects version mismatch", async () => {
			// Create a resolved document with version mismatch inline
			const resolved = {
				document: loadFixture("dependent.bsif.json"),
				references: new Map([
					["version-mismatch", {
						document: { metadata: { bsif_version: "2.0.0", name: "version-mismatch", version: "1.0.0", description: "Mismatch" }, semantics: { type: "state-machine" as const, states: [{ name: "idle" }], transitions: [], initial: "idle" } },
						references: new Map(),
						resolutionPath: ["dependent-spec", "version-mismatch"],
					}],
				]),
				resolutionPath: ["dependent-spec"],
			};
			const errors = validateComposition(resolved as any, "1.0.0");

			const versionErrors = errors.filter((e) => e.code === ErrorCode.ReferenceVersionMismatch);
			assert.ok(versionErrors.length > 0, "Expected version mismatch warning");
		});
	});
});
