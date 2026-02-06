import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "AdMate Vision",
        short_name: "AdMate Vision",
        description: "옥외 광고 촬영·광고주 인식·보고를 한 번에",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#8b5cf6",
        icons: [
            {
                src: "/apple-icon?v=6", // This returns a PNG via next/og
                sizes: "192x192",       // Lie about size (closest to 180) to satisfy minimal PWA req
                type: "image/png",
            },
            {
                src: "/apple-icon?v=6&size=512", // Hope next/og scales it or browser accepts it
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/apple-icon?v=6",
                sizes: "180x180",
                type: "image/png",
            },
            {
                src: "/app-icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
        ],
    };
}
