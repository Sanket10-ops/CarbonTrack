import React from "react";

export default function Card({
  title,
  subtitle,
  action,
  icon: Icon,
  children,
  className = "",
  padding = "p-6",
  ...props
}) {
  return (
    <div className={`ct-card ${padding} ${className}`} {...props}>
      {(title || subtitle || action || Icon) && (
        <div className="ct-card-header">
          <div className="ct-card-title-group">
            {Icon && (
              <div className="ct-card-icon">
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && <h3 className="ct-card-title">{title}</h3>}
              {subtitle && <p className="ct-card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="ct-card-action">{action}</div>}
        </div>
      )}
      <div className="ct-card-content">{children}</div>
    </div>
  );
}
