# Executable Semantics for Formal Specifications

**Status:** Research Report
**Date:** 2025-02-01
**Topic:** Making Z notation, B Method, and VDM specifications executable

---

## Executive Summary

Formal specifications (Z, B, VDM) are powerful for system modeling but face significant challenges in becoming truly executable. While animation tools exist for demonstration purposes, compilation to production code and runtime monitoring capabilities remain in the research stage.

---

## 1. Current State: Animation/Execution Capabilities

### Z Notation

**Primary Tools:**

| Tool | Capabilities | Maturity |
|------|-------------|----------|
| **ProB** | Interactive state exploration, constraint solving, model checking, Java API | High |
| **Community Z Tools (CZT)** | Z notation support, various backends | Medium |

**What Exists:**
- State exploration through animation
- Interactive stepping through operations
- Constraint-based state generation
- **Limited compilation to actual code**

---

### B Method

**Primary Tools:**

| Tool | Capabilities | Maturity |
|------|-------------|----------|
| **ProB** | Full abstract machine execution, Event-B animation, Rodin integration | High |
| **Atelier B** | Machine-oriented animation, proof support | Commercial |
| **BToolkit** | Traditional B method toolset | Legacy |

**What Exists:**
- Stepwise execution from abstract to concrete
- Animation of refinement steps
- **Partial compilation through toolchains**

---

### VDM (VDM-SL/VDM++)

**Primary Tools:**

| Tool | Capabilities | Maturity |
|------|-------------|----------|
| **Overture** | Operation animation, trace replay, VS Code integration | High (24th workshop 2024) |
| **VDMTools** | Commercial VDM support | Commercial |

**Recent Developments (2024):**
- **Interactive HTML Export** (F Vu, 2024): Static export of animation traces to HTML

**What Exists:**
- Operation animation and execution
- State management visualization
- **Limited compilation to production code**

---

## 2. Compilation Approaches

### Current Capabilities

| Framework | Compilation | Output | Maturity |
|-----------|-------------|--------|----------|
| **Z notation** | ✗ | Animation traces only | Research |
| **B Method** | △ | Machine execution events | Early |
| **VDM** | ✗ | Animation traces | Research |
| **Dafny** | ✓ | C#, JavaScript, Python, Go, Rust | Production |
| **F*** | ✓ | C#, verified OCaml | Production |
| **TLA+** | Simulation | State exploration only | High |

### Successful Compilation Models

**Dafny Approach:**
- Direct compilation to multiple target languages
- Verification through Boogie intermediate representation
- Type-preserving compilation
- Integration with mainstream development

**F* Approach:**
- Calculus of Constructions with effects
- Compilation to verified C code (Low*)
- Cryptographic applications demonstrate success

**Key Insight:** Dafny and F* succeed because they were **designed from the start** as verification-aware languages, not added as afterthoughts.

---

## 3. Runtime Verification Capabilities

### Current Landscape

| Framework | Runtime Monitoring | Implementation |
|-----------|-------------------|----------------|
| **ProB** | △ Limited | Animation traces → basic monitoring |
| **JML** | ✓ | Runtime assertion checking |
| **Eiffel** | ✓ | Design by Contract runtime |
| **Dafny** | ✓ | Compilation-based monitoring |
| **SPARK** | ✓ | Runtime assertions |
| **Z/B/VDM** | ✗ | No runtime monitoring |

### What's Missing for Z/B/VDM

1. **Monitor Generation** - No automatic generation of runtime monitors
2. **Instrumentation Tools** - No tools for instrumenting code with spec checks
3. **Cloud Integration** - No integration with observability platforms
4. **Low-Overhead** - No efficient monitoring implementations

---

## 4. Research Directions (2024-2025)

### Key Research Areas

1. **Executable Semantics**
   - "Towards Correct Executable Semantics for Z" (Springer, 2024)
   - Focus on semantic correctness and animation
   - Abstract interpretation principles for Z animation tools

2. **Specification-to-Code Translation**
   - **SpecGen** (ICSE 2025): Automated generation using LLMs
   - Correctness-preserving transformations
   - Integration with CI/CD pipelines

3. **Cross-Platform Execution**
   - WebAssembly compilation for cross-language semantics
   - Portable runtime environments

4. **AI Integration**
   - LLM-assisted specification creation
   - Automated test generation from specs
   - Natural language to formal specification translation

---

## 5. Success Stories: What Dafny and F* Did Right

### Dafny Success Factors

