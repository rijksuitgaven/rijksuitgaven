# Session Context

**Last Updated:** 2026-01-19
**Project Phase:** Phase 1 - Requirements & Architecture
**Current Sprint:** V1.0 MVP Scope Defined

---

## Current Status

### What We're Working On
- ✅ Documentation structure created
- ✅ Current environment analyzed
- ✅ Database structure documented
- ✅ Technology stack recommended (initial)
- ✅ Search requirements deep-dive
- ✅ Architecture impact analysis
- ✅ 4 critical decisions answered
- ✅ V1.0 MVP scope defined
- ✅ **COMPLETED TODAY:** V2.0 Research Mode brainstorm (Eerste Kamer interview)
- ✅ **COMPLETED TODAY:** V2.0 design document created
- ⏳ **NEXT:** UI/UX wireframes (V1.0)

### Active Tasks
| Task | Status | Notes |
|------|--------|-------|
| Search requirements gathering | ✅ Completed | 57-page comprehensive document |
| Architecture impact analysis | ✅ Completed | Stack validated against requirements |
| Define V1.0 MVP scope | ✅ Completed | All 4 decisions answered |
| V2.0 Research Mode brainstorm | ✅ Completed | Eerste Kamer interview, design doc created |
| UI/UX wireframes (V1.0) | 🔄 Next | Ready to start |

---

## Recent Work (Last 3 Files)

1. **docs/plans/2026-01-19-v2-research-mode-design.md** ⭐ NEW
   V2.0 Research Mode design: Bloomberg Terminal vision, IBOS domains, Eerste Kamer insights

2. **02-requirements/search-requirements.md**
   Comprehensive search requirements (1,544 lines): Search Bar (V1.0) + Research Mode (V2.0)

3. **04-target-architecture/architecture-impact-analysis.md**
   Evaluation of tech stack against requirements + updated recommendations

---

## Key Decisions Made

### Architecture Decisions (2026-01-14)

**ADR-001: Technology Stack (Initial)**
- **Tech Stack:** Python + FastAPI + Next.js + Railway + Typesense
- **Rationale:** Best balance of ease-of-use, performance, cost, and AI capabilities
- **Cost:** €89-152/month (within €180 budget)
- **Timeline:** 8 weeks to V1

**ADR-002: Migration Strategy**
- **Decision:** Phase 1 = Keep MySQL, Phase 2 = Consider PostgreSQL
- **Rationale:** Minimize risk, validate architecture first

**ADR-003: Search Engine**
- **Decision:** Typesense over Elasticsearch
- **Rationale:** Simpler, cheaper (€15-25 vs €50-100), perfect for dataset size

**ADR-004: AI Primary (UPDATED TODAY)** ⭐
- **Decision:** Claude Sonnet 4.5 (primary), OpenAI GPT-4 (fallback only)
- **Changed from:** OpenAI primary, Claude secondary
- **Rationale:** 10x cheaper for conversations (€0.003 vs €0.03 per 1K tokens), native MCP support, 200K context window
- **Impact:** Research Mode cost: €28/month vs €280/month for 1,000 conversations

**ADR-005: Agent Orchestration (NEW TODAY)** ⭐
- **Decision:** Use LangChain for Research Mode
- **Rationale:** Built-in conversation memory, tool orchestration, proven framework
- **Impact:** Faster development, don't rebuild agent framework

**ADR-006: Data Visualization (NEW TODAY)** ⭐
- **Decision:** Frontend generates charts (Recharts library)
- **Rationale:** Interactive visualizations, no server-side rendering cost
- **Impact:** Better UX, faster rendering

**ADR-007: Analytics Data Layer (NEW TODAY)** ⭐
- **Decision:** Add pre-computed analytics tables for Research Mode
- **Tables:** analytics_recipient_yearly, analytics_recipient_summary, analytics_module_trends
- **Rationale:** 10x faster AI queries (<100ms vs 2-3s)
- **Impact:** Research Mode performance meets <3s target

### Development Decisions
- **Development Methodology:** AI takes multiple roles, copy-paste execution
- **Internationalization:** Dutch primary (V1.0), English UI option (V2.0), i18n framework from day 1

