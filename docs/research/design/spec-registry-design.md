# SpecRegistry: Package Repository Design for Specifications

**Status:** Design Document
**Date:** 2025-02-01
**Topic:** Design for a package repository of formal specifications (like npm for specs)

---

## Executive Summary

This document presents a comprehensive design for **SpecRegistry**, a package repository for formal specifications. The design addresses the critical gap identified in research: no equivalent of npm, PyPI, or crates.io exists for sharing and reusing specifications.

---

## 1. Design Goals

| Goal | Description | Priority |
|------|-------------|----------|
| **Framework Agnostic** | Support TLA+, Alloy, Z, SCXML, OpenAPI, Pact, etc. | Critical |
| **Semantic Versioning** | Spec-compatible version management | Critical |
| **Dependency Resolution** | Specs can depend on other specs | High |
| **Security First** | Signing, scanning, supply chain security | Critical |
| **Developer Friendly** | CLI, IDE integration, CI/CD | High |
| **Performant** | Fast search, download, installation | Medium |
| **Extensible** | Plugin architecture for custom workflows | Medium |

---

## 2. Universal Package Format

### 2.1 Package Structure

```
spec-name@1.2.3/
├── spec.yaml              # Package manifest
├── specs/                 # Specification files
│   ├── main.tla           # TLA+ specification
│   ├── types.alloy        # Alloy dependency
│   └── protocol.scxml     # State machine
├── tests/                 # Conformance tests
│   ├── test1.yaml
│   └── test2.yaml
├── docs/                  # Documentation
│   ├── overview.md
│   └── examples.md
├── metadata/              # Signatures, provenance
│   ├── signature.sig
│   └── provenance.json
└── tools/                 # Tool-specific configs (optional)
    ├── tlaplus.yaml
    └── alloy.yaml
```

### 2.2 Manifest (spec.yaml)

```yaml
name: "payment-protocol"
version: "1.2.3"
framework: "tlaplus"
description: "Formal specification of distributed payment protocol"

dependencies:
  tlapus/state-machine: "^1.0.0"
  crypto/algorithms: "~2.1.0"

devDependencies:
  testing/property-based: "^3.0.0"

specifications:
  main: "specs/main.tla"
  modules:
    - "specs/protocol.tla"
    - "specs/invariants.tla"

tests:
  - "tests/test1.yaml"
  - "tests/test2.yaml"

documentation:
  readme: "docs/overview.md"
  examples: "docs/examples.md"

tools:
  tlaplus:
    module: "PaymentProtocol"
    options:
      depth: 10
  alloy:
    scope: 5

keywords:
  - "distributed"
  - "payment"
  - "protocol"
  - "consensus"

license: "MIT"
author: "Team <team@example.com>"
repository: "https://github.com/org/payment-protocol-spec"
homepage: "https://specs.example.com/payment-protocol"
```

---

## 3. Registry Architecture

### 3.1 System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         Clients                               │
│  CLI | IDE Plugins | CI/CD | Web UI | API | Federation       │
└────────────┬──────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────┐
│                    API Gateway / Load Balancer                │
└────────────┬──────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼─────┐
│  Core  │      │ Search   │
│  API   │      │ Service  │
└───┬────┘      └────┬─────┘
    │                │
┌───▼────────────────▼────────┐
│      Storage Layer           │
│  ┌─────────┐  ┌──────────┐  │
│  │Packages │  │  Index   │  │
│  │ (S3/GCS) │  │(ES/OpenSearch)│
│  └─────────┘  └──────────┘  │
└─────────────────────────────┘
```

### 3.2 API Design

**REST Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/packages` | GET | List packages |
| `/api/v1/packages/{name}` | GET | Get package metadata |
| `/api/v1/packages/{name}/{version}` | GET | Get specific version |
| `/api/v1/packages/{name}/{version}/tarball` | GET | Download package |
| `/api/v1/search` | GET | Search packages |
| `/api/v1/publish` | POST | Publish package |
| `/api/v1/dependencies` | POST | Resolve dependencies |
| `/api/v1/verify` | POST | Verify signature |

**Example: Publish Package**

```bash
curl -X POST https://registry.spec.org/api/v1/publish \
  -H "Authorization: Bearer $TOKEN" \
  -F "package=@payment-protocol-1.2.3.tar.gz" \
  -F "signature=@package.sig"
```

---

## 4. Spec-Aware Dependency Resolution

### 4.1 Semantic Versioning for Specifications

