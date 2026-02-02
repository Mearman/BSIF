// BSIF Reference Implementation - Runtime Monitor Generator
// Generates runtime monitoring code from BSIF specifications

import type { BSIFDocument, StateMachine, Constraints } from "../schemas.js";
import { isStateMachine, isConstraints, isTemporal } from "../schemas.js";

//==============================================================================
// Types
//==============================================================================

export interface GeneratedMonitor {
	readonly files: ReadonlyMap<string, string>;
	readonly description: string;
}

//==============================================================================
// Generator
//==============================================================================

export function generateMonitor(doc: BSIFDocument): GeneratedMonitor {
	const files = new Map<string, string>();
	const specName = doc.metadata.name;

	if (isStateMachine(doc.semantics)) {
		files.set(`${specName}-monitor.ts`, generateStateMachineMonitor(doc.semantics, specName));
	} else if (isConstraints(doc.semantics)) {
		files.set(`${specName}-monitor.ts`, generateConstraintMonitor(doc.semantics, specName));
	} else if (isTemporal(doc.semantics)) {
		files.set(`${specName}-monitor.ts`, generateTemporalMonitor(specName));
	}

	return {
		files,
		description: `Runtime monitor for ${specName}`,
	};
}

function generateStateMachineMonitor(sm: StateMachine, specName: string): string {
	return `// Runtime monitor for state machine: ${specName}
// Auto-generated — do not edit

export class ${toPascalCase(specName)}Monitor {
  private currentState: string;
  private readonly validTransitions: Map<string, Map<string, string>>;

  constructor() {
    this.currentState = ${JSON.stringify(sm.initial)};
    this.validTransitions = new Map();
${sm.transitions.map((t) => `    this.addTransition(${JSON.stringify(t.from)}, ${JSON.stringify(t.event ?? "")}, ${JSON.stringify(t.to)});`).join("\n")}
  }

  private addTransition(from: string, event: string, to: string): void {
    if (!this.validTransitions.has(from)) {
      this.validTransitions.set(from, new Map());
    }
    this.validTransitions.get(from)!.set(event, to);
  }

  send(event: string): void {
    const transitions = this.validTransitions.get(this.currentState);
    if (!transitions || !transitions.has(event)) {
      throw new Error(\`Invalid event "\${event}" in state "\${this.currentState}"\`);
    }
    this.currentState = transitions.get(event)!;
  }

  getCurrentState(): string {
    return this.currentState;
  }

  isInFinalState(): boolean {
    const finalStates = ${JSON.stringify(sm.final ?? [])};
    return finalStates.includes(this.currentState);
  }
}
`;
}

function generateConstraintMonitor(constraints: Constraints, specName: string): string {
	return `// Runtime monitor for constraints: ${specName}
// Auto-generated — do not edit

export function checkPreconditions(context: Record<string, unknown>): void {
${constraints.preconditions.map((pre) => `  // ${pre.description}\n  // Expression: ${pre.expression}`).join("\n")}
}

export function checkPostconditions(context: Record<string, unknown>, oldContext: Record<string, unknown>): void {
${constraints.postconditions.map((post) => `  // ${post.description}\n  // Expression: ${post.expression}`).join("\n")}
}
${constraints.invariants ? `
export function checkInvariants(context: Record<string, unknown>): void {
${constraints.invariants.map((inv) => `  // ${inv.description}\n  // Expression: ${inv.expression}`).join("\n")}
}` : ""}
`;
}

function generateTemporalMonitor(specName: string): string {
	return `// Runtime monitor for temporal properties: ${specName}
// Auto-generated — do not edit

export class ${toPascalCase(specName)}TraceMonitor {
  private readonly trace: Array<Record<string, boolean | number | string>> = [];
  private readonly maxTraceLength: number;

  constructor(maxTraceLength = 1000) {
    this.maxTraceLength = maxTraceLength;
  }

  record(variables: Record<string, boolean | number | string>): void {
    if (this.trace.length >= this.maxTraceLength) {
      this.trace.shift();
    }
    this.trace.push({ ...variables });
  }

  getTrace(): ReadonlyArray<Record<string, boolean | number | string>> {
    return this.trace;
  }

  reset(): void {
    this.trace.length = 0;
  }
}
`;
}

function toPascalCase(str: string): string {
	return str.split(/[-_]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
