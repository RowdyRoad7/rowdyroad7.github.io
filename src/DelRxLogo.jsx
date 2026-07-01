import React from "react";

/**
 * DelRx brand mark — a rounded badge holding an "Rx" glyph over a
 * signature stroke, using the app's cyan→blue accent gradient.
 */
export default function DelRxLogo({ size = 22 }) {
  const gid = "delrx-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="DelRx"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${gid})`} />
      {/* Rx glyph */}
      <path
        d="M10 9h4.4c2 0 3.4 1.3 3.4 3.2 0 1.7-1.1 2.9-2.8 3.1L18.6 19M11.6 9v10.5"
        stroke="#ffffff"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.4 16.6l4.6 4.6M22 16.6l-4.6 4.6"
        stroke="#ffffff"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      {/* Signature stroke */}
      <path
        d="M8 24.5c2-1.6 3-1.6 4 0s2 1.6 4 0 3-1.6 4 0 2 1.2 4 0"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
