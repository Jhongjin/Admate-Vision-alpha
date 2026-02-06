import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ffffff",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="avGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          {/* Lens circle (aperture) */}
          <circle cx="16" cy="16" r="11" fill="url(#avGrad)" />
          <circle cx="16" cy="16" r="4" fill="#ffffff" />
          {/* AV letters */}
          <text
            x="16"
            y="18"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="url(#avGrad)"
            style={{
              fontFamily: "system-ui, sans-serif",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: -0.8,
            }}
          >
            AV
          </text>
        </svg>
      </div>
    ),
    { ...size }
  );
}
