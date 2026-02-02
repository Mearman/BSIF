/**
 * BSIF Contract Testing Framework
 *
 * This module provides utilities for treating BSIF specifications as executable
 * contracts that TypeScript implementations must satisfy. Similar to how OpenAPI
 * contracts can validate implementations, BSIF specs can validate behavioral
 * implementations.
 *
 * Usage:
 *   import { createContractTest } from "./bsif-contract.js";
 *   const contract = createContractTest(specPath);
 *   contract.validateImplementation(implementation);
 */

import { readFileSync } from "node:fs";
import { parseContent } from "../src/parser.js";
import { validate } from "../src/index.js";
import { join } from "node:path";

/**
 * Contract test result
 */
export interface ContractTestResult {
  passed: boolean;
  spec: {
    path: string;
    name: string;
    version: string;
    semanticType: string;
  };
  results: {
    specValid: boolean;
    specErrors: unknown[];
    implementationResults: ImplementationTestResult[];
  };
}

export interface ImplementationTestResult {
  testName: string;
  passed: boolean;
  error?: string;
}

/**
 * Create a contract test from a BSIF specification file
 */
export function createContractTest(specPath: string): BSIFContract {
  const spec = readFileSync(specPath, "utf-8");
  const document = parseContent(spec, specPath);
  const validation = validate(document);

  return new BSIFContract(document, validation, specPath);
}

/**
 * BSIF Contract class
 *
 * Represents a BSIF specification as an executable contract that
 * implementations must satisfy.
 */
export class BSIFContract {
  private document: ReturnType<typeof parseContent>;
  private validation: ReturnType<typeof validate>;
  private specPath: string;

  constructor(
    document: ReturnType<typeof parseContent>,
    validation: ReturnType<typeof validate>,
    specPath: string
  ) {
    this.document = document;
    this.validation = validation;
    this.specPath = specPath;
  }

  /**
   * Get the specification metadata
   */
  getMetadata() {
    return this.document.metadata;
  }

  /**
   * Get the semantic type of this specification
   */
  getSemanticType(): string {
    return this.document.semantics.type;
  }

  /**
   * Check if this specification is valid
   */
  isValid(): boolean {
    return this.validation.valid;
  }

  /**
   * Get validation errors
   */
  getErrors() {
    return this.validation.errors;
  }

  /**
   * Get the semantics section
   */
  getSemantics() {
    return this.document.semantics;
  }

  /**
   * Validate an implementation against this contract
   *
   * Tests each test case defined in the BSIF specification's tests section
   * and verifies that the implementation produces the expected outputs.
   */
  validateImplementation(implementation: {
    // For interaction specs
    processMessage?: (message: unknown) => unknown;
    // For state machine specs
    processEvent?: (event: unknown) => unknown;
    // For temporal specs
    checkProperty?: (propertyName: string) => boolean;
    // Generic getState
    getState?: () => unknown;
  }): ContractTestResult {
    const results: ImplementationTestResult[] = [];

    // Run test cases from the BSIF specification
    const tests = this.document.tests || [];

    for (const testCase of tests) {
      try {
        this.runTestCase(testCase, implementation);
        results.push({
          testName: testCase.name,
          passed: true
        });
      } catch (err) {
        results.push({
          testName: testCase.name,
          passed: false,
          error: (err as Error).message
        });
      }
    }

    return {
      passed: results.every(r => r.passed),
      spec: {
        path: this.specPath,
        name: this.document.metadata.name,
        version: this.document.metadata.version || "unknown",
        semanticType: this.getSemanticType()
      },
      results: {
        specValid: this.isValid(),
        specErrors: this.getErrors(),
        implementationResults: results
      }
    };
  }

