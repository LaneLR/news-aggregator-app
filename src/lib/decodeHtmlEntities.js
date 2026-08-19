// Some RSS sources ship titles with their apostrophes/dashes/quotes already
// HTML-entity-encoded in the feed XML itself (e.g. "PlayStation&#8217;s") —
// rss-parser decodes the XML's own escaping (turning "&amp;#8217;" back into
// "&#8217;") but has no way to know that string ALSO happens to contain an
// entity of its own; it's just text as far as XML parsing is concerned. React
// then renders that text exactly as given — unlike a browser parsing raw
// HTML, `{someString}` in JSX is never re-interpreted as markup, entities
// included, so "&#8217;" shows up on screen as those seven literal
// characters instead of a right single quote. This decodes that second,
// data-level layer of encoding server- and client-side alike (no `document`
// dependency, so it works the same during SSR), for values that were always
// meant to be plain text — never pass a string through here that's actually
// going to be rendered as HTML, since decoding "&lt;script&gt;" back into
// "<script>" would defeat whatever escaped it in the first place.
const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  trade: "™",
  copy: "©",
  reg: "®",
  deg: "°",
  times: "×",
  divide: "÷",
};

const ENTITY_PATTERN = /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g;

export function decodeHtmlEntities(text) {
  if (typeof text !== "string" || !text.includes("&")) return text;

  return text.replace(ENTITY_PATTERN, (match, entity) => {
    if (entity[0] === "#") {
      const isHex = entity[1] === "x" || entity[1] === "X";
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      // 0x10FFFF is the same upper bound String.fromCodePoint itself
      // enforces (it throws RangeError past that) — checking here means
      // every code path below only ever calls it with a value it accepts.
      if (Number.isNaN(code) || code < 0 || code > 0x10ffff) return match;
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
}
