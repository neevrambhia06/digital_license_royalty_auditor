"""
seed_supabase.py
================
Reads generated CSVs and batch-inserts them into Supabase.

Requirements:
  pip install supabase python-dotenv rich

Usage:
  1. First run:  python generate_seed_data.py
  2. Then run:   python seed_supabase.py
"""

import csv
import os
import sys
import json
from dotenv import load_dotenv

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase-py not installed. Run: pip install supabase")
    sys.exit(1)

try:
    from rich.console import Console
    from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, TimeElapsedColumn
    from rich.table import Table
    from rich.panel import Panel
    HAS_RICH = True
except ImportError:
    HAS_RICH = False
    print("WARNING: 'rich' not installed. Using plain output. Install with: pip install rich")

# ─────────────────────────────────────────────
# Setup
# ─────────────────────────────────────────────
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
BATCH_SIZE = 1000

console = Console() if HAS_RICH else None


# ─────────────────────────────────────────────
# CSV Reading
# ─────────────────────────────────────────────
def read_csv(filename):
    """Read a CSV file and return a list of dicts with type coercion."""
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"ERROR: File not found: {path}")
        print("Run 'python generate_seed_data.py' first.")
        sys.exit(1)

    rows = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def coerce_contract(row):
    """Convert CSV string values to proper types for contracts table."""
    # Parse territory from PostgreSQL array literal: {US,CA,UK} -> ["US","CA","UK"]
    terr = row["territory"].strip("{}")
    territory_list = [t.strip() for t in terr.split(",") if t.strip()]

    return {
        "contract_id": row["contract_id"],
        "content_id": row["content_id"],
        "studio": row["studio"],
        "royalty_rate": float(row["royalty_rate"]),
        "rate_per_play": float(row["rate_per_play"]),
        "territory": territory_list,
        "start_date": row["start_date"],
        "end_date": row["end_date"],
        "tier_threshold": int(row["tier_threshold"]),
        "tier_rate": float(row["tier_rate"]),
    }


def coerce_streaming_log(row):
    """Convert CSV string values to proper types for streaming_logs table."""
    return {
        "play_id": row["play_id"],
        "content_id": row["content_id"],
        "timestamp": row["timestamp"],
        "country": row["country"],
        "plays": int(row["plays"]),
        "user_type": row["user_type"],
        "device": row["device"],
    }


def coerce_payment(row):
    """Convert CSV string values to proper types for payment_ledger table."""
    return {
        "payment_id": row["payment_id"],
        "content_id": row["content_id"],
        "contract_id": row["contract_id"],
        "amount_paid": float(row["amount_paid"]),
        "payment_date": row["payment_date"],
    }


# ─────────────────────────────────────────────
# Batch Insert
# ─────────────────────────────────────────────
def batch_insert(table_name, rows, coerce_fn, description):
    """Insert rows in batches with progress tracking."""
    total = len(rows)
    coerced = [coerce_fn(r) for r in rows]

    if HAS_RICH:
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}"),
            BarColumn(bar_width=40),
            TextColumn("[progress.percentage]{task.percentage:>3.1f}%"),
            TextColumn("[cyan]{task.completed}/{task.total}"),
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            task = progress.add_task(description, total=total)

            for i in range(0, total, BATCH_SIZE):
                batch = coerced[i : i + BATCH_SIZE]
                try:
                    supabase.table(table_name).insert(batch).execute()
                except Exception as e:
                    console.print(f"  [red]ERROR at batch {i // BATCH_SIZE + 1}: {e}[/red]")
                    # Try smaller batches on error
                    for single in batch:
                        try:
                            supabase.table(table_name).insert(single).execute()
                        except Exception as inner_e:
                            console.print(f"  [red]  Skip: {single.get(list(single.keys())[0], '?')}: {inner_e}[/red]")
                progress.update(task, advance=len(batch))
    else:
        for i in range(0, total, BATCH_SIZE):
            batch = coerced[i : i + BATCH_SIZE]
            try:
                supabase.table(table_name).insert(batch).execute()
            except Exception as e:
                print(f"  ERROR at batch {i // BATCH_SIZE + 1}: {e}")
            done = min(i + BATCH_SIZE, total)
            pct = done / total * 100
            print(f"  {description}: {done}/{total} ({pct:.1f}%)")


