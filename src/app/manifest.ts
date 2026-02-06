import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "AdMate Vision",
        short_name: "AdMate",
        description: "옥외 광고 촬영·광고주 인식·보고를 한 번에",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#8b5cf6", // Purple to match the icon
        icons: [
            {
                src: "/favicon.ico",
                sizes: "any",
                type: "image/x-icon",
            },
            {
                src: "/icon",
                sizes: "32x32",
                type: "image/png",
            },
            {
                src: "/apple-icon?v=3", // Bump version again
                sizes: "180x180",
                type: "image/png",
            },
        ],
    };
}
