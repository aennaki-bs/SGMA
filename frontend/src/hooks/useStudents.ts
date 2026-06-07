import { useQuery } from "@tanstack/react-query";
import { searchStudents, getStudent } from "../api/students";
import type { StudentSearchParams } from "../api/types";

export function useStudentSearch(params: StudentSearchParams, enabled = true) {
  return useQuery({
    queryKey: ["students", "search", params],
    queryFn: () => searchStudents(params),
    enabled,
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: ["students", id],
    queryFn: () => getStudent(id!),
    enabled: !!id,
  });
}
