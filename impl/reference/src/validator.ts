// BSIF Reference Implementation - Validator
// Two-stage validation: Schema validation (Zod) + Semantic validation

import type {
	BSIFDocument,
	StateMachine,
	State,
	Temporal,
	Constraints,
	Events,
	Interaction,
	Hybrid,
} from "./schemas.js";
import {
	ErrorCode,
	createError,
	createSuccess,
	createFailure,
	type ValidationError,
	type ValidationResult,
} from "./errors.js";
import type { SourceMap } from "./parser.js";
import { resolveLocation, findPathOffset } from "./parser.js";
import {
	bsifDocument,
	isStateMachine,
	isTemporal,
	isConstraints,
	isEvents,
	isInteraction,
	isHybrid,
} from "./schemas.js";

//==============================================================================
// Validation Options
//==============================================================================

export interface ResourceLimits {
	readonly maxNestingDepth?: number;
	readonly maxStateCount?: number;
	readonly maxDocumentSize?: number;
}

export interface ValidationOptions {
	readonly checkSemantics?: boolean;
	readonly checkCircularReferences?: boolean;
	readonly resourceLimits?: ResourceLimits;
	readonly sourceMap?: SourceMap;
	readonly file?: string;
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
		let errors: readonly ValidationError[] = schemaResult.error.issues.map((err) =>
			createError(
				ErrorCode.InvalidFieldValue,
				err.message,
				{
					path: err.path.map(String),
					suggestion: `Field "${err.path.join(".")}" has invalid value`,
				},
			),
		);
		if (options.sourceMap) {
			errors = enrichErrorsWithSourceMap(errors, options.sourceMap);
		}
		if (options.file) {
			errors = enrichErrorsWithFile(errors, options.file);
		}
		return createFailure(errors);
	}

	const doc = schemaResult.data;

	// Stage 2: Semantic validation
	if (options.checkSemantics) {
		let semanticErrors = validateSemantics(doc, options.resourceLimits);

		if (options.sourceMap) {
			semanticErrors = enrichErrorsWithSourceMap(semanticErrors, options.sourceMap);
		}
		if (options.file) {
			semanticErrors = enrichErrorsWithFile(semanticErrors, options.file);
		}

		const hasErrors = semanticErrors.some((e) => e.severity === "error");
		if (hasErrors) {
			return createFailure(semanticErrors);
		}
		if (semanticErrors.length > 0) {
			// Warnings only — document is valid but has warnings
			return { valid: true, errors: semanticErrors };
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
// Source Map Enrichment
//==============================================================================

function enrichErrorsWithSourceMap(errors: readonly ValidationError[], sourceMap: SourceMap): readonly ValidationError[] {
	return errors.map((error) => {
		if (error.line !== undefined || !error.path || error.path.length === 0) return error;
		const offset = findPathOffset(sourceMap, error.path);
		if (offset === undefined) return error;
		const loc = resolveLocation(sourceMap, offset);
		return { ...error, line: loc.line, column: loc.column };
	});
}

function enrichErrorsWithFile(errors: readonly ValidationError[], file: string): readonly ValidationError[] {
	return errors.map((error) => ({ ...error, file }));
}

//==============================================================================
// Semantic Validation
//==============================================================================

function validateSemantics(doc: BSIFDocument, resourceLimits?: ResourceLimits): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	// Add general validation
	errors.push(...validateGeneral(doc, resourceLimits));

	// Dispatch to type-specific validators
	if (isStateMachine(doc.semantics)) {
		errors.push(...validateStateMachine(doc.semantics));
	} else if (isTemporal(doc.semantics)) {
		errors.push(...validateTemporal(doc.semantics));
	} else if (isConstraints(doc.semantics)) {
		errors.push(...validateConstraints(doc.semantics));
	} else if (isEvents(doc.semantics)) {
		errors.push(...validateEvents(doc.semantics));
	} else if (isInteraction(doc.semantics)) {
		errors.push(...validateInteraction(doc.semantics));
	} else if (isHybrid(doc.semantics)) {
		errors.push(...validateHybrid(doc.semantics));
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

	// Reachability analysis: BFS from initial state
	if (stateNames.has(sm.initial)) {
		const reachable = new Set<string>();
		const queue = [sm.initial];
		reachable.add(sm.initial);

		while (queue.length > 0) {
			const current = queue.shift();
			if (current === undefined) break;
			for (const transition of sm.transitions) {
				if (transition.from === current && !reachable.has(transition.to)) {
					reachable.add(transition.to);
					queue.push(transition.to);
				}
			}
		}

		// Parent states are reachable if any of their children are reachable
		let changed = true;
		while (changed) {
			changed = false;
			for (const state of sm.states) {
				if (!reachable.has(state.name) && state.parent === undefined) {
					// Check if this state is a parent of any reachable state
					const hasReachableChild = sm.states.some((s) => s.parent === state.name && reachable.has(s.name));
					if (hasReachableChild) {
						reachable.add(state.name);
						changed = true;
					}
				} else if (!reachable.has(state.name) && state.parent !== undefined) {
					// Also propagate: if a child is reachable, parent is reachable
					// (handled by checking all non-reachable states with parents)
				}
			}
			// Also: if a child is reachable, mark its parent chain as reachable
			for (const state of sm.states) {
				if (reachable.has(state.name) && state.parent && !reachable.has(state.parent)) {
					reachable.add(state.parent);
					changed = true;
				}
			}
		}

		for (const state of sm.states) {
			if (!reachable.has(state.name)) {
				errors.push(
					createError(
						ErrorCode.UnreachableState,
						`State "${state.name}" is not reachable from initial state "${sm.initial}"`,
						{ severity: "warning", path: ["states", state.name] },
					),
				);
			}
		}
	}

	// Parallel state validation: parallel states must have children
	for (const state of sm.states) {
		if (state.parallel) {
			const hasChildren = sm.states.some((s) => s.parent === state.name);
			if (!hasChildren) {
				errors.push(
					createError(
						ErrorCode.ParallelStateNoChildren,
						`Parallel state "${state.name}" has no child states`,
						{ severity: "warning", path: ["states", state.name], suggestion: "Add child states or remove the parallel flag" },
					),
				);
			}
		}
	}

	// Parent reference validation
	for (const state of sm.states) {
		if (state.parent !== undefined && !stateNames.has(state.parent)) {
			errors.push(
				createError(
					ErrorCode.StateNotFound,
					`State "${state.name}" references non-existent parent "${state.parent}"`,
					{ path: ["states", state.name, "parent"] },
				),
			);
		}
	}

	// Parallel region independence: transitions between sibling parallel regions
	for (const state of sm.states) {
		if (state.parallel) {
			const children = sm.states.filter((s) => s.parent === state.name);
			const regionMap = new Map<string, Set<string>>();
			for (const child of children) {
				const region = collectDescendants(child.name, sm.states);
				region.add(child.name);
				regionMap.set(child.name, region);
			}

			for (const t of sm.transitions) {
				const fromRegion = findRegion(t.from, regionMap);
				const toRegion = findRegion(t.to, regionMap);
				if (fromRegion !== undefined && toRegion !== undefined && fromRegion !== toRegion) {
					errors.push(
						createError(
							ErrorCode.ParallelRegionTransition,
							`Transition from "${t.from}" to "${t.to}" crosses parallel regions of state "${state.name}" (from region "${fromRegion}" to region "${toRegion}")`,
							{ severity: "warning", path: ["transitions", t.from] },
						),
					);
				}
			}
		}
	}

	// Nested parallelism warning
	for (const state of sm.states) {
		if (state.parallel && state.parent !== undefined) {
			const parentState = sm.states.find((s) => s.name === state.parent);
			if (parentState?.parallel) {
				errors.push(
					createError(
						ErrorCode.NestedParallelState,
						`Parallel state "${state.name}" is nested inside parallel state "${state.parent}". Nested parallelism semantics are not defined by the BSIF specification.`,
						{ severity: "warning", path: ["states", state.name] },
					),
				);
			}
		}
	}

	// Timing constraint validation
	for (const t of sm.transitions) {
		if (t.timing) {
			const timing = t.timing;
			if (timing.deadline !== undefined && timing.timeout !== undefined &&
				timing.deadline < timing.timeout) {
				errors.push(
					createError(
						ErrorCode.InvalidTimingConstraint,
						`Transition ${t.from} -> ${t.to}: deadline (${timing.deadline}) is less than timeout (${timing.timeout})`,
						{ severity: "warning", path: ["transitions", t.from, "timing"] },
					),
				);
			}

			// Warn on unreasonably large timing values
			const MAX_TIMING_VALUE = 1e9;
			for (const [key, value] of Object.entries(timing)) {
				if (typeof value === "number" && value > MAX_TIMING_VALUE) {
					errors.push(
						createError(
							ErrorCode.InvalidTimingConstraint,
							`Transition ${t.from} -> ${t.to}: timing value "${key}" (${value}) exceeds reasonable maximum of ${MAX_TIMING_VALUE}`,
							{ severity: "warning", path: ["transitions", t.from, "timing", key] },
						),
					);
				}
			}

			// Warn if period is specified without unit
			if (timing.period !== undefined && timing.unit === undefined) {
				errors.push(
					createError(
						ErrorCode.InvalidTimingConstraint,
						`Transition ${t.from} -> ${t.to}: timing has "period" but no "unit" specified`,
						{ severity: "warning", path: ["transitions", t.from, "timing"] },
					),
				);
			}
		}
	}

	// State-level timing validation
	for (const state of sm.states) {
		if (state.timing) {
			const timing = state.timing;
			if (timing.deadline !== undefined && timing.timeout !== undefined &&
				timing.deadline < timing.timeout) {
				errors.push(
					createError(
						ErrorCode.InvalidTimingConstraint,
						`State "${state.name}": deadline (${timing.deadline}) is less than timeout (${timing.timeout})`,
						{ severity: "warning", path: ["states", state.name, "timing"] },
					),
				);
			}
			const MAX_TIMING_VALUE = 1e9;
			for (const [key, value] of Object.entries(timing)) {
				if (typeof value === "number" && value > MAX_TIMING_VALUE) {
					errors.push(
						createError(
							ErrorCode.InvalidTimingConstraint,
							`State "${state.name}": timing value "${key}" (${value}) exceeds reasonable maximum of ${MAX_TIMING_VALUE}`,
							{ severity: "warning", path: ["states", state.name, "timing", key] },
						),
					);
				}
			}
			if (timing.period !== undefined && timing.unit === undefined) {
				errors.push(
					createError(
						ErrorCode.InvalidTimingConstraint,
						`State "${state.name}": timing has "period" but no "unit" specified`,
						{ severity: "warning", path: ["states", state.name, "timing"] },
					),
				);
			}
		}
	}

	// Deadlock detection: non-final states with no outgoing transitions
	if (sm.final) {
		const finalStates = new Set(sm.final);
		for (const state of sm.states) {
			if (finalStates.has(state.name)) continue;
			const hasOutgoing = sm.transitions.some((t) => t.from === state.name);
			if (!hasOutgoing) {
				errors.push(
					createError(
						ErrorCode.DeadlockDetected,
						`State "${state.name}" has no outgoing transitions and is not a final state`,
						{ severity: "warning", path: ["states", state.name] },
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

//==============================================================================
// Temporal Logic Validation
//==============================================================================

function validateTemporal(temporal: Temporal): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	const declaredVariables = new Set(Object.keys(temporal.variables));
	const propertyNames = new Set<string>();

	// CTL logic type warning: spec does not define CTL satisfaction semantics
	if (temporal.logic === "ctl") {
		errors.push(
			createError(
				ErrorCode.CTLSemanticsUndefined,
				'Temporal logic type "ctl" is accepted but CTL satisfaction semantics are not yet defined in the BSIF specification. Formulas will be validated structurally only.',
				{ severity: "warning", path: ["semantics", "logic"] },
			),
		);

		// Warn about ambiguous "next" operator under CTL
		for (const property of temporal.properties) {
			if (formulaUsesOperator(property.formula, "next")) {
				errors.push(
					createError(
						ErrorCode.CTLOperatorAmbiguous,
						`Property "${property.name}" uses "next" operator which has ambiguous semantics under CTL (could be AX or EX). Consider using LTL logic type.`,
						{ severity: "warning", path: ["properties", property.name] },
					),
				);
			}
		}
	}

	// Check each property
	for (const property of temporal.properties) {
		// Check for duplicate property names
		if (propertyNames.has(property.name)) {
			errors.push(
				createError(
					ErrorCode.DuplicateName,
					`Duplicate property name "${property.name}"`,
					{ path: ["properties", property.name] },
				),
			);
		}
		propertyNames.add(property.name);

		// Validate formula structure
		errors.push(...validateFormulaStructure(property.formula, ["properties", property.name], 0));

		// Collect variable references from formula
		const referencedVars = collectVariableReferences(property.formula);

		// Check all variables are defined
		for (const variableName of referencedVars) {
			if (!declaredVariables.has(variableName)) {
				errors.push(
					createError(
						ErrorCode.UndefinedVariable,
						`Variable "${variableName}" is referenced but not declared`,
						{
							path: ["properties", property.name],
							suggestion: `Add variable "${variableName}" to the variables section`,
						},
					),
				);
			}
		}

		// Check type compatibility: logical operators require boolean operands
		errors.push(...checkFormulaTypeCompatibility(property.formula, temporal.variables, ["properties", property.name]));
	}

	// Validate enum values for duplicate entries
	for (const [varName, varType] of Object.entries(temporal.variables)) {
		errors.push(...validateEnumValues(varName, varType, ["variables"]));
	}

	// Validate type references in object properties
	errors.push(...validateTypeReferences(temporal.variables, ["variables"]));

	return errors;
}

// Check type compatibility: logical operators expect boolean operands
const LOGICAL_OPERATORS = new Set(["not", "and", "or", "implies", "until", "globally", "finally", "next", "always", "eventually"]);

function checkFormulaTypeCompatibility(
	formula: unknown,
	variables: Record<string, unknown>,
	path: readonly string[],
): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	if (typeof formula !== "object" || formula === null) return errors;
	if (!("operator" in formula) || typeof formula.operator !== "string") return errors;

	const op = formula.operator;

	if (LOGICAL_OPERATORS.has(op)) {
		// Check direct variable operands for type compatibility
		if ("operand" in formula) {
			errors.push(...checkOperandType(formula.operand, variables, path, op));
			errors.push(...checkFormulaTypeCompatibility(formula.operand, variables, [...path, op]));
		}
		if ("operands" in formula && Array.isArray(formula.operands)) {
			for (const operand of formula.operands) {
				errors.push(...checkOperandType(operand, variables, path, op));
				errors.push(...checkFormulaTypeCompatibility(operand, variables, [...path, op]));
			}
		}
	}

	return errors;
}

function checkOperandType(
	operand: unknown,
	variables: Record<string, unknown>,
	path: readonly string[],
	parentOp: string,
): readonly ValidationError[] {
	if (typeof operand !== "object" || operand === null) return [];
	if (!("operator" in operand) || operand.operator !== "variable") return [];
	if (!("variable" in operand) || typeof operand.variable !== "string") return [];

	const varName = operand.variable;
	const varType = variables[varName];

	if (typeof varType === "string" && varType !== "boolean") {
		return [
			createError(
				ErrorCode.IncompatibleTypes,
				`Variable "${varName}" has type "${varType}" but is used as operand of logical operator "${parentOp}" which expects boolean`,
				{ path: [...path, parentOp, varName] },
			),
		];
	}

	return [];
}

// Check if a formula tree contains a specific operator
function formulaUsesOperator(formula: unknown, op: string): boolean {
	if (typeof formula !== "object" || formula === null) return false;
	if (!("operator" in formula)) return false;
	const f = formula;
	if (f.operator === op) return true;
	if ("operand" in f) return formulaUsesOperator(f.operand, op);
	if ("operands" in f && Array.isArray(f.operands)) {
		return (f.operands).some((o: unknown) => formulaUsesOperator(o, op));
	}
	return false;
}

// Collect all variable references from an LTL formula
function collectVariableReferences(formula: unknown): Set<string> {
	const variables = new Set<string>();

	if (typeof formula !== "object" || formula === null) {
		return variables;
	}

	if ("operator" in formula && formula.operator === "variable" && "variable" in formula && typeof formula.variable === "string") {
		variables.add(formula.variable);
	} else if ("operand" in formula) {
		const childVars = collectVariableReferences(formula.operand);
		childVars.forEach((v) => variables.add(v));
	} else if ("operands" in formula && Array.isArray(formula.operands)) {
		for (const operand of formula.operands) {
			const childVars = collectVariableReferences(operand);
			childVars.forEach((v) => variables.add(v));
		}
	}

	return variables;
}

// Validate formula structure (operand counts, nesting depth)
const UNARY_OPERATORS = new Set(["not", "globally", "finally", "next", "always", "eventually"]);
const BINARY_OPERATORS = new Set(["and", "or", "implies", "until"]);
const MAX_FORMULA_DEPTH = 100;

function validateFormulaStructure(formula: unknown, path: readonly string[], depth: number): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	if (typeof formula !== "object" || formula === null) {
		return errors;
	}

	if (depth > MAX_FORMULA_DEPTH) {
		errors.push(
			createError(
				ErrorCode.NestingDepthExceeded,
				`Formula nesting depth exceeds maximum of ${MAX_FORMULA_DEPTH}`,
				{ severity: "warning", path: [...path] },
			),
		);
		return errors;
	}

	if (!("operator" in formula) || typeof formula.operator !== "string") {
		return errors;
	}

	const op = formula.operator;

	if (UNARY_OPERATORS.has(op)) {
		if (!("operand" in formula)) {
			errors.push(
				createError(
					ErrorCode.InvalidFormulaStructure,
					`Unary operator "${op}" requires an "operand" field`,
					{ path: [...path, op] },
				),
			);
		} else {
			errors.push(...validateFormulaStructure(formula.operand, [...path, op], depth + 1));
		}
	} else if (BINARY_OPERATORS.has(op)) {
		if (!("operands" in formula) || !Array.isArray(formula.operands)) {
			errors.push(
				createError(
					ErrorCode.InvalidFormulaStructure,
					`Binary operator "${op}" requires an "operands" array`,
					{ path: [...path, op] },
				),
			);
		} else {
			if (op === "until" && formula.operands.length !== 2) {
				errors.push(
					createError(
						ErrorCode.InvalidFormulaStructure,
						`Operator "until" requires exactly 2 operands, got ${formula.operands.length}`,
						{ path: [...path, op] },
					),
				);
			} else if (formula.operands.length < 2) {
				errors.push(
					createError(
						ErrorCode.InvalidFormulaStructure,
						`Binary operator "${op}" requires at least 2 operands, got ${formula.operands.length}`,
						{ path: [...path, op] },
					),
				);
			}
			for (const operand of formula.operands) {
				errors.push(...validateFormulaStructure(operand, [...path, op], depth + 1));
			}
		}
	}

	return errors;
}

//==============================================================================
// Constraints Validation
//==============================================================================

function validateConstraints(constraints: Constraints): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	// Validate target has at least one non-empty reference field
	const targetFields = [constraints.target.function, constraints.target.method, constraints.target.class, constraints.target.module];
	const hasNonEmptyTarget = targetFields.some((f) => f !== undefined && f !== "");
	if (!hasNonEmptyTarget) {
		errors.push(
			createError(
				ErrorCode.InvalidTargetReference,
				"Target reference must have at least one non-empty field (function, method, class, or module)",
				{ path: ["target"] },
			),
		);
	}

	// Basic expression syntax validation
	for (const precondition of constraints.preconditions) {
		errors.push(...validateExpressionSyntax(precondition.expression, "preconditions"));
		// old. references are only valid in postconditions
		if (/\bold\./.test(precondition.expression)) {
			errors.push(
				createError(
					ErrorCode.InvalidOldReference,
					"old. reference in precondition is invalid (only allowed in postconditions)",
					{ path: ["preconditions"], suggestion: "Move this constraint to postconditions or remove the old. reference" },
				),
			);
		}
	}

	for (const postcondition of constraints.postconditions) {
		errors.push(...validateExpressionSyntax(postcondition.expression, "postconditions"));
	}

	if (constraints.invariants) {
		for (const invariant of constraints.invariants) {
			errors.push(...validateExpressionSyntax(invariant.expression, "invariants"));
			// old. references are only valid in postconditions
			if (/\bold\./.test(invariant.expression)) {
				errors.push(
					createError(
						ErrorCode.InvalidOldReference,
						"old. reference in invariant is invalid (only allowed in postconditions)",
						{ path: ["invariants"], suggestion: "Move this constraint to postconditions or remove the old. reference" },
					),
				);
			}
		}
	}

	return errors;
}

function validateExpressionSyntax(expression: string, context: string): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	// Check for empty expression
	if (!expression.trim()) {
		errors.push(
			createError(
				ErrorCode.InvalidExpression,
				"Empty constraint expression",
				{ path: [context] },
			),
		);
	}

	// Basic parenthesis matching
	let depth = 0;
	for (const char of expression) {
		if (char === "(") depth++;
		if (char === ")") depth--;
		if (depth < 0) {
			errors.push(
				createError(
					ErrorCode.InvalidExpression,
					"Unmatched closing parenthesis in constraint expression",
					{ path: [context] },
				),
			);
			break;
		}
	}

	if (depth > 0) {
		errors.push(
			createError(
				ErrorCode.InvalidExpression,
				"Unmatched opening parenthesis in constraint expression",
				{ path: [context] },
			),
		);
	}

	// Check for obviously invalid patterns (consecutive operators, excluding == and !=)
	const normalized = expression.replace(/[!=]=|[<>]=/g, " ");
	if (/[*+=]{2,}/.test(normalized)) {
		errors.push(
			createError(
				ErrorCode.InvalidExpression,
				"Invalid operator sequence in constraint expression",
				{ path: [context] },
			),
		);
	}

	return errors;
}

//==============================================================================
// Events Validation
//==============================================================================

function validateEvents(events: Events): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	const declaredEvents = new Set(Object.keys(events.events));
	const referencedEvents = new Set<string>();

	// Check each handler
	for (const handler of events.handlers) {
		// Check that referenced events are declared
		if (!declaredEvents.has(handler.event)) {
			errors.push(
				createError(
					ErrorCode.UndefinedEvent,
					`Handler references undefined event "${handler.event}"`,
					{
						path: ["handlers", handler.event],
						suggestion: `Add event declaration for "${handler.event}" or fix handler name`,
					},
				),
			);
		} else {
			referencedEvents.add(handler.event);

			// Check payload type compatibility
			if (handler.expects !== undefined) {
				const eventDecl = events.events[handler.event];
				if (eventDecl?.payload !== undefined) {
					const eventPayloadType = typeof eventDecl.payload === "string" ? eventDecl.payload : eventDecl.payload.type;
					const handlerExpectsType = typeof handler.expects === "string" ? handler.expects : handler.expects.type;
					if (eventPayloadType !== handlerExpectsType) {
						errors.push(
							createError(
								ErrorCode.PayloadTypeMismatch,
								`Handler expects payload type "${handlerExpectsType}" but event "${handler.event}" declares payload type "${eventPayloadType}"`,
								{ path: ["handlers", handler.event, "expects"] },
							),
						);
					}
				}
			}
		}
	}

	// Validate enum values in event payloads
	for (const [eventName, eventDecl] of Object.entries(events.events)) {
		if (eventDecl.payload !== undefined) {
			errors.push(...validateEnumValues(eventName, eventDecl.payload, ["events", eventName, "payload"]));
		}
	}

	// Check for unused event declarations (warnings)
	const unusedEvents = [...declaredEvents].filter((e) => !referencedEvents.has(e));
	for (const unusedEvent of unusedEvents) {
		errors.push(
			createError(
				ErrorCode.UnusedEventDeclaration,
				`Event "${unusedEvent}" is declared but never used`,
				{ severity: "warning", path: ["events", unusedEvent] },
			),
		);
	}

	return errors;
}

//==============================================================================
// Interaction Validation
//==============================================================================

function validateInteraction(interaction: Interaction): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	const participantNames = new Set(interaction.participants.map((p) => p.name));

	// Check for duplicate participant names
	const seenNames = new Set<string>();
	for (const participant of interaction.participants) {
		if (seenNames.has(participant.name)) {
			errors.push(
				createError(
					ErrorCode.DuplicateName,
					`Duplicate participant name "${participant.name}"`,
					{ path: ["participants", participant.name] },
				),
			);
		}
		seenNames.add(participant.name);
	}

	// Check each message references valid participants
	for (const message of interaction.messages) {
		if (!participantNames.has(message.from)) {
			errors.push(
				createError(
					ErrorCode.UndefinedParticipant,
					`Message references undefined participant "${message.from}"`,
					{ path: ["messages", message.from] },
				),
			);
		}

		if (!participantNames.has(message.to)) {
			errors.push(
				createError(
					ErrorCode.UndefinedParticipant,
					`Message references undefined participant "${message.to}"`,
					{ path: ["messages", message.to] },
				),
			);
		}
	}

	// Validate message sequence ordering
	const sequencedMessages = interaction.messages.filter((m) => m.sequence !== undefined);
	if (sequencedMessages.length > 0) {
		const seenSequences = new Set<number>();
		for (const message of sequencedMessages) {
			if (message.sequence === undefined) continue;
			const seq = message.sequence;
			if (seenSequences.has(seq)) {
				errors.push(
					createError(
						ErrorCode.InvalidMessageSequence,
						`Duplicate message sequence number ${seq}`,
						{ path: ["messages", String(seq)] },
					),
				);
			}
			seenSequences.add(seq);
		}
	}

	return errors;
}

//==============================================================================
// Hybrid Validation
//==============================================================================

function validateHybrid(hybrid: Hybrid): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	// Check each component is a valid semantics type
	for (let i = 0; i < hybrid.components.length; i++) {
		const component = hybrid.components[i];

		// Use type guards to check if valid
		const isValid =
			isStateMachine(component) ||
			isTemporal(component) ||
			isConstraints(component) ||
			isEvents(component) ||
			isInteraction(component) ||
			isHybrid(component);

		if (!isValid) {
			errors.push(
				createError(
					ErrorCode.InvalidComponentType,
					`Component at index ${i} is not a valid semantic type`,
					{ path: ["components", String(i)] },
				),
			);
		}
	}

	// Namespace conflict detection across components
	const stateNames = new Map<string, number>();
	const variableNames = new Map<string, number>();
	const eventNames = new Map<string, number>();

	for (let i = 0; i < hybrid.components.length; i++) {
		const component = hybrid.components[i];

		if (isStateMachine(component)) {
			for (const state of component.states) {
				if (stateNames.has(state.name)) {
					errors.push(
						createError(
							ErrorCode.NamespaceConflict,
							`State name "${state.name}" conflicts between components ${stateNames.get(state.name)} and ${i}`,
							{ severity: "warning", path: ["components", String(i), "states", state.name] },
						),
					);
				} else {
					stateNames.set(state.name, i);
				}
			}
		} else if (isTemporal(component)) {
			for (const varName of Object.keys(component.variables)) {
				if (variableNames.has(varName)) {
					errors.push(
						createError(
							ErrorCode.NamespaceConflict,
							`Variable name "${varName}" conflicts between components ${variableNames.get(varName)} and ${i}`,
							{ severity: "warning", path: ["components", String(i), "variables", varName] },
						),
					);
				} else {
					variableNames.set(varName, i);
				}
			}
		} else if (isEvents(component)) {
			for (const eventName of Object.keys(component.events)) {
				if (eventNames.has(eventName)) {
					errors.push(
						createError(
							ErrorCode.NamespaceConflict,
							`Event name "${eventName}" conflicts between components ${eventNames.get(eventName)} and ${i}`,
							{ severity: "warning", path: ["components", String(i), "events", eventName] },
						),
					);
				} else {
					eventNames.set(eventName, i);
				}
			}
		}
	}

	return errors;
}

