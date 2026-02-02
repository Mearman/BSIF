/**
 * Expression Parser Unit Tests
 *
 * Tests for parsing JavaScript-like string expressions into structured AST format.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { parseExpression, tryParseExpression, isValidExpression, ExpressionParser } from "../src/parser/expression-parser.js";
import type { ExpressionAST } from "../src/schemas.js";

describe("Expression Parser", () => {

	describe("Literals", () => {
		it("parses number literal", () => {
			const result = parseExpression("42");
			assert.deepStrictEqual(result, { literal: 42 });
		});

		it("parses negative number literal", () => {
			const result = parseExpression("-42");
			assert.deepStrictEqual(result, {
				operator: "-",
				operand: { literal: 42 }
			});
		});

		it("parses floating point number", () => {
			const result = parseExpression("3.14");
			assert.deepStrictEqual(result, { literal: 3.14 });
		});

		it("parses string literal", () => {
			const result = parseExpression("'hello'");
			assert.deepStrictEqual(result, { literal: "hello" });
		});

		it("parses double-quoted string", () => {
			const result = parseExpression('"world"');
			assert.deepStrictEqual(result, { literal: "world" });
		});

		it("parses boolean true", () => {
			const result = parseExpression("true");
			assert.deepStrictEqual(result, { literal: true });
		});

		it("parses boolean false", () => {
			const result = parseExpression("false");
			assert.deepStrictEqual(result, { literal: false });
		});

		it("parses null", () => {
			const result = parseExpression("null");
			assert.deepStrictEqual(result, { literal: null });
		});
	});

	describe("Variables", () => {
		it("parses simple variable", () => {
			const result = parseExpression("x");
			assert.deepStrictEqual(result, { variable: "x" });
		});

		it("parses variable with underscores", () => {
			const result = parseExpression("my_var");
			assert.deepStrictEqual(result, { variable: "my_var" });
		});

		it("parses variable with dollar sign", () => {
			const result = parseExpression("$value");
			assert.deepStrictEqual(result, { variable: "$value" });
		});

		it("parses member access (obj.prop)", () => {
			const result = parseExpression("buffer.length");
			assert.deepStrictEqual(result, {
				member: { target: { variable: "buffer" }, property: "length" }
			});
		});

		it("parses chained member access", () => {
			const result = parseExpression("obj.prop.nested");
			assert.deepStrictEqual(result, {
				member: {
					target: {
						member: {
							target: { variable: "obj" },
							property: "prop"
						}
					},
					property: "nested"
				}
			});
		});
	});

	describe("Unary operators", () => {
		it("parses logical NOT", () => {
			const result = parseExpression("!flag");
			assert.deepStrictEqual(result, {
				operator: "!",
				operand: { variable: "flag" }
			});
		});

		it("parses unary minus", () => {
			const result = parseExpression("-value");
			assert.deepStrictEqual(result, {
				operator: "-",
				operand: { variable: "value" }
			});
		});

		it("parses unary plus", () => {
			const result = parseExpression("+value");
			assert.deepStrictEqual(result, {
				operator: "+",
				operand: { variable: "value" }
			});
		});

		it("parses double negation", () => {
			const result = parseExpression("!!flag");
			assert.deepStrictEqual(result, {
				operator: "!",
				operand: {
					operator: "!",
					operand: { variable: "flag" }
				}
			});
		});
	});

	describe("Binary operators - Comparison", () => {
		it("parses equals (==)", () => {
			const result = parseExpression("x == 5");
			assert.deepStrictEqual(result, {
				operator: "==",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			});
		});

		it("parses not equals (!=)", () => {
			const result = parseExpression("x != 5");
			assert.deepStrictEqual(result, {
				operator: "!=",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			});
		});

		it("parses less than (<)", () => {
			const result = parseExpression("x < 5");
			assert.deepStrictEqual(result, {
				operator: "<",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			});
		});

		it("parses less than or equal (<=)", () => {
			const result = parseExpression("x <= 5");
			assert.deepStrictEqual(result, {
				operator: "<=",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			});
		});

		it("parses greater than (>)", () => {
			const result = parseExpression("x > 5");
			assert.deepStrictEqual(result, {
				operator: ">",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			});
		});

		it("parses greater than or equal (>=)", () => {
			const result = parseExpression("x >= 5");
			assert.deepStrictEqual(result, {
				operator: ">=",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			});
		});

		it("parses strict equals (===)", () => {
			const result = parseExpression("x === 5");
			assert.deepStrictEqual(result, {
				operator: "===",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			});
		});

		it("parses strict not equals (!==)", () => {
			const result = parseExpression("x !== 5");
			assert.deepStrictEqual(result, {
				operator: "!==",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			});
		});
	});

	describe("Binary operators - Logical", () => {
		it("parses AND (&&)", () => {
			const result = parseExpression("x && y");
			assert.deepStrictEqual(result, {
				operator: "&&",
				operands: [
					{ variable: "x" },
					{ variable: "y" }
				]
			});
		});

		it("parses OR (||)", () => {
			const result = parseExpression("x || y");
			assert.deepStrictEqual(result, {
				operator: "||",
				operands: [
					{ variable: "x" },
					{ variable: "y" }
				]
			});
		});
	});

	describe("Binary operators - Arithmetic", () => {
		it("parses addition (+)", () => {
			const result = parseExpression("x + y");
			assert.deepStrictEqual(result, {
				operator: "+",
				operands: [
					{ variable: "x" },
					{ variable: "y" }
				]
			});
		});

		it("parses subtraction (-)", () => {
			const result = parseExpression("x - y");
			assert.deepStrictEqual(result, {
				operator: "-",
				operands: [
					{ variable: "x" },
					{ variable: "y" }
				]
			});
		});

		it("parses multiplication (*)", () => {
			const result = parseExpression("x * y");
			assert.deepStrictEqual(result, {
				operator: "*",
				operands: [
					{ variable: "x" },
					{ variable: "y" }
				]
			});
		});

		it("parses division (/)", () => {
			const result = parseExpression("x / y");
			assert.deepStrictEqual(result, {
				operator: "/",
				operands: [
					{ variable: "x" },
					{ variable: "y" }
				]
			});
		});

		it("parses modulo (%)", () => {
			const result = parseExpression("x % y");
			assert.deepStrictEqual(result, {
				operator: "%",
				operands: [
					{ variable: "x" },
					{ variable: "y" }
				]
			});
		});
	});

	describe("Binary operators - Assignment", () => {
		it("parses assignment (=)", () => {
			const result = parseExpression("x = 5");
			assert.deepStrictEqual(result, {
				operator: "=",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			});
		});
	});

	describe("Operator precedence", () => {
		it("multiplication binds tighter than addition", () => {
			const result = parseExpression("x + y * z");
			assert.deepStrictEqual(result, {
				operator: "+",
				operands: [
					{ variable: "x" },
					{
						operator: "*",
						operands: [
							{ variable: "y" },
							{ variable: "z" }
						]
					}
				]
			});
		});

		it("comparison binds tighter than logical AND", () => {
			const result = parseExpression("x > 5 && y < 10");
			assert.deepStrictEqual(result, {
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
			});
		});

		it("logical OR binds looser than AND", () => {
			const result = parseExpression("x && y || z");
			assert.deepStrictEqual(result, {
				operator: "||",
				operands: [
					{
						operator: "&&",
						operands: [
							{ variable: "x" },
							{ variable: "y" }
						]
					},
					{ variable: "z" }
				]
			});
		});

		it("parentheses override precedence", () => {
			const result = parseExpression("(x + y) * z");
			assert.deepStrictEqual(result, {
				operator: "*",
				operands: [
					{
						operator: "+",
						operands: [
							{ variable: "x" },
							{ variable: "y" }
						]
					},
					{ variable: "z" }
				]
			});
		});
	});

	describe("Complex expressions", () => {
		it("parses chained comparisons", () => {
			const result = parseExpression("x >= 0 && x <= 100");
			assert.deepStrictEqual(result, {
				operator: "&&",
				operands: [
					{
						operator: ">=",
						operands: [
							{ variable: "x" },
							{ literal: 0 }
						]
					},
					{
						operator: "<=",
						operands: [
							{ variable: "x" },
							{ literal: 100 }
						]
					}
				]
			});
		});

		it("parses null check with comparison", () => {
			const result = parseExpression("operand1 != null && operand2 != null");
			assert.deepStrictEqual(result, {
				operator: "&&",
				operands: [
					{
						operator: "!=",
						operands: [
							{ variable: "operand1" },
							{ literal: null }
						]
					},
					{
						operator: "!=",
						operands: [
							{ variable: "operand2" },
							{ literal: null }
						]
					}
				]
			});
		});

		it("parses member access in comparison", () => {
			const result = parseExpression("buffer.length < 10");
			assert.deepStrictEqual(result, {
				operator: "<",
				operands: [
					{ member: { target: { variable: "buffer" }, property: "length" } },
					{ literal: 10 }
				]
			});
		});

		it("parses complex boolean expression", () => {
			const result = parseExpression("(x > 5 || y < 10) && z === 0");
			assert.deepStrictEqual(result, {
				operator: "&&",
				operands: [
					{
						operator: "||",
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
					},
					{
						operator: "===",
						operands: [
							{ variable: "z" },
							{ literal: 0 }
						]
					}
				]
			});
		});
	});

	describe("Error handling", () => {
		it("throws on unexpected character", () => {
			assert.throws(
				() => parseExpression("x @ y"),
				/Unexpected character '@'/
			);
		});

		it("throws on unclosed parenthesis", () => {
			assert.throws(
				() => parseExpression("(x + y"),
				/Expected RPAREN/
			);
		});

		it("throws on empty expression", () => {
			assert.throws(
				() => parseExpression(""),
				/Unexpected token/
			);
		});

		it("throws on trailing operator", () => {
			assert.throws(
				() => parseExpression("x +"),
				/Unexpected token/
			);
		});
	});

	describe("Utility functions", () => {
		it("tryParseExpression returns null for invalid input", () => {
			const result = tryParseExpression("x @ y");
			assert.strictEqual(result, null);
		});

		it("tryParseExpression returns AST for valid input", () => {
			const result = tryParseExpression("x > 5");
			assert.deepStrictEqual(result, {
				operator: ">",
				operands: [
					{ variable: "x" },
					{ literal: 5 }
				]
			});
		});

		it("isValidExpression returns true for valid input", () => {
			assert.strictEqual(isValidExpression("x > 5 && y < 10"), true);
		});

		it("isValidExpression returns false for invalid input", () => {
			assert.strictEqual(isValidExpression("x @ y"), false);
		});
	});

	describe("Real-world examples from BSIF specs", () => {
		it("parses calculator guard: digit >= 0 && digit <= 9", () => {
			const result = parseExpression("digit >= 0 && digit <= 9");
			assert.strictEqual(result.operator, "&&");
			assert.strictEqual((result as ExpressionBinary).operands.length, 2);
		});

		it("parses buffer.length < 10", () => {
			const result = parseExpression("buffer.length < 10");
			assert.deepStrictEqual(result, {
				operator: "<",
				operands: [
					{ member: { target: { variable: "buffer" }, property: "length" } },
					{ literal: 10 }
				]
			});
		});

		it("parses accumulator !== null", () => {
			const result = parseExpression("accumulator !== null");
			assert.deepStrictEqual(result, {
				operator: "!==",
				operands: [
					{ variable: "accumulator" },
					{ literal: null }
				]
			});
		});
	});

	describe("Function calls", () => {
		it("parses simple function call with no arguments", () => {
			const result = parseExpression("readyForInput()");
			assert.deepStrictEqual(result, {
				call: "readyForInput",
				arguments: []
			});
		});

		it("parses function call with single argument", () => {
			const result = parseExpression("parseFloat(buffer)");
			assert.deepStrictEqual(result, {
				call: "parseFloat",
				arguments: [
					{ variable: "buffer" }
				]
			});
		});

		it("parses function call with multiple arguments", () => {
			const result = parseExpression("executeOperation(a, b, op)");
			assert.deepStrictEqual(result, {
				call: "executeOperation",
				arguments: [
					{ variable: "a" },
					{ variable: "b" },
					{ variable: "op" }
				]
			});
		});

		it("parses function call with literal arguments", () => {
			const result = parseExpression('display.toString()');
			assert.deepStrictEqual(result, {
				call: "display.toString",
				arguments: []
			});
		});

		it("parses nested function calls", () => {
			const result = parseExpression("func1(func2(x))");
			assert.deepStrictEqual(result, {
				call: "func1",
				arguments: [
					{
						call: "func2",
						arguments: [{ variable: "x" }]
					}
				]
			});
		});

		it("parses function call in expression", () => {
			const result = parseExpression("parseFloat(buffer) === 0");
			assert.deepStrictEqual(result, {
				operator: "===",
				operands: [
					{
						call: "parseFloat",
						arguments: [{ variable: "buffer" }]
					},
					{ literal: 0 }
				]
			});
		});
	});

	describe("Array access", () => {
		it("parses simple array access with numeric index", () => {
			const result = parseExpression("arr[0]");
			assert.deepStrictEqual(result, {
				access: {
					target: { variable: "arr" },
					index: { literal: 0 }
				}
			});
		});

		it("parses array access with variable index", () => {
			const result = parseExpression("items[index]");
			assert.deepStrictEqual(result, {
				access: {
					target: { variable: "items" },
					index: { variable: "index" }
				}
			});
		});

		it("parses array access with expression index", () => {
			const result = parseExpression("data[i + 1]");
			assert.deepStrictEqual(result, {
				access: {
					target: { variable: "data" },
					index: {
						operator: "+",
						operands: [
							{ variable: "i" },
							{ literal: 1 }
						]
					}
				}
			});
		});

		it("parses chained array access", () => {
			const result = parseExpression("matrix[0][1]");
			assert.deepStrictEqual(result, {
				access: {
					target: {
						access: {
							target: { variable: "matrix" },
							index: { literal: 0 }
						}
					},
					index: { literal: 1 }
				}
			});
		});

		it("parses property access after array access", () => {
			const result = parseExpression("arr[0].prop");
			assert.deepStrictEqual(result, {
				member: {
					target: {
						access: {
							target: { variable: "arr" },
							index: { literal: 0 }
						}
					},
					property: "prop"
				}
			});
		});

		it("parses chained member access", () => {
			const result = parseExpression("obj.prop.nested");
			assert.deepStrictEqual(result, {
				member: {
					target: {
						member: {
							target: { variable: "obj" },
							property: "prop"
						}
					},
					property: "nested"
				}
			});
		});

		it("parses array access followed by chained member access", () => {
			const result = parseExpression("data[0].prop.value");
			assert.deepStrictEqual(result, {
				member: {
					target: {
						member: {
							target: {
								access: {
									target: { variable: "data" },
									index: { literal: 0 }
								}
							},
							property: "prop"
						}
					},
					property: "value"
				}
			});
		});

		it("parses array access in expression", () => {
			const result = parseExpression("arr[0] > 5");
			assert.deepStrictEqual(result, {
				operator: ">",
				operands: [
					{
						access: {
							target: { variable: "arr" },
							index: { literal: 0 }
						}
					},
					{ literal: 5 }
				]
			});
		});
	});

	describe("Statement sequences", () => {
		it("parses simple two-statement sequence", () => {
			const result = parseExpression("x = 1; y = 2");
			assert.deepStrictEqual(result, {
				sequence: [
					{
						operator: "=",
						operands: [{ variable: "x" }, { literal: 1 }]
					},
					{
						operator: "=",
						operands: [{ variable: "y" }, { literal: 2 }]
					}
				]
			});
		});

		it("parses multi-statement sequence with trailing semicolon", () => {
			const result = parseExpression("a = 1; b = 2;");
			assert.deepStrictEqual(result, {
				sequence: [
					{
						operator: "=",
						operands: [{ variable: "a" }, { literal: 1 }]
					},
					{
						operator: "=",
						operands: [{ variable: "b" }, { literal: 2 }]
					}
				]
			});
		});

		it("parses three-statement sequence", () => {
			const result = parseExpression("display = '0'; accumulator = null; pendingOperation = null");
			assert.strictEqual(result.sequence?.length, 3);
		});

		it("parses statement sequence with function calls", () => {
			const result = parseExpression("resetAll(); display = '0'");
			assert.deepStrictEqual(result, {
				sequence: [
					{ call: "resetAll", arguments: [] },
					{
						operator: "=",
						operands: [
							{ variable: "display" },
							{ literal: "0" }
						]
					}
				]
			});
		});

		it("parses complex statement sequence from BSIF spec", () => {
			const result = parseExpression("display = result.toString(); result = null");
			assert.strictEqual(result.sequence?.length, 2);
			const first = result.sequence![0]!;
			assert.strictEqual("operator" in first, true);
			assert.strictEqual((first as { operator: string }).operator, "=");
		});
	});
});
