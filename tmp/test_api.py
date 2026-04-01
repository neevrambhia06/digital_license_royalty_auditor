import requests
import json

def test_audit_results():
    try:
        response = requests.get("http://127.0.0.1:8000/api/audit-results")
        if response.status_code == 200:
            print("API Success!")
            data = response.json()
            if len(data) > 0:
                print(f"Received {len(data)} results.")
                print("First result keys:", data[0].keys())
                print("First result studio:", data[0].get("studio"))
            else:
                print("Received empty list. Check if database has audit_results.")
        else:
            print(f"API Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_audit_results()
