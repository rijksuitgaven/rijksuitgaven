# Current Technical Environment

## Summary
Rijksuitgaven.nl currently runs on a WordPress-based solution with WpDataTables plugin for data management. The platform is hosted on a leased on-premise server with full admin access. While functional for initial launch, the technology stack has limitations in performance, scalability, and modern features like AI integration and advanced search.

---

## Infrastructure & Hosting

### Server Setup
- **Hosting Type:** Leased on-premise server (PaaS managed)
- **Access Level:** Full admin access
- **Contract:** Month-to-month (no long-term commitment)

### Migration Constraints
- **Deadline:** No hard deadline
- **Acceptable Downtime:** Up to 1 day
- **Current Status:** Month-to-month contract allows flexible migration timeline

---

## Database

### Database System
- **Type:** MySQL / MariaDB
- **Version:** [To be determined]
- **Location:** Same server as application
- **Access:** Full admin access with export capabilities
- **Current Size:** ~2 GB (expected to grow)
- **Size Category:** 1-10 GB range

### Data Characteristics
- **Update Frequency:** Monthly and yearly updates
- **Historical Data:** Retained as long as possible for trend analysis
- **Retention Requirements:** No legal requirements, business preference for maximum history
- **Export Capability:** Yes, can run export commands

### Database Access
- Direct database access available
- Can export schema
- Can export sample data
- Full admin privileges

---

## Application Stack

### Backend Technology
- **Platform:** WordPress CMS
- **Data Plugin:** WpDataTables (for table management and display)
- **Theme:** Divi (page builder theme)
- **API:** No exposed API currently
- **Code Access:** Full source code available in version control

### Technology Assessment
**Why Current Stack Can't Be Maintained:**
- Technology is outdated
- Doesn't scale to meet growing needs
- Can't add modern features (AI, advanced search, integrations)

---

## Key Backend Functions

### Core Features Requiring Migration

#### 1. User Management
- ✓ User authentication & authorization
- ✓ User accounts and profiles
- ✓ User preferences/settings

#### 2. Data Management
- ✓ Data ingestion/import from government sources (manual upload)
- ✓ Financial data processing/calculations
- ✓ Data storage and retrieval

#### 3. Search & Discovery
- ✓ Search functionality (currently basic)
- ✓ Data filtering
- ⚠️ **PAIN POINT:** No natural language search
- ⚠️ **PAIN POINT:** No boolean search operators
- ⚠️ **PAIN POINT:** Sluggish performance

#### 4. Data Export
- ✓ CSV export
- ✓ Excel export
- ✓ Screenshot download functionality

#### 5. Analytics & Reporting
- ✓ Reporting/analytics capabilities
- ✓ Multi-year data comparison

#### 6. Subscription Management
- ✓ Subscription/billing management
- ✓ Subscription information storage

#### 7. Communications
- ✓ Email notifications

---

## External Integrations

### Current Integrations
1. **Email Service**
   - Provider: Mailgun
   - Purpose: Transactional emails, notifications

2. **Analytics**
   - Google Analytics (assumed)
   - Purpose: Usage tracking, user behavior

### Missing Integrations (Requirements for New Platform)
1. **Government Data Sources**
   - ⚠️ data.overheid.nl - Open government data
   - ⚠️ wetten.overheid.nl - Dutch legislation database
   - ⚠️ TenderNED - Public procurement platform

2. **AI Services**
   - ⚠️ Natural language query processing
   - ⚠️ AI-powered data analysis
   - ⚠️ Conversational interface for data questions

---

## Data Architecture

### Data Types Stored

#### 1. Financial Data (Primary)
- Government expenditures by year (2015-2024 visible in UI)
- Recipient/organization information
- Budget categories (Begrotingen)
- Instruments (Subsidies, grants, etc.)
- Articles and regulations
- RIS/IBOS reference numbers
- Multi-year time series data

#### 2. User Data
- User accounts and profiles
- Authentication credentials
- User preferences/settings
- Subscription status and history

