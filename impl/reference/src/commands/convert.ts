// BSIF Reference Implementation - Convert Command
// Converts BSIF documents between JSON, YAML, TLA+, SCXML, and SMT-LIB formats

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseContent } from "../parser.js";
import { validate } from "../validator.js";
import { stringify as yamlStringify } from "yaml";
import type { BSIFDocument } from "../schemas.js";
import { TLAPlusMapper } from "../mappers/tlaplus.js";
import { SCXMLMapper } from "../mappers/scxml.js";
import { SMTLIBMapper } from "../mappers/smtlib.js";

export async function convertCommand(
	inputPath: string,
	options: Record<string, unknown>,
): Promise<number> {
	const validFormats = ["json", "yaml", "tlaplus", "scxml", "smtlib"];
	const format = typeof options.format === "string" ? (validFormats.includes(options.format) ? options.format : undefined) : undefined;
	const output = typeof options.output === "string" ? options.output : undefined;
	const shouldValidate = options.validate !== false;

	// Detect output format from extension if not specified
	const outputFormat = format ?? detectFormatFromOutput(output ?? inputPath);

	if (!outputFormat) {
		console.error("Error: Cannot determine output format");
		console.error("Specify --format=<json|yaml|tlaplus|scxml|smtlib> or provide output file with .json/.yaml/.tla/.scxml/.smt2 extension");
		return 1;
	}

	// Resolve input path
	const resolvedInputPath = resolve(inputPath);

	// Read and parse input file
	const content = await readFile(resolvedInputPath, "utf-8");
	const doc = parseContent(content, inputPath);

	// Optionally validate
	if (shouldValidate) {
		const validation = validate(doc);
		if (!validation.valid) {
			console.error(`✗ ${inputPath} has validation errors:`);
			// Import formatErrors dynamically to avoid circular dependency
			const { formatErrors } = await import("../errors.js");
			console.error(formatErrors(validation.errors));
			return 1;
		}
	}

	// Convert to target format
	const converted = convertFormat(doc, outputFormat);

	// Write output
	if (output) {
		const resolvedOutputPath = resolve(output);
		await writeFile(resolvedOutputPath, converted + "\n");
		console.log(`✓ Converted ${inputPath} to ${output} (${outputFormat})`);
	} else {
		console.log(converted);
	}

	return 0;
}

function detectFormatFromOutput(outputPath: string): string | null {
	if (outputPath.endsWith(".json")) return "json";
	if (outputPath.endsWith(".yaml") || outputPath.endsWith(".yml")) return "yaml";
	if (outputPath.endsWith(".tla")) return "tlaplus";
	if (outputPath.endsWith(".scxml")) return "scxml";
	if (outputPath.endsWith(".smt2")) return "smtlib";
	return null;
}

function convertFormat(doc: unknown, format: string): string {
	switch (format) {
	case "json":
		return JSON.stringify(doc, null, 2);
	case "yaml":
		return yamlStringify(doc);
	case "tlaplus":
		return new TLAPlusMapper().fromBSIF(doc as BSIFDocument);
	case "scxml":
		return new SCXMLMapper().fromBSIF(doc as BSIFDocument);
	case "smtlib":
		return new SMTLIBMapper().fromBSIF(doc as BSIFDocument);
	default:
		throw new Error(`Unsupported format: ${format}`);
	}
}
