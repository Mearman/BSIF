// BSIF Reference Implementation - Generate Command
// CLI shell for test generation (generators implemented in Phase 4)

import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { parseContent } from "../parser.js";
import { validate } from "../validator.js";
import { generateTests } from "../generators/test-generator.js";

export async function generateCommand(
	filePath: string,
	options: Record<string, unknown>,
): Promise<number> {
	const target = typeof options.target === "string" ? options.target : "typescript";
	const framework = typeof options.framework === "string" ? options.framework : undefined;
	const output = typeof options.output === "string" ? options.output : undefined;

	const resolvedPath = resolve(filePath);
	const content = await readFile(resolvedPath, "utf-8");
	const doc = parseContent(content, resolvedPath);

	// Validate first
	const validation = validate(doc, { checkSemantics: true });
	if (!validation.valid) {
		const { formatErrors } = await import("../errors.js");
		console.error(`✗ ${filePath} has validation errors:`);
		console.error(formatErrors(validation.errors));
		return 1;
	}

	const supportedTargets = ["typescript", "python"];
	if (!supportedTargets.includes(target)) {
		console.error(`Error: unsupported target "${target}". Supported: ${supportedTargets.join(", ")}`);
		return 1;
	}

	try {
		const genOptions: { target: string; framework?: string; output?: string } = { target };
		if (framework !== undefined) genOptions.framework = framework;
		if (output !== undefined) genOptions.output = output;
		const suite = await generateTests(doc, genOptions);

		if (output) {
			const { writeFile, mkdir } = await import("node:fs/promises");
			await mkdir(resolve(output), { recursive: true });
			for (const [fileName, fileContent] of suite.files) {
				const outPath = resolve(output, fileName);
				await writeFile(outPath, fileContent);
				console.log(`  Generated: ${outPath}`);
			}
			console.log(`✓ Generated ${suite.files.size} test file(s) in ${output}`);
		} else {
			// Print to stdout
			for (const [fileName, fileContent] of suite.files) {
				console.log(`// === ${fileName} ===`);
				console.log(fileContent);
			}
		}

		return 0;
	} catch (error) {
		if (error instanceof Error && error.message.includes("Cannot find module")) {
			console.error("Error: test generators not yet implemented (Phase 4)");
			return 1;
		}
		throw error;
	}
}
