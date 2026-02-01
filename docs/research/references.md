# Bibliography: Language-Agnostic Program Specifications

**Status:** Research Reference
**Date:** 2025-02-01
**Topic:** Consolidated bibliography of all references across research documents

This document consolidates all references mentioned across the research documents, organized by category for easy lookup.

---

## 1. Frameworks and Tools

### Formal Specification Languages

#### TLA+ (Temporal Logic of Actions)
- **Authors:** Leslie Lamport (Microsoft Research)
- **Year:** 1994 (original), continuously developed
- **URL:** https://lamport.azurewebsites.net/tla/tla.html
- **Description:** High-level formal specification language for concurrent and distributed systems. Uses mathematical predicates to describe system designs and correctness properties. TLC model checker exhaustively explores execution traces.

#### Alloy
- **Authors:** Daniel Jackson (MIT)
- **Year:** 1997 (Alloy 1), continuously developed
- **URL:** https://alloytools.org/
- **Description:** Language for modeling structural constraints and analyzing properties. Uses relational logic and bounded model checking with automatic counterexample generation.

#### Z Notation
- **Authors:** Abrial et al. (origin at Programming Research Group, Oxford)
- **Year:** 1980s, ISO standard 2002
- **URL:** http://znotation.org/
- **Description:** Mathematical specification language based on set theory and first-order logic. Uses schemas for state and operation specifications.

#### B Method
- **Authors:** J.-R. Abrial
- **Year:** 1980s
- **URL:** https://www.clearsy.com/en/b-method/
- **Description:** Formal method for software development using abstract machines with invariants and refinement mappings. Industrial use in rail and aerospace.

#### VDM (Vienna Development Method)
- **Authors:** Dines Bjørner, Cliff Jones (IBM Vienna Lab)
- **Year:** 1970s
- **URL:** https://www.overturetool.org/
- **Description:** Formal method for specification and development with explicit or implicit function definitions, state models, and operations.

#### OCL (Object Constraint Language)
- **Authors:** Object Management Group (OMG)
- **Year:** 1997 (OCL 1.0), 2006 (OCL 2.0)
- **URL:** https://www.omg.org/spec/OCL/
- **Description:** UML's constraint language for specifying behavioral properties, class invariants, method preconditions/postconditions, and state invariants.

---

### Verification-Aware Languages

#### Dafny
- **Authors:** Rustan Leino (Microsoft Research)
- **Year:** 2009
- **URL:** https://github.com/dafny-lang/dafny
- **Description:** Programming language with built-in verification support. Methods with pre/postconditions, loop invariants, type invariants, and lemas. Static verification is fully automatic.

#### F* (F Star)
- **Authors:** Microsoft Research, INRIA
- **Year:** 2010
- **URL:** https://www.fstar-lang.org/
- **Description:** Proof-oriented programming language with dependent types. Types with preconditions, refinement types, effect systems, and computation types for proofs.

#### Why3
- **Authors:** CNRS, Université Paris-Sud
- **Year:** 2010
- **URL:** https://why3.lri.fr/
- **Description:** Platform for deductive program verification with programs with specifications, assertions and invariants, theories and lemmas. Verification via external provers (Z3, CVC4, etc.).

---

### Design by Contract Implementations

#### JML (Java Modeling Language)
- **Authors:** Gary T. Leavens, Albert L. Baker, et al.
- **Year:** 1998
- **URL:** https://www.jmlspecs.org/
- **Description:** Specification language for Java with annotations for preconditions (`requires`), postconditions (`ensures`), class invariants (`invariant`), and frame conditions.

#### SPARK
- **Authors:** AdaCore
- **Year:** 1990s (SPARK 95), continuously developed
- **URL:** https://www.adacore.com/about-spark
- **Description:** Formal verification technology for Ada. Pre/postconditions, type invariants, ghost code, and loop invariants. Used in aerospace, rail, and medical systems.

