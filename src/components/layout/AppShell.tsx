import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bp-surface-alt)]">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-5 py-6 md:px-8 md:py-7">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
