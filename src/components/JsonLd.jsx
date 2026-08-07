// Renders a JSON-LD structured data block. Article/archive data ultimately
// traces back to external RSS feeds (untrusted input), so the serialized
// output is escaped before injection — `<` can't survive as-is or a title
// like `</script><script>...` would break out of the tag.
export default function JsonLd({ data }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
