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
});
