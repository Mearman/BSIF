// BSIF Reference Implementation - Parser Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { parseFile, parseContent, parseFileWithValidation } from "../src/parser.js";
import { ErrorCode, formatError, createError } from "../src/errors.js";
import { isBSIFDocument, isStateMachine } from "../src/schemas.js";

describe("Parser", () => {
	describe("parseContent", () => {
		it("parses valid JSON BSIF document", () => {
			const json = JSON.stringify({
				metadata: {
					bsif_version: "1.0.0",
					name: "test-spec",
				},
				semantics: {
					type: "state-machine",
					states: [{ name: "idle" }],
					transitions: [],
					initial: "idle",
				},
			});

			const doc = parseContent(json, "test.bsif.json");

			assert.strictEqual(doc.metadata.name, "test-spec");
			assert.strictEqual(isStateMachine(doc.semantics), true);
			assert.strictEqual(doc.semantics.states.length, 1);
		});

		it("parses valid YAML BSIF document", () => {
			const yaml = `
metadata:
  bsif_version: "1.0.0"
  name: test-spec
semantics:
  type: state-machine
  states:
    - name: idle
  transitions: []
  initial: idle
`;

			const doc = parseContent(yaml, "test.bsif.yaml");

			assert.strictEqual(doc.metadata.name, "test-spec");
			assert.strictEqual(isStateMachine(doc.semantics), true);
		});

		it("throws on invalid JSON", () => {
			assert.throws(
				() => parseContent("{ invalid json }", "test.bsif.json"),
				{ message: /Invalid JSON/ },
			);
		});

		it("throws on unsupported file type", () => {
			assert.throws(
				() => parseContent("{}", "test.bsif.txt"),
				{ message: /Unsupported file type/ },
			);
		});
	});

	describe("parseFile", async () => {
		it("parses valid BSIF file from fixtures", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid.bsif.json");
			const doc = await parseFile(fixturePath);

			assert.strictEqual(doc.metadata.name, "test-spec");
			assert.strictEqual(isBSIFDocument(doc), true);
		});
	});

	describe("parseFileWithValidation", () => {
		it("returns validation result with original error code for invalid files", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-version.bsif.json");
			const result = await parseFileWithValidation(fixturePath);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.length > 0);
			// The error should retain its original code (not be wrapped in ValidationFailed)
			// because isValidationError correctly identifies plain ValidationError objects
			assert.notStrictEqual(result.errors[0]?.code, ErrorCode.ValidationFailed);
		});

		it("returns success for valid files", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid.bsif.json");
			const result = await parseFileWithValidation(fixturePath);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
		});
	});

	describe("parser security limits", () => {
		it("rejects document exceeding size limit", () => {
			const content = JSON.stringify({
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: { type: "state-machine", states: [{ name: "idle" }], transitions: [], initial: "idle" },
			});

			assert.throws(
				() => parseContent(content, "test.json", { maxDocumentSize: 10 }),
				{ message: /exceeds maximum/ },
			);
		});

		it("rejects document exceeding nesting depth", () => {
			// Create a deeply nested object
			let nested: any = { name: "deep" };
			for (let i = 0; i < 40; i++) {
				nested = { wrapper: nested };
			}
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: { type: "state-machine", states: [nested], transitions: [], initial: "idle" },
			};
			const content = JSON.stringify(doc);

			assert.throws(
				() => parseContent(content, "test.json", { maxNestingDepth: 5 }),
				{ message: /nesting depth/ },
			);
		});

		it("rejects document with excessively long string", () => {
			const longString = "a".repeat(100);
			const doc = {
				metadata: { bsif_version: "1.0.0", name: longString },
				semantics: { type: "state-machine", states: [{ name: "idle" }], transitions: [], initial: "idle" },
			};
			const content = JSON.stringify(doc);

			assert.throws(
				() => parseContent(content, "test.json", { maxStringLength: 50 }),
				{ message: /string length/ },
			);
		});

		it("accepts document within default limits", () => {
			const content = JSON.stringify({
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: { type: "state-machine", states: [{ name: "idle" }], transitions: [], initial: "idle" },
			});

			const doc = parseContent(content, "test.json");
			assert.strictEqual(doc.metadata.name, "test");
		});
	});

	describe("formatError with file", () => {
		it("includes file in formatted output", () => {
			const error = {
				code: ErrorCode.InvalidFieldValue,
				severity: "error" as const,
				message: "test error",
				file: "/path/to/file.json",
				line: 10,
				column: 5,
			};

			const formatted = formatError(error);
			assert.ok(formatted.includes("/path/to/file.json"));
		});
	});
});
