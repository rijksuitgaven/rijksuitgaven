# Development Methodology

## Overview
This document outlines the development approach, collaboration model, and AI-assisted development workflow for the Rijksuitgaven.nl SaaS platform migration.

## AI-Assisted Development Model

### Core Principle
The project leverages AI (Claude Code) as the primary development partner, taking on multiple roles throughout the software development lifecycle while keeping human oversight and decision-making at critical junctures.

### AI Roles & Responsibilities

#### 1. Solution Architect
- Design system architecture and infrastructure
- Evaluate technology choices
- Create Architecture Decision Records (ADRs)
- Plan scalability and performance strategies
- Design data models and API structures

#### 2. Full-Stack Developer
- Write frontend code (UI components, state management, routing)
- Develop backend code (APIs, business logic, data access)
- Implement database schemas and migrations
- Create integration code for third-party services
- Write automated tests (unit, integration, e2e)

#### 3. DevOps Engineer
- Design CI/CD pipelines
- Create infrastructure as code (IaC)
- Configure monitoring and logging
- Set up deployment strategies
- Optimize performance and scalability

#### 4. Product Manager
- Translate business requirements into technical specifications
- Break down features into user stories
- Prioritize backlog items
- Create technical documentation
- Plan sprint deliverables

#### 5. QA Engineer
- Design test strategies
- Write test cases and test plans
- Create automated testing frameworks
- Identify edge cases and potential bugs
- Review code for quality and best practices

#### 6. Technical Writer
- Document APIs and code
- Create developer guides
- Write user documentation
- Maintain architecture documentation
- Document deployment procedures

#### 7. Security Specialist
- Identify security vulnerabilities
- Implement security best practices
- Design authentication and authorization
- Review code for security issues
- Ensure compliance with security standards

### Human Responsibilities

#### Decision Making
- Approve major architectural decisions
- Make final choices on technology stack
- Approve budget and resource allocation
- Sign off on major features
- Final approval before production deployments

#### Business Context
- Provide business requirements and priorities
- Clarify domain-specific rules and logic
- Define success criteria
- Validate UX/UI designs
- Provide market insights

#### External Actions
- Execute commands in external systems (AWS, Railway, payment processors, etc.)
- Handle sensitive credentials and secrets
- Perform final deployments to production
- Manage vendor relationships
- Handle legal and compliance approvals

#### Validation & Feedback
- Review AI-generated code and architecture
- Test features in staging environments
- Provide user acceptance testing
- Give feedback on UX/UI
- Validate business logic correctness

---

## Copy-Paste Execution Model

### Principle
For operations requiring external systems or sensitive access, AI provides ready-to-execute commands that humans can copy and paste, maintaining security while leveraging AI's expertise.

### Workflow

#### 1. AI Preparation Phase
AI prepares complete, tested commands with:
- Full command syntax
- Required parameters
- Expected output
- Error handling instructions
- Rollback procedures if needed

#### 2. Human Execution Phase
Human:
1. Reviews the command and understands what it does
2. Verifies credentials and access are appropriate
3. Copies the command
4. Pastes into appropriate terminal/console/interface
5. Executes the command
6. Reports back results to AI

#### 3. AI Response Phase
AI:
- Analyzes execution results
- Identifies any errors or issues
- Provides next steps or corrections
- Updates documentation with actual results
- Continues to next step in workflow

### Use Cases for Copy-Paste Model

#### Cloud Infrastructure Setup
```bash
# AI provides:
aws s3 mb s3://rijksuitgaven-production-data --region eu-west-1
aws s3api put-bucket-encryption --bucket rijksuitgaven-production-data --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Human: copies, pastes, executes, reports results
```

#### Database Migrations
```bash
# AI provides:
railway run --environment production -- npm run migrate:up

# Human: reviews, executes during maintenance window, confirms completion
```

#### Deployment Commands
```bash
# AI provides complete deployment script:
./deploy-production.sh --version v1.2.3 --health-check-timeout 300

# Human: executes during planned deployment window
```