1. **Language Integration**
   - Native support in Visual Studio
   - Compiler infrastructure from day one
   - Mainstream language targets (C#, Java, Go, Python, Rust)

2. **Verification-First Design**
   - Built-in verification as first-class citizen
   - Immediate feedback on code correctness
   - Incremental verification support

3. **Practical Adoption**
   - Used in production at AWS, Microsoft
   - Clear ROI for critical components
   - Gradual adoption path

### F* Success Factors

1. **Expressive Type System**
   - Full dependent types
   - Effect system for side effects
   - Verified cryptographic applications

2. **Verified Compilers**
   - Compiles to verified C code (Low*)
   - Low-level guarantees maintained
   - Performance optimization validated

### Key Lessons

1. **Compilation is Essential** - Pure animation is not enough
2. **Tooling Matters** - IDE support crucial for adoption
3. **Gradual Adoption** - Start with critical components
4. **Design for Verification** - Must be built-in from the start

---

## 6. Barriers to True Executability

### Technical Barriers

| Barrier | Description | Impact |
|----------|-------------|--------|
| **Semantic Gap** | Formal semantics vs. actual implementation | High |
| **Non-determinism** | Handling non-deterministic operations | High |
| **Resource Constraints** | Memory/time not modeled | Medium |
| **Tooling Complexity** | Complex build chains, poor IDE | High |

### Adoption Barriers

| Barrier | Description | Impact |
|----------|-------------|--------|
| **Learning Curve** | 2-6 months for Z/B/VDM | High |
| **ROI Unclear** | No quantitative metrics | High |
| **Fragmentation** | Multiple competing standards | Medium |
| **Academic Focus** | Research prototypes rarely reach production | High |

---

## 7. What Would Make Z/B/VDM Truly Executable

### Technical Requirements

1. **Compilation Infrastructure**
   - Verified compilers for each formalism
   - Multiple backend targets (C, Java, Python, Rust)
   - Performance-optimized execution

2. **Runtime Monitor Generation**
   - Automatic monitor creation from specifications
   - Low-overhead implementation
   - Distributed monitoring support

3. **Specification Enhancement**
   - Explicit timing and resource models
   - Probabilistic extensions
   - Real-time capabilities

### Tooling Requirements

1. **Development Environment**
   - VS Code extensions with LSP
   - Integrated debugging
   - Visualization tools

2. **CI/CD Integration**
   - GitHub Actions workflows
   - Automated testing
   - Regression prevention

3. **Educational Resources**
   - Interactive tutorials
   - Example projects
   - Learning paths

---

## 8. Recommended Path Forward

### Short-Term (1-2 Years)

1. **Improve Animation Tools**
   - Enhanced ProB and Overture capabilities
   - Better visualization
   - Export to common formats

2. **Compilation Research**
   - Prototype compilers for Z/VDM
   - Focus on well-understood subsets
   - Integration with existing tools

3. **Runtime Experiments**
   - Monitor generation for B method
   - Performance testing
   - Case studies

### Medium-Term (2-5 Years)

1. **Production-Ready Compilers**
   - Verified implementations
   - Multiple language targets
   - Performance optimization

2. **Runtime Verification Frameworks**
   - Standard monitor formats
   - Cloud integration
   - Distributed monitoring

3. **Tool Integration**
   - VS Code/LSP support
   - CI/CD pipelines
   - Package repository

### Long-Term (5-10 Years)

1. **Universal Formal System**
   - Integrated Z/B/VDM capabilities
   - Cross-platform execution
   - Comprehensive tooling

2. **AI Integration**
   - AI-assisted specification
   - Automated verification
   - Natural language interfaces

3. **Industry Standard**
   - Formal methods consortium
   - Certification requirements
   - Best practices guide

---

## 9. Conclusion

Making formal specifications truly executable requires addressing both technical and adoption challenges. While animation tools like ProB and Overture provide valuable demonstration capabilities, the path to production executability involves:

1. **Compilation Infrastructure**: Building compilers that translate specifications to runnable code
2. **Runtime Monitors**: Generating efficient runtime verification from formal specs
3. **Tool Integration**: Making formal methods accessible through modern development environments
4. **Ecosystem Building**: Creating standards, repositories, and communities for adoption

**The success of Dafny and F* demonstrates that executable formal methods are possible**, but significant work remains to make Z, B, and VDM similarly accessible. The research community should focus on practical implementations, industry partnerships, and tooling improvements.

---

## 10. References

### Key Resources
- [ProB - The ProB Animator and Model Checker](https://prob.hhu.de/)
- [Overture Project](https://overturetool.org/)
- [Dafny Documentation](https://dafny.org/)
- [F* Programming Language](https://www.fstar-lang.org/)

### Recent Research (2024-2025)
- F Vu (2024). "Generating interactive documents for domain-specific validation"
- RV 2024 Conference Proceedings
- "Towards Correct Executable Semantics for Z" (Springer, 2024)
- "Combining LLM Code Generation with Formal Specifications" (2024)
- SpecGen: Automated Generation of Formal Program Specifications (ICSE 2025)

### Academic References
- Runtime Verification: A Tutorial (Falcone et al.)
- High-Integrity Runtime Verification (Goodloe, 2024)
- The Z notation: A reference manual
- The B-Book: An Introduction to Practical Formal Methods (Abrial)
- VDM books and manuals
