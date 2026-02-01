# BSIF Versioning and Compatibility Policy

**Status:** Supplemental Document
**Version:** 1.0.0-draft
**Date:** 2025-02-01
**Topic:** Semantic versioning rules, compatibility guarantees, and deprecation process for BSIF

---

## Executive Summary

This document defines the versioning policy for BSIF, including Semantic Versioning 2.0.0 application, compatibility rules between format versions, deprecation process, and migration paths for breaking changes.

---

## Table of Contents

1. [Semantic Versioning](#1-semantic-versioning)
2. [Format Versioning](#2-format-versioning)
3. [Specification Versioning](#3-specification-versioning)
4. [Compatibility Rules](#4-compatibility-rules)
5. [Deprecation Process](#5-deprecation-process)
6. [Migration Guide](#6-migration-guide)
7. [Tool Versioning](#7-tool-versioning)

---

## 1. Semantic Versioning

BSIF uses [Semantic Versioning 2.0.0](https://semver.org/) for version numbering.

### 1.1 Version Format

```
MAJOR.MINOR.PATCH

Examples:
- 1.0.0
- 1.2.3
- 2.0.0
- 10.4.2
```

### 1.2 Version Component Meanings

| Component | Meaning | Examples |
|-----------|---------|----------|
| **MAJOR** | Incompatible API changes | 1.0.0 → 2.0.0 |
| **MINOR** | Backwards-compatible functionality | 1.0.0 → 1.1.0 |
| **PATCH** | Backwards-compatible bug fixes | 1.0.0 → 1.0.1 |

### 1.3 Pre-release Versions

Pre-release versions are denoted with a hyphen and identifier:

```
1.0.0-alpha
1.0.0-alpha.1
1.0.0-beta
1.0.0-beta.2
1.0.0-rc.1
```

**Stability ordering:** `alpha` < `beta` < `rc` < (no suffix)

### 1.4 Build Metadata

Build metadata may be appended with a plus sign:

```
1.0.0+20130313144700
1.0.0-beta+exp.sha.5114f85
```

Build metadata **MUST NOT** be used for version ordering.

---

## 2. Format Versioning

BSIF has two types of versions:

### 2.1 Format Version (`bsif_version`)

The version of the BSIF **format specification** itself.

**Location:** `metadata.bsif_version`

**Example:**

```json
{
  "metadata": {
    "bsif_version": "1.0.0"
  }
}
```

**Responsibility:** Set by the BSIF specification maintainers.

### 2.2 Document Version (`version`)

The version of a specific **specification document**.

**Location:** `metadata.version`

**Example:**

```json
{
  "metadata": {
    "name": "my-spec",
    "version": "2.3.1"
  }
}
```

**Responsibility:** Set by the specification author.

### 2.3 Version Interactions

| Version | Controlled By | Changes When |
|---------|---------------|--------------|
| `bsif_version` | BSIF spec | Format structure changes |
| `version` | Spec author | Specification content changes |

**Both versions are independent:**

```json
{
  "metadata": {
    "bsif_version": "2.0.0",   // Uses BSIF format v2.0.0
    "name": "traffic-light",
    "version": "1.5.2"          // Traffic light spec v1.5.2
  }
}
```

---

## 3. Specification Versioning

Specification authors use Semantic Versioning for their specifications:

### 3.1 When to Bump Versions

| Change | Version Bump | Example |
|--------|--------------|---------|
| Add new state | PATCH | 1.0.0 → 1.0.1 |
| Add new optional field | MINOR | 1.0.0 → 1.1.0 |
| Add new required field | MAJOR | 1.0.0 → 2.0.0 |
| Remove state | MAJOR | 1.0.0 → 2.0.0 |
| Rename property | MAJOR | 1.0.0 → 2.0.0 |
| Change transition logic | MAJOR | 1.0.0 → 2.0.0 |
| Fix bug in specification | PATCH | 1.0.0 → 1.0.1 |
| Add new property | MINOR | 1.0.0 → 1.1.0 |
| Strengthen invariant | MAJOR | 1.0.0 → 2.0.0 |

### 3.2 Version Comparison

Tools **MUST** support semantic version comparison:

```
1.0.0 < 1.0.1
1.0.0 < 1.1.0
1.0.0 < 2.0.0
1.0.0-alpha < 1.0.0
1.0.0-beta > 1.0.0-alpha
```

**Implementation example (Python):**

```python
from semver import Version

def version_greater(v1, v2):
    """Compare semantic versions"""
    return Version.parse(v1) > Version.parse(v2)

# Usage
version_greater("1.2.0", "1.1.0")  # True
version_greater("2.0.0", "1.999.0")  # True
```

---

## 4. Compatibility Rules

### 4.1 Format Compatibility

| Scenario | Compatibility | Notes |
|----------|---------------|-------|
| Same `bsif_version` | ✓ Compatible | Guaranteed |
| `bsif_version` 1.x → 1.y (same MAJOR) | ✓ Compatible | Must verify MINOR/PATCH |
| `bsif_version` 1.x → 2.y (different MAJOR) | ✗ Incompatible | Breaking changes |

**Example compatibility matrix:**

| Tool Version | Spec 1.0.0 | Spec 1.1.0 | Spec 2.0.0 |
|--------------|-----------|-----------|-----------|
| Tool 1.0.0 | ✓ | ✓ | ✗ |
| Tool 1.1.0 | ✓ | ✓ | ✗ |
| Tool 2.0.0 | ✗ | ✗ | ✓ |

### 4.2 Backwards Compatibility

A tool version `X.Y.Z` is **backwards compatible** with specification format versions `X.Y'.Z'` where:
- `X` is the same MAJOR version
- `Y' <= Y` (equal or lower MINOR version)

**Example:** Tool 1.5.0 supports:
- ✓ Spec format 1.0.0
- ✓ Spec format 1.5.0
- ✓ Spec format 1.4.0
- ✗ Spec format 2.0.0

### 4.3 Forward Compatibility

Tools **SHOULD** attempt to parse newer format versions:

```python
def parse_specification(document):
    format_version = document['metadata']['bsif_version']

    # Check compatibility
    if format_version.startswith('1.'):
        return parse_v1(document)
    elif format_version.startswith('2.'):
        # Attempt to parse v2 with v1 parser
        try:
            return parse_v2_as_v1(document)
        except IncompatibleError:
            raise UnsupportedVersionError(
                f"Format version {format_version} not supported. "
                f"Tool version 1.x.x only supports format 1.x.x"
            )
    else:
        raise UnsupportedVersionError(
            f"Unknown format version: {format_version}"
        )
```

### 4.4 Required Field Changes

| Change Type | Version Bump | Rationale |
|-------------|--------------|-----------|
| New optional field | PATCH | Doesn't affect existing specs |
| New required field | MAJOR | Existing specs become invalid |
| Make optional field required | MAJOR | Existing specs become invalid |
| Make required field optional | MINOR | Existing specs still valid |
| Remove optional field | MINOR | Existing specs still valid (field ignored) |
| Remove required field | MAJOR | Existing specs become invalid |

### 4.5 Enum Value Changes

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Add enum value | MINOR | Add `"probabilistic"` to `type` |
| Remove enum value | MAJOR | Remove deprecated `type` |
| Rename enum value | MAJOR | `"state-machine"` → `"statemachine"` |

---

## 5. Deprecation Process

### 5.1 Deprecation Lifecycle

```
┌─────────┐    ┌──────────────┐    ┌───────────────┐    ┌─────────┐
│ Current │───▶│  Deprecated  │───▶│  Warning Only │───▶│ Removed │
└─────────┘    └──────────────┘    └───────────────┘    └─────────┘
                    │                      │
                    ▼                      ▼
              Documentation           Tool Warning
              Notice                   (Non-blocking)
```

### 5.2 Deprecation Timeline

| Phase | Duration | Tool Behavior |
|-------|----------|---------------|
| **Current** | - | Full support |
| **Deprecated** | Until next MAJOR | Documentation notice |
| **Warning Only** | 1 MAJOR version | Non-blocking warning |
| **Removed** | After warning phase | Error, migration required |

**Example timeline:**

```
Version 1.0.0: Field `legacy_field` introduced
Version 1.5.0: `legacy_field` deprecated, `new_field` added
Version 2.0.0: `legacy_field` warning recommended (not required)
Version 3.0.0: `legacy_field` removed, error on use
```

### 5.3 Deprecation Notice Format

**In specification:**

```json
{
  "deprecated_fields": {
    "legacy_field": {
      "deprecated_in": "1.5.0",
      "removed_in": "3.0.0",
      "replacement": "new_field",
      "migration_guide": "https://bsif-spec.io/migration/1-to-2"
    }
  }
}
```

**In tool output:**

```
Warning: Field 'legacy_field' is deprecated since BSIF 1.5.0
and will be removed in BSIF 3.0.0. Use 'new_field' instead.
See: https://bsif-spec.io/migration/1-to-2
```

### 5.4 Grace Period Requirements

| Version | Grace Period | Minimum |
|---------|--------------|---------|
| **Major versions** | Deprecation → Removal | 2 MAJOR versions |
| **Minor versions** | Feature introduction → stable | 1 MINOR version |
| **Patch versions** | Bug fix release | None (immediate) |

**Minimum grace period:** 2 years between deprecation and removal for MAJOR changes.

---

## 6. Migration Guide

### 6.1 Migration Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| **Automatic migration** | Tool transforms old to new format | Unambiguous changes |
| **Semi-automatic** | Tool transforms with manual steps | Semi-ambiguous changes |
| **Manual migration** | Hand-written migration | Complex semantic changes |

### 6.2 Automatic Migration Example

**Version 1.0.0 → 2.0.0: Rename field**

```python
def migrate_v1_to_v2(v1_spec):
    """Migrate BSIF 1.0.0 to 2.0.0"""
    v2_spec = v1_spec.copy()

    # Rename: initial_state → initial
    if 'initial_state' in v2_spec['semantics']:
        v2_spec['semantics']['initial'] = v2_spec['semantics']['initial_state']
        del v2_spec['semantics']['initial_state']

    # Update format version
    v2_spec['metadata']['bsif_version'] = '2.0.0'

    return v2_spec
```

**CLI usage:**

```bash
bsif migrate --from 1.0.0 --to 2.0.0 spec.bsif.json > spec-v2.bsif.json
```

### 6.3 Semi-Automatic Migration

**Version 1.0.0 → 2.0.0: Constraint syntax changes**

```python
def migrate_constraints_v1_to_v2(v1_spec):
    """Migrate constraints with manual review needed"""
    v2_spec = v1_spec.copy()

    warnings = []

    # Old: Single expression string
    # New: Structured constraint object
    for constraint in v2_spec['semantics']['preconditions']:
        if isinstance(constraint, str):
            # Attempt automatic conversion
            v2_constraint = {
                'description': 'Migrated from v1 (please review)',
                'expression': constraint
            }
            warnings.append(f"Converted constraint: {constraint[:50]}...")

    if warnings:
        print("Migration warnings:")
        for warning in warnings:
            print(f"  - {warning}")
        print("Please review migrated specification.")

    return v2_spec
```

### 6.4 Manual Migration Checklist

For manual migrations (complex semantic changes):

- [ ] Read specification changes in release notes
- [ ] Review all affected specifications
- [ ] Update deprecated field usage
- [ ] Update expression syntax if changed
- [ ] Verify migration with test suite
- [ ] Update documentation
- [ ] Commit migration with reference to old version

### 6.5 Migration Testing

```python
def test_migration():
    """Verify migration produces valid specification"""

    # Load original v1 spec
    v1_spec = load_specification('spec-v1.bsif.json')

    # Migrate to v2
    v2_spec = migrate_v1_to_v2(v1_spec)

    # Validate migrated spec
    errors = validate(v2_spec, schema='bsif-2.0.0.json')
    assert len(errors) == 0, f"Migration produced invalid spec: {errors}"

    # Verify semantics preserved
    assert_semantics_equivalent(v1_spec, v2_spec)

    print("Migration test passed!")
```

---

## 7. Tool Versioning

### 7.1 Tool vs Format Versioning

Tools have independent versioning from the BSIF format:

| Component | Version Example | Responsibility |
|-----------|-----------------|----------------|
| **BSIF format** | 1.0.0, 2.0.0 | BSIF specification maintainers |
| **BSIF tool** | 3.2.1, 4.0.0 | Tool implementers |

**Example:**

```
bsif-validator v3.2.1
  Supports: BSIF format v1.0.0, v1.1.0, v1.2.0
  Does not support: BSIF format v2.0.0
```

### 7.2 Tool Versioning Strategy

Tools **SHOULD** use Semantic Versioning with the following interpretation:

| Component | Meaning | Example |
|-----------|---------|---------|
| **MAJOR** | Breaking API changes, dropped format support | 3.x.x → 4.x.x |
| **MINOR** | New format support, new features | 3.2.x → 3.3.x |
| **PATCH** | Bug fixes, performance improvements | 3.2.1 → 3.2.2 |

### 7.3 Supported Format Versions

Tools **MUST** declare supported BSIF format versions:

**Example (tool metadata):**

```json
{
  "name": "bsif-validator",
  "version": "3.2.1",
  "supported_bsif_versions": {
    "compatible": ["1.0.0", "1.1.0", "1.2.0"],
    "deprecated": ["1.0.0"],
    "incompatible": ["2.0.0"]
  }
}
```

**CLI output:**

```bash
$ bsif-validator --version
bsif-validator 3.2.1
Supports BSIF format: 1.0.0 - 1.2.0
Does not support BSIF format: 2.0.0+
```

### 7.4 Version Detection

Tools **MUST** check `bsif_version` before processing:

```python
def process_specification(document):
    format_version = document['metadata']['bsif_version']

    if format_version not in SUPPORTED_FORMAT_VERSIONS:
        raise UnsupportedVersionError(
            f"BSIF format version {format_version} is not supported. "
            f"Supported versions: {SUPPORTED_FORMAT_VERSIONS}"
        )

    # Process specification
    return validate_and_verify(document)
```

### 7.5 Compatibility Mode

Tools **MAY** provide compatibility mode for newer formats:

```python
def parse_with_compatibility(document):
    """Attempt to parse newer format versions"""

    format_version = document['metadata']['bsif_version']

    if format_version == CURRENT_FORMAT_VERSION:
        return parse(document)
    elif format_version > CURRENT_FORMAT_VERSION:
        # Try compatibility mode
        try:
            return parse_compatibility(document)
        except IncompatibleError as e:
            raise UnsupportedVersionError(
                f"BSIF format {format_version} is not supported. "
                f"Tool supports up to {CURRENT_FORMAT_VERSION}. "
                f"Compatibility mode failed: {e}"
            )
    else:
        return parse_legacy(document)
```

---

## 8. Versioning Best Practices

### 8.1 For Specification Authors

| Practice | Recommendation |
|----------|----------------|
| **Version bumping** | Follow Semantic Versioning strictly |
| **Dependencies** | Pin specific versions of referenced specs |
| **Lock files** | Use `bsif-lock.json` for reproducibility |
| **Changelog** | Document changes between versions |
| **Backwards compatibility** | Preserve existing APIs when possible |

### 8.2 For Tool Implementers

| Practice | Recommendation |
|----------|----------------|
| **Version checking** | Always check `bsif_version` before processing |
| **Graceful degradation** | Attempt to handle newer versions |
| **Clear errors** | Provide actionable error messages |
| **Deprecation warnings** | Warn about deprecated features |
| **Migration support** | Provide migration tools |

### 8.3 For Users

| Practice | Recommendation |
|----------|----------------|
| **Pin versions** | Specify exact `bsif_version` in CI/CD |
| **Test migrations** | Verify migration with test suite |
| **Monitor updates** | Subscribe to BSIF announcement list |
| **Plan migrations** | Allocate time for MAJOR version upgrades |
| **Lock files** | Commit `bsif-lock.json` to version control |

---

## 9. Versioning Examples

### 9.1 Example 1: Backwards Compatible Change

**Scenario:** Add new `parallel` field to state definition

**Version bump:** 1.0.0 → 1.1.0 (MINOR)

**Specification (1.0.0):**

```json
{
  "metadata": { "bsif_version": "1.0.0" },
  "semantics": {
    "type": "state-machine",
    "states": [
      { "name": "red" }
    ]
  }
}
```

**Specification (1.1.0):**

```json
{
  "metadata": { "bsif_version": "1.1.0" },
  "semantics": {
    "type": "state-machine",
    "states": [
      { "name": "red", "parallel": false }
    ]
  }
}
```

**Compatibility:** ✓ 1.0.0 specs work with 1.1.0 tools

### 9.2 Example 2: Breaking Change

**Scenario:** Rename `initial_state` to `initial`

**Version bump:** 1.0.0 → 2.0.0 (MAJOR)

**Specification (1.0.0):**

```json
{
  "metadata": { "bsif_version": "1.0.0" },
  "semantics": {
    "type": "state-machine",
    "initial_state": "red"
  }
}
```

**Specification (2.0.0):**

```json
{
  "metadata": { "bsif_version": "2.0.0" },
  "semantics": {
    "type": "state-machine",
    "initial": "red"
  }
}
```

**Compatibility:** ✗ 1.0.0 specs do NOT work with 2.0.0 tools

**Migration:** Use `bsif migrate --from 1.0.0 --to 2.0.0`

---

## 10. Appendix: Version Comparison Algorithms

### 10.1 Semantic Version Comparison

```python
from typing import Tuple
import re

def parse_semver(version: str) -> Tuple[int, int, int, str, str]:
    """Parse semantic version into components"""
    match = re.match(
        r'^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)'
        r'(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)'
        r'(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?'
        r'(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$',
        version
    )

    if not match:
        raise ValueError(f"Invalid semantic version: {version}")

    major, minor, patch, prerelease, build = match.groups()

    return (
        int(major),
        int(minor),
        int(patch),
        prerelease or '',
        build or ''
    )

def compare_versions(v1: str, v2: str) -> int:
    """
    Compare two semantic versions.

    Returns:
        -1 if v1 < v2
         0 if v1 == v2
         1 if v1 > v2
    """
    major1, minor1, patch1, pre1, _ = parse_semver(v1)
    major2, minor2, patch2, pre2, _ = parse_semver(v2)

    # Compare MAJOR, MINOR, PATCH
    if major1 != major2:
        return -1 if major1 < major2 else 1
    if minor1 != minor2:
        return -1 if minor1 < minor2 else 1
    if patch1 != patch2:
        return -1 if patch1 < patch2 else 1

    # Compare prerelease
    if pre1 and pre2:
        # Both have prerelease, compare dot-separated identifiers
        pre1_parts = pre1.split('.')
        pre2_parts = pre2.split('.')

        for p1, p2 in zip(pre1_parts, pre2_parts):
            # Numeric comparison
            if p1.isdigit() and p2.isdigit():
                n1, n2 = int(p1), int(p2)
                if n1 != n2:
                    return -1 if n1 < n2 else 1
            # String comparison
            else:
                if p1 != p2:
                    return -1 if p1 < p2 else 1

        # More prerelease parts = lower precedence
        if len(pre1_parts) != len(pre2_parts):
            return -1 if len(pre1_parts) < len(pre2_parts) else 1

        return 0
    elif pre1:
        # v1 has prerelease, v2 doesn't
        return -1
    elif pre2:
        # v2 has prerelease, v1 doesn't
        return 1
    else:
        # Neither has prerelease
        return 0

# Usage
compare_versions("1.0.0", "1.0.1")   # -1
compare_versions("1.2.0", "1.1.0")   # 1
compare_versions("1.0.0", "1.0.0")   # 0
compare_versions("1.0.0-alpha", "1.0.0")  # -1
```

### 10.2 Compatibility Check

```python
def is_compatible(
    tool_version: str,
    spec_format_version: str,
    supported_ranges: dict
) -> bool:
    """
    Check if a tool version is compatible with a spec format version.

    Args:
        tool_version: Tool version (e.g., "3.2.1")
        spec_format_version: BSIF format version (e.g., "1.0.0")
        supported_ranges: Supported version ranges per tool major version

    Returns:
        True if compatible, False otherwise
    """
    tool_major = int(tool_version.split('.')[0])
    spec_major = int(spec_format_version.split('.')[0])

    if tool_major not in supported_ranges:
        return False

    supported = supported_ranges[tool_major]

    # Check if spec version is in supported range
    return compare_versions(
        supported['min'],
        spec_format_version
    ) <= 0 and compare_versions(
        spec_format_version,
        supported['max']
    ) <= 0

# Example configuration
SUPPORTED_RANGES = {
    1: {'min': '1.0.0', 'max': '1.999.999'},
    2: {'min': '1.0.0', 'max': '1.999.999'},
    3: {'min': '2.0.0', 'max': '2.999.999'},
}

is_compatible('3.2.1', '2.0.0', SUPPORTED_RANGES)  # True
is_compatible('3.2.1', '1.0.0', SUPPORTED_RANGES)  # False
is_compatible('3.2.1', '3.0.0', SUPPORTED_RANGES)  # False
```

---

**End of Versioning Policy**
