import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { useTheme } from "./theme";
import { useAuth } from "./auth";
import DelRxLogo from "./DelRxLogo";

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function shiftISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function recordDate(r) {
  if (r.date) return r.date;
  if (r.createdAt?.toDate) return r.createdAt.toDate().toISOString().slice(0, 10);
  return "";
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatCard({ label, value }) {
  const { t } = useTheme();
  return (
    <div
      style={{
        flex: 1,
        minWidth: 120,
        borderRadius: 14,
        border: `1px solid ${t.nestedBorder}`,
        background: t.nestedBg,
        padding: "12px 14px",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

function RecordsCard({ user }) {
  const { t } = useTheme();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        let snapshot;
        try {
          snapshot = await getDocs(
            query(collection(db, "deliveries"), orderBy("createdAt", "desc")),
          );
        } catch {
          // Older records may lack createdAt for ordering — fall back.
          snapshot = await getDocs(collection(db, "deliveries"));
        }
        if (!active) return;
        setRecords(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        if (active) setError(err.message || "Failed to load records.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const d = recordDate(r);
      if (from || to) {
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      return true;
    });
  }, [records, from, to]);

  const stats = useMemo(() => {
    const addresses = new Set(filtered.map((r) => r.address).filter(Boolean));
    const delivered = filtered.filter((r) => r.delivered === "yes").length;
    return {
      total: filtered.length,
      addresses: addresses.size,
      delivered,
    };
  }, [filtered]);

  function applyPreset(days) {
    if (days === "all") {
      setFrom("");
      setTo("");
      return;
    }
    setTo(todayISO());
    setFrom(days === 0 ? todayISO() : shiftISO(-(days - 1)));
  }

  function exportCsv() {
    const header = ["Date", "Address", "Rx Number", "Status", "Signature"];
    const rows = filtered.map((r) => [
      recordDate(r),
      r.address || "",
      r.rxNo || "",
      r.delivered || "",
      r.signature || "",
    ]);
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deliveries-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const dateInput = {
    borderRadius: 10,
    border: `1px solid ${t.inputBorder}`,
    background: t.inputBg,
    color: t.text,
    padding: "9px 10px",
    fontSize: 13,
    outline: "none",
  };

  const presetBtn = {
    borderRadius: 999,
    border: `1px solid ${t.subtleBorder}`,
    background: t.subtleBg,
    color: t.subtleText,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };

  const th = {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 700,
    color: t.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    position: "sticky",
    top: 0,
    background: t.tableHeadBg,
    whiteSpace: "nowrap",
  };

  const td = {
    padding: "12px 12px",
    fontSize: 13,
    verticalAlign: "middle",
    borderTop: `1px solid ${t.nestedBorder}`,
  };

  return (
    <div
      style={{
        borderRadius: 24,
        border: `1px solid ${t.cardBorder}`,
        background: t.cardBg,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DelRxLogo size={30} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              DelRx · Delivery Records
            </div>
            <div style={{ fontSize: 11, color: t.textMuted }}>
              Signed in as {user?.email || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <StatCard label="Deliveries" value={stats.total} />
        <StatCard label="Signed off" value={stats.delivered} />
        <StatCard label="Addresses" value={stats.addresses} />
      </div>

      {/* Filter toolbar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-end",
          marginBottom: 14,
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 11, color: t.textMuted, marginBottom: 4 }}>
            From
          </label>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            style={dateInput}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: t.textMuted, marginBottom: 4 }}>
            To
          </label>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            style={dateInput}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" style={presetBtn} onClick={() => applyPreset("all")}>
            All
          </button>
          <button type="button" style={presetBtn} onClick={() => applyPreset(0)}>
            Today
          </button>
          <button type="button" style={presetBtn} onClick={() => applyPreset(7)}>
            7 days
          </button>
          <button type="button" style={presetBtn} onClick={() => applyPreset(30)}>
            30 days
          </button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: t.textMuted }}>
            {filtered.length} of {records.length}
          </span>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!filtered.length}
            style={{
              borderRadius: 10,
              border: `1px solid ${t.cyanBorder}`,
              background: t.cyanBg,
              color: t.cyanText,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: filtered.length ? "pointer" : "not-allowed",
              opacity: filtered.length ? 1 : 0.5,
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ fontSize: 13, color: t.textMuted, padding: "24px 0" }}>
          Loading records…
        </div>
      ) : error ? (
        <div style={{ fontSize: 13, color: t.dangerText, padding: "24px 0" }}>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize: 13, color: t.textMuted, padding: "24px 0", textAlign: "center" }}>
          {records.length === 0
            ? "No deliveries recorded yet."
            : "No deliveries match the selected date range."}
        </div>
      ) : (
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${t.nestedBorder}`,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto", maxHeight: 520 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Date</th>
                  <th style={th}>Address</th>
                  <th style={th}>Rx #</th>
                  <th style={th}>Status</th>
                  <th style={{ ...th, textAlign: "right" }}>Signature</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => {
                  const ok = r.delivered === "yes";
                  return (
                    <tr
                      key={r.id}
                      style={{
                        background: idx % 2 ? t.tableRowAlt : "transparent",
                      }}
                    >
                      <td style={{ ...td, whiteSpace: "nowrap" }}>
                        {formatDate(recordDate(r))}
                      </td>
                      <td style={{ ...td, fontWeight: 600 }}>
                        {r.address || "—"}
                      </td>
                      <td style={td}>{r.rxNo || "—"}</td>
                      <td style={td}>
                        <span
                          style={{
                            display: "inline-block",
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontSize: 11,
                            fontWeight: 700,
                            border: `1px solid ${ok ? t.successBorder : t.dangerBorder}`,
                            background: ok ? t.successBg : t.dangerBg,
                            color: ok ? t.successText : t.dangerText,
                          }}
                        >
                          {ok ? "Delivered" : "Not delivered"}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: "right" }}>
                        {r.signature ? (
                          <img
                            src={r.signature}
                            alt="signature"
                            style={{
                              width: 96,
                              height: 44,
                              objectFit: "contain",
                              background: t.sigPadBg,
                              borderRadius: 8,
                              border: `1px solid ${t.nestedBorder}`,
                            }}
                          />
                        ) : (
                          <span style={{ color: t.textSubtle }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeliveriesPage({ goBack }) {
  const { t } = useTheme();
  const { user } = useAuth();

  return (
    <>
      <button
        type="button"
        onClick={goBack}
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
        ← Back to route
      </button>

      <RecordsCard user={user} />
    </>
  );
}
