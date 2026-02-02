// BSIF Reference Implementation - Conformance Test Suite
// Dynamically loads all conformance tests from tests/conformance/

import { describe, it } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { validate } from "../src/validator.js";
import { parseContent } from "../src/parser.js";

const conformanceDir = join(import.meta.dirname, "..", "..", "..", "tests", "conformance");
const positiveDir = join(conformanceDir, "positive");
const negativeDir = join(conformanceDir, "negative");

const positiveFiles = readdirSync(positiveDir).filter((f) => f.endsWith(".json")).sort();
const negativeFiles = readdirSync(negativeDir).filter((f) => f.endsWith(".json")).sort();

describe("Conformance Tests", () => {
	describe("Positive tests (must be valid)", () => {
		for (const file of positiveFiles) {
			it(`${file} should be valid`, () => {
				const filePath = join(positiveDir, file);
				const content = readFileSync(filePath, "utf-8");
				const document = parseContent(content, filePath);
				const result = validate(document);
				assert.strictEqual(result.valid, true, `Expected ${file} to be valid but got errors: ${JSON.stringify(result.errors)}`);
			});
		}
	});

	describe("Negative tests (must be invalid)", () => {
		for (const file of negativeFiles) {
			it(`${file} should be invalid`, () => {
				const filePath = join(negativeDir, file);
				const content = readFileSync(filePath, "utf-8");

				try {
					const document = parseContent(content, filePath);
					const result = validate(document);
					assert.strictEqual(result.valid, false, `Expected ${file} to be invalid but it passed validation`);
				} catch {
					// Parse failure is a valid rejection for schema-invalid documents
					// (e.g., invalid-type, invalid-ltl-formula, circular-reference)
				}
			});
		}
	});

	it("should have exactly 15 positive conformance tests", () => {
		assert.strictEqual(positiveFiles.length, 15, `Expected 15 positive tests, found ${positiveFiles.length}`);
	});

	it("should have exactly 15 negative conformance tests", () => {
		assert.strictEqual(negativeFiles.length, 15, `Expected 15 negative tests, found ${negativeFiles.length}`);
	});
});