#### Secret Management
```bash
# AI provides command structure:
aws secretsmanager create-secret --name rijksuitgaven/prod/db-password --secret-string "[HUMAN_FILLS_THIS]"

# Human: fills in actual secret value and executes
```

#### DNS Configuration
```bash
# AI provides DNS record settings:
# Type: CNAME
# Name: app.rijksuitgaven.nl
# Value: production-lb-123456.eu-west-1.elb.amazonaws.com
# TTL: 300

# Human: adds via DNS provider's interface
```

### Benefits of Copy-Paste Model

#### Security
- Humans maintain control of sensitive credentials
- AI never has direct access to production systems
- Audit trail of all production actions
- Humans can review before execution

#### Learning
- Humans learn from command structure
- Understanding builds over time
- Can troubleshoot independently if needed
- Knowledge transfer is inherent

#### Safety
- Human verification prevents automated errors
- Opportunity to catch mistakes before execution
- Can abort if something seems wrong
- Rollback is easier with human oversight

#### Flexibility
- Works across any external system
- Not dependent on API integrations
- Can adapt to any tool or platform
- Human can modify commands if needed

---

## Development Workflow

### Feature Development Cycle

#### 1. Requirements Gathering
**AI Role:** Ask clarifying questions, document requirements
**Human Role:** Provide business context, approve requirements
**Output:** Documented requirements in GitHub

#### 2. Design Phase
**AI Role:** Design architecture, create mockups, plan implementation
**Human Role:** Review designs, provide feedback, approve approach
**Output:** Architecture diagrams, UI designs, technical specs

#### 3. Implementation
**AI Role:** Write code, create tests, document functionality
**Human Role:** Review code, provide feedback on business logic
**Output:** Working code with tests in version control

#### 4. Local Testing
**AI Role:** Provide test scenarios and commands
**Human Role:** Execute tests locally, report results
**Output:** Verified functionality in local environment

#### 5. Deployment to Staging
**AI Role:** Provide deployment commands and procedures
**Human Role:** Execute deployment commands, verify environment
**Output:** Feature running in staging environment

#### 6. User Acceptance Testing
**AI Role:** Create test scripts and scenarios
**Human Role:** Perform UAT, provide feedback, approve for production
**Output:** Approved feature ready for production

#### 7. Production Deployment
**AI Role:** Provide production deployment commands, monitoring setup
**Human Role:** Execute deployment during maintenance window
**Output:** Feature live in production with monitoring

#### 8. Monitoring & Support
**AI Role:** Monitor logs, suggest optimizations, fix bugs
**Human Role:** Escalate customer issues, provide business feedback
**Output:** Stable, monitored production feature

---

## Communication Protocol

### AI Output Format

#### Code Delivery
- Complete, working code with comments
- Tests included
- Documentation in code
- README updates where relevant

#### Commands for Execution
```markdown
### Action Required: Deploy Database Migration

**Command:**
```bash
[copy-paste ready command]
```

**What this does:**
[clear explanation]

**Expected output:**
[what success looks like]

**If error occurs:**
[troubleshooting steps]

**Rollback command (if needed):**
```bash
[rollback command]
```
```

#### Decision Points
```markdown
### Decision Required: Database Choice

**Options:**
1. PostgreSQL on AWS RDS
   - Pros: [list]
   - Cons: [list]
   - Cost: [estimate]

2. PostgreSQL on Railway
   - Pros: [list]
   - Cons: [list]
   - Cost: [estimate]

**Recommendation:** [AI recommendation with rationale]

**Your decision:**
[ ] Option 1
[ ] Option 2
[ ] Other (please specify)
```

### Human Response Format

#### Execution Results
```markdown
### Execution Result: [Command Name]

**Status:** Success / Failed / Partial

**Output:**
```
[paste actual output from terminal]
```

**Any issues:**
[description if applicable]

**Screenshots (if relevant):**
[attach screenshots]
```

#### Decisions
```markdown
### Decision: [Topic]

**Choice:** [selected option]

**Reasoning:** [why this choice]

**Constraints to consider:** [any additional context]
```

---

## Tools & Access Management

