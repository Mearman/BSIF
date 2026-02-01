# BSIF: Behavioral Specification Interchange Format

**Status:** Research & Design Phase
**Started:** 2025
**Topic:** Universal format for language-agnostic program behavior specifications

---

## The Problem

Software lacks a universal way to specify program behavior that works across programming languages.

We have specifications for:
- **Data** — JSON Schema, Protocol Buffers, Apache Avro
- **APIs** — OpenAPI, GraphQL, gRPC
- **Infrastructure** — Terraform, Kubernetes manifests

But we have **nothing** for specifying **what programs do** in a language-agnostic way.

> "Program X must maintain invariant Y under condition Z" — how do you write this
> once, then verify against implementations in Go, Rust, Python, and Java?

---

## What We're Building

**BSIF (Behavioral Specification Interchange Format)**

A universal format for behavioral specifications — like JSON Schema for data, but for what programs **DO**.

State machines, temporal logic, constraints, event handling — all in one interoperable format that any tool can read, any language can implement.

Write your behavioral specification once, verify it against any implementation.

---

## How BSIF Compares to Existing Tools

| Aspect | BSIF | Existing Tools |
|--------|------|----------------|
| **Scope** | Universal: state machines, temporal logic, constraints, events, interactions | Fragmented: each tool covers one domain |
| **Language** | Language-agnostic format, any implementation language | Tied to specific ecosystems or requires per-language binding |
| **Interoperability** | Standard interchange format, tools can work together | Proprietary formats, isolated ecosystems |
| **Composition** | Specs can reference and extend other specs | No standard for composition |
| **Reuse** | SpecRegistry for sharing (future) | No sharing mechanism |
| **Verification** | Generate tests for any language | Verification tied to specific tools/languages |

### Why Existing Tools Fall Short

| Tool | What It Does | Limitation |
|------|--------------|------------|
| **TLA+** | Model checking for concurrent systems | Domain-specific, steep learning curve, tied to TLA+ toolchain |
| **Pact** | Consumer-driven API contracts | HTTP/messaging only, doesn't verify general behavior |
| **SCXML** | State machine execution | State machines only, limited to control flow |
| **QuickCheck/Hypothesis** | Property-based testing | Per-language implementation, no portable spec format |
| **OpenAPI** | REST API specification | Request/response only, not behavioral semantics |
| **Alloy** | Structural modeling | No executable semantics, no test generation |
| **Z Notation / B Method** | Formal specification | Not executable, no industry tooling, academic |
| **CEL / Rego** | Portable expression languages | Decision logic only, not full behavior |

**The Gap:** No single format captures general behavioral semantics in a way that's:
- Formal enough for verification
- Portable across tools
- Implementable in any language

---

## BSIF Feature List

### Core Capabilities

| ID | Feature | Priority |
|----|---------|----------|
| **BSIF-001** | State machine specifications (states, transitions, hierarchy) | Must |
| **BSIF-002** | Temporal logic specifications (LTL, CTL) | Must |
| **BSIF-003** | Event-driven behavior specifications | Must |
| **BSIF-004** | Interaction/protocol specifications | Must |
| **BSIF-005** | Constraint specifications (pre/post, invariants) | Must |
| **BSIF-006** | Data type specifications | Must |
| **BSIF-007** | Concurrency specifications | Should |
| **BSIF-008** | Real-time/timing constraints | Should |

### Format Requirements

| ID | Feature | Priority |
|----|---------|----------|
| **BSIF-009** | Human-readable (text-based format) | Must |
| **BSIF-010** | Machine-parseable (unambiguous grammar) | Must |
| **BSIF-011** | Versioning with compatibility guarantees | Must |
| **BSIF-012** | Composition (specs referencing specs) | Must |
| **BSIF-013** | Metadata (name, version, description, license) | Must |
| **BSIF-014** | Tool-specific mappings/extensions | Should |
| **BSIF-015** | Conformance test suite | Must |

### Semantic Coverage

| Category | Must Support | Should Support |
|----------|--------------|-----------------|
| **State Machines** | States, transitions, conditions, hierarchy | Concurrent states |
| **Temporal Logic** | LTL operators, safety/liveness | CTL operators |
| **Events** | Definitions, handlers, propagation | Filtering, correlation |
| **Interactions** | Sequences, protocols | Security properties |
| **Constraints** | Pre/post conditions, invariants | Resource constraints |
| **Data** | Types, values, schemas | Generics, polymorphism |
| **Concurrency** | Parallel composition | Synchronization |
| **Real-time** | Deadlines, timing constraints | Periodic tasks |

---

## Status

| Component | Status |
|-----------|--------|
| **Requirements specification** | ✅ Complete |
| **Survey of existing frameworks** | ✅ Complete |
| **Gap analysis** | ✅ Complete |
| **BSIF format design** | 🔄 In Progress |
| **Reference implementation** | ⏳ Not Started |
| **Conformance tests** | ⏳ Not Started |

---

## Documentation

- **[Requirements Specification](docs/specification.md)** — Complete BSIF requirements
- **[Gap Analysis](docs/research/surveys/gap-analysis.md)** — What's missing and why
- **[Interchange Format Design](docs/research/design/interchange-format-design.md)** — BSIF design requirements
- **[Testable Program Specifications](docs/research/surveys/testable-program-specifications.md)** — Framework survey
- **[Executive Summary](docs/research/reference/executive-summary.md)** — 5-minute overview
- **[Research Index](docs/research/README.md)** — All research documents

---

## Contributing

This is active research. Discussion and collaboration welcome.

---

## License

Research and specification documentation © 2025
