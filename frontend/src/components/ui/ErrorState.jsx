import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button.jsx";

export default function ErrorState({
  title = "Something went wrong",
  message = "We encountered an issue fetching the requested information.",
  onRetry,
  className = "",
}) {
  return (
    <div className={`ct-error-state ${className}`}>
      <div className="ct-error-icon">
        <AlertCircle size={24} />
      </div>
      <div className="ct-error-content">
        <h4 className="ct-error-title">{title}</h4>
        <p className="ct-error-message">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={RefreshCw}
            className="ct-error-retry"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
