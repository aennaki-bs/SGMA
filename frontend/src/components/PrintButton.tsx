import { useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "../auth/AuthContext";
import { usePrintStatus, usePrintTranscript } from "../hooks/useTranscript";
import { OverrideReasonModal } from "./OverrideReasonModal";
import { MaterialIcon } from "./MaterialIcon";

interface PrintButtonProps {
  studentId: string;
}

function openHtmlInNewWindow(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function PrintButton({ studentId }: PrintButtonProps) {
  const { user } = useAuth();
  const { data: status, isLoading } = usePrintStatus(studentId);
  const printMutation = usePrintTranscript(studentId);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !status || !user) return null;

  const alreadyPrinted = status.print_count > 0;
  const isProfessor = user.role === "professor";

  async function doPrint(overrideReason?: string) {
    setError(null);
    try {
      const html = await printMutation.mutateAsync(overrideReason);
      openHtmlInNewWindow(html);
      setShowOverrideModal(false);
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "تعذرت عملية الطباعة. حاول مجددًا.";
      setError(message);
      setShowOverrideModal(false);
    }
  }

  function handleClick() {
    if (isProfessor && alreadyPrinted) return; // blocked, button disabled below
    if (!isProfessor && alreadyPrinted) {
      setShowOverrideModal(true);
      return;
    }
    void doPrint();
  }

  const disabled = isProfessor && alreadyPrinted;

  return (
    <div className="flex flex-col items-end gap-xs">
      <button
        onClick={handleClick}
        disabled={disabled || printMutation.isPending}
        className="px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-sm text-label-sm shadow-md flex items-center gap-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MaterialIcon name="print" className="text-[18px]" />
        {printMutation.isPending
          ? "جارٍ الطباعة..."
          : disabled
            ? "تمت الطباعة"
            : alreadyPrinted
              ? "إعادة الطباعة (بمبرر)"
              : "طباعة"}
      </button>
      {disabled && status.first_print_at && (
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          تمت الطباعة بتاريخ {dayjs(status.first_print_at).format("DD/MM/YYYY [في] HH:mm")}
        </p>
      )}
      {!disabled && (
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          عدد مرات الطباعة: {status.print_count}
        </p>
      )}
      {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}

      <OverrideReasonModal
        open={showOverrideModal}
        isSubmitting={printMutation.isPending}
        onCancel={() => setShowOverrideModal(false)}
        onConfirm={(reason) => void doPrint(reason)}
      />
    </div>
  );
}
