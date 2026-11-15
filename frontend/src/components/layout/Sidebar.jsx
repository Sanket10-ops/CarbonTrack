import React from "react";
import {
  LayoutDashboard,
  PlusCircle,
  PieChart,
  Target,
  Users,
  Award,
  User,
  LogOut,
  Leaf,
  X,
  ChevronRight,
} from "lucide-react";

export const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "activity", label: "Activity Log", icon: PlusCircle },
  { id: "footprint", label: "My Footprint", icon: PieChart },
  { id: "goals", label: "Goals", icon: Target },
  { id: "community", label: "Community", icon: Users },
  { id: "badges", label: "Badges", icon: Award },
  { id: "profile", label: "Profile", icon: User },
];

export default function Sidebar({
  currentPage,
  onNavigate,
  user,
  onLogout,
  isOpen,
  onClose,
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="ct-sidebar-backdrop md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`ct-sidebar ${isOpen ? "is-open" : ""}`}>
        {/* Sidebar Header */}
        <div className="ct-sidebar-header">
          <div className="ct-sidebar-brand">
            <span className="ct-brand-icon">
              <Leaf size={22} strokeWidth={2.5} />
            </span>
            <div className="ct-brand-text">
              carbon<span className="text-emerald-600">track</span>
            </div>
          </div>
          <button
            type="button"
            className="ct-sidebar-close md:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="ct-sidebar-nav">
          <div className="ct-nav-section-title">PLATFORM</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`ct-nav-item ${isActive ? "is-active" : ""}`}
                onClick={() => {
                  onNavigate(item.id);
                  if (onClose) onClose();
                }}
              >
                <Icon size={18} className="ct-nav-icon" />
                <span className="ct-nav-label">{item.label}</span>
                {isActive && <ChevronRight size={14} className="ct-nav-arrow" />}
              </button>
            );
          })}
        </nav>

        {/* User Profile Snippet & Logout */}
        <div className="ct-sidebar-footer">
          <div className="ct-user-snippet" onClick={() => onNavigate("profile")}>
            <div className="ct-user-avatar">
              {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="ct-user-info">
              <span className="ct-user-name">{user?.username || "Eco Member"}</span>
              <span className="ct-user-role">{user?.role || "USER"}</span>
            </div>
          </div>
          <button
            type="button"
            className="ct-logout-btn"
            onClick={onLogout}
            title="Sign out of CarbonTrack"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}