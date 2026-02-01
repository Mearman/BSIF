// BSIF Reference Implementation - End-to-End Workflow Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";

const execAsync = promisify(exec);

describe("End-to-End Workflow Tests", () => {
	const binPath = join(process.cwd(), "dist/cli.js");
	const tempDir = tmpdir();

	async function runCli(args: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
		try {
			const { stdout, stderr } = await execAsync(`node ${binPath} ${args}`);
			return { stdout, stderr, exitCode: 0 };
		} catch (error) {
			const err = error as { stdout: string; stderr: string; code: number | null };
			return {
				stdout: err.stdout || "",
				stderr: err.stderr || "",
				exitCode: err.code || 1,
			};
		}
	}

	it("complete workflow: create, validate, format, convert", async () => {
		const newDoc = {
			metadata: {
				bsif_version: "1.0.0",
				name: "workflow-test",
				version: "1.0.0",
			},
			semantics: {
				type: "state-machine",
				states: [
					{ name: "idle" },
					{ name: "running" },
					{ name: "stopped" },
				],
				transitions: [
					{ from: "idle", to: "running", event: "start" },
					{ from: "running", to: "stopped", event: "stop" },
					{ from: "stopped", to: "idle", event: "reset" },
				],
				initial: "idle",
				final: ["stopped"],
			},
		};

		const jsonPath = join(tempDir, "workflow.bsif.json");
		const yamlPath = join(tempDir, "workflow.bsif.yaml");
		const jsonPath2 = join(tempDir, "workflow-2.bsif.json");

		// Write the document
		await writeFile(jsonPath, JSON.stringify(newDoc, null, 2));

		// Step 1: Validate
		let result = await runCli(`validate ${jsonPath}`);
		assert.strictEqual(result.exitCode, 0, "Validation should pass");

		// Step 2: Check semantics
		result = await runCli(`check ${jsonPath}`);
		assert.strictEqual(result.exitCode, 0, "Semantic check should pass");

		// Step 3: Format
		result = await runCli(`format ${jsonPath}`);
		assert.strictEqual(result.exitCode, 0, "Format should succeed");

		// Verify formatted output is valid JSON
		const formatted = JSON.parse(result.stdout);
		assert.strictEqual(formatted.metadata.name, "workflow-test");

		// Step 4: Convert to YAML
		result = await runCli(`convert ${jsonPath} --output ${yamlPath}`);
		assert.strictEqual(result.exitCode, 0, "Convert to YAML should succeed");

		// Step 5: Validate YAML version
		result = await runCli(`validate ${yamlPath}`);
		assert.strictEqual(result.exitCode, 0, "YAML validation should pass");

		// Step 6: Convert back to JSON
		result = await runCli(`convert ${yamlPath} --output ${jsonPath2}`);
		assert.strictEqual(result.exitCode, 0, "Convert back to JSON should succeed");

		// Step 7: Verify round-trip
		const original = await readFile(jsonPath, "utf-8");
		const roundTrip = await readFile(jsonPath2, "utf-8");
		assert.deepStrictEqual(
			JSON.parse(original),
			JSON.parse(roundTrip),
			"Round-trip conversion should preserve data",
		);

		// Cleanup
		await rm(jsonPath);
		await rm(yamlPath);
		await rm(jsonPath2);
	});

	it("handles invalid document with helpful error messages", async () => {
		const invalidDoc = {
			metadata: {
				bsif_version: "1.0.0",
				name: "invalid-test",
			},
			semantics: {
				type: "state-machine",
				states: [{ name: "idle" }],
				transitions: [],
				initial: "non-existent", // Invalid!
			},
		};

		const jsonPath = join(tempDir, "invalid.bsif.json");
		await writeFile(jsonPath, JSON.stringify(invalidDoc, null, 2));

		const result = await runCli(`check ${jsonPath}`);

		assert.strictEqual(result.exitCode, 1);
		assert.match(result.stderr, /E101/);
		assert.match(result.stderr, /non-existent/);

		await rm(jsonPath);
	});
});
