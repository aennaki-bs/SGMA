import uuid
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

from .models import User, Student, ExamSession, Grade, PrintLog, AuditLog
from .permissions import IsAdmin
from .serializers import (
    UserSerializer, UserCreateSerializer,
    StudentSerializer, StudentDetailSerializer,
    ExamSessionSerializer,
    GradeSerializer,
    PrintLogSerializer,
    AuditLogSerializer,
    ImportPayloadSerializer,
)
from .services.pdf_generator import generate_transcript_pdf
from .services.print_control import can_print, next_print_number


def _ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', '')


def _audit(user, action, entity='', entity_id='', detail='', ip=''):
    AuditLog.objects.create(
        user=user, action=action, entity=entity,
        entity_id=str(entity_id), detail=detail, ip_address=ip,
    )


# ── Auth ──────────────────────────────────────────────────────────────────────

@extend_schema(tags=['auth'])
class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Connexion',
        description='Authentifie un utilisateur et retourne une paire de tokens JWT (access + refresh).',
        request={'application/json': {'type': 'object', 'properties': {
            'email': {'type': 'string', 'format': 'email'},
            'password': {'type': 'string'},
        }, 'required': ['email', 'password']}},
        responses={200: UserSerializer, 401: OpenApiTypes.OBJECT},
        auth=[],
    )
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        ip = _ip(request)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            _audit(None, 'LOGIN', detail=f'Échec login: {email}', ip=ip)
            return Response({'detail': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'detail': 'Compte désactivé'}, status=status.HTTP_403_FORBIDDEN)

        if not user.check_password(password):
            _audit(user, 'LOGIN', detail='Mot de passe incorrect', ip=ip)
            return Response({'detail': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        _audit(user, 'LOGIN', detail='Connexion réussie', ip=ip)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


@extend_schema(tags=['auth'])
class LogoutView(APIView):
    @extend_schema(
        summary='Déconnexion',
        description='Invalide le refresh token (blacklist). Supprimer le access token côté client.',
        request={'application/json': {'type': 'object', 'properties': {
            'refresh': {'type': 'string'},
        }}},
        responses={200: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh', ''))
            token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Déconnecté'})


# ── Students ──────────────────────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=['students'],
        summary='Rechercher des étudiants',
        parameters=[
            OpenApiParameter('full_name', OpenApiTypes.STR, description='Filtre partiel sur le nom'),
            OpenApiParameter('exam_number', OpenApiTypes.STR, description="Filtre partiel sur le N° d'examen"),
            OpenApiParameter('birth_date', OpenApiTypes.DATE, description='Date de naissance (YYYY-MM-DD)'),
            OpenApiParameter('academic_year', OpenApiTypes.STR, description='Année universitaire (ex: 2024-2025)'),
            OpenApiParameter('branch', OpenApiTypes.STR, description='Filière (partiel)'),
            OpenApiParameter('study_year', OpenApiTypes.STR, description='Niveau (ex: 1ère année)'),
        ],
    ),
    retrieve=extend_schema(tags=['students'], summary='Détail étudiant avec toutes ses notes'),
    create=extend_schema(tags=['students'], summary='Créer un étudiant (admin)'),
    update=extend_schema(tags=['students'], summary='Modifier un étudiant (admin)'),
    partial_update=extend_schema(tags=['students'], summary='Modifier partiellement (admin)'),
    destroy=extend_schema(tags=['students'], summary='Supprimer un étudiant (admin)'),
)
class StudentViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentSerializer

    def get_queryset(self):
        qs = Student.objects.all()
        p = self.request.query_params
        if v := p.get('full_name'):
            qs = qs.filter(full_name__icontains=v)
        if v := p.get('birth_date'):
            qs = qs.filter(birth_date=v)
        if v := p.get('exam_number'):
            qs = qs.filter(exam_number__icontains=v)
        if v := p.get('academic_year'):
            qs = qs.filter(academic_year=v)
        if v := p.get('branch'):
            qs = qs.filter(branch__icontains=v)
        if v := p.get('study_year'):
            qs = qs.filter(study_year=v)
        return qs.order_by('full_name')

    def list(self, request, *args, **kwargs):
        _audit(request.user, 'SEARCH', entity='student',
               detail=f"Recherche: {dict(request.query_params)}", ip=_ip(request))
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        _audit(request.user, 'VIEW', entity='student', entity_id=kwargs.get('pk'),
               detail=f"Consultation: {response.data.get('full_name', '')}", ip=_ip(request))
        return response

    def perform_create(self, serializer):
        student = serializer.save()
        _audit(self.request.user, 'CREATE', entity='student', entity_id=student.id,
               detail=f"Création: {student.full_name}", ip=_ip(self.request))

    def perform_update(self, serializer):
        student = serializer.save()
        _audit(self.request.user, 'UPDATE', entity='student', entity_id=student.id,
               detail=f"Modification: {student.full_name}", ip=_ip(self.request))

    def perform_destroy(self, instance):
        name = instance.full_name
        instance.delete()
        _audit(self.request.user, 'DELETE', entity='student',
               detail=f"Suppression: {name}", ip=_ip(self.request))

    @extend_schema(tags=['students'], summary='Historique des impressions d\'un étudiant')
    @action(detail=True, methods=['get'])
    def print_logs(self, request, pk=None):
        student = self.get_object()
        logs = PrintLog.objects.filter(student=student).select_related('printed_by')
        return Response(PrintLogSerializer(logs, many=True).data)


# ── Sessions ──────────────────────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(tags=['sessions'], summary='Lister les sessions d\'examen'),
    retrieve=extend_schema(tags=['sessions'], summary='Détail d\'une session'),
    create=extend_schema(tags=['sessions'], summary='Créer une session (admin)'),
    update=extend_schema(tags=['sessions'], summary='Modifier une session (admin)'),
    partial_update=extend_schema(tags=['sessions'], summary='Modifier partiellement (admin)'),
    destroy=extend_schema(tags=['sessions'], summary='Supprimer une session (admin)'),
)
class ExamSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSessionSerializer
    queryset = ExamSession.objects.all().order_by('-session_date')

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]


