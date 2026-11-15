import React from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import { AlertCircle } from "lucide-react";

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="ct-confirm-dialog">
        <div className={`ct-confirm-icon is-${variant}`}>
          <AlertCircle size={24} />
        </div>
        <h3 className="ct-confirm-title">{title}</h3>
        <p className="ct-confirm-message">{message}</p>
        <div className="ct-confirm-actions">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
