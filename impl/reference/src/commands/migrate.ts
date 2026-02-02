// BSIF Reference Implementation - Migrate Command

import { readFile, writeFile } from "node:fs/promises";
import { parseContent } from "../parser.js";
import { migrate, getMigrations } from "../migrations/registry.js";
import "../migrations/v0-to-v1.js"; // register migrations

export async function migrateCommand(
	inputPath: string,
	options: Record<string, unknown>,
): Promise<number> {
	const targetVersion = typeof options["target-version"] === "string" ? options["target-version"] : "1.0.0";
	const dryRun = options["dry-run"] === true;
	const outputPath = typeof options.output === "string" ? options.output : undefined;

	try {
		const content = await readFile(inputPath, "utf-8");
		const raw: unknown = JSON.parse(content);

		if (dryRun) {
			const migrations = getMigrations();
			console.log("Migration guide:");
			console.log(`  Target version: ${targetVersion}`);
			console.log("  Available migrations:");
			for (const m of migrations) {
				console.log(`    ${m.fromVersion} -> ${m.toVersion}: ${m.describe()}`);
			}
			return 0;
		}

		const result = migrate(raw, targetVersion);

		if (result.steps.length === 0) {
			console.log("No migrations needed - document is up to date.");
			return 0;
		}

		// Validate the migrated document
		try {
			parseContent(JSON.stringify(result.document), inputPath.endsWith(".json") ? inputPath : "migrated.json");
		} catch {
			console.error("Warning: migrated document has validation issues");
		}

		const output = JSON.stringify(result.document, null, 2);

		if (outputPath) {
			await writeFile(outputPath, output + "\n");
			console.log(`Migrated document written to ${outputPath}`);
		} else {
			console.log(output);
		}

		console.log(`Applied ${result.steps.length} migration(s):`);
		for (const step of result.steps) {
			console.log(`  ${step.fromVersion} -> ${step.toVersion}: ${step.describe()}`);
		}

		return 0;
	} catch (error) {
		console.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
		return 1;
	}
}
