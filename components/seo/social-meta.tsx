import { SITE } from "@/lib/site";

/**
 * Creates a reusable SEO meta tag component for Open Graph and Twitter Cards.
 * 
 * @param {Object} pageData - Page metadata including title, description, path, type, etc.
 * @param {string} [imageUrl] - Optional image URL for Open Graph and Twitter cards.
 * @param {string} [twitterAppId] - Optional Facebook app ID.
 */
export function SocialMeta({ pageData, imageUrl, twitterAppId }: {
  pageData: {
    title: string;
    description: string;
    path: string;
    type?: "website" | "article";
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
  };
  imageUrl?: string;
  twitterAppId?: string;
}) {
  const {
    title,
    description,
    path,
    type = "website",
    author,
    publishedTime,
    modifiedTime,
  } = pageData;

  return (
    <>
      {/* Open Graph */}
      <meta
        property="og:title"
        content={title}
      />
      <meta
        property="og:description"
        content={description}
      />
      <meta
        property="og:image"
        content={imageUrl}
      />
      <meta
        property="og:image:width"
        content={imageUrl ? "1200" : undefined}
      />
      <meta
        property="og:image:height"
        content={imageUrl ? "630" : undefined}
      />
      <meta
        property="og:type"
        content={type}
      />
      <meta
        property="og:url"
        content={path}
      />
      <meta
        property="og:site_name"
        content={SITE.name}
      />
      <meta
        property="article:author"
        content={author || undefined}
      />
      <meta
        property="article:published_time"
        content={publishedTime || undefined}
      />
      <meta
        property="article:modified_time"
        content={modifiedTime || undefined}
      />

      {/* LinkedIn */}
      <meta
        name="linkedin:owner"
        content={SITE.founder}
      />
      <meta
        name="linkedin:owner:type"
        content="person"
      />

      {/* Pinterest */}
      <meta
        name="pin:media"
        content={imageUrl || "/og.png"}
      />
      <meta
        name="pin:url"
        content={path || "/"}
      />
      <meta
        name="pin:description"
        content={title}
      />

      {/* Twitter Card */}
      <meta
        name="twitter:card"
        content="summary_large_image"
      />
      <meta
        name="twitter:title"
        content={title}
      />
      <meta
        name="twitter:description"
        content={description}
      />
      <meta
        name="twitter:image"
        content={imageUrl}
      />
      <meta
        name="twitter:image:alt"
        content={title}
      />
      {twitterAppId && (
        <meta
          name="facebook:app_id"
          content={twitterAppId}
        />
      )}
    </>
  );
};
