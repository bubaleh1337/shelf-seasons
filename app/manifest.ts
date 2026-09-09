import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shelf Seasons — Reading Journal",
    short_name: "Shelf Seasons",
    description: "A cozy multilingual reading journal and visual book tracker.",
    start_url: "/ru/app",
    display: "standalone",
    background_color: "#F6F1E8",
    theme_color: "#263D32",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
