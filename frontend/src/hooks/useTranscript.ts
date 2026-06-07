import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPrintStatus, previewTranscript, printTranscript } from "../api/transcripts";

export function usePrintStatus(studentId: string | undefined) {
  return useQuery({
    queryKey: ["transcripts", studentId, "print-status"],
    queryFn: () => getPrintStatus(studentId!),
    enabled: !!studentId,
  });
}

export function useTranscriptPreview(studentId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["transcripts", studentId, "preview"],
    queryFn: () => previewTranscript(studentId!),
    enabled: !!studentId && enabled,
    staleTime: 0,
  });
}

export function usePrintTranscript(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (overrideReason?: string) => printTranscript(studentId, overrideReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transcripts", studentId, "print-status"] });
      queryClient.invalidateQueries({ queryKey: ["students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students", "search"] });
    },
  });
}
