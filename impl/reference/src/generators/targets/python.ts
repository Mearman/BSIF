// BSIF Reference Implementation - Python Test Generator

import type { BSIFDocument, StateMachine, Temporal, Constraints, Events, Interaction } from "../../schemas.js";
import { isStateMachine, isTemporal, isConstraints, isEvents, isInteraction } from "../../schemas.js";
import type { TestGenerator, GeneratedTestSuite } from "../test-generator.js";

export class PythonGenerator implements TestGenerator {
	readonly targetLanguage = "python";
	private readonly framework: string;

	constructor(framework: string) {
		this.framework = framework;
	}

	generate(doc: BSIFDocument): GeneratedTestSuite {
		const files = new Map<string, string>();
		const dependencies: string[] = [this.framework];
		const specName = doc.metadata.name.replace(/-/g, "_");

		if (isStateMachine(doc.semantics)) {
			files.set(`test_${specName}_state_machine.py`, this.generateStateMachineTests(doc.semantics, specName));
		} else if (isTemporal(doc.semantics)) {
			files.set(`test_${specName}_temporal.py`, this.generateTemporalTests(doc.semantics, specName));
			dependencies.push("hypothesis");
		} else if (isConstraints(doc.semantics)) {
			files.set(`test_${specName}_constraints.py`, this.generateConstraintTests(doc.semantics, specName));
		} else if (isEvents(doc.semantics)) {
			files.set(`test_${specName}_events.py`, this.generateEventTests(doc.semantics, specName));
		} else if (isInteraction(doc.semantics)) {
			files.set(`test_${specName}_interaction.py`, this.generateInteractionTests(doc.semantics, specName));
		}

		return { files, dependencies };
	}

	private generateStateMachineTests(sm: StateMachine, specName: string): string {
		const lines: string[] = [
			`"""Generated tests for state machine: ${specName}"""`,
			`import pytest`,
			``,
			``,
			`STATES = ${JSON.stringify(sm.states.map((s) => s.name))}`,
			`INITIAL = ${JSON.stringify(sm.initial)}`,
			`TRANSITIONS = ${JSON.stringify(sm.transitions.map((t) => ({ from: t.from, to: t.to, event: t.event })))}`,
			``,
			``,
			`def test_initial_state_is_valid():`,
			`    assert INITIAL in STATES`,
			``,
			``,
		];

		for (const t of sm.transitions) {
			const testName = `test_transition_${t.from}_to_${t.to}`.replace(/-/g, "_");
			lines.push(
				`def ${testName}():`,
				`    transition = next((t for t in TRANSITIONS if t["from"] == ${JSON.stringify(t.from)} and t["event"] == ${JSON.stringify(t.event)}), None)`,
				`    assert transition is not None`,
				`    assert transition["to"] == ${JSON.stringify(t.to)}`,
				``,
				``,
			);
		}

		lines.push(
			`def test_all_states_reachable():`,
			`    reachable = {INITIAL}`,
			`    queue = [INITIAL]`,
			`    while queue:`,
			`        current = queue.pop(0)`,
			`        for t in TRANSITIONS:`,
			`            if t["from"] == current and t["to"] not in reachable:`,
			`                reachable.add(t["to"])`,
			`                queue.append(t["to"])`,
			`    for state in STATES:`,
			`        assert state in reachable, f"State {state} is not reachable"`,
			``,
		);

		if (sm.final && sm.final.length > 0) {
			lines.push(
				``,
				`def test_final_states_are_valid():`,
				`    final_states = ${JSON.stringify(sm.final)}`,
				`    for f in final_states:`,
				`        assert f in STATES`,
				``,
			);
		}

		return lines.join("\n");
	}

	private generateTemporalTests(temporal: Temporal, specName: string): string {
		const lines: string[] = [
			`"""Generated tests for temporal properties: ${specName}"""`,
			`import pytest`,
			`from hypothesis import given, strategies as st`,
			``,
			``,
			`VARIABLES = ${JSON.stringify(Object.keys(temporal.variables))}`,
			``,
			``,
		];

		for (const prop of temporal.properties) {
			const testName = `test_property_${prop.name}`.replace(/-/g, "_");
			lines.push(
				`def ${testName}():`,
				`    """${prop.name}"""`,
				`    formula = ${JSON.stringify(prop.formula)}`,
				`    assert formula is not None`,
				`    assert "operator" in formula`,
				``,
				``,
			);
		}

		return lines.join("\n");
	}

	private generateConstraintTests(constraints: Constraints, specName: string): string {
		const lines: string[] = [
			`"""Generated tests for constraints: ${specName}"""`,
			`import pytest`,
			``,
			``,
			`TARGET = ${JSON.stringify(constraints.target)}`,
			``,
			``,
			`def test_target_has_reference():`,
			`    assert len(TARGET) > 0`,
			``,
			``,
		];

		for (const pre of constraints.preconditions) {
			const testName = `test_precondition_${pre.description.replace(/\W+/g, "_").toLowerCase()}`;
			lines.push(
				`def ${testName}():`,
				`    expression = ${JSON.stringify(pre.expression)}`,
				`    assert len(expression) > 0`,
				`    # TODO: implement actual precondition evaluation`,
				``,
				``,
			);
		}

		for (const post of constraints.postconditions) {
			const testName = `test_postcondition_${post.description.replace(/\W+/g, "_").toLowerCase()}`;
			lines.push(
				`def ${testName}():`,
				`    expression = ${JSON.stringify(post.expression)}`,
				`    assert len(expression) > 0`,
				`    # TODO: implement actual postcondition evaluation`,
				``,
				``,
			);
		}

		return lines.join("\n");
	}

	private generateEventTests(events: Events, specName: string): string {
		const lines: string[] = [
			`"""Generated tests for events: ${specName}"""`,
			`import pytest`,
			``,
			``,
			`DECLARED_EVENTS = ${JSON.stringify(Object.keys(events.events))}`,
			`HANDLERS = ${JSON.stringify(events.handlers.map((h) => ({ event: h.event, action: h.action })))}`,
			``,
			``,
			`def test_has_events():`,
			`    assert len(DECLARED_EVENTS) > 0`,
			``,
			``,
		];

		for (const handler of events.handlers) {
			const testName = `test_handles_${handler.event}`.replace(/-/g, "_");
			lines.push(
				`def ${testName}():`,
				`    h = next((h for h in HANDLERS if h["event"] == ${JSON.stringify(handler.event)}), None)`,
				`    assert h is not None`,
				``,
				``,
			);
		}

		return lines.join("\n");
	}

	private generateInteractionTests(interaction: Interaction, specName: string): string {
		const lines: string[] = [
			`"""Generated tests for interaction: ${specName}"""`,
			`import pytest`,
			``,
			``,
			`PARTICIPANTS = ${JSON.stringify(interaction.participants.map((p) => p.name))}`,
			`MESSAGES = ${JSON.stringify(interaction.messages.map((m) => ({ from: m.from, to: m.to, message: m.message })))}`,
			``,
			``,
			`def test_has_participants():`,
			`    assert len(PARTICIPANTS) >= 1`,
			``,
			``,
			`def test_message_senders_are_participants():`,
			`    for msg in MESSAGES:`,
			`        assert msg["from"] in PARTICIPANTS`,
			``,
			``,
			`def test_message_receivers_are_participants():`,
			`    for msg in MESSAGES:`,
			`        assert msg["to"] in PARTICIPANTS`,
			``,
		];

		return lines.join("\n");
	}
}
