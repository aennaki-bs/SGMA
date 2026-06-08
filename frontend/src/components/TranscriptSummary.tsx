import type { StudentOut } from "../api/types";

interface TranscriptSummaryProps {
  student: StudentOut;
}

const ROWS: Array<{ key: keyof StudentOut; label: string }> = [
  { key: "total_written", label: "مجموع الكتابي" },
  { key: "total_oral", label: "مجموع الشفوي" },
  { key: "total_general", label: "المجموع العام" },
  { key: "average", label: "المعدل" },
  { key: "general_result", label: "النتيجة العامة" },
  { key: "mention", label: "الميزة" },
];

export function TranscriptSummary({ student }: TranscriptSummaryProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-md border-b border-outline-variant">
        <h3 className="font-headline-md text-headline-md text-primary">الترکيب العام</h3>
      </div>
      <dl>
        {ROWS.map(({ key, label }) => (
          <div key={key} className="flex justify-between items-center px-md py-sm border-b border-outline-variant last:border-b-0">
            <dt className="font-arabic-body text-arabic-body text-on-surface-variant">{label}</dt>
            <dd className="font-arabic-body text-arabic-body font-semibold text-on-surface">
              {student[key] !== null && student[key] !== undefined ? String(student[key]) : "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
