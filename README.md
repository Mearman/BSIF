# prog-spec

**Research project exploring language-agnostic, formal specifications for program behavior.**

---

## Overview

**prog-spec** is a research project investigating how to define formal, testable specifications for program behavior that work across programming languages.

**The Core Question:** *How can we define a specification for "Program X performs action Y" such that any implementation in any programming language can be tested against it?*

---

## Research Goal

Current software lacks a universal, RFC-style specification for **application behavior** that can be:
- **Language-agnostic** — works with any programming language
- **Formal** — mathematically precise, not just natural language
- **Testable** — automated verification against implementations
- **Behavioral** — defines what the program does (not just data structures)

---

## What We've Found

### The Landscape is Fragmented

| Domain | Tools | Status |
|--------|-------|--------|
| **API Behavior** | Pact, OpenAPI | Mature |
| **Concurrent Systems** | TLA+ | Mature |
| **State Machines** | SCXML, UML | Mature |
| **Functional Properties** | QuickCheck, Hypothesis | Mature |
| **Formal Verification** | Z, B, VDM, Dafny, F* | Academic/Niche |
| **AI/ML Systems** | Marabou, fairness tools | Emerging |

### The Gaps

| Gap | Impact | Status |
|-----|--------|--------|
| **Universal behavioral spec language** | Very High | No candidates exist |
| **Standard interchange format** | High | Completely missing |
| **Package repository for specs** | Medium | No npm-for-specs exists |
| **Executable semantics for formal specs** | High | Research stage |
| **AI/ML verification** | High | Early research |
| **Resource/performance verification** | Medium | Research stage |

### The Recommendation

**No single tool solves all problems.** The future is **layered specifications**:
- **Property-Based Testing** for functional properties
- **Contract Testing** for API boundaries
- **Formal Methods** (TLA+, Alloy) for critical components
- **State Machines** (SCXML) for complex behavior

---

## Research Documents

All research is documented in the **[docs/research/](docs/research/)** directory:

### Quick Start

| Document | Purpose |
|----------|---------|
| **[Executive Summary](docs/research/reference/executive-summary.md)** | 5-minute overview |
| **[Gap Analysis](docs/research/surveys/gap-analysis.md)** | What's missing and why |
| **[Tool Selection Guide](docs/research/guides/tool-selection-guide.md)** | Choose the right tools |
| **[Layered Specs Guide](docs/research/guides/layered-specifications-guide.md)** | Implementation patterns |

### Core Research

- **[Cross-Language Logic Specifications](docs/research/surveys/cross-language-logic-specifications.md)** — Survey of portable logic frameworks (CEL, Rego, DMN, CWL, BPMN, etc.)
- **[Testable Program Specifications](docs/research/surveys/testable-program-specifications.md)** — Comprehensive survey with tooling and capability analysis
- **[Gap Analysis](docs/research/surveys/gap-analysis.md)** — Consolidated gaps and missing tooling

### Design Proposals

- **[Interchange Format Design](docs/research/design/interchange-format-design.md)** — Requirements for behavioral spec interchange (learning from SMT-LIB, LLVM IR, WebAssembly)
- **[Spec Registry Design](docs/research/design/spec-registry-design.md)** — Package repository design for specifications

### Deep Dives

- **[Executable Semantics](docs/research/deep-dives/executable-semantics-report.md)** — Making Z, B, VDM executable
- **[Industry Adoption](docs/research/deep-dives/industry-adoption-case-studies.md)** — MongoDB/TLA+, Microsoft/Pact, Amazon/AWS
- **[AI/ML Verification](docs/research/deep-dives/ai-ml-verification-landscape.md)** — Neural network verification tools
- **[Cyber-Physical Systems](docs/research/deep-dives/cyber-physical-systems-tools.md)** — Hybrid automata, dReal, KeYmaera X
- **[Emerging Developments](docs/research/deep-dives/emerging-developments-2024-2025.md)** — New tools, standards, trends

### See Also

- **[docs/research/README.md](docs/research/README.md)** — Full research index
- **[References](docs/research/reference/references.md)** — 170+ consolidated references

---

## Key Takeaways

1. **No universal behavioral spec language exists** — use layered approach
2. **Primary gap is standardization** — tools exist but don't interoperate
3. **AI integration is the 2025 trend** — NL→Spec, AI-assisted proofs
4. **Industry adoption is real and growing** — MongoDB, Microsoft, Amazon, Intel
5. **Formal methods are becoming more accessible** — better tools, IDE support

---

## Status

| Category | Status |
|----------|--------|
| **Survey of existing frameworks** | ✅ Complete |
| **Tooling ecosystem analysis** | ✅ Complete |
| **Capability analysis** | ✅ Complete |
| **Gap identification** | ✅ Complete |
| **Industry adoption research** | ✅ Complete |
| **Design proposals** | ✅ Complete |
| **Practical guides** | ✅ Complete |

---

## Related Work

This research builds on:

- **RFC 8785** — JSON Canonicalization Scheme (JCS)
- **SMT-LIB** — SMT solver interchange format
- **LLVM IR** — Compiler intermediate representation
- **WebAssembly** — Cross-browser execution semantics
- **OpenAPI Initiative** — API specification standard

---

## License

Research documentation © 2025
