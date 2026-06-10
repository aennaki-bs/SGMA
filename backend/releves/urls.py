from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register('students', views.StudentViewSet, basename='student')
router.register('sessions', views.ExamSessionViewSet, basename='session')
router.register('users', views.UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),

    # Auth
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Grades
    path('grades/<uuid:student_id>/', views.GradeView.as_view(), name='grades'),

    # Import
    path('import/', views.ImportView.as_view(), name='import'),

    # Transcripts / PDF
    path('transcripts/<uuid:student_id>/pdf/', views.TranscriptPdfView.as_view(), name='transcript_pdf'),
    path('transcripts/<uuid:student_id>/print/', views.TranscriptPrintView.as_view(), name='transcript_print'),

    # Audit
    path('audit/', views.AuditLogView.as_view(), name='audit'),

    # Health
    path('health/', views.HealthView.as_view(), name='health'),
]