//==============================================================================
// General Validation
//==============================================================================

function validateGeneral(doc: BSIFDocument, resourceLimits?: ResourceLimits): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	// Validate BSIF version compatibility (supports 1.0.x range)
	const version = doc.metadata.bsif_version;
	if (!isCompatibleVersion(version)) {
		errors.push(
			createError(
				ErrorCode.VersionMismatch,
				`BSIF version "${version}" is not supported (supported: 1.0.x)`,
				{ path: ["metadata", "bsif_version"] },
			),
		);
	}

	// Check for duplicate names based on semantic type
	if (isStateMachine(doc.semantics)) {
		errors.push(...checkDuplicateStateNames(doc.semantics));
	}

	// Resource limits validation
	errors.push(...validateResourceLimits(doc, resourceLimits));

	// Composition reference validation
	if (doc.metadata.references) {
		errors.push(...validateCompositionReferences(doc));
	}

	// Tool mapping validation
	if (doc.tools) {
		errors.push(...validateTools(doc));
	}

	return errors;
}

function validateCompositionReferences(doc: BSIFDocument): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	const refs = doc.metadata.references;

	if (!refs) return errors;

	// Check for duplicate references
	const seen = new Set<string>();
	for (const ref of refs) {
		if (seen.has(ref)) {
			errors.push(
				createError(
					ErrorCode.DuplicateReference,
					`Duplicate reference: ${ref}`,
					{ severity: "warning", path: ["metadata", "references"] },
				),
			);
		}
		seen.add(ref);
	}

	// Check for self-references (reference URL contains the document's own name)
	const docName = doc.metadata.name;
	for (const ref of refs) {
		if (ref.includes(docName)) {
			errors.push(
				createError(
					ErrorCode.DuplicateReference,
					`Self-reference detected: "${ref}" references document "${docName}"`,
					{ severity: "warning", path: ["metadata", "references"] },
				),
			);
		}
	}

	return errors;
}

