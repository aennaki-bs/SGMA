import { apiClient } from "./client";
import type { ImportExcelResult } from "./types";

export interface ImportExcelInput {
  file: File;
  academic_year: string;
  study_year: number;
  branch: string;
  session?: string;
}

export function importExcel(input: ImportExcelInput) {
  const form = new FormData();
  form.append("file", input.file);
  form.append("academic_year", input.academic_year);
  form.append("study_year", String(input.study_year));
  form.append("branch", input.branch);
  if (input.session) form.append("session", input.session);

  return apiClient
    .post<ImportExcelResult>("/api/import/excel", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}
