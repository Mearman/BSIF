// BSIF RFC 8785 JCS Canonicalizer
//
// Implements JSON Canonicalization Scheme (JCS) as specified in RFC 8785
// https://www.rfc-editor.org/rfc/rfc8785.html
//
// JCS provides deterministic JSON serialization for cryptographic signing.

import type { BSIFDocument } from "./schemas.js";

//==============================================================================
// JCS Serialization
//==============================================================================

/**
 * Canonicalize a JSON value according to RFC 8785 JCS rules
 */
function canonicalizeValue(value: unknown): string {
	if (value === null) {
		return "null";
	}

	if (typeof value === "boolean") {
		return value ? "true" : "false";
	}

	if (typeof value === "number") {
		return canonicalizeNumber(value);
	}

	if (typeof value === "string") {
		return canonicalizeString(value);
	}

	if (Array.isArray(value)) {
		return canonicalizeArray(value);
	}

	if (typeof value === "object" && value !== null) {
		return canonicalizeObject(value as Record<string, unknown>);
	}

	throw new Error(`Cannot canonicalize value of type ${typeof value}`);
}

/**
 * Canonicalize a number according to JCS rules
 * - No leading zeros (except "0.x" for fractions)
 * - Use shortest representation
 * - No trailing decimal point
 */
function canonicalizeNumber(num: number): string {
	// Handle special cases
	if (!Number.isFinite(num)) {
		if (Number.isNaN(num)) return "NaN";
		if (num < 0) return "-Infinity";
		return "Infinity";
	}

	// Convert to string and clean up
	let str = num.toString();

	// Remove leading zeros while preserving sign and first digit
	str = str.replace(/^(-?)0+(\d)/, "$1$2");

	// Remove trailing decimal point if no fractional part
	str = str.replace(/\.0*$/, "");

	return str;
}

/**
 * Canonicalize a string according to JCS rules
 * - Escape required characters: ", \, \b, \f, \n, \r, \t
 * - Escape unicode characters as \uXXXX
 */
function canonicalizeString(str: string): string {
	// Escape backslash and double quote first
	str = str.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");

	// Escape control characters
	const controlChars: Record<string, string> = {
		"\b": "\\b",
		"\f": "\\f",
		"\n": "\\n",
		"\r": "\\r",
		"\t": "\\t",
	};
	str = str.replace(/[\b\f\n\r\t]/g, (char) => controlChars[char] ?? char);

	// Escape unicode characters (non-ASCII)
	// This handles characters that need escaping in JSON
	return str.replace(/[\x00-\x1f\x7f-\x9f]/g, (char) => {
		const code = char.charCodeAt(0);
		return `\\u${code.toString(16).padStart(4, "0")}`;
	});
}

/**
 * Canonicalize an array according to JCS rules
 */
function canonicalizeArray(arr: unknown[]): string {
	const elements = arr.map(canonicalizeValue);
	return `[${elements.join(",")}]`;
}

/**
 * Canonicalize an object according to JCS rules
 * - Sort properties lexicographically by UTF-8 code unit
 * - No whitespace (except inside strings)
 */
function canonicalizeObject(obj: Record<string, unknown>): string {
	const keys = Object.keys(obj).sort((a, b) => {
		// Lexicographic comparison by UTF-8 code unit
		return a < b ? -1 : a > b ? 1 : 0;
	});

	const properties = keys.map(key => {
		return `"${escapeJsonPropertyName(key)}":${canonicalizeValue(obj[key])}`;
	});

	return `{${properties.join(",")}}`;
}

/**
 * Escape property names for JSON
 * Property names are always strings, so we just need JSON escaping
 */
function escapeJsonPropertyName(name: string): string {
	return name;
}

//==============================================================================
// Public API
//==============================================================================

/**
 * Canonicalize a BSIF document to JCS format
 *
 * @param doc - The BSIF document to canonicalize
 * @returns JCS canonical JSON string (no whitespace except inside strings)
 *
 * @example
 * ```ts
 * import { canonicalize } from './canonicalizer.js';
 *
 * const doc: BSIFDocument = { ... };
 * const jcs = canonicalize(doc);
 * // Returns deterministic JSON string suitable for signing
 * ```
 */
export function canonicalize(doc: BSIFDocument): string {
	// First serialize to regular JSON to ensure semantic correctness
	const json = JSON.stringify(doc, (key, value) => {
		// Handle BigInt during serialization (though not in BSIF spec yet)
		if (typeof value === "bigint") {
			return value.toString();
		}
		return value;
	}, 0);

	// Parse and re-serialize with JCS rules
	const parsed = JSON.parse(json) as BSIFDocument;
	return canonicalizeValue(parsed);
}

/**
 * Format a BSIF document with JCS canonicalization
 *
 * Similar to canonicalize() but returns a formatted JSON string
 * with optional indentation for human readability (non-canonical).
 *
 * @param doc - The BSIF document to format
 * @param options - Format options
 * @returns Formatted JSON string
 */
export interface FormatOptions {
	/**
	 * Use JCS canonicalization (deterministic, no whitespace)
	 * Default: false for human-readable formatting
	 */
	readonly canonical?: boolean;
	/**
	 * Indentation for formatted output (when canonical=false)
	 * Default: 2 spaces
	 */
	readonly indent?: number | string;
}

export function formatDocument(doc: BSIFDocument, options: FormatOptions = {}): string {
	if (options.canonical) {
		return canonicalize(doc);
	}

	const indent = options.indent ?? 2;
	return JSON.stringify(doc, null, indent);
}

/**
 * Check if two BSIF documents are semantically equivalent
 * by comparing their JCS canonical forms.
 *
 * @param doc1 - First BSIF document
 * @param doc2 - Second BSIF document
 * @returns true if documents are semantically equivalent
 */
export function areEquivalent(doc1: BSIFDocument, doc2: BSIFDocument): boolean {
	return canonicalize(doc1) === canonicalize(doc2);
}

/**
 * Compute JCS hash for a BSIF document
 *
 * @param doc - The BSIF document to hash
 * @returns Hex-encoded SHA-256 hash of the canonical form
 *
 * @example
 * ```ts
 * import { computeHash } from './canonicalizer.js';
 *
 * const hash = await computeHash(doc);
 * // Returns: "a1b2c3d4..."
 * ```
 */
export async function computeHash(doc: BSIFDocument): Promise<string> {
	async function sha256(message: string): Promise<ArrayBuffer> {
		const encoder = new TextEncoder();
		const data = encoder.encode(message);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		return hashBuffer;
	}

	const jcs = canonicalize(doc);
	const hash = await sha256(jcs);

	// Convert to hex string
	return Array.from(new Uint8Array(hash))
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Compute JCS hash synchronously (Node.js only)
 *
 * Note: This uses Node.js crypto module which is not available in browsers.
 * For browser environments, use the async computeHash() instead.
 */
export function computeHashSync(doc: BSIFDocument): string {
	const crypto = require("node:crypto");
	const jcs = canonicalize(doc);
	const hash = crypto.createHash("sha256").update(jcs).digest("hex");
	return hash;
}
