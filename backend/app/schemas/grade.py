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