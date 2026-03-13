import React, { useEffect, useMemo, useRef, useState } from "react";

const MAX_STOPS = 25;
const STORAGE_KEY = "kush-route-planner-google-v1";
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
console.log("KEY RAW:", API_KEY);

function safeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function buildMapsDirLink(origin, destination, waypoints = []) {
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });

  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function newStop() {
  return {
    id: safeId(),
    label: "",
    placeId: "",
    suggestions: [],
    loading: false,
    open: false,
  };
}

async function fetchPlaceSuggestions(input, sessionToken) {
  if (!input.trim()) return [];

  const res = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
      },
      body: JSON.stringify({
        input,
        sessionToken,
        includedRegionCodes: ["us"],
      }),
    },
  );

  const data = await res.json();
  console.log("AUTOCOMPLETE RESPONSE", data);

  if (!res.ok) {
    throw new Error(data?.error?.message || "Autocomplete failed");
  }

  return (data.suggestions || [])
    .map((item) => item.placePrediction)
    .filter(Boolean)
    .map((p) => ({
      placeId: p.placeId,
      label: p.text?.text || "",
      main: p.structuredFormat?.mainText?.text || p.text?.text || "",
      secondary: p.structuredFormat?.secondaryText?.text || "",
    }));
}

async function computeOptimizedRoute(origin, destination, stops, regionCode = "us") {
  const body = {
    origin: {
      // location: {
      //   placeId: origin.placeId,
      // },
       placeId: origin.placeId,
    },
    destination: {
      // location: {
      //   placeId: destination.placeId,
      // },
      placeId: destination.placeId,
    },
    intermediates: stops.map((s) => ({
      // location: {
      //   placeId: s.placeId,
      // },
      placeId: s.placeId,

    })),
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    optimizeWaypointOrder: true,
    regionCode,
  };

  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.optimizedIntermediateWaypointIndex",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Route optimization failed");
  }

  const route = data.routes?.[0];
  if (!route) {
    throw new Error("No valid route returned");
  }

  const optimizedIndexes = route.optimizedIntermediateWaypointIndex || [];
  const orderedStops = optimizedIndexes.length
    ? optimizedIndexes.map((idx) => stops[idx])
    : stops;

  return {
    orderedStops,
    distanceMeters: route.distanceMeters ?? null,
    duration: route.duration || "",
  };
}

function formatMetersToMiles(meters) {
  if (typeof meters !== "number") return "";
  return `${(meters / 1609.344).toFixed(1)} mi`;
}

