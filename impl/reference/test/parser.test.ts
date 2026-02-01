// BSIF Reference Implementation - Parser Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { parseFile, parseContent } from "../src/parser.js";
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
});
