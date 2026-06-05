from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.student import Student
from app.models.grade import Grade
from app.models.audit_log import AuditLog
from app.schemas.grade import GradeCreate, GradeOut
from app.dependencies import get_current_user, require_admin
from app.models.user import User
import uuid

router = APIRouter()

def log(db, user_id, action, entity_id=None, detail=None, ip=None):
    db.add(AuditLog(id=str(uuid.uuid4()), user_id=user_id, action=action,
                    entity="grade", entity_id=entity_id, detail=detail, ip_address=ip))
    db.commit()

@router.get("/{student_id}", response_model=List[GradeOut])
def get_grades(student_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    return sorted(student.grades, key=lambda g: g.order_index)

@router.post("/{student_id}", response_model=List[GradeOut])
def set_grades(student_id: str, body: List[GradeCreate], request: Request,
               db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")

    # Supprimer les anciennes notes et remplacer
    db.query(Grade).filter(Grade.student_id == student_id).delete()
    for idx, g in enumerate(body):
        db.add(Grade(
            id=str(uuid.uuid4()),
            student_id=student_id,
            subject_name=g.subject_name,
            subject_type=g.subject_type,
            order_index=g.order_index if g.order_index else idx,
            note=g.note,
            written_result=g.written_result,
        ))
    db.commit()
    log(db, current_user.id, "UPDATE", entity_id=student_id,
        detail=f"Notes mises à jour: {len(body)} matières", ip=request.client.host)
    return db.query(Grade).filter(Grade.student_id == student_id).order_by(Grade.order_index).all()
