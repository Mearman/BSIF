// BSIF Reference Implementation - Migration: v0.9.0 to v1.0.0

import { registerMigration } from "./registry.js";

registerMigration({
	fromVersion: "0.9.0",
	toVersion: "1.0.0",
	transform(doc: unknown): unknown {
		if (typeof doc !== "object" || doc === null) return doc;
		const d = doc as Record<string, unknown>;
		const metadata = d.metadata as Record<string, unknown> | undefined;
		if (metadata) {
			metadata.bsif_version = "1.0.0";
		}
		return d;
	},
	describe(): string {
		return "Migrate from v0.9.0 to v1.0.0: update bsif_version field";
	},
});
