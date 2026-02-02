/**
 * BSIF Contract Validation Tests for Calculator Interaction Specification
 *
 * These tests validate that the TypeScript implementation in calculator.ts
 * correctly satisfies the BSIF interaction protocol specification in calculator.bsif.json
 *
 * The BSIF spec is treated as a "contract" that the implementation must satisfy.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { Calculator, CalculatorUser } from "../../../src/examples/calculator/interaction/calculator.js";
import { createContractTest, validateAgainstContract } from "../../bsif-contract.js";

// Load the BSIF specification
const specPath = join(import.meta.dirname, "../../../../../docs/examples/calculator/interaction/calculator.bsif.json");

describe("BSIF Contract: Calculator Interaction", () => {
	let calculator: Calculator;
	let user: CalculatorUser;

	it("specification itself is valid", () => {
		const contract = createContractTest(specPath);
		assert.strictEqual(contract.isValid(), true, "BSIF spec should be valid");
		assert.strictEqual(contract.getSemanticType(), "interaction", "Should be interaction type");
		assert.strictEqual(contract.getMetadata().name, "interactive-calculator");
	});

	it("specification matches TypeScript implementation", () => {
		calculator = new Calculator();
		user = new CalculatorUser(calculator);

		const result = validateAgainstContract(specPath, {
			processMessage: (msg: unknown) => calculator.processMessage(msg as Parameters<typeof calculator.processMessage>[0])
		});

		// All tests from the BSIF spec should pass
		assert.strictEqual(result.passed, true, "Implementation should satisfy all contract tests");

		// Show detailed results
		console.log(`  Contract: ${result.spec.name} v${result.spec.version}`);
		console.log(`  Semantic Type: ${result.spec.semanticType}`);
		console.log(`  Tests Passed: ${result.results.implementationResults.filter(r => r.passed).length}/${result.results.implementationResults.length}`);
	});

	describe("BSIF test cases", () => {
		beforeEach(() => {
			calculator = new Calculator();
			user = new CalculatorUser(calculator);
		});

		it("addition-operation: 5 + 3 = 8", () => {
			// From BSIF spec test case
			const result = user.request("ADD", 5, 3);
			assert.strictEqual(result, 8);
		});

		it("division-by-zero: returns error", () => {
			assert.throws(
				() => user.request("DIVIDE", 10, 0),
				/Cannot divide by zero/
			);
		});

		it("clear-operation: resets display", () => {
			user.request("ADD", 5, 3); // Put some value in display
			user.clear();
			assert.strictEqual(user.getDisplay(), "0");
		});
	});

	describe("Interaction protocol compliance", () => {
		it("ADD_REQUEST produces ADD_RESULT message", () => {
			const response = calculator.processMessage({
				type: "ADD_REQUEST",
				payload: { operand1: 5, operand2: 3 }
			});

			assert.strictEqual(response.type, "ADD_RESULT");
			assert.deepStrictEqual(response.payload, { result: 8 });
		});

		it("DIVIDE_REQUEST with zero divisor produces DIVISION_BY_ZERO_ERROR", () => {
			const response = calculator.processMessage({
				type: "DIVIDE_REQUEST",
				payload: { operand1: 10, operand2: 0 }
			});

			assert.strictEqual(response.type, "DIVISION_BY_ZERO_ERROR");
			assert.strictEqual((response.payload as { error: string }).error, "DivisionByZero");
		});

		it("CLEAR_REQUEST produces CLEAR_ACK message", () => {
			const response = calculator.processMessage({
				type: "CLEAR_REQUEST"
			});

			assert.strictEqual(response.type, "CLEAR_ACK");
			assert.deepStrictEqual(response.payload, { display: "0" });
		});
	});

	describe("Message payload validation", () => {
		it("guards: operation requests require valid operands", () => {
			const calc = new Calculator();

			// This should work with valid operands
			const validResult = calc.processMessage({
				type: "ADD_REQUEST",
				payload: { operand1: 5, operand2: 3 }
			});
			assert.strictEqual(validResult.type, "ADD_RESULT");

			// Missing or null operands should be handled
			const nullOperandResult = calc.processMessage({
				type: "ADD_REQUEST",
				payload: { operand1: null, operand2: 3 }
			});
			// Implementation should handle gracefully
			assert.notStrictEqual(nullOperandResult.type, "ADD_RESULT");
		});
	});

	describe("Security properties", () => {
		it("spec defines no authentication required", () => {
			const contract = createContractTest(specPath);
			const spec = contract.getSemantics() as { security?: { authentication: string } };

			// For local calculator, no authentication is required
			if (spec.security) {
				assert.strictEqual(spec.security.authentication, "none");
			}
		});
	});
});
