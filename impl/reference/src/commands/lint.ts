// BSIF Reference Implementation - Lint Command
// Opinionated style checks beyond validation

import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { parseContent } from "../parser.js";
import { lint } from "../linter.js";
import { formatErrors } from "../errors.js";

export async function lintCommand(
	filePath: string,
	options: Record<string, unknown>,
): Promise<number> {
	const resolvedPath = resolve(filePath);
	const content = await readFile(resolvedPath, "utf-8");
	const doc = parseContent(content, resolvedPath);

	const strict = options.strict === true;
	const errors = lint(doc, { strict });

	const outputFormat = options["output-format"];

	if (outputFormat === "json") {
		console.log(JSON.stringify({ warnings: errors }, null, 2));
		return errors.some((e) => e.severity === "error") ? 1 : 0;
	}

	if (errors.length === 0) {
		console.log(`✓ ${filePath} passes all lint checks`);
		return 0;
	}

	console.warn(`⚠ ${filePath} has ${errors.length} lint warning(s):`);
	console.warn(formatErrors(errors));
	return strict && errors.length > 0 ? 1 : 0;
}
