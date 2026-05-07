/**
 * JsonLd — renders a <script type="application/ld+json"> tag.
 * Pass in a plain JS object; it will be JSON.stringified safely.
 */
export default function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
