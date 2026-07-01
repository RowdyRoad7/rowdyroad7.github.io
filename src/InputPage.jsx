import React from "react";
import { useTheme } from "./theme";
import { useIsMobile } from "./useIsMobile";
import RouteRxLogo from "./RouteRxLogo";

function SuggestionDropdown({ suggestions, onPick }) {
  const { t } = useTheme();
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
        border: `1px solid ${t.cardBorder}`,
        background: t.popoverBg,
        boxShadow: t.shadowMd,
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
            color: t.text,
            cursor: "pointer",
            borderBottom: `1px solid ${t.popoverDivider}`,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>{item.main}</div>
          {item.secondary ? (
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>
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
  const { t } = useTheme();
  const isMobile = useIsMobile();

  const sectionCard = {
    marginBottom: 16,
    borderRadius: 22,
    border: `1px solid ${t.cardBorder}`,
    background: t.cardBg,
    padding: 16,
  };

  const textInput = {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: 14,
    border: `1px solid ${t.inputBorder}`,
    background: t.inputBg,
    color: t.text,
    fontSize: 14,
    outline: "none",
  };

  const validationText = (valid) => ({
    marginTop: 8,
    fontSize: 12,
    color: valid ? t.successText : t.textMuted,
  });

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          borderRadius: 28,
          border: `1px solid ${t.cardBorder}`,
          background: t.heroGrad,
          boxShadow: t.shadowLg,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <RouteRxLogo size={isMobile ? 34 : 40} />
          <div
            style={{
              fontSize: isMobile ? 26 : 30,
              fontWeight: 800,
              letterSpacing: -0.8,
            }}
          >
            RouteRx
          </div>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            color: t.heroSubtext,
            lineHeight: 1.6,
          }}
        >
          Enter your route details and optimize in one tap.
        </div>
      </div>

      <div style={sectionCard}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
          Starting Point
        </div>

        <div style={{ position: "relative" }}>
          <input
            value={start.label}
            onChange={(e) => onStartChange(e.target.value)}
            placeholder="Enter start location"
            style={textInput}
          />
          {start.loading ? (
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>
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

        <div style={validationText(start.placeId)}>
          {start.placeId
            ? "Validated with Google Places"
            : "Pick from suggestions to validate"}
        </div>
      </div>

      <div style={sectionCard}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
          Ending Point
        </div>

        <div style={{ position: "relative" }}>
          <input
            value={end.label}
            onChange={(e) => onEndChange(e.target.value)}
            placeholder="Enter ending location"
            style={textInput}
          />
          {end.loading ? (
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>
              Loading suggestions...
            </div>
          ) : null}
          {end.open ? (
            <SuggestionDropdown suggestions={end.suggestions} onPick={pickEnd} />
          ) : null}
        </div>

        <div style={validationText(end.placeId)}>
          {end.placeId
            ? "Validated with Google Places"
            : "Pick from suggestions to validate"}
        </div>
      </div>

      <div style={sectionCard}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>Stops</div>
          <div style={{ fontSize: 12, color: t.textMuted }}>
            {activeStops.length} active / {MAX_STOPS}
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {stops.map((stop, i) => (
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, color: t.textMuted }}>
                  Stop {i + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeStop(stop.id)}
                  style={{
                    borderRadius: 10,
                    border: `1px solid ${t.dangerBorder}`,
                    background: t.dangerBg,
                    color: t.dangerText,
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
                    ...textInput,
                    textDecoration: stop.done ? "line-through" : "none",
                  }}
                />
                {stop.loading ? (
                  <div
                    style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}
                  >
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

              <div style={validationText(stop.placeId)}>
                {stop.placeId
                  ? "Validated with Google Places"
                  : "Pick from suggestions to validate"}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr 1fr"
                    : "1fr 120px 90px",
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
                    border: `1px solid ${t.cyanBorder}`,
                    background: t.cyanBg,
                    color: stop.label ? t.cyanText : t.textSubtle,
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    gridColumn: isMobile ? "1 / -1" : "auto",
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
                      border: `1px solid ${t.subtleBorder}`,
                      background: t.subtleBg,
                      color: t.text,
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
                      border: `1px solid ${t.inputBorder}`,
                      background: t.inputBg,
                      color: t.text,
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
                      border: `1px solid ${t.subtleBorder}`,
                      background: t.subtleBg,
                      color: t.text,
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
                      ? `1px solid ${t.successBorder}`
                      : `1px solid ${t.subtleBorder}`,
                    background: stop.done ? t.successBg : t.subtleBg,
                    color: stop.done ? t.successText : t.subtleText,
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
              border: `1px solid ${t.subtleBorder}`,
              background: t.subtleBg,
              color: stops.length >= MAX_STOPS ? t.textSubtle : t.text,
              padding: "14px 12px",
              fontSize: 14,
              fontWeight: 700,
              cursor: stops.length >= MAX_STOPS ? "not-allowed" : "pointer",
              opacity: stops.length >= MAX_STOPS ? 0.6 : 1,
            }}
          >
            Add Stop
          </button>

          <button
            type="button"
            onClick={resetAll}
            style={{
              borderRadius: 16,
              border: `1px solid ${t.subtleBorder}`,
              background: t.subtleBg,
              color: t.subtleText,
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
          background: t.primaryBtnBg,
          color: t.primaryBtnText,
          padding: "16px 18px",
          fontSize: 15,
          fontWeight: 800,
          border: "none",
          cursor: loadingRoute ? "wait" : "pointer",
          boxShadow: t.shadowLg,
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
            border: `1px solid ${t.dangerBorder}`,
            background: t.dangerBg,
            color: t.dangerText,
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
