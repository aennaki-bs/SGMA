import pandas as pd
import uuid
from io import BytesIO
from sqlalchemy.orm import Session
from app.models.student import Student
from app.models.grade import Grade

# Colonnes fixes reconnues (en arabe)
FIXED_COLUMNS = {
    "اسم المرشح": "full_name",
    "الاسم و النسب": "full_name",
    "تاريخ الميلاد": "birth_date",
    "مكان الميلاد": "birth_place",
    "رقم الامتحان": "exam_number",
    "رقم التسجيل": "exam_number",
    "نتيجة الكتابي": "_written_result",
    "مجموع الكتابي": "_total_written",
    "مجموع الشفاهي": "_total_oral",
    "مجموع الشفوي": "_total_oral",
    "المجموع العام": "_total_general",
    "المعدل": "_average",
    "النسخة العامة": "_copy_general",
    "الميزة او الملاحظات": "_mention",
    "الميزة": "_mention",
    "الملاحظات": "_observations",
    "الدورة": "_session",
}

def parse_excel_file(content: bytes, db: Session, academic_year: str,
                     study_year: int, branch: str, session: str = None) -> dict:
    df = pd.read_excel(BytesIO(content), dtype=str)
    df = df.fillna("")

    success, errors = 0, []

    for row_idx, row in df.iterrows():
        try:
            student_data = {}
            grade_data = {}
            summary_data = {}

            for col in df.columns:
                col_stripped = col.strip()
                value = str(row[col]).strip()

                if col_stripped in FIXED_COLUMNS:
                    mapped = FIXED_COLUMNS[col_stripped]
                    if mapped.startswith("_"):
                        summary_data[mapped[1:]] = value
                    else:
                        student_data[mapped] = value
                elif value:
                    # Colonne de matière dynamique
                    grade_data[col_stripped] = value

            if not student_data.get("full_name"):
                errors.append({"row": row_idx + 2, "error": "Nom manquant"})
                continue

            # Vérifier doublon
            existing = db.query(Student).filter(
                Student.exam_number == student_data.get("exam_number"),
                Student.academic_year == academic_year,
            ).first()
            if existing:
                errors.append({"row": row_idx + 2, "error": f"Doublon: {student_data['full_name']} ({student_data.get('exam_number')})"})
                continue

            # Créer l'étudiant
            student = Student(
                id=str(uuid.uuid4()),
                full_name=student_data.get("full_name", ""),
                exam_number=student_data.get("exam_number", ""),
                birth_date=_parse_date(student_data.get("birth_date", "")),
                birth_place=student_data.get("birth_place"),
                academic_year=academic_year,
                study_year=study_year,
                branch=branch,
                session=session or summary_data.get("session"),
            )
            db.add(student)
            db.flush()

            # Créer les notes — subject_name stocké directement (plus de table subjects)
            for idx, (subject_name, note_str) in enumerate(grade_data.items()):
                try:
                    note = float(note_str)
                except ValueError:
                    continue

                db.add(Grade(
                    id=str(uuid.uuid4()),
                    student_id=student.id,
                    subject_name=subject_name,
                    subject_type="كتابي",  # Détermination manuelle ou via colonne Excel
                    order_index=idx,
                    note=note,
                ))

            # Récapitulatif directement sur l'étudiant (plus de TranscriptSummary séparé)
            student.total_written = _to_decimal(summary_data.get("total_written"))
            student.total_oral = _to_decimal(summary_data.get("total_oral"))
            student.total_general = _to_decimal(summary_data.get("total_general"))
            student.average = _to_decimal(summary_data.get("average"))
            student.general_result = summary_data.get("general_result") or summary_data.get("written_result")
            student.mention = summary_data.get("mention")
            student.copy_general = summary_data.get("copy_general")
            student.observations = summary_data.get("observations")

            db.commit()
            success += 1

        except Exception as e:
            db.rollback()
            errors.append({"row": row_idx + 2, "error": str(e)})

    return {"success": success, "errors": len(errors), "error_details": errors}

def _parse_date(s: str):
    from datetime import date
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            from datetime import datetime
            return datetime.strptime(s, fmt).date()
        except:
            pass
    return None

def _to_decimal(s):
    if not s:
        return None
    try:
        return float(s)
    except:
        return None