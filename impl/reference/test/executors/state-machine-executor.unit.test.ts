// BSIF Reference Implementation - State Machine Executor Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { createStateMachine } from "../../src/executors/state-machine-executor.js";
import type { StateMachine } from "../../src/schemas.js";

const trafficLight: StateMachine = {
	type: "state-machine",
	states: [
		{ name: "red", entry: "turnRed()" },
		{ name: "green", entry: "turnGreen()" },
		{ name: "yellow", entry: "turnYellow()" },
	],
	transitions: [
		{ from: "red", to: "green", event: "timer" },
		{ from: "green", to: "yellow", event: "timer" },
		{ from: "yellow", to: "red", event: "timer" },
	],
	initial: "red",
};

const simpleWithFinal: StateMachine = {
	type: "state-machine",
	states: [
		{ name: "idle" },
		{ name: "running" },
		{ name: "done" },
	],
	transitions: [
		{ from: "idle", to: "running", event: "start" },
		{ from: "running", to: "done", event: "finish" },
	],
	initial: "idle",
	final: ["done"],
};

describe("State Machine Executor", () => {
	it("starts in initial state", () => {
		const sm = createStateMachine(trafficLight);
		assert.strictEqual(sm.currentState, "red");
	});

	it("records initial state in history", () => {
		const sm = createStateMachine(trafficLight);
		assert.deepStrictEqual(sm.history, ["red"]);
	});

	it("transitions on valid event", () => {
		const sm = createStateMachine(trafficLight);
		const next = sm.send("timer");
		assert.strictEqual(next.currentState, "green");
	});

	it("records transition history", () => {
		let sm = createStateMachine(trafficLight);
		sm = sm.send("timer");
		sm = sm.send("timer");
		assert.deepStrictEqual(sm.history, ["red", "green", "yellow"]);
	});

	it("records entry actions", () => {
		const sm = createStateMachine(trafficLight);
		const next = sm.send("timer");
		assert.ok(next.actions.includes("turnGreen()"));
	});

	it("throws on invalid event", () => {
		const sm = createStateMachine(trafficLight);
		assert.throws(() => sm.send("invalid"), /No transition/);
	});

	it("canSend returns true for valid events", () => {
		const sm = createStateMachine(trafficLight);
		assert.strictEqual(sm.canSend("timer"), true);
	});

	it("canSend returns false for invalid events", () => {
		const sm = createStateMachine(trafficLight);
		assert.strictEqual(sm.canSend("invalid"), false);
	});

	it("detects final state", () => {
		let sm = createStateMachine(simpleWithFinal);
		assert.strictEqual(sm.isInFinalState(), false);
		sm = sm.send("start");
		assert.strictEqual(sm.isInFinalState(), false);
		sm = sm.send("finish");
		assert.strictEqual(sm.isInFinalState(), true);
	});

	it("immutability: original instance unchanged", () => {
		const sm = createStateMachine(trafficLight);
		sm.send("timer");
		assert.strictEqual(sm.currentState, "red");
	});

	it("cycles through traffic light correctly", () => {
		let sm = createStateMachine(trafficLight);
		sm = sm.send("timer"); // red -> green
		sm = sm.send("timer"); // green -> yellow
		sm = sm.send("timer"); // yellow -> red
		assert.strictEqual(sm.currentState, "red");
	});

	// Timing awareness tests (Phase 3)
	describe("Timing Awareness", () => {
		const timedStateMachine: StateMachine = {
			type: "state-machine",
			states: [
				{ name: "processing", timing: { deadline: 100, unit: "ms" } },
				{ name: "done", timing: { timeout: 50, unit: "ms" } },
			],
			transitions: [
				{ from: "processing", to: "done", event: "finish" },
			],
			initial: "processing",
		};

		it("tracks elapsed time in current state", () => {
			const sm = createStateMachine(timedStateMachine);
			assert.strictEqual(sm.elapsedTime, 0);
			const sm2 = sm.tick(50);
			assert.strictEqual(sm2.elapsedTime, 50);
		});

		it("resets elapsed time on state transition", () => {
			const sm = createStateMachine(timedStateMachine);
			const sm2 = sm.tick(75);
			assert.strictEqual(sm2.elapsedTime, 75);
			const sm3 = sm2.send("finish");
			assert.strictEqual(sm3.currentState, "done");
			assert.strictEqual(sm3.elapsedTime, 0); // Reset after transition
		});

		it("detects deadline violations", () => {
			const sm = createStateMachine(timedStateMachine).tick(150);
			const violations = sm.getTimingViolations();
			assert.ok(violations.length > 0);
			assert.strictEqual(violations[0].type, "deadline");
			assert.strictEqual(violations[0].state, "processing");
			assert.ok(violations[0].elapsed > violations[0].limit);
		});

		it("detects timeout violations", () => {
			const sm = createStateMachine(timedStateMachine);
			const sm2 = sm.send("finish");  // Move to done state
			const sm3 = sm2.tick(75);
			const violations = sm3.getTimingViolations();
			assert.ok(violations.length > 0);
			assert.strictEqual(violations[0].type, "timeout");
			assert.strictEqual(violations[0].state, "done");
		});

		it("returns no violations when within timing limits", () => {
			const sm = createStateMachine(timedStateMachine).tick(50);
			const violations = sm.getTimingViolations();
			assert.strictEqual(violations.length, 0);
		});

		it("respects timing unit conversion (seconds to ms)", () => {
			const spec: StateMachine = {
				type: "state-machine",
				states: [
					{ name: "waiting", timing: { deadline: 1, unit: "s" } },
				],
				transitions: [],
				initial: "waiting",
			};
			const sm = createStateMachine(spec).tick(1500);  // 1.5s
			const violations = sm.getTimingViolations();
			assert.ok(violations.length > 0);
			assert.ok(violations[0].elapsed > violations[0].limit);  // 1500 > 1000
		});

		it("respects timing unit conversion (ms unchanged)", () => {
			const spec: StateMachine = {
				type: "state-machine",
				states: [
					{ name: "fast", timing: { timeout: 10, unit: "ms" } },
				],
				transitions: [],
				initial: "fast",
			};
			const sm = createStateMachine(spec).tick(5);
			assert.strictEqual(sm.getTimingViolations().length, 0);
		});

		it("checks transition-level timing constraints", () => {
			const spec: StateMachine = {
				type: "state-machine",
				states: [
					{ name: "start" },
					{ name: "end" },
				],
				transitions: [
					{ from: "start", to: "end", event: "go", timing: { deadline: 100, unit: "ms" } },
				],
				initial: "start",
			};
			const sm = createStateMachine(spec).tick(150);
			const violations = sm.getTimingViolations();
			// Transition timing constraint is checked (on the from state)
			assert.ok(violations.length > 0);
		});

		it("returns no violations for states without timing", () => {
			const sm = createStateMachine(trafficLight).tick(9999);
			assert.strictEqual(sm.getTimingViolations().length, 0);
		});
	});
});
