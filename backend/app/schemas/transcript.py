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