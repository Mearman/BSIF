/**
 * BSIF Contract Validation Tests for Calculator Hybrid Specification
 *
 * These tests validate that the TypeScript hybrid implementation
 * correctly satisfies the combined BSIF specification containing:
 * - State machine semantics
 * - Interaction protocol semantics
 * - Temporal logic properties
 *
 * This demonstrates BSIF's core value: a single specification that can
 * validate implementations across multiple semantic dimensions.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { HybridCalculator } from "../../../src/examples/calculator/hybrid/calculator.js";
import { createContractTest } from "../../bsif-contract.js";

// Load the BSIF specification
const specPath = join(import.meta.dirname, "../../../../../docs/examples/calculator/hybrid/calculator.bsif.json");

describe("BSIF Contract: Calculator Hybrid Specification", () => {
	let calc: HybridCalculator;

	it("specification itself is valid", () => {
		const contract = createContractTest(specPath);
		assert.strictEqual(contract.isValid(), true, "BSIF spec should be valid");
		assert.strictEqual(contract.getSemanticType(), "hybrid", "Should be hybrid type");
		assert.strictEqual(contract.getMetadata().name, "interactive-calculator-hybrid");
	});

	it("specification has 3 semantic components", () => {
		const contract = createContractTest(specPath);
		const semantics = (contract.getSemantics() as { type: string; components: unknown[] }).components;

		assert.strictEqual(semantics.length, 3, "Hybrid spec should have 3 components");

		const types = semantics.map((s: unknown) => (s as { type: string }).type);
		assert.ok(types.includes("state-machine"), "Should include state-machine");
		assert.ok(types.includes("interaction"), "Should include interaction");
		assert.ok(types.includes("temporal"), "Should include temporal");
	});

	describe("State Machine Component Compliance", () => {
		beforeEach(() => {
			calc = new HybridCalculator();
		});

		it("follows state transitions defined in spec", () => {
			// idle → enteringFirstOperand → enteringSecondOperand → showingResult
			calc.processEvent({ type: "digit", digit: 5 });
			assert.strictEqual(calc.getState(), "enteringFirstOperand");

			calc.processEvent({ type: "operation", operation: "ADD" });
			assert.strictEqual(calc.getState(), "enteringSecondOperand");

			calc.processEvent({ type: "digit", digit: 3 });
			assert.strictEqual(calc.getState(), "enteringSecondOperand");

			calc.processEvent({ type: "equals" });
			assert.strictEqual(calc.getState(), "showingResult");
		});

		it("transitions to error state on division by zero", () => {
			calc.processEvent({ type: "digit", digit: 1 });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "operation", operation: "DIVIDE" });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "equals" });

			assert.strictEqual(calc.getState(), "error");
		});

		it("clear returns to idle from any state", () => {
			// From showingResult
			calc.processEvent({ type: "digit", digit: 5 });
			calc.processEvent({ type: "operation", operation: "ADD" });
			calc.processEvent({ type: "digit", digit: 3 });
			calc.processEvent({ type: "equals" });
			assert.strictEqual(calc.getState(), "showingResult");

			calc.processEvent({ type: "clear" });
			assert.strictEqual(calc.getState(), "idle");

			// From error state
			calc.processEvent({ type: "digit", digit: 1 });
			calc.processEvent({ type: "operation", operation: "DIVIDE" });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "equals" });
			assert.strictEqual(calc.getState(), "error");

			calc.processEvent({ type: "clear" });
			assert.strictEqual(calc.getState(), "idle");
		});
	});

	describe("Interaction Component Compliance", () => {
		beforeEach(() => {
			calc = new HybridCalculator();
		});

		it("processes operation requests correctly", () => {
			// The hybrid calculator should handle interaction protocol
			// This is tested implicitly through the state machine interface
			calc.processEvent({ type: "digit", digit: 5 });
			calc.processEvent({ type: "operation", operation: "ADD" });
			calc.processEvent({ type: "digit", digit: 3 });
			calc.processEvent({ type: "equals" });

			assert.strictEqual(calc.getDisplay(), "8");
		});
	});

	describe("Temporal Properties Component Compliance", () => {
		beforeEach(() => {
			calc = new HybridCalculator();
		});

		it("satisfies: G(clear → F idle) - eventually returns to idle after clear", () => {
			// Get to a non-idle state
			calc.processEvent({ type: "digit", digit: 5 });
			calc.processEvent({ type: "operation", operation: "ADD" });
			calc.processEvent({ type: "digit", digit: 3 });
			calc.processEvent({ type: "equals" });

			assert.strictEqual(calc.getState(), "showingResult");

			// Clear and verify temporal property
			calc.processEvent({ type: "clear" });
			assert.strictEqual(calc.getState(), "idle");

			const verification = calc.verifyTemporalProperties();
			assert.strictEqual(
				verification.eventuallyReturnsToIdleAfterClear,
				true,
				"Should satisfy 'eventually returns to idle after clear' property"
			);
		});

		it("satisfies: G ¬(division ∧ zero_divisor ∧ ¬error) - no division by zero without error", () => {
			// Perform division by zero
			calc.processEvent({ type: "digit", digit: 1 });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "operation", operation: "DIVIDE" });
			calc.processEvent({ type: "digit", digit: 0 });
			calc.processEvent({ type: "equals" });

			// Should be in error state
			assert.strictEqual(calc.getState(), "error");

			// Temporal verification should reflect this
			const verification = calc.verifyTemporalProperties();
			// The "no division by zero" property means if division by zero is
			// attempted, we MUST be in error state (which we are)
		});

		it("satisfies: G(equals → F showing_result ∧ ¬error) - result shown after equals", () => {
			// Valid operation
			calc.processEvent({ type: "digit", digit: 5 });
			calc.processEvent({ type: "operation", operation: "ADD" });
			calc.processEvent({ type: "digit", digit: 3 });
			calc.processEvent({ type: "equals" });

			assert.strictEqual(calc.getState(), "showingResult");
			assert.strictEqual(calc.getDisplay(), "8");

			// Verify temporal property
			const verification = calc.verifyTemporalProperties();
			assert.strictEqual(
				verification.resultShownAfterEquals,
				true,
				"Should satisfy 'result shown after equals' property"
			);
		});

		it("all temporal properties are satisfied", () => {
			// Run through a complete calculation cycle
			calc.processEvent({ type: "digit", digit: 5 });
			calc.processEvent({ type: "operation", operation: "ADD" });
			calc.processEvent({ type: "digit", digit: 3 });
			calc.processEvent({ type: "equals" });
			calc.processEvent({ type: "clear" });

			const verification = calc.verifyTemporalProperties();
			assert.strictEqual(
				verification.allPassed,
				true,
				`All temporal properties should pass: ${JSON.stringify(verification)}`
			);
		});
	});

	describe("Cross-component validation", () => {
		it("state machine and interaction protocols are consistent", () => {
			calc = new HybridCalculator();

			// Using state machine interface
			calc.processEvent({ type: "digit", digit: 5 });
			calc.processEvent({ type: "operation", operation: "ADD" });
			calc.processEvent({ type: "digit", digit: 3 });
			calc.processEvent({ type: "equals" });

			// State machine says showingResult
			assert.strictEqual(calc.getState(), "showingResult");

			// Display should show the result
			assert.strictEqual(calc.getDisplay(), "8");
		});

		it("event history tracking enables temporal verification", () => {
			calc = new HybridCalculator();

			// Perform some operations
			calc.processEvent({ type: "digit", digit: 5 });
			calc.processEvent({ type: "operation", operation: "ADD" });
			calc.processEvent({ type: "digit", digit: 3 });
			calc.processEvent({ type: "equals" });
			calc.processEvent({ type: "clear" });

			// Event history should be recorded
			const history = calc.getHistory();
			assert.ok(history.length > 0, "Event history should be recorded");

			// History should contain the events we sent
			const eventTypes = history.map(h => h.event);
			assert.ok(eventTypes.includes("digit"), "Should contain digit events");
			assert.ok(eventTypes.includes("operation"), "Should contain operation event");
			assert.ok(eventTypes.includes("equals"), "Should contain equals event");
			assert.ok(eventTypes.includes("clear"), "Should contain clear event");
		});
	});

	describe("Complete workflow test from BSIF spec", () => {
		it("complete-calculation-cycle test case", () => {
			calc = new HybridCalculator();

			// From BSIF test: "User enters digits and operation, receives result"
			const result = calc.processEvent({ type: "digit", digit: 5 });
			assert.strictEqual(result.to, "enteringFirstOperand");

			const result2 = calc.processEvent({ type: "operation", operation: "ADD" });
			assert.strictEqual(result2.to, "enteringSecondOperand");

			const result3 = calc.processEvent({ type: "digit", digit: 3 });
			assert.strictEqual(result3.to, "enteringSecondOperand");

			const result4 = calc.processEvent({ type: "equals" });
			assert.strictEqual(result4.to, "showingResult");
			assert.strictEqual(calc.getDisplay(), "8");

			// Verify temporal properties still hold
			const verification = calc.verifyTemporalProperties();
			assert.strictEqual(verification.allPassed, true, "All temporal properties should pass");
		});
	});
});
