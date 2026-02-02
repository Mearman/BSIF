// BSIF Reference Implementation - Schema Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import {
	bsifMetadata,
	stateMachine,
	temporal,
	constraints,
	events,
	interaction,
	hybrid,
	timingConstraint,
	isBSIFMetadata,
	isStateMachine,
	isTransition,
	isConstraint,
	isHandler,
	isParticipant,
	isMessage,
} from "../src/schemas.js";

describe("Schemas", () => {
	describe("bsifMetadata", () => {
		it("accepts valid metadata", () => {
			const valid = {
				bsif_version: "1.0.0",
				name: "test-spec",
			};

			const result = bsifMetadata.safeParse(valid);

			assert.strictEqual(result.success, true);
		});

		it("rejects missing required fields", () => {
			const invalid = {
				name: "test-spec",
			};

			const result = bsifMetadata.safeParse(invalid);

			assert.strictEqual(result.success, false);
		});

		it("rejects invalid semver", () => {
			const invalid = {
				bsif_version: "not-a-version",
				name: "test-spec",
			};

			const result = bsifMetadata.safeParse(invalid);

			assert.strictEqual(result.success, false);
		});
	});

	describe("isBSIFMetadata type guard", () => {
		it("returns true for valid metadata", () => {
			const valid = {
				bsif_version: "1.0.0",
				name: "test-spec",
			};

			assert.strictEqual(isBSIFMetadata(valid), true);
		});

		it("returns false for invalid metadata", () => {
			const invalid = {
				name: "test-spec",
			};

			assert.strictEqual(isBSIFMetadata(invalid), false);
		});
	});

	describe("stateMachine", () => {
		it("accepts valid state machine", () => {
			const valid = {
				type: "state-machine" as const,
				states: [{ name: "idle" }],
				transitions: [],
				initial: "idle",
			};

			const result = stateMachine.safeParse(valid);

			assert.strictEqual(result.success, true);
		});

		it("rejects missing initial state", () => {
			const invalid = {
				type: "state-machine" as const,
				states: [{ name: "idle" }],
				transitions: [],
			};

			const result = stateMachine.safeParse(invalid);

			assert.strictEqual(result.success, false);
		});
	});

	describe("isStateMachine type guard", () => {
		it("narrows type correctly", () => {
			const valid = {
				type: "state-machine" as const,
				states: [{ name: "idle" }],
				transitions: [],
				initial: "idle",
			};

			if (isStateMachine(valid)) {
				assert.strictEqual(valid.type, "state-machine");
				assert.strictEqual(valid.initial, "idle");
			} else {
				assert.fail("Should be a state machine");
			}
		});
	});

	describe("timingConstraint", () => {
		it("accepts valid timing constraint", () => {
			const valid = { deadline: 500, unit: "ms" as const };
			assert.strictEqual(timingConstraint.safeParse(valid).success, true);
		});

		it("rejects negative values", () => {
			const invalid = { deadline: -1 };
			assert.strictEqual(timingConstraint.safeParse(invalid).success, false);
		});

		it("rejects invalid unit", () => {
			const invalid = { deadline: 100, unit: "hours" };
			assert.strictEqual(timingConstraint.safeParse(invalid).success, false);
		});
	});

	describe("temporal", () => {
		it("accepts valid temporal semantics", () => {
			const valid = {
				type: "temporal" as const,
				logic: "ltl" as const,
				variables: { p: "boolean" as const },
				properties: [{ name: "test", formula: { operator: "variable", variable: "p" } }],
			};

			assert.strictEqual(temporal.safeParse(valid).success, true);
		});

		it("rejects missing properties array", () => {
			const invalid = {
				type: "temporal" as const,
				logic: "ltl" as const,
				variables: { p: "boolean" as const },
			};

			assert.strictEqual(temporal.safeParse(invalid).success, false);
		});

		it("rejects invalid logic value", () => {
			const invalid = {
				type: "temporal" as const,
				logic: "invalid",
				variables: { p: "boolean" as const },
				properties: [{ name: "test", formula: { operator: "variable", variable: "p" } }],
			};

			assert.strictEqual(temporal.safeParse(invalid).success, false);
		});
	});

	describe("constraints", () => {
		it("accepts valid constraints semantics", () => {
			const valid = {
				type: "constraints" as const,
				target: { function: "push" },
				preconditions: [{ description: "not full", expression: "size < capacity" }],
				postconditions: [{ description: "size increases", expression: "size == old.size + 1" }],
			};

			assert.strictEqual(constraints.safeParse(valid).success, true);
		});

		it("rejects empty target", () => {
			const invalid = {
				type: "constraints" as const,
				target: {},
				preconditions: [],
				postconditions: [],
			};

			assert.strictEqual(constraints.safeParse(invalid).success, false);
		});
	});

	describe("events", () => {
		it("accepts valid events semantics", () => {
			const valid = {
				type: "events" as const,
				events: { click: { payload: "string" as const } },
				handlers: [{ event: "click", action: "handle()" }],
			};

			assert.strictEqual(events.safeParse(valid).success, true);
		});

		it("rejects missing events field", () => {
			const invalid = {
				type: "events" as const,
				handlers: [],
			};

			assert.strictEqual(events.safeParse(invalid).success, false);
		});
	});

	describe("interaction", () => {
		it("accepts valid interaction semantics", () => {
			const valid = {
				type: "interaction" as const,
				participants: [{ name: "client" }, { name: "server" }],
				messages: [{ from: "client", to: "server", message: "request" }],
			};

			assert.strictEqual(interaction.safeParse(valid).success, true);
		});

		it("rejects empty participants array", () => {
			const invalid = {
				type: "interaction" as const,
				participants: [],
				messages: [],
			};

			assert.strictEqual(interaction.safeParse(invalid).success, false);
		});
	});

	describe("hybrid", () => {
		it("accepts valid hybrid with 2+ components", () => {
			const valid = {
				type: "hybrid" as const,
				components: [
					{ type: "state-machine", states: [{ name: "a" }], transitions: [], initial: "a" },
					{ type: "state-machine", states: [{ name: "b" }], transitions: [], initial: "b" },
				],
			};

			assert.strictEqual(hybrid.safeParse(valid).success, true);
		});

		it("rejects hybrid with fewer than 2 components", () => {
			const invalid = {
				type: "hybrid" as const,
				components: [{ type: "state-machine", states: [{ name: "a" }], transitions: [], initial: "a" }],
			};

			assert.strictEqual(hybrid.safeParse(invalid).success, false);
		});
	});

	describe("additional type guards", () => {
		it("isTransition validates correctly", () => {
			assert.strictEqual(isTransition({ from: "a", to: "b" }), true);
			assert.strictEqual(isTransition({ from: "" }), false);
		});

		it("isConstraint validates correctly", () => {
			assert.strictEqual(isConstraint({ description: "test", expression: "x > 0" }), true);
			assert.strictEqual(isConstraint({ description: "" }), false);
		});

		it("isHandler validates correctly", () => {
			assert.strictEqual(isHandler({ event: "click" }), true);
			assert.strictEqual(isHandler({}), false);
		});

		it("isParticipant validates correctly", () => {
			assert.strictEqual(isParticipant({ name: "client" }), true);
			assert.strictEqual(isParticipant({}), false);
		});

		it("isMessage validates correctly", () => {
			assert.strictEqual(isMessage({ from: "a", to: "b", message: "req" }), true);
			assert.strictEqual(isMessage({ from: "a" }), false);
		});
	});
});
