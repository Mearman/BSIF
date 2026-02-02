// BSIF Reference Implementation - CTL Checker Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { checkCTL, buildKripkeStructure, type KripkeStructure } from "../../src/executors/ctl-checker.js";

describe("CTL Checker", () => {
	// Helper: create a simple Kripke structure
	function createSimpleKripke(): KripkeStructure {
		return {
			states: [
				{ name: "s0", labels: { p: true, q: false } },
				{ name: "s1", labels: { p: true, q: true } },
				{ name: "s2", labels: { p: false, q: false } },
			],
			initialStates: ["s0"],
			transitions: new Map([
				["s0", ["s0", "s1"]],
				["s1", ["s2"]],
				["s2", ["s2"]],  // sink
			]),
		};
	}

	function evalToResult(checkResult: { readonly satisfyingStates?: readonly string[] }): string[] {
		return checkResult.satisfyingStates ?? [];
	}

	describe("EX (exists-next) - some successor satisfies", () => {
		it("states with some successor satisfying p are marked", () => {
			const structure = createSimpleKripke();
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [{
						name: "ex-p",
						formula: { operator: "exists-next", operand: { operator: "variable", variable: "p" } },
					}],
				} as never,
				structure,
			)[0];

			// s0 has successor s1 (p=true) and s0 itself (p=true)
			// s1 has successor s2 (p=false)
			// s2 has successor s2 (p=false)
			assert.ok(result.satisfyingStates?.includes("s0"));
		});
	});

	describe("AX (forall-next) - all successors satisfy", () => {
		it("states where all successors satisfy p are marked", () => {
			const structure = createSimpleKripke();
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [{
						name: "ax-p",
						formula: { operator: "forall-next", operand: { operator: "variable", variable: "p" } },
					}],
				} as never,
				structure,
			)[0];

			// s1: only successor is s2 (p=false), so s1 does NOT satisfy AX(p)
			// s2: only successor is s2 (p=false), so s2 does NOT satisfy AX(p)
			// s0: successors are s0 (p=true) and s1 (p=true), so s0 satisfies AX(p)
			assert.ok(result.satisfyingStates?.includes("s0"));
			assert.ok(!result.satisfyingStates?.includes("s1"));
			assert.ok(!result.satisfyingStates?.includes("s2"));
		});
	});

	describe("EG (exists-globally) - some path where p always holds", () => {
		it("states that can reach a cycle where all states satisfy p", () => {
			const structure: KripkeStructure = {
				states: [
					{ name: "s0", labels: { p: true } },
					{ name: "s1", labels: { p: true } },
					{ name: "s2", labels: { p: false } },
				],
				initialStates: ["s0"],
				transitions: new Map([
					["s0", ["s1"]],
					["s1", ["s0", "s1"]],  // cycle of p=true states
					["s2", ["s2"]],
				]),
			};
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [{
						name: "eg-p",
						formula: { operator: "exists-globally", operand: { operator: "variable", variable: "p" } },
					}],
				} as never,
				structure,
			)[0];

			// s0 and s1 form a cycle where p always holds
			assert.ok(result.satisfyingStates?.includes("s0"));
			assert.ok(result.satisfyingStates?.includes("s1"));
			assert.ok(!result.satisfyingStates?.includes("s2"));
		});
	});

	describe("AG (forall-globally) - all paths globally satisfy p", () => {
		it("states from which all reachable states satisfy p", () => {
			const structure: KripkeStructure = {
				states: [
					{ name: "s0", labels: { p: true } },
					{ name: "s1", labels: { p: true } },
					{ name: "s2", labels: { p: false } },
				],
				initialStates: ["s0"],
				transitions: new Map([
					["s0", ["s1"]],
					["s1", ["s2"]],  // leads to p=false
					["s2", ["s2"]],
				]),
			};
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [{
						name: "ag-p",
						formula: { operator: "forall-globally", operand: { operator: "variable", variable: "p" } },
					}],
				} as never,
				structure,
			)[0];

			// From s0, we can reach s2 (p=false), so s0 does NOT satisfy AG(p)
			// s1 leads to s2 (p=false), so s1 also does NOT satisfy AG(p)
			// s2 itself has p=false, so s2 does NOT satisfy AG(p) either
			// A correct AG implementation would return empty set for this structure
			// (since no state has all paths where p always holds)
			assert.ok(!result.satisfyingStates?.includes("s0"));
		});
	});

	describe("AF (forall-finally) - on all paths, p eventually holds", () => {
		it("states from which p is unavoidable", () => {
			const structure: KripkeStructure = {
				states: [
					{ name: "s0", labels: { p: false } },
					{ name: "s1", labels: { p: true } },
					{ name: "s2", labels: { p: false } },
				],
				initialStates: ["s0"],
				transitions: new Map([
					["s0", ["s1", "s2"]],
					["s1", ["s1"]],  // sink with p=true
					["s2", ["s2"]],  // sink with p=false
				]),
			};
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [{
						name: "af-p",
						formula: { operator: "forall-finally", operand: { operator: "variable", variable: "p" } },
					}],
				} as never,
				structure,
			)[0];

			// From s0, we can choose path to s1 (p=true) or s2 (p=false)
			// Since s2 leads to p=false forever, p is NOT unavoidable from s0
			assert.ok(!result.satisfied);

			// s1 trivially satisfies AF(p) since p holds there
			assert.ok(result.satisfyingStates?.includes("s1"));
		});
	});

	describe("EF (exists-finally) - on some path, p eventually holds", () => {
		it("states from which p is reachable", () => {
			const structure: KripkeStructure = {
				states: [
					{ name: "s0", labels: { p: false } },
					{ name: "s1", labels: { p: true } },
					{ name: "s2", labels: { p: false } },
				],
				initialStates: ["s0"],
				transitions: new Map([
					["s0", ["s1"]],
					["s1", ["s2"]],
					["s2", ["s2"]],
				]),
			};
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [{
						name: "ef-p",
						formula: { operator: "exists-finally", operand: { operator: "variable", variable: "p" } },
					}],
				} as never,
				structure,
			)[0];

			// From s0, p is reachable (via s1)
			assert.ok(result.satisfyingStates?.includes("s0"));
			assert.ok(result.satisfyingStates?.includes("s1"));

			// s2 cannot reach p anymore
			assert.ok(!result.satisfyingStates?.includes("s2"));
		});
	});

	describe("AU (forall-until) - on all paths, q holds and p holds until then", () => {
		it("calculates AU(p,q) correctly", () => {
			const structure: KripkeStructure = {
				states: [
					{ name: "s0", labels: { p: true, q: false } },
					{ name: "s1", labels: { p: true, q: true } },
					{ name: "s2", labels: { p: false, q: true } },
					{ name: "s3", labels: { p: false, q: false } },
				],
				initialStates: ["s0"],
				transitions: new Map([
					["s0", ["s1", "s3"]],
					["s1", ["s2"]],
					["s2", ["s2"]],
					["s3", ["s3"]],
				]),
			};
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean", q: "boolean" },
					properties: [{
						name: "au-p-q",
						formula: {
							operator: "forall-until",
							operands: [
								{ operator: "variable", variable: "p" },
								{ operator: "variable", variable: "q" },
							],
						},
					}],
				} as never,
				structure,
			)[0];

			// s1 satisfies q, so AU(p,q)
			// s2 satisfies q, so AU(p,q)
			assert.ok(result.satisfyingStates?.includes("s1"));
			assert.ok(result.satisfyingStates?.includes("s2"));

			// s0 can go to s3 (p=false, q=false) which doesn't satisfy AU(p,q)
			assert.ok(!result.satisfyingStates?.includes("s0"));
		});
	});

	describe("EU (exists-until) - on some path, q holds and p holds until then", () => {
		it("calculates EU(p,q) correctly", () => {
			const structure: KripkeStructure = {
				states: [
					{ name: "s0", labels: { p: true, q: false } },
					{ name: "s1", labels: { p: true, q: true } },
					{ name: "s2", labels: { p: false, q: false } },
				],
				initialStates: ["s0"],
				transitions: new Map([
					["s0", ["s1", "s2"]],
					["s1", ["s1"]],  // q holds, done
					["s2", ["s2"]],
				]),
			};
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean", q: "boolean" },
					properties: [{
						name: "eu-p-q",
						formula: {
							operator: "exists-until",
							operands: [
								{ operator: "variable", variable: "p" },
								{ operator: "variable", variable: "q" },
							],
						},
					}],
				} as never,
				structure,
			)[0];

			// s1 has q=true, so EU(p,q)
			// s0 can reach s1 while p holds, so EU(p,q)
			assert.ok(result.satisfyingStates?.includes("s0"));
			assert.ok(result.satisfyingStates?.includes("s1"));

			// s2 cannot reach q while p holds
			assert.ok(!result.satisfyingStates?.includes("s2"));
		});
	});

	describe("buildKripkeStructure", () => {
		it("builds structure from states and transitions", () => {
			const labels = {
				idle: { running: false },
				running: { running: true },
				done: { running: false, finished: true },
			};
			const structure = buildKripkeStructure(
				[
					{ name: "idle" },
					{ name: "running" },
					{ name: "done" },
				],
				[
					{ from: "idle", to: "running" },
					{ from: "running", to: "done" },
				],
				"idle",
				labels,
			);

			assert.strictEqual(structure.states.length, 3);
			assert.strictEqual(structure.initialStates[0], "idle");
			assert.strictEqual(structure.transitions.get("idle")?.length, 1);
			assert.strictEqual(structure.transitions.get("idle")?.[0], "running");
		});
	});

	describe("Result object properties", () => {
		it("includes satisfyingStates in result", () => {
			const structure = createSimpleKripke();
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [{
						name: "test",
						formula: { operator: "variable", variable: "p" },
					}],
				} as never,
				structure,
			)[0];

			assert.ok(Array.isArray(result.satisfyingStates));
			assert.ok(result.satisfyingStates!.length > 0);
		});

		it("includes counterexample for violated property", () => {
			const structure: KripkeStructure = {
				states: [
					{ name: "s0", labels: { p: false } },
					{ name: "s1", labels: { p: false } },
				],
				initialStates: ["s0"],
				transitions: new Map([
					["s0", ["s1"]],
					["s1", ["s1"]],
				]),
			};
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [{
						name: "test",
						formula: { operator: "variable", variable: "p" },
					}],
				} as never,
				structure,
			)[0];

			assert.ok(!result.satisfied);
			assert.ok(result.counterexample);
		});
	});

	describe("Complex nested formulas", () => {
		it("handles AG(AX p) - all paths globally, all next states satisfy p", () => {
			const structure: KripkeStructure = {
				states: [
					{ name: "s0", labels: { p: true } },
					{ name: "s1", labels: { p: true } },
				],
				initialStates: ["s0"],
				transitions: new Map([
					["s0", ["s0", "s1"]],
					["s1", ["s0", "s1"]],
				]),
			};
			const result = checkCTL(
				{
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [{
						name: "ag-ax-p",
						formula: {
							operator: "forall-globally",
							operand: {
								operator: "forall-next",
								operand: { operator: "variable", variable: "p" },
							},
						},
					}],
				} as never,
				structure,
			)[0];

			// All states have p=true, all successors have p=true
			assert.ok(result.satisfied);
		});
	});
});
