# SpecLang: GitHub Next's Natural Language Programming

**Status:** Research Report
**Date:** 2025-02-01
**Topic:** AI-powered natural language specifications for code generation
**Source:** https://githubnext.com/projects/speclang/

---

## Executive Summary

SpecLang is a GitHub Next research prototype exploring whether software can be developed entirely in natural language, with an AI toolchain managing the implementation. Developers write structured Markdown-like "specs" as the single source of truth; AI generates the executable code. Currently scoped to React Native mobile apps with live preview.

---

## Core Concept

SpecLang asks: **"Can we develop software entirely in natural language, and let an AI-powered toolchain manage the implementation?"**

Key framing: This is "prose code, not no code." Developers still write detailed specifications—the medium shifts from programming languages to natural language, but the rigor of expression remains.

---

## How It Works

1. Developer writes a **spec**—a structured Markdown-like document describing desired behavior
2. Specs range from brief ("At the bottom show two buttons 'Cancel' and 'Submit'") to detailed procedural descriptions
3. AI transforms specifications into executable code
4. Developer iterates based on running output

The spec is the **single source of truth**. Generated code is an artifact, not a maintainable asset.

---

## Design Principles

| Principle | Description | Relevance to BSIF |
|-----------|-------------|-------------------|
| **Iterative feedback loops** | Start minimal, refine based on running application | BSIF focuses on upfront completeness; SpecLang embraces progressive refinement |
| **Bi-directional ideation** | AI suggests improvements and flags areas needing precision | BSIF verification is one-directional (spec → implementation check) |
| **Intent-based expression** | Developers describe behavior; AI handles technical plumbing | BSIF requires explicit behavioral contracts with formal semantics |

---

## Comparison with BSIF

| Dimension | SpecLang | BSIF |
|-----------|----------|------|
| **Purpose** | Generate code from specs | Verify implementations against specs |
| **Spec format** | Natural language Markdown | Formal YAML/structured format |
| **Language scope** | React Native (current) | Language-agnostic |
| **AI role** | Core (generates implementation) | Optional (verification tooling) |
| **Spec precision** | Intentionally ambiguous, refined iteratively | Formally precise, machine-verifiable |
| **Interchange** | No interchange format | Standard interchange format (BSIF) |
| **Registry** | None | SpecRegistry with versioning and signing |
| **Verification** | Visual/manual (live preview) | Automated (test generation, model checking) |
| **Maturity** | Research prototype | Requirements specification |

---

## Key Observations

### Complementary Approaches

SpecLang and BSIF address different parts of the specification lifecycle:

- **SpecLang** targets the *authoring* experience—making it easy to express intent
- **BSIF** targets the *verification* experience—making it possible to prove correctness

A combined approach could use natural language authoring (SpecLang-style) to produce formal specifications (BSIF-format) that are then verified against implementations.

### Limitations of Natural Language Specs

SpecLang's reliance on AI interpretation introduces ambiguity that formal methods aim to eliminate. For safety-critical or high-assurance systems, BSIF's formal approach is necessary. For rapid prototyping and UI development, SpecLang's approach reduces friction.

### "Creation by Reacting"

SpecLang introduces the concept of **"creation by reacting"**—leveraging the AI's ability to guess intent without requiring complete upfront specification. This is fundamentally different from formal methods where incomplete specifications are a defect, not a feature.

---

## Relevance to This Project

| Aspect | Takeaway |
|--------|----------|
| **Authoring UX** | Natural language specs reduce barrier to entry; BSIF authoring tools should consider similar approaches |
| **Progressive refinement** | Specs don't need to be complete on first draft; tooling should support iterative improvement |
| **AI integration** | AI can bridge natural language intent and formal specification; potential for BSIF authoring assistants |
| **Live preview** | Immediate feedback on spec changes improves quality; applicable to BSIF verification tooling |

---

## References

- GitHub Next SpecLang Project: https://githubnext.com/projects/speclang/
- GitHub Next Team: @GitHubNext / next@github.com
