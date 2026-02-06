import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "AdMate Vision",
        short_name: "AdMate Vision",
        description: "옥외 광고 촬영·광고주 인식·보고를 한 번에",
        start_url: "/?source=pwa_api",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#8b5cf6",
        icons: [
            {
                src: "/api/icons/192",
                sizes: "192x192",
                type: "image/png",
                purpose: "any"
            },
            {
                src: "/api/icons/512",
                sizes: "512x512",
                type: "image/png",
                purpose: "any"
            },
            {
                src: "/apple-icon?v=7",
                sizes: "180x180",
                type: "image/png",
            },
        ],
    };
}
