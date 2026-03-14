import React, { useEffect, useMemo, useRef, useState } from "react";
import InputPage from "./InputPage";
import ResultsPage from "./ResultsPage";

const MAX_STOPS = 25;
const STORAGE_KEY = "kush-route-planner-google-v1";
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

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
    orders: 1,
    done: false,
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

async function computeOptimizedRoute(
  origin,
  destination,
  stops,
  regionCode = "us",
) {
  const body = {
    origin: {
      placeId: origin.placeId,
    },
    destination: {
      placeId: destination.placeId,
    },
    intermediates: stops.map((s) => ({
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

export default function App() {
  const [page, setPage] = useState("form");
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
            orders: Number(s.orders) > 0 ? Number(s.orders) : 1,
            done: !!s.done,
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
          orders: s.orders,
          done: s.done,
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

  function updateStopOrders(id, value) {
    const nextValue = Math.max(1, Number(value) || 1);

    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, orders: nextValue } : s)),
    );
    setOrdered((prev) =>
      prev.map((s) => (s.id === id ? { ...s, orders: nextValue } : s)),
    );
  }

  function incrementStopOrders(id) {
    setStops((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, orders: (Number(s.orders) || 1) + 1 } : s,
      ),
    );
    setOrdered((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, orders: (Number(s.orders) || 1) + 1 } : s,
      ),
    );
  }

  function decrementStopOrders(id) {
    setStops((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, orders: Math.max(1, (Number(s.orders) || 1) - 1) }
          : s,
      ),
    );
    setOrdered((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, orders: Math.max(1, (Number(s.orders) || 1) - 1) }
          : s,
      ),
    );
  }

  function toggleStopDone(id) {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );
    setOrdered((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );
  }

  function stopMapsLink(stopLabel) {
    if (!start.label || !stopLabel) return "#";
    return buildMapsDirLink(start.label, stopLabel);
  }

  function goBackToForm() {
    setPage("form");
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
    setPage("form");
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

      setOrdered(
        result.orderedStops.map((routeStop) => {
          const original = enteredStops.find((s) => s.id === routeStop.id);
          return original || routeStop;
        }),
      );

      setRouteStats({
        distanceMeters: result.distanceMeters,
        duration: result.duration,
      });

      setPage("results");
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
        {page === "form" ? (
          <InputPage
            MAX_STOPS={MAX_STOPS}
            activeStops={activeStops}
            start={start}
            end={end}
            stops={stops}
            onStartChange={onStartChange}
            onEndChange={onEndChange}
            onStopChange={onStopChange}
            pickStart={pickStart}
            pickEnd={pickEnd}
            pickStop={pickStop}
            addStop={addStop}
            removeStop={removeStop}
            resetAll={resetAll}
            optimizeRoute={optimizeRoute}
            loadingRoute={loadingRoute}
            error={error}
            updateStopOrders={updateStopOrders}
            incrementStopOrders={incrementStopOrders}
            decrementStopOrders={decrementStopOrders}
            toggleStopDone={toggleStopDone}
            stopMapsLink={stopMapsLink}
          />
        ) : (
          <ResultsPage
            start={start}
            end={end}
            ordered={ordered}
            routeStats={routeStats}
            fullRouteLink={fullRouteLink}
            goBackToForm={goBackToForm}
            toggleStopDone={toggleStopDone}
            buildMapsDirLink={buildMapsDirLink}
          />
        )}
      </div>
    </div>
  );
}
