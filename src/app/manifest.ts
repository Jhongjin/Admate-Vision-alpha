import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "AdMate Vision",
        short_name: "AdMate Vision",
        description: "옥외 광고 촬영·광고주 인식·보고를 한 번에",
        start_url: "/?source=pwa_fixed_v2",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#8b5cf6",
        icons: [
            {
                src: "/app-icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
            {
                src: "/apple-icon?v=5",
                sizes: "180x180",
                type: "image/png",
            },
            {
                src: "/favicon.ico",
                sizes: "any",
                type: "image/x-icon",
            },
        ],
    };
}
