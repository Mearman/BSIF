// BSIF Expression Parser
// Converts JavaScript-like string expressions to structured AST format

import type {
	ExpressionAST,
	ExpressionUnary,
	ExpressionBinary,
} from "../schemas.js";

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
	PLUSEQ,       // +=
	MINUSEQ,      // -=
	TIMESEQ,      // *=
	DIVIDEEQ,     // /=
	MODULOEQ,     // %=
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
	LBRACKET,     // [
	RBRACKET,     // ]
	DOT,          // .
	COMMA,        // ,
	SEMICOLON,    // ;

	// End
	EOF,
}

function tokenize(input: string): Token[] {
	const tokens: Token[] = [];
	let position = 0;

	function peek(offset = 0): string | undefined {
		return input[position + offset];
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
		// Compound assignment operators (must check before =)
		if (char === "+" && peek(1) === "=") {
			tokens.push({ type: TokenType.PLUSEQ, value: "+=", position: startPos });
			position += 2;
			continue;
		}

		if (char === "-" && peek(1) === "=") {
			tokens.push({ type: TokenType.MINUSEQ, value: "-=", position: startPos });
			position += 2;
			continue;
		}

		if (char === "*" && peek(1) === "=") {
			tokens.push({ type: TokenType.TIMESEQ, value: "*=", position: startPos });
			position += 2;
			continue;
		}

		if (char === "/" && peek(1) === "=") {
			tokens.push({ type: TokenType.DIVIDEEQ, value: "/=", position: startPos });
			position += 2;
			continue;
		}

		if (char === "%" && peek(1) === "=") {
			tokens.push({ type: TokenType.MODULOEQ, value: "%=", position: startPos });
			position += 2;
			continue;
		}

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
			case "[":
				tokens.push({ type: TokenType.LBRACKET, value: "[", position: startPos });
				break;
			case "]":
				tokens.push({ type: TokenType.RBRACKET, value: "]", position: startPos });
				break;
			case ".":
				tokens.push({ type: TokenType.DOT, value: ".", position: startPos });
				break;
			case ",":
				tokens.push({ type: TokenType.COMMA, value: ",", position: startPos });
				break;
			case ";":
				tokens.push({ type: TokenType.SEMICOLON, value: ";", position: startPos });
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
	private readonly PRECEDENCE: Partial<Record<TokenType, number>> = {
		[TokenType.ASSIGN]: 1,
		[TokenType.PLUSEQ]: 1,
		[TokenType.MINUSEQ]: 1,
		[TokenType.TIMESEQ]: 1,
		[TokenType.DIVIDEEQ]: 1,
		[TokenType.MODULOEQ]: 1,
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
		// Check for statement sequence (semicolon-separated expressions)
		const statements: ExpressionAST[] = [];
		statements.push(this.parseExpression());

		// Check for semicolons - if we have them, it's a sequence
		while (this.peek().type === TokenType.SEMICOLON) {
			this.consume(); // consume semicolon
			// Allow trailing semicolon
			if (this.peek().type === TokenType.EOF) {
				break;
			}
			statements.push(this.parseExpression());
		}

		if (this.peek().type !== TokenType.EOF) {
			throw new Error(`Unexpected token ${TokenType[this.peek().type]} at position ${this.peek().position}`);
		}

		// If we have multiple statements, return a sequence
		if (statements.length > 1) {
			return { sequence: statements };
		}

		return statements[0]!;
	}

	private parseExpression(minPrecedence = 0): ExpressionAST {
		// Parse unary operators or primary expression
		let left: ExpressionAST;

		const token = this.peek();

		// Unary operators
		if (token.type === TokenType.NOT || token.type === TokenType.MINUS || token.type === TokenType.PLUS) {
			this.consume();
			const operand = this.parseExpression(8); // Unary has highest precedence
			const opMap: Partial<Record<TokenType, ExpressionUnary["operator"]>> = {
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
		while (
			this.peek().type !== TokenType.EOF &&
			this.peek().type !== TokenType.RPAREN &&
			this.peek().type !== TokenType.COMMA &&
			this.peek().type !== TokenType.SEMICOLON &&
			this.peek().type !== TokenType.RBRACKET
		) {
			const opToken = this.peek();
			const precedence = this.getPrecedence(opToken);

			if (precedence < minPrecedence) break;

			this.consume();

			const opMap: Partial<Record<TokenType, ExpressionBinary["operator"]>> = {
				[TokenType.ASSIGN]: "=",
				[TokenType.PLUSEQ]: "+=",
				[TokenType.MINUSEQ]: "-=",
				[TokenType.TIMESEQ]: "*=",
				[TokenType.DIVIDEEQ]: "/=",
				[TokenType.MODULOEQ]: "%=",
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
				return this.parsePostfix({ literal: parseFloat(token.value) });
			}

			case TokenType.STRING: {
				this.consume();
				return this.parsePostfix({ literal: token.value });
			}

			case TokenType.BOOLEAN: {
				this.consume();
				return this.parsePostfix({ literal: token.value === "true" });
			}

			case TokenType.NULL: {
				this.consume();
				return this.parsePostfix({ literal: null });
			}

			case TokenType.IDENTIFIER: {
				const varName = this.consume().value;
				return this.parsePostfix({ variable: varName });
			}

			case TokenType.LPAREN: {
				this.consume(); // consume '('
				const expr = this.parseExpression();
				this.expect(TokenType.RPAREN); // consume ')'
				return this.parsePostfix(expr);
			}

			default:
				throw new Error(`Unexpected token ${TokenType[token.type]} (${token.value}) at position ${token.position}`);
		}
	}

	/**
	 * Parse postfix operations: function calls, array access, and member access
	 * e.g., func(), arr[index], obj.method().prop
	 */
	private parsePostfix(expr: ExpressionAST): ExpressionAST {
		while (true) {
			// Function call: expr(arg1, arg2, ...)
			if (this.peek().type === TokenType.LPAREN) {
				this.consume(); // consume '('
				const args: ExpressionAST[] = [];

				// Check for empty argument list
				if (this.peek().type !== TokenType.RPAREN) {
					args.push(this.parseExpression());
					while (this.peek().type === TokenType.COMMA) {
						this.consume(); // consume comma
						args.push(this.parseExpression());
					}
				}

				this.expect(TokenType.RPAREN); // consume ')'

				// Check if this is a method call on a variable
				if ("variable" in expr) {
					expr = { call: expr.variable, arguments: args };
				} else {
					throw new Error(`Function calls require a callable expression at position ${this.peek().position}`);
				}

				continue;
			}

			// Array access: expr[index]
			if (this.peek().type === TokenType.LBRACKET) {
				this.consume(); // consume '['
				const index = this.parseExpression();
				this.expect(TokenType.RBRACKET); // consume ']'

				expr = { access: { target: expr, index } };
				continue;
			}

			// Member access: expr.prop
			if (this.peek().type === TokenType.DOT) {
				this.consume(); // consume dot
				const prop = this.expect(TokenType.IDENTIFIER);

				// For now, convert arr[0].prop to a variable string representation
				// This is a limitation - ideally we'd have a proper member access AST node
				if ("access" in expr || "call" in expr) {
					// For complex expressions, convert to string variable
					const exprStr = JSON.stringify(expr).replace(/"/g, "");
					expr = { variable: `${exprStr}.${prop.value}` };
				} else if ("variable" in expr) {
					// Simple variable.prop stays as variable string
					expr = { variable: `${expr.variable}.${prop.value}` };
				} else {
					throw new Error(`Member access requires a target expression at position ${this.peek().position}`);
				}

				continue;
			}

			// No more postfix operations
			break;
		}

		return expr;
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
