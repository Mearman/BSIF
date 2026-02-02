// BSIF Reference Implementation - SCXML Mapper

import type { BSIFDocument } from "../schemas.js";
import type { BSIFMetadata } from "../schemas.js";
import { isStateMachine } from "../schemas.js";
import type { Mapper } from "./mapper.js";

export class SCXMLMapper implements Mapper<string> {
	readonly toolName = "scxml";
	readonly supportedTypes = ["state-machine"];

	fromBSIF(doc: BSIFDocument): string {
		if (!isStateMachine(doc.semantics)) {
			throw new Error("SCXML mapper only supports state-machine semantics");
		}

		const sm = doc.semantics;
		const lines: string[] = [];

		lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
		lines.push(`<scxml xmlns="http://www.w3.org/2005/07/scxml" version="1.0" initial="${escapeXml(sm.initial)}" name="${escapeXml(doc.metadata.name)}">`);

		// Build parent-child map
		const childMap = new Map<string | undefined, typeof sm.states>();
		for (const state of sm.states) {
			const parent = state.parent;
			if (!childMap.has(parent)) {
				childMap.set(parent, []);
			}
			childMap.get(parent)!.push(state);
		}

		const finalStates = new Set(sm.final ?? []);

		// Render states recursively
		const renderState = (state: typeof sm.states[0], indent: string): void => {
			const children = childMap.get(state.name) ?? [];
			const isFinal = finalStates.has(state.name);
			const tag = isFinal ? "final" : state.parallel ? "parallel" : "state";

			if (children.length === 0) {
				// Leaf state
				const transitions = sm.transitions.filter((t) => t.from === state.name);

				if (transitions.length === 0 && !state.entry && !state.exit) {
					lines.push(`${indent}<${tag} id="${escapeXml(state.name)}" />`);
				} else {
					lines.push(`${indent}<${tag} id="${escapeXml(state.name)}">`);

					if (state.entry) {
						lines.push(`${indent}  <onentry><script>${escapeXml(state.entry)}</script></onentry>`);
					}
					if (state.exit) {
						lines.push(`${indent}  <onexit><script>${escapeXml(state.exit)}</script></onexit>`);
					}

					for (const t of transitions) {
						const eventAttr = t.event ? ` event="${escapeXml(t.event)}"` : "";
						const condAttr = t.guard ? ` cond="${escapeXml(t.guard)}"` : "";
						lines.push(`${indent}  <transition target="${escapeXml(t.to)}"${eventAttr}${condAttr} />`);
					}

					lines.push(`${indent}</${tag}>`);
				}
			} else {
				// Parent state with children
				lines.push(`${indent}<${tag} id="${escapeXml(state.name)}">`);

				if (state.entry) {
					lines.push(`${indent}  <onentry><script>${escapeXml(state.entry)}</script></onentry>`);
				}

				for (const child of children) {
					renderState(child, indent + "  ");
				}

				// Transitions from this state
				const transitions = sm.transitions.filter((t) => t.from === state.name);
				for (const t of transitions) {
					const eventAttr = t.event ? ` event="${escapeXml(t.event)}"` : "";
					const condAttr = t.guard ? ` cond="${escapeXml(t.guard)}"` : "";
					lines.push(`${indent}  <transition target="${escapeXml(t.to)}"${eventAttr}${condAttr} />`);
				}

				if (state.exit) {
					lines.push(`${indent}  <onexit><script>${escapeXml(state.exit)}</script></onexit>`);
				}

				lines.push(`${indent}</${tag}>`);
			}
		};

		// Render top-level states (those without parents)
		const topLevel = childMap.get(undefined) ?? [];
		for (const state of topLevel) {
			renderState(state, "  ");
		}

		lines.push(`</scxml>`);
		return lines.join("\n");
	}

	toBSIF(input: string, metadata?: Partial<BSIFMetadata>): BSIFDocument {
		// Basic SCXML → BSIF parsing (extracts state/transition structure)
		const states: Array<{ name: string; parent?: string }> = [];
		const transitions: Array<{ from: string; to: string; event?: string; guard?: string }> = [];

		// Extract states
		const stateRegex = /<(?:state|parallel|final)\s+id="([^"]+)"/g;
		let match;
		while ((match = stateRegex.exec(input)) !== null) {
			states.push({ name: match[1]! });
		}

		// Extract initial
		const initialMatch = /initial="([^"]+)"/.exec(input);
		const initial = initialMatch ? initialMatch[1]! : states[0]?.name ?? "init";

		// Extract transitions
		let currentState = "";
		const lines = input.split("\n");
		for (const line of lines) {
			const stateMatch = /<(?:state|parallel|final)\s+id="([^"]+)"/.exec(line);
			if (stateMatch) {
				currentState = stateMatch[1]!;
			}
			const transMatch = /target="([^"]+)"/.exec(line);
			if (transMatch && line.includes("<transition")) {
				const eventMatch = /event="([^"]*)"/.exec(line);
				const condMatch = /cond="([^"]*)"/.exec(line);
				const entry: { from: string; to: string; event?: string; guard?: string } = {
					from: currentState,
					to: transMatch[1]!,
				};
				if (eventMatch?.[1] !== undefined) entry.event = eventMatch[1];
				if (condMatch?.[1] !== undefined) entry.guard = condMatch[1];
				transitions.push(entry);
			}
		}

		return {
			metadata: {
				bsif_version: "1.0.0",
				name: metadata?.name ?? "imported-scxml",
				version: metadata?.version,
				description: metadata?.description ?? "Imported from SCXML",
			},
			semantics: {
				type: "state-machine",
				states: states.map((s) => ({ name: s.name, parent: s.parent })),
				transitions,
				initial,
			},
		};
	}
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
