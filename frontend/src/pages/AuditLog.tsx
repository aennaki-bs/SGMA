import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getAuditLogs } from "../api/audit";
import { MaterialIcon } from "../components/MaterialIcon";

const ACTIONS = [
  { value: "", label: "كل الإجراءات" },
  { value: "LOGIN", label: "تسجيل الدخول" },
  { value: "SEARCH", label: "بحث" },
  { value: "VIEW", label: "استشارة" },
  { value: "IMPORT", label: "استيراد" },
  { value: "CREATE", label: "إنشاء" },
  { value: "UPDATE", label: "تعديل" },
  { value: "DELETE", label: "حذف" },
  { value: "PRINT", label: "طباعة" },
];

const PAGE_SIZE = 25;

export function AuditLog() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(0);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit", action, page],
    queryFn: () => getAuditLogs({ action: action || undefined, skip: page * PAGE_SIZE, limit: PAGE_SIZE }),
  });

  const results = logs ?? [];

  return (
    <div className="space-y-md">
      <div>
        <h2 className="font-arabic-headline text-arabic-headline text-primary mb-xs">سجلات التدقيق</h2>
        <p className="font-arabic-body text-arabic-body text-on-surface-variant">
          تتبّع جميع العمليات المنجزة داخل النظام: من قام بماذا ومتى.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-sm bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <label className="font-label-sm text-label-sm text-on-surface font-semibold">نوع الإجراء</label>
        <select
          className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs font-arabic-body text-arabic-body focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(0);
          }}
        >
          {ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-primary-container text-on-primary-container font-label-sm text-label-sm">
                <th className="py-sm px-md font-semibold">التاريخ</th>
                <th className="py-sm px-md font-semibold">الإجراء</th>
                <th className="py-sm px-md font-semibold">الكيان</th>
                <th className="py-sm px-md font-semibold">التفاصيل</th>
                <th className="py-sm px-md font-semibold">عنوان IP</th>
              </tr>
            </thead>
            <tbody className="font-arabic-body text-arabic-body text-on-surface">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-lg px-md text-center text-on-surface-variant">
                    جارٍ التحميل...
                  </td>
                </tr>
              )}
              {!isLoading && results.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-lg px-md text-center text-on-surface-variant">
                    لا توجد سجلات مطابقة.
                  </td>
                </tr>
              )}
              {results.map((log) => (
                <tr key={log.id} className="border-b border-outline-variant last:border-b-0">
                  <td className="py-sm px-md text-on-surface-variant whitespace-nowrap">
                    {dayjs(log.created_at).format("DD/MM/YYYY HH:mm")}
                  </td>
                  <td className="py-sm px-md font-semibold">{log.action}</td>
                  <td className="py-sm px-md text-on-surface-variant">{log.entity ?? "—"}</td>
                  <td className="py-sm px-md">{log.detail ?? "—"}</td>
                  <td className="py-sm px-md font-mono text-sm text-on-surface-variant">{log.ip_address ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-md border-t border-outline-variant flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant">صفحة {page + 1}</span>
          <div className="flex gap-xs">
            <button
              className="p-1 rounded border border-outline-variant text-outline hover:bg-surface-container-low transition-colors disabled:opacity-50"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="السابق"
            >
              <MaterialIcon name="chevron_right" className="text-[20px]" />
            </button>
            <button
              className="p-1 rounded border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
              disabled={results.length < PAGE_SIZE}
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
