import React from "react";

function formatMetersToMiles(meters) {
  if (typeof meters !== "number") return "";
  return `${(meters / 1609.344).toFixed(1)} mi`;
}

function formatDuration(durationStr) {
  if (!durationStr) return "";
  const seconds = Math.round(parseFloat(String(durationStr).replace("s", "")));
  if (Number.isNaN(seconds)) return durationStr;

  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function buildLiveLocationDirLink(destination) {
  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function ResultsPage({
  start,
  end,
  ordered,
  routeStats,
  fullRouteLink,
  goBackToForm,
  toggleStopDone,
}) {
  return (
    <>
      <button
        type="button"
        onClick={goBackToForm}
        style={{
          marginBottom: 16,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.06)",
          color: "#e2e8f0",
          padding: "12px 14px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <div
        style={{
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          padding: 16,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
          Optimized Route
        </div>

        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
          Total: {formatMetersToMiles(routeStats?.distanceMeters)} •{" "}
          {formatDuration(routeStats?.duration)}
        </div>

        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(34,197,94,0.2)",
            background: "rgba(21,128,61,0.12)",
            padding: 12,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 11, color: "#86efac", marginBottom: 4 }}>
            Start
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {start?.label || "Starting point"}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {ordered?.map((stop, i) => (
            <div
              key={stop.id}
              style={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(15,23,42,0.8)",
                padding: 12,
                opacity: stop.done ? 0.72 : 1,
              }}
            >
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                Stop {i + 1}
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: stop.done ? "line-through" : "none",
                  opacity: stop.done ? 0.55 : 1,
                }}
              >
                {stop.label}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
                <a
                  href={buildLiveLocationDirLink(stop.label)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(34,211,238,0.22)",
                    background: "rgba(6,182,212,0.12)",
                    color: "#67e8f9",
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Navigate
                </a>

                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#e2e8f0",
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Orders: {stop.orders || 0}
                </div>

                <button
                  type="button"
                  onClick={() => toggleStopDone(stop.id)}
                  style={{
                    borderRadius: 10,
                    border: stop.done
                      ? "1px solid rgba(34,197,94,0.30)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: stop.done
                      ? "rgba(22,163,74,0.18)"
                      : "rgba(255,255,255,0.05)",
                    color: stop.done ? "#86efac" : "#e2e8f0",
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {stop.done ? "Done ✓" : "Done"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(59,130,246,0.2)",
            background: "rgba(30,64,175,0.12)",
            padding: 12,
            marginTop: 10,
          }}
        >
          <div style={{ fontSize: 11, color: "#93c5fd", marginBottom: 4 }}>
            End
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {end?.label || "Final stop"}
          </div>
        </div>

        {fullRouteLink ? (
          <a
            href={fullRouteLink}
            target="_blank"
            rel="noreferrer"
            style={{
              marginTop: 14,
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 22,
              background: "linear-gradient(90deg, #22d3ee 0%, #3b82f6 100%)",
              color: "#020617",
              padding: "16px 18px",
              fontSize: 15,
              fontWeight: 800,
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            Open Full Route in Google Maps
          </a>
        ) : null}
      </div>
    </>
  );
}