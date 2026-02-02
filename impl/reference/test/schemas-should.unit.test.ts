// BSIF SHOULD-level Schema Tests
// Tests for all optional schema extensions added in SHOULD-level features

import { describe, it } from "node:test";
import assert from "node:assert";
import {
	bsifDocument,
	state,
	eventDeclaration,
	interaction,
	constraints,
	objectType,
	typeDefinition,
	syncPrimitive,
	securityProperties,
	resourceConstraint,
	typeParameter,
	genericRef,
	unaryOperator,
	binaryOperator,
} from "../src/schemas.js";

//==============================================================================
// Helper: minimal valid document shell
//==============================================================================

function wrapSemantics(semantics: unknown): unknown {
	return {
		metadata: { bsif_version: "1.0.0", name: "test-spec" },
		semantics,
	};
}

//==============================================================================
// Sync Primitives on State
//==============================================================================

describe("Schema SHOULD: Sync Primitives", () => {
	it("parses a state with sync primitives", () => {
		const result = state.safeParse({
			name: "locked",
			sync: [
				{ type: "mutex", name: "resource-lock" },
				{ type: "channel", name: "data-pipe", capacity: 10 },
			],
		});
		assert.strictEqual(result.success, true);
	});

	it("rejects sync primitive with empty name", () => {
		const result = syncPrimitive.safeParse({ type: "mutex", name: "" });
		assert.strictEqual(result.success, false);
	});

	it("rejects sync primitive with invalid type", () => {
		const result = syncPrimitive.safeParse({ type: "spinlock", name: "x" });
		assert.strictEqual(result.success, false);
	});

	it("rejects sync primitive with non-positive capacity", () => {
		const result = syncPrimitive.safeParse({ type: "channel", name: "ch", capacity: 0 });
		assert.strictEqual(result.success, false);
	});

	it("state without sync still parses (backward compat)", () => {
		const result = state.safeParse({ name: "idle" });
		assert.strictEqual(result.success, true);
	});
});

//==============================================================================
// Event Correlation Key
//==============================================================================

describe("Schema SHOULD: Event Correlation", () => {
	it("parses event declaration with correlationKey", () => {
		const result = eventDeclaration.safeParse({
			payload: "string",
			correlationKey: "orderId",
		});
		assert.strictEqual(result.success, true);
	});

	it("rejects correlationKey exceeding 256 chars", () => {
		const result = eventDeclaration.safeParse({
			correlationKey: "x".repeat(257),
		});
		assert.strictEqual(result.success, false);
	});

	it("event declaration without correlationKey still parses", () => {
		const result = eventDeclaration.safeParse({ payload: "boolean" });
		assert.strictEqual(result.success, true);
	});
});

//==============================================================================
// Security Properties on Interaction
//==============================================================================

describe("Schema SHOULD: Interaction Security", () => {
	it("parses interaction with security properties", () => {
		const result = interaction.safeParse({
			type: "interaction",
			participants: [{ name: "client" }, { name: "server" }],
			messages: [],
			security: {
				authentication: "mutual-tls",
				authorization: { roles: ["admin", "user"] },
				confidentiality: "encrypted",
			},
		});
		assert.strictEqual(result.success, true);
	});

	it("rejects invalid authentication value", () => {
		const result = securityProperties.safeParse({
			authentication: "basic-auth",
		});
		assert.strictEqual(result.success, false);
	});

	it("rejects invalid confidentiality value", () => {
		const result = securityProperties.safeParse({
			confidentiality: "cleartext",
		});
		assert.strictEqual(result.success, false);
	});

	it("interaction without security still parses", () => {
		const result = interaction.safeParse({
			type: "interaction",
			participants: [{ name: "a" }],
			messages: [],
		});
		assert.strictEqual(result.success, true);
	});
});

//==============================================================================
// Resource Constraints
//==============================================================================

describe("Schema SHOULD: Resource Constraints", () => {
	it("parses constraints with resources", () => {
		const result = constraints.safeParse({
			type: "constraints",
			target: { module: "my-mod" },
			preconditions: [{ description: "pre", expression: "x > 0" }],
			postconditions: [],
			resources: {
				cpu: { max: 80, unit: "percent" },
				memory: { max: 512, unit: "mb" },
			},
		});
		assert.strictEqual(result.success, true);
	});

	it("rejects negative resource values", () => {
		const result = resourceConstraint.safeParse({
			cpu: { max: -1, unit: "percent" },
		});
		assert.strictEqual(result.success, false);
	});

	it("rejects invalid memory unit", () => {
		const result = resourceConstraint.safeParse({
			memory: { max: 100, unit: "tb" },
		});
		assert.strictEqual(result.success, false);
	});

	it("constraints without resources still parses", () => {
		const result = constraints.safeParse({
			type: "constraints",
			target: { module: "m" },
			preconditions: [],
			postconditions: [],
		});
		assert.strictEqual(result.success, true);
	});
});

