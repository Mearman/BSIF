# Research: Language-Agnostic Program Specifications

**Status:** Active Research
**Last Updated:** 2025-02-01
**Topic:** Formal, language-agnostic specifications for testable program behavior

---

## Overview

This directory contains research on formal specifications for program behavior that can be tested against implementations regardless of programming language.

**Research Goal:** Define a specification for "Program X performs action Y" such that any implementation in any language can be tested against it.

---

## Directory Structure

```
docs/research/
├── README.md                           # This file
├── surveys/                             # Core research surveys
├── design/                              # Design proposals
├── deep-dives/                          # Specialized research
├── guides/                              # Practical guides
└── reference/                           # Supporting docs
```

---

## Documents

### 📊 Surveys (Core Research)

| Document | Lines | Description |
|----------|-------|-------------|
| **[Cross-Language Logic Specifications](surveys/cross-language-logic-specifications.md)** | 294 | Survey of frameworks for portable logic (CEL, Rego, DMN, CWL, BPMN, etc.) |
| **[Testable Program Specifications](surveys/testable-program-specifications.md)** | 1400+ | Comprehensive survey of testable specifications with tooling details |
| **[Gap Analysis](surveys/gap-analysis.md)** | 500+ | Consolidated gaps and missing tooling |

### 🎨 Design Proposals

| Document | Description |
|----------|-------------|
| **[Interchange Format Design](design/interchange-format-design.md)** | Requirements for behavioral specification interchange format (SMT-LIB, LLVM IR, WebAssembly analysis) |
| **[Spec Registry Design](design/spec-registry-design.md)** | Package repository design for specifications (like npm for specs) |

### 🔍 Deep Dives (Specialized Research)

| Document | Description |
|----------|-------------|
| **[Executable Semantics Report](deep-dives/executable-semantics-report.md)** | Making Z notation, B Method, VDM executable |
| **[Industry Adoption Case Studies](deep-dives/industry-adoption-case-studies.md)** | MongoDB/TLA+, Microsoft/Pact, Amazon/AWS, Intel/Siemens |
| **[AI/ML Verification Landscape](deep-dives/ai-ml-verification-landscape.md)** | Neural network verification tools (Marabou, fairness, robustness) |
| **[Cyber-Physical Systems Tools](deep-dives/cyber-physical-systems-tools.md)** | Hybrid automata tools (SpaceEx, PHAVer, dReal, KeYmaera X) |
| **[Emerging Developments 2024-2025](deep-dives/emerging-developments-2024-2025.md)** | New tools, standards, trends |

### 📚 Practical Guides

| Document | Description |
|----------|-------------|
| **[Tool Selection Guide](guides/tool-selection-guide.md)** | Decision tree for choosing specification tools |
| **[Layered Specifications Guide](guides/layered-specifications-guide.md)** | Implementation patterns for PBT + contracts + formal methods |

### 📖 Reference (Supporting Docs)

| Document | Description |
|----------|-------------|
| **[Executive Summary](reference/executive-summary.md)** | High-level 5-minute overview |
| **[References](reference/references.md)** | Consolidated bibliography (170+ references) |
| **[RFC Publication Process](reference/rfc-publication-process.md)** | RFC/I-D workflow (reference for standardization) |

---

## Quick Start

### New to Formal Specifications?

Start here:
1. **[Executive Summary](reference/executive-summary.md)** - 5-minute overview
2. **[Gap Analysis](surveys/gap-analysis.md)** - What's missing and why it matters
3. **[Tool Selection Guide](guides/tool-selection-guide.md)** - Choose the right tools

### Want to Get Started?

1. **[Layered Specifications Guide](guides/layered-specifications-guide.md)** - Implementation patterns
2. **[Industry Case Studies](deep-dives/industry-adoption-case-studies.md)** - Learn from others' experience

### Interested in Specific Topics?

| Topic | Document | Section |
|-------|----------|---------|
| **API Contracts** | [Testable Program Specifications](surveys/testable-program-specifications.md) | Section 3.2 |
| **Concurrent Systems** | [Testable Program Specifications](surveys/testable-program-specifications.md) | Section 4.1 (TLA+) |
| **State Machines** | [Testable Program Specifications](surveys/testable-program-specifications.md) | Section 5.1 (SCXML) |
| **Property-Based Testing** | [Testable Program Specifications](surveys/testable-program-specifications.md) | Section 2 |
| **Formal Verification** | [Testable Program Specifications](surveys/testable-program-specifications.md) | Section 4 |
| **Tooling Details** | [Testable Program Specifications](surveys/testable-program-specifications.md) | Section 11 |
| **Capability Matrices** | [Testable Program Specifications](surveys/testable-program-specifications.md) | Section 12 |

---

## Key Findings

### What Exists

| Category | Options | Maturity |
|----------|---------|----------|
| **API Behavior** | Pact, OpenAPI | High |
| **Concurrent Systems** | TLA+ | High |
| **State Machines** | SCXML, UML | High |
| **Property-Based Testing** | QuickCheck, Hypothesis | High |
| **Formal Verification** | Z, B, VDM | Academic |
| **Data Querying** | CEL, JSONata, JMESPath | High |

### What's Missing

| Gap | Impact | Status |
|-----|--------|--------|
| **Universal behavioral spec language** | Very High | No candidates |
| **Standard interchange format** | High | Completely missing |
| **Package repository for specs** | Medium | Completely missing |
| **Executable semantics for Z/B/VDM** | High | Research stage |
| **Resource/performance verification** | Medium | Research stage |
| **AI/ML verification** | High | Early research |

---

## Research Status

| Category | Status |
|----------|--------|
| **Survey of existing frameworks** | ✅ Complete |
| **Tooling ecosystem analysis** | ✅ Complete |
| **Capability analysis** | ✅ Complete |
| **Gap identification** | ✅ Complete |
| **Industry adoption research** | ✅ Complete |
| **AI/ML verification landscape** | ✅ Complete |
| **Interchange format design** | ✅ Complete |
| **Package repository design** | ✅ Complete |
| **Practical guides** | ✅ Complete |

---

## Decision Guide

### What Should I Use?

**For API Specifications:**
- Pact (consumer-driven contracts)
- OpenAPI (REST API specification)

**For Concurrent/Distributed Systems:**
- TLA+ (model checking)

**For State Machines:**
- SCXML (executable state charts)

**For Functional Properties:**
- QuickCheck/Hypothesis (property-based testing)

**For Safety-Critical Code:**
- SPARK (Ada)
- JML (Java)
- ACSL (C)

**For Structural Validation:**
- Alloy (relational modeling)
- OCL (UML constraints)

---

## Contributing

This is active research. Contributions welcome:
- Additional framework surveys
- Tooling updates
- Case studies
- Corrections and improvements

---

## References

See **[References](reference/references.md)** for complete bibliography.

Key standards and organizations:
- **RFC Editor**: [rfc-editor.org](https://www.rfc-editor.org/)
- **OMG**: [omg.org](https://www.omg.org/) (DMN, BPMN, UML)
- **W3C**: [w3.org](https://www.w3.org/) (SCXML)
- **OpenAPI Initiative**: [openapis.org](https://www.openapis.org/)

---

## License

Research documentation © 2025

