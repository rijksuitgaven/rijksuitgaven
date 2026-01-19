---
name: adr
description: "Create an Architecture Decision Record to document a significant technical decision."
---

# Architecture Decision Record (ADR)

## Overview

Create a formal ADR to document significant technical decisions. ADRs provide context for future developers and prevent revisiting already-made decisions.

## When to Use

Use `/adr` when:
- Choosing between technologies (e.g., Typesense vs Elasticsearch)
- Making architectural choices (e.g., MCP vs RAG)
- Defining patterns (e.g., how auth works)
- Setting constraints (e.g., export limits)

## The Process

**1. Gather Context**
Ask one question at a time:
- What decision needs to be made?
- What options were considered?
- What constraints apply? (budget, timeline, team skills)
- Who/what is affected?

**2. Present Options**
For each option, cover:
- Brief description
- Pros
- Cons
- Cost implications (if relevant)
- Your recommendation and why

**3. Document Decision**
Write ADR to `08-decisions/ADR-XXX-<title>.md` using this format:

```markdown
# ADR-XXX: [Title]

**Date:** YYYY-MM-DD
**Status:** Accepted | Proposed | Deprecated | Superseded by ADR-XXX
**Deciders:** [who made this decision]

## Context

[Why is this decision needed? What's the situation?]

## Decision

[What was decided, stated clearly]

## Options Considered

### Option 1: [Name]
- **Description:** ...
- **Pros:** ...
- **Cons:** ...

### Option 2: [Name]
...

## Consequences

### Positive
- [benefit 1]
- [benefit 2]

### Negative
- [tradeoff 1]
- [tradeoff 2]

### Neutral
- [implication]

## Related Decisions
- [Link to related ADRs if any]
```

**4. Update References**
- Add to SESSION-CONTEXT.md under "Key Decisions Made"
- Update RECOMMENDED-TECH-STACK.md if it affects stack

## Key Principles

- **Be specific** - "Use Typesense" not "Use a search engine"
- **Include context** - Future you won't remember why
- **List alternatives** - Shows the decision was considered
- **Note consequences** - Both good and bad
- **Keep it concise** - 1-2 pages max

## Numbering

Check existing ADRs in `08-decisions/` and use next number (ADR-001, ADR-002, etc.)
