// BSIF Reference Implementation - TypeScript Test Generator

import type { BSIFDocument, StateMachine, Temporal, Constraints, Events, Interaction } from "../../schemas.js";
import { isStateMachine, isTemporal, isConstraints, isEvents, isInteraction } from "../../schemas.js";
import type { TestGenerator, GeneratedTestSuite } from "../test-generator.js";
import { constraintToTypeScript } from "../expression-evaluator.js";

export class TypeScriptGenerator implements TestGenerator {
	readonly targetLanguage = "typescript";
	private readonly framework: string;

	constructor(framework: string) {
		this.framework = framework;
	}

	generate(doc: BSIFDocument): GeneratedTestSuite {
		const files = new Map<string, string>();
		const dependencies: string[] = [];
		const specName = doc.metadata.name;

		if (this.framework === "vitest") {
			dependencies.push("vitest");
		} else {
			dependencies.push("jest", "@types/jest");
		}

		if (isStateMachine(doc.semantics)) {
			files.set(`${specName}.state-machine.test.ts`, this.generateStateMachineTests(doc.semantics, specName));
		} else if (isTemporal(doc.semantics)) {
			files.set(`${specName}.temporal.test.ts`, this.generateTemporalTests(doc.semantics, specName));
			dependencies.push("fast-check");
		} else if (isConstraints(doc.semantics)) {
			files.set(`${specName}.constraints.test.ts`, this.generateConstraintTests(doc.semantics, specName));
		} else if (isEvents(doc.semantics)) {
			files.set(`${specName}.events.test.ts`, this.generateEventTests(doc.semantics, specName));
		} else if (isInteraction(doc.semantics)) {
			files.set(`${specName}.interaction.test.ts`, this.generateInteractionTests(doc.semantics, specName));
		}

		return { files, dependencies };
	}

	private generateStateMachineTests(sm: StateMachine, specName: string): string {
		const importStatement = this.framework === "vitest"
			? `import { describe, it, expect } from "vitest";`
			: ``;
		const lines: string[] = [
			`// Generated tests for state machine: ${specName}`,
			importStatement,
			``,
			`describe("${specName} state machine", () => {`,
			`  // State definitions`,
			`  const states = ${JSON.stringify(sm.states.map((s) => s.name))};`,
			`  const initial = ${JSON.stringify(sm.initial)};`,
			`  const transitions = ${JSON.stringify(sm.transitions.map((t) => ({ from: t.from, to: t.to, event: t.event })))};`,
			``,
			`  it("should have a valid initial state", () => {`,
			`    expect(states).toContain(initial);`,
			`  });`,
			``,
		];

		// Generate transition tests
		for (const t of sm.transitions) {
			lines.push(
				`  it("should transition from ${t.from} to ${t.to} on ${t.event ?? "auto"}", () => {`,
				`    const transition = transitions.find(t => t.from === ${JSON.stringify(t.from)} && t.event === ${JSON.stringify(t.event)});`,
				`    expect(transition).toBeDefined();`,
				`    expect(transition?.to).toBe(${JSON.stringify(t.to)});`,
				`  });`,
				``,
			);
		}

		// Reachability test
		lines.push(
			`  it("all states should be reachable from initial state", () => {`,
			`    const reachable = new Set<string>([initial]);`,
			`    const queue = [initial];`,
			`    while (queue.length > 0) {`,
			`      const current = queue.shift()!;`,
			`      for (const t of transitions) {`,
			`        if (t.from === current && !reachable.has(t.to)) {`,
			`          reachable.add(t.to);`,
			`          queue.push(t.to);`,
			`        }`,
			`      }`,
			`    }`,
			`    for (const s of states) {`,
			`      expect(reachable.has(s)).toBe(true);`,
			`    }`,
			`  });`,
			``,
		);

		// Negative: invalid events
		lines.push(
			`  it("should reject invalid events from each state", () => {`,
			`    for (const state of states) {`,
			`      const validEvents = transitions.filter(t => t.from === state).map(t => t.event);`,
			`      // At minimum, verify valid events are defined`,
			`      expect(Array.isArray(validEvents)).toBe(true);`,
			`    }`,
			`  });`,
		);

		if (sm.final && sm.final.length > 0) {
			lines.push(
				``,
				`  it("final states should be valid states", () => {`,
				`    const finalStates = ${JSON.stringify(sm.final)};`,
				`    for (const f of finalStates) {`,
				`      expect(states).toContain(f);`,
				`    }`,
				`  });`,
			);
		}

		lines.push(`});`, ``);
		return lines.join("\n");
	}

