import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print(f"URL: {SUPABASE_URL}")
print(f"Key prefixed: {SUPABASE_KEY[:10]}...")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    res = supabase.table("contracts").select("*").limit(1).execute()
    print("Select success")
    res = supabase.table("contracts").insert([{"contract_id": "TEST", "content_id": "TEST", "studio": "TEST", "royalty_rate": 0.1, "rate_per_play": 0.01, "territory": ["US"], "start_date": "2024-01-01", "end_date": "2025-01-01", "tier_rate": 0.008}]).execute()
    print("Insert success")
except Exception as e:
    print(f"Error: {e}")
