// BSIF Reference Implementation - Main Exports

//==============================================================================
// Types (re-exported from schemas.ts)
//==============================================================================

export type {
	// Metadata
	BSIFMetadata as Metadata,
	// Timing
	TimingConstraint,
	// State Machine
	StateMachine,
	State,
	Transition,
	// Temporal
	Temporal,
	VariableDeclarations,
	VariableType,
	ObjectType,
	ArrayType,
	EnumType,
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
	timingConstraint,
	state,
	stateMachine,
	temporal,
	constraints,
	events,
	interaction,
	hybrid,
	variableType,
	objectType,
	arrayType,
	enumType,
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
	isTransition,
	isStateMachine,
	isTemporal,
	isConstraint,
	isConstraints,
	isHandler,
	isEvents,
	isParticipant,
	isMessage,
	isInteraction,
	isHybrid,
	isBSIFDocument,
	isArrayType,
	isEnumType,
	semanticsType,
} from "./schemas.js";

//==============================================================================
// Parser
//==============================================================================

export { parseFile, parseFileSync, parseFileString, parseContent, parseContentWithSourceMap, buildSourceMap, resolveLocation, findPathOffset } from "./parser.js";
export type { ParseOptions, ParseLimits, SourceMap } from "./parser.js";

//==============================================================================
// Validator
//==============================================================================

export { validate, validateFile } from "./validator.js";
export type { ValidationOptions, ResourceLimits } from "./validator.js";

//==============================================================================
// Resolver
//==============================================================================

export { resolveReferences, validateComposition } from "./resolver.js";
export type { ResolveOptions, ResolvedDocument } from "./resolver.js";

//==============================================================================
// Linter
//==============================================================================

export { lint } from "./linter.js";
export type { LintOptions } from "./linter.js";

//==============================================================================
// Generators
//==============================================================================

export { generateTests } from "./generators/test-generator.js";
export type { GenerateOptions, GeneratedTestSuite, TestGenerator } from "./generators/test-generator.js";

//==============================================================================
// CLI
//==============================================================================

export { main as cliMain } from "./cli.js";

//==============================================================================
// Executors
//==============================================================================

export { createStateMachine } from "./executors/state-machine-executor.js";
export type { StateMachineInstance } from "./executors/state-machine-executor.js";
export { checkTrace } from "./executors/ltl-checker.js";
export type { TraceStep, CheckResult } from "./executors/ltl-checker.js";
export { generateMonitor } from "./generators/monitor-generator.js";
export type { GeneratedMonitor } from "./generators/monitor-generator.js";

//==============================================================================
// Mappers
//==============================================================================

export { TLAPlusMapper } from "./mappers/tlaplus.js";
export { SCXMLMapper } from "./mappers/scxml.js";
export { SMTLIBMapper } from "./mappers/smtlib.js";
export type { Mapper } from "./mappers/mapper.js";

//==============================================================================
// Registry
//==============================================================================

export { HttpRegistryClient } from "./registry/client.js";
export type { RegistryClient } from "./registry/client.js";
export { RegistryServer } from "./registry/server.js";
export type { RegistryServerOptions } from "./registry/server.js";
export { FileStorage } from "./registry/storage.js";
export type { RegistryEntry, RegistrySearchResult } from "./registry/types.js";
