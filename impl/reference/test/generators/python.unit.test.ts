// BSIF Reference Implementation - Python Generator Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { PythonGenerator } from "../../src/generators/targets/python.js";
import type { BSIFDocument } from "../../src/schemas.js";

describe("Python Generator", () => {
	const generator = new PythonGenerator("pytest");

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
		assert.ok(suite.files.has("test_test_sm_state_machine.py"));
		const content = suite.files.get("test_test_sm_state_machine.py")!;
		assert.ok(content.includes("def test_"));
		assert.ok(content.includes("idle"));
		assert.ok(content.includes("assert"));
		assert.ok(suite.dependencies.includes("pytest"));
	});

	it("generates temporal tests with hypothesis", () => {
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
		assert.ok(content.includes("hypothesis"));
		assert.ok(suite.dependencies.includes("hypothesis"));
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
	});

	it("generates event tests", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "test-events", version: "1.0.0", description: "Test" },
			semantics: {
				type: "events",
				events: { click: {} },
				handlers: [{ event: "click", action: "handle()" }],
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
});
