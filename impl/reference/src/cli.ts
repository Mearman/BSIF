#!/usr/bin/env node
// BSIF Reference Implementation - CLI Entry Point

import { parseArgs } from "node:util";
import { validateCommand } from "./commands/validate.js";
import { checkCommand } from "./commands/check.js";
import { formatCommand } from "./commands/format.js";

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

		// Execute command
		const filePath = positional[0];
		if (!filePath) {
			console.error(`Error: No file path provided for ${command} command`);
			printHelp();
			return 1;
		}

		switch (command) {
		case "validate":
			return await validateCommand(filePath, values);
		case "check":
			return await checkCommand(filePath, values);
		case "format":
			return await formatCommand(filePath, values);
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
  validate <file>  Validate BSIF document against schema
  check <file>     Validate BSIF document semantics
  format <file>    Format BSIF document

Options:
  -h, --help       Show this help message
  -v, --version    Show version

Examples:
  bsif validate spec.bsif.json
  bsif check docs/examples/state-machine.bsif.json
  bsif format spec.bsif.json
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
