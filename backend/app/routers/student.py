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