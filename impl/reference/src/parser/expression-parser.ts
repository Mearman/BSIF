// BSIF Expression Parser
// Converts JavaScript-like string expressions to structured AST format

import type { ExpressionAST, ExpressionLiteral, ExpressionVariable, ExpressionBinary, ExpressionUnary } from "../schemas.js";

//==============================================================================
// Tokenizer
//==============================================================================

interface Token {
	readonly type: TokenType;
	readonly value: string;
	readonly position: number;
}

enum TokenType {
	// Literals
	NUMBER,
	STRING,
	BOOLEAN,
	NULL,

	// Identifiers and keywords
	IDENTIFIER,

	// Operators
	ASSIGN,       // =
	EQ,           // ==
	NEQ,          // !=
	LT,           // <
	LTE,          // <=
	GT,           // >
	GTE,          // >=
	EQ_STRICT,    // ===
	NEQ_STRICT,   // !==
	AND,          // &&
	OR,           // ||
	NOT,          // !
	PLUS,         // +
	MINUS,        // *
	TIMES,        // *
	DIVIDE,       // /
	MODULO,       // %

	// Delimiters
	LPAREN,       // (
	RPAREN,       // )
	DOT,          // .
	COMMA,        // ,

	// End
	EOF,
}

const KEYWORDS = new Set(["true", "false", "null"]);

function tokenize(input: string): Token[] {
	const tokens: Token[] = [];
	let position = 0;

	function peek(offset = 0): string | undefined {
		return input[position + offset];
	}

	function advance(): string | undefined {
		return input[position++];
	}

	function skipWhitespace(): void {
		while (position < input.length && /\s/.test(input[position]!)) {
			position++;
		}
	}

	while (position < input.length) {
		skipWhitespace();

		if (position >= input.length) break;

		const char = input[position]!;
		const startPos = position;

		// Numbers
		if (/\d/.test(char)) {
			let num = "";
			while (position < input.length && /[\d.]/.test(input[position]!)) {
				num += input[position++]!;
			}
			tokens.push({ type: TokenType.NUMBER, value: num, position: startPos });
			continue;
		}

		// Strings
		if (char === '"' || char === "'") {
			const quote = char;
			let str = "";
			position++; // skip opening quote
			while (position < input.length && input[position] !== quote) {
				str += input[position++]!;
			}
			position++; // skip closing quote
			tokens.push({ type: TokenType.STRING, value: str, position: startPos });
			continue;
		}

		// Identifiers and keywords
		if (/[a-zA-Z_$]/.test(char)) {
			let ident = "";
			while (position < input.length && /[a-zA-Z0-9_$]/.test(input[position]!)) {
				ident += input[position++]!;
			}

			if (ident === "true") {
				tokens.push({ type: TokenType.BOOLEAN, value: "true", position: startPos });
			} else if (ident === "false") {
				tokens.push({ type: TokenType.BOOLEAN, value: "false", position: startPos });
			} else if (ident === "null") {
				tokens.push({ type: TokenType.NULL, value: "null", position: startPos });
			} else {
				tokens.push({ type: TokenType.IDENTIFIER, value: ident, position: startPos });
			}
			continue;
		}

		// Operators and delimiters (multi-char first)
		if (char === "=" && peek(1) === "=") {
			if (peek(2) === "=") {
				tokens.push({ type: TokenType.EQ_STRICT, value: "===", position: startPos });
				position += 3;
			} else {
				tokens.push({ type: TokenType.EQ, value: "==", position: startPos });
				position += 2;
			}
			continue;
		}

		if (char === "!" && peek(1) === "=") {
			if (peek(2) === "=") {
				tokens.push({ type: TokenType.NEQ_STRICT, value: "!==", position: startPos });
				position += 3;
			} else {
				tokens.push({ type: TokenType.NEQ, value: "!=", position: startPos });
				position += 2;
			}
			continue;
		}

		if (char === "<" && peek(1) === "=") {
			tokens.push({ type: TokenType.LTE, value: "<=", position: startPos });
			position += 2;
			continue;
		}

		if (char === ">" && peek(1) === "=") {
			tokens.push({ type: TokenType.GTE, value: ">=", position: startPos });
			position += 2;
			continue;
		}

		if (char === "&" && peek(1) === "&") {
			tokens.push({ type: TokenType.AND, value: "&&", position: startPos });
			position += 2;
			continue;
		}

		if (char === "|" && peek(1) === "|") {
			tokens.push({ type: TokenType.OR, value: "||", position: startPos });
			position += 2;
			continue;
		}

		// Single-char operators and delimiters
		switch (char) {
			case "=":
				tokens.push({ type: TokenType.ASSIGN, value: "=", position: startPos });
				break;
			case "<":
				tokens.push({ type: TokenType.LT, value: "<", position: startPos });
				break;
			case ">":
				tokens.push({ type: TokenType.GT, value: ">", position: startPos });
				break;
			case "!":
				tokens.push({ type: TokenType.NOT, value: "!", position: startPos });
				break;
			case "+":
				tokens.push({ type: TokenType.PLUS, value: "+", position: startPos });
				break;
			case "-":
				tokens.push({ type: TokenType.MINUS, value: "-", position: startPos });
				break;
			case "*":
				tokens.push({ type: TokenType.TIMES, value: "*", position: startPos });
				break;
			case "/":
				tokens.push({ type: TokenType.DIVIDE, value: "/", position: startPos });
				break;
			case "%":
				tokens.push({ type: TokenType.MODULO, value: "%", position: startPos });
				break;
			case "(":
				tokens.push({ type: TokenType.LPAREN, value: "(", position: startPos });
				break;
			case ")":
				tokens.push({ type: TokenType.RPAREN, value: ")", position: startPos });
				break;
			case ".":
				tokens.push({ type: TokenType.DOT, value: ".", position: startPos });
				break;
			case ",":
				tokens.push({ type: TokenType.COMMA, value: ",", position: startPos });
				break;
			default:
				throw new Error(`Unexpected character '${char}' at position ${startPos}`);
		}
		position++;
	}

	tokens.push({ type: TokenType.EOF, value: "", position: input.length });
	return tokens;
}

