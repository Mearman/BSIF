// BSIF Reference Implementation - Parser Enhancement Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { suggestCorrection, parseFileIncremental } from "../src/parser.js";
import type { IncrementalParseOptions } from "../src/parser.js";

describe("suggestCorrection", () => {
	it("suggests removing trailing comma", () => {
		const content = '{"metadata": {"bsif_version": "1.0.0",}, "semantics": {}}';
		const result = suggestCorrection(new Error("parse error"), content);
		assert.strictEqual(result, "Remove trailing comma before closing bracket");
	});

	it("suggests wrapping key in double quotes", () => {
		const content = "{ name: \"test\" }";
		const result = suggestCorrection(new Error("parse error"), content);
		assert.strictEqual(result, "Wrap key in double quotes");
	});

	it("suggests adding comma between properties", () => {
		const content = '{\n  "name": "test"\n  "version": "1.0.0"\n}';
		const result = suggestCorrection(new Error("parse error"), content);
		assert.strictEqual(result, "Add comma between properties");
	});

	it("suggests correction for metdata typo", () => {
		const content = '{"metdata": {"bsif_version": "1.0.0"}}';
		const result = suggestCorrection(new Error("parse error"), content);
		assert.strictEqual(result, 'Did you mean "metadata"?');
	});

	it("suggests correction for semnatics typo", () => {
		const content = '{"metadata": {}, "semnatics": {}}';
		const result = suggestCorrection(new Error("parse error"), content);
		assert.strictEqual(result, 'Did you mean "semantics"?');
	});

	it("suggests correction for bsif_verion typo", () => {
		const content = '{"metadata": {"bsif_verion": "1.0.0"}}';
		const result = suggestCorrection(new Error("parse error"), content);
		assert.strictEqual(result, 'Did you mean "bsif_version"?');
	});

	it("returns undefined when no suggestion matches", () => {
		const content = '{"metadata": {"bsif_version": "1.0.0"}, "semantics": {}}';
		const result = suggestCorrection(new Error("some error"), content);
		assert.strictEqual(result, undefined);
	});

	it("works with ValidationError-like objects", () => {
		const error = { code: "E005", severity: "error", message: "Invalid JSON" };
		const content = '{"metadata": {"bsif_version": "1.0.0",}}';
		const result = suggestCorrection(error, content);
		assert.strictEqual(result, "Remove trailing comma before closing bracket");
	});
});

describe("parseFileIncremental", () => {
	it("parses a valid file successfully", async () => {
		const fixturePath = join(import.meta.dirname, "fixtures", "valid.bsif.json");
		const doc = await parseFileIncremental(fixturePath);
		assert.strictEqual(doc.metadata.name, "test-spec");
	});

	it("throws when signal is already aborted", async () => {
		const fixturePath = join(import.meta.dirname, "fixtures", "valid.bsif.json");
		const controller = new AbortController();
		controller.abort();

		await assert.rejects(
			() => parseFileIncremental(fixturePath, { signal: controller.signal }),
			{ message: "Parse aborted" },
		);
	});

	it("calls onProgress with file size", async () => {
		const fixturePath = join(import.meta.dirname, "fixtures", "valid.bsif.json");
		let progressCalled = false;
		let reportedBytesRead = 0;
		let reportedTotalBytes = 0;

		const options: IncrementalParseOptions = {
			onProgress: (bytesRead: number, totalBytes: number) => {
				progressCalled = true;
				reportedBytesRead = bytesRead;
				reportedTotalBytes = totalBytes;
			},
		};

		await parseFileIncremental(fixturePath, options);

		assert.strictEqual(progressCalled, true);
		assert.ok(reportedBytesRead > 0);
		assert.strictEqual(reportedBytesRead, reportedTotalBytes);
	});

	it("accepts options with limits", async () => {
		const fixturePath = join(import.meta.dirname, "fixtures", "valid.bsif.json");
		const doc = await parseFileIncremental(fixturePath, {
			limits: { maxDocumentSize: 100_000 },
		});
		assert.strictEqual(doc.metadata.name, "test-spec");
	});
});

describe("ParseOptions compatibilityMode", () => {
	it("accepts compatibilityMode in options without error", async () => {
		const fixturePath = join(import.meta.dirname, "fixtures", "valid.bsif.json");
		const doc = await parseFileIncremental(fixturePath, {
			compatibilityMode: true,
		});
		assert.strictEqual(doc.metadata.name, "test-spec");
	});
});
