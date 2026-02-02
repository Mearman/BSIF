// BSIF Reference Implementation - Constraint Expression Evaluator
// Translates BSIF constraint expressions into target language assertions

/**
 * Converts a BSIF constraint expression into a TypeScript assertion.
 * Supports comparisons, old. references, boolean combinators.
 * For unsupported expressions, returns a descriptive comment.
 */
export function constraintToTypeScript(expression: string, context: "pre" | "post" | "invariant"): string {
	const trimmed = expression.trim();

	// Handle old. references (postconditions only)
	if (context === "post" && /\bold\./.test(trimmed)) {
		return generateOldReferenceTS(trimmed);
	}

	// Try to parse as a simple comparison
	const comparison = parseComparison(trimmed);
	if (comparison) {
		return `expect(${comparison.left}).${comparisonToMatcher(comparison.op, comparison.right)};`;
	}

	// Try to parse as boolean combinator
	if (/\s*&&\s*/.test(trimmed)) {
		const parts = trimmed.split(/\s*&&\s*/);
		return parts.map((p) => constraintToTypeScript(p.trim(), context)).join("\n    ");
	}

	// Try to parse len() function
	const lenMatch = /^len\((\w+)\)\s*(>=?|<=?|==|!=)\s*(\d+)$/.exec(trimmed);
	if (lenMatch) {
		return `expect(${lenMatch[1]!}.length).${comparisonToMatcher(lenMatch[2]!, lenMatch[3]!)};`;
	}

	// Unsupported expression — generate descriptive comment
	return `// Constraint: "${trimmed}" — requires manual implementation for target-specific evaluation`;
}

/**
 * Converts a BSIF constraint expression into a Python assertion.
 */
export function constraintToPython(expression: string, context: "pre" | "post" | "invariant"): string {
	const trimmed = expression.trim();

	// Handle old. references (postconditions only)
	if (context === "post" && /\bold\./.test(trimmed)) {
		return generateOldReferencePython(trimmed);
	}

	// Try to parse as a simple comparison
	const comparison = parseComparison(trimmed);
	if (comparison) {
		const pyOp = comparison.op === "==" ? "==" : comparison.op === "!=" ? "!=" : comparison.op;
		return `assert ${comparison.left} ${pyOp} ${comparison.right}`;
	}

	// Try to parse as boolean combinator
	if (/\s*&&\s*/.test(trimmed)) {
		const parts = trimmed.split(/\s*&&\s*/);
		return parts.map((p) => constraintToPython(p.trim(), context)).join("\n    ");
	}

	// Try to parse len() function
	const lenMatch = /^len\((\w+)\)\s*(>=?|<=?|==|!=)\s*(\d+)$/.exec(trimmed);
	if (lenMatch) {
		return `assert len(${lenMatch[1]!}) ${lenMatch[2]!} ${lenMatch[3]!}`;
	}

	// Unsupported expression
	return `# Constraint: "${trimmed}" — requires manual implementation for target-specific evaluation`;
}

interface Comparison {
	left: string;
	op: string;
	right: string;
}

function parseComparison(expr: string): Comparison | null {
	const match = /^(\w[\w.]*)\s*(>=?|<=?|==|!=)\s*(.+)$/.exec(expr);
	if (!match) return null;
	return { left: match[1]!, op: match[2]!, right: match[3]!.trim() };
}

function comparisonToMatcher(op: string, right: string): string {
	switch (op) {
	case "==": return `toBe(${right})`;
	case "!=": return `not.toBe(${right})`;
	case ">": return `toBeGreaterThan(${right})`;
	case ">=": return `toBeGreaterThanOrEqual(${right})`;
	case "<": return `toBeLessThan(${right})`;
	case "<=": return `toBeLessThanOrEqual(${right})`;
	default: return `toBe(${right})`;
	}
}

function generateOldReferenceTS(expression: string): string {
	// Replace old.X with oldState.X and generate expect assertion
	const normalized = expression.replace(/\bold\./g, "oldState.");
	const comparison = parseComparison(normalized);
	if (comparison) {
		return `expect(${comparison.left}).${comparisonToMatcher(comparison.op, comparison.right)};`;
	}
	return `// Postcondition with old. reference: "${expression}" — requires manual old-state capture`;
}

function generateOldReferencePython(expression: string): string {
	const normalized = expression.replace(/\bold\./g, "old_state.");
	const comparison = parseComparison(normalized);
	if (comparison) {
		const pyOp = comparison.op === "==" ? "==" : comparison.op === "!=" ? "!=" : comparison.op;
		return `assert ${comparison.left} ${pyOp} ${comparison.right}`;
	}
	return `# Postcondition with old. reference: "${expression}" — requires manual old-state capture`;
}
