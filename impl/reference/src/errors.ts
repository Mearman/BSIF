// BSIF Reference Implementation - Error Types

//==============================================================================
// Error Codes
//==============================================================================

export const enum ErrorCode {
	// Parser errors (E001-E009)
	MissingMetadata = "E001",
	MissingSemantics = "E002",
	InvalidType = "E003",
	InvalidSyntax = "E004",
	InvalidJson = "E005",
	InvalidYaml = "E006",

	// Schema validation errors (E010-E099)
	MissingRequiredField = "E010",
	InvalidFieldValue = "E011",
	TypeMismatch = "E012",
	PatternMismatch = "E013",
	InvalidSemver = "E014",

	// Semantic validation errors (E100-E199)
	StateNotFound = "E100",
	InitialStateMissing = "E101",
	CircularStateReference = "E102",
	InvalidTransition = "E103",
	/** @deprecated Use UndefinedVariable (E109) instead */
	VariableNotDefined = "E104",
	/** @deprecated Use InvalidFormulaStructure (E122) instead */
	InvalidLTLFormula = "E105",
	/** @deprecated Use UndefinedEvent (E113) instead */
	EventNotFound = "E106",
	/** @deprecated Use UndefinedParticipant (E116) instead */
	ParticipantNotFound = "E107",
	DuplicateName = "E108",
	UndefinedVariable = "E109",
	IncompatibleTypes = "E110",
	InvalidExpression = "E111",
	InvalidTargetReference = "E112",
	UndefinedEvent = "E113",
	PayloadTypeMismatch = "E114",
	UnusedEventDeclaration = "E115",
	UndefinedParticipant = "E116",
	InvalidMessageSequence = "E117",
	InvalidComponentType = "E118",
	VersionMismatch = "E119",
	UnreachableState = "E120",
	DeadlockDetected = "E121",
	InvalidFormulaStructure = "E122",
	InvalidOldReference = "E123",
	NestingDepthExceeded = "E124",
	NamespaceConflict = "E125",
	ResourceLimitExceeded = "E126",
	ParallelStateNoChildren = "E127",
	InvalidTimingConstraint = "E128",
	DuplicateReference = "E129",
	CTLSemanticsUndefined = "E130",
	CTLOperatorAmbiguous = "E131",
	ParallelRegionTransition = "E132",
	NestedParallelState = "E133",
	EmptyToolMapping = "E134",
	DuplicateEnumValue = "E135",
	UndefinedTypeReference = "E136",
	InvalidCorrelationKey = "E137",
	InvalidSecurityProperty = "E138",
	InvalidResourceConstraint = "E139",

	// Composition errors (E140-E149)
	UnresolvableReference = "E140",
	CircularCompositionReference = "E141",
	ReferenceVersionMismatch = "E142",
	CompositionNamespaceConflict = "E143",

	InvalidTypeParameter = "E150",
	InvalidSyncPrimitive = "E151",
	DeprecatedUsage = "E152",
	OptimizationSuggestion = "E153",
	InvalidPeriodicTask = "E154",
	MigrationRequired = "E155",
	CustomRuleFailed = "E156",
	CTLCheckFailed = "E157",

	// Lint rules (E400-E409)
	LintMissingDescription = "E400",
	LintMissingVersion = "E401",
	LintNamingConvention = "E402",
	LintUnusedEvent = "E403",
	LintEmptyToolMapping = "E404",
	LintDeepNesting = "E405",
	LintNoFinalStates = "E406",
	LintRedundantGuard = "E407",
	LintSimplifiableFormula = "E408",
	LintUnreachableState = "E409",

	// Executor errors (E600-E609)
	InvalidEvent = "E600",
	InvalidGuard = "E601",
	ExecutorError = "E602",

	// Mapper errors (E700-E709)
	UnsupportedMapperType = "E700",
	MapperConversionError = "E701",

	// Registry errors (E800-E809)
	RegistryPublishFailed = "E800",
	RegistryFetchFailed = "E801",
	RegistryNotFound = "E802",
	RegistryValidationFailed = "E803",

	// General validation errors (E200-E299)
	ValidationFailed = "E200",
}

//==============================================================================
// Error Types
//==============================================================================

export interface ValidationError {
	readonly code: ErrorCode;
	readonly severity: "error" | "warning";
	readonly message: string;
	readonly path?: readonly string[];
	readonly line?: number;
	readonly column?: number;
	readonly file?: string;
	readonly suggestion?: string;
}

export interface ValidationResult {
	readonly valid: boolean;
	readonly errors: readonly ValidationError[];
}

//==============================================================================
// Error Creation Helpers
//==============================================================================

export function createError(
	code: ErrorCode,
	message: string,
	options?: {
		severity?: "error" | "warning";
		path?: readonly string[];
		line?: number;
		column?: number;
		file?: string;
		suggestion?: string;
	},
): ValidationError {
	return {
		code,
		severity: options?.severity ?? "error",
		message,
		...options,
	};
}

export function createSuccess(): ValidationResult {
	return { valid: true, errors: [] };
}

export function createFailure(errors: readonly ValidationError[]): ValidationResult {
	return { valid: false, errors };
}

//==============================================================================
// Error Formatting
//==============================================================================

export function formatError(error: ValidationError): string {
	let result = `${error.code}: ${error.message}`;

	if (error.path !== undefined && error.path.length > 0) {
		result += `\n  at ${error.path.join(".")}`;
	}

	if (error.line !== undefined) {
		result += `\n  line ${error.line}`;
		if (error.column !== undefined) {
			result += `, column ${error.column}`;
		}
		if (error.file !== undefined) {
			result += ` in ${error.file}`;
		}
	} else if (error.file !== undefined) {
		result += `\n  in ${error.file}`;
	}

	if (error.suggestion !== undefined) {
		result += `\n  suggestion: ${error.suggestion}`;
	}

	return result;
}

export function formatErrors(errors: readonly ValidationError[]): string {
	return errors.map(formatError).join("\n\n");
}
