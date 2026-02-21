# V4 Theme Classification - SQL Migrations

**Project:** Rijksuitgaven.nl
**Version:** V4 - Theme Discovery
**Status:** Not Started

---

## Migration Order

Execute in numerical order:

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| 001 | `001-create-ibos-domains-table.sql` | IBOS reference table | None |
| 002 | `002-create-recipient-classifications-table.sql` | Main classification storage | 001 |
| 003 | `003-seed-ibos-domains.sql` | Populate 30 IBOS codes | 001 |
| 004 | `004-create-field-mappings-table.sql` | Beleidsterrein/sectoren mappings | 001 |
| 005 | `005-seed-beleidsterrein-mappings.sql` | Gemeente field mappings | 004 |
| 006 | `006-seed-sectoren-mappings.sql` | Publiek field mappings | 004 |

---

## Execution Notes

- Run via Supabase SQL Editor or `psql`
- Each migration is idempotent (safe to re-run)
- Check `scripts/sql/DATABASE-DOCUMENTATION.md` after each migration
- Update `docs/v4-themes/PROGRESS.md` after seed scripts

---

## Rollback

Each migration should have a corresponding rollback comment at the top:

```sql
-- ROLLBACK: DROP TABLE IF EXISTS ibos_domains;
```

---

## Schema Overview

```
ibos_domains (30 rows)
├── code VARCHAR(2) PK
├── name_nl TEXT
├── name_en TEXT
└── description TEXT

field_mappings
├── id SERIAL PK
├── source_field TEXT (e.g., 'beleidsterrein')
├── source_value TEXT
├── ibos_code VARCHAR(2) FK
└── confidence DECIMAL(3,2)

recipient_ibos_classifications
├── id SERIAL PK
├── source_module TEXT
├── source_id BIGINT
├── recipient_normalized TEXT
├── context_field TEXT
├── context_value TEXT
├── ibos_code VARCHAR(2) FK
├── classification_method TEXT
├── confidence DECIMAL(3,2)
├── classified_at TIMESTAMP
├── reviewed BOOLEAN
├── reviewed_by TEXT
└── reviewed_at TIMESTAMP
```

---

## Last Updated

- **Date:** 2026-02-03
- **By:** Stub created

