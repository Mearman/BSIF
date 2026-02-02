// BSIF Reference Implementation - Check Command
// Validates BSIF document semantics

import { resolve } from "node:path";
import { parseFile } from "../parser.js";
import { validate } from "../validator.js";
import { formatErrors } from "../errors.js";

export async function checkCommand(
	filePath: string,
	options: Record<string, unknown>,
): Promise<number> {
	// Resolve file path
	const resolvedPath = resolve(filePath);

	// Parse with semantic validation enabled
	const result = await parseFile(resolvedPath);
	const validation = validate(result, { checkSemantics: true });

	const outputFormat = options["output-format"];

	if (outputFormat === "json") {
		console.log(JSON.stringify(validation, null, 2));
		return validation.valid ? 0 : 1;
	}

	if (validation.valid) {
		console.log(`✓ ${filePath} semantic validation passed`);
		return 0;
	}

	console.error(`✗ ${filePath} has semantic errors:`);
	console.error(formatErrors(validation.errors));
	return 1;
}