### Product Decisions
- **Two Search Modes:** Search Bar (V1.0) + Research Mode (V2.0)
- **"Bloomberg Terminal for Rijksfinanciën":** Domain-first analysis, not recipient-first
- **Target Users:** Eerste Kamer, journalists, researchers, political parties
- **Pricing Tiers:** Pro Account (search) + Research Account (AI mode - upsell later)

### V2.0 Research Mode Decisions (2026-01-19) ⭐ NEW

**ADR-008: Domain Classification**
- **Decision:** Use IBOS (30 official policy domains) as standard classification
- **AI Classification:** For ambiguous recipients, AI infers IBOS code from metadata
- **Personalization:** Users select their focus domains

**ADR-009: Entry Point Paradigm**
- **Decision:** V2.0 entry point is Domain, not Recipient
- **Question:** "Where does the tax euro go?" (not "Who received money?")
- **Flow:** Domain → Trends → Recipients (drill-down)

**ADR-010: wetten.overheid.nl Integration**
- **Decision:** Must-have for V2.0
- **Rationale:** Every Regeling links to legislation, users need legal context

**ADR-011: Visualizations**
- **Decision:** Standard + Advanced charts
- **Standard:** Bar, Line, Pie
- **Advanced:** Sankey (money flow), Treemap (hierarchy), Heatmap (year × domain)

**ADR-012: V3.0 Data Requirement**
- **Decision:** Budget analysis (onderuitputting, kasverschuivingen) requires begroting data
- **Current data:** Realisatie only
- **Impact:** Budget vs actual analysis parked for V3.0

### Critical Decisions - RESOLVED (2026-01-19) ⭐

**DECISION 1: V1.0 Timeline** ✅
- **Decision:** V1.0 = Search Bar only (8 weeks), V2.0 = Research Mode (+12 weeks)
- **Rationale:** Deliver value faster, reduce risk, validate architecture first

**DECISION 2: Pricing Strategy** ✅
- **Decision:** €1,500/year or €150/month (ex VAT) - single tier for V1.0
- **Research tier:** TBD - will be upsell at later stage
- **Revenue:** 30 subscribers × €150 = €4,500/month potential

**DECISION 3: V1.0 MVP Scope** ✅
- **Must-haves:**
  - Global search bar with autocomplete
  - Cross-module search ("Integraal") ✅
  - All 7 module filters (based on current UI)
  - Year range filter
  - Amount range filter ✅
  - CSV export (500 row limit)
  - User accounts (email/password only)
- **Not in V1.0:**
  - Research Mode (V2.0)
- **Never:**
  - Social login (email/password only, always)
  - Unlimited exports (500 row limit always)

**DECISION 4: User Migration Strategy** ✅
- **Decision:** 1:1 migration to new platform
- **Same functionality:** All current features preserved
- **Research Mode:** Will be offered as upsell later
- **No pricing changes:** Existing subscribers keep current terms

---

## Pending Decisions

### Important (Not Blocking)
- **Wireframe approval** - Ready to start
- **API specification review** - After wireframes
- **Development environment setup** - Can start anytime

---

## Blockers

**None currently.** All questions documented for tomorrow's session.

---

## Quick Links

### Design Documents
- [V2.0 Research Mode Design](../docs/plans/2026-01-19-v2-research-mode-design.md) ⭐ NEW - Bloomberg Terminal vision
- [Search Requirements](../02-requirements/search-requirements.md) - Comprehensive 57-page document
- [Architecture Impact Analysis](../04-target-architecture/architecture-impact-analysis.md) - Stack validation

### Architecture
- [Recommended Tech Stack](../04-target-architecture/RECOMMENDED-TECH-STACK.md) - Original recommendation
- [Architecture Overview](../04-target-architecture/architecture-overview.md) - System design

### Current State Analysis
- [Database Analysis](../03-current-state/database-analysis-summary.md) - 7 modules, 2.5M rows
- [Current Technical Environment](../03-current-state/current-technical-environment.md)
- [Current UI Screenshots](../assets/screenshots/current-ui/) - 7 filter screenshots analyzed

### Project Foundation
- [Development Methodology](../01-project-overview/development-methodology.md)
- [Project Charter](../01-project-overview/project-charter.md)

---

## Next Steps (Priority Order)

### This Session (2026-01-19) 🗓️

