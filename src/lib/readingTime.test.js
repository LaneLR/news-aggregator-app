import { describe, expect, it } from "vitest";
import { estimateReadingTime } from "./readingTime";

describe("estimateReadingTime", () => {
  it("returns null for falsy input", () => {
    expect(estimateReadingTime(null)).toBeNull();
    expect(estimateReadingTime("")).toBeNull();
    expect(estimateReadingTime(undefined)).toBeNull();
  });

  it("returns null when the html strips down to no text", () => {
    expect(estimateReadingTime("<img src='x.png' /><br/>")).toBeNull();
  });

  it("estimates a rounded-up minute count from plain word count", () => {
    const words = new Array(450).fill("word").join(" ");
    expect(estimateReadingTime(`<p>${words}</p>`)).toBe(2);
  });

  it("returns a minimum of 1 minute for short content", () => {
    expect(estimateReadingTime("<p>Just a few words here.</p>")).toBe(1);
  });

  it("strips tags before counting words", () => {
    const html = "<p>one</p><p>two</p><p>three</p>";
    expect(estimateReadingTime(html)).toBe(1);
  });
});
