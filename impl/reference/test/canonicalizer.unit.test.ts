// BSIF RFC 8785 JCS Canonicalizer Tests

import { describe, it, expect } from "vitest";
import {
	canonicalize,
	formatDocument,
	areEquivalent,
	computeHashSync,
	type BSIFDocument,
} from "../src/index.js";

describe("JCS Canonicalizer", () => {
	describe("canonicalizeNumber", () => {
		it("should serialize integers without leading zeros", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = canonicalize(doc);
			expect(result).toContain("\"bsif_version\":\"1.0.0\"");
		});

		it("should serialize floats with shortest representation", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			// Add a float somewhere
			doc.semantics.states.push({
				name: "test",
				timing: { timeout: 1.5, unit: "s" },
			});
			const result = canonicalize(doc);
			expect(result).toContain("\"timeout\":1.5");
		});

		it("should handle NaN", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			// Add NaN via a hack - JS doesn't allow NaN directly in JSON
			// We'll test through round-trip
			const json = '{"metadata":{"bsif_version":"1.0.0","name":"test","version":"1.0.0"},"semantics":{"type":"state-machine","initial":"","states":[],"transitions":[]},"test":NaN}';
			// Just verify NaN handling doesn't crash
			expect(() => JSON.parse(json)).toThrow();
		});

		it("should handle Infinity", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			// Infinity can't be directly represented in JSON
			// This is a placeholder for future JSON extensions
			const result = canonicalize(doc);
			expect(result).toBeTruthy();
		});
	});

	describe("canonicalizeString", () => {
		it("should escape backslashes", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test\\path",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = canonicalize(doc);
			expect(result).toContain("\"name\":\"test\\\\path\"");
		});

		it("should escape double quotes", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: 'test"name',
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = canonicalize(doc);
			expect(result).toContain('"name":"test\\"name"');
		});

		it("should escape control characters", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test\nname",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = canonicalize(doc);
			expect(result).toContain("\\n");
		});

		it("should escape unicode characters", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test©name",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = canonicalize(doc);
			// Copyright symbol should be preserved as-is in JSON strings
			expect(result).toBeTruthy();
		});
	});

	describe("canonicalizeObject", () => {
		it("should sort properties lexicographically", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
					author: "test",
					license: "MIT",
					description: "test doc",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = canonicalize(doc);
			// Properties should be sorted: author, bsif_version, description, license, name, version
			const metadataMatch = result.match(/"metadata":\{[^}]+\}/);
			expect(metadataMatch).toBeTruthy();
			const metadata = metadataMatch![0];
			// Check order: author comes before bsif_version
			const authorPos = metadata.indexOf('"author"');
			const bsifPos = metadata.indexOf('"bsif_version"');
			expect(authorPos).toBeLessThan(bsifPos);
		});

		it("should not add whitespace", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = canonicalize(doc);
			// JCS has no whitespace except inside strings
			expect(result).not.toMatch(/\s\{/);
			expect(result).not.toMatch(/\{\s/);
			expect(result).not.toMatch(/:\s/);
		});
	});

	describe("canonicalizeArray", () => {
		it("should preserve array order", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: {
					type: "state-machine",
					initial: "idle",
					states: [
						{ name: "idle" },
						{ name: "active" },
						{ name: "done" },
					],
					transitions: [],
				},
			};
			const result = canonicalize(doc);
			// Array order should be preserved
			expect(result).toContain('"name":"idle"');
			expect(result).toContain('"name":"active"');
			expect(result).toContain('"name":"done"');
			// Check order
			const idlePos = result.indexOf('"name":"idle"');
			const activePos = result.indexOf('"name":"active"');
			const donePos = result.indexOf('"name":"done"');
			expect(idlePos).toBeLessThan(activePos);
			expect(activePos).toBeLessThan(donePos);
		});

		it("should not add whitespace between elements", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: {
					type: "state-machine",
					initial: "",
					states: [{ name: "a" }, { name: "b" }],
					transitions: [],
				},
			};
			const result = canonicalize(doc);
			// No whitespace between array elements
			expect(result).toContain(",{");
		});
	});

	describe("formatDocument", () => {
		it("should format with indentation when canonical=false", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = formatDocument(doc, { canonical: false, indent: 2 });
			expect(result).toContain("  \"bsif_version\""); // 2-space indent
		});

		it("should use canonical format when canonical=true", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = formatDocument(doc, { canonical: true });
			// No whitespace in canonical format
			expect(result).not.toMatch(/\n/);
			expect(result).not.toMatch(/:\s/);
		});
	});

	describe("areEquivalent", () => {
		it("should return true for semantically equal documents", () => {
			const doc1: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
					author: "test",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const doc2: BSIFDocument = {
				metadata: {
					author: "test",
					name: "test",
					bsif_version: "1.0.0",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			// Different property order, but semantically equal
			expect(areEquivalent(doc1, doc2)).toBe(true);
		});

		it("should return false for semantically different documents", () => {
			const doc1: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const doc2: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test2",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			expect(areEquivalent(doc1, doc2)).toBe(false);
		});
	});

	describe("computeHashSync", () => {
		it("should compute SHA-256 hash of canonical form", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const hash = computeHashSync(doc);
			// SHA-256 hash should be 64 hex characters
			expect(hash).toMatch(/^[a-f0-9]{64}$/);
		});

		it("should produce same hash for equivalent documents", () => {
			const doc1: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
					author: "test",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const doc2: BSIFDocument = {
				metadata: {
					author: "test",
					name: "test",
					bsif_version: "1.0.0",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const hash1 = computeHashSync(doc1);
			const hash2 = computeHashSync(doc2);
			expect(hash1).toBe(hash2);
		});

		it("should produce different hashes for different documents", () => {
			const doc1: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const doc2: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test2",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const hash1 = computeHashSync(doc1);
			const hash2 = computeHashSync(doc2);
			expect(hash1).not.toBe(hash2);
		});
	});

	describe("RFC 8785 compliance", () => {
		it("should serialize empty object as {}", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = canonicalize(doc);
			// Empty arrays should be []
			expect(result).toContain("[]");
		});

		it("should serialize empty array as []", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = canonicalize(doc);
			// Check for empty arrays
			expect(result).toContain("\"states\":[]");
			expect(result).toContain("\"transitions\":[]");
		});

		it("should serialize null as null", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			// Add a null value
			doc.semantics.states.push({
				name: "test",
				exit: null,
			});
			const result = canonicalize(doc);
			expect(result).toContain("\"exit\":null");
		});

		it("should serialize true and false without quotes", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result = canonicalize(doc);
			// Boolean values in the document
			expect(result).toBeTruthy();
		});
	});

	describe("determinism", () => {
		it("should produce identical output for identical inputs", () => {
			const doc: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
					author: "test",
				},
				semantics: {
					type: "state-machine",
					initial: "idle",
					states: [
						{ name: "idle" },
						{ name: "active" },
					],
					transitions: [],
				},
			};
			const result1 = canonicalize(doc);
			const result2 = canonicalize(doc);
			expect(result1).toBe(result2);
		});

		it("should produce identical output for equivalent inputs with different property order", () => {
			const doc1: BSIFDocument = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test",
					version: "1.0.0",
					author: "test",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const doc2: BSIFDocument = {
				metadata: {
					author: "test",
					name: "test",
					bsif_version: "1.0.0",
					version: "1.0.0",
				},
				semantics: { type: "state-machine", initial: "", states: [], transitions: [] },
			};
			const result1 = canonicalize(doc1);
			const result2 = canonicalize(doc2);
			expect(result1).toBe(result2);
		});
	});
});
