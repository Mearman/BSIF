// BSIF Reference Implementation - Compose Command
// Merges multiple BSIF documents into a hybrid document

import { resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { parseContent } from "../parser.js";
import { validate } from "../validator.js";
import type { BSIFDocument } from "../schemas.js";

export async function composeCommand(
	filePath: string,
	options: Record<string, unknown>,
): Promise<number> {
	// Collect all file paths (first positional + any extras passed via options)
	const filePaths = [filePath];
	if (Array.isArray(options.files)) {
		filePaths.push(...options.files.map(String));
	}

	if (filePaths.length < 2) {
		console.error("Error: compose requires at least 2 files");
		return 1;
	}

	// Parse and validate each document
	const documents: BSIFDocument[] = [];
	for (const fp of filePaths) {
		const resolvedPath = resolve(fp);
		const content = await readFile(resolvedPath, "utf-8");
		const doc = parseContent(content, resolvedPath);

		const validation = validate(doc);
		if (!validation.valid) {
			const { formatErrors } = await import("../errors.js");
			console.error(`✗ ${fp} has errors:`);
			console.error(formatErrors(validation.errors));
			return 1;
		}

		documents.push(doc);
	}

	// Check for namespace conflicts
	const names = documents.map((d) => d.metadata.name);
	const uniqueNames = new Set(names);
	if (uniqueNames.size !== names.length) {
		console.error("Error: duplicate specification names across composed documents");
		return 1;
	}

	// Build hybrid document
	const hybrid: BSIFDocument = {
		metadata: {
			bsif_version: documents[0]!.metadata.bsif_version,
			name: names.join("+"),
			version: "1.0.0",
			description: `Composed from: ${names.join(", ")}`,
		},
		semantics: {
			type: "hybrid",
			components: documents.map((d) => d.semantics),
		},
	};

	const output = typeof options.output === "string" ? options.output : undefined;
	const serialized = JSON.stringify(hybrid, null, 2);

	if (output) {
		await writeFile(resolve(output), serialized + "\n");
		console.log(`✓ Composed ${filePaths.length} specs into ${output}`);
	} else {
		console.log(serialized);
	}

	return 0;
}
