import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Input({
  label,
  type = "text",
  error,
  helperText,
  icon: Icon,
  className = "",
  required = false,
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`ct-field ${className}`}>
      {label && (
        <label htmlFor={inputId} className="ct-field-label">
          {label} {required && <span className="ct-required">*</span>}
        </label>
      )}
      <div className={`ct-input-wrap ${error ? "has-error" : ""}`}>
        {Icon && <span className="ct-input-icon"><Icon size={18} /></span>}
        <input
          id={inputId}
          type={actualType}
          className={`ct-input ${Icon ? "has-icon" : ""}`}
          required={required}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="ct-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? (
        <span className="ct-field-error">{error}</span>
      ) : helperText ? (
        <span className="ct-field-helper">{helperText}</span>
      ) : null}
    </div>
  );
}