# ─────────────────────────────────────────────
# Clear existing data
# ─────────────────────────────────────────────
def clear_tables():
    """Clear all tables in reverse dependency order."""
    tables_order = [
        "agent_traces",
        "violations",
        "audit_results",
        "payment_ledger",
        "streaming_logs",
        "contracts",
    ]
    if HAS_RICH:
        console.print("[yellow]Clearing existing data...[/yellow]")
    else:
        print("Clearing existing data...")

    for table in tables_order:
        try:
            # Delete all rows
            supabase.table(table).delete().neq("contract_id" if table == "contracts" else list({"play_id": 1, "payment_id": 1, "audit_id": 1, "violation_id": 1, "trace_id": 1, "contract_id": 1}.keys())[0], "IMPOSSIBLE_VALUE_THAT_NEVER_EXISTS").execute()
        except Exception:
            # Fallback: use RPC or just proceed (empty tables won't error)
            pass

    if HAS_RICH:
        console.print("[green]  Tables cleared.[/green]")
    else:
        print("  Tables cleared.")


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
def main():
    if HAS_RICH:
        console.print(Panel.fit(
            "[bold white]Digital License Royalty Auditor[/bold white]\n"
            "[dim]Supabase Seed Script[/dim]",
            border_style="cyan",
        ))
        console.print()
    else:
        print("=" * 50)
        print("  Digital License Royalty Auditor")
        print("  Supabase Seed Script")
        print("=" * 50)
        print()

    # Check CSV files exist
    required_files = ["contracts_1000.csv", "streaming_logs_100k.csv", "payments_ledger.csv"]
    for fname in required_files:
        fpath = os.path.join(DATA_DIR, fname)
        if not os.path.exists(fpath):
            msg = f"Missing: {fpath}\nRun 'python generate_seed_data.py' first."
            if HAS_RICH:
                console.print(f"[red]{msg}[/red]")
            else:
                print(msg)
            sys.exit(1)

    # Read CSVs
    if HAS_RICH:
        console.print("[bold]Reading CSV files...[/bold]")
    else:
        print("Reading CSV files...")

    contracts_rows = read_csv("contracts_1000.csv")
    logs_rows = read_csv("streaming_logs_100k.csv")
    payments_rows = read_csv("payments_ledger.csv")

    if HAS_RICH:
        info = Table(show_header=False, box=None, padding=(0, 2))
        info.add_row("Contracts:", f"[cyan]{len(contracts_rows):,}[/cyan]")
        info.add_row("Streaming Logs:", f"[cyan]{len(logs_rows):,}[/cyan]")
        info.add_row("Payments:", f"[cyan]{len(payments_rows):,}[/cyan]")
        console.print(info)
        console.print()
    else:
        print(f"  Contracts:      {len(contracts_rows):,}")
        print(f"  Streaming Logs: {len(logs_rows):,}")
        print(f"  Payments:       {len(payments_rows):,}")
        print()

    # Clear and seed
    clear_tables()

    if HAS_RICH:
        console.print()
        console.print("[bold]Seeding Supabase...[/bold]")
        console.print()
    else:
        print()
        print("Seeding Supabase...")
        print()

    # 1. Contracts (must be first -- payment_ledger references it)
    batch_insert("contracts", contracts_rows, coerce_contract, "Contracts")

    # 2. Streaming Logs
    batch_insert("streaming_logs", logs_rows, coerce_streaming_log, "Streaming Logs")

    # 3. Payment Ledger
    batch_insert("payment_ledger", payments_rows, coerce_payment, "Payments")

    # Done
    if HAS_RICH:
        console.print()
        console.print(Panel.fit(
            "[bold green]Seed complete.[/bold green]\n\n"
            f"[white]Contracts:[/white]      [cyan]{len(contracts_rows):,}[/cyan]\n"
            f"[white]Streaming Logs:[/white] [cyan]{len(logs_rows):,}[/cyan]\n"
            f"[white]Payments:[/white]       [cyan]{len(payments_rows):,}[/cyan]",
            border_style="green",
            title="[bold]Summary[/bold]"
        ))
    else:
        print()
        print("=" * 50)
        print("  Seed complete.")
        print(f"  Contracts:      {len(contracts_rows):,}")
        print(f"  Streaming Logs: {len(logs_rows):,}")
        print(f"  Payments:       {len(payments_rows):,}")
        print("=" * 50)


if __name__ == "__main__":
    main()
