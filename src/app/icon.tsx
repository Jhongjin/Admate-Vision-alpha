import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          borderRadius: "6px", // Rounded square
        }}
      >
        {/* Logo Container */}
        <div
          style={{
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4f46e5" /> {/* Indigo */}
                <stop offset="1" stopColor="#06b6d4" /> {/* Cyan */}
              </linearGradient>
            </defs>

            {/* Shutter / Lens Aperture Circles */}
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="url(#logo-gradient)"
              strokeWidth="2"
              opacity="0.2"
            />
            <path
              d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z"
              stroke="url(#logo-gradient)"
              strokeWidth="2"
            />

            {/* Central Eye / Lens */}
            <circle cx="12" cy="12" r="2.5" fill="url(#logo-gradient)" />

            {/* Stylized 'A' / Vision Cut */}
            {/* An abstract shape cutting through resembling A/V */}
            <path
              d="M4 19L9.5 5L15 19"
              stroke="url(#logo-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 13H12"
              stroke="url(#logo-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
