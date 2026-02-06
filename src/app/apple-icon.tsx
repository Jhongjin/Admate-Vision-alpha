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
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // Pink/Purple to Blue Gradient (Match user's screenshot memory)
                    background: "linear-gradient(135deg, #d946ef 0%, #8b5cf6 50%, #3b82f6 100%)",
                    borderRadius: "0px", // OS handles clipping
                }}
            >
                {/* Inner white container effect */}
                <div
                    style={{
                        width: "120px",
                        height: "120px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.2)", // Semi-transparent white box
                        borderRadius: "32px",
                        border: "4px solid rgba(255, 255, 255, 0.4)",
                        color: "white",
                        fontSize: "72px",
                        fontWeight: 600,
                        fontFamily: "sans-serif",
                        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
                    }}
                >
                    A
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