//==============================================================================
// Type Parameters + Generic References
//==============================================================================

describe("Schema SHOULD: Type Parameters and Generics", () => {
	it("parses object type with typeParameters", () => {
		const result = objectType.safeParse({
			type: "object",
			properties: { value: "string" },
			typeParameters: [
				{ name: "T", constraint: "any" },
				{ name: "U", default: "string" },
			],
		});
		assert.strictEqual(result.success, true);
	});

	it("rejects typeParameter with empty name", () => {
		const result = typeParameter.safeParse({ name: "" });
		assert.strictEqual(result.success, false);
	});

	it("parses genericRef type definition", () => {
		const result = genericRef.safeParse({
			type: "generic",
			name: "List",
			typeArguments: ["string"],
		});
		assert.strictEqual(result.success, true);
	});

	it("genericRef is accepted in typeDefinition union", () => {
		const result = typeDefinition.safeParse({
			type: "generic",
			name: "Map",
			typeArguments: ["string", "integer"],
		});
		assert.strictEqual(result.success, true);
	});

	it("object type without typeParameters still parses", () => {
		const result = objectType.safeParse({
			type: "object",
			properties: { x: "boolean" },
		});
		assert.strictEqual(result.success, true);
	});
});

//==============================================================================
// CTL Operators
//==============================================================================

describe("Schema SHOULD: CTL Operators", () => {
	const ctlUnary = [
		"forall-next", "exists-next",
		"forall-globally", "exists-globally",
		"forall-finally", "exists-finally",
	];
	const ctlBinary = ["forall-until", "exists-until"];

	for (const op of ctlUnary) {
		it(`accepts CTL unary operator "${op}"`, () => {
			const result = unaryOperator.safeParse(op);
			assert.strictEqual(result.success, true);
		});
	}

	for (const op of ctlBinary) {
		it(`accepts CTL binary operator "${op}"`, () => {
			const result = binaryOperator.safeParse(op);
			assert.strictEqual(result.success, true);
		});
	}

	it("full document with CTL formula parses", () => {
		const doc = wrapSemantics({
			type: "temporal",
			logic: "ctl",
			variables: { safe: "boolean" },
			properties: [
				{
					name: "ag-safe",
					formula: {
						operator: "forall-globally",
						operand: { operator: "variable", variable: "safe" },
					},
				},
			],
		});
		const result = bsifDocument.safeParse(doc);
		assert.strictEqual(result.success, true);
	});

	it("document with EU binary CTL formula parses", () => {
		const doc = wrapSemantics({
			type: "temporal",
			logic: "ctl",
			variables: { p: "boolean", q: "boolean" },
			properties: [
				{
					name: "eu-prop",
					formula: {
						operator: "exists-until",
						operands: [
							{ operator: "variable", variable: "p" },
							{ operator: "variable", variable: "q" },
						],
					},
				},
			],
		});
		const result = bsifDocument.safeParse(doc);
		assert.strictEqual(result.success, true);
	});
});

//==============================================================================
// Backward Compatibility
//==============================================================================

describe("Schema SHOULD: Backward Compatibility", () => {
	it("existing minimal state machine document still parses", () => {
		const doc = wrapSemantics({
			type: "state-machine",
			states: [{ name: "idle" }, { name: "running" }],
			transitions: [{ from: "idle", to: "running", event: "start" }],
			initial: "idle",
		});
		const result = bsifDocument.safeParse(doc);
		assert.strictEqual(result.success, true);
	});

	it("existing temporal document still parses", () => {
		const doc = wrapSemantics({
			type: "temporal",
			logic: "ltl",
			variables: { x: "boolean" },
			properties: [
				{
					name: "p1",
					formula: { operator: "globally", operand: { operator: "variable", variable: "x" } },
				},
			],
		});
		const result = bsifDocument.safeParse(doc);
		assert.strictEqual(result.success, true);
	});

	it("existing events document still parses", () => {
		const doc = wrapSemantics({
			type: "events",
			events: { click: { payload: "string" } },
			handlers: [{ event: "click" }],
		});
		const result = bsifDocument.safeParse(doc);
		assert.strictEqual(result.success, true);
	});
});
