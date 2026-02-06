import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ size: string }> }
) {
    const sizeParam = (await params).size; // Awaiting params as per Next.js 15+ rules (safe for older too if awaited)
    const sizeInt = parseInt(sizeParam, 10) || 192;
    const size = { width: sizeInt, height: sizeInt };

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // Pink/Purple to Blue Gradient
                    background: "linear-gradient(135deg, #d946ef 0%, #8b5cf6 50%, #3b82f6 100%)",
                    borderRadius: "0px",
                }}
            >
                <div
                    style={{
                        width: `${sizeInt * 0.66}px`, // Responsive inner box size
                        height: `${sizeInt * 0.66}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        borderRadius: `${sizeInt * 0.17}px`,
                        border: `${Math.max(2, sizeInt * 0.02)}px solid rgba(255, 255, 255, 0.4)`,
                        color: "white",
                        fontSize: `${sizeInt * 0.4}px`,
                        fontWeight: 600,
                        fontFamily: "sans-serif",
                        boxShadow: `0 ${sizeInt * 0.04}px ${sizeInt * 0.16}px 0 rgba(31, 38, 135, 0.37)`
                    }}
                >
                    A
                </div>
            </div>
        ),
        {
            ...size,
            headers: {
                "Content-Type": "image/png",
            },
        }
    );
}