#### ACSL (ANSI/ISO C Specification Language)
- **Authors:** CEA LIST, INRIA
- **Year:** 2006
- **URL:** https://frama-c.com/acsl.html
- **Description:** Specification language for C integrated with Frama-C. Function contracts, loop invariants, assertions, and behavior specifications.

#### Eiffel Design by Contract
- **Authors:** Bertrand Meyer
- **Year:** 1986 (Eiffel language)
- **URL:** https://www.eiffel.org/
- **Description:** Built-in contract specification in the Eiffel language with preconditions (`require`), postconditions (`ensure`), and class invariants (`invariant`).

---

### Property-Based Testing

#### QuickCheck (Haskell)
- **Authors:** Koen Claessen, John Hughes (Chalmers University)
- **Year:** 1999
- **URL:** https://www.cs.york.ac.uk/~ko/cse09/QuickCheck/
- **Description:** Original property-based testing framework. Properties as general rules over input domains with random test case generation and automatic shrinking.

#### Hypothesis (Python)
- **Authors:** David R. MacIver, Zac Hatfield-Dodds
- **Year:** 2013
- **URL:** https://hypothesis.works/
- **Description:** Property-based testing for Python with intelligent case reduction and stateful testing for complex systems. Integrates with pytest and unittest.

#### ScalaCheck
- **Authors:** Rickard Nilsson
- **Year:** 2006
- **URL:** https://github.com/typelevel/scalacheck
- **Description:** Property-based testing for Scala and JVM programs with generators for Scala types and arbitrary instances.

#### jqc / jqwik (Java)
- **Authors:** Christian Stein
- **Year:** 2016
- **URL:** https://jqwik.net/
- **Description:** Property-based testing for Java with JUnit integration and annotated property methods.

#### FastCheck (JavaScript/TypeScript)
- **Authors:** Matthieu Nex
- **Year:** 2015
- **URL:** https://fast-check.dev/
- **Description:** Property-based testing for JavaScript/TypeScript with framework integration (Jest, Vitest).

---

### Expression and Query Languages

#### CEL (Common Expression Language)
- **Authors:** Google
- **Year:** 2018
- **URL:** https://cel.dev/
- **Description:** Portable expression language designed for embedding predicates, filters, and simple computations inside applications. Used in Kubernetes and Firebase security rules.

#### Rego (Open Policy Agent)
- **Authors:** Open Policy Agent project
- **Year:** 2016
- **URL:** https://www.openpolicyagent.org/
- **Description:** Declarative policy language where policies describe *what* is allowed rather than *how* to compute it. WebAssembly compiler for cross-language execution.

#### JMESPath
- **Authors:** James Saryerwinnie
- **Year:** 2013
- **URL:** https://jmespath.org/
- **Description:** Declarative query language for JSON with complete ABNF grammar and compliance test suite.

#### JSONata
- **Authors:** JSONata project
- **Year:** 2014
- **URL:** https://jsonata.org/
- **Description:** Lightweight query/transformation language for JSON, inspired by XPath 3.1. Language grammar, operators, functions, and user-defined functions.

#### JsonLogic
- **Authors:** Jeremy Wadsack
- **Year:** 2015
- **URL:** http://jsonlogic.com/
- **Description:** Encodes logic as JSON data (operator key, argument values) with deterministic evaluation and pure data rule format.

---

### State Machine and Protocol Specifications

#### SCXML (State Chart XML)
- **Authors:** W3C
- **Year:** 2005 (working draft), 2015 (recommendation)
- **URL:** https://www.w3.org/TR/scxml/
- **Description:** W3C standard for state chart modeling with states (parallel, compound, atomic), transitions with events and conditions, and actions.

#### UML State Machines
- **Authors:** Object Management Group (OMG)
- **Year:** 1997 (UML 1.0), continuously updated
- **URL:** https://www.omg.org/spec/UML/
- **Description:** UML behavioral modeling for state machines with states and transitions, events and triggers, and orthogonal regions.

