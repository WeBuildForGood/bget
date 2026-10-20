/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export -> `out/`, deployed to Cloudflare Workers as static assets
  // (see wrangler.toml). The `main` worker script (worker/index.js) serves the
  // export through the ASSETS binding and handles the /api/* form endpoints.
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  // Production hardening. All of these are compatible with `output: 'export'`
  // (nothing here requires a Node server at request time).
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    // Static export can't run the Next image optimizer, so we ship pre-built
    // WebP variants from `/public/images` and reference them directly.
    unoptimized: true,
  },
}

export default nextConfig
