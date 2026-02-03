// BSIF Reference Implementation - Format Command
// Formats BSIF document (pretty-print JSON or YAML)

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseContent } from "../parser.js";
import { stringify as yamlStringify } from "yaml";
import { canonicalize, formatDocument } from "../canonicalizer.js";
import type { FormatOptions } from "../canonicalizer.js";

export async function formatCommand(
	filePath: string,
	options: Record<string, unknown>,
): Promise<number> {
	const { write = false, canonical = false } = options;
	const format = typeof options.format === "string" ? options.format : undefined;

	// Resolve file path
	const resolvedPath = resolve(filePath);

	// Read file
	const content = await readFile(resolvedPath, "utf-8");

	// Detect input format from extension
	const inputFormat = detectFormat(filePath);

	// Determine output format: explicit --format, or same as input
	// JCS canonicalization only outputs JSON
	const outputFormat = format === "json" || format === "yaml" ? format : inputFormat;

	// Parse and re-format
	const doc = parseContent(content, filePath);

	let formatted: string;
	if (canonical) {
		if (outputFormat === "yaml") {
			console.warn("Warning: JCS canonicalization only supports JSON output. Using JSON.");
		}
		formatted = canonicalize(doc);
	} else {
		const formatOptions: FormatOptions = {
			canonical: false,
			indent: 2,
		};
		formatted = formatDocument(doc, formatOptions);
		if (outputFormat === "yaml") {
			formatted = yamlStringify(doc).trimEnd();
		}
	}

	// Output formatted content
	if (write) {
		await writeFile(resolvedPath, formatted + "\n");
		console.log(`✓ Formatted ${filePath}`);
	} else {
		console.log(formatted);
	}

	return 0;
}

function detectFormat(filePath: string): "json" | "yaml" {
	if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return "yaml";
	return "json";
}
