# RFC Publication Process

**Status:** Research Document
**Date:** 2025-02-01
**Topic:** RFC and Internet-Draft publication workflow

## Overview

The RFC Series (ISSN 2070-1721) contains technical and organizational documents about the Internet. All RFCs are first published as Internet-Drafts (I-Ds)—**all RFCs have been I-Ds, but not all I-Ds become RFCs**.

## RFC Streams

RFCs are produced by five streams:

| Stream | Description |
|--------|-------------|
| **IETF** | Internet Engineering Task Force - Standards Track and BCP RFCs, some Informational/Experimental |
| **IRTF** | Internet Research Task Force - Research publications (RFC 5743) |
| **IAB** | Internet Architecture Board - Architectural documents (RFC 4845) |
| **Independent** | Outside official IETF/IAB/IRTF processes - requires ISE approval |
| **Editorial** | RFC Editor internal publications |

---

## Publication Process Stages

### 1. RFC Submission Process

#### IETF Stream
- Working groups develop documents
- Area Directors (ADs) approve for publication with IESG concurrence
- Documents reach RFC Editor through IESG

#### IRTF Stream
- Research groups produce documents
- Process described in RFC 5743

#### IAB Stream
- IAB processes documents as described in RFC 4845

#### Independent Submissions
- Anyone can write and submit an Internet-Draft
- Submitted to Independent Submissions Editor (ISE)
- Reviewed for technical competence, relevance, and writing quality
- Only Informational, Experimental, and Historic categories
- Must not conflict with IETF process

### 2. RFC Editing Process

Documents are processed in roughly FIFO order through the **publication queue**. Each document is assigned a state that tracks progress:

| State Code | Description |
|------------|-------------|
| **EDIT\*** | Being edited by RFC Editor (asterisk = In Independent Stream) |
| **AUTH\*** | Awaiting author response (asterisk = In Independent Stream) |
| **RFC-EDITOR** | Final quality-control state |
| **AUTH48** | Authors' final review (48 hours, often stretches to weeks) |
| **IESG** | Held for IESG discussion/resolution |
| **IANA** | IANA processing (parallel with editing) |
| **MISSREF** | Waiting for referenced document to enter queue |
| **REF** | Waiting for referenced document's editing to complete |

**Important notes:**
- Automatic email messages sent at each state change
- Document sets linked by normative references are published together
- Documents can "fall out" of queue if withdrawn
- Editing may raise issues requiring working group/AD discussion

### 3. Authors' Final Review (AUTH48)

Once an RFC is edited and ready for publication:
- Authors given "48 hours" (often weeks in practice)
- **RFCs are immutable once published**—errors cannot be fixed
- Authors review entire document, focusing on:
  - IANA considerations updates
  - Contact information
  - References
- All messages CCed to auth48archive@rfc-editor.org
- Publication requires approval from all authors

### 4. Publication

When an RFC is published:
- Announcement sent to ietf-announce and rfc-dist mailing lists
- URL format: `https://www.rfc-editor.org/info/rfcXXXX`
- **No changes are made to RFCs once published**

---

## Internet-Draft Submission

### Submission Requirements

**Format preference (in order):**
1. RFCXML v3 (authoritative source for plaintext/HTML generation)
2. RFCXML v2 (will be converted to v3, then discarded)
3. Plaintext (authoritative version, no renderings generated)

> **Best practice:** Submit RFCXML v3 if at all possible

### Submission Process

1. Use [IETF Datatracker's submission tool](https://datatracker.ietf.org/submit)
2. Login recommended (bypasses verification email if listed as author)
3. Tool validates using xml2rfc, id2xml, and idnits
4. Authors receive verification email
5. Document posted to Repository and Archive

### Replacement I-Ds

- Submitter identifies replacement using submission tool
- Group chair or IETF Secretariat verifies before relationship added
- Old I-D becomes inactive when replacement submitted

### Submission Deadlines

- Deadlines exist before each IETF meeting
- Important dates: [datatracker.ietf.org/meeting/important-dates](https://datatracker.ietf.org/meeting/important-dates)
- Earlier deadline for initial versions vs updates (varies by meeting)
- Blackout period: submissions not accepted after deadline until meeting begins
- Stream leadership can override blackout period when appropriate

### Manual Submissions

If unable to use Datatracker:
- Email to support@ietf.org
- I-D as attachment or URL
- Must be standalone RFCXML or plaintext
- No containers (zip, tar) accepted
- All other formats discarded

---

## Internet-Draft Repository and Archive

### Repository (www.ietf.org/id)

Contains only **active** versions of I-Ds. A version becomes inactive when:
- Updated with new version
- Replaced by another I-D
- Published as an RFC
- Expires (185 days after placement)

**Expiration exceptions:**
- Being processed by IESG for publication
- Under review by ISE for Independent Stream

### Archive (www.ietf.org/archive/id)

Contains **all versions** of I-Ds with additional renderings.

Removal only in exceptional circumstances (per IESG Statement).

**Important:** I-Ds are **not** an archival series—should only be cited as "work in progress."

---

## Style and Formatting

### RFC Style Guide

The RFC Style Guide consists of:

1. **RFC 7322:** "RFC Style Guide"
2. **Web Portion of the Style Guide**
3. **RFC Series Editor statement on authorship** (May 2015)
4. **Status of This Memo Boilerplate** - As defined by RFC 7841 and RFC 9280
5. **Abbreviations List** - Expansions of abbreviations/acronyms in RFCs
6. **Terms List** - Consistent usage decisions
7. **IAB Format** - IAB-specific RFC format
8. **Tips and Resources for Authors** - Writing guidance
9. **Reference Entries** - XML (BibXML) and TXT formats

### Author Guidance

- Use formatting tools to create I-Ds
- Follow RFC Style Guide for formatting and style conventions
- IETF stream I-Ds submitted to IESG must follow all guidance
- Earlier adherence = more efficient progress through process

---

## Copyright Notice and Legend

- IETF Trustee License Information governs RFC copyrights
- Patent (IPR) rights disclaimers apply
- Rules as of 10 November 2008

---

## Current Queue Status

The RFC Editor maintains a real-time publication queue showing:
- Current state of each document
- Weeks in current state
- Weeks in queue
- Draft name and authors
- Cluster (related documents)
- Page count
- Submission date

**Queue states visible:**
- EDIT/AUTH (editing in progress)
- AUTH48 (final author review)
- RFC-EDITOR (final quality control)
- IESG (awaiting discussion)
- IANA (processing)
- MISSREF (waiting for references)
- REF (waiting for reference completion)

View at: [rfc-editor.org/current_queue.php](https://www.rfc-editor.org/current_queue.php)

---

## Key Principles

1. **Immutability:** RFCs cannot be changed once published
2. **FIFO Processing:** Documents processed roughly in order
3. **State Tracking:** Automatic notifications at each state change
4. **Reference Coupling:** Documents linked by normative references published together
5. **Author Final Approval:** AUTH48 stage requires author sign-off before publication
6. **I-D ≠ RFC:** All RFCs start as I-Ds, but most I-Ds never become RFCs
7. **"Work in Progress":** I-Ds are not archival documents

---

## Related Documents

- RFC 4845: IAB RFC Publication Process
- RFC 5743: IRTF RFC Publication Process
- RFC 8730: Independent Submission Editor Model
- RFC 9280: Updates RFC 8730
- RFC 7322: RFC Style Guide
- RFC 7841 / RFC 9280: Status of This Memo boilerplate definitions
