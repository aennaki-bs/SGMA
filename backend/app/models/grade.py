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
