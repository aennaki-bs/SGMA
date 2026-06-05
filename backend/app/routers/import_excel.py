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