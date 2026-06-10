import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings


class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email requis')
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('role', User.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ADMIN = 'admin'
    PROFESSOR = 'professor'
    ROLE_CHOICES = [
        (ADMIN, 'Administrateur'),
        (PROFESSOR, 'Professeur'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=PROFESSOR)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.full_name} ({self.email})"


class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    exam_number = models.CharField(max_length=50)
    birth_date = models.DateField(null=True, blank=True)
    birth_place = models.CharField(max_length=150, blank=True)
    academic_year = models.CharField(max_length=20)
    study_year = models.IntegerField()
    branch = models.CharField(max_length=150)
    print_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'students'

    def __str__(self):
        return f"{self.full_name} ({self.exam_number})"


class ExamSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_name = models.CharField(max_length=100)
    session_date = models.DateField()
    academic_year = models.CharField(max_length=20)
    study_year = models.IntegerField()
    branch = models.CharField(max_length=150)
    # Subject names — NULL means the slot is unused for this session
    ecrit_subject_1 = models.CharField(max_length=200, null=True, blank=True)
    ecrit_subject_2 = models.CharField(max_length=200, null=True, blank=True)
    ecrit_subject_3 = models.CharField(max_length=200, null=True, blank=True)
    ecrit_subject_4 = models.CharField(max_length=200, null=True, blank=True)
    oral_subject_1 = models.CharField(max_length=200, null=True, blank=True)
    oral_subject_2 = models.CharField(max_length=200, null=True, blank=True)
    oral_subject_3 = models.CharField(max_length=200, null=True, blank=True)
    oral_subject_4 = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        db_table = 'sessions'

    def __str__(self):
        return f"{self.session_name} — {self.branch} — {self.academic_year}"


class Grade(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    session = models.ForeignKey(ExamSession, on_delete=models.PROTECT, related_name='grades')
    # Written scores — ecrit_score_N corresponds to session.ecrit_subject_N
    ecrit_score_1 = models.FloatField(null=True, blank=True)
    ecrit_score_2 = models.FloatField(null=True, blank=True)
    ecrit_score_3 = models.FloatField(null=True, blank=True)
    ecrit_score_4 = models.FloatField(null=True, blank=True)
    written_total = models.FloatField(null=True, blank=True)
    written_result = models.CharField(max_length=20, blank=True)
    # Oral scores — oral_score_N corresponds to session.oral_subject_N
    oral_score_1 = models.FloatField(null=True, blank=True)
    oral_score_2 = models.FloatField(null=True, blank=True)
    oral_score_3 = models.FloatField(null=True, blank=True)
    oral_score_4 = models.FloatField(null=True, blank=True)
    oral_total = models.FloatField(null=True, blank=True)
    # Summary
    general_total = models.FloatField(null=True, blank=True)
    average = models.FloatField(null=True, blank=True)
    general_result = models.CharField(max_length=20, blank=True)
    mention = models.CharField(max_length=50, blank=True)
    observations = models.TextField(blank=True)

    class Meta:
        db_table = 'grades'
        unique_together = ('student', 'session')

    def __str__(self):
        return f"Notes — {self.student} — {self.session}"


class PrintLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='print_logs')
    printed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='print_logs'
    )
    printed_at = models.DateTimeField(auto_now_add=True)
    print_number = models.IntegerField()
    is_admin_override = models.BooleanField(default=False)
    override_reason = models.TextField(blank=True)
    serial_number = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'print_logs'
        ordering = ['-printed_at']


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=50)
    entity = models.CharField(max_length=50, blank=True)
    entity_id = models.CharField(max_length=50, blank=True)
    detail = models.TextField(blank=True)
    ip_address = models.CharField(max_length=45, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