#### TTCN-3 (Testing and Test Control Notation)
- **Authors:** ETSI
- **Year:** 2000
- **URL:** https://www.etsi.org/technologies/tesinting-and-test-control-notation
- **Description:** Formal testing notation for protocol verification with test cases, test components, verdicts, timer operations, and communication patterns.

---

## 2. Standards and Specifications

### Internet Standards (IETF/IRF)

#### RFC 8785 - JSON Canonicalization Scheme (JCS)
- **Authors:** A. Nadalin, J. Wahl
- **Year:** 2020
- **URL:** https://www.rfc-editor.org/rfc/rfc8785.html
- **Description:** Deterministic JSON canonicalization algorithm that ensures signatures are reproducible across languages.

#### RFC 4845 - IAB RFC Publication Process
- **Authors:** IAB
- **Year:** 2007
- **URL:** https://www.rfc-editor.org/rfc/rfc4845.html
- **Description:** Defines the IAB RFC publication process.

#### RFC 5743 - IRTF RFC Publication Process
- **Authors:** IRTF
- **Year:** 2009
- **URL:** https://www.rfc-editor.org/rfc/rfc5743.html
- **Description:** Describes the IRTF process for publishing RFCs.

#### RFC 8730 - Independent Submission Editor Model
- **Authors:** RFC Editor
- **Year:** 2020
- **URL:** https://www.rfc-editor.org/rfc/rfc8730.html
- **Description:** Defines the Independent Submission Editor model for RFC publication.

#### RFC 9280 - Updates to RFC 8730
- **Authors:** RFC Editor
- **Year:** 2022
- **URL:** https://www.rfc-editor.org/rfc/rfc9280.html
- **Description:** Updates to the Independent Submission Editor model.

#### RFC 7322 - RFC Style Guide
- **Authors:** RFC Editor
- **Year:** 2014
- **URL:** https://www.rfc-editor.org/rfc/rfc7322.html
- **Description:** Authoritative style guide for writing RFCs.

#### RFC 2119 - Key Words for Use in RFCs
- **Authors:** S. Bradner
- **Year:** 1997
- **URL:** https://www.rfc-editor.org/rfc/rfc2119.html
- **Description:** Defines the keywords MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, etc. used in specifications.

#### RFC 8174 - Ambiguity of RFC 2119
- **Authors:** B. Leiba
- **Year:** 2017
- **URL:** https://www.rfc-editor.org/rfc/rfc8174.html
- **Description:** Updates RFC 2119 to address ambiguity issues.

#### RFC 7841 / RFC 9280 - Status of This Memo
- **Authors:** RFC Editor
- **Year:** 2016 / 2022
- **URL:** https://www.rfc-editor.org/rfc/rfc7841.html
- **Description:** Boilerplate definitions for RFC status sections.

---

### OMG Standards

#### DMN (Decision Model and Notation)
- **Authors:** Object Management Group
- **Year:** 2013 (DMN 1.0), 2019 (DMN 1.3)
- **URL:** https://www.omg.org/spec/DMN/
- **Description:** OMG standard for modeling and automating business decisions. Includes the Friendly Enough Expression Language (FEEL) for decision logic.

#### FEEL (Friendly Enough Expression Language)
- **Authors:** Object Management Group
- **Year:** 2013
- **URL:** Part of DMN specification
- **Description:** Expression language for business decision rules, part of DMN standard.

#### PRR (Production Rule Representation)
- **Authors:** Object Management Group
- **Year:** 2007
- **URL:** https://www.omg.org/spec/PRR/
- **Description:** OMG standard providing vendor-neutral representation for production rules (if-condition-then-action) with UML-based metamodel and XML interchange format.

#### BPMN 2.0 (Business Process Model and Notation)
- **Authors:** Object Management Group
- **Year:** 2011 (BPMN 2.0)
- **URL:** https://www.omg.org/spec/BPMN/
- **Description:** OMG standard for modeling business processes with formalized execution semantics.

