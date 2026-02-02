// BSIF Reference Implementation - Validate Command
// Validates BSIF document against schema

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseContent, buildSourceMap } from "../parser.js";
import { validate } from "../validator.js";
import { formatErrors } from "../errors.js";

export async function validateCommand(
	filePath: string,
	options: Record<string, unknown>,
): Promise<number> {
	// Resolve file path
	const resolvedPath = resolve(filePath);

	// Read content and build source map
	const content = await readFile(resolvedPath, "utf-8");
	const sourceMap = buildSourceMap(content);

	// Parse and validate
	const result = parseContent(content, resolvedPath);
	const validation = validate(result, { sourceMap });

	const outputFormat = options["output-format"];

	if (outputFormat === "json") {
		console.log(JSON.stringify(validation, null, 2));
		return validation.valid ? 0 : 1;
	}

	if (validation.valid) {
		console.log(`✓ ${filePath} is valid`);
		return 0;
	}

	console.error(`✗ ${filePath} has errors:`);
	console.error(formatErrors(validation.errors));
	return 1;
}