| Version Type | Rule | Example |
|--------------|------|---------|
| **Major** | Breaking changes to semantics | 1.0.0 → 2.0.0 |
| **Minor** | Backward-compatible additions | 1.0.0 → 1.1.0 |
| **Patch** | Bug fixes, documentation | 1.0.0 → 1.0.1 |
| **Pre-release** | Prerelease versions | 1.0.0-alpha.1 |
| **Build** | Build metadata | 1.0.0+20250201 |

### 4.2 Dependency Constraints

```yaml
dependencies:
  # Exact version
  exact/spec: "1.2.3"

  # Compatible with version (allows updates < 2.0.0)
  compatible/spec: "^1.2.3"

  # Approximate version (allows updates < 1.3.0)
  approx/spec: "~1.2.3"

  # Range
  range/spec: ">=1.2.3 <2.0.0"

  # Any version
  any/spec: "*"
```

### 4.3 Resolution Algorithm

```
1. Collect all dependencies
2. Detect version conflicts
3. Apply constraint resolution (unified SAT solver)
4. Generate dependency graph
5. Verify cyclic dependencies (error if found)
6. Create lockfile with resolved versions
```

---

## 5. Security Architecture

### 5.1 Security Layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Authentication** | OAuth 2.0, API Keys | Identity verification |
| **Package Signing** | Sigstore/cosign | Integrity verification |
| **Vulnerability Scanning** | OSV, GitHub Advisory | Security checks |
| **Supply Chain** | SL-SA, provenance | Traceability |
| **Access Control** | RBAC, scopes | Authorization |
| **Rate Limiting** | Per-user, per-IP | Abuse prevention |

### 5.2 Signing and Verification

**Signing a Package:**

```bash
# Create signature
spec sign payment-protocol-1.2.3.tar.gz

# Output: payment-protocol-1.2.3.tar.gz.sig
# Includes: Sigstore signing, certificate transparency log
```

**Verification:**

```bash
# Automatic verification on install
spec install payment-protocol

# Manual verification
spec verify payment-protocol-1.2.3.tar.gz \
  --signature payment-protocol-1.2.3.tar.gz.sig
```

### 5.3 Vulnerability Scanning

**Automatic Scanning:**
- Scan all packages on publish
- Check against OSV, GitHub Advisory, CVE databases
- Block or warn on vulnerable dependencies
- Provide security reports

**API Response:**

```json
{
  "package": "payment-protocol@1.2.3",
  "scan_results": {
    "status": "warning",
    "vulnerabilities": [
      {
        "id": "CVE-2024-12345",
        "severity": "medium",
        "affected_versions": ["<1.2.3"],
        "fix_version": "1.2.3"
      }
    ]
  }
}
```

---

## 6. CLI Tooling Design

### 6.1 Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `spec init` | Initialize new spec package | `spec init` |
| `spec install` | Install dependencies | `spec install` |
| `spec publish` | Publish package | `spec publish` |
| `spec search` | Search packages | `spec search "payment"` |
| `spec info` | Show package info | `spec info payment-protocol` |
| `spec update` | Update dependencies | `spec update` |
| `spec outdated` | Check for updates | `spec outdated` |
| `spec audit` | Security audit | `spec audit` |
| `spec verify` | Verify signature | `spec verify package.tar.gz` |
| `spec login` | Authenticate | `spec login` |

### 6.2 Workflow Examples

**Initial Setup:**

```bash
# Initialize new package
spec init payment-protocol
# Creates: spec.yaml, specs/, tests/, docs/

# Write specification
vim specs/main.tla

# Install dependencies
spec install
# Creates: spec-lock.yaml, .spec/

# Add dependency
spec add tlapus/state-machine

# Run tests
spec test

# Publish
spec publish
```

**CI/CD Integration:**

```yaml
# .github/workflows/spec-check.yml
name: Spec Check
on: [push, pull_request]

steps:
  - uses: actions/checkout@v4
  - uses: spec-org/setup-spec@v1
  - run: spec install
  - run: spec verify
  - run: spec test
  - run: spec audit
```

---

## 7. IDE Integration

### 7.1 VS Code Extension

**Features:**
- Syntax highlighting for all spec languages
- IntelliSense for spec dependencies
- Inline error messages
- Quick install of dependencies
- Spec documentation preview
- Test runner integration

**Example Extension API:**

```typescript
// Provide spec completion
vscode.languages.registerCompletionItemProvider('spec', {
  provideCompletionItems(document, position) {
    // Suggest packages from registry
    return searchRegistry(document.getText(position));
  }
});

// Quick fix: install missing dependency
vscode.languages.registerCodeActionsProvider('spec', {
  provideCodeActions(document, range) {
    // Detect "package not found" errors
    // Offer "Install package" quick action
  }
});
```

