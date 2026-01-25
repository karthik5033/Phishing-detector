import sqlite3
import os

DB_PATH = "sql_app.db"

def force_purge():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("1. Counting rows...")
        cursor.execute("SELECT count(*) FROM scan_results")
        print(f"   ScanResults before: {cursor.fetchone()[0]}")
        
        print("2. DELETING ALL DATA...")
        cursor.execute("DELETE FROM scan_results")
        cursor.execute("DELETE FROM blocked_domains")
        conn.commit()
        
        print("3. Vacuuming...")
        cursor.execute("VACUUM")
        
        print("4. Verification...")
        cursor.execute("SELECT count(*) FROM scan_results")
        final_count = cursor.fetchone()[0]
        print(f"   ScanResults after: {final_count}")
        
        conn.close()
        print("✅ FORCE PURGE COMPLETE.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    force_purge()
