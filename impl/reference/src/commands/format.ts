// BSIF Reference Implementation - Format Command
// Formats BSIF document (pretty-print JSON)

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function formatCommand(
	filePath: string,
	options: Record<string, unknown>,
): Promise<number> {
	const { write = false } = options;

	// Resolve file path
	const resolvedPath = resolve(filePath);

	// Read and parse file
	const content = await readFile(resolvedPath, "utf-8");
	const formatted = JSON.stringify(JSON.parse(content), null, 2);

	// Output formatted content
	if (write) {
		await writeFile(resolvedPath, formatted + "\n");
		console.log(`✓ Formatted ${filePath}`);
	} else {
		console.log(formatted);
	}

	return 0;
}
