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

