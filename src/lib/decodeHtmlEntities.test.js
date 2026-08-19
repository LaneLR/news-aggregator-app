import { describe, expect, it } from "vitest";
import { decodeHtmlEntities } from "./decodeHtmlEntities";

describe("decodeHtmlEntities", () => {
  it("decodes a decimal numeric entity (the reported PlayStation&#8217;s bug)", () => {
    expect(decodeHtmlEntities("PlayStation&#8217;s wireless speakers")).toBe(
      "PlayStation’s wireless speakers"
    );
  });

  it("decodes a hex numeric entity", () => {
    expect(decodeHtmlEntities("PlayStation&#x2019;s")).toBe("PlayStation’s");
  });

  it("decodes common named entities", () => {
    expect(decodeHtmlEntities("AT&amp;T &amp; Verizon")).toBe("AT&T & Verizon");
    expect(decodeHtmlEntities("&quot;quoted&quot;")).toBe('"quoted"');
    expect(decodeHtmlEntities("rock &amp;#38; roll")).toBe("rock &#38; roll");
    expect(decodeHtmlEntities("caf&eacute;")).toBe("caf&eacute;"); // not in the table — left as-is, not mangled
    expect(decodeHtmlEntities("wait&hellip;")).toBe("wait…");
    expect(decodeHtmlEntities("2019&ndash;2026 &mdash; a range")).toBe("2019–2026 — a range");
  });

  it("decodes multiple entities in the same string", () => {
    expect(decodeHtmlEntities("&lsquo;Hello&rsquo; &amp; &ldquo;World&rdquo;")).toBe(
      "‘Hello’ & “World”"
    );
  });

  it("leaves plain text with no entities untouched", () => {
    expect(decodeHtmlEntities("Just a normal headline")).toBe("Just a normal headline");
  });

  it("leaves an unrecognized entity name untouched rather than dropping it", () => {
    expect(decodeHtmlEntities("&foobar;")).toBe("&foobar;");
  });

  it("leaves an out-of-range or malformed numeric entity untouched", () => {
    expect(decodeHtmlEntities("&#99999999;")).toBe("&#99999999;");
  });

  it("passes through non-string input unchanged", () => {
    expect(decodeHtmlEntities(null)).toBeNull();
    expect(decodeHtmlEntities(undefined)).toBeUndefined();
    expect(decodeHtmlEntities(42)).toBe(42);
  });

  it("short-circuits on a string with no ampersand at all", () => {
    expect(decodeHtmlEntities("")).toBe("");
  });
});