# ── Grades ────────────────────────────────────────────────────────────────────

@extend_schema(tags=['grades'])
class GradeView(APIView):
    @extend_schema(summary='Notes d\'un étudiant', responses={200: GradeSerializer(many=True)})
    def get(self, request, student_id):
        student = get_object_or_404(Student, pk=student_id)
        grades = Grade.objects.filter(student=student).select_related('session')
        return Response(GradeSerializer(grades, many=True).data)

    @extend_schema(
        summary='Créer ou mettre à jour des notes (admin)',
        description='Si une entrée existe déjà pour ce couple (étudiant, session), elle est mise à jour.',
        responses={200: GradeSerializer, 201: GradeSerializer},
    )
    def post(self, request, student_id):
        if request.user.role != User.ADMIN:
            return Response({'detail': 'Réservé aux administrateurs'},
                            status=status.HTTP_403_FORBIDDEN)

        student = get_object_or_404(Student, pk=student_id)
        data = request.data.copy()
        data['student'] = str(student.id)

        session_id = data.get('session')
        existing = Grade.objects.filter(student=student, session_id=session_id).first()

        serializer = GradeSerializer(existing, data=data) if existing else GradeSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        grade = serializer.save()

        action_label = 'UPDATE' if existing else 'CREATE'
        _audit(request.user, action_label, entity='grade', entity_id=grade.id,
               detail=f"Notes {action_label.lower()} pour {student.full_name}", ip=_ip(request))

        return Response(GradeSerializer(grade).data,
                        status=status.HTTP_200_OK if existing else status.HTTP_201_CREATED)


# ── Import ────────────────────────────────────────────────────────────────────

