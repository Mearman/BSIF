// BSIF Reference Implementation - Linter Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { lint } from "../src/linter.js";
import { ErrorCode } from "../src/errors.js";
import type { BSIFDocument } from "../src/schemas.js";

function makeDoc(overrides: Partial<BSIFDocument> = {}): BSIFDocument {
	return {
		metadata: {
			bsif_version: "1.0.0",
			name: "test-spec",
			version: "1.0.0",
			description: "Test specification",
		},
		semantics: {
			type: "state-machine",
			states: [{ name: "idle" }, { name: "active" }],
			transitions: [{ from: "idle", to: "active", event: "start" }],
			initial: "idle",
			final: ["active"],
		},
		...overrides,
	} as BSIFDocument;
}

describe("Linter", () => {
	it("passes clean document with no warnings", () => {
		const doc = makeDoc();
		const errors = lint(doc);
		assert.strictEqual(errors.length, 0);
	});

	it("warns on missing description", () => {
		const doc = makeDoc({
			metadata: { bsif_version: "1.0.0", name: "test-spec", version: "1.0.0" },
		});
		const errors = lint(doc);
		const descErrors = errors.filter((e) => e.code === ErrorCode.LintMissingDescription);
		assert.ok(descErrors.length > 0);
	});

	it("warns on missing version", () => {
		const doc = makeDoc({
			metadata: { bsif_version: "1.0.0", name: "test-spec", description: "Test" },
		});
		const errors = lint(doc);
		const verErrors = errors.filter((e) => e.code === ErrorCode.LintMissingVersion);
		assert.ok(verErrors.length > 0);
	});

	it("warns on non-kebab-case spec name", () => {
		const doc = makeDoc({
			metadata: { bsif_version: "1.0.0", name: "TestSpec", version: "1.0.0", description: "Test" },
		});
		const errors = lint(doc);
		const nameErrors = errors.filter((e) => e.code === ErrorCode.LintNamingConvention);
		assert.ok(nameErrors.length > 0);
	});

	it("warns on state machine with no final states", () => {
		const doc = makeDoc({
			semantics: {
				type: "state-machine",
				states: [{ name: "idle" }],
				transitions: [],
				initial: "idle",
			},
		});
		const errors = lint(doc);
		const finalErrors = errors.filter((e) => e.code === ErrorCode.LintNoFinalStates);
		assert.ok(finalErrors.length > 0);
	});

	it("warns on empty tool mappings", () => {
		const doc = makeDoc();
		(doc as any).tools = { "my-tool": {} };
		const errors = lint(doc);
		const toolErrors = errors.filter((e) => e.code === ErrorCode.LintEmptyToolMapping);
		assert.ok(toolErrors.length > 0);
	});

	it("warns on unused event declarations", () => {
		const doc = makeDoc({
			semantics: {
				type: "events",
				events: { click: {}, hover: {} },
				handlers: [{ event: "click", action: "handle()" }],
			},
		});
		const errors = lint(doc);
		const unusedErrors = errors.filter((e) => e.code === ErrorCode.LintUnusedEvent);
		assert.ok(unusedErrors.length > 0);
	});

	it("respects strict mode for nesting depth", () => {
		const doc = makeDoc();
		const errorsNormal = lint(doc);
		const errorsStrict = lint(doc, { strict: true });
		// Both should pass for a simple doc
		assert.strictEqual(errorsNormal.filter((e) => e.code === ErrorCode.LintDeepNesting).length, 0);
		assert.strictEqual(errorsStrict.filter((e) => e.code === ErrorCode.LintDeepNesting).length, 0);
	});
});
