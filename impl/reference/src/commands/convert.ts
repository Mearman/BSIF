// BSIF Reference Implementation - Convert Command
// Converts BSIF documents between JSON and YAML formats

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseContent } from "../parser.js";
import { validate } from "../validator.js";
import { stringify as yamlStringify } from "yaml";

export async function convertCommand(
	inputPath: string,
	options: Record<string, unknown>,
): Promise<number> {
	const format = typeof options.format === "string" ? (options.format === "json" || options.format === "yaml" ? options.format : undefined) : undefined;
	const output = typeof options.output === "string" ? options.output : undefined;
	const shouldValidate = options.validate !== false;

	// Detect output format from extension if not specified
	const outputFormat = format ?? detectFormatFromOutput(output ?? inputPath);

	if (!outputFormat) {
		console.error("Error: Cannot determine output format");
		console.error("Specify --format=<json|yaml> or provide output file with .json/.yaml extension");
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

function detectFormatFromOutput(outputPath: string): "json" | "yaml" | null {
	if (outputPath.endsWith(".json")) return "json";
	if (outputPath.endsWith(".yaml") || outputPath.endsWith(".yml")) return "yaml";
	return null;
}

function convertFormat(doc: unknown, format: "json" | "yaml"): string {
	if (format === "json") {
		return JSON.stringify(doc, null, 2);
	}
	// YAML
	return yamlStringify(doc);
}
