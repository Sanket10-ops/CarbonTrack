import React, { useState } from "react";
import {
  Menu,
  Plus,
  User,
  LogOut,
  Calendar,
  Building2,
  ChevronDown,
} from "lucide-react";
import Button from "../ui/Button.jsx";

export default function Topbar({
  currentPageTitle = "Dashboard",
  onToggleSidebar,
  user,
  onNavigate,
  onLogout,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="ct-topbar">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="ct-topbar-left">
        <button
          type="button"
          className="ct-menu-toggle md:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>
        <div className="ct-page-title-group">
          <h2 className="ct-page-heading">{currentPageTitle}</h2>
          <span className="ct-topbar-date">
            <Calendar size={13} /> {todayFormatted}
          </span>
        </div>
      </div>

      {/* Right: Quick Action, Organization Badge, User Menu */}
      <div className="ct-topbar-right">
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => onNavigate("activity")}
          className="hidden sm:inline-flex"
        >
          Log Activity
        </Button>

        {user?.role === "ORG_ADMIN" && (
          <span className="ct-org-badge hidden md:inline-flex">
            <Building2 size={13} /> Org Admin
          </span>
        )}

        {/* User Profile Dropdown */}
        <div className="ct-profile-menu-container">
          <button
            type="button"
            className="ct-profile-trigger"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            aria-expanded={profileDropdownOpen}
          >
            <div className="ct-topbar-avatar">
              {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="ct-topbar-username hidden lg:inline">
              {user?.username || "Account"}
            </span>
            <ChevronDown size={14} className="ct-topbar-chevron" />
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="ct-dropdown-backdrop"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="ct-profile-dropdown">
                <div className="ct-dropdown-header">
                  <p className="font-semibold">{user?.username}</p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                </div>
                <div className="ct-dropdown-divider" />
                <button
                  type="button"
                  className="ct-dropdown-item"
                  onClick={() => {
                    onNavigate("profile");
                    setProfileDropdownOpen(false);
                  }}
                >
                  <User size={15} /> Your Profile
                </button>
                <div className="ct-dropdown-divider" />
                <button
                  type="button"
                  className="ct-dropdown-item text-danger"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
