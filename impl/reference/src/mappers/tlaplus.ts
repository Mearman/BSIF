// BSIF Reference Implementation - TLA+ Mapper

import type { BSIFDocument } from "../schemas.js";
import type { BSIFMetadata } from "../schemas.js";
import { isStateMachine, isTemporal, isConstraints } from "../schemas.js";
import type { Mapper } from "./mapper.js";

export class TLAPlusMapper implements Mapper<string> {
	readonly toolName = "tlaplus";
	readonly supportedTypes = ["state-machine", "temporal", "constraints"];

	fromBSIF(doc: BSIFDocument): string {
		if (isStateMachine(doc.semantics)) {
			return this.stateMachineToTLA(doc);
		}
		if (isTemporal(doc.semantics)) {
			return this.temporalToTLA(doc);
		}
		if (isConstraints(doc.semantics)) {
			return this.constraintsToTLA(doc);
		}
		throw new Error(`Unsupported semantic type for TLA+ mapping`);
	}

	toBSIF(input: string, metadata?: Partial<BSIFMetadata>): BSIFDocument {
		// Parse TLA+ back to BSIF — basic structural parsing
		const name = metadata?.name ?? extractModuleName(input) ?? "imported-tla";
		const states = extractStates(input);
		const transitions = extractTransitions(input, states);

		return {
			metadata: {
				bsif_version: "1.0.0",
				name,
				version: metadata?.version,
				description: metadata?.description ?? `Imported from TLA+ module`,
			},
			semantics: {
				type: "state-machine",
				states: states.map((s) => ({ name: s })),
				transitions,
				initial: states[0] ?? "init",
			},
		};
	}

	private stateMachineToTLA(doc: BSIFDocument): string {
		const sm = doc.semantics;
		if (!isStateMachine(sm)) throw new Error("Expected state machine");

		const moduleName = toTLAName(doc.metadata.name);
		const lines: string[] = [];

		lines.push(`---- MODULE ${moduleName} ----`);
		lines.push(`EXTENDS Naturals, Sequences`);
		lines.push(``);
		lines.push(`VARIABLE state`);
		lines.push(``);

		// States as constants
		const stateNames = sm.states.map((s) => toTLAName(s.name));
		lines.push(`States == {${stateNames.map((s) => `"${s}"`).join(", ")}}`);
		lines.push(``);

		// Init
		lines.push(`Init == state = "${toTLAName(sm.initial)}"`);
		lines.push(``);

		// Transitions as actions
		for (const t of sm.transitions) {
			const actionName = `${toTLAName(t.from)}_to_${toTLAName(t.to)}`;
			let guard = `state = "${toTLAName(t.from)}"`;
			if (t.guard) {
				guard += ` /\\ ${t.guard}`;
			}
			lines.push(`${actionName} == ${guard} /\\ state' = "${toTLAName(t.to)}"`);
		}
		lines.push(``);

		// Next as disjunction of all transitions
		const actionNames = sm.transitions.map(
			(t) => `${toTLAName(t.from)}_to_${toTLAName(t.to)}`,
		);
		lines.push(`Next == ${actionNames.length > 0 ? actionNames.join(" \\/ ") : "FALSE"}`);
		lines.push(``);

		// Spec
		lines.push(`Spec == Init /\\ [][Next]_state`);
		lines.push(``);

		// Type invariant
		lines.push(`TypeInvariant == state \\in States`);
		lines.push(``);

		lines.push(`====`);

		return lines.join("\n");
	}

	private temporalToTLA(doc: BSIFDocument): string {
		const temporal = doc.semantics;
		if (!isTemporal(temporal)) throw new Error("Expected temporal");

		const moduleName = toTLAName(doc.metadata.name);
		const lines: string[] = [];

		lines.push(`---- MODULE ${moduleName} ----`);
		lines.push(`EXTENDS Naturals`);
		lines.push(``);

		// Variables
		const varNames = Object.keys(temporal.variables);
		lines.push(`VARIABLES ${varNames.join(", ")}`);
		lines.push(``);

		// Properties as theorems
		for (const prop of temporal.properties) {
			const tlaFormula = formulaToTLA(prop.formula);
			lines.push(`${toTLAName(prop.name)} == ${tlaFormula}`);
		}
		lines.push(``);

		lines.push(`====`);
		return lines.join("\n");
	}

	private constraintsToTLA(doc: BSIFDocument): string {
		const constraints = doc.semantics;
		if (!isConstraints(constraints)) throw new Error("Expected constraints");

		const moduleName = toTLAName(doc.metadata.name);
		const lines: string[] = [];

		lines.push(`---- MODULE ${moduleName} ----`);
		lines.push(`EXTENDS Naturals`);
		lines.push(``);

		// Preconditions as ASSUME
		for (const pre of constraints.preconditions) {
			lines.push(`\\* Precondition: ${pre.description}`);
			lines.push(`ASSUME ${pre.expression}`);
		}
		lines.push(``);

		// Postconditions as theorems
		for (const post of constraints.postconditions) {
			lines.push(`\\* Postcondition: ${post.description}`);
			lines.push(`\\* ${post.expression}`);
		}
		lines.push(``);

		// Invariants
		if (constraints.invariants) {
			for (const inv of constraints.invariants) {
				lines.push(`\\* Invariant: ${inv.description}`);
				lines.push(`\\* ${inv.expression}`);
			}
		}

		lines.push(`====`);
		return lines.join("\n");
	}
}

function toTLAName(name: string): string {
	return name.replace(/-/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
}

function formulaToTLA(formula: unknown): string {
	if (typeof formula !== "object" || formula === null) return "TRUE";
	if (!("operator" in formula)) return "TRUE";

	const f = formula as Record<string, unknown>;
	const op = f.operator as string;

	switch (op) {
	case "literal":
		return f.value === true ? "TRUE" : f.value === false ? "FALSE" : String(f.value);
	case "variable":
		return String(f.variable);
	case "not":
		return `~(${formulaToTLA(f.operand)})`;
	case "and":
		return (f.operands as unknown[]).map((o) => formulaToTLA(o)).join(" /\\ ");
	case "or":
		return (f.operands as unknown[]).map((o) => formulaToTLA(o)).join(" \\/ ");
	case "implies":
		return `(${formulaToTLA((f.operands as unknown[])[0])}) => (${formulaToTLA((f.operands as unknown[])[1])})`;
	case "globally":
	case "always":
		return `[][${formulaToTLA(f.operand)}]_vars`;
	case "finally":
	case "eventually":
		return `<>(${formulaToTLA(f.operand)})`;
	case "next":
		return `${formulaToTLA(f.operand)}'`;
	case "until":
		return `(${formulaToTLA((f.operands as unknown[])[0])}) ~> (${formulaToTLA((f.operands as unknown[])[1])})`;
	default:
		return "TRUE";
	}
}

function extractModuleName(tla: string): string | null {
	const match = /---- MODULE (\w+) ----/.exec(tla);
	return match ? match[1]! : null;
}

function extractStates(tla: string): string[] {
	const match = /States\s*==\s*\{([^}]+)\}/.exec(tla);
	if (!match) return [];
	return match[1]!.split(",").map((s) => s.trim().replace(/"/g, ""));
}

function extractTransitions(tla: string, states: string[]): Array<{ from: string; to: string }> {
	const transitions: Array<{ from: string; to: string }> = [];
	for (const from of states) {
		for (const to of states) {
			const pattern = `${from}_to_${to}`;
			if (tla.includes(pattern)) {
				transitions.push({ from, to });
			}
		}
	}
	return transitions;
}