#### 3. Content Data
- Admin-created content
- Help text and documentation
- Articles related to financial data

#### 4. Metadata
- Budget names (Begrotingsnamen)
- Chapters (Hoofdstukken)
- Subsidy schemes
- Policy articles
- Regulations

### Data Loading Process
- **Method:** Manual upload
- **Format:** [To be determined - likely CSV, Excel, or database import]
- **Frequency:** Monthly and yearly updates
- **Process:** [To be documented]

---

## Current Pain Points

### Performance Issues
1. **Slow Website**
   - Page load times not meeting user expectations
   - Database queries inefficient at scale
   - WordPress overhead for data-heavy application

2. **Sluggish Search**
   - Basic search functionality
   - No advanced search operators
   - Poor performance with large datasets
   - No relevance ranking

### Feature Limitations
1. **Search Capabilities**
   - No natural language search
   - No boolean operators (AND, OR, NOT)
   - Limited filtering options
   - No search suggestions or autocomplete

2. **AI Integration**
   - Cannot integrate AI for natural language queries
   - No conversational interface
   - No AI-powered insights or analysis
   - No automated data interpretation

3. **External Data Integration**
   - Cannot connect to data.overheid.nl
   - Cannot connect to wetten.overheid.nl
   - Cannot connect to TenderNED
   - No API for external integrations

### Scalability Issues
1. **Technology Stack**
   - WordPress not designed for data-heavy applications
   - WpDataTables has performance limitations
   - Architecture doesn't support horizontal scaling
   - Difficult to optimize for large datasets

2. **Feature Development**
   - Can't add modern features without major workarounds
   - Plugin ecosystem limitations
   - Theme constraints (Divi)
   - Difficult to customize beyond plugin capabilities

---

## Documentation & Export Capabilities

### Available Documentation
- ✓ Technical architecture documentation (can be created)
- ✓ Database schema documentation (can be downloaded)
- ✓ User manuals (can be shared)

### Export Capabilities
- ✓ Database schema (table structures)
- ✓ Sample data
- ✓ Environment configuration
- ⚠️ No API endpoints (N/A - no API exists)
- ⚠️ No background jobs/cron tasks documented (N/A)

---

## Migration Advantages

### Favorable Migration Conditions
1. **Full Access**
   - Complete database access
   - Full code access
   - Admin server access
   - All export capabilities

2. **No Lock-in**
   - Month-to-month contract
   - No long-term vendor commitment
   - Flexible migration timeline
   - Can proceed at our own pace

3. **Manageable Size**
   - Database size is small (2 GB)
   - Data export is straightforward
   - Full data migration is feasible

4. **Acceptable Downtime**
   - Up to 1 day downtime acceptable
   - Allows for thorough migration and testing
   - Can schedule during low-usage period

---

## Data Loading & Processing (CONFIRMED)

### Source Data Format
- **Format:** CSV files from government sources
- **Manual Work Required:**
  - ✓ Data cleaning needed
  - ✓ Format conversion sometimes required
  - ✓ Multiple files sometimes need merging

### Current Import Process
- **Tool:** Direct database import via PhpMyAdmin
- **Process:** Direct MySQL import, bypassing WordPress interface
- **Complexity:** Requires technical knowledge and manual preparation

### Future State
- **Phase 1 Priority:** Focus on accessing existing database data with new stack and better UI
- **Phase 2:** Build improved data import workflow for new data
- **Rationale:** Get new platform working with current data first, then enhance import process

---

## Database Structure (CONFIRMED)

### WpDataTables Architecture
- **Role:** Plugin that allows WordPress to access and display MySQL data
- **Management:** All tables managed directly in MySQL, not through WordPress
- **Display:** WpDataTables provides the frontend table rendering

### Current Data Tables
The platform manages **7 separate datasets**, each in its own table:

