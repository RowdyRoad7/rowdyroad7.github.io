import React from "react";

function SuggestionDropdown({ suggestions, onPick }) {
  if (!suggestions.length) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        right: 0,
        zIndex: 20,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "#0f172a",
        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}
    >
      {suggestions.map((item) => (
        <button
          key={item.placeId}
          type="button"
          onClick={() => onPick(item)}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "12px 14px",
            border: "none",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>{item.main}</div>
          {item.secondary ? (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              {item.secondary}
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export default function InputPage({
  MAX_STOPS,
  activeStops,
  start,
  end,
  stops,
  onStartChange,
  onEndChange,
  onStopChange,
  pickStart,
  pickEnd,
  pickStop,
  addStop,
  removeStop,
  resetAll,
  optimizeRoute,
  loadingRoute,
  error,
  updateStopOrders,
  incrementStopOrders,
  decrementStopOrders,
  toggleStopDone,
  stopMapsLink,
}) {
  return (
    <>
      <div
        style={{
          marginBottom: 16,
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.1)",
          background:
            "linear-gradient(135deg, rgba(34,211,238,0.14), rgba(59,130,246,0.08), rgba(16,185,129,0.14))",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          padding: 20,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8 }}>
          Kush Route Planner
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "#dbeafe",
            lineHeight: 1.6,
          }}
        >
          Enter your route details and optimize in one tap.
        </div>
      </div>

      <div
        style={{
          marginBottom: 16,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          padding: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
          Starting Point
        </div>

        <div style={{ position: "relative" }}>
          <input
            value={start.label}
            onChange={(e) => onStartChange(e.target.value)}
            placeholder="Enter start location"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(2,6,23,0.95)",
              color: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          />
          {start.loading ? (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
              Loading suggestions...
            </div>
          ) : null}
          {start.open ? (
            <SuggestionDropdown
              suggestions={start.suggestions}
              onPick={pickStart}
            />
          ) : null}
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: start.placeId ? "#86efac" : "#94a3b8",
          }}
        >
          {start.placeId
            ? "Validated with Google Places"
            : "Pick from suggestions to validate"}
        </div>
      </div>

      <div
        style={{
          marginBottom: 16,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          padding: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
          Ending Point
        </div>

        <div style={{ position: "relative" }}>
          <input
            value={end.label}
            onChange={(e) => onEndChange(e.target.value)}
            placeholder="Enter ending location"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(2,6,23,0.95)",
              color: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          />
          {end.loading ? (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
              Loading suggestions...
            </div>
          ) : null}
          {end.open ? (
            <SuggestionDropdown
              suggestions={end.suggestions}
              onPick={pickEnd}
            />
          ) : null}
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: end.placeId ? "#86efac" : "#94a3b8",
          }}
        >
          {end.placeId
            ? "Validated with Google Places"
            : "Pick from suggestions to validate"}
        </div>
      </div>

      <div
        style={{
          marginBottom: 16,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>Stops</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            {activeStops.length} active / {MAX_STOPS}
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {stops.map((stop, i) => (
            <div
              key={stop.id}
              style={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(2,6,23,0.72)",
                padding: 12,
                opacity: stop.done ? 0.72 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Stop {i + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeStop(stop.id)}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(248,113,113,0.25)",
                    background: "rgba(127,29,29,0.25)",
                    color: "#fca5a5",
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <input
                  value={stop.label}
                  onChange={(e) => onStopChange(stop.id, e.target.value)}
                  placeholder={`Enter stop ${i + 1}`}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(2,6,23,0.95)",
                    color: "#fff",
                    fontSize: 14,
                    outline: "none",
                    textDecoration: stop.done ? "line-through" : "none",
                  }}
                />
                {stop.loading ? (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                    Loading suggestions...
                  </div>
                ) : null}
                {stop.open ? (
                  <SuggestionDropdown
                    suggestions={stop.suggestions}
                    onPick={(item) => pickStop(stop.id, item)}
                  />
                ) : null}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: stop.placeId ? "#86efac" : "#94a3b8",
                }}
              >
                {stop.placeId
                  ? "Validated with Google Places"
                  : "Pick from suggestions to validate"}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 90px",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <a
                  href={stop.label ? stopMapsLink(stop.label) : "#"}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    if (!stop.label) e.preventDefault();
                  }}
                  style={{
                    textAlign: "center",
                    borderRadius: 12,
                    border: "1px solid rgba(34,211,238,0.22)",
                    background: "rgba(6,182,212,0.12)",
                    color: stop.label ? "#67e8f9" : "#64748b",
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Navigate
                </a>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 32px",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => decrementStopOrders(stop.id)}
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff",
                      height: 40,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>

                  <input
                    value={stop.orders}
                    onChange={(e) => updateStopOrders(stop.id, e.target.value)}
                    placeholder="1"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(15,23,42,0.9)",
                      color: "#fff",
                      padding: "10px 8px",
                      fontSize: 13,
                      outline: "none",
                      textAlign: "center",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => incrementStopOrders(stop.id)}
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff",
                      height: 40,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleStopDone(stop.id)}
                  style={{
                    borderRadius: 12,
                    border: stop.done
                      ? "1px solid rgba(34,197,94,0.30)"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: stop.done
                      ? "rgba(22,163,74,0.18)"
                      : "rgba(255,255,255,0.06)",
                    color: stop.done ? "#86efac" : "#e2e8f0",
                    padding: "10px 12px",
                    fontSize: 13,
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
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 14,
          }}
        >
          <button
            type="button"
            onClick={addStop}
            disabled={stops.length >= MAX_STOPS}
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              background:
                stops.length >= MAX_STOPS
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.10)",
              color: stops.length >= MAX_STOPS ? "#64748b" : "#fff",
              padding: "14px 12px",
              fontSize: 14,
              fontWeight: 700,
              cursor: stops.length >= MAX_STOPS ? "not-allowed" : "pointer",
            }}
          >
            Add Stop
          </button>

          <button
            type="button"
            onClick={resetAll}
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)",
              color: "#e2e8f0",
              padding: "14px 12px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={optimizeRoute}
        disabled={loadingRoute}
        style={{
          width: "100%",
          borderRadius: 22,
          background: "#ffffff",
          color: "#020617",
          padding: "16px 18px",
          fontSize: 15,
          fontWeight: 800,
          border: "none",
          cursor: loadingRoute ? "wait" : "pointer",
          boxShadow: "0 18px 36px rgba(0,0,0,0.28)",
          marginBottom: 16,
        }}
      >
        {loadingRoute ? "Optimizing..." : "Get Optimized Stops"}
      </button>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 16,
            border: "1px solid rgba(248,113,113,0.25)",
            background: "rgba(127,29,29,0.18)",
            color: "#fecaca",
            padding: 12,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}
    </>
  );
}