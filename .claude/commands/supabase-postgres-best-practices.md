---
name: supabase-postgres-best-practices
description: Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.
license: MIT
metadata:
  author: supabase
  version: "1.1.0"
  organization: Supabase
  date: January 2026
  abstract: Comprehensive Postgres performance optimization guide for developers using Supabase and Postgres. Contains performance rules across 8 categories, prioritized by impact from critical (query performance, connection management) to incremental (advanced features). Each rule includes detailed explanations, incorrect vs. correct SQL examples, query plan analysis, and specific performance metrics to guide automated optimization and code generation.
---

# Supabase Postgres Best Practices

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact to guide automated query optimization and schema design.

## When to Apply

Reference these guidelines when:
- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

---

## 1. Query Performance (CRITICAL)

### Missing Indexes

**Problem:** Full table scans on large tables

```sql
-- BAD: No index on frequently filtered column
SELECT * FROM orders WHERE customer_id = 123;
-- Seq Scan on orders (cost=0.00..25.00 rows=1000)

-- GOOD: Add index
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
-- Index Scan using idx_orders_customer_id (cost=0.29..8.30 rows=1)
```

### Composite Indexes

**Rule:** Column order matters - most selective first, or most queried alone first

```sql
-- For queries like: WHERE customer_id = ? AND status = ?
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);

-- This index supports:
-- ✅ WHERE customer_id = 123
-- ✅ WHERE customer_id = 123 AND status = 'pending'
-- ❌ WHERE status = 'pending' (won't use this index)
```

### Partial Indexes

**Use when:** Most queries filter on a specific subset

```sql
-- Only index active users (saves space, faster writes)
CREATE INDEX idx_users_active_email ON users(email)
WHERE is_active = true;
```

### Covering Indexes

**Use when:** Avoid table lookups for common queries

```sql
-- Include all columns needed by query
CREATE INDEX idx_orders_covering ON orders(customer_id)
INCLUDE (total, status, created_at);

-- Query can be satisfied from index alone (Index Only Scan)
SELECT total, status FROM orders WHERE customer_id = 123;
```

---

## 2. Connection Management (CRITICAL)

### Connection Pooling

**Problem:** Too many direct connections exhaust Postgres limits

```
# Supabase connection string (use pooler for apps)
# Direct: postgres://user:pass@db.xxx.supabase.co:5432/postgres
# Pooler: postgres://user:pass@aws-0-region.pooler.supabase.com:6543/postgres
```

| Mode | Use Case | Prepared Statements |
|------|----------|---------------------|
| Transaction | Most apps, serverless | ❌ Disabled |
| Session | Long-running connections | ✅ Supported |

### Connection Limits

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Supabase limits by plan:
-- Free: 60 direct / 200 pooled
-- Pro: 100 direct / 400 pooled
```

### Idle Timeout

```sql
-- Close idle connections after 10 minutes
ALTER ROLE myuser SET idle_in_transaction_session_timeout = '10min';
```

### Prepared Statements with Pooling

**Problem:** Prepared statements fail in transaction pooling mode

```python
# BAD: asyncpg with prepared statements
await conn.fetch("SELECT * FROM users WHERE id = $1", user_id)

# GOOD: Disable prepared statement cache
pool = await asyncpg.create_pool(dsn, statement_cache_size=0)
```

---

## 3. Security & RLS (CRITICAL)

### RLS Policy Performance

**Problem:** Subqueries in RLS policies run for every row

```sql
-- BAD: Subquery in policy (runs N times)
CREATE POLICY user_orders ON orders
  USING (user_id = (SELECT id FROM users WHERE email = current_user));

-- GOOD: Use auth.uid() directly
CREATE POLICY user_orders ON orders
  USING (user_id = auth.uid());

-- BETTER: Wrap in subquery for single evaluation
CREATE POLICY user_orders ON orders
  USING (user_id = (SELECT auth.uid()));
```

### Function Search Path

**Problem:** Mutable search_path can be security risk

```sql
-- BAD: No search_path set
CREATE FUNCTION my_func() RETURNS void AS $$ ... $$;

-- GOOD: Set immutable search_path
CREATE FUNCTION my_func() RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ ... $$;
```

---

## 4. Schema Design (HIGH)

### Data Types

| Use | Type | Example |
|-----|------|---------|
| Money | `DECIMAL(10,2)` | `price DECIMAL(10,2)` |
| IDs | `BIGINT` or `UUID` | `id BIGINT GENERATED ALWAYS AS IDENTITY` |
| Timestamps | `TIMESTAMPTZ` | `created_at TIMESTAMPTZ DEFAULT now()` |
| Booleans | `BOOLEAN` | `is_active BOOLEAN DEFAULT true` |
| JSON | `JSONB` (not JSON) | `metadata JSONB` |

```sql
-- NEVER use FLOAT for money
price FLOAT  -- ❌ Rounding errors

-- ALWAYS use DECIMAL
price DECIMAL(10,2)  -- ✅ Exact precision
```

### Foreign Key Indexes

**Rule:** Always index foreign keys

```sql
-- The FK constraint doesn't create an index!
ALTER TABLE orders ADD CONSTRAINT fk_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id);

-- You MUST add the index separately
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

### Primary Keys

```sql
-- Recommended: BIGINT with IDENTITY
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY

-- Alternative: UUID (for distributed systems)
id UUID DEFAULT gen_random_uuid() PRIMARY KEY
```

