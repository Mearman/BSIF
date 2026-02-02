/**
 * Calculator State Machine Implementation
 *
 * This TypeScript class implements the state machine specified in
 * calculator.bsif.json. It maintains the calculator's internal states
 * and handles transitions according to the specification.
 *
 * States:
 * - idle: Initial state, display = "0", no accumulator
 * - enteringFirstOperand: User entering first operand
 * - enteringSecondOperand: User entering second operand
 * - showingResult: Display shows calculation result
 * - error: Error state (e.g., division by zero)
 */

export type CalculatorEvent =
  | { type: "digit"; digit: number }
  | { type: "operation"; operation: Operation }
  | { type: "equals" }
  | { type: "clear" };

export type Operation = "ADD" | "SUBTRACT" | "MULTIPLY" | "DIVIDE";

export type CalculatorState =
  | "idle"
  | "enteringFirstOperand"
  | "enteringSecondOperand"
  | "showingResult"
  | "error";

export interface StateTransition {
  from: CalculatorState;
  to: CalculatorState;
  event: string;
}

export interface CalculatorDisplay {
  value: string;
  currentState: CalculatorState;
}

/**
 * State machine implementing the calculator behavior
 */
export class CalculatorStateMachine {
  private state: CalculatorState = "idle";
  private display: string = "0";
  private buffer: string = "";
  private accumulator: number | null = null;
  private pendingOperation: Operation | null = null;
  private result: number | null = null;
  private errorMessage: string = "";

  /**
   * Get current state
   */
  getState(): CalculatorState {
    return this.state;
  }

  /**
   * Get current display
   */
  getDisplay(): CalculatorDisplay {
    return {
      value: this.display,
      currentState: this.state
    };
  }

  /**
   * Get current result (if in showingResult state)
   */
  getResult(): number | null {
    return this.result;
  }

  /**
   * Get current error message (if in error state)
   */
  getErrorMessage(): string {
    return this.errorMessage;
  }

  /**
   * Process an event and transition states
   * Returns the state transition that occurred
   */
  processEvent(event: CalculatorEvent): StateTransition {
    const fromState = this.state;
    let toState: CalculatorState = this.state;

    switch (this.state) {
      case "idle":
        toState = this.handleIdle(event);
        break;

      case "enteringFirstOperand":
        toState = this.handleEnteringFirstOperand(event);
        break;

      case "enteringSecondOperand":
        toState = this.handleEnteringSecondOperand(event);
        break;

      case "showingResult":
        toState = this.handleShowingResult(event);
        break;

      case "error":
        toState = this.handleError(event);
        break;
    }

    this.state = toState;
    this.updateDisplay();

    return { from: fromState, to: toState, event: event.type };
  }

  /**
   * Handle events in idle state
   * Transitions: idle → enteringFirstOperand (on digit)
   */
  private handleIdle(event: CalculatorEvent): CalculatorState {
    if (event.type === "digit") {
      // Guard: digit >= 0 && digit <= 9
      if (event.digit < 0 || event.digit > 9) {
        return this.state; // Stay in idle
      }
      this.buffer = event.digit.toString();
      return "enteringFirstOperand";
    }

    if (event.type === "clear") {
      this.resetAll();
      return "idle";
    }

    return this.state;
  }

  /**
   * Handle events in enteringFirstOperand state
   * Transitions:
   * - enteringFirstOperand → enteringFirstOperand (on digit, buffer.length < 10)
   * - enteringFirstOperand → enteringSecondOperand (on operation, buffer.length > 0)
   * - enteringFirstOperand → idle (on clear)
   */
  private handleEnteringFirstOperand(event: CalculatorEvent): CalculatorState {
    if (event.type === "digit") {
      // Guard: buffer.length < 10
      if (this.buffer.length < 10) {
        this.buffer += event.digit.toString();
      }
      return "enteringFirstOperand";
    }

    if (event.type === "operation") {
      // Guard: buffer.length > 0
      if (this.buffer.length > 0) {
        this.accumulator = parseFloat(this.buffer);
        this.pendingOperation = event.operation;
        this.buffer = "";
        return "enteringSecondOperand";
      }
      return this.state;
    }

    if (event.type === "clear") {
      this.resetAll();
      return "idle";
    }

    return this.state;
  }

  /**
   * Handle events in enteringSecondOperand state
   * Transitions:
   * - enteringSecondOperand → enteringSecondOperand (on digit, buffer.length < 10)
   * - enteringSecondOperand → showingResult (on equals, buffer.length > 0)
   * - enteringSecondOperand → error (on equals, divide by zero)
   * - enteringSecondOperand → idle (on clear)
   */
  private handleEnteringSecondOperand(event: CalculatorEvent): CalculatorState {
    if (event.type === "digit") {
      // Guard: buffer.length < 10
      if (this.buffer.length < 10) {
        this.buffer += event.digit.toString();
      }
      return "enteringSecondOperand";
    }

    if (event.type === "equals") {
      // Guard: buffer.length > 0 && accumulator !== null && pendingOperation !== null
      if (this.buffer.length === 0 || this.accumulator === null || this.pendingOperation === null) {
        return this.state;
      }

      // Special guard for division by zero
      if (this.pendingOperation === "DIVIDE" && parseFloat(this.buffer) === 0) {
        this.errorMessage = "Division by zero";
        return "error";
      }

      this.result = this.executeOperation(
        this.accumulator,
        parseFloat(this.buffer),
        this.pendingOperation
      );
      return "showingResult";
    }

    if (event.type === "clear") {
      this.resetAll();
      return "idle";
    }

    return this.state;
  }

