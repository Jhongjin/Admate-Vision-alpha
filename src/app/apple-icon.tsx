import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
    width: 180,
    height: 180,
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
                    backgroundImage: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)", // Indigo to Cyan gradient bg
                    borderRadius: "36px", // Rounded corners for aesthetics on other platforms (iOS clips it anyway)
                }}
            >
                <svg
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* White logo for contrast against gradient background */}
                    <path
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                        stroke="white"
                        strokeWidth="1.5"
                        opacity="0.3"
                    />
                    <path
                        d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z"
                        stroke="white"
                        strokeWidth="1.5"
                    />

                    <circle cx="12" cy="12" r="2.5" fill="white" />

                    {/* Abstract A */}
                    <path
                        d="M4 19L9.5 5L15 19"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M7 13H12"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