const DEFAULT_MAX_NESTING_DEPTH = 32;
const DEFAULT_MAX_STATE_COUNT = 1000;
const DEFAULT_MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

function validateResourceLimits(doc: BSIFDocument, limits?: ResourceLimits): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	const maxNestingDepth = limits?.maxNestingDepth ?? DEFAULT_MAX_NESTING_DEPTH;
	const maxStateCount = limits?.maxStateCount ?? DEFAULT_MAX_STATE_COUNT;
	const maxDocumentSize = limits?.maxDocumentSize ?? DEFAULT_MAX_DOCUMENT_SIZE;

	// Check document size
	const docSize = JSON.stringify(doc).length;
	if (docSize > maxDocumentSize) {
		errors.push(
			createError(
				ErrorCode.ResourceLimitExceeded,
				`Document size ${docSize} bytes exceeds maximum of ${maxDocumentSize} bytes`,
				{ severity: "warning" },
			),
		);
	}

	// Check state count
	if (isStateMachine(doc.semantics) && doc.semantics.states.length > maxStateCount) {
		errors.push(
			createError(
				ErrorCode.ResourceLimitExceeded,
				`State count ${doc.semantics.states.length} exceeds maximum of ${maxStateCount}`,
				{ severity: "warning", path: ["semantics", "states"] },
			),
		);
	}

	// Check nesting depth
	const depth = measureNestingDepth(doc, 0);
	if (depth > maxNestingDepth) {
		errors.push(
			createError(
				ErrorCode.NestingDepthExceeded,
				`Document nesting depth ${depth} exceeds maximum of ${maxNestingDepth}`,
				{ severity: "warning" },
			),
		);
	}

	return errors;
}

