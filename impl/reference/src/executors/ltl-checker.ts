// BSIF Reference Implementation - LTL Trace Checker
// Checks LTL properties against finite traces

import type { Temporal } from "../schemas.js";

//==============================================================================
// Types
//==============================================================================

export interface TraceStep {
	readonly variables: Record<string, boolean | number | string>;
}

export interface CheckResult {
	readonly property: string;
	readonly satisfied: boolean;
	readonly violationStep?: number;
	readonly message?: string;
}

//==============================================================================
// Checker
//==============================================================================

export function checkTrace(spec: Temporal, trace: readonly TraceStep[]): readonly CheckResult[] {
	const results: CheckResult[] = [];

	for (const prop of spec.properties) {
		const result = evaluateProperty(prop.name, prop.formula, trace, 0);
		results.push(result);
	}

	return results;
}

function evaluateProperty(
	propertyName: string,
	formula: unknown,
	trace: readonly TraceStep[],
	step: number,
): CheckResult {
	const satisfied = evaluateFormula(formula, trace, step);
	const message = satisfied
		? `Property "${propertyName}" is satisfied`
		: `Property "${propertyName}" violated`;
	if (satisfied) {
		return { property: propertyName, satisfied, message };
	}
	const violationStep = findViolationStep(formula, trace);
	if (violationStep !== undefined) {
		return { property: propertyName, satisfied, violationStep, message };
	}
	return { property: propertyName, satisfied, message };
}

function evaluateFormula(formula: unknown, trace: readonly TraceStep[], step: number): boolean {
	if (typeof formula !== "object" || formula === null) return false;
	if (!("operator" in formula)) return false;

	const f = formula as Record<string, unknown>;
	const op = f.operator as string;

	switch (op) {
	case "literal":
		return Boolean(f.value);

	case "variable": {
		if (step >= trace.length) return false;
		const varName = f.variable as string;
		const traceStep = trace[step];
		if (!traceStep) return false;
		const value = traceStep.variables[varName];
		return Boolean(value);
	}

	case "not":
		return !evaluateFormula(f.operand, trace, step);

	case "and": {
		const operands = f.operands as unknown[];
		return operands.every((operand) => evaluateFormula(operand, trace, step));
	}

	case "or": {
		const operands = f.operands as unknown[];
		return operands.some((operand) => evaluateFormula(operand, trace, step));
	}

	case "implies": {
		const operands = f.operands as unknown[];
		if (operands.length < 2) return true;
		const antecedent = evaluateFormula(operands[0], trace, step);
		const consequent = evaluateFormula(operands[1], trace, step);
		return !antecedent || consequent;
	}

	case "globally":
	case "always":
		// G(P): P holds at every step from current to end
		for (let i = step; i < trace.length; i++) {
			if (!evaluateFormula(f.operand, trace, i)) return false;
		}
		return true;

	case "finally":
	case "eventually":
		// F(P): P holds at some step from current to end
		for (let i = step; i < trace.length; i++) {
			if (evaluateFormula(f.operand, trace, i)) return true;
		}
		return false;

	case "next":
		// X(P): P holds at next step (weak next — true at end of trace)
		if (step + 1 >= trace.length) return true;
		return evaluateFormula(f.operand, trace, step + 1);

	case "until": {
		// P U Q: Q holds at some future step, and P holds at all steps until then
		const operands = f.operands as unknown[];
		if (operands.length < 2) return false;
		for (let i = step; i < trace.length; i++) {
			if (evaluateFormula(operands[1], trace, i)) return true;
			if (!evaluateFormula(operands[0], trace, i)) return false;
		}
		return false;
	}

	default:
		return false;
	}
}

function findViolationStep(formula: unknown, trace: readonly TraceStep[]): number | undefined {
	if (typeof formula !== "object" || formula === null) return 0;
	if (!("operator" in formula)) return 0;

	const f = formula as Record<string, unknown>;
	const op = f.operator as string;

	if (op === "globally" || op === "always") {
		for (let i = 0; i < trace.length; i++) {
			if (!evaluateFormula(f.operand, trace, i)) return i;
		}
	}

	return 0;
}
