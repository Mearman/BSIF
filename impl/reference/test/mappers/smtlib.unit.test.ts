// BSIF Reference Implementation - SMT-LIB Mapper Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { SMTLIBMapper } from "../../src/mappers/smtlib.js";
import type { BSIFDocument } from "../../src/schemas.js";

describe("SMT-LIB Mapper", () => {
	const mapper = new SMTLIBMapper();

	it("converts constraints to SMT-LIB", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "stack-spec", version: "1.0.0", description: "Test" },
			semantics: {
				type: "constraints",
				target: { function: "push" },
				preconditions: [{ description: "not full", expression: "size < capacity" }],
				postconditions: [{ description: "size increases", expression: "size == old.size + 1" }],
			},
		};

		const smt = mapper.fromBSIF(doc);
		assert.ok(smt.includes("(set-logic ALL)"));
		assert.ok(smt.includes("declare-const"));
		assert.ok(smt.includes("(assert"));
		assert.ok(smt.includes("(check-sat)"));
		assert.ok(smt.includes("Preconditions"));
		assert.ok(smt.includes("Postconditions"));
	});

	it("extracts variables from expressions", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "vars-test", version: "1.0.0", description: "Test" },
			semantics: {
				type: "constraints",
				target: { function: "test" },
				preconditions: [{ description: "check", expression: "x > 0" }],
				postconditions: [{ description: "result", expression: "y == x + 1" }],
			},
		};

		const smt = mapper.fromBSIF(doc);
		assert.ok(smt.includes("declare-const x"));
		assert.ok(smt.includes("declare-const y"));
	});

	it("handles invariants", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "inv-test", version: "1.0.0", description: "Test" },
			semantics: {
				type: "constraints",
				target: { function: "test" },
				preconditions: [],
				postconditions: [],
				invariants: [{ description: "positive", expression: "count >= 0" }],
			},
		};

		const smt = mapper.fromBSIF(doc);
		assert.ok(smt.includes("Invariants"));
		assert.ok(smt.includes("(assert"));
	});

	it("round-trips through SMT-LIB", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "roundtrip", version: "1.0.0", description: "Test" },
			semantics: {
				type: "constraints",
				target: { function: "test" },
				preconditions: [{ description: "check", expression: "x > 0" }],
				postconditions: [],
			},
		};

		const smt = mapper.fromBSIF(doc);
		const roundTripped = mapper.toBSIF(smt, { name: "roundtrip" });
		assert.strictEqual(roundTripped.semantics.type, "constraints");
	});

	it("throws for non-constraints semantics", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "bad", version: "1.0.0", description: "Test" },
			semantics: {
				type: "state-machine",
				states: [{ name: "idle" }],
				transitions: [],
				initial: "idle",
			},
		};

		assert.throws(() => mapper.fromBSIF(doc), /only supports constraints/);
	});
});
