import React, { useCallback, useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import { useTheme } from "./theme";

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function SignCanvas({ index, registerPad }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgba(255,255,255,0)",
      penColor: "#0f172a",
    });
    registerPad(index, pad);

    function resize() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const { width } = canvas.getBoundingClientRect();
      canvas.width = width * ratio;
      canvas.height = 160 * ratio;
      canvas.getContext("2d").scale(ratio, ratio);
      pad.clear();
    }

    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      pad.off();
      registerPad(index, null);
    };
  }, [index, registerPad]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: 160,
        display: "block",
        cursor: "crosshair",
        touchAction: "none",
      }}
    />
  );
}

export default function SignatureModal({ stop, onClose, onSaved }) {
  const { t } = useTheme();
  const orderCount = Math.max(1, Number(stop?.orders) || 1);

  const [rxNos, setRxNos] = useState(() => Array(orderCount).fill(""));
  const [date] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const padsRef = useRef({});
  const address = stop?.label || "";

  const registerPad = useCallback((i, pad) => {
    if (pad) padsRef.current[i] = pad;
    else delete padsRef.current[i];
  }, []);

  function setRxNo(i, value) {
    setRxNos((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }

  function clearPad(i) {
    padsRef.current[i]?.clear();
  }

  async function handleSave() {
    setError("");

    for (let i = 0; i < orderCount; i++) {
      const pad = padsRef.current[i];
      if (!pad || pad.isEmpty()) {
        setError(
          orderCount > 1
            ? `Please capture a signature for order ${i + 1}.`
            : "Please capture a signature before saving.",
        );
        return;
      }
    }

    try {
      setSaving(true);
      await Promise.all(
        Array.from({ length: orderCount }, (_, i) =>
          addDoc(collection(db, "deliveries"), {
            date,
            rxNo: (rxNos[i] || "").trim(),
            address,
            delivered: "yes",
            signature: padsRef.current[i].toDataURL(),
            stopId: stop?.id || "",
            orderIndex: i + 1,
            orderCount,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid || "",
            createdByEmail: auth.currentUser?.email || "",
          }),
        ),
      );
      onSaved?.();
    } catch (err) {
      setError(err.message || "Failed to save delivery record.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 10,
    border: `1px solid ${t.inputBorder}`,
    background: t.inputBg,
    color: t.text,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: t.overlay,
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose?.();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          maxHeight: "88vh",
          overflowY: "auto",
          borderRadius: 24,
          border: `1px solid ${t.cardBorder}`,
          background: t.modalBg,
          padding: 18,
          color: t.text,
          fontFamily: "Inter, system-ui, sans-serif",
          boxShadow: t.shadowLg,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              Delivery Sign-off
            </div>
            {orderCount > 1 ? (
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                {orderCount} orders at this stop — one signature each
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose?.()}
            style={{
              border: "none",
              background: "transparent",
              color: t.textMuted,
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${t.successBorder}`,
            background: t.successBg,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, color: t.successText, marginBottom: 4 }}>
            Delivery address
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{address}</div>
        </div>

        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: t.textMuted }}>Date: {date}</span>
        </div>

        {Array.from({ length: orderCount }, (_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 16,
              border: `1px solid ${t.nestedBorder}`,
              background: t.nestedBg,
              padding: 12,
              marginTop: 12,
            }}
          >
            {orderCount > 1 ? (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: t.cyanText,
                  marginBottom: 10,
                }}
              >
                Order {i + 1} of {orderCount}
              </div>
            ) : null}

            <label
              style={{
                display: "block",
                fontSize: 11,
                color: t.textMuted,
                marginBottom: 4,
              }}
            >
              Rx Number
            </label>
            <input
              type="text"
              value={rxNos[i]}
              onChange={(e) => setRxNo(i, e.target.value)}
              placeholder="Enter Rx Number"
              style={{ ...inputStyle, marginBottom: 12 }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <label style={{ fontSize: 11, color: t.textMuted }}>
                Recipient signature
              </label>
              <button
                type="button"
                onClick={() => clearPad(i)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: t.dangerText,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
            <div
              style={{
                borderRadius: 12,
                border: `1px solid ${t.inputBorder}`,
                background: t.sigPadBg,
                overflow: "hidden",
              }}
            >
              <SignCanvas index={i} registerPad={registerPad} />
            </div>
          </div>
        ))}

        {error ? (
          <div style={{ fontSize: 12, color: t.dangerText, marginTop: 12 }}>
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            marginTop: 14,
            borderRadius: 22,
            border: "none",
            background: saving ? t.subtleBg : t.accentGrad,
            color: saving ? t.textMuted : t.accentText,
            padding: "15px 18px",
            fontSize: 15,
            fontWeight: 800,
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving
            ? "Saving…"
            : orderCount > 1
              ? `Save ${orderCount} Signatures & Mark Delivered`
              : "Save & Mark Delivered"}
        </button>
      </div>
    </div>
  );
}
