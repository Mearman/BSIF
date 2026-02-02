/**
 * BSIF Contract Validation Tests for Calculator State Machine Specification
 *
 * These tests validate that the TypeScript state machine implementation
 * correctly satisfies the BSIF state machine specification in calculator.bsif.json
 *
 * The BSIF spec defines states, transitions, guards, and actions that the
 * implementation must follow.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { CalculatorStateMachine } from "../../../src/examples/calculator/state-machine/calculator.js";
import { createContractTest, validateAgainstContract } from "../../bsif-contract.js";

// Load the BSIF specification
const specPath = join(import.meta.dirname, "../../../../../docs/examples/calculator/state-machine/calculator.bsif.json");

describe("BSIF Contract: Calculator State Machine", () => {
	let calc: CalculatorStateMachine;

	it("specification itself is valid", () => {
		const contract = createContractTest(specPath);
		assert.strictEqual(contract.isValid(), true, "BSIF spec should be valid");
		assert.strictEqual(contract.getSemanticType(), "state-machine", "Should be state machine type");
		assert.strictEqual(contract.getMetadata().name, "calculator-state-machine");
	});

	it("specification matches TypeScript implementation", () => {
		calc = new CalculatorStateMachine();

		const result = validateAgainstContract(specPath, {
			processEvent: (event: unknown) => {
				calc.processEvent(event as Parameters<typeof calc.processEvent>[0]);
				// Return object matching BSIF expected output format
				return {
					finalState: calc.getState(),
					result: calc.getResult(),
					errorMessage: calc.getErrorMessage(),
					display: calc.getDisplay().value
				};
			},
			getState: () => calc.getState()
		});

		// All tests from the BSIF spec should pass
		assert.strictEqual(result.passed, true, "Implementation should satisfy all contract tests");

		console.log(`  Contract: ${result.spec.name} v${result.spec.version}`);
		console.log(`  Semantic Type: ${result.spec.semanticType}`);
		console.log(`  Tests Passed: ${result.results.implementationResults.filter(r => r.passed).length}/${result.results.implementationResults.length}`);
	});

	describe("BSIF test cases from specification", () => {
		beforeEach(() => {
			calc = new CalculatorStateMachine();
		});

		it("basic-addition-flow: 5 + 3 = 8", () => {
			// Test: Input: initialState="idle", events=[digit(5), operation(ADD), digit(3), equals]
			// Expected: finalState="showingResult", result=8

			calc.processEvent({ type: "digit", digit: 5 });
			assert.strictEqual(calc.getState(), "enteringFirstOperand");

			calc.processEvent({ type: "operation", operation: "ADD" });
			assert.strictEqual(calc.getState(), "enteringSecondOperand");

			calc.processEvent({ type: "digit", digit: 3 });
			assert.strictEqual(calc.getState(), "enteringSecondOperand");

			calc.processEvent({ type: "equals" });
			assert.strictEqual(calc.getState(), "showingResult");
			assert.strictEqual(calc.getResult(), 8);
		});

		it("division-by-zero-error: 10 / 0 triggers error state", () => {
			// Test: Input: initialState="idle", events=[digit(1), digit(0), operation(DIVIDE), digit(0), equals]
			// Expected: finalState="error", errorMessage="Division by zero"

			calc.processEvent({ type: "digit", digit: 1 });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "operation", operation: "DIVIDE" });
			calc.processEvent({ type: "digit", digit: 0 });

			const transition = calc.processEvent({ type: "equals" });

			assert.strictEqual(calc.getState(), "error");
			assert.strictEqual(calc.getErrorMessage(), "Division by zero");
			assert.strictEqual(transition.to, "error");
		});

		it("clear-from-any-state: clear returns to idle", () => {
			// Test: Input: initialState="showingResult", events=[clear]
			// Expected: finalState="idle", display="0"

			// First get to showingResult state
			calc.processEvent({ type: "digit", digit: 5 });
			calc.processEvent({ type: "operation", operation: "ADD" });
			calc.processEvent({ type: "digit", digit: 3 });
			calc.processEvent({ type: "equals" });
			assert.strictEqual(calc.getState(), "showingResult");

			// Now clear
			calc.processEvent({ type: "clear" });

			assert.strictEqual(calc.getState(), "idle");
			assert.strictEqual(calc.getDisplay().value, "0");
		});
	});

	describe("State transition compliance", () => {
		beforeEach(() => {
			calc = new CalculatorStateMachine();
		});

		it("idle → enteringFirstOperand on digit", () => {
			const transition = calc.processEvent({ type: "digit", digit: 5 });
			assert.strictEqual(transition.from, "idle");
			assert.strictEqual(transition.to, "enteringFirstOperand");
			assert.strictEqual(transition.event, "digit");
		});

		it("enteringFirstOperand → enteringSecondOperand on operation (with buffer)", () => {
			calc.processEvent({ type: "digit", digit: 5 });
			const transition = calc.processEvent({ type: "operation", operation: "ADD" });
			assert.strictEqual(transition.from, "enteringFirstOperand");
			assert.strictEqual(transition.to, "enteringSecondOperand");
		});

		it("guard: enteringSecondOperand → error on equals with zero divisor", () => {
			calc.processEvent({ type: "digit", digit: 1 });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "operation", operation: "DIVIDE" });
			calc.processEvent({ type: "digit", digit: 0 });

			const transition = calc.processEvent({ type: "equals" });
			assert.strictEqual(transition.to, "error");
		});

		it("any state → idle on clear", () => {
			// Test from showingResult
			calc.processEvent({ type: "digit", digit: 5 });
			calc.processEvent({ type: "operation", operation: "ADD" });
			calc.processEvent({ type: "digit", digit: 3 });
			calc.processEvent({ type: "equals" });

			const transition = calc.processEvent({ type: "clear" });
			assert.strictEqual(transition.to, "idle");

			// Test from error state
			calc.processEvent({ type: "digit", digit: 1 });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "operation", operation: "DIVIDE" });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "equals" });

			const transition2 = calc.processEvent({ type: "clear" });
			assert.strictEqual(transition2.to, "idle");
		});
	});

	describe("Guard conditions from specification", () => {
		beforeEach(() => {
			calc = new CalculatorStateMachine();
		});

		it("guard: digit must be 0-9", () => {
			// Valid digits work
			calc.processEvent({ type: "digit", digit: 5 });
			assert.strictEqual(calc.getState(), "enteringFirstOperand");

			// Invalid digit should stay in current state (guard fails)
			const currentState = calc.getState();
			calc.processEvent({ type: "digit", digit: -1 });
			assert.strictEqual(calc.getState(), currentState);
		});

		it("guard: buffer length < 10", () => {
			calc.processEvent({ type: "digit", digit: 1 });
			calc.processEvent({ type: "digit", digit: 2 });
			calc.processEvent({ type: "digit", digit: 3 });
			calc.processEvent({ type: "digit", digit: 4 });
			calc.processEvent({ type: "digit", digit: 5 });
			calc.processEvent({ type: "digit", digit: 6 });
			calc.processEvent({ type: "digit", digit: 7 });
			calc.processEvent({ type: "digit", digit: 8 });
			calc.processEvent({ type: "digit", digit: 9 });
			calc.processEvent({ type: "digit", digit: 1 });

			// Buffer is now 10 digits, next digit should be ignored
			const bufferBefore = calc.getDisplay().value;
			calc.processEvent({ type: "digit", digit: 2 });
			assert.strictEqual(calc.getDisplay().value, bufferBefore);
		});
	});

	describe("State entry/exit actions", () => {
		it("idle state entry initializes display to '0'", () => {
			calc = new CalculatorStateMachine();
			assert.strictEqual(calc.getDisplay().value, "0");
		});

		it("error state entry sets display to 'ERROR'", () => {
			calc.processEvent({ type: "digit", digit: 1 });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "operation", operation: "DIVIDE" });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "equals" });

			assert.strictEqual(calc.getState(), "error");
			assert.strictEqual(calc.getDisplay().value, "ERROR");
		});
	});
});
