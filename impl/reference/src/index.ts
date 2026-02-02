// BSIF Reference Implementation - Main Exports

//==============================================================================
// Types (re-exported from schemas.ts)
//==============================================================================

export type {
	// Metadata
	BSIFMetadata as Metadata,
	// State Machine
	StateMachine,
	State,
	Transition,
	// Temporal
	Temporal,
	VariableDeclarations,
	VariableType,
	ObjectType,
	Property,
	LTLFormula,
	LiteralValue,
	VariableRef,
	UnaryOperator,
	BinaryOperator,
	// Constraints
	Constraints,
	TargetReference,
	Constraint,
	// Events
	Events,
	TypeDefinition,
	PrimitiveType,
	EventDeclaration,
	Handler,
	// Interaction
	Interaction,
	Participant,
	MessageSequence,
	// Hybrid
	Hybrid,
	// Semantics Union
	Semantics,
	// Document
	BSIFDocument,
	// Tests/Docs
	TestCase,
	Documentation,
} from "./schemas.js";

//==============================================================================
// Errors
//==============================================================================

export { ErrorCode } from "./errors.js";
export type { ValidationError, ValidationResult } from "./errors.js";
export { createError, createSuccess, createFailure, formatError, formatErrors } from "./errors.js";

//==============================================================================
// Schemas and Type Guards
//==============================================================================

export {
	bsifMetadata,
	bsifDocument,
	state,
	stateMachine,
	temporal,
	constraints,
	events,
	interaction,
	hybrid,
	variableType,
	objectType,
	literalValue,
	variableRef,
	unaryOperator,
	binaryOperator,
	ltlFormula,
	primitiveType,
	typeDefinition,
} from "./schemas.js";

export {
	isBSIFMetadata,
	isState,
	isStateMachine,
	isTemporal,
	isConstraints,
	isEvents,
	isInteraction,
	isHybrid,
	isBSIFDocument,
	semanticsType,
} from "./schemas.js";

//==============================================================================
// Parser
//==============================================================================

export { parseFile, parseFileSync, parseFileString, parseContent } from "./parser.js";
export type { ParseOptions } from "./parser.js";

//==============================================================================
// Validator
//==============================================================================

export { validate, validateFile } from "./validator.js";
export type { ValidationOptions, ResourceLimits } from "./validator.js";

//==============================================================================
// CLI
//==============================================================================

export { main as cliMain } from "./cli.js";
