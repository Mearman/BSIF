// BSIF Reference Implementation - Linter
// Opinionated style checks beyond validation

import type { BSIFDocument, StateMachine, Temporal } from "./schemas.js";
import { isStateMachine, isEvents, isTemporal } from "./schemas.js";
import { ErrorCode, createError, type ValidationError } from "./errors.js";

//==============================================================================
// Lint Rules
//==============================================================================

export interface LintOptions {
	readonly strict?: boolean;
	readonly rules?: ReadonlySet<string>;  // enable/disable rules by code
}

export function lint(doc: BSIFDocument, options?: LintOptions): readonly ValidationError[] {
	const allErrors: ValidationError[] = [];

	allErrors.push(...lintMetadata(doc));
	allErrors.push(...lintNaming(doc));
	allErrors.push(...lintSemantics(doc, options));

	if (options?.rules) {
		return allErrors.filter((e) => options.rules!.has(e.code));
	}

	return allErrors;
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

	if (isTemporal(doc.semantics)) {
		errors.push(...lintTemporal(doc.semantics));
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

	// E407: Redundant guard detection
	const ALWAYS_TRUE_GUARDS = new Set(["true", "1 == 1", "1==1"]);
	for (const t of sm.transitions) {
		if (t.guard !== undefined) {
			const normalized = t.guard.trim().toLowerCase();
			if (ALWAYS_TRUE_GUARDS.has(normalized)) {
				errors.push(
					createError(
						ErrorCode.LintRedundantGuard,
						`Transition ${t.from} -> ${t.to} has redundant guard "${t.guard}" which is always true`,
						{ severity: "warning", path: ["transitions", t.from, "guard"], suggestion: "Remove the always-true guard" },
					),
				);
			}
		}
	}

	// E409: Unreachable state hint (states with no incoming transitions except initial)
	const statesWithIncoming = new Set<string>();
	for (const t of sm.transitions) {
		statesWithIncoming.add(t.to);
	}
	for (const state of sm.states) {
		if (state.name === sm.initial) continue;
		// Skip states that are children (they may be entered via parent)
		if (state.parent !== undefined) continue;
		if (!statesWithIncoming.has(state.name)) {
			errors.push(
				createError(
					ErrorCode.LintUnreachableState,
					`State "${state.name}" has no incoming transitions and is not the initial state`,
					{ severity: "warning", path: ["states", state.name], suggestion: "Add a transition to this state or remove it" },
				),
			);
		}
	}

	return errors;
}

// E408: Simplifiable formula detection
function lintTemporal(temporal: Temporal): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	for (const property of temporal.properties) {
		errors.push(...lintFormulaSimplifiable(property.formula, property.name));
	}

	return errors;
}

function lintFormulaSimplifiable(formula: unknown, propertyName: string): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	if (typeof formula !== "object" || formula === null) return errors;
	if (!("operator" in formula) || typeof formula.operator !== "string") return errors;

	// Double negation: not(not(x))
	if (formula.operator === "not" && "operand" in formula) {
		const inner = formula.operand;
		if (typeof inner === "object" && inner !== null && "operator" in inner && inner.operator === "not") {
			errors.push(
				createError(
					ErrorCode.LintSimplifiableFormula,
					`Property "${propertyName}" contains double negation not(not(...)) which can be simplified`,
					{ severity: "warning", path: ["properties", propertyName], suggestion: "Remove the double negation" },
				),
			);
		}
	}

	// Single-operand and/or
	if ((formula.operator === "and" || formula.operator === "or") && "operands" in formula && Array.isArray(formula.operands)) {
		if (formula.operands.length === 1) {
			errors.push(
				createError(
					ErrorCode.LintSimplifiableFormula,
					`Property "${propertyName}" contains ${formula.operator}([x]) with a single operand which is unnecessary`,
					{ severity: "warning", path: ["properties", propertyName], suggestion: `Remove the unnecessary ${formula.operator} wrapper` },
				),
			);
		}
	}

	// Recurse
	if ("operand" in formula) {
		errors.push(...lintFormulaSimplifiable(formula.operand, propertyName));
	}
	if ("operands" in formula && Array.isArray(formula.operands)) {
		for (const operand of formula.operands) {
			errors.push(...lintFormulaSimplifiable(operand, propertyName));
		}
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
