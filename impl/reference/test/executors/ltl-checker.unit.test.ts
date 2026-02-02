// BSIF Reference Implementation - LTL Checker Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { checkTrace, type TraceStep } from "../../src/executors/ltl-checker.js";
import type { Temporal } from "../../src/schemas.js";

function makeSpec(properties: Temporal["properties"]): Temporal {
	return {
		type: "temporal",
		logic: "ltl",
		variables: { x: "boolean", y: "boolean" },
		properties,
	};
}

function makeTrace(...steps: Array<Record<string, boolean>>): readonly TraceStep[] {
	return steps.map((variables) => ({ variables }));
}

describe("LTL Checker", () => {
	describe("globally", () => {
		it("satisfied when property holds at every step", () => {
			const spec = makeSpec([{
				name: "always-x",
				formula: { operator: "globally", operand: { operator: "variable", variable: "x" } },
			}]);
			const trace = makeTrace({ x: true }, { x: true }, { x: true });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, true);
		});

		it("violated when property fails at some step", () => {
			const spec = makeSpec([{
				name: "always-x",
				formula: { operator: "globally", operand: { operator: "variable", variable: "x" } },
			}]);
			const trace = makeTrace({ x: true }, { x: false }, { x: true });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, false);
			assert.strictEqual(results[0]?.violationStep, 1);
		});
	});

	describe("finally", () => {
		it("satisfied when property holds at some step", () => {
			const spec = makeSpec([{
				name: "eventually-x",
				formula: { operator: "finally", operand: { operator: "variable", variable: "x" } },
			}]);
			const trace = makeTrace({ x: false }, { x: false }, { x: true });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, true);
		});

		it("violated when property never holds", () => {
			const spec = makeSpec([{
				name: "eventually-x",
				formula: { operator: "finally", operand: { operator: "variable", variable: "x" } },
			}]);
			const trace = makeTrace({ x: false }, { x: false }, { x: false });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, false);
		});
	});

	describe("next", () => {
		it("checks next step (weak semantics — true at end)", () => {
			const spec = makeSpec([{
				name: "next-x",
				formula: { operator: "next", operand: { operator: "variable", variable: "x" } },
			}]);
			const trace = makeTrace({ x: false }, { x: true });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, true);
		});

		it("weak next: true at end of trace", () => {
			const spec = makeSpec([{
				name: "next-x",
				formula: { operator: "next", operand: { operator: "variable", variable: "x" } },
			}]);
			const trace = makeTrace({ x: false });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, true);
		});
	});

	describe("until", () => {
		it("satisfied when Q holds before P fails", () => {
			const spec = makeSpec([{
				name: "x-until-y",
				formula: {
					operator: "until",
					operands: [
						{ operator: "variable", variable: "x" },
						{ operator: "variable", variable: "y" },
					],
				},
			}]);
			const trace = makeTrace({ x: true, y: false }, { x: true, y: false }, { x: false, y: true });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, true);
		});

		it("violated when P fails before Q holds", () => {
			const spec = makeSpec([{
				name: "x-until-y",
				formula: {
					operator: "until",
					operands: [
						{ operator: "variable", variable: "x" },
						{ operator: "variable", variable: "y" },
					],
				},
			}]);
			const trace = makeTrace({ x: true, y: false }, { x: false, y: false }, { x: false, y: true });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, false);
		});
	});

	describe("boolean operators", () => {
		it("not negates", () => {
			const spec = makeSpec([{
				name: "not-x",
				formula: { operator: "not", operand: { operator: "variable", variable: "x" } },
			}]);
			const trace = makeTrace({ x: false });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, true);
		});

		it("and requires both", () => {
			const spec = makeSpec([{
				name: "x-and-y",
				formula: {
					operator: "and",
					operands: [
						{ operator: "variable", variable: "x" },
						{ operator: "variable", variable: "y" },
					],
				},
			}]);
			const trace = makeTrace({ x: true, y: true });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, true);
		});

		it("or requires at least one", () => {
			const spec = makeSpec([{
				name: "x-or-y",
				formula: {
					operator: "or",
					operands: [
						{ operator: "variable", variable: "x" },
						{ operator: "variable", variable: "y" },
					],
				},
			}]);
			const trace = makeTrace({ x: false, y: true });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, true);
		});

		it("implies", () => {
			const spec = makeSpec([{
				name: "x-implies-y",
				formula: {
					operator: "implies",
					operands: [
						{ operator: "variable", variable: "x" },
						{ operator: "variable", variable: "y" },
					],
				},
			}]);
			// x=true, y=false => implies is false
			const trace1 = makeTrace({ x: true, y: false });
			const results1 = checkTrace(spec, trace1);
			assert.strictEqual(results1[0]?.satisfied, false);

			// x=false, y=false => implies is true (vacuously)
			const trace2 = makeTrace({ x: false, y: false });
			const results2 = checkTrace(spec, trace2);
			assert.strictEqual(results2[0]?.satisfied, true);
		});
	});

	describe("literal", () => {
		it("evaluates literal true", () => {
			const spec = makeSpec([{
				name: "true-literal",
				formula: { operator: "literal", value: true },
			}]);
			const trace = makeTrace({ x: false });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, true);
		});

		it("evaluates literal false", () => {
			const spec = makeSpec([{
				name: "false-literal",
				formula: { operator: "literal", value: false },
			}]);
			const trace = makeTrace({ x: true });
			const results = checkTrace(spec, trace);
			assert.strictEqual(results[0]?.satisfied, false);
		});
	});
});