function formatDuration(durationStr) {
  if (!durationStr) return "";
  const seconds = Math.round(parseFloat(durationStr.replace("s", "")));
  if (Number.isNaN(seconds)) return durationStr;

  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

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

export default function App() {
  const [sessionToken, setSessionToken] = useState(safeId());

  const [start, setStart] = useState({
    label: "",
    placeId: "",
    suggestions: [],
    loading: false,
    open: false,
  });

  const [end, setEnd] = useState({
    label: "",
    placeId: "",
    suggestions: [],
    loading: false,
    open: false,
  });

  const [stops, setStops] = useState([newStop(), newStop(), newStop()]);
  const [ordered, setOrdered] = useState([]);
  const [routeStats, setRouteStats] = useState({
    distanceMeters: null,
    duration: "",
  });
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState("");

  const debounceRefs = useRef({});

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);

      if (parsed.start) {
        setStart((prev) => ({
          ...prev,
          label: parsed.start.label || "",
          placeId: parsed.start.placeId || "",
        }));
      }

      if (parsed.end) {
        setEnd((prev) => ({
          ...prev,
          label: parsed.end.label || "",
          placeId: parsed.end.placeId || "",
        }));
      }

      if (Array.isArray(parsed.stops) && parsed.stops.length) {
        setStops(
          parsed.stops.map((s) => ({
            ...newStop(),
            id: s.id || safeId(),
            label: s.label || "",
            placeId: s.placeId || "",
          })),
        );
      }

      if (Array.isArray(parsed.ordered)) setOrdered(parsed.ordered);
      if (parsed.routeStats) setRouteStats(parsed.routeStats);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        start: { label: start.label, placeId: start.placeId },
        end: { label: end.label, placeId: end.placeId },
        stops: stops.map((s) => ({
          id: s.id,
          label: s.label,
          placeId: s.placeId,
        })),
        ordered,
        routeStats,
      }),
    );
  }, [start, end, stops, ordered, routeStats]);

  const activeStops = useMemo(
    () => stops.filter((s) => s.label.trim() !== ""),
    [stops],
  );

  const fullRouteLink = useMemo(() => {
    if (!ordered.length || !start.label || !end.label) return "";
    const origin = start.label;
    const destination = end.label;
    const waypoints = ordered.map((s) => s.label);
    return buildMapsDirLink(origin, destination, waypoints);
  }, [ordered, start.label, end.label]);

  async function triggerStartAutocomplete(value) {
    if (!value.trim()) {
      setStart((prev) => ({
        ...prev,
        suggestions: [],
        open: false,
        loading: false,
      }));
      return;
    }

    setStart((prev) => ({ ...prev, loading: true, open: true }));
    try {
      const suggestions = await fetchPlaceSuggestions(value, sessionToken);
      setStart((prev) => ({
        ...prev,
        suggestions,
        open: true,
        loading: false,
      }));
    } catch (err) {
      setStart((prev) => ({
        ...prev,
        suggestions: [],
        open: false,
        loading: false,
      }));
      setError(err.message || "Autocomplete failed");
    }
  }

  async function triggerEndAutocomplete(value) {
    if (!value.trim()) {
      setEnd((prev) => ({
        ...prev,
        suggestions: [],
        open: false,
        loading: false,
      }));
      return;
    }

    setEnd((prev) => ({ ...prev, loading: true, open: true }));
    try {
      const suggestions = await fetchPlaceSuggestions(value, sessionToken);
      setEnd((prev) => ({
        ...prev,
        suggestions,
        open: true,
        loading: false,
      }));
    } catch (err) {
      setEnd((prev) => ({
        ...prev,
        suggestions: [],
        open: false,
        loading: false,
      }));
      setError(err.message || "Autocomplete failed");
    }
  }

  async function triggerStopAutocomplete(id, value) {
    if (!value.trim()) {
      setStops((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, suggestions: [], open: false, loading: false }
            : s,
        ),
      );
      return;
    }

    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, loading: true, open: true } : s)),
    );

    try {
      const suggestions = await fetchPlaceSuggestions(value, sessionToken);
      setStops((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, suggestions, open: true, loading: false } : s,
        ),
      );
    } catch (err) {
      setStops((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, suggestions: [], open: false, loading: false }
            : s,
        ),
      );
      setError(err.message || "Autocomplete failed");
    }
  }

  function onStartChange(value) {
    setError("");
    setOrdered([]);
    setRouteStats({ distanceMeters: null, duration: "" });

    setStart((prev) => ({
      ...prev,
      label: value,
      placeId: "",
      open: !!value.trim(),
    }));

    clearTimeout(debounceRefs.current.start);
    debounceRefs.current.start = setTimeout(() => {
      triggerStartAutocomplete(value);
    }, 250);
  }

  function onEndChange(value) {
    setError("");
    setOrdered([]);
    setRouteStats({ distanceMeters: null, duration: "" });

    setEnd((prev) => ({
      ...prev,
      label: value,
      placeId: "",
      open: !!value.trim(),
    }));

    clearTimeout(debounceRefs.current.end);
    debounceRefs.current.end = setTimeout(() => {
      triggerEndAutocomplete(value);
    }, 250);
  }

  function onStopChange(id, value) {
    setError("");
    setOrdered([]);
    setRouteStats({ distanceMeters: null, duration: "" });

    setStops((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, label: value, placeId: "", open: !!value.trim() }
          : s,
      ),
    );

    clearTimeout(debounceRefs.current[id]);
    debounceRefs.current[id] = setTimeout(() => {
      triggerStopAutocomplete(id, value);
    }, 250);
  }

  function pickStart(item) {
    setStart((prev) => ({
      ...prev,
      label: item.label,
      placeId: item.placeId,
      suggestions: [],
      open: false,
      loading: false,
    }));
    setSessionToken(safeId());
  }

  function pickEnd(item) {
    setEnd((prev) => ({
      ...prev,
      label: item.label,
      placeId: item.placeId,
      suggestions: [],
      open: false,
      loading: false,
    }));
    setSessionToken(safeId());
  }

  function pickStop(id, item) {
    setStops((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              label: item.label,
              placeId: item.placeId,
              suggestions: [],
              open: false,
              loading: false,
            }
          : s,
      ),
    );
    setSessionToken(safeId());
  }

  function addStop() {
    if (stops.length >= MAX_STOPS) return;
    setStops((prev) => [...prev, newStop()]);
  }

  function removeStop(id) {
    setStops((prev) => prev.filter((s) => s.id !== id));
    setOrdered((prev) => prev.filter((s) => s.id !== id));
  }

  function resetAll() {
    setStart({
      label: "",
      placeId: "",
      suggestions: [],
      loading: false,
      open: false,
    });
    setEnd({
      label: "",
      placeId: "",
      suggestions: [],
      loading: false,
      open: false,
    });
    setStops([newStop(), newStop(), newStop()]);
    setOrdered([]);
    setRouteStats({ distanceMeters: null, duration: "" });
    setError("");
    setSessionToken(safeId());
  }

  async function optimizeRoute() {
    setError("");

    if (!API_KEY) {
      setError("Missing VITE_GOOGLE_MAPS_KEY in .env");
      return;
    }

    if (!start.placeId) {
      setError("Select the starting point from Google suggestions.");
      return;
    }

    if (!end.placeId) {
      setError("Select the ending point from Google suggestions.");
      return;
    }

    const enteredStops = stops.filter((s) => s.label.trim() !== "");
    if (!enteredStops.length) {
      setError("Add at least one stop.");
      return;
    }

    const invalidStop = enteredStops.find((s) => !s.placeId);
    if (invalidStop) {
      setError("Select every stop from Google suggestions before optimizing.");
      return;
    }

    try {
      setLoadingRoute(true);
      const result = await computeOptimizedRoute(start, end, enteredStops);
      setOrdered(result.orderedStops);
      setRouteStats({
        distanceMeters: result.distanceMeters,
        duration: result.duration,
      });
    } catch (err) {
      setError(err.message || "Route optimization failed");
    } finally {
      setLoadingRoute(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%)",
        padding: "24px 16px",
        color: "#ffffff",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
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
            Google suggestions + route optimization in one page.
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
              onFocus={() =>
                start.suggestions.length &&
                setStart((prev) => ({ ...prev, open: true }))
              }
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
              onFocus={() =>
                end.suggestions.length &&
                setEnd((prev) => ({ ...prev, open: true }))
              }
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
                    onFocus={() =>
                      stop.suggestions.length &&
                      setStops((prev) =>
                        prev.map((s) =>
                          s.id === stop.id ? { ...s, open: true } : s,
                        ),
                      )
                    }
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
                    }}
                  />
                  {stop.loading ? (
                    <div
                      style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}
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

        {ordered.length > 0 ? (
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
              Total: {formatMetersToMiles(routeStats.distanceMeters)} •{" "}
              {formatDuration(routeStats.duration)}
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
              <div style={{ fontSize: 14, fontWeight: 700 }}>{start.label}</div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {ordered.map((stop, i) => (
                <div
                  key={stop.id}
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(15,23,42,0.8)",
                    padding: 12,
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}
                  >
                    Stop {i + 1}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {stop.label}
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
              <div style={{ fontSize: 14, fontWeight: 700 }}>{end.label}</div>
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
                  background:
                    "linear-gradient(90deg, #22d3ee 0%, #3b82f6 100%)",
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
        ) : null}
      </div>
    </div>
  );
}