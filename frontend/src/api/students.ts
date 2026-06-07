import { apiClient } from "./client";
import type {
  StudentCreateInput,
  StudentOut,
  StudentSearchParams,
  StudentUpdateInput,
  StudentWithGrades,
} from "./types";

export function searchStudents(params: StudentSearchParams) {
  return apiClient
    .get<StudentOut[]>("/api/students/", { params })
    .then((r) => r.data);
}

export function getStudent(id: string) {
  return apiClient.get<StudentWithGrades>(`/api/students/${id}`).then((r) => r.data);
}

export function createStudent(input: StudentCreateInput) {
  return apiClient.post<StudentOut>("/api/students/", input).then((r) => r.data);
}

export function updateStudent(id: string, input: StudentUpdateInput) {
  return apiClient.put<StudentOut>(`/api/students/${id}`, input).then((r) => r.data);
}

export function deleteStudent(id: string) {
  return apiClient.delete<{ message: string }>(`/api/students/${id}`).then((r) => r.data);
}