1. **Financiële Instrumenten** (Financial Instruments)
2. **Apparaatsuitgaven** (Apparatus Expenditures)
3. **Provinciale subsidieregisters** (Provincial Subsidy Registers)
4. **Gemeentelijke subsidieregisters** (Municipal Subsidy Registers)
5. **Inkoopuitgaven** (Procurement Expenditures)
6. **Publieke uitvoeringsorganisaties en kennisinstellingen** (Public Implementation Organizations and Knowledge Institutions)
7. **Plus additional supporting tables**

### Table Structure
- **Organization:** Separate tables by dataset/module (not by year)
- **Pivot Table:** Created for time-series analysis
  - **Rows:** Ontvanger (Recipients/Organizations)
  - **Columns:** Years (2015-2024)
  - **Values:** Expenditure amounts
- **Design:** Optimized for display, not normalized structure

---

## WordPress Plugin Stack (CONFIRMED)

### Critical Plugins

#### 1. WpDataTables
- **Purpose:** Display MySQL data as interactive tables
- **Usage:** All data tables in the platform
- **Dependency:** High - core functionality

#### 2. Divi Theme
- **Purpose:** Page builder and theme
- **Usage:** Site design and layout
- **Dependency:** Medium - UI/UX only

#### 3. ARMember Plugin
- **Purpose:** Complete membership management
- **Features:**
  - User authentication & authorization
  - Subscription management
  - Payment processing (integrated)
  - User management
  - Access control
- **Payment Integration:** Built-in payment gateway support
- **Dependency:** Critical - handles all user/subscription logic

#### 4. Mailster
- **Purpose:** Email campaign management
- **Integration:** Connected to Mailgun for delivery
- **Usage:** Email notifications and campaigns
- **Dependency:** Medium - communication

### No Custom Plugins
- All functionality provided by commercial plugins
- Easier migration (no proprietary code)

---

## User Base & Subscriptions (CONFIRMED)

### Current Subscribers
- **Active Paying Subscribers:** 30 users
- **Growth Phase:** Small but growing customer base
- **Manageable Migration:** Can communicate directly with all users

### Subscription Model
- **Current Tiers:** Single access level (all users get same access)
- **Payment Options:**
  - Annual subscription
  - Monthly subscription
- **Trial Periods:** Sometimes offered
- **Managed By:** ARMember plugin

### Future Subscription Strategy
- **Planned Tiers:** Multiple access levels in new platform
  - **Example:** AI-powered question answering on higher tier
  - **Flexibility:** Room for creative pricing models
- **Migration Consideration:** Current users should maintain access seamlessly

---

## Performance Metrics (CONFIRMED)

### Current Performance
- **Page Load Time:** ~5 seconds
- **Search Response Time:** ~5 seconds
- **User Expectation:** < 1 second for responsive feel
- **Gap:** 4-5x slower than desired

### Performance Targets for New Platform
- **Page Load:** < 1 second (5x improvement)
- **Search Response:** < 500ms (10x improvement)
- **Perceived Performance:** Instant feel with loading states

### Usage Patterns
- **Peak Time:** Mornings during work hours
- **User Type:** Business hours professionals
- **Concurrent Users:** [To be measured, likely low given 30 subscribers]
- **Usage Pattern:** Research-oriented, not real-time critical

### Performance Implications
- Current 5-second load times are unacceptable for modern SaaS
- Users expect sub-second responsiveness
- Search is critical - should feel instantaneous
- Opportunity for significant UX improvement

---

## Integration Requirements Priority (CONFIRMED)

### V1 Launch (Critical)
1. **AI Natural Language Queries** - CRITICAL
   - Must-have for competitive advantage
   - Core value proposition
   - Differentiator from current platform

### V1 or V2 (Medium Priority)
2. **TenderNED Integration** - MEDIUM
   - Public procurement data
   - Adds value but not blocking launch
   - Can be added post-launch

### Future Phases (Low Priority)
3. **data.overheid.nl** - FUTURE
   - Open government data portal
   - Enhancement for later phases

