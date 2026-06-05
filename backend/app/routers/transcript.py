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
