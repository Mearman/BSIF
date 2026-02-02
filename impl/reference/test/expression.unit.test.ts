/**
 * BSIF Expression Schema Tests
 *
 * Tests for the dual-format expression support:
 * - String expressions (backward compatible)
 * - Structured AST expressions (new feature)
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
	expression,
	expressionAST,
	expressionLiteral,
	expressionVariable,
	expressionBinary,
	expressionUnary,
	isExpression,
	isStringExpression,
	isASTExpression,
	bsifDocument,
} from "../src/schemas.js";

describe("Expression Schema", () => {

	describe("String expressions", () => {
		it("accepts simple guard string", () => {
			const result = expression.safeParse("x > 5 && y < 10");
			assert.strictEqual(result.success, true);
		});

		it("accepts guard with null check", () => {
			const result = expression.safeParse("operand1 != null && operand2 != null");
			assert.strictEqual(result.success, true);
		});

		it("accepts action assignment", () => {
			const result = expression.safeParse("display = '0'");
			assert.strictEqual(result.success, true);
		});

		it("accepts complex boolean expression", () => {
			const result = expression.safeParse("(x > 5 || y < 10) && z === 0");
			assert.strictEqual(result.success, true);
		});
	});

	describe("Structured AST expressions", () => {
		it("accepts literal expression", () => {
			const expr = { literal: 5 };
			const result = expression.safeParse(expr);
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expr);
		});

		it("accepts variable reference", () => {
			const expr = { variable: "temperature" };
			const result = expression.safeParse(expr);
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expr);
		});

		it("accepts binary operation with two variables", () => {
			const expr = {
				operator: "&&",
				operands: [
					{ variable: "x" },
					{ variable: "y" }
				]
			};
			const result = expression.safeParse(expr);
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expr);
		});

		it("accepts binary operation with variable and literal", () => {
			const expr = {
				operator: ">",
				operands: [
					{ variable: "count" },
					{ literal: 5 }
				]
			};
			const result = expression.safeParse(expr);
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expr);
		});

		it("accepts unary not operation", () => {
			const expr = {
				operator: "!",
				operand: { variable: "isValid" }
			};
			const result = expression.safeParse(expr);
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expr);
		});

		it("accepts nested binary operations", () => {
			const expr = {
				operator: "&&",
				operands: [
					{
						operator: ">",
						operands: [
							{ variable: "x" },
							{ literal: 5 }
						]
					},
					{
						operator: "<",
						operands: [
							{ variable: "y" },
							{ literal: 10 }
						]
					}
				]
			};
			const result = expression.safeParse(expr);
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expr);
		});

		it("rejects invalid operator", () => {
			const expr = {
				operator: "invalid",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			};
			const result = expression.safeParse(expr);
			assert.strictEqual(result.success, false);
		});

		it("rejects missing operands in binary operation", () => {
			const expr = {
				operator: "&&",
				operands: [
					{ variable: "x" }
				]
			};
			const result = expression.safeParse(expr);
			assert.strictEqual(result.success, false);
		});
	});

	describe("Type guards", () => {
		it("isStringExpression returns true for string expressions", () => {
			assert.strictEqual(isStringExpression("x > 5"), true);
			assert.strictEqual(isStringExpression("operand != null"), true);
		});

		it("isStringExpression returns false for AST expressions", () => {
			assert.strictEqual(isStringExpression({ variable: "x" }), false);
			assert.strictEqual(isStringExpression({ literal: 5 }), false);
		});

		it("isASTExpression returns true for structured expressions", () => {
			assert.strictEqual(isASTExpression({ variable: "x" }), true);
			assert.strictEqual(isASTExpression({ literal: 5 }), true);
			assert.strictEqual(isASTExpression({
				operator: "&&",
				operands: [{ variable: "x" }, { variable: "y" }]
			}), true);
		});

		it("isASTExpression returns false for string expressions", () => {
			assert.strictEqual(isASTExpression("x > 5"), false);
		});

		it("isExpression returns true for both formats", () => {
			assert.strictEqual(isExpression("x > 5"), true);
			assert.strictEqual(isExpression({ variable: "x" }), true);
			assert.strictEqual(isExpression({ literal: 5 }), true);
		});
	});

	describe("Expression validation in BSIF documents", () => {
		it("validates BSIF document with structured guard expression", () => {
			const doc = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test-structured-guard"
				},
				semantics: {
					type: "state-machine",
					states: [
						{ name: "idle" },
						{ name: "active" }
					],
					transitions: [
						{
							from: "idle",
							to: "active",
							event: "start",
							guard: {
								operator: "&&",
								operands: [
									{ variable: "isReady" },
									{ literal: true }
								]
							}
						}
					],
					initial: "idle"
				}
			};

			const result = bsifDocument.safeParse(doc);
			assert.strictEqual(result.success, true, "Should accept structured guard");
		});

		it("validates BSIF document with string guard expression", () => {
			const doc = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test-string-guard"
				},
				semantics: {
					type: "state-machine",
					states: [
						{ name: "idle" },
						{ name: "active" }
					],
					transitions: [
						{
							from: "idle",
							to: "active",
							event: "start",
							guard: "isReady == true"
						}
					],
					initial: "idle"
				}
			};

			const result = bsifDocument.safeParse(doc);
			assert.strictEqual(result.success, true, "Should accept string guard");
		});

		it("validates BSIF document with structured entry action", () => {
			const doc = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test-structured-entry"
				},
				semantics: {
					type: "state-machine",
					states: [
						{
							name: "idle",
							entry: {
								operator: "=",
								operands: [
									{ variable: "display" },
									{ literal: "0" }
								]
							}
						}
					],
					transitions: [],
					initial: "idle"
				}
			};

			const result = bsifDocument.safeParse(doc);
			assert.strictEqual(result.success, true, "Should accept structured entry action");
		});

		it("validates BSIF document with string entry action", () => {
			const doc = {
				metadata: {
					bsif_version: "1.0.0",
					name: "test-string-entry"
				},
				semantics: {
					type: "state-machine",
					states: [
						{
							name: "idle",
							entry: "display = '0'"
						}
					],
					transitions: [],
					initial: "idle"
				}
			};

			const result = bsifDocument.safeParse(doc);
			assert.strictEqual(result.success, true, "Should accept string entry action");
		});
	});
});
