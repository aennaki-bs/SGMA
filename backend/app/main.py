from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine
from app.models import *  # Importe tous les modèles pour que SQLAlchemy les enregistre
from app.database import Base, SessionLocal
from passlib.context import CryptContext
from app.models.user import User
import uuid

from app.routers import auth, student, grades, import_excel, transcript, audit

pwd_context = CryptContext(schemes=["bcrypt"])

def create_first_admin():
    """Crée le compte admin initial s'il n'existe pas."""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first()
        if not existing:
            admin = User(
                id=str(uuid.uuid4()),
                email=settings.FIRST_ADMIN_EMAIL,
                password_hash=pwd_context.hash(settings.FIRST_ADMIN_PASSWORD),
                full_name=settings.FIRST_ADMIN_NAME,
                role="admin",
            )
            db.add(admin)
            db.commit()
            print(f"✅ Compte admin créé : {settings.FIRST_ADMIN_EMAIL}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    create_first_admin()
    yield

app = FastAPI(
    title="FSJES — Gestion des Relevés de Notes",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Permet au frontend (React de ton collègue) de communiquer avec l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/api/auth",        tags=["Auth"])
app.include_router(student.router,      prefix="/api/students",    tags=["Étudiants"])
app.include_router(grades.router,       prefix="/api/grades",      tags=["Notes"])
app.include_router(import_excel.router, prefix="/api/import",      tags=["Import Excel"])
app.include_router(transcript.router,   prefix="/api/transcripts", tags=["Relevés & Impressions"])
app.include_router(audit.router,        prefix="/api/audit",       tags=["Audit"])

@app.get("/api/health")
def health():
    return {"status": "ok", "env": settings.APP_ENV}