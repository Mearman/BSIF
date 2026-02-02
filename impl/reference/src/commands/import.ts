import { readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { TLAPlusMapper } from "../mappers/tlaplus.js";
import { SCXMLMapper } from "../mappers/scxml.js";
import { SMTLIBMapper } from "../mappers/smtlib.js";
import { validate } from "../validator.js";

export async function importCommand(inputPath: string, options: Record<string, unknown>): Promise<number> {
	const name = typeof options.name === "string" ? options.name : undefined;
	const version = typeof options.version === "string" ? options.version : undefined;
	const outputPath = typeof options.output === "string" ? options.output : undefined;

	try {
		const content = await readFile(inputPath, "utf-8");
		const format = detectFormat(inputPath);

		if (!format) {
			console.error(`Cannot detect format from file extension: ${inputPath}`);
			console.error("Supported: .tla (TLA+), .scxml (SCXML), .smt2 (SMT-LIB)");
			return 1;
		}

		// Build metadata with required defaults
		const metadata: Record<string, unknown> = {
			name: name ?? `imported-${format}`,
			description: `Imported from ${format}`,
		};
		if (version !== undefined) {
			metadata.version = version;
		}

		let doc;

		switch (format) {
		case "tlaplus": {
			const mapper = new TLAPlusMapper();
			doc = mapper.toBSIF(content, metadata);
			break;
		}
		case "scxml": {
			const mapper = new SCXMLMapper();
			doc = mapper.toBSIF(content, metadata);
			break;
		}
		case "smtlib": {
			const mapper = new SMTLIBMapper();
			doc = mapper.toBSIF(content, metadata);
			break;
		}
		}

		// Validate
		const result = validate(doc);
		if (!result.valid) {
			console.error("Warning: imported document has validation issues:");
			for (const err of result.errors) {
				console.error(`  ${err.code}: ${err.message}`);
			}
		}

		const output = JSON.stringify(doc, null, 2);
		if (outputPath) {
			await writeFile(outputPath, output + "\n");
			console.log(`Imported ${format} document written to ${outputPath}`);
		} else {
			console.log(output);
		}

		return 0;
	} catch (error) {
		console.error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
		return 1;
	}
}

export function detectFormat(path: string): "tlaplus" | "scxml" | "smtlib" | null {
	if (path.endsWith(".tla")) return "tlaplus";
	if (path.endsWith(".scxml")) return "scxml";
	if (path.endsWith(".smt2")) return "smtlib";
	return null;
}
