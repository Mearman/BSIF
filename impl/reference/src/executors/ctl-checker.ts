// BSIF Reference Implementation - CTL Model Checker
// Model checking CTL formulas over Kripke structures

import type { Temporal } from "../schemas.js";

//==============================================================================
// Types
//==============================================================================

export interface KripkeState {
	readonly name: string;
	readonly labels: Record<string, boolean | number | string>;
}

export interface KripkeStructure {
	readonly states: readonly KripkeState[];
	readonly initialStates: readonly string[];
	readonly transitions: ReadonlyMap<string, readonly string[]>;
}

export interface CTLCheckResult {
	readonly property: string;
	readonly satisfied: boolean;
	readonly satisfyingStates?: readonly string[];
	readonly counterexample?: readonly string[];
	readonly message?: string;
}

//==============================================================================
// Build Kripke Structure from State Machine
//==============================================================================

export function buildKripkeStructure(
	states: readonly { name: string }[],
	transitions: readonly { from: string; to: string }[],
	initial: string,
	labels: Record<string, Record<string, boolean | number | string>>,
): KripkeStructure {
	// Build transition map
	const transitionMap = new Map<string, string[]>();
	for (const s of states) {
		transitionMap.set(s.name, []);
	}
	for (const t of transitions) {
		const existing = transitionMap.get(t.from) ?? [];
		transitionMap.set(t.from, [...existing, t.to]);
	}

	// Build Kripke states with labels
	const kripkeStates: KripkeState[] = states.map((s) => ({
		name: s.name,
		labels: labels[s.name] ?? {},
	}));

	return {
		states: kripkeStates,
		initialStates: [initial],
		transitions: transitionMap,
	};
}

//==============================================================================
// CTL Model Checker
//==============================================================================

export function checkCTL(spec: Temporal, structure: KripkeStructure): readonly CTLCheckResult[] {
	const results: CTLCheckResult[] = [];

	const satStates = new Map<string, Set<string>>(); // Cache satisfaction sets

	for (const property of spec.properties) {
		const satisfying = new Set<string>(evalCTL(property.formula, structure, satStates) as Iterable<string>);
		const allInitialSatisfied = structure.initialStates.every((init) => satisfying.has(init));
		const message = allInitialSatisfied
			? `Property "${property.name}" is satisfied in all initial states`
			: `Property "${property.name}" is violated (not satisfied in initial states)`;

		const result: CTLCheckResult = {
			property: property.name,
			satisfied: allInitialSatisfied,
			satisfyingStates: [...satisfying],
			message,
		};

		// Find counterexample if violated
		if (!allInitialSatisfied) {
			const violatingInitial = structure.initialStates.find((init) => !satisfying.has(init));
			if (violatingInitial !== undefined) {
				(results.push({ ...result, counterexample: [violatingInitial] }));
				continue;
			}
		}

		results.push(result);
	}

	return results;
}

// Bottom-up CTL labeling algorithm
function evalCTL(formula: unknown, structure: KripkeStructure, cache: Map<string, Set<string>>): Set<string> {
	const formulaKey = JSON.stringify(formula);
	if (cache.has(formulaKey)) {
		return cache.get(formulaKey)!;
	}

	const result = evalCTLUncached(formula, structure, cache);
	cache.set(formulaKey, result);
	return result;
}

