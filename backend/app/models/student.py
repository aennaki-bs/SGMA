import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Integer, Date, DateTime, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # Infos personnelles
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    exam_number: Mapped[str] = mapped_column(String(50), index=True)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    birth_place: Mapped[Optional[str]] = mapped_column(String(150))
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)
    study_year: Mapped[int] = mapped_column(Integer, nullable=False)
    branch: Mapped[str] = mapped_column(String(150), nullable=False)
    session: Mapped[Optional[str]] = mapped_column(String(50))
    # Récapitulatif (fusionné — plus de table transcript_summaries séparée)
    total_written: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    total_oral: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    total_general: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    average: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 2))
    general_result: Mapped[Optional[str]] = mapped_column(String(20))  # ناجح / راسب
    mention: Mapped[Optional[str]] = mapped_column(String(50))         # مقبول / جيد / ...
    copy_general: Mapped[Optional[str]] = mapped_column(String(50))
    observations: Mapped[Optional[str]] = mapped_column(Text)
    # Contrôle impression
    print_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    grades: Mapped[list["Grade"]] = relationship("Grade", back_populates="student", cascade="all, delete-orphan")
    print_logs: Mapped[list["PrintLog"]] = relationship("PrintLog", back_populates="student")