#### TOSCA (Topology and Orchestration Specification for Cloud Applications)
- **Authors:** OASIS
- **Year:** 2013
- **URL:** https://www.oasis-open.org/committees/tosca/
- **Description:** Describes cloud application topologies and lifecycle management processes.

#### OCL 2.0
- **Authors:** Object Management Group
- **Year:** 2006
- **URL:** https://www.omg.org/spec/OCL/
- **Description:** Object Constraint Language specification for UML models.

---

### W3C Standards

#### RIF (Rule Interchange Format)
- **Authors:** W3C RIF Working Group
- **Year:** 2010
- **URL:** https://www.w3.org/2005/rules/wiki/RIF_WG
- **Description:** W3C specification for rule language interoperability with family of dialects (Basic Logic Dialect, Production Rule Dialect, etc.).

#### SCXML
- **Authors:** W3C
- **Year:** 2015 (W3C Recommendation)
- **URL:** https://www.w3.org/TR/scxml/
- **Description:** State Chart XML specification for state machine modeling.

---

### Other Standards

#### GraphQL
- **Authors:** Facebook (now GraphQL Foundation)
- **Year:** 2015 (open sourced), 2018 (GraphQL Foundation)
- **URL:** https://spec.graphql.org/
- **Description:** Open spec with reference implementations for API query language.

#### CWL (Common Workflow Language)
- **Authors:** Common Workflow Language project
- **Year:** 2014
- **URL:** https://www.commonwl.org/
- **Description:** Open standard for describing computational workflows as YAML/JSON documents.

#### SQL (ANSI/ISO)
- **Authors:** ANSI/ISO
- **Year:** 1986 (SQL-86), multiple revisions
- **URL:** https://www.iso.org/standard/169545.html
- **Description:** ANSI/ISO standard database query language with cross-vendor syntax.

#### CACAO (Security Playbooks)
- **Authors:** OASIS
- **Year:** 2021
- **URL:** https://www.oasis-open.org/committees/cacao/
- **Description:** JSON-based workflow for cybersecurity playbooks.

---

## 3. Academic Papers

### Property-Based Testing

- **QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs**
  - Authors: Koen Claessen, John Hughes
  - Year: 2000
  - Venue: ICFP '00
  - URL: https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf
  - Description: Original paper introducing the QuickCheck framework for property-based testing in Haskell.

- **An Empirical Study on the Effectiveness of Property-Based Testing**
  - Authors: Multiple (2024 study)
  - Year: 2024
  - Description: Empirical study on the effectiveness of Hypothesis and property-based testing frameworks.

---

### Formal Methods

- **The Temporal Logic of Actions**
  - Author: Leslie Lamport
  - Year: 1994
  - URL: https://lamport.azurewebsites.net/pubs/temporal-logic.html
  - Description: Foundational paper introducing TLA+ as a specification language for concurrent systems.

- **Alloy: A Lightweight Object Modeling Notation**
  - Author: Daniel Jackson
  - Year: 2002
  - URL: https://dspace.mit.edu/handle/1721.1/7320
  - Description: Doctoral thesis introducing the Alloy language for structural modeling.

- **Specifying Distributed Systems with TLA+**
  - Authors: Leslie Lamport, Stephan Merz
  - Year: Various
  - Description: Collection of papers on using TLA+ for distributed systems specification.

---

### Design by Contract

- **Design by Contract: The Lessons of Ariane**
  - Author: Bertrand Meyer
  - Year: 1997
  - URL: https://www.eiffel.com/doc/eiffelstudio/Design_by_Contract:_The_Lessons_of_Ariane
  - Description: Analysis of the Ariane 5 failure and the role of design by contract in preventing such failures.

- **JML: A Behavioral Interface Specification Language for Java**
  - Authors: Gary T. Leavens, et al.
  - Year: Various
  - URL: https://www.jmlspecs.org/
  - Description: Papers on JML and its applications in formal verification.

