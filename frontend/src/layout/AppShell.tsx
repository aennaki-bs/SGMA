import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../auth/AuthContext";
import { MaterialIcon } from "../components/MaterialIcon";

interface NavItem {
  to: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/search", icon: "search", label: "البحث" },
  { to: "/import", icon: "upload_file", label: "استيراد" },
  { to: "/audit", icon: "history_edu", label: "سجلات التدقيق", adminOnly: true },
  { to: "/users", icon: "group", label: "المستخدمين", adminOnly: true },
];

function navLinkClasses(isActive: boolean) {
  return clsx(
    "flex flex-row-reverse items-center gap-sm p-sm w-full rounded-lg transition-all font-arabic-body text-arabic-body",
    isActive
      ? "text-primary font-bold bg-secondary-container"
      : "text-on-surface-variant hover:bg-surface-container-high"
  );
}

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="font-arabic-body text-on-surface bg-background flex h-screen overflow-hidden">
      {/* Sidebar (right-docked for RTL) */}
      <nav className="flex flex-col fixed right-0 top-0 h-full border-l border-outline-variant z-40 bg-surface-container-low w-64">
        <div className="flex items-center gap-sm p-md border-b border-outline-variant">
          <div className="w-12 h-12 rounded-full border border-secondary-fixed bg-primary-container flex items-center justify-center">
            <MaterialIcon name="account_balance" className="text-on-primary-container" />
          </div>
          <div>
            <h1 className="font-arabic-headline text-arabic-headline text-primary">نظام تدبير النقاط</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">الإدارة المركزية</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-md">
          <ul className="space-y-xs px-sm">
            {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={({ isActive }) => navLinkClasses(isActive)}>
                  <MaterialIcon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-md border-t border-outline-variant">
          <ul className="space-y-xs">
            <li>
              <button
                onClick={logout}
                className="flex flex-row-reverse items-center gap-sm p-sm w-full rounded-lg text-error hover:bg-error-container transition-all font-arabic-body text-arabic-body"
              >
                <MaterialIcon name="logout" />
                <span>تسجيل الخروج</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main column */}
      <div className="flex-1 flex flex-col mr-64 overflow-hidden">
        <header className="flex flex-row-reverse justify-between items-center px-margin-desktop w-full h-16 bg-surface border-b border-outline-variant sticky top-0 z-30">
          <div className="font-headline-md text-headline-md text-primary font-bold tracking-tight">
            FSJES Ain Chock
          </div>
          <div className="flex flex-row-reverse items-center gap-md">
            <button className="text-on-surface-variant hover:text-primary transition-colors relative">
              <MaterialIcon name="notifications" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full" />
            </button>
            <div className="w-px h-6 bg-outline-variant" />
            <div className="flex flex-row-reverse items-center gap-xs">
              <div className="w-8 h-8 rounded-full border border-outline-variant bg-secondary-container flex items-center justify-center font-label-sm text-label-sm text-on-secondary-container">
                {user?.fullName?.[0] ?? "?"}
              </div>
              <div className="text-end">
                <p className="font-label-sm text-label-sm text-on-surface">{user?.fullName}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {user?.role === "admin" ? "مدير" : "أستاذ"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-margin-desktop">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
