from app.database import SessionLocal
from app import models

def inspect():
    db = SessionLocal()
    try:
        scans = db.query(models.ScanResult).all()
        print(f"Total Scans: {len(scans)}")
        for s in scans[:5]:
            print(f" - {s.url} | {s.timestamp}")
            
        print("-" * 20)
        
        blocks = db.query(models.BlockedDomain).all()
        print(f"Total Blocks: {len(blocks)}")
        for b in blocks:
            print(f" - {b.domain}")
            
    finally:
        db.close()

if __name__ == "__main__":
    inspect()
