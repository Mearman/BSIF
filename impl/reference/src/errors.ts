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
	VariableNotDefined = "E104",
	InvalidLTLFormula = "E105",
	EventNotFound = "E106",
	ParticipantNotFound = "E107",

	// Validation errors (E200-E299)
	ValidationFailed = "E200",
	SemanticError = "E201",
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
	}

	if (error.suggestion !== undefined) {
		result += `\n  suggestion: ${error.suggestion}`;
	}

	return result;
}

export function formatErrors(errors: readonly ValidationError[]): string {
	return errors.map(formatError).join("\n\n");
}