---

### AI-Assisted Verification

- **NL2ACSL: Natural Language to ACSL**
  - Authors: (2024 research)
  - Year: 2024
  - Description: Research on translating natural language specifications to ACSL (ANSI/ISO C Specification Language) annotations.

- **AI-Assisted Proof Generation for Dafny and F***
  - Authors: Various (2024 research)
  - Year: 2024
  - Description: Exploratory work on using LLMs to assist with proof generation in verification-aware languages.

---

### Symbolic Model Checking

- **APALACHE: Symbolic Model Checker for TLA+**
  - Authors: Igor Konnov, et al.
  - Year: 2023
  - URL: https://apalache.informal.systems/
  - Description: SMT-based symbolic model checker for TLA+ specifications.

---

### Testing from Specifications

- **Automatic Test Case Generation from OCL Constraints**
  - Authors: (2024 research)
  - Year: 2024
  - Description: 2024 research on automated verification and consistency checking for OCL constraints.

- **Test Data Generation from OCL Constraints**
  - Authors: (2024 research)
  - Year: 2024
  - Description: Research on generating test data from OCL constraints for verification.

---

## 4. Books and Tutorials

### Formal Methods

- **Specifying Systems: The TLA+ Language and Tools for Hardware and Software Engineers**
  - Author: Leslie Lamport
  - Year: 2002
  - URL: https://lamport.azurewebsites.net/tla/book.html
  - Description: Comprehensive textbook on TLA+ specification language with examples and exercises.

- **Software Abstractions: Logic, Language, and Analysis**
  - Author: Daniel Jackson
  - Year: 2012 (revised edition)
  - ISBN: 978-0262017151
  - Description: Book on Alloy and its approach to software abstraction and modeling.

- **Using Z: Specification, Refinement, and Proof**
  - Authors: Jim Woodcock, Jim Davies
  - Year: 1996
  - ISBN: 0-13-948472-8
  - Description: Textbook on the Z notation and its use in formal specification.

- **The B-Book: Assigning Programs to Meanings**
  - Author: J.-R. Abrial
  - Year: 1996
  - ISBN: 0-521-49619-5
  - Description: Comprehensive book on the B Method for formal software development.

- **VDM in Practice**
  - Authors: Cliff Jones (ed.)
  - Year: 1990
  - Description: Book on practical applications of the Vienna Development Method.

---

### Design by Contract

- **Object-Oriented Software Construction**
  - Author: Bertrand Meyer
  - Year: 1988 (1st edition), 1997 (2nd edition)
  - ISBN: 0-13-629155-4
  - Description: Foundational book on object-oriented design and the design by contract methodology.

---

### Property-Based Testing

- **Property-Based Testing in Python with Hypothesis**
  - Author: Zac Hatfield-Dodds
  - Year: 2022
  - URL: https://hypothesis.works/
  - Description: Comprehensive guide to property-based testing with Hypothesis.

- **Test-Driven Development with QuickCheck**
  - Authors: Koen Claessen, John Hughes
  - URL: https://www.cs.york.ac.uk/~ko/cse09/QuickCheck/
  - Description: Tutorials and examples on using QuickCheck for TDD.

---

### Online Tutorials and Interactive Learning

- **TLA+ Video Course**
  - Author: Leslie Lamport
  - URL: https://lamport.azurewebsites.net/video/videos.html
  - Description: Video tutorials on TLA+ by its creator.

- **Learn TLA+**
  - URL: https://learn.tla.plus/
  - Description: Interactive tutorials for learning TLA+.

- **Dafny Tutorial**
  - URL: https://dafny.org/dafny/DafnyRef/DafnyRef
  - Description: Official Dafny tutorial and reference documentation.

- **Alloy Tutorial**
  - URL: https://alloytools.org/tutorials/
  - Description: Official Alloy tutorials and examples.

---

