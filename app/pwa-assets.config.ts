// Icons generated from public/logo.svg at build (pwa → icons-and-assets). Replace the logo via /icons.
import { defineConfig, minimal2023Preset as preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...preset,
    // + 96 px: the icon of every manifest shortcut (pwa → pwa §2).
    transparent: { ...preset.transparent, sizes: [64, 96, 192, 512] },
    // Cream, the wizard's own background (Moni 2026-11-22: "Кремав" for the install icon; brand/README.md).
    apple: { ...preset.apple, resizeOptions: { background: "#F3E9CF", fit: "contain" } },
    maskable: { ...preset.maskable, resizeOptions: { background: "#F3E9CF", fit: "contain" } },
  },
  images: ["public/logo.svg"],
});
