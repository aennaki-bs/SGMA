import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStudent } from "../api/students";
import { StudentForm, type StudentFormValues } from "../components/StudentForm";

export function StudentNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: StudentFormValues) => createStudent(values),
    onSuccess: (student) => {
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
      navigate(`/students/${student.id}`, { replace: true });
    },
  });

  return (
    <div className="space-y-md">
      <div>
        <h2 className="font-arabic-headline text-arabic-headline text-primary mb-xs">إضافة طالب يدويًا</h2>
        <p className="font-arabic-body text-arabic-body text-on-surface-variant">
          أدخل معلومات الطالب الأساسية. يمكن إضافة النقط لاحقًا من فيشة الطالب.
        </p>
      </div>
      {mutation.isError && (
        <p className="font-label-sm text-label-sm text-error">تعذر إنشاء الطالب. تحقق من البيانات وحاول مجددًا.</p>
      )}
      <StudentForm
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate(-1)}
        isSubmitting={mutation.isPending}
        submitLabel="إنشاء الطالب"
      />
    </div>
  );
}
