import { apiClient } from "./client";
import type { GradeCreateInput, GradeOut } from "./types";

export function getGrades(studentId: string) {
  return apiClient.get<GradeOut[]>(`/api/grades/${studentId}`).then((r) => r.data);
}

export function saveGrades(studentId: string, grades: GradeCreateInput[]) {
  return apiClient
    .post<GradeOut[]>(`/api/grades/${studentId}`, grades)
    .then((r) => r.data);
}
