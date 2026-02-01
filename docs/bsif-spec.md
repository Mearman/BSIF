# BSIF: Behavioral Specification Interchange Format

**Status:** Draft Specification
**Version:** 1.0.0-draft
**Date:** 2025-02-01
**Format:** JSON (primary), YAML (alternative)

---

## Abstract

BSIF (Behavioral Specification Interchange Format) is a language-agnostic format for specifying program behavior that enables interoperability between verification tools, test generators, and runtime monitors across programming language boundaries. This document specifies the formal syntax, semantics, and conformance requirements for BSIF.

BSIF addresses the lack of a universal format for behavioral specifications analogous to JSON Schema for data structures or OpenAPI for REST APIs. It provides a standardized representation for state machines, temporal logic properties, event-driven behavior, interaction protocols, and constraints that can be authored once and verified against implementations in any programming language.

This specification defines:
1. A formal grammar in EBNF for unambiguous parsing
2. Mathematical semantics for each behavioral category
3. JSON and YAML serialization formats
4. Versioning and composition mechanisms
5. Security and conformance requirements

---

## Copyright Notice

Copyright (c) 2025 BSIF Contributors

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Definitions and Notation](#2-definitions-and-notation)
3. [Normative References](#3-normative-references)
4. [Formal Grammar](#4-formal-grammar)
5. [Formal Semantics](#5-formal-semantics)
6. [Format Specification](#6-format-specification)
7. [Versioning and Compatibility](#7-versioning-and-compatibility)
8. [Security Considerations](#8-security-considerations)
9. [IANA Considerations](#9-iana-considerations)
10. [Conformance Requirements](#10-conformance-requirements)

---

## 1. Introduction

### 1.1 Scope

BSIF specifies a format for behavioral semantics that:
- Describes **what programs do** (behavior), not **what data looks like** (structure)
- Is **language-agnostic** — independent of any programming language
- Has **formal mathematical semantics** enabling automated verification
- Supports **composition** — specifications can reference and extend other specifications
- Enables **interoperability** — tools can work together using a common format

### 1.2 Motivation

Software development has standardized formats for:
- **Data**: JSON Schema, Protocol Buffers, Apache Avro
- **APIs**: OpenAPI, GraphQL, gRPC
- **Infrastructure**: Terraform, Kubernetes manifests

But **no standard exists** for specifying **behavioral semantics** in a language-agnostic way.

Consequences:
- Specifications are tied to specific programming languages
- Verification tools cannot interoperate
- Tests cannot be generated from formal specifications
- Runtime monitors cannot be derived from specifications
- Teams must re-specify behavior for each language implementation

### 1.3 Target Use Cases

| Use Case | Example |
|----------|---------|
| **Cross-language verification** | Specify once, verify implementations in Go, Rust, Python, Java |
| **Test generation** | Generate property-based tests from temporal specifications |
| **Runtime monitoring** | Generate runtime assertions from state machine specifications |
| **Documentation** | Auto-generate behavioral documentation from formal specs |
| **Tool interoperability** | Chain model checkers, test generators, static analyzers |

### 1.4 Non-Goals

BSIF does **NOT**:
- Specify a new behavioral specification language (it's an **interchange format**)
- Replace existing formal methods (TLA+, Z, Alloy, etc.)
- Define verification algorithms (that's for tools)
- Specify execution semantics (specs describe, tools execute)

---

## 2. Definitions and Notation

### 2.1 Key Terms

| Term | Definition |
|------|------------|
| **Specification** | A formal description of required behavior |
| **Behavior** | The observable actions of a system over time |
| **Semantics** | The mathematical meaning of a specification |
| **Well-formed** | Syntactically valid per the grammar |
| **Valid** | Well-formed and satisfies all semantic constraints |
| **Composition** | Combining specifications by reference |
| **Extension** | Creating a new specification that specializes another |

### 2.2 RFC 2119 Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

### 2.3 Mathematical Notation

| Notation | Meaning |
|----------|---------|
| `σ` | State (valuation of variables) |
| `σ → σ'` | State transition |
| `⟦e⟧` | Semantics (meaning) of expression `e` |
| `s ⊨ φ` | State `s` satisfies formula `φ` |
| `□φ` | Always `φ` (LTL globally) |
| `◇φ` | Eventually `φ` (LTL finally) |
| `φ U ψ` | `φ` until `ψ` (LTL until) |
| `∀x. φ` | For all `x`, `φ` holds (universal quantifier) |
| `∃x. φ` | There exists `x` such that `φ` holds (existential quantifier) |

---

## 3. Normative References

| Reference | Description |
|-----------|-------------|
| [RFC2119] | Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997. |
| [RFC8174] | Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words", BCP 14, RFC 8174, May 2017. |
| [RFC8259] | Bray, T., Ed., "The JavaScript Object Notation (JSON) Data Interchange Format", RFC 8259, December 2017. |
| [RFC9512] | Bray, T., Ed., "JSON Schema: A Media Type for Describing JSON Documents", RFC 9512, January 2024. |
| [YAML1.2] | Ben-Kiki, O., Evans, C., and I. d. Net, "YAML Ain't Markup Language (YAML™) Version 1.2", 3rd Edition, October 2021. |
| [EBNF] | ISO/IEC 14977:1996, "Information technology — Syntactic metalanguage — Extended BNF". |
| [LTL] | Pnueli, A., "The Temporal Logic of Programs", FOCS 1977. |

---

## 4. Formal Grammar

### 4.1 Lexical Syntax

```
<identifier> ::= <letter> | "_" ( <letter> | <digit> | "_" )*

<letter> ::= "A" | "B" | ... | "Z" | "a" | "b" | ... | "z"

<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<string-literal> ::= `"` <string-char>* `"`

<quoted-string> ::= "'" <string-char>* "'"

<string-char> ::= <any Unicode character except '"' or "'"> | <escape-sequence>

<escape-sequence> ::= "\" ( "n" | "t" | "r" | "\" | "'" | "`" )

<integer-literal> ::= <digit>+

<float-literal> ::= <digit>+ "." <digit>+ [ <exponent> ] | <digit>+ <exponent>

<exponent> ::= ( "e" | "E" ) [ "+" | "-" ] <digit>+

<boolean-literal> ::= "true" | "false"

<null-literal> ::= "null"

<comment> ::= "#" <any character until end of line>
```

### 4.2 Concrete Syntax (JSON Structure)

```
<bsif-document> ::=
    "{" "metadata" ":" <metadata-section>
       "," "semantics" ":" <semantics-section>
       [ "," "tools" ":" <tools-section> ]
       [ "," "tests" ":" <tests-section> ]
       [ "," "documentation" ":" <documentation-section> ]
    "}"

<metadata-section> ::=
    "{"
       [ "\"bsif_version\"" ":" <version-string> "," ]
       [ "\"name\"" ":" <string-literal> "," ]
       [ "\"version\"" ":" <version-string> "," ]
       [ "\"description\"" ":" <string-literal> "," ]
       [ "\"author\"" ":" <string-literal> "," ]
       [ "\"license\"" ":" <string-literal> "," ]
       [ "\"references\"" ":" "[" <string-literal> *( "," <string-literal> ) "]" ]
    "}"

<version-string> ::= <string-literal>  // MUST be SemVer 2.0.0 compatible

<semantics-section> ::= <state-machine-spec>
                      | <temporal-spec>
                      | <constraints-spec>
                      | <events-spec>
                      | <interaction-spec>
                      | <hybrid-spec>

<tools-section> ::=
    "{"
       <tool-name> ":" <tool-mapping>
       *( "," <tool-name> ":" <tool-mapping> )
    "}"

<tool-name> ::= <identifier>  // e.g., "tlaplus", "alloy", "scxml"

<tool-mapping> ::= <object>  // Tool-specific format, no constraints

<tests-section> ::=
    "["
       <test-case>
       *( "," <test-case> )
    "]"

<test-case> ::=
    "{"
       "\"name\"" ":" <string-literal> ","
       "\"description\"" ":" <string-literal> ","
       "\"input\"" ":" <object> ","
       "\"expected\"" ":" <object>
    "}"

<documentation-section> ::=
    "{"
       [ "\"overview\"" ":" <string-literal> "," ]
       [ "\"examples\"" ":" "[" <object> *( "," <object> ) "]" ]
    "}"
```

### 4.3 State Machine Syntax

```
<state-machine-spec> ::=
    "{"
       "\"type\"" ":" "\"state-machine\"" ","
       "\"states\"" ":" <states-definition> ","
       "\"transitions\"" ":" <transitions-definition> ","
       [ "\"initial\"" ":" <identifier> "," ]
       [ "\"final\"" ":" "[" <identifier> *( "," <identifier> ) "]" ]
    "}"

<states-definition> ::=
    "["
       <state-definition>
       *( "," <state-definition> )
    "]"

<state-definition> ::=
    "{"
       "\"name\"" ":" <identifier> ","
       [ "\"entry\"" ":" <expression> "," ]
       [ "\"exit\"" ":" <expression> "," ]
       [ "\"parent\"" ":" <identifier> "," ]  // For hierarchical states
       [ "\"parallel\"" ":" <boolean-literal> ]
    "}"

<transitions-definition> ::=
    "["
       <transition-definition>
       *( "," <transition-definition> )
    "]"

<transition-definition> ::=
    "{"
       "\"from\"" ":" <identifier> ","
       "\"to\"" ":" <identifier> ","
       [ "\"event\"" ":" <event-reference> "," ]
       [ "\"guard\"" ":" <expression> "," ]
       [ "\"action\"" ":" <expression> ]
    "}"

<event-reference> ::= <identifier> | <string-literal>

<expression> ::= <string-literal>  // Tool-specific expression syntax
```

### 4.4 Temporal Logic Syntax

```
<temporal-spec> ::=
    "{"
       "\"type\"" ":" "\"temporal\"" ","
       "\"logic\"" ":" ( "\"ltl\"" | "\"ctl\"" ) ","
       "\"variables\"" ":" <variables-definition> ","
       "\"properties\"" ":" <properties-definition>
    "}"

<variables-definition> ::=
    "{"
       <variable-decl>
       *( "," <variable-decl> )
    "}"

<variable-decl> ::=
    <identifier> ":" ( "\"boolean\"" | "\"integer\"" | "\"string\"" | <object-type> )

<object-type> ::=
    "{"
       "\"type\"" ":" "\"object\"" ","
       "\"properties\"" ":" <properties-type-definition>
    "}"

<properties-type-definition> ::=
    "{"
       <property-type-decl>
       *( "," <property-type-decl> )
    "}"

<property-type-decl> ::= <identifier> ":" <type-reference>

<properties-definition> ::=
    "["
       <property-definition>
       *( "," <property-definition> )
    "]"

<property-definition> ::=
    "{"
       "\"name\"" ":" <identifier> ","
       "\"formula\"" ":" <ltl-formula>
    "}"

<ltl-formula> ::=
    "{"
       "\"operator\"" ":" <ltl-operator> ","
       [ "\"operand\"" ":" <ltl-formula> "," ]
       [ "\"operands\"" ":" "[" <ltl-formula> *( "," <ltl-formula> ) "]" "," ]
       [ "\"variable\"" ":" <identifier> "," ]
       [ "\"value\"" ":" <literal> ]
    "}"

<ltl-operator> ::=
      "\"not\"" | "\"and\"" | "\"or\"" | "\"implies\""
    | "\"globally\""      // □
    | "\"finally\""       // ◇
    | "\"until\""         // U
    | "\"next\""          // ○
    | "\"eventually\""    // ◇
    | "\"always\""        // □

<literal> ::= <boolean-literal> | <integer-literal> | <string-literal>
```

### 4.5 Constraints Syntax

```
<constraints-spec> ::=
    "{"
       "\"type\"" ":" "\"constraints\"" ","
       "\"target\"" ":" <target-reference> ","
       "\"preconditions\"" ":" "[" <constraint> *( "," <constraint> ) "]" ","
       "\"postconditions\"" ":" "[" <constraint> *( "," <constraint> ) "]" ","
       [ "\"invariants\"" ":" "[" <constraint> *( "," <constraint> ) "]" ]
    "}"

<target-reference> ::=
    "{"
       [ "\"function\"" ":" <string-literal> "," ]
       [ "\"method\"" ":" <string-literal> "," ]
       [ "\"class\"" ":" <string-literal> "," ]
       [ "\"module\"" ":" <string-literal> ]
    "}"

<constraint> ::=
    "{"
       "\"description\"" ":" <string-literal> ","
       "\"expression\"" ":" <string-literal>
    "}"
```

### 4.6 Events Syntax

```
<events-spec> ::=
    "{"
       "\"type\"" ":" "\"events\"" ","
       "\"events\"" ":" <events-definition> ","
       "\"handlers\"" ":" <handlers-definition>
    "}"

<events-definition> ::=
    "{"
       <event-decl>
       *( "," <event-decl> )
    "}"

<event-decl> ::=
    <identifier> ":"
    "{"
       [ "\"payload\"" ":" <type-definition> "," ]
       [ "\"attributes\"" ":" <object> ]
    "}"

<handlers-definition> ::=
    "["
       <handler-definition>
       *( "," <handler-definition> )
    "]"

<handler-definition> ::=
    "{"
       "\"event\"" ":" <identifier> ","
       [ "\"filter\"" ":" <expression> "," ]
       [ "\"action\"" ":" <expression> "," ]
       [ "\"propagates\"" ":" <boolean-literal> ]
    "}"
```

### 4.7 Interaction/Protocol Syntax

```
<interaction-spec> ::=
    "{"
       "\"type\"" ":" "\"interaction\"" ","
       "\"participants\"" ":" <participants-definition> ","
       "\"messages\"" ":" <messages-definition>
    "}"

<participants-definition> ::=
    "["
       <participant-definition>
       *( "," <participant-definition> )
    "]"

<participant-definition> ::=
    "{"
       "\"name\"" ":" <identifier> ","
       [ "\"role\"" ":" <string-literal> ]
    "}"

<messages-definition> ::=
    "["
       <message-sequence>
       *( "," <message-sequence> )
    "]"

<message-sequence> ::=
    "{"
       "\"from\"" ":" <identifier> ","
       "\"to\"" ":" <identifier> ","
       "\"message\"" ":" <string-literal> ","
       [ "\"payload\"" ":" <type-definition> "," ]
       [ "\"guard\"" ":" <expression> ]
    "}"
```

### 4.8 Hybrid Specification Syntax

```
<hybrid-spec> ::=
    "{"
       "\"type\"" ":" "\"hybrid\"" ","
       "\"components\"" ":" "[" <semantics-section> *( "," <semantics-section> ) "]"
    "}"
```

### 4.9 Abstract Syntax

The abstract syntax defines the semantic structure independent of serialization:

```
BSIFDocument ::= (metadata: Metadata, semantics: Semantics, tools?: Map<ToolID, ToolMapping>, tests?: TestCase[], documentation?: Documentation)

Semantics ::= StateMachine | Temporal | Constraints | Events | Interaction | Hybrid

StateMachine ::= (states: State[], transitions: Transition[], initial: StateID, final?: StateID[])

State ::= (name: StateID, entry?: Expr, exit?: Expr, parent?: StateID, parallel?: Boolean)

Transition ::= (from: StateID, to: StateID, event?: EventRef, guard?: Expr, action?: Expr)

Temporal ::= (logic: LTL | CTL, variables: VariableMap, properties: Property[])

Property ::= (name: Identifier, formula: LTLFormula)

LTLFormula ::= Not(LTLFormula) | And(LTLFormula, LTLFormula) | Or(LTLFormula, LTLFormula)
             | Implies(LTLFormula, LTLFormula)
             | Globally(LTLFormula)      // □
             | Finally(LTLFormula)       // ◇
             | Until(LTLFormula, LTLFormula)
             | Next(LTLFormula)
             | VariableRef(VariableID)
             | Literal(Literal)

Constraints ::= (target: TargetRef, preconditions: Constraint[], postconditions: Constraint[], invariants?: Constraint[])

Constraint ::= (description: String, expression: Expr)

Events ::= (events: Map<EventID, EventDecl>, handlers: Handler[])

EventDecl ::= (payload?: TypeDefinition, attributes?: Map<String, Literal>)

Handler ::= (event: EventID, filter?: Expr, action?: Expr, propagates?: Boolean)

Interaction ::= (participants: Participant[], messages: MessageSequence[])

Participant ::= (name: ParticipantID, role?: String)

MessageSequence ::= (from: ParticipantID, to: ParticipantID, message: String, payload?: TypeDefinition, guard?: Expr)

Hybrid ::= (components: Semantics[])
```

---

## 5. Formal Semantics

### 5.1 State Machine Semantics

A BSIF state machine defines a **labeled transition system** (LTS).

**Definition 5.1.1 (State Machine LTS)**

A state machine specification `M` defines an LTS `T_M = (S, s₀, →, L)` where:
- `S` is the set of states (including configurations for hierarchical states)
- `s₀ ∈ S` is the initial state
- `→ ⊆ S × Event × S` is the transition relation
- `L: S → 2^{AP}` is the labeling function (atomic propositions from entry/exit actions)

**Definition 5.1.2 (Transition Satisfaction)**

A transition `τ = (s_from, s_to, event, guard, action)` is enabled in state `s` iff:
1. `s.current_state = s_from`
2. `⟦guard⟧(s) = true`

When enabled, execution produces `s'` where:
- `s'.current_state = s_to`
- `s'.variables = ⟦action⟧(s.variables)`

**Definition 5.1.3 (Hierarchical States)**

For hierarchical states, the actual state is a **configuration** `C = [s₁, s₂, ..., sₙ]` where:
- `s₁` is the top-level active state
- `sᵢ` is the active substate of `sᵢ₋₁`

Entry/exit actions execute in order:
- Entry: `entry(s₁)`, `entry(s₂)`, ..., `entry(sₙ)`
- Exit: `exit(sₙ)`, ..., `exit(s₂)`, `exit(s₁)`

### 5.2 Temporal Logic Semantics

BSIF temporal specifications are interpreted over **Kripke structures**.

**Definition 5.2.1 (Kripke Structure)**

A temporal specification `P` with variables `V` defines a Kripke structure `K_P = (S, R, L, s₀)` where:
- `S` is the set of states (valuations of variables `V`)
- `R ⊆ S × S` is the transition relation
- `L: S → 2^{AP}` maps states to atomic propositions
- `s₀ ∈ S` is the initial state

**Definition 5.2.2 (Path)**

A path `π` in `K_P` is an infinite sequence `π = s₀, s₁, s₂, ...` where `(sᵢ, sᵢ₊₁) ∈ R` for all `i ≥ 0`.

**Definition 5.2.3 (LTL Satisfaction)**

For a path `π` and position `i`, satisfaction `π, i ⊨ φ` is defined:

| Formula | Satisfaction Condition |
|---------|----------------------|
| `π, i ⊨ p` | `p ∈ L(π[i])` (atomic proposition) |
| `π, i ⊨ ¬φ` | `π, i ⊭ φ` |
| `π, i ⊨ φ ∧ ψ` | `π, i ⊨ φ` and `π, i ⊨ ψ` |
| `π, i ⊨ φ ∨ ψ` | `π, i ⊨ φ` or `π, i ⊨ ψ` |
| `π, i ⊨ φ → ψ` | `π, i ⊭ φ` or `π, i ⊨ ψ` |
| `π, i ⊨ ○φ` | `π, i+1 ⊨ φ` (next) |
| `π, i ⊨ □φ` | `∀j ≥ i: π, j ⊨ φ` (globally/always) |
| `π, i ⊨ ◇φ` | `∃j ≥ i: π, j ⊨ φ` (finally/eventually) |
| `π, i ⊨ φ U ψ` | `∃j ≥ i: π, j ⊨ ψ` and `∀k ∈ [i, j): π, k ⊨ φ` (until) |

**Definition 5.2.4 (Specification Satisfaction)**

A Kripke structure `K` satisfies an LTL formula `φ` (written `K ⊨ φ`) iff `∀π ∈ Paths(K): π, 0 ⊨ φ`.

### 5.3 Event Calculus Semantics

BSIF event specifications use **event calculus** for formal semantics.

**Definition 5.3.1 (Event)**

An event `e` is a tuple `(name, payload, timestamp)` where:
- `name` is the event identifier
- `payload` is the event data
- `timestamp ∈ ℕ` is the logical time

**Definition 5.3.2 (Fluent)**

A fluent `F` is a property that holds over time intervals. The semantics use the predicates:
- `Happens(e, t)`: Event `e` occurs at time `t`
- `Initiates(e, f, t)`: Event `e` makes fluent `F` true at `t`
- `Terminates(e, f, t)`: Event `e` makes `F` false at `t`
- `HoldsAt(f, t)`: Fluent `F` is true at time `t`

**Definition 5.3.3 (Handler Semantics)**

For a handler `h = (event, filter, action, propagates)`:
- `h` is **triggered** at time `t` iff `Happens(event, t)` and `⟦filter⟧(t) = true`
- When triggered, `h` executes `action` and produces:
  - State updates via `⟦action⟧`
  - Additional events if `propagates = true`

### 5.4 Constraint Semantics

Constraints use **first-order logic** with pre/post conditions.

**Definition 5.4.1 (Precondition)**

A precondition `pre` for target `T` defines a predicate:
`pre: State → Boolean`

A call to `T` is **well-defined** in state `σ` iff `⟦pre⟧(σ) = true`.

**Definition 5.4.2 (Postcondition)**

A postcondition `post` for target `T` defines a predicate:
`post: State × State → Boolean`

For a call to `T` that transforms state `σ` to `σ'`, the call is **correct** iff `⟦post⟧(σ, σ') = true`.

**Definition 5.4.3 (Invariant)**

An invariant `inv` for target `T` defines a predicate:
`inv: State → Boolean`

`T` **maintains** `inv` iff for all reachable states `σ`: `⟦inv⟧(σ) = true`.

**Definition 5.4.4 (Weakest Preconditions)**

For verification, BSIF tools may compute:
`wp(τ, Q) = the weakest precondition such that executing τ from any state satisfying it establishes Q`

Where `τ` is a statement and `Q` is a postcondition.

### 5.5 Interaction Semantics

Interaction specifications define **message sequence charts**.

**Definition 5.5.1 (Interaction System)**

An interaction `I = (P, M)` defines a system where:
- `P` is the set of participants
- `M` is the set of message sequences

**Definition 5.5.2 (Trace)**

A **trace** of `I` is a sequence `τ = m₁, m₂, ..., mₙ` where:
- Each `mᵢ ∈ M`
- Messages respect partial order from causal dependencies

**Definition 5.5.3 (Protocol Satisfaction)**

An implementation `Impl` satisfies interaction specification `I` iff:
- All valid traces of `Impl` are traces of `I`
- All required messages in `I` occur in `Impl`

### 5.6 Composition Semantics

BSIF specifications compose via **refinement** and **extension**.

**Definition 5.6.1 (Reference)**

A specification `S` references `T` at component `c`:
`S.requires(c) = T`

This creates a semantic dependency: `⟦S⟧` defined only if `⟦T⟧` defined.

**Definition 5.6.2 (Extension)**

Specification `S` **extends** `T` (written `S ⊑ T`) iff:
- `S` preserves all properties of `T`
- `S` may add new properties
- `S` may strengthen existing properties

**Definition 5.6.3 (Well-formed Composition)**

A set of specifications `{S₁, ..., Sₙ}` forms a well-formed composition iff:
1. No circular references
2. All referenced specifications exist
3. No conflicting names in combined namespace
4. Composition operator is associative and commutative

---

## 6. Format Specification

### 6.1 Metadata Section

The metadata section is **REQUIRED** and **MUST** contain:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bsif_version` | string | MUST | BSIF format version (SemVer 2.0.0) |
| `name` | string | MUST | Specification name (unique identifier) |
| `version` | string | SHOULD | Specification version (SemVer 2.0.0) |
| `description` | string | RECOMMENDED | Human-readable description |
| `author` | string | MAY | Author or organization |
| `license` | string | MAY | License identifier (SPDX) |
| `references` | string[] | MAY | Related specifications or URIs |

**Example:**

```json
{
  "metadata": {
    "bsif_version": "1.0.0",
    "name": "traffic-light-controller",
    "version": "1.2.0",
    "description": "State machine for traffic light controller",
    "author": "City Transportation Dept",
    "license": "MIT",
    "references": [
      "https://traffic.example.com/requirements"
    ]
  }
}
```

### 6.2 Semantics Section

The semantics section is **REQUIRED** and **MUST** specify exactly one semantic type.

#### 6.2.1 State Machine Type

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | **MUST** be `"state-machine"` |
| `states` | State[] | Array of state definitions |
| `transitions` | Transition[] | Array of transition definitions |
| `initial` | string | ID of initial state |
| `final` | string[] | IDs of final/accepting states |

**State definition:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | MUST | Unique state identifier |
| `entry` | expression | MAY | Action on state entry |
| `exit` | expression | MAY | Action on state exit |
| `parent` | string | MAY | Parent state for hierarchy |
| `parallel` | boolean | MAY | Enable parallel regions |

**Transition definition:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | string | MUST | Source state ID |
| `to` | string | MUST | Destination state ID |
| `event` | string | MAY | Trigger event |
| `guard` | expression | MAY | Boolean condition |
| `action` | expression | MAY | Transition action |

**Example:**

```json
{
  "semantics": {
    "type": "state-machine",
    "states": [
      {
        "name": "red",
        "entry": "setTimer(30)"
      },
      {
        "name": "yellow",
        "entry": "setTimer(5)"
      },
      {
        "name": "green",
        "entry": "setTimer(25)"
      }
    ],
    "transitions": [
      {
        "from": "red",
        "to": "green",
        "event": "timerExpired"
      },
      {
        "from": "green",
        "to": "yellow",
        "event": "timerExpired"
      },
      {
        "from": "yellow",
        "to": "red",
        "event": "timerExpired"
      }
    ],
    "initial": "red"
  }
}
```

#### 6.2.2 Temporal Type

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | MUST | `"temporal"` |
| `logic` | string | MUST | `"ltl"` or `"ctl"` |
| `variables` | object | MUST | Variable declarations |
| `properties` | Property[] | MUST | Temporal properties |

**Example:**

```json
{
  "semantics": {
    "type": "temporal",
    "logic": "ltl",
    "variables": {
      "request_pending": "boolean",
      "response_sent": "boolean"
    },
    "properties": [
      {
        "name": "every_request_gets_response",
        "formula": {
          "operator": "globally",
          "operand": {
            "operator": "implies",
            "operands": [
              { "operator": "variable", "variable": "request_pending" },
              {
                "operator": "finally",
                "operand": {
                  "operator": "variable",
                  "variable": "response_sent"
                }
              }
            ]
          }
        }
      }
    ]
  }
}
```

#### 6.2.3 Constraints Type

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | MUST | `"constraints"` |
| `target` | object | MUST | Target function/method reference |
| `preconditions` | Constraint[] | MUST | Preconditions |
| `postconditions` | Constraint[] | MUST | Postconditions |
| `invariants` | Constraint[] | MAY | Invariants |

**Example:**

```json
{
  "semantics": {
    "type": "constraints",
    "target": {
      "function": "withdraw",
      "module": "account"
    },
    "preconditions": [
      {
        "description": "Amount must be positive",
        "expression": "amount > 0"
      },
      {
        "description": "Sufficient balance required",
        "expression": "balance >= amount"
      }
    ],
    "postconditions": [
      {
        "description": "Balance decreased by amount",
        "expression": "balance == old.balance - amount"
      }
    ],
    "invariants": [
      {
        "description": "Balance never negative",
        "expression": "balance >= 0"
      }
    ]
  }
}
```

#### 6.2.4 Events Type

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | MUST | `"events"` |
| `events` | object | MUST | Event declarations |
| `handlers` | Handler[] | MUST | Event handlers |

**Example:**

```json
{
  "semantics": {
    "type": "events",
    "events": {
      "UserLogin": {
        "payload": {
          "type": "object",
          "properties": {
            "userId": "string",
            "timestamp": "integer"
          }
        }
      }
    },
    "handlers": [
      {
        "event": "UserLogin",
        "action": "logAuditEntry(event)",
        "propagates": true
      }
    ]
  }
}
```

#### 6.2.5 Interaction Type

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | MUST | `"interaction"` |
| `participants` | Participant[] | MUST | System participants |
| `messages` | Message[] | MUST | Message sequences |

**Example:**

```json
{
  "semantics": {
    "type": "interaction",
    "participants": [
      { "name": "client", "role": "requester" },
      { "name": "server", "role": "responder" }
    ],
    "messages": [
      {
        "from": "client",
        "to": "server",
        "message": "GET /api/resource"
      },
      {
        "from": "server",
        "to": "client",
        "message": "200 OK",
        "payload": {
          "type": "object",
          "properties": {
            "data": "string"
          }
        }
      }
    ]
  }
}
```

#### 6.2.6 Hybrid Type

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | MUST | `"hybrid"` |
| `components` | Semantics[] | MUST | Array of semantic specifications |

**Example:**

```json
{
  "semantics": {
    "type": "hybrid",
    "components": [
      {
        "type": "state-machine",
        "states": [...],
        "transitions": [...]
      },
      {
        "type": "temporal",
        "logic": "ltl",
        "properties": [...]
      }
    ]
  }
}
```

### 6.3 Tools Section

The tools section is **OPTIONAL** and allows tool-specific mappings.

Tools **MUST** ignore unknown tool names.
Tools **MAY** validate their specific mapping section.

**Example:**

```json
{
  "tools": {
    "tlaplus": {
      "module": "---------------- MODULE TrafficLight ----------------\n..."
    },
    "scxml": {
      "xml": "<scxml xmlns=\"http://www.w3.org/2005/07/scxml\">...</scxml>"
    }
  }
}
```

### 6.4 Tests Section

The tests section is **OPTIONAL** and provides test cases.

**Test case structure:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | MUST | Test case name |
| `description` | string | MUST | Test description |
| `input` | object | MUST | Input stimulus |
| `expected` | object | MUST | Expected outcome |

**Example:**

```json
{
  "tests": [
    {
      "name": "red-to-green-transition",
      "description": "Timer expiration in red state transitions to green",
      "input": {
        "currentState": "red",
        "event": "timerExpired"
      },
      "expected": {
        "currentState": "green",
        "timerSet": 30
      }
    }
  ]
}
```

### 6.5 Documentation Section

The documentation section is **OPTIONAL** and provides human-readable documentation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `overview` | string | MAY | Long-form description |
| `examples` | object[] | MAY | Usage examples |

---

## 7. Versioning and Compatibility

### 7.1 Semantic Versioning

BSIF uses **Semantic Versioning 2.0.0** for the format version.

**Version format:** `MAJOR.MINOR.PATCH`

- **MAJOR**: Incompatible changes
- **MINOR**: Backwards-compatible functionality
- **PATCH**: Backwards-compatible bug fixes

**Example:** `1.0.0`, `1.2.3`, `2.0.0`

### 7.2 Compatibility Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| New optional field | PATCH | Added `documentation` section |
| New required field | MAJOR | Added `license` to metadata |
| New semantic type | MINOR | Added `"probabilistic"` type |
| Field name change | MAJOR | `initial_state` → `initial` |
| Field deletion | MAJOR | Removed deprecated field |
| Field type change | MAJOR | `states: string` → `states: State[]` |
| New enum value | MINOR | New operator in LTL |

### 7.3 Specification Versioning

Each BSIF document has:
1. **Format version** (`bsif_version`): Which BSIF spec version it conforms to
2. **Document version** (`version`): Version of this specific specification

**Example:**

```json
{
  "metadata": {
    "bsif_version": "1.0.0",
    "name": "my-spec",
    "version": "2.3.1"
  }
}
```

### 7.4 Deprecation Process

1. **Deprecation notice**: Field marked as deprecated in documentation
2. **Grace period**: 2 MAJOR versions with deprecation warning
3. **Removal**: Field becomes optional, then removed

**Example timeline:**

| Version | Status |
|---------|--------|
| 1.0.0 | Field `old_field` introduced |
| 1.5.0 | `old_field` deprecated, `new_field` added |
| 2.0.0 | `old_field` warning recommended but not required |
| 3.0.0 | `old_field` removed |

### 7.5 Migration Paths

For breaking changes, tools **SHOULD** provide:
1. **Automatic migration**: Where unambiguous
2. **Migration guide**: For manual steps
3. **Compatibility mode**: Temporary support for old versions

---

## 8. Security Considerations

### 8.1 Input Validation

BSIF parsers **MUST** validate:
1. **Document structure**: Well-formedness per grammar
2. **Schema compliance**: Type checking
3. **Size limits**: Prevent DoS via large documents
4. **Reference integrity**: No circular references

**Recommended limits:**

| Resource | Minimum Limit | Recommended Limit |
|----------|---------------|-------------------|
| Document size | 10 MB | 100 MB |
| Nesting depth | 100 | 32 |
| Number of states | 10,000 | 1,000 |
| String length | 1 MB | 64 KB |

### 8.2 Expression Injection

Expressions in BSIF (`guard`, `action`, `entry`, `exit`) are **tool-specific strings**.

**Security risks:**
- Code injection if executed directly
- Data exfiltration via crafted expressions
- Resource exhaustion via infinite loops

**Mitigations:**
1. **Sandboxing**: Execute expressions in isolated environments
2. **Resource limits**: Timeout and memory quotas
3. **Whitelisting**: Restrict allowed operations
4. **Static analysis**: Detect suspicious patterns before execution

### 8.3 Supply Chain Security

BSIF documents may reference external specifications.

**Risks:**
- Malicious referenced specifications
- Dependency confusion attacks
- Compromised specification repositories

**Mitigations:**
1. **Integrity checking**: Hash verification for references
2. **Allowlists**: Approved specification sources
3. **Reproducibility**: Pin specific versions
4. **Audit trails**: Log all specification resolutions

### 8.4 Information Leakage

BSIF documents may contain sensitive information:
- Proprietary algorithms
- Security assumptions
- Vulnerability information

**Mitigations:**
1. **Access controls**: Restrict specification access
2. **Encryption**: Protect sensitive specifications at rest
3. **Redaction**: Support removing sensitive sections
4. **Watermarking**: Detect leaked specifications

### 8.5 Denial of Service

**Attack vectors:**
1. **State explosion**: Exponential state space from hierarchy
2. **Property explosion**: Complex LTL formulas
3. **Circular references**: Infinite recursion in composition
4. **Resource exhaustion**: Memory/CPU intensive verification

**Required mitigations:**
1. **Bounds checking**: Enforce size limits
2. **Timeout enforcement**: Maximum verification time
3. **Resource quotas**: Memory/CPU limits
4. **Progress monitoring**: Allow cancellation

### 8.6 Validation Security

Validators **MUST**:
1. Not execute arbitrary code from specifications
2. Not make network requests during validation
3. Not write files outside designated directories
4. Not expose system information in error messages

---

## 9. IANA Considerations

### 9.1 Media Type Registration

BSIF proposes the following media type registration:

```
Media type name: application
Subtype name: vnd.bsif+json
Required parameters: None
Optional parameters: charset
Encoding considerations: Binary (same as JSON)
Security considerations: See Section 8
Interoperability considerations: See BSIF specification
Published specification: This document
Applications that use this media type: Verification tools, test generators,
runtime monitors, IDE plugins
Additional information:
  Magic number(s): None
  File extension(s): .bsif.json, .bsif.yaml
  Macintosh file type code(s): TEXT
Person & email address to contact for further information: [TBD]
Intended usage: COMMON
Restrictions on usage: None
Author: [TBD]
Change controller: [TBD]
```

### 9.2 URI Scheme Registration (Optional)

BSIF may register a URI scheme for specification references:

```
URI scheme name: bsif
Status: Provisional
URI scheme syntax: bsif:<name>@<version> or bsif:<name>
URI scheme semantics: References a BSIF specification by name and version
Encoding considerations: Same as https
Applications/protocols that use this URI scheme: BSIF tools, specification
registries
Interoperability considerations: None
Security considerations: Same as https (used for resolution)
Contact: [TBD]
```

---

## 10. Conformance Requirements

### 10.1 Parser Conformance

A **conforming BSIF parser** **MUST**:
1. Accept both JSON and YAML serializations
2. Parse all syntactically valid BSIF documents
3. Report errors with line and column numbers
4. Validate against the grammar in Section 4

A conforming parser **SHOULD**:
1. Provide detailed error messages
2. Suggest corrections for common errors
3. Support incremental parsing for large documents
4. Handle both JSON and YAML with equivalent results

### 10.2 Validator Conformance

A **conforming BSIF validator** **MUST**:
1. Validate document structure per Section 6
2. Enforce all MUST/SHOULD requirements
3. Detect circular references in compositions
4. Validate semantic constraints per Section 5

A conforming validator **SHOULD**:
1. Provide warnings for deprecated usage
2. Suggest optimizations for specifications
3. Generate validation reports in machine-readable format
4. Support custom validation rules as extensions

### 10.3 Tool Conformance

Tools that consume BSIF **MUST**:
1. Accept at least one semantic type
2. Reject invalid specifications
3. Report errors using standardized error codes
4. Support `bsif_version` compatibility checking

Tools that consume BSIF **SHOULD**:
1. Support multiple semantic types
2. Provide tool-specific mappings in the `tools` section
3. Generate BSIF from their native format
4. Participate in conformance testing

### 10.4 Error Reporting

Conforming implementations **MUST** use the following error categories:

| Error Code | Category | Example |
|------------|----------|---------|
| `E001` | Syntax error | Invalid JSON/YAML |
| `E002` | Grammar violation | Missing required field |
| `E003` | Type mismatch | String where integer expected |
| `E004` | Semantic error | Circular reference |
| `E005` | Version mismatch | Unsupported bsif_version |
| `E006` | Validation error | Constraint violation |

**Error format (JSON):**

```json
{
  "error_code": "E002",
  "severity": "error",
  "message": "Missing required field 'name' in metadata section",
  "location": {
    "line": 5,
    "column": 10,
    "file": "spec.bsif.json"
  },
  "suggestion": "Add \"name\": \"your-spec-name\" to metadata"
}
```

### 10.5 Test Suite Conformance

The official BSIF test suite **MUST**:
1. Include positive test cases (valid specifications)
2. Include negative test cases (invalid specifications with expected errors)
3. Test all semantic types
4. Test edge cases (empty specs, maximum sizes, Unicode)
5. Test composition and references
6. Test version compatibility

Implementations **MUST** pass all required tests to claim conformance.

---

## Appendix A: Complete Examples

### A.1 State Machine: Traffic Light Controller

```json
{
  "metadata": {
    "bsif_version": "1.0.0",
    "name": "traffic-light-controller",
    "version": "1.0.0",
    "description": "Standard traffic light state machine"
  },
  "semantics": {
    "type": "state-machine",
    "states": [
      { "name": "red", "entry": "setTimer(30)" },
      { "name": "yellow", "entry": "setTimer(5)" },
      { "name": "green", "entry": "setTimer(25)" }
    ],
    "transitions": [
      { "from": "red", "to": "green", "event": "timerExpired" },
      { "from": "green", "to": "yellow", "event": "timerExpired" },
      { "from": "yellow", "to": "red", "event": "timerExpired" }
    ],
    "initial": "red"
  }
}
```

### A.2 Temporal: Mutual Exclusion

```json
{
  "metadata": {
    "bsif_version": "1.0.0",
    "name": "mutex-property",
    "version": "1.0.0",
    "description": "Mutual exclusion for critical sections"
  },
  "semantics": {
    "type": "temporal",
    "logic": "ltl",
    "variables": {
      "in_critical_1": "boolean",
      "in_critical_2": "boolean"
    },
    "properties": [
      {
        "name": "mutual_exclusion",
        "formula": {
          "operator": "globally",
          "operand": {
            "operator": "not",
            "operand": {
              "operator": "and",
              "operands": [
                { "operator": "variable", "variable": "in_critical_1" },
                { "operator": "variable", "variable": "in_critical_2" }
              ]
            }
          }
        }
      }
    ]
  }
}
```

### A.3 Constraints: Stack Operations

```json
{
  "metadata": {
    "bsif_version": "1.0.0",
    "name": "stack-contracts",
    "version": "1.0.0",
    "description": "Design by contract for stack"
  },
  "semantics": {
    "type": "constraints",
    "target": {
      "class": "Stack"
    },
    "invariants": [
      {
        "description": "Size is non-negative",
        "expression": "size >= 0"
      },
      {
        "description": "Empty iff size is zero",
        "expression": "empty == (size == 0)"
      }
    ]
  }
}
```

---

## Appendix B: Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-draft | 2025-02-01 | Initial draft specification |

---

## Appendix C: Contributors

[TBD]

---

## Appendix D: Acknowledgments

BSIF draws inspiration from:
- SMT-LIB for interchange format design
- WebAssembly for formal semantics approach
- SCXML for state machine representation
- TLA+ for temporal logic foundations
- JSON Schema for validation methodology

---

**End of Specification**