function evalCTLUncached(formula: unknown, structure: KripkeStructure, cache: Map<string, Set<string>>): Set<string> {
	if (typeof formula !== "object" || formula === null) {
		return new Set();
	}
	if (!("operator" in formula) || typeof formula.operator !== "string") {
		return new Set();
	}

	const f = formula as Record<string, unknown>;
	const op = f.operator as string;
	const allStates = new Set(structure.states.map((s) => s.name));

	switch (op) {
	case "literal": {
		const value = Boolean(f.value);
		return value ? allStates : new Set();
	}

	case "variable": {
		const varName = f.variable as string;
		const result = new Set<string>();
		for (const state of structure.states) {
			if (Boolean(state.labels[varName])) {
				result.add(state.name);
			}
		}
		return result;
	}

	case "not": {
		const operandSat = evalCTL(f.operand, structure, cache);
		return new Set([...allStates].filter((s) => !operandSat.has(s)));
	}

	case "and": {
		const operands = f.operands as unknown[];
		if (operands.length === 0) return allStates;
		let result = evalCTL(operands[0], structure, cache);
		for (let i = 1; i < operands.length; i++) {
			const nextSat = evalCTL(operands[i], structure, cache);
			result = new Set([...result].filter((s) => nextSat.has(s)));
		}
		return result;
	}

	case "or": {
		const operands = f.operands as unknown[];
		if (operands.length === 0) return new Set();
		let result = evalCTL(operands[0], structure, cache);
		for (let i = 1; i < operands.length; i++) {
			const nextSat = evalCTL(operands[i], structure, cache);
			nextSat.forEach((s) => result.add(s));
		}
		return result;
	}

	case "implies": {
		const operands = f.operands as unknown[];
		if (operands.length < 2) return allStates;
		const antecedentSat = evalCTL(operands[0], structure, cache);
		const consequentSat = evalCTL(operands[1], structure, cache);
		const result = new Set<string>();
		for (const state of allStates) {
			if (!antecedentSat.has(state) || consequentSat.has(state)) {
				result.add(state);
			}
		}
		return result;
	}

	// LTL operators treated as state-local (not path-quantified in Kripke structure)
	case "globally":
	case "always":
	case "finally":
	case "eventually":
	case "next":
	case "until": {
		// For LTL operators in CTL mode, evaluate as if on a single path (degenerate to state-local)
		const operandSat = op === "until" && "operands" in f && Array.isArray(f.operands)
			? evalCTL((f.operands as unknown[])[1] ?? f.operands[0], structure, cache)
			: "operand" in f
				? evalCTL(f.operand, structure, cache)
				: new Set<string>();
		return operandSat;
	}

	// CTL path quantifier operators
	case "forall-next": // AX(p): all successors satisfy p
	case "exists-next": // EX(p): some successor satisfies p
	{
		const operandSat = evalCTL(f.operand, structure, cache);
		const result = new Set<string>();

		for (const state of structure.states) {
			const successors = structure.transitions.get(state.name) ?? [];

			if (op === "forall-next") {
				// All successors must satisfy
				if (successors.length === 0 || successors.every((s) => operandSat.has(s))) {
					result.add(state.name);
				}
			} else {
				// Some successor must satisfy
				if (successors.some((s) => operandSat.has(s))) {
					result.add(state.name);
				}
			}
		}
		return result;
	}

	case "forall-globally": // AG(p): all paths globally satisfy p
	{
		const operandSat = evalCTL(f.operand, structure, cache);
		// AG(p) = states from which all reachable states satisfy p
		// Compute using greatest fixpoint: start with all states, remove those that violate
		let result = new Set(allStates);

		let changed = true;
		while (changed) {
			changed = false;
			for (const stateName of allStates) {
				if (!result.has(stateName)) continue;
				// State stays in result only if it satisfies p AND all successors stay in result
				if (!operandSat.has(stateName)) {
					result.delete(stateName);
					changed = true;
					continue;
				}
				const successors = structure.transitions.get(stateName) ?? [];
				for (const succ of successors) {
					if (!result.has(succ)) {
						result.delete(stateName);
						changed = true;
						break;
					}
				}
			}
		}
		return result;
	}

	case "exists-globally": // EG(p): some path where p always holds
	{
		const operandSat = evalCTL(f.operand, structure, cache);
		// EG(p) = states that can reach a cycle where all states satisfy p
		// Compute using greatest fixpoint
		let result = new Set(operandSat);

		let changed = true;
		while (changed) {
			changed = false;
			for (const stateName of allStates) {
				if (result.has(stateName)) continue;
				// State can be added if it satisfies p AND has a successor in result
				if (!operandSat.has(stateName)) continue;
				const successors = structure.transitions.get(stateName) ?? [];
				if (successors.some((s) => result.has(s))) {
					result.add(stateName);
					changed = true;
				}
			}
		}
		return result;
	}

	case "forall-finally": // AF(p): on all paths, p eventually holds
	{
		const operandSat = evalCTL(f.operand, structure, cache);
		// AF(p) = least fixpoint: states from which p is unavoidable
		// Start with states satisfying p, add predecessors until convergence
		let result = new Set(operandSat);

		let changed = true;
		while (changed) {
			changed = false;
			for (const stateName of allStates) {
				if (result.has(stateName)) continue;
				// Add state if all successors lead to result
				const successors = structure.transitions.get(stateName) ?? [];
				if (successors.length === 0 || successors.every((s) => result.has(s))) {
					result.add(stateName);
					changed = true;
				}
			}
		}
		return result;
	}

	case "exists-finally": // EF(p): on some path, p eventually holds
	{
		const operandSat = evalCTL(f.operand, structure, cache);
		// EF(p) = states from which p is reachable
		// BFS from states satisfying p
		let result = new Set<string>(operandSat);
		const queue = [...result];

		while (queue.length > 0) {
			const current = queue.shift();
			// Add predecessors
			for (const state of structure.states) {
				if (result.has(state.name)) continue;
				const successors = structure.transitions.get(state.name) ?? [];
				if (successors.includes(current!)) {
					result.add(state.name);
					queue.push(state.name);
				}
			}
		}
		return result;
	}

	case "forall-until": // AU(p,q): on all paths, q holds and p holds until then
	{
		const operands = f.operands as unknown[];
		if (operands.length < 2) return new Set();
		const pSat = evalCTL(operands[0], structure, cache);
		const qSat = evalCTL(operands[1], structure, cache);

		// AU(p,q): least fixpoint
		// States where either q holds, or p holds and all successors satisfy AU(p,q)
		let result = new Set(qSat);

		let changed = true;
		while (changed) {
			changed = false;
			for (const stateName of allStates) {
				if (result.has(stateName)) continue;
				// Add state if p holds and all successors are in result
				if (!pSat.has(stateName)) continue;
				const successors = structure.transitions.get(stateName) ?? [];
				if (successors.length === 0 || successors.every((s) => result.has(s))) {
					result.add(stateName);
					changed = true;
				}
			}
		}
		return result;
	}

	case "exists-until": // EU(p,q): on some path, q holds and p holds until then
	{
		const operands = f.operands as unknown[];
		if (operands.length < 2) return new Set();
		const pSat = evalCTL(operands[0], structure, cache);
		const qSat = evalCTL(operands[1], structure, cache);

		// EU(p,q): greatest fixpoint
		// States where either q holds, or p holds and has some successor in result
		let result = new Set(qSat);

		let changed = true;
		while (changed) {
			changed = false;
			for (const stateName of allStates) {
				if (result.has(stateName)) continue;
				// Add state if p holds and some successor is in result
				if (!pSat.has(stateName)) continue;
				const successors = structure.transitions.get(stateName) ?? [];
				if (successors.some((s) => result.has(s))) {
					result.add(stateName);
					changed = true;
				}
			}
		}
		return result;
	}

	default:
		return new Set();
	}
}
