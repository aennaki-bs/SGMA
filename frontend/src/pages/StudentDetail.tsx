import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { useStudent } from "../hooks/useStudents";
import { useTranscriptPreview } from "../hooks/useTranscript";
import { GradesTable } from "../components/GradesTable";
import { TranscriptSummary } from "../components/TranscriptSummary";
import { TranscriptPreviewFrame } from "../components/TranscriptPreviewFrame";
import { PrintButton } from "../components/PrintButton";
import { MaterialIcon } from "../components/MaterialIcon";
import { StudentForm, type StudentFormValues } from "../components/StudentForm";
import { GradeEditor } from "../components/GradeEditor";
import { deleteStudent, updateStudent } from "../api/students";
import { saveGrades } from "../api/grades";
import type { GradeCreateInput } from "../api/types";

const FIELD_LABELS: Array<{ key: "exam_number" | "birth_date" | "birth_place" | "academic_year" | "branch" | "session" | "study_year"; label: string }> = [
  { key: "exam_number", label: "رقم الامتحان" },
  { key: "birth_date", label: "تاريخ الميلاد" },
  { key: "birth_place", label: "مكان الميلاد" },
  { key: "academic_year", label: "السنة الجامعية" },
  { key: "branch", label: "الفرع" },
  { key: "study_year", label: "السنة الدراسية" },
  { key: "session", label: "الدورة" },
];

export function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: student, isLoading, isError } = useStudent(id);
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const preview = useTranscriptPreview(id, showPreview);

  const updateMutation = useMutation({
    mutationFn: (values: StudentFormValues) => updateStudent(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", id] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
      setIsEditingInfo(false);
    },
  });

  const gradesMutation = useMutation({
    mutationFn: (grades: GradeCreateInput[]) => saveGrades(id!, grades),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", id] });
      setIsEditingGrades(false);
    },
  });

  if (isLoading) {
    return <p className="font-arabic-body text-arabic-body text-on-surface-variant">جارٍ التحميل...</p>;
  }
  if (isError || !student) {
    return <p className="font-arabic-body text-arabic-body text-error">تعذر العثور على هذا الطالب.</p>;
  }

  const writtenGrades = student.grades.filter((g) => g.subject_type === "كتابي");
  const oralGrades = student.grades.filter((g) => g.subject_type === "شفوي");

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm(`هل أنت متأكد من حذف الطالب "${student?.full_name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    setIsDeleting(true);
    try {
      await deleteStudent(id);
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
      navigate("/search", { replace: true });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-lg">
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm mb-xs"
          >
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
            رجوع إلى نتائج البحث
          </button>
          <h2 className="font-arabic-headline text-arabic-headline text-primary mb-xs">{student.full_name}</h2>
          <p className="font-arabic-body text-arabic-body text-on-surface-variant">
            {student.branch} — {student.academic_year} — السنة {student.study_year}
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="px-md py-sm rounded-lg border border-outline text-on-surface hover:bg-surface-container-low transition-colors font-label-sm text-label-sm flex items-center gap-xs"
          >
            <MaterialIcon name="visibility" className="text-[18px]" />
            {showPreview ? "إخفاء المعاينة" : "معاينة بيان النقط"}
          </button>
          <PrintButton studentId={student.id} />
          {user?.role === "admin" && (
            <>
              <button
                onClick={() => setIsEditingInfo((v) => !v)}
                className="px-md py-sm rounded-lg border border-outline text-on-surface hover:bg-surface-container-low transition-colors font-label-sm text-label-sm flex items-center gap-xs"
              >
                <MaterialIcon name="edit" className="text-[18px]" />
                {isEditingInfo ? "إلغاء التعديل" : "تعديل البيانات"}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-md py-sm rounded-lg border border-error text-error hover:bg-error-container transition-colors font-label-sm text-label-sm flex items-center gap-xs disabled:opacity-50"
              >
                <MaterialIcon name="delete" className="text-[18px]" />
                {isDeleting ? "جارٍ الحذف..." : "حذف"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Identity card */}
      {isEditingInfo ? (
        <div className="space-y-sm">
          {updateMutation.isError && (
            <p className="font-label-sm text-label-sm text-error">تعذر حفظ التعديلات. تحقق من البيانات.</p>
          )}
          <StudentForm
            initialValues={student}
            onSubmit={(values) => updateMutation.mutate(values)}
            onCancel={() => setIsEditingInfo(false)}
            isSubmitting={updateMutation.isPending}
            submitLabel="حفظ التعديلات"
          />
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant">
            <h3 className="font-headline-md text-headline-md text-primary">بطاقة الطالب</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md p-md">
            {FIELD_LABELS.map(({ key, label }) => (
              <div key={key}>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
                <p className="font-arabic-body text-arabic-body font-semibold text-on-surface">
                  {student[key] !== null && student[key] !== undefined ? String(student[key]) : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPreview && (
        <div>
          <h3 className="font-headline-md text-headline-md text-primary mb-sm">معاينة بيان النقط</h3>
          <TranscriptPreviewFrame html={preview.data} isLoading={preview.isLoading} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <div className="lg:col-span-2 space-y-md">
          {user?.role === "admin" && !isEditingGrades && (
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditingGrades(true)}
                className="flex items-center gap-xs text-secondary hover:text-on-secondary-fixed-variant transition-colors font-label-sm text-label-sm"
              >
                <MaterialIcon name="edit" className="text-[18px]" />
                تعديل النقط
              </button>
            </div>
          )}
          {isEditingGrades ? (
            <>
              {gradesMutation.isError && (
                <p className="font-label-sm text-label-sm text-error">تعذر حفظ النقط. حاول مجددًا.</p>
              )}
              <GradeEditor
                initialGrades={student.grades}
                onSave={(grades) => gradesMutation.mutate(grades)}
                onCancel={() => setIsEditingGrades(false)}
                isSaving={gradesMutation.isPending}
              />
            </>
          ) : (
            <>
              <GradesTable title="المواد الكتابية (مواد كتابية)" grades={writtenGrades} showResult />
              <GradesTable title="المواد الشفهية (مواد شفهية)" grades={oralGrades} />
            </>
          )}
        </div>
        <div>
          <TranscriptSummary student={student} />
        </div>
      </div>
    </div>
  );
}
