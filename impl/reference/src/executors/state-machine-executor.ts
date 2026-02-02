// BSIF Reference Implementation - State Machine Executor
// Executes state machine specifications

import type { StateMachine } from "../schemas.js";

//==============================================================================
// Types
//==============================================================================

export interface TimingViolation {
	readonly state: string;
	readonly type: "deadline" | "timeout";
	readonly elapsed: number;
	readonly limit: number;
	readonly unit?: string | undefined;
}

export interface StateMachineInstance {
	readonly currentState: string;
	readonly history: readonly string[];
	readonly actions: readonly string[];
	readonly elapsedTime: number;  // Virtual elapsed time in current state (in ms)
	send(event: string): StateMachineInstance;
	canSend(event: string): boolean;
	isInFinalState(): boolean;
	tick(elapsed: number): StateMachineInstance;
	getTimingViolations(): readonly TimingViolation[];
}

//==============================================================================
// Implementation
//==============================================================================

export function createStateMachine(spec: StateMachine): StateMachineInstance {
	return new StateMachineInstanceImpl(spec, spec.initial, [spec.initial], []);
}

class StateMachineInstanceImpl implements StateMachineInstance {
	private readonly spec: StateMachine;
	readonly currentState: string;
	readonly history: readonly string[];
	readonly actions: readonly string[];
	readonly elapsedTime: number;  // Virtual time in current state (ms)

	constructor(spec: StateMachine, currentState: string, history: readonly string[], actions: readonly string[], elapsedTime: number = 0) {
		this.spec = spec;
		this.currentState = currentState;
		this.history = history;
		this.actions = actions;
		this.elapsedTime = elapsedTime;
	}

	send(event: string): StateMachineInstance {
		// Find matching transitions from current state
		const matchingTransitions = this.spec.transitions.filter(
			(t) => t.from === this.currentState && t.event === event,
		);

		if (matchingTransitions.length === 0) {
			throw new Error(`No transition from state "${this.currentState}" for event "${event}"`);
		}

		// Find first transition whose guard passes (or has no guard)
		const transition = matchingTransitions.find((t) => !t.guard || evaluateGuard(t.guard));

		if (!transition) {
			throw new Error(`No valid transition from state "${this.currentState}" for event "${event}" (all guards failed)`);
		}

		// Collect actions
		const newActions: string[] = [...this.actions];

		// Exit action of current state
		const currentStateObj = this.spec.states.find((s) => s.name === this.currentState);
		if (currentStateObj?.exit) {
			newActions.push(currentStateObj.exit);
		}

		// Transition action
		if (transition.action) {
			newActions.push(transition.action);
		}

		// Entry action of target state
		const targetStateObj = this.spec.states.find((s) => s.name === transition.to);
		if (targetStateObj?.entry) {
			newActions.push(targetStateObj.entry);
		}

		// Reset elapsed time on state transition
		return new StateMachineInstanceImpl(
			this.spec,
			transition.to,
			[...this.history, transition.to],
			newActions,
			0,  // Reset elapsed time
		);
	}

	canSend(event: string): boolean {
		return this.spec.transitions.some(
			(t) => t.from === this.currentState && t.event === event,
		);
	}

	isInFinalState(): boolean {
		if (!this.spec.final) return false;
		return this.spec.final.includes(this.currentState);
	}

	tick(elapsed: number): StateMachineInstance {
		// Advance virtual time, remaining in same state
		return new StateMachineInstanceImpl(
			this.spec,
			this.currentState,
			this.history,
			this.actions,
			this.elapsedTime + elapsed,
		);
	}

	getTimingViolations(): readonly TimingViolation[] {
		const violations: TimingViolation[] = [];
		const currentStateObj = this.spec.states.find((s) => s.name === this.currentState);

		if (currentStateObj?.timing) {
			const timing = currentStateObj.timing;
			const convertToMs = (value: number, unit?: string): number => {
				if (!unit) return value;
				switch (unit) {
					case "ns": return value / 1_000_000;
					case "us": return value / 1_000;
					case "ms": return value;
					case "s": return value * 1_000;
					default: return value;
				}
			};

			if (timing.deadline !== undefined) {
				const deadlineMs = convertToMs(timing.deadline, timing.unit);
				if (this.elapsedTime > deadlineMs) {
					violations.push({
						state: this.currentState,
						type: "deadline",
						elapsed: this.elapsedTime,
						limit: deadlineMs,
						unit: timing.unit,
					});
				}
			}

			if (timing.timeout !== undefined) {
				const timeoutMs = convertToMs(timing.timeout, timing.unit);
				if (this.elapsedTime > timeoutMs) {
					violations.push({
						state: this.currentState,
						type: "timeout",
						elapsed: this.elapsedTime,
						limit: timeoutMs,
						unit: timing.unit,
					});
				}
			}
		}

		// Also check transition-level timing
		const transition = this.spec.transitions.find((t) => t.from === this.currentState);
		if (transition?.timing) {
			const timing = transition.timing;
			const convertToMs = (value: number, unit?: string): number => {
				if (!unit) return value;
				switch (unit) {
					case "ns": return value / 1_000_000;
					case "us": return value / 1_000;
					case "ms": return value;
					case "s": return value * 1_000;
					default: return value;
				}
			};

			if (timing.deadline !== undefined) {
				const deadlineMs = convertToMs(timing.deadline, timing.unit);
				if (this.elapsedTime > deadlineMs) {
					violations.push({
						state: this.currentState,
						type: "deadline",
						elapsed: this.elapsedTime,
						limit: deadlineMs,
						unit: timing.unit,
					});
				}
			}

			if (timing.timeout !== undefined) {
				const timeoutMs = convertToMs(timing.timeout, timing.unit);
				if (this.elapsedTime > timeoutMs) {
					violations.push({
						state: this.currentState,
						type: "timeout",
						elapsed: this.elapsedTime,
						limit: timeoutMs,
						unit: timing.unit,
					});
				}
			}
		}

		return violations;
	}
}

function evaluateGuard(guard: string): boolean {
	// Simple guard evaluation — in a full implementation this would parse and evaluate
	// For now, all non-empty guards are treated as passing
	return guard.trim().length > 0;
}