**COMPLETED:**
- ✅ All 4 critical decisions answered
- ✅ V1.0 MVP scope defined

**READY TO START:**

1. **Create UI/UX Wireframes**
   - Search bar with autocomplete/instant preview
   - Advanced filters (collapsible panel)
   - Results display (table view)
   - Module navigation
   - All 7 modules with filters

2. **Estimate Development Effort**
   - Break down V1.0 features into tasks
   - Create sprint plan (8 weeks = 4 sprints)

3. **Create API Specifications** (06-technical-specs/api-specifications.md)
   - RESTful endpoint design for 7 data modules
   - Authentication/authorization endpoints
   - Search API with Typesense integration

4. **Create Project Setup Guide** (07-migration-strategy/setup-guide.md)
   - Railway account setup
   - GitHub repository setup
   - Local development environment

---

## Notes

### User Preferences
- Access: PhpMyAdmin only (no terminal access to current DB)
- Experience: Beginner/Intermediate, some Railway experience
- Team: 2-3 people, medium skill level
- Budget: €50-200/month, currently €180
- Timeline: ASAP (1-2 months to V1)
- Biggest concern: Cost overruns
- Critical requirement: MCP server support for AI

### Technical Constraints
- Current platform: WordPress + MySQL (2GB, 30 paying subscribers)
- Performance issues: 5s page load, 5s search
- Data structure: 7 modules with 3-table pattern (source, pivot, consolidated)
- Must support: Multi-language (English source, Dutch primary)

### Success Criteria
- <1s page load (currently 5s)
- <100ms search (currently 5s) - Updated target after requirements
- AI natural language queries working (V2.0)
- Within budget (€89-127/month for V2.0, €180 max)
- Zero downtime for paying customers
- V1.0: 8 weeks | V2.0: +12 weeks (total 20 weeks / ~5 months)

### Today's Accomplishments (2026-01-19)
1. ✅ All 4 critical decisions answered
2. ✅ V1.0 MVP scope finalized
3. ✅ Pricing confirmed: €1,500/year or €150/month
4. ✅ Timeline confirmed: V1.0 (8 weeks) + V2.0 (+12 weeks)
5. ✅ Migration strategy: 1:1 migration, Research Mode as upsell
6. ✅ V2.0 Research Mode brainstorm (Eerste Kamer user interview)
7. ✅ V2.0 design document created (Bloomberg Terminal vision)
8. ✅ 5 new ADRs documented (008-012)

### V1.0 MVP Feature Summary
| Feature | Status |
|---------|--------|
| Global search bar | ✅ Must-have |
| Autocomplete | ✅ Must-have |
| Cross-module search | ✅ Must-have |
| All 7 module filters | ✅ Must-have |
| Year range filter | ✅ Must-have |
| Amount range filter | ✅ Must-have |
| CSV export (500 rows) | ✅ Must-have |
| Email/password auth | ✅ Must-have |
| Social login | ❌ Never |
| Research Mode | ❌ V2.0 |

### V2.0 Research Mode Scope Summary
| Feature | Status |
|---------|--------|
| Domain-first analysis (IBOS) | ✅ V2.0 |
| "Where does tax euro go?" | ✅ V2.0 |
| AI domain classification | ✅ V2.0 |
| User focus domains | ✅ V2.0 |
| Trend analysis (YoY) | ✅ V2.0 |
| Top N / Groeiers / Dalers | ✅ V2.0 |
| All comparison types | ✅ V2.0 |
| Advanced charts (Sankey, Treemap, Heatmap) | ✅ V2.0 |
| wetten.overheid.nl integration | ✅ V2.0 |
| Save queries | ✅ V2.0 |
| Export CSV/Excel/PDF | ✅ V2.0 |
| Share read-only links | ✅ V2.0 |
| PowerPoint export | 🅿️ V2.1 |
| Share + comment | 🅿️ V2.1 |
| Budget analysis (onderuitputting) | 🅿️ V3.0 (needs begroting data) |

---

**Last Session:** 2026-01-14 (Search requirements + architecture impact analysis)
**This Session:** 2026-01-19 - V1.0 decisions + V2.0 Research Mode brainstorm
**Next:** UI/UX wireframes (V1.0)
