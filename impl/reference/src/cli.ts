#!/usr/bin/env node
// BSIF Reference Implementation - CLI Entry Point

import { parseArgs } from "node:util";
import { validateCommand } from "./commands/validate.js";
import { checkCommand } from "./commands/check.js";
import { formatCommand } from "./commands/format.js";
import { convertCommand } from "./commands/convert.js";
import { resolveCommand } from "./commands/resolve.js";
import { composeCommand } from "./commands/compose.js";
import { lintCommand } from "./commands/lint.js";
import { watchCommand } from "./commands/watch.js";
import { generateCommand } from "./commands/generate.js";
import { registryPublishCommand, registryFetchCommand, registrySearchCommand } from "./commands/registry.js";

//==============================================================================
// CLI Types
//==============================================================================

interface ParsedArgs {
	command: string | undefined;
	positional: readonly string[];
	values: Record<string, unknown>;
}

//==============================================================================
// Main CLI
//==============================================================================

async function main(args: string[]): Promise<number> {
	try {
		const parsed = parseCliArgs(args);
		const { command, positional, values } = parsed;

		if (!command || positional.length === 0) {
			printHelp();
			return 0;
		}

		// Handle registry subcommands
		if (command === "registry") {
			const subcommand = positional[0];
			const arg = positional[1];
			if (!subcommand || !arg) {
				console.error("Usage: bsif registry <publish|fetch|search> <file|name|query>");
				return 1;
			}
			switch (subcommand) {
			case "publish":
				return await registryPublishCommand(arg, values);
			case "fetch":
				return await registryFetchCommand(arg, values);
			case "search":
				return await registrySearchCommand(arg, values);
			default:
				console.error(`Unknown registry subcommand: ${subcommand}`);
				return 1;
			}
		}

		// Execute command
		const filePath = positional[0];
		if (!filePath) {
			console.error(`Error: No file path provided for ${command} command`);
			printHelp();
			return 1;
		}

		// Convert command may have a second positional argument (output path)
		if (command === "convert" && positional.length > 1) {
			values.output = positional[1];
		}

		switch (command) {
		case "validate":
			return await validateCommand(filePath, values);
		case "check":
			return await checkCommand(filePath, values);
		case "format":
			return await formatCommand(filePath, values);
		case "convert":
			return await convertCommand(filePath, values);
		case "resolve":
			return await resolveCommand(filePath, values);
		case "compose":
			// Collect remaining positional arguments as additional files
			values.files = positional.slice(1);
			return await composeCommand(filePath, values);
		case "lint":
			return await lintCommand(filePath, values);
		case "watch":
			return await watchCommand(filePath, values);
		case "generate":
			return await generateCommand(filePath, values);
		default:
			console.error(`Unknown command: ${command}`);
			printHelp();
			return 1;
		}
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`);
			return 1;
		}
		console.error(`Unknown error: ${String(error)}`);
		return 1;
	}
}

function parseCliArgs(args: string[]): ParsedArgs {
	const parsed = parseArgs({
		args,
		options: {
			help: { type: "boolean", short: "h" },
			version: { type: "boolean", short: "v" },
			format: { type: "string" },
			output: { type: "string", short: "o" },
			"output-format": { type: "string" },
			strict: { type: "boolean" },
			recursive: { type: "boolean" },
			depth: { type: "string" },
			registry: { type: "string" },
			target: { type: "string" },
			framework: { type: "string" },
		},
		allowPositionals: true,
	});

	const values: Record<string, unknown> = parsed.values;

	// Handle --help and --version
	if (values.help) {
		printHelp();
		process.exit(0);
	}

	if (values.version) {
		printVersion();
		process.exit(0);
	}

	// Extract command from positionals
	const positional = parsed.positionals;
	const command = positional[0];

	return {
		command,
		positional: positional.slice(1),
		values,
	};
}

//==============================================================================
// Help and Version
//==============================================================================

function printHelp(): void {
	console.log(`
BSIF Reference Implementation v0.1.0

Usage:
  bsif <command> [options] <file>

Commands:
  validate <file>        Validate BSIF document against schema
  check <file>           Validate BSIF document semantics
  format <file>          Format BSIF document
  convert <input>        Convert between JSON and YAML formats
  resolve <file>         Resolve references and print dependency graph
  compose <f1> <f2> ...  Compose multiple BSIF documents into a hybrid
  lint <file>            Run opinionated style checks
  watch <path>           Watch for changes and re-validate
  generate <file>        Generate tests from a BSIF specification
  registry publish <f>   Publish a spec to the registry
  registry fetch <name>  Fetch a spec from the registry
  registry search <q>    Search the registry

Convert Options:
  --format=<json|yaml>       Output format (convert/format)
  --output=<path>            Output file path
  --output-format=<json|text>  Output format for validate/check/resolve

Lint Options:
  --strict                   Treat lint warnings as errors

Watch Options:
  --recursive                Watch directories recursively

Resolve Options:
  --depth=<n>                Maximum reference resolution depth

Generate Options:
  --target=<typescript|python>  Target language (default: typescript)
  --framework=<name>            Test framework to use
  --output=<dir>                Output directory for generated files

Registry Options:
  --registry=<url>            Registry URL (default: http://127.0.0.1:8642)
  --version=<semver>          Version to fetch (registry fetch)

Options:
  -h, --help       Show this help message
  -v, --version    Show version

Examples:
  bsif validate spec.bsif.json
  bsif check docs/examples/state-machine.bsif.json
  bsif format spec.bsif.json
  bsif convert spec.bsif.json --format=yaml --output spec.bsif.yaml
  bsif convert spec.bsif.yaml spec.bsif.json
  bsif resolve spec.bsif.json --output-format=json
  bsif compose spec1.bsif.json spec2.bsif.json --output combined.bsif.json
  bsif lint spec.bsif.json --strict
  bsif watch ./specs --recursive
  bsif generate spec.bsif.json --target=typescript --output=tests/
`);
}

function printVersion(): void {
	console.log("BSIF Reference Implementation v0.1.0");
}

//==============================================================================
// Entry Point
//==============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
	void main(process.argv.slice(2)).then((exitCode) => {
		process.exit(exitCode);
	});
}

export { main };
