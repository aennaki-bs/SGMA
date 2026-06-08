import { apiClient } from "./client";
import type { PrintStatus } from "./types";

export function previewTranscript(studentId: string) {
  return apiClient
    .get<string>(`/api/transcripts/${studentId}/preview`, { responseType: "text" })
    .then((r) => r.data);
}

export function printTranscript(studentId: string, overrideReason?: string) {
  return apiClient
    .post<string>(
      `/api/transcripts/${studentId}/print`,
      { override_reason: overrideReason ?? null },
      { responseType: "text" }
    )
    .then((r) => r.data);
}

export function getPrintStatus(studentId: string) {
  return apiClient
    .get<PrintStatus>(`/api/transcripts/${studentId}/print-status`)
    .then((r) => r.data);
}
