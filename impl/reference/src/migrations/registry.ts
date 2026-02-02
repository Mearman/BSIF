// BSIF Reference Implementation - Migration Registry

export interface MigrationStep {
	readonly fromVersion: string;
	readonly toVersion: string;
	transform(doc: unknown): unknown;
	describe(): string;
}

const migrations: MigrationStep[] = [];

export function registerMigration(step: MigrationStep): void {
	migrations.push(step);
}

export function getMigrations(): readonly MigrationStep[] {
	return [...migrations];
}

export function migrate(
	doc: unknown,
	targetVersion: string,
): { document: unknown; steps: readonly MigrationStep[] } {
	// Extract current version
	let currentVersion = "0.0.0";
	if (typeof doc === "object" && doc !== null && "metadata" in doc) {
		const metadata = (doc as Record<string, unknown>).metadata;
		if (typeof metadata === "object" && metadata !== null && "bsif_version" in metadata) {
			currentVersion = String((metadata as Record<string, unknown>).bsif_version);
		}
	}

	const appliedSteps: MigrationStep[] = [];
	let current = doc;

	// Apply migrations in order
	for (const step of migrations) {
		if (step.fromVersion === currentVersion || versionLessThan(currentVersion, step.toVersion)) {
			if (versionLessThanOrEqual(step.toVersion, targetVersion)) {
				current = step.transform(current);
				appliedSteps.push(step);
				currentVersion = step.toVersion;
			}
		}
	}

	return { document: current, steps: appliedSteps };
}

function versionLessThan(a: string, b: string): boolean {
	const pa = a.split(".").map(Number);
	const pb = b.split(".").map(Number);
	for (let i = 0; i < 3; i++) {
		if ((pa[i] ?? 0) < (pb[i] ?? 0)) return true;
		if ((pa[i] ?? 0) > (pb[i] ?? 0)) return false;
	}
	return false;
}

function versionLessThanOrEqual(a: string, b: string): boolean {
	return a === b || versionLessThan(a, b);
}
