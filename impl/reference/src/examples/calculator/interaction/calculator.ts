/**
 * Calculator Interaction Protocol Implementation
 *
 * This TypeScript class implements the interaction protocol specified in
 * calculator.bsif.json. It handles the request/response pattern defined in the
 * BSIF interaction specification.
 *
 * Protocol:
 * - User sends REQUEST messages (ADD_REQUEST, SUBTRACT_REQUEST, etc.)
 * - Calculator responds with RESULT messages or ERROR messages
 * - CLEAR_REQUEST resets the calculator state
 */

export type Operation = "ADD" | "SUBTRACT" | "MULTIPLY" | "DIVIDE";

export interface CalculatorMessage<T = unknown> {
  type: string;
  payload?: T;
}

export interface OperationRequest {
  operand1: number;
  operand2: number;
}

export interface OperationResult {
  result: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface ClearAck {
  display: string;
}

export interface CalculatorDisplay {
  value: string;
}

/**
 * Calculator implementing the interaction protocol
 */
export class Calculator {
  private display: string = "0";
  private currentValue: number | null = null;

  /**
   * Process a message according to the interaction protocol
   */
  processMessage(message: CalculatorMessage): CalculatorMessage {
    switch (message.type) {
      case "ADD_REQUEST":
        return this.handleAdd(message.payload as OperationRequest);

      case "SUBTRACT_REQUEST":
        return this.handleSubtract(message.payload as OperationRequest);

      case "MULTIPLY_REQUEST":
        return this.handleMultiply(message.payload as OperationRequest);

      case "DIVIDE_REQUEST":
        return this.handleDivide(message.payload as OperationRequest);

      case "CLEAR_REQUEST":
        return this.handleClear();

      default:
        return {
          type: "ERROR",
          payload: { error: "UnknownMessage", message: `Unknown message type: ${message.type}` }
        };
    }
  }

  /**
   * Handle ADD_REQUEST message
   * Guard: operand1 != null && operand2 != null
   */
  private handleAdd(request: OperationRequest): CalculatorMessage<OperationResult> {
    const { operand1, operand2 } = request;

    // Guard condition: reject null/undefined operands
    if (operand1 == null || operand2 == null) {
      return {
        type: "ERROR",
        payload: { error: "InvalidOperands", message: "Operands cannot be null or undefined" }
      } as CalculatorMessage;
    }

    const result = operand1 + operand2;
    this.currentValue = result;
    this.display = result.toString();
    return { type: "ADD_RESULT", payload: { result } };
  }

  /**
   * Handle SUBTRACT_REQUEST message
   * Guard: operand1 != null && operand2 != null
   */
  private handleSubtract(request: OperationRequest): CalculatorMessage<OperationResult> {
    const { operand1, operand2 } = request;
    const result = operand1 - operand2;
    this.currentValue = result;
    this.display = result.toString();
    return { type: "SUBTRACT_RESULT", payload: { result } };
  }

  /**
   * Handle MULTIPLY_REQUEST message
   * Guard: operand1 != null && operand2 != null
   */
  private handleMultiply(request: OperationRequest): CalculatorMessage<OperationResult> {
    const { operand1, operand2 } = request;
    const result = operand1 * operand2;
    this.currentValue = result;
    this.display = result.toString();
    return { type: "MULTIPLY_RESULT", payload: { result } };
  }

  /**
   * Handle DIVIDE_REQUEST message
   * Guard: operand1 != null && operand2 != null && operand2 !== 0
   * Returns DIVISION_BY_ZERO_ERROR if operand2 is 0
   */
  private handleDivide(request: OperationRequest): CalculatorMessage<OperationResult | ErrorResponse> {
    const { operand1, operand2 } = request;

    // Guard condition from spec: operand2 !== 0
    if (operand2 === 0) {
      return {
        type: "DIVISION_BY_ZERO_ERROR",
        payload: { error: "DivisionByZero", message: "Cannot divide by zero" }
      };
    }

    const result = operand1 / operand2;
    this.currentValue = result;
    this.display = result.toString();
    return { type: "DIVIDE_RESULT", payload: { result } };
  }

