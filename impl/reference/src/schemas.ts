// BSIF Reference Implementation - Zod Schemas
// Pattern: Schema → Inferred Type → Type Guard

import { z } from "zod";

//==============================================================================
// Common Schemas
//==============================================================================

const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const bsifMetadata = z.object({
	bsif_version: z.string().regex(semverPattern),
	name: z.string().min(1).max(256),
	version: z.string().regex(semverPattern).optional(),
	description: z.string().max(4096).optional(),
	author: z.string().max(512).optional(),
	license: z.string().max(64).optional(),
	references: z.array(z.url()).max(100).optional(),
});

export type BSIFMetadata = z.infer<typeof bsifMetadata>;

export function isBSIFMetadata(value: unknown): value is BSIFMetadata {
	return bsifMetadata.safeParse(value).success;
}

//==============================================================================
// Timing Constraint Schemas
//==============================================================================

export const timingConstraint = z.object({
	deadline: z.number().positive().optional(),
	timeout: z.number().positive().optional(),
	period: z.number().positive().optional(),
	unit: z.union([
		z.literal("ms"),
		z.literal("s"),
		z.literal("us"),
		z.literal("ns"),
	]).optional(),
});

export type TimingConstraint = z.infer<typeof timingConstraint>;

//==============================================================================
// State Machine Schemas
//==============================================================================

export const state = z.object({
	name: z.string().min(1).max(256),
	entry: z.string().max(4096).optional(),
	exit: z.string().max(4096).optional(),
	parent: z.string().optional(),
	parallel: z.boolean().optional(),
	timing: timingConstraint.optional(),
});

export type State = z.infer<typeof state>;

export function isState(value: unknown): value is State {
	return state.safeParse(value).success;
}

export const transition = z.object({
	from: z.string().min(1),
	to: z.string().min(1),
	event: z.string().optional(),
	guard: z.string().max(4096).optional(),
	action: z.string().max(4096).optional(),
	timing: timingConstraint.optional(),
});

export type Transition = z.infer<typeof transition>;

export function isTransition(value: unknown): value is Transition {
	return transition.safeParse(value).success;
}

export const stateMachine = z.object({
	type: z.literal("state-machine"),
	states: z.array(state).min(1),
	transitions: z.array(transition).min(0),
	initial: z.string().min(1),
	final: z.array(z.string().min(1)).optional(),
});

export type StateMachine = z.infer<typeof stateMachine>;

export function isStateMachine(value: unknown): value is StateMachine {
	return stateMachine.safeParse(value).success;
}

//==============================================================================
// Temporal Logic Schemas
//==============================================================================

export const variableType = z.union([
	z.literal("boolean"),
	z.literal("integer"),
	z.literal("string"),
]);

export type VariableType = z.infer<typeof variableType>;

export const objectType = z.object({
	type: z.literal("object"),
	properties: z.record(z.string(), z.union([variableType, z.string()])),
});

export type ObjectType = z.infer<typeof objectType>;

export const variableDeclarations = z.record(z.string(), z.union([variableType, objectType]));

export type VariableDeclarations = z.infer<typeof variableDeclarations>;

export const literalValue = z.object({
	operator: z.literal("literal"),
	value: z.union([z.boolean(), z.number(), z.string()]),
});

export type LiteralValue = z.infer<typeof literalValue>;

export const variableRef = z.object({
	operator: z.literal("variable"),
	variable: z.string(),
});

export type VariableRef = z.infer<typeof variableRef>;

export const unaryOperator = z.union([
	z.literal("not"),
	z.literal("globally"),
	z.literal("finally"),
	z.literal("next"),
	z.literal("always"),
	z.literal("eventually"),
]);

export type UnaryOperator = z.infer<typeof unaryOperator>;

export const binaryOperator = z.union([
	z.literal("and"),
	z.literal("or"),
	z.literal("implies"),
	z.literal("until"),
]);

export type BinaryOperator = z.infer<typeof binaryOperator>;

// Recursive type for LTL formulas
export const ltlFormula: z.ZodType = z.lazy(() =>
	z.union([
		z.object({
			operator: unaryOperator,
			operand: z.lazy(() => ltlFormula),
		}),
		z.object({
			operator: binaryOperator,
			operands: z.array(z.lazy(() => ltlFormula)),
		}),
		variableRef,
		literalValue,
	]),
);

export type LTLFormula = z.infer<typeof ltlFormula>;

export const property = z.object({
	name: z.string(),
	formula: ltlFormula,
});

export type Property = z.infer<typeof property>;

const temporalLogic = z.union([
	z.literal("ltl"),
	z.literal("ctl"),
]);

export const temporal = z.object({
	type: z.literal("temporal"),
	logic: temporalLogic,
	variables: variableDeclarations,
	properties: z.array(property).min(1),
});

export type Temporal = z.infer<typeof temporal>;

export function isTemporal(value: unknown): value is Temporal {
	return temporal.safeParse(value).success;
}

