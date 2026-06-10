from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Student, ExamSession, Grade, PrintLog, AuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['email', 'full_name']
    ordering = ['email']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations', {'fields': ('full_name', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'exam_number', 'branch', 'academic_year', 'study_year', 'print_count']
    search_fields = ['full_name', 'exam_number']
    list_filter = ['branch', 'academic_year', 'study_year']
    readonly_fields = ['id', 'created_at', 'print_count']


@admin.register(ExamSession)
class ExamSessionAdmin(admin.ModelAdmin):
    list_display = ['session_name', 'branch', 'study_year', 'academic_year', 'session_date']
    list_filter = ['branch', 'academic_year', 'study_year']
    search_fields = ['session_name', 'branch']


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['student', 'session', 'average', 'mention', 'general_result']
    list_filter = ['general_result', 'mention']
    raw_id_fields = ['student', 'session']
    readonly_fields = ['id']


@admin.register(PrintLog)
class PrintLogAdmin(admin.ModelAdmin):
    list_display = ['student', 'printed_by', 'printed_at', 'print_number', 'is_admin_override']
    list_filter = ['is_admin_override']
    readonly_fields = ['id', 'printed_at', 'serial_number']
    raw_id_fields = ['student', 'printed_by']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'entity', 'created_at', 'ip_address']
    list_filter = ['action', 'entity']
    search_fields = ['detail', 'entity_id']
    readonly_fields = ['id', 'created_at']
