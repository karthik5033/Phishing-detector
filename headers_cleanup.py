from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.models import BlockedDomain
from backend.app.database import SQLALCHEMY_DATABASE_URL

# Setup DB connection
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Find invalid domains (containing / or :)
    invalid = db.query(BlockedDomain).filter(
        (BlockedDomain.domain.contains('/')) | 
        (BlockedDomain.domain.contains(':'))
    ).all()
    
    print(f"Found {len(invalid)} invalid entries.")
    for item in invalid:
        print(f"Deleting: {item.domain}")
        db.delete(item)
    
    db.commit()
    print("Cleanup complete.")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
