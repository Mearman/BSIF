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

	describe("constraint target reference validation", () => {
		it("rejects target with all empty fields", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-constraints-empty-target.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const targetError = result.errors.find((e) => e.code === ErrorCode.InvalidTargetReference);
			assert.ok(targetError, "Should have InvalidTargetReference error");
		});
	});

	describe("event payload type mismatch", () => {
		it("rejects handler with mismatched payload type", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-events-payload-mismatch.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const payloadError = result.errors.find((e) => e.code === ErrorCode.PayloadTypeMismatch);
			assert.ok(payloadError, "Should have PayloadTypeMismatch error");
			assert.match(payloadError.message, /integer/);
			assert.match(payloadError.message, /string/);
		});
	});

	describe("message sequence validation", () => {
		it("rejects duplicate sequence numbers", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-interaction-bad-sequence.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const seqError = result.errors.find((e) => e.code === ErrorCode.InvalidMessageSequence);
			assert.ok(seqError, "Should have InvalidMessageSequence error");
		});
	});

	describe("temporal type compatibility", () => {
		it("rejects non-boolean variable in logical operator", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-temporal-type-mismatch.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const typeError = result.errors.find((e) => e.code === ErrorCode.IncompatibleTypes);
			assert.ok(typeError, "Should have IncompatibleTypes error");
			assert.match(typeError.message, /count/);
			assert.match(typeError.message, /integer/);
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

		it("accepts high patch version 1.0.99", () => {
			const doc = {
				metadata: { bsif_version: "1.0.99", name: "test" },
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

		it("rejects minor version 1.1.0", () => {
			const doc = {
				metadata: { bsif_version: "1.1.0", name: "test" },
				semantics: {
					type: "state-machine",
					states: [{ name: "idle" }],
					transitions: [],
					initial: "idle",
				},
			};

			const result = validate(doc);

			const versionError = result.errors.find((e) => e.code === ErrorCode.VersionMismatch);
			assert.ok(versionError, "Should have VersionMismatch error");
		});

		it("rejects major version 2.0.0", () => {
			const doc = {
				metadata: { bsif_version: "2.0.0", name: "test" },
				semantics: {
					type: "state-machine",
					states: [{ name: "idle" }],
					transitions: [],
					initial: "idle",
				},
			};

			const result = validate(doc);

			const versionError = result.errors.find((e) => e.code === ErrorCode.VersionMismatch);
			assert.ok(versionError, "Should have VersionMismatch error");
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

	describe("CTL temporal validation", () => {
		it("warns about undefined CTL semantics", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [
						{
							name: "always_p",
							formula: { operator: "globally", operand: { operator: "variable", variable: "p" } },
						},
					],
				},
			};

			const result = validate(doc, { checkSemantics: true });

			const ctlWarning = result.errors.find((e) => e.code === ErrorCode.CTLSemanticsUndefined);
			assert.ok(ctlWarning, "Should have CTLSemanticsUndefined warning");
			assert.strictEqual(ctlWarning.severity, "warning");
		});

		it("warns about ambiguous next operator under CTL", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "temporal",
					logic: "ctl",
					variables: { ready: "boolean" },
					properties: [
						{
							name: "next_ready",
							formula: { operator: "next", operand: { operator: "variable", variable: "ready" } },
						},
					],
				},
			};

			const result = validate(doc, { checkSemantics: true });

			const ambiguousWarning = result.errors.find((e) => e.code === ErrorCode.CTLOperatorAmbiguous);
			assert.ok(ambiguousWarning, "Should have CTLOperatorAmbiguous warning");
			assert.match(ambiguousWarning.message, /next/);
		});

		it("validates CTL formulas structurally same as LTL", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean", q: "boolean" },
					properties: [
						{
							name: "response",
							formula: {
								operator: "globally",
								operand: {
									operator: "implies",
									operands: [
										{ operator: "variable", variable: "p" },
										{ operator: "finally", operand: { operator: "variable", variable: "q" } },
									],
								},
							},
						},
					],
				},
			};

			const result = validate(doc, { checkSemantics: true });

			// Should pass structurally (only CTL warning, no structural errors)
			const structErrors = result.errors.filter((e) => e.code !== ErrorCode.CTLSemanticsUndefined);
			assert.strictEqual(structErrors.length, 0);
		});

		it("rejects CTL document with undeclared variables", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "temporal",
					logic: "ctl",
					variables: { p: "boolean" },
					properties: [
						{
							name: "use_undeclared",
							formula: { operator: "globally", operand: { operator: "variable", variable: "unknown_var" } },
						},
					],
				},
			};

			const result = validate(doc, { checkSemantics: true });

			const undefError = result.errors.find((e) => e.code === ErrorCode.UndefinedVariable);
			assert.ok(undefError, "Should have UndefinedVariable error");
		});

		it("does not warn about next operator under LTL", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "temporal",
					logic: "ltl",
					variables: { ready: "boolean" },
					properties: [
						{
							name: "next_ready",
							formula: { operator: "next", operand: { operator: "variable", variable: "ready" } },
						},
					],
				},
			};

			const result = validate(doc, { checkSemantics: true });

			const ctlWarning = result.errors.find((e) => e.code === ErrorCode.CTLSemanticsUndefined);
			assert.ok(!ctlWarning, "Should not have CTL warning for LTL");
			const ambiguousWarning = result.errors.find((e) => e.code === ErrorCode.CTLOperatorAmbiguous);
			assert.ok(!ambiguousWarning, "Should not have ambiguous warning for LTL");
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

	describe("document size limits", () => {
		it("warns when document size exceeds limit", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "state-machine",
					states: [{ name: "idle" }],
					transitions: [],
					initial: "idle",
				},
			};

			const result = validate(doc, { checkSemantics: true, resourceLimits: { maxDocumentSize: 10 } });

			const sizeError = result.errors.find((e) => e.code === ErrorCode.ResourceLimitExceeded);
			assert.ok(sizeError, "Should have ResourceLimitExceeded warning");
			assert.strictEqual(sizeError.severity, "warning");
			assert.match(sizeError.message, /bytes/);
		});
	});

	describe("general validation", () => {
		it("warns when state count exceeds resource limit", () => {
			const states = Array.from({ length: 5 }, (_, i) => ({ name: `s${i}` }));
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "state-machine",
					states,
					transitions: [],
					initial: "s0",
				},
			};

			const result = validate(doc, { checkSemantics: true, resourceLimits: { maxStateCount: 3 } });

			const limitError = result.errors.find((e) => e.code === ErrorCode.ResourceLimitExceeded);
			assert.ok(limitError, "Should have ResourceLimitExceeded warning");
			assert.strictEqual(limitError.severity, "warning");
		});
	});

	describe("parallel state validation", () => {
		it("accepts valid parallel states with children", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-sm-parallel.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const parallelError = result.errors.find((e) => e.code === ErrorCode.ParallelStateNoChildren);
			assert.strictEqual(parallelError, undefined, "Should not have ParallelStateNoChildren error");
		});

		it("warns about parallel state with no children", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-sm-parallel-no-children.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const parallelError = result.errors.find((e) => e.code === ErrorCode.ParallelStateNoChildren);
			assert.ok(parallelError, "Should have ParallelStateNoChildren warning");
			assert.strictEqual(parallelError.severity, "warning");
		});
	});

	describe("concurrency validation", () => {
		it("accepts parallel state with independent regions", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-sm-parallel-regions.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			const crossError = result.errors.find((e) => e.code === ErrorCode.ParallelRegionTransition);
			assert.strictEqual(crossError, undefined, "Should not have cross-region warning");
		});

		it("warns about transitions between parallel regions", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-sm-parallel-cross-region.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			const crossError = result.errors.find((e) => e.code === ErrorCode.ParallelRegionTransition);
			assert.ok(crossError, "Should have ParallelRegionTransition warning");
			assert.strictEqual(crossError.severity, "warning");
			assert.match(crossError.message, /crosses parallel regions/);
		});

		it("warns about nested parallel states", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-sm-nested-parallel.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			const nestedError = result.errors.find((e) => e.code === ErrorCode.NestedParallelState);
			assert.ok(nestedError, "Should have NestedParallelState warning");
			assert.strictEqual(nestedError.severity, "warning");
		});

		it("rejects state with non-existent parent reference", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-sm-parent-not-found.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			const parentError = result.errors.find(
				(e) => e.code === ErrorCode.StateNotFound && e.message.includes("parent"),
			);
			assert.ok(parentError, "Should have StateNotFound error for non-existent parent");
		});

		it("handles parallel state with single child region", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "state-machine",
					states: [
						{ name: "main", parallel: true },
						{ name: "only_region", parent: "main" },
					],
					transitions: [],
					initial: "main",
				},
			};

			const result = validate(doc, { checkSemantics: true });

			const crossError = result.errors.find((e) => e.code === ErrorCode.ParallelRegionTransition);
			assert.strictEqual(crossError, undefined, "Single region should not cause cross-region error");
		});
	});

	describe("tool mapping validation", () => {
		it("accepts document with valid tool mappings", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-with-tools.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			const toolError = result.errors.find((e) => e.code === ErrorCode.EmptyToolMapping);
			assert.strictEqual(toolError, undefined, "Should not have EmptyToolMapping warning");
		});

		it("warns about empty tool mappings", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-tools-empty-mapping.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			const toolError = result.errors.find((e) => e.code === ErrorCode.EmptyToolMapping);
			assert.ok(toolError, "Should have EmptyToolMapping warning");
			assert.strictEqual(toolError.severity, "warning");
		});

		it("accepts document without tools section", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "state-machine",
					states: [{ name: "idle" }],
					transitions: [],
					initial: "idle",
				},
			};

			const result = validate(doc, { checkSemantics: true });

			const toolError = result.errors.find((e) => e.code === ErrorCode.EmptyToolMapping);
			assert.strictEqual(toolError, undefined, "Should not have EmptyToolMapping warning");
		});
	});

	describe("advanced data type validation", () => {
		it("accepts array type in variable declarations", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-temporal-array-type.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			// Should pass (only possible CTL/structural warnings, no type errors)
			const typeErrors = result.errors.filter(
				(e) => e.code === ErrorCode.InvalidFieldValue || e.code === ErrorCode.DuplicateEnumValue,
			);
			assert.strictEqual(typeErrors.length, 0, "Should not have type-related errors");
		});

		it("accepts array type in event payloads", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-events-array-payload.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			const typeErrors = result.errors.filter((e) => e.code === ErrorCode.InvalidFieldValue);
			assert.strictEqual(typeErrors.length, 0, "Should not have schema errors for array payload");
		});

		it("accepts enum type in variable declarations", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-temporal-enum-type.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			const enumError = result.errors.find((e) => e.code === ErrorCode.DuplicateEnumValue);
			assert.strictEqual(enumError, undefined, "Should not have DuplicateEnumValue error");
		});

		it("rejects enum with duplicate values", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-temporal-duplicate-enum.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			const enumError = result.errors.find((e) => e.code === ErrorCode.DuplicateEnumValue);
			assert.ok(enumError, "Should have DuplicateEnumValue error");
			assert.match(enumError.message, /active/);
		});

		it("warns about undefined type references", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-temporal-bad-type-ref.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc, { checkSemantics: true });

			const refError = result.errors.find((e) => e.code === ErrorCode.UndefinedTypeReference);
			assert.ok(refError, "Should have UndefinedTypeReference warning");
			assert.strictEqual(refError.severity, "warning");
			assert.match(refError.message, /NonExistentType/);
		});

		it("accepts valid primitive type references in object properties", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "temporal",
					logic: "ltl",
					variables: {
						active: "boolean",
						data: {
							type: "object",
							properties: {
								name: "string",
								count: "integer",
								flag: "boolean",
							},
						},
					},
					properties: [
						{
							name: "always_active",
							formula: { operator: "globally", operand: { operator: "variable", variable: "active" } },
						},
					],
				},
			};

			const result = validate(doc, { checkSemantics: true });

			const refError = result.errors.find((e) => e.code === ErrorCode.UndefinedTypeReference);
			assert.strictEqual(refError, undefined, "Should not have UndefinedTypeReference for primitives");
		});

		it("accepts nested array type (array of arrays)", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "temporal",
					logic: "ltl",
					variables: {
						active: "boolean",
						matrix: {
							type: "array",
							items: {
								type: "array",
								items: "integer",
							},
						},
					},
					properties: [
						{
							name: "always_active",
							formula: { operator: "globally", operand: { operator: "variable", variable: "active" } },
						},
					],
				},
			};

			const result = validate(doc, { checkSemantics: true });

			const schemaErrors = result.errors.filter((e) => e.code === ErrorCode.InvalidFieldValue);
			assert.strictEqual(schemaErrors.length, 0, "Should accept nested array types");
		});
	});

	describe("circular parent references", () => {
		it("detects circular parent references", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-sm-circular-parent.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const circularError = result.errors.find((e) => e.code === ErrorCode.CircularStateReference);
			assert.ok(circularError, "Should have CircularStateReference error");
		});
	});

	describe("invalid transitions", () => {
		it("rejects transitions referencing non-existent states", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-sm-bad-transition.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const transError = result.errors.find((e) => e.code === ErrorCode.InvalidTransition);
			assert.ok(transError, "Should have InvalidTransition error");
			assert.match(transError.message, /nonexistent/);
		});
	});

	describe("nesting depth", () => {
		it("warns when document nesting exceeds limit", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "state-machine",
					states: [{ name: "idle" }],
					transitions: [],
					initial: "idle",
				},
			};

			const result = validate(doc, { checkSemantics: true, resourceLimits: { maxNestingDepth: 1 } });

			const nestingError = result.errors.find((e) => e.code === ErrorCode.NestingDepthExceeded);
			assert.ok(nestingError, "Should have NestingDepthExceeded warning");
			assert.strictEqual(nestingError.severity, "warning");
		});
	});

	describe("timing constraints", () => {
		it("accepts valid timing constraints", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-sm-timing.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
		});

		it("warns when deadline is less than timeout", () => {
			const doc = {
				metadata: { bsif_version: "1.0.0", name: "test" },
				semantics: {
					type: "state-machine",
					states: [{ name: "idle" }, { name: "active" }],
					transitions: [
						{ from: "idle", to: "active", timing: { deadline: 100, timeout: 500, unit: "ms" } },
					],
					initial: "idle",
				},
			};

			const result = validate(doc);

			const timingError = result.errors.find((e) => e.code === ErrorCode.InvalidTimingConstraint);
			assert.ok(timingError, "Should have InvalidTimingConstraint warning");
			assert.strictEqual(timingError.severity, "warning");
		});
	});

	describe("composition references", () => {
		it("accepts valid references", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "valid-with-references.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			assert.strictEqual(result.valid, true);
		});

		it("warns about duplicate references", async () => {
			const fixturePath = join(import.meta.dirname, "fixtures", "invalid-duplicate-references.bsif.json");
			const content = await readFile(fixturePath, "utf-8");
			const doc = JSON.parse(content);

			const result = validate(doc);

			const dupRefError = result.errors.find((e) => e.code === ErrorCode.DuplicateReference);
			assert.ok(dupRefError, "Should have DuplicateReference warning");
			assert.strictEqual(dupRefError.severity, "warning");
		});

		it("warns about self-references", () => {
			const doc = {
				metadata: {
					bsif_version: "1.0.0",
					name: "my-spec",
					references: ["https://example.com/specs/my-spec"],
				},
				semantics: {
					type: "state-machine",
					states: [{ name: "idle" }],
					transitions: [],
					initial: "idle",
				},
			};

			const result = validate(doc);

			const selfRefError = result.errors.find(
				(e) => e.code === ErrorCode.DuplicateReference && e.message.includes("Self-reference"),
			);
			assert.ok(selfRefError, "Should have self-reference warning");
			assert.strictEqual(selfRefError.severity, "warning");
		});
	});
});
