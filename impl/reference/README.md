# @bsif/reference

BSIF Reference Implementation - Parser, validator, and CLI tool for the Behavioral Specification Interchange Format.

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
# Validate a BSIF document
npm run bsif validate path/to/spec.bsif.json

# Check semantic validity
npm run bsif check path/to/spec.bsif.json

# Format a BSIF document
npm run bsif format path/to/spec.bsif.json
```

## Project Structure

```
src/
├── index.ts              # Main exports
├── types.ts              # BSIF type definitions
├── errors.ts             # Error types
├── schemas.ts            # Zod schemas with type guards
├── parser.ts             # JSON/YAML parser
├── validator.ts          # Schema + semantic validation
├── cli.ts                # CLI entry point
└── commands/
    ├── validate.ts       # validate command
    ├── check.ts          # check command (semantic validation)
    └── format.ts         # format command
```

## License

MIT
