import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { MaterialIcon } from "../components/MaterialIcon";
import { StatusChip } from "../components/StatusChip";
import { useStudentSearch } from "../hooks/useStudents";
import type { StudentSearchParams } from "../api/types";

const PAGE_SIZE = 10;

const emptyFilters: StudentSearchParams = {
  full_name: "",
  exam_number: "",
  birth_date: "",
};

export function Search() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState<StudentSearchParams>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<StudentSearchParams>(emptyFilters);
  const [page, setPage] = useState(0);

  const params: StudentSearchParams = {
    ...appliedFilters,
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  };
  const { data: students, isLoading, isError } = useStudentSearch(params);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFilters(filters);
    setPage(0);
  }

  function handleReset() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
  }

  const results = students ?? [];
  const hasNextPage = results.length === PAGE_SIZE;

  return (
    <div>
      <div className="mb-lg flex items-start justify-between gap-md flex-wrap">
        <div>
          <h2 className="font-arabic-headline text-arabic-headline text-primary mb-xs">
            لوحة القيادة - البحث عن الطلاب
          </h2>
          <p className="font-arabic-body text-arabic-body text-on-surface-variant">
            ابحث في سجلات الطلاب وقم بإدارة وثائق التخرج بكفاءة.
          </p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => navigate("/students/new")}
            className="px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-sm text-label-sm shadow-md flex items-center gap-xs"
          >
            <MaterialIcon name="person_add" className="text-[18px]" />
            إضافة طالب يدويًا
          </button>
        )}
      </div>

      {/* Filter Panel */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md mb-lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold">اسم الطالب</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-outline">
                person
              </span>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-sm pr-xl py-sm font-arabic-body text-arabic-body text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                placeholder="أدخل اسم الطالب..."
                type="text"
                value={filters.full_name}
                onChange={(e) => setFilters((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold">رقم الامتحان</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-outline">
                badge
              </span>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-sm pr-xl py-sm font-arabic-body text-arabic-body text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                placeholder="مثال: 12345678"
                type="text"
                value={filters.exam_number}
                onChange={(e) => setFilters((f) => ({ ...f, exam_number: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface font-semibold">تاريخ الميلاد</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-outline">
                calendar_today
              </span>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-sm pr-xl py-sm font-arabic-body text-arabic-body text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all text-right"
                dir="rtl"
                type="date"
                value={filters.birth_date}
                onChange={(e) => setFilters((f) => ({ ...f, birth_date: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <div className="mt-md flex justify-end gap-sm">
          <button
            type="button"
            onClick={handleReset}
            className="px-md py-sm rounded-lg border border-outline text-on-surface hover:bg-surface-container-low transition-colors font-label-sm text-label-sm"
          >
            إعادة ضبط
          </button>
          <button
            type="submit"
            className="px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-sm text-label-sm shadow-md flex items-center gap-xs"
          >
            <MaterialIcon name="search" className="text-[18px]" />
            بحث
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-md border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md text-primary">
            نتائج البحث {students ? `(${results.length})` : ""}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-primary-container text-on-primary-container font-label-sm text-label-sm">
                <th className="py-sm px-md font-semibold">الاسم الكامل</th>
                <th className="py-sm px-md font-semibold">رقم الامتحان</th>
                <th className="py-sm px-md font-semibold">تاريخ الميلاد</th>
                <th className="py-sm px-md font-semibold">الشعبة</th>
                <th className="py-sm px-md font-semibold">السنة الجامعية</th>
                <th className="py-sm px-md font-semibold">حالة الوثيقة</th>
                <th className="py-sm px-md font-semibold text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="font-arabic-body text-arabic-body text-on-surface">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-lg px-md text-center text-on-surface-variant">
                    جارٍ التحميل...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={7} className="py-lg px-md text-center text-error">
                    حدث خطأ أثناء جلب النتائج. تحقق من اتصال الخادم.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && results.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-lg px-md text-center text-on-surface-variant">
                    لا توجد نتائج مطابقة. جرّب تعديل معايير البحث.
                  </td>
                </tr>
              )}
              {results.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <td className="py-sm px-md font-semibold">{student.full_name}</td>
                  <td className="py-sm px-md font-mono text-sm text-on-surface-variant">
                    {student.exam_number ?? "—"}
                  </td>
                  <td className="py-sm px-md text-on-surface-variant">{student.birth_date}</td>
                  <td className="py-sm px-md">{student.branch}</td>
                  <td className="py-sm px-md text-on-surface-variant">{student.academic_year}</td>
                  <td className="py-sm px-md">
                    <StatusChip printed={student.print_count > 0} />
                  </td>
                  <td className="py-sm px-md text-left">
                    <button
                      className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-surface-container-high"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/students/${student.id}`);
                      }}
                      aria-label="عرض الفيشة"
                    >
                      <MaterialIcon name="visibility" className="text-[20px]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-md border-t border-outline-variant flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            عرض {results.length === 0 ? 0 : page * PAGE_SIZE + 1} إلى {page * PAGE_SIZE + results.length}
          </span>
          <div className="flex gap-xs">
            <button
              className="p-1 rounded border border-outline-variant text-outline hover:bg-surface-container-low transition-colors disabled:opacity-50"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="السابق"
            >
              <MaterialIcon name="chevron_right" className="text-[20px]" />
            </button>
            <span className="px-3 py-1 rounded border border-primary bg-primary text-on-primary font-label-sm text-label-sm">
              {page + 1}
            </span>
            <button
              className="p-1 rounded border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
              disabled={!hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              aria-label="التالي"
            >
              <MaterialIcon name="chevron_left" className="text-[20px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
