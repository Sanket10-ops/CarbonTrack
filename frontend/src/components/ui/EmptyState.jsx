import React from "react";
import { Sprout } from "lucide-react";
import Button from "./Button.jsx";

export default function EmptyState({
  icon: Icon = Sprout,
  title = "No data found",
  description = "Get started by recording your first activity or creating a goal.",
  actionLabel,
  onAction,
  actionIcon,
  className = "",
}) {
  return (
    <div className={`ct-empty-state ${className}`}>
      <div className="ct-empty-icon">
        <Icon size={28} />
      </div>
      <h4 className="ct-empty-title">{title}</h4>
      <p className="ct-empty-description">{description}</p>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          onClick={onAction}
          icon={actionIcon}
          className="ct-empty-action"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
