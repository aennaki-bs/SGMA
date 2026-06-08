import type { GradeOut } from "../api/types";

interface GradesTableProps {
  title: string;
  grades: GradeOut[];
  showResult?: boolean;
}

export function GradesTable({ title, grades, showResult }: GradesTableProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-md border-b border-outline-variant">
        <h3 className="font-headline-md text-headline-md text-primary">{title}</h3>
      </div>
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="bg-primary-container text-on-primary-container font-label-sm text-label-sm">
            <th className="py-sm px-md font-semibold">المادة</th>
            <th className="py-sm px-md font-semibold">النقطة</th>
            {showResult && <th className="py-sm px-md font-semibold">النتيجة</th>}
          </tr>
        </thead>
        <tbody className="font-arabic-body text-arabic-body text-on-surface">
          {grades.length === 0 && (
            <tr>
              <td colSpan={showResult ? 3 : 2} className="py-md px-md text-center text-on-surface-variant">
                لا توجد مواد مسجلة.
              </td>
            </tr>
          )}
          {grades.map((g) => (
            <tr key={g.id} className="border-b border-outline-variant last:border-b-0">
              <td className="py-sm px-md font-semibold">{g.subject_name}</td>
              <td className="py-sm px-md font-mono text-on-surface-variant">{g.note ?? "—"}</td>
              {showResult && (
                <td className="py-sm px-md">
                  <span
                    className={
                      g.written_result === "ناجح"
                        ? "text-secondary font-semibold"
                        : g.written_result === "راسب"
                          ? "text-error font-semibold"
                          : "text-on-surface-variant"
                    }
                  >
                    {g.written_result ?? "—"}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
