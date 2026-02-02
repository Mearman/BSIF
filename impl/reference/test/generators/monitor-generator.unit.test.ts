// BSIF Reference Implementation - Monitor Generator Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { generateMonitor } from "../../src/generators/monitor-generator.js";
import type { BSIFDocument } from "../../src/schemas.js";

describe("Monitor Generator", () => {
	it("generates state machine monitor", () => {
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

		const monitor = generateMonitor(doc);
		assert.strictEqual(monitor.files.size, 1);
		assert.ok(monitor.files.has("test-sm-monitor.ts"));
		const content = monitor.files.get("test-sm-monitor.ts")!;
		assert.ok(content.includes("class TestSmMonitor"));
		assert.ok(content.includes("send(event: string)"));
		assert.ok(content.includes("idle"));
	});

	it("generates constraint monitor", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "test-constraints", version: "1.0.0", description: "Test" },
			semantics: {
				type: "constraints",
				target: { function: "push" },
				preconditions: [{ description: "not full", expression: "size < capacity" }],
				postconditions: [{ description: "size increases", expression: "size == old.size + 1" }],
			},
		};

		const monitor = generateMonitor(doc);
		assert.strictEqual(monitor.files.size, 1);
		const content = [...monitor.files.values()][0]!;
		assert.ok(content.includes("checkPreconditions"));
		assert.ok(content.includes("checkPostconditions"));
	});

	it("generates temporal trace monitor", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "test-temporal", version: "1.0.0", description: "Test" },
			semantics: {
				type: "temporal",
				logic: "ltl",
				variables: { x: "boolean" },
				properties: [{ name: "always-x", formula: { operator: "globally", operand: { operator: "variable", variable: "x" } } }],
			},
		};

		const monitor = generateMonitor(doc);
		assert.strictEqual(monitor.files.size, 1);
		const content = [...monitor.files.values()][0]!;
		assert.ok(content.includes("TraceMonitor"));
		assert.ok(content.includes("record("));
	});
});
