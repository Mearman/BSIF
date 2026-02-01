# Cross-Language Logic Specifications: A Survey

**Status:** Research Draft
**Date:** 2025-02-01
**Topic:** Formal specifications for portable application logic

## Abstract

RFC 8785 defines the JSON Canonicalization Scheme (JCS), a deterministic JSON canonicalization algorithm that ensures signatures are reproducible across languages. This document surveys frameworks that extend this concept—defining *logic* rather than just canonicalization—with specifications that can be implemented in any programming language.

These standards share common properties: they provide language-independent specifications (often with formal grammars), define expression/rule semantics, and have multiple independent implementations.

## Introduction

The software industry lacks a single, universal RFC-style specification for "application logic" that can be ported across languages. Instead, we have a landscape of domain-specific standards, formal methods, and intermediate representations—each designed for particular types of logic:

- **Workflow orchestration** (CWL, BPMN, TOSCA)
- **Business decisions and rules** (DMN/FEEL, PRR, RIF)
- **Policy evaluation** (CEL, Rego)
- **Data querying** (JMESPath, JSONata, JsonLogic)
- **API semantics** (GraphQL)
- **Formal verification** (TLA+, B, Z, Alloy)

## Surveyed Specifications

### Expression Languages

#### Common Expression Language (CEL)

**What it is:** A portable expression language designed by Google for embedding predicates, filters, and simple computations inside applications.

**Specification:**
- Grammar, type system, evaluation semantics, and performance characteristics
- Conformance tests available
- Language-neutral design

**Implementations:** Go, C++, Java, C#, Python, Dart, JavaScript/TypeScript, Rust

**Use cases:** Validation rules, security policies, custom configuration filters. Included in Kubernetes for API validation and Firebase security rules.

---

#### Rego (Open Policy Agent)

**What it is:** A declarative policy language where policies describe *what* is allowed rather than *how* to compute it.

**Specification:**
- Policy evaluation logic defined by Rego specification and conformance tests
- WebAssembly compiler for cross-language execution

**Implementations:** Go (core), with Wasm support for Java, Python, .NET, Rust, C++

**Use cases:** Access-control rules, Kubernetes admission policies, infrastructure compliance checks ("policy as code")

---

### Decision and Rule Standards

#### Decision Model and Notation (DMN) & FEEL

**What it is:** An OMG standard for modeling and automating business decisions. Includes the Friendly Enough Expression Language (FEEL) for decision logic.

**Specification:**
- XML schema for decision table interchange
- Precise notation requirements (diagram rendering, element display)
- Conformance levels and test suite for FEEL

**Implementations:** Java (Drools, Camunda, Red Hat), JavaScript/TypeScript, .NET, Go

**Use cases:** Approval processes, risk assessment, loan underwriting, pricing rules

---

#### Production Rule Representation (PRR)

**What it is:** An OMG standard providing vendor-neutral representation for production rules (if-condition-then-action).

**Specification:**
- UML-based metamodel and XML interchange format
- Formalized operational semantics (match, conflict-resolution, action phases)

**Use cases:** Business rule engines (Drools, FICO) where rules must be shared across tools

---

#### Rule Interchange Format (RIF)

**What it is:** A W3C specification for rule language interoperability.

**Specification:**
- Family of dialects (Basic Logic Dialect, Production Rule Dialect, etc.)
- XML and RDF serializations
- Designed as an interlingua for rule translation

**Use cases:** Semantic Web rule interoperability, cross-engine rule exchange

---

### Workflow Standards

#### Common Workflow Language (CWL)

**What it is:** Open standard for describing computational workflows as YAML/JSON documents.

**Specification:**
- Normative keywords (must, error, fatal error)
- `cwlVersion` declaration with validation requirements
- Conformance test suite

**Implementations:** cwltool, Rabix, Toil (language-agnostic runners)

**Use cases:** Scientific data analysis, genomics, reproducible workflows

---

#### Business Process Model and Notation (BPMN 2.0)

**What it is:** OMG standard for modeling business processes with formalized execution semantics.

**Specification:**
- Fully formalized execution semantics and activity lifecycle
- Conformance requirements for execution engines

**Use cases:** Business process automation, workflow orchestration

---

#### Topology and Orchestration Specification for Cloud Applications (TOSCA)

**What it is:** Describes cloud application topologies and lifecycle management processes.

**Specification:**
- `tosca_definitions_version` grammar indication
- Mandatory vs optional key definitions
- Type and inheritance semantics

**Use cases:** Cloud application deployment and orchestration

---

### Data Query Languages

#### JMESPath

**What it is:** Declarative query language for JSON.

**Specification:**
- Complete ABNF grammar
- Compliance test suite
- Type mapping specifications

**Implementations:** Python, Go, Lua, JavaScript, PHP, Ruby, Rust, C++, C#, Java, .NET, TypeScript

**Use cases:** JSON filtering/transformation, AWS CLI queries, configuration files

---

#### JSONata

