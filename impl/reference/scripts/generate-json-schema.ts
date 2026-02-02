#!/usr/bin/env tsx
/**
 * Generate JSON Schema from Zod schemas
 *
 * This script converts the TypeScript Zod schemas to a standalone JSON Schema
 * that can be used by non-TypeScript tools for validation.
 *
 * Uses Zod v4's native toJSONSchema() method.
 *
 * Usage: npx tsx scripts/generate-json-schema.ts
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z, toJSONSchema } from "zod";

// Import schemas
import {
	bsifDocument,
	bsifMetadata,
	stateMachine,
	state,
	transition,
	temporal,
	property,
	ltlFormula,
	constraints,
	constraint,
	events,
	eventDeclaration,
	handler,
	interaction,
	participant,
	messageSequence,
	hybrid,
	testCase,
	documentation,
	// SHOULD-level features
	syncPrimitive,
	typeParameter,
	resourceConstraint,
	securityProperties,
} from "../src/schemas.js";

/**
 * Convert a Zod schema to JSON Schema definition
 */
function toDef(zodSchema: z.ZodTypeAny): Record<string, unknown> {
	const jsonSchema = zodSchema.toJSONSchema();
	// Remove $schema from individual definitions to avoid duplication
	delete (jsonSchema as Record<string, unknown>).$schema;
	return jsonSchema as Record<string, unknown>;
}

/**
 * Main generation function
 */
async function generateJsonSchema(): Promise<void> {
	// Build the definitions object using Zod's native toJSONSchema
	const $defs: Record<string, unknown> = {
		metadata: toDef(bsifMetadata),
		stateMachine: toDef(stateMachine),
		state: toDef(state),
		transition: toDef(transition),
		temporal: toDef(temporal),
		property: toDef(property),
		ltlFormula: toDef(ltlFormula),
		constraints: toDef(constraints),
		constraint: toDef(constraint),
		events: toDef(events),
		eventDeclaration: toDef(eventDeclaration),
		handler: toDef(handler),
		interaction: toDef(interaction),
		participant: toDef(participant),
		messageSequence: toDef(messageSequence),
		hybrid: toDef(hybrid),
		testCase: toDef(testCase),
		documentation: toDef(documentation),
		// SHOULD-level features
		syncPrimitive: toDef(syncPrimitive),
		typeParameter: toDef(typeParameter),
		resourceConstraint: toDef(resourceConstraint),
		securityProperties: toDef(securityProperties),
	};

	// Get the main document schema structure
	const mainSchema = bsifDocument.toJSONSchema();

	// Build the complete JSON Schema with proper structure
	const jsonSchema: Record<string, unknown> = {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: "https://bsif-spec.io/schemas/bsif.json",
		title: "BSIF Behavioral Specification",
		description: "Behavioral Specification Interchange Format (BSIF) schema for defining language-agnostic program behavior specifications. Includes all MUST and SHOULD level features from BSIF v1.0.0.",
		type: "object",
		required: ["metadata", "semantics"],
		properties: {
			metadata: { $ref: "#/$defs/metadata" },
			semantics: {
				description: "Semantics section - one of the behavioral specification types",
				oneOf: [
					{ $ref: "#/$defs/stateMachine" },
					{ $ref: "#/$defs/temporal" },
					{ $ref: "#/$defs/constraints" },
					{ $ref: "#/$defs/events" },
					{ $ref: "#/$defs/interaction" },
					{ $ref: "#/$defs/hybrid" },
				],
			},
			tools: (mainSchema as Record<string, unknown>).properties?.tools,
			tests: { $ref: "#/$defs/testCase" },
			documentation: { $ref: "#/$defs/documentation" },
		},
		$defs,
	};

	// Write to file
	const outputPath = join(import.meta.dirname, "..", "..", "..", "docs", "schemas", "bsif.json");
	await writeFile(outputPath, JSON.stringify(jsonSchema, null, 2), "utf-8");

	console.log(`JSON Schema generated: ${outputPath}`);
	console.log(`Schema includes all MUST and SHOULD level features from BSIF v1.0.0.`);
	console.log(`Definitions:`, Object.keys($defs).length);
}

// Run generation
generateJsonSchema().catch((err) => {
	console.error("Failed to generate JSON schema:", err);
	process.exit(1);
});
