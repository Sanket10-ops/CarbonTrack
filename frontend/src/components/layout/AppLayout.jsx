import React, { useState } from "react";
import Sidebar, { NAV_ITEMS } from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function AppLayout({
  currentPage,
  onNavigate,
  user,
  onLogout,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentNav = NAV_ITEMS.find((item) => item.id === currentPage);
  const pageTitle = currentNav ? currentNav.label : "CarbonTrack";

  return (
    <div className="ct-app-container">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="ct-main-wrapper">
        <Topbar
          currentPageTitle={pageTitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        <main className="ct-main-content">
          <div className="ct-content-shell">{children}</div>
        </main>
      </div>
    </div>
  );
}
