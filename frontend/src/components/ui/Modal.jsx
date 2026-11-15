import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-md",
  className = "",
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ct-modal-overlay" onClick={onClose}>
      <div
        className={`ct-modal-container ${maxWidth} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="ct-modal-header">
          <div>
            {title && <h3 className="ct-modal-title">{title}</h3>}
            {subtitle && <p className="ct-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="ct-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="ct-modal-body">{children}</div>
      </div>
    </div>
  );
}
