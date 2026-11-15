import React from "react";

export default function LoadingSpinner({
  size = "md", // sm, md, lg
  text = "Loading data…",
  fullHeight = false,
  className = "",
}) {
  const sizeMap = {
    sm: "ct-spinner-sm",
    md: "ct-spinner-md",
    lg: "ct-spinner-lg",
  };

  return (
    <div
      className={`ct-loading-wrapper ${
        fullHeight ? "ct-loading-full" : ""
      } ${className}`}
    >
      <div className={`ct-spinner ${sizeMap[size] || sizeMap.md}`} />
      {text && <p className="ct-loading-text">{text}</p>}
    </div>
  );
}
