// BSIF Reference Implementation - TLA+ Mapper Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { TLAPlusMapper } from "../../src/mappers/tlaplus.js";
import type { BSIFDocument } from "../../src/schemas.js";

describe("TLA+ Mapper", () => {
	const mapper = new TLAPlusMapper();

	it("converts state machine to TLA+", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "traffic-light", version: "1.0.0", description: "Test" },
			semantics: {
				type: "state-machine",
				states: [{ name: "red" }, { name: "green" }, { name: "yellow" }],
				transitions: [
					{ from: "red", to: "green", event: "timer" },
					{ from: "green", to: "yellow", event: "timer" },
					{ from: "yellow", to: "red", event: "timer" },
				],
				initial: "red",
			},
		};

		const tla = mapper.fromBSIF(doc);
		assert.ok(tla.includes("MODULE traffic_light"));
		assert.ok(tla.includes("VARIABLE state"));
		assert.ok(tla.includes("Init =="));
		assert.ok(tla.includes("Next =="));
		assert.ok(tla.includes("red_to_green"));
		assert.ok(tla.includes("===="));
	});

	it("converts temporal properties to TLA+", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "mutex", version: "1.0.0", description: "Test" },
			semantics: {
				type: "temporal",
				logic: "ltl",
				variables: { x: "boolean", y: "boolean" },
				properties: [{ name: "safety", formula: { operator: "globally", operand: { operator: "variable", variable: "x" } } }],
			},
		};

		const tla = mapper.fromBSIF(doc);
		assert.ok(tla.includes("MODULE mutex"));
		assert.ok(tla.includes("VARIABLES x, y"));
		assert.ok(tla.includes("safety"));
	});

	it("converts constraints to TLA+", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "stack-spec", version: "1.0.0", description: "Test" },
			semantics: {
				type: "constraints",
				target: { function: "push" },
				preconditions: [{ description: "not full", expression: "size < capacity" }],
				postconditions: [{ description: "size increases", expression: "size == old.size + 1" }],
			},
		};

		const tla = mapper.fromBSIF(doc);
		assert.ok(tla.includes("MODULE stack_spec"));
		assert.ok(tla.includes("ASSUME"));
		assert.ok(tla.includes("not full"));
	});

	it("round-trips state machine through TLA+", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "simple", version: "1.0.0", description: "Test" },
			semantics: {
				type: "state-machine",
				states: [{ name: "idle" }, { name: "active" }],
				transitions: [{ from: "idle", to: "active" }],
				initial: "idle",
			},
		};

		const tla = mapper.fromBSIF(doc);
		const roundTripped = mapper.toBSIF(tla, { name: "simple", description: "Round-tripped" });
		assert.strictEqual(roundTripped.metadata.name, "simple");
		assert.strictEqual(roundTripped.semantics.type, "state-machine");
	});
});
