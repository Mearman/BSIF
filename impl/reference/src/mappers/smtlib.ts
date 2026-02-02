// BSIF Reference Implementation - SMT-LIB Mapper

import type { BSIFDocument } from "../schemas.js";
import type { BSIFMetadata } from "../schemas.js";
import { isConstraints } from "../schemas.js";
import type { Mapper } from "./mapper.js";

export class SMTLIBMapper implements Mapper<string> {
	readonly toolName = "smtlib";
	readonly supportedTypes = ["constraints"];

	fromBSIF(doc: BSIFDocument): string {
		if (!isConstraints(doc.semantics)) {
			throw new Error("SMT-LIB mapper only supports constraints semantics");
		}

		const constraints = doc.semantics;
		const lines: string[] = [];

		lines.push(`; SMT-LIB output for: ${doc.metadata.name}`);
		lines.push(`; Generated from BSIF specification`);
		lines.push(`(set-logic ALL)`);
		lines.push(``);

		// Extract variable names from expressions
		const variables = extractVariables({
			preconditions: constraints.preconditions,
			postconditions: constraints.postconditions,
			invariants: constraints.invariants ?? [],
		});
		for (const varName of variables) {
			lines.push(`(declare-const ${toSMTName(varName)} Int)`);
		}
		lines.push(``);

		// Preconditions as assertions
		lines.push(`; Preconditions`);
		for (const pre of constraints.preconditions) {
			lines.push(`; ${pre.description}`);
			lines.push(`(assert ${expressionToSMT(pre.expression)})`);
		}
		lines.push(``);

		// Postconditions
		lines.push(`; Postconditions`);
		for (const post of constraints.postconditions) {
			lines.push(`; ${post.description}`);
			lines.push(`(assert ${expressionToSMT(post.expression)})`);
		}
		lines.push(``);

		// Invariants
		if (constraints.invariants) {
			lines.push(`; Invariants`);
			for (const inv of constraints.invariants) {
				lines.push(`; ${inv.description}`);
				lines.push(`(assert ${expressionToSMT(inv.expression)})`);
			}
			lines.push(``);
		}

		lines.push(`(check-sat)`);
		lines.push(`(get-model)`);

		return lines.join("\n");
	}

	toBSIF(input: string, metadata?: Partial<BSIFMetadata>): BSIFDocument {
		// Basic SMT-LIB → BSIF parsing
		const preconditions: Array<{ description: string; expression: string }> = [];
		const lines = input.split("\n");

		for (const line of lines) {
			const assertMatch = /\(assert (.+)\)/.exec(line.trim());
			if (assertMatch) {
				preconditions.push({
					description: "Imported assertion",
					expression: smtToExpression(assertMatch[1]!),
				});
			}
		}

		return {
			metadata: {
				bsif_version: "1.0.0",
				name: metadata?.name ?? "imported-smtlib",
				version: metadata?.version,
				description: metadata?.description ?? "Imported from SMT-LIB",
			},
			semantics: {
				type: "constraints",
				target: { module: "imported" },
				preconditions,
				postconditions: [],
			},
		};
	}
}

function toSMTName(name: string): string {
	return name.replace(/\./g, "_").replace(/[^a-zA-Z0-9_]/g, "");
}

function extractVariables(constraints: { preconditions: Array<{ expression: string }>; postconditions: Array<{ expression: string }>; invariants?: Array<{ expression: string }> | undefined }): Set<string> {
	const variables = new Set<string>();
	const allExpressions = [
		...constraints.preconditions.map((c) => c.expression),
		...constraints.postconditions.map((c) => c.expression),
		...(constraints.invariants ?? []).map((c) => c.expression),
	];

	for (const expr of allExpressions) {
		// Match identifiers (simple word boundaries, excluding keywords)
		const keywords = new Set(["old", "true", "false", "null", "undefined", "and", "or", "not"]);
		const identifiers = expr.match(/\b[a-zA-Z_][a-zA-Z0-9_.]*\b/g) ?? [];
		for (const id of identifiers) {
			const baseName = id.split(".")[0]!;
			if (!keywords.has(baseName) && !/^\d/.test(baseName)) {
				variables.add(baseName);
			}
		}
	}

	return variables;
}

function expressionToSMT(expr: string): string {
	// Simple expression to SMT-LIB conversion
	let result = expr.trim();

	// Replace comparison operators
	result = result.replace(/(\w+)\s*==\s*(\w+)/g, "(= $1 $2)");
	result = result.replace(/(\w+)\s*!=\s*(\w+)/g, "(not (= $1 $2))");
	result = result.replace(/(\w+)\s*>=\s*(\w+)/g, "(>= $1 $2)");
	result = result.replace(/(\w+)\s*<=\s*(\w+)/g, "(<= $1 $2)");
	result = result.replace(/(\w+)\s*>\s*(\w+)/g, "(> $1 $2)");
	result = result.replace(/(\w+)\s*<\s*(\w+)/g, "(< $1 $2)");

	// Replace arithmetic
	result = result.replace(/(\w+)\s*\+\s*(\w+)/g, "(+ $1 $2)");
	result = result.replace(/(\w+)\s*-\s*(\w+)/g, "(- $1 $2)");
	result = result.replace(/(\w+)\s*\*\s*(\w+)/g, "(* $1 $2)");

	// Replace old. references
	result = result.replace(/old\.(\w+)/g, "old_$1");

	return result;
}

function smtToExpression(smt: string): string {
	// Basic SMT-LIB to infix expression
	let result = smt.trim();
	result = result.replace(/\(=\s+(\w+)\s+(\w+)\)/g, "$1 == $2");
	result = result.replace(/\(<\s+(\w+)\s+(\w+)\)/g, "$1 < $2");
	result = result.replace(/\(>\s+(\w+)\s+(\w+)\)/g, "$1 > $2");
	result = result.replace(/\(<=\s+(\w+)\s+(\w+)\)/g, "$1 <= $2");
	result = result.replace(/\(>=\s+(\w+)\s+(\w+)\)/g, "$1 >= $2");
	return result;
}