### Development Tools
| Tool | Purpose | AI Access | Human Access |
|------|---------|-----------|--------------|
| GitHub | Version control | Can create repos, commit, PR | Full access |
| VS Code / IDE | Code editing | Generates code | Executes locally |
| Railway | Hosting | Provides configs | Executes deploys |
| AWS | Cloud infrastructure | Provides IaC | Executes commands |
| Database | Data storage | Designs schema | Executes migrations |
| Stripe/Payment | Billing | Provides integration code | Manages secrets |

### Access Control Principles
1. **AI never stores credentials** - Always provided fresh by human
2. **Human maintains all production access** - AI guides but doesn't execute
3. **Secrets in environment variables** - Never in code or AI context
4. **Audit logging enabled** - All production actions logged
5. **Least privilege principle** - Access only what's needed when needed

---

## Documentation Standards

### AI Documentation Responsibilities
- Keep all documentation in GitHub repository
- Update docs with every significant change
- Document all architectural decisions as ADRs
- Maintain API documentation
- Keep README files current

### Documentation Locations
- **Architecture decisions:** `/08-decisions/ADR-XXX.md`
- **API specs:** `/06-technical-specs/api-specifications.md`
- **Deployment procedures:** `/07-migration-strategy/`
- **Code documentation:** Inline comments + README files
- **User guides:** Created as project progresses

---

## Quality Assurance Approach

### AI-Driven Quality
- Write tests for all code (aim for >80% coverage)
- Perform static code analysis
- Check for security vulnerabilities
- Ensure code follows best practices
- Document test scenarios

### Human-Driven Quality
- Perform user acceptance testing
- Validate business logic correctness
- Test real-world scenarios
- Provide feedback on UX/UI
- Approve production releases

---

## Sprint/Iteration Model

### Typical Sprint (2 weeks)

#### Week 1
- **Day 1-2:** Planning, requirements gathering, design
- **Day 3-5:** AI implements features, human reviews and tests locally

#### Week 2
- **Day 1-3:** Refinement, testing, bug fixes
- **Day 4:** Staging deployment and UAT
- **Day 5:** Production deployment (if approved) or rollover to next sprint

### Continuous Activities
- Daily progress updates from AI
- Code reviews by human
- Documentation updates
- Testing and feedback loops

---

## Escalation & Problem Solving

### When AI Gets Stuck
1. AI clearly states the blocker
2. AI proposes 2-3 potential solutions
3. Human provides additional context or decides approach
4. AI implements chosen solution

### When Human Has Questions
1. Human asks in natural language
2. AI provides clear explanation with examples
3. AI offers to create documentation if topic is complex
4. AI updates docs for future reference

---

## Success Metrics for This Methodology

### Development Velocity
- Features completed per sprint
- Time from idea to production
- Code quality metrics (coverage, bugs, etc.)

### Collaboration Efficiency
- Clarity of AI-generated commands
- Success rate of copy-paste executions
- Time spent on back-and-forth clarifications

### Quality Outcomes
- Bug rate in production
- Test coverage percentage
- Customer satisfaction with features

### Documentation Quality
- Completeness of documentation
- Ease of onboarding new team members
- Ability to resume work after breaks

---

## Continuous Improvement

### Regular Reviews
- Monthly review of what's working well
- Identify pain points in the process
- Adjust workflow based on learnings
- Update this document with improvements

### Feedback Loop
- Human provides feedback on AI output quality
- AI adapts communication style based on feedback
- Process evolves with project needs
- Document lessons learned for future projects

---

## Getting Started Checklist

- [ ] Human and AI align on this methodology
- [ ] GitHub repository structure established
- [ ] Communication channels defined
- [ ] Access to necessary tools confirmed
- [ ] First sprint planned
- [ ] Success criteria defined
- [ ] This document reviewed and approved

---

## Notes

This methodology leverages the strengths of both AI (speed, consistency, breadth of knowledge) and human expertise (business context, judgment, security oversight) to deliver high-quality software efficiently while maintaining proper governance and security practices.

The copy-paste model ensures security while preserving learning and maintaining human oversight of all critical operations.
