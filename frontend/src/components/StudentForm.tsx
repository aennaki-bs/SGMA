import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { StudentOut } from "../api/types";

const studentSchema = z.object({
  full_name: z.string().min(1, "الاسم الكامل مطلوب"),
  exam_number: z.string().optional(),
  birth_date: z.string().min(1, "تاريخ الميلاد مطلوب"),
  birth_place: z.string().optional(),
  academic_year: z.string().min(1, "السنة الجامعية مطلوبة"),
  study_year: z.coerce.number().int().min(1, "السنة الدراسية مطلوبة"),
  branch: z.string().min(1, "الفرع مطلوب"),
  session: z.string().optional(),
});

type StudentFormInput = z.input<typeof studentSchema>;
export type StudentFormValues = z.output<typeof studentSchema>;

interface StudentFormProps {
  initialValues?: Partial<StudentOut>;
  onSubmit: (values: StudentFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

const FIELDS: Array<{ key: keyof StudentFormInput; label: string; type?: string; placeholder?: string }> = [
  { key: "full_name", label: "الاسم و النسب" },
  { key: "exam_number", label: "رقم الامتحان" },
  { key: "birth_date", label: "تاريخ الميلاد", type: "date" },
  { key: "birth_place", label: "مكان الميلاد" },
  { key: "academic_year", label: "السنة الجامعية", placeholder: "مثال: 2022/2023" },
  { key: "study_year", label: "السنة الدراسية", type: "number" },
  { key: "branch", label: "الفرع", placeholder: "مثال: فرع الحقوق" },
  { key: "session", label: "الدورة", placeholder: "عادية / أكتوبر / استدراكية" },
];

export function StudentForm({ initialValues, onSubmit, onCancel, isSubmitting, submitLabel }: StudentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormInput, unknown, StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: initialValues?.full_name ?? "",
      exam_number: initialValues?.exam_number ?? "",
      birth_date: initialValues?.birth_date ?? "",
      birth_place: initialValues?.birth_place ?? "",
      academic_year: initialValues?.academic_year ?? "",
      study_year: initialValues?.study_year ?? 1,
      branch: initialValues?.branch ?? "",
      session: initialValues?.session ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md grid grid-cols-1 md:grid-cols-2 gap-md"
    >
      {FIELDS.map(({ key, label, type, placeholder }) => (
        <div key={key} className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface font-semibold">{label}</label>
          <input
            type={type ?? "text"}
            placeholder={placeholder}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-sm font-arabic-body text-arabic-body focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
            {...register(key)}
          />
          {errors[key] && <p className="font-label-sm text-label-sm text-error">{errors[key]?.message as string}</p>}
        </div>
      ))}

      <div className="md:col-span-2 flex gap-sm">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-sm text-label-sm shadow-md disabled:opacity-50"
        >
          {isSubmitting ? "جارٍ الحفظ..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-md py-sm rounded-lg border border-outline text-on-surface hover:bg-surface-container-low transition-colors font-label-sm text-label-sm"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
