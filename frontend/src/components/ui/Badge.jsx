import React from "react";

export default function Badge({
  children,
  variant = "success", // success, warning, danger, info, neutral, emerald
  size = "md", // sm, md
  icon: Icon,
  className = "",
}) {
  return (
    <span className={`ct-badge ct-badge-${variant} ct-badge-${size} ${className}`}>
      {Icon && <Icon size={size === "sm" ? 11 : 13} />}
      <span>{children}</span>
    </span>
  );
}