@extend_schema(tags=['import'])
class ImportView(APIView):
    permission_classes = [IsAdmin]

    @extend_schema(
        summary='Import en masse depuis Excel (admin)',
        description=(
            'Reçoit un payload JSON produit par le parser Excel côté client (SheetJS). '
            'Crée les étudiants et leurs notes en une seule requête. '
            'Retourne le nombre de succès, d\'erreurs et le détail des erreurs.'
        ),
        request=ImportPayloadSerializer,
        responses={200: {'type': 'object', 'properties': {
            'success': {'type': 'integer'},
            'errors': {'type': 'integer'},
            'error_details': {'type': 'array', 'items': {'type': 'object'}},
        }}},
    )
    def post(self, request):
        serializer = ImportPayloadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data['session_id']
        rows = serializer.validated_data['rows']

        try:
            session = ExamSession.objects.get(pk=session_id)
        except ExamSession.DoesNotExist:
            return Response({'detail': 'Session introuvable'}, status=status.HTTP_404_NOT_FOUND)

        success, errors = 0, []

        for i, row in enumerate(rows):
            exam_number = row.get('exam_number', '').strip()
            try:
                # Duplicate = same exam_number already linked to this session
                if Grade.objects.filter(
                    student__exam_number=exam_number,
                    session=session,
                ).exists():
                    errors.append({
                        'row': i + 2,
                        'reason': f"Doublon: {row.get('full_name')} ({exam_number})",
                    })
                    continue

                student = Student.objects.create(
                    full_name=row['full_name'],
                    exam_number=exam_number,
                    birth_date=row.get('birth_date'),
                    birth_place=row.get('birth_place', ''),
                    academic_year=session.academic_year,
                    study_year=session.study_year,
                    branch=session.branch,
                )

                Grade.objects.create(
                    student=student,
                    session=session,
                    ecrit_score_1=row.get('ecrit_score_1'),
                    ecrit_score_2=row.get('ecrit_score_2'),
                    ecrit_score_3=row.get('ecrit_score_3'),
                    ecrit_score_4=row.get('ecrit_score_4'),
                    written_total=row.get('written_total'),
                    written_result=row.get('written_result', ''),
                    oral_score_1=row.get('oral_score_1'),
                    oral_score_2=row.get('oral_score_2'),
                    oral_score_3=row.get('oral_score_3'),
                    oral_score_4=row.get('oral_score_4'),
                    oral_total=row.get('oral_total'),
                    general_total=row.get('general_total'),
                    average=row.get('average'),
                    general_result=row.get('general_result', ''),
                    mention=row.get('mention', ''),
                    observations=row.get('observations', ''),
                )
                success += 1

            except Exception as exc:
                errors.append({'row': i + 2, 'reason': str(exc)})

        _audit(request.user, 'IMPORT', entity='student',
               detail=f"Import session «{session}»: {success} succès, {len(errors)} erreurs",
               ip=_ip(request))

        return Response({'success': success, 'errors': len(errors), 'error_details': errors})


# ── Transcripts ───────────────────────────────────────────────────────────────

def _resolve_grade(student, session_id=None, grade_id=None):
    """Return the Grade to use for PDF generation."""
    if grade_id:
        return get_object_or_404(Grade, pk=grade_id, student=student)
    if session_id:
        return get_object_or_404(Grade, student=student, session_id=session_id)
    return (
        Grade.objects
        .filter(student=student)
        .select_related('session')
        .order_by('-session__session_date')
        .first()
    )


@extend_schema(tags=['transcripts'])
class TranscriptPdfView(APIView):
    @extend_schema(
        summary='Aperçu PDF du relevé (non enregistré)',
        description='Génère un PDF avec la mention "APERÇU" sans enregistrer de log d\'impression.',
        parameters=[
            OpenApiParameter('grade_id', OpenApiTypes.UUID, description='ID de la note (prioritaire)'),
            OpenApiParameter('session_id', OpenApiTypes.UUID, description='ID de la session'),
        ],
        responses={200: OpenApiResponse(description='Fichier PDF', response=OpenApiTypes.BINARY)},
    )
    def get(self, request, student_id):
        student = get_object_or_404(Student, pk=student_id)
        grade = _resolve_grade(
            student,
            session_id=request.query_params.get('session_id'),
            grade_id=request.query_params.get('grade_id'),
        )
        if not grade:
            return Response({'detail': 'Aucune note trouvée'}, status=status.HTTP_404_NOT_FOUND)

        _audit(request.user, 'VIEW', entity='transcript', entity_id=student.id,
               detail=f"Prévisualisation: {student.full_name}", ip=_ip(request))

        pdf = generate_transcript_pdf(student, grade, grade.session,
                                      serial_number='APERÇU', print_number=1)
        resp = HttpResponse(pdf, content_type='application/pdf')
        resp['Content-Disposition'] = f'inline; filename="apercu_{student.exam_number}.pdf"'
        return resp


