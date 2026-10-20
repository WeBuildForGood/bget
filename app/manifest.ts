import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Required for `output: "export"` — emit a static manifest.webmanifest.
export const dynamic = "force-static";

/**
 * Web app manifest. Colors match the dark theme tokens in `app/globals.css`
 * (--background: #07060a) so the install splash blends into the site.
 *
 * `id` and `scope` pin the installed app to the canonical origin so it is not
 * treated as a distinct app if the start URL ever gains query params; `lang`,
 * `dir`, `categories` and `orientation` complete the install metadata.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    lang: "en",
    dir: "ltr",
    orientation: "any",
    categories: ["community", "social", "education", "productivity"],
    display: "standalone",
    background_color: "#07060a",
    theme_color: "#07060a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
