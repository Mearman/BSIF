// BSIF Reference Implementation - Watch Command
// Watches for changes and re-validates

import { resolve, extname } from "node:path";
import { watch } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { parseContent } from "../parser.js";
import { validate } from "../validator.js";
import { formatErrors } from "../errors.js";

export async function watchCommand(
	filePath: string,
	options: Record<string, unknown>,
): Promise<number> {
	const resolvedPath = resolve(filePath);
	const recursive = options.recursive === true;

	console.log(`Watching ${filePath}${recursive ? " (recursive)" : ""}...`);

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	const validateFile = async (changedPath: string) => {
		const ext = extname(changedPath);
		if (ext !== ".json" && ext !== ".yaml" && ext !== ".yml") return;

		try {
			const content = await readFile(changedPath, "utf-8");
			const doc = parseContent(content, changedPath);
			const result = validate(doc, { checkSemantics: true });

			const timestamp = new Date().toLocaleTimeString();
			if (result.valid) {
				console.log(`[${timestamp}] ✓ ${changedPath} is valid`);
			} else {
				console.error(`[${timestamp}] ✗ ${changedPath} has errors:`);
				console.error(formatErrors(result.errors));
			}
		} catch (error) {
			const timestamp = new Date().toLocaleTimeString();
			console.error(`[${timestamp}] ✗ ${changedPath}: ${error instanceof Error ? error.message : String(error)}`);
		}
	};

	try {
		const watcher = watch(resolvedPath, { recursive });
		for await (const event of watcher) {
			if (event.filename) {
				const changedPath = resolve(resolvedPath, event.filename);
				if (debounceTimer) clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => { void validateFile(changedPath); }, 300);
			}
		}
	} catch (error) {
		console.error(`Watch error: ${error instanceof Error ? error.message : String(error)}`);
		return 1;
	}

	return 0;
}