function measureNestingDepth(value: unknown, currentDepth: number): number {
	if (typeof value !== "object" || value === null) {
		return currentDepth;
	}

	let maxDepth = currentDepth;

	if (Array.isArray(value)) {
		for (const item of value) {
			maxDepth = Math.max(maxDepth, measureNestingDepth(item, currentDepth + 1));
		}
	} else {
		for (const [, child] of Object.entries(value)) {
			maxDepth = Math.max(maxDepth, measureNestingDepth(child, currentDepth + 1));
		}
	}

	return maxDepth;
}

function validateTools(doc: BSIFDocument): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	if (!doc.tools) return errors;

	for (const [toolName, mapping] of Object.entries(doc.tools)) {
		if (typeof mapping === "object" && mapping !== null && Object.keys(mapping).length === 0) {
			errors.push(
				createError(
					ErrorCode.EmptyToolMapping,
					`Tool mapping "${toolName}" is empty`,
					{ severity: "warning", path: ["tools", toolName] },
				),
			);
		}
	}

	return errors;
}

function validateEnumValues(varName: string, varType: unknown, path: readonly string[]): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	if (typeof varType !== "object" || varType === null) return errors;
	if (!("type" in varType) || varType.type !== "enum") return errors;
	if (!("values" in varType) || !Array.isArray(varType.values)) return errors;

	const seen = new Set<string>();
	for (const val of varType.values) {
		const key = String(val);
		if (seen.has(key)) {
			errors.push(
				createError(
					ErrorCode.DuplicateEnumValue,
					`Duplicate enum value "${key}" in variable "${varName}"`,
					{ path: [...path, varName, "values"] },
				),
			);
		}
		seen.add(key);
	}

	return errors;
}

