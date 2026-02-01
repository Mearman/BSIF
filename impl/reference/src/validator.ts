// BSIF Reference Implementation - Validator
// Two-stage validation: Schema validation (Zod) + Semantic validation

import type { BSIFDocument, StateMachine, State } from "./schemas.js";
import { ErrorCode, createError, createSuccess, createFailure, type ValidationError, type ValidationResult } from "./errors.js";
import { bsifDocument, isStateMachine } from "./schemas.js";

//==============================================================================
// Validation Options
//==============================================================================

export interface ValidationOptions {
	readonly checkSemantics?: boolean;
	readonly checkCircularReferences?: boolean;
}

const defaultOptions: ValidationOptions = {
	checkSemantics: true,
	checkCircularReferences: true,
};

//==============================================================================
// Main Validation Function
//==============================================================================

export function validate(document: unknown, options: ValidationOptions = defaultOptions): ValidationResult {
	// Stage 1: Schema validation using Zod
	const schemaResult = bsifDocument.safeParse(document);

	if (!schemaResult.success) {
		const errors = schemaResult.error.issues.map((err) =>
			createError(
				ErrorCode.InvalidFieldValue,
				err.message,
				{
					path: err.path.map(String),
					suggestion: `Field "${err.path.join(".")}" has invalid value`,
				},
			),
		);
		return createFailure(errors);
	}

	const doc = schemaResult.data;

	// Stage 2: Semantic validation
	if (options.checkSemantics) {
		const semanticErrors = validateSemantics(doc);

		if (semanticErrors.length > 0) {
			return createFailure(semanticErrors);
		}
	}

	return createSuccess();
}

export async function validateFile(
	path: string,
	options: ValidationOptions = defaultOptions,
): Promise<ValidationResult> {
	const doc = await (await import("./parser.js")).parseFile(path);
	return validate(doc, options);
}

//==============================================================================
// Semantic Validation
//==============================================================================

function validateSemantics(doc: BSIFDocument): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	if (isStateMachine(doc.semantics)) {
		errors.push(...validateStateMachine(doc.semantics));
	}

	return errors;
}

//==============================================================================
// State Machine Validation
//==============================================================================

function validateStateMachine(sm: StateMachine): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	const stateNames = new Set(sm.states.map((s) => s.name));

	// Check initial state exists
	if (!stateNames.has(sm.initial)) {
		errors.push(
			createError(
				ErrorCode.InitialStateMissing,
				`Initial state "${sm.initial}" not found in states`,
				{ suggestion: `Add state "${sm.initial}" or change initial to an existing state` },
			),
		);
	}

	// Check final states exist
	if (sm.final) {
		for (const finalState of sm.final) {
			if (!stateNames.has(finalState)) {
				errors.push(
					createError(
						ErrorCode.StateNotFound,
						`Final state "${finalState}" not found in states`,
					),
				);
			}
		}
	}

	// Check transitions reference valid states
	for (const transition of sm.transitions) {
		if (!stateNames.has(transition.from)) {
			errors.push(
				createError(
					ErrorCode.InvalidTransition,
					`Transition references unknown state "${transition.from}"`,
					{ path: ["transitions", "from"] },
				),
			);
		}

		if (!stateNames.has(transition.to)) {
			errors.push(
				createError(
					ErrorCode.InvalidTransition,
					`Transition references unknown state "${transition.to}"`,
					{ path: ["transitions", "to"] },
				),
			);
		}
	}

	// Check for circular parent references
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	for (const state of sm.states) {
		if (state.parent && !visited.has(state.name)) {
			const cycle = detectCircularReference(state.name, sm.states, visited, recursionStack);
			if (cycle) {
				errors.push(
					createError(
						ErrorCode.CircularStateReference,
						`Circular state reference detected: ${cycle.join(" -> ")}`,
						{ path: ["states", state.name, "parent"] },
					),
				);
			}
		}
	}

	return errors;
}

function detectCircularReference(
	stateName: string,
	states: readonly State[],
	visited: Set<string>,
	recursionStack: Set<string>,
): readonly string[] | null {
	visited.add(stateName);
	recursionStack.add(stateName);

	const state = states.find((s) => s.name === stateName);

	if (!state?.parent) {
		recursionStack.delete(stateName);
		return null;
	}

	if (recursionStack.has(state.parent)) {
		return [...recursionStack, state.parent];
	}

	const cycle = detectCircularReference(state.parent, states, visited, recursionStack);

	if (cycle) {
		return [...cycle];
	}

	recursionStack.delete(stateName);
	return null;
}