4. **wetten.overheid.nl** - FUTURE
   - Dutch legislation database
   - Context enrichment for future

### Integration Strategy
- **Phase 1:** Launch with AI as killer feature
- **Phase 2:** Add TenderNED integration
- **Phase 3:** Expand to other government data sources

---

## Migration Strategy (CONFIRMED)

### Phase 1: New Platform with Existing Data ✓ PRIMARY FOCUS
**Goal:** Build new stack that reads from existing MySQL database

**Approach:**
1. Export current database schema and sample data
2. Design new platform architecture
3. Build new frontend with modern search
4. Implement AI natural language query layer
5. Connect to existing MySQL database (read-only initially)
6. Migrate users and subscriptions
7. Launch new platform

**Benefits:**
- Fastest path to new platform
- No data migration risk initially
- Users see immediate improvements
- Can operate in parallel if needed

### Phase 2: Improved Data Import Workflow
**Goal:** Build better data ingestion pipeline

**Approach:**
1. Analyze current data preparation process
2. Design automated data cleaning
3. Build import validation
4. Create admin interface for imports
5. Migrate to new database structure if needed

**Benefits:**
- Reduces manual work
- Improves data quality
- Enables more frequent updates
- Scales better

### Why This Approach
- De-risks migration (data stays stable)
- Delivers value faster (new UI + AI)
- Allows parallel operation during transition
- Addresses biggest pain points first (slow search, no AI)

---

## Next Steps

1. **Immediate Actions:**
   - Export database schema for analysis
   - Document current data loading process
   - Identify critical WordPress plugins
   - Export sample dataset

2. **Documentation Needed:**
   - Current user flow documentation
   - List of all WordPress plugins in use
   - Data transformation/cleaning process
   - Subscription management details

3. **Technical Discovery:**
   - Analyze database schema structure
   - Understand WpDataTables configuration
   - Map data relationships
   - Identify data quality issues

---

## Migration Strategy Implications

### What This Means for New Platform

#### Database Migration
- ✓ Clean export possible (full access)
- ✓ Manageable size for transformation
- ✓ Time for thorough testing (no hard deadline)
- ⚠️ May need data cleaning/transformation
- ⚠️ Need to understand current schema deeply

#### Feature Migration
- ✓ Clear list of features to replicate
- ✓ Opportunity to improve search dramatically
- ✓ Can add AI capabilities from day one
- ✓ Can add external integrations
- ⚠️ Need to match or exceed current UX

#### Technology Upgrade Path
- ✓ Complete freedom in technology choice
- ✓ Can build for scalability from start
- ✓ Modern architecture possible
- ✓ API-first design enables integrations
- ⚠️ Need to train on new admin interface

#### Risk Mitigation
- ✓ Full control reduces migration risk
- ✓ Acceptable downtime allows careful migration
- ✓ Can run parallel systems if needed
- ✓ Easy rollback possible (month-to-month)

---

## Technology Recommendations (Preliminary)

Based on this environment, the new platform should:

1. **Use modern, scalable database**
   - PostgreSQL (recommended over MySQL for better performance with complex queries)
   - Proper indexing for fast search
   - Support for full-text search or separate search engine

2. **Implement proper search solution**
   - Elasticsearch, Typesense, or Algolia
   - Natural language processing
   - Boolean operators
   - Relevance ranking

3. **API-first architecture**
   - RESTful API for all operations
   - Enables external integrations
   - Allows future mobile apps
   - Supports AI integration

4. **Modern backend framework**
   - Node.js, Python, or similar
   - Built for performance
   - Easy to maintain and extend
   - Good developer ecosystem

5. **Proper caching strategy**
   - Redis or similar
   - Cache frequently accessed data
   - Reduce database load

6. **AI integration ready**
   - API design supports AI queries
   - Natural language processing layer
   - Conversational interface capability

---

## Status: Awaiting Additional Information

This document will be updated as we gather more details about the current system through schema exports, plugin lists, and process documentation.
