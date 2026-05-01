import getpass
import os

from database import Base, engine, SessionLocal
from dependencies import hash_password
from models import User, UserRole, UserStatus


def create_admin():
    Base.metadata.create_all(bind=engine)

    name = os.getenv("ADMIN_NAME") or input("Admin name: ").strip() or "WorkUp Admin"
    email = os.getenv("ADMIN_EMAIL") or input("Admin email: ").strip()
    password = os.getenv("ADMIN_PASSWORD") or getpass.getpass("Admin password: ")

    if not email or not password:
        print("Admin email and password are required.")
        return

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == email).first()
        if admin:
            admin.name = name
            admin.role = UserRole.admin
            admin.status = UserStatus.active
            admin.password_hash = hash_password(password)
            print("Existing admin account updated.")
        else:
            admin = User(
                name=name,
                email=email,
                role=UserRole.admin,
                status=UserStatus.active,
                password_hash=hash_password(password),
            )
            db.add(admin)
            print("Admin account created.")

        db.commit()
        print(f"Admin can now log in with: {email}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