//==============================================================================
// Constraints Schemas
//==============================================================================

export const targetReference = z.object({
	function: z.string().optional(),
	method: z.string().optional(),
	class: z.string().optional(),
	module: z.string().optional(),
});

export type TargetReference = z.infer<typeof targetReference>;

export const constraint = z.object({
	description: z.string().min(1).max(4096),
	expression: z.string().min(1).max(4096),
});

export type Constraint = z.infer<typeof constraint>;

export const constraints = z.object({
	type: z.literal("constraints"),
	target: targetReference.refine((val) => Object.keys(val).length >= 1, {
		message: "Target reference must have at least one field",
	}),
	preconditions: z.array(constraint),
	postconditions: z.array(constraint),
	invariants: z.array(constraint).optional(),
});

export type Constraints = z.infer<typeof constraints>;

export function isConstraints(value: unknown): value is Constraints {
	return constraints.safeParse(value).success;
}

//==============================================================================
// Events Schemas
//==============================================================================

export const primitiveType = z.union([
	z.literal("boolean"),
	z.literal("integer"),
	z.literal("string"),
]);

export type PrimitiveType = z.infer<typeof primitiveType>;

export const typeDefinition = z.union([primitiveType, objectType]);

export type TypeDefinition = z.infer<typeof typeDefinition>;

export const eventDeclaration = z.object({
	payload: typeDefinition.optional(),
	attributes: z.record(z.string(), z.unknown()).optional(),
});

export type EventDeclaration = z.infer<typeof eventDeclaration>;

export const eventDeclarations = z.record(z.string(), eventDeclaration);

export const handler = z.object({
	event: z.string(),
	filter: z.string().max(4096).optional(),
	action: z.string().max(4096).optional(),
	propagates: z.boolean().optional(),
});

export type Handler = z.infer<typeof handler>;

export const events = z.object({
	type: z.literal("events"),
	events: eventDeclarations,
	handlers: z.array(handler).min(0),
});

export type Events = z.infer<typeof events>;

export function isEvents(value: unknown): value is Events {
	return events.safeParse(value).success;
}

//==============================================================================
// Interaction Schemas
//==============================================================================

export const participant = z.object({
	name: z.string(),
	role: z.string().max(256).optional(),
});

export type Participant = z.infer<typeof participant>;

export const messageSequence = z.object({
	from: z.string(),
	to: z.string(),
	message: z.string(),
	payload: typeDefinition.optional(),
	guard: z.string().max(4096).optional(),
});

export type MessageSequence = z.infer<typeof messageSequence>;

export const interaction = z.object({
	type: z.literal("interaction"),
	participants: z.array(participant).min(1),
	messages: z.array(messageSequence).min(0),
});

export type Interaction = z.infer<typeof interaction>;

export function isInteraction(value: unknown): value is Interaction {
	return interaction.safeParse(value).success;
}

//==============================================================================
// Hybrid Schemas
//==============================================================================

// Use any for semantics components to avoid circular type issues
export const hybrid = z.object({
	type: z.literal("hybrid"),
	components: z.array(z.unknown()).min(2),
});

export type Hybrid = z.infer<typeof hybrid>;

export function isHybrid(value: unknown): value is Hybrid {
	return hybrid.safeParse(value).success;
}

//==============================================================================
// Semantics Union Schema
//==============================================================================

export const semantics = z.discriminatedUnion("type", [
	stateMachine,
	temporal,
	constraints,
	events,
	interaction,
	hybrid,
]);

export type Semantics = z.infer<typeof semantics>;

export function isSemantics(value: unknown): value is Semantics {
	return semantics.safeParse(value).success;
}

//==============================================================================
// Document Schemas
//==============================================================================

export const testCase = z.object({
	name: z.string(),
	description: z.string(),
	input: z.record(z.string(), z.unknown()),
	expected: z.record(z.string(), z.unknown()),
});

export type TestCase = z.infer<typeof testCase>;

export const documentation = z.object({
	overview: z.string().max(65536).optional(),
	examples: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type Documentation = z.infer<typeof documentation>;

export const bsifDocument = z.object({
	metadata: bsifMetadata,
	semantics: semantics,
	tools: z.record(z.string(), z.unknown()).optional(),
	tests: z.array(testCase).optional(),
	documentation: documentation.optional(),
});

export type BSIFDocument = z.infer<typeof bsifDocument>;

export function isBSIFDocument(value: unknown): value is BSIFDocument {
	return bsifDocument.safeParse(value).success;
}

//==============================================================================
// Type Guards for Semantic Types
//==============================================================================

export function semanticsType(value: unknown): "state-machine" | "temporal" | "constraints" | "events" | "interaction" | "hybrid" | null {
	if (isStateMachine(value)) return "state-machine";
	if (isTemporal(value)) return "temporal";
	if (isConstraints(value)) return "constraints";
	if (isEvents(value)) return "events";
	if (isInteraction(value)) return "interaction";
	if (isHybrid(value)) return "hybrid";
	return null;
}
