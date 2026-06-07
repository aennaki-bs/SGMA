interface StatusChipProps {
  printed: boolean;
}

export function StatusChip({ printed }: StatusChipProps) {
  if (printed) {
    return (
      <span className="inline-flex items-center gap-xs px-2 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-secondary" />
        مطبوعة
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-xs px-2 py-1 rounded-full bg-[#fff8e1] text-[#f57f17] text-xs font-semibold border border-[#ffe082]">
      <span className="w-2 h-2 rounded-full bg-[#f57f17]" />
      في الانتظار
    </span>
  );
}
