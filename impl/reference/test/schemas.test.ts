// BSIF Reference Implementation - Schema Tests

import { describe, it } from "node:test";
import assert from "node:assert";
import {
	bsifMetadata,
	stateMachine,
	isBSIFMetadata,
	isStateMachine,
} from "../src/schemas.js";

describe("Schemas", () => {
	describe("bsifMetadata", () => {
		it("accepts valid metadata", () => {
			const valid = {
				bsif_version: "1.0.0",
				name: "test-spec",
			};

			const result = bsifMetadata.safeParse(valid);

			assert.strictEqual(result.success, true);
		});

		it("rejects missing required fields", () => {
			const invalid = {
				name: "test-spec",
			};

			const result = bsifMetadata.safeParse(invalid);

			assert.strictEqual(result.success, false);
		});

		it("rejects invalid semver", () => {
			const invalid = {
				bsif_version: "not-a-version",
				name: "test-spec",
			};

			const result = bsifMetadata.safeParse(invalid);

			assert.strictEqual(result.success, false);
		});
	});

	describe("isBSIFMetadata type guard", () => {
		it("returns true for valid metadata", () => {
			const valid = {
				bsif_version: "1.0.0",
				name: "test-spec",
			};

			assert.strictEqual(isBSIFMetadata(valid), true);
		});

		it("returns false for invalid metadata", () => {
			const invalid = {
				name: "test-spec",
			};

			assert.strictEqual(isBSIFMetadata(invalid), false);
		});
	});

	describe("stateMachine", () => {
		it("accepts valid state machine", () => {
			const valid = {
				type: "state-machine" as const,
				states: [{ name: "idle" }],
				transitions: [],
				initial: "idle",
			};

			const result = stateMachine.safeParse(valid);

			assert.strictEqual(result.success, true);
		});

		it("rejects missing initial state", () => {
			const invalid = {
				type: "state-machine" as const,
				states: [{ name: "idle" }],
				transitions: [],
			};

			const result = stateMachine.safeParse(invalid);

			assert.strictEqual(result.success, false);
		});
	});

	describe("isStateMachine type guard", () => {
		it("narrows type correctly", () => {
			const valid = {
				type: "state-machine" as const,
				states: [{ name: "idle" }],
				transitions: [],
				initial: "idle",
			};

			if (isStateMachine(valid)) {
				assert.strictEqual(valid.type, "state-machine");
				assert.strictEqual(valid.initial, "idle");
			} else {
				assert.fail("Should be a state machine");
			}
		});
	});
});
