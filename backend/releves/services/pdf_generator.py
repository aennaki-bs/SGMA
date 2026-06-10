from datetime import date
from jinja2 import Environment, BaseLoader
from weasyprint import HTML

# Inline HTML/CSS template — Arabic RTL transcript (FSJES Ain Chock format)
_TEMPLATE = """
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 1.8cm 1.5cm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', 'Arial', serif;
    font-size: 12pt;
    direction: rtl;
    color: #111;
  }
  .header { text-align: center; margin-bottom: 18px; line-height: 1.6; }
  .header p { margin: 2px 0; }
  .header .title {
    font-size: 14pt;
    font-weight: bold;
    margin-top: 10px;
    border-bottom: 2px solid #333;
    padding-bottom: 6px;
  }
  .student-info { margin-bottom: 18px; }
  .student-info table { width: 100%; border-collapse: collapse; }
  .student-info td { padding: 5px 8px; font-size: 11pt; }
  .student-info .label { font-weight: bold; width: 130px; }
  table.grades {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
    font-size: 11pt;
  }
  table.grades th {
    background: #e8e8e8;
    border: 1px solid #555;
    padding: 6px 10px;
    text-align: center;
  }
  table.grades td {
    border: 1px solid #888;
    padding: 5px 10px;
    text-align: center;
  }
  .subject-cell { text-align: right; }
  .section-title {
    font-size: 12pt;
    font-weight: bold;
    margin: 10px 0 4px;
    color: #333;
  }
  table.summary {
    width: 55%;
    margin: 14px auto 0;
    border-collapse: collapse;
    font-size: 11pt;
  }
  table.summary td {
    border: 1px solid #888;
    padding: 5px 12px;
  }
  table.summary .label { font-weight: bold; background: #f5f5f5; }
  .footer { margin-top: 30px; }
  .footer .city { font-size: 11pt; }
  .stamp {
    display: inline-block;
    border: 2px solid #333;
    padding: 6px 20px;
    font-size: 11pt;
    font-weight: bold;
    margin-top: 8px;
  }
  .serial { font-size: 9pt; color: #666; margin-top: 6px; }
</style>
</head>
<body>

<div class="header">
  <p>المملكة المغربية</p>
  <p>وزارة التعليم العالي والبحث العلمي</p>
  <p><strong>جامعة الحسن الثاني — الدار البيضاء</strong></p>
  <p>كلية العلوم القانونية والاقتصادية والاجتماعية — عين الشق</p>
  <p class="title">
    بيان النقط لمواد السنة {{ student.study_year }} من {{ student.branch }}
  </p>
</div>

<div class="student-info">
  <table>
    <tr>
      <td class="label">الاسم و النسب:</td>
      <td>{{ student.full_name }}</td>
      <td class="label">السنة الجامعية:</td>
      <td>{{ student.academic_year }}</td>
    </tr>
    <tr>
      <td class="label">رقم الامتحان:</td>
      <td>{{ student.exam_number }}</td>
      <td class="label">الدورة:</td>
      <td>{{ session.session_name }}</td>
    </tr>
    <tr>
      <td class="label">المزداد بتاريخ:</td>
      <td>{{ student.birth_date.strftime('%d/%m/%Y') if student.birth_date else '—' }}</td>
      <td class="label">مكان الميلاد:</td>
      <td>{{ student.birth_place or '—' }}</td>
    </tr>
  </table>
</div>

{% if ecrit_rows %}
<p class="section-title">المواد الكتابية</p>
<table class="grades">
  <thead>
    <tr>
      <th style="width:60%">المادة</th>
      <th>النقطة / 20</th>
      <th>نتيجة الكتابي</th>
    </tr>
  </thead>
  <tbody>
    {% for subject, score in ecrit_rows %}
    <tr>
      <td class="subject-cell">{{ subject }}</td>
      <td>{{ "%.2f"|format(score) if score is not none else '—' }}</td>
      <td>{{ 'ناجح' if score is not none and score >= 5 else 'راسب' }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>
{% endif %}

{% if oral_rows %}
<p class="section-title">المواد الشفهية</p>
<table class="grades">
  <thead>
    <tr>
      <th style="width:70%">المادة</th>
      <th>النقطة النهائية / 20</th>
    </tr>
  </thead>
  <tbody>
    {% for subject, score in oral_rows %}
    <tr>
      <td class="subject-cell">{{ subject }}</td>
      <td>{{ "%.2f"|format(score) if score is not none else '—' }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>
{% endif %}

<table class="summary">
  {% if grade.written_total is not none %}
  <tr><td class="label">مجموع الكتابي</td><td>{{ "%.2f"|format(grade.written_total) }}</td></tr>
  {% endif %}
  {% if grade.written_result %}
  <tr><td class="label">نتيجة الكتابي</td><td>{{ grade.written_result }}</td></tr>
  {% endif %}
  {% if grade.oral_total is not none %}
  <tr><td class="label">مجموع الشفوي</td><td>{{ "%.2f"|format(grade.oral_total) }}</td></tr>
  {% endif %}
  {% if grade.general_total is not none %}
  <tr><td class="label">المجموع العام</td><td>{{ "%.2f"|format(grade.general_total) }}</td></tr>
  {% endif %}
  {% if grade.average is not none %}
  <tr><td class="label">المعدل</td><td>{{ "%.2f"|format(grade.average) }}</td></tr>
  {% endif %}
  {% if grade.general_result %}
  <tr><td class="label">النتيجة العامة</td><td>{{ grade.general_result }}</td></tr>
  {% endif %}
  {% if grade.mention %}
  <tr><td class="label">الميزة</td><td>{{ grade.mention }}</td></tr>
  {% endif %}
</table>

<div class="footer">
  <p class="city">الدار البيضاء، في {{ today }}</p>
  <div class="stamp">{{ stamp }}</div>
  <p class="serial">المرجع: {{ serial }}</p>
</div>

</body>
</html>
"""


def generate_transcript_pdf(student, grade, session, serial_number='', print_number=1):
    """Render the FSJES transcript as PDF bytes."""
    ecrit_rows = [
        (s, sc) for s, sc in [
            (session.ecrit_subject_1, grade.ecrit_score_1),
            (session.ecrit_subject_2, grade.ecrit_score_2),
            (session.ecrit_subject_3, grade.ecrit_score_3),
            (session.ecrit_subject_4, grade.ecrit_score_4),
        ] if s  # skip unused slots
    ]

    oral_rows = [
        (s, sc) for s, sc in [
            (session.oral_subject_1, grade.oral_score_1),
            (session.oral_subject_2, grade.oral_score_2),
            (session.oral_subject_3, grade.oral_score_3),
            (session.oral_subject_4, grade.oral_score_4),
        ] if s
    ]

    stamp = 'نسخة أصلية' if print_number == 1 else f'نسخة مكررة رقم {print_number}'

    env = Environment(loader=BaseLoader())
    html_str = env.from_string(_TEMPLATE).render(
        student=student,
        grade=grade,
        session=session,
        ecrit_rows=ecrit_rows,
        oral_rows=oral_rows,
        stamp=stamp,
        serial=serial_number or '—',
        today=date.today().strftime('%d/%m/%Y'),
    )

    return HTML(string=html_str).write_pdf()
