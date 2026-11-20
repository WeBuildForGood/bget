import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@/components/analytics/analytics";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  generator: "Next.js",
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.founder }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "community",
  // Canonicals and hreflang are set per-route via pageMetadata() in lib/site.ts.
  // Do not set them here to avoid making every page canonical to "/".

  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    locale: SITE.locale,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#07060a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const organizationLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      "alternateName": SITE.tagline,
      url: SITE.url,
      logo: `${SITE.url}/icon.svg`,
      description: SITE.description,
      slogan: SITE.tagline,
      founder: {
        "@type": "Person",
        name: SITE.founder,
      },
      sameAs: [SITE.github],
      contactPoint: {
        "@type": "ContactPoint",
        email: SITE.email,
        url: SITE.url,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      publisher: { "@id": `${SITE.url}/#organization` },
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload hero poster for LCP on landing */}
        <link rel="preload" as="image" href="/images/hero-poster.webp" fetchPriority="high" />
        <meta name="linkedin:owner" content="Nikhil Nagpure" />
        <meta name="linkedin:owner:type" content="Person" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2">
          Skip to content
        </a>
        <ScrollProgress />
        {children}
        <JsonLd data={organizationLd} />
        <Analytics />
      </body>
    </html>
  );
}
