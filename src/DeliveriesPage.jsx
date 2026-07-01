import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { useTheme } from "./theme";
import { useAuth } from "./auth";
import { useIsMobile } from "./useIsMobile";
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
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${t.nestedBorder}`,
        background: t.nestedBg,
        padding: isMobile ? "8px 10px" : "12px 14px",
      }}
    >
      <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: isMobile ? 10 : 11,
          color: t.textMuted,
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function RecordsCard({ user }) {
  const { t } = useTheme();
  const isMobile = useIsMobile();
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

  function exportReport() {
    const esc = (v) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const range =
      from || to
        ? `${from ? formatDate(from) : "start"} – ${to ? formatDate(to) : "today"}`
        : "All dates";

    const rowsHtml = filtered
      .map((r) => {
        const ok = r.delivered === "yes";
        const sig = r.signature
          ? `<img class="sig" src="${esc(r.signature)}" alt="signature" />`
          : "<span class=\"muted\">No signature</span>";
        return `<tr>
          <td class="nowrap">${esc(formatDate(recordDate(r)))}</td>
          <td>${esc(r.address || "—")}</td>
          <td class="nowrap">${esc(r.rxNo || "—")}</td>
          <td class="nowrap"><span class="badge ${ok ? "ok" : "no"}">${ok ? "Delivered" : "Not delivered"}</span></td>
          <td>${sig}</td>
        </tr>`;
      })
      .join("");

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>DelRx — Delivery Signatures (${esc(range)})</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Inter, system-ui, Arial, sans-serif; color: #0f172a; margin: 32px; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { font-size: 20px; margin: 0; }
  .meta { font-size: 12px; color: #475569; text-align: right; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #475569; border-bottom: 1px solid #cbd5e1; padding: 8px 10px; }
  td { font-size: 13px; padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  .nowrap { white-space: nowrap; }
  .muted { color: #94a3b8; }
  .sig { width: 180px; height: 70px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; }
  .badge { display: inline-block; border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 700; }
  .badge.ok { background: #dcfce7; color: #15803d; }
  .badge.no { background: #fee2e2; color: #b91c1c; }
  .print-btn { padding: 8px 16px; font-size: 13px; font-weight: 700; border: none; border-radius: 8px; background: #2563eb; color: #fff; cursor: pointer; }
  @media print { .print-btn { display: none; } body { margin: 0; } }
</style>
</head>
<body>
  <header>
    <div>
      <h1>DelRx — Delivery Signatures</h1>
      <div class="meta" style="text-align:left">${esc(range)} · ${filtered.length} record(s)</div>
    </div>
    <div class="meta">
      Generated ${esc(formatDate(todayISO()))}<br/>
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </header>
  <table>
    <thead>
      <tr><th>Date</th><th>Address</th><th>Rx&nbsp;#</th><th>Status</th><th>Signature</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    } else {
      // Popup blocked — download the report instead.
      const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `delrx-signatures-${todayISO()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: isMobile ? 8 : 10,
          marginBottom: 14,
        }}
      >
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

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: t.textMuted }}>
            {filtered.length} of {records.length}
          </span>
          <button
            type="button"
            onClick={exportReport}
            disabled={!filtered.length}
            style={{
              borderRadius: 10,
              border: "none",
              background: filtered.length ? t.accentGrad : t.subtleBg,
              color: filtered.length ? t.accentText : t.textMuted,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: filtered.length ? "pointer" : "not-allowed",
            }}
          >
            View / Print Signatures
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
      ) : isMobile ? (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map((r) => {
            const ok = r.delivered === "yes";
            return (
              <div
                key={r.id}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${t.nestedBorder}`,
                  background: t.nestedBg,
                  padding: 10,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {r.address || "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: t.textMuted,
                      marginTop: 3,
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{formatDate(recordDate(r))}</span>
                    {r.rxNo ? <span>· Rx {r.rxNo}</span> : null}
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "1px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        border: `1px solid ${ok ? t.successBorder : t.dangerBorder}`,
                        background: ok ? t.successBg : t.dangerBg,
                        color: ok ? t.successText : t.dangerText,
                      }}
                    >
                      {ok ? "Delivered" : "Not delivered"}
                    </span>
                  </div>
                </div>
                {r.signature ? (
                  <img
                    src={r.signature}
                    alt="signature"
                    style={{
                      width: 62,
                      height: 34,
                      objectFit: "contain",
                      background: t.sigPadBg,
                      borderRadius: 6,
                      border: `1px solid ${t.nestedBorder}`,
                      flexShrink: 0,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
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