@extend_schema(tags=['transcripts'])
class TranscriptPrintView(APIView):
    @extend_schema(
        summary='Imprimer le relevé (enregistré)',
        description=(
            'Enregistre l\'impression dans `PrintLog`, incrémente `student.print_count`, '
            'retourne le PDF avec numéro de série.\n\n'
            '- **Professeur** : bloqué si `print_count > 0` (403).\n'
            '- **Admin** : peut toujours imprimer, mais `override_reason` est **obligatoire** '
            'si le relevé a déjà été imprimé.'
        ),
        request={'application/json': {'type': 'object', 'properties': {
            'grade_id': {'type': 'string', 'format': 'uuid'},
            'session_id': {'type': 'string', 'format': 'uuid'},
            'override_reason': {'type': 'string', 'description': 'Obligatoire pour réimpression admin'},
        }}},
        responses={
            200: OpenApiResponse(description='PDF du relevé officiel', response=OpenApiTypes.BINARY),
            400: OpenApiResponse(description='Motif manquant'),
            403: OpenApiResponse(description='Impression non autorisée (professeur)'),
        },
    )
    def post(self, request, student_id):
        student = get_object_or_404(Student, pk=student_id)
        ip = _ip(request)

        grade = _resolve_grade(
            student,
            session_id=request.data.get('session_id'),
            grade_id=request.data.get('grade_id'),
        )
        if not grade:
            return Response({'detail': 'Aucune note trouvée'}, status=status.HTTP_404_NOT_FOUND)

        allowed, reason = can_print(request.user, student)
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        is_override = request.user.role == User.ADMIN and student.print_count > 0
        override_reason = request.data.get('override_reason', '').strip()
        if is_override and not override_reason:
            return Response(
                {'detail': 'Motif obligatoire pour réimpression'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        print_num = next_print_number(student)
        serial = f"RN-FSJES-{timezone.now().year}-{str(uuid.uuid4())[:8].upper()}"

        PrintLog.objects.create(
            student=student,
            printed_by=request.user,
            print_number=print_num,
            is_admin_override=is_override,
            override_reason=override_reason,
            serial_number=serial,
        )
        student.print_count += 1
        student.save(update_fields=['print_count'])

        _audit(request.user, 'PRINT', entity='student', entity_id=student.id,
               detail=(
                   f"Impression #{print_num} — {student.full_name} — {serial}"
                   + (f" — Motif: {override_reason}" if is_override else "")
               ),
               ip=ip)

        pdf = generate_transcript_pdf(student, grade, grade.session,
                                      serial_number=serial, print_number=print_num)
        resp = HttpResponse(pdf, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="releve_{student.exam_number}_{serial}.pdf"'
        return resp


# ── Audit log ─────────────────────────────────────────────────────────────────

@extend_schema(
    tags=['audit'],
    summary='Journal d\'audit (admin)',
    parameters=[
        OpenApiParameter('user_id', OpenApiTypes.UUID, description='Filtrer par utilisateur'),
        OpenApiParameter('action', OpenApiTypes.STR, description='LOGIN | LOGOUT | SEARCH | VIEW | IMPORT | CREATE | UPDATE | DELETE | PRINT'),
        OpenApiParameter('date_from', OpenApiTypes.DATE, description='Date début (YYYY-MM-DD)'),
        OpenApiParameter('date_to', OpenApiTypes.DATE, description='Date fin (YYYY-MM-DD)'),
    ],
)
class AuditLogView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = AuditLog.objects.all().select_related('user')
        p = self.request.query_params
        if v := p.get('user_id'):
            qs = qs.filter(user_id=v)
        if v := p.get('action'):
            qs = qs.filter(action=v)
        if v := p.get('date_from'):
            qs = qs.filter(created_at__date__gte=v)
        if v := p.get('date_to'):
            qs = qs.filter(created_at__date__lte=v)
        return qs


# ── Users ─────────────────────────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(tags=['users'], summary='Lister les comptes (admin)'),
    retrieve=extend_schema(tags=['users'], summary='Détail d\'un compte'),
    create=extend_schema(tags=['users'], summary='Créer un compte'),
    update=extend_schema(tags=['users'], summary='Modifier un compte'),
    partial_update=extend_schema(tags=['users'], summary='Modifier partiellement'),
    destroy=extend_schema(tags=['users'], summary='Supprimer un compte'),
)
class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    queryset = User.objects.all().order_by('full_name')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @extend_schema(tags=['users'], summary='Activer / Désactiver un compte')
    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response(
                {'detail': 'Impossible de se désactiver soi-même'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({'is_active': user.is_active})

    @extend_schema(
        tags=['users'],
        summary='Changer le mot de passe d\'un compte',
        request={'application/json': {'type': 'object', 'properties': {
            'password': {'type': 'string', 'minLength': 8},
        }, 'required': ['password']}},
    )
    @action(detail=True, methods=['post'], url_path='set-password')
    def set_password(self, request, pk=None):
        user = self.get_object()
        password = request.data.get('password', '')
        if len(password) < 8:
            return Response(
                {'detail': 'Mot de passe trop court (min 8 caractères)'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(password)
        user.save()
        return Response({'detail': 'Mot de passe mis à jour'})


# ── Health ────────────────────────────────────────────────────────────────────

@extend_schema(exclude=True)
class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok'})