### 7.2 Other IDE Support

| IDE | Support Level | Features |
|-----|---------------|----------|
| **IntelliJ** | Plugin | Same as VS Code |
| **Eclipse** | Plugin | Integration with existing modeling tools |
| **Emacs/Vim** | LSP | Language Server Protocol support |
| **JetBrains CLion** | Plugin | C/C++ focused formal methods |

---

## 8. Governance and Operations

### 8.1 Governance Model

**Options:**

| Model | Pros | Cons |
|-------|------|------|
| **Non-profit Foundation** | Neutral, community-driven | Slower decision-making |
| **Consortium** | Industry-backed | Risk of vendor capture |
| **B-Corp** | Sustainable, mission-driven | Profit expectations |
| **Community Project** | Open, accessible | Limited resources |

**Recommendation:** Start as community project under Linux Foundation or Eclipse Foundation, transition to independent foundation when mature.

### 8.2 Funding Model

| Source | Purpose | Target |
|--------|---------|--------|
| **Corporate Sponsorship** | Infrastructure, development | 40% |
| **Service Fees** | Private registry, SLA, support | 30% |
| **Grants** | Research, open-source development | 20% |
| **Donations** | Community support, operations | 10% |

---

## 9. Implementation Roadmap

### Phase 1: Foundation (3-6 months)
- Core registry API
- CLI basic commands
- Package format specification
- Documentation website

### Phase 2: Tooling (6-9 months)
- VS Code extension
- CI/CD integration
- Dependency resolution
- Search capabilities

### Phase 3: Verification (9-12 months)
- Security scanning
- Package signing
- Provenance tracking
- Audit capabilities

### Phase 4: Ecosystem (12-18 months)
- Multiple registry instances
- Federation protocol
- Community packages
- Industry adoption

### Phase 5: Scale (18+ months)
- Enterprise features
- Advanced analytics
- AI-assisted discovery
- Commercial services

---

## 10. Comparison with Existing Package Managers

| Feature | SpecRegistry | npm | Cargo | pip |
|---------|-------------|-----|-------|-----|
| **Multi-Framework** | ✓ | ✗ | ✗ | ✗ |
| **Formal Verification** | ✓ | ✗ | ✗ | ✗ |
| **Behavioral Semantics** | ✓ | ✗ | ✗ | ✗ |
| **Package Signing** | ✓ | Basic | ✓ | ✗ |
| **Supply Chain** | ✓ | ✗ | ✗ | ✗ |
| **Dependency Types** | Semantic | Semantic | Semantic | Loose |
| **Language Targets** | Any | JS | Rust | Python |
| **Enterprise Features** | ✓ | ✓ | ✗ | ✗ |

---

## 11. Migration Path for Existing Tools

### 11.1 From Git Repositories

```bash
# Convert Git repo to SpecRegistry package
spec migrate https://github.com/org/spec-repo
# Analyzes repo, creates spec.yaml, publishes
```

### 11.2 From Existing Packages

```bash
# Import from existing package manager
spec import --from npm payment-protocol-spec
# Converts package.json to spec.yaml
```

---

## 12. Conclusion

**SpecRegistry** fills a critical gap in the formal methods ecosystem by providing:

1. **Sharing** - Public registry for specification packages
2. **Reuse** - Dependency management for specs
3. **Security** - Signing, scanning, supply chain integrity
4. **Integration** - CLI, IDE, CI/CD from day one
5. **Community** - Open governance, multiple implementations

**Next Steps:**
1. Define package format specification
2. Build prototype registry and CLI
3. Create reference implementation
4. Establish governance structure
5. Build community and ecosystem

**Success Metrics:**
- 1,000 packages in first year
- 5,000 monthly active users
- 10+ enterprise customers
- Active community contributors

---

## 13. References

### Package Managers Studied
- [npm Registry](https://www.npmjs.com/)
- [Cargo (crates.io)](https://crates.io/)
- [PyPI](https://pypi.org/)
- [Maven Central](https://mvnrepository.com/)

### Security Technologies
- [Sigstore](https://www.sigstore.dev/)
- [Cosign](https://github.com/sigstore/cosign)
- [SLSA](https://slsa.dev/)

### Relevant Standards
- [SPDX](https://spdx.dev/) (license identifiers)
- [CycloneDX](https://cyclonedx.org/) (SBOM)
- [OMG ReqIF](https://www.omg.org/spec/ReqIF/) (requirements interchange)