## 5. Online Resources

### Project and Tool Websites

#### TLA+ Ecosystem
- **TLA+ Official Site:** https://lamport.azurewebsites.net/tla/tla.html
- **TLA+ Toolbox:** https://github.com/tlaplus/tlaplus
- **TLA+ VS Code Extension:** https://marketplace.visualstudio.com/items?itemName=alygin.vscode-tlaplus
- **APALACHE:** https://apalache.informal.systems/

#### Alloy Ecosystem
- **Alloy Analyzer:** https://alloytools.org/
- **Alloy GitHub:** https://github.com/AlloyTools/org.alloytools.alloy

#### Verification Languages
- **Dafny:** https://github.com/dafny-lang/dafny
- **F*:** https://www.fstar-lang.org/
- **Why3:** https://why3.lri.fr/
- **Coq:** https://coq.inria.fr/
- **Isabelle:** https://isabelle.in.tum.de/

#### Property-Based Testing
- **QuickCheck:** https://www.cs.york.ac.uk/~ko/cse09/QuickCheck/
- **Hypothesis:** https://hypothesis.works/
- **ScalaCheck:** https://github.com/typelevel/scalacheck
- **jqwik:** https://jqwik.net/
- **FastCheck:** https://fast-check.dev/

#### Design by Contract
- **JML:** https://www.jmlspecs.org/
- **SPARK:** https://www.adacore.com/about-spark
- **Frama-C/ACSL:** https://frama-c.com/acsl.html
- **Eiffel:** https://www.eiffel.org/

#### Policy and Expression Languages
- **CEL:** https://cel.dev/
- **Open Policy Agent (Rego):** https://www.openpolicyagent.org/
- **JMESPath:** https://jmespath.org/
- **JSONata:** https://jsonata.org/
- **JsonLogic:** http://jsonlogic.com/

#### API and Contract Testing
- **Pact:** https://docs.pact.io/
- **OpenAPI Specification:** https://spec.openapis.org/oas/latest.html
- **Swagger:** https://swagger.io/

---

### Standards Organizations

- **Object Management Group (OMG):** https://www.omg.org/
  - Specifications for DMN, PRR, BPMN, OCL, UML

- **W3C:** https://www.w3.org/
  - Specifications for SCXML, RIF

- **OASIS:** https://www.oasis-open.org/
  - Specifications for TOSCA, CACAO

- **ETSI:** https://www.etsi.org/
  - Specifications for TTCN-3

- **RFC Editor:** https://www.rfc-editor.org/
  - Internet Standards (IETF, IRTF, IAB)

---

### Research and Academic Resources

- **Microsoft Research - Formal Methods:** https://www.microsoft.com/en-us/research/group/formal-methods/
  - Dafny, Z3, F* projects

- **INRIA - Proof of Programs:** https://team.inria.fr/proval/
  - Why3, F*, CompCert projects

- **MIT - Software Design Group:** https://sdg.csail.mit.edu/
  - Alloy research group

---

### Conferences and Workshops

- **ICFP (International Conference on Functional Programming)**
  - Property-based testing papers often published here

- **TACAS (Tools and Algorithms for the Construction and Analysis of Systems)**
  - Formal methods tools research

- **CAV (Computer Aided Verification)**
  - Verification research conference

- **FM (Symposium on Formal Methods)**
  - General formal methods research

---

### Community Resources

- **Stack Overflow - Tags:**
  - `tlaplus`
  - `alloy`
  - `dafny`
  - `quickcheck`
  - `hypothesis`
  - `pact`

- **Discord/Slack Communities:**
  - TLA+ Discord
  - Dafny Slack
  - Pact Slack

- **Mailing Lists:**
  - `tlaplus@googlegroups.com`
  - `dafny-lang@googlegroups.com`

---

## 6. Research-Specific References

### Gap Analysis Tools

- **NL2ACSL** (2024)
  - Natural Language to ACSL translation research
  - Research stage tool for converting natural language specifications to ACSL annotations

