import { useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import type { GradeCreateInput, GradeOut } from "../api/types";

interface GradeEditorProps {
  initialGrades: GradeOut[];
  onSave: (grades: GradeCreateInput[]) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function toRows(grades: GradeOut[]): GradeCreateInput[] {
  return grades.map((g, i) => ({
    subject_name: g.subject_name,
    subject_type: g.subject_type,
    order_index: g.order_index ?? i,
    note: g.note !== null && g.note !== undefined ? Number(g.note) : undefined,
    written_result: g.written_result ?? undefined,
  }));
}

export function GradeEditor({ initialGrades, onSave, onCancel, isSaving }: GradeEditorProps) {
  const [rows, setRows] = useState<GradeCreateInput[]>(() => toRows(initialGrades));

  function updateRow(index: number, patch: Partial<GradeCreateInput>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { subject_name: "", subject_type: "كتابي", order_index: prev.length }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-md border-b border-outline-variant flex items-center justify-between">
        <h3 className="font-headline-md text-headline-md text-primary">تعديل النقط</h3>
        <button
          onClick={addRow}
          className="flex items-center gap-xs text-secondary hover:text-on-secondary-fixed-variant transition-colors font-label-sm text-label-sm"
        >
          <MaterialIcon name="add" className="text-[18px]" />
          إضافة مادة
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-primary-container text-on-primary-container font-label-sm text-label-sm">
              <th className="py-sm px-md font-semibold">اسم المادة</th>
              <th className="py-sm px-md font-semibold">النوع</th>
              <th className="py-sm px-md font-semibold">النقطة</th>
              <th className="py-sm px-md font-semibold">نتيجة الكتابي</th>
              <th className="py-sm px-md"></th>
            </tr>
          </thead>
          <tbody className="font-arabic-body text-arabic-body text-on-surface">
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-outline-variant last:border-b-0">
                <td className="py-xs px-md">
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs"
                    value={row.subject_name}
                    onChange={(e) => updateRow(i, { subject_name: e.target.value })}
                  />
                </td>
                <td className="py-xs px-md">
                  <select
                    className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs"
                    value={row.subject_type}
                    onChange={(e) => updateRow(i, { subject_type: e.target.value })}
                  >
                    <option value="كتابي">كتابي</option>
                    <option value="شفوي">شفوي</option>
                  </select>
                </td>
                <td className="py-xs px-md">
                  <input
                    type="number"
                    step="0.01"
                    className="w-24 bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs font-mono"
                    value={row.note ?? ""}
                    onChange={(e) => updateRow(i, { note: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </td>
                <td className="py-xs px-md">
                  <select
                    className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs"
                    value={row.written_result ?? ""}
                    onChange={(e) => updateRow(i, { written_result: e.target.value || undefined })}
                  >
                    <option value="">—</option>
                    <option value="ناجح">ناجح</option>
                    <option value="راسب">راسب</option>
                  </select>
                </td>
                <td className="py-xs px-md text-left">
                  <button onClick={() => removeRow(i)} className="text-on-surface-variant hover:text-error" aria-label="حذف">
                    <MaterialIcon name="delete" className="text-[18px]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-md border-t border-outline-variant flex gap-sm">
        <button
          onClick={() => onSave(rows.map((r, i) => ({ ...r, order_index: i })))}
          disabled={isSaving}
          className="px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-sm text-label-sm shadow-md disabled:opacity-50"
        >
          {isSaving ? "جارٍ الحفظ..." : "حفظ النقط"}
        </button>
        <button
          onClick={onCancel}
          className="px-md py-sm rounded-lg border border-outline text-on-surface hover:bg-surface-container-low transition-colors font-label-sm text-label-sm"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
