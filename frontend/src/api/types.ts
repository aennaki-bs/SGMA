export type Role = "admin" | "professor";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
  full_name: string;
}

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface GradeOut {
  id: string;
  subject_name: string;
  subject_type: "كتابي" | "شفوي" | string;
  order_index: number;
  note: string | number | null;
  written_result: string | null;
}

export interface StudentOut {
  id: string;
  full_name: string;
  exam_number: string | null;
  birth_date: string;
  birth_place: string | null;
  academic_year: string;
  study_year: number;
  branch: string;
  session: string | null;
  total_written: string | number | null;
  total_oral: string | number | null;
  total_general: string | number | null;
  average: string | number | null;
  general_result: string | null;
  mention: string | null;
  copy_general: string | null;
  observations: string | null;
  print_count: number;
  created_at: string;
}

export interface StudentWithGrades extends StudentOut {
  grades: GradeOut[];
}

export interface StudentSearchParams {
  full_name?: string;
  birth_date?: string;
  exam_number?: string;
  academic_year?: string;
  branch?: string;
  skip?: number;
  limit?: number;
}

export interface StudentCreateInput {
  full_name: string;
  exam_number?: string;
  birth_date: string;
  birth_place?: string;
  academic_year: string;
  study_year: number;
  branch: string;
  session?: string;
  total_written?: number;
  total_oral?: number;
  total_general?: number;
  average?: number;
  general_result?: string;
  mention?: string;
  copy_general?: string;
  observations?: string;
}

export type StudentUpdateInput = Partial<StudentCreateInput>;

export interface GradeCreateInput {
  subject_name: string;
  subject_type: string;
  order_index?: number;
  note?: number;
  written_result?: string;
}

export interface PrintStatus {
  print_count: number;
  can_print: boolean;
  first_print_at: string | null;
  prints: Array<{ number: number; at: string; by: string; is_override: boolean }>;
}

export interface PrintLogOut {
  id: string;
  printed_at: string;
  print_number: number;
  is_admin_override: boolean;
  override_reason: string | null;
  serial_number: string;
  printed_by_name: string;
}

export interface ImportExcelResult {
  success: number;
  errors: number;
  details?: Array<{ row: number; error: string }>;
  [key: string]: unknown;
}

export interface AuditLogOut {
  id: string;
  user_id: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  detail: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogParams {
  action?: string;
  user_id?: string;
  skip?: number;
  limit?: number;
}
