#!/usr/bin/env python3
"""
Import WordPress users to Supabase (auth + subscriptions).

Usage:
  1. Export WordPress/ARMember users to CSV
  2. Map columns to expected format (see EXPECTED_COLUMNS below)
  3. Set environment variables:
     - SUPABASE_URL (e.g., https://kmdelrgtgglcrupprkqf.supabase.co)
     - SUPABASE_SERVICE_ROLE_KEY
  4. Run: python3 scripts/data/import-wordpress-users.py users.csv

Expected CSV columns:
  email, first_name, last_name, organization, plan, start_date

  - plan: "monthly" or "yearly"
  - start_date: YYYY-MM-DD format
  - organization: optional (can be empty)

The script will:
  - Create Supabase Auth users (email_confirm: true, no invite email sent)
  - Create subscription rows with computed end_date and grace_ends_at
  - Skip users that already exist (logs a warning)
  - NOT send any emails (use "Stuur uitnodiging" button later)

Dry run:
  python3 scripts/data/import-wordpress-users.py users.csv --dry-run
"""

import csv
import json
import os
import sys
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
    sys.exit(1)

EXPECTED_COLUMNS = {"email", "first_name", "last_name", "plan", "start_date"}


def api_request(method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
    """Make authenticated request to Supabase API."""
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "apikey": SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
    }
    if path.startswith("/rest/"):
        headers["Prefer"] = "return=representation"

    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=headers, method=method)

    try:
        with urlopen(req) as resp:
            response_body = resp.read().decode()
            return resp.status, json.loads(response_body) if response_body else {}
    except HTTPError as e:
        response_body = e.read().decode()
        try:
            return e.code, json.loads(response_body)
        except json.JSONDecodeError:
            return e.code, {"error": response_body}


def compute_dates(plan: str, start_date: str) -> tuple[str, str]:
    """Compute end_date and grace_ends_at from plan and start_date."""
    start = datetime.strptime(start_date, "%Y-%m-%d")

    if plan == "monthly":
        # Add 1 month
        month = start.month + 1
        year = start.year
        if month > 12:
            month = 1
            year += 1
        end = start.replace(year=year, month=month)
        grace_days = 3
    else:  # yearly
        end = start.replace(year=start.year + 1)
        grace_days = 14

    grace_end = end + timedelta(days=grace_days)
    return end.strftime("%Y-%m-%d"), grace_end.strftime("%Y-%m-%d")


def create_auth_user(email: str) -> str | None:
    """Create Supabase Auth user. Returns user ID or None if already exists."""
    status, data = api_request("POST", "/auth/v1/admin/users", {
        "email": email,
        "email_confirm": True,
    })

    if status in (200, 201):
        return data.get("id")

    # User already exists
    error_msg = data.get("msg", "") or data.get("message", "") or str(data)
    if "already been registered" in error_msg:
        # Find existing user
        status2, data2 = api_request("GET", f"/auth/v1/admin/users?page=1&per_page=1000")
        if status2 == 200:
            users = data2.get("users", [])
            for user in users:
                if user.get("email") == email:
                    return user["id"]
        print(f"  WARNING: User {email} exists but could not find ID")
        return None

    print(f"  ERROR creating auth user {email}: {error_msg}")
    return None


def create_subscription(user_id: str, row: dict) -> bool:
    """Create subscription row. Returns True on success."""
    end_date, grace_ends_at = compute_dates(row["plan"], row["start_date"])

    subscription = {
        "user_id": user_id,
        "email": row["email"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "organization": row.get("organization") or None,
        "plan": row["plan"],
        "role": "member",
        "start_date": row["start_date"],
        "end_date": end_date,
        "grace_ends_at": grace_ends_at,
    }

    status, data = api_request("POST", "/rest/v1/subscriptions", subscription)

    if status in (200, 201):
        return True

    error_msg = str(data)
    if "duplicate key" in error_msg or "unique" in error_msg.lower():
        print(f"  WARNING: Subscription already exists for {row['email']}")
        return False

    print(f"  ERROR creating subscription for {row['email']}: {error_msg}")
    return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 import-wordpress-users.py <csv_file> [--dry-run]")
        sys.exit(1)

    csv_file = sys.argv[1]
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("=== DRY RUN MODE (no changes will be made) ===\n")

    # Read CSV
    with open(csv_file, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Validate columns
    if rows:
        columns = set(rows[0].keys())
        missing = EXPECTED_COLUMNS - columns
        if missing:
            print(f"ERROR: Missing CSV columns: {missing}")
            print(f"Found columns: {sorted(columns)}")
            print(f"Expected: {sorted(EXPECTED_COLUMNS)}")
            sys.exit(1)

    print(f"Found {len(rows)} users to import\n")

    # Validate data
    errors = []
    for i, row in enumerate(rows, 1):
        if not row.get("email"):
            errors.append(f"Row {i}: missing email")
        if row.get("plan") not in ("monthly", "yearly"):
            errors.append(f"Row {i} ({row.get('email', '?')}): plan must be 'monthly' or 'yearly', got '{row.get('plan')}'")
        if row.get("start_date"):
            try:
                datetime.strptime(row["start_date"], "%Y-%m-%d")
            except ValueError:
                errors.append(f"Row {i} ({row.get('email', '?')}): start_date must be YYYY-MM-DD, got '{row['start_date']}'")

    if errors:
        print("Validation errors:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    print("Validation passed.\n")

    if dry_run:
        print("Users that would be imported:")
        for row in rows:
            end_date, grace = compute_dates(row["plan"], row["start_date"])
            print(f"  {row['email']} | {row['first_name']} {row['last_name']} | {row['plan']} | {row['start_date']} -> {end_date}")
        print(f"\n{len(rows)} users ready. Run without --dry-run to import.")
        return

    # Import
    success = 0
    skipped = 0
    failed = 0

    for i, row in enumerate(rows, 1):
        email = row["email"]
        print(f"[{i}/{len(rows)}] {email}...")

        # Step 1: Create auth user
        user_id = create_auth_user(email)
        if not user_id:
            skipped += 1
            continue

        # Step 2: Create subscription
        if create_subscription(user_id, row):
            success += 1
            print(f"  OK: {row['first_name']} {row['last_name']} ({row['plan']})")
        else:
            skipped += 1

    print(f"\n{'='*40}")
    print(f"Results: {success} created, {skipped} skipped, {failed} failed")
    print(f"Total users in CSV: {len(rows)}")


if __name__ == "__main__":
    main()
