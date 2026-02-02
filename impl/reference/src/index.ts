// BSIF Reference Implementation - Main Exports

//==============================================================================
// Types (re-exported from schemas.ts)
//==============================================================================

export type {
	// Metadata
	BSIFMetadata as Metadata,
	// Timing
	TimingConstraint,
	// Expressions
	Expression,
	ExpressionAST,
	ExpressionLiteral,
	ExpressionVariable,
	ExpressionBinary,
	ExpressionUnary,
	ExpressionCall,
	ExpressionAccess,
	ExpressionSequence,
	// State Machine
	StateMachine,
	State,
	Transition,
	SyncPrimitive,
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
	TypeParameter,
	GenericRef,
	// Constraints
	Constraints,
	TargetReference,
	Constraint,
	ResourceConstraint,
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
	SecurityProperties,
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
	// Expression schemas and guards
	expression,
	expressionAST,
	expressionLiteral,
	expressionVariable,
	expressionBinary,
	expressionUnary,
	expressionCall,
	expressionAccess,
	expressionSequence,
	isExpression,
	isStringExpression,
	isASTExpression,
	// State machine
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
	syncPrimitive,
	typeParameter,
	genericRef,
	resourceConstraint,
	securityProperties,
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

export { parseFile, parseFileSync, parseFileString, parseContent, parseContentWithSourceMap, parseFileIncremental, suggestCorrection, buildSourceMap, resolveLocation, findPathOffset } from "./parser.js";
export type { ParseOptions, ParseLimits, IncrementalParseOptions, SourceMap } from "./parser.js";

export { parseExpression, tryParseExpression, isValidExpression } from "./parser/expression-parser.js";
export { ExpressionParser, ParseError } from "./parser/expression-parser.js";
export type { ParseError as ExpressionParseError } from "./parser/expression-parser.js";

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
export { convertExprCommand, printConvertExprHelp } from "./commands/convert-expr.js";
export type { ConvertExprOptions } from "./commands/convert-expr.js";

//==============================================================================
// Executors
//==============================================================================

export { createStateMachine } from "./executors/state-machine-executor.js";
export type { StateMachineInstance, TimingViolation } from "./executors/state-machine-executor.js";
export { checkTrace } from "./executors/ltl-checker.js";
export type { TraceStep, CheckResult } from "./executors/ltl-checker.js";
export { checkCTL, buildKripkeStructure } from "./executors/ctl-checker.js";
export type { CTLCheckResult, KripkeState, KripkeStructure } from "./executors/ctl-checker.js";
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

//==============================================================================
// Migrations
//==============================================================================

export { registerMigration, getMigrations, migrate } from "./migrations/registry.js";
export type { MigrationStep } from "./migrations/registry.js";
