from app.database import SessionLocal
from app import models

def clear_blocklist():
    db = SessionLocal()
    try:
        count = db.query(models.BlockedDomain).delete()
        db.commit()
        print(f"Cleared {count} blocked domains.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_blocklist()
