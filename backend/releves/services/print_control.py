from releves.models import PrintLog


def can_print(user, student):
    """
    Returns (True, '') if the user may print this student's transcript.
    Returns (False, reason_ar) otherwise.
    """
    if user.role == 'admin':
        return True, ''

    # Professors may only print once per student
    if student.print_count > 0:
        last = PrintLog.objects.filter(student=student).order_by('-printed_at').first()
        date_str = last.printed_at.strftime('%d/%m/%Y') if last else ''
        return False, f'تمت الطباعة بتاريخ {date_str}'

    return True, ''


def next_print_number(student):
    return student.print_count + 1
