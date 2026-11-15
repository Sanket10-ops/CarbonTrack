import React from "react";

export default function Button({
  children,
  variant = "primary", // primary, secondary, outline, quiet, danger
  size = "md", // sm, md, lg
  className = "",
  disabled = false,
  loading = false,
  icon: Icon,
  type = "button",
  onClick,
  ...props
}) {
  const variantClass = {
    primary: "ct-btn ct-btn-primary",
    secondary: "ct-btn ct-btn-secondary",
    outline: "ct-btn ct-btn-outline",
    quiet: "ct-btn ct-btn-quiet",
    danger: "ct-btn ct-btn-danger",
  }[variant] || "ct-btn ct-btn-primary";

  const sizeClass = {
    sm: "ct-btn-sm",
    md: "ct-btn-md",
    lg: "ct-btn-lg",
  }[size] || "ct-btn-md";

  return (
    <button
      type={type}
      className={`${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="ct-spinner-sm" />
      ) : Icon ? (
        <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
