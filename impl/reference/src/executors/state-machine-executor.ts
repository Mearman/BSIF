// BSIF Reference Implementation - State Machine Executor
// Executes state machine specifications

import type { StateMachine } from "../schemas.js";

//==============================================================================
// Types
//==============================================================================

export interface StateMachineInstance {
	readonly currentState: string;
	readonly history: readonly string[];
	readonly actions: readonly string[];
	send(event: string): StateMachineInstance;
	canSend(event: string): boolean;
	isInFinalState(): boolean;
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

	constructor(spec: StateMachine, currentState: string, history: readonly string[], actions: readonly string[]) {
		this.spec = spec;
		this.currentState = currentState;
		this.history = history;
		this.actions = actions;
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

		return new StateMachineInstanceImpl(
			this.spec,
			transition.to,
			[...this.history, transition.to],
			newActions,
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
}

function evaluateGuard(guard: string): boolean {
	// Simple guard evaluation — in a full implementation this would parse and evaluate
	// For now, all non-empty guards are treated as passing
	return guard.trim().length > 0;
}
