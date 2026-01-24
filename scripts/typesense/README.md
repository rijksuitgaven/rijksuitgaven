# Typesense Sync Scripts

## Quick Reference

### Sync All Collections
```bash
SUPABASE_DB_URL="postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" python3 scripts/typesense/sync_to_typesense.py --recreate
```

### Sync Single Collection
```bash
SUPABASE_DB_URL="postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" python3 scripts/typesense/sync_to_typesense.py --collection [NAME] --recreate
```

**Available collections:** `recipients`, `instrumenten`, `inkoop`, `publiek`, `gemeente`, `provincie`, `apparaat`

### Test Search Only (No Sync)
```bash
python3 scripts/typesense/sync_to_typesense.py --test-only
```

---

## When to Run

| Scenario | Command |
|----------|---------|
| New data imported to Supabase | Sync all: `--recreate` |
| Single table updated | Sync one: `--collection [NAME] --recreate` |
| Verify search is working | Test only: `--test-only` |

---

## Prerequisites

**One-time setup:**
```bash
pip3 install typesense psycopg2-binary
```

---

## Connection Details

| Service | Value |
|---------|-------|
| Typesense Host | `typesense-production-35ae.up.railway.app` |
| Typesense API Key | `0vh4mxafjeuvd676gw92kpjflg6fuv57` |
| Supabase Pooler | `aws-1-eu-west-1.pooler.supabase.com:5432` |
| Supabase Project | `kmdelrgtgglcrupprkqf` |

---

## Current Index Status

| Collection | Records | Last Synced |
|------------|---------|-------------|
| recipients | 466,827 | 2026-01-23 |
| apparaat | 9,628 | 2026-01-24 |
| instrumenten | Schema only | - |
| inkoop | Schema only | - |
| publiek | Schema only | - |
| gemeente | Schema only | - |
| provincie | Schema only | - |

---

## Troubleshooting

**"command not found: python"** → Use `python3` instead

**"command not found: pip"** → Use `pip3` instead

**"could not translate host name"** → Use the pooler URL (aws-1-eu-west-1.pooler.supabase.com), not the direct URL (db.xxx.supabase.co)

---

## Files

| File | Purpose |
|------|---------|
| `collections.json` | Typesense collection schemas |
| `sync_to_typesense.py` | Sync script (Supabase → Typesense) |
| `README.md` | This documentation |