**What it is:** Lightweight query/transformation language for JSON, inspired by XPath 3.1.

**Specification:**
- Language grammar and semantics
- Operators, functions, user-defined functions

**Implementations:** C, C++, Go, Java, .NET, Python, Rust (plus JavaScript reference)

**Use cases:** JSON payload transformation, API response building, configuration calculations

---

#### JsonLogic

**What it is:** Encodes logic as JSON data (operator key, argument values).

**Specification:**
- Deterministic evaluation (no loops or side effects)
- Pure data rule format

**Implementations:** JavaScript, PHP, Python, Ruby, Go, Java, .NET, C++

**Use cases:** Decision rules stored in databases, cross-environment evaluation (browser/mobile/server)

---

### Other Portable Specifications

| Specification | Domain | Key Feature |
|--------------|--------|-------------|
| **SQL** | Database queries | ANSI/ISO standard with cross-vendor syntax |
| **GraphQL** | API query language | Open spec with reference implementations |
| **Apache Beam** | Data pipelines | Cross-language transforms, portable pipelines |
| **WebAssembly** | Execution runtime | Deterministic semantics across engines |
| **CACAO** | Security playbooks | JSON-based workflow for cybersecurity |
| **RPSL (RFC 2622)** | Routing policies | Network router configuration generation |
| **Ethereum Yellow Paper** | Smart contracts | Formal state-transition function |

---

## Formal Methods

### TLA+ (Temporal Logic of Actions)

**What it is:** High-level formal specification language for concurrent and distributed systems.

**Approach:**
- Describes system designs and correctness properties as mathematical predicates
- Model checker (TLC) exhaustively explores execution traces
- Mathematics-based, language-agnostic

**Use cases:** System design verification, safety/liveness property proving

**Related:** B Method, Z, Alloy

---

## Gap Analysis

### Desired State vs Reality

| Aspect | Desired | Current Reality |
|--------|---------|-----------------|
| **Universal spec** | Single RFC for arbitrary application logic | Domain-specific standards only |
| **Conformance** | Global test suite for all logic | Suites exist only for specific specs (DMN, CWL) |
| **Portability** | Meta-language for all behaviours | Layered approach required |
| **Modeling** | Runnable spec with formal guarantees | Formal methods require translation |

### Why No Universal Specification

1. **Scope Explosion:** "Application behaviour" encompasses UI logic, business rules, persistence, workflows, state machines, concurrency, networking, real-time constraints, etc.

2. **Different Semantics:** A financial backend requires fundamentally different formal semantics than a web UI or network stack.

3. **Formalism vs Usability:** Fully formal languages (TLA+, Z) are powerful but complex; practical standards (CWL, BPMN) sacrifice expressiveness for usability.

4. **Evolution Challenges:** Universal specifications would need rapid evolution—historically difficult in standards bodies.

### Practical Approach: Layered Specifications

| Layer | Specification | Portability |
|-------|---------------|-------------|
| Core algorithms & invariants | TLA+, Alloy | Strong formal guarantees (not executable) |
| Business logic / rules | DMN/PRR | Multi-language engines with conformance |
| Workflows | CWL, BPMN | Portable workflow definitions |
| Execution runtime | WebAssembly | Portable execution semantics |
| Data querying | CEL, JSONata | Widely implemented expression semantics |

---

## Normative Semantics Across Standards

Many of these specifications use RFC 2119 keywords (MUST/SHALL/SHOULD) and provide conformance test suites:

- **CWL:** `cwlVersion` declaration, normative keywords (must, error, fatal error)
- **DMN:** Prescribed diagram rendering, FEEL conformance tests
- **GraphQL:** Normative requirements with RFC 2119 interpretation
- **BPMN:** Execution semantics and activity lifecycle requirements
- **PRR:** Operational phase formalization (match, conflict-resolution, action)
- **RIF:** Uniform syntactic/semantic apparatus across dialects

---

## Summary

**What we have:**
- Domain-specific formal specs with normative semantics
- Formal modelling languages (TLA+, B, Z, Alloy)
- Some conformance test suites
- Multiple implementations in many languages

**What we don't have:**
- A single universal RFC-like spec for arbitrary application behaviour
- A global conformance test suite for entire application logic
- A meta-language covering every behavioural domain

**Key Takeaway:** Rather than seeking a universal "application behaviour RFC," practitioners should combine layered approaches: formal models for core algorithms, domain-specific standards for particular logic types, and portable intermediate representations for execution.

---

## References

- RFC 8785: JSON Canonicalization Scheme (JCS)
- cel.dev - Common Expression Language
- openpolicyagent.org - OPA/Rego
- omg.org - DMN, PRR, BPMN specifications
- w3.org - RIF specification
- commonwl.org - Common Workflow Language
- jmespath.org - JMESPath specification
- jsonlogic.com - JsonLogic
- lamport.azurewebsites.net - TLA+ resources
- webassembly.github.io - WebAssembly specification
- beam.apache.org - Apache Beam
- ethereum.org - Ethereum Yellow Paper
