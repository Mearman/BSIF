// BSIF Reference Implementation - Parser
// Parses JSON and YAML BSIF documents into typed objects

import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { parse as yamlParse } from "yaml";
import type { BSIFDocument } from "./schemas.js";
import { ErrorCode, createError, type ValidationResult, type ValidationError } from "./errors.js";
import { bsifDocument } from "./schemas.js";

//==============================================================================
// Parse Options
//==============================================================================

export interface ParseOptions {
	readonly encoding?: BufferEncoding;
	readonly allowUnknownSemantics?: boolean;
}

const defaultOptions: ParseOptions = {
	encoding: "utf-8",
	allowUnknownSemantics: false,
};

//==============================================================================
// File Detection
//==============================================================================

export function getFileType(path: string): "json" | "yaml" | "unknown" {
	if (path.endsWith(".json")) return "json";
	if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
	return "unknown";
}

//==============================================================================
// Parse Functions
//==============================================================================

export async function parseFile(
	path: string,
	options: ParseOptions = defaultOptions,
): Promise<BSIFDocument> {
	const { encoding = "utf-8" } = options;

	const content = await readFile(path, { encoding });

	return parseContent(content, path);
}

export function parseFileSync(
	path: string,
	options: ParseOptions = defaultOptions,
): BSIFDocument {
	const { encoding = "utf-8" } = options;
	const content = readFileSync(path, { encoding });

	return parseContent(content, path);
}

export function parseFileString(
	path: string,
	content: string,
): BSIFDocument {
	return parseContent(content, path);
}

export function parseContent(content: string, path = "<unknown>"): BSIFDocument {
	const fileType = getFileType(path);

	let parsed: unknown;

	switch (fileType) {
	case "json":
		parsed = parseJson(content);
		break;
	case "yaml":
		parsed = parseYamlContent(content);
		break;
	default:
		throw createError(
			ErrorCode.InvalidSyntax,
			`Unsupported file type: ${path}. Supported: .json, .yaml, .yml`,
			{ suggestion: "Rename file to .json or .yaml" },
		);
	}

	return validateAndParse(parsed);
}

function parseJson(content: string): unknown {
	try {
		return JSON.parse(content);
	} catch {
		throw createError(
			ErrorCode.InvalidJson,
			"Invalid JSON: malformed JSON structure",
		);
	}
}

function parseYamlContent(content: string): unknown {
	try {
		return yamlParse(content);
	} catch {
		throw createError(
			ErrorCode.InvalidYaml,
			"Invalid YAML: malformed YAML structure",
		);
	}
}

function validateAndParse(parsed: unknown): BSIFDocument {
	// Validate using Zod schema
	const result = bsifDocument.safeParse(parsed);

	if (!result.success) {
		const firstError = result.error.issues[0];
		if (firstError === undefined) {
			throw createError(
				ErrorCode.InvalidFieldValue,
				"Schema validation failed: unknown error",
			);
		}
		throw createError(
			ErrorCode.InvalidFieldValue,
			`Schema validation failed: ${firstError.message}`,
			{
				path: firstError.path.map(String),
				suggestion: "Ensure document follows BSIF specification v1.0.0",
			},
		);
	}

	return result.data;
}

//==============================================================================
// Parse with Validation Result
//==============================================================================

export async function parseFileWithValidation(
	path: string,
	options: ParseOptions = defaultOptions,
): Promise<ValidationResult> {
	try {
		await parseFile(path, options);
		return {
			valid: true,
			errors: [],
		};
	} catch (error) {
		if (isValidationError(error)) {
			return {
				valid: false,
				errors: [error],
			};
		}
		return {
			valid: false,
			errors: [
				createError(
					ErrorCode.ValidationFailed,
					error instanceof Error ? error.message : String(error),
				),
			],
		};
	}
}

//==============================================================================
// Source Map (Line/Column Tracking)
//==============================================================================

export interface SourceMap {
	readonly lineOffsets: readonly number[];
	readonly rawText: string;
}

export function buildSourceMap(text: string): SourceMap {
	const lineOffsets: number[] = [0];
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "\n") {
			lineOffsets.push(i + 1);
		}
	}
	return { lineOffsets, rawText: text };
}

export function resolveLocation(sourceMap: SourceMap, charOffset: number): { line: number; column: number } {
	// Binary search for the line
	let low = 0;
	let high = sourceMap.lineOffsets.length - 1;
	while (low < high) {
		const mid = Math.ceil((low + high) / 2);
		if (sourceMap.lineOffsets[mid]! <= charOffset) {
			low = mid;
		} else {
			high = mid - 1;
		}
	}
	return {
		line: low + 1,
		column: charOffset - sourceMap.lineOffsets[low]! + 1,
	};
}

export function findPathOffset(sourceMap: SourceMap, path: readonly string[]): number | undefined {
	const text = sourceMap.rawText;
	let searchStart = 0;

	for (const segment of path) {
		// Search for the key in JSON (look for "key":)
		const keyPattern = `"${segment}"`;
		const idx = text.indexOf(keyPattern, searchStart);
		if (idx === -1) return undefined;
		searchStart = idx;
	}

	return searchStart;
}

export function parseContentWithSourceMap(content: string, path = "<unknown>"): { document: BSIFDocument; sourceMap: SourceMap } {
	const document = parseContent(content, path);
	const sourceMap = buildSourceMap(content);
	return { document, sourceMap };
}

function isValidationError(error: unknown): error is ValidationError {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		"severity" in error &&
		"message" in error
	);
}
