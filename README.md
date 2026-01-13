# Rijksuitgaven.nl SaaS Platform Migration

This repository contains all documentation for migrating Rijksuitgaven.nl from the current platform to a new SaaS environment.

## Repository Structure

### [01 - Project Overview](./01-project-overview)
High-level project information, goals, and context.

- [Project Charter](./01-project-overview/project-charter.md)
- [Stakeholders](./01-project-overview/stakeholders.md)
- [Success Criteria](./01-project-overview/success-criteria.md)
- [Development Methodology](./01-project-overview/development-methodology.md) - AI-assisted development workflow

### [02 - Requirements](./02-requirements)
Detailed functional and non-functional requirements.

- [Business Requirements](./02-requirements/business-requirements.md)
- [Functional Requirements](./02-requirements/functional-requirements.md)
- [Non-Functional Requirements](./02-requirements/non-functional-requirements.md)
- [User Stories](./02-requirements/user-stories.md)

### [03 - Current State](./03-current-state)
Documentation of the existing platform.

- [Current Architecture](./03-current-state/current-architecture.md)
- [Current Tech Stack](./03-current-state/current-tech-stack.md)
- [Current Features](./03-current-state/current-features.md)
- [Current Data Model](./03-current-state/current-data-model.md)
- [Pain Points](./03-current-state/pain-points.md)

### [04 - Target Architecture](./04-target-architecture)
Design of the new SaaS platform.

- [System Architecture](./04-target-architecture/system-architecture.md)
- [Infrastructure Architecture](./04-target-architecture/infrastructure-architecture.md)
- [Data Architecture](./04-target-architecture/data-architecture.md)
- [Security Architecture](./04-target-architecture/security-architecture.md)
- [Integration Architecture](./04-target-architecture/integration-architecture.md)

### [05 - Design](./05-design)
UI/UX design documentation.

- [Design System](./05-design/design-system.md)
- [UI Components](./05-design/ui-components.md)
- [User Flows](./05-design/user-flows.md)
- [Wireframes](./05-design/wireframes.md)
- [Visual Design](./05-design/visual-design.md)

### [06 - Technical Specifications](./06-technical-specs)
Detailed technical documentation.

- [Tech Stack](./06-technical-specs/tech-stack.md)
- [API Specifications](./06-technical-specs/api-specifications.md)
- [Database Schema](./06-technical-specs/database-schema.md)
- [Authentication & Authorization](./06-technical-specs/auth-specifications.md)
- [Performance Requirements](./06-technical-specs/performance-requirements.md)
- [Monitoring & Logging](./06-technical-specs/monitoring-logging.md)

### [07 - Migration Strategy](./07-migration-strategy)
Plan for migrating from current to new platform.

- [Migration Overview](./07-migration-strategy/migration-overview.md)
- [Data Migration Plan](./07-migration-strategy/data-migration-plan.md)
- [Customer Migration Plan](./07-migration-strategy/customer-migration-plan.md)
- [Rollback Strategy](./07-migration-strategy/rollback-strategy.md)
- [Testing Strategy](./07-migration-strategy/testing-strategy.md)

### [08 - Decisions](./08-decisions)
Architecture Decision Records (ADRs) and key decisions.

- [ADR Template](./08-decisions/adr-template.md)
- Decision records will be added here as ADR-001, ADR-002, etc.

### [09 - Timelines](./09-timelines)
Project phases and milestones.

- [Project Phases](./09-timelines/project-phases.md)
- [Milestones](./09-timelines/milestones.md)

### [Assets](./assets)
Visual assets including screenshots, diagrams, wireframes, and mockups.

- [Assets Guide](./assets/README.md) - How to add and organize visual assets
- `/screenshots/current-ui/` - Current platform UI screenshots
- `/screenshots/new-ui/` - New platform UI screenshots
- `/diagrams/architecture/` - Architecture diagrams
- `/diagrams/user-flows/` - User flow diagrams
- `/diagrams/data-models/` - Database schemas and ER diagrams
- `/wireframes/` - UI wireframes
- `/design-mockups/` - High-fidelity design mockups

## How to Use This Documentation

1. **Start with Project Overview** - Understand the context and goals
2. **Review Requirements** - Understand what needs to be built
3. **Study Current State** - Learn about the existing platform
4. **Explore Target Architecture** - See where we're heading
5. **Review Design** - Understand the user experience
6. **Dive into Technical Specs** - Get implementation details
7. **Understand Migration Strategy** - Learn how we'll transition
8. **Track Decisions** - See why key choices were made

## Contributing

When adding or updating documentation:

1. Keep documents focused and well-structured
2. Use clear, concise language
3. Include diagrams where helpful
4. Update this README if adding new sections
5. Record major technical decisions as ADRs

## Questions or Feedback

For questions about this documentation, contact the project team.
