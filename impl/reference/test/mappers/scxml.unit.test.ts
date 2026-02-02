// BSIF Reference Implementation - SCXML Mapper Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import { SCXMLMapper } from "../../src/mappers/scxml.js";
import type { BSIFDocument } from "../../src/schemas.js";

describe("SCXML Mapper", () => {
	const mapper = new SCXMLMapper();

	it("converts state machine to SCXML", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "traffic-light", version: "1.0.0", description: "Test" },
			semantics: {
				type: "state-machine",
				states: [{ name: "red" }, { name: "green" }, { name: "yellow" }],
				transitions: [
					{ from: "red", to: "green", event: "timer" },
					{ from: "green", to: "yellow", event: "timer" },
					{ from: "yellow", to: "red", event: "timer" },
				],
				initial: "red",
			},
		};

		const scxml = mapper.fromBSIF(doc);
		assert.ok(scxml.includes('<?xml version="1.0"'));
		assert.ok(scxml.includes('<scxml'));
		assert.ok(scxml.includes('initial="red"'));
		assert.ok(scxml.includes('id="red"'));
		assert.ok(scxml.includes('id="green"'));
		assert.ok(scxml.includes('<transition'));
		assert.ok(scxml.includes('target="green"'));
		assert.ok(scxml.includes('</scxml>'));
	});

	it("handles hierarchical states", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "nested", version: "1.0.0", description: "Test" },
			semantics: {
				type: "state-machine",
				states: [
					{ name: "on" },
					{ name: "heating", parent: "on" },
					{ name: "cooling", parent: "on" },
				],
				transitions: [
					{ from: "heating", to: "cooling", event: "temp_reached" },
				],
				initial: "heating",
			},
		};

		const scxml = mapper.fromBSIF(doc);
		assert.ok(scxml.includes('id="on"'));
		assert.ok(scxml.includes('id="heating"'));
		assert.ok(scxml.includes('id="cooling"'));
	});

	it("handles parallel states", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "parallel-test", version: "1.0.0", description: "Test" },
			semantics: {
				type: "state-machine",
				states: [
					{ name: "main", parallel: true },
					{ name: "region-a", parent: "main" },
					{ name: "region-b", parent: "main" },
				],
				transitions: [],
				initial: "main",
			},
		};

		const scxml = mapper.fromBSIF(doc);
		assert.ok(scxml.includes('<parallel'));
	});

	it("round-trips through SCXML", () => {
		const doc: BSIFDocument = {
			metadata: { bsif_version: "1.0.0", name: "simple", version: "1.0.0", description: "Test" },
			semantics: {
				type: "state-machine",
				states: [{ name: "idle" }, { name: "active" }],
				transitions: [{ from: "idle", to: "active", event: "start" }],
				initial: "idle",
			},
		};

		const scxml = mapper.fromBSIF(doc);
		const roundTripped = mapper.toBSIF(scxml, { name: "simple" });
		assert.strictEqual(roundTripped.semantics.type, "state-machine");
	});
});