  /**
   * Run a single test case from the BSIF specification
   */
  private runTestCase(
    testCase: {
      name: string;
      description: string;
      input: unknown;
      expected: unknown;
    },
    implementation: {
      processMessage?: (message: unknown) => unknown;
      processEvent?: (event: unknown) => unknown;
      getState?: () => unknown;
    }
  ): void {
    const { input, expected } = testCase;
    const semanticType = this.getSemanticType();

    switch (semanticType) {
      case "interaction": {
        if (!implementation.processMessage) {
          throw new Error("Implementation must provide processMessage for interaction specs");
        }
        const result = implementation.processMessage(input);
        this.assertMatchesExpected(result, expected, testCase.name);
        break;
      }

      case "state-machine": {
        if (!implementation.processEvent) {
          throw new Error("Implementation must provide processEvent for state machine specs");
        }
        // Handle state machine input which may have events array
        const events = (input as { events?: unknown[] }).events || [input];
        let result: unknown = implementation.getState?.() || {};

        for (const event of events) {
          result = implementation.processEvent(event);
        }

        this.assertMatchesExpected(result, expected, testCase.name);
        break;
      }

      case "temporal": {
        // Temporal specs verify properties over execution traces
        // This would require running a trace and checking properties
        throw new Error("Temporal contract testing not yet implemented");
      }

      default:
        throw new Error(`Unsupported semantic type: ${semanticType}`);
    }
  }

  /**
   * Assert that the result matches the expected output
   *
   * Does a partial match: checks that all fields in expected are present
   * and match in result, but allows result to have extra fields.
   */
  private assertMatchesExpected(result: unknown, expected: unknown, testName: string): void {
    // Handle primitive types
    if (expected === null || expected === undefined || typeof expected !== "object") {
      const resultStr = JSON.stringify(result);
      const expectedStr = JSON.stringify(expected);
      if (resultStr !== expectedStr) {
        throw new Error(
          `Expected ${expectedStr} but got ${resultStr}`
        );
      }
      return;
    }

    // For objects, do partial match - check all expected fields are in result
    if (Array.isArray(expected)) {
      if (!Array.isArray(result)) {
        throw new Error(`Expected array but got ${typeof result}`);
      }
      if (expected.length !== result.length) {
        throw new Error(`Expected array length ${expected.length} but got ${result.length}`);
      }
      for (let i = 0; i < expected.length; i++) {
        this.assertMatchesExpected(result[i], expected[i], testName);
      }
      return;
    }

    if (!result || typeof result !== "object") {
      throw new Error(`Expected object but got ${typeof result}`);
    }

    const expectedObj = expected as Record<string, unknown>;
    const resultObj = result as Record<string, unknown>;

    for (const [key, expectedValue] of Object.entries(expectedObj)) {
      const actualValue = resultObj[key];
      const expectedStr = JSON.stringify(expectedValue);
      const actualStr = JSON.stringify(actualValue);
      if (actualStr !== expectedStr) {
        throw new Error(
          `Expected ${key}=${expectedStr} but got ${key}=${actualStr}`
        );
      }
    }
  }

  /**
   * Get test cases from the specification
   */
  getTestCases() {
    return this.document.tests || [];
  }

  /**
   * Get documentation from the specification
   */
  getDocumentation() {
    return this.document.documentation;
  }
}

/**
 * Validate an implementation against a BSIF contract
 *
 * Convenience function that creates a contract from a spec file
 * and validates the implementation against it.
 */
export function validateAgainstContract(
  specPath: string,
  implementation: Parameters<BSIFContract["validateImplementation"]>[0]
): ContractTestResult {
  const contract = createContractTest(specPath);
  return contract.validateImplementation(implementation);
}

/**
 * Create a contract test suite from a BSIF specification
 *
 * Returns an object with test functions that can be used with
 * Node.js test runners (node:test, Jest, etc.)
 */
export function createContractTestSuite(specPath: string) {
  const contract = createContractTest(specPath);
  const tests = contract.getTestCases();

  return {
    metadata: contract.getMetadata(),
    semanticType: contract.getSemanticType(),

    // Individual test functions for each test case in the spec
    tests: tests.map((testCase) => {
      return {
        name: testCase.name,
        description: testCase.description,
        fn: (implementation: Parameters<BSIFContract["validateImplementation"]>[0]) => {
          try {
            contract.runTestCase(testCase, implementation);
          } catch (err) {
            throw new Error(
              `Test "${testCase.name}" failed: ${(err as Error).message}`
            );
          }
        }
      };
    })
  };
}
