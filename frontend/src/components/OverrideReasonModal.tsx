import { useState } from "react";
import { MaterialIcon } from "./MaterialIcon";

interface OverrideReasonModalProps {
  open: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function OverrideReasonModal({ open, isSubmitting, onCancel, onConfirm }: OverrideReasonModalProps) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-margin-mobile">
      <div className="bg-surface-container-lowest rounded-xl shadow-xl max-w-md w-full p-md">
        <div className="flex items-center gap-sm mb-sm text-error">
          <MaterialIcon name="warning" filled />
          <h3 className="font-headline-md text-headline-md text-primary">إعادة طباعة الوثيقة</h3>
        </div>
        <p className="font-arabic-body text-arabic-body text-on-surface-variant mb-sm">
          هذا الطالب طبع وثيقته من قبل. الرجاء إدخال سبب إعادة الطباعة (إجباري) — سيظهر على الوثيقة كـ "نسخة مكررة".
        </p>
        <textarea
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-sm font-arabic-body text-arabic-body text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
          rows={3}
          placeholder="مثال: فقدان النسخة الأصلية..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-md flex justify-end gap-sm">
          <button
            type="button"
            className="px-md py-sm rounded-lg border border-outline text-on-surface hover:bg-surface-container-low transition-colors font-label-sm text-label-sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="px-md py-sm rounded-lg bg-error text-on-error hover:opacity-90 transition-colors font-label-sm text-label-sm disabled:opacity-50"
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? "جارٍ الطباعة..." : "تأكيد إعادة الطباعة"}
          </button>
        </div>
      </div>
    </div>
  );
}
