// BSIF Reference Implementation - Resolve Command
// Resolves references and prints dependency graph

import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { parseContent } from "../parser.js";
import { resolveReferences, validateComposition, type ResolvedDocument } from "../resolver.js";

export async function resolveCommand(
	filePath: string,
	options: Record<string, unknown>,
): Promise<number> {
	const resolvedPath = resolve(filePath);
	const content = await readFile(resolvedPath, "utf-8");
	const doc = parseContent(content, resolvedPath);

	const resolveOptions: { basePath: string; maxDepth?: number } = {
		basePath: resolve(filePath, ".."),
	};
	if (typeof options.depth === "string") {
		resolveOptions.maxDepth = parseInt(options.depth, 10);
	}
	const resolved = await resolveReferences(doc, resolveOptions);

	const outputFormat = options["output-format"];

	if (outputFormat === "json") {
		console.log(JSON.stringify(serializeResolved(resolved), null, 2));
	} else {
		printDependencyTree(resolved, 0);
	}

	// Validate composition
	const errors = validateComposition(resolved, doc.metadata.bsif_version);
	if (errors.some((e) => e.severity === "error")) {
		const { formatErrors } = await import("../errors.js");
		console.error(formatErrors(errors));
		return 1;
	}

	return 0;
}

function printDependencyTree(resolved: ResolvedDocument, depth: number): void {
	const indent = "  ".repeat(depth);
	const marker = depth === 0 ? "" : "├── ";
	console.log(`${indent}${marker}${resolved.document.metadata.name} (${resolved.document.metadata.bsif_version})`);

	for (const [, ref] of resolved.references) {
		printDependencyTree(ref, depth + 1);
	}
}

function serializeResolved(resolved: ResolvedDocument): unknown {
	return {
		name: resolved.document.metadata.name,
		version: resolved.document.metadata.bsif_version,
		references: Object.fromEntries(
			[...resolved.references].map(([name, ref]) => [name, serializeResolved(ref)]),
		),
	};
}