  /**
   * Handle events in showingResult state
   * Transitions:
   * - showingResult → enteringFirstOperand (on digit)
   * - showingResult → idle (on clear)
   */
  private handleShowingResult(event: CalculatorEvent): CalculatorState {
    if (event.type === "digit") {
      this.buffer = event.digit.toString();
      this.result = null;
      return "enteringFirstOperand";
    }

    if (event.type === "clear") {
      this.resetAll();
      return "idle";
    }

    return this.state;
  }

  /**
   * Handle events in error state
   * Transitions:
   * - error → idle (on clear)
   */
  private handleError(event: CalculatorEvent): CalculatorState {
    if (event.type === "clear") {
      this.resetAll();
      return "idle";
    }

    return this.state;
  }

  /**
   * Execute the pending operation
   */
  private executeOperation(operand1: number, operand2: number, operation: Operation): number {
    switch (operation) {
      case "ADD":
        return operand1 + operand2;
      case "SUBTRACT":
        return operand1 - operand2;
      case "MULTIPLY":
        return operand1 * operand2;
      case "DIVIDE":
        return operand1 / operand2;
    }
  }

  /**
   * Reset calculator to initial state
   */
  private resetAll(): void {
    this.display = "0";
    this.buffer = "";
    this.accumulator = null;
    this.pendingOperation = null;
    this.result = null;
    this.errorMessage = "";
  }

  /**
   * Update display based on current state
   */
  private updateDisplay(): void {
    switch (this.state) {
      case "idle":
      case "enteringFirstOperand":
      case "enteringSecondOperand":
        this.display = this.buffer || "0";
        break;
      case "showingResult":
        this.display = this.result?.toString() || "0";
        break;
      case "error":
        this.display = "ERROR";
        break;
    }
  }
}

// ============================================================================
// BSIF Validation Tests
// ============================================================================

/**
 * Test suite validating this implementation against the BSIF state machine specification
 *
 * These tests verify that the TypeScript implementation correctly follows
 * the state transitions defined in calculator.bsif.json
 */
export const validationTests = {
  /**
   * Test: Basic addition flow (5 + 3 =)
   * Input: initialState="idle", events=[digit(5), operation(ADD), digit(3), equals]
   * Expected: finalState="showingResult", result=8
   */
  testBasicAdditionFlow: () => {
    const calc = new CalculatorStateMachine();

    calc.processEvent({ type: "digit", digit: 5 });
    if (calc.getState() !== "enteringFirstOperand") {
      throw new Error(`Expected enteringFirstOperand, got ${calc.getState()}`);
    }

    calc.processEvent({ type: "operation", operation: "ADD" });
    if (calc.getState() !== "enteringSecondOperand") {
      throw new Error(`Expected enteringSecondOperand, got ${calc.getState()}`);
    }

    calc.processEvent({ type: "digit", digit: 3 });
    if (calc.getState() !== "enteringSecondOperand") {
      throw new Error(`Expected enteringSecondOperand, got ${calc.getState()}`);
    }

    calc.processEvent({ type: "equals" });
    if (calc.getState() !== "showingResult") {
      throw new Error(`Expected showingResult, got ${calc.getState()}`);
    }

    if (calc.getResult() !== 8) {
      throw new Error(`Expected result 8, got ${calc.getResult()}`);
    }
  },

  /**
   * Test: Division by zero error
   * Input: initialState="idle", events=[digit(1), digit(0), operation(DIVIDE), digit(0), equals]
   * Expected: finalState="error", errorMessage="Division by zero"
   */
  testDivisionByZeroError: () => {
    const calc = new CalculatorStateMachine();

    calc.processEvent({ type: "digit", digit: 1 });
    calc.processEvent({ type: "digit", digit: 0 });
    calc.processEvent({ type: "operation", operation: "DIVIDE" });
    calc.processEvent({ type: "digit", digit: 0 });

    const transition = calc.processEvent({ type: "equals" });

    if (calc.getState() !== "error") {
      throw new Error(`Expected error state, got ${calc.getState()}`);
    }

    if (calc.getErrorMessage() !== "Division by zero") {
      throw new Error(`Expected error message 'Division by zero', got '${calc.getErrorMessage()}'`);
    }

    if (transition.to !== "error") {
      throw new Error(`Expected transition to error, got ${transition.to}`);
    }
  },

  /**
   * Test: Clear from any state returns to idle
   * Input: initialState="showingResult", events=[clear]
   * Expected: finalState="idle", display="0"
   */
  testClearFromAnyState: () => {
    const calc = new CalculatorStateMachine();

    // First get to showingResult state
    calc.processEvent({ type: "digit", digit: 5 });
    calc.processEvent({ type: "operation", operation: "ADD" });
    calc.processEvent({ type: "digit", digit: 3 });
    calc.processEvent({ type: "equals" });

    if (calc.getState() !== "showingResult") {
      throw new Error(`Expected showingResult, got ${calc.getState()}`);
    }

    // Now clear
    calc.processEvent({ type: "clear" });

    if (calc.getState() !== "idle") {
      throw new Error(`Expected idle, got ${calc.getState()}`);
    }

    const display = calc.getDisplay();
    if (display.value !== "0") {
      throw new Error(`Expected display '0', got '${display.value}'`);
    }
  }
};

// Run validation tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Running BSIF validation tests for CalculatorStateMachine...\n");

  try {
    validationTests.testBasicAdditionFlow();
    console.log("✓ Basic addition flow test passed");

    validationTests.testDivisionByZeroError();
    console.log("✓ Division by zero error test passed");

    validationTests.testClearFromAnyState();
    console.log("✓ Clear from any state test passed");

    console.log("\n✅ All BSIF validation tests passed!");
  } catch (err) {
    console.error("\n❌ Validation test failed:", (err as Error).message);
    process.exit(1);
  }
}
