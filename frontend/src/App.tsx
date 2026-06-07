import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { ProtectedRoute, RequireAdmin } from "./auth/ProtectedRoute";
import { Login } from "./pages/Login";
import { Search } from "./pages/Search";
import { StudentDetail } from "./pages/StudentDetail";
import { StudentNew } from "./pages/StudentNew";
import { Import } from "./pages/Import";
import { AuditLog } from "./pages/AuditLog";
import { Users } from "./pages/Users";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<Search />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/import" element={<Import />} />

          <Route element={<RequireAdmin />}>
            <Route path="/students/new" element={<StudentNew />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/search" replace />} />
    </Routes>
  );
}

export default App;
