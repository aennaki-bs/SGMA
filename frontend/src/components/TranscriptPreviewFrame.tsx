interface TranscriptPreviewFrameProps {
  html: string | undefined;
  isLoading: boolean;
}

export function TranscriptPreviewFrame({ html, isLoading }: TranscriptPreviewFrameProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-on-surface-variant font-arabic-body text-arabic-body">
        جارٍ تحضير المعاينة...
      </div>
    );
  }
  if (!html) {
    return (
      <div className="flex items-center justify-center h-[600px] text-on-surface-variant font-arabic-body text-arabic-body">
        تعذر عرض معاينة الوثيقة.
      </div>
    );
  }
  return (
    <iframe
      title="معاينة بيان النقط"
      srcDoc={html}
      className="w-full h-[800px] rounded-lg border border-outline-variant bg-white"
    />
  );
}
