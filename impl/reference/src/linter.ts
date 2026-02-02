// BSIF Reference Implementation - Linter
// Opinionated style checks beyond validation

import type { BSIFDocument, StateMachine } from "./schemas.js";
import { isStateMachine, isEvents } from "./schemas.js";
import { ErrorCode, createError, type ValidationError } from "./errors.js";

//==============================================================================
// Lint Rules
//==============================================================================

export interface LintOptions {
	readonly strict?: boolean;
}

export function lint(doc: BSIFDocument, options?: LintOptions): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	errors.push(...lintMetadata(doc));
	errors.push(...lintNaming(doc));
	errors.push(...lintSemantics(doc, options));

	return errors;
}

function lintMetadata(doc: BSIFDocument): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	if (doc.metadata.description === undefined) {
		errors.push(
			createError(
				ErrorCode.LintMissingDescription,
				"Missing metadata.description",
				{ severity: "warning", path: ["metadata", "description"], suggestion: "Add a description to improve discoverability" },
			),
		);
	}

	if (doc.metadata.version === undefined) {
		errors.push(
			createError(
				ErrorCode.LintMissingVersion,
				"Missing metadata.version",
				{ severity: "warning", path: ["metadata", "version"], suggestion: "Add a semver version string (e.g., \"1.0.0\")" },
			),
		);
	}

	return errors;
}

function lintNaming(doc: BSIFDocument): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	const kebabCase = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

	if (!kebabCase.test(doc.metadata.name)) {
		errors.push(
			createError(
				ErrorCode.LintNamingConvention,
				`Spec name "${doc.metadata.name}" should use kebab-case`,
				{ severity: "warning", path: ["metadata", "name"], suggestion: "Use lowercase with hyphens (e.g., \"my-spec\")" },
			),
		);
	}

	if (isStateMachine(doc.semantics)) {
		for (const state of doc.semantics.states) {
			if (!kebabCase.test(state.name)) {
				errors.push(
					createError(
						ErrorCode.LintNamingConvention,
						`State name "${state.name}" should use kebab-case`,
						{ severity: "warning", path: ["states", state.name] },
					),
				);
			}
		}
	}

	return errors;
}

function lintSemantics(doc: BSIFDocument, options?: LintOptions): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	if (isStateMachine(doc.semantics)) {
		errors.push(...lintStateMachine(doc.semantics, options));
	}

	if (isEvents(doc.semantics)) {
		// Check for unused event declarations
		const declaredEvents = new Set(Object.keys(doc.semantics.events));
		const referencedEvents = new Set(doc.semantics.handlers.map((h) => h.event));
		for (const event of declaredEvents) {
			if (!referencedEvents.has(event)) {
				errors.push(
					createError(
						ErrorCode.LintUnusedEvent,
						`Event "${event}" is declared but never referenced by a handler`,
						{ severity: "warning", path: ["events", event] },
					),
				);
			}
		}
	}

	// Check for empty tool mappings
	if (doc.tools) {
		for (const [toolName, mapping] of Object.entries(doc.tools)) {
			if (typeof mapping === "object" && mapping !== null && Object.keys(mapping).length === 0) {
				errors.push(
					createError(
						ErrorCode.LintEmptyToolMapping,
						`Tool mapping "${toolName}" is empty`,
						{ severity: "warning", path: ["tools", toolName] },
					),
				);
			}
		}
	}

	// Check nesting depth
	const depth = measureDepth(doc, 0);
	const maxDepth = options?.strict ? 16 : 32;
	if (depth > maxDepth) {
		errors.push(
			createError(
				ErrorCode.LintDeepNesting,
				`Document nesting depth ${depth} exceeds recommended maximum of ${maxDepth}`,
				{ severity: "warning" },
			),
		);
	}

	return errors;
}

function lintStateMachine(sm: StateMachine, _options?: LintOptions): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	if (!sm.final || sm.final.length === 0) {
		errors.push(
			createError(
				ErrorCode.LintNoFinalStates,
				"State machine has no final states defined",
				{ severity: "warning", path: ["semantics", "final"], suggestion: "Define final states for completeness" },
			),
		);
	}

	return errors;
}

function measureDepth(value: unknown, current: number): number {
	if (typeof value !== "object" || value === null) return current;
	let max = current;
	if (Array.isArray(value)) {
		for (const item of value) {
			max = Math.max(max, measureDepth(item, current + 1));
		}
	} else {
		for (const child of Object.values(value)) {
			max = Math.max(max, measureDepth(child, current + 1));
		}
	}
	return max;
}
