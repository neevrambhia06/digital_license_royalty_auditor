import os
import sys
import shutil
import tempfile
from unittest.mock import patch, MagicMock

# Add api directory to sys.path
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

def test_bootstrap_logic():
    print("[*] Testing bootstrap logic...")
    original_path = sys.path.copy()
    try:
        # Simulate index.py's bootstrap
        test_base_dir = os.path.dirname(os.path.abspath(__file__))
        if test_base_dir not in sys.path:
            sys.path.insert(0, test_base_dir)
        
        from database import IS_VERCEL
        print(f"[+] Bootstrap successful. IS_VERCEL: {IS_VERCEL}")
    except Exception as e:
        print(f"[-] Bootstrap failed: {e}")
        return False
    finally:
        sys.path = original_path
    return True

def test_vercel_copy_logic():
    print("[*] Testing Vercel DB copy logic...")
    
    # Create a dummy original db
    dummy_db_content = b"dummy sqlite data"
    original_db_path = os.path.join(api_dir, "dlra_audit_test.db")
    with open(original_db_path, "wb") as f:
        f.write(dummy_db_content)
    
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            # Mock DB_PATH to be in our temp dir
            test_db_path = os.path.join(tmpdir, "dlra_audit_copy.db")
            
            # Simulate the logic in index.py
            if os.path.exists(original_db_path):
                if not os.path.exists(test_db_path):
                    print(f"[*] Simulating copy from {original_db_path} to {test_db_path}")
                    shutil.copy2(original_db_path, test_db_path)
            
            if os.path.exists(test_db_path):
                with open(test_db_path, "rb") as f:
                    content = f.read()
                if content == dummy_db_content:
                    print("[+] Copy logic verified successfully.")
                else:
                    print("[-] Copy logic failed: Content mismatch.")
            else:
                print("[-] Copy logic failed: File not created.")
    finally:
        if os.path.exists(original_db_path):
            os.remove(original_db_path)

if __name__ == "__main__":
    success = test_bootstrap_logic()
    if success:
        test_vercel_copy_logic()
