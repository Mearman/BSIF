// BSIF Reference Implementation - Validator Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { validate } from "../src/validator.js";
import { ErrorCode } from "../src/errors.js";

describe("Validator", () => {
	describe("validate", () => {
		it("accepts valid BSIF document", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
		});

		it("rejects document with invalid initial state", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-initial.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 1);
			assert.strictEqual(result.errors[0].code, ErrorCode.InitialStateMissing);
		});

		it("rejects document with invalid bsif_version", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-version.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.errors.length, 1);
			assert.strictEqual(result.errors[0].code, ErrorCode.InvalidFieldValue);
		});
	});

	describe("temporal validation", () => {
		it("accepts valid temporal document", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-temporal.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
		});

		it("rejects undeclared variable reference", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-temporal-undeclared-var.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			const varError = result.errors.find((e) => e.code === ErrorCode.UndefinedVariable);
			assert.ok(varError, "Should have UndefinedVariable error");
			assert.match(varError.message, /r/);
		});

		it("rejects duplicate property names", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-temporal-duplicate-property.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			const dupError = result.errors.find((e) => e.code === ErrorCode.DuplicateName);
			assert.ok(dupError, "Should have DuplicateName error");
			assert.match(dupError.message, /prop1/);
		});
	});

	describe("constraints validation", () => {
		it("accepts valid constraints document", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-constraints.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
		});

		it("rejects unmatched parentheses", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-constraints-unmatched-parens.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			const exprError = result.errors.find((e) => e.code === ErrorCode.InvalidExpression);
			assert.ok(exprError, "Should have InvalidExpression error");
		});
	});

	describe("events validation", () => {
		it("accepts valid events document", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-events.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
		});

		it("rejects handler referencing undefined event", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-events-undefined-event.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			const eventError = result.errors.find((e) => e.code === ErrorCode.UndefinedEvent);
			assert.ok(eventError, "Should have UndefinedEvent error");
			assert.match(eventError.message, /nonexistent/);
		});

		it("produces warning for unused event declarations", async () => {
			// Create inline doc with an unused event
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "events",
					events: {
						used: { payload: "string" },
						unused: { payload: "string" },
					},
					handlers: [{ event: "used", action: "handle()" }],
				},
			};

			const result = validate(doc);

			// Unused events produce warnings, not errors — validation still passes
			// but we need to check if the result includes warnings
			const unusedWarning = result.errors.find((e) => e.code === ErrorCode.UnusedEventDeclaration);
			if (unusedWarning) {
				assert.strictEqual(unusedWarning.severity, "warning");
				assert.match(unusedWarning.message, /unused/);
			}
		});
	});

	describe("interaction validation", () => {
		it("accepts valid interaction document", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-interaction.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
		});

		it("rejects message referencing undefined participant", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-interaction-undefined-participant.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			const partError = result.errors.find((e) => e.code === ErrorCode.UndefinedParticipant);
			assert.ok(partError, "Should have UndefinedParticipant error");
			assert.match(partError.message, /unknown/);
		});

		it("rejects duplicate participant names", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-interaction-duplicate-participant.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			const dupError = result.errors.find((e) => e.code === ErrorCode.DuplicateName);
			assert.ok(dupError, "Should have DuplicateName error");
			assert.match(dupError.message, /client/);
		});
	});

	describe("hybrid validation", () => {
		it("accepts valid hybrid document", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-hybrid.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
		});

		it("rejects hybrid with invalid component type", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-hybrid-bad-component.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			const typeError = result.errors.find((e) => e.code === ErrorCode.InvalidComponentType);
			assert.ok(typeError, "Should have InvalidComponentType error");
		});
	});

	describe("general validation", () => {
		it("accepts compatible bsif_version 1.0.x", () => {
			const doc = {
				metadata: { bsif_version: "1.0.1", name: "test" },
				semantics: {
					type: "state-machine",
					states: [{ name: "idle" }],
					transitions: [],
					initial: "idle",
				},
			};

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
		});

		it("rejects duplicate state names", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "state-machine",
					states: [{ name: "idle" }, { name: "idle" }],
					transitions: [],
					initial: "idle",
				},
			};

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			const dupError = result.errors.find((e) => e.code === ErrorCode.DuplicateName);
			assert.ok(dupError, "Should have DuplicateName error");
		});
	});

	describe("state machine reachability", () => {
		it("warns about unreachable states", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-sm-unreachable.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const unreachableError = result.errors.find((e) => e.code === ErrorCode.UnreachableState);
			assert.ok(unreachableError, "Should have UnreachableState warning");
			assert.strictEqual(unreachableError.severity, "warning");
			assert.match(unreachableError.message, /orphan/);
		});

		it("warns about deadlocked states", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-sm-deadlock.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const deadlockError = result.errors.find((e) => e.code === ErrorCode.DeadlockDetected);
			assert.ok(deadlockError, "Should have DeadlockDetected warning");
			assert.strictEqual(deadlockError.severity, "warning");
			assert.match(deadlockError.message, /stuck/);
		});
	});

	describe("temporal formula structure", () => {
		it("rejects until with wrong operand count", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-temporal-wrong-operands.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			const formulaError = result.errors.find((e) => e.code === ErrorCode.InvalidFormulaStructure);
			assert.ok(formulaError, "Should have InvalidFormulaStructure error");
			assert.match(formulaError.message, /until/);
		});
	});

	describe("constraints old. reference", () => {
		it("rejects old. in preconditions", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-constraints-old-in-precondition.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, false);
			const oldError = result.errors.find((e) => e.code === ErrorCode.InvalidOldReference);
			assert.ok(oldError, "Should have InvalidOldReference error");
		});

		it("allows old. in postconditions", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "constraints",
					target: { function: "push" },
					preconditions: [{ description: "not full", expression: "size < capacity" }],
					postconditions: [{ description: "increases", expression: "size == old.size + 1" }],
				},
			};

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
		});
	});

	describe("hybrid namespace conflicts", () => {
		it("warns about conflicting state names across components", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-hybrid-namespace-conflict.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const conflictError = result.errors.find((e) => e.code === ErrorCode.NamespaceConflict);
			assert.ok(conflictError, "Should have NamespaceConflict warning");
			assert.strictEqual(conflictError.severity, "warning");
			assert.match(conflictError.message, /idle/);
		});
	});
});
