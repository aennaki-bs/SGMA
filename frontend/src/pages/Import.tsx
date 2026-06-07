import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { importExcel } from "../api/importExcel";
import type { ImportExcelResult } from "../api/types";
import { MaterialIcon } from "../components/MaterialIcon";

const importSchema = z.object({
  academic_year: z.string().min(1, "السنة الجامعية مطلوبة"),
  study_year: z.coerce.number().int().min(1, "السنة الدراسية مطلوبة"),
  branch: z.string().min(1, "الفرع مطلوب"),
  session: z.string().optional(),
});

type ImportFormInput = z.input<typeof importSchema>;
type ImportForm = z.output<typeof importSchema>;

export function Import() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportExcelResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ImportFormInput, unknown, ImportForm>({ resolver: zodResolver(importSchema) });

  const mutation = useMutation({
    mutationFn: (values: ImportForm) => {
      if (!file) throw new Error("no file");
      return importExcel({ file, ...values });
    },
    onSuccess: (data) => setResult(data),
  });

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (f && /\.(xlsx|xls)$/i.test(f.name)) {
      setFile(f);
      setResult(null);
    }
  }

  function onSubmit(values: ImportForm) {
    if (!file) return;
    mutation.mutate(values);
  }

  return (
    <div className="space-y-lg">
      <div>
        <h2 className="font-arabic-headline text-arabic-headline text-primary mb-xs">استيراد بيانات Excel</h2>
        <p className="font-arabic-body text-arabic-body text-on-surface-variant">
          قم برفع ملف بيانات الطلبة الأقدمين بصيغة Excel وحدد الفرع والسنة الجامعية.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Drop zone */}
        <div
          className={`flex flex-col items-center justify-center gap-sm border-2 border-dashed rounded-xl p-xl text-center transition-colors cursor-pointer ${
            isDragging ? "border-secondary bg-surface-container-low" : "border-outline-variant bg-surface-container-lowest"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <MaterialIcon name="cloud_upload" className="text-[48px] text-secondary" />
          <p className="font-arabic-body text-arabic-body text-on-surface font-semibold">
            اسحب وأفلت الملف هنا أو انقر للاختيار
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">الصيغ المدعومة: .xlsx, .xls</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {file && (
            <div className="mt-sm flex items-center gap-xs bg-surface-container-low rounded-lg px-sm py-xs">
              <MaterialIcon name="description" className="text-[18px] text-on-surface-variant" />
              <span className="font-label-sm text-label-sm text-on-surface">{file.name}</span>
              <button
                type="button"
                className="text-on-surface-variant hover:text-error"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                aria-label="إزالة الملف"
              >
                <MaterialIcon name="cancel" className="text-[18px]" />
              </button>
            </div>
          )}
        </div>

        {/* Metadata fields */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md space-y-md">
          <h3 className="font-headline-md text-headline-md text-primary">معلومات الدفعة المستوردة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">السنة الجامعية</label>
              <input
                className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-sm font-arabic-body text-arabic-body focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                placeholder="مثال: 2022/2023"
                {...register("academic_year")}
              />
              {errors.academic_year && <p className="font-label-sm text-label-sm text-error">{errors.academic_year.message}</p>}
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">السنة الدراسية</label>
              <input
                type="number"
                min={1}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-sm font-arabic-body text-arabic-body focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                placeholder="مثال: 1"
                {...register("study_year")}
              />
              {errors.study_year && <p className="font-label-sm text-label-sm text-error">{errors.study_year.message}</p>}
            </div>
            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">الفرع</label>
              <input
                className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-sm font-arabic-body text-arabic-body focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                placeholder="مثال: فرع الحقوق"
                {...register("branch")}
              />
              {errors.branch && <p className="font-label-sm text-label-sm text-error">{errors.branch.message}</p>}
            </div>
            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface font-semibold">الدورة (اختياري)</label>
              <input
                className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-sm font-arabic-body text-arabic-body focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                placeholder="عادية / أكتوبر / استدراكية"
                {...register("session")}
              />
            </div>
          </div>

          {!file && (
            <p className="font-label-sm text-label-sm text-error">الرجاء اختيار ملف Excel أولاً.</p>
          )}
          {mutation.isError && (
            <p className="font-label-sm text-label-sm text-error">
              فشل الاستيراد. تحقق من صحة الملف وحاول مجددًا.
            </p>
          )}

          <button
            type="submit"
            disabled={!file || mutation.isPending}
            className="w-full px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-sm text-label-sm shadow-md flex items-center justify-center gap-xs disabled:opacity-50"
          >
            <MaterialIcon name="upload_file" className="text-[18px]" />
            {mutation.isPending ? "جارٍ الاستيراد..." : "استيراد الملف"}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant flex items-center gap-sm">
            <MaterialIcon name="fact_check" className="text-secondary" />
            <h3 className="font-headline-md text-headline-md text-primary">تقرير الاستيراد</h3>
          </div>
          <div className="p-md flex flex-wrap gap-md">
            <div className="flex items-center gap-xs px-md py-sm rounded-lg bg-secondary-fixed text-on-secondary-fixed font-semibold">
              <MaterialIcon name="check_circle" className="text-[18px]" />
              {result.success} عملية ناجحة
            </div>
            <div className="flex items-center gap-xs px-md py-sm rounded-lg bg-error-container text-on-error-container font-semibold">
              <MaterialIcon name="error" className="text-[18px]" />
              {result.errors} خطأ
            </div>
          </div>
          {Array.isArray(result.details) && result.details.length > 0 && (
            <div className="border-t border-outline-variant overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-primary-container text-on-primary-container font-label-sm text-label-sm">
                    <th className="py-sm px-md font-semibold">السطر</th>
                    <th className="py-sm px-md font-semibold">الخطأ</th>
                  </tr>
                </thead>
                <tbody className="font-arabic-body text-arabic-body text-on-surface">
                  {result.details.map((d, i) => (
                    <tr key={i} className="border-b border-outline-variant last:border-b-0">
                      <td className="py-sm px-md font-mono">{d.row}</td>
                      <td className="py-sm px-md text-error">{d.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
