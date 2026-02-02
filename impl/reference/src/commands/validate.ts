// BSIF Reference Implementation - Validate Command
// Validates BSIF document against schema

import { resolve } from "node:path";
import { parseFile } from "../parser.js";
import { validate } from "../validator.js";
import { formatErrors } from "../errors.js";

export async function validateCommand(
	filePath: string,
	options: Record<string, unknown>,
): Promise<number> {
	// Resolve file path
	const resolvedPath = resolve(filePath);

	// Parse and validate
	const result = await parseFile(resolvedPath);
	const validation = validate(result);

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