//==============================================================================
// Parser
//==============================================================================

export interface ParseError {
	readonly message: string;
	readonly position: number;
}

export class ExpressionParser {
	private tokens: readonly Token[];
	private pos = 0;

	constructor(input: string) {
		this.tokens = tokenize(input);
	}

	private peek(): Token {
		return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1]!;
	}

	private consume(): Token {
		return this.tokens[this.pos++]!;
	}

	private expect(type: TokenType): Token {
		const token = this.peek();
		if (token.type !== type) {
			throw new Error(`Expected ${TokenType[type]} but got ${TokenType[token.type]} at position ${token.position}`);
		}
		return this.consume();
	}

	// Precedence levels (higher = tighter binding)
	private readonly PRECEDENCE: Record<TokenType, number> = {
		[TokenType.ASSIGN]: 1,
		[TokenType.OR]: 2,
		[TokenType.AND]: 3,
		[TokenType.EQ]: 4,
		[TokenType.NEQ]: 4,
		[TokenType.EQ_STRICT]: 4,
		[TokenType.NEQ_STRICT]: 4,
		[TokenType.LT]: 5,
		[TokenType.LTE]: 5,
		[TokenType.GT]: 5,
		[TokenType.GTE]: 5,
		[TokenType.PLUS]: 6,
		[TokenType.MINUS]: 6,
		[TokenType.TIMES]: 7,
		[TokenType.DIVIDE]: 7,
		[TokenType.MODULO]: 7,
	};

	private getPrecedence(token: Token): number {
		return this.PRECEDENCE[token.type] ?? 0;
	}

	parse(): ExpressionAST {
		const expr = this.parseExpression();
		if (this.peek().type !== TokenType.EOF) {
			throw new Error(`Unexpected token ${TokenType[this.peek().type]} at position ${this.peek().position}`);
		}
		return expr;
	}

	private parseExpression(minPrecedence = 0): ExpressionAST {
		// Parse unary operators or primary expression
		let left: ExpressionAST;

		const token = this.peek();

		// Unary operators
		if (token.type === TokenType.NOT || token.type === TokenType.MINUS || token.type === TokenType.PLUS) {
			this.consume();
			const operand = this.parseExpression(8); // Unary has highest precedence
			const opMap: Record<TokenType, ExpressionUnary["operator"]> = {
				[TokenType.NOT]: "!",
				[TokenType.MINUS]: "-",
				[TokenType.PLUS]: "+",
			};
			left = {
				operator: opMap[token.type]!,
				operand,
			};
		} else {
			left = this.parsePrimary();
		}

		// Parse binary operators
		while (this.peek().type !== TokenType.EOF && this.peek().type !== TokenType.RPAREN && this.peek().type !== TokenType.COMMA) {
			const opToken = this.peek();
			const precedence = this.getPrecedence(opToken);

			if (precedence < minPrecedence) break;

			this.consume();

			const opMap: Record<number, ExpressionBinary["operator"]> = {
				[TokenType.ASSIGN]: "=",
				[TokenType.EQ]: "==",
				[TokenType.NEQ]: "!=",
				[TokenType.LT]: "<",
				[TokenType.LTE]: "<=",
				[TokenType.GT]: ">",
				[TokenType.GTE]: ">=",
				[TokenType.EQ_STRICT]: "===",
				[TokenType.NEQ_STRICT]: "!==",
				[TokenType.AND]: "&&",
				[TokenType.OR]: "||",
				[TokenType.PLUS]: "+",
				[TokenType.MINUS]: "-",
				[TokenType.TIMES]: "*",
				[TokenType.DIVIDE]: "/",
				[TokenType.MODULO]: "%",
			};

			const operator = opMap[opToken.type];
			if (!operator) {
				throw new Error(`Unknown operator ${TokenType[opToken.type]} at position ${opToken.position}`);
			}

			const right = this.parseExpression(precedence + 1);

			left = {
				operator,
				operands: [left, right],
			};
		}

		return left;
	}

	private parsePrimary(): ExpressionAST {
		const token = this.peek();

		switch (token.type) {
			case TokenType.NUMBER: {
				this.consume();
				return { literal: parseFloat(token.value) };
			}

			case TokenType.STRING: {
				this.consume();
				return { literal: token.value };
			}

			case TokenType.BOOLEAN: {
				this.consume();
				return { literal: token.value === "true" };
			}

			case TokenType.NULL: {
				this.consume();
				return { literal: null };
			}

			case TokenType.IDENTIFIER: {
				// Check for member access: obj.prop
				let varName = this.consume().value;
				while (this.peek().type === TokenType.DOT) {
					this.consume(); // consume dot
					const prop = this.expect(TokenType.IDENTIFIER);
					varName += "." + prop.value;
				}
				return { variable: varName };
			}

			case TokenType.LPAREN: {
				this.consume(); // consume '('
				const expr = this.parseExpression();
				this.expect(TokenType.RPAREN); // consume ')'
				return expr;
			}

			default:
				throw new Error(`Unexpected token ${TokenType[token.type]} (${token.value}) at position ${token.position}`);
		}
	}
}

//==============================================================================
// Public API
//==============================================================================

/**
 * Parse a string expression into structured AST format
 * @throws {Error} If the expression is syntactically invalid
 */
export function parseExpression(input: string): ExpressionAST {
	const parser = new ExpressionParser(input);
	return parser.parse();
}

/**
 * Try to parse a string expression, returning null on failure
 */
export function tryParseExpression(input: string): ExpressionAST | null {
	try {
		return parseExpression(input);
	} catch {
		return null;
	}
}

/**
 * Check if a string expression is valid
 */
export function isValidExpression(input: string): boolean {
	return tryParseExpression(input) !== null;
}
