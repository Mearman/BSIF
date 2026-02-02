// BSIF Reference Implementation - CLI Integration Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";

const execAsync = promisify(exec);

describe("CLI Integration Tests", () => {
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

	describe("validate command", () => {
		it("validates a valid BSIF document", async () => {
			const validDoc = join(process.cwd(), "test/fixtures/valid.bsif.json");
			const result = await runCli(`validate ${validDoc}`);

			assert.strictEqual(result.exitCode, 0);
			assert.match(result.stdout, /✓.*is valid/);
		});

		it("rejects an invalid BSIF document", async () => {
			const invalidDoc = join(process.cwd(), "test/fixtures/invalid-version.bsif.json");
			const result = await runCli(`validate ${invalidDoc}`);

			assert.strictEqual(result.exitCode, 1);
			assert.notStrictEqual(result.exitCode, 0);
			assert.ok(result.stderr.length > 0, "stderr should contain error output");
		});

		it("shows help with --help flag", async () => {
			const result = await runCli("--help");

			assert.strictEqual(result.exitCode, 0);
			assert.match(result.stdout, /Usage:/);
			assert.match(result.stdout, /Commands:/);
		});
	});

	describe("check command", () => {
		it("passes semantic validation for valid document", async () => {
			const validDoc = join(process.cwd(), "test/fixtures/valid.bsif.json");
			const result = await runCli(`check ${validDoc}`);

			assert.strictEqual(result.exitCode, 0);
			assert.match(result.stdout, /✓.*semantic validation passed/);
		});

		it("fails semantic validation for invalid document", async () => {
			const invalidDoc = join(process.cwd(), "test/fixtures/invalid-initial.bsif.json");
			const result = await runCli(`check ${invalidDoc}`);

			assert.strictEqual(result.exitCode, 1);
			assert.match(result.stderr, /✗.*has semantic errors/);
		});
	});

	describe("format command", () => {
		it("formats a JSON BSIF document", async () => {
			const testFile = join(tempDir, "format-test.bsif.json");
			await writeFile(
				testFile,
				JSON.stringify(
					{
						metadata: { bsif_version: "1.0.0", name: "test" },
						semantics: { type: "state-machine", states: [{ name: "idle" }], transitions: [], initial: "idle" },
					},
					null,
					2,
				),
			);

			const result = await runCli(`format ${testFile}`);

			assert.strictEqual(result.exitCode, 0);
			// Verify formatted output is valid JSON
			assert.doesNotThrow(() => JSON.parse(result.stdout));

			await rm(testFile);
		});

		it("formats a YAML BSIF document", async () => {
			const testFile = join(tempDir, "format-test.bsif.yaml");
			await writeFile(testFile, `
metadata:
  bsif_version: "1.0.0"
  name: test
semantics:
  type: state-machine
  states:
    - name: idle
  transitions: []
  initial: idle
`);

			const result = await runCli(`format ${testFile}`);

			assert.strictEqual(result.exitCode, 0);
			// YAML output should contain YAML-style content
			assert.match(result.stdout, /bsif_version:/);

			await rm(testFile);
		});

		it("forces YAML output with --format=yaml", async () => {
			const testFile = join(tempDir, "format-force.bsif.json");
			await writeFile(
				testFile,
				JSON.stringify(
					{
						metadata: { bsif_version: "1.0.0", name: "test" },
						semantics: { type: "state-machine", states: [{ name: "idle" }], transitions: [], initial: "idle" },
					},
					null,
					2,
				),
			);

			const result = await runCli(`format --format=yaml ${testFile}`);

			assert.strictEqual(result.exitCode, 0);
			// Should be YAML, not JSON (no opening brace)
			assert.ok(!result.stdout.trim().startsWith("{"), "Output should be YAML, not JSON");
			assert.match(result.stdout, /bsif_version:/);

			await rm(testFile);
		});
	});

	describe("convert command", () => {
		it("converts JSON to YAML", async () => {
			const jsonFile = join(tempDir, "convert-test.bsif.json");
			const yamlFile = join(tempDir, "convert-test.bsif.yaml");

			await writeFile(
				jsonFile,
				JSON.stringify(
					{
						metadata: { bsif_version: "1.0.0", name: "test" },
						semantics: { type: "state-machine", states: [{ name: "idle" }], transitions: [], initial: "idle" },
					},
					null,
					2,
				),
			);

			const result = await runCli(`convert ${jsonFile} --output ${yamlFile}`);

			assert.strictEqual(result.exitCode, 0);
			assert.match(result.stdout, /✓.*Converted/);

			// Verify YAML file exists
			const yamlContent = await readFile(yamlFile, "utf-8");
			assert.match(yamlContent, /bsif_version:|name:|type:|state-machine:/);

			await rm(jsonFile);
			await rm(yamlFile);
		});

		it("converts YAML to JSON", async () => {
			const yamlFile = join(tempDir, "convert-test.bsif.yaml");
			const jsonFile = join(tempDir, "convert-test.bsif.json");

			await writeFile(yamlFile, `
metadata:
  bsif_version: "1.0.0"
  name: test
semantics:
  type: state-machine
  states:
    - name: idle
  transitions: []
  initial: idle
`);

			const result = await runCli(`convert ${yamlFile} --output ${jsonFile}`);

			assert.strictEqual(result.exitCode, 0);

			// Verify JSON file exists and is valid
			const jsonContent = await readFile(jsonFile, "utf-8");
			const parsed = JSON.parse(jsonContent);
			assert.strictEqual(parsed.metadata.name, "test");

			await rm(yamlFile);
			await rm(jsonFile);
		});

		it("auto-detects output format from extension", async () => {
			const jsonFile = join(tempDir, "auto-test.bsif.json");
			const yamlFile = join(tempDir, "auto-test.bsif.yaml");

			await writeFile(
				jsonFile,
				JSON.stringify(
					{
						metadata: { bsif_version: "1.0.0", name: "test" },
						semantics: { type: "state-machine", states: [{ name: "idle" }], transitions: [], initial: "idle" },
					},
					null,
					2,
				),
			);

			const result = await runCli(`convert ${jsonFile} ${yamlFile}`);

			assert.strictEqual(result.exitCode, 0);

			await rm(jsonFile);
			await rm(yamlFile);
		});
	});

	describe("output format", () => {
		it("outputs JSON with --output-format=json", async () => {
			const validDoc = join(process.cwd(), "test/fixtures/valid.bsif.json");
			const result = await runCli(`validate --output-format=json ${validDoc}`);

			assert.strictEqual(result.exitCode, 0);
			const parsed = JSON.parse(result.stdout);
			assert.strictEqual(parsed.valid, true);
			assert.ok(Array.isArray(parsed.errors));
		});
	});

	describe("error handling", () => {
		it("returns non-zero exit code for non-existent file", async () => {
			const result = await runCli("validate non-existent.bsif.json");

			assert.notStrictEqual(result.exitCode, 0);
		});

		it("shows version with --version flag", async () => {
			const result = await runCli("--version");

			assert.strictEqual(result.exitCode, 0);
			assert.match(result.stdout, /BSIF Reference Implementation/);
		});
	});
});