  /**
   * Handle CLEAR_REQUEST message
   */
  private handleClear(): CalculatorMessage<ClearAck> {
    this.currentValue = null;
    this.display = "0";
    return { type: "CLEAR_ACK", payload: { display: "0" } };
  }

  /**
   * Get current display state
   */
  getDisplay(): CalculatorDisplay {
    return { value: this.display };
  }
}

/**
 * User agent for the calculator interaction protocol
 */
export class CalculatorUser {
  private calculator: Calculator;

  constructor(calculator: Calculator) {
    this.calculator = calculator;
  }

  /**
   * Send an operation request to the calculator
   */
  request(operation: Operation, operand1: number, operand2: number): number {
    const requestType = `${operation}_REQUEST`;
    const responseType = `${operation}_RESULT`;

    const response = this.calculator.processMessage({
      type: requestType,
      payload: { operand1, operand2 }
    });

    if (response.type === responseType) {
      return (response.payload as OperationResult).result;
    }

    if (response.type === "DIVISION_BY_ZERO_ERROR") {
      throw new Error((response.payload as ErrorResponse).message);
    }

    throw new Error(`Unexpected response: ${response.type}`);
  }

  /**
   * Send clear request to the calculator
   */
  clear(): void {
    this.calculator.processMessage({ type: "CLEAR_REQUEST" });
  }

  /**
   * Get current calculator display
   */
  getDisplay(): string {
    return this.calculator.getDisplay().value;
  }
}

// ============================================================================
// BSIF Validation Tests
// ============================================================================

/**
 * Test suite validating this implementation against the BSIF specification
 *
 * These tests verify that the TypeScript implementation correctly implements
 * the interaction protocol defined in calculator.bsif.json
 */
export const validationTests = {
  /**
   * Test: Addition operation
   * Input: { operation: "ADD_REQUEST", operand1: 5, operand2: 3 }
   * Expected: { result: 8, message: "ADD_RESULT" }
   */
  testAddition: () => {
    const calc = new Calculator();
    const result = calc.processMessage({
      type: "ADD_REQUEST",
      payload: { operand1: 5, operand2: 3 }
    });

    if (result.type !== "ADD_RESULT") {
      throw new Error(`Expected ADD_RESULT, got ${result.type}`);
    }
    if ((result.payload as OperationResult).result !== 8) {
      throw new Error(`Expected result 8, got ${(result.payload as OperationResult).result}`);
    }
  },

  /**
   * Test: Division by zero error
   * Input: { operation: "DIVIDE_REQUEST", operand1: 10, operand2: 0 }
   * Expected: { message: "DIVISION_BY_ZERO_ERROR", error: "DivisionByZero" }
   */
  testDivisionByZero: () => {
    const calc = new Calculator();
    const result = calc.processMessage({
      type: "DIVIDE_REQUEST",
      payload: { operand1: 10, operand2: 0 }
    });

    if (result.type !== "DIVISION_BY_ZERO_ERROR") {
      throw new Error(`Expected DIVISION_BY_ZERO_ERROR, got ${result.type}`);
    }
  },

  /**
   * Test: Clear operation
   * Input: { operation: "CLEAR_REQUEST" }
   * Expected: { message: "CLEAR_ACK", display: "0" }
   */
  testClear: () => {
    const calc = new Calculator();
    const result = calc.processMessage({ type: "CLEAR_REQUEST" });

    if (result.type !== "CLEAR_ACK") {
      throw new Error(`Expected CLEAR_ACK, got ${result.type}`);
    }
    if ((result.payload as ClearAck).display !== "0") {
      throw new Error(`Expected display '0', got '${(result.payload as ClearAck).display}'`);
    }
  }
};

// Run validation tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Running BSIF validation tests for Calculator implementation...\n");

  try {
    validationTests.testAddition();
    console.log("✓ Addition test passed");

    validationTests.testDivisionByZero();
    console.log("✓ Division by zero test passed");

    validationTests.testClear();
    console.log("✓ Clear test passed");

    console.log("\n✅ All BSIF validation tests passed!");
  } catch (err) {
    console.error("\n❌ Validation test failed:", (err as Error).message);
    process.exit(1);
  }
}
