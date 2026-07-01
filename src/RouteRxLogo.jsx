import React from "react";

/**
 * RouteRx brand mark — a routed path with waypoint dots ending in a
 * map pin, on the app's cyan→blue accent gradient badge.
 */
export default function RouteRxLogo({ size = 22 }) {
  const gid = "routerx-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RouteRx"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${gid})`} />
      {/* Dotted route from the start node up toward the pin */}
      <path
        d="M9 23c5 0 4.5-8 10.5-9.5"
        stroke="#ffffff"
        strokeOpacity="0.9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0.2 4.2"
        fill="none"
      />
      {/* Start node */}
      <circle cx="9" cy="23" r="2.6" fill="#ffffff" />
      {/* Destination pin */}
      <path
        d="M21 7c2.8 0 5 2.2 5 5 0 3.6-5 8-5 8s-5-4.4-5-8c0-2.8 2.2-5 5-5z"
        fill="#ffffff"
      />
      <circle cx="21" cy="12" r="2" fill={`url(#${gid})`} />
    </svg>
  );
}
