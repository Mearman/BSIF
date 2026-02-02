// BSIF Reference Implementation - TypeScript Generator Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { TypeScriptGenerator } from "../../src/generators/targets/typescript.js";
import { constraintToTypeScript } from "../../src/generators/expression-evaluator.js";
import type { BSIFDocument } from "../../src/schemas.js";

describe("TypeScript Generator", () => {
	const generator = new TypeScriptGenerator("vitest");

	it("generates state machine tests", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "test-sm", version: "1.0.0", description: "Test" },
			semantics: {
				type: "state-machine",
				states: [{ name: "idle" }, { name: "active" }],
				transitions: [{ from: "idle", to: "active", event: "start" }],
				initial: "idle",
				final: ["active"],
			},
		};

		const suite = generator.generate(doc);
		assert.strictEqual(suite.files.size, 1);
		assert.ok(suite.files.has("test-sm.state-machine.test.ts"));
		const content = suite.files.get("test-sm.state-machine.test.ts")!;
		assert.ok(content.includes("describe("));
		assert.ok(content.includes("idle"));
		assert.ok(content.includes("active"));
		assert.ok(suite.dependencies.includes("vitest"));
	});

	it("generates temporal property tests", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "test-temporal", version: "1.0.0", description: "Test" },
			semantics: {
				type: "temporal",
				logic: "ltl",
				variables: { x: "boolean" },
				properties: [{ name: "always-x", formula: { operator: "globally", operand: { operator: "variable", variable: "x" } } }],
			},
		};

		const suite = generator.generate(doc);
		assert.strictEqual(suite.files.size, 1);
		const content = [...suite.files.values()][0]!;
		assert.ok(content.includes("always-x"));
		assert.ok(suite.dependencies.includes("fast-check"));
	});

	it("generates constraint tests", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "test-constraints", version: "1.0.0", description: "Test" },
			semantics: {
				type: "constraints",
				target: { function: "push" },
				preconditions: [{ description: "not full", expression: "size < capacity" }],
				postconditions: [{ description: "size increases", expression: "size == old.size + 1" }],
			},
		};

		const suite = generator.generate(doc);
		assert.strictEqual(suite.files.size, 1);
		const content = [...suite.files.values()][0]!;
		assert.ok(content.includes("precondition"));
		assert.ok(content.includes("postcondition"));
		assert.ok(!content.includes("TODO"), "Generated constraints should not contain TODO placeholders");
	});

	it("generates event handler tests", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "test-events", version: "1.0.0", description: "Test" },
			semantics: {
				type: "events",
				events: { click: {}, hover: {} },
				handlers: [{ event: "click", action: "handleClick()" }],
			},
		};

		const suite = generator.generate(doc);
		assert.strictEqual(suite.files.size, 1);
		const content = [...suite.files.values()][0]!;
		assert.ok(content.includes("click"));
	});

	it("generates interaction tests", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "test-interaction", version: "1.0.0", description: "Test" },
			semantics: {
				type: "interaction",
				participants: [{ name: "client" }, { name: "server" }],
				messages: [{ from: "client", to: "server", message: "request" }],
			},
		};

		const suite = generator.generate(doc);
		assert.strictEqual(suite.files.size, 1);
		const content = [...suite.files.values()][0]!;
		assert.ok(content.includes("client"));
		assert.ok(content.includes("server"));
	});

	it("uses jest when framework is jest", () => {
		const jestGen = new TypeScriptGenerator("jest");
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "test-sm", version: "1.0.0", description: "Test" },
			semantics: {
				type: "state-machine",
				states: [{ name: "idle" }],
				transitions: [],
				initial: "idle",
			},
		};

		const suite = jestGen.generate(doc);
		assert.ok(suite.dependencies.includes("jest"));
	});
});

describe("constraint expression evaluation", () => {
	it("generates assertion for comparison expression", () => {
		const result = constraintToTypeScript("x > 0", "pre");
		assert.ok(result.includes("expect"));
		assert.ok(result.includes("toBeGreaterThan"));
		assert.ok(!result.includes("TODO"));
	});

	it("generates old. reference assertion for postcondition", () => {
		const result = constraintToTypeScript("size == old.size + 1", "post");
		assert.ok(result.includes("oldState"));
		assert.ok(!result.includes("TODO"));
	});

	it("generates descriptive comment for unsupported expression", () => {
		const result = constraintToTypeScript("forall x in items: x.valid()", "pre");
		assert.ok(result.includes("Constraint:"));
		assert.ok(result.includes("requires manual"));
		assert.ok(!result.includes("TODO"));
	});
});
