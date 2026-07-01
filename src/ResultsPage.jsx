import React from "react";
import { useTheme } from "./theme";

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
  captureSignature,
}) {
  const { t } = useTheme();

  return (
    <>
      <button
        type="button"
        onClick={goBackToForm}
        style={{
          marginBottom: 16,
          borderRadius: 16,
          border: `1px solid ${t.subtleBorder}`,
          background: t.subtleBg,
          color: t.subtleText,
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
          border: `1px solid ${t.cardBorder}`,
          background: t.cardBg,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
          Optimized Route
        </div>

        <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 12 }}>
          Total: {formatMetersToMiles(routeStats?.distanceMeters)} •{" "}
          {formatDuration(routeStats?.duration)}
        </div>

        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${t.successBorder}`,
            background: t.successBg,
            padding: 12,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 11, color: t.successText, marginBottom: 4 }}>
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
                border: `1px solid ${t.nestedBorder}`,
                background: t.nestedBg,
                padding: 12,
                opacity: stop.done ? 0.72 : 1,
              }}
            >
              <div style={{ fontSize: 11, color: t.textSubtle, marginBottom: 4 }}>
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
                    border: `1px solid ${t.cyanBorder}`,
                    background: t.cyanBg,
                    color: t.cyanText,
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
                    border: `1px solid ${t.subtleBorder}`,
                    background: t.subtleBg,
                    color: t.subtleText,
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Orders: {stop.orders || 0}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    stop.done
                      ? toggleStopDone(stop.id)
                      : captureSignature(stop)
                  }
                  style={{
                    borderRadius: 10,
                    border: stop.done
                      ? `1px solid ${t.successBorder}`
                      : `1px solid ${t.subtleBorder}`,
                    background: stop.done ? t.successBg : t.subtleBg,
                    color: stop.done ? t.successText : t.subtleText,
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  title={
                    stop.done
                      ? "Tap to undo"
                      : "Capture signature & mark delivered"
                  }
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
            border: `1px solid ${t.infoBorder}`,
            background: t.infoBg,
            padding: 12,
            marginTop: 10,
          }}
        >
          <div style={{ fontSize: 11, color: t.infoText, marginBottom: 4 }}>
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
              background: t.accentGrad,
              color: t.accentText,
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
