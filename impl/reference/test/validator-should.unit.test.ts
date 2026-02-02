// BSIF Reference Implementation - Validator Should Tests (Phase 2)

import { describe, it } from "node:test";
import assert from "node:assert";
import { validate } from "../src/validator.js";
import type { CustomValidationRule } from "../src/validator.js";
import { ErrorCode, createError, type ValidationError } from "../src/errors.js";
import type { BSIFDocument } from "../src/schemas.js";

function makeStateMachineDoc(overrides: Record<string, unknown> = {}): BSIFDocument {
	return {
		metadata: { bsif_version: "1.0.0", name: "test-spec", version: "1.0.0", description: "Test" },
		semantics: {
			type: "state-machine",
			states: [{ name: "idle" }, { name: "active" }],
			transitions: [{ from: "idle", to: "active", event: "start" }],
			initial: "idle",
			final: ["active"],
			...overrides,
		},
	} as BSIFDocument;
}

function makeTemporalDoc(overrides: Record<string, unknown> = {}): BSIFDocument {
	return {
		metadata: { bsif_version: "1.0.0", name: "test-spec", version: "1.0.0", description: "Test" },
		semantics: {
			type: "temporal",
			logic: "ltl",
			variables: { p: "boolean", q: "boolean" },
			properties: [{
				name: "safety",
				formula: { operator: "globally", operand: { operator: "variable", variable: "p" } },
			}],
			...overrides,
		},
	} as BSIFDocument;
}

function makeEventsDoc(overrides: Record<string, unknown> = {}): BSIFDocument {
	return {
		metadata: { bsif_version: "1.0.0", name: "test-spec", version: "1.0.0", description: "Test" },
		semantics: {
			type: "events",
			events: {
				click: { payload: "string" },
			},
			handlers: [{ event: "click", action: "handle()" }],
			...overrides,
		},
	} as BSIFDocument;
}

function makeInteractionDoc(overrides: Record<string, unknown> = {}): BSIFDocument {
	return {
		metadata: { bsif_version: "1.0.0", name: "test-spec", version: "1.0.0", description: "Test" },
		semantics: {
			type: "interaction",
			participants: [{ name: "client" }, { name: "server" }],
			messages: [{ from: "client", to: "server", message: "request" }],
			...overrides,
		},
	} as BSIFDocument;
}

function makeConstraintsDoc(overrides: Record<string, unknown> = {}): BSIFDocument {
	return {
		metadata: { bsif_version: "1.0.0", name: "test-spec", version: "1.0.0", description: "Test" },
		semantics: {
			type: "constraints",
			target: { function: "push" },
			preconditions: [{ description: "valid", expression: "x > 0" }],
			postconditions: [{ description: "result", expression: "result == true" }],
			...overrides,
		},
	} as BSIFDocument;
}

function findErrors(result: { errors: readonly ValidationError[] }, code: ErrorCode): readonly ValidationError[] {
	return result.errors.filter((e) => e.code === code);
}