function validateTypeReferences(variables: Record<string, unknown>, path: readonly string[]): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	const declaredNames = new Set(Object.keys(variables));
	const primitives = new Set(["boolean", "integer", "string"]);

	for (const [varName, varType] of Object.entries(variables)) {
		if (typeof varType !== "object" || varType === null) continue;
		if (!("type" in varType) || varType.type !== "object") continue;
		if (!("properties" in varType) || typeof varType.properties !== "object" || varType.properties === null) continue;

		for (const [propName, propType] of Object.entries(varType.properties)) {
			if (typeof propType === "string" && !primitives.has(propType) && !declaredNames.has(propType)) {
				errors.push(
					createError(
						ErrorCode.UndefinedTypeReference,
						`Property "${propName}" of variable "${varName}" references undefined type "${propType}"`,
						{ severity: "warning", path: [...path, varName, "properties", propName] },
					),
				);
			}
		}
	}

	return errors;
}

function collectDescendants(stateName: string, states: readonly State[]): Set<string> {
	const descendants = new Set<string>();
	const queue = [stateName];
	while (queue.length > 0) {
		const current = queue.pop();
		if (current === undefined) break;
		for (const s of states) {
			if (s.parent === current && !descendants.has(s.name)) {
				descendants.add(s.name);
				queue.push(s.name);
			}
		}
	}
	return descendants;
}

function findRegion(stateName: string, regionMap: Map<string, Set<string>>): string | undefined {
	for (const [regionName, members] of regionMap) {
		if (members.has(stateName)) return regionName;
	}
	return undefined;
}

function isCompatibleVersion(version: string): boolean {
	const match = /^(\d+)\.(\d+)\.\d+/.exec(version);
	if (!match) return false;
	return match[1] === "1" && match[2] === "0";
}

function checkDuplicateStateNames(sm: StateMachine): readonly ValidationError[] {
	const errors: ValidationError[] = [];
	const seenNames = new Set<string>();

	for (const state of sm.states) {
		if (seenNames.has(state.name)) {
			errors.push(
				createError(
					ErrorCode.DuplicateName,
					`Duplicate state name "${state.name}"`,
					{ path: ["states", state.name] },
				),
			);
		}
		seenNames.add(state.name);
	}

	return errors;
}
