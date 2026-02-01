# @bsif/reference

BSIF Reference Implementation — Parser, validator, and CLI tool for the Behavioral Specification Interchange Format.

## Installation

```bash
npm install
```

## Development

```bash
# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npm run typecheck

# Full CI
npm run ci
```

## CLI Usage

```bash
# Validate a BSIF document against schema
npm run bsif validate path/to/spec.bsif.json

# Check semantic validity (deeper analysis)
npm run bsif check path/to/spec.bsif.json

# Format a BSIF document
npm run bsif format path/to/spec.bsif.json

# Convert between JSON and YAML
npm run bsif convert spec.bsif.json --output spec.bsif.yaml
npm run bsif convert spec.bsif.yaml spec.bsif.json
npm run bsif convert spec.bsif.json --format=yaml
```

### Commands

| Command | Description |
|---------|-------------|
| `validate <file>` | Validate BSIF document against JSON schema |
| `check <file>` | Validate schema + semantic rules |
| `format <file>` | Pretty-print BSIF document to stdout |
| `convert <input> [output]` | Convert between JSON and YAML formats |

### Convert Options

| Option | Description |
|--------|-------------|
| `--format=<json\|yaml>` | Target format (auto-detected from output extension if omitted) |
| `--output=<path>`, `-o` | Output file path (prints to stdout if omitted) |

## API

The reference implementation exports the following from `src/index.ts`:

```typescript
import { parseFile, parseContent } from "@bsif/reference";
import { validate } from "@bsif/reference";
import { isBSIFDocument, isStateMachine, isTemporal, isConstraints, isEvents, isInteraction, isHybrid } from "@bsif/reference";
```

### `parseFile(filePath: string): Promise<unknown>`

Reads and parses a `.bsif.json` or `.bsif.yaml` file.

### `parseContent(content: string, filename: string): unknown`

Parses a BSIF document string. Format is detected from the filename extension.

### `validate(doc: unknown, options?: { checkSemantics?: boolean }): ValidationResult`

Validates a parsed document. Returns `{ valid: boolean, errors: ValidationError[] }`.

- Without `checkSemantics`: validates against JSON schema only
- With `checkSemantics: true`: also validates semantic rules (state reachability, variable references, etc.)

### Type Guards

All semantic types have corresponding type guards:

```typescript
if (isStateMachine(doc.semantics)) { /* narrowed to StateMachine */ }
if (isTemporal(doc.semantics))     { /* narrowed to Temporal */ }
if (isConstraints(doc.semantics))  { /* narrowed to Constraints */ }
if (isEvents(doc.semantics))       { /* narrowed to Events */ }
if (isInteraction(doc.semantics))  { /* narrowed to Interaction */ }
if (isHybrid(doc.semantics))       { /* narrowed to Hybrid */ }
```

## Error Codes

### Parser Errors (E001–E006)

| Code | Name | Description |
|------|------|-------------|
| E001 | MissingMetadata | Document lacks `metadata` field |
| E002 | MissingSemantics | Document lacks `semantics` field |
| E003 | InvalidType | Unrecognized semantic type |
| E004 | InvalidSyntax | General syntax error |
| E005 | InvalidJson | Malformed JSON |
| E006 | InvalidYaml | Malformed YAML |

### Schema Validation Errors (E010–E014)

| Code | Name | Description |
|------|------|-------------|
| E010 | MissingRequiredField | Required field is missing |
| E011 | InvalidFieldValue | Field value doesn't match schema |
| E012 | TypeMismatch | Value has wrong type |
| E013 | PatternMismatch | Value doesn't match pattern |
| E014 | InvalidSemver | `bsif_version` is not valid semver |

### Semantic Validation Errors (E100–E119)

| Code | Name | Applies To | Description |
|------|------|-----------|-------------|
| E100 | StateNotFound | state-machine | Referenced state doesn't exist |
| E101 | InitialStateMissing | state-machine | Initial state not found in states list |
| E102 | CircularStateReference | state-machine | Circular state hierarchy detected |
| E103 | InvalidTransition | state-machine | Transition references invalid state |
| E104 | VariableNotDefined | state-machine | Variable used but not declared |
| E105 | InvalidLTLFormula | temporal | Malformed LTL formula |
| E106 | EventNotFound | events | Referenced event doesn't exist |
| E107 | ParticipantNotFound | interaction | Referenced participant doesn't exist |
| E108 | DuplicateName | all | Duplicate name within scope |
| E109 | UndefinedVariable | temporal | Variable referenced but not declared |
| E110 | IncompatibleTypes | temporal | Variable type mismatch |
| E111 | InvalidExpression | constraints | Malformed constraint expression |
| E112 | InvalidTargetReference | constraints | Target reference doesn't resolve |
| E113 | UndefinedEvent | events | Handler references undeclared event |
| E114 | PayloadTypeMismatch | events | Event payload type mismatch |
| E115 | UnusedEventDeclaration | events | Event declared but no handler uses it (warning) |
| E116 | UndefinedParticipant | interaction | Message references undeclared participant |
| E117 | InvalidMessageSequence | interaction | Invalid message ordering |
| E118 | InvalidComponentType | hybrid | Component has invalid semantic type |
| E119 | VersionMismatch | all | Incompatible `bsif_version` |

### General Validation Errors (E200–E201)

| Code | Name | Description |
|------|------|-------------|
| E200 | ValidationFailed | General validation failure |
| E201 | SemanticError | General semantic error |

## Semantic Validation Rules

The `check` command runs semantic validation beyond schema conformance:

### State Machine
- Initial state must exist in states list
- All transition `from`/`to` must reference existing states
- No duplicate state names
- Final states (if declared) must exist

### Temporal Logic
- All variables referenced in formulas must be declared
- No duplicate property names

### Constraints
- Expression syntax validation (balanced parentheses, valid operators)

### Events
- All handler `event` fields must reference declared events
- Warns on declared events with no handlers

### Interaction
- All message `from`/`to` fields must reference declared participants

### Hybrid
- All components must have a valid semantic `type`
- Validates each component with its type-specific rules

## Project Structure

```
src/
├── index.ts              # Main exports
├── types.ts              # BSIF type definitions
├── errors.ts             # Error types and codes
├── schemas.ts            # Zod schemas with type guards
├── parser.ts             # JSON/YAML parser
├── validator.ts          # Schema + semantic validation
├── cli.ts                # CLI entry point
└── commands/
    ├── validate.ts       # validate command
    ├── check.ts          # check command (semantic validation)
    ├── format.ts         # format command
    └── convert.ts        # convert command (JSON ↔ YAML)

test/
├── fixtures/             # Test BSIF documents
├── *.unit.test.ts        # Unit tests
└── integration/
    ├── cli.integration.test.ts       # CLI command tests
    └── workflow.integration.test.ts  # End-to-end workflow tests
```

## License

MIT
