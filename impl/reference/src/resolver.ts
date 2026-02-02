// BSIF Reference Implementation - Reference Resolver
// Resolves metadata.references and detects circular dependencies

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import type { BSIFDocument } from "./schemas.js";
import { parseContent } from "./parser.js";
import { ErrorCode, createError, type ValidationError } from "./errors.js";

//==============================================================================
// Types
//==============================================================================

export interface ResolveOptions {
	readonly basePath?: string;
	readonly maxDepth?: number;
	readonly fileReader?: (path: string) => Promise<string>;
	readonly registryUrl?: string;
}

export interface ResolvedDocument {
	readonly document: BSIFDocument;
	readonly references: ReadonlyMap<string, ResolvedDocument>;
	readonly resolutionPath: readonly string[];
}

//==============================================================================
// Resolver
//==============================================================================

const DEFAULT_MAX_DEPTH = 32;

export async function resolveReferences(
	doc: BSIFDocument,
	options?: ResolveOptions,
): Promise<ResolvedDocument> {
	const basePath = options?.basePath ?? process.cwd();
	const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
	const fileReader = options?.fileReader ?? ((path: string) => readFile(path, "utf-8"));
	const registryUrl = options?.registryUrl;

	return resolveDocument(doc, basePath, maxDepth, fileReader, registryUrl, new Set(), [doc.metadata.name]);
}

async function resolveDocument(
	doc: BSIFDocument,
	basePath: string,
	maxDepth: number,
	fileReader: (path: string) => Promise<string>,
	registryUrl: string | undefined,
	visited: Set<string>,
	resolutionPath: readonly string[],
): Promise<ResolvedDocument> {
	const references = new Map<string, ResolvedDocument>();

	if (!doc.metadata.references || doc.metadata.references.length === 0) {
		return { document: doc, references, resolutionPath };
	}

	if (resolutionPath.length > maxDepth) {
		return { document: doc, references, resolutionPath };
	}

	visited.add(doc.metadata.name);

	for (const ref of doc.metadata.references) {
		// Try bsif:// protocol via registry
		const bsifRef = parseBsifUri(ref);
		if (bsifRef && registryUrl) {
			try {
				const url = bsifRef.version
					? `${registryUrl}/specs/${encodeURIComponent(bsifRef.name)}/${encodeURIComponent(bsifRef.version)}`
					: `${registryUrl}/specs/${encodeURIComponent(bsifRef.name)}`;
				const response = await fetch(url);
				if (response.ok) {
					const content = await response.text();
					const refDoc = parseContent(content, ref);

					if (visited.has(refDoc.metadata.name)) {
						references.set(refDoc.metadata.name, {
							document: refDoc,
							references: new Map(),
							resolutionPath: [...resolutionPath, refDoc.metadata.name],
						});
						continue;
					}

					const resolved = await resolveDocument(
						refDoc, basePath, maxDepth, fileReader, registryUrl,
						new Set(visited), [...resolutionPath, refDoc.metadata.name],
					);
					references.set(refDoc.metadata.name, resolved);
					continue;
				}
			} catch {
				// Fall through to local resolution
			}
		}

		const refPath = resolveRefPath(ref, basePath);
		if (!refPath) continue;

		try {
			const content = await fileReader(refPath);
			const refDoc = parseContent(content, refPath);

			if (visited.has(refDoc.metadata.name)) {
				// Circular reference detected — skip but don't recurse
				references.set(refDoc.metadata.name, {
					document: refDoc,
					references: new Map(),
					resolutionPath: [...resolutionPath, refDoc.metadata.name],
				});
				continue;
			}

			const resolved = await resolveDocument(
				refDoc,
				dirname(refPath),
				maxDepth,
				fileReader,
				registryUrl,
				new Set(visited),
				[...resolutionPath, refDoc.metadata.name],
			);
			references.set(refDoc.metadata.name, resolved);
		} catch {
			// Reference couldn't be loaded — will be caught by composition validation
		}
	}

	return { document: doc, references, resolutionPath };
}

function resolveRefPath(ref: string, basePath: string): string | null {
	// Handle file:// URIs
	if (ref.startsWith("file://")) {
		const filePath = ref.slice(7);
		return resolve(basePath, filePath);
	}

	// Handle relative paths
	if (ref.startsWith("./") || ref.startsWith("../")) {
		return resolve(basePath, ref);
	}

	// Handle absolute paths
	if (ref.startsWith("/")) {
		return ref;
	}

	// Other URIs (http://, bsif://) — not resolvable locally
	return null;
}

function parseBsifUri(ref: string): { name: string; version?: string } | null {
	if (!ref.startsWith("bsif://")) return null;
	const path = ref.slice(7);
	const atIndex = path.indexOf("@");
	if (atIndex === -1) {
		return { name: path };
	}
	return { name: path.slice(0, atIndex), version: path.slice(atIndex + 1) };
}

//==============================================================================
// Composition Validation
//==============================================================================

export function validateComposition(
	resolved: ResolvedDocument,
	rootVersion: string,
): readonly ValidationError[] {
	const errors: ValidationError[] = [];

	// Check for circular references
	const circularPath = detectCircularComposition(resolved, new Set());
	if (circularPath) {
		errors.push(
			createError(
				ErrorCode.CircularCompositionReference,
				`Circular composition reference detected: ${circularPath.join(" -> ")}`,
				{ path: ["metadata", "references"] },
			),
		);
	}

	// Check version compatibility and namespace conflicts
	const allNames = new Map<string, string>();
	allNames.set(resolved.document.metadata.name, "root");

	for (const [name, ref] of resolved.references) {
		// Version compatibility
		const refVersion = ref.document.metadata.bsif_version;
		const rootMajorMinor = rootVersion.split(".").slice(0, 2).join(".");
		const refMajorMinor = refVersion.split(".").slice(0, 2).join(".");
		if (rootMajorMinor !== refMajorMinor) {
			errors.push(
				createError(
					ErrorCode.ReferenceVersionMismatch,
					`Referenced spec "${name}" has BSIF version "${refVersion}" incompatible with root version "${rootVersion}"`,
					{ path: ["metadata", "references"], severity: "warning" },
				),
			);
		}

		// Namespace conflicts
		if (allNames.has(name) && allNames.get(name) !== "root") {
			errors.push(
				createError(
					ErrorCode.CompositionNamespaceConflict,
					`Name "${name}" conflicts across composed specifications`,
					{ path: ["metadata", "references"] },
				),
			);
		}
		allNames.set(name, ref.document.metadata.name);

		// Recurse into nested references
		errors.push(...validateComposition(ref, rootVersion));
	}

	return errors;
}

function detectCircularComposition(
	resolved: ResolvedDocument,
	visited: Set<string>,
): readonly string[] | null {
	const name = resolved.document.metadata.name;

	if (visited.has(name)) {
		return [...visited, name];
	}

	visited.add(name);

	for (const [, ref] of resolved.references) {
		const result = detectCircularComposition(ref, new Set(visited));
		if (result) return result;
	}

	return null;
}
