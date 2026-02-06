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
                    backgroundColor: "#0f172a", // Slate-900: Deep Navy/Black
                    borderRadius: "0px", // Let OS handle rounding
                }}
            >
                <div
                    style={{
                        width: "120px",
                        height: "120px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", // Indigo to Purple subtle gradient for the shape only
                        borderRadius: "30px", // Soft rounded square inside
                        color: "white",
                        fontSize: "72px",
                        fontWeight: 800,
                        fontFamily: "sans-serif",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
                    }}
                >
                    A
                </div>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
