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

	// Add general validation
	errors.push(...validateGeneral(doc));

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
	}

	return errors;
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

function validateGeneral(doc: BSIFDocument): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	// Validate BSIF version compatibility
	const version = doc.metadata.bsif_version;
	const supportedVersions = ["1.0.0", "1.0.1", "1.0.2"];

	if (!supportedVersions.some((v) => version.startsWith(v.slice(0, 3)))) {
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

	return errors;
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
