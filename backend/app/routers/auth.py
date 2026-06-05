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