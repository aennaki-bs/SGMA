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