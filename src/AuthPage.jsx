import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "./firebase";
import { useTheme } from "./theme";
import RouteRxLogo from "./RouteRxLogo";

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function AuthPage() {
  const { t, mode, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 10,
    border: `1px solid ${t.inputBorder}`,
    background: t.inputBg,
    color: t.text,
    padding: "12px 12px",
    fontSize: 14,
    outline: "none",
    marginBottom: 10,
  };

  async function submit() {
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // AuthProvider's listener flips the app into the signed-in state.
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setError("");
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.pageBg,
        color: t.text,
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={toggleTheme}
        title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          borderRadius: 14,
          border: `1px solid ${t.subtleBorder}`,
          background: t.subtleBg,
          color: t.subtleText,
          padding: "8px 14px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {mode === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>

      <div style={{ width: "100%", maxWidth: 420 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <RouteRxLogo size={40} />
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            RouteRx
          </div>
        </div>

        <div
          style={{
            borderRadius: 24,
            border: `1px solid ${t.cardBorder}`,
            background: t.cardBg,
            boxShadow: t.shadowLg,
            padding: 22,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
            {isLogin ? "Welcome back" : "Create your account"}
          </div>
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 18 }}>
            {isLogin
              ? "Sign in to plan routes and capture deliveries."
              : "Sign up to start planning routes and capturing deliveries."}
          </div>

          <button
            type="button"
            onClick={googleSignIn}
            disabled={busy}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderRadius: 12,
              border: `1px solid ${t.inputBorder}`,
              background: t.inputBg,
              color: t.text,
              padding: "12px 12px",
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? "default" : "pointer",
              marginBottom: 16,
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "0 0 16px",
              color: t.textMuted,
              fontSize: 11,
            }}
          >
            <span style={{ flex: 1, height: 1, background: t.cardBorder }} />
            or with email
            <span style={{ flex: 1, height: 1, background: t.cardBorder }} />
          </div>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={inputStyle}
          />

          {error ? (
            <div
              style={{ fontSize: 12, color: t.dangerText, margin: "4px 0 10px" }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={busy}
            style={{
              width: "100%",
              borderRadius: 22,
              border: "none",
              background: busy ? t.subtleBg : t.accentGrad,
              color: busy ? t.textMuted : t.accentText,
              padding: "14px 18px",
              fontSize: 15,
              fontWeight: 800,
              cursor: busy ? "default" : "pointer",
            }}
          >
            {busy ? "Please wait…" : isLogin ? "Sign In" : "Sign Up"}
          </button>

          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: t.textMuted,
              marginTop: 16,
            }}
          >
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setError("");
                setIsLogin((v) => !v);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: t.cyanText,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
