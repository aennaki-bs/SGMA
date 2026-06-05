from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from datetime import datetime

template_dir = Path(__file__).parent.parent / "templates"
env = Environment(loader=FileSystemLoader(str(template_dir)))

def generate_releve_html(student, print_number=None, serial=None,
                          is_override=False, override_reason=None, is_preview=False) -> str:
    template = env.get_template("releve_fsjes.html")

    grades = []
    if student.grades:
        for g in sorted(student.grades, key=lambda x: x.order_index):
            grades.append({
                "name": g.subject_name,
                "type": g.subject_type,
                "note": g.note,
                "written_result": g.written_result,
            })

    stamp = None
    if not is_preview and print_number:
        stamp = "نسخة أصلية" if print_number == 1 else f"نسخة مكررة رقم {print_number}"
        if is_override and override_reason:
            stamp += f" — {override_reason}"

    return template.render(
        student=student,
        grades_written=[g for g in grades if g["type"] == "كتابي"],
        grades_oral=[g for g in grades if g["type"] == "شفوي"],
        stamp=stamp,
        serial=serial,
        print_date=datetime.now().strftime("%d/%m/%Y"),
        is_preview=is_preview,
    )