### Lowercase Identifiers

```sql
-- BAD: Mixed case requires quoting forever
CREATE TABLE "UserOrders" ("OrderId" INT);
SELECT "OrderId" FROM "UserOrders";  -- Must quote!

-- GOOD: Lowercase, no quoting needed
CREATE TABLE user_orders (order_id INT);
SELECT order_id FROM user_orders;
```

---

## 5. Concurrency & Locking (MEDIUM-HIGH)

### Short Transactions

**Rule:** Keep transactions as short as possible

```sql
-- BAD: Long transaction holds locks
BEGIN;
SELECT * FROM orders WHERE id = 1 FOR UPDATE;
-- ... application does slow processing ...
UPDATE orders SET status = 'done' WHERE id = 1;
COMMIT;

-- GOOD: Do processing outside transaction
-- 1. Read data (no lock)
-- 2. Process in application
-- 3. Short transaction for update only
BEGIN;
UPDATE orders SET status = 'done' WHERE id = 1;
COMMIT;
```

### Deadlock Prevention

**Rule:** Always lock tables/rows in consistent order

```sql
-- If you need to update both orders and inventory:
-- ALWAYS lock orders first, then inventory (alphabetical)
BEGIN;
SELECT * FROM orders WHERE id = 1 FOR UPDATE;
SELECT * FROM inventory WHERE product_id = 5 FOR UPDATE;
-- ... updates ...
COMMIT;
```

### Advisory Locks

**Use for:** Application-level locking without table locks

```sql
-- Lock a resource by ID
SELECT pg_advisory_lock(12345);
-- ... do work ...
SELECT pg_advisory_unlock(12345);

-- Non-blocking version
SELECT pg_try_advisory_lock(12345);  -- Returns false if locked
```

### SKIP LOCKED

**Use for:** Job queues, work distribution

```sql
-- Get next available job without blocking
SELECT * FROM jobs
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

---

## 6. Data Access Patterns (MEDIUM)

### N+1 Query Problem

```sql
-- BAD: N+1 queries
SELECT * FROM orders WHERE customer_id = 1;
-- Then for each order:
SELECT * FROM order_items WHERE order_id = ?;

-- GOOD: Single query with JOIN
SELECT o.*, oi.*
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.customer_id = 1;
```

### Cursor-Based Pagination

```sql
-- BAD: OFFSET pagination (slow for large offsets)
SELECT * FROM orders ORDER BY id LIMIT 25 OFFSET 10000;
-- Must scan and discard 10000 rows!

-- GOOD: Cursor pagination (constant time)
SELECT * FROM orders
WHERE id > 12345  -- last seen ID
ORDER BY id
LIMIT 25;
```

### Batch Inserts

```sql
-- BAD: Individual inserts
INSERT INTO orders (customer_id, total) VALUES (1, 100);
INSERT INTO orders (customer_id, total) VALUES (2, 200);

-- GOOD: Batch insert
INSERT INTO orders (customer_id, total) VALUES
  (1, 100),
  (2, 200),
  (3, 300);
```

### UPSERT

```sql
-- Insert or update in single statement
INSERT INTO users (email, name) VALUES ('a@b.com', 'Alice')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
```

---

## 7. Monitoring & Diagnostics (LOW-MEDIUM)

### EXPLAIN ANALYZE

```sql
-- See actual execution plan and timing
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE customer_id = 123;

-- Look for:
-- - Seq Scan (bad on large tables)
-- - Nested Loop with high row counts
-- - Sort operations (missing index?)
```

### pg_stat_statements

```sql
-- Enable in Supabase Dashboard > Database > Extensions

-- Find slowest queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### VACUUM and ANALYZE

```sql
-- Update statistics for query planner
ANALYZE table_name;

-- Reclaim space from dead tuples
VACUUM table_name;

-- Both (Supabase runs auto-vacuum)
VACUUM ANALYZE table_name;
```

---

## 8. Advanced Features (LOW)

### JSONB Indexing

```sql
-- GIN index for JSONB containment queries
CREATE INDEX idx_users_metadata ON users USING GIN (metadata);

-- Supports:
SELECT * FROM users WHERE metadata @> '{"role": "admin"}';
```

### Full-Text Search

```sql
-- Create search index
ALTER TABLE articles ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;

CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);

-- Query
SELECT * FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgres & performance');
```

---

## Quick Reference Card

| Category | Rule | Impact |
|----------|------|--------|
| **Indexes** | Index all FKs | CRITICAL |
| **Indexes** | Composite: selective column first | HIGH |
| **Indexes** | Use partial indexes for subsets | MEDIUM |
| **Connections** | Use pooler URL for apps | CRITICAL |
| **Connections** | Disable prepared statements in transaction mode | CRITICAL |
| **RLS** | Wrap auth.uid() in subquery | HIGH |
| **Schema** | DECIMAL for money, never FLOAT | HIGH |
| **Schema** | Use TIMESTAMPTZ, not TIMESTAMP | MEDIUM |
| **Queries** | Cursor pagination, not OFFSET | HIGH |
| **Queries** | Batch inserts | MEDIUM |
| **Locks** | Keep transactions short | HIGH |
| **Locks** | Lock in consistent order | MEDIUM |

---

## References

- PostgreSQL Documentation: https://www.postgresql.org/docs/current/
- Supabase Docs: https://supabase.com/docs
- Full rule references: https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices/references
