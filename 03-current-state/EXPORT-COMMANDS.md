# Database Export Guide - PhpMyAdmin

This document contains step-by-step instructions for exporting database schema and sample data using PhpMyAdmin.

---

## Prerequisites

You'll need:
- Access to PhpMyAdmin
- Login credentials for your database
- Web browser

---

## Export 1: Complete Database Schema (Structure Only)

This exports the complete database structure without any actual data - perfect for understanding the architecture.

### Steps in PhpMyAdmin:

1. **Login to PhpMyAdmin**
   - Open your PhpMyAdmin URL
   - Login with your credentials

2. **Select Your Database**
   - Click on your database name in the left sidebar
   - (It's probably named something like `rijksuitgaven_db` or similar)

3. **Go to Export Tab**
   - Click the **"Export"** tab at the top

4. **Choose Export Method**
   - Select **"Custom"** (not Quick)

5. **Configure Export Settings:**
   - **Tables:** Select All (or check "Select all")
   - **Output:** Select "Save output to a file"
   - **Format:** SQL
   - **Format-specific options:**
     - **Structure:**
       - ✓ Check "Add DROP TABLE / VIEW / PROCEDURE / FUNCTION / EVENT / TRIGGER statement"
       - ✓ Check "Add CREATE TABLE" (or similar)
       - ✓ Check "Add IF NOT EXISTS"
     - **Data:**
       - ✗ **UNCHECK** "Add INSERT statements" or set to "none"
       - We want structure only, no data

6. **File name template:**
   - Change to: `rijksuitgaven_schema`

7. **Click "Export" button**
   - File will download as `rijksuitgaven_schema.sql`

**What you'll get:**
- File size: ~50-200 KB (structure only)
- Contains: All table definitions, indexes, keys
- Safe to share: No actual data included

---

## Export 2: Get Table List with Row Counts

Let's see what tables you have and how big they are.

### Steps in PhpMyAdmin:

1. **Select Your Database**
   - Click on your database name in left sidebar

2. **Look at the Main View**
   - You should see a list of all tables
   - The view shows: Table name, Records (row count), Size

3. **Take a Screenshot or Copy the Table**
   - Simply take a screenshot of this table list
   - Or manually note down:
     - Table name
     - Number of rows (Records column)
     - Size

**What we need:**
- List of all table names
- How many rows in each table
- Especially interested in:
  - Tables starting with `wp_financiele_instrumenten`
  - Tables with `apparaat`, `subsidie`, `inkoop`, etc.
  - Any pivot or aggregated tables

---

## Export 3: Sample Data from Main Tables

Export a small sample (100-1000 rows) from your main data tables.

### For Each Major Table:

**Tables to export (if they exist):**
- Financiële Instrumenten table
- Apparaatsuitgaven table
- Any pivot/aggregated table
- One provincial/municipal subsidy table

### Steps for Each Table:

1. **Click on the Table Name**
   - In the left sidebar, click the table you want to export

2. **Click "Export" Tab**
   - At the top of the page

3. **Choose Export Method**
   - Select **"Custom"**

4. **Configure Export:**
   - **Format:** SQL
   - **Tables:** (already selected - just this one table)
   - **Output:** Save output to a file
   - **Rows:**
     - Under "Dump table" section
     - Find option to limit rows
     - Enter: `100` or `1000` (whatever is comfortable)
     - OR leave empty and we'll work with what you send

5. **Structure Options:**
   - ✓ Check everything (we want structure too)

6. **Data Options:**
   - ✓ Check "Add INSERT statements"
   - We want sample data this time

7. **File name:**
   - Change to: `sample_[tablename]`
   - Example: `sample_financiele_instrumenten`

8. **Click "Export"**

**Repeat for 3-4 main tables**

**What you'll get:**
- File size: 100 KB - 5 MB per table (depending on data)
- Contains: Table structure + sample rows
- Useful for: Understanding data format and relationships

---

## Export 4: WordPress Tables (For User Migration)

We need to understand how users and subscriptions are stored.

### Tables to Export (Schema + Limited Data):

Look for these tables and export them (with data):

1. **User Tables:**
   - `wp_users` - WordPress users (export 5-10 sample rows)
   - `wp_usermeta` - User metadata

2. **ARMember Tables:**
   - Look for tables starting with `wp_arm_` or `arm_`
   - Common ones:
     - `wp_arm_members`
     - `wp_arm_membership_setup`
     - `wp_arm_subscriptions`
     - `wp_arm_payment_log`
   - Export structure + sample data (10-20 rows)

### Same Export Process as Export 3
- Export each table individually
- Include structure + limited data
- We want to understand subscription model

**Privacy Note:**
- You can anonymize email addresses if sensitive
- Or just send schema (structure only) for user tables
- We mainly need to understand the data structure

---

## Export 5: WordPress Active Plugins List

### Method 1: From WordPress Admin (Easiest)

1. Login to WordPress admin
2. Go to **Plugins** → **Installed Plugins**
3. Take a screenshot showing all active plugins
4. OR copy the list to a text file

### Method 2: From PhpMyAdmin

1. **Select Your Database**

2. **Click on `wp_options` table**

3. **Click "Search" tab**

4. **Search for:**
   - Field: `option_name`
   - Operator: `=`
   - Value: `active_plugins`

5. **Click "Go"**

6. **Look at the result:**
   - The `option_value` column contains a serialized list of active plugins
   - Copy this value

7. **Alternative - Run SQL Query:**
   - Click "SQL" tab
   - Paste this query:
   ```sql
   SELECT option_value FROM wp_options WHERE option_name = 'active_plugins';
   ```
   - Click "Go"
   - Copy the result

**What you'll get:**
- List of all active WordPress plugins
- Helps us understand what functionality to replicate

---

## Summary: What to Export

Here's a checklist of what we need:

### Priority 1 (Essential)
- [ ] **Complete database schema** (Export 1)
  - File: `rijksuitgaven_schema.sql`
  - Size: ~50-200 KB
  - Content: All table structures, no data

- [ ] **Table list with row counts** (Export 2)
  - Screenshot or text file
  - Shows all table names and sizes

### Priority 2 (Very Helpful)
- [ ] **Sample data from main tables** (Export 3)
  - 3-4 files with 100-1000 rows each
  - Focus on: Financiële Instrumenten, Apparaatsuitgaven, pivot tables
  - Files: `sample_[tablename].sql`

### Priority 3 (Helpful for User Migration)
- [ ] **WordPress user/subscription tables** (Export 4)
  - `wp_users`, `wp_usermeta` (sample data)
  - ARMember tables (sample data)
  - Can anonymize emails if needed

- [ ] **Active plugins list** (Export 5)
  - Screenshot from WordPress admin
  - OR text list of plugins

---

## Security & Privacy Notes

✅ **Safe to Share:**
- Database schema (no actual data)
- Sample data from financial tables (public government data)
- Table structure and column names

⚠️ **Be Careful With:**
- User emails (can anonymize if needed)
- Password hashes (only structure needed, not actual values)
- Payment information (only structure needed)

💡 **Tips:**
- Schema files are completely safe (no user data)
- Sample financial data is public government data (safe)
- For user tables, you can export structure only (no data)
- We mainly need to understand the structure

---

## Where to Share Files

### Option 1: Add to GitHub Repository (Recommended)
Create a folder and upload there:
```
03-current-state/exports/
  ├── rijksuitgaven_schema.sql
  ├── table_list.txt (or screenshot)
  ├── sample_financiele_instrumenten.sql
  ├── sample_apparaatsuitgaven.sql
  └── plugins_list.txt (or screenshot)
```

### Option 2: File Transfer
- If files are large (>10 MB total)
- Use WeTransfer, Dropbox, or Google Drive
- Share link with me

### Option 3: Direct Upload
- If working in our shared environment
- Place files in the documentation repository

---

## Troubleshooting

### "Export is taking too long"
- For large tables, reduce the row limit to 100
- Or export structure only first, data later

### "File is too large"
- Zip/compress the .sql files
- Or export fewer rows (50-100 instead of 1000)

### "Can't find specific tables"
- Take screenshot of all tables in PhpMyAdmin
- Send that, and I'll tell you which ones to export

### "Not sure about table names"
- Export the complete schema first (Export 1)
- I can analyze that and tell you which specific tables we need samples from

### "Privacy concerns"
- Export structure only (no data) for user tables
- We mainly need to understand the schema
- For financial data tables, sample data is helpful but not critical initially

---

## Next Steps After Export

Once I receive these files, I will:

### 1. Database Analysis (1-2 hours)
- Analyze complete schema structure
- Identify all tables and relationships
- Document data model
- Understand WpDataTables configuration

### 2. Data Review (1-2 hours)
- Review sample data formats
- Understand data patterns
- Identify any data quality issues
- Map field types and constraints

### 3. Architecture Design (2-4 hours)
- Design how new platform connects to existing database
- Plan API layer structure
- Design search indexing strategy
- Plan AI integration architecture

### 4. Create Detailed Technical Specs
- Document database access patterns
- Design new frontend architecture
- Plan user/subscription migration
- Create development roadmap

### 5. Technology Stack Recommendations
- Recommend specific frameworks
- Recommend hosting platform
- Recommend search solution
- Recommend AI integration approach

---

## Questions During Export?

If you encounter any issues, just let me know:

### Common Issues:
**"Which database should I select?"**
- Look for name with "rijksuitgaven" or your site name
- Or take screenshot of database list

**"Too many tables - which ones matter?"**
- Export schema first (all tables)
- Take screenshot of table list
- I'll tell you which specific ones need sample data

**"Export is slow"**
- Start with schema only (Export 1)
- Send that first
- We can get sample data later if needed

**"Not sure about settings"**
- Take screenshots of each step
- Send those and I'll guide you

**"File won't download"**
- Try different browser
- Check popup blockers
- Try smaller table first

---

## Quick Start: Minimum Viable Export

If you're short on time, start with just these:

1. **Database Schema** (Export 1)
   - Complete structure, no data
   - 5 minutes to export

2. **Table List Screenshot** (Export 2)
   - Just take screenshot
   - 1 minute

**That's enough to get started!**

We can get sample data later if needed. The schema alone will tell me 80% of what I need to know.

---

## I'm Ready to Help!

Once you've exported the files:

1. Upload them to the GitHub repo in `03-current-state/exports/`
2. Or share via file transfer
3. Let me know they're ready

I'll analyze them and create:
- Complete data model documentation
- Detailed architecture design
- Technology recommendations
- Development plan

Let's build something amazing! 🚀
