# Backend — Instructions de Développement
## Application Gestion des Relevés de Notes — FSJES Ain Chock

> **Ton rôle :** Backend (FastAPI) + Base de données (PostgreSQL)  
> **Rôle de ton collègue :** Frontend (React)  
> **Mode :** Développement local — chacun sur sa propre machine Windows

---

## Table des Matières

1. [Prérequis & Installation](#1-prérequis--installation)
2. [Structure du Projet](#2-structure-du-projet)
3. [Configuration PostgreSQL](#3-configuration-postgresql)
4. [Environnement Python & Dépendances](#4-environnement-python--dépendances)
5. [Fichier .env](#5-fichier-env)
6. [Code — Configuration & Base de Données](#6-code--configuration--base-de-données)
7. [Code — Modèles SQLAlchemy](#7-code--modèles-sqlalchemy)
8. [Code — Schémas Pydantic](#8-code--schémas-pydantic)
9. [Code — Application FastAPI principale](#9-code--application-fastapi-principale)
10. [Code — Authentification](#10-code--authentification)
11. [Code — Routes API](#11-code--routes-api)
12. [Code — Services (Excel, PDF, Print Control)](#12-code--services)
13. [Migrations Alembic](#13-migrations-alembic)
14. [Lancer le Serveur](#14-lancer-le-serveur)
15. [API — Documentation & Endpoints](#15-api--documentation--endpoints)
16. [Collaboration avec le Frontend](#16-collaboration-avec-le-frontend)
17. [Git — Workflow d'équipe](#17-git--workflow-déquipe)

---

## 1. Prérequis & Installation

### 1.1 Python 3.11+
```powershell
# Vérifier si Python est installé
python --version

# Si non installé : télécharger depuis https://www.python.org/downloads/
# Cocher "Add Python to PATH" lors de l'installation
```

### 1.2 PostgreSQL 15+
1. Télécharger depuis : https://www.postgresql.org/download/windows/
2. Pendant l'installation, noter le **mot de passe du super-utilisateur `postgres`** P@ssw0rd
3. Port par défaut : **5432** (laisser par défaut)
4. Installer pgAdmin 4 (inclus dans l'installeur — utile pour visualiser la DB)

```powershell
# Vérifier que PostgreSQL est installé
psql --version
# Si la commande n'est pas reconnue, ajouter au PATH :
# C:\Program Files\PostgreSQL\15\bin
```

### 1.3 Git
```powershell
git --version
# Si non installé : https://git-scm.com/download/win
```

### 1.4 WeasyPrint — Dépendances Windows (pour PDF)
WeasyPrint nécessite GTK sur Windows. Suivre ces étapes :

1. Télécharger et installer le runtime GTK3 pour Windows :  
   https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases  
   (fichier `gtk3-runtime-x.x.x-x86_64.exe`)
2. Redémarrer le terminal après installation

> **Alternative si GTK pose problème :** On utilisera la génération PDF côté navigateur (`window.print()` avec CSS `@media print`). Dans ce cas, le backend servira juste le HTML du relevé.

### 1.5 Outils recommandés
- **VS Code** avec extensions : Python, Pylance, REST Client
- **pgAdmin 4** (installé avec PostgreSQL) pour visualiser la base
- **Postman** ou REST Client VS Code pour tester l'API

---

## 2. Structure du Projet

Créer la structure suivante dans un dossier `backend/` :

```
GestionDesRelevetsDeNote/
├── PRD.md
├── instructions.md
└── backend/
    ├── .env                    ← Variables d'environnement (NE PAS committer)
    ├── .env.example            ← Template public (committer celui-ci)
    ├── .gitignore
    ├── requirements.txt
    ├── alembic.ini
    ├── alembic/
    │   ├── env.py
    │   └── versions/           ← Fichiers de migration générés automatiquement
    └── app/
        ├── __init__.py
        ├── main.py             ← Point d'entrée FastAPI
        ├── config.py           ← Lecture du .env
        ├── database.py         ← Connexion PostgreSQL
        ├── dependencies.py     ← Injection de dépendances (auth, session DB)
        ├── models/
        │   ├── __init__.py
        │   ├── user.py
        │   ├── student.py      ← inclut les champs récapitulatifs (fusionné)
        │   ├── grade.py        ← subject_name + subject_type directement
        │   ├── transcript.py   ← PrintLog uniquement
        │   └── audit_log.py
        ├── schemas/
        │   ├── __init__.py
        │   ├── auth.py
        │   ├── student.py
        │   ├── grade.py
        │   └── transcript.py
        ├── routers/
        │   ├── __init__.py
        │   ├── auth.py
        │   ├── students.py
        │   ├── grades.py
        │   ├── import_excel.py
        │   ├── transcripts.py
        │   └── audit.py
        ├── services/
        │   ├── __init__.py
        │   ├── excel_parser.py
        │   └── pdf_generator.py
        └── templates/
            └── releve_fsjes.html
```

Créer les dossiers depuis PowerShell :
```powershell
cd "C:\Users\ENNAKI\Desktop\GestionDesRelevetsDeNote"
mkdir backend
cd backend
mkdir -p app/models app/schemas app/routers app/services app/templates
mkdir -p alembic/versions
New-Item -ItemType File app/__init__.py
New-Item -ItemType File app/models/__init__.py
New-Item -ItemType File app/schemas/__init__.py
New-Item -ItemType File app/routers/__init__.py
New-Item -ItemType File app/services/__init__.py
```

---

## 3. Configuration PostgreSQL

### 3.1 Créer la base de données
```powershell
# Se connecter à PostgreSQL en tant que postgres
psql -U postgres

# Dans le shell psql :
CREATE DATABASE releves_fsjes;
CREATE USER fsjes_user WITH PASSWORD 'fsjes_password_dev';
GRANT ALL PRIVILEGES ON DATABASE releves_fsjes TO fsjes_user;
\q
```

### 3.2 Vérifier la connexion
```powershell
psql -U fsjes_user -d releves_fsjes
# Si connexion réussie → la DB est prête
\q
```

---

## 4. Environnement Python & Dépendances

### 4.1 Créer un environnement virtuel
```powershell
cd "C:\Users\ENNAKI\Desktop\GestionDesRelevetsDeNote\backend"

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement (à faire à chaque nouvelle session)
.\venv\Scripts\Activate.ps1

# Si erreur de politique d'exécution :
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Puis relancer : .\venv\Scripts\Activate.ps1
```

### 4.2 Fichier `requirements.txt`
Créer le fichier `backend/requirements.txt` :
```
fastapi==0.111.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
pydantic==2.7.1
pydantic-settings==2.3.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
python-dotenv==1.0.1
pandas==2.2.2
openpyxl==3.1.3
weasyprint==62.3
Jinja2==3.1.4
httpx==0.27.0
```

### 4.3 Installer les dépendances
```powershell
pip install -r requirements.txt
```

---

## 5. Fichier .env

### 5.1 Créer `backend/.env` (ne jamais committer ce fichier)
```env
# ── Base de données ──────────────────────────────────────────
DATABASE_URL=postgresql+psycopg2://fsjes_user:fsjes_password_dev@localhost:5432/releves_fsjes

# ── JWT ──────────────────────────────────────────────────────
JWT_SECRET_KEY=change-this-to-a-long-random-secret-key-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=480

# ── CORS — URL du frontend (React de ton collègue) ───────────
FRONTEND_URL=http://localhost:5173

# ── Application ──────────────────────────────────────────────
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000

# ── Compte admin initial (créé au démarrage si inexistant) ───
FIRST_ADMIN_EMAIL=admin@fsjes.ma
FIRST_ADMIN_PASSWORD=Admin@2026
FIRST_ADMIN_NAME=Administrateur FSJES
```

### 5.2 Créer `backend/.env.example` (committer ce fichier)
```env
# ── Base de données ──────────────────────────────────────────
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@localhost:5432/releves_fsjes

# ── JWT ──────────────────────────────────────────────────────
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=480

# ── CORS — URL du frontend ────────────────────────────────────
FRONTEND_URL=http://localhost:5173

# ── Application ──────────────────────────────────────────────
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000

# ── Compte admin initial ─────────────────────────────────────
FIRST_ADMIN_EMAIL=admin@fsjes.ma
FIRST_ADMIN_PASSWORD=changeme
FIRST_ADMIN_NAME=Administrateur FSJES
```

### 5.3 Créer `backend/.gitignore`
```
venv/
__pycache__/
*.pyc
.env
*.db
*.sqlite3
uploads/
generated_pdfs/
```

---

## 6. Code — Configuration & Base de Données

### `app/config.py`
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    FRONTEND_URL: str = "http://localhost:5173"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    FIRST_ADMIN_EMAIL: str
    FIRST_ADMIN_PASSWORD: str
    FIRST_ADMIN_NAME: str

    class Config:
        env_file = ".env"

settings = Settings()
```

### `app/database.py`
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_engine(settings.DATABASE_URL, echo=(settings.APP_ENV == "development"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 7. Code — Modèles SQLAlchemy

### `app/models/user.py`
```python
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(SAEnum("admin", "professor", name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

### `app/models/student.py`
```python
import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Integer, Date, DateTime, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # Infos personnelles
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    exam_number: Mapped[str] = mapped_column(String(50), index=True)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    birth_place: Mapped[Optional[str]] = mapped_column(String(150))
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    study_year: Mapped[int] = mapped_column(Integer, nullable=False)
    branch: Mapped[str] = mapped_column(String(150), nullable=False)
    session: Mapped[Optional[str]] = mapped_column(String(50))
    # Récapitulatif (fusionné — plus de table transcript_summaries séparée)
    total_written: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    total_oral: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    total_general: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    average: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 2))
    general_result: Mapped[Optional[str]] = mapped_column(String(20))  # ناجح / راسب
    mention: Mapped[Optional[str]] = mapped_column(String(50))         # مقبول / جيد / ...
    copy_general: Mapped[Optional[str]] = mapped_column(String(50))
    observations: Mapped[Optional[str]] = mapped_column(Text)
    # Contrôle impression
    print_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    grades: Mapped[list["Grade"]] = relationship("Grade", back_populates="student", cascade="all, delete-orphan")
    print_logs: Mapped[list["PrintLog"]] = relationship("PrintLog", back_populates="student")
```

> `subject.py` supprimé — les matières sont stockées directement dans `grades`.

### `app/models/grade.py`
```python
import uuid
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Numeric, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Grade(Base):
    __tablename__ = "grades"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_name: Mapped[str] = mapped_column(String(200), nullable=False)   # ex: القانون الدستوري
    subject_type: Mapped[str] = mapped_column(String(20), nullable=False)    # كتابي / شفوي
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    note: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    written_result: Mapped[Optional[str]] = mapped_column(String(20))        # ناجح / راسب

    student: Mapped["Student"] = relationship("Student", back_populates="grades")
```

### `app/models/transcript.py`
```python
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class PrintLog(Base):
    __tablename__ = "print_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(String, ForeignKey("students.id"), nullable=False)
    printed_by: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    printed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    print_number: Mapped[int] = mapped_column(Integer, nullable=False)
    is_admin_override: Mapped[bool] = mapped_column(Boolean, default=False)
    override_reason: Mapped[Optional[str]] = mapped_column(Text)
    serial_number: Mapped[str] = mapped_column(String(50), nullable=False)

    student: Mapped["Student"] = relationship("Student", back_populates="print_logs")
    user: Mapped["User"] = relationship("User")
```

### `app/models/audit_log.py`
```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # LOGIN, SEARCH, VIEW, IMPORT, CREATE, UPDATE, DELETE, PRINT
    entity: Mapped[str] = mapped_column(String(50), nullable=True)   # student, transcript, user
    entity_id: Mapped[str] = mapped_column(String, nullable=True)
    detail: Mapped[str] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

### `app/models/__init__.py`
```python
from app.models.user import User
from app.models.student import Student
from app.models.grade import Grade
from app.models.transcript import PrintLog
from app.models.audit_log import AuditLog
```

---

## 8. Code — Schémas Pydantic

### `app/schemas/auth.py`
```python
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # "admin" | "professor"

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
```

### `app/schemas/student.py`
```python
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.grade import GradeOut

class StudentCreate(BaseModel):
    full_name: str
    exam_number: Optional[str] = None
    birth_date: date
    birth_place: Optional[str] = None
    academic_year: str
    study_year: int
    branch: str
    session: Optional[str] = None
    # Récapitulatif optionnel (rempli à l'import Excel)
    total_written: Optional[Decimal] = None
    total_oral: Optional[Decimal] = None
    total_general: Optional[Decimal] = None
    average: Optional[Decimal] = None
    general_result: Optional[str] = None
    mention: Optional[str] = None
    copy_general: Optional[str] = None
    observations: Optional[str] = None

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    exam_number: Optional[str] = None
    birth_date: Optional[date] = None
    birth_place: Optional[str] = None
    academic_year: Optional[str] = None
    study_year: Optional[int] = None
    branch: Optional[str] = None
    session: Optional[str] = None
    total_written: Optional[Decimal] = None
    total_oral: Optional[Decimal] = None
    total_general: Optional[Decimal] = None
    average: Optional[Decimal] = None
    general_result: Optional[str] = None
    mention: Optional[str] = None
    copy_general: Optional[str] = None
    observations: Optional[str] = None

class StudentOut(BaseModel):
    id: str
    full_name: str
    exam_number: Optional[str]
    birth_date: date
    birth_place: Optional[str]
    academic_year: str
    study_year: int
    branch: str
    session: Optional[str]
    total_written: Optional[Decimal]
    total_oral: Optional[Decimal]
    total_general: Optional[Decimal]
    average: Optional[Decimal]
    general_result: Optional[str]
    mention: Optional[str]
    copy_general: Optional[str]
    observations: Optional[str]
    print_count: int
    created_at: datetime

    model_config = {"from_attributes": True}

class StudentWithGrades(StudentOut):
    grades: List[GradeOut] = []
```

### `app/schemas/grade.py`
```python
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

class GradeCreate(BaseModel):
    subject_name: str          # ex: القانون الدستوري
    subject_type: str          # كتابي / شفوي
    order_index: int = 0
    note: Optional[Decimal] = None
    written_result: Optional[str] = None  # ناجح / راسب

class GradeOut(BaseModel):
    id: str
    subject_name: str
    subject_type: str
    order_index: int
    note: Optional[Decimal]
    written_result: Optional[str]

    model_config = {"from_attributes": True}
```

### `app/schemas/transcript.py`
```python
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class PrintRequest(BaseModel):
    override_reason: Optional[str] = None  # Obligatoire si admin réimprime

class PrintLogOut(BaseModel):
    id: str
    printed_at: datetime
    print_number: int
    is_admin_override: bool
    override_reason: Optional[str]
    serial_number: str
    printed_by_name: str

    model_config = {"from_attributes": True}
```

---

## 9. Code — Application FastAPI principale

### `app/dependencies.py`
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User

bearer_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")
    return current_user
```

### `app/main.py`
```python
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

from app.routers import auth, students, subjects, grades, import_excel, transcripts, audit

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
app.include_router(students.router,     prefix="/api/students",    tags=["Étudiants"])
app.include_router(grades.router,       prefix="/api/grades",      tags=["Notes"])
app.include_router(import_excel.router, prefix="/api/import",      tags=["Import Excel"])
app.include_router(transcripts.router,  prefix="/api/transcripts", tags=["Relevés & Impressions"])
app.include_router(audit.router,        prefix="/api/audit",       tags=["Audit"])

@app.get("/api/health")
def health():
    return {"status": "ok", "env": settings.APP_ENV}
```

---

## 10. Code — Authentification

### `app/routers/auth.py`
```python
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from jose import jwt
from passlib.context import CryptContext
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.auth import LoginRequest, TokenResponse, UserCreate, UserOut
from app.dependencies import get_current_user, require_admin
import uuid

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"])

def create_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "role": role, "exp": expire}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def log_action(db, user_id, action, detail, ip=None):
    db.add(AuditLog(id=str(uuid.uuid4()), user_id=user_id, action=action, detail=detail, ip_address=ip))
    db.commit()

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email, User.is_active == True).first()
    if not user or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    log_action(db, user.id, "LOGIN", f"Connexion réussie : {user.email}", request.client.host)
    return TokenResponse(access_token=create_token(user.id, user.role), role=user.role, full_name=user.full_name)

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/users", response_model=UserOut)
def create_user(body: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    user = User(id=str(uuid.uuid4()), email=body.email, password_hash=pwd_context.hash(body.password),
                full_name=body.full_name, role=body.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).all()

@router.patch("/users/{user_id}/toggle")
def toggle_user(user_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.is_active = not user.is_active
    db.commit()
    return {"is_active": user.is_active}
```

---

## 11. Code — Routes API

### `app/routers/students.py`
```python
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import date
from typing import Optional
from app.database import get_db
from app.models.student import Student
from app.models.audit_log import AuditLog
from app.schemas.student import StudentCreate, StudentUpdate, StudentOut, StudentWithGrades
from app.dependencies import get_current_user, require_admin
from app.models.user import User
import uuid

router = APIRouter()

def log(db, user_id, action, entity_id=None, detail=None, ip=None):
    db.add(AuditLog(id=str(uuid.uuid4()), user_id=user_id, action=action,
                    entity="student", entity_id=entity_id, detail=detail, ip_address=ip))
    db.commit()

@router.get("/", response_model=list[StudentOut])
def search_students(
    full_name: Optional[str] = Query(None),
    birth_date: Optional[date] = Query(None),
    exam_number: Optional[str] = Query(None),
    academic_year: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Student)
    if full_name:
        q = q.filter(Student.full_name.ilike(f"%{full_name}%"))
    if birth_date:
        q = q.filter(Student.birth_date == birth_date)
    if exam_number:
        q = q.filter(Student.exam_number.ilike(f"%{exam_number}%"))
    if academic_year:
        q = q.filter(Student.academic_year == academic_year)
    if branch:
        q = q.filter(Student.branch.ilike(f"%{branch}%"))

    log(db, current_user.id, "SEARCH", detail=f"Recherche: nom={full_name}, naissance={birth_date}", ip=request.client.host)
    return q.offset(skip).limit(limit).all()

@router.get("/{student_id}", response_model=StudentWithGrades)
def get_student(student_id: str, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    log(db, current_user.id, "VIEW", entity_id=student_id, detail=f"Consultation: {student.full_name}", ip=request.client.host)
    return student

@router.post("/", response_model=StudentOut)
def create_student(body: StudentCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    student = Student(id=str(uuid.uuid4()), **body.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    log(db, current_user.id, "CREATE", entity_id=student.id, detail=f"Création: {student.full_name}", ip=request.client.host)
    return student

@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: str, body: StudentUpdate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    log(db, current_user.id, "UPDATE", entity_id=student_id, detail=f"Modification: {student.full_name}", ip=request.client.host)
    return student

@router.delete("/{student_id}")
def delete_student(student_id: str, request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    name = student.full_name
    db.delete(student)
    db.commit()
    log(db, current_user.id, "DELETE", detail=f"Suppression: {name}", ip=request.client.host)
    return {"message": "Étudiant supprimé"}
```

### `app/routers/transcripts.py`
```python
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.student import Student
from app.models.transcript import PrintLog
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.transcript import PrintRequest
from app.dependencies import get_current_user
from app.services.pdf_generator import generate_releve_html
import uuid

router = APIRouter()

def log(db, user_id, action, entity_id=None, detail=None, ip=None):
    db.add(AuditLog(id=str(uuid.uuid4()), user_id=user_id, action=action,
                    entity="transcript", entity_id=entity_id, detail=detail, ip_address=ip))
    db.commit()

@router.get("/{student_id}/preview", response_class=HTMLResponse)
def preview_releve(student_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    html = generate_releve_html(student, print_number=None, is_preview=True)
    return HTMLResponse(content=html)

@router.post("/{student_id}/print", response_class=HTMLResponse)
def print_releve(student_id: str, body: PrintRequest, request: Request,
                 db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")

    existing_prints = db.query(PrintLog).filter(PrintLog.student_id == student_id).all()
    print_number = len(existing_prints) + 1
    is_override = print_number > 1

    # Professeur : bloqué après la 1ère impression
    if current_user.role == "professor" and len(existing_prints) >= 1:
        first_print = existing_prints[0]
        raise HTTPException(
            status_code=403,
            detail=f"Relevé déjà imprimé le {first_print.printed_at.strftime('%d/%m/%Y à %H:%M')}. Contactez un administrateur."
        )

    # Admin : motif obligatoire pour réimpression
    if is_override and current_user.role == "admin" and not body.override_reason:
        raise HTTPException(status_code=400, detail="Le motif est obligatoire pour une réimpression")

    serial = f"RN-FSJES-{datetime.utcnow().year}-{str(uuid.uuid4())[:8].upper()}"

    print_log = PrintLog(
        id=str(uuid.uuid4()),
        student_id=student_id,
        printed_by=current_user.id,
        print_number=print_number,
        is_admin_override=is_override,
        override_reason=body.override_reason if is_override else None,
        serial_number=serial,
    )
    db.add(print_log)
    student.print_count += 1
    db.commit()

    log(db, current_user.id, "PRINT", entity_id=student_id,
        detail=f"Impression N°{print_number} — {student.full_name} — {serial}", ip=request.client.host)

    html = generate_releve_html(student, print_number=print_number, serial=serial,
                                is_override=is_override, override_reason=body.override_reason)
    return HTMLResponse(content=html)

@router.get("/{student_id}/print-status")
def print_status(student_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(PrintLog).filter(PrintLog.student_id == student_id).all()
    return {
        "print_count": len(logs),
        "can_print": len(logs) == 0 or current_user.role == "admin",
        "first_print_at": logs[0].printed_at.isoformat() if logs else None,
        "prints": [{"number": l.print_number, "at": l.printed_at, "by": l.printed_by,
                    "is_override": l.is_admin_override} for l in logs],
    }
```

### `app/routers/import_excel.py`
```python
from fastapi import APIRouter, Depends, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.dependencies import get_current_user
from app.services.excel_parser import parse_excel_file
import uuid

router = APIRouter()

@router.post("/excel")
async def import_excel(
    file: UploadFile = File(...),
    academic_year: str = Form(...),
    study_year: int = Form(...),
    branch: str = Form(...),
    session: str = Form(None),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    result = parse_excel_file(content, db, academic_year=academic_year,
                               study_year=study_year, branch=branch, session=session)
    db.add(AuditLog(
        id=str(uuid.uuid4()), user_id=current_user.id, action="IMPORT",
        entity="student", detail=f"Import Excel '{file.filename}': {result['success']} réussis, {result['errors']} erreurs",
        ip_address=request.client.host,
    ))
    db.commit()
    return result
```

### `app/routers/audit.py`
```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.audit_log import AuditLog
from app.dependencies import require_admin
from app.models.user import User

router = APIRouter()

@router.get("/")
def get_audit_logs(
    action: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if user_id:
        q = q.filter(AuditLog.user_id == user_id)
    return q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
```

---

## 12. Code — Services

### `app/services/excel_parser.py`
```python
import pandas as pd
import uuid
from io import BytesIO
from sqlalchemy.orm import Session
from app.models.student import Student
from app.models.subject import Subject
from app.models.grade import Grade
from app.models.transcript import TranscriptSummary

# Colonnes fixes reconnues (en arabe)
FIXED_COLUMNS = {
    "اسم المرشح": "full_name",
    "الاسم و النسب": "full_name",
    "تاريخ الميلاد": "birth_date",
    "مكان الميلاد": "birth_place",
    "رقم الامتحان": "exam_number",
    "رقم التسجيل": "exam_number",
    "نتيجة الكتابي": "_written_result",
    "مجموع الكتابي": "_total_written",
    "مجموع الشفاهي": "_total_oral",
    "مجموع الشفوي": "_total_oral",
    "المجموع العام": "_total_general",
    "المعدل": "_average",
    "النسخة العامة": "_copy_general",
    "الميزة او الملاحظات": "_mention",
    "الميزة": "_mention",
    "الملاحظات": "_observations",
    "الدورة": "_session",
}

def parse_excel_file(content: bytes, db: Session, academic_year: str,
                     study_year: int, branch: str, session: str = None) -> dict:
    df = pd.read_excel(BytesIO(content), dtype=str)
    df = df.fillna("")

    success, errors = 0, []

    for row_idx, row in df.iterrows():
        try:
            student_data = {}
            grade_data = {}
            summary_data = {}

            for col in df.columns:
                col_stripped = col.strip()
                value = str(row[col]).strip()

                if col_stripped in FIXED_COLUMNS:
                    mapped = FIXED_COLUMNS[col_stripped]
                    if mapped.startswith("_"):
                        summary_data[mapped[1:]] = value
                    else:
                        student_data[mapped] = value
                elif value:
                    # Colonne de matière dynamique
                    grade_data[col_stripped] = value

            if not student_data.get("full_name"):
                errors.append({"row": row_idx + 2, "error": "Nom manquant"})
                continue

            # Vérifier doublon
            existing = db.query(Student).filter(
                Student.exam_number == student_data.get("exam_number"),
                Student.academic_year == academic_year,
            ).first()
            if existing:
                errors.append({"row": row_idx + 2, "error": f"Doublon: {student_data['full_name']} ({student_data.get('exam_number')})"})
                continue

            # Créer l'étudiant
            student = Student(
                id=str(uuid.uuid4()),
                full_name=student_data.get("full_name", ""),
                exam_number=student_data.get("exam_number", ""),
                birth_date=_parse_date(student_data.get("birth_date", "")),
                birth_place=student_data.get("birth_place"),
                academic_year=academic_year,
                study_year=study_year,
                branch=branch,
                session=session or summary_data.get("session"),
            )
            db.add(student)
            db.flush()

            # Créer les notes — subject_name stocké directement (plus de table subjects)
            for idx, (subject_name, note_str) in enumerate(grade_data.items()):
                try:
                    note = float(note_str)
                except ValueError:
                    continue

                db.add(Grade(
                    id=str(uuid.uuid4()),
                    student_id=student.id,
                    subject_name=subject_name,
                    subject_type="كتابي",  # Détermination manuelle ou via colonne Excel
                    order_index=idx,
                    note=note,
                ))

            # Récapitulatif directement sur l'étudiant (plus de TranscriptSummary séparé)
            student.total_written = _to_decimal(summary_data.get("total_written"))
            student.total_oral = _to_decimal(summary_data.get("total_oral"))
            student.total_general = _to_decimal(summary_data.get("total_general"))
            student.average = _to_decimal(summary_data.get("average"))
            student.general_result = summary_data.get("general_result") or summary_data.get("written_result")
            student.mention = summary_data.get("mention")
            student.copy_general = summary_data.get("copy_general")
            student.observations = summary_data.get("observations")

            db.commit()
            success += 1

        except Exception as e:
            db.rollback()
            errors.append({"row": row_idx + 2, "error": str(e)})

    return {"success": success, "errors": len(errors), "error_details": errors}

def _parse_date(s: str):
    from datetime import date
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            from datetime import datetime
            return datetime.strptime(s, fmt).date()
        except:
            pass
    return None

def _to_decimal(s):
    if not s:
        return None
    try:
        return float(s)
    except:
        return None
```

### `app/services/pdf_generator.py`
```python
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from datetime import datetime

template_dir = Path(__file__).parent.parent / "templates"
env = Environment(loader=FileSystemLoader(str(template_dir)))

def generate_releve_html(student, print_number=None, serial=None,
                          is_override=False, override_reason=None, is_preview=False) -> str:
    template = env.get_template("releve_fsjes.html")

    grades = []
    if student.grades:
        for g in sorted(student.grades, key=lambda x: x.order_index):
            grades.append({
                "name": g.subject_name,
                "type": g.subject_type,
                "note": g.note,
                "written_result": g.written_result,
            })

    stamp = None
    if not is_preview and print_number:
        stamp = "نسخة أصلية" if print_number == 1 else f"نسخة مكررة رقم {print_number}"
        if is_override and override_reason:
            stamp += f" — {override_reason}"

    return template.render(
        student=student,
        grades_written=[g for g in grades if g["type"] == "كتابي"],
        grades_oral=[g for g in grades if g["type"] == "شفوي"],
        stamp=stamp,
        serial=serial,
        print_date=datetime.now().strftime("%d/%m/%Y"),
        is_preview=is_preview,
    )
```

### `app/templates/releve_fsjes.html`
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Amiri', serif; direction: rtl; padding: 30px; font-size: 13px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .header .logo-text { font-size: 11px; color: #333; }
    .header .title { font-size: 16px; font-weight: bold; margin-top: 10px; text-decoration: underline; }
    .student-info { margin: 15px 0; }
    .student-info p { margin: 4px 0; }
    .student-info strong { display: inline-block; width: 140px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #333; padding: 5px 8px; text-align: center; }
    th { background: #e8e8e8; font-weight: bold; }
    td:first-child { text-align: right; }
    .section-title { background: #d0d0d0; font-weight: bold; text-align: center; padding: 4px; border: 1px solid #333; margin-top: 10px; }
    .summary-table { width: 40%; margin-right: auto; }
    .summary-table td { text-align: center; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .stamp { font-size: 14px; font-weight: bold; color: {% if stamp and 'مكررة' in stamp %}red{% else %}green{% endif %}; border: 2px solid currentColor; padding: 5px 10px; display: inline-block; transform: rotate(-10deg); }
    .serial { font-size: 10px; color: #666; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-text">
      FSJES Aïn Chock<br>
      FACULTÉ DES SCIENCES JURIDIQUES, ÉCONOMIQUES ET SOCIALES AÏN CHOCK<br>
      UNIVERSITÉ HASSAN II DE CASABLANCA
    </div>
    <div class="title">
      بيان النقط لمواد السنة {{ student.study_year }}
      {% if student.branch %}من {{ student.branch }}{% endif %}
    </div>
  </div>

  <div class="student-info">
    <p><strong>الاسم و النسب:</strong> {{ student.full_name }}</p>
    <p><strong>رقم الامتحان:</strong> {{ student.exam_number }}</p>
    {% if student.birth_date %}<p><strong>المزداد بتاريخ:</strong> {{ student.birth_date.strftime('%d/%m/%Y') }}</p>{% endif %}
    {% if student.birth_place %}<p><strong>مكان الميلاد:</strong> {{ student.birth_place }}</p>{% endif %}
    <p><strong>السنة الجامعية:</strong> {{ student.academic_year }}</p>
    {% if student.session %}<p><strong>الدورة:</strong> {{ student.session }}</p>{% endif %}
  </div>

  {% if grades_written %}
  <div class="section-title">المواد الكتابية</div>
  <table>
    <thead><tr><th>المواد الكتابية</th><th>النقطة</th><th>نتيجة الكتابي</th></tr></thead>
    <tbody>
      {% for g in grades_written %}
      <tr><td>{{ g.name }}</td><td>{{ g.note }}</td><td>{{ g.written_result or '' }}</td></tr>
      {% endfor %}
    </tbody>
  </table>
  {% endif %}

  {% if grades_oral %}
  <div class="section-title">المواد الشفهية</div>
  <table>
    <thead><tr><th>المواد الشفهية</th><th>النقطة النهائية</th></tr></thead>
    <tbody>
      {% for g in grades_oral %}
      <tr><td>{{ g.name }}</td><td>{{ g.note }}</td></tr>
      {% endfor %}
    </tbody>
  </table>
  {% endif %}

  {% if summary %}
  <br>
  <table class="summary-table">
    <tr><td>مجموع الكتابي</td><td>{{ summary.total_written or '' }}</td></tr>
    <tr><td>مجموع الشفوي</td><td>{{ summary.total_oral or '' }}</td></tr>
    <tr><td>المجموع العام</td><td>{{ summary.total_general or '' }}</td></tr>
    <tr><td>المعدل</td><td>{{ summary.average or '' }}</td></tr>
    <tr><td>النتيجة العامة</td><td>{{ summary.general_result or '' }}</td></tr>
    <tr><td>الميزة</td><td>{{ summary.mention or '' }}</td></tr>
  </table>
  {% endif %}

  <div class="footer">
    <div>الدارالبيضاء، في {{ print_date }}</div>
    <div>
      {% if stamp %}<div class="stamp">{{ stamp }}</div>{% endif %}
      {% if serial %}<div class="serial">{{ serial }}</div>{% endif %}
    </div>
  </div>

  {% if not is_preview %}
  <script>window.onload = function() { window.print(); }</script>
  {% endif %}
</body>
</html>
```

---

## 13. Migrations Alembic

### Initialiser Alembic
```powershell
cd "C:\Users\ENNAKI\Desktop\GestionDesRelevetsDeNote\backend"
.\venv\Scripts\Activate.ps1
alembic init alembic
```

### Modifier `alembic/env.py` — remplacer le début par :
```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.config import settings
from app.database import Base
from app.models import *  # Importer tous les modèles

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(config.get_section(config.config_ini_section),
                                     prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Créer et appliquer la migration initiale
```powershell
# Générer la migration
alembic revision --autogenerate -m "initial_schema"

# Appliquer la migration à la base
alembic upgrade head
```

### Commandes utiles
```powershell
alembic upgrade head          # Appliquer toutes les migrations
alembic downgrade -1          # Annuler la dernière migration
alembic history               # Voir l'historique
alembic revision --autogenerate -m "description"  # Nouvelle migration après modif des modèles
```

---

## 14. Lancer le Serveur

```powershell
cd "C:\Users\ENNAKI\Desktop\GestionDesRelevetsDeNote\backend"
.\venv\Scripts\Activate.ps1

# Lancer avec rechargement automatique (dev)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Le serveur écoute sur : **http://localhost:8000**  
Ton collègue accède à l'API via : **http://[TON_IP_LOCAL]:8000**

### Trouver ton IP locale (pour que ton collègue puisse se connecter)
```powershell
ipconfig
# Chercher "Adresse IPv4" sous ta carte réseau Wi-Fi ou Ethernet
# Exemple : 192.168.1.42
```

---

## 15. API — Documentation & Endpoints

FastAPI génère automatiquement la documentation interactive :

- **Swagger UI** : http://localhost:8000/docs  
- **ReDoc** : http://localhost:8000/redoc

### Tableau des Endpoints

| Méthode | URL | Rôle requis | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Connexion, retourne token JWT |
| GET | `/api/auth/me` | Tous | Profil utilisateur connecté |
| POST | `/api/auth/users` | Admin | Créer un compte utilisateur |
| GET | `/api/auth/users` | Admin | Lister tous les utilisateurs |
| PATCH | `/api/auth/users/{id}/toggle` | Admin | Activer/désactiver un compte |
| GET | `/api/students/` | Tous | Recherche (full_name, birth_date, exam_number, academic_year, branch) |
| GET | `/api/students/{id}` | Tous | Fiche étudiant + notes incluses |
| POST | `/api/students/` | Admin | Créer étudiant manuellement (avec récapitulatif) |
| PUT | `/api/students/{id}` | Admin | Modifier étudiant + récapitulatif |
| DELETE | `/api/students/{id}` | Admin | Supprimer étudiant |
| GET | `/api/grades/{student_id}` | Tous | Notes d'un étudiant |
| POST | `/api/grades/{student_id}` | Admin | Ajouter/modifier des notes |
| POST | `/api/import/excel` | Tous | Importer un fichier Excel |
| GET | `/api/transcripts/{id}/preview` | Tous | Prévisualiser le relevé (HTML) |
| POST | `/api/transcripts/{id}/print` | Tous | Imprimer le relevé (HTML+tampon) |
| GET | `/api/transcripts/{id}/print-status` | Tous | Statut d'impression |
| GET | `/api/audit/` | Admin | Historique des actions |
| GET | `/api/health` | — | Santé de l'API |

---

## 16. Collaboration avec le Frontend

### Ce que tu fournis à ton collègue

1. **L'URL de base de l'API** : `http://[TON_IP]:8000`  
2. **Le fichier `.env.example`** (template sans données sensibles)  
3. **La documentation Swagger** : `http://[TON_IP]:8000/docs`  
4. **Les headers requis** pour toutes les requêtes authentifiées :
   ```
   Authorization: Bearer <token>
   Content-Type: application/json
   ```

### Exemple de flux Login (pour que ton collègue comprenne)
```
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{ "email": "admin@fsjes.ma", "password": "Admin@2026" }

→ Réponse :
{ "access_token": "eyJ...", "token_type": "bearer", "role": "admin", "full_name": "Administrateur FSJES" }
```

### Exemple de Recherche Étudiant
```
GET http://localhost:8000/api/students/?full_name=بنعلي&birth_date=1995-07-22
Authorization: Bearer eyJ...
```

### CORS — Adresse frontend
Le backend accepte les requêtes de `http://localhost:5173` (Vite par défaut).  
Si ton collègue utilise un autre port, **modifier `FRONTEND_URL` dans `.env`** puis redémarrer le serveur.

### Si votre réseau le permet — Accès distant
Ton collègue peut accéder à l'API via ton IP locale :
```
http://192.168.1.42:8000
```
Lui dire de mettre cette URL comme `VITE_API_URL` dans son `.env` frontend.

---

## 17. Git — Workflow d'équipe

### Initialiser le dépôt
```powershell
cd "C:\Users\ENNAKI\Desktop\GestionDesRelevetsDeNote"
git init
git add .gitignore PRD.md instructions.md
git add backend/.env.example backend/requirements.txt backend/alembic.ini
git add backend/app/
git commit -m "Initial commit — backend structure"
```

### Branches recommandées
```
main          ← code stable uniquement
dev           ← intégration (merge depuis feature branches)
feature/...   ← tes branches de développement
```

```powershell
git checkout -b dev
git checkout -b feature/auth-login
# ... travailler ...
git add .
git commit -m "feat: implement JWT authentication"
git checkout dev
git merge feature/auth-login
```

### Partager avec ton collègue
1. Créer un dépôt sur **GitHub** (privé)
2. ```powershell
   git remote add origin https://github.com/TON_COMPTE/gestion-releves.git
   git push -u origin main
   git push -u origin dev
   ```
3. Inviter ton collègue en collaborateur
4. Il clone le repo et travaille sur son dossier `frontend/`
5. Chacun push sur sa branche, merge sur `dev` ensemble

### Ne jamais committer
- `.env` (contient les mots de passe et secrets)
- `venv/` (l'environnement Python local)
- `__pycache__/`

---

## Résumé — Commandes quotidiennes

```powershell
# Chaque matin — activer l'env et lancer le serveur
cd "C:\Users\ENNAKI\Desktop\GestionDesRelevetsDeNote\backend"
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

# Après modification des modèles — créer et appliquer migration
alembic revision --autogenerate -m "description_du_changement"
alembic upgrade head

# Vérifier l'API
# → Ouvrir http://localhost:8000/docs dans le navigateur
```
