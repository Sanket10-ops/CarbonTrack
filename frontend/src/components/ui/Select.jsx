import React from "react";
import { ChevronDown } from "lucide-react";

export default function Select({
  label,
  options = [],
  error,
  helperText,
  icon: Icon,
  className = "",
  required = false,
  id,
  children,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`ct-field ${className}`}>
      {label && (
        <label htmlFor={selectId} className="ct-field-label">
          {label} {required && <span className="ct-required">*</span>}
        </label>
      )}
      <div className={`ct-select-wrap ${error ? "has-error" : ""}`}>
        {Icon && <span className="ct-input-icon"><Icon size={18} /></span>}
        <select
          id={selectId}
          className={`ct-select ${Icon ? "has-icon" : ""}`}
          required={required}
          {...props}
        >
          {children ? (
            children
          ) : (
            options.map((opt) => (
              <option key={opt.value ?? opt} value={opt.value ?? opt}>
                {opt.label ?? opt}
              </option>
            ))
          )}
        </select>
        <span className="ct-select-chevron">
          <ChevronDown size={16} />
        </span>
      </div>
      {error ? (
        <span className="ct-field-error">{error}</span>
      ) : helperText ? (
        <span className="ct-field-helper">{helperText}</span>
      ) : null}
    </div>
  );
}
