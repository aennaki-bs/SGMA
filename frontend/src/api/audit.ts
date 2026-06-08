import { apiClient } from "./client";
import type { AuditLogOut, AuditLogParams } from "./types";

export function getAuditLogs(params: AuditLogParams) {
  return apiClient.get<AuditLogOut[]>("/api/audit/", { params }).then((r) => r.data);
}
