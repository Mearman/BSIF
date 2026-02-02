// BSIF Reference Implementation - Mapper Framework

import type { BSIFDocument } from "../schemas.js";
import type { BSIFMetadata } from "../schemas.js";

export interface Mapper<T> {
	readonly toolName: string;
	readonly supportedTypes: readonly string[];
	fromBSIF(doc: BSIFDocument): T;
	toBSIF(input: T, metadata?: Partial<BSIFMetadata>): BSIFDocument;
}
