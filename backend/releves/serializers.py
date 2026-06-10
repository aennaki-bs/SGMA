from rest_framework import serializers
from .models import User, Student, ExamSession, Grade, PrintLog, AuditLog


# ── Users ─────────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'role', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ── Sessions ──────────────────────────────────────────────────────────────────

class ExamSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamSession
        fields = '__all__'
        read_only_fields = ['id']


# ── Grades ────────────────────────────────────────────────────────────────────

class GradeSerializer(serializers.ModelSerializer):
    session_detail = ExamSessionSerializer(source='session', read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'session', 'session_detail',
            'ecrit_score_1', 'ecrit_score_2', 'ecrit_score_3', 'ecrit_score_4',
            'written_total', 'written_result',
            'oral_score_1', 'oral_score_2', 'oral_score_3', 'oral_score_4',
            'oral_total', 'general_total', 'average',
            'general_result', 'mention', 'observations',
        ]
        read_only_fields = ['id', 'session_detail']


# ── Students ──────────────────────────────────────────────────────────────────

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'print_count']


class StudentDetailSerializer(serializers.ModelSerializer):
    grades = GradeSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'print_count']


# ── Print logs ────────────────────────────────────────────────────────────────

class PrintLogSerializer(serializers.ModelSerializer):
    printed_by_name = serializers.CharField(source='printed_by.full_name', read_only=True)
    printed_by_email = serializers.CharField(source='printed_by.email', read_only=True)

    class Meta:
        model = PrintLog
        fields = '__all__'
        read_only_fields = ['id', 'printed_at', 'serial_number', 'print_number',
                            'printed_by_name', 'printed_by_email']


# ── Audit logs ────────────────────────────────────────────────────────────────

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True, default='')
    user_email = serializers.CharField(source='user.email', read_only=True, default='')

    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


# ── Import ────────────────────────────────────────────────────────────────────

class ImportRowSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    exam_number = serializers.CharField(max_length=50)
    birth_date = serializers.DateField(required=False, allow_null=True)
    birth_place = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    ecrit_score_1 = serializers.FloatField(required=False, allow_null=True)
    ecrit_score_2 = serializers.FloatField(required=False, allow_null=True)
    ecrit_score_3 = serializers.FloatField(required=False, allow_null=True)
    ecrit_score_4 = serializers.FloatField(required=False, allow_null=True)
    written_total = serializers.FloatField(required=False, allow_null=True)
    written_result = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    oral_score_1 = serializers.FloatField(required=False, allow_null=True)
    oral_score_2 = serializers.FloatField(required=False, allow_null=True)
    oral_score_3 = serializers.FloatField(required=False, allow_null=True)
    oral_score_4 = serializers.FloatField(required=False, allow_null=True)
    oral_total = serializers.FloatField(required=False, allow_null=True)
    general_total = serializers.FloatField(required=False, allow_null=True)
    average = serializers.FloatField(required=False, allow_null=True)
    general_result = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    mention = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    observations = serializers.CharField(required=False, allow_blank=True, default='')


class ImportPayloadSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    rows = ImportRowSerializer(many=True, min_length=1)