describe("Validator Phase 2", () => {
	// =========================================================================
	// 1a. Event correlation key validation
	// =========================================================================
	describe("event correlation key", () => {
		it("accepts valid correlationKey", () => {
			const doc = makeEventsDoc({
				events: {
					click: { payload: "string", correlationKey: "session-id" },
				},
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidCorrelationKey).length, 0);
		});

		it("rejects empty correlationKey", () => {
			const doc = makeEventsDoc({
				events: {
					click: { payload: "string", correlationKey: "  " },
				},
			});
			const result = validate(doc);
			assert.ok(findErrors(result, ErrorCode.InvalidCorrelationKey).length > 0);
		});
	});

	// =========================================================================
	// 1b. Security properties validation
	// =========================================================================
	describe("security properties", () => {
		it("accepts valid security config with roles and authentication", () => {
			const doc = makeInteractionDoc({
				security: {
					authentication: "token",
					authorization: { roles: ["admin"] },
				},
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidSecurityProperty).length, 0);
		});

		it("rejects roles with authentication none", () => {
			const doc = makeInteractionDoc({
				security: {
					authentication: "none",
					authorization: { roles: ["admin", "user"] },
				},
			});
			const result = validate(doc);
			assert.ok(findErrors(result, ErrorCode.InvalidSecurityProperty).length > 0);
		});

		it("accepts authentication none without roles", () => {
			const doc = makeInteractionDoc({
				security: {
					authentication: "none",
				},
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidSecurityProperty).length, 0);
		});

		it("accepts authentication none with empty roles array", () => {
			const doc = makeInteractionDoc({
				security: {
					authentication: "none",
					authorization: { roles: [] },
				},
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidSecurityProperty).length, 0);
		});
	});

	// =========================================================================
	// 1c. Resource constraints validation
	// =========================================================================
	describe("resource constraints", () => {
		it("accepts valid resource constraints with units", () => {
			const doc = makeConstraintsDoc({
				resources: {
					cpu: { max: 80, unit: "percent" },
					memory: { max: 512, unit: "mb" },
				},
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidResourceConstraint).length, 0);
		});

		it("warns on cpu.max without unit", () => {
			const doc = makeConstraintsDoc({
				resources: {
					cpu: { max: 80 },
				},
			});
			const result = validate(doc);
			const errs = findErrors(result, ErrorCode.InvalidResourceConstraint);
			assert.ok(errs.length > 0);
			assert.strictEqual(errs[0].severity, "warning");
		});

		it("warns on memory.max without unit", () => {
			const doc = makeConstraintsDoc({
				resources: {
					memory: { max: 1024 },
				},
			});
			const result = validate(doc);
			const errs = findErrors(result, ErrorCode.InvalidResourceConstraint);
			assert.ok(errs.length > 0);
		});

		it("accepts resource constraints with only io", () => {
			const doc = makeConstraintsDoc({
				resources: {
					io: { maxBytesPerSecond: 1000 },
				},
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidResourceConstraint).length, 0);
		});
	});

	// =========================================================================
	// 1d. Type parameters validation
	// =========================================================================
	describe("type parameters", () => {
		it("accepts unique type parameters", () => {
			const doc = makeTemporalDoc({
				variables: {
					container: {
						type: "object",
						properties: { value: "string" },
						typeParameters: [
							{ name: "T" },
							{ name: "U" },
						],
					},
				},
				properties: [{
					name: "test",
					formula: { operator: "literal", value: true },
				}],
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidTypeParameter).length, 0);
		});

		it("rejects duplicate type parameters", () => {
			const doc = makeTemporalDoc({
				variables: {
					container: {
						type: "object",
						properties: { value: "string" },
						typeParameters: [
							{ name: "T" },
							{ name: "T" },
						],
					},
				},
				properties: [{
					name: "test",
					formula: { operator: "literal", value: true },
				}],
			});
			const result = validate(doc);
			assert.ok(findErrors(result, ErrorCode.InvalidTypeParameter).length > 0);
		});
	});

	// =========================================================================
	// 1e. Sync primitives validation
	// =========================================================================
	describe("sync primitives", () => {
		it("accepts unique sync names with valid config", () => {
			const doc = makeStateMachineDoc({
				states: [
					{ name: "idle", sync: [{ type: "mutex", name: "lock1" }] },
					{ name: "active", sync: [{ type: "channel", name: "ch1", capacity: 10 }] },
				],
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidSyncPrimitive).length, 0);
		});

		it("rejects duplicate sync names across states", () => {
			const doc = makeStateMachineDoc({
				states: [
					{ name: "idle", sync: [{ type: "mutex", name: "lock1" }] },
					{ name: "active", sync: [{ type: "semaphore", name: "lock1" }] },
				],
			});
			const result = validate(doc);
			assert.ok(findErrors(result, ErrorCode.InvalidSyncPrimitive).length > 0);
		});

		it("rejects channel without capacity", () => {
			const doc = makeStateMachineDoc({
				states: [
					{ name: "idle", sync: [{ type: "channel", name: "ch1" }] },
					{ name: "active" },
				],
			});
			const result = validate(doc);
			const errs = findErrors(result, ErrorCode.InvalidSyncPrimitive);
			assert.ok(errs.length > 0);
			assert.ok(errs.some((e) => e.message.includes("capacity")));
		});

		it("accepts channel with capacity", () => {
			const doc = makeStateMachineDoc({
				states: [
					{ name: "idle", sync: [{ type: "channel", name: "ch1", capacity: 5 }] },
					{ name: "active" },
				],
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidSyncPrimitive).length, 0);
		});
	});

	// =========================================================================
	// 1f. Periodic task validation
	// =========================================================================
	describe("periodic tasks", () => {
		it("warns when period set without deadline or timeout", () => {
			const doc = makeStateMachineDoc({
				states: [
					{ name: "idle", timing: { period: 100, unit: "ms" } },
					{ name: "active" },
				],
			});
			const result = validate(doc);
			assert.ok(findErrors(result, ErrorCode.InvalidPeriodicTask).length > 0);
		});

		it("does not warn when period has deadline", () => {
			const doc = makeStateMachineDoc({
				states: [
					{ name: "idle", timing: { period: 100, unit: "ms", deadline: 50 } },
					{ name: "active" },
				],
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidPeriodicTask).length, 0);
		});

		it("does not warn when period has timeout", () => {
			const doc = makeStateMachineDoc({
				states: [
					{ name: "idle", timing: { period: 100, unit: "ms", timeout: 80 } },
					{ name: "active" },
				],
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.InvalidPeriodicTask).length, 0);
		});
	});

	// =========================================================================
	// 1g. Deprecation warnings
	// =========================================================================
	describe("deprecation warnings", () => {
		it("warns on bare globally operator under CTL", () => {
			const doc = makeTemporalDoc({
				logic: "ctl",
				properties: [{
					name: "safety",
					formula: { operator: "globally", operand: { operator: "variable", variable: "p" } },
				}],
			});
			const result = validate(doc);
			assert.ok(findErrors(result, ErrorCode.DeprecatedUsage).length > 0);
		});

		it("warns on bare finally operator under CTL", () => {
			const doc = makeTemporalDoc({
				logic: "ctl",
				properties: [{
					name: "liveness",
					formula: { operator: "finally", operand: { operator: "variable", variable: "p" } },
				}],
			});
			const result = validate(doc);
			assert.ok(findErrors(result, ErrorCode.DeprecatedUsage).length > 0);
		});

		it("does not warn on forall-globally under CTL", () => {
			const doc = makeTemporalDoc({
				logic: "ctl",
				properties: [{
					name: "safety",
					formula: { operator: "forall-globally", operand: { operator: "variable", variable: "p" } },
				}],
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.DeprecatedUsage).length, 0);
		});

		it("does not warn on bare operators under LTL", () => {
			const doc = makeTemporalDoc({
				logic: "ltl",
				properties: [{
					name: "safety",
					formula: { operator: "globally", operand: { operator: "variable", variable: "p" } },
				}],
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.DeprecatedUsage).length, 0);
		});
	});

	// =========================================================================
	// 1h. Optimization suggestions
	// =========================================================================
	describe("optimization suggestions", () => {
		it("suggests removing redundant guard 'true'", () => {
			const doc = makeStateMachineDoc({
				transitions: [{ from: "idle", to: "active", event: "start", guard: "true" }],
			});
			const result = validate(doc);
			const errs = findErrors(result, ErrorCode.OptimizationSuggestion);
			assert.ok(errs.length > 0);
			assert.ok(errs[0].message.includes("redundant guard"));
		});

		it("suggests removing redundant guard '1 == 1'", () => {
			const doc = makeStateMachineDoc({
				transitions: [{ from: "idle", to: "active", event: "start", guard: "1 == 1" }],
			});
			const result = validate(doc);
			assert.ok(findErrors(result, ErrorCode.OptimizationSuggestion).length > 0);
		});

		it("does not flag non-trivial guards", () => {
			const doc = makeStateMachineDoc({
				transitions: [{ from: "idle", to: "active", event: "start", guard: "x > 0" }],
			});
			const result = validate(doc);
			assert.strictEqual(findErrors(result, ErrorCode.OptimizationSuggestion).length, 0);
		});

		it("detects double negation in temporal formulas", () => {
			const doc = makeTemporalDoc({
				properties: [{
					name: "test",
					formula: {
						operator: "not",
						operand: {
							operator: "not",
							operand: { operator: "variable", variable: "p" },
						},
					},
				}],
			});
			const result = validate(doc);
			const errs = findErrors(result, ErrorCode.OptimizationSuggestion);
			assert.ok(errs.length > 0);
			assert.ok(errs.some((e) => e.message.includes("double negation")));
		});

		it("detects single-operand and()", () => {
			const doc = makeTemporalDoc({
				properties: [{
					name: "test",
					formula: {
						operator: "and",
						operands: [{ operator: "variable", variable: "p" }],
					},
				}],
			});
			const result = validate(doc);
			const errs = findErrors(result, ErrorCode.OptimizationSuggestion);
			assert.ok(errs.length > 0);
			assert.ok(errs.some((e) => e.message.includes("single operand")));
		});

		it("detects single-operand or()", () => {
			const doc = makeTemporalDoc({
				properties: [{
					name: "test",
					formula: {
						operator: "or",
						operands: [{ operator: "variable", variable: "q" }],
					},
				}],
			});
			const result = validate(doc);
			const errs = findErrors(result, ErrorCode.OptimizationSuggestion);
			assert.ok(errs.length > 0);
		});
	});

	// =========================================================================
	// 1i. Custom validation rules
	// =========================================================================
	describe("custom validation rules", () => {
		it("runs custom rule that returns no errors", () => {
			const doc = makeStateMachineDoc();
			const rule: CustomValidationRule = {
				name: "no-op",
				description: "Does nothing",
				validate: () => [],
			};
			const result = validate(doc, { checkSemantics: true, customRules: [rule] });
			assert.strictEqual(result.valid, true);
		});

		it("runs custom rule that returns warnings", () => {
			const doc = makeStateMachineDoc();
			const rule: CustomValidationRule = {
				name: "warn-rule",
				description: "Always warns",
				validate: () => [
					createError(ErrorCode.CustomRuleFailed, "Custom warning", { severity: "warning" }),
				],
			};
			const result = validate(doc, { checkSemantics: true, customRules: [rule] });
			assert.strictEqual(result.valid, true);
			assert.ok(result.errors.some((e) => e.code === ErrorCode.CustomRuleFailed));
		});

		it("runs custom rule that returns errors", () => {
			const doc = makeStateMachineDoc();
			const rule: CustomValidationRule = {
				name: "fail-rule",
				description: "Always fails",
				validate: () => [
					createError(ErrorCode.CustomRuleFailed, "Custom error", { severity: "error" }),
				],
			};
			const result = validate(doc, { checkSemantics: true, customRules: [rule] });
			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some((e) => e.code === ErrorCode.CustomRuleFailed));
		});

		it("works with no custom rules specified", () => {
			const doc = makeStateMachineDoc();
			const result = validate(doc, { checkSemantics: true });
			assert.strictEqual(result.valid, true);
		});

		it("runs multiple custom rules", () => {
			const doc = makeStateMachineDoc();
			const rule1: CustomValidationRule = {
				name: "rule1",
				description: "First",
				validate: () => [createError(ErrorCode.CustomRuleFailed, "Rule 1", { severity: "warning" })],
			};
			const rule2: CustomValidationRule = {
				name: "rule2",
				description: "Second",
				validate: () => [createError(ErrorCode.CustomRuleFailed, "Rule 2", { severity: "warning" })],
			};
			const result = validate(doc, { checkSemantics: true, customRules: [rule1, rule2] });
			assert.strictEqual(result.valid, true);
			assert.strictEqual(findErrors(result, ErrorCode.CustomRuleFailed).length, 2);
		});
	});
});
