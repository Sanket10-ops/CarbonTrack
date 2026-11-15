import React from "react";
import LoadingSpinner from "./LoadingSpinner.jsx";
import EmptyState from "./EmptyState.jsx";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found",
  emptyIcon,
  keyField = "id",
  rowClassName,
  className = "",
}) {
  if (loading) {
    return <LoadingSpinner text="Loading records…" />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No records" description={emptyMessage} icon={emptyIcon} />;
  }

  return (
    <div className={`ct-table-container ${className}`}>
      <table className="ct-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={col.width ? { width: col.width } : undefined}
                className={col.align ? `text-${col.align}` : ""}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row[keyField] ?? rowIdx}
              className={rowClassName ? rowClassName(row, rowIdx) : ""}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  className={col.align ? `text-${col.align}` : ""}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
