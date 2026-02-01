// BSIF Reference Implementation - Validator Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { validate } from "../src/validator.js";
import { ErrorCode } from "../src/errors.js";

describe("Validator", () => {
	describe("validate", () => {
		it("accepts valid BSIF document", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
		});

		it("rejects document with invalid initial state", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-initial.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 1);
			assert.strictEqual(result.errors[0].code, ErrorCode.InitialStateMissing);
		});

		it("rejects document with invalid bsif_version", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-version.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 1);
			assert.strictEqual(result.errors[0].code, ErrorCode.InvalidFieldValue);
		});
	});
});