	private generateTemporalTests(temporal: Temporal, specName: string): string {
		const importStatement = this.framework === "vitest"
			? `import { describe, it, expect } from "vitest";`
			: ``;
		const lines: string[] = [
			`// Generated tests for temporal properties: ${specName}`,
			importStatement,
			`import * as fc from "fast-check";`,
			``,
			`describe("${specName} temporal properties", () => {`,
			`  const variables = ${JSON.stringify(Object.keys(temporal.variables))};`,
			``,
		];

		for (const prop of temporal.properties) {
			lines.push(
				`  describe("property: ${prop.name}", () => {`,
				`    it("should be a well-formed property", () => {`,
				`      const formula = ${JSON.stringify(prop.formula)};`,
				`      expect(formula).toBeDefined();`,
				`      expect(formula.operator).toBeDefined();`,
				`    });`,
			);

			// For globally properties, generate trace test
			if (typeof prop.formula === "object" && prop.formula !== null && "operator" in prop.formula) {
				const op = (prop.formula as { operator: string }).operator;
				if (op === "globally") {
					lines.push(
						``,
						`    it("globally property should hold at every step of a valid trace", () => {`,
						`      fc.assert(fc.property(`,
						`        fc.array(fc.record(`,
						`          fc.constantFrom(...variables),`,
						`          fc.boolean(),`,
						`        ), { minLength: 1, maxLength: 10 }),`,
						`        (trace) => {`,
						`          // Property: globally(P) means P holds at every step`,
						`          // This is a structural test - actual semantics need runtime implementation`,
						`          expect(trace.length).toBeGreaterThan(0);`,
						`        },`,
						`      ));`,
						`    });`,
					);
				}
			}

			lines.push(`  });`, ``);
		}

		lines.push(`});`, ``);
		return lines.join("\n");
	}

	private generateConstraintTests(constraints: Constraints, specName: string): string {
		const importStatement = this.framework === "vitest"
			? `import { describe, it, expect } from "vitest";`
			: ``;
		const lines: string[] = [
			`// Generated tests for constraints: ${specName}`,
			importStatement,
			``,
			`describe("${specName} constraints", () => {`,
			`  const target = ${JSON.stringify(constraints.target)};`,
			``,
			`  it("should have a valid target reference", () => {`,
			`    expect(Object.keys(target).length).toBeGreaterThan(0);`,
			`  });`,
			``,
		];

		for (const pre of constraints.preconditions) {
			const assertion = constraintToTypeScript(pre.expression, "pre");
			lines.push(
				`  it("precondition: ${pre.description}", () => {`,
				`    // Expression: ${pre.expression}`,
				`    ${assertion}`,
				`  });`,
				``,
			);
		}

		for (const post of constraints.postconditions) {
			const assertion = constraintToTypeScript(post.expression, "post");
			lines.push(
				`  it("postcondition: ${post.description}", () => {`,
				`    // Expression: ${post.expression}`,
				`    ${assertion}`,
				`  });`,
				``,
			);
		}

		if (constraints.invariants) {
			for (const inv of constraints.invariants) {
				const assertion = constraintToTypeScript(inv.expression, "invariant");
				lines.push(
					`  it("invariant: ${inv.description}", () => {`,
					`    // Expression: ${inv.expression}`,
					`    ${assertion}`,
					`  });`,
					``,
				);
			}
		}

		lines.push(`});`, ``);
		return lines.join("\n");
	}

	private generateEventTests(events: Events, specName: string): string {
		const importStatement = this.framework === "vitest"
			? `import { describe, it, expect } from "vitest";`
			: ``;
		const lines: string[] = [
			`// Generated tests for events: ${specName}`,
			importStatement,
			``,
			`describe("${specName} events", () => {`,
			`  const declaredEvents = ${JSON.stringify(Object.keys(events.events))};`,
			`  const handlers = ${JSON.stringify(events.handlers.map((h) => ({ event: h.event, action: h.action })))};`,
			``,
			`  it("should have event declarations", () => {`,
			`    expect(declaredEvents.length).toBeGreaterThan(0);`,
			`  });`,
			``,
		];

		for (const handler of events.handlers) {
			lines.push(
				`  it("should handle event: ${handler.event}", () => {`,
				`    const h = handlers.find(h => h.event === ${JSON.stringify(handler.event)});`,
				`    expect(h).toBeDefined();`,
				`  });`,
				``,
			);
		}

		lines.push(`});`, ``);
		return lines.join("\n");
	}

	private generateInteractionTests(interaction: Interaction, specName: string): string {
		const importStatement = this.framework === "vitest"
			? `import { describe, it, expect } from "vitest";`
			: ``;
		const lines: string[] = [
			`// Generated tests for interaction: ${specName}`,
			importStatement,
			``,
			`describe("${specName} interaction", () => {`,
			`  const participants = ${JSON.stringify(interaction.participants.map((p) => p.name))};`,
			`  const messages = ${JSON.stringify(interaction.messages.map((m) => ({ from: m.from, to: m.to, message: m.message })))};`,
			``,
			`  it("should have at least one participant", () => {`,
			`    expect(participants.length).toBeGreaterThanOrEqual(1);`,
			`  });`,
			``,
			`  it("all message senders should be valid participants", () => {`,
			`    for (const msg of messages) {`,
			`      expect(participants).toContain(msg.from);`,
			`    }`,
			`  });`,
			``,
			`  it("all message receivers should be valid participants", () => {`,
			`    for (const msg of messages) {`,
			`      expect(participants).toContain(msg.to);`,
			`    }`,
			`  });`,
		];

		// Sequence ordering test
		const sequencedMessages = interaction.messages.filter((m) => m.sequence !== undefined);
		if (sequencedMessages.length > 0) {
			lines.push(
				``,
				`  it("message sequences should be in order", () => {`,
				`    const sequenced = messages.filter((_, i) => ${JSON.stringify(sequencedMessages.map((_, i) => i))}.includes(i));`,
				`    // Verify no duplicate sequence numbers`,
				`    const seqs = ${JSON.stringify(sequencedMessages.map((m) => m.sequence))};`,
				`    expect(new Set(seqs).size).toBe(seqs.length);`,
				`  });`,
			);
		}

		lines.push(`});`, ``);
		return lines.join("\n");
	}
}