- **CASP Dataset** (2024)
  - Benchmark dataset for ACSL verification
  - Used for evaluating formal verification tools

- **DafnyBench** (2024)
  - Benchmark suite for Dafny verification
  - URL: https://github.com/dafny-lang/dafny

- **OCLVerifier** (2024)
  - Automated verification tool for OCL constraints
  - 2024 research on OCL consistency checking

- **PRISM** and **Storm**
  - Probabilistic model checkers
  - Academic tools for probabilistic system verification

- **SpaceEx**, **PHAVer**
  - Hybrid automata analysis tools
  - Academic tools for cyber-physical systems

- **dReal**
  - SMT solver for nonlinear arithmetic
  - Used for hybrid systems verification

- **KeYmaera X**
  - Hybrid systems theorem prover
  - Verification tool for cyber-physical systems

- **Marabou**, **Reluplex**
  - Neural network verification tools
  - Research tools for ML system verification

---

### Industrial Case Studies

- **MongoDB and TLA+**
  - Industrial adoption case study
  - MongoDB uses TLA+ for protocol verification

- **Microsoft and Pact**
  - 2024 corporate adoption
  - Microsoft adopts Pact for contract testing

- **AWS Formal Verification**
  - AWS components using formal verification
  - Industry use of formal methods in cloud infrastructure

---

## 7. Additional References

### Related Technologies

- **Protocol Buffers:** https://developers.google.com/protocol-buffers
- **Apache Avro:** https://avro.apache.org/
- **Apache Thrift:** https://thrift.apache.org/
- **Apache Beam:** https://beam.apache.org/
- **WebAssembly:** https://webassembly.github.io/spec/
- **GraphQL:** https://graphql.org/
- **gRPC:** https://grpc.io/

### Related RFCs

- **RFC 2622 - RPSL (Routing Policy Specification Language)**
  - Authors: C. Alaettinoglu, et al.
  - Year: 1999
  - Description: Network router configuration generation language

- **Ethereum Yellow Paper**
  - Authors: Gavin Wood, et al.
  - Year: 2014 (ongoing revisions)
  - URL: https://ethereum.github.io/yellowpaper/paper.pdf
  - Description: Formal state-transition function for Ethereum smart contracts

---

## Index by Category

### Formal Methods (Languages)
- TLA+, Alloy, Z, B Method, VDM, OCL

### Verification-Aware Languages
- Dafny, F*, Why3, SPARK, ACSL, JML

### Property-Based Testing
- QuickCheck, Hypothesis, ScalaCheck, jqwik, FastCheck

### Contract Testing
- Pact, OpenAPI, Spring Cloud Contract

### State Machines
- SCXML, UML State Machines

### Workflow/Business Rules
- DMN/FEEL, PRR, BPMN, CWL, TOSCA

### Policy/Expression Languages
- CEL, Rego, JMESPath, JSONata, JsonLogic

### Testing Notation
- TTCN-3

### Tools
- TLC (TLA+ model checker)
- APALACHE (symbolic TLA+)
- Alloy Analyzer
- GNATprove (SPARK)
- Frama-C (ACSL)
- OpenJML

### Standards Bodies
- OMG (DMN, PRR, BPMN, OCL, UML)
- W3C (SCXML, RIF)
- OASIS (TOSCA, CACAO)
- ETSI (TTCN-3)
- IETF/IRTF (RFCs)

---

## Document Sources

This bibliography consolidates references from the following research documents:

1. **cross-language-logic-specifications.md** - Survey of cross-language logic specifications
2. **testable-program-specifications.md** - Comprehensive survey of testable program specifications
3. **gap-analysis.md** - Gap analysis for language-agnostic program specifications
4. **executive-summary.md** - Research summary and recommendations
5. **rfc-publication-process.md** - RFC and Internet-Draft publication workflow

---

**Last Updated:** 2025-02-01
