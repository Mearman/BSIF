// BSIF Reference Implementation - Test Generator Framework

import type { BSIFDocument } from "../schemas.js";
import { isStateMachine, isTemporal, isConstraints, isEvents, isInteraction } from "../schemas.js";

//==============================================================================
// Types
//==============================================================================

export interface GenerateOptions {
	readonly target: string;
	readonly framework?: string;
	readonly output?: string;
}

export interface GeneratedTestSuite {
	readonly files: ReadonlyMap<string, string>;
	readonly dependencies: readonly string[];
}

export interface TestGenerator {
	readonly targetLanguage: string;
	generate(doc: BSIFDocument): GeneratedTestSuite;
}

//==============================================================================
// Main Generator
//==============================================================================

export async function generateTests(doc: BSIFDocument, options: GenerateOptions): Promise<GeneratedTestSuite> {
	const { target } = options;

	switch (target) {
	case "typescript": {
		const { TypeScriptGenerator } = await import("./targets/typescript.js");
		const generator = new TypeScriptGenerator(options.framework ?? "vitest");
		return generator.generate(doc);
	}
	case "python": {
		const { PythonGenerator } = await import("./targets/python.js");
		const generator = new PythonGenerator(options.framework ?? "pytest");
		return generator.generate(doc);
	}
	default:
		throw new Error(`Unsupported target: ${target}`);
	}
}

//==============================================================================
// Shared Helpers
//==============================================================================

export function getSemanticType(doc: BSIFDocument): string {
	if (isStateMachine(doc.semantics)) return "state-machine";
	if (isTemporal(doc.semantics)) return "temporal";
	if (isConstraints(doc.semantics)) return "constraints";
	if (isEvents(doc.semantics)) return "events";
	if (isInteraction(doc.semantics)) return "interaction";
	return "hybrid";
}
