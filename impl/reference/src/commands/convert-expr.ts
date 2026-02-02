// BSIF Expression Conversion Command
// Converts string expressions to structured AST format in BSIF documents

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { BSIFDocument, Expression, ExpressionAST } from "../schemas.js";
import { isStringExpression, isASTExpression } from "../schemas.js";
import { parseExpression, tryParseExpression } from "../parser/expression-parser.js";

//==============================================================================
// Options
//==============================================================================

export interface ConvertExprOptions {
	readonly fields?: readonly ("guard" | "action" | "entry" | "exit")[];
	readonly inplace?: boolean;
	readonly output?: string;
	readonly keepFailed?: boolean; // Keep strings that fail to parse
}

//==============================================================================
// Conversion
//==============================================================================

/**
 * Recursively convert string expressions to AST in an object
 */
function convertInObject(obj: unknown, fields: Set<string>, keepFailed: boolean): unknown {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(item => convertInObject(item, fields, keepFailed));
	}

	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		// Check if this is an expression field we should convert
		if (fields.has(key)) {
			result[key] = convertExpression(value, keepFailed);
		} else {
			result[key] = convertInObject(value, fields, keepFailed);
		}
	}

	return result;
}

/**
 * Convert a single expression value to AST if it's a string
 */
function convertExpression(value: unknown, keepFailed: boolean): Expression {
	// Already AST or non-string, return as-is
	if (typeof value !== "string") {
		return value as Expression;
	}

	// Try to parse the string expression
	const ast = tryParseExpression(value);

	if (ast) {
		return ast;
	}

	// Parse failed
	if (keepFailed) {
		return value; // Keep original string
	}

	throw new Error(`Failed to parse expression: "${value}"`);
}

/**
 * Count expressions converted
 */
interface ConversionStats {
	readonly converted: number;
	readonly failed: number;
	readonly skipped: number;
}

function convertAndTrack(
	doc: BSIFDocument,
	fields: Set<string>,
	keepFailed: boolean,
): { document: BSIFDocument; stats: ConversionStats } {
	let converted = 0;
	let failed = 0;
	let skipped = 0;

	// Track conversions by wrapping the conversion function
	const convertWithTracking = (value: unknown): Expression => {
		if (typeof value !== "string") {
			skipped++;
			return value as Expression;
		}

		const ast = tryParseExpression(value);
		if (ast) {
			converted++;
			return ast;
		}

		if (keepFailed) {
			failed++;
			return value;
		}

		throw new Error(`Failed to parse expression: "${value}"`);
	};

	// Convert in document
	const convertedDoc = JSON.parse(JSON.stringify(doc, (key, value) => {
		if (fields.has(key)) {
			return convertWithTracking(value);
		}
		return value;
	})) as BSIFDocument;

	return {
		document: convertedDoc,
		stats: { converted, failed, skipped },
	};
}

//==============================================================================
// Command
//==============================================================================

export async function convertExprCommand(
	inputPath: string,
	options: ConvertExprOptions = {},
): Promise<number> {
	// Handle fields option - can be string (from CLI) or array
	const fieldsRaw = options.fields;
	const fieldsArray = typeof fieldsRaw === "string"
		? fieldsRaw.split(",").map(f => f.trim())
		: fieldsRaw ?? ["guard", "action", "entry", "exit"];
	const fields = new Set(fieldsArray);

	// Handle inplace option - can be string "true"/"false" or boolean
	const inPlaceRaw = options.inplace;
	const inPlace = typeof inPlaceRaw === "string"
		? inPlaceRaw === "true"
		: inPlaceRaw ?? false;

	const keepFailed = options.keepFailed ?? false;

	// Read input file
	const resolvedPath = resolve(inputPath);
	let content: string;

	try {
		content = await readFile(resolvedPath, "utf-8");
	} catch (err) {
		console.error(`Error reading file: ${inputPath}`);
		return 1;
	}

	// Parse as JSON (YAML support could be added later)
	let doc: unknown;
	try {
		doc = JSON.parse(content);
	} catch {
		console.error(`Error: File must be valid JSON. YAML support not yet implemented.`);
		return 1;
	}

	// Convert expressions
	let result: { document: BSIFDocument; stats: ConversionStats };
	try {
		result = convertAndTrack(doc as BSIFDocument, fields, keepFailed);
	} catch (err) {
		console.error(`Error converting expressions: ${err instanceof Error ? err.message : String(err)}`);
		return 1;
	}

	const { document: convertedDoc, stats } = result;

	// Determine output path
	const outputPath = options.output
		? resolve(options.output)
		: inPlace
			? resolvedPath
			: resolvedPath.replace(/\.json$/i, ".converted.json");

	// Write output
	const outputContent = JSON.stringify(convertedDoc, null, 2);
	try {
		await writeFile(outputPath, outputContent + "\n");
	} catch (err) {
		console.error(`Error writing file: ${outputPath}`);
		return 1;
	}

	// Print summary
	console.log(`Converted ${stats.converted} expressions to AST format`);
	if (stats.failed > 0) {
		console.log(`  ${stats.failed} expressions failed to parse${keepFailed ? " (kept as strings)" : ""}`);
	}
	if (stats.skipped > 0) {
		console.log(`  ${stats.skipped} expressions already in AST format`);
	}
	console.log(`Output written to: ${outputPath}`);

	return 0;
}

//==============================================================================
// CLI Help
//================================================================////////////////////////////////////////////////////////////////////////////////

export function printConvertExprHelp(): void {
	console.log(`
Usage: bsif convert-expr [options] <input-file>

Convert string expressions to structured AST format in BSIF documents.

Arguments:
  <input-file>    Path to BSIF document (.json or .yaml)

Options:
  --fields <list>    Comma-separated list of fields to convert
                     Default: guard,action,entry,exit
  --in-place, -i     Modify input file in-place
  --output <path>    Output file path (default: <input>.converted.json)
  --keep-failed     Keep expressions that fail to parse as strings
                     Default: abort on parse failure

Examples:
  # Convert all expressions in calculator spec
  bsif convert-expr calculator.bsif.json

  # Convert only guard fields, output to new file
  bsif convert-expr --fields=guard calculator.bsif.json -o calculator-ast.bsif.json

  # Modify file in-place, keeping unparseable expressions as strings
  bsif convert-expr --in-place --keep-failed calculator.bsif.json

  # Convert entry and exit actions only
  bsif convert-expr --fields=entry,exit state-machine.bsif.json
`);
}